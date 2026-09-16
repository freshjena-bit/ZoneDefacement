import { db } from "@/lib/db";
import { recomputeAllLevels } from "@/lib/level";
import { isSpecialDomain } from "@/lib/detect";

/**
 * Idempotently seed the database with ~60 realistic synthetic website
 * defacement records (ZoneDefacement mirror archive). Only seeds when the
 * Defacement table is empty. No network calls — all mirror HTML is generated
 * locally so the UI is populated immediately on first run.
 */

interface AttackerRoster {
  name: string;
  team: string;
  /** Historical hint; the actual level is recomputed from the verified count. */
  level: "LEGEND" | "ELITE" | "PRO" | "ROOKIE";
  weight: number;
}

const ROSTER: AttackerRoster[] = [
  { name: "GadaLuBau", team: "SonicNetwork", level: "PRO", weight: 130 },
  { name: "1ND0TR0J4N X", team: "Hacker Patah Hati", level: "ELITE", weight: 50 },
  { name: "EbRaHiM-VaKeR", team: "LegioN_LeakeRs", level: "ELITE", weight: 20 },
  { name: "sam", team: "MouseExploitSec", level: "ELITE", weight: 15 },
  { name: "LungzzX", team: "LungzzX", level: "ROOKIE", weight: 10 },
  { name: "0x6ick", team: "6ickzone", level: "ROOKIE", weight: 8 },
  { name: "Euphoria", team: "SABUN BOLONG CYBER CLUB", level: "ROOKIE", weight: 6 },
  { name: "BULLYXPLOIT", team: "dkv blackhat", level: "ROOKIE", weight: 5 },
  { name: "Antonkill", team: "syshack", level: "ROOKIE", weight: 4 },
  { name: "MR RYUZAKI EXCLUSV", team: "AKUDAMA SYNDICATE TEAM", level: "ROOKIE", weight: 3 },
  { name: "Outsiders", team: "AnonSec Team", level: "ROOKIE", weight: 3 },
  { name: "Irene", team: "XmrAnonye.id", level: "ROOKIE", weight: 3 },
  { name: "XploiterX", team: "NullSec", level: "ROOKIE", weight: 2 },
  { name: "DarkShadow", team: "Ghost Crew", level: "ROOKIE", weight: 1 },
];

const DOMAINS = [
  "uhnp.ac.id",
  "raport.min11blitar.sch.id",
  "edu.min11blitar.sch.id",
  "min11blitar.sch.id",
  "minaenggcollege.ac.in",
  "edisuntoro.web.id",
  "sman1bantul.sch.id",
  "smpn3jkt.sch.id",
  "polymitra.ac.id",
  "untar.ac.id",
  "bukupintar.web.id",
  "sekolahalam.sch.id",
  "diskominfo.go.id",
  "potret.web.id",
  "smkn2bandung.sch.id",
  "sman5surabaya.sch.id",
  "unpam.ac.id",
  "udinus.ac.id",
  "kesato.web.id",
  "merdeka-news.web.id",
  "kampus-merdeka.ac.id",
  "sman3jakarta.sch.id",
  "smpn1yogya.sch.id",
  "unikom.ac.id",
  "telkom.ac.id",
  "archive.web.id",
  "cyber-portal.web.id",
  "rnd.go.id",
  "data.go.id",
  "smkn1malang.sch.id",
  "sman8jakarta.sch.id",
  "sman2bandung.sch.id",
  "smpn5bandung.sch.id",
  "unair.ac.id",
  "ugm.ac.id",
  "ui.ac.id",
  "itb.ac.id",
  "unpad.ac.id",
  "uns.ac.id",
  "undip.ac.id",
  "unnes.ac.id",
  "sttnf.ac.id",
  "binus.ac.id",
  "uph.ac.id",
  "president.ac.id",
  "pradita.ac.id",
  "nusamandiri.ac.id",
  "polsri.ac.id",
  "polban.ac.id",
  "polines.ac.id",
  "pnj.ac.id",
  "polije.ac.id",
  "disdik.go.id",
  "dinkes.go.id",
  "bappeda.go.id",
  "setda.go.id",
  "bps.go.id",
  "bnn.go.id",
  "kominfo.go.id",
  "kkp.go.id",
  "pertanian.go.id",
  "perhubungan.go.id",
  "pu.go.id",
  "kemenag.go.id",
  "kemenkes.go.id",
  "edu.gov.vn",
  "moe.gov.th",
  "mod.gov.th",
  "gov.in",
  "nic.in",
  "gov.ph",
  "gov.my",
  "gov.sg",
  "gov.uk",
  "usa.gov",
];

const URL_PATHS = ["", "/", "/index.html", "/hacked.html", "/eu.html", "/home.html", "/portal/"];

const GREETINGS = [
  "Hello admin :)",
  "Stop killing innocent people",
  "Free Palestine",
  "We are legion",
  "Expect us",
  "Security is just an illusion",
  "Your system has been owned",
  "Patch your holes",
  "No war, no peace",
];

const OS_POOL: { os: string; weight: number }[] = [
  { os: "Linux", weight: 60 },
  { os: "Unknown", weight: 25 },
  { os: "Windows", weight: 8 },
  { os: "FreeBSD", weight: 5 },
  { os: "Unix", weight: 2 },
];

const COUNTRY_POOL: { cc: string; weight: number }[] = [
  { cc: "ID", weight: 45 },
  { cc: "US", weight: 20 },
  { cc: "SG", weight: 12 },
  { cc: "IN", weight: 10 },
  { cc: "MY", weight: 6 },
  { cc: "BR", weight: 4 },
  { cc: "DE", weight: 3 },
];

