"use client";

import { useState } from "react";
import { readError } from "@/lib/api";

export type CanvasCredentialStatus = {
  configured: boolean;
  baseUrl: string | null;
  hint: string | null;
};

export function CanvasKeyForm({ initial }: { initial: CanvasCredentialStatus }) {
  const [status, setStatus] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      const response = await fetch("/api/account/canvas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: data.get("baseUrl"),
          accessToken: data.get("accessToken"),
        }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setStatus((await response.json()) as CanvasCredentialStatus);
      setSaved(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the Canvas connection.");
    } finally {
      setPending(false);
    }
  }

  async function onRemove() {
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      const response = await fetch("/api/account/canvas", { method: "DELETE" });
      if (!response.ok) throw new Error(await readError(response));
      setStatus((await response.json()) as CanvasCredentialStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the Canvas connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="canvas-key" onSubmit={onSubmit} className="scroll-mt-24 space-y-4">
      <h2 className="font-semibold">Canvas connection</h2>
      <p className="text-sm text-muted">
        Connect your institution&apos;s Canvas account to import active course rosters. The access
        token is encrypted and never shown in full after save.
      </p>
      {status.configured ? (
        <p className="text-sm text-mark">
          Connected to {status.baseUrl} with token {status.hint}. Save below to replace it.
        </p>
      ) : (
        <p className="text-sm text-muted">Add a Canvas connection before syncing a roster.</p>
      )}
      <label className="block">
        <span className="field-label">Canvas URL</span>
        <input
          className="field"
          name="baseUrl"
          type="url"
          required
          placeholder="https://school.instructure.com"
          defaultValue={status.baseUrl ?? ""}
        />
      </label>
      <label className="block">
        <span className="field-label">Canvas access token</span>
        <input
          className="field font-mono"
          name="accessToken"
          type="password"
          autoComplete="off"
          required
          placeholder={status.configured ? "Paste a new token to replace" : "Paste your Canvas token"}
        />
      </label>
      {saved ? <p className="text-sm text-mark">Canvas connection verified and saved.</p> : null}
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Verifying…" : "Verify and save"}
        </button>
        {status.configured ? (
          <button className="btn btn-danger" type="button" onClick={onRemove} disabled={pending}>
            Remove connection
          </button>
        ) : null}
      </div>
      <p className="text-xs text-muted">
        In Canvas, create a token under Account → Settings → Approved Integrations.
      </p>
    </form>
  );
}
