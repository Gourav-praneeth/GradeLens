import { describe, expect, it } from "vitest";
import { llmUserMessage, scanHelpText } from "@/lib/errors";

describe("llmUserMessage", () => {
  it("explains a missing model", () => {
    expect(llmUserMessage(new Error("404 The model `x` does not exist or you do not have access to it."))).toMatch(
      /unavailable/i,
    );
  });

  it("explains a rate limit", () => {
    expect(llmUserMessage(new Error("429 rate limit"))).toMatch(/rate-limited/i);
  });
});

describe("scanHelpText", () => {
  it("explains scan PDFs", () => {
    expect(
      scanHelpText("No selectable text in this PDF. It may be a scan. Paste the text or use a text-based PDF."),
    ).toMatch(/scan/i);
  });
});
