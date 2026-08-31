import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/authEmail";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { isValidEmail, normalizeEmail } from "@/lib/identity";
import { emailEnabled } from "@/lib/mail";
import { appOrigin } from "@/lib/origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!emailEnabled()) {
    return jsonError("Email is not configured on this server.");
  }

  const body = (await request.json()) as { email?: string };
  const email = normalizeEmail(String(body.email ?? ""));
  if (!isValidEmail(email)) {
    return jsonError("Enter a valid email address.");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerifiedAt) {
    try {
      await sendVerificationEmail({ id: user.id, email: user.email, name: user.name }, appOrigin(request));
    } catch {
      return jsonError("Could not send email. Try again in a minute.", 500);
    }
  }

  return NextResponse.json({ ok: true });
}
