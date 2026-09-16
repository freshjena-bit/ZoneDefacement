/**
 * Lightweight HTML sanitizer for archived page content.
 *
 * Strips dangerous constructs while preserving readable article markup:
 *   - removes <script>, <style>, <iframe>, <object>, <embed>, <link>, <meta> entirely
 *   - removes event handler attributes (onClick, onerror, ...)
 *   - removes javascript: URLs from href/src
 *   - removes style attributes (no inline CSS injection)
 *
 * This is intentionally simple and dependency-free. The page_reader output is
 * already extracted article HTML, so we only need to neutralize the few vectors
 * that could execute script or load remote tracking resources when rendered via
 * dangerouslySetInnerHTML.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  let html = input;

  // 1. Drop entire dangerous tags (with their contents).
  html = html.replace(
    /<(script|style|iframe|object|embed|link|meta|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi,
    "",
  );
  // Self-closing variants of the same tags.
  html = html.replace(
    /<(script|style|iframe|object|embed|link|meta|noscript|template|svg)\b[^>]*\/?>/gi,
    "",
  );

  // 2. Remove HTML comments (sometimes used to hide conditional IE scripts).
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  // 3. Strip on* event handler attributes (onclick, onerror, onload, ...).
  html = html.replace(/\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 4. Neutralize javascript: URLs on href / src / action / formaction.
  html = html.replace(
    /(\b(?:href|src|action|formaction|data|poster)\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi,
    (match, prefix, dq, sq) => {
      const url = (dq ?? sq ?? "").trim();
      if (/^\s*javascript:/i.test(url) || /^\s*vbscript:/i.test(url)) {
        return `${prefix}""`;
      }
      return match;
    },
  );

  // 5. Remove inline style attributes (avoid CSS-based tricks / data-urls).
  html = html.replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");

  return html;
}

/**
 * Convert HTML to plain text. Used for excerpts and full-text snapshots.
 */
export function htmlToText(input: string): string {
  if (!input) return "";
  return input
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Produce a short excerpt from plain text (first ~n chars at a word boundary).
 */
export function excerpt(text: string, n = 200): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= n) return clean;
  const slice = clean.slice(0, n);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > n * 0.6 ? slice.slice(0, lastSpace) : slice).trim() + "…";
}
