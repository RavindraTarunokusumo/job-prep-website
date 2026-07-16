import { PrismaClient } from "@prisma/client";

/**
 * Dev servers cache PrismaClient on globalThis. After `prisma generate` adds
 * models, a stale client can be missing delegates (e.g. resumeDocument).
 * Bump PRISMA_CLIENT_VERSION when the schema gains models used at runtime.
 */
const PRISMA_CLIENT_VERSION = "2026-07-16-phase4-match-plan";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion: string | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function hasRequiredDelegates(client: PrismaClient): boolean {
  const extended = client as PrismaClient & {
    resumeDocument?: { findMany?: unknown };
    resumeReview?: { findMany?: unknown };
    jobDescription?: { findMany?: unknown };
    jobMatchAnalysis?: { findMany?: unknown };
    preparationPlan?: { findMany?: unknown };
  };
  return (
    typeof extended.resumeDocument?.findMany === "function" &&
    typeof extended.resumeReview?.findMany === "function" &&
    typeof extended.jobDescription?.findMany === "function" &&
    typeof extended.jobMatchAnalysis?.findMany === "function" &&
    typeof extended.preparationPlan?.findMany === "function"
  );
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const versionOk = globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION;

  if (cached && versionOk && hasRequiredDelegates(cached)) {
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
