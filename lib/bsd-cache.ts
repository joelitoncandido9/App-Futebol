/**
 * Cache layer para BSD API usando Upstash Redis
 * TTL padrão: 15 min (900s) — dados de jogos mudam devagar
 */

import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = Redis.fromEnv();
    return redis;
  }
  return null;
}

export async function cacheFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 900
): Promise<T> {
  const client = getRedis();

  // Try cache first
  if (client) {
    try {
      const cached = await client.get<T>(key);
      if (cached !== null) return cached;
    } catch {
      // Redis unavailable, fall through
    }
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  if (client && data) {
    try {
      await client.set(key, data, { ex: ttl });
    } catch {
      // Cache write failure is non-critical
    }
  }

  return data;
}

export function makeBsdCacheKey(...parts: (string | number)[]): string {
  return `bsd:${parts.join(':')}`;
}
