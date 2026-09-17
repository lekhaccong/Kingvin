import { cn } from "@/lib/utils";

function Face({ n }: { n: number }) {
  return (
    <div className="pips" data-n={n}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="pip" />
      ))}
    </div>
  );
}

export function Die({
  value,
  spinning,
}: {
  value: number;
  spinning?: boolean;
}) {
  const v = Math.min(6, Math.max(1, value || 1));
  return (
    <div
      className={cn(
        "grid size-16 place-items-center rounded-[10px] border border-black/15 bg-[#efe6d6] text-[#1a1410] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.45)]",
        spinning && "animate-spin",
      )}
      aria-label={`Xúc xắc ${v}`}
    >
      {spinning ? null : <Face n={v} />}
    </div>
  );
}

export function DiceRow({
  values,
  spinning,
}: {
  values: number[];
  spinning?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-5 py-4">
      {values.map((v, i) => (
        <Die key={i} value={v} spinning={spinning} />
      ))}
    </div>
  );
}
