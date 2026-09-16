"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// Subscribe to "is the client mounted yet" without triggering the
// set-state-in-effect lint rule. We use useSyncExternalStore so React
// knows the value synchronously resolves to `true` on the client.
const emptySubscribe = () => () => {};
function getMountedTrue() {
  return true;
}
function getMountedFalse() {
  return false;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Returns false during SSR, true on the client — avoids hydration mismatch
  // without calling setState inside an effect.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getMountedTrue,
    getMountedFalse,
  );

  const isDark = theme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="border-stone-200 bg-white/70 text-stone-700 hover:bg-amber-50 hover:text-amber-700 dark:border-stone-700 dark:bg-stone-900/70 dark:text-stone-300 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )
      ) : (
        <Sun className="size-4" />
      )}
    </Button>
  );
}
