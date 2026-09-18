import crypto from "node:crypto";

/**
 * Minimal admin authentication for the DefacerID archive.
 *
 * Admin credentials are read from environment variables (ADMIN_USERNAME /
 * ADMIN_PASSWORD) so they never live in source code. In local development
 * they fall back to demo defaults (GadaLuBau / slametwkw) so the sandbox
 * works out of the box — set the env vars in production (e.g. on Vercel) to
 * override. Session state is held in a signed httpOnly cookie — no database
 * table needed.
 */

// Demo fallbacks for local development ONLY. Override via env vars in prod.
const DEV_ADMIN_USERNAME = "GadaLuBau";
const DEV_ADMIN_PASSWORD = "slametwkw";

/** Read the admin username from the environment (fresh per request so env
 *  var changes on Vercel take effect without code changes). */
function adminUsername(): string {
  const v = process.env.ADMIN_USERNAME;
  return v && v.trim() ? v.trim() : DEV_ADMIN_USERNAME;
}

/** Read the admin password from the environment (fresh per request). */
function adminPassword(): string {
  const v = process.env.ADMIN_PASSWORD;
  return v && v.length ? v : DEV_ADMIN_PASSWORD;
}

// HMAC secret. Prefer an env var in production; fall back to a fixed dev key.
function secret(): string {
  return (
    process.env.AUTH_SECRET ||
    "defacerid-archive-hmac-secret-please-override-in-prod"
  );
}

export const SESSION_COOKIE_NAME = "defacerid_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface Session {
  username: string;
}

/** Verify admin username/password against the env-configured credentials. */
export function verifyCredentials(
  username: string,
  password: string,
): boolean {
  // Constant-time-ish comparison to avoid trivial timing leaks.
  const u = Buffer.from(String(username ?? ""));
  const p = Buffer.from(String(password ?? ""));
  const eu = Buffer.from(adminUsername());
  const ep = Buffer.from(adminPassword());
  return (
    u.length === eu.length &&
    p.length === ep.length &&
    safeEqual(u, eu) &&
    safeEqual(p, ep)
  );
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Create a signed session token: `exp.username.signature`. */
export function createSessionToken(username: string): string {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${exp}.${username}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/** Verify a token's signature + expiry, returning the username or null. */
export function verifySessionToken(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 1) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);

  const expected = crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("hex");

  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const dot = payload.indexOf(".");
  if (dot < 1) return null;
  const exp = parseInt(payload.slice(0, dot), 10);
  if (!exp || Date.now() > exp) return null;
  return payload.slice(dot + 1);
}

/** Parse a Cookie header and return the named value. */
function parseCookie(header: string, name: string): string | null {
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    if (k === name) {
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Read the admin session (if any) from a Request's Cookie header. */
export function getSession(req: Request): Session | null {
  const cookie = req.headers.get("cookie") || "";
  const token = parseCookie(cookie, SESSION_COOKIE_NAME);
  if (!token) return null;
  const username = verifySessionToken(token);
  return username ? { username } : null;
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
