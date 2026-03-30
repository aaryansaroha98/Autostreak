import type { RepoFrequency, TrackedRepo, User } from "@prisma/client";

import { decryptSecret } from "@/lib/crypto";
import { commitWithGitFallback } from "@/lib/commit-fallback";
import { createOctokit, resolveGitHubAuthor } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import { randomQuote } from "@/lib/quotes";
import { buildTemplateContext, renderTemplate } from "@/lib/template";
import { utcDateKey, utcFileTimestamp } from "@/lib/utils";

const frequencyInterval: Record<RepoFrequency, number> = {
  EVERY_1_HOUR: 1 * 60 * 60 * 1000,
  EVERY_2_HOURS: 2 * 60 * 60 * 1000,
  EVERY_4_HOURS: 4 * 60 * 60 * 1000,
  EVERY_6_HOURS: 6 * 60 * 60 * 1000,
  EVERY_8_HOURS: 8 * 60 * 60 * 1000,
  EVERY_12_HOURS: 12 * 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000,
};

type RepoWithUser = TrackedRepo & {
  user: User;
};

function isHttpStatus(error: unknown, status: number) {
  if (!error || typeof error !== "object") {
    return false;
  }

  if ("status" in error && typeof (error as { status?: unknown }).status === "number") {
    return (error as { status: number }).status === status;
  }

  return false;
}

function permissionHint(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("permission to") ||
    normalized.includes("resource not accessible by personal access token") ||
    normalized.includes("insufficient permission") ||
    normalized.includes("403")
  ) {
    return (
      "PAT does not have write access to this repository. Use a classic PAT with `repo` scope, " +
      "or a fine-grained token that has Contents: Read and write for this repository."
    );
  }

  return null;
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
      .replace(/(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]+/g, "[redacted]")
      .replace(/github_pat_[A-Za-z0-9_]+/g, "[redacted]")
      .slice(0, 400);
  }

  return "Unknown error";
}

async function shouldSkipCommit(repo: RepoWithUser, now: Date) {
  if (repo.status !== "ACTIVE") {
    return "Repository automation is paused.";
  }

  if (repo.lastCommitAt) {
    const elapsed = now.getTime() - repo.lastCommitAt.getTime();
    if (elapsed < frequencyInterval[repo.frequency]) {
      return "Commit skipped because the configured frequency window has not elapsed yet.";
    }
  }

  if (repo.frequency === "DAILY") {
    const startOfDayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endOfDayUtc = new Date(startOfDayUtc.getTime() + 24 * 60 * 60 * 1000);

    const existing = await prisma.activityLog.findFirst({
      where: {
        repoId: repo.id,
        status: "SUCCESS",
        createdAt: {
          gte: startOfDayUtc,
          lt: endOfDayUtc
        }
      }
    });

    if (existing) {
      return "Commit skipped to prevent duplicate daily contribution.";
    }
  }

  return null;
}

async function resolveBranch(octokit: ReturnType<typeof createOctokit>, repo: RepoWithUser) {
  const candidates = [repo.defaultBranch, "main", "master"].filter(
    (candidate, index, arr): candidate is string => Boolean(candidate) && arr.indexOf(candidate) === index
  );

  for (const branch of candidates) {
    try {
      await octokit.git.getRef({
        owner: repo.repoOwner,
        repo: repo.repoName,
        ref: `heads/${branch}`
      });
      return branch;
    } catch {
      continue;
    }
  }

  const repoInfo = await octokit.repos.get({
    owner: repo.repoOwner,
    repo: repo.repoName
  });

  return repoInfo.data.default_branch;
}

async function commitViaGitHubApi(params: {
  repo: RepoWithUser;
  token: string;
  fileName: string;
  fileContent: string;
  commitMessage: string;
  timestamp: Date;
}) {
  const { repo, token, fileName, fileContent, commitMessage, timestamp } = params;

  const octokit = createOctokit(token);
  const author = await resolveGitHubAuthor(token);
  const branch = await resolveBranch(octokit, repo);

  let parentSha: string | null = null;
  let baseTreeSha: string | null = null;

  try {
    const ref = await octokit.git.getRef({
      owner: repo.repoOwner,
      repo: repo.repoName,
      ref: `heads/${branch}`
    });

    parentSha = ref.data.object.sha;

    const parentCommit = await octokit.git.getCommit({
      owner: repo.repoOwner,
      repo: repo.repoName,
      commit_sha: parentSha
    });

    baseTreeSha = parentCommit.data.tree.sha;
  } catch (error) {
    if (!isHttpStatus(error, 404)) {
      throw error;
    }
  }

  const blob = await octokit.git.createBlob({
    owner: repo.repoOwner,
    repo: repo.repoName,
    content: fileContent,
    encoding: "utf-8"
  });

  const tree = await octokit.git.createTree({
    owner: repo.repoOwner,
    repo: repo.repoName,
    ...(baseTreeSha ? { base_tree: baseTreeSha } : {}),
    tree: [
      {
        path: fileName,
        mode: "100644",
        type: "blob",
        sha: blob.data.sha
      }
    ]
  });

  const commit = await octokit.git.createCommit({
    owner: repo.repoOwner,
    repo: repo.repoName,
    message: commitMessage,
    tree: tree.data.sha,
    parents: parentSha ? [parentSha] : [],
    author: {
      name: author.name,
      email: author.email,
      date: timestamp.toISOString()
    },
    committer: {
      name: author.name,
      email: author.email,
      date: timestamp.toISOString()
    }
  });

  if (parentSha) {
    await octokit.git.updateRef({
      owner: repo.repoOwner,
      repo: repo.repoName,
      ref: `heads/${branch}`,
      sha: commit.data.sha,
      force: false
    });
  } else {
    try {
      await octokit.git.createRef({
        owner: repo.repoOwner,
        repo: repo.repoName,
        ref: `refs/heads/${branch}`,
        sha: commit.data.sha
      });
    } catch (error) {
      if (!isHttpStatus(error, 422)) {
        throw error;
      }

      await octokit.git.updateRef({
        owner: repo.repoOwner,
        repo: repo.repoName,
        ref: `heads/${branch}`,
        sha: commit.data.sha,
        force: false
      });
    }
  }

  const rateLimit = await octokit.rateLimit.get();

  return {
    sha: commit.data.sha,
    branch,
    remaining: rateLimit.data.resources.core.remaining,
    resetEpochSeconds: rateLimit.data.resources.core.reset
  };
}

