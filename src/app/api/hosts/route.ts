import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, ensureDatabaseSchema } from "@/lib/db";
import { cleanUsername } from "@/lib/utils";
import { getMonitoringManager } from "@/services/monitoringManager";
import { logSystemEvent } from "@/lib/logger";

const createHostSchema = z.object({
  hostUsername: z.string().min(1).max(30),
  nickname: z.string().optional(),
});

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const hosts = await db.targetHost.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: hosts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createHostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const hostUsername = cleanUsername(parsed.data.hostUsername);
    if (!hostUsername) {
      return NextResponse.json({ success: false, error: "Host username cannot be empty" }, { status: 400 });
    }

    const existing = await db.targetHost.findUnique({
      where: { hostUsername },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: `Host @${hostUsername} is already registered.` }, { status: 409 });
    }

    const host = await db.targetHost.create({
      data: {
        hostUsername,
        nickname: parsed.data.nickname?.trim() || hostUsername,
        streamUrl: `https://www.tiktok.com/@${hostUsername}/live`,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${hostUsername}`,
        isActive: true,
      },
    });

    // Register with monitoring manager
    const manager = getMonitoringManager();
    await manager.registerHost(hostUsername);

    await logSystemEvent("AUDIT", "MONITOR", `Added new target host stream @${hostUsername}`);

    return NextResponse.json({ success: true, data: host }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
