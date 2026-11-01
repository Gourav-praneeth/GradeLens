import {
  DeleteObjectsCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "path";
import { resolveUploadRoot } from "./paths";

type EnvMap = Record<string, string | undefined>;

export type StorageDriver = "local" | "s3";
export const DEFAULT_STORAGE_BUCKET = "uploads";

export function uploadRoot(): string {
  return resolveUploadRoot();
}

export function storageDriver(env: EnvMap = process.env): StorageDriver {
  const configured = env.STORAGE_DRIVER?.trim().toLowerCase();
  if (configured === "local" || configured === "s3") return configured;
  return env.NODE_ENV === "production" ? "s3" : "local";
}

export function storageKeyForUpload(folder: string, originalName: string): string {
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "_") || "unassigned";
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_") || "upload";
  return `assignments/${safeFolder}/${Date.now()}-${randomUUID()}-${safeName}`;
}

function storageBucket(env: EnvMap = process.env): string {
  return env.STORAGE_BUCKET?.trim() || DEFAULT_STORAGE_BUCKET;
}

let s3Client: S3Client | null = null;

function objectClient(env: EnvMap = process.env): S3Client {
  if (s3Client) return s3Client;
  const endpoint = env.OBJECT_STORAGE_ENDPOINT?.trim() || env.AWS_ENDPOINT_URL_S3?.trim();
  const region = env.AWS_REGION?.trim() || "auto";
  const accessKeyId = env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required when STORAGE_DRIVER=s3.",
    );
  }
  s3Client = new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: env.S3_FORCE_PATH_STYLE !== "false" } : {}),
    credentials: { accessKeyId, secretAccessKey },
  });
  return s3Client;
}

export async function saveUpload(
  folder: string,
  originalName: string,
  bytes: Uint8Array,
  contentType?: string,
): Promise<string> {
  const key = storageKeyForUpload(folder, originalName);
  if (storageDriver() === "s3") {
    await objectClient().send(
      new PutObjectCommand({
        Bucket: storageBucket(),
        Key: key,
        Body: bytes,
        ContentType: contentType || "application/octet-stream",
      }),
    );
    return key;
  }

  const storedPath = path.join(uploadRoot(), key);
  await mkdir(path.dirname(storedPath), { recursive: true });
  await writeFile(storedPath, bytes);
  return key;
}

export async function deleteUploads(keys: Array<string | null | undefined>): Promise<void> {
  const unique = [...new Set(keys.map((key) => key?.trim()).filter((key): key is string => Boolean(key)))];
  if (unique.length === 0) return;

  if (storageDriver() === "s3") {
    for (let index = 0; index < unique.length; index += 1000) {
      const chunk = unique.slice(index, index + 1000);
      await objectClient().send(
        new DeleteObjectsCommand({
          Bucket: storageBucket(),
          Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
        }),
      );
    }
    return;
  }

  const root = path.resolve(uploadRoot());
  for (const key of unique) {
    const candidate = path.resolve(path.isAbsolute(key) ? key : path.join(root, key));
    if (candidate === root || !candidate.startsWith(`${root}${path.sep}`)) {
      throw new Error("Refusing to delete an upload outside the configured upload directory.");
    }
    await rm(candidate, { force: true });
  }
}

export async function assertStorageReady(): Promise<void> {
  if (storageDriver() === "s3") {
    await objectClient().send(new HeadBucketCommand({ Bucket: storageBucket() }));
    return;
  }
  await mkdir(uploadRoot(), { recursive: true });
}

export function labelFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return base || "Untitled submission";
}

export function extensionOf(filename: string): string {
  return path.extname(filename).toLowerCase();
}
