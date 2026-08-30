export type SignupDecision = { ok: true } | { ok: false; message: string };

export function signupAccess(input: {
  userCount: number;
  pendingInvite: boolean;
  inviteCode?: string;
  env?: {
    NODE_ENV?: string;
    SIGNUP_INVITE?: string;
    ALLOW_SIGNUP?: string;
  };
}): SignupDecision {
  const env = input.env ?? process.env;
  if (input.userCount === 0) return { ok: true };
  if (input.pendingInvite) return { ok: true };

  const expected = env.SIGNUP_INVITE?.trim();
  if (expected && String(input.inviteCode ?? "").trim() === expected) return { ok: true };
  if (env.ALLOW_SIGNUP === "true") return { ok: true };
  if (env.NODE_ENV !== "production") return { ok: true };

  if (expected) {
    return { ok: false, message: "Enter a valid invite code, or sign up with the email a course owner invited." };
  }
  return {
    ok: false,
    message: "New accounts are invite-only. Ask a course owner to add your email as staff, then sign up with that address.",
  };
}
