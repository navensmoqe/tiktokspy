import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logSystemEvent } from "@/lib/logger";

const updateAccountSchema = z.object({
  isActive: z.boolean().optional(),
  status: z.enum(["MONITORING", "LIVE_DETECTED", "IDLE", "UNKNOWN"]).optional(),
  nickname: z.string().optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = updateAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const updated = await db.monitoredAccount.update({
      where: { id },
      data: parsed.data,
    });

    await logSystemEvent("AUDIT", "MONITOR", `Updated monitored account @${updated.username} (active: ${updated.isActive})`);

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const account = await db.monitoredAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    await db.monitoredAccount.delete({
      where: { id },
    });

    await logSystemEvent("AUDIT", "MONITOR", `Removed monitored account @${account.username}`);

    return NextResponse.json({ success: true, message: "Account removed successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
