"use client";

import { useEffect, useState } from "react";
import { Search, History, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useSites } from "./hooks";
import { SiteCard } from "./site-card";
import type { Site } from "./types";

export function ArchiveGrid({
  onSelectSite,
  gridRef,
}: {
  onSelectSite: (site: Site) => void;
  gridRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [q, setQ] = useState("");

  // Debounce search input ~300ms.
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, isError, refetch } = useSites(debounced);
  const sites = data?.sites ?? [];

  // Aggregate stats from the loaded sites.
  const totalSnapshots = sites.reduce(
    (sum, s) => sum + (s._count?.snapshots ?? 0),
    0,
  );

  return (
    <section id="archive-grid" className="px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <History className="size-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
                Recently Archived
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {sites.length} {sites.length === 1 ? "site" : "sites"} ·{" "}
                {totalSnapshots}{" "}
                {totalSnapshots === 1 ? "snapshot" : "snapshots"} captured
              </p>
            </div>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
            <Input
              type="search"
              placeholder="Search archives…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 border-stone-300 bg-white pl-9 pr-3 text-sm shadow-sm focus-visible:border-amber-500 focus-visible:ring-amber-500/30 dark:border-stone-700 dark:bg-stone-900"
              aria-label="Search archives"
            />
          </div>
        </div>

        <div
          ref={gridRef}
          className="mt-6 max-h-[640px] overflow-y-auto thin-scrollbar pr-1"
        >
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <Skeleton className="size-9 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                  <div className="mt-4 border-t border-stone-100 pt-3 dark:border-stone-800">
                    <Skeleton className="h-4 w-24" />
                  </div>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Failed to load archives.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-sm font-medium text-amber-600 hover:underline dark:text-amber-500"
              >
                Retry
              </button>
            </Card>
          ) : sites.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <Archive className="size-6" />
              </div>
              <div>
                <p className="font-semibold text-stone-900 dark:text-stone-50">
                  No archives {q ? "match your search" : "yet"}
                </p>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {q
                    ? "Try a different keyword."
                    : "Capture your first webpage above!"}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onClick={() => onSelectSite(site)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
