import { CHIP_VALUES } from "@/lib/game/constants";
import { cn, formatXu } from "@/lib/utils";

export function ChipRow({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIP_VALUES.map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={cn(
            "h-11 min-w-16 rounded-full border px-3 text-sm tabular-nums",
            value === n
              ? "border-accent bg-accent text-accent-fg"
              : "border-border bg-bg-elevated text-fg hover:bg-surface-2",
          )}
        >
          {formatXu(n)}
        </button>
      ))}
    </div>
  );
}
