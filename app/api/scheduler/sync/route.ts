import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { syncSchedulesForDate } from "@/lib/scheduler/sync";

export async function POST(request: Request) {
  const token = request.headers.get("x-cron-secret");
  const hasValidSecret = Boolean(env.CRON_SECRET) && token === env.CRON_SECRET;

  if (!hasValidSecret) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await syncSchedulesForDate(new Date());

  return NextResponse.json(result);
}
