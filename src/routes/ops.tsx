import { createFileRoute } from "@tanstack/react-router";
import { ClubShell } from "@/components/club/shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { opsFn } from "@/lib/game/fns";
import { GAME_LABEL, type GameId } from "@/lib/game/constants";

export const Route = createFileRoute("/ops")({
  loader: () => opsFn(),
  component: OpsPage,
});

function mb(n: number) {
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function OpsPage() {
  const { health, recent } = Route.useLoaderData();
  const games = ["taixiu", "baucua", "xocdia"] as const;

  return (
    <ClubShell>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Giám sát</p>
        <h1 className="font-display text-4xl">Vận hành</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Trạng thái máy chủ, cơ sở dữ liệu và vòng đời bàn. Không chứa khóa bí mật.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Trạng thái" v={health.status} />
            <Row k="Cơ sở dữ liệu" v={`${health.database} · ${health.dbSource}`} />
            <Row k="Uptime" v={`${Math.floor(health.uptime)}s`} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bộ nhớ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="RSS" v={mb(health.memory.rss)} />
            <Row k="Heap used" v={mb(health.memory.heapUsed)} />
            <Row k="Heap total" v={mb(health.memory.heapTotal)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bàn đang chạy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {games.map((g) => {
              const s = health.games[g];
              return (
                <div key={g} className="flex items-center justify-between">
                  <span>{GAME_LABEL[g as GameId]}</span>
                  <Badge tone="muted">
                    #{s.roundId ?? "—"} · {s.phase} · {Math.ceil(s.remainingMs / 1000)}s
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {games.map((g) => (
          <Card key={g}>
            <CardHeader>
              <CardTitle className="text-lg">{GAME_LABEL[g]} gần đây</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {recent[g].map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2">
                  <span className="tabular-nums text-muted">#{r.id}</span>
                  <span className="truncate text-subtle">
                    {summarize(g, r.payload)}
                  </span>
                  <Badge tone={r.settled ? "win" : "muted"}>{r.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </ClubShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}

function summarize(game: GameId, payload: unknown): string {
  if (!payload || typeof payload !== "object") return "—";
  const p = payload as Record<string, unknown>;
  if (game === "taixiu") {
    return `${p.d1}-${p.d2}-${p.d3} · ${p.sum} ${p.triple ? "bão" : p.side}`;
  }
  if (game === "baucua" && Array.isArray(p.faces)) return p.faces.join(" · ");
  if (game === "xocdia") return `${p.red} đỏ · ${p.even ? "chẵn" : "lẻ"}`;
  return "—";
}
