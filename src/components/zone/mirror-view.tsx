"use client";

import { useMemo } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Home as HomeIcon,
  Layers,
  RefreshCw,
  Star,
  Globe,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "./level-badge";
import { useDefacement } from "./hooks";

interface MirrorViewProps {
  defacementId: string;
  onBack: () => void;
  onPickAttacker: (name: string) => void;
}

function fullDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function TypeChip({
  active,
  label,
  icon: Icon,
}: {
  active: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (!active) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400"
      title={label}
    >
      <Icon className="size-3" /> {label}
    </span>
  );
}

export function MirrorView({ defacementId, onBack, onPickAttacker }: MirrorViewProps) {
  const { data, isLoading, error } = useDefacement(defacementId);
  const def = data?.defacement;

  // Build the sandboxed iframe srcDoc. We deliberately use sandbox="" (no
  // allow-scripts) so any embedded script in the mirrored HTML cannot run.
  const srcDoc = useMemo(() => def?.mirrorHtml ?? "", [def?.mirrorHtml]);

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
      {/* Sticky top metadata bar */}
      <div className="sticky top-14 z-30 -mx-3 mb-4 border-b border-stone-200 bg-white/95 px-3 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 sm:-mx-4 sm:px-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-stone-600 hover:text-red-700 dark:text-stone-300"
          >
            <ArrowLeft className="size-4" /> Back to archive
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded bg-red-600 text-white">
              <Terminal className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-stone-900 dark:text-white">
                {def?.mirrorTitle ?? "Mirror capture"}
              </p>
              <p className="truncate font-mono text-[11px] text-stone-500 dark:text-stone-400">
                {def?.targetUrl ?? "—"}
              </p>
            </div>
          </div>
          {def && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <a
                href={def.targetUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                <ExternalLink className="size-4" /> View live site
              </a>
            </Button>
          )}
        </div>

        {/* Metadata chips */}
        {def && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onPickAttacker(def.attacker)}
              className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700 hover:bg-red-50 hover:text-red-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              {def.attacker}
              <LevelBadge level={def.reporterLevel} />
            </button>
            {def.team && (
              <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                {def.team}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              <Globe className="size-3" />
              {def.countryCode ?? "—"}
            </span>
            <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              {def.os}
            </span>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider"
              title={`Captured at ${fullDate(def.capturedAt)}`}
              style={
                def.status === "onhold"
                  ? {
                      backgroundColor: "rgba(245, 158, 11, 0.12)",
                      color: "#b45309",
                    }
                  : {
                      backgroundColor: "rgba(220, 38, 38, 0.12)",
                      color: "#b91c1c",
                    }
              }
            >
              {def.status}
            </span>
            <TypeChip active={def.isHome} label="Home" icon={HomeIcon} />
            <TypeChip active={def.isMass} label="Mass" icon={Layers} />
            <TypeChip active={def.isRedeface} label="Redeface" icon={RefreshCw} />
            <TypeChip active={def.isSpecial} label="Special" icon={Star} />
          </div>
        )}
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
        Mirror capture — {def ? fullDate(def.capturedAt) : "…"}
      </p>

      {isLoading ? (
        <Skeleton className="h-[70vh] w-full rounded-lg" />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          Failed to load mirror: {error.message}
        </div>
      ) : !def ? (
        <div className="rounded-lg border border-stone-200 bg-white p-6 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900">
          Mirror not found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-300 bg-stone-900 shadow-md dark:border-stone-700">
          {/* Faux browser chrome */}
          <div className="flex items-center gap-2 border-b border-stone-700 bg-stone-800 px-3 py-2">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="mx-2 flex min-w-0 flex-1 items-center gap-2 truncate rounded bg-stone-900 px-2 py-1 font-mono text-[11px] text-stone-400">
              <Globe className="size-3 shrink-0" />
              <span className="truncate">{def.targetUrl}</span>
            </div>
            <span className="rounded bg-red-600 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
              Mirrored
            </span>
          </div>
          {/* Iframe with sandbox (no scripts) so defacement styles apply in isolation */}
          <iframe
            title={`Mirror of ${def.targetUrl}`}
            srcDoc={srcDoc}
            sandbox=""
            className="block h-[70vh] w-full border-0 bg-black"
          />
        </div>
      )}

      {/* Details card */}
      {def && (
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200">
            Capture details
          </h3>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Attacker" value={def.attacker} />
            <Detail label="Team" value={def.team ?? "—"} />
            <Detail label="Target URL" value={def.targetUrl} mono />
            <Detail label="Domain" value={def.targetDomain} mono />
            <Detail label="OS" value={def.os} />
            <Detail
              label="Country"
              value={def.countryCode ?? "—"}
            />
            <Detail label="Reporter level" value={def.reporterLevel} />
            <Detail label="Status" value={def.status} />
            <Detail label="Captured at" value={fullDate(def.capturedAt)} mono />
          </dl>

          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-medium text-stone-500 hover:text-red-700 dark:text-stone-400 dark:hover:text-red-400">
              View raw mirror HTML ({def.mirrorHtml.length.toLocaleString()} bytes)
            </summary>
            <pre className="mt-2 max-h-72 overflow-auto thin-scrollbar rounded-md bg-stone-950 p-3 font-mono text-[11px] leading-relaxed text-stone-300">
              {def.mirrorHtml}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
        {label}
      </dt>
      <dd
        className={
          "truncate text-stone-700 dark:text-stone-200 " +
          (mono ? "font-mono" : "")
        }
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
