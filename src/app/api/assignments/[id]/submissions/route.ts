import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { prisma } from "@/lib/db";
import { extractDocument } from "@/lib/extract";
import { labelFromFilename, saveUpload } from "@/lib/files";
import { jsonError } from "@/lib/http";
import { matchRosterStudent } from "@/lib/roster";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await guardAssignment(id);
  if (!access.ok) return access.error;
  if (!access.assignment.courseId) {
    return jsonError("This assignment is not in a course yet.", 403);
  }

  try {
    const form = await request.formData();
    const files = form.getAll("files").filter((item): item is File => item instanceof File);
    if (files.length === 0) {
      return jsonError("Choose one or more PDF or text files.");
    }

    const roster = await prisma.student.findMany({
      where: { courseId: access.assignment.courseId },
    });
    const selectedId = String(form.get("studentId") ?? "").trim();
    const selected = roster.find((student) => student.id === selectedId) ?? null;
    const labelOverride = String(form.get("studentLabel") ?? "").trim();

    const created = [];
    const warnings: string[] = [];

    for (const file of files) {
      if (file.size === 0) continue;
      if (file.size > 10 * 1024 * 1024) {
        warnings.push(`${file.name} is larger than 10 MB and was skipped.`);
        continue;
      }

      const bytes = new Uint8Array((await file.arrayBuffer()).slice(0));
      let extracted;
      try {
        extracted = await extractDocument(file.name, bytes);
      } catch (error) {
        warnings.push(error instanceof Error ? error.message : `${file.name} could not be read.`);
        continue;
      }

      const storedPath = await saveUpload(id, file.name, bytes);
      const fromFile = labelFromFilename(file.name);
      const student =
        files.length === 1 && selected
          ? selected
          : matchRosterStudent(labelOverride || fromFile, roster);
      const studentLabel =
        student?.name ?? (files.length === 1 ? labelOverride || fromFile : fromFile);

      const submission = await prisma.submission.create({
        data: {
          assignmentId: id,
          studentId: student?.id ?? null,
          studentLabel,
          originalName: file.name,
          storedPath,
          extractedText: extracted.text,
          extractWarning: extracted.warning,
        },
      });
      created.push(submission);
      if (extracted.warning) {
        warnings.push(`${file.name}: ${extracted.warning}`);
      }
    }

    if (created.length === 0) {
      return jsonError(warnings[0] ?? "No submissions were added.");
    }

    return NextResponse.json({ count: created.length, warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload submissions.";
    return jsonError(message, 500);
  }
}
