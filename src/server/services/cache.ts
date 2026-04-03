import Redis from 'ioredis';

class CacheService {
  private client: Redis | null = null;
  private connected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy(times: number) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.connected = true;
      });

      this.client.on('ready', () => {
        this.connected = true;
      });

      this.client.on('error', (err: Error) => {
        this.connected = false;
        console.warn(`[CacheService] Redis error: ${err.message}`);
      });

      this.client.on('close', () => {
        this.connected = false;
      });

      this.client.on('end', () => {
        this.connected = false;
      });

      this.client.connect().catch((err: unknown) => {
        this.connected = false;
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[CacheService] Redis connection failed: ${message}`);
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[CacheService] Redis init failed: ${message}`);
      this.client = null;
      this.connected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected || !this.client) return null;
    try {
      const raw = await this.client.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds !== undefined && ttlSeconds > 0) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch {
      // Graceful degradation
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // Graceful degradation
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.connected || !this.client) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }

  async flush(): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      await this.client.flushdb();
    } catch {
      // Graceful degradation
    }
  }

  /**
   * Scan and delete keys matching a glob pattern (e.g. 'books:*').
   * Uses SCAN to avoid blocking Redis.
   */
  async deleteByPattern(pattern: string): Promise<void> {
    if (!this.connected || !this.client) return;
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch {
      // Graceful degradation
    }
  }
}

export const cacheService = new CacheService();
