import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import { ChipRow } from "@/components/club/chips";
import { TimerRing } from "@/components/club/timer-ring";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { BAUCUA_FACES, BAUCUA_LABEL, type BauCuaFace } from "@/lib/game/constants";
import type { BauCuaPayload } from "@/lib/game/rules";
import { cn, formatXu } from "@/lib/utils";
import {
  isPlayerView,
  remainingOf,
  totalForPhase,
  useClock,
  useGame,
} from "@/hooks/use-game";

function FaceGlyph({ face }: { face: BauCuaFace }) {
  const paths: Record<BauCuaFace, string> = {
    nai: "M8 20c4-8 16-8 20 0l-4 8H12l-4-8zm4-8 4-6 4 6",
    bau: "M18 6c8 2 10 14 0 20C8 20 10 8 18 6z",
    ga: "M10 22c2-8 14-10 16-2 2 6-6 10-12 8 0-4-2-6-4-6",
    ca: "M6 18c8-8 16-8 24 0-8 8-16 8-24 0zm18 0h4",
    cua: "M8 16h20M10 12c4 2 12 2 16 0M10 20c4-2 12-2 16 0M18 10v14",
    tom: "M8 18c6-8 14-6 20 2M10 14c4 8 12 8 16 0",
  };
  return (
    <svg viewBox="0 0 36 36" className="size-10 text-accent" aria-hidden>
      <path
        d={paths[face]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BauCuaTable() {
  const { user } = useCurrentUserState();
  const authed = !!user;
  const { snap, receivedAt, pending, bet } = useGame("baucua", authed);
  const now = useClock();
  const remaining = remainingOf(snap, now, receivedAt);
  const [chip, setChip] = useState(1000);
  const payload = snap?.payload?.kind === "baucua" ? (snap.payload as BauCuaPayload) : null;
  const my = isPlayerView(snap) ? snap.myBets : [];
  const mine = (m: string) => my.find((b) => b.market === m)?.amount ?? 0;
  const canBet = snap?.phase === "betting" && authed && !pending;

  async function onBet(market: string) {
    if (!authed) {
      toast.message("Cần vào câu lạc bộ để đặt xu ảo.");
      return;
    }
    const res = await bet(market, chip);
    if (!res.ok) toast.error("Không đặt được cược.");
    else toast.success(`Đã đặt ${formatXu(chip)} xu`);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Bàn dân gian</p>
          <h1 className="font-display text-4xl tracking-tight">Bầu Cua</h1>
        </div>
        {isPlayerView(snap) ? (
          <p className="font-display text-3xl tabular-nums">{formatXu(snap.balance)}</p>
        ) : (
          <Link to="/login" className="text-sm text-accent">
            Đăng nhập để chơi
          </Link>
        )}
      </header>
      <Card>
        <CardContent className="space-y-6 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TimerRing
              phase={snap?.phase ?? "betting"}
              remainingMs={remaining}
              totalMs={totalForPhase(snap, snap?.phase ?? "betting")}
            />
            <Badge tone="muted">Ván #{snap?.roundId ?? "—"}</Badge>
          </div>
          <div className="flex justify-center gap-3 rounded-[var(--radius-lg)] border border-border bg-bg py-6">
            {(payload?.faces ?? ["nai", "bau", "ga"]).map((f, i) => (
              <div
                key={i}
                className={cn(
                  "grid size-20 place-items-center rounded-[var(--radius-md)] border border-border bg-surface",
                  snap?.phase === "lock" && "animate-pulse",
                )}
              >
                {snap?.phase === "result" || payload ? (
                  <div className="flex flex-col items-center">
                    <FaceGlyph face={f as BauCuaFace} />
                    <span className="text-[10px] text-muted">
                      {BAUCUA_LABEL[f as BauCuaFace]}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted">?</span>
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {BAUCUA_FACES.map((face) => {
              const count = payload?.faces.filter((x) => x === face).length ?? 0;
              const win = snap?.phase === "result" && count > 0;
              return (
                <button
                  key={face}
                  type="button"
                  disabled={!canBet && authed}
                  onClick={() => onBet(face)}
                  className={cn(
                    "flex min-h-24 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-border bg-bg-elevated p-3",
                    win && "ring-2 ring-win",
                  )}
                >
                  <FaceGlyph face={face} />
                  <span className="text-sm">{BAUCUA_LABEL[face]}</span>
                  <span className="text-xs tabular-nums text-muted">
                    {formatXu(snap?.pots[face] ?? 0)}
                  </span>
                  {mine(face) > 0 ? (
                    <span className="text-xs text-accent">{formatXu(mine(face))}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <ChipRow value={chip} onChange={setChip} disabled={pending} />
        </CardContent>
      </Card>
    </div>
  );
}
