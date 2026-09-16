"use client";

import { Bug, Clock, Globe, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Stats } from "./types";

interface MetricGridProps {
  stats: Stats | undefined;
  isLoading: boolean;
  onClick?: () => void;
}

interface CardSpec {
  key: string;
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function MetricGrid({ stats, isLoading, onClick }: MetricGridProps) {
  const cards: CardSpec[] = [
    {
      key: "verified",
      label: "Verified Reports",
      value: stats?.verifiedReports ?? 0,
      icon: Bug,
    },
    {
      key: "hosts",
      label: "Unique Hosts",
      value: stats?.uniqueHosts ?? 0,
      icon: Globe,
    },
    {
      key: "reporters",
      label: "Reporters",
      value: stats?.reporters ?? 0,
      icon: User,
    },
    {
      key: "today",
      label: "Submitted Today",
      value: stats?.submittedToday ?? 0,
      sub: stats ? `${stats.attackersToday} attackers today` : undefined,
      icon: Clock,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <button
          key={c.key}
          onClick={onClick}
          className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-stone-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
        >
          <span className="absolute inset-y-0 left-0 w-1 bg-red-600" aria-hidden />
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <c.icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {c.label}
            </p>
            {isLoading ? (
              <Skeleton className="mt-1 h-6 w-16" />
            ) : (
              <p className="font-mono text-2xl font-bold tabular-nums text-stone-900 dark:text-white">
                {typeof c.value === "number"
                  ? c.value.toLocaleString()
                  : c.value}
              </p>
            )}
            {c.sub && (
              <p className="mt-0.5 text-[11px] text-stone-400 dark:text-stone-500">
                {c.sub}
              </p>
            )}
          </div>
        </button>
      ))}
    </section>
  );
}
