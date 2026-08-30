import { NextResponse } from "next/server";
import { requireCourseAccess, requireUser } from "@/lib/access";
import { prisma } from "@/lib/db";
import { extractDocument } from "@/lib/extract";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

async function textFromField(
  form: FormData,
  textKey: string,
  fileKey: string,
): Promise<{ text: string; warning: string | null }> {
  const pasted = String(form.get(textKey) ?? "").trim();
  const file = form.get(fileKey);

  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`${file.name} is larger than 10 MB.`);
    }
    const bytes = new Uint8Array((await file.arrayBuffer()).slice(0));
    const extracted = await extractDocument(file.name, bytes);
    const text = [pasted, extracted.text].filter(Boolean).join("\n\n");
    return { text, warning: extracted.warning };
  }

  return { text: pasted, warning: null };
}

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const assignments = await prisma.assignment.findMany({
    where: { course: { members: { some: { userId: auth.user.id } } } },
    orderBy: { createdAt: "desc" },
    include: {
      course: true,
      rubric: { include: { _count: { select: { criteria: true } } } },
      _count: { select: { submissions: true } },
    },
  });
  return NextResponse.json(assignments);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const form = await request.formData();
    const title = String(form.get("title") ?? "").trim();
    const courseId = String(form.get("courseId") ?? "").trim();

    if (!title) {
      return jsonError("Give the assignment a title.");
    }
    if (!courseId) {
      return jsonError("Choose a course.");
    }

    const access = await requireCourseAccess(auth.user.id, courseId);
    if (access.error) return access.error;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return jsonError("Course not found.", 404);
    }

    const questions = await textFromField(form, "questionsText", "questionsFile");
    const solutions = await textFromField(form, "solutionsText", "solutionsFile");

    if (!questions.text) {
      return jsonError(questions.warning ?? "Add the assignment questions as text or a PDF.");
    }
    if (!solutions.text) {
      return jsonError(solutions.warning ?? "Add the official solutions as text or a PDF.");
    }

    const dueRaw = String(form.get("dueAt") ?? "").trim();
    const dueAt = dueRaw ? new Date(dueRaw) : null;
    const description = String(form.get("description") ?? "").trim();

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
        courseId: course.id,
        courseLabel: course.code || course.name,
        questionsText: questions.text,
        solutionsText: solutions.text,
      },
    });

    return NextResponse.json({
      id: assignment.id,
      warning: questions.warning || solutions.warning,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the assignment.";
    return jsonError(message, 500);
  }
}
