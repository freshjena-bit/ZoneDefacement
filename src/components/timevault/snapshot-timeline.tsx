"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Clock, FileText, Loader2, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { SnapshotMeta } from "./types";

function formatBytes(n: number | null | undefined): string {
  if (n == null || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function formatMs(n: number | null | undefined): string {
  if (n == null || n <= 0) return "—";
  if (n < 1000) return `${n} ms`;
  return `${(n / 1000).toFixed(2)} s`;
}

function TimelineEntry({
  snapshot,
  isFirst,
  onClick,
}: {
  snapshot: SnapshotMeta;
  isFirst: boolean;
  onClick: () => void;
}) {
  const date = useMemo(() => {
    try {
      return new Date(snapshot.capturedAt);
    } catch {
      return null;
    }
  }, [snapshot.capturedAt]);

  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <span
        className={`absolute left-[7px] top-2 size-3 rounded-full ring-4 ring-stone-50 dark:ring-stone-950 ${
          snapshot.status === "failed"
            ? "bg-red-400 dark:bg-red-500"
            : isFirst
              ? "bg-amber-500 dark:bg-amber-400"
              : "bg-stone-400 dark:bg-stone-600"
        }`}
      />
      <Card
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className="cursor-pointer gap-2 p-4 transition-all hover:border-amber-400 hover:shadow-sm focus-visible:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 dark:hover:border-amber-600"
      >
        <div className="flex items-center justify-between gap-3">
          <time className="font-mono text-xs text-stone-500 dark:text-stone-400">
            {date ? format(date, "MMM d, yyyy · HH:mm") : "—"}
          </time>
          {snapshot.status === "failed" && (
            <Badge
              variant="outline"
              className="border-red-300 text-red-600 dark:border-red-800 dark:text-red-400"
            >
              failed
            </Badge>
          )}
        </div>
        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          {snapshot.title}
        </h4>
        {snapshot.excerpt && (
          <p className="line-clamp-2 text-xs text-stone-600 dark:text-stone-400">
            {snapshot.excerpt}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500 dark:text-stone-500">
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3" />
            {formatBytes(snapshot.contentLength)}
          </span>
          {snapshot.captureMs != null && snapshot.captureMs > 0 && (
            <span className="inline-flex items-center gap-1">
              <Zap className="size-3" />
              {formatMs(snapshot.captureMs)}
            </span>
          )}
          {snapshot.publishedTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              published {snapshot.publishedTime.slice(0, 10)}
            </span>
          )}
          <span className="ml-auto text-amber-600 hover:underline dark:text-amber-500">
            view captured content →
          </span>
        </div>
      </Card>
    </div>
  );
}

export function SnapshotTimeline({
  snapshots,
  isLoading,
  onSelect,
  onCaptureNew,
  capturing,
}: {
  snapshots: SnapshotMeta[];
  isLoading: boolean;
  onSelect: (snapshot: SnapshotMeta) => void;
  onCaptureNew: () => void;
  capturing: boolean;
}) {
  if (isLoading) {
    return (
      <div className="relative mt-6 space-y-4 pl-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="relative pl-0">
            <span className="absolute -left-[1px] top-3 size-3 rounded-full bg-stone-200 dark:bg-stone-700" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <Card className="mt-6 p-8 text-center">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          No snapshots yet.
        </p>
        <Button
          onClick={onCaptureNew}
          disabled={capturing}
          className="mt-4 bg-amber-600 text-amber-50 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
        >
          {capturing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Capturing…
            </>
          ) : (
            "Capture first snapshot"
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="relative mt-6">
      {/* The vertical line */}
      <div className="absolute left-[8px] top-2 bottom-2 w-px bg-gradient-to-b from-amber-400 via-stone-200 to-transparent dark:via-stone-700" />
      <div className="space-y-4">
        {snapshots.map((s, i) => (
          <TimelineEntry
            key={s.id}
            snapshot={s}
            isFirst={i === 0}
            onClick={() => onSelect(s)}
          />
        ))}
      </div>
    </div>
  );
}
