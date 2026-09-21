import { NextResponse } from "next/server";
import { requireCourseAccess, requireUser } from "@/lib/access";
import { syncCanvasRoster } from "@/lib/canvasSync";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const access = await requireCourseAccess(auth.user.id, id);
  if (access.error) return access.error;

  const body = (await request.json()) as { canvasCourseId?: string };
  const canvasCourseId = String(body.canvasCourseId ?? "").trim();
  if (!canvasCourseId) return jsonError("Enter the Canvas course ID.");

  try {
    return NextResponse.json(
      await syncCanvasRoster(auth.user.id, id, canvasCourseId),
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not sync the Canvas roster.",
    );
  }
}
