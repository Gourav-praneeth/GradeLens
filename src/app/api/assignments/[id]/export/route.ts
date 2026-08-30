import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { buildRosterCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { buildCanvasCsv, buildGradescopeCsv, exportFilename, parseExportFormat } from "@/lib/lmsExport";
import { studentDisplayName } from "@/lib/roster";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await guardAssignment(id);
  if (!access.ok) return access.error;

  const format = parseExportFormat(new URL(request.url).searchParams.get("format"));

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      rubric: { include: { criteria: { orderBy: { sortOrder: "asc" } } } },
      submissions: {
        orderBy: { createdAt: "asc" },
        include: {
          student: true,
          gradeResult: { include: { scores: true } },
        },
      },
    },
  });

  if (!assignment) {
    return jsonError("Assignment not found.", 404);
  }

  const criteria = assignment.rubric?.criteria ?? [];
  const possible = criteria.reduce((sum, row) => sum + row.maxPoints, 0);
  const rows = assignment.submissions.map((submission) => ({
    name: studentDisplayName(submission),
    email: submission.student?.email ?? null,
    awarded: submission.gradeResult?.totalAwarded ?? null,
    possible: submission.gradeResult?.totalPossible ?? possible,
    status: submission.status,
  }));

  let csv: string;
  if (format === "canvas") {
    csv = buildCanvasCsv(assignment.title, possible, rows);
  } else if (format === "gradescope") {
    csv = buildGradescopeCsv(rows);
  } else {
    csv = buildRosterCsv(
      criteria.map((criterion) => ({ id: criterion.id, label: criterion.label })),
      assignment.submissions.map((submission) => ({
        studentLabel: studentDisplayName(submission),
        originalName: submission.originalName,
        status: submission.status,
        awarded: submission.gradeResult?.totalAwarded ?? null,
        possible: submission.gradeResult?.totalPossible ?? null,
        scores: submission.gradeResult?.scores ?? [],
      })),
    );
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(assignment.title, format)}"`,
    },
  });
}
