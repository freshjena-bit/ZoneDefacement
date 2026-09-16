"use client";

import { useEffect, useState } from "react";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
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
import { useLogin } from "./hooks";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useLogin();

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setUsername("");
        setPassword("");
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Enter your admin username and password.");
      return;
    }
    mutation.mutate(
      { username: username.trim(), password },
      {
        onSuccess: (res) => {
          toast.success("Logged in as admin", {
            description: `Welcome, ${res.user.username}`,
          });
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Login failed";
          toast.error("Login failed", { description: msg });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-stone-900 dark:text-white">
            <span className="flex size-6 items-center justify-center rounded bg-red-600 text-white">
              <ShieldCheck className="size-3.5" />
            </span>
            Admin login
          </DialogTitle>
          <DialogDescription>
            Sign in to verify or reject on-hold defacement submissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="lg-user">Username</Label>
            <Input
              id="lg-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin username"
              required
              autoFocus
              autoComplete="username"
              className="text-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lg-pass">Password</Label>
            <Input
              id="lg-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="text-sm"
            />
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
                  <Loader2 className="size-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  <LogIn className="size-4" /> Sign in
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
