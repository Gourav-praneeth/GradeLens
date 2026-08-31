import { NextResponse } from "next/server";
import { requireUser } from "@/lib/access";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { isSiteOperator } from "@/lib/siteOperator";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  if (!(await isSiteOperator(auth.user))) {
    return jsonError("You cannot update feedback.", 403);
  }

  const { id } = await context.params;
  const body = (await request.json()) as { status?: string };
  const status = body.status === "done" ? "done" : "open";
  const existing = await prisma.feedback.findUnique({ where: { id } });
  if (!existing) return jsonError("Feedback not found.", 404);

  const item = await prisma.feedback.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true, status: item.status });
}