// ---------- weighted random helpers ----------

function weightedPick<T extends { weight: number }>(pool: T[]): T {
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const item of pool) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return pool[pool.length - 1];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybe(p: number): boolean {
  return Math.random() < p;
}

// ---------- mirror HTML generator ----------

function buildMirrorHtml(opts: {
  attacker: string;
  team: string;
  countryCode: string;
}): string {
  const greeting = pick(GREETINGS);
  const teamLine = `${opts.team} — ${opts.countryCode}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hacked by ${opts.attacker}</title></head>
<body style="margin:0;background:#000;color:#fff;font-family:monospace;text-align:center;padding:40px;">
<div style="margin-top:8vh;">
<h1 style="color:#ff0033;font-size:48px;text-shadow:0 0 20px #ff0033;letter-spacing:2px;">HACKED BY ${opts.attacker}</h1>
<p style="color:#00ff88;font-size:20px;">${greeting}</p>
<p style="color:#aaa;font-size:16px;">${teamLine}</p>
<hr style="border:0;border-top:1px solid #333;margin:30px auto;width:60%;">
<p style="color:#888;font-size:14px;">Your security is a joke.<br/>Patch your system before someone worse shows up.</p>
<p style="color:#555;font-size:12px;margin-top:40px;">Mirrored by ZoneDefacement — Defacement Archive</p>
</div></body></html>`;
}

function buildTargetUrl(domain: string): string {
  const path = pick(URL_PATHS);
  if (!path || path === "/" || path === "") {
    return `https://${domain}/`;
  }
  return `https://${domain}${path}`;
}

// ---------- main seed ----------

export async function seedIfEmpty(): Promise<void> {
  const count = await db.defacement.count();
  if (count > 0) return;

  const TOTAL = 260;
  const now = Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  // Generate capturedAt timestamps spread over the last 30 days, newest = now - few minutes.
  // Several must fall on "today".
  const capturedAts: Date[] = [];
  for (let i = 0; i < TOTAL; i++) {
    // Bias toward more recent by using a power curve.
    const t = Math.pow(Math.random(), 1.7); // 0..1, biased toward 0 (recent)
    const offset = t * 30 * day; // up to 30 days ago
    capturedAts.push(new Date(now - offset - Math.floor(Math.random() * 30 * minute)));
  }
  // Ensure the most recent is just a few minutes ago.
  capturedAts[0] = new Date(now - 4 * minute);
  capturedAts[1] = new Date(now - 22 * minute);
  capturedAts[2] = new Date(now - 47 * minute);
  capturedAts.sort((a, b) => b.getTime() - a.getTime()); // newest first

  // Build a weighted attacker pool by expanding the roster to weights.
  const expandedAttackers: AttackerRoster[] = ROSTER;

  const records: Array<{
    attacker: string;
    team: string;
    reporterLevel: string;
    targetUrl: string;
    targetDomain: string;
    os: string;
    countryCode: string;
    isHome: boolean;
    isMass: boolean;
    isRedeface: boolean;
    isSpecial: boolean;
    status: string;
    mirrorHtml: string;
    mirrorTitle: string;
    capturedAt: Date;
  }> = [];

  for (let i = 0; i < TOTAL; i++) {
    const a = weightedPick(expandedAttackers);
    const domain = pick(DOMAINS);
    const targetUrl = buildTargetUrl(domain);
    const os = weightedPick(OS_POOL).os;
    const cc = weightedPick(COUNTRY_POOL).cc;
    const isHome = maybe(0.7);
    const isMass = maybe(0.25);
    const isRedeface = maybe(0.1);
    const isSpecial = isSpecialDomain(domain);
    // ~85% approved, ~15% onhold
    const status = maybe(0.85) ? "approved" : "onhold";

    records.push({
      attacker: a.name,
      team: a.team,
      // Placeholder — recomputed from the verified count after seeding.
      reporterLevel: "ROOKIE",
      targetUrl,
      targetDomain: domain,
      os,
      countryCode: cc,
      isHome,
      isMass,
      isRedeface,
      isSpecial,
      status,
      mirrorHtml: buildMirrorHtml({
        attacker: a.name,
        team: a.team,
        countryCode: cc,
      }),
      mirrorTitle: `${a.name} — ${domain}`,
      capturedAt: capturedAts[i],
    });
  }

  // Insert in batches for speed (SQLite has a 999-param limit per statement,
  // Prisma handles chunking, but explicit batch is safer).
  const BATCH = 25;
  for (let i = 0; i < records.length; i += BATCH) {
    const slice = records.slice(i, i + BATCH);
    await db.defacement.createMany({
      data: slice.map((r) => ({
        attacker: r.attacker,
        team: r.team,
        targetUrl: r.targetUrl,
        targetDomain: r.targetDomain,
        os: r.os,
        countryCode: r.countryCode,
        isHome: r.isHome,
        isMass: r.isMass,
        isRedeface: r.isRedeface,
        isSpecial: r.isSpecial,
        reporterLevel: r.reporterLevel,
        status: r.status,
        mirrorHtml: r.mirrorHtml,
        mirrorTitle: r.mirrorTitle,
        capturedAt: r.capturedAt,
      })),
    });
  }

  // Derive every attacker's level from their VERIFIED (approved) count so the
  // badges reflect real activity rather than the roster hint.
  await recomputeAllLevels();
}
