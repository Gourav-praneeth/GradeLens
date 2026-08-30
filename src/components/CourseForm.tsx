"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readError } from "@/lib/api";

const ACCENTS = ["#1c4d4a", "#1e3a5f", "#6b3a2a", "#3d4a2a", "#4a2d5c"];

export function CourseForm({
  courseId,
  initial,
}: {
  courseId?: string;
  initial?: { name: string; code: string | null; semester: string | null; description: string; accent: string; status: string };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      code: String(form.get("code") ?? ""),
      semester: String(form.get("semester") ?? ""),
      description: String(form.get("description") ?? ""),
      accent: String(form.get("accent") ?? ""),
      status: String(form.get("status") ?? "active"),
    };
    try {
      const response = await fetch(courseId ? `/api/courses/${courseId}` : "/api/courses", {
        method: courseId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await readError(response));
      const data = (await response.json()) as { id: string };
      router.push(courseId ? `/courses/${courseId}/settings` : `/courses/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the course.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="field-label">Course name</span>
        <input className="field" name="name" required defaultValue={initial?.name} placeholder="Software Engineering" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Course code</span>
          <input className="field" name="code" defaultValue={initial?.code ?? ""} placeholder="CS 401" />
        </label>
        <label className="block">
          <span className="field-label">Semester / year</span>
          <input className="field" name="semester" defaultValue={initial?.semester ?? ""} placeholder="Fall 2026" />
        </label>
      </div>
      <label className="block">
        <span className="field-label">Description</span>
        <textarea className="field min-h-24" name="description" defaultValue={initial?.description} placeholder="What this offering covers." />
      </label>
      <fieldset>
        <legend className="field-label">Course color</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ACCENTS.map((color) => (
            <label key={color} className="inline-flex items-center gap-2 text-sm">
              <input type="radio" name="accent" value={color} defaultChecked={(initial?.accent ?? "#1c4d4a") === color} />
              <span className="inline-block h-4 w-8 rounded" style={{ background: color }} />
            </label>
          ))}
        </div>
      </fieldset>
      {courseId ? (
        <label className="block max-w-xs">
          <span className="field-label">Status</span>
          <select className="field" name="status" defaultValue={initial?.status ?? "active"}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      ) : null}
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : courseId ? "Save settings" : "Create course"}
      </button>
    </form>
  );
}
