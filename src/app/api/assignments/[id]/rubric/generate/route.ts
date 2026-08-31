import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { generateRubric } from "@/lib/llm";
import { resolveLlmCredentials } from "@/lib/llmKeys";
import { replaceRubric } from "@/lib/rubric";
import { llmUserMessage } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await guardAssignment(id);
  if (!access.ok) return access.error;
  const assignment = access.assignment;

  try {
    const credentials = await resolveLlmCredentials(access.user.id);
    const criteria = await generateRubric(
      {
        title: assignment.title,
        questionsText: assignment.questionsText,
        solutionsText: assignment.solutionsText,
      },
      credentials,
    );
    await replaceRubric(id, criteria);
    const rubric = await prisma.rubric.findUnique({
      where: { assignmentId: id },
      include: { criteria: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json({
      ok: true,
      criteria: rubric?.criteria ?? [],
    });
  } catch (error) {
    const message = llmUserMessage(error);
    return jsonError(message, 500);
  }
}
