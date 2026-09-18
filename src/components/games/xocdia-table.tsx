import { Link } from "@tanstack/react-router";
import { CircleHelp, History, X } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ChipRow } from "@/components/club/chips";
import { TimerRing } from "@/components/club/timer-ring";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { XocDiaPayload } from "@/lib/game/rules";
import { cn, formatXu } from "@/lib/utils";
import { isPlayerView, remainingOf, totalForPhase, useClock, useGame } from "@/hooks/use-game";

const COLOR_MARKETS = [
  { market: "red4", coins: [1, 1, 1, 1], odds: "1:16" },
  { market: "red1", coins: [0, 0, 0, 1], odds: "1:4" },
  { market: "red3", coins: [1, 1, 1, 0], odds: "1:4" },
  { market: "red0", coins: [0, 0, 0, 0], odds: "1:16" },
] as const;

export function XocDiaTable() {
  const { user } = useCurrentUserState();
  const authed = !!user;
  const { snap, receivedAt, pending, bet } = useGame("xocdia", authed);
  const now = useClock();
  const remaining = remainingOf(snap, now, receivedAt);
  const [chip, setChip] = useState(1000);
  const [showHistory, setShowHistory] = useState(false);
  const [opened, setOpened] = useState(false);
  const payload = snap?.payload?.kind === "xocdia" ? (snap.payload as XocDiaPayload) : null;
  const my = isPlayerView(snap) ? snap.myBets : [];
  const mine = (market: string) => my.filter((b) => b.market === market).reduce((sum, b) => sum + b.amount, 0);
  const canBet = snap?.phase === "betting" && authed && !pending;
  const spinning = snap?.phase === "lock";
  const coins = payload?.coins ?? [0, 1, 0, 1];

  useEffect(() => {
    setOpened(false);
  }, [snap?.roundId]);

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
    <div className="xoc-page space-y-3">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Kim Lân mini game</p>
          <h1 className="game-title font-display text-4xl tracking-tight text-gold">Xóc Đĩa</h1>
        </div>
        {isPlayerView(snap) ? <p className="font-display text-2xl tabular-nums text-gold sm:text-3xl">{formatXu(snap.balance)}</p> : <Link to="/login" className="text-sm text-accent">Đăng nhập để chơi</Link>}
      </header>

      <section className="xoc-shell">
        {showHistory ? <XocHistory history={snap?.history ?? []} /> : null}
        <div className="xoc-toolbar">
          <button type="button" className={cn("xoc-round-button", showHistory && "is-active")} onClick={() => setShowHistory((v) => !v)} aria-label="Bật tắt bảng lịch sử"><History size={22} /></button>
          <span className="xoc-round-id">#{snap?.roundId ?? "—"}</span>
          <Link to="/" className="xoc-close" aria-label="Đóng Xóc Đĩa"><X size={28} /></Link>
        </div>

        <div className="xoc-board">
          <div className="xoc-main-bets">
            <XocBet market="chan" title="Chẵn" mine={mine("chan")} active={!!payload?.even && snap?.phase === "result"} disabled={!canBet && authed} onClick={onBet} />
            <ResultPlate phase={snap?.phase ?? "betting"} coins={coins} spinning={spinning} opened={opened} onOpen={() => setOpened(true)} remaining={remaining} total={totalForPhase(snap, snap?.phase ?? "betting")} />
            <XocBet market="le" title="Lẻ" mine={mine("le")} active={!!payload && !payload.even && snap?.phase === "result"} disabled={!canBet && authed} onClick={onBet} redTitle />
          </div>

          <div className="xoc-color-bets">
            {COLOR_MARKETS.map((item) => <XocColorBet key={item.market} {...item} mine={mine(item.market)} active={payload?.red === item.coins.reduce<number>((sum, coin) => sum + coin, 0) && snap?.phase === "result"} disabled={!canBet && authed} onClick={onBet} />)}
          </div>

          <div className="xoc-road" aria-label="Kết quả gần đây">
            {(snap?.history ?? []).filter((item): item is XocDiaPayload => item.kind === "xocdia").slice(0, 18).reverse().map((item, index) => <span key={index} className={item.red >= 2 ? "is-red" : "is-white"} />)}
          </div>
        </div>

        <div className="xoc-footer">
          <button type="button" className="xoc-help" aria-label="Hướng dẫn"><CircleHelp size={25} /></button>
          <ChipRow value={chip} onChange={setChip} disabled={pending} />
        </div>
      </section>
    </div>
  );
}

function XocBet({ market, title, mine, active, disabled, onClick, redTitle = false }: { market: string; title: string; mine: number; active: boolean; disabled: boolean; onClick: (market: string) => void; redTitle?: boolean }) {
  return <button type="button" className={cn("xoc-bet xoc-bet-main", active && "is-winner")} disabled={disabled} onClick={() => onClick(market)}><span className={cn("xoc-bet-title", redTitle && "is-red")}>{title}</span>{mine > 0 ? <span className="xoc-my-bet">Đã cược: {formatXu(mine)}</span> : null}</button>;
}

function XocColorBet({ market, coins, mine, active, disabled, onClick }: { market: string; coins: readonly number[]; odds: string; mine: number; active: boolean; disabled: boolean; onClick: (market: string) => void }) {
  return <button type="button" aria-label={`Cửa ${coins.reduce<number>((sum, coin) => sum + coin, 0)} đỏ`} className={cn("xoc-bet xoc-bet-color", active && "is-winner")} disabled={disabled} onClick={() => onClick(market)}><span className="xoc-color-pattern">{coins.map((coin, index) => <i key={index} className={coin ? "is-red" : "is-white"} />)}</span>{mine > 0 ? <span className="xoc-my-bet">Đã cược: {formatXu(mine)}</span> : null}</button>;
}

function ResultPlate({ phase, coins, spinning, opened, onOpen, remaining, total }: { phase: string; coins: readonly number[]; spinning: boolean; opened: boolean; onOpen: () => void; remaining: number; total: number }) {
  if (phase === "betting") return <div className="xoc-result-plate"><TimerRing phase="betting" remainingMs={remaining} totalMs={total} /></div>;
  if (spinning) return <div className="xoc-result-plate"><div className="xoc-bowl is-shaking"><span>ĐANG XÓC</span></div></div>;
  if (!opened) return <button type="button" className="xoc-result-plate" onClick={onOpen} aria-label="Mở bát"><div className="xoc-bowl"><span>CHẠM MỞ BÁT</span></div></button>;
  return <div className="xoc-result-plate is-open"><div className="xoc-result-coins">{coins.map((coin, index) => <i key={index} className={coin ? "is-red" : "is-white"} />)}</div></div>;
}

function XocHistory({ history }: { history: { kind?: string; red?: number; even?: boolean }[] }) {
  const items = history.filter((item) => item.kind === "xocdia").slice(0, 24).reverse();
  const even = items.filter((item) => item.even).length;
  const odd = items.length - even;
  return <div className="xoc-history"><div className="xoc-history-summary"><b>CHẴN {items.length ? Math.round((even / items.length) * 100) : 0}%</b><b>LẺ {items.length ? Math.round((odd / items.length) * 100) : 0}%</b></div><div className="xoc-history-grid">{items.map((item, index) => <span key={index} className={(item.red ?? 0) >= 2 ? "is-red" : "is-white"}>{item.red}</span>)}</div></div>;
}
