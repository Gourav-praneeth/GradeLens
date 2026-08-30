import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function CoursesDashboard({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";

  const memberships = await prisma.courseMember.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: {
          _count: { select: { assignments: true, students: true } },
          members: { include: { user: true } },
        },
      },
    },
    orderBy: { course: { name: "asc" } },
  });

  const visible = memberships.filter((row) => {
    if (!query) return true;
    const hay = `${row.course.name} ${row.course.code ?? ""} ${row.course.semester ?? ""}`.toLowerCase();
    return hay.includes(query);
  });

  return (
    <div className="page-wrap space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-read text-3xl font-semibold tracking-tight">Courses</h1>
          <p className="mt-1 text-sm text-muted">Open a course to grade, manage the roster, and review the gradebook.</p>
        </div>
        <Link href="/courses/new" className="btn btn-primary">
          + Add course
        </Link>
      </div>

      {visible.length === 0 ? (
        <section className="card px-6 py-12">
          <p className="text-lg font-semibold">{query ? "No matching courses" : "No courses yet"}</p>
          <p className="mt-2 text-sm text-muted">
            {query ? "Try another search." : "Create a course, then add staff, a roster, and assignments."}
          </p>
          <div className="mt-5">
            <Link href="/courses/new" className="btn btn-primary">
              + Add course
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((row) => {
            const owner = row.course.members.find((member) => member.role === "owner");
            const published = row.course._count.assignments;
            return (
              <article key={row.course.id} className="card course-card" style={{ ["--course-accent" as string]: row.course.accent }}>
                <div className="course-card-stripe" />
                <div className="flex flex-1 flex-col px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {row.course.code || "No code"}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{row.course.name}</h2>
                  <p className="mt-2 text-sm text-muted">
                    {row.course.semester || "Semester not set"} · {owner?.user.name ?? user.name}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-muted">Students</dt>
                      <dd className="font-mono tabular-nums">{row.course._count.students}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Assignments</dt>
                      <dd className="font-mono tabular-nums">{published}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm">
                    <span className="status">{row.course.status === "archived" ? "Archived" : "Active"}</span>
                    <span className="ml-2 text-muted">{row.role === "owner" ? "Owner" : "TA"}</span>
                  </p>
                  <div className="mt-5">
                    <Link href={`/courses/${row.course.id}`} className="btn btn-primary">
                      Open course
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
