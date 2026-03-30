import "dotenv/config";

import { startSchedulerCron, syncSchedulesForDate } from "../lib/scheduler/sync";

async function boot() {
  await syncSchedulesForDate(new Date());
  startSchedulerCron();

  console.log("AutoStreak scheduler cron is running...");
}

boot().catch((error) => {
  console.error("Failed to start scheduler cron", error);
  process.exit(1);
});
