import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { prisma } from "@/lib/db";
import { extractDocument } from "@/lib/extract";
import { labelFromFilename, saveUpload } from "@/lib/files";
import { jsonError } from "@/lib/http";
import { matchSubmissionToRoster } from "@/lib/roster";
import { normalizeFilename, parseSubmissionManifest } from "@/lib/submissionManifest";

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
    const manifestFile = form.get("manifest");
    let manifest = new Map();
    if (manifestFile instanceof File && manifestFile.size > 0) {
      try {
        manifest = parseSubmissionManifest(await manifestFile.text());
      } catch (error) {
        return jsonError(
          error instanceof Error ? error.message : "Could not read the submission manifest.",
        );
      }
    }

    const roster = await prisma.student.findMany({
      where: {
        courseId: access.assignment.courseId,
        enrollmentStatus: { not: "inactive" },
      },
    });
    const selectedId = String(form.get("studentId") ?? "").trim();
    const selected = roster.find((student) => student.id === selectedId) ?? null;
    const labelOverride = String(form.get("studentLabel") ?? "").trim();
    const existing = await prisma.submission.findMany({
      where: { assignmentId: id },
      select: { studentId: true, originalName: true },
    });
    const usedStudentIds = new Set(
      existing.flatMap((submission) => (submission.studentId ? [submission.studentId] : [])),
    );
    const usedFilenames = new Set(
      existing.map((submission) => normalizeFilename(submission.originalName)),
    );

    const created = [];
    const warnings: string[] = [];
    let matched = 0;
    let ambiguous = 0;
    let unmatched = 0;
    let duplicates = 0;
    let rejected = 0;

    for (const file of files) {
      if (file.size === 0) continue;
      if (file.size > 10 * 1024 * 1024) {
        warnings.push(`${file.name} is larger than 10 MB and was skipped.`);
        rejected += 1;
        continue;
      }
      if (usedFilenames.has(normalizeFilename(file.name))) {
        warnings.push(`${file.name} was already uploaded and was skipped.`);
        duplicates += 1;
        continue;
      }

      const bytes = new Uint8Array((await file.arrayBuffer()).slice(0));
      let extracted;
      try {
        extracted = await extractDocument(file.name, bytes);
      } catch (error) {
        warnings.push(error instanceof Error ? error.message : `${file.name} could not be read.`);
        rejected += 1;
        continue;
      }

      const fromFile = labelFromFilename(file.name);
      const match =
        files.length === 1 && selected
          ? { status: "matched" as const, student: selected, method: "manual" }
          : matchSubmissionToRoster(
              {
                filename: files.length === 1 && labelOverride ? labelOverride : file.name,
                explicit: manifest.get(normalizeFilename(file.name)),
              },
              roster,
            );
      const student = match.status === "matched" ? match.student : null;
      if (student && usedStudentIds.has(student.id)) {
        warnings.push(`${file.name} maps to ${student.name}, who already has a submission.`);
        duplicates += 1;
        continue;
      }

      const storedPath = await saveUpload(id, file.name, bytes);
      const matchStatus = match.status;
      const submission = await prisma.submission.create({
        data: {
          assignmentId: id,
          studentId: student?.id ?? null,
          studentLabel: student?.name ?? fromFile,
          originalName: file.name,
          storedPath,
          extractedText: extracted.text,
          extractWarning: extracted.warning,
          source: "upload",
          matchStatus,
          matchMethod: match.status === "unmatched" ? null : match.method,
        },
      });
      created.push(submission);
      usedFilenames.add(normalizeFilename(file.name));
      if (student) {
        usedStudentIds.add(student.id);
        matched += 1;
      } else if (matchStatus === "ambiguous") {
        ambiguous += 1;
      } else {
        unmatched += 1;
      }
      if (extracted.warning) {
        warnings.push(`${file.name}: ${extracted.warning}`);
      }
    }

    const result = {
      count: created.length,
      matched,
      ambiguous,
      unmatched,
      duplicates,
      rejected,
      warnings,
    };
    if (created.length === 0 && duplicates > 0) {
      return NextResponse.json(result);
    }
    if (created.length === 0) {
      return jsonError(warnings[0] ?? "No submissions were added.");
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload submissions.";
    return jsonError(message, 500);
  }
}
