"use client";

import { useRef, useState } from "react";
import { Header } from "@/components/timevault/header";
import { Hero } from "@/components/timevault/hero";
import { ArchiveGrid } from "@/components/timevault/archive-grid";
import { SiteDetail } from "@/components/timevault/site-detail";
import { SnapshotViewer } from "@/components/timevault/snapshot-viewer";
import { Footer } from "@/components/timevault/footer";
import type { SnapshotMeta, Site } from "@/components/timevault/types";

type View = "home" | "site" | "snapshot";

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(
    null,
  );

  const gridRef = useRef<HTMLDivElement | null>(null);

  function goSite(siteId: string) {
    setSelectedSiteId(siteId);
    setSelectedSnapshotId(null);
    setView("site");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  function goSnapshot(snapshot: SnapshotMeta) {
    setSelectedSnapshotId(snapshot.id);
    setView("snapshot");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  function goHome() {
    setView("home");
    setSelectedSiteId(null);
    setSelectedSnapshotId(null);
  }

  function scrollToGrid() {
    if (view !== "home") {
      goHome();
      // Defer the scroll until home is mounted.
      setTimeout(() => {
        gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } else {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950">
      <Header onBrowse={scrollToGrid} />

      <main className="flex-1">
        {view === "home" && (
          <>
            <Hero onArchived={goSite} />
            <ArchiveGrid
              gridRef={gridRef}
              onSelectSite={(s: Site) => goSite(s.id)}
            />
          </>
        )}

        {view === "site" && selectedSiteId && (
          <SiteDetail
            siteId={selectedSiteId}
            onBack={goHome}
            onSelectSnapshot={goSnapshot}
          />
        )}

        {view === "snapshot" && selectedSnapshotId && (
          <SnapshotViewer snapshotId={selectedSnapshotId} onBack={() => {
            if (selectedSiteId) {
              setSelectedSnapshotId(null);
              setView("site");
            } else {
              goHome();
            }
          }} />
        )}
      </main>

      <Footer />
    </div>
  );
}
