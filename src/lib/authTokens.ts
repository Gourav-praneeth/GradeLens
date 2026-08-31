import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./db";

export type AuthTokenType = "verify" | "reset";

export const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;
export const RESET_TTL_MS = 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueAuthToken(userId: string, type: AuthTokenType, ttlMs: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.authToken.deleteMany({ where: { userId, type, consumedAt: null } });
  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + ttlMs),
    },
  });
  return token;
}

export async function consumeAuthToken(token: string, type: AuthTokenType) {
  const tokenHash = hashToken(token.trim());
  const row = await prisma.authToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!row || row.type !== type || row.consumedAt || row.expiresAt < new Date()) {
    return null;
  }
  await prisma.authToken.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
  return row.user;
}
