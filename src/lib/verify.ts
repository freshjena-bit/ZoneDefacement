/**
 * Auto-verification for defacement submissions.
 *
 * A submission is auto-verified (approved) when the mirrored page content
 * contains a defacement signature attributed to the reporting attacker:
 *   - "hacked by {attacker}"
 *   - "touched by {attacker}"
 *
 * The match is case-insensitive for both the phrase and the attacker name,
 * and allows minor separators (colons, extra whitespace) between the phrase
 * and the name. If the signature is not found, the submission is placed on
 * hold for manual review by an admin.
 */

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip HTML tags + entities to plain text, normalized for matching. */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns true if the mirror HTML contains a defacement signature
 * ("hacked by {attacker}" or "touched by {attacker}"), case-insensitive.
 */
export function mirrorSignatureMatches(
  html: string,
  attacker: string,
): boolean {
  if (!html || !attacker) return false;

  const text = htmlToPlainText(html).toLowerCase();
  const name = attacker.toLowerCase().trim();
  if (!name || text.length === 0) return false;

  const namePattern = escapeRegex(name);
  // "hacked by" / "touched by" / "owned by", optionally followed by colons,
  // hyphens, or whitespace, then the attacker name. Handles variants like
  // "Hacked by NAME", "Hacked by: NAME", "Hacked by - NAME", etc.
  const patterns = [
    new RegExp(`hacked\\s+by[\\s:\\-]{0,6}${namePattern}`, "i"),
    new RegExp(`touched\\s+by[\\s:\\-]{0,6}${namePattern}`, "i"),
    new RegExp(`owned\\s+by[\\s:\\-]{0,6}${namePattern}`, "i"),
  ];

  return patterns.some((p) => p.test(text));
}
