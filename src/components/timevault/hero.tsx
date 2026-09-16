"use client";

import { useState } from "react";
import { Globe, Loader2, Archive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useArchiveUrl } from "./hooks";

export function Hero({
  onArchived,
}: {
  onArchived: (siteId: string) => void;
}) {
  const [value, setValue] = useState("");
  const archive = useArchiveUrl();

  function ensureProtocol(raw: string): string {
    const v = raw.trim();
    if (!v) return v;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(v)) return v;
    return `https://${v}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = value.trim();
    if (!raw) {
      toast.error("Please enter a URL to archive.");
      return;
    }
    const url = ensureProtocol(raw);

    try {
      const result = await archive.mutateAsync(url);
      if (result.warning) {
        toast.warning("Snapshot saved with issues", {
          description: result.warning,
        });
      } else {
        toast.success("Archive captured!", {
          description: `Saved a snapshot of ${result.site.domain}.`,
        });
      }
      setValue("");
      onArchived(result.site.id);
    } catch (err: any) {
      toast.error("Failed to archive", {
        description: err?.message ?? "Please try again.",
      });
    }
  }

  return (
    <section className="relative px-4 pt-16 pb-10 sm:px-6 sm:pt-24 sm:pb-14">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          <Archive className="size-3.5" />
          A time machine for the web
        </div>
        <h1 className="text-balance text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl md:text-6xl dark:text-stone-50">
          Capture the web.
          <br />
          <span className="text-amber-600 dark:text-amber-500">
            Preserve it forever.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-stone-600 sm:text-lg dark:text-stone-400">
          Archive any webpage as a time-stamped snapshot. Browse historical
          captures, compare changes over time, and keep the web&apos;s memory
          alive.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
            <Input
              type="text"
              inputMode="url"
              placeholder="example.com or https://example.com/page"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={archive.isPending}
              className="h-12 border-stone-300 bg-white pl-9 pr-3 text-base shadow-sm placeholder:text-stone-400 focus-visible:border-amber-500 focus-visible:ring-amber-500/30 dark:border-stone-700 dark:bg-stone-900 dark:placeholder:text-stone-500"
              aria-label="URL to archive"
            />
          </div>
          <Button
            type="submit"
            disabled={archive.isPending}
            className="h-12 bg-amber-600 px-6 text-base font-semibold text-amber-50 shadow-sm hover:bg-amber-700 focus-visible:ring-amber-500/40 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            {archive.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Archiving…
              </>
            ) : (
              <>
                <Archive className="size-4" />
                Archive Now
              </>
            )}
          </Button>
        </form>
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-500">
          No protocol? We&apos;ll add <code className="font-mono">https://</code>{" "}
          automatically.
        </p>
      </div>
    </section>
  );
}
