import { describe, expect, it } from "vitest";
import {
  extensionOf,
  labelFromFilename,
  storageDriver,
  storageKeyForUpload,
} from "@/lib/files";

describe("labelFromFilename", () => {
  it("uses the file stem as the student label", () => {
    expect(labelFromFilename("alex-chen.txt")).toBe("alex-chen");
  });

  it("falls back when the name is only an extension", () => {
    expect(labelFromFilename(".txt")).toBe("Untitled submission");
  });
});

describe("extensionOf", () => {
  it("returns a lowercase extension", () => {
    expect(extensionOf("A1.PDF")).toBe(".pdf");
  });
});

describe("storageDriver", () => {
  it("defaults production to durable object storage", () => {
    expect(storageDriver({ NODE_ENV: "production" })).toBe("s3");
  });

  it("keeps local development on the filesystem", () => {
    expect(storageDriver({ NODE_ENV: "development" })).toBe("local");
  });

  it("accepts an explicit driver", () => {
    expect(storageDriver({ STORAGE_DRIVER: "s3", NODE_ENV: "test" })).toBe("s3");
  });
});

describe("storageKeyForUpload", () => {
  it("creates a provider-neutral key with sanitized path segments", () => {
    const key = storageKeyForUpload("assignment/../one", "Alex Chen final!.PDF");
    expect(key).toMatch(
      /^assignments\/assignment____one\/\d+-[0-9a-f-]+-Alex_Chen_final_.PDF$/,
    );
  });
});
