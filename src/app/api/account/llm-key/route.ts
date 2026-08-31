import { NextResponse } from "next/server";
import { requireUser } from "@/lib/access";
import { jsonError } from "@/lib/http";
import { clearUserLlmKey, llmKeyStatus, saveUserLlmKey } from "@/lib/llmKeys";
import { parseLlmProvider } from "@/lib/llmProviders";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  return NextResponse.json(await llmKeyStatus(auth.user.id));
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = (await request.json()) as { provider?: string; apiKey?: string };
  const provider = parseLlmProvider(body.provider);
  const apiKey = String(body.apiKey ?? "").trim();
  if (!provider) return jsonError("Choose Groq, OpenAI, or Anthropic.");
  if (apiKey.length < 8) return jsonError("Paste a valid API key.");

  await saveUserLlmKey(auth.user.id, provider, apiKey);
  return NextResponse.json(await llmKeyStatus(auth.user.id));
}

export async function DELETE() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  await clearUserLlmKey(auth.user.id);
  return NextResponse.json(await llmKeyStatus(auth.user.id));
}
