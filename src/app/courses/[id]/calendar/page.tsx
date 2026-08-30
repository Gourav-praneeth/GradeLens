import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCourseMembership } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDue } from "@/lib/display";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function CalendarPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!(await getCourseMembership(user.id, id))) notFound();
  const course = await prisma.course.findUnique({
    where: { id },
    include: { assignments: { orderBy: { dueAt: "asc" } } },
  });
  if (!course) notFound();

  return (
    <div className="space-y-5">
      <h1 className="font-read text-3xl font-semibold tracking-tight">Calendar</h1>
      <section className="card overflow-hidden">
        {course.assignments.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted">No assignments to place on the calendar.</p>
        ) : (
          <ul>
            {course.assignments.map((assignment) => (
              <li key={assignment.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4 last:border-b-0">
                <Link href={`/assignments/${assignment.id}`} className="font-semibold hover:underline">
                  {assignment.title}
                </Link>
                <p className="text-sm text-muted">{formatDue(assignment.dueAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
