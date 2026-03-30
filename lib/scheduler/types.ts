export type CommitJobReason = "scheduled" | "manual";

export interface CommitJobData {
  repoId: string;
  reason: CommitJobReason;
}
