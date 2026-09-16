import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { sanitizeHtml } from "@/lib/sanitize";
import { seedIfEmpty } from "@/lib/seed";
import { levelForVerifiedCount, recomputeAttackerLevel } from "@/lib/level";
import { mirrorSignatureMatches } from "@/lib/verify";
import {
  detectCountry,
  detectOs,
  detectRedeface,
  isHomeUrl,
  isSpecialDomain,
  mapWithConcurrency,
} from "@/lib/detect";

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

    const attacker: string =
      typeof body?.attacker === "string" ? body.attacker.trim() : "";
    const team: string | null =
      typeof body?.team === "string" && body.team.trim() ? body.team.trim() : null;
    const mode: "single" | "mass" =
      body?.mode === "mass" ? "mass" : "single";

    if (!attacker) {
      return NextResponse.json({ error: "attacker is required" }, { status: 400 });
    }

    // Collect URLs. Accept either `urls: string[]` (preferred) or a single
    // `targetUrl: string` for backward compatibility.
    let rawUrls: string[] = [];
    if (Array.isArray(body?.urls)) {
      rawUrls = body.urls
        .filter((u: unknown) => typeof u === "string")
        .map((u: string) => u.trim())
        .filter(Boolean);
    } else if (typeof body?.targetUrl === "string" && body.targetUrl.trim()) {
      rawUrls = [body.targetUrl.trim()];
    }

    if (rawUrls.length === 0) {
      return NextResponse.json(
        { error: "At least one target URL is required" },
        { status: 400 },
      );
    }

    // Cap mass submissions to keep response times reasonable.
    const MAX_URLS = mode === "mass" ? 20 : 1;
    const urls = rawUrls.slice(0, MAX_URLS);

    // Determine reporterLevel from the attacker's count of VERIFIED
    // (approved) defacements. On-hold submissions don't count toward the
    // level — only accepted mirrors do. ADMIN is a staff override.
    const verifiedCount = await db.defacement.count({
      where: { attacker, status: "approved" },
    });
    const reporterLevel = levelForVerifiedCount(verifiedCount, attacker);

    // Process every URL with limited concurrency. Each URL auto-detects its
    // own country, OS, special/redeface/home flags, and captures the mirror.
    const created = await mapWithConcurrency(urls, 3, async (rawUrl) => {
      const parsed = safeParseUrl(rawUrl);
      if (!parsed) {
        return {
          error: "Invalid URL",
          targetUrl: rawUrl,
        } as const;
      }

      // Auto-detect everything (all run in parallel).
      const [countryCode, os, isRedeface] = await Promise.all([
        detectCountry(parsed.domain),
        detectOs(parsed.url),
        detectRedeface(parsed.domain),
      ]);
      const isSpecial = isSpecialDomain(parsed.domain);
      const isHome = isHomeUrl(parsed.url);
      const isMass = mode === "mass" && urls.length > 1;

      // Fetch the live target page via Z.ai page_reader.
      let mirrorHtml = "";
      let captureFailed = false;
      try {
        const zai = await ZAI.create();
        const result = await zai.functions.invoke("page_reader", {
          url: parsed.url,
        });
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

      // Auto-verification: if the mirrored page contains a defacement
      // signature attributed to this attacker ("hacked by {name}" or
      // "touched by {name}", case-insensitive), auto-approve it. Otherwise
      // place it on hold for manual admin review.
      const autoVerified = mirrorSignatureMatches(mirrorHtml, attacker);
      const status = autoVerified ? "approved" : "onhold";

      const record = await db.defacement.create({
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
          status,
          mirrorHtml,
          mirrorTitle,
        },
      });

      // If auto-verified, the attacker's verified count just increased —
      // recompute their level and backfill it across all their records.
      if (autoVerified) {
        await recomputeAttackerLevel(attacker);
      }

      return { ...record, autoVerified };
    });

    // Separate successes from invalid-URL skips.
    const ok = created.filter(
      (c): c is Exclude<typeof c, { error: string; targetUrl: string }> =>
        !("error" in c),
    );
    const failed = created.filter(
      (c): c is { error: string; targetUrl: string } => "error" in c,
    );

    // Count how many were auto-verified vs put on hold.
    const autoVerifiedCount = ok.filter((r) => r.autoVerified).length;
    const onholdCount = ok.length - autoVerifiedCount;

    return NextResponse.json(
      {
        defacements: ok,
        skipped: failed,
        count: ok.length,
        verified: autoVerifiedCount,
        onhold: onholdCount,
        detected: {
          // Surface what was auto-detected so the UI can confirm it.
          sample: ok[0]
            ? {
                country: ok[0].countryCode,
                os: ok[0].os,
                isHome: ok[0].isHome,
                isMass: ok[0].isMass,
                isRedeface: ok[0].isRedeface,
                isSpecial: ok[0].isSpecial,
                autoVerified: ok[0].autoVerified,
                status: ok[0].status,
              }
            : null,
        },
      },
      { status: 201 },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
