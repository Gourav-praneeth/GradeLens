"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readError } from "@/lib/api";
import { COURSE_ACCENTS, semesterOptions } from "@/lib/courseOptions";

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
  const semesters = semesterOptions();
  const selectedAccent = initial?.accent ?? COURSE_ACCENTS[0].value;
  const accentOptions: { name: string; value: string; description: string }[] = [...COURSE_ACCENTS];
  if (!accentOptions.some((option) => option.value.toLowerCase() === selectedAccent.toLowerCase())) {
    accentOptions.push({ name: "Current", value: selectedAccent, description: "Existing course color" });
  }

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
          <select className="field" name="semester" defaultValue={initial?.semester ?? ""}>
            <option value="">Select semester</option>
            {initial?.semester && !semesters.includes(initial.semester) ? (
              <option value={initial.semester}>Current: {initial.semester}</option>
            ) : null}
            {semesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="field-label">Description</span>
        <textarea className="field min-h-24" name="description" defaultValue={initial?.description} placeholder="What this offering covers." />
      </label>
      <fieldset>
        <legend className="field-label">Course color</legend>
        <p className="mb-2 text-sm text-muted">Used as a bold visual marker on the dashboard and inside the course.</p>
        <div className="course-color-grid">
          {accentOptions.map((color) => (
            <label key={color.value} className="course-color-option" style={{ ["--swatch" as string]: color.value }}>
              <input type="radio" name="accent" value={color.value} defaultChecked={selectedAccent === color.value} />
              <span className="course-color-chip" aria-hidden="true" />
              <span>
                <strong className="block text-sm">{color.name}</strong>
                <small className="block text-xs text-muted">{color.description}</small>
              </span>
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
