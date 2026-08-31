"use client";

import { useState } from "react";
import { readError } from "@/lib/api";

export type FeedbackRow = {
  id: string;
  message: string;
  page: string;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
};

export function FeedbackInbox({ initial }: { initial: FeedbackRow[] }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: "open" | "done") {
    setError(null);
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setItems((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that note.");
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">No feedback yet.</p>;
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      <ul className="divide-y divide-line">
        {items.map((row) => (
          <li key={row.id} className="py-4 first:pt-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">
                {row.user.name} <span className="font-normal text-muted">{row.user.email}</span>
              </p>
              <p className="font-mono text-xs text-muted">
                {new Date(row.createdAt).toLocaleString()}
                {row.page ? ` · ${row.page}` : ""}
              </p>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{row.message}</p>
            <button
              className="btn btn-ghost mt-3"
              type="button"
              onClick={() => setStatus(row.id, row.status === "done" ? "open" : "done")}
            >
              {row.status === "done" ? "Reopen" : "Mark done"}
            </button>
            {row.status === "done" ? <span className="ml-3 text-sm text-mark">Done</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
