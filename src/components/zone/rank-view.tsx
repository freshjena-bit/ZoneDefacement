"use client";

import { useState } from "react";
import { ArrowLeft, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "./level-badge";
import { useStats } from "./hooks";
import type { ReporterLevel } from "./types";

interface RankViewProps {
  /** Initial tab, derived from the URL (/leaderboard/attacker|team). */
  initialTab?: "attacker" | "team";
  /** Fired when the user switches tabs so the URL can be updated. */
  onTabChange?: (tab: "attacker" | "team") => void;
  onBack: () => void;
  onPickAttacker: (name: string) => void;
  onPickTeam: (name: string) => void;
}

export function RankView({
  initialTab = "attacker",
  onTabChange,
  onBack,
  onPickAttacker,
  onPickTeam,
}: RankViewProps) {
  const [tab, setTab] = useState<"attackers" | "teams">(
    initialTab === "team" ? "teams" : "attackers",
  );
  const statsQ = useStats();

  const attackers = statsQ.data?.rankings.attackers ?? [];
  const teams = statsQ.data?.rankings.teams ?? [];
  const maxAttacker = attackers[0]?.count ?? 1;
  const maxTeam = teams[0]?.count ?? 1;

  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-stone-600 hover:text-red-700 dark:text-stone-300"
        >
          <ArrowLeft className="size-4" /> Home
        </Button>
        <h1 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-white">
          Reporter Rankings
        </h1>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = v as "attackers" | "teams";
          setTab(next);
          onTabChange?.(next === "teams" ? "team" : "attacker");
        }}
        className="mt-4"
      >
        <TabsList>
          <TabsTrigger value="attackers" className="gap-1.5">
            <Trophy className="size-3.5" /> Attacker Rank
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-1.5">
            <Users className="size-3.5" /> Team Rank
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attackers">
          <div className="rounded-lg border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
            {statsQ.isLoading ? (
              <div className="p-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="mb-2 h-12 w-full" />
                ))}
              </div>
            ) : attackers.length === 0 ? (
              <p className="py-10 text-center text-sm text-stone-400">
                No attackers yet.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {attackers.map((a, i) => (
                  <RankRow
                    key={a.name}
                    rank={i + 1}
                    name={a.name}
                    count={a.count}
                    max={maxAttacker}
                    level={a.level}
                    onPick={() => onPickAttacker(a.name)}
                  />
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <div className="rounded-lg border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
            {statsQ.isLoading ? (
              <div className="p-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="mb-2 h-12 w-full" />
                ))}
              </div>
            ) : teams.length === 0 ? (
              <p className="py-10 text-center text-sm text-stone-400">
                No teams yet.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {teams.map((t, i) => (
                  <RankRow
                    key={t.name}
                    rank={i + 1}
                    name={t.name}
                    count={t.count}
                    max={maxTeam}
                    onPick={() => onPickTeam(t.name)}
                  />
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RankRow({
  rank,
  name,
  count,
  max,
  level,
  onPick,
}: {
  rank: number;
  name: string;
  count: number;
  max: number;
  level?: ReporterLevel;
  onPick: () => void;
}) {
  const pct = Math.max(4, Math.round((count / max) * 100));
  const medalColor =
    rank === 1
      ? "text-amber-500"
      : rank === 2
        ? "text-stone-500"
        : rank === 3
          ? "text-orange-500"
          : "text-red-600 dark:text-red-400";

  return (
    <li className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-red-50/60 dark:hover:bg-red-950/20 sm:px-4">
      <span
        className={`w-8 shrink-0 text-center font-mono text-sm font-bold tabular-nums ${medalColor}`}
      >
        #{rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onPick}
            className="truncate text-sm font-semibold text-stone-800 hover:text-red-700 hover:underline dark:text-stone-100 dark:hover:text-red-400"
          >
            {name}
          </button>
          {level && <LevelBadge level={level} />}
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
          <div
            className="h-full rounded-full bg-red-600"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="w-16 shrink-0 text-right font-mono text-sm font-bold tabular-nums text-stone-700 dark:text-stone-300">
        {count}
      </span>
    </li>
  );
}
