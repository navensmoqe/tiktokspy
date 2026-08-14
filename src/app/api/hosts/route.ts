import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, ensureDatabaseSchema } from "@/lib/db";
import { cleanUsername } from "@/lib/utils";
import { logSystemEvent } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    return NextResponse.json(
      { success: true, data: hosts },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const parsed = createHostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "بيانات غير صالحة" }, { status: 400 });
    }

    const hostUsername = cleanUsername(parsed.data.hostUsername);
    if (!hostUsername) {
      return NextResponse.json({ success: false, error: "اسم مضيف البث لا يمكن أن يكون فارغاً" }, { status: 400 });
    }

    const existing = await db.targetHost.findUnique({
      where: { hostUsername },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: `مضيف البث @${hostUsername} مضاف بالفعل.` }, { status: 409 });
    }

    const host = await db.targetHost.create({
      data: {
        hostUsername,
        nickname: parsed.data.nickname?.trim() || hostUsername,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${hostUsername}`,
        isLive: false,
        isActive: true,
      },
    });

    await logSystemEvent("AUDIT", "MONITOR", `تمت إضافة مضيف البث @${hostUsername} للرادار`);

    return NextResponse.json(
      { success: true, data: host },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
