import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { jsonError } from "@/lib/http";
import { replaceRubric } from "@/lib/rubric";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

type CriterionInput = {
  label?: string;
  maxPoints?: number;
  fullCreditDescription?: string;
};

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await guardAssignment(id);
  if (!access.ok) return access.error;

  const body = (await request.json()) as { criteria?: CriterionInput[] };
  const rows = Array.isArray(body.criteria) ? body.criteria : [];
  const criteria = rows.flatMap((row) => {
    const label = String(row.label ?? "").trim();
    const maxPoints = Number(row.maxPoints);
    const fullCreditDescription = String(row.fullCreditDescription ?? "").trim();
    if (!label || !fullCreditDescription || !Number.isFinite(maxPoints) || maxPoints <= 0) {
      return [];
    }
    return [{ label, maxPoints, fullCreditDescription }];
  });

  if (criteria.length === 0) {
    return jsonError("Add at least one criterion with a label, points, and full-credit description.");
  }

  await replaceRubric(id, criteria);
  return NextResponse.json({ ok: true });
}
