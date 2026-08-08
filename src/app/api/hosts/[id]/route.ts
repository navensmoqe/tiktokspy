import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getMonitoringManager } from "@/services/monitoringManager";
import { logSystemEvent } from "@/lib/logger";

const updateHostSchema = z.object({
  isActive: z.boolean().optional(),
  isLive: z.boolean().optional(),
  currentTitle: z.string().optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = updateHostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const host = await db.targetHost.update({
      where: { id },
      data: parsed.data,
    });

    const manager = getMonitoringManager();
    if (parsed.data.isActive !== undefined) {
      if (parsed.data.isActive) {
        await manager.registerHost(host.hostUsername);
      } else {
        await manager.unregisterHost(host.hostUsername);
      }
    }

    await logSystemEvent("AUDIT", "MONITOR", `Updated target host @${host.hostUsername}`);

    return NextResponse.json({ success: true, data: host });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const host = await db.targetHost.findUnique({
      where: { id },
    });

    if (!host) {
      return NextResponse.json({ success: false, error: "Host not found" }, { status: 404 });
    }

    const manager = getMonitoringManager();
    await manager.unregisterHost(host.hostUsername);

    await db.targetHost.delete({
      where: { id },
    });

    await logSystemEvent("AUDIT", "MONITOR", `Deleted target host @${host.hostUsername}`);

    return NextResponse.json({ success: true, message: "Host removed successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
