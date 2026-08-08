import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const host = await db.targetHost.findUnique({
      where: { id },
    });

    if (!host) {
      return NextResponse.json({ success: false, error: "Host not found" }, { status: 404 });
    }

    const cleanHost = host.hostUsername.replace(/^@+/, "").toLowerCase();

    const ttl = await import("tiktok-live-connector");
    const ConnectionClass = ttl.TikTokLiveConnection || (ttl as any).WebcastPushConnection || (ttl as any).default?.TikTokLiveConnection;

    if (!ConnectionClass) {
      return NextResponse.json({ success: false, error: "Connector library not loaded" }, { status: 500 });
    }

    const connection = new ConnectionClass(cleanHost, {
      processInitialData: true,
      enableExtendedGiftInfo: false,
      enableWebsocketUpgrade: true,
      requestPollingIntervalMs: 1000,
    });

    try {
      const state = await connection.connect();
      const roomId = state?.roomId || state?.roomInfo?.id || "نشط";

      // Update in DB
      await db.targetHost.update({
        where: { id },
        data: {
          isLive: true,
          lastCheckedAt: new Date(),
        },
      });

      // Disconnect probe
      try {
        if (typeof connection.disconnect === "function") {
          connection.disconnect();
        }
      } catch {}

      return NextResponse.json({
        success: true,
        isLive: true,
        roomId,
        message: `🟢 صاحب القناة @${cleanHost} في بث مباشر الآن! تم الاتصال بنجاح بغرفة البث (Room ID: ${roomId}).`,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);

      await db.targetHost.update({
        where: { id },
        data: {
          isLive: false,
          lastCheckedAt: new Date(),
        },
      });

      if (errMsg.includes("LIVE has ended") || errMsg.includes("UserOfflineError") || errMsg.includes("offline")) {
        return NextResponse.json({
          success: true,
          isLive: false,
          message: `⚪ صاحب الحساب @${cleanHost} ليس في بث مباشر حالياً (أوفلاين).`,
          details: errMsg,
        });
      }

      return NextResponse.json({
        success: true,
        isLive: false,
        message: `⚠️ تعذر الاتصال بغرفة @${cleanHost}: ${errMsg}`,
        details: errMsg,
      });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
