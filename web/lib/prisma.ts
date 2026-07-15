import { PrismaClient } from "@prisma/client";

/**
 * Dev servers cache PrismaClient on globalThis. After `prisma generate` adds
 * models, a stale client can be missing delegates (e.g. resumeDocument).
 * Bump PRISMA_CLIENT_VERSION when the schema gains models used at runtime.
 */
const PRISMA_CLIENT_VERSION = "2026-07-15-resume-document";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion: string | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function hasResumeDocumentDelegate(client: PrismaClient): boolean {
  const delegate = (
    client as PrismaClient & {
      resumeDocument?: { findMany?: unknown };
    }
  ).resumeDocument;
  return typeof delegate?.findMany === "function";
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const versionOk = globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION;

  if (cached && versionOk && hasResumeDocumentDelegate(cached)) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  }

  return client;
}

export const prisma = getPrismaClient();
