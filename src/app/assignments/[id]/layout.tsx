import { notFound } from "next/navigation";
import { CourseWorkspace } from "@/components/CourseWorkspace";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requirePageAssignment } from "@/lib/pageAuth";
import { isSiteOperator } from "@/lib/siteOperator";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AssignmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  await requirePageAssignment(id, user.id);
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!assignment?.course) notFound();
  const isAdmin = await isSiteOperator(user);

  return (
    <CourseWorkspace
      course={{
        id: assignment.course.id,
        name: assignment.course.name,
        code: assignment.course.code,
        accent: assignment.course.accent,
      }}
      isAdmin={isAdmin}
    >
      {children}
    </CourseWorkspace>
  );
}
