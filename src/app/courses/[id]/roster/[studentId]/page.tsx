import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCourseMembership } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatScore } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string; studentId: string }> };

export default async function StudentProfilePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id, studentId } = await params;
  if (!(await getCourseMembership(user.id, id))) notFound();

  const student = await prisma.student.findFirst({
    where: { id: studentId, courseId: id },
    include: {
      course: { include: { assignments: { include: { rubric: { include: { criteria: true } } } } } },
      submissions: { include: { assignment: true, gradeResult: true } },
    },
  });
  if (!student) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/courses/${id}/roster`} className="text-sm text-muted hover:underline">
          Roster
        </Link>
        <h1 className="mt-2 font-read text-3xl font-semibold tracking-tight">{student.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {student.studentNumber || "No student ID"} · {student.email || "No email"} · Enrolled
        </p>
      </div>
      <section className="card overflow-hidden">
        <div className="gradebook">
          <table>
            <thead>
              <tr>
                <th>Assignment</th>
                <th>File</th>
                <th>Status</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {student.course.assignments.map((assignment) => {
                const submission = student.submissions.find((item) => item.assignmentId === assignment.id);
                return (
                  <tr key={assignment.id}>
                    <td>{assignment.title}</td>
                    <td>
                      {submission ? (
                        <Link href={`/assignments/${assignment.id}/submissions/${submission.id}`} className="hover:underline">
                          {submission.originalName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{submission?.status ?? "Missing"}</td>
                    <td className="font-mono tabular-nums">
                      {submission?.gradeResult
                        ? formatScore(submission.gradeResult.totalAwarded, submission.gradeResult.totalPossible)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
