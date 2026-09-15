"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readError } from "@/lib/api";

export function StudentRosterForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch(`/api/courses/${courseId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: body.name, email: body.email, studentNumber: body.studentNumber }),
      });
      if (!response.ok) throw new Error(await readError(response));
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the student.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <label className="min-w-40 flex-1">
        <span className="field-label">Student name</span>
        <input className="field" name="name" required placeholder="Alex Chen" />
      </label>
      <label className="min-w-32 flex-1">
        <span className="field-label">Student ID</span>
        <input className="field" name="studentNumber" placeholder="Optional" />
      </label>
      <label className="min-w-40 flex-1">
        <span className="field-label">Email (optional)</span>
        <input className="field" name="email" type="email" />
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add to roster"}
      </button>
      {error ? <p className="basis-full text-sm text-pen">{error}</p> : null}
    </form>
  );
}

export function ImportRosterForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = event.currentTarget;
    try {
      const formData = new FormData(form);
      const file = formData.get("csvFile");
      const importText = String(formData.get("importText") ?? "").trim();
      let body: { csvText: string } | { importText: string };

      if (file instanceof File && file.size > 0) {
        if (file.size > 2_000_000) throw new Error("Roster CSV must be smaller than 2 MB.");
        body = { csvText: await file.text() };
      } else if (importText) {
        body = { importText };
      } else {
        throw new Error("Choose a CSV file or paste student names.");
      }

      const response = await fetch(`/api/courses/${courseId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(await readError(response));
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import the roster.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="field-label">Upload roster CSV</span>
        <input className="field" name="csvFile" type="file" accept=".csv,text/csv" />
        <span className="mt-1 block text-xs text-muted">
          Headers: Last Name, First Name, Student ID. Email is optional.
        </span>
      </label>
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <label className="block">
        <span className="field-label">Import students (one name per line)</span>
        <textarea className="field min-h-28" name="importText" placeholder="Alex Chen&#10;Jordan Lee" />
      </label>
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Importing…" : "Import students"}
      </button>
    </form>
  );
}

export function RemoveStudentButton({ courseId, studentId }: { courseId: string; studentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      className="btn btn-danger"
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const response = await fetch(`/api/courses/${courseId}/students`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId }),
          });
          if (response.ok) router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
