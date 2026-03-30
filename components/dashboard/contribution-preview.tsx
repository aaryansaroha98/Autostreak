"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ContributionPreview({ username }: { username: string }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setTick(Date.now());

    const interval = setInterval(() => {
      setTick(Date.now());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const chartUrl = useMemo(() => {
    const baseUrl = `https://ghchart.rshah.org/0ea5e9/${encodeURIComponent(username)}`;
    if (!tick) {
      return baseUrl;
    }
    return `${baseUrl}?t=${tick}`;
  }, [tick, username]);

  return (
    <Card className="border-white/10 bg-slate-950/50">
      <CardHeader>
        <CardTitle className="text-lg">Contribution Preview</CardTitle>
        <CardDescription>Live chart estimate for @{username}</CardDescription>
      </CardHeader>
      <CardContent>
        <img
          src={chartUrl}
          alt={`Contribution preview for ${username}`}
          className="w-full rounded-md border border-white/10 bg-slate-900 p-2"
          loading="lazy"
        />
      </CardContent>
    </Card>
  );
}
