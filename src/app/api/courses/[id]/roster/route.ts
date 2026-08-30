import { NextResponse } from "next/server";
import { requireCourseAccess, requireUser } from "@/lib/access";
import { csvRow } from "@/lib/csv";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const access = await requireCourseAccess(auth.user.id, id);
  if (access.error) return access.error;

  const students = await prisma.student.findMany({ where: { courseId: id }, orderBy: { name: "asc" } });
  const csv = [csvRow(["Name", "Student ID", "Email"]), ...students.map((student) => csvRow([student.name, student.studentNumber, student.email]))].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="roster.csv"',
    },
  });
}
