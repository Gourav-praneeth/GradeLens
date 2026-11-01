import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveDatabaseUrl, resolveUploadRoot } from "@/lib/paths";

describe("resolveUploadRoot", () => {
  it("uses UPLOAD_DIR when set", () => {
    expect(resolveUploadRoot({ UPLOAD_DIR: "/data/files" }, "/app")).toBe(path.resolve("/data/files"));
  });

  it("nests uploads under DATA_DIR", () => {
    expect(resolveUploadRoot({ DATA_DIR: "/data" }, "/app")).toBe(path.join(path.resolve("/data"), "uploads"));
  });

  it("defaults to cwd/uploads", () => {
    expect(resolveUploadRoot({}, "/app")).toBe(path.join("/app", "uploads"));
  });
});

describe("resolveDatabaseUrl", () => {
  it("returns the configured PostgreSQL URL", () => {
    const url = "postgresql://gradelens:secret@db.example.com:5432/gradelens?sslmode=require";
    expect(resolveDatabaseUrl({ DATABASE_URL: url })).toBe(url);
  });

  it("does not fall back to ephemeral local storage", () => {
    expect(resolveDatabaseUrl({ DATA_DIR: "/data" })).toBeUndefined();
  });
});
