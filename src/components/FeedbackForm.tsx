"use client";

import { useState } from "react";
import { readError } from "@/lib/api";

export function FeedbackForm() {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSaved(false);
    setPending(true);
    const message = String(new FormData(form).get("message") ?? "");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          page: previousPage(),
        }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setSaved(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send feedback.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="field-label">What went wrong, or what should GradeLens do better?</span>
        <textarea
          className="field min-h-36"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          placeholder="Describe the issue, including which course or assignment if you can."
        />
      </label>
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      {saved ? <p className="text-sm text-mark">Thanks. Your note was saved so it can be reviewed.</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}

function previousPage(): string {
  try {
    const from = new URL(document.referrer).pathname;
    if (from && !from.startsWith("/feedback")) return from;
  } catch {
    /* stay on current page */
  }
  return window.location.pathname;
}
