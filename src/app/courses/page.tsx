import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await prisma.courseMember.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: { _count: { select: { assignments: true, students: true } } },
      },
    },
    orderBy: { course: { name: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="mt-1 text-sm text-muted">Each course has a roster, assignments, and optional TAs.</p>
        </div>
        <Link href="/courses/new" className="btn btn-primary">
          New course
        </Link>
      </div>

      {memberships.length === 0 ? (
        <section className="card px-6 py-12">
          <p className="text-lg font-semibold">No courses yet</p>
          <p className="mt-2 text-sm text-muted">Create a course, add the student roster, then file assignments.</p>
          <div className="mt-5">
            <Link href="/courses/new" className="btn btn-primary">
              New course
            </Link>
          </div>
        </section>
      ) : (
        <section className="card overflow-hidden">
          <ul>
            {memberships.map((row) => (
              <li key={row.course.id} className="border-b border-line last:border-b-0">
                <Link href={`/courses/${row.course.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-canvas">
                  <div>
                    <p className="font-semibold">{row.course.name}</p>
                    <p className="text-sm text-muted">
                      {row.course.code || "No code"} · {row.role === "owner" ? "Owner" : "TA"}
                    </p>
                  </div>
                  <p className="text-sm text-muted">
                    {row.course._count.assignments} assignments · {row.course._count.students} students
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
