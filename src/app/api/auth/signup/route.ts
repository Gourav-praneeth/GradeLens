import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/authEmail";
import { createSession } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { isValidEmail, normalizeEmail } from "@/lib/identity";
import { acceptInvitesForEmail, claimUnownedAssignments } from "@/lib/onboarding";
import { emailEnabled } from "@/lib/mail";
import { appOrigin } from "@/lib/origin";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/db";
import { signupAccess } from "@/lib/signupAccess";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      inviteCode?: string;
    };
    const name = String(body.name ?? "").trim();
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    const inviteCode = String(body.inviteCode ?? "").trim();

    if (!name) return jsonError("Enter your name.");
    if (!isValidEmail(email)) return jsonError("Enter a valid email address.");
    if (password.length < 8) return jsonError("Use a password with at least 8 characters.");

    const [userCount, pendingInvite] = await Promise.all([
      prisma.user.count(),
      prisma.courseInvite.findFirst({ where: { email } }).then((row) => Boolean(row)),
    ]);
    const access = signupAccess({ userCount, pendingInvite, inviteCode });
    if (!access.ok) return jsonError(access.message);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return jsonError("An account with that email already exists.");

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        emailVerifiedAt: emailEnabled() ? null : new Date(),
      },
    });

    await claimUnownedAssignments(user.id);
    await acceptInvitesForEmail(user.id, email);

    if (emailEnabled()) {
      try {
        await sendVerificationEmail({ id: user.id, email: user.email, name: user.name }, appOrigin(request));
      } catch {
        // Account exists; they can resend from the check-email page.
      }
      return NextResponse.json({ ok: true, needsVerification: true });
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the account.";
    return jsonError(message, 500);
  }
}
