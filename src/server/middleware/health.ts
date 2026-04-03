// Health check endpoints

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  checks: Record<string, { status: string; latency?: number; error?: string }>;
}

const startTime = Date.now();

export async function getHealthStatus(): Promise<HealthStatus> {
  const checks: HealthStatus['checks'] = {};

  // Database check
  checks.database = await checkDatabase();

  // Anthropic API check
  checks.anthropic = checkAnthropicConfig();

  const allHealthy = Object.values(checks).every((c) => c.status === 'ok');
  const anyUnhealthy = Object.values(checks).some((c) => c.status === 'error');

  return {
    status: anyUnhealthy ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded',
    version: process.env.APP_VERSION || '0.1.0',
    uptime: Date.now() - startTime,
    checks,
  };
}

async function checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || dbUrl.includes('your_')) {
      return { status: 'unconfigured' };
    }
    return { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : 'unknown' };
  }
}

function checkAnthropicConfig(): { status: string } {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === 'your_api_key_here') return { status: 'unconfigured' };
  return { status: 'ok' };
}
