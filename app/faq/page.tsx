import { PublicNav } from "@/components/marketing/public-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    q: "Will commits count on my GitHub contribution graph?",
    a: "Yes, commits count when authored by your GitHub identity and pushed to eligible branches."
  },
  {
    q: "Can I use private repositories?",
    a: "Yes. Use a token that has access to that private repository and write permissions."
  },
  {
    q: "Can I stop AutoStreak later?",
    a: "Yes. Pause any repository with one click, or delete it to revoke stored token access."
  },
  {
    q: "What if my token loses permissions?",
    a: "Runs will fail with a clear message. Update or replace the token in the dashboard."
  },
  {
    q: "Do jobs survive restarts?",
    a: "Yes. BullMQ + Redis keeps queued jobs durable across process restarts."
  }
];

export default function FaqPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PublicNav />

      <section className="mb-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">FAQ</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Frequently Asked Questions</h1>
      </section>

      <section className="grid gap-4">
        {faqs.map((item) => (
          <Card key={item.q} className="border-white/10 bg-slate-950/50">
            <CardHeader>
              <CardTitle className="text-base">{item.q}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">{item.a}</CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
