"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ArchiveFilter,
  DefacementFull,
  NotifyPayload,
  NotifyResult,
  Stats,
  Defacement,
} from "./types";

/** Build a query string from an ArchiveFilter object. */
function filterToQuery(f: ArchiveFilter | undefined): string {
  if (!f) return "";
  const p = new URLSearchParams();
  if (f.q && f.q.trim()) p.set("q", f.q.trim());
  if (f.status && f.status !== "all") p.set("status", f.status);
  if (f.type && f.type !== "all") p.set("type", f.type);
  if (f.os && f.os !== "all") p.set("os", f.os);
  if (f.country && f.country !== "all") p.set("country", f.country);
  if (f.attacker) p.set("attacker", f.attacker);
  if (f.team) p.set("team", f.team);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export interface ListResult {
  defacements: Defacement[];
  total: number;
}

/** Fetch a paginated, filtered list of defacements. */
export function useDefacements(
  filter: ArchiveFilter | undefined,
  opts: { limit: number; offset: number; enabled?: boolean },
) {
  const base = filterToQuery(filter);
  const sep = base ? "&" : "?";
  const qs = `${base}${sep}limit=${opts.limit}&offset=${opts.offset}`;
  return useQuery<ListResult>({
    queryKey: ["defacements", filter, opts.limit, opts.offset],
    queryFn: async () => {
      const r = await fetch(`/api/defacements${qs}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`Failed to load defacements (${r.status})`);
      return (await r.json()) as ListResult;
    },
    enabled: opts.enabled ?? true,
  });
}

/** Fetch the top 15 approved (home Latest panel). */
export function useLatestDefacements() {
  return useQuery<Defacement[]>({
    queryKey: ["defacements", "latest"],
    queryFn: async () => {
      const r = await fetch(`/api/defacements?latest=1`, { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load latest");
      const j = (await r.json()) as ListResult;
      return j.defacements;
    },
  });
}

/** Fetch the top 5 onhold (home On Hold panel). */
export function useOnholdDefacements() {
  return useQuery<Defacement[]>({
    queryKey: ["defacements", "onhold"],
    queryFn: async () => {
      const r = await fetch(`/api/defacements?onhold=1`, { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load onhold");
      const j = (await r.json()) as ListResult;
      return j.defacements;
    },
  });
}

/** Fetch a single defacement including the mirrored HTML. */
export function useDefacement(id: string | null | undefined) {
  return useQuery<{ defacement: DefacementFull }>({
    queryKey: ["defacement", id],
    queryFn: async () => {
      const r = await fetch(`/api/defacements/${id}`, { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load defacement");
      return (await r.json()) as { defacement: DefacementFull };
    },
    enabled: Boolean(id),
  });
}

/** Fetch site metrics + top-10 attacker/team rankings. */
export function useStats() {
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const r = await fetch(`/api/stats`, { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load stats");
      return (await r.json()) as Stats;
    },
  });
}

/** Submit a new defacement (Notify). Returns the created onhold records and
 *  a summary of what the backend auto-detected. */
export function useCreateDefacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NotifyPayload) => {
      const r = await fetch(`/api/defacements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error((j as any)?.error ?? `Submit failed (${r.status})`);
      }
      return j as NotifyResult;
    },
    onSuccess: () => {
      // Invalidate all defacement list/stats queries so the new onhold
      // submission appears immediately in the archive + onhold panels.
      qc.invalidateQueries({ queryKey: ["defacements"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
