import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCourseMembership } from "@/lib/access";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function CourseOverviewPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const member = await getCourseMembership(user.id, id);
  if (!member) notFound();

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      students: true,
      assignments: {
        include: {
          rubric: true,
          submissions: { include: { gradeResult: true } },
        },
      },
    },
  });
  if (!course) notFound();

  const pending = course.assignments.reduce(
    (sum, assignment) => sum + assignment.submissions.filter((item) => !item.gradeResult && item.extractedText.trim()).length,
    0,
  );
  const submissions = course.assignments.reduce((sum, assignment) => sum + assignment.submissions.length, 0);
  const graded = course.assignments.reduce(
    (sum, assignment) => sum + assignment.submissions.filter((item) => item.gradeResult).length,
    0,
  );
  const rate = submissions === 0 ? null : Math.round((graded / submissions) * 100);
  const recent = [...course.assignments]
    .flatMap((assignment) =>
      assignment.submissions.map((submission) => ({
        at: submission.createdAt,
        text: `${submission.studentLabel} submitted ${assignment.title}`,
      })),
    )
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{course.code || "Course"}</p>
        <h1 className="mt-1 font-read text-3xl font-semibold tracking-tight">{course.name}</h1>
        <p className="mt-1 text-sm text-muted">{course.semester || "Semester not set"} · {course.description || "No description yet."}</p>
      </div>

      <div className="stat-grid">
        <article className="card px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Students</p>
          <p className="mt-1 font-mono text-2xl tabular-nums text-mark">{course.students.length}</p>
        </article>
        <article className="card px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Assignments to grade</p>
          <p className="mt-1 font-mono text-2xl tabular-nums text-mark">{pending}</p>
        </article>
        <article className="card px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Active assignments</p>
          <p className="mt-1 font-mono text-2xl tabular-nums text-mark">{course.assignments.length}</p>
        </article>
        <article className="card px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Graded rate</p>
          <p className="mt-1 font-mono text-2xl tabular-nums text-mark">{rate == null ? "—" : `${rate}%`}</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="card px-5 py-5">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No submissions yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {recent.map((item) => (
                <li key={`${item.at.toISOString()}-${item.text}`}>{item.text}</li>
              ))}
            </ul>
          )}
        </section>
        <section className="card px-5 py-5">
          <h2 className="text-sm font-semibold">Quick actions</h2>
          <div className="mt-4 flex flex-col gap-2">
            <Link href={`/assignments/new?courseId=${course.id}`} className="btn btn-primary">
              Create assignment
            </Link>
            <Link href={`/courses/${course.id}/roster`} className="btn btn-ghost">
              View roster
            </Link>
            <Link href={`/courses/${course.id}/assignments`} className="btn btn-ghost">
              Review submissions
            </Link>
            <Link href={`/courses/${course.id}/staff`} className="btn btn-ghost">
              Add teaching staff
            </Link>
            <p className="text-xs text-muted">Announcements will arrive in a later release.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
