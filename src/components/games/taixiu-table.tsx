import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ChipRow } from "@/components/club/chips";
import { DiceRow } from "@/components/club/dice";
import { TimerRing } from "@/components/club/timer-ring";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { TaiXiuPayload } from "@/lib/game/rules";
import { cn, formatXu } from "@/lib/utils";
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
  const [opened, setOpened] = useState(false);

  const payload = snap?.payload?.kind === "taixiu" ? (snap.payload as TaiXiuPayload) : null;
  const my = isPlayerView(snap) ? snap.myBets : [];
  const mine = (m: string) => my.filter((b) => b.market === m).reduce((sum, b) => sum + b.amount, 0);
  const canBet = snap?.phase === "betting" && authed && !pending;

  useEffect(() => setOpened(false), [snap?.roundId]);
  useEffect(() => {
    if (snap?.phase !== "result") return;
    const id = window.setTimeout(() => setOpened(true), 2_000);
    return () => window.clearTimeout(id);
  }, [snap?.phase, snap?.roundId]);

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
                  {payload.triple ? <Badge tone="muted">Bộ ba · Hũ may mắn</Badge> : null}
                </>
              ) : null}
            </div>
          </div>

          <div className="taixiu-board">
            <TaiXiuBet market="tai" label="TÀI" mine={mine("tai")} win={payload?.side === "tai" && snap?.phase === "result"} disabled={!canBet && authed} onBet={onBet} />
            <button type="button" className="taixiu-result" disabled={snap?.phase !== "result" || opened} onClick={() => setOpened(true)}>
              {snap?.phase === "betting" ? <TimerRing phase="betting" remainingMs={remaining} totalMs={totalForPhase(snap, "betting")} /> : snap?.phase === "lock" ? <div className="xoc-bowl is-shaking"><span>ĐANG XÓC</span></div> : opened && payload ? <DiceRow values={[payload.d1, payload.d2, payload.d3]} spinning={false} /> : <div className="xoc-bowl"><span>CHẠM MỞ BÁT</span></div>}
            </button>
            <TaiXiuBet market="xiu" label="XỈU" mine={mine("xiu")} win={payload?.side === "xiu" && snap?.phase === "result"} disabled={!canBet && authed} onBet={onBet} />
          </div>
          <div className="text-center">
            <p className="mt-2 text-center text-sm text-muted">
              {snap?.phase === "betting" && "Đặt Tài hoặc Xỉu trước khi khóa cửa."}
              {snap?.phase === "lock" && "Đang xóc — cược đã khóa."}
              {snap?.phase === "result" && payload
                ? `Tổng ${payload.sum} · ${payload.side === "tai" ? "Tài" : "Xỉu"}${payload.triple ? " · Bộ ba" : ""}`
                : null}
            </p>
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

function TaiXiuBet({ market, label, mine, win, disabled, onBet }: { market: string; label: string; mine: number; win: boolean; disabled: boolean; onBet: (market: string) => void }) {
  return <button type="button" disabled={disabled} onClick={() => onBet(market)} className={cn("taixiu-side", market === "tai" ? "is-tai" : "is-xiu", win && "is-winner")}><strong>{label}</strong>{mine > 0 ? <span>Đã cược: {formatXu(mine)}</span> : null}</button>;
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
