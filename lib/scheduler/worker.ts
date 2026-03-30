import { Worker } from "bullmq";

import { executeCommitForRepo } from "@/lib/commit-engine";
import { createBullRedisConnection } from "@/lib/redis";
import { COMMIT_QUEUE_NAME } from "@/lib/scheduler/queue";
import type { CommitJobData } from "@/lib/scheduler/types";

let worker: Worker<CommitJobData> | null = null;

export function startCommitWorker() {
  if (worker) {
    return worker;
  }

  worker = new Worker<CommitJobData>(
    COMMIT_QUEUE_NAME,
    async (job) => {
      await executeCommitForRepo(job.data.repoId, job.data.reason);
    },
    {
      connection: createBullRedisConnection(),
      concurrency: 4
    }
  );

  worker.on("failed", (job, error) => {
    const id = job?.id ?? "unknown";
    console.error(`Commit job ${id} failed:`, error.message);
  });

  worker.on("completed", (job) => {
    const id = job.id ?? "unknown";
    console.log(`Commit job ${id} completed`);
  });

  return worker;
}
