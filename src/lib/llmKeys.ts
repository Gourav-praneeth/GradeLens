import { prisma } from "./db";
import { envLlmCredentials, parseLlmProvider, type LlmCredentials, type LlmProvider } from "./llmProviders";
import { decryptSecret, encryptSecret, maskSecret } from "./secretBox";

export type { LlmCredentials, LlmProvider };
export { envLlmCredentials, parseLlmProvider };

export async function getUserLlmCredentials(userId: string): Promise<LlmCredentials | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { llmProvider: true, llmKeyCipher: true },
  });
  const provider = parseLlmProvider(user?.llmProvider);
  if (!user?.llmKeyCipher || !provider) return null;
  return { provider, apiKey: decryptSecret(user.llmKeyCipher) };
}

export async function resolveLlmCredentials(userId: string): Promise<LlmCredentials> {
  const personal = await getUserLlmCredentials(userId);
  if (personal) return personal;
  const fallback = envLlmCredentials();
  if (fallback) return fallback;
  throw new Error("Add your Groq, OpenAI, or Anthropic API key in Account settings.");
}

export async function saveUserLlmKey(userId: string, provider: LlmProvider, apiKey: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      llmProvider: provider,
      llmKeyCipher: encryptSecret(apiKey.trim()),
    },
  });
}

export async function clearUserLlmKey(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { llmProvider: null, llmKeyCipher: null },
  });
}

export async function llmKeyStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { llmProvider: true, llmKeyCipher: true },
  });
  const provider = parseLlmProvider(user?.llmProvider);
  if (!user?.llmKeyCipher || !provider) {
    return { configured: false as const, provider: null, hint: null, usingServerKey: Boolean(envLlmCredentials()) };
  }
  return {
    configured: true as const,
    provider,
    hint: maskSecret(decryptSecret(user.llmKeyCipher)),
    usingServerKey: false,
  };
}
