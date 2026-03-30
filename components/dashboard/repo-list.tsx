"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDistanceToNowStrict } from "date-fns";
import { PauseCircle, PlayCircle, Save, Send, Trash2 } from "lucide-react";

import type { RepoItem } from "@/components/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface DraftSettings {
  frequency: RepoItem["frequency"];
  commitMessageTemplate: string;
  fileContentTemplate: string;
}

export function RepoList({ repos, onRefresh }: { repos: RepoItem[]; onRefresh: () => Promise<void> }) {
  const [drafts, setDrafts] = useState<Record<string, DraftSettings>>({});
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draftDefaults = useMemo(
    () =>
      repos.reduce<Record<string, DraftSettings>>((accumulator, repo) => {
        accumulator[repo.id] = {
          frequency: repo.frequency,
          commitMessageTemplate: repo.commitMessageTemplate,
          fileContentTemplate: repo.fileContentTemplate
        };
        return accumulator;
      }, {}),
    [repos]
  );

  useEffect(() => {
    setDrafts(draftDefaults);
  }, [draftDefaults]);

  function updateDraft(repoId: string, next: Partial<DraftSettings>) {
    setDrafts((current) => ({
      ...current,
      [repoId]: {
        ...current[repoId],
        ...next
      }
    }));
  }

  async function callAction(endpoint: string, repoId: string, request: RequestInit) {
    setError(null);
    setWorkingId(repoId);

    const response = await fetch(endpoint, request);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Action failed");
    }

    await onRefresh();
    setWorkingId(null);
  }

  async function saveSettings(repo: RepoItem) {
    const draft = drafts[repo.id];
    await callAction(`/api/repos/${repo.id}`, repo.id, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(draft)
    });
  }

  async function toggleRepo(repo: RepoItem) {
    await callAction(`/api/repos/${repo.id}/toggle`, repo.id, {
      method: "POST"
    });
  }

  async function runNow(repo: RepoItem) {
    setError(null);
    setWorkingId(repo.id);

    const response = await fetch(`/api/repos/${repo.id}/run`, { method: "POST" });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to queue manual run");
    }

    await onRefresh();
    setWorkingId(null);
  }

  async function removeRepo(repo: RepoItem) {
    const confirmed = window.confirm(
      `Delete ${repo.repoOwner}/${repo.repoName}? This permanently removes encrypted token access.`
    );

    if (!confirmed) {
      return;
    }

    await callAction(`/api/repos/${repo.id}`, repo.id, {
      method: "DELETE"
    });
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}

      {repos.map((repo) => {
        const draft = drafts[repo.id];
        const busy = workingId === repo.id;

        return (
          <Card key={repo.id} className="border-white/10 bg-slate-950/60">
            <CardHeader className="flex flex-col items-start justify-between gap-3 space-y-0 sm:flex-row">
              <div>
                <CardTitle className="text-lg">
                  {repo.repoOwner}/{repo.repoName}
                </CardTitle>
                <p className="mt-1 break-all text-xs text-slate-400">{repo.repoUrl}</p>
              </div>
              <Badge variant={repo.status === "ACTIVE" ? "default" : "secondary"}>{repo.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-slate-400">Last commit</p>
                  <p>{repo.lastCommitAt ? formatDistanceToNowStrict(new Date(repo.lastCommitAt), { addSuffix: true }) : "Never"}</p>
                </div>
                <div>
                  <p className="text-slate-400">Total AutoStreak commits</p>
                  <p>{repo.totalCommits}</p>
                </div>
                <div>
                  <p className="text-slate-400">GitHub API remaining</p>
                  <p>{repo.lastRateLimitRemaining ?? "Unknown"}</p>
                </div>
                <div>
                  <p className="text-slate-400">Latest activity</p>
                  <p>{repo.lastActivity?.status ?? "No logs"}</p>
                </div>
              </div>

              <div className="grid gap-4 rounded-xl border border-white/10 bg-slate-900/40 p-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={draft?.frequency ?? "DAILY"}
                    onValueChange={(value) =>
                      updateDraft(repo.id, {
                        frequency: value as RepoItem["frequency"]
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="EVERY_1_HOUR">Every 1 hour</SelectItem>
                      <SelectItem value="EVERY_2_HOURS">Every 2 hours</SelectItem>
                      <SelectItem value="EVERY_4_HOURS">Every 4 hours</SelectItem>
                      <SelectItem value="EVERY_6_HOURS">Every 6 hours</SelectItem>
                      <SelectItem value="EVERY_8_HOURS">Every 8 hours</SelectItem>
                      <SelectItem value="EVERY_12_HOURS">Every 12 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Commit Message Template</Label>
                  <Input
                    value={draft?.commitMessageTemplate ?? ""}
                    onChange={(event) =>
                      updateDraft(repo.id, {
                        commitMessageTemplate: event.target.value
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>File Content Template</Label>
                  <Textarea
                    rows={4}
                    value={draft?.fileContentTemplate ?? ""}
                    onChange={(event) =>
                      updateDraft(repo.id, {
                        fileContentTemplate: event.target.value
                      })
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy}
                    size="sm"
                    onClick={() => toggleRepo(repo)}
                    variant="secondary"
                    className="w-full gap-2 sm:w-auto"
                  >
                    {repo.status === "ACTIVE" ? <PauseCircle className="size-4" /> : <PlayCircle className="size-4" />}
                    {repo.status === "ACTIVE" ? "Pause" : "Resume"}
                  </Button>
                  <Button disabled={busy} size="sm" onClick={() => saveSettings(repo)} className="w-full gap-2 sm:w-auto">
                    <Save className="size-4" />
                    Save settings
                  </Button>
                  <Button
                    disabled={busy}
                    size="sm"
                    onClick={() => runNow(repo)}
                    variant="outline"
                    className="w-full gap-2 sm:w-auto"
                  >
                    <Send className="size-4" />
                    Run now
                  </Button>
                  <Button
                    disabled={busy}
                    size="sm"
                    onClick={() => removeRepo(repo)}
                    variant="destructive"
                    className="w-full gap-2 sm:w-auto"
                  >
                    <Trash2 className="size-4" />
                    Delete + revoke
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
