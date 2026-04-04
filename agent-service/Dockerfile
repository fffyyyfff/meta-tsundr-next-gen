FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --no-cache-dir .

# Copy proto and generate Python stubs
COPY proto/ ./proto/
RUN mkdir -p generated && \
    python -m grpc_tools.protoc \
      -I./proto \
      --python_out=./generated \
      --grpc_python_out=./generated \
      ./proto/tsundoku/agent/v1/agent.proto

COPY src/ ./src/

ENV PYTHONPATH="/app/src:/app/generated"
ENV GRPC_PORT=50052

EXPOSE 50052

CMD ["python", "src/server.py"]
