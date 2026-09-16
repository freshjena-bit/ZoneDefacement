# TimeVault — Web Mirror Archive — Worklog

Project: A Wayback-Machine-style web archive application built with Next.js 16.
Single user-visible route: `/`.

## Architecture
- **DB (Prisma/SQLite)**: `Site` (1) → (N) `Snapshot`
- **Backend**: Next.js API routes under `/api/*` using `z-ai-web-dev-sdk` `page_reader` to fetch live page content.
- **Frontend**: Single-page app at `/` with view state (home / archive-detail / snapshot-viewer).
- **Theme**: Warm amber accent (archive/vintage feel), clean neutral background, sticky footer, responsive.

## Views (managed by client state, not routing)
1. **Home** — hero with URL input + "Archive Now", stats, recently archived grid, search.
2. **Archive Detail** — site header, vertical timeline of snapshots, click to view a snapshot.
3. **Snapshot Viewer** — rendered archived HTML + metadata (capture date, original URL, size).

## API routes
- `POST /api/archive` { url } → fetches page, creates/updates Site + Snapshot
- `GET  /api/sites?q=` → list/search archived sites (most recent first)
- `GET  /api/sites/[id]` → site + its snapshots timeline
- `GET  /api/snapshots/[id]` → single snapshot content

---
Task ID: 1
Agent: main (orchestrator)
Task: Define Prisma schema for Site & Snapshot and initialize worklog.

Work Log:
- Designed `Site` model: id, url(unique), domain, title, description, favicon, createdAt, lastArchivedAt, snapshots[]
- Designed `Snapshot` model: id, siteId, capturedAt, title, excerpt, html, text, status, httpStatus, contentLength, publishedTime, captureMs
- Ran `bun run db:push` to apply schema to SQLite

Stage Summary:
- Schema ready. Database pushed successfully. Ready for API + frontend work.

---
Task ID: 3-5
Agent: fullstack-developer
Task: Build the full TimeVault application — backend API routes (using Z.ai page_reader), single-page frontend with view state, amber/stone design system, sticky footer, and synthetic seed data for first-run.

