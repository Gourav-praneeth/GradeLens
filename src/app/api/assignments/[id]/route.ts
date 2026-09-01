import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await guardAssignment(id);
  if (!access.ok) return access.error;

  await prisma.assignment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
