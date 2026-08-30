"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readError } from "@/lib/api";

export function InviteTaForm({ courseId }: { courseId: string }) {
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
      const response = await fetch(`/api/courses/${courseId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(new FormData(form).get("email") ?? "") }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const data = (await response.json()) as { status?: string };
      form.reset();
      setNotice(
        data.status === "invited"
          ? "Invite saved. They will join this course when they create an account with that email."
          : "TA added to the course.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the TA.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <label className="min-w-56 flex-1">
        <span className="field-label">TA email</span>
        <input className="field" name="email" type="email" required placeholder="ta@school.edu" />
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add TA"}
      </button>
      {error ? <p className="basis-full text-sm text-pen">{error}</p> : null}
      {notice ? <p className="basis-full text-sm text-mark">{notice}</p> : null}
    </form>
  );
}

export function RemoveMemberButton({
  courseId,
  memberId,
  inviteId,
}: {
  courseId: string;
  memberId?: string;
  inviteId?: string;
}) {
  const router = useRouter();
  return (
    <button
      className="btn btn-danger"
      type="button"
      onClick={async () => {
        const response = await fetch(`/api/courses/${courseId}/members`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId, inviteId }),
        });
        if (response.ok) router.refresh();
      }}
    >
      Remove
    </button>
  );
}
