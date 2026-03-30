import { Queue, QueueEvents } from "bullmq";

import { createBullRedisConnection } from "@/lib/redis";
import type { CommitJobData } from "@/lib/scheduler/types";

export const COMMIT_QUEUE_NAME = "autostreak-commit";

declare global {
  var __autostreakQueue: Queue<CommitJobData> | undefined;
  var __autostreakQueueEvents: QueueEvents | undefined;
}

const queueConnection = createBullRedisConnection();
const eventsConnection = createBullRedisConnection();

export const commitQueue =
  globalThis.__autostreakQueue ??
  new Queue<CommitJobData>(COMMIT_QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 30_000
      },
      removeOnComplete: 1000,
      removeOnFail: 5000
    }
  });

export const commitQueueEvents =
  globalThis.__autostreakQueueEvents ??
  new QueueEvents(COMMIT_QUEUE_NAME, {
    connection: eventsConnection
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__autostreakQueue = commitQueue;
  globalThis.__autostreakQueueEvents = commitQueueEvents;
}

export async function enqueueCommitJob(params: {
  repoId: string;
  reason: CommitJobData["reason"];
  runAt: Date;
  jobId: string;
}) {
  const delayMs = Math.max(0, params.runAt.getTime() - Date.now());

  await commitQueue.add(
    "commit",
    {
      repoId: params.repoId,
      reason: params.reason
    },
    {
      delay: delayMs,
      jobId: params.jobId
    }
  );
}

export async function enqueueManualCommit(repoId: string) {
  await commitQueue.add(
    "commit",
    {
      repoId,
      reason: "manual"
    },
    {
      jobId: `manual:${repoId}:${Date.now()}`
    }
  );
}
