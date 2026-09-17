import { useCallback, useEffect, useRef, useState } from "react";
import { betFn, syncMine, syncPublic } from "@/lib/game/fns";
import type { GameId, Phase } from "@/lib/game/constants";
import type { GameSnapshot, PlayerView } from "@/lib/game/engine";
import { newRequestId } from "@/lib/utils";

export function remainingOf(
  snap: GameSnapshot | null,
  now: number,
  receivedAt: number,
): number {
  if (!snap) return 0;
  return Math.max(0, snap.remainingMs - (now - receivedAt));
}

export function totalForPhase(snap: GameSnapshot | null, phase: Phase): number {
  if (!snap) return 1;
  if (phase === "betting") return snap.betMs;
  if (phase === "lock") return snap.lockMs;
  if (phase === "result") return snap.resultMs;
  return 1;
}

export function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let id = 0;
    const tick = () => {
      setNow(Date.now());
      id = window.setTimeout(tick, 200);
    };
    id = window.setTimeout(tick, 200);
    return () => window.clearTimeout(id);
  }, []);
  return now;
}

export function useGame(game: GameId, authed: boolean) {
  const [snap, setSnap] = useState<PlayerView | GameSnapshot | null>(null);
  const [receivedAt, setReceivedAt] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const alive = useRef(true);

  const pull = useCallback(async () => {
    try {
      const data = authed
        ? await syncMine({ data: { game } })
        : await syncPublic({ data: { game } });
      if (!alive.current) return;
      setSnap(data);
      setReceivedAt(Date.now());
      setError(null);
    } catch (err) {
      if (!alive.current) return;
      setError(err instanceof Error ? err.message : "Không đồng bộ được ván.");
    }
  }, [game, authed]);

  useEffect(() => {
    alive.current = true;
    let timer = 0;
    const loop = async () => {
      const t0 = Date.now();
      await pull();
      if (!alive.current) return;
      const elapsed = Date.now() - t0;
      timer = window.setTimeout(loop, Math.max(200, 800 - elapsed));
    };
    void loop();
    return () => {
      alive.current = false;
      window.clearTimeout(timer);
    };
  }, [pull]);

  const bet = useCallback(
    async (market: string, amount: number) => {
      if (!authed) return { ok: false as const, reason: "auth" };
      setPending(true);
      try {
        const res = await betFn({
          data: {
            game,
            market,
            amount,
            requestId: newRequestId(),
          },
        });
        if (res.ok) {
          setSnap(res.snapshot);
          setReceivedAt(Date.now());
        }
        return res;
      } catch (err) {
        return {
          ok: false as const,
          reason: err instanceof Error ? err.message : "error",
        };
      } finally {
        setPending(false);
      }
    },
    [authed, game],
  );

  return { snap, receivedAt, error, pending, bet, refresh: pull };
}

export function isPlayerView(
  snap: GameSnapshot | PlayerView | null,
): snap is PlayerView {
  return !!snap && "balance" in snap && "myBets" in snap;
}
