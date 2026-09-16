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

    const snapshot = await db.snapshot.findUnique({
      where: { id },
      include: { site: true },
    });

    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    return NextResponse.json({ snapshot, site: snapshot.site }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
