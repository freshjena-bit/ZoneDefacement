import crypto from "node:crypto";

/**
 * Minimal admin authentication for the SAM1337 archive.
 *
 * A single hardcoded admin account (the archive operator) can log in to
 * verify (accept) or reject on-hold defacement submissions. Session state is
 * held in a signed httpOnly cookie — no database table needed.
 */

// Admin credentials (archive operator).
const ADMIN_USERNAME = "GadaLuBau";
const ADMIN_PASSWORD = "slametwkw";

// HMAC secret. Prefer an env var in production; fall back to a fixed dev key.
const SECRET =
  process.env.AUTH_SECRET || "sam1337-archive-hmac-secret-please-override-in-prod";

export const SESSION_COOKIE_NAME = "sam1337_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface Session {
  username: string;
}

/** Verify admin username/password. */
export function verifyCredentials(
  username: string,
  password: string,
): boolean {
  // Constant-time-ish comparison to avoid trivial timing leaks.
  const u = Buffer.from(String(username ?? ""));
  const p = Buffer.from(String(password ?? ""));
  const eu = Buffer.from(ADMIN_USERNAME);
  const ep = Buffer.from(ADMIN_PASSWORD);
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
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/** Verify a token's signature + expiry, returning the username or null. */
export function verifySessionToken(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 1) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);

  const expected = crypto
    .createHmac("sha256", SECRET)
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
