import { NextResponse } from 'next/server';
import { getHealthStatus } from '@/server/middleware/health';

export async function GET() {
  const health = await getHealthStatus();
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
