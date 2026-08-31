import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, maskSecret } from "./secretBox";

describe("secretBox", () => {
  it("round-trips a secret", () => {
    const stored = encryptSecret("gsk_test_key_value");
    expect(decryptSecret(stored)).toBe("gsk_test_key_value");
  });

  it("masks all but the last four characters", () => {
    expect(maskSecret("gsk_abcdefgh")).toBe("••••efgh");
  });
});
