"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readError } from "@/lib/api";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      if (!response.ok) throw new Error(await readError(response));
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="field-label">Name</span>
        <input className="field" name="name" required autoComplete="name" placeholder="Your name" />
      </label>
      <label className="block">
        <span className="field-label">Email</span>
        <input className="field" name="email" type="email" required autoComplete="email" />
      </label>
      <label className="block">
        <span className="field-label">Password</span>
        <input className="field" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
