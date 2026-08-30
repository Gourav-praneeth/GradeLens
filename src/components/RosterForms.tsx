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
        body: JSON.stringify({ name: body.name, email: body.email }),
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

export function RemoveStudentButton({ courseId, studentId }: { courseId: string; studentId: string }) {
  const router = useRouter();
  return (
    <button
      className="btn btn-danger"
      type="button"
      onClick={async () => {
        const response = await fetch(`/api/courses/${courseId}/students`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });
        if (response.ok) router.refresh();
      }}
    >
      Remove
    </button>
  );
}
