import IORedis from "ioredis";

import { env } from "@/lib/env";

const globalForRedis = globalThis as unknown as {
  redis?: IORedis;
};

export function getRedis() {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });
  }

  return globalForRedis.redis;
}

export function createBullRedisConnection() {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
}
