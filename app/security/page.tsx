import { Lock, ShieldCheck, ShieldOff } from "lucide-react";

import { PublicNav } from "@/components/marketing/public-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PublicNav />

      <section className="mb-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Security</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">How AutoStreak Protects Your Data</h1>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-slate-950/50">
          <CardHeader className="space-y-3">
            <Lock className="size-5 text-cyan-300" />
            <CardTitle className="text-base">Encrypted PAT Storage</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Personal Access Tokens are encrypted at rest using AES-256-GCM.
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/50">
          <CardHeader className="space-y-3">
            <ShieldCheck className="size-5 text-cyan-300" />
            <CardTitle className="text-base">Protected Routes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Dashboard and API operations are authenticated before any sensitive action.
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/50">
          <CardHeader className="space-y-3">
            <ShieldOff className="size-5 text-cyan-300" />
            <CardTitle className="text-base">Revoke Anytime</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Delete a tracked repository at any time to remove encrypted token access from AutoStreak.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
