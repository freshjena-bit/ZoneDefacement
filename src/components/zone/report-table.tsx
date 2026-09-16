"use client";

import {
  Home as HomeIcon,
  Layers,
  RefreshCw,
  Star,
  Monitor,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Defacement } from "./types";
import { LevelBadge } from "./level-badge";
import { useApproveDefacement, useRejectDefacement, useSession } from "./hooks";

interface ReportTableProps {
  rows: Defacement[];
  onMirror: (id: string) => void;
  onPickAttacker?: (name: string) => void;
  onPickTeam?: (name: string) => void;
  isLoading?: boolean;
}

// Format the time portion of an ISO date as HH:MM:SS.
function timeOnly(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "--:--:--";
  }
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

function truncateUrl(url: string, n = 38): string {
  if (url.length <= n) return url;
  return url.slice(0, n - 1) + "…";
}

function TypeChip({
  active,
  icon: Icon,
  title,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  if (!active) {
    return (
      <span className="text-stone-300 dark:text-stone-700" title={`Not ${title}`}>
        ·
      </span>
    );
  }
  return (
    <span
      title={title}
      className="inline-flex size-5 items-center justify-center rounded-sm bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
    >
      <Icon className="size-3" />
    </span>
  );
}

function FlagCell({ cc }: { cc: string | null }) {
  if (!cc) {
    return (
      <span className="text-stone-300 dark:text-stone-700" title="No location">
        ·
      </span>
    );
  }
  const code = cc.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      width={28}
      height={20}
      alt={cc}
      title={`Server location: ${cc.toUpperCase()}`}
      className="inline-block rounded-[2px] border border-stone-200 dark:border-stone-700"
      loading="lazy"
    />
  );
}

const BASE_COLUMNS = [
  "TIME",
  "ATTACKER",
  "TEAM",
  "H",
  "M",
  "R",
  "L",
  "S",
  "URL",
  "OS",
  "MIRROR",
] as const;

export function ReportTable({
  rows,
  onMirror,
  onPickAttacker,
  onPickTeam,
  isLoading,
}: ReportTableProps) {
  const { data: admin } = useSession();
  const approveMutation = useApproveDefacement();
  const rejectMutation = useRejectDefacement();
  const isAdmin = Boolean(admin);

  const COLUMNS = isAdmin
    ? ([...BASE_COLUMNS, "ACTIONS"] as const)
    : BASE_COLUMNS;

  function handleApprove(id: string) {
    approveMutation.mutate(id, {
      onSuccess: () =>
        toast.success("Defacement verified", {
          description: "Moved to the verified archive.",
        }),
      onError: (e: unknown) =>
        toast.error("Verify failed", {
          description: e instanceof Error ? e.message : "error",
        }),
    });
  }

  function handleReject(id: string) {
    rejectMutation.mutate(id, {
      onSuccess: () =>
        toast.success("Submission rejected", {
          description: "The on-hold entry was removed.",
        }),
      onError: (e: unknown) =>
        toast.error("Reject failed", {
          description: e instanceof Error ? e.message : "error",
        }),
    });
  }

  return (
    <>
      {/* Single table layout for ALL screen sizes — horizontally scrollable
          so mobile users can swipe to see every column (matches zone-sam1337). */}
      <div className="w-full overflow-x-auto thin-scrollbar">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-stone-100 dark:bg-stone-900">
            <tr className="border-b border-stone-200 dark:border-stone-800">
              {COLUMNS.map((c) => (
                <th
                  key={c}
                  className={
                    "px-2 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 " +
                    (c === "ACTIONS" ? "text-center" : "")
                  }
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-stone-100 dark:border-stone-800/60">
                  {COLUMNS.map((c) => (
                    <td key={c} className="px-2 py-2.5">
                      <div className="h-3 w-full animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading &&
              rows.map((r, idx) => (
                <tr
                  key={r.id}
                  className={
                    "border-b border-stone-100 transition-colors hover:bg-red-50/50 dark:border-stone-800/60 dark:hover:bg-red-950/20 " +
                    (idx % 2 === 1
                      ? "bg-stone-50/60 dark:bg-stone-900/40"
                      : "")
                  }
                >
                  <td
                    className="whitespace-nowrap px-2 py-2 font-mono text-xs tabular-nums text-stone-600 dark:text-stone-400"
                    title={fullDate(r.capturedAt)}
                  >
                    {timeOnly(r.capturedAt)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onPickAttacker?.(r.attacker)}
                        className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                      >
                        {r.attacker}
                      </button>
                      <LevelBadge level={r.reporterLevel} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">
                    {r.team ? (
                      <button
                        onClick={() => onPickTeam?.(r.team)}
                        className="text-xs text-stone-500 hover:text-red-600 hover:underline dark:text-stone-400 dark:hover:text-red-400"
                      >
                        {r.team}
                      </button>
                    ) : (
                      <span className="text-stone-300 dark:text-stone-700">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <TypeChip active={r.isHome} icon={HomeIcon} title="Homepage defacement" />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <TypeChip active={r.isMass} icon={Layers} title="Mass defacement" />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <TypeChip active={r.isRedeface} icon={RefreshCw} title="Redeface" />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <FlagCell cc={r.countryCode} />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <TypeChip active={r.isSpecial} icon={Star} title="Special report" />
                  </td>
                  <td className="max-w-[220px] px-2 py-2">
                    <a
                      href={r.targetUrl}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      title={r.targetUrl}
                      className="block truncate font-mono text-xs text-stone-600 hover:text-red-600 dark:text-stone-400 dark:hover:text-red-400"
                    >
                      {truncateUrl(r.targetUrl)}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">
                    <span className="inline-block rounded-sm bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      {r.os}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => onMirror(r.id)}
                      aria-label="View mirror"
                      title="View mirror capture"
                      className="inline-flex size-6 items-center justify-center rounded text-stone-500 hover:bg-red-600 hover:text-white dark:text-stone-400"
                    >
                      <Monitor className="size-3.5" />
                    </button>
                  </td>
                  {isAdmin && (
                    <td className="px-2 py-2 text-center">
                      {r.status === "onhold" ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={
                              approveMutation.isPending ||
                              rejectMutation.isPending
                            }
                            aria-label="Accept / verify"
                            title="Accept (verify)"
                            className="inline-flex size-6 items-center justify-center rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {approveMutation.isPending &&
                            approveMutation.variables === r.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            disabled={
                              approveMutation.isPending ||
                              rejectMutation.isPending
                            }
                            aria-label="Reject / delete"
                            title="Reject (delete)"
                            className="inline-flex size-6 items-center justify-center rounded bg-stone-300 text-stone-700 hover:bg-stone-400 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600 disabled:opacity-50"
                          >
                            {rejectMutation.isPending &&
                            rejectMutation.variables === r.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <X className="size-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-stone-300 dark:text-stone-700">
                          ·
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-sm text-stone-400">
                  No defacements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </>
  );
}
