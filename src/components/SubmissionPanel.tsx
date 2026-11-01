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
      const data = (await response.json()) as {
        count: number;
        matched: number;
        ambiguous: number;
        unmatched: number;
        duplicates: number;
        rejected: number;
        warnings?: string[];
      };
      form.reset();
      const summary =
        `Uploaded ${data.count}: ${data.matched} matched, ` +
        `${data.ambiguous} ambiguous, ${data.unmatched} unmatched, ` +
        `${data.duplicates} duplicates, ${data.rejected} rejected.`;
      setNotice(
        data.warnings?.length
          ? `${summary} ${data.warnings.join(" ")}`
          : summary,
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
      <label className="block max-w-sm">
        <span className="field-label">Manifest CSV (optional)</span>
        <input
          className="field"
          type="file"
          name="manifest"
          accept=".csv,text/csv"
        />
        <span className="mt-1 block text-xs text-muted">
          Headers: filename plus sis_login_id (preferred), canvas_user_id, student_id, or email.
        </span>
      </label>
      <p className="text-xs text-muted">
        For automatic matching, name each file <code>SIS_LOGIN_ID__paper.pdf</code>. Exact student
        ID, email, and unique full-name filenames are also supported.
      </p>
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      {notice ? <p className="text-sm text-mark">{notice}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}

export function CanvasSubmissionImporter({
  assignmentId,
  initialCanvasAssignmentId,
  enabled,
}: {
  assignmentId: string;
  initialCanvasAssignmentId: string | null;
  enabled: boolean;
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
    const canvasAssignmentId = String(
      new FormData(event.currentTarget).get("canvasAssignmentId") ?? "",
    );
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/canvas-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvasAssignmentId }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const data = (await response.json()) as {
        imported: number;
        updated: number;
        unchanged: number;
        unmatched: number;
        duplicates: number;
        rejected: number;
        warnings: string[];
      };
      const summary =
        `Canvas import: ${data.imported} new, ${data.updated} updated, ` +
        `${data.unchanged} unchanged, ${data.unmatched} unmatched, ` +
        `${data.duplicates} duplicates, ${data.rejected} rejected.`;
      setNotice(data.warnings.length ? `${summary} ${data.warnings.join(" ")}` : summary);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import Canvas submissions.");
    } finally {
      setPending(false);
    }
  }

  if (!enabled) {
    return (
      <p className="text-sm text-muted">
        Sync this course&apos;s Canvas roster before importing assignment submissions.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-48 flex-1">
          <span className="field-label">Canvas assignment ID</span>
          <input
            className="field"
            name="canvasAssignmentId"
            required
            defaultValue={initialCanvasAssignmentId ?? ""}
            placeholder="67890"
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Importing…" : "Import from Canvas"}
        </button>
      </div>
      <p className="text-xs text-muted">
        Use the number after <code>/assignments/</code> in the Canvas URL. Re-importing is safe.
      </p>
      {notice ? <p className="text-sm text-mark">{notice}</p> : null}
      {error ? <p className="text-sm text-pen">{error}</p> : null}
    </form>
  );
}

export function SubmissionMatchForm({
  assignmentId,
  submissionId,
  roster,
}: {
  assignmentId: string;
  submissionId: string;
  roster: Array<{ id: string; name: string; studentNumber: string | null; sisLoginId: string | null }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const studentId = String(new FormData(event.currentTarget).get("studentId") ?? "");
    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/submissions/${submissionId}/match`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        },
      );
      if (!response.ok) throw new Error(await readError(response));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not match this submission.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex min-w-64 flex-wrap items-center justify-end gap-2">
      <select className="field max-w-56" name="studentId" required defaultValue="">
        <option value="" disabled>
          Choose student
        </option>
        {roster.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name}
            {student.sisLoginId || student.studentNumber
              ? ` (${student.sisLoginId ?? student.studentNumber})`
              : ""}
          </option>
        ))}
      </select>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Match"}
      </button>
      {error ? <p className="basis-full text-right text-sm text-pen">{error}</p> : null}
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
      let graded = 0;
      let remaining = 1;
      let unresolved = 0;
      const errors: string[] = [];

      while (remaining > 0 && errors.length === 0) {
        const response = await fetch(`/api/assignments/${assignmentId}/grade-all`, { method: "POST" });
        if (!response.ok) {
          throw new Error(await readError(response));
        }
        const data = (await response.json()) as {
          graded: number;
          errors?: string[];
          unresolved?: number;
          remaining?: number;
        };
        graded += data.graded;
        remaining = data.remaining ?? 0;
        unresolved = data.unresolved ?? 0;
        errors.push(...(data.errors ?? []));
        setNotice(
          remaining > 0 && errors.length === 0
            ? `Graded ${graded}. ${remaining} remaining…`
            : `Graded ${graded}.`,
        );
        if (data.graded === 0) break;
      }

      const unresolvedNotice = unresolved
        ? ` ${unresolved} submissions still need a student match.`
        : "";
      setNotice(
        errors.length
          ? `Graded ${graded}. ${errors.join(" ")}${unresolvedNotice}`
          : `Graded ${graded} ${graded === 1 ? "submission" : "submissions"}.${unresolvedNotice}`,
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
    } finally {
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
