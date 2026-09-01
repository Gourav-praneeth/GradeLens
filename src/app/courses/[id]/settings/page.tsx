import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CourseForm } from "@/components/CourseForm";
import { getCourseMembership, isOwner } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function CourseSettingsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const member = await getCourseMembership(user.id, id);
  if (!member) notFound();
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  return (
    <div className="space-y-5">
      <h1 className="font-read text-3xl font-semibold tracking-tight">Course settings</h1>
      {isOwner(member.role) ? (
        <section className="card px-5 py-6">
          <CourseForm
            courseId={course.id}
            initial={{
              name: course.name,
              code: course.code,
              semester: course.semester,
              description: course.description,
              accent: course.accent,
              status: course.status,
            }}
          />
        </section>
      ) : (
        <p className="text-sm text-muted">Only the course instructor can change course settings.</p>
      )}
      <section className="card px-5 py-6">
        <h2 className="font-semibold">Grading API key</h2>
        <p className="mt-2 text-sm text-muted">
          Each instructor and TA uses their own Groq, OpenAI, or Anthropic key. It is saved on your account,
          not on this course.
        </p>
        <Link href="/account#grading-key" className="mt-4 inline-block text-sm underline">
          Open account settings
        </Link>
      </section>
    </div>
  );
}
