// Standalone Agent Service entrypoint
// Runs as an independent microservice for horizontal scaling

import http from 'http';
import { orchestrator } from '../server/agents/orchestrator';
import type { AgentType } from '../server/agents/orchestrator';

const PORT = Number(process.env.PORT) || 3001;

interface AgentRequest {
  agentType: AgentType;
  task: string;
}

interface WorkflowRequest {
  workflow: 'design-to-code' | 'custom';
  task: string;
  steps?: Array<{ agentType: AgentType; task: string }>;
}

function parseBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'agent-service', uptime: process.uptime() }));
    return;
  }

  // Execute single agent
  if (url.pathname === '/api/agent/execute' && req.method === 'POST') {
    try {
      const body = JSON.parse(await parseBody(req)) as AgentRequest;
      const result = await orchestrator.executeAgent(body.agentType, body.task);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Bad request' }));
    }
    return;
  }

  // Execute workflow
  if (url.pathname === '/api/agent/workflow' && req.method === 'POST') {
    try {
      const body = JSON.parse(await parseBody(req)) as WorkflowRequest;
      if (body.workflow === 'design-to-code') {
        const result = await orchestrator.executeDesignToCodeWorkflow(body.task);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } else if (body.steps) {
        const result = await orchestrator.executeWorkflow(body.steps);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } else {
        throw new Error('Custom workflow requires steps');
      }
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Bad request' }));
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Agent Service running on port ${PORT}`);
});
