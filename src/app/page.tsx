"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Topbar } from "@/components/zone/topbar";
import { HomeView } from "@/components/zone/home-view";
import { ArchiveView } from "@/components/zone/archive-view";
import { RankView } from "@/components/zone/rank-view";
import { MirrorView } from "@/components/zone/mirror-view";
import { NotifyDialog } from "@/components/zone/notify-dialog";
import { SiteFooter } from "@/components/zone/site-footer";
import type { ArchiveFilter, ViewState } from "@/components/zone/types";
import { pathToView, viewToPath, type RouteState } from "@/lib/router";

export default function Home() {
  // Initialise to the home view for BOTH the server render and the first
  // client render so hydration matches. After mount, a one-shot effect reads
  // the real URL pathname (deep link) and switches to the correct view.
  const [view, setView] = useState<ViewState>({ name: "home" });
  const [archiveRefreshKey, setArchiveRefreshKey] = useState(0);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const contactRef = useRef<HTMLDivElement | null>(null);

  // The Notify dialog is open iff the current route is the home view with the
  // `notify` action (i.e. URL = /notify). Derived from view, not separate
  // state, so it stays in sync with the URL.
  const notifyOpen = view.name === "home" && view.action === "notify";

  // One-shot: sync the view to the current URL pathname on first mount (so
  // deep links / refresh land on the right view) without breaking SSR
  // hydration (server + first client render both start at home).
  useEffect(() => {
    const route = pathToView(window.location.pathname);
    // One-time client-only route initialisation: the URL is an external
    // system we're bootstrapping the view from. Runs once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(routeToViewState(route));
  }, []);

  /** Push a new route to the URL bar (replaces state for same-path tweaks). */
  const navigate = useCallback((route: RouteState, replace = false) => {
    const path = viewToPath(route);
    if (typeof window !== "undefined" && path !== window.location.pathname) {
      if (replace) {
        window.history.replaceState(route, "", path);
      } else {
        window.history.pushState(route, "", path);
      }
    }
    setView(routeToViewState(route));
    // Scroll to top on every navigation.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  // Respond to browser back/forward.
  useEffect(() => {
    function onPop() {
      const route = pathToView(window.location.pathname);
      setView(routeToViewState(route));
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function goHome() {
    navigate({ name: "home" });
  }

  function goArchive(filter?: ArchiveFilter) {
    if (filter?.status === "onhold") navigate({ name: "archive", filter });
    else if (filter?.type === "special") navigate({ name: "archive", filter });
    else navigate({ name: "archive", filter });
  }

  function goRank(tab: "attacker" | "team" = "attacker") {
    navigate({ name: "rank", tab });
  }

  function goMirror(id: string) {
    navigate({ name: "mirror", defacementId: id });
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
    target: "home" | "archive" | "rank" | "mirror",
    extra?: {
      filter?: "onhold" | "special";
      action?: "notify" | "stats" | "contact";
    },
  ) {
    if (extra?.action === "notify") {
      navigate({ name: "home", action: "notify" });
      return;
    }
    if (extra?.action === "stats") {
      navigate({ name: "home" });
      setTimeout(() => {
        statsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
      return;
    }
    if (extra?.action === "contact") {
      navigate({ name: "home" });
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

  return (
    <div className="flex min-h-screen flex-col bg-stone-950 text-stone-100 dark:bg-stone-950 dark:text-stone-100">
      <Topbar onSearch={handleSearch} onNavigate={handleNavigate} />

      <main className="flex-1">
        {view.name === "home" && (
          <HomeView
            onSearch={handleSearch}
            onNavigate={(v) => handleNavigate(v)}
            onMirror={goMirror}
            onPickAttacker={handlePickAttacker}
            onPickTeam={handlePickTeam}
            onNotify={() => navigate({ name: "home", action: "notify" })}
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
            key={view.tab ?? "attacker"}
            initialTab={view.tab ?? "attacker"}
            onTabChange={(tab) => {
              // Switching the rank tab updates the URL via pushState so each
              // tab is addressable (/leaderboard/attacker | /leaderboard/team).
              navigate({ name: "rank", tab });
            }}
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

      {/* Global Notify dialog (triggered via the /notify URL or nav button) */}
      <NotifyDialog
        open={notifyOpen}
        onOpenChange={(open) => {
          // Closing the dialog normalises the URL back to home (/). Opening is
          // handled by navigating to /notify elsewhere.
          if (!open && notifyOpen) {
            navigate({ name: "home" }, true);
          }
        }}
        onSubmitted={(info) => {
          setArchiveRefreshKey((k) => k + 1);
          // If the submission was auto-verified, show it in the verified
          // archive; otherwise show the on-hold queue.
          if (info && info.verified > 0 && info.onhold === 0) {
            navigate({ name: "archive", filter: { status: "approved" } });
          } else {
            navigate({ name: "archive", filter: { status: "onhold" } });
          }
        }}
      />
    </div>
  );
}

/** Convert a RouteState (router) into the ViewState used by the UI layer. */
function routeToViewState(route: RouteState): ViewState {
  return {
    name: route.name,
    defacementId: route.defacementId,
    filter: route.filter,
    // `action` and `tab` are ViewState-extended via casting; ViewState already
    // allows extra fields through its union, but we keep them for typing.
    ...({ action: route.action, tab: route.tab } as Partial<ViewState>),
  };
}
