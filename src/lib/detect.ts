import dns from "node:dns/promises";
import { db } from "@/lib/db";

/**
 * Auto-detection helpers for defacement submissions.
 *
 * The Notify form only collects: mode (single/mass), URL(s), attacker, team.
 * Everything else — OS, country, Home/Mass/Redeface/Special — is detected
 * automatically by the backend using these functions.
 */

// ---- Special (government / academic) domain detection ----------------------

/**
 * Returns true if the domain belongs to a government / military / academic /
 * school institution. Covers TLDs like: .gov, .gov.uk, .gov.vn, .gov.th,
 * .gov.au, .gov.br, .gov.in, .gov.my, .gov.ph, .gov.sg, .go.id, .go.th,
 * .go.jp, .ac.id, .ac.uk, .ac.jp, .sch.id, .sch.uk, .sch.gr, .gob.es, .mil,
 * .edu, .edu.sg, .edu.au, etc.
 */
export function isSpecialDomain(domain: string): boolean {
  const d = domain.toLowerCase().replace(/^www\./, "");
  const parts = d.split(".");
  if (parts.length < 2) return false;

  const last = parts[parts.length - 1];
  const second = parts[parts.length - 2];

  // Direct government / military / education TLDs.
  if (last === "gov" || last === "mil" || last === "edu") return true;

  // Second-level gov/academic/school token + a country TLD, e.g. gov.id,
  // go.id, ac.id, sch.id, gov.uk, gov.vn, gob.es, edu.au, mil.br, ...
  //   gov / go / gob  → government
  //   ac / edu        → higher education / university
  //   sch             → primary/secondary school (e.g. .sch.id, .sch.uk)
  //   mil             → military
  const specialTokens = ["gov", "go", "gob", "ac", "edu", "sch", "mil"];
  if (
    specialTokens.includes(second) &&
    last.length >= 2 &&
    last.length <= 3 &&
    !["com", "net", "org", "co"].includes(last)
  ) {
    return true;
  }

  return false;
}

// ---- Country detection (DNS → IP → GeoIP, TLD fallback) --------------------

const TLD_TO_CC: Record<string, string> = {
  id: "ID",
  in: "IN",
  sg: "SG",
  my: "MY",
  br: "BR",
  th: "TH",
  vn: "VN",
  us: "US",
  uk: "GB",
  au: "AU",
  de: "DE",
  fr: "FR",
  ph: "PH",
  pk: "PK",
  bd: "BD",
  tr: "TR",
  ru: "RU",
  eg: "EG",
  ng: "NG",
  jp: "JP",
  cn: "CN",
  kr: "KR",
  tw: "TW",
  hk: "HK",
  es: "ES",
  it: "IT",
  nl: "NL",
  ca: "CA",
  mx: "MX",
  ar: "AR",
  sa: "SA",
  ir: "IR",
  iq: "IQ",
  ae: "AE",
  pl: "PL",
  ua: "UA",
  ro: "RO",
  cz: "CZ",
  se: "SE",
  ch: "CH",
  at: "AT",
  be: "BE",
  pt: "PT",
  gr: "GR",
  fi: "FI",
  dk: "DK",
  no: "NO",
  ie: "IE",
  nz: "NZ",
  za: "ZA",
  ke: "KE",
  ma: "MA",
  dz: "DZ",
  ly: "LY",
  sd: "SD",
  mm: "MM",
  kh: "KH",
  la: "LA",
  lk: "LK",
  np: "NP",
  bn: "BN",
  io: "ID", // often used by .io hosted in ID region — best-effort
};

/**
 * Detect the server's country code by resolving the domain to an IPv4 address
 * and geolocating it via ip-api.com. Falls back to the ccTLD if DNS or the
 * geoip lookup fails.
 */
export async function detectCountry(domain: string): Promise<string | null> {
  // 1. DNS → IPv4
  let ip: string | null = null;
  try {
    const r = await dns.lookup(domain, { family: 4 });
    ip = r.address;
  } catch {
    ip = null;
  }

  // 2. GeoIP lookup
  if (ip) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4500);
      const res = await fetch(
        `http://ip-api.com/json/${ip}?fields=countryCode`,
        { signal: ctrl.signal },
      );
      clearTimeout(t);
      if (res.ok) {
        const j = (await res.json()) as { countryCode?: string };
        if (j?.countryCode && typeof j.countryCode === "string") {
          return j.countryCode.toUpperCase();
        }
      }
    } catch {
      /* fall through to TLD */
    }
  }

  // 3. TLD fallback
  const parts = domain.toLowerCase().split(".");
  const tld = parts[parts.length - 1];
  return TLD_TO_CC[tld] ?? null;
}

// ---- OS detection (HTTP Server header) -------------------------------------

/**
 * Fetch the target URL and infer the operating system from the `Server`
 * response header. nginx/apache/litespeed/openresty overwhelmingly run on
 * Linux; IIS implies Windows. CDN-fronted sites (Cloudflare, Akamai, ...) hide
 * the origin OS, so we return "Unknown".
 */
export async function detectOs(url: string): Promise<string> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "ZoneDefacement-Mirror/1.0 (+archive)" },
    });
    clearTimeout(t);
    const server = (res.headers.get("server") ?? "").toLowerCase();

    if (/microsoft-iis|iis/.test(server)) return "Windows";
    if (/freebsd/.test(server)) return "FreeBSD";
    if (/ubuntu|debian|centos|rocky|alma|fedora|red\s?hat/.test(server))
      return "Linux";
    if (/nginx|apache|litespeed|openresty|caddy/.test(server)) return "Linux";
    if (/cloudflare|akamai|incapsula|sucuri|fastly|imperva|varnish/.test(server))
      return "Unknown";
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

// ---- Redeface detection (prior defacement of same domain) ------------------

/**
 * A redeface is when a domain that was previously defaced (and presumably
 * restored) gets attacked again. We detect this by checking whether the
 * archive already holds any prior defacement for the same target domain.
 */
export async function detectRedeface(domain: string): Promise<boolean> {
  try {
    const count = await db.defacement.count({
      where: { targetDomain: domain },
    });
    return count > 0;
  } catch {
    return false;
  }
}

// ---- Home detection (homepage vs subpage) ----------------------------------

/**
 * `isHome` is true when the defaced URL targets the site root (the homepage)
 * rather than a sub-path.
 */
export function isHomeUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    const p = u.pathname.replace(/\/+$/, "");
    return p === "" || p === "/";
  } catch {
    return false;
  }
}

// ---- Concurrency helper ----------------------------------------------------

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
