import { NextResponse } from "next/server";
import { guardAssignment } from "@/lib/access";
import { prisma } from "@/lib/db";
import { deleteUploads } from "@/lib/files";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await guardAssignment(id);
  if (!access.ok) return access.error;

  const uploads = await prisma.submission.findMany({
    where: { assignmentId: id },
    select: { storedPath: true },
  });
  try {
    await deleteUploads(uploads.map((upload) => upload.storedPath));
  } catch {
    return jsonError("Could not remove the assignment files. Try again.", 503);
  }
  await prisma.assignment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
