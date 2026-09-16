import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();

    // Auto-seed synthetic demo content if DB is empty (lightweight, no network).
    try {
      await seedIfEmpty();
    } catch {
      // Seeding failures are non-fatal.
    }

    const where = q
      ? {
          OR: [
            { url: { contains: q } },
            { title: { contains: q } },
            { domain: { contains: q } },
          ],
        }
      : {};

    const sites = await db.site.findMany({
      where,
      orderBy: [{ lastArchivedAt: "desc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { snapshots: true } },
      },
    });

    return NextResponse.json({ sites }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
