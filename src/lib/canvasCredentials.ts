import { prisma } from "./db";
import {
  normalizeCanvasBaseUrl,
  verifyCanvasCredentials,
  type CanvasCredentials,
} from "./canvas";
import { decryptSecret, encryptSecret, maskSecret } from "./secretBox";

export async function getCanvasCredentials(userId: string): Promise<CanvasCredentials | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { canvasBaseUrl: true, canvasTokenCipher: true },
  });
  if (!user?.canvasBaseUrl || !user.canvasTokenCipher) return null;
  return {
    baseUrl: normalizeCanvasBaseUrl(user.canvasBaseUrl),
    accessToken: decryptSecret(user.canvasTokenCipher),
  };
}

export async function requireCanvasCredentials(userId: string): Promise<CanvasCredentials> {
  const credentials = await getCanvasCredentials(userId);
  if (!credentials) {
    throw new Error("Add your Canvas URL and access token in Account settings.");
  }
  return credentials;
}

export async function saveCanvasCredentials(
  userId: string,
  baseUrl: string,
  accessToken: string,
) {
  const credentials = {
    baseUrl: normalizeCanvasBaseUrl(baseUrl),
    accessToken: accessToken.trim(),
  };
  if (credentials.accessToken.length < 10) {
    throw new Error("Paste a valid Canvas access token.");
  }

  await verifyCanvasCredentials(credentials);
  await prisma.user.update({
    where: { id: userId },
    data: {
      canvasBaseUrl: credentials.baseUrl,
      canvasTokenCipher: encryptSecret(credentials.accessToken),
    },
  });
}

export async function clearCanvasCredentials(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { canvasBaseUrl: null, canvasTokenCipher: null },
  });
}

export async function canvasCredentialStatus(userId: string) {
  const credentials = await getCanvasCredentials(userId);
  if (!credentials) {
    return {
      configured: false as const,
      baseUrl: null,
      hint: null,
    };
  }
  return {
    configured: true as const,
    baseUrl: credentials.baseUrl,
    hint: maskSecret(credentials.accessToken),
  };
}
