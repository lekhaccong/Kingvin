import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ClubShell } from "@/components/club/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { claimFn, ledgerFn } from "@/lib/game/fns";
import { formatXu } from "@/lib/utils";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

const TYPE_LABEL: Record<string, string> = {
  welcome: "Xu chào mừng",
  daily: "Xu ngày",
  relief: "Xu hỗ trợ",
  bet: "Đặt cược",
  payout: "Trả thưởng",
  refund: "Hoàn xu",
};

function WalletPage() {
  const { user, isPending } = useCurrentUserState();
  const [data, setData] = useState<Awaited<ReturnType<typeof ledgerFn>> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    void ledgerFn().then(setData);
  }, [user]);

  if (isPending) {
    return (
      <ClubShell>
        <div className="h-40 animate-pulse rounded-[var(--radius-xl)] bg-surface" />
      </ClubShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  async function onClaim() {
    setBusy(true);
    try {
      const res = await claimFn();
      toast.message(res.message);
      setData(await ledgerFn());
    } finally {
      setBusy(false);
    }
  }

  return (
    <ClubShell>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Sổ xu ảo</p>
          <h1 className="font-display text-4xl">Ví của bạn</h1>
        </div>
        <Button onClick={onClaim} disabled={busy} variant="outline">
          Nhận xu ngày
        </Button>
      </header>
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Số dư</p>
          <CardTitle className="font-display text-4xl tabular-nums">
            {formatXu(data?.balance ?? 0)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.rows ?? []).length === 0 ? (
            <p className="text-sm text-muted">Chưa có giao dịch.</p>
          ) : (
            data!.rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0"
              >
                <div>
                  <p className="text-sm">{TYPE_LABEL[row.type] ?? row.type}</p>
                  <p className="text-xs text-subtle">
                    {row.game ?? "hệ thống"}
                    {row.round_id ? ` · ván ${row.round_id}` : ""}
                  </p>
                </div>
                <p
                  className={
                    Number(row.amount) >= 0
                      ? "tabular-nums text-win"
                      : "tabular-nums text-lose"
                  }
                >
                  {Number(row.amount) >= 0 ? "+" : ""}
                  {formatXu(Number(row.amount))}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </ClubShell>
  );
}
