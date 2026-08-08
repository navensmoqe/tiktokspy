import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, ensureDatabaseSchema } from "@/lib/db";
import { cleanUsername } from "@/lib/utils";
import { logSystemEvent } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const createAccountSchema = z.object({
  username: z.string().min(1).max(30),
  nickname: z.string().optional(),
});

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const accounts = await db.monitoredAccount.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { liveEvents: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: accounts },
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
    const parsed = createAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "بيانات غير صالحة" }, { status: 400 });
    }

    const username = cleanUsername(parsed.data.username);
    if (!username) {
      return NextResponse.json({ success: false, error: "اسم المستخدم لا يمكن أن يكون فارغاً" }, { status: 400 });
    }

    // Check if already exists
    const existing = await db.monitoredAccount.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: `الحساب @${username} موجود بالفعل في قائمة الرصد.` }, { status: 409 });
    }

    const account = await db.monitoredAccount.create({
      data: {
        username,
        nickname: parsed.data.nickname?.trim() || username,
        status: "MONITORING",
        isActive: true,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      },
    });

    await logSystemEvent("AUDIT", "MONITOR", `تمت إضافة الحساب @${username} لقائمة الرصد`);

    return NextResponse.json(
      { success: true, data: account },
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

export async function DELETE() {
  try {
    await ensureDatabaseSchema();
    const count = await db.monitoredAccount.deleteMany({});
    await logSystemEvent("AUDIT", "MONITOR", `تم مسح جميع الحسابات المراقبة (${count.count} حساب)`);
    return NextResponse.json(
      { success: true, message: `تم مسح ${count.count} حساب بنجاح.` },
      {
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
