import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Serverless / Cloud platform database path handler
function prepareDatabaseUrl(): string {
  const isServerless = !!(
    process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL
  );

  if (isServerless) {
    const tmpDb = path.join("/tmp", "dev.db");
    const sourceDb = path.join(process.cwd(), "prisma", "dev.db");

    try {
      if (!fs.existsSync(tmpDb)) {
        if (fs.existsSync(sourceDb)) {
          fs.copyFileSync(sourceDb, tmpDb);
        } else {
          // Touch empty file
          fs.writeFileSync(tmpDb, "");
        }
      }
    } catch (e) {
      console.warn("Could not copy database file to /tmp:", e);
    }

    return `file:${tmpDb}`;
  }

  return process.env.DATABASE_URL || "file:./dev.db";
}

const dbUrl = prepareDatabaseUrl();

export const db =
  globalThis.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

export default db;
