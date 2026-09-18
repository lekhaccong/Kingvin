import { cn } from "@/lib/utils";
import type { Phase } from "@/lib/game/constants";

const LABEL: Record<Phase, string> = {
  betting: "Đặt cược",
  lock: "Khóa cửa",
  result: "Kết quả",
  closed: "Ván mới",
};

export function TimerRing({
  phase,
  remainingMs,
  totalMs,
}: {
  phase: Phase;
  remainingMs: number;
  totalMs: number;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const t = Math.max(0.001, totalMs);
  const p = Math.min(1, Math.max(0, remainingMs / t));
  const sec = Math.max(0, Math.ceil(remainingMs / 1000));
  return (
    <div className="game-timer flex items-center gap-3">
      <div className="relative size-16 sm:size-20">
        <svg viewBox="0 0 96 96" className="size-full -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-border"
            strokeWidth="6"
          />
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke="currentColor"
            className={cn(
              phase === "betting" && "text-accent",
              phase === "lock" && "text-muted",
              phase === "result" && "text-win",
              phase === "closed" && "text-subtle",
            )}
            strokeWidth="6"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - p)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-2xl tabular-nums leading-none text-gold sm:text-3xl">
            {sec}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Trạng thái</p>
        <p className="font-display text-lg leading-tight sm:text-xl">{LABEL[phase]}</p>
      </div>
    </div>
  );
}
