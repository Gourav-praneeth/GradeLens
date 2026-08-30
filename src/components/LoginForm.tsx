"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { readError } from "@/lib/api";
import { safeNextPath } from "@/lib/redirect";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState<string | null>(null);
  const [ssoNotice, setSsoNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSsoNotice(null);
    setPending(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      remember: data.get("remember") === "on",
    };
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(await readError(response));
      router.push(safeNextPath(next));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="field-label">University email</span>
        <input className="field" name="email" type="email" required autoComplete="email" placeholder="you@university.edu" />
      </label>
      <label className="block">
        <span className="field-label">Password</span>
        <input className="field" name="password" type="password" required autoComplete="current-password" />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="remember" />
          Remember me
        </label>
        <Link href="/login/forgot" className="text-muted hover:text-ink hover:underline">
          Forgot password?
        </Link>
      </div>
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      {ssoNotice ? <p className="text-sm text-muted">{ssoNotice}</p> : null}
      <button className="btn btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <button
        className="btn btn-ghost w-full"
        type="button"
        onClick={() => setSsoNotice("University SSO is not configured for this campus yet.")}
      >
        Sign in with University SSO
      </button>
    </form>
  );
}
