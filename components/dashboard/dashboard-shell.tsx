"use client";

import { useCallback, useEffect, useState } from "react";

import { AddRepoForm } from "@/components/dashboard/add-repo-form";
import { ActivityLog } from "@/components/dashboard/activity-log";
import { ContributionPreview } from "@/components/dashboard/contribution-preview";
import { RepoList } from "@/components/dashboard/repo-list";
import type { ActivityItem, RepoItem } from "@/components/dashboard/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  initialRepos: RepoItem[];
  initialLogs: ActivityItem[];
  githubLogin: string;
}

export function DashboardShell({ initialRepos, initialLogs, githubLogin }: Props) {
  const [repos, setRepos] = useState<RepoItem[]>(initialRepos);
  const [logs, setLogs] = useState<ActivityItem[]>(initialLogs);

  const refresh = useCallback(async () => {
    const [reposResponse, logsResponse] = await Promise.all([
      fetch("/api/repos", { cache: "no-store" }),
      fetch("/api/activity?limit=50", { cache: "no-store" })
    ]);

    if (reposResponse.ok) {
      const reposPayload = (await reposResponse.json()) as { repos: RepoItem[] };
      setRepos(reposPayload.repos);
    }

    if (logsResponse.ok) {
      const logsPayload = (await logsResponse.json()) as { logs: ActivityItem[] };
      setLogs(logsPayload.logs);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh().catch(() => undefined);
    }, 20_000);

    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-xl">AutoStreak Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Keep your contribution graph alive with real commits authored by your GitHub account.
          </CardContent>
        </Card>

        <AddRepoForm onSuccess={refresh} />
        <ContributionPreview username={githubLogin} />
      </div>

      <div className="space-y-6">
        <RepoList repos={repos} onRefresh={refresh} />
        <ActivityLog logs={logs} />
      </div>
    </div>
  );
}
