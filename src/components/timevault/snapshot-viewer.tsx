"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Zap,
  Clock,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/sanitize";
import { useSnapshot } from "./hooks";

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

function Chip({
  icon,
  children,
  title,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
    >
      {icon}
      {children}
    </span>
  );
}

export function SnapshotViewer({
  snapshotId,
  onBack,
}: {
  snapshotId: string;
  onBack: () => void;
}) {
  const { data, isLoading, isError, refetch } = useSnapshot(snapshotId);
  const snapshot = data?.snapshot;
  const site = data?.site;

  const sanitizedHtml = useMemo(() => {
    const html = snapshot?.html ?? "";
    if (!html) return "";
    return sanitizeHtml(html);
  }, [snapshot?.html]);

  const capturedDate = useMemo(() => {
    const raw = snapshot?.capturedAt;
    if (!raw) return null;
    try {
      return new Date(raw);
    } catch {
      return null;
    }
  }, [snapshot?.capturedAt]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <Card className="mt-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </Card>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !snapshot || !site) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="size-4" />
          Back to timeline
        </Button>
        <Card className="p-8 text-center">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Couldn&apos;t load this snapshot.
          </p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const failed = snapshot.status === "failed" || !snapshot.html;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      {/* Sticky top bar */}
      <div className="sticky top-16 z-20 -mx-4 mb-6 border-b border-stone-200 bg-stone-50/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 dark:border-stone-800 dark:bg-stone-950/85">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-stone-700 hover:bg-amber-50 hover:text-amber-700 dark:text-stone-300 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
            >
              <ArrowLeft className="size-4" />
              Back to timeline
            </Button>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline dark:text-amber-500"
            >
              View live site
              <ExternalLink className="size-3" />
            </a>
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-stone-900 sm:text-lg dark:text-stone-50">
              {snapshot.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {capturedDate && (
              <Chip
                icon={<Calendar className="size-3" />}
                title="Capture date"
              >
                <span className="font-mono">
                  {format(capturedDate, "MMM d, yyyy · HH:mm")}
                </span>
              </Chip>
            )}
            <Chip icon={<FileText className="size-3" />} title="Content size">
              {formatBytes(snapshot.contentLength)}
            </Chip>
            {snapshot.captureMs != null && snapshot.captureMs > 0 && (
              <Chip icon={<Zap className="size-3" />} title="Capture duration">
                {formatMs(snapshot.captureMs)}
              </Chip>
            )}
            {snapshot.publishedTime && (
              <Chip icon={<Clock className="size-3" />} title="Article publish time">
                <span className="font-mono">
                  published {snapshot.publishedTime.slice(0, 10)}
                </span>
              </Chip>
            )}
          </div>

          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 truncate font-mono text-[11px] text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400"
          >
            <span className="truncate">{site.url}</span>
            <ExternalLink className="size-3 shrink-0" />
          </a>
        </div>
      </div>

      {/* Content area */}
      {failed ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <p className="font-semibold text-stone-900 dark:text-stone-50">
              No content captured for this snapshot
            </p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              The live page couldn&apos;t be retrieved when this snapshot was
              taken. Try capturing a new one.
            </p>
          </div>
        </Card>
      ) : (
        <article className="archive-content rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8 dark:border-stone-800 dark:bg-stone-900">
          <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </article>
      )}

      <p className="mt-6 border-t border-stone-200 pt-4 text-center text-xs text-stone-500 dark:border-stone-800 dark:text-stone-500">
        {capturedDate ? (
          <>
            Captured on{" "}
            <span className="font-mono">
              {format(capturedDate, "MMM d, yyyy 'at' HH:mm")}
            </span>{" "}
            ·{" "}
          </>
        ) : null}
        <span className="font-mono">{site.url}</span>
      </p>
    </div>
  );
}
