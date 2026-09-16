"use client";

import { useEffect, useState } from "react";
import { Loader2, Send, Sparkles, Layers, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDefacement } from "./hooks";
import type { NotifyPayload, NotifyResult } from "./types";

interface NotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: (result: NotifyResult) => void;
}

type Mode = "single" | "mass";

export function NotifyDialog({
  open,
  onOpenChange,
  onSubmitted,
}: NotifyDialogProps) {
  const [mode, setMode] = useState<Mode>("single");
  const [url, setUrl] = useState("");
  const [massUrls, setMassUrls] = useState("");
  const [attacker, setAttacker] = useState("");
  const [team, setTeam] = useState("");

  const mutation = useCreateDefacement();

  // Reset the form whenever the dialog closes.
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setMode("single");
        setUrl("");
        setMassUrls("");
        setAttacker("");
        setTeam("");
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const massCount = massUrls
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const urls =
      mode === "single"
        ? [url.trim()].filter(Boolean)
        : massUrls
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);

    if (urls.length === 0) {
      toast.error(mode === "single" ? "Target URL is required." : "Enter at least one URL.");
      return;
    }
    if (mode === "mass" && urls.length > 20) {
      toast.error("Mass submission limited to 20 URLs.");
      return;
    }
    if (!attacker.trim()) {
      toast.error("Attacker name is required.");
      return;
    }

    const payload: NotifyPayload = {
      mode,
      urls,
      attacker: attacker.trim(),
      team: team.trim() || undefined,
    };

    mutation.mutate(payload, {
      onSuccess: (res) => {
        const n = res.count;
        const v = res.verified;
        const s = res.detected.sample;
        const detectionLine = s
          ? `Detected — country: ${s.country ?? "?"} · OS: ${s.os}${
              s.isSpecial ? " · special (gov/edu)" : ""
            }${s.isRedeface ? " · redeface" : ""}${
              s.isMass ? " · mass" : s.isHome ? " · home" : ""
            }`
          : undefined;

        if (v === n && n > 0) {
          // All auto-verified.
          toast.success(
            n === 1
              ? "Mirror auto-verified ✓"
              : `${n} mirrors auto-verified ✓`,
            {
              description: detectionLine
                ? `${detectionLine}\nSignature "hacked by ${attacker.trim()}" matched — moved to verified.`
                : `Signature matched — moved to verified.`,
            },
          );
        } else if (v > 0) {
          // Some verified, some on hold.
          toast.warning(`${v} auto-verified · ${res.onhold} on hold`, {
            description: detectionLine ?? undefined,
          });
        } else {
          // None verified — all on hold.
          toast.info(
            n === 1
              ? "Mirror captured — pending review"
              : `${n} mirrors captured — pending review`,
            {
              description: detectionLine
                ? `${detectionLine}\nNo "hacked by ${attacker.trim()}" signature found — queued for admin review.`
                : `No attacker signature found — queued for admin review.`,
            },
          );
        }
        onOpenChange(false);
        onSubmitted?.(res);
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Submit failed";
        toast.error("Mirror submission failed", { description: msg });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto thin-scrollbar sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-stone-900 dark:text-white">
            <span className="flex size-6 items-center justify-center rounded bg-red-600 text-white">
              <Send className="size-3.5" />
            </span>
            Notify a new defacement
          </DialogTitle>
          <DialogDescription>
            Submit a target URL to capture a mirror. OS, country, and type flags
            (Home / Mass / Redeface / Special) are{" "}
            <span className="font-medium text-red-600 dark:text-red-400">
              detected automatically
            </span>
            . Verified mirrors appear instantly; others enter the review queue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Mode toggle */}
          <div className="grid gap-1.5">
            <Label>Mirror type</Label>
            <div className="grid grid-cols-2 gap-2">
              <ModeButton
                active={mode === "single"}
                onClick={() => setMode("single")}
                icon={<FileText className="size-4" />}
                title="Single"
                desc="One URL"
              />
              <ModeButton
                active={mode === "mass"}
                onClick={() => setMode("mass")}
                icon={<Layers className="size-4" />}
                title="Mass"
                desc="Many URLs at once"
              />
            </div>
          </div>

          {/* URL input(s) */}
          <div className="grid gap-1.5">
            {mode === "single" ? (
              <>
                <Label htmlFor="nf-url">Target URL *</Label>
                <Input
                  id="nf-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.go.id/"
                  required
                  autoFocus
                  className="font-mono text-sm"
                />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="nf-mass">Target URLs *</Label>
                  <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">
                    {massCount}/20
                  </span>
                </div>
                <Textarea
                  id="nf-mass"
                  value={massUrls}
                  onChange={(e) => setMassUrls(e.target.value)}
                  placeholder={
                    "https://site1.go.id/\nhttps://site2.ac.id/\nhttps://site3.gov.vn/"
                  }
                  rows={6}
                  required
                  autoFocus
                  className="font-mono text-sm"
                />
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  One URL per line. Each URL is captured &amp; archived as a
                  separate mirror, all flagged as Mass.
                </p>
              </>
            )}
          </div>

          {/* Attacker + Team */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="nf-attacker">Attacker *</Label>
              <Input
                id="nf-attacker"
                value={attacker}
                onChange={(e) => setAttacker(e.target.value)}
                placeholder="e.g. GadaLuBau"
                required
                className="text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nf-team">Team</Label>
              <Input
                id="nf-team"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="optional"
                className="text-sm"
              />
            </div>
          </div>

          {/* Auto-detection explainer */}
          <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-400">
            <div className="mb-1 flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
              <Sparkles className="size-3.5 text-red-600" />
              Auto-detected on submit
            </div>
            <ul className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
              <li>
                <b>Country</b> — from the server&apos;s IP (DNS → GeoIP)
              </li>
              <li>
                <b>OS</b> — from the HTTP <code className="font-mono">Server</code>{" "}
                header
              </li>
              <li>
                <b>Special</b> — gov / edu TLD (e.g. .go.id, .gov.vn, .ac.id)
              </li>
              <li>
                <b>Redeface</b> — domain was previously archived
              </li>
              <li>
                <b>Home</b> — URL targets the site root
              </li>
              <li>
                <b>Mass</b> — set when submitting multiple URLs
              </li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "mass"
                    ? `Capturing ${massCount || ""} mirrors…`
                    : "Capturing mirror…"}
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  {mode === "mass"
                    ? `Submit ${massCount || ""} mirrors`
                    : "Submit"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition " +
        (active
          ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
          : "border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-800/60")
      }
    >
      <span
        className={
          "flex size-7 shrink-0 items-center justify-center rounded " +
          (active
            ? "bg-red-600 text-white"
            : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400")
        }
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight">
          {title}
        </span>
        <span className="block text-xs leading-tight opacity-80">{desc}</span>
      </span>
    </button>
  );
}
