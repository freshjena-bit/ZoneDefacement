"use client";

import { useEffect, useMemo, useState } from "react";
// Note: this component is remounted by the parent (via `key`) whenever the
// incoming `initialFilter` changes, so we initialize all filter state directly
// from `initialFilter` and avoid syncing effects.
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportTable } from "./report-table";
import { NotifyDialog } from "./notify-dialog";
import { useDefacements } from "./hooks";
import type { ArchiveFilter } from "./types";

const PAGE_SIZE = 25;

const OS_OPTIONS = ["all", "Linux", "Windows", "FreeBSD", "Unix", "Unknown"];
const COUNTRY_OPTIONS = [
  "all",
  "ID",
  "US",
  "SG",
  "IN",
  "MY",
  "BR",
  "DE",
  "PH",
  "VN",
  "TH",
];

interface ArchiveViewProps {
  initialFilter?: ArchiveFilter;
  onBack: () => void;
  onMirror: (id: string) => void;
  onPickAttacker: (name: string) => void;
  onPickTeam: (name: string) => void;
  /** Bumped externally to trigger a refetch (e.g. after a successful notify). */
  refreshKey?: number;
}

export function ArchiveView({
  initialFilter,
  onBack,
  onMirror,
  onPickAttacker,
  onPickTeam,
  refreshKey,
}: ArchiveViewProps) {
  const [q, setQ] = useState(initialFilter?.q ?? "");
  const [status, setStatus] = useState<"all" | "approved" | "onhold">(
    initialFilter?.status ?? "all",
  );
  const [type, setType] = useState<
    "all" | "home" | "mass" | "redeface" | "special"
  >(
    initialFilter?.type ??
      (initialFilter?.attacker || initialFilter?.team ? "all" : "all"),
  );
  const [os, setOs] = useState(initialFilter?.os ?? "all");
  const [country, setCountry] = useState(initialFilter?.country ?? "all");
  const [page, setPage] = useState(0);
  const [notifyOpen, setNotifyOpen] = useState(false);

  // Debounced search input -> effective query string used by the hook.
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const filter: ArchiveFilter = useMemo(
    () => ({
      q: debouncedQ.trim() || undefined,
      status,
      type,
      os,
      country,
      attacker: initialFilter?.attacker,
      team: initialFilter?.team,
    }),
    [debouncedQ, status, type, os, country, initialFilter?.attacker, initialFilter?.team],
  );

  const offset = page * PAGE_SIZE;
  const { data, isLoading, isFetching } = useDefacements(filter, {
    limit: PAGE_SIZE,
    offset,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Refetch when external refreshKey changes (after a successful notify).
  const queryKey = `${refreshKey ?? 0}`;

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
            Archive
            <span className="ml-2 font-mono text-sm font-medium text-stone-500 dark:text-stone-400">
              {total.toLocaleString()} records
            </span>
          </h1>
        </div>
        <Button
          onClick={() => setNotifyOpen(true)}
          className="bg-red-600 text-white hover:bg-red-700"
          size="sm"
        >
          <Send className="size-4" /> Notify new defacement
        </Button>
      </div>

      {/* Filter bar */}
      <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Search attacker, team, URL…"
            className="h-9 border-stone-200 bg-stone-50 pl-9 text-sm dark:border-stone-800 dark:bg-stone-950"
          />
        </div>

        <Tabs
          value={status}
          onValueChange={(v) => {
            setStatus(v as typeof status);
            setPage(0);
          }}
        >
          <TabsList className="h-9 w-full">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">
              Verified
            </TabsTrigger>
            <TabsTrigger value="onhold" className="text-xs">
              On Hold
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select
          value={type}
          onValueChange={(v) => {
            setType(v as typeof type);
            setPage(0);
          }}
        >
          <SelectTrigger className="h-9 w-full text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="home">Home</SelectItem>
            <SelectItem value="mass">Mass</SelectItem>
            <SelectItem value="redeface">Redeface</SelectItem>
            <SelectItem value="special">Special</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2 lg:col-span-1 lg:grid-cols-1 lg:flex">
          <Select
            value={os}
            onValueChange={(v) => {
              setOs(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue placeholder="OS" />
            </SelectTrigger>
            <SelectContent>
              {OS_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o === "all" ? "All OS" : o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={country}
            onValueChange={(v) => {
              setCountry(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "all" ? "All countries" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filter context strip (for attacker/team quick filters) */}
      {(initialFilter?.attacker || initialFilter?.team) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <span>Filtered by:</span>
          {initialFilter?.attacker && (
            <button
              onClick={() => onPickAttacker(initialFilter.attacker!)}
              className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700 hover:underline dark:bg-red-950/40 dark:text-red-400"
            >
              attacker: {initialFilter.attacker}
            </button>
          )}
          {initialFilter?.team && (
            <button
              onClick={() => onPickTeam(initialFilter.team!)}
              className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700 hover:underline dark:bg-red-950/40 dark:text-red-400"
            >
              team: {initialFilter.team}
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="mt-4 max-h-[70vh] overflow-y-auto overflow-x-auto thin-scrollbar rounded-lg border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
        {isLoading ? (
          <div className="p-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={`${queryKey}-${i}`} className="mb-2 h-9 w-full" />
            ))}
          </div>
        ) : (
          <ReportTable
            rows={data?.defacements ?? []}
            onMirror={onMirror}
            onPickAttacker={onPickAttacker}
            onPickTeam={onPickTeam}
            isLoading={isFetching && !isLoading}
          />
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-stone-500 dark:text-stone-400">
        <span className="font-mono text-xs">
          Page {page + 1} of {totalPages} · {total.toLocaleString()} total
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <NotifyDialog
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
        onSubmitted={() => {
          // Switch to On Hold view so the user can see their submission.
          setStatus("onhold");
          setPage(0);
        }}
      />
    </div>
  );
}
