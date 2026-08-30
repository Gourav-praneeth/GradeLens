import { describe, expect, it } from "vitest";
import { extensionOf, labelFromFilename } from "./files";

describe("labelFromFilename", () => {
  it("uses the file stem as the student label", () => {
    expect(labelFromFilename("alex-chen.txt")).toBe("alex-chen");
  });

  it("falls back when the name is only an extension", () => {
    expect(labelFromFilename(".txt")).toBe("Untitled submission");
  });
});

describe("extensionOf", () => {
  it("returns a lowercase extension", () => {
    expect(extensionOf("A1.PDF")).toBe(".pdf");
  });
});
