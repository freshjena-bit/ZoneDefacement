import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const site = await db.site.findUnique({ where: { id } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Light snapshot list — exclude heavy html/text fields.
    const snapshots = await db.snapshot.findMany({
      where: { siteId: id },
      orderBy: { capturedAt: "desc" },
      select: {
        id: true,
        siteId: true,
        capturedAt: true,
        title: true,
        excerpt: true,
        status: true,
        contentLength: true,
        publishedTime: true,
        captureMs: true,
      },
    });

    return NextResponse.json({ site, snapshots }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
