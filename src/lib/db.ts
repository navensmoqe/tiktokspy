import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var schemaInitialized: boolean | undefined;
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

const basePrisma =
  globalThis.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

export async function ensureDatabaseSchema(client: PrismaClient = basePrisma): Promise<void> {
  if (globalThis.schemaInitialized) return;

  try {
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MonitoredAccount" (
        "id" TEXT PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "nickname" TEXT,
        "avatarUrl" TEXT,
        "status" TEXT NOT NULL DEFAULT 'MONITORING',
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "lastCheckedAt" DATETIME,
        "lastDetectedAt" DATETIME,
        "currentHost" TEXT,
        "currentLiveUrl" TEXT,
        "currentLiveTitle" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TargetHost" (
        "id" TEXT PRIMARY KEY,
        "hostUsername" TEXT NOT NULL UNIQUE,
        "nickname" TEXT,
        "avatarUrl" TEXT,
        "isLive" BOOLEAN NOT NULL DEFAULT 0,
        "currentTitle" TEXT,
        "viewerCount" INTEGER NOT NULL DEFAULT 0,
        "streamUrl" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "lastCheckedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LiveEvent" (
        "id" TEXT PRIMARY KEY,
        "monitoredAccountId" TEXT NOT NULL,
        "monitoredUsername" TEXT NOT NULL,
        "hostUsername" TEXT NOT NULL,
        "liveTitle" TEXT,
        "liveUrl" TEXT NOT NULL,
        "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "exitAt" DATETIME,
        "durationSeconds" INTEGER,
        "detectionSource" TEXT NOT NULL DEFAULT 'WEBCAST_ROOM',
        "metadataJson" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT PRIMARY KEY,
        "liveEventId" TEXT,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'LIVE_DETECTED',
        "isRead" BOOLEAN NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemLog" (
        "id" TEXT PRIMARY KEY,
        "level" TEXT NOT NULL DEFAULT 'INFO',
        "category" TEXT NOT NULL DEFAULT 'GENERAL',
        "message" TEXT NOT NULL,
        "detailsJson" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AppSetting" (
        "id" TEXT PRIMARY KEY,
        "key" TEXT NOT NULL UNIQUE,
        "value" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    globalThis.schemaInitialized = true;
  } catch (e) {
    console.warn("Schema check warning:", e);
  }
}

// Auto-run schema check in background
ensureDatabaseSchema(basePrisma).catch(() => {});

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = basePrisma;
}

export const db = basePrisma;
export default db;
