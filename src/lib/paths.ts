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
  cwd: string = process.cwd(),
): string | undefined {
  const url = env.DATABASE_URL?.trim();
  if (url === "file:./dev.db" || url === "file:dev.db") {
    return `file:${path.join(cwd, "prisma", "dev.db")}`;
  }
  if (url) return url;
  const dataDir = env.DATA_DIR?.trim();
  if (dataDir) return `file:${path.join(path.resolve(dataDir), "gradelens.db")}`;
  return undefined;
}
