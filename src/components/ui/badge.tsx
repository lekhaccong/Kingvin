import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"span"> & {
  tone?: "default" | "win" | "lose" | "muted" | "tai" | "xiu";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums",
        tone === "default" && "bg-surface-2 text-accent",
        tone === "muted" && "bg-surface text-muted border border-border",
        tone === "win" && "bg-win/20 text-win",
        tone === "lose" && "bg-lose/20 text-lose",
        tone === "tai" && "bg-tai/20 text-tai",
        tone === "xiu" && "bg-xiu/20 text-xiu",
        className,
      )}
      {...props}
    />
  );
}
