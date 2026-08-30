"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { readError } from "@/lib/api";
import { safeNextPath } from "@/lib/redirect";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = event.currentTarget;
    const body = {
      email: String(new FormData(form).get("email") ?? ""),
      password: String(new FormData(form).get("password") ?? ""),
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
        <span className="field-label">Email</span>
        <input className="field" name="email" type="email" required autoComplete="email" />
      </label>
      <label className="block">
        <span className="field-label">Password</span>
        <input className="field" name="password" type="password" required autoComplete="current-password" />
      </label>
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