export async function executeCommitForRepo(repoId: string, reason = "scheduled") {
  const repo = await prisma.trackedRepo.findUnique({
    where: { id: repoId },
    include: { user: true }
  });

  if (!repo) {
    return;
  }

  const now = new Date();

  const skipReason = await shouldSkipCommit(repo, now);
  if (skipReason) {
    await prisma.activityLog.create({
      data: {
        repoId: repo.id,
        userId: repo.userId,
        status: "SKIPPED",
        message: `${skipReason} (${reason})`
      }
    });

    return;
  }

  const token = decryptSecret({
    encrypted: repo.encryptedPat,
    iv: repo.patIv,
    tag: repo.patTag
  });

  const quote = randomQuote();
  const context = buildTemplateContext({
    owner: repo.repoOwner,
    repo: repo.repoName,
    quote,
    timestamp: now
  });

  const fileName = `autostreak-${utcFileTimestamp(now)}.md`;
  const commitMessage = renderTemplate(repo.commitMessageTemplate, context);
  const renderedContent = renderTemplate(repo.fileContentTemplate, context);

  const fileContent = [
    `# AutoStreak`,
    "",
    `Timestamp (UTC): ${now.toISOString()}`,
    `Date: ${utcDateKey(now)}`,
    `Quote: ${quote}`,
    `Random seed: ${context.random}`,
    "",
    renderedContent
  ].join("\n");

  try {
    let result: {
      sha: string;
      branch: string;
      remaining?: number;
      resetEpochSeconds?: number;
      method: "octokit" | "fallback";
    };

    try {
      const apiResult = await commitViaGitHubApi({
        repo,
        token,
        fileName,
        fileContent,
        commitMessage,
        timestamp: now
      });

      result = {
        ...apiResult,
        method: "octokit"
      };
    } catch (apiError) {
      const author = await resolveGitHubAuthor(token);
      const branchCandidates = [repo.defaultBranch, "main", "master"].filter(
        (branch, index, arr): branch is string => Boolean(branch) && arr.indexOf(branch) === index
      );
      const fallbackErrors: string[] = [];

      let fallback:
        | {
            sha: string;
            branch: string;
          }
        | null = null;

      for (const branch of branchCandidates) {
        try {
          fallback = await commitWithGitFallback({
            token,
            owner: repo.repoOwner,
            repo: repo.repoName,
            branch,
            fileName,
            fileContent,
            commitMessage,
            authorName: author.name,
            authorEmail: author.email
          });
          break;
        } catch (fallbackError) {
          fallbackErrors.push(`${branch}: ${safeErrorMessage(fallbackError)}`);
          continue;
        }
      }

      if (!fallback) {
        const apiMessage = safeErrorMessage(apiError);
        const fallbackMessage =
          fallbackErrors.length > 0
            ? `Fallback errors: ${fallbackErrors.join(" | ")}`
            : "Fallback git commit failed on all branch candidates";

        const hint = permissionHint(`${apiMessage} ${fallbackMessage}`);
        if (hint) {
          throw new Error(hint);
        }

        throw new Error(`GitHub API failed: ${apiMessage}. ${fallbackMessage}`);
      }

      result = {
        ...fallback,
        method: "fallback"
      };
    }

    await prisma.$transaction([
      prisma.trackedRepo.update({
        where: { id: repo.id },
        data: {
          totalCommits: { increment: 1 },
          lastCommitAt: now,
          defaultBranch: result.branch,
          lastRateLimitRemaining:
            typeof result.remaining === "number" ? result.remaining : repo.lastRateLimitRemaining,
          lastRateLimitResetAt:
            typeof result.resetEpochSeconds === "number"
              ? new Date(result.resetEpochSeconds * 1000)
              : repo.lastRateLimitResetAt
        }
      }),
      prisma.activityLog.create({
        data: {
          repoId: repo.id,
          userId: repo.userId,
          status: "SUCCESS",
          message: `Commit created via ${result.method} (${reason})`,
          commitSha: result.sha
        }
      })
    ]);
  } catch (error) {
    await prisma.activityLog.create({
      data: {
        repoId: repo.id,
        userId: repo.userId,
        status: "FAILED",
        message: `Commit failed (${reason}): ${safeErrorMessage(error)}`
      }
    });

    throw error;
  }
}
