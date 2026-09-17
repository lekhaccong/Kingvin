import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import { ChipRow } from "@/components/club/chips";
import { TimerRing } from "@/components/club/timer-ring";
import { BetPad } from "@/components/club/bet-pad";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { XocDiaPayload } from "@/lib/game/rules";
import { cn, formatXu } from "@/lib/utils";
import {
  isPlayerView,
  remainingOf,
  totalForPhase,
  useClock,
  useGame,
} from "@/hooks/use-game";

export function XocDiaTable() {
  const { user } = useCurrentUserState();
  const authed = !!user;
  const { snap, receivedAt, pending, bet } = useGame("xocdia", authed);
  const now = useClock();
  const remaining = remainingOf(snap, now, receivedAt);
  const [chip, setChip] = useState(1000);
  const payload = snap?.payload?.kind === "xocdia" ? (snap.payload as XocDiaPayload) : null;
  const my = isPlayerView(snap) ? snap.myBets : [];
  const mine = (m: string) => my.find((b) => b.market === m)?.amount ?? 0;
  const canBet = snap?.phase === "betting" && authed && !pending;
  const spinning = snap?.phase === "lock";
  const coins = payload?.coins ?? [0, 1, 0, 1];

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
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Bàn đĩa</p>
          <h1 className="font-display text-4xl tracking-tight">Xóc Đĩa</h1>
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
          <div className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-bg py-8">
            <div className="grid size-48 place-items-center rounded-full border border-border-strong bg-surface">
              {snap?.phase === "betting" ? (
                <div className="size-28 rounded-full border border-border bg-surface-2" />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {coins.map((c, i) => (
                    <div
                      key={i}
                      className={cn(
                        "coin",
                        spinning ? "is-spinning" : c ? "coin-red" : "coin-white",
                      )}
                    >
                      {spinning ? "" : c ? "Đ" : "T"}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {payload && snap?.phase === "result" ? (
              <p className="text-sm text-muted">
                {payload.red} đỏ · {payload.even ? "Chẵn" : "Lẻ"}
              </p>
            ) : (
              <p className="text-sm text-muted">
                {snap?.phase === "lock" ? "Đang xóc đĩa" : "Đặt Chẵn hoặc Lẻ"}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BetPad
              label="Chẵn"
              hint="0 · 2 · 4 đỏ"
              pot={snap?.pots.chan ?? 0}
              mine={mine("chan")}
              win={!!payload && payload.even && snap?.phase === "result"}
              disabled={!canBet && authed}
              onClick={() => onBet("chan")}
            />
            <BetPad
              label="Lẻ"
              hint="1 · 3 đỏ"
              pot={snap?.pots.le ?? 0}
              mine={mine("le")}
              win={!!payload && !payload.even && snap?.phase === "result"}
              disabled={!canBet && authed}
              onClick={() => onBet("le")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <BetPad
              label="4 đỏ"
              hint="x8"
              pot={snap?.pots.red4 ?? 0}
              mine={mine("red4")}
              win={payload?.red === 4 && snap?.phase === "result"}
              disabled={!canBet && authed}
              onClick={() => onBet("red4")}
            />
            <BetPad
              label="4 trắng"
              hint="x8"
              pot={snap?.pots.red0 ?? 0}
              mine={mine("red0")}
              win={payload?.red === 0 && snap?.phase === "result"}
              disabled={!canBet && authed}
              onClick={() => onBet("red0")}
            />
          </div>
          <ChipRow value={chip} onChange={setChip} disabled={pending} />
        </CardContent>
      </Card>
    </div>
  );
}
