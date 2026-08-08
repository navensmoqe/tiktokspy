import { NextRequest, NextResponse } from "next/server";
import { db, ensureDatabaseSchema } from "@/lib/db";

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  soundType: "radar",
  soundVolume: 80,
  browserNotifications: true,
  autoDismissSeconds: 8,
  monitoringInterval: 10,
  streamProvider: "auto",
};

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const settingsRows = await db.appSetting.findMany();
    const config: Record<string, any> = { ...DEFAULT_SETTINGS };

    for (const row of settingsRows) {
      try {
        config[row.key] = JSON.parse(row.value);
      } catch {
        config[row.key] = row.value;
      }
    }

    return NextResponse.json({ success: true, data: config });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    for (const [key, val] of Object.entries(body)) {
      await db.appSetting.upsert({
        where: { key },
        create: {
          key,
          value: JSON.stringify(val),
        },
        update: {
          value: JSON.stringify(val),
        },
      });
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
