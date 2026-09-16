import type { ArchiveFilter, ViewName } from "@/components/zone/types";

/**
 * URL ↔ view mapping for the SAM1337 archive.
 *
 * The app is a single Next.js route at `/`, but we expose friendly URL paths
 * (rewritten back to `/` in next.config.ts). The client reads
 * `window.location.pathname` to pick the view and uses `history.pushState` on
 * navigation so the URL bar always reflects the current view.
 *
 *   /                          → home
 *   /notify                    → home + open Notify dialog
 *   /archive                   → archive (all)
 *   /onhold                    → archive, status=onhold
 *   /special                   → archive, type=special
 *   /leaderboard/attacker      → rank, attacker tab
 *   /leaderboard/team          → rank, team tab
 *   /report/:id                → mirror view for defacement :id
 */

export interface RouteState {
  name: ViewName;
  defacementId?: string;
  filter?: ArchiveFilter;
  /** Rank-view tab (attacker | team). */
  tab?: "attacker" | "team";
  /** Extra UI hint, e.g. "open the notify dialog" on the home view. */
  action?: "notify";
}

/** Parse a URL pathname into a RouteState. */
export function pathToView(pathname: string): RouteState {
  const p = pathname.replace(/\/+$/, "") || "/";

  if (p === "/notify") return { name: "home", action: "notify" };
  if (p === "/archive") return { name: "archive" };
  if (p === "/onhold") return { name: "archive", filter: { status: "onhold" } };
  if (p === "/special") return { name: "archive", filter: { type: "special" } };
  if (p === "/leaderboard/attacker")
    return { name: "rank", tab: "attacker" };
  if (p === "/leaderboard/team") return { name: "rank", tab: "team" };

  const reportMatch = p.match(/^\/report\/(.+)$/);
  if (reportMatch) {
    return { name: "mirror", defacementId: decodeURIComponent(reportMatch[1]) };
  }

  return { name: "home" };
}

/** Convert a RouteState into a URL pathname. */
export function viewToPath(state: RouteState): string {
  if (state.action === "notify") return "/notify";
  switch (state.name) {
    case "home":
      return "/";
    case "archive":
      if (state.filter?.status === "onhold") return "/onhold";
      if (state.filter?.type === "special") return "/special";
      return "/archive";
    case "rank":
      return state.tab === "team"
        ? "/leaderboard/team"
        : "/leaderboard/attacker";
    case "mirror":
      return state.defacementId
        ? `/report/${encodeURIComponent(state.defacementId)}`
        : "/";
    default:
      return "/";
  }
}
