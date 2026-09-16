"use client";

import { useMemo, useState } from "react";
import {
  format,
  formatDistanceToNow,
} from "date-fns";
import {
  ArrowLeft,
  ExternalLink,
  Archive,
  Loader2,
  Globe,
  Camera,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSite, useArchiveUrl } from "./hooks";
import { SnapshotTimeline } from "./snapshot-timeline";
import type { SnapshotMeta } from "./types";

export function SiteDetail({
  siteId,
  onBack,
  onSelectSnapshot,
}: {
  siteId: string;
  onBack: () => void;
  onSelectSnapshot: (snapshot: SnapshotMeta) => void;
}) {
  const { data, isLoading, isError, refetch } = useSite(siteId);
  const archive = useArchiveUrl();
  const [capturing, setCapturing] = useState(false);

  const site = data?.site;
  const snapshots = data?.snapshots ?? [];

  const stats = useMemo(() => {
    if (!snapshots.length) return { count: 0, first: null, last: null };
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.capturedAt).getTime() -
        new Date(b.capturedAt).getTime(),
    );
    return {
      count: sorted.length,
      first: new Date(sorted[0].capturedAt),
      last: new Date(sorted[sorted.length - 1].capturedAt),
    };
  }, [snapshots]);

  async function handleCaptureNew() {
    if (!site) return;
    setCapturing(true);
    try {
      const result = await archive.mutateAsync(site.url);
      if (result.warning) {
        toast.warning("Snapshot saved with issues", {
          description: result.warning,
        });
      } else {
        toast.success("New snapshot captured!", {
          description: `Fresh capture of ${site.domain}.`,
        });
      }
      await refetch();
    } catch (err: any) {
      toast.error("Capture failed", {
        description: err?.message ?? "Please try again.",
      });
    } finally {
      setCapturing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <Card className="mt-4 p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="size-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </Card>
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !site) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="size-4" />
          Back to archive
        </Button>
        <Card className="p-8 text-center">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Couldn&apos;t load this archive.
          </p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="mt-4"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 text-stone-700 hover:bg-amber-50 hover:text-amber-700 dark:text-stone-300 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
      >
        <ArrowLeft className="size-4" />
        Back to archive
      </Button>

      <Card className="overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
            {site.favicon ? (
              <img
                src={site.favicon}
                alt=""
                className="size-8 rounded object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Globe className="size-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-balance text-xl font-bold tracking-tight text-stone-900 sm:text-2xl dark:text-stone-50">
              {site.title}
            </h1>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400"
            >
              <span className="max-w-full truncate">{site.url}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
            {site.description && (
              <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
                {site.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
              <span className="inline-flex items-center gap-1">
                <Camera className="size-3" />
                {stats.count} {stats.count === 1 ? "snapshot" : "snapshots"}
              </span>
              {stats.first && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  first archived {formatDistanceToNow(stats.first, { addSuffix: true })}
                </span>
              )}
              {stats.last && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  last archived {formatDistanceToNow(stats.last, { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={handleCaptureNew}
            disabled={capturing}
            className="shrink-0 bg-amber-600 text-amber-50 hover:bg-amber-700 focus-visible:ring-amber-500/40 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            {capturing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Capturing…
              </>
            ) : (
              <>
                <Archive className="size-4" />
                Capture new snapshot
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-stone-900 dark:text-stone-50">
          <Clock className="size-4 text-amber-600 dark:text-amber-500" />
          Snapshot timeline
        </h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {snapshots.length > 0
            ? `Most recent first · ${snapshots.length} total`
            : "No snapshots yet"}
        </p>

        <SnapshotTimeline
          snapshots={snapshots}
          isLoading={false}
          onSelect={onSelectSnapshot}
          onCaptureNew={handleCaptureNew}
          capturing={capturing}
        />
      </div>
    </div>
  );
}

// Helper exported so other components can format dates consistently if needed.
export function formatDateLabel(d: Date): string {
  return format(d, "MMM d, yyyy · HH:mm");
}
