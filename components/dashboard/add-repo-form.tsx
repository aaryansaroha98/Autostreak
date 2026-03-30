"use client";

import { useState, type FormEvent } from "react";

import { Loader2, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function AddRepoForm({ onSuccess }: { onSuccess: () => void }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [pat, setPat] = useState("");
  const [frequency, setFrequency] = useState<
    | "DAILY"
    | "EVERY_12_HOURS"
    | "EVERY_8_HOURS"
    | "EVERY_6_HOURS"
    | "EVERY_4_HOURS"
    | "EVERY_2_HOURS"
    | "EVERY_1_HOUR"
  >("DAILY");
  const [keepPatForNextRepo, setKeepPatForNextRepo] = useState(true);
  const [commitMessageTemplate, setCommitMessageTemplate] = useState(
    "chore(autostreak): contribution for {{date}}"
  );
  const [fileContentTemplate, setFileContentTemplate] = useState(
    "AutoStreak contribution for {{isoTimestamp}}\\nQuote: {{quote}}"
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/repos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        repoUrl,
        pat,
        frequency,
        commitMessageTemplate,
        fileContentTemplate
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to add repository");
      return;
    }

    setRepoUrl("");
    if (!keepPatForNextRepo) {
      setPat("");
    }
    onSuccess();
  }

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PlusCircle className="size-4 text-cyan-300" />
          Add Repository
        </CardTitle>
        <CardDescription>
          Configure AutoStreak with your repo URL and a classic PAT with repo scope. You can add multiple repositories.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="repoUrl">Repository URL</Label>
            <Input
              id="repoUrl"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pat">GitHub Personal Access Token</Label>
            <Input
              id="pat"
              type="password"
              placeholder="ghp_..."
              value={pat}
              onChange={(event) => setPat(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Commit Frequency</Label>
            <Select value={frequency} onValueChange={(value) => setFrequency(value as typeof frequency)}>
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="EVERY_1_HOUR">Every 1 hour</SelectItem>
                <SelectItem value="EVERY_2_HOURS">Every 2 hours</SelectItem>
                <SelectItem value="EVERY_4_HOURS">Every 4 hours</SelectItem>
                <SelectItem value="EVERY_6_HOURS">Every 6 hours</SelectItem>
                <SelectItem value="EVERY_12_HOURS">Every 12 hours</SelectItem>
                <SelectItem value="EVERY_8_HOURS">Every 8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={keepPatForNextRepo}
              onChange={(event) => setKeepPatForNextRepo(event.target.checked)}
              className="size-4 rounded border-white/20 bg-slate-900"
            />
            Keep PAT for adding next repository quickly
          </label>

          <div className="space-y-2">
            <Label htmlFor="commitTemplate">Commit Message Template</Label>
            <Input
              id="commitTemplate"
              value={commitMessageTemplate}
              onChange={(event) => setCommitMessageTemplate(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentTemplate">File Content Template</Label>
            <Textarea
              id="contentTemplate"
              value={fileContentTemplate}
              onChange={(event) => setFileContentTemplate(event.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-slate-400">
              Template tokens: {"{{date}}"}, {"{{time}}"}, {"{{isoTimestamp}}"}, {"{{quote}}"}, {"{{repo}}"}, {"{{owner}}"}
            </p>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button disabled={isSubmitting} type="submit" className="w-full gap-2">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Save Repository
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
