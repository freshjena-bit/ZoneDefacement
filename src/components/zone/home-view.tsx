"use client";

import { useState } from "react";
import { Bug, Clock, ArrowRight, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricGrid } from "./metric-grid";
import { RankPanels } from "./rank-panels";
import { ReportTable } from "./report-table";
import {
  useLatestDefacements,
  useOnholdDefacements,
  useStats,
} from "./hooks";
import type { ViewName } from "./types";

interface HomeViewProps {
  onSearch: (q: string) => void;
  onNavigate: (view: ViewName) => void;
  onMirror: (id: string) => void;
  onPickAttacker: (name: string) => void;
  onPickTeam: (name: string) => void;
  onNotify: () => void;
  statsRef?: React.RefObject<HTMLDivElement | null>;
  contactRef?: React.RefObject<HTMLDivElement | null>;
}

export function HomeView({
  onSearch,
  onNavigate,
  onMirror,
  onPickAttacker,
  onPickTeam,
  onNotify,
  statsRef,
  contactRef,
}: HomeViewProps) {
  const statsQ = useStats();
  const latestQ = useLatestDefacements();
  const onholdQ = useOnholdDefacements();

  const [q, setQ] = useState("");

  function submitHero(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
      {/* Hero search band */}
      <section className="rounded-xl border border-stone-200 bg-gradient-to-br from-white to-stone-50 p-6 shadow-sm dark:border-stone-800 dark:from-stone-900 dark:to-stone-950 sm:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            <Bug className="size-3" /> DEFACER ID MIRROR ARCHIVE
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white sm:text-4xl">
            Global Defacement Mirror Archive
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 sm:text-base">
            A verified mirror database of web defacements — tracked by attacker,
            ranked by activity, and preserved as public incident evidence.
          </p>
          <form
            onSubmit={submitHero}
            className="mx-auto mt-6 flex max-w-xl items-center gap-2"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search attacker or team"
              className="h-11 w-full rounded-md border border-stone-300 bg-white px-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              aria-label="Search attacker or team"
            />
            <button
              type="submit"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-red-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              <Send className="size-4" /> Search
            </button>
          </form>
        </div>
      </section>

      {/* Metric grid */}
      <section ref={statsRef} className="mt-8 scroll-mt-20">
        <SectionTitle icon={Bug} title="Statistics" />
        <div className="mt-3">
          <MetricGrid
            stats={statsQ.data}
            isLoading={statsQ.isLoading}
            onClick={() => onNavigate("archive")}
          />
        </div>
      </section>

      {/* Top 10 rankings */}
      <section className="mt-8">
        <SectionTitle icon={Bug} title="Top Rankings" />
        <div className="mt-3">
          <RankPanels
            stats={statsQ.data}
            isLoading={statsQ.isLoading}
            onPickAttacker={onPickAttacker}
            onPickTeam={onPickTeam}
            onFullRank={() => onNavigate("rank")}
          />
        </div>
      </section>

      {/* Latest Report */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <SectionTitle icon={Bug} title="Latest Report" />
          <button
            onClick={() => onNavigate("archive")}
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
          >
            View all <ArrowRight className="size-3" />
          </button>
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
          {latestQ.isLoading ? (
            <SkeletonRows />
          ) : (
            <ReportTable
              rows={latestQ.data ?? []}
              onMirror={onMirror}
              onPickAttacker={onPickAttacker}
              onPickTeam={onPickTeam}
            />
          )}
        </div>
      </section>

      {/* Recent On Hold */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <SectionTitle icon={Clock} title="Recent On Hold" />
          <button
            onClick={() => onNavigate("archive")}
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
          >
            Queue info <ArrowRight className="size-3" />
          </button>
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
          {onholdQ.isLoading ? (
            <SkeletonRows />
          ) : (
            <ReportTable
              rows={onholdQ.data ?? []}
              onMirror={onMirror}
              onPickAttacker={onPickAttacker}
              onPickTeam={onPickTeam}
            />
          )}
        </div>
      </section>

      {/* Notify CTA (also reachable via nav) */}
      <section ref={contactRef} className="mt-10 scroll-mt-20 rounded-lg border border-stone-200 bg-white p-6 text-center shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <h2 className="text-lg font-bold text-stone-900 dark:text-white">
          Report a defacement
        </h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-stone-500 dark:text-stone-400">
          Submit a target URL to capture and archive a mirror. Verified
          submissions appear instantly; others enter the review queue.
        </p>
        <button
          onClick={onNotify}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
        >
          <Send className="size-4" /> Notify a new defacement
        </button>
      </section>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200">
      <Icon className="size-4 text-red-600 dark:text-red-400" />
      {title}
    </h2>
  );
}

function SkeletonRows() {
  return (
    <div className="p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="mb-2 h-9 w-full" />
      ))}
    </div>
  );
}

