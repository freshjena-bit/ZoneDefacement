"use client";

import { useMemo, useState } from "react";
import { Globe, History, Camera } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Site } from "./types";

function Favicon({ site }: { site: Site }) {
  const [errored, setErrored] = useState(false);
  if (!site.favicon || errored) {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
        <Globe className="size-4" />
      </div>
    );
  }
  return (
    <img
      src={site.favicon}
      alt=""
      width={36}
      height={36}
      loading="lazy"
      onError={() => setErrored(true)}
      className="size-9 shrink-0 rounded-md bg-stone-100 object-contain p-0.5 dark:bg-stone-800"
    />
  );
}

export function SiteCard({
  site,
  onClick,
}: {
  site: Site;
  onClick: () => void;
}) {
  const count = site._count?.snapshots ?? 0;
  const relative = useMemo(() => {
    if (!site.lastArchivedAt) return "—";
    try {
      return formatDistanceToNow(new Date(site.lastArchivedAt), {
        addSuffix: true,
      });
    } catch {
      return "—";
    }
  }, [site.lastArchivedAt]);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group cursor-pointer gap-0 p-4 transition-all hover:border-amber-400 hover:shadow-md focus-visible:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 sm:p-5 dark:hover:border-amber-600"
    >
      <div className="flex items-start gap-3">
        <Favicon site={site} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
            {site.title}
          </h3>
          <p className="mt-0.5 truncate font-mono text-xs text-stone-500 dark:text-stone-400">
            {site.domain}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
        {site.description ?? "No description available."}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-stone-800">
        <Badge
          variant="secondary"
          className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
        >
          <Camera className="size-3" />
          {count} {count === 1 ? "snapshot" : "snapshots"}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-500">
          <History className="size-3" />
          {relative}
        </span>
      </div>
    </Card>
  );
}
