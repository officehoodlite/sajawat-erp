"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Factory, Layers, Package, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiFetch } from "@/lib/api-client";
import { safeRedirectPath } from "@/lib/auth-constants";

const highlights = [
  {
    icon: Factory,
    title: "Manufacturing lots",
    description: "Lots, models, and material usage end to end.",
  },
  {
    icon: Layers,
    title: "Board & inventory",
    description: "Board, paint, hardware, and packing stock.",
  },
  {
    icon: Users,
    title: "Worker labor",
    description: "Hours, rates, and lot labor summaries.",
  },
  {
    icon: Package,
    title: "Material control",
    description: "Planning vs actual with stock reconciliation.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      router.replace(safeRedirectPath(searchParams.get("from")));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? "Too many login attempts. Please try again later."
          : "Invalid username or password."
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <div className="grid h-full min-h-0 lg:grid-cols-2">
        {/* Brand plane — desktop only, contained to viewport */}
        <section className="relative hidden min-h-0 overflow-hidden lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[#0b4f4a]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(45,212,191,0.28),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(14,165,233,0.16),transparent_50%)]" />

          <div className="relative flex h-full min-h-0 flex-col justify-between px-10 py-8 xl:px-14 xl:py-10">
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[11px] font-semibold tracking-tight text-[#0f766e]">
                SJ
              </div>
              <div>
                <p className="text-[13px] font-semibold tracking-tight text-white">Sajawat</p>
                <p className="text-[11px] text-white/50">ERP Workspace</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 py-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.16em] text-white/70 uppercase">
                <ShieldCheck className="size-3" />
                Furniture operations
              </span>
              <h1 className="mt-4 max-w-lg text-[2.25rem] leading-[1.08] font-semibold tracking-tight text-white xl:mt-5 xl:text-[2.75rem]">
                Manufacturing,
                <br />
                inventory, labor —
                <br />
                one calm workspace.
              </h1>
              <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/55 xl:mt-4 xl:text-[14px]">
                Plan lots, record consumption, manage stock, and track worker hours with clear
                summaries for every production run.
              </p>

              <div className="mt-6 grid gap-2.5 sm:grid-cols-2 xl:mt-8">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-xl border border-white/10 bg-white/[0.07] p-3.5"
                    >
                      <Icon className="mb-2 size-4 text-teal-200" />
                      <h2 className="text-[12px] font-semibold text-white">{item.title}</h2>
                      <p className="mt-1 text-[11px] leading-snug text-white/50">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="shrink-0 text-[12px] text-white/35">
              Built by <span className="text-white/60">BluePeak Studio</span>
            </p>
          </div>
        </section>

        {/* Sign-in pane — no page scroll */}
        <section className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-6 sm:px-10">
            <div className="w-full max-w-[380px]">
              <div className="mb-8 lg:hidden">
                <div className="mb-5 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[10px] font-semibold text-primary-foreground">
                    SJ
                  </div>
                  <span className="text-[13px] font-semibold tracking-tight">Sajawat</span>
                </div>
                <h1 className="text-[1.5rem] font-semibold tracking-tight text-foreground">
                  Sign in
                </h1>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  Continue to your workspace
                </p>
              </div>

              <div className="hidden lg:block">
                <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
                  Welcome back
                </h1>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  Sign in to open manufacturing and inventory.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:mt-8 sm:space-y-5 sm:p-7"
              >
                <div className="space-y-2">
                  <Label htmlFor="username" required>
                    Username
                  </Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" required>
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && <p className="text-[13px] text-destructive">{error}</p>}

                <Button type="submit" className="h-10 w-full" disabled={isPending}>
                  {isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </div>
          </div>

          <footer className="shrink-0 border-t border-border px-6 py-3 text-center lg:hidden">
            <p className="text-[12px] text-muted-foreground">
              Built by <span className="font-medium text-foreground">BluePeak Studio</span>
            </p>
          </footer>
        </section>
      </div>
    </div>
  );
}
