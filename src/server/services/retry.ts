export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  backoffMultiplier: number;
  retryableErrors: number[];
}

const defaultOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  retryableErrors: [429, 500, 503],
};

export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>,
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const statusCode = getStatusCode(error);
      const isRetryable = statusCode !== null && opts.retryableErrors.includes(statusCode);

      if (!isRetryable || attempt === opts.maxRetries) {
        throw error;
      }

      const delay = opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt);
      console.log(
        `[retry] Attempt ${attempt + 1}/${opts.maxRetries} failed (status: ${statusCode}). Retrying in ${delay}ms...`,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

function getStatusCode(error: unknown): number | null {
  if (error instanceof RetryableError) {
    return error.statusCode;
  }
  if (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as Record<string, unknown>).status === 'number'
  ) {
    return (error as Record<string, number>).status;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
