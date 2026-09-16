// Shared types for the SAM1337 defacement mirror archive UI.

export type ReporterLevel = "ADMIN" | "LEGEND" | "ELITE" | "PRO" | "ROOKIE";
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

export interface ViewState {
  name: ViewName;
  defacementId?: string;
  /** Optional pre-applied filter for the archive view (e.g. attacker/team/special). */
  filter?: ArchiveFilter;
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

/** Payload for the POST /api/defacements notify/submit form. */
export interface NotifyPayload {
  targetUrl: string;
  attacker: string;
  team?: string;
  os: string;
  countryCode?: string;
  isHome: boolean;
  isMass: boolean;
  isRedeface: boolean;
  isSpecial: boolean;
}
