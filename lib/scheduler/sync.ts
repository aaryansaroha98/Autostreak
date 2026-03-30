import cron from "node-cron";

import type { RepoFrequency } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { enqueueCommitJob } from "@/lib/scheduler/queue";
import { stableHash } from "@/lib/utils";

let cronStarted = false;

const intervalMinutesByFrequency: Record<RepoFrequency, number> = {
  EVERY_1_HOUR: 60,
  EVERY_2_HOURS: 120,
  EVERY_4_HOURS: 240,
  EVERY_6_HOURS: 360,
  EVERY_8_HOURS: 480,
  EVERY_12_HOURS: 720,
  DAILY: 1440
};

function frequencyWindows(frequency: RepoFrequency) {
  const intervalMinutes = intervalMinutesByFrequency[frequency];
  const windows: Array<[number, number]> = [];

  for (let start = 0; start < 1440; start += intervalMinutes) {
    windows.push([start, Math.min(start + intervalMinutes, 1440)]);
  }

  return windows;
}

function randomOffsetMsInWindow(startMinuteInclusive: number, endMinuteExclusive: number) {
  const startMs = startMinuteInclusive * 60_000;
  const endMs = endMinuteExclusive * 60_000;
  return Math.floor(Math.random() * Math.max(1, endMs - startMs)) + startMs;
}

function dayStartUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function syncSchedulesForDate(date = new Date()) {
  const targetStart = dayStartUtc(date);

  const repos = await prisma.trackedRepo.findMany({
    where: {
      status: "ACTIVE"
    },
    select: {
      id: true,
      userId: true,
      frequency: true
    }
  });

  let queued = 0;

  for (const repo of repos) {
    const windows = frequencyWindows(repo.frequency);
    const userOffsetMs = stableHash(repo.userId) % 30_000;

    for (let slot = 0; slot < windows.length; slot += 1) {
      const [windowStart, windowEnd] = windows[slot];
      const randomOffsetMs = randomOffsetMsInWindow(windowStart, windowEnd);
      const runAt = new Date(targetStart.getTime() + randomOffsetMs + userOffsetMs);

      const idDateKey = dayKey(targetStart);
      const jobId = `${repo.id}:${idDateKey}:${slot}`;

      try {
        await enqueueCommitJob({
          repoId: repo.id,
          reason: "scheduled",
          runAt,
          jobId
        });
        queued += 1;
      } catch {
        continue;
      }
    }
  }

  return {
    repos: repos.length,
    jobsQueued: queued,
    date: dayKey(targetStart)
  };
}

export function startSchedulerCron() {
  if (cronStarted) {
    return;
  }

  cronStarted = true;

  cron.schedule(
    "0 0 * * *",
    async () => {
      await syncSchedulesForDate(new Date());
    },
    {
      timezone: "UTC"
    }
  );

  cron.schedule(
    "10 * * * *",
    async () => {
      await syncSchedulesForDate(new Date());
    },
    {
      timezone: "UTC"
    }
  );
}
