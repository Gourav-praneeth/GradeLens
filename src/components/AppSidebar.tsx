import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth";
import { SidebarNav } from "./SidebarNav";

export async function AppSidebar({ user }: { user: AuthUser }) {
  const memberships = await prisma.courseMember.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: {
          assignments: {
            orderBy: { createdAt: "desc" },
            select: { id: true, title: true },
          },
        },
      },
    },
    orderBy: { course: { name: "asc" } },
  });

  return (
    <SidebarNav
      user={user}
      courses={memberships.map((row) => ({
        id: row.course.id,
        name: row.course.name,
        code: row.course.code,
        assignments: row.course.assignments,
      }))}
    />
  );
}
