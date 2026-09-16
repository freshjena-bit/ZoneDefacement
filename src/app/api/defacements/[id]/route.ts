import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";
import { getSession } from "@/lib/auth";

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

/**
 * PATCH /api/defacements/[id]
 * Admin-only. Body: { action: "approve" | "reject" }
 *  - approve: move an on-hold defacement to "approved" (verified).
 *  - reject:  permanently delete the on-hold submission.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized — admin login required" },
        { status: 401 },
      );
    }

    await seedIfEmpty();
    const { id } = await params;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const action = String(body?.action ?? "").toLowerCase();

    if (action === "approve") {
      const updated = await db.defacement.update({
        where: { id },
        data: { status: "approved" },
      });
      return NextResponse.json({ defacement: updated });
    }

    if (action === "reject") {
      await db.defacement.delete({ where: { id } });
      return NextResponse.json({ ok: true, id });
    }

    return NextResponse.json(
      { error: 'action must be "approve" or "reject"' },
      { status: 400 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
