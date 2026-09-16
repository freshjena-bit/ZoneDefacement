"use client";

import { useState } from "react";
import {
  Menu,
  Search,
  Terminal,
  Home as HomeIcon,
  Send,
  Archive as ArchiveIcon,
  Clock,
  Star,
  Trophy,
  Users,
  BarChart3,
  Mail,
  ShieldCheck,
  LogOut,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { LoginDialog } from "./login-dialog";
import { useLogout, useSession } from "./hooks";
import { toast } from "sonner";
import type { ViewName } from "./types";

interface TopbarProps {
  onSearch: (q: string) => void;
  onNavigate: (
    view: ViewName,
    extra?: { filter?: "onhold" | "special"; action?: "notify" | "stats" | "contact" },
  ) => void;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export function Topbar({ onSearch, onNavigate }: TopbarProps) {
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { data: admin } = useSession();
  const logoutMutation = useLogout();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  }

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Logged out");
      },
    });
  }

  const navItems: NavItem[] = [
    { label: "Home", icon: HomeIcon, action: () => onNavigate("home") },
    {
      label: "Notify",
      icon: Send,
      action: () => onNavigate("home", { action: "notify" }),
    },
    { label: "Archive", icon: ArchiveIcon, action: () => onNavigate("archive") },
    {
      label: "On Hold",
      icon: Clock,
      action: () => onNavigate("archive", { filter: "onhold" }),
    },
    {
      label: "Special",
      icon: Star,
      action: () => onNavigate("archive", { filter: "special" }),
    },
    {
      label: "Attacker Rank",
      icon: Trophy,
      action: () => onNavigate("rank"),
    },
    {
      label: "Team Rank",
      icon: Users,
      action: () => onNavigate("rank"),
    },
    {
      label: "Stats",
      icon: BarChart3,
      action: () => onNavigate("home", { action: "stats" }),
    },
    {
      label: "Contact",
      icon: Mail,
      action: () => onNavigate("home", { action: "contact" }),
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-3 sm:px-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex shrink-0 items-center gap-2"
          aria-label="Go to ZoneDefacement home"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-red-600 text-white shadow-sm">
            <Terminal className="size-4" />
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-stone-900 dark:text-white">
              ZoneDefacement
            </span>
            <span className="hidden font-mono text-[10px] font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500 sm:inline">
              ZONE v7.6
            </span>
          </span>
        </button>

        {/* Center search (desktop) */}
        <form
          onSubmit={submitSearch}
          className="relative mx-2 hidden flex-1 items-center md:flex"
        >
          <Search className="pointer-events-none absolute left-3 size-4 text-stone-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search attacker, team, URL"
            className="h-9 border-stone-200 bg-stone-50 pl-9 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:border-red-500 focus-visible:ring-red-500/20 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
            aria-label="Search defacements"
          />
        </form>

        <div className="ml-auto flex items-center gap-1">
          {/* Admin login / badge */}
          {admin ? (
            <div className="mr-1 flex items-center gap-1">
              <span className="hidden items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm sm:inline-flex">
                <ShieldCheck className="size-3.5" />
                <span className="max-w-[120px] truncate">{admin.username}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="h-8 px-2 text-xs font-medium text-stone-600 hover:bg-red-50 hover:text-red-700 dark:text-stone-300 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                aria-label="Log out admin"
                title="Log out"
              >
                <LogOut className="size-3.5" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLoginOpen(true)}
              className="h-8 px-2.5 text-xs font-medium text-stone-600 hover:bg-red-50 hover:text-red-700 dark:text-stone-300 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              aria-label="Admin login"
              title="Admin login"
            >
              <LogIn className="size-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}

          <ThemeToggle />

          {/* Desktop nav (compact group of buttons) */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                onClick={item.action}
                className="h-8 px-2.5 text-xs font-medium text-stone-600 hover:bg-red-50 hover:text-red-700 dark:text-stone-300 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                <item.icon className="size-3.5" />
                <span className="hidden xl:inline">{item.label}</span>
              </Button>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-stone-200 dark:border-stone-800">
              <SheetTitle className="px-4 pt-4 text-base font-bold text-stone-900 dark:text-white">
                Navigation
              </SheetTitle>
              <form
                onSubmit={(e) => {
                  submitSearch(e);
                  setMobileOpen(false);
                }}
                className="relative mx-4 mt-3"
              >
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search attacker, team, URL"
                  className="h-9 border-stone-200 bg-stone-50 pl-9 text-sm dark:border-stone-800 dark:bg-stone-900"
                />
              </form>
              <nav className="mt-2 flex flex-col gap-0.5 px-2">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.label}>
                    <button
                      onClick={() => {
                        item.action();
                      }}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-stone-700 hover:bg-red-50 hover:text-red-700 dark:text-stone-200 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </button>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
