import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertStorageReady, storageDriver } from "@/lib/files";

export const runtime = "nodejs";

export async function GET() {
  const [database, storage] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    assertStorageReady(),
  ]);
  const ok = database.status === "fulfilled" && storage.status === "fulfilled";
  return NextResponse.json(
    {
      ok,
      database: database.status === "fulfilled" ? "ok" : "unavailable",
      storage: storage.status === "fulfilled" ? storageDriver() : "unavailable",
    },
    { status: ok ? 200 : 503 },
  );
}
