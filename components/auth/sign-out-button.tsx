"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
      className="w-full gap-2 sm:w-auto"
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
