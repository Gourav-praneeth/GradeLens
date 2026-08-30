"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readError } from "@/lib/api";

export type CourseOption = { id: string; name: string; code: string | null };

export function AssignmentForm({
  courses,
  defaultCourseId,
}: {
  courses: CourseOption[];
  defaultCourseId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        body: new FormData(form),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      const data = (await response.json()) as { id: string };
      router.push(`/assignments/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the assignment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <label className="block">
          <span className="field-label">Title</span>
          <input className="field" name="title" required placeholder="Assignment 1" />
        </label>
        <label className="block">
          <span className="field-label">Course</span>
          <select className="field" name="courseId" required defaultValue={defaultCourseId ?? ""}>
            <option value="" disabled>
              Select a course
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code ? `${course.code} — ${course.name}` : course.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="field-label">Short description</span>
        <input className="field" name="description" placeholder="Shown on the assignment list" />
      </label>
      <label className="block max-w-xs">
        <span className="field-label">Due date</span>
        <input className="field" type="datetime-local" name="dueAt" />
      </label>

      <MaterialField
        heading="Questions"
        textName="questionsText"
        fileName="questionsFile"
        placeholder="Paste the questions, or attach a PDF."
      />
      <MaterialField
        heading="Official solutions"
        textName="solutionsText"
        fileName="solutionsFile"
        placeholder="Paste the official solutions the rubric should follow."
      />

      {error ? <p className="text-sm text-pen">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" type="submit" disabled={pending || courses.length === 0}>
          {pending ? "Creating…" : "Create assignment"}
        </button>
        <p className="text-sm text-muted">PDF or .txt. Scans without selectable text will not extract.</p>
      </div>
    </form>
  );
}

function MaterialField({
  heading,
  textName,
  fileName,
  placeholder,
}: {
  heading: string;
  textName: string;
  fileName: string;
  placeholder: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{heading}</legend>
      <textarea className="field min-h-40 resize-y" name={textName} placeholder={placeholder} />
      <label className="file-well text-sm text-muted">
        <span>Or attach a PDF / .txt</span>
        <input type="file" name={fileName} accept=".pdf,.txt,.md,application/pdf,text/plain" />
      </label>
    </fieldset>
  );
}
