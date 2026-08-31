export const LLM_PROVIDERS = ["groq", "openai", "anthropic"] as const;
export type LlmProvider = (typeof LLM_PROVIDERS)[number];

export type LlmCredentials = {
  provider: LlmProvider;
  apiKey: string;
};

export function parseLlmProvider(value: string | null | undefined): LlmProvider | null {
  if (value === "groq" || value === "openai" || value === "anthropic") return value;
  return null;
}

export function envLlmCredentials(): LlmCredentials | null {
  if (process.env.GROQ_API_KEY?.trim()) {
    return { provider: "groq", apiKey: process.env.GROQ_API_KEY.trim() };
  }
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return { provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY.trim() };
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    return { provider: "openai", apiKey: process.env.OPENAI_API_KEY.trim() };
  }
  return null;
}
