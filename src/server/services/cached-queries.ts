import { cacheService } from './cache';

/**
 * Cache-through wrapper: returns cached value if available,
 * otherwise executes fn, caches the result, and returns it.
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = await cacheService.get<T>(key);
  if (cached !== null) return cached;

  const result = await fn();
  await cacheService.set(key, result, ttl);
  return result;
}

/**
 * Invalidate all cache keys matching a glob-style pattern (e.g. 'books:*').
 */
export async function invalidateCache(pattern: string): Promise<void> {
  await cacheService.deleteByPattern(pattern);
}
