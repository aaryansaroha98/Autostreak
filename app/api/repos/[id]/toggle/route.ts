import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncSchedulesForDate } from "@/lib/scheduler/sync";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repo = await prisma.trackedRepo.findFirst({
    where: {
      id,
      userId: session.user.id
    }
  });

  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const nextStatus = repo.status === "ACTIVE" ? "PAUSED" : "ACTIVE";

  const updated = await prisma.trackedRepo.update({
    where: { id },
    data: {
      status: nextStatus
    }
  });

  await syncSchedulesForDate(new Date());

  return NextResponse.json({ repo: updated });
}
