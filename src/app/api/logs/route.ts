import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");
    const category = searchParams.get("category");
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    const where: any = {};
    if (level && level !== "ALL") where.level = level;
    if (category && category !== "ALL") where.category = category;

    const logs = await db.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
