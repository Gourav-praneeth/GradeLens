export function llmUserMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "The model request failed.";
  const lower = message.toLowerCase();

  if (
    lower.includes("does not exist") ||
    lower.includes("do not have access") ||
    lower.includes("incorrect api key") ||
    lower.includes("invalid api key") ||
    lower.includes("401")
  ) {
    return "The grading model is unavailable. Check the API key in .env and restart the server.";
  }

  if (lower.includes("429") || lower.includes("rate limit")) {
    return "The model is rate-limited. Wait a minute and try again.";
  }

  if (lower.includes("no extractable text") || lower.includes("scan")) {
    return message;
  }

  return message;
}

export function scanHelpText(warning: string | null): string {
  if (warning?.toLowerCase().includes("scan") || warning?.toLowerCase().includes("selectable text")) {
    return "This PDF has no selectable text (it may be a scan). Paste the student work as text or upload a text-based PDF. Image grading is not available yet.";
  }
  return warning ?? "No text could be read from this file.";
}
