import { cn, formatXu } from "@/lib/utils";

export function BetPad({
  label,
  hint,
  pot,
  mine,
  active,
  win,
  disabled,
  onClick,
  tone = "default",
}: {
  label: string;
  hint?: string;
  pot: number;
  mine: number;
  active?: boolean;
  win?: boolean;
  disabled?: boolean;
  onClick: () => void;
  tone?: "tai" | "xiu" | "default";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "bet-cell flex min-h-28 flex-col items-center justify-center gap-1 px-3 py-4 text-center transition-[filter,transform] duration-150 active:scale-[0.98] sm:min-h-32",
        tone === "tai" && "bet-cell-tai",
        tone === "xiu" && "bet-cell-xiu",
        tone === "default" && "bet-cell-neutral",
        active && "ring-2 ring-accent/70",
        win && "ring-2 ring-win",
        disabled && "opacity-70",
      )}
    >
      <span className="game-label text-3xl leading-none sm:text-4xl">{label}</span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      <span className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">Tổng cược</span>
      <span className="font-display text-base tabular-nums text-gold">{formatXu(pot)}</span>
      {mine > 0 ? (
        <span className="text-xs tabular-nums text-accent">
          Bạn: {formatXu(mine)}
        </span>
      ) : null}
    </button>
  );
}
