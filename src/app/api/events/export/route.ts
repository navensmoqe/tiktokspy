import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username")?.trim().replace(/^@+/, "");

    const where = username ? { monitoredUsername: username } : {};

    const events = await db.liveEvent.findMany({
      where,
      orderBy: { detectedAt: "desc" },
      take: 1000,
    });

    const csvRows = [
      ["ID", "Monitored User", "LIVE Host", "LIVE Title", "LIVE URL", "Detected At", "Source"].join(","),
    ];

    for (const e of events) {
      const row = [
        `"${e.id}"`,
        `"@${e.monitoredUsername}"`,
        `"@${e.hostUsername}"`,
        `"${(e.liveTitle || "").replace(/"/g, '""')}"`,
        `"${e.liveUrl}"`,
        `"${format(new Date(e.detectedAt), "yyyy-MM-dd HH:mm:ss")}"`,
        `"${e.detectionSource}"`,
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tiktok_live_events_${Date.now()}.csv"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
