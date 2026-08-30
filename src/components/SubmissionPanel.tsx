"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readError } from "@/lib/api";

export function SubmissionUploader({
  assignmentId,
  roster,
}: {
  assignmentId: string;
  roster: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);
    const form = event.currentTarget;
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        method: "POST",
        body: new FormData(form),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      const data = (await response.json()) as { count: number; warnings?: string[] };
      form.reset();
      setNotice(
        data.warnings?.length
          ? `Uploaded ${data.count}. ${data.warnings.join(" ")}`
          : `Uploaded ${data.count} ${data.count === 1 ? "submission" : "submissions"}.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload submissions.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {roster.length > 0 ? (
        <label className="block max-w-sm">
          <span className="field-label">Student on roster</span>
          <select className="field" name="studentId" defaultValue="">
            <option value="">Match from filename</option>
            {roster.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block max-w-sm">
        <span className="field-label">Student name</span>
        <input
          className="field"
          name="studentLabel"
          placeholder={roster.length > 0 ? "Optional if the file name matches the roster" : "Optional if you upload several files"}
        />
      </label>
      <label className="file-well text-sm text-muted">
        <span>Files (PDF or .txt)</span>
        <input
          type="file"
          name="files"
          accept=".pdf,.txt,.md,application/pdf,text/plain"
          multiple
          required
        />
      </label>
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      {notice ? <p className="text-sm text-mark">{notice}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}

export function GradeAllButton({ assignmentId, disabled }: { assignmentId: string; disabled?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/grade-all`, { method: "POST" });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      const data = (await response.json()) as { graded: number; errors?: string[] };
      setNotice(
        data.errors?.length
          ? `Graded ${data.graded}. ${data.errors.join(" ")}`
          : `Graded ${data.graded} ${data.graded === 1 ? "submission" : "submissions"}.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not grade remaining submissions.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button className="btn btn-ghost" type="button" onClick={onClick} disabled={disabled || pending}>
        {pending ? "Grading…" : "Grade ungraded"}
      </button>
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      {notice ? <p className="text-sm text-mark">{notice}</p> : null}
    </div>
  );
}

export function GradeOneButton({
  assignmentId,
  submissionId,
  label,
  disabled,
}: {
  assignmentId: string;
  submissionId: string;
  label: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grading failed.");
      setPending(false);
    }
  }

  return (
    <div>
      <button className="btn btn-primary" type="button" onClick={onClick} disabled={disabled || pending}>
        {pending ? "Grading…" : label}
      </button>
      {error ? <p className="mt-2 text-sm text-pen">{error}</p> : null}
    </div>
  );
}
