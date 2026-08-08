import { NextResponse } from "next/server";
import { db, ensureDatabaseSchema } from "@/lib/db";

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        liveEvent: true,
      },
    });

    const unreadCount = await db.notification.count({
      where: { isRead: false },
    });

    return NextResponse.json({ success: true, data: notifications, unreadCount });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
