"use client";

import { Layers } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-100/60 py-6 dark:border-stone-800 dark:bg-stone-950/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
          <Layers className="size-4 text-amber-600 dark:text-amber-500" />
          <span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              TimeVault
            </span>{" "}
            · A web mirror archive
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-500">
          Built with Next.js &amp; the Z.ai page reader · © {year}
        </p>
      </div>
    </footer>
  );
}
