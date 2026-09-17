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
        "flex min-h-32 flex-col items-center justify-center gap-1 rounded-[var(--radius-lg)] border px-4 py-5 text-center transition-[border-color,background-color,transform] duration-150 active:scale-[0.99]",
        tone === "tai" && "border-tai/40 bg-tai/10",
        tone === "xiu" && "border-xiu/40 bg-xiu/10",
        tone === "default" && "border-border bg-bg-elevated",
        active && "ring-2 ring-accent/70",
        win && "ring-2 ring-win",
        disabled && "opacity-70",
      )}
    >
      <span className="font-display text-3xl leading-none">{label}</span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      <span className="mt-2 text-xs uppercase tracking-[0.16em] text-subtle">
        Tổng
      </span>
      <span className="tabular-nums text-sm text-fg">{formatXu(pot)}</span>
      {mine > 0 ? (
        <span className="text-xs tabular-nums text-accent">
          Bạn: {formatXu(mine)}
        </span>
      ) : null}
    </button>
  );
}
