# Caching layer (e.g., Redis) #Performance
/**
 * cacheService.ts
 *
 * Redis-backed caching service abstraction.
 * Provides get, set, delete, ping, and connect/disconnect utilities.
 */

import Redis from 'ioredis';

class CacheService {
  private client: Redis;

  constructor() {
    // Connect using env var REDIS_URL or default localhost
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    this.client.on('error', (err) => {
      console.error('Redis client error', err);
    });

    this.client.on('connect', () => {
      console.log('Redis client connected');
    });
  }

  async connect() {
    if (!this.client.status || this.client.status !== 'ready') {
      await this.client.connect();
    }
  }

  async disconnect() {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const str = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, str, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, str);
    }
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async ping(): Promise<boolean> {
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}

const cacheService = new CacheService();
export default cacheService;
