import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { isValidEmail, normalizeEmail } from "@/lib/identity";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string; remember?: boolean };
  const email = normalizeEmail(String(body.email ?? ""));
  const password = String(body.password ?? "");

  if (!isValidEmail(email) || !password) {
    return jsonError("Enter your email and password.");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError("Email or password is incorrect.");
  }

  await createSession(user.id, { remember: Boolean(body.remember) });
  return NextResponse.json({ ok: true });
}
