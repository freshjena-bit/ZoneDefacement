"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Site, SnapshotMeta, SnapshotFull } from "./types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err: any = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    try {
      err.body = await res.json();
    } catch {
      /* ignore */
    }
    throw err;
  }
  return res.json() as Promise<T>;
}

export function useSites(q: string) {
  return useQuery<{ sites: Site[] }>({
    queryKey: ["sites", q],
    queryFn: () =>
      fetchJson(`/api/sites${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });
}

export function useSite(id: string | null) {
  return useQuery<{ site: Site; snapshots: SnapshotMeta[] }>({
    queryKey: ["site", id],
    queryFn: () => fetchJson(`/api/sites/${id}`),
    enabled: !!id,
  });
}

export function useSnapshot(id: string | null) {
  return useQuery<{ snapshot: SnapshotFull; site: Site }>({
    queryKey: ["snapshot", id],
    queryFn: () => fetchJson(`/api/snapshots/${id}`),
    enabled: !!id,
  });
}

export function useArchiveUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? `Archive failed (${res.status})`);
      }
      return data as { site: Site; snapshot: SnapshotFull; warning?: string };
    },
    onSuccess: (data) => {
      // Invalidate relevant queries so the new data shows up.
      qc.invalidateQueries({ queryKey: ["sites"] });
      qc.invalidateQueries({ queryKey: ["site", data.site.id] });
    },
  });
}
