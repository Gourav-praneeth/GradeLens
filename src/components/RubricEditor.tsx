"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatPoints } from "@/lib/format";
import { readError } from "@/lib/api";

export type RubricRow = {
  id?: string;
  label: string;
  maxPoints: number;
  fullCreditDescription: string;
};

export function RubricEditor({
  assignmentId,
  initialCriteria,
}: {
  assignmentId: string;
  initialCriteria: RubricRow[];
}) {
  const router = useRouter();
  const [criteria, setCriteria] = useState<RubricRow[]>(
    initialCriteria.length > 0 ? initialCriteria : [emptyRow()],
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = useMemo(
    () => criteria.reduce((sum, row) => sum + (Number(row.maxPoints) || 0), 0),
    [criteria],
  );

  function update(index: number, patch: Partial<RubricRow>) {
    setCriteria((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function generate() {
    setError(null);
    setNotice(null);
    setGenerating(true);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/rubric/generate`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      const data = (await response.json()) as { criteria?: RubricRow[] };
      if (data.criteria?.length) {
        setCriteria(data.criteria);
      }
      setNotice("Rubric generated from the official solutions. Edit anything that looks off, then save.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate a rubric.");
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/rubric`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria }),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      setNotice("Rubric saved. Existing grades were cleared. Grade submissions again to apply the new criteria.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the rubric.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Rubric</h2>
          <p className="text-sm text-muted">Generate from the solutions, then edit criteria and points.</p>
        </div>
        <p className="font-mono text-sm tabular-nums text-mark">{formatPoints(total)} pts total</p>
      </div>

      <div className="space-y-3">
        {criteria.map((row, index) => (
          <article key={row.id ?? `new-${index}`} className="grid gap-3 rounded-lg border border-line bg-canvas/60 p-4 sm:grid-cols-[1fr_7rem]">
            <label>
              <span className="field-label">Criterion</span>
              <input
                className="field"
                value={row.label}
                onChange={(event) => update(index, { label: event.target.value })}
                placeholder="Base case"
              />
            </label>
            <label>
              <span className="field-label">Points</span>
              <input
                className="field font-mono"
                type="number"
                min={0.5}
                step={0.5}
                value={row.maxPoints}
                onChange={(event) => update(index, { maxPoints: Number(event.target.value) })}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="field-label">Full credit</span>
              <textarea
                className="field min-h-20 resize-y"
                value={row.fullCreditDescription}
                onChange={(event) => update(index, { fullCreditDescription: event.target.value })}
                placeholder="What a full-credit answer must include."
              />
            </label>
            <div className="sm:col-span-2">
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => setCriteria((rows) => (rows.length === 1 ? [emptyRow()] : rows.filter((_, i) => i !== index)))}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      {error ? <p className="text-sm text-pen">{error}</p> : null}
      {notice ? <p className="text-sm text-mark">{notice}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button className="btn btn-ghost" type="button" onClick={() => setCriteria((rows) => [...rows, emptyRow()])}>
          Add criterion
        </button>
        <button className="btn btn-ghost" type="button" onClick={generate} disabled={generating}>
          {generating ? "Generating…" : initialCriteria.length ? "Regenerate from solutions" : "Generate rubric"}
        </button>
        <button className="btn btn-primary" type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save rubric"}
        </button>
      </div>
    </section>
  );
}

function emptyRow(): RubricRow {
  return { label: "", maxPoints: 5, fullCreditDescription: "" };
}
