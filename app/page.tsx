import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowRight, CalendarCheck2, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicNav } from "@/components/marketing/public-nav";
import { auth } from "@/lib/auth";

const features = [
  {
    icon: CalendarCheck2,
    title: "Reliable Daily Commits",
    description: "BullMQ + Redis scheduling ensures jobs persist through restarts and retries safely."
  },
  {
    icon: Zap,
    title: "Fast GitHub API Commits",
    description: "Octokit commit pipeline avoids full repository clones and scales cleanly."
  },
  {
    icon: ShieldCheck,
    title: "PAT Encryption by Default",
    description: "Tokens are encrypted at rest with AES-256-GCM and never written to logs."
  }
];

export default async function LandingPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <PublicNav />

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
            Build Consistency That Compounds
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Real, authenticated GitHub commits on autopilot for every repo you care about.
          </h1>
          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            AutoStreak creates real commits using your own account, protects your token, and keeps your graph active
            with production-grade scheduling.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-in">
              <Button className="gap-2">
                Launch Dashboard
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline">Explore Features</Button>
            </a>
            <Link href="/how-to-use">
              <Button variant="secondary">How To Use</Button>
            </Link>
          </div>
        </div>

        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">How AutoStreak Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>1. Add any GitHub repository URL (public or private).</p>
            <p>2. Add a classic PAT with repo scope (stored encrypted).</p>
            <p>3. AutoStreak schedules and creates timestamped streak commits forever until paused.</p>
          </CardContent>
        </Card>
      </section>

      <section id="features" className="mt-12 grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="border-white/10 bg-slate-950/50">
            <CardHeader className="space-y-4">
              <feature.icon className="size-5 text-cyan-300" />
              <CardTitle className="text-base">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">{feature.description}</CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
