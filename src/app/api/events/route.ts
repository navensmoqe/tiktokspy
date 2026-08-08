import { NextRequest, NextResponse } from "next/server";
import { db, ensureDatabaseSchema } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const username = searchParams.get("username")?.trim().replace(/^@+/, "");
    const host = searchParams.get("host")?.trim().replace(/^@+/, "");
    const source = searchParams.get("source");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Prisma.LiveEventWhereInput = {};

    if (search) {
      where.OR = [
        { monitoredUsername: { contains: search } },
        { hostUsername: { contains: search } },
        { liveTitle: { contains: search } },
      ];
    }

    if (username) {
      where.monitoredUsername = { equals: username };
    }

    if (host) {
      where.hostUsername = { equals: host };
    }

    if (source && source !== "ALL") {
      where.detectionSource = { equals: source };
    }

    if (startDate || endDate) {
      where.detectedAt = {};
      if (startDate) {
        where.detectedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.detectedAt.lte = new Date(endDate);
      }
    }

    const [total, events] = await Promise.all([
      db.liveEvent.count({ where }),
      db.liveEvent.findMany({
        where,
        orderBy: { detectedAt: "desc" },
        skip,
        take: limit,
        include: {
          monitoredAccount: {
            select: {
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
