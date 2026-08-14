import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const basePrisma =
  globalThis.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Prisma applies schema changes during deployment using DIRECT_URL.
// Kept as a no-op while API routes retain their existing initialization calls.
export async function ensureDatabaseSchema(): Promise<void> {}

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = basePrisma;
}

export const db = basePrisma;
export default db;
