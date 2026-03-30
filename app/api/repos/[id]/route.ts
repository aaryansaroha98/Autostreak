import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { syncSchedulesForDate } from "@/lib/scheduler/sync";
import { repoUpdateSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await enforceRateLimit({
    key: `repos:patch:${session.user.id}`,
    limit: 50,
    windowSeconds: 60
  });
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const payload = await request.json();
  const parsed = repoUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid request"
      },
      { status: 400 }
    );
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

  const updated = await prisma.trackedRepo.update({
    where: { id },
    data: parsed.data
  });

  await syncSchedulesForDate(new Date());

  return NextResponse.json({ repo: updated });
}

export async function DELETE(
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

  await prisma.trackedRepo.delete({
    where: { id }
  });

  await syncSchedulesForDate(new Date());

  return NextResponse.json({ ok: true });
}
