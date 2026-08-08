import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMonitoringManager } from "@/services/monitoringManager";
import { cleanUsername } from "@/lib/utils";

const simulateSchema = z.object({
  username: z.string().min(1),
  hostUsername: z.string().min(1),
  liveTitle: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = simulateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const username = cleanUsername(parsed.data.username);
    const hostUsername = cleanUsername(parsed.data.hostUsername);

    // Note: Do NOT automatically insert into MonitoredAccount or TargetHost
    // All account additions must be strictly user-initiated.
    const manager = getMonitoringManager();
    await manager.triggerSimulatedEvent(
      username,
      hostUsername,
      parsed.data.liveTitle || `🔥 بث مباشر للمضيف @${hostUsername}`
    );

    return NextResponse.json({
      success: true,
      message: `تم إطلاق تنبيه المحاكاة للمستخدم @${username} داخل بث @${hostUsername}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
