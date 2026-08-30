import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export async function saveUpload(
  folder: string,
  originalName: string,
  bytes: Uint8Array,
): Promise<string> {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  const storedPath = path.join(dir, filename);
  await writeFile(storedPath, bytes);
  return storedPath;
}

export function labelFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return base || "Untitled submission";
}

export function extensionOf(filename: string): string {
  return path.extname(filename).toLowerCase();
}
