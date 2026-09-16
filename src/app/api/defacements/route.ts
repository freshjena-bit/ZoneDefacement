import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { sanitizeHtml } from "@/lib/sanitize";
import { seedIfEmpty } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fields returned for list views (heavy `mirrorHtml` excluded to keep payload small).
const LIST_SELECT = {
  id: true,
  attacker: true,
  team: true,
  targetUrl: true,
  targetDomain: true,
  os: true,
  countryCode: true,
  isHome: true,
  isMass: true,
  isRedeface: true,
  isSpecial: true,
  reporterLevel: true,
  status: true,
  mirrorTitle: true,
  capturedAt: true,
} as const;

function buildWhere(params: URLSearchParams) {
  const where: any = { AND: [] };

  const q = params.get("q")?.trim();
  if (q) {
    where.AND.push({
      OR: [
        { attacker: { contains: q } },
        { team: { contains: q } },
        { targetUrl: { contains: q } },
        { targetDomain: { contains: q } },
      ],
    });
  }

  const status = params.get("status");
  if (status === "approved" || status === "onhold") {
    where.AND.push({ status });
  }

  const attacker = params.get("attacker")?.trim();
  if (attacker) where.AND.push({ attacker });

  const team = params.get("team")?.trim();
  if (team) where.AND.push({ team });

  const os = params.get("os")?.trim();
  if (os) where.AND.push({ os });

  const country = params.get("country")?.trim().toUpperCase();
  if (country) where.AND.push({ countryCode: country });

  const type = params.get("type")?.trim().toLowerCase();
  if (type === "home") where.AND.push({ isHome: true });
  else if (type === "mass") where.AND.push({ isMass: true });
  else if (type === "redeface") where.AND.push({ isRedeface: true });
  else if (type === "special") where.AND.push({ isSpecial: true });

  if (where.AND.length === 0) delete where.AND;
  return where;
}

export async function GET(req: Request) {
  try {
    await seedIfEmpty();
    const url = new URL(req.url);
    const params = url.searchParams;

    // Latest 15 approved for home "Latest Report" panel.
    if (params.get("latest") === "1") {
      const rows = await db.defacement.findMany({
        where: { status: "approved" },
        orderBy: { capturedAt: "desc" },
        take: 15,
        select: LIST_SELECT,
      });
      return NextResponse.json({ defacements: rows, total: rows.length });
    }

    // Top 5 onhold for home "Recent On Hold" panel.
    if (params.get("onhold") === "1") {
      const rows = await db.defacement.findMany({
        where: { status: "onhold" },
        orderBy: { capturedAt: "desc" },
        take: 5,
        select: LIST_SELECT,
      });
      return NextResponse.json({ defacements: rows, total: rows.length });
    }

    const limit = Math.min(
      200,
      Math.max(1, parseInt(params.get("limit") ?? "50", 10) || 50),
    );
    const offset = Math.max(
      0,
      parseInt(params.get("offset") ?? "0", 10) || 0,
    );

    const where = buildWhere(params);

    const [rows, total] = await Promise.all([
      db.defacement.findMany({
        where,
        orderBy: { capturedAt: "desc" },
        skip: offset,
        take: limit,
        select: LIST_SELECT,
      }),
      db.defacement.count({ where }),
    ]);

    return NextResponse.json({ defacements: rows, total });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------- POST: notify / submit a new defacement ----------

function levelForCount(count: number): string {
  if (count >= 500) return "LEGEND";
  if (count >= 100) return "ELITE";
  if (count >= 10) return "PRO";
  return "ROOKIE";
}

function safeParseUrl(raw: string): { url: string; domain: string } | null {
  let s = (raw ?? "").trim();
  if (!s) return null;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!u.hostname || !u.hostname.includes(".")) return null;
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    return { url: u.toString(), domain: u.hostname };
  } catch {
    return null;
  }
}

function syntheticFailedMirror(attacker: string, team: string, targetUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Capture failed — ${attacker}</title></head>
<body style="margin:0;background:#0a0a0a;color:#999;font-family:monospace;text-align:center;padding:48px;">
<div style="margin-top:8vh;">
<h1 style="color:#ff0033;font-size:32px;letter-spacing:2px;">MIRROR CAPTURE FAILED</h1>
<p style="color:#888;font-size:16px;">Target: <span style="color:#ddd;">${targetUrl}</span></p>
<p style="color:#666;font-size:14px;">Reported by ${attacker}${team ? ` · ${team}` : ""}</p>
<hr style="border:0;border-top:1px solid #222;margin:30px auto;width:60%;">
<p style="color:#555;font-size:12px;">The live page could not be fetched at capture time.<br/>Mirror pending re-capture.</p>
</div></body></html>`;
}

export async function POST(req: Request) {
  try {
    await seedIfEmpty();

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const targetUrlRaw: string =
      typeof body?.targetUrl === "string" ? body.targetUrl.trim() : "";
    const attacker: string =
      typeof body?.attacker === "string" ? body.attacker.trim() : "";
    const team: string | null =
      typeof body?.team === "string" && body.team.trim() ? body.team.trim() : null;

    if (!targetUrlRaw) {
      return NextResponse.json({ error: "targetUrl is required" }, { status: 400 });
    }
    if (!attacker) {
      return NextResponse.json({ error: "attacker is required" }, { status: 400 });
    }

    const parsed = safeParseUrl(targetUrlRaw);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid targetUrl" }, { status: 400 });
    }

    const os =
      typeof body?.os === "string" && body.os.trim() ? body.os.trim() : "Unknown";
    const countryCode =
      typeof body?.countryCode === "string" && body.countryCode.trim()
        ? body.countryCode.trim().toUpperCase()
        : null;

    const isHome = Boolean(body?.isHome);
    const isMass = Boolean(body?.isMass);
    const isRedeface = Boolean(body?.isRedeface);
    const isSpecial = Boolean(body?.isSpecial);

    // Determine reporterLevel: if this attacker already exists with a level,
    // reuse it; ADMIN stays ADMIN if they're `sam`. Otherwise compute from
    // their existing count.
    let reporterLevel = "ROOKIE";
    const existing = await db.defacement.findFirst({
      where: { attacker },
      select: { reporterLevel: true },
    });
    if (existing) {
      reporterLevel = existing.reporterLevel;
    } else if (attacker.toLowerCase() === "sam") {
      reporterLevel = "ADMIN";
    } else {
      const cnt = await db.defacement.count({ where: { attacker } });
      reporterLevel = levelForCount(cnt);
    }

    // Try to fetch the live target page via Z.ai page_reader.
    let mirrorHtml = "";
    let captureFailed = false;
    try {
      const zai = await ZAI.create();
      const result = await zai.functions.invoke("page_reader", { url: parsed.url });
      const data = (result as any)?.data ?? result;
      const fetchedHtml = (data?.html ?? "").toString();
      if (fetchedHtml.trim()) {
        mirrorHtml = sanitizeHtml(fetchedHtml);
      } else {
        captureFailed = true;
      }
    } catch {
      captureFailed = true;
    }

    if (captureFailed || !mirrorHtml) {
      mirrorHtml = syntheticFailedMirror(attacker, team ?? "", parsed.url);
    }

    const mirrorTitle = `${attacker} — ${parsed.domain}`;

    const created = await db.defacement.create({
      data: {
        attacker,
        team,
        targetUrl: parsed.url,
        targetDomain: parsed.domain,
        os,
        countryCode,
        isHome,
        isMass,
        isRedeface,
        isSpecial,
        reporterLevel,
        status: "onhold",
        mirrorHtml,
        mirrorTitle,
      },
    });

    return NextResponse.json({ defacement: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
