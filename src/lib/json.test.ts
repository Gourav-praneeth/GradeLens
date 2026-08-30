import { describe, expect, it } from "vitest";
import { parseJsonObject } from "./json";

describe("parseJsonObject", () => {
  it("parses a raw object", () => {
    expect(parseJsonObject('{"criteria":[]}')).toEqual({ criteria: [] });
  });

  it("parses a fenced block", () => {
    expect(parseJsonObject('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it("throws when no object is present", () => {
    expect(() => parseJsonObject("not json")).toThrow(/did not return JSON/);
  });
});
