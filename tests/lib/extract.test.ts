import { describe, expect, it } from "vitest";
import { extractDocument } from "@/lib/extract";

describe("extractDocument", () => {
  it("reads a text file", async () => {
    const result = await extractDocument("alex.txt", new TextEncoder().encode("def factorial(n):\n    return 1\n"));
    expect(result.warning).toBeNull();
    expect(result.text).toContain("factorial");
  });

  it("warns on an empty text file", async () => {
    const result = await extractDocument("empty.txt", new Uint8Array());
    expect(result.text).toBe("");
    expect(result.warning).toMatch(/empty/i);
  });

  it("rejects unsupported types", async () => {
    await expect(extractDocument("notes.docx", new TextEncoder().encode("nope"))).rejects.toThrow(
      /PDF or a \.txt/i,
    );
  });
});