Work Log:
- Created `src/lib/sanitize.ts` — `sanitizeHtml`, `htmlToText`, and `excerpt` utilities (strips script/style/iframe/on*/javascript: URLs, inline styles; converts HTML to plain text; builds short word-boundary excerpts).
- Created `src/lib/url.ts` — `normalizeUrl` (trim, prepend `https://` if missing protocol, strip fragment + trailing slash, lowercase host, validate hostname) and `faviconFor` helper.
- Created `src/lib/seed.ts` — `seedIfEmpty()` inserts 3 synthetic sample archives (example.com, en.wikipedia.org/wiki/Web_archiving, news.ycombinator.com) with realistic past `capturedAt` dates and hand-written HTML excerpts; adds a 2nd older snapshot on the Wikipedia site so the timeline view shows multiple captures. Idempotent — only seeds when zero sites exist.
- Created `src/app/api/archive/route.ts` — POST handler: validates + normalizes URL (400 on invalid), calls `zai.functions.invoke('page_reader', { url })`, measures `captureMs`, upserts `Site` (title from page title with domain fallback, description = first ~160 chars plain text, favicon via Google s2 service, lastArchivedAt = now), creates `Snapshot` (html, excerpt, text, status, contentLength, publishedTime, captureMs). On fetch failure: still upserts Site with title=domain and creates a `status="failed"` snapshot with empty html — returns 200 with a `warning` field. Wrapped in try/catch returning 500 only for truly unexpected errors.
- Created `src/app/api/sites/route.ts` — GET handler: reads optional `q` query param, calls `seedIfEmpty()` first (try/catch-wrapped), filters by `url | title | domain` `contains`, orders by `lastArchivedAt desc` then `createdAt desc`, includes `_count.select.snapshots`. Returns `{ sites }`.
- Created `src/app/api/sites/[id]/route.ts` — GET handler: returns the site plus its snapshots ordered by `capturedAt desc`. Uses Prisma `select` to EXCLUDE the heavy `html` and `text` fields from the snapshots list — only metadata fields are returned. 404 if site not found.
- Created `src/app/api/snapshots/[id]/route.ts` — GET handler: returns the full snapshot (with `html` and `text`) plus its parent `site`. 404 if not found.
- Created `src/components/providers.tsx` — client wrapper composing `ThemeProvider` (next-themes, attribute="class", defaultTheme="light", disableTransitionOnChange), `QueryClientProvider` (TanStack Query, 30s staleTime, no refetchOnWindowFocus), and the sonner `<Toaster />` (top-right, richColors, closeButton).
- Updated `src/app/layout.tsx` — metadata title="TimeVault — Web Mirror Archive" with description + OpenGraph + Twitter card; body wraps children in `<Providers>` (removed the legacy radix Toaster); kept Geist Sans + Geist Mono font variables. Body no longer forces bg (page wrapper handles bg via its own root).
- Updated `src/app/globals.css` — reworked the warm amber/stone color tokens for `:root` (warm off-white `oklch(0.985 0.005 75)` bg, deep stone text, amber `oklch(0.62 0.16 60)` primary) and `.dark` (deep charcoal `oklch(0.16 0.005 50)` bg, lighter amber primary). Added `.thin-scrollbar` utility (6px thumb, amber-tinted, hover effect, dark-mode aware). Added comprehensive `.archive-content` prose styles (h1-h6 sizing, p spacing, amber underlined links with hover, ul/ol padding, img max-width + rounded, code/pre mono with bg, blockquote with amber left border + tinted bg, table styles). NO `@tailwindcss/typography` plugin dependency.
- Built the `src/components/timevault/` component set:
  - `types.ts` — shared `Site`, `SnapshotMeta`, `SnapshotFull` interfaces.
  - `hooks.ts` — `useSites(q)`, `useSite(id)`, `useSnapshot(id)` (TanStack Query), and `useArchiveUrl()` mutation (POST /api/archive, invalidates `sites` + `site:{id}` on success).
  - `theme-toggle.tsx` — light/dark toggle using next-themes; uses `useSyncExternalStore` (NOT useEffect+setState) to track mount state to avoid the lint "set-state-in-effect" rule and hydration mismatch.
  - `header.tsx` — sticky top bar: amber `Layers` logo + "TimeVault" wordmark + "Web Mirror Archive" tagline; ThemeToggle + ghost "Browse" button (scrolls to grid).
  - `hero.tsx` — centered hero: amber pill ("A time machine for the web"), large headline "Capture the web. Preserve it forever.", subtext, prominent URL input (Globe icon prefix, auto-prepends https:// if missing protocol) + amber "Archive Now" button with spinner + "Archiving…" state. sonner toasts on success/warning/error; on success navigates to site detail via `onArchived(siteId)` callback.
  - `site-card.tsx` — responsive card: favicon (with Globe fallback on error), title (truncate 1 line), domain in mono, description (2-line clamp), footer row with amber "N snapshots" badge + relative time ("2h ago") via date-fns `formatDistanceToNow`. Hover lifts border to amber + shadow. Keyboard-accessible (Enter/Space).
  - `archive-grid.tsx` — "Recently Archived" section with History icon, live stats (sites + snapshots count from loaded data), debounced (300ms) search input hitting `useSites(q)`, responsive 1/2/3-col grid in a `max-h-[640px] overflow-y-auto thin-scrollbar` container. Loading skeleton cards, error retry, empty-state card ("No archives yet. Capture your first webpage above!").
  - `snapshot-timeline.tsx` — vertical timeline (left gradient line, dots colored amber for most-recent / red for failed / stone otherwise); each entry: mono date "MMM d, yyyy · HH:mm", title, 2-line excerpt, content size + capture duration + (optional) published-time chips, "view captured content →" affordance. Loading skeleton entries; empty-state with "Capture first snapshot" CTA.
  - `site-detail.tsx` — back button, site header card (favicon + title + clickable URL with ExternalLink in new tab + description + stats "N snapshots · first archived X · last archived Y"), amber "Capture new snapshot" button (calls `/api/archive` with the site URL, refetches timeline, sonner toast). Loading + error skeletons.
  - `snapshot-viewer.tsx` — sticky top bar (back button + truncated title + metadata chips: capture date / content size / capture duration / published time / original URL with ExternalLink). Content area: sanitizes snapshot.html via `sanitizeHtml`, renders inside `<article class="archive-content">` with `dangerouslySetInnerHTML`, max-w-3xl mx-auto, white card bg with border. Friendly "No content captured" state if status=failed or html empty. Footer line with capture date + URL.
  - `footer.tsx` — sticky footer (mt-auto): amber Layers icon + "TimeVault · A web mirror archive" + "Built with Next.js & the Z.ai page reader · © {year}". Subtle muted text on stone-tinted bg with top border.
- Rewrote `src/app/page.tsx` — client component with `view: 'home' | 'site' | 'snapshot'` state, `selectedSiteId`, `selectedSnapshotId`, grid ref for "Browse" smooth-scroll. Root wrapper is `min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950`, `<main className="flex-1">`, footer at bottom via `mt-auto`. Auto-scrolls to top on view change.
- Verified all four API endpoints with curl:
  - `GET /api/sites` → 200, returns 3 seeded sites with `_count.snapshots`.
  - `GET /api/sites/{id}` → 200, returns site + metadata-only snapshots (no html/text fields).
  - `GET /api/snapshots/{id}` → 200, returns full snapshot including html + text.
  - `POST /api/archive` with `{ "url": "invalid url with spaces" }` → 400 `{ "error": "Invalid URL" }`.
  - `GET /` → 200 with all expected content ("TimeVault", "Capture the web", "Recently Archived", "Archive Now", "Web Mirror").
- Fixed lint errors:
  - Removed accidental self-import `import { seedIfEmpty } from "@/lib/seed"` inside `seed.ts` itself (was causing a "defined multiple times" Turbopack compile error).
  - `theme-toggle.tsx`: replaced `useEffect(() => setMounted(true), [])` with `useSyncExternalStore` to satisfy the `react-hooks/set-state-in-effect` rule without losing the SSR-safe mount gate.
  - `snapshot-viewer.tsx`: rewrote two `useMemo` blocks to capture the optional-chained value into a local `const` before using it — satisfies the `react-hooks/preserve-manual-memoization` rule.
  - `site-detail.tsx`: removed an unused `eslint-disable-next-line @next/next/no-img-element` directive.
- Final `bun run lint` → exit code 0, zero warnings/errors. Dev log is clean (only Prisma query logs from the verbose client and a benign cross-origin dev warning).

Stage Summary:
- Full TimeVault application is live and end-to-end functional on the existing dev server (port 3000).
- Backend: 4 API routes (`/api/archive`, `/api/sites`, `/api/sites/[id]`, `/api/snapshots/[id]`) all working; uses Z.ai `page_reader` for live captures, gracefully degrades to a "failed" snapshot on fetch errors.
- Frontend: single `/` route with three view states (home / site-detail / snapshot-viewer), warm amber + stone design system (no indigo/blue), light/dark theme via next-themes, sticky footer, mobile-responsive throughout, sonner toasts for all async feedback, TanStack Query for server state, debounced search, skeleton loaders, and friendly empty states.
- Database auto-seeds 3 synthetic sample archives on first `GET /api/sites` so the UI is never empty.
- `bun run lint` passes cleanly. No compile errors in `dev.log`.
- Ready for orchestrator's final verification (Agent Browser).

---
Task ID: 7
Agent: main (orchestrator)
Task: End-to-end verification with Agent Browser.

Work Log:
- Opened http://localhost:3000 — homepage rendered with hero ("Capture the web. Preserve it forever."), URL input + "Archive Now" button, and "Recently Archived" grid with 3 seeded sites (Hacker News, Web archiving Wikipedia, Example Domain).
- Tested archive flow: typed "https://example.org" → clicked Archive Now → page_reader fetched live content → POST /api/archive returned 200 in 5.4s → auto-navigated to site detail view with the new snapshot in the timeline.
- Tested site detail view: site header (favicon, title, URL, "Capture new snapshot" button), snapshot timeline with dates, content sizes, capture durations, "view captured content" affordance.
- Tested snapshot viewer: rendered archived HTML content (headings, links, paragraphs) with back button, live-site link, and metadata chips.
- Tested search: typed "hacker" in search box → grid filtered to only the Hacker News card.
- Tested dark mode toggle: button label changed to "Switch to light mode", theme applied.
- Checked console + page errors: none.
- Checked sticky footer: footer uses position:static with min-h-screen flex-col wrapper (mt-auto pattern) — sticks on short pages, pushes down naturally on long pages. No overlay.
- Checked color theme: "Archive Now" button LAB = (60, 40.56, 87.12) = amber/orange. VLM confirmed NO blue/indigo.
- VLM visual analysis: "clean, minimalist layout... orange and black, no blue or indigo... footer visible at the very bottom... visually polished."
- bun run lint: 0 errors. Dev log: clean (only Prisma query logs + benign cross-origin dev warning).

Stage Summary:
- TimeVault is fully functional and visually polished. All core flows verified end-to-end in the browser:
  1) Archive a live URL (real content capture via Z.ai page_reader)
  2) Browse recently archived sites
  3) Search/filter archives
  4) View site detail with snapshot timeline
  5) View rendered archived content
  6) Toggle dark/light theme
- Sticky footer, responsive layout, amber theme all confirmed. No console errors, lint clean.
