import { NextResponse } from "next/server";
import { isOwner, requireCourseAccess, requireUser } from "@/lib/access";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const access = await requireCourseAccess(auth.user.id, id);
  if (access.error) return access.error;
  if (!isOwner(access.member.role)) {
    return jsonError("Only the course owner can delete this course.", 403);
  }
  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
