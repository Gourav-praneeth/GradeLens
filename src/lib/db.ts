import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function datasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Prisma CLI resolves file:./dev.db next to schema.prisma; Next.js would otherwise
  // open an empty database at the project root.
  if (url === "file:./dev.db" || url === "file:dev.db") {
    return `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: datasourceUrl() } },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
