"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readError } from "@/lib/api";

export function CourseForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          code: String(form.get("code") ?? ""),
        }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const data = (await response.json()) as { id: string };
      router.push(`/courses/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the course.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="field-label">Course name</span>
        <input className="field" name="name" required placeholder="Computer Organization" />
      </label>
      <label className="block">
        <span className="field-label">Code</span>
        <input className="field" name="code" placeholder="CSE230" />
      </label>
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create course"}
      </button>
    </form>
  );
}
