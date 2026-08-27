"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { navSections } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { useCurrentUser } from "@/features/users/hooks/use-users";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="pressable relative text-muted-foreground"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] dark:-rotate-90 dark:scale-0 dark:opacity-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 opacity-0 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] dark:rotate-0 dark:scale-100 dark:opacity-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useCurrentUser();
  const isAdmin = me?.role === "ADMIN";

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <aside className="sticky top-0 z-20 hidden h-dvh min-h-0 w-[15.5rem] shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-[3.75rem] shrink-0 items-center gap-3 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[11px] font-semibold tracking-tight text-primary-foreground">
          SJ
        </div>
        <div className="min-w-0">
          <span className="block truncate text-[13px] font-semibold tracking-tight text-foreground">
            Sajawat
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">ERP Workspace</span>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-2">
        <div className="space-y-6">
          {navSections.map((section) => {
            const items = section.items.filter(
              (item) => !("adminOnly" in item && item.adminOnly) || isAdmin
            );
            if (items.length === 0) return null;
            return (
            <div key={section.label} className="space-y-1">
              <p className="px-2.5 pb-1.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {section.label}
              </p>
              {items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute top-1/2 left-0 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-opacity duration-150",
                        active ? "opacity-100 text-primary" : "opacity-70 group-hover:opacity-100"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto shrink-0 border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center justify-between rounded-lg px-1.5 py-1">
          <span className="text-[11px] text-muted-foreground">v0.1.0</span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              className="pressable text-muted-foreground"
              onClick={handleLogout}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
