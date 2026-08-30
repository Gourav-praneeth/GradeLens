import { prisma } from "./db";

export async function claimUnownedAssignments(userId: string) {
  const userCount = await prisma.user.count();
  if (userCount !== 1) return;

  const unowned = await prisma.assignment.findMany({ where: { courseId: null } });
  if (unowned.length === 0) return;

  const groups = new Map<string, string[]>();
  for (const assignment of unowned) {
    const name = assignment.courseLabel?.trim() || "Unfiled";
    const ids = groups.get(name) ?? [];
    ids.push(assignment.id);
    groups.set(name, ids);
  }

  for (const [name, ids] of groups) {
    const course = await prisma.course.create({
      data: {
        name,
        code: name === "Unfiled" ? null : name,
        members: { create: { userId, role: "owner" } },
      },
    });
    await prisma.assignment.updateMany({
      where: { id: { in: ids } },
      data: { courseId: course.id },
    });
  }
}

export async function acceptInvitesForEmail(userId: string, email: string) {
  const invites = await prisma.courseInvite.findMany({ where: { email } });
  for (const invite of invites) {
    await prisma.courseMember.upsert({
      where: { courseId_userId: { courseId: invite.courseId, userId } },
      update: {},
      create: { courseId: invite.courseId, userId, role: invite.role },
    });
    await prisma.courseInvite.delete({ where: { id: invite.id } });
  }
}
