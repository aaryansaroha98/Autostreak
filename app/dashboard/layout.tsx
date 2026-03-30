import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Sparkles } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur sm:mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold tracking-wide">
            <Sparkles className="size-4 text-cyan-300" />
            AutoStreak Control Center
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/how-to-use"
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-slate-100 sm:text-sm"
            >
              How To Use
            </Link>
            <Link
              href="/faq"
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-slate-100 sm:text-sm"
            >
              FAQ
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
