import { db } from "./db";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "AUDIT";
export type LogCategory = "MONITOR" | "WEBSOCKET" | "SSE" | "AUTH" | "DATABASE" | "GENERAL";

export async function logSystemEvent(
  level: LogLevel,
  category: LogCategory,
  message: string,
  details?: Record<string, unknown> | null
) {
  try {
    const detailsJson = details ? JSON.stringify(details) : null;
    const log = await db.systemLog.create({
      data: {
        level,
        category,
        message,
        detailsJson,
      },
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[${level}][${category}] ${message}`, details || "");
    }
    return log;
  } catch (err) {
    console.error("Failed to write system log:", err);
  }
}
