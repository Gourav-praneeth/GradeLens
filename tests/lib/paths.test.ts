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
  it("points the local sqlite alias at prisma/dev.db", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: "file:./dev.db" }, "/app")).toBe(
      `file:${path.join("/app", "prisma", "dev.db")}`,
    );
  });

  it("keeps an explicit production sqlite path", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: "file:/data/gradelens.db" }, "/app")).toBe("file:/data/gradelens.db");
  });

  it("derives a sqlite file from DATA_DIR when DATABASE_URL is empty", () => {
    expect(resolveDatabaseUrl({ DATA_DIR: "/data" }, "/app")).toBe(
      `file:${path.join(path.resolve("/data"), "gradelens.db")}`,
    );
  });
});
