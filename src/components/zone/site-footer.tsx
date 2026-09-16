"use client";

import { Terminal } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white/60 py-6 dark:border-stone-800 dark:bg-stone-950/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center">
        <div className="flex items-center gap-2 text-stone-700 dark:text-stone-200">
          <span className="flex size-5 items-center justify-center rounded bg-red-600 text-white">
            <Terminal className="size-3" />
          </span>
          <span className="text-sm font-semibold">
            Copyright © {new Date().getFullYear()} ZoneDefacement — Defacement Mirror Archive. All Rights Reserved.
          </span>
        </div>
        <p className="max-w-2xl text-xs text-stone-400 dark:text-stone-500">
          A ZoneDefacement cyber vandalism database. Built for security research &amp; historical preservation.
        </p>
      </div>
    </footer>
  );
}
