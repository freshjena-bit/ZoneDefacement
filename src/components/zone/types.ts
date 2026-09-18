// Shared types for the DefacerID mirror archive UI.

export type ReporterLevel = "LEGEND" | "PRO" | "ELITE" | "ROOKIE";
export type DefacementStatus = "approved" | "onhold";

/** A defacement row returned from list endpoints (no `mirrorHtml`). */
export interface Defacement {
  id: string;
  attacker: string;
  team: string | null;
  targetUrl: string;
  targetDomain: string;
  os: string;
  countryCode: string | null;
  isHome: boolean;
  isMass: boolean;
  isRedeface: boolean;
  isSpecial: boolean;
  reporterLevel: ReporterLevel;
  status: DefacementStatus;
  mirrorTitle: string | null;
  capturedAt: string; // ISO string from JSON
}

/** A full defacement including the mirrored HTML payload. */
export interface DefacementFull extends Defacement {
  mirrorHtml: string;
}

export interface Stats {
  verifiedReports: number;
  uniqueHosts: number;
  reporters: number;
  submittedToday: number;
  attackersToday: number;
  rankings: {
    attackers: Array<{ name: string; count: number; level: ReporterLevel }>;
    teams: Array<{ name: string; count: number }>;
  };
}

export type ViewName = "home" | "archive" | "mirror" | "rank";

export interface AdminUser {
  username: string;
}

export interface ViewState {
  name: ViewName;
  defacementId?: string;
  /** Optional pre-applied filter for the archive view (e.g. attacker/team/special). */
  filter?: ArchiveFilter;
  /** Rank-view tab. */
  tab?: "attacker" | "team";
  /** Extra UI hint, e.g. "open the notify dialog" on the home view. */
  action?: "notify";
}

export interface ArchiveFilter {
  q?: string;
  status?: "approved" | "onhold" | "all";
  type?: "all" | "home" | "mass" | "redeface" | "special";
  os?: string;
  country?: string;
  attacker?: string;
  team?: string;
}

/** Payload for the POST /api/defacements notify/submit form.
 *  Only mode, URL(s), attacker and team are collected from the user.
 *  OS, country, and Home/Mass/Redeface/Special flags are auto-detected
 *  by the backend. */
export interface NotifyPayload {
  mode: "single" | "mass";
  urls: string[];
  attacker: string;
  team?: string;
}

/** Response returned by POST /api/defacements. */
export interface NotifyResult {
  defacements: DefacementFull[];
  skipped: Array<{ error: string; targetUrl: string }>;
  count: number;
  verified: number;
  onhold: number;
  detected: {
    sample: {
      country: string | null;
      os: string;
      isHome: boolean;
      isMass: boolean;
      isRedeface: boolean;
      isSpecial: boolean;
      autoVerified: boolean;
      status: string;
    } | null;
  };
}
