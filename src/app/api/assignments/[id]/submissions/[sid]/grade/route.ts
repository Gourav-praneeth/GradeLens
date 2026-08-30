import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { prisma } from "@/lib/db";
import { runGrading } from "@/lib/grading";
import { llmUserMessage } from "@/lib/errors";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string; sid: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id, sid } = await context.params;
  const access = await guardAssignment(id);
  if (!access.ok) return access.error;
  const submission = await prisma.submission.findFirst({
    where: { id: sid, assignmentId: id },
  });
  if (!submission) {
    return jsonError("Submission not found.", 404);
  }

  try {
    await runGrading(sid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = llmUserMessage(error);
    return jsonError(message, 500);
  }
}
