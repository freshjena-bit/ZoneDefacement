"use client";

import { Layers } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

export function Header({ onBrowse }: { onBrowse: () => void }) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-stone-200/70 bg-stone-50/80 backdrop-blur-md dark:border-stone-800/70 dark:bg-stone-950/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-600 text-amber-50 shadow-sm">
            <Layers className="size-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-50">
              Time<span className="text-amber-600 dark:text-amber-500">Vault</span>
            </span>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Web Mirror Archive
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBrowse}
            className="hidden text-stone-700 hover:bg-amber-50 hover:text-amber-700 sm:inline-flex dark:text-stone-300 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
          >
            Browse
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
