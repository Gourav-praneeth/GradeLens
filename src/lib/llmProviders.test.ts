import { afterEach, describe, expect, it } from "vitest";
import { envLlmCredentials, parseLlmProvider } from "./llmProviders";

describe("parseLlmProvider", () => {
  it("accepts groq, openai, and anthropic", () => {
    expect(parseLlmProvider("groq")).toBe("groq");
    expect(parseLlmProvider("openai")).toBe("openai");
    expect(parseLlmProvider("anthropic")).toBe("anthropic");
  });

  it("rejects unknown values", () => {
    expect(parseLlmProvider("gemini")).toBeNull();
    expect(parseLlmProvider("")).toBeNull();
  });
});

describe("envLlmCredentials", () => {
  const original = {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  afterEach(() => {
    process.env.GROQ_API_KEY = original.GROQ_API_KEY;
    process.env.ANTHROPIC_API_KEY = original.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = original.OPENAI_API_KEY;
  });

  it("prefers Groq when set", () => {
    process.env.GROQ_API_KEY = "gsk_test";
    process.env.OPENAI_API_KEY = "sk_test";
    expect(envLlmCredentials()).toEqual({ provider: "groq", apiKey: "gsk_test" });
  });

  it("returns null when no env keys are set", () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(envLlmCredentials()).toBeNull();
  });
});
