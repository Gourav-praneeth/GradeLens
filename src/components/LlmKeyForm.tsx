"use client";

import { useState } from "react";
import { readError } from "@/lib/api";
import type { LlmProvider } from "@/lib/llmProviders";

export type LlmKeyStatus = {
  configured: boolean;
  provider: LlmProvider | null;
  hint: string | null;
  usingServerKey: boolean;
};

export function LlmKeyForm({ initial }: { initial: LlmKeyStatus }) {
  const [status, setStatus] = useState(initial);
  const [provider, setProvider] = useState<LlmProvider>(initial.provider ?? "groq");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    const apiKey = String(new FormData(event.currentTarget).get("apiKey") ?? "");
    try {
      const response = await fetch("/api/account/llm-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const next = (await response.json()) as LlmKeyStatus;
      setStatus(next);
      setSaved(true);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the API key.");
    } finally {
      setPending(false);
    }
  }

  async function onRemove() {
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      const response = await fetch("/api/account/llm-key", { method: "DELETE" });
      if (!response.ok) throw new Error(await readError(response));
      const next = (await response.json()) as LlmKeyStatus;
      setStatus(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the API key.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="grading-key" onSubmit={onSubmit} className="scroll-mt-24 space-y-4">
      <h2 className="font-semibold">Grading API key</h2>
      <p className="text-sm text-muted">
        Rubric generation and grading use your key so usage is billed to you, not a shared server
        account. Keys are stored encrypted and never shown in full after save.
      </p>
      {status.configured ? (
        <p className="text-sm">
          Saved {status.provider} key {status.hint}. Paste a new key below to replace it.
        </p>
      ) : status.usingServerKey ? (
        <p className="text-sm text-muted">
          No personal key yet. GradeLens will use the server key from <code>.env</code> until you save one
          here.
        </p>
      ) : (
        <p className="text-sm text-pen">Add a key before generating a rubric or grading papers.</p>
      )}
      <label className="block">
        <span className="field-label">Provider</span>
        <select className="field" value={provider} onChange={(event) => setProvider(event.target.value as LlmProvider)}>
          <option value="groq">Groq (free tier at console.groq.com)</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </label>
      <label className="block">
        <span className="field-label">API key</span>
        <input
          className="field font-mono"
          name="apiKey"
          type="password"
          autoComplete="off"
          required
          placeholder={status.configured ? "Paste a new key to replace" : "Paste your API key"}
        />
      </label>
      {error ? <p className="text-sm text-pen">{error}</p> : null}
      {saved ? <p className="text-sm text-mark">API key saved.</p> : null}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save API key"}
        </button>
        {status.configured ? (
          <button className="btn btn-danger" type="button" onClick={onRemove} disabled={pending}>
            Remove key
          </button>
        ) : null}
      </div>
      <p className="text-xs text-muted">
        Groq:{" "}
        <a className="underline" href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
          console.groq.com/keys
        </a>
      </p>
    </form>
  );
}
