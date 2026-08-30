import Link from "next/link";
import { redirect } from "next/navigation";
import { AssignmentForm } from "@/components/AssignmentForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ courseId?: string }> };

export default async function NewAssignmentPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { courseId } = await searchParams;

  const memberships = await prisma.courseMember.findMany({
    where: { userId: user.id },
    include: { course: true },
    orderBy: { course: { name: "asc" } },
  });
  const courses = memberships.map((row) => ({
    id: row.course.id,
    name: row.course.name,
    code: row.course.code,
  }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-ink hover:underline">
          Assignments
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New assignment</h1>
        <p className="mt-1 text-sm text-muted">Choose a course, then add questions and official solutions.</p>
      </div>
      {courses.length === 0 ? (
        <section className="card px-5 py-8">
          <p className="font-semibold">Create a course first</p>
          <p className="mt-2 text-sm text-muted">Assignments belong to a course so TAs and the roster stay together.</p>
          <div className="mt-4">
            <Link href="/courses/new" className="btn btn-primary">
              New course
            </Link>
          </div>
        </section>
      ) : (
        <section className="card px-5 py-6 sm:px-8 sm:py-8">
          <AssignmentForm courses={courses} defaultCourseId={courseId} />
        </section>
      )}
    </div>
  );
}
