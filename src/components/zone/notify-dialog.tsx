"use client";

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateDefacement } from "./hooks";
import type { NotifyPayload } from "./types";

interface NotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

const OS_OPTIONS = ["Linux", "Windows", "FreeBSD", "Unix", "Unknown"];
const COUNTRY_OPTIONS = [
  { code: "ID", name: "Indonesia" },
  { code: "US", name: "United States" },
  { code: "SG", name: "Singapore" },
  { code: "IN", name: "India" },
  { code: "MY", name: "Malaysia" },
  { code: "BR", name: "Brazil" },
  { code: "DE", name: "Germany" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "TH", name: "Thailand" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "TR", name: "Turkey" },
  { code: "RU", name: "Russia" },
  { code: "EG", name: "Egypt" },
  { code: "NG", name: "Nigeria" },
];

export function NotifyDialog({
  open,
  onOpenChange,
  onSubmitted,
}: NotifyDialogProps) {
  const [targetUrl, setTargetUrl] = useState("");
  const [attacker, setAttacker] = useState("");
  const [team, setTeam] = useState("");
  const [os, setOs] = useState("Linux");
  const [countryCode, setCountryCode] = useState("ID");
  const [isHome, setIsHome] = useState(true);
  const [isMass, setIsMass] = useState(false);
  const [isRedeface, setIsRedeface] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);

  const mutation = useCreateDefacement();

  // Reset the form whenever the dialog closes.
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setTargetUrl("");
        setAttacker("");
        setTeam("");
        setOs("Linux");
        setCountryCode("ID");
        setIsHome(true);
        setIsMass(false);
        setIsRedeface(false);
        setIsSpecial(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetUrl.trim() || !attacker.trim()) {
      toast.error("Target URL and attacker name are required.");
      return;
    }
    const payload: NotifyPayload = {
      targetUrl: targetUrl.trim(),
      attacker: attacker.trim(),
      team: team.trim() || undefined,
      os,
      countryCode,
      isHome,
      isMass,
      isRedeface,
      isSpecial,
    };
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Mirror captured — pending review", {
          description: "The defacement has been queued in the On Hold list.",
        });
        onOpenChange(false);
        onSubmitted?.();
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
            Submit a target URL — we&apos;ll fetch &amp; mirror the page for the
            archive. New submissions enter the On Hold queue pending review.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="nf-url">Target URL *</Label>
            <Input
              id="nf-url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.ac.id/"
              required
              autoFocus
              className="font-mono text-sm"
            />
          </div>

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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="nf-os">OS</Label>
              <Select value={os} onValueChange={setOs}>
                <SelectTrigger id="nf-os" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OS_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nf-cc">Country</Label>
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger id="nf-cc" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Defacement types</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <TypeCheck
                label="Home"
                checked={isHome}
                onChange={setIsHome}
              />
              <TypeCheck
                label="Mass"
                checked={isMass}
                onChange={setIsMass}
              />
              <TypeCheck
                label="Redeface"
                checked={isRedeface}
                onChange={setIsRedeface}
              />
              <TypeCheck
                label="Special"
                checked={isSpecial}
                onChange={setIsSpecial}
              />
            </div>
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
                  <Loader2 className="size-4 animate-spin" /> Capturing mirror…
                </>
              ) : (
                <>
                  <Send className="size-4" /> Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TypeCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/60">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <span className="text-stone-700 dark:text-stone-300">{label}</span>
    </label>
  );
}
