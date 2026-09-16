/**
 * Shared URL utilities for the TimeVault API routes.
 */

export interface NormalizedUrl {
  url: string; // full normalized URL (with protocol, no trailing slash, no fragment)
  domain: string; // hostname (e.g. "example.com")
  displayUrl: string; // human-friendly, same as url
}

/**
 * Normalize a user-supplied URL string.
 * - trim whitespace
 * - prepend https:// if no protocol
 * - strip fragment (#...)
 * - strip trailing slash on the path (but keep root "/")
 * - validate it parses and has a hostname
 *
 * Throws on invalid input.
 */
export function normalizeUrl(raw: string): NormalizedUrl {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    throw new Error("URL is required");
  }

  let withProto = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(withProto)) {
    withProto = `https://${withProto}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(withProto);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    throw new Error("Invalid URL: missing hostname");
  }

  // Strip fragment, lowercase host.
  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();

  // Strip trailing slash on path (but keep "/" for root).
  let path = parsed.pathname;
  if (path.length > 1 && path.endsWith("/")) {
    path = path.replace(/\/+$/, "");
  }
  parsed.pathname = path;

  const url = parsed.toString();
  return {
    url,
    domain: parsed.hostname,
    displayUrl: url,
  };
}

export function faviconFor(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}
