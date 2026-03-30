export interface RepoItem {
  id: string;
  userId: string;
  repoUrl: string;
  repoOwner: string;
  repoName: string;
  defaultBranch: string | null;
  frequency:
    | "DAILY"
    | "EVERY_12_HOURS"
    | "EVERY_8_HOURS"
    | "EVERY_6_HOURS"
    | "EVERY_4_HOURS"
    | "EVERY_2_HOURS"
    | "EVERY_1_HOUR";
  status: "ACTIVE" | "PAUSED";
  commitMessageTemplate: string;
  fileContentTemplate: string;
  totalCommits: number;
  lastCommitAt: string | Date | null;
  lastRateLimitRemaining: number | null;
  lastRateLimitResetAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastActivity?: {
    status: "SUCCESS" | "FAILED" | "SKIPPED";
    message: string;
    createdAt: string | Date;
    commitSha: string | null;
  } | null;
}

export interface ActivityItem {
  id: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  message: string;
  commitSha: string | null;
  createdAt: string | Date;
  repo: {
    repoOwner: string;
    repoName: string;
  };
}
