"use client";

import { cn } from "@/lib/utils";
import type { ReporterLevel } from "./types";

const LEVEL_STYLES: Record<ReporterLevel, string> = {
  ADMIN: "bg-red-600 text-white border-red-700",
  LEGEND: "bg-amber-500 text-white border-amber-600",
  ELITE: "bg-emerald-600 text-white border-emerald-700",
  PRO: "bg-orange-500 text-white border-orange-600",
  ROOKIE:
    "bg-transparent text-stone-500 dark:text-stone-400 border-stone-300 dark:border-stone-700",
};

export function LevelBadge({
  level,
  className,
}: {
  level: ReporterLevel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-wider",
        LEVEL_STYLES[level] ?? LEVEL_STYLES.ROOKIE,
        className,
      )}
      title={`Reporter level: ${level}`}
    >
      {level}
    </span>
  );
}
