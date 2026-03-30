import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [repos, logs] = await Promise.all([
    prisma.trackedRepo.findMany({
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
    }),
    prisma.activityLog.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        repo: {
          select: {
            repoOwner: true,
            repoName: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    })
  ]);

  const sanitizedRepos = repos.map((repo) => ({
    id: repo.id,
    userId: repo.userId,
    repoUrl: repo.repoUrl,
    repoOwner: repo.repoOwner,
    repoName: repo.repoName,
    defaultBranch: repo.defaultBranch,
    frequency: repo.frequency,
    status: repo.status,
    commitMessageTemplate: repo.commitMessageTemplate,
    fileContentTemplate: repo.fileContentTemplate,
    totalCommits: repo.totalCommits,
    lastCommitAt: repo.lastCommitAt?.toISOString() ?? null,
    lastRateLimitRemaining: repo.lastRateLimitRemaining,
    lastRateLimitResetAt: repo.lastRateLimitResetAt?.toISOString() ?? null,
    createdAt: repo.createdAt.toISOString(),
    updatedAt: repo.updatedAt.toISOString(),
    lastActivity: repo.logs[0]
      ? {
          status: repo.logs[0].status,
          message: repo.logs[0].message,
          createdAt: repo.logs[0].createdAt.toISOString(),
          commitSha: repo.logs[0].commitSha
        }
      : null,
    logs: undefined
  }));

  const sanitizedLogs = logs.map((log) => ({
    id: log.id,
    status: log.status,
    message: log.message,
    commitSha: log.commitSha,
    createdAt: log.createdAt.toISOString(),
    repo: log.repo
  }));

  return (
    <DashboardShell
      initialRepos={sanitizedRepos}
      initialLogs={sanitizedLogs}
      githubLogin={session.user.githubLogin ?? session.user.name ?? "github"}
    />
  );
}
