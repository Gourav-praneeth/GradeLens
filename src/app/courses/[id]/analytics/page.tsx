import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCourseMembership } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { scoreDistribution } from "@/lib/consistency";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AnalyticsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!(await getCourseMembership(user.id, id))) notFound();
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { submissions: { include: { gradeResult: true } } },
      },
    },
  });
  if (!course) notFound();

  const totals = course.assignments.flatMap((assignment) =>
    assignment.submissions
      .filter((item) => item.gradeResult)
      .map((item) => ({ awarded: item.gradeResult!.totalAwarded, possible: item.gradeResult!.totalPossible })),
  );
  const bands = scoreDistribution(totals);

  return (
    <div className="space-y-5">
      <h1 className="font-read text-3xl font-semibold tracking-tight">Analytics</h1>
      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold">Score distribution</h2>
        </div>
        <ul className="grid sm:grid-cols-4">
          {bands.map((band) => (
            <li key={band.label} className="border-b border-line px-5 py-4 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <p className="text-xs font-semibold text-muted">{band.label}</p>
              <p className="mt-1 font-mono text-xl tabular-nums text-mark">{band.count}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="card px-5 py-5">
        <h2 className="text-sm font-semibold">Per-assignment review</h2>
        <ul className="mt-3 space-y-2">
          {course.assignments.map((assignment) => (
            <li key={assignment.id}>
              <Link href={`/assignments/${assignment.id}/review`} className="hover:underline">
                {assignment.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
