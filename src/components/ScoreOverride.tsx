"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readError } from "@/lib/api";
import { formatPoints } from "@/lib/format";

export function ScoreOverride({
  assignmentId,
  submissionId,
  scoreId,
  maxPoints,
  pointsAwarded,
  modelPointsAwarded,
  overrideNote,
}: {
  assignmentId: string;
  submissionId: string;
  scoreId: string;
  maxPoints: number;
  pointsAwarded: number;
  modelPointsAwarded: number;
  overrideNote: string | null;
}) {
  const router = useRouter();
  const [points, setPoints] = useState(String(pointsAwarded));
  const [note, setNote] = useState(overrideNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSave() {
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submissions/${submissionId}/scores`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreId,
          pointsAwarded: Number(points),
          overrideNote: note,
        }),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the override.");
      setPending(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 border-t border-line pt-3">
      <label>
        <span className="field-label">Override points</span>
        <input
          className="field font-mono"
          type="number"
          min={0}
          max={maxPoints}
          step={0.5}
          value={points}
          onChange={(event) => setPoints(event.target.value)}
        />
      </label>
      <label>
        <span className="field-label">Override note (required if you change the score)</span>
        <textarea
          className="field min-h-16 resize-y"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Why this score should change"
        />
      </label>
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      <button className="btn btn-ghost" type="button" onClick={onSave} disabled={pending}>
        {pending ? "Saving…" : "Save override"}
      </button>
      {overrideNote ? (
        <p className="text-xs text-muted">
          Model had {formatPoints(modelPointsAwarded)}. Instructor override is in effect.
        </p>
      ) : (
        <p className="text-xs text-muted">Model score {formatPoints(modelPointsAwarded)}</p>
      )}
    </div>
  );
}
