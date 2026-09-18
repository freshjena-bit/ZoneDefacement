"use client";

import { Trophy, Users, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "./level-badge";
import type { Stats } from "./types";

interface RankPanelsProps {
  stats: Stats | undefined;
  isLoading: boolean;
  onPickAttacker?: (name: string) => void;
  onPickTeam?: (name: string) => void;
  onFullRank?: () => void;
}

export function RankPanels({
  stats,
  isLoading,
  onPickAttacker,
  onPickTeam,
  onFullRank,
}: RankPanelsProps) {
  const attackers = stats?.rankings.attackers ?? [];
  const teams = stats?.rankings.teams ?? [];

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <RankPanel
        title="Top 10 Attacker"
        icon={Trophy}
        rows={attackers.map((a) => ({
          name: a.name,
          count: a.count,
          level: a.level,
        }))}
        isLoading={isLoading}
        onPick={onPickAttacker}
        onFull={onFullRank}
      />
      <RankPanel
        title="Top 10 Team"
        icon={Users}
        rows={teams.map((t) => ({ name: t.name, count: t.count }))}
        isLoading={isLoading}
        onPick={onPickTeam}
        onFull={onFullRank}
      />
    </section>
  );
}

interface RankRow {
  name: string;
  count: number;
  level?: "ADMIN" | "LEGEND" | "ELITE" | "PRO" | "ROOKIE";
}

function RankPanel({
  title,
  icon: Icon,
  rows,
  isLoading,
  onPick,
  onFull,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: RankRow[];
  isLoading: boolean;
  onPick?: (name: string) => void;
  onFull?: () => void;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        <h3 className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-white">
          <Icon className="size-4 text-red-600 dark:text-red-400" />
          {title}
        </h3>
        {onFull && (
          <button
            onClick={onFull}
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
          >
            Full rank <ArrowRight className="size-3" />
          </button>
        )}
      </div>
      <ul className="divide-y divide-stone-100 dark:divide-stone-800">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-10" />
              </li>
            ))
          : rows.map((r, i) => (
              <li
                key={`${r.name}-${i}`}
                className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-red-50/60 dark:hover:bg-red-950/20"
              >
                <span
                  className={
                    "w-6 shrink-0 font-mono text-sm font-bold tabular-nums " +
                    (i === 0
                      ? "text-amber-500"
                      : i === 1
                        ? "text-stone-500"
                        : i === 2
                          ? "text-orange-500"
                          : "text-red-600 dark:text-red-400")
                  }
                >
                  #{i + 1}
                </span>
                <button
                  onClick={() => onPick?.(r.name)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="truncate text-sm font-medium text-stone-800 hover:text-red-700 hover:underline dark:text-stone-100 dark:hover:text-red-400">
                    {r.name}
                  </span>
                  {r.level && <LevelBadge level={r.level} />}
                </button>
                <span className="font-mono text-sm font-semibold tabular-nums text-stone-700 dark:text-stone-300">
                  {r.count}
                </span>
              </li>
            ))}
        {!isLoading && rows.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-stone-400">
            No data yet.
          </li>
        )}
      </ul>
    </div>
  );
}
