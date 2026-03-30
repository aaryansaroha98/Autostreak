import Link from "next/link";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const links = [
  { href: "/how-to-use", label: "How To Use" },
  { href: "/faq", label: "FAQ" },
  { href: "/security", label: "Security" }
];

export function PublicNav() {
  return (
    <header className="mb-10 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-100">
          <Sparkles className="size-4 text-cyan-300" />
          AutoStreak
        </Link>

        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-slate-100 sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/sign-in" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
