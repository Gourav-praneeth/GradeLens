import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ImportRosterForm, RemoveStudentButton, StudentRosterForm } from "@/components/RosterForms";
import { getCourseMembership } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; sort?: string }> };

export default async function RosterPage({ params, searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!(await getCourseMembership(user.id, id))) notFound();
  const { q, sort } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      assignments: { include: { submissions: { include: { gradeResult: true } } } },
      students: { include: { submissions: { include: { gradeResult: true } } } },
    },
  });
  if (!course) notFound();

  let students = course.students.filter((student) => {
    if (!query) return true;
    return `${student.name} ${student.email ?? ""} ${student.studentNumber ?? ""}`.toLowerCase().includes(query);
  });
  if (sort === "id") students = [...students].sort((a, b) => (a.studentNumber ?? "").localeCompare(b.studentNumber ?? ""));
  else students = [...students].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-read text-3xl font-semibold tracking-tight">Roster</h1>
          <p className="mt-1 text-sm text-muted">{course.students.length} enrolled</p>
        </div>
        <a href={`/api/courses/${course.id}/roster`} className="btn btn-ghost">
          Export roster
        </a>
      </div>

      <form className="flex flex-wrap gap-3">
        <input className="field max-w-xs" name="q" defaultValue={q} placeholder="Search students" />
        <select className="field max-w-40" name="sort" defaultValue={sort ?? "name"}>
          <option value="name">Sort by name</option>
          <option value="id">Sort by student ID</option>
        </select>
        <button className="btn btn-ghost" type="submit">
          Apply
        </button>
      </form>

      <section className="card px-5 py-5">
        <h2 className="text-sm font-semibold">Add student</h2>
        <div className="mt-3">
          <StudentRosterForm courseId={course.id} />
        </div>
      </section>
      <section className="card px-5 py-5">
        <h2 className="text-sm font-semibold">Import</h2>
        <div className="mt-3">
          <ImportRosterForm courseId={course.id} />
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="gradebook">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Email</th>
                <th>Status</th>
                <th>Submissions</th>
                <th>Overall</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const graded = student.submissions.filter((item) => item.gradeResult);
                const overall =
                  graded.length === 0
                    ? null
                    : graded.reduce((sum, item) => {
                        const possible = item.gradeResult?.totalPossible || 1;
                        return sum + (item.gradeResult!.totalAwarded / possible) * 100;
                      }, 0) / graded.length;
                return (
                  <tr key={student.id}>
                    <td>
                      <Link href={`/courses/${course.id}/roster/${student.id}`} className="font-semibold hover:underline">
                        {student.name}
                      </Link>
                    </td>
                    <td>{student.studentNumber || "—"}</td>
                    <td>{student.email || "—"}</td>
                    <td>Enrolled</td>
                    <td className="font-mono tabular-nums">
                      {student.submissions.length}/{course.assignments.length}
                    </td>
                    <td className="font-mono tabular-nums">{overall == null ? "—" : `${formatPoints(overall)}%`}</td>
                    <td>
                      <RemoveStudentButton courseId={course.id} studentId={student.id} />
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
