import { NextResponse } from "next/server";
import { requireUser } from "@/lib/access";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { isSiteOperator } from "@/lib/siteOperator";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  if (!(await isSiteOperator(auth.user))) {
    return jsonError("You cannot view feedback.", 403);
  }

  const items = await prisma.feedback.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = (await request.json()) as { message?: string; page?: string };
  const message = String(body.message ?? "").trim();
  const page = String(body.page ?? "").trim().slice(0, 200);
  if (message.length < 10) return jsonError("Write a bit more about what happened (at least 10 characters).");
  if (message.length > 4000) return jsonError("Keep feedback under 4,000 characters.");

  await prisma.feedback.create({
    data: { userId: auth.user.id, message, page },
  });
  return NextResponse.json({ ok: true });
}
