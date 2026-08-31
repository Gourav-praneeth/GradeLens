import { NextResponse } from "next/server";
import { consumeAuthToken } from "@/lib/authTokens";
import { jsonError } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string; password?: string };
  const token = String(body.token ?? "").trim();
  const password = String(body.password ?? "");
  if (!token) return jsonError("This reset link is missing or incomplete.");
  if (password.length < 8) return jsonError("Use a password with at least 8 characters.");

  const user = await consumeAuthToken(token, "reset");
  if (!user) return jsonError("This reset link is invalid or has expired.");

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
