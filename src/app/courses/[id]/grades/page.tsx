import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCourseMembership } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function GradebookPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!(await getCourseMembership(user.id, id))) notFound();

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      students: { orderBy: { name: "asc" }, include: { submissions: { include: { gradeResult: true } } } },
      assignments: { orderBy: { createdAt: "asc" }, include: { rubric: { include: { criteria: true } } } },
    },
  });
  if (!course) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-read text-3xl font-semibold tracking-tight">Grades</h1>
        <p className="mt-1 text-sm text-muted">Rows are students. Columns are assignments.</p>
      </div>
      <section className="card overflow-hidden">
        {course.students.length === 0 || course.assignments.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted">Add a roster and at least one assignment to fill the gradebook.</p>
        ) : (
          <div className="gradebook">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  {course.assignments.map((assignment) => (
                    <th key={assignment.id}>
                      <Link href={`/assignments/${assignment.id}`}>{assignment.title}</Link>
                    </th>
                  ))}
                  <th>Overall</th>
                </tr>
              </thead>
              <tbody>
                {course.students.map((student) => {
                  const cells = course.assignments.map((assignment) => {
                    const submission = student.submissions.find((item) => item.assignmentId === assignment.id);
                    return submission?.gradeResult
                      ? formatPoints(submission.gradeResult.totalAwarded)
                      : "—";
                  });
                  const graded = student.submissions.filter((item) => item.gradeResult);
                  const overall =
                    graded.length === 0
                      ? "—"
                      : `${formatPoints(
                          graded.reduce((sum, item) => sum + item.gradeResult!.totalAwarded / (item.gradeResult!.totalPossible || 1), 0) /
                            graded.length *
                            100,
                        )}%`;
                  return (
                    <tr key={student.id}>
                      <td>
                        <Link href={`/courses/${course.id}/roster/${student.id}`} className="font-semibold hover:underline">
                          {student.name}
                        </Link>
                      </td>
                      {cells.map((cell, index) => (
                        <td key={course.assignments[index].id} className="font-mono tabular-nums">
                          {cell}
                        </td>
                      ))}
                      <td className="font-mono tabular-nums">{overall}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
