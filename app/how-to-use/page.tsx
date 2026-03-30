import Link from "next/link";

import { ArrowRight, Clock3, GitBranch, KeyRound, ShieldCheck } from "lucide-react";

import { PublicNav } from "@/components/marketing/public-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    icon: GitBranch,
    title: "1. Add your repository",
    text: "Paste any GitHub repo URL you own or can push to."
  },
  {
    icon: KeyRound,
    title: "2. Add PAT with write access",
    text: "Use a classic PAT with `repo` scope (or fine-grained with Contents: Read and write)."
  },
  {
    icon: Clock3,
    title: "3. Choose commit frequency",
    text: "Pick daily or high-frequency options like every 1h, 2h, 4h, 6h, 8h, or 12h."
  },
  {
    icon: ShieldCheck,
    title: "4. Keep control",
    text: "Pause, run now, update templates, or revoke access anytime from dashboard."
  }
];

export default function HowToUsePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PublicNav />

      <section className="mb-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Guide</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">How To Use AutoStreak</h1>
        <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
          Set it once and let AutoStreak keep your contribution graph active with real commits authored by your own
          GitHub account.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {steps.map((step) => (
          <Card key={step.title} className="border-white/10 bg-slate-950/50">
            <CardHeader className="space-y-3">
              <step.icon className="size-5 text-cyan-300" />
              <CardTitle className="text-base">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">{step.text}</CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-950/50 p-5 sm:p-6">
        <h2 className="mb-2 text-lg font-semibold">Quick Safety Checklist</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>Use a PAT that can push to the repository.</li>
          <li>Do not share PATs in screenshots or chat.</li>
          <li>Revoke token immediately if you suspect leakage.</li>
        </ul>
      </section>

      <div className="mt-8">
        <Link href="/sign-in">
          <Button className="gap-2">
            Open Dashboard
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </main>
  );
}
