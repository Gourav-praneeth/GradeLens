import { prisma } from "./db";
import type { AuthUser } from "./auth";
import { normalizeEmail } from "./identity";

export function isFeedbackAdminEmail(userEmail: string, adminEmail?: string | null): boolean {
  const expected = adminEmail?.trim();
  if (!expected) return false;
  return normalizeEmail(userEmail) === normalizeEmail(expected);
}

export async function isSiteOperator(user: AuthUser): Promise<boolean> {
  if (isFeedbackAdminEmail(user.email, process.env.FEEDBACK_ADMIN_EMAIL)) return true;
  const first = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return first?.id === user.id;
}
