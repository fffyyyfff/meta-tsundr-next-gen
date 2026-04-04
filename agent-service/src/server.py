"""gRPC Agent Service server."""

import logging
import os
import signal
import sys
import time
from concurrent import futures
from pathlib import Path

import grpc
from grpc_health.v1 import health, health_pb2, health_pb2_grpc
from grpc_reflection.v1alpha import reflection

# Add generated proto path
sys.path.insert(0, str(Path(__file__).parent.parent / "generated"))

import agent_pb2 as pb2  # noqa: E402
import agent_pb2_grpc as pb2_grpc  # noqa: E402

from agents.book_recommend import BookRecommendAgent  # noqa: E402
from agents.book_review import BookReviewAgent  # noqa: E402

logging.basicConfig(
    level=getattr(logging, os.environ.get("LOG_LEVEL", "INFO").upper()),
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


class AgentServiceServicer(pb2_grpc.AgentServiceServicer):
    """gRPC AgentService implementation."""

    def __init__(self) -> None:
        self._agents = {
            pb2.AGENT_TYPE_BOOK_RECOMMEND: BookRecommendAgent(),
            pb2.AGENT_TYPE_BOOK_REVIEW: BookReviewAgent(),
        }

    def ExecuteAgent(
        self,
        request: pb2.ExecuteAgentRequest,
        context: grpc.ServicerContext,
    ) -> pb2.ExecuteAgentResponse:
        agent_type = request.agent_type
        logger.info("ExecuteAgent: type=%s user=%s", agent_type, request.user_id)

        agent = self._agents.get(agent_type)
        if agent is None:
            return pb2.ExecuteAgentResponse(
                success=False,
                error=f"Unknown agent type: {agent_type}",
            )

        start = time.monotonic()
        params = dict(request.context) if request.context else None
        result = agent.execute(request.prompt, params)
        duration_ms = int((time.monotonic() - start) * 1000)

        logger.info(
            "ExecuteAgent completed: type=%s success=%s duration=%dms",
            agent_type,
            result["success"],
            duration_ms,
        )

        return pb2.ExecuteAgentResponse(
            success=result["success"],
            result=result.get("result", ""),
            error=result.get("error", ""),
            input_tokens=result.get("input_tokens", 0),
            output_tokens=result.get("output_tokens", 0),
        )


def serve() -> None:
    port = os.environ.get("GRPC_PORT", "50052")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    # Register agent service
    pb2_grpc.add_AgentServiceServicer_to_server(AgentServiceServicer(), server)

    # Register health service
    health_servicer = health.HealthServicer()
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)
    health_servicer.set("", health_pb2.HealthCheckResponse.SERVING)
    health_servicer.set(
        "tsundoku.agent.v1.AgentService",
        health_pb2.HealthCheckResponse.SERVING,
    )

    # Register reflection
    service_names = (
        pb2.DESCRIPTOR.services_by_name["AgentService"].full_name,
        health_pb2.DESCRIPTOR.services_by_name["Health"].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(service_names, server)

    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logger.info("Agent service started on port %s", port)

    # Graceful shutdown
    def _shutdown(signum: int, frame: object) -> None:
        logger.info("Shutting down (signal %d)...", signum)
        health_servicer.set("", health_pb2.HealthCheckResponse.NOT_SERVING)
        server.stop(grace=5)

    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)

    server.wait_for_termination()


if __name__ == "__main__":
    serve()
