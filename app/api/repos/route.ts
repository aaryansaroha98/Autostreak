import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { validateRepoAccess } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { syncSchedulesForDate } from "@/lib/scheduler/sync";
import { repoInputSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await enforceRateLimit({
    key: `repos:get:${session.user.id}`,
    limit: 120,
    windowSeconds: 60
  });
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const repos = await prisma.trackedRepo.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      logs: {
        take: 1,
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  return NextResponse.json({
    repos: repos.map((repo) => ({
      ...repo,
      lastActivity: repo.logs[0] ?? null,
      logs: undefined
    }))
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await enforceRateLimit({
    key: `repos:post:${session.user.id}`,
    limit: 20,
    windowSeconds: 60
  });
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const payload = await request.json();
  const parsed = repoInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid request"
      },
      { status: 400 }
    );
  }

  try {
    const repoInfo = await validateRepoAccess(parsed.data.pat, parsed.data.repoUrl);

    if (
      session.user.githubLogin &&
      repoInfo.tokenLogin.toLowerCase() !== session.user.githubLogin.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: `PAT belongs to @${repoInfo.tokenLogin}, but your signed-in GitHub account is @${session.user.githubLogin}.`
        },
        { status: 400 }
      );
    }

    if (repoInfo.canPush === false) {
      return NextResponse.json(
        {
          error:
            "This token can read the repository but cannot push commits. Use a classic PAT with `repo` scope (or fine-grained token with Contents: Read and write)."
        },
        { status: 400 }
      );
    }

    const encryptedPat = encryptSecret(parsed.data.pat);

    const created = await prisma.trackedRepo.create({
      data: {
        userId: session.user.id,
        repoUrl: parsed.data.repoUrl,
        repoOwner: repoInfo.owner,
        repoName: repoInfo.repo,
        defaultBranch: repoInfo.defaultBranch ?? "main",
        encryptedPat: encryptedPat.encrypted,
        patIv: encryptedPat.iv,
        patTag: encryptedPat.tag,
        frequency: parsed.data.frequency,
        status: "ACTIVE",
        commitMessageTemplate:
          parsed.data.commitMessageTemplate ?? "chore(autostreak): contribution for {{date}}",
        fileContentTemplate:
          parsed.data.fileContentTemplate ??
          "AutoStreak contribution for {{isoTimestamp}}\\nQuote: {{quote}}"
      }
    });

    await syncSchedulesForDate(new Date());

    return NextResponse.json({ repo: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add repository";

    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Repository already added" }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
