import path from "node:path";

type EnvMap = Record<string, string | undefined>;

export function resolveUploadRoot(
  env: EnvMap = process.env,
  cwd: string = process.cwd(),
): string {
  const uploadDir = env.UPLOAD_DIR?.trim();
  if (uploadDir) return path.resolve(uploadDir);
  const dataDir = env.DATA_DIR?.trim();
  if (dataDir) return path.join(path.resolve(dataDir), "uploads");
  return path.join(cwd, "uploads");
}

export function resolveDatabaseUrl(
  env: EnvMap = process.env,
): string | undefined {
  return env.DATABASE_URL?.trim() || undefined;
}
