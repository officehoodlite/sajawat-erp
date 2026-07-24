"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { navSections } from "@/components/layout/nav-config";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

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

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-sidebar/90 px-4 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[10px] font-semibold text-primary-foreground">
          SJ
        </div>
        <span className="text-[13px] font-semibold tracking-tight">Sajawat</span>
      </div>

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
        <Sheet open={open} onOpenChange={setOpen}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="pressable"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <SheetContent side="left" className="w-[18rem] border-sidebar-border bg-sidebar p-0">
            <SheetHeader className="border-b border-sidebar-border px-5 py-4 text-left">
              <SheetTitle className="text-[13px] font-semibold tracking-tight">Menu</SheetTitle>
            </SheetHeader>
            <nav className="space-y-6 p-3">
              {navSections.map((section) => (
                <div key={section.label} className="space-y-1">
                  <p className="px-2.5 pb-1.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    {section.label}
                  </p>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-accent/60 hover:text-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            active ? "text-primary" : "opacity-80"
                          )}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
