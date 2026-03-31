import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, RetryableError } from '@/server/services/retry';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should retry on RetryableError with matching status', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new RetryableError('rate limited', 429))
      .mockResolvedValue('ok');

    const promise = withRetry(fn, { maxRetries: 3, initialDelay: 10, backoffMultiplier: 1 });
    await vi.advanceTimersByTimeAsync(10);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on error with status property', async () => {
    const error = Object.assign(new Error('server error'), { status: 500 });
    const fn = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('recovered');

    const promise = withRetry(fn, { maxRetries: 2, initialDelay: 10, backoffMultiplier: 1 });
    await vi.advanceTimersByTimeAsync(10);
    const result = await promise;

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw immediately for non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('bad request'));
    await expect(withRetry(fn)).rejects.toThrow('bad request');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should throw immediately for non-retryable status codes', async () => {
    const fn = vi.fn().mockRejectedValue(new RetryableError('not found', 404));
    await expect(withRetry(fn)).rejects.toThrow('not found');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should throw after exhausting max retries', async () => {
    vi.useRealTimers();
    const fn = vi.fn().mockRejectedValue(new RetryableError('overloaded', 503));

    await expect(
      withRetry(fn, { maxRetries: 2, initialDelay: 1, backoffMultiplier: 1 }),
    ).rejects.toThrow('overloaded');
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('should apply exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new RetryableError('err', 429))
      .mockRejectedValueOnce(new RetryableError('err', 429))
      .mockResolvedValue('ok');

    const promise = withRetry(fn, { maxRetries: 3, initialDelay: 100, backoffMultiplier: 2 });

    // First retry: 100ms * 2^0 = 100ms
    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(2);

    // Second retry: 100ms * 2^1 = 200ms
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should use custom retryableErrors', async () => {
    const fn = vi.fn().mockRejectedValue(new RetryableError('custom', 418));
    await expect(
      withRetry(fn, { retryableErrors: [418], maxRetries: 0 }),
    ).rejects.toThrow('custom');
  });

  it('should log retry attempts', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fn = vi.fn()
      .mockRejectedValueOnce(new RetryableError('err', 429))
      .mockResolvedValue('ok');

    const promise = withRetry(fn, { maxRetries: 2, initialDelay: 10, backoffMultiplier: 1 });
    await vi.advanceTimersByTimeAsync(10);
    await promise;

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[retry] Attempt 1/2 failed'),
    );
    consoleSpy.mockRestore();
  });
});

describe('RetryableError', () => {
  it('should have statusCode and name', () => {
    const err = new RetryableError('test', 503);
    expect(err.statusCode).toBe(503);
    expect(err.name).toBe('RetryableError');
    expect(err.message).toBe('test');
  });
});
