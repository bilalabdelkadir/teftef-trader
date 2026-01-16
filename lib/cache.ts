import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// TTL values in seconds
export const CACHE_TTL = {
  PRICE: 60, // 1 minute
  TIME_SERIES: 300, // 5 minutes
  INDICATOR: 300, // 5 minutes (RSI, MACD, SMA, EMA)
  MARKET_DATA: 300, // 5 minutes (combined endpoint)
} as const;

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
  }
}

export function generateCacheKey(
  type: string,
  symbol: string,
  ...params: (string | number)[]
): string {
  const sanitizedSymbol = symbol.replace("/", "-");
  const paramStr = params.length > 0 ? `:${params.join(":")}` : "";
  return `market:${type}:${sanitizedSymbol}${paramStr}`;
}

export { redis };
