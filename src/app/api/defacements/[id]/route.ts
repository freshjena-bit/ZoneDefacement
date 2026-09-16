import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await seedIfEmpty();
    const { id } = await params;
    const def = await db.defacement.findUnique({ where: { id } });
    if (!def) {
      return NextResponse.json(
        { error: "Defacement not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ defacement: def });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
