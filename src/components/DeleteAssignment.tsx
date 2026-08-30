"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readError } from "@/lib/api";

export function DeleteAssignment({ assignmentId, title }: { assignmentId: string; title: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the assignment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button className="btn btn-danger" type="button" onClick={onDelete} disabled={pending}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error ? <p className="mt-2 text-sm text-pen">{error}</p> : null}
    </div>
  );
}
