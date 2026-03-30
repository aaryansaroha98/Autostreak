import { getRedis } from "@/lib/redis";

interface LimitOptions {
  key: string;
  limit?: number;
  windowSeconds?: number;
}

export async function enforceRateLimit({
  key,
  limit = 30,
  windowSeconds = 60
}: LimitOptions) {
  try {
    const redis = getRedis();
    const namespacedKey = `ratelimit:${key}`;

    const currentCount = await redis.incr(namespacedKey);

    if (currentCount === 1) {
      await redis.expire(namespacedKey, windowSeconds);
    }

    const ttl = await redis.ttl(namespacedKey);

    return {
      allowed: currentCount <= limit,
      remaining: Math.max(0, limit - currentCount),
      resetAt: Date.now() + Math.max(0, ttl) * 1000
    };
  } catch {
    return {
      allowed: true,
      remaining: limit,
      resetAt: Date.now() + windowSeconds * 1000
    };
  }
}
