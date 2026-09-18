import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import { ChipRow } from "@/components/club/chips";
import { DiceRow } from "@/components/club/dice";
import { TimerRing } from "@/components/club/timer-ring";
import { BetPad } from "@/components/club/bet-pad";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { TaiXiuPayload } from "@/lib/game/rules";
import { formatXu } from "@/lib/utils";
import {
  isPlayerView,
  remainingOf,
  totalForPhase,
  useClock,
  useGame,
} from "@/hooks/use-game";

function reasonText(reason: string): string {
  if (reason === "auth") return "Đăng nhập để đặt xu.";
  if (reason === "closed") return "Đã khóa cửa, đợi ván sau.";
  if (reason === "insufficient") return "Không đủ xu.";
  if (reason === "duplicate") return "Lệnh đã được ghi nhận.";
  if (reason === "min") return "Mức cược tối thiểu 1.000 xu.";
  if (reason === "max") return "Vượt mức cược tối đa.";
  return "Không đặt được cược.";
}

export function TaiXiuTable() {
  const { user } = useCurrentUserState();
  const authed = !!user;
  const { snap, receivedAt, pending, bet, error } = useGame("taixiu", authed);
  const now = useClock();
  const remaining = remainingOf(snap, now, receivedAt);
  const [chip, setChip] = useState(1000);

  const payload = snap?.payload?.kind === "taixiu" ? (snap.payload as TaiXiuPayload) : null;
  const spinning = snap?.phase === "lock";
  const dice = payload
    ? [payload.d1, payload.d2, payload.d3]
    : [1, 2, 3];
  const my = isPlayerView(snap) ? snap.myBets : [];
  const mine = (m: string) => my.find((b) => b.market === m)?.amount ?? 0;
  const canBet = snap?.phase === "betting" && authed && !pending;

  async function onBet(market: string) {
    if (!authed) {
      toast.message("Cần vào câu lạc bộ để đặt xu ảo.");
      return;
    }
    const res = await bet(market, chip);
    if (!res.ok) toast.error(reasonText("reason" in res ? res.reason : "error"));
    else toast.success(`Đã đặt ${formatXu(chip)} xu`);
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Kim Lân mini game</p>
          <h1 className="game-title font-display text-4xl tracking-tight text-gold">Tài Xỉu</h1>
        </div>
        {isPlayerView(snap) ? (
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Xu ảo</p>
            <p className="font-display text-3xl tabular-nums">{formatXu(snap.balance)}</p>
          </div>
        ) : (
          <Link to="/login" className="text-sm text-accent underline-offset-4 hover:underline">
            Đăng nhập để nhận 100.000 xu
          </Link>
        )}
      </header>

      <Card className="game-stage">
        <CardContent className="relative space-y-5 p-3 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TimerRing
              phase={snap?.phase ?? "betting"}
              remainingMs={remaining}
              totalMs={totalForPhase(snap, snap?.phase ?? "betting")}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="muted">Ván #{snap?.roundId ?? "—"}</Badge>
              {payload && snap?.phase === "result" ? (
                <>
                  <Badge tone={payload.side === "tai" ? "tai" : "xiu"}>
                    {payload.side === "tai" ? "Tài" : "Xỉu"} {payload.sum}
                  </Badge>
                  {payload.triple ? <Badge tone="muted">Ba mặt — hoàn xu</Badge> : null}
                </>
              ) : null}
            </div>
          </div>

          <div className="result-well px-4 py-6">
            {snap?.phase === "betting" && !payload ? (
              <div className="flex flex-col items-center py-2">
                <div className="grid size-36 place-items-center rounded-full border-4 border-accent/60 bg-bg shadow-[var(--shadow-soft)]">
                  <div className="grid size-24 place-items-center rounded-full border border-border bg-surface text-xs uppercase tracking-widest text-muted">Bát úp</div>
                </div>
              </div>
            ) : (
              <DiceRow
                values={
                  payload ? [payload.d1, payload.d2, payload.d3] : dice
                }
                spinning={spinning}
              />
            )}
            <p className="mt-2 text-center text-sm text-muted">
              {snap?.phase === "betting" && "Đặt Tài hoặc Xỉu trước khi khóa cửa."}
              {snap?.phase === "lock" && "Đang mở bát — cược đã khóa."}
              {snap?.phase === "result" && payload
                ? payload.triple
                  ? `Ba ${payload.d1} — Tài/Xỉu hoàn xu.`
                  : `Tổng ${payload.sum} · ${payload.side === "tai" ? "Tài" : "Xỉu"}`
                : null}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <BetPad
              tone="xiu"
              label="XỈU"
              hint="4 — 10"
              pot={snap?.pots.xiu ?? 0}
              mine={mine("xiu")}
              win={payload?.side === "xiu" && !payload.triple && snap?.phase === "result"}
              disabled={!canBet && authed}
              onClick={() => onBet("xiu")}
            />
            <BetPad
              tone="tai"
              label="TÀI"
              hint="11 — 17"
              pot={snap?.pots.tai ?? 0}
              mine={mine("tai")}
              win={payload?.side === "tai" && !payload.triple && snap?.phase === "result"}
              disabled={!canBet && authed}
              onClick={() => onBet("tai")}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <BetPad
              label="Chẵn"
              pot={snap?.pots.chan ?? 0}
              mine={mine("chan")}
              win={!!payload && payload.even && !payload.triple && snap?.phase === "result"}
              disabled={!canBet && authed}
              onClick={() => onBet("chan")}
            />
            <BetPad
              label="Lẻ"
              pot={snap?.pots.le ?? 0}
              mine={mine("le")}
              win={!!payload && !payload.even && !payload.triple && snap?.phase === "result"}
              disabled={!canBet && authed}
              onClick={() => onBet("le")}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Mức xu</p>
            <ChipRow value={chip} onChange={setChip} disabled={pending} />
          </div>

          {error ? <p className="text-sm text-lose">{error}</p> : null}

          <Road history={snap?.history ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

function Road({ history }: { history: { kind?: string; side?: string; sum?: number; triple?: boolean }[] }) {
  const items = history.filter((h) => h.kind === "taixiu").slice(0, 24);
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted">Cầu gần đây</p>
      <div className="history-rail flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="text-sm text-subtle">Chưa có ván kết thúc.</span>
        ) : (
          items.map((h, i) => (
            <span
              key={i}
              className={
                h.triple
                  ? "grid size-8 place-items-center rounded-[var(--radius-xs)] bg-surface-2 text-xs text-muted"
                  : h.side === "tai"
                    ? "grid size-8 place-items-center rounded-[var(--radius-xs)] bg-tai/25 text-xs text-tai"
                    : "grid size-8 place-items-center rounded-[var(--radius-xs)] bg-xiu/25 text-xs text-xiu"
              }
            >
              {h.triple ? "B" : h.side === "tai" ? "T" : "X"}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
