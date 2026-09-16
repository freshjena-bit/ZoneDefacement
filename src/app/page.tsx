"use client";

import { useRef, useState } from "react";
import { Topbar } from "@/components/zone/topbar";
import { HomeView } from "@/components/zone/home-view";
import { ArchiveView } from "@/components/zone/archive-view";
import { RankView } from "@/components/zone/rank-view";
import { MirrorView } from "@/components/zone/mirror-view";
import { NotifyDialog } from "@/components/zone/notify-dialog";
import { SiteFooter } from "@/components/zone/site-footer";
import type { ArchiveFilter, ViewState } from "@/components/zone/types";

export default function Home() {
  const [view, setView] = useState<ViewState>({ name: "home" });
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [archiveRefreshKey, setArchiveRefreshKey] = useState(0);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const contactRef = useRef<HTMLDivElement | null>(null);

  function goHome() {
    setView({ name: "home" });
    scrollToTop();
  }

  function goArchive(filter?: ArchiveFilter) {
    setView({ name: "archive", filter });
    scrollToTop();
  }

  function goRank() {
    setView({ name: "rank" });
    scrollToTop();
  }

  function goMirror(id: string) {
    setView({ name: "mirror", defacementId: id });
    scrollToTop();
  }

  function handleSearch(q: string) {
    goArchive({ q });
  }

  function handlePickAttacker(name: string) {
    goArchive({ attacker: name, status: "all" });
  }

  function handlePickTeam(name: string) {
    goArchive({ team: name, status: "all" });
  }

  function handleNavigate(
    target:
      | "home"
      | "archive"
      | "rank"
      | "mirror",
    extra?: { filter?: "onhold" | "special"; action?: "notify" | "stats" | "contact" },
  ) {
    if (extra?.action === "notify") {
      setNotifyOpen(true);
      return;
    }
    if (extra?.action === "stats") {
      setView({ name: "home" });
      setTimeout(() => {
        statsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
      return;
    }
    if (extra?.action === "contact") {
      setView({ name: "home" });
      setTimeout(() => {
        contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
      return;
    }

    if (target === "home") {
      goHome();
      return;
    }
    if (target === "archive") {
      if (extra?.filter === "onhold") {
        goArchive({ status: "onhold" });
      } else if (extra?.filter === "special") {
        goArchive({ type: "special" });
      } else {
        goArchive();
      }
      return;
    }
    if (target === "rank") {
      goRank();
      return;
    }
    if (target === "mirror") {
      // no-op without an id
      return;
    }
  }

  function scrollToTop() {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <Topbar onSearch={handleSearch} onNavigate={handleNavigate} />

      <main className="flex-1">
        {view.name === "home" && (
          <HomeView
            onSearch={handleSearch}
            onNavigate={(v) => handleNavigate(v)}
            onMirror={goMirror}
            onPickAttacker={handlePickAttacker}
            onPickTeam={handlePickTeam}
            onNotify={() => setNotifyOpen(true)}
            statsRef={statsRef}
            contactRef={contactRef}
          />
        )}

        {view.name === "archive" && (
          <ArchiveView
            key={JSON.stringify(view.filter ?? {})}
            initialFilter={view.filter}
            onBack={goHome}
            onMirror={goMirror}
            onPickAttacker={handlePickAttacker}
            onPickTeam={handlePickTeam}
            refreshKey={archiveRefreshKey}
          />
        )}

        {view.name === "rank" && (
          <RankView
            onBack={goHome}
            onPickAttacker={handlePickAttacker}
            onPickTeam={handlePickTeam}
          />
        )}

        {view.name === "mirror" && view.defacementId && (
          <MirrorView
            defacementId={view.defacementId}
            onBack={() => goArchive()}
            onPickAttacker={handlePickAttacker}
          />
        )}
      </main>

      <SiteFooter />

      {/* Global Notify dialog (triggered from nav or home CTA) */}
      <NotifyDialog
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
        onSubmitted={() => {
          // Bump archive refresh key + switch to archive on-hold view if user
          // is currently on the archive view.
          setArchiveRefreshKey((k) => k + 1);
          if (view.name === "archive") {
            setView({
              name: "archive",
              filter: { status: "onhold" },
            });
          }
        }}
      />
    </div>
  );
}
