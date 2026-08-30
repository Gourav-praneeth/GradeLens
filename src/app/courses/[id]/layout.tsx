import { notFound } from "next/navigation";
import { CourseWorkspace } from "@/components/CourseWorkspace";
import { getCurrentUser } from "@/lib/auth";
import { getCourseMembership } from "@/lib/access";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const member = await getCourseMembership(user.id, id);
  if (!member) notFound();
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  return (
    <CourseWorkspace
      course={{ id: course.id, name: course.name, code: course.code, accent: course.accent }}
    >
      {children}
    </CourseWorkspace>
  );
}
