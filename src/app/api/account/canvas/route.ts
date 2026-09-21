import { NextResponse } from "next/server";
import { requireUser } from "@/lib/access";
import {
  canvasCredentialStatus,
  clearCanvasCredentials,
  saveCanvasCredentials,
} from "@/lib/canvasCredentials";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  return NextResponse.json(await canvasCredentialStatus(auth.user.id));
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const body = (await request.json()) as { baseUrl?: string; accessToken?: string };

  try {
    await saveCanvasCredentials(
      auth.user.id,
      String(body.baseUrl ?? ""),
      String(body.accessToken ?? ""),
    );
    return NextResponse.json(await canvasCredentialStatus(auth.user.id));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not validate the Canvas connection.",
    );
  }
}

export async function DELETE() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  await clearCanvasCredentials(auth.user.id);
  return NextResponse.json(await canvasCredentialStatus(auth.user.id));
}
