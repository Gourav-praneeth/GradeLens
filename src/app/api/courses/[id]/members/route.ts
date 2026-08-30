import { NextResponse } from "next/server";
import { isOwner, requireCourseAccess, requireUser } from "@/lib/access";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { isValidEmail, normalizeEmail } from "@/lib/identity";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const access = await requireCourseAccess(auth.user.id, id);
  if (access.error) return access.error;
  if (!isOwner(access.member.role)) {
    return jsonError("Only the course owner can add TAs.", 403);
  }

  const body = (await request.json()) as { email?: string };
  const email = normalizeEmail(String(body.email ?? ""));
  if (!isValidEmail(email)) return jsonError("Enter a valid email address.");
  if (email === auth.user.email) return jsonError("You already own this course.");

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await prisma.courseMember.upsert({
      where: { courseId_userId: { courseId: id, userId: existingUser.id } },
      update: {},
      create: { courseId: id, userId: existingUser.id, role: "ta" },
    });
    return NextResponse.json({ ok: true, status: "added" });
  }

  await prisma.courseInvite.upsert({
    where: { courseId_email: { courseId: id, email } },
    update: {},
    create: { courseId: id, email, role: "ta" },
  });
  return NextResponse.json({ ok: true, status: "invited" });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const access = await requireCourseAccess(auth.user.id, id);
  if (access.error) return access.error;
  if (!isOwner(access.member.role)) {
    return jsonError("Only the course owner can remove TAs.", 403);
  }

  const body = (await request.json()) as { memberId?: string; inviteId?: string };
  if (body.inviteId) {
    await prisma.courseInvite.deleteMany({ where: { id: body.inviteId, courseId: id } });
    return NextResponse.json({ ok: true });
  }

  const member = await prisma.courseMember.findFirst({
    where: { id: String(body.memberId ?? ""), courseId: id },
  });
  if (!member) return jsonError("Member not found.", 404);
  if (member.role === "owner") return jsonError("The course owner cannot be removed.");
  await prisma.courseMember.delete({ where: { id: member.id } });
  return NextResponse.json({ ok: true });
}
