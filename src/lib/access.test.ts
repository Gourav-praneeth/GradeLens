import { describe, expect, it } from "vitest";
import { isOwner } from "./access";

describe("access", () => {
  it("treats owner as the course admin", () => {
    expect(isOwner("owner")).toBe(true);
    expect(isOwner("ta")).toBe(false);
  });
});
