import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Coins, LayoutGrid, Radio, ScrollText } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";
import { ClubMark } from "./mark";
import { Disclaimer } from "./disclaimer";

const NAV = [
  { to: "/", label: "Sảnh", icon: LayoutGrid },
  { to: "/play/taixiu", label: "Tài Xỉu", icon: Radio },
  { to: "/play/baucua", label: "Bầu Cua", icon: Radio },
  { to: "/play/xocdia", label: "Xóc Đĩa", icon: Radio },
  { to: "/wallet", label: "Sổ xu", icon: Coins },
] as const;

export function ClubShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();

  return (
    <div className="relative min-h-dvh">
      <div className="club-grid pointer-events-none absolute inset-0 opacity-70" />
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5 text-fg">
            <ClubMark className="size-8 text-accent" />
            <span className="leading-none">
              <span className="font-display text-lg tracking-tight">Kim Lân</span>
              <span className="ml-2 hidden text-[10px] uppercase tracking-[0.2em] text-muted sm:inline">
                Xu ảo
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-[var(--radius-sm)] px-3 py-2 text-sm",
                  pathname === item.to
                    ? "bg-surface text-fg"
                    : "text-muted hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/ops"
              className={cn(
                "rounded-[var(--radius-sm)] px-3 py-2 text-sm",
                pathname === "/ops" ? "bg-surface text-fg" : "text-muted hover:text-fg",
              )}
            >
              Vận hành
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {isPending ? (
              <div className="h-8 w-24 animate-pulse rounded-full bg-surface-2" />
            ) : user ? (
              <SignedIn>
                <UserButton />
              </SignedIn>
            ) : (
              <SignedOut>
                <Link
                  to="/login"
                  className="inline-flex h-10 items-center rounded-[var(--radius-sm)] bg-accent px-3 text-sm font-medium text-accent-fg"
                >
                  Vào câu lạc bộ
                </Link>
              </SignedOut>
            )}
          </div>
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:pb-12">
        {children}
        <footer className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-end sm:justify-between">
          <Disclaimer className="max-w-xl" />
          <Link to="/ops" className="text-xs text-muted hover:text-fg">
            <span className="inline-flex items-center gap-1">
              <ScrollText className="size-3.5" />
              Nhật ký vận hành
            </span>
          </Link>
        </footer>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const on = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] text-[10px]",
                  on ? "bg-surface text-fg" : "text-muted",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
