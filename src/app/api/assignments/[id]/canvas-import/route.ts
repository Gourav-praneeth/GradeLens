import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { importCanvasSubmissions } from "@/lib/canvasSubmissionImport";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 120;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await guardAssignment(id);
  if (!access.ok) return access.error;
  const body = (await request.json()) as { canvasAssignmentId?: string };
  const canvasAssignmentId = String(body.canvasAssignmentId ?? "").trim();
  if (!canvasAssignmentId) return jsonError("Enter the Canvas assignment ID.");

  try {
    return NextResponse.json(
      await importCanvasSubmissions(access.user.id, id, canvasAssignmentId),
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not import Canvas submissions.",
    );
  }
}
