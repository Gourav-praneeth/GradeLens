import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { SESSION_COOKIE } from "./sessionCookie";

const SESSION_DAYS = 30;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export async function createSession(userId: string, options?: { remember?: boolean }) {
  const token = randomBytes(32).toString("hex");
  const remember = Boolean(options?.remember);
  const expiresAt = new Date(Date.now() + (remember ? SESSION_DAYS : 1) * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  const cookie = await cookies();
  cookie.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    ...(remember ? { expires: expiresAt } : {}),
  });
}

export async function destroySession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return { id: session.user.id, email: session.user.email, name: session.user.name };
}
