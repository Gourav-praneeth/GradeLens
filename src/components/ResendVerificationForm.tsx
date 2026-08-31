"use client";

import { useState } from "react";
import { readError } from "@/lib/api";

export function ResendVerificationForm({ email }: { email: string }) {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    const value = String(new FormData(event.currentTarget).get("email") ?? email);
    try {
      const response = await fetch("/api/auth/verify/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the email.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="field-label">Email</span>
        <input className="field" name="email" type="email" required defaultValue={email} autoComplete="email" />
      </label>
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      {sent ? <p className="text-sm text-mark">If an account needs verification, we sent a new link.</p> : null}
      <button className="btn btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Resend verification email"}
      </button>
    </form>
  );
}
