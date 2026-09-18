import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEffect, useState } from "react";
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
  const [opened, setOpened] = useState(false);
  const payload = snap?.payload?.kind === "baucua" ? (snap.payload as BauCuaPayload) : null;
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
    if (!res.ok) toast.error("Không đặt được cược.");
    else toast.success(`Đã đặt ${formatXu(chip)} xu`);
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Kim Lân mini game</p>
          <h1 className="game-title font-display text-4xl tracking-tight text-gold">Bầu Cua</h1>
        </div>
        {isPlayerView(snap) ? (
          <p className="font-display text-3xl tabular-nums">{formatXu(snap.balance)}</p>
        ) : (
          <Link to="/login" className="text-sm text-accent">
            Đăng nhập để chơi
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
            <Badge tone="muted">Ván #{snap?.roundId ?? "—"}</Badge>
          </div>
          <div className="baucua-board">
            <button type="button" className="baucua-result" disabled={snap?.phase !== "result" || opened} onClick={() => setOpened(true)}>
              {snap?.phase === "betting" ? <TimerRing phase="betting" remainingMs={remaining} totalMs={totalForPhase(snap, "betting")} /> : snap?.phase === "lock" ? <div className="xoc-bowl is-shaking"><span>ĐANG XÓC</span></div> : opened && payload ? <div className="baucua-dice">{payload.faces.map((face, index) => <span key={index}><FaceGlyph face={face} /></span>)}</div> : <div className="xoc-bowl"><span>CHẠM MỞ BÁT</span></div>}
            </button>
            <div className="baucua-faces">
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
                    "baucua-face",
                    win && "is-winner",
                  )}
                >
                  <FaceGlyph face={face} />
                  <span className="text-sm">{BAUCUA_LABEL[face]}</span>
                  {mine(face) > 0 ? (
                    <span className="baucua-my-bet">Đã cược: {formatXu(mine(face))}</span>
                  ) : null}
                </button>
              );
            })}
            </div>
          </div>
          <ChipRow value={chip} onChange={setChip} disabled={pending} />
        </CardContent>
      </Card>
    </div>
  );
}
