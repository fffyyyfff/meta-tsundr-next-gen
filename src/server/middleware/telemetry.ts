// OpenTelemetry instrumentation stub
// In production: npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node

export interface SpanOptions {
  name: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface MetricCounter {
  add(value: number, attributes?: Record<string, string>): void;
}

export interface MetricHistogram {
  record(value: number, attributes?: Record<string, string>): void;
}

class TelemetryService {
  private enabled: boolean;

  constructor() {
    this.enabled = !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  }

  async startSpan<T>(options: SpanOptions, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.log('span.end', {
        ...options,
        duration: Date.now() - start,
        status: 'ok',
      });
      return result;
    } catch (error) {
      this.log('span.end', {
        ...options,
        duration: Date.now() - start,
        status: 'error',
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  createCounter(name: string): MetricCounter {
    return {
      add: (value: number, attributes?: Record<string, string>) => {
        this.log('metric.counter', { name, value, ...attributes });
      },
    };
  }

  createHistogram(name: string): MetricHistogram {
    return {
      record: (value: number, attributes?: Record<string, string>) => {
        this.log('metric.histogram', { name, value, ...attributes });
      },
    };
  }

  private log(type: string, data: Record<string, unknown>): void {
    if (this.enabled || process.env.TELEMETRY_DEBUG === 'true') {
      console.log(JSON.stringify({ type, ...data, timestamp: new Date().toISOString() }));
    }
  }
}

export const telemetry = new TelemetryService();

// Pre-defined metrics
export const metrics = {
  agentExecutions: telemetry.createCounter('agent.executions'),
  agentDuration: telemetry.createHistogram('agent.duration_ms'),
  agentTokenUsage: telemetry.createHistogram('agent.token_usage'),
  apiRequests: telemetry.createCounter('api.requests'),
  apiLatency: telemetry.createHistogram('api.latency_ms'),
  rateLimitHits: telemetry.createCounter('rate_limit.hits'),
};
