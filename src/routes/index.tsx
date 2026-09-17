import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { ClubShell } from "@/components/club/shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { lobbyFn } from "@/lib/game/fns";
import type { GameSnapshot } from "@/lib/game/engine";
import { GAME_LABEL, type GameId, type Phase } from "@/lib/game/constants";

export const Route = createFileRoute("/")({
  loader: () => lobbyFn(),
  component: Home,
});

const PHASE_LABEL: Record<Phase, string> = {
  betting: "Đang đặt",
  lock: "Khóa cửa",
  result: "Kết quả",
  closed: "Sang ván",
};

const GAMES: { id: GameId; href: "/play/taixiu" | "/play/baucua" | "/play/xocdia"; blurb: string }[] =
  [
    {
      id: "taixiu",
      href: "/play/taixiu",
      blurb: "Ba viên xúc xắc. Tài 11–17, Xỉu 4–10. Ba mặt hoàn xu.",
    },
    {
      id: "baucua",
      href: "/play/baucua",
      blurb: "Sáu hình. Trúng một mặt x1, hai mặt x2, ba mặt x3.",
    },
    {
      id: "xocdia",
      href: "/play/xocdia",
      blurb: "Bốn đồng. Chẵn / Lẻ, hoặc 4 đỏ / 4 trắng.",
    },
  ];

function Home() {
  const data = Route.useLoaderData();
  const snaps: Record<GameId, GameSnapshot> = {
    taixiu: data.taixiu,
    baucua: data.baucua,
    xocdia: data.xocdia,
  };

  return (
    <ClubShell>
      <section className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-surface px-5 py-10 sm:px-10 sm:py-14">
        <p className="text-xs uppercase tracking-[0.28em] text-muted">Câu lạc bộ giải trí</p>
        <h1 className="mt-3 max-w-xl font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">
          Kim Lân
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
          Bàn Tài Xỉu chạy theo đồng hồ máy chủ — đặt, khóa, ra kết quả, sang ván.
          Không chờ vô hạn. Xu chỉ để chơi.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/play/taixiu"
            className="inline-flex h-12 items-center rounded-[var(--radius-sm)] bg-accent px-5 text-sm font-medium text-accent-fg"
          >
            Vào bàn Tài Xỉu
          </Link>
          <Link
            to="/login"
            className="inline-flex h-12 items-center rounded-[var(--radius-sm)] border border-border px-5 text-sm text-fg"
          >
            Nhận xu chào mừng
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {GAMES.map((g) => {
          const snap = snaps[g.id];
          return (
            <Link key={g.id} to={g.href} className="group block">
              <Card className="h-full transition-[border-color] duration-150 group-hover:border-border-strong">
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-2xl">{GAME_LABEL[g.id]}</h2>
                    <ArrowUpRight className="size-4 text-muted" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{g.blurb}</p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <Badge tone={snap.phase === "betting" ? "win" : "muted"}>
                      {PHASE_LABEL[snap.phase]}
                    </Badge>
                    <span className="text-xs tabular-nums text-subtle">
                      Ván #{snap.roundId} · {Math.ceil(snap.remainingMs / 1000)}s
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          {
            t: "Không kẹt ván",
            d: "Mỗi vòng có mốc thời gian trên máy chủ. Restart không làm bàn đứng hình.",
          },
          {
            t: "Xu có sổ",
            d: "Đặt, trả, hoàn đều ghi sổ. Một lệnh không cộng hai lần.",
          },
          {
            t: "Không tiền thật",
            d: "Không cổng nạp, không rút, không đổi thưởng. Chỉ xu ảo giải trí.",
          },
        ].map((item) => (
          <div
            key={item.t}
            className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5"
          >
            <h3 className="font-display text-lg">{item.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.d}</p>
          </div>
        ))}
      </section>
    </ClubShell>
  );
}
