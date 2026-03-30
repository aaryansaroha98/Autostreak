"use client";

import { useState, type FormEvent } from "react";

import { Github, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSigningIn(true);

    const normalizedEmail = email.trim().toLowerCase();

    const result = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false,
      callbackUrl: "/dashboard"
    });

    setIsSigningIn(false);

    if (result?.error) {
      setError("Invalid credentials. Please try again.");
      return;
    }

    window.location.href = "/dashboard";
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsRegistering(true);

    const normalizedName = name.trim();
    const normalizedEmail = registerEmail.trim().toLowerCase();

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: normalizedName,
        email: normalizedEmail,
        password: registerPassword
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setIsRegistering(false);
      setError(payload.error ?? "Registration failed");
      return;
    }

    const result = await signIn("credentials", {
      email: normalizedEmail,
      password: registerPassword,
      redirect: false,
      callbackUrl: "/dashboard"
    });

    setIsRegistering(false);

    if (result?.error) {
      setError("Registration worked, but automatic sign-in failed. Please sign in manually.");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-14">
      <div className="grid w-full gap-6 lg:grid-cols-2">
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to AutoStreak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button className="w-full gap-2" onClick={() => signIn("github", { callbackUrl: "/dashboard" })}>
              <Github className="size-4" />
              Continue with GitHub
            </Button>

            <div className="text-center text-xs uppercase tracking-[0.2em] text-slate-400">or use credentials</div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                />
              </div>
              <Button disabled={isSigningIn} type="submit" className="w-full">
                {isSigningIn ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
              </Button>
            </form>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl">Create Credentials Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registerEmail">Email</Label>
                <Input
                  id="registerEmail"
                  type="email"
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registerPassword">Password</Label>
                <Input
                  id="registerPassword"
                  type="password"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  required
                />
              </div>
              <Button disabled={isRegistering} type="submit" className="w-full" variant="secondary">
                {isRegistering ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
