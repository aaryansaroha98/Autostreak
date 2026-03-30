import "dotenv/config";

import { startCommitWorker } from "../lib/scheduler/worker";

startCommitWorker();

console.log("AutoStreak BullMQ worker is running...");
