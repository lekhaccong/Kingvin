import { getSql } from "@/lib/db";
import { log } from "@/lib/server/log";
import { TIMING, type GameId, type Phase } from "./constants";
import {
  isLegalMarket,
  phaseAt,
  rollFor,
  settleBet,
  type GamePayload,
} from "./rules";
import { creditPayout, debitBet, ensureWallet, getBalance } from "./wallet";

export type RoundRow = {
  id: number;
  game: GameId;
  started_at: string;
  bet_ms: number;
  lock_ms: number;
  result_ms: number;
  status: Phase;
  payload: GamePayload | null;
  settled: boolean;
};

export type BetRow = {
  market: string;
  amount: number;
  payout: number;
  status: string;
};

export type PotMap = Record<string, number>;
export type PlayerCountMap = Record<string, number>;

export type GameSnapshot = {
  game: GameId;
  roundId: number;
  phase: Phase;
  remainingMs: number;
  betMs: number;
  lockMs: number;
  resultMs: number;
  payload: GamePayload | null;
  pots: PotMap;
  playerCounts: PlayerCountMap;
  history: GamePayload[];
  serverNow: number;
};

export type PlayerView = GameSnapshot & {
  balance: number;
  myBets: BetRow[];
};

function asPayload(value: unknown): GamePayload | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as GamePayload;
    } catch {
      return null;
    }
  }
  return value as GamePayload;
}

function startedMs(row: RoundRow): number {
  return new Date(row.started_at).getTime();
}

function wrapRound(row: RoundRow): RoundRow {
  return { ...row, payload: asPayload(row.payload) };
}

async function latestOpen(game: GameId): Promise<RoundRow | null> {
  const sql = await getSql();
  const rows = await sql<RoundRow>`
    select id, game, started_at, bet_ms, lock_ms, result_ms, status, payload, settled
    from game_rounds
    where game = ${game} and status <> 'closed'
    order by id desc
    limit 1
  `;
  if (!rows[0]) return null;
  return wrapRound(rows[0]);
}

async function createRound(game: GameId, now: Date): Promise<RoundRow> {
  const sql = await getSql();
  try {
    const rows = await sql<RoundRow>`
      insert into game_rounds (game, started_at, bet_ms, lock_ms, result_ms, status)
      values (
        ${game}, ${now.toISOString()}, ${TIMING.betMs}, ${TIMING.lockMs},
        ${TIMING.resultMs}, ${"betting"}
      )
      returning id, game, started_at, bet_ms, lock_ms, result_ms, status, payload, settled
    `;
    const row = wrapRound(rows[0]!);
    log("info", {
      module: "engine",
      event: "round_start",
      game,
      roundId: row.id,
    });
    return row;
  } catch (err) {
    log("warn", {
      module: "engine",
      event: "round_create_conflict",
      game,
      message: err instanceof Error ? err.message : String(err),
    });
    const existing = await latestOpen(game);
    if (existing) return existing;
    throw err;
  }
}

async function freezeResult(row: RoundRow): Promise<RoundRow> {
  if (row.payload) return row;
  const payload = rollFor(row.game);
  const sql = await getSql();
  const updated = await sql<RoundRow>`
    update game_rounds
    set payload = ${JSON.stringify(payload)}::jsonb, status = ${"lock"}
    where id = ${row.id} and payload is null
    returning id, game, started_at, bet_ms, lock_ms, result_ms, status, payload, settled
  `;
  if (updated[0]) {
    log("info", {
      module: "engine",
      event: "result_frozen",
      game: row.game,
      roundId: row.id,
      payload,
    });
    return wrapRound(updated[0]);
  }
  const again = await sql<RoundRow>`
    select id, game, started_at, bet_ms, lock_ms, result_ms, status, payload, settled
    from game_rounds where id = ${row.id}
  `;
  return again[0] ? wrapRound(again[0]) : row;
}

async function settleRound(row: RoundRow): Promise<RoundRow> {
  if (row.settled) return row;
  const frozen = await freezeResult(row);
  if (!frozen.payload) return frozen;
  const sql = await getSql();
  const claimed = await sql<RoundRow>`
    update game_rounds
    set settled = true, status = ${"result"}
    where id = ${frozen.id} and settled = false
    returning id, game, started_at, bet_ms, lock_ms, result_ms, status, payload, settled
  `;
  const winner = claimed[0] ? wrapRound(claimed[0]) : null;
  if (!winner) {
    const again = await sql<RoundRow>`
      select id, game, started_at, bet_ms, lock_ms, result_ms, status, payload, settled
      from game_rounds where id = ${frozen.id}
    `;
    return again[0] ? wrapRound(again[0]) : frozen;
  }
  const openBets = await sql<{
    id: number;
    user_id: string;
    market: string;
    amount: number;
  }>`
    select id, user_id, market, amount from bets
    where round_id = ${winner.id} and status = 'open'
  `;
  for (const bet of openBets) {
    const result = settleBet(
      winner.game,
      bet.market,
      Number(bet.amount),
      winner.payload!,
    );
    await sql`
      update bets
      set status = ${result.status}, payout = ${result.payout}
      where id = ${bet.id} and status = 'open'
    `;
    if (result.status === "won" && result.payout > 0) {
      await creditPayout({
        userId: bet.user_id,
        amount: result.payout,
        type: "payout",
        game: winner.game,
        roundId: winner.id,
        market: bet.market,
      });
    } else if (result.status === "push" && result.payout > 0) {
      await creditPayout({
        userId: bet.user_id,
        amount: result.payout,
        type: "refund",
        game: winner.game,
        roundId: winner.id,
        market: bet.market,
      });
    }
  }
  log("info", {
    module: "engine",
    event: "round_settled",
    game: winner.game,
    roundId: winner.id,
    bets: openBets.length,
    payload: winner.payload,
  });
  return winner;
}

async function closeAndNext(row: RoundRow, now: Date): Promise<RoundRow> {
  const settled = await settleRound(row);
  const sql = await getSql();
  await sql`
    update game_rounds set status = ${"closed"}
    where id = ${settled.id} and status <> 'closed'
  `;
  log("info", {
    module: "engine",
    event: "round_closed",
    game: settled.game,
    roundId: settled.id,
  });
  return createRound(settled.game, now);
}

export async function tick(game: GameId, nowMs = Date.now()): Promise<RoundRow> {
  const now = new Date(nowMs);
  let row = await latestOpen(game);
  if (!row) row = await createRound(game, now);

  const clock = phaseAt(
    startedMs(row),
    nowMs,
    row.bet_ms,
    row.lock_ms,
    row.result_ms,
  );

  if (clock.phase === "betting") {
    if (row.status !== "betting") {
      const sql = await getSql();
      await sql`update game_rounds set status = ${"betting"} where id = ${row.id}`;
      row = { ...row, status: "betting" };
    }
    return row;
  }
  if (clock.phase === "lock") {
    return freezeResult(row);
  }
  if (clock.phase === "result") {
    return settleRound(row);
  }
  return closeAndNext(row, now);
}

async function potsFor(roundId: number): Promise<PotMap> {
  const sql = await getSql();
  const rows = await sql<{ market: string; total: number }>`
    select market, sum(amount)::bigint as total
    from bets where round_id = ${roundId}
    group by market
  `;
  const pots: PotMap = {};
  for (const r of rows) pots[r.market] = Number(r.total);
  return pots;
}

async function playerCountsFor(roundId: number): Promise<PlayerCountMap> {
  const sql = await getSql();
  const rows = await sql<{ market: string; total: number }>`
    select market, count(distinct user_id)::int as total
    from bets where round_id = ${roundId}
    group by market
  `;
  const counts: PlayerCountMap = {};
  for (const r of rows) counts[r.market] = Number(r.total);
  return counts;
}

async function historyFor(game: GameId, limit = 24): Promise<GamePayload[]> {
  const sql = await getSql();
  const rows = await sql<{ payload: GamePayload }>`
    select payload from game_rounds
    where game = ${game} and payload is not null
    order by id desc
    limit ${limit}
  `;
  return rows.map((r) => r.payload).filter(Boolean);
}

export async function snapshot(
  game: GameId,
  nowMs = Date.now(),
): Promise<GameSnapshot> {
  const row = await tick(game, nowMs);
  const clock = phaseAt(
    startedMs(row),
    nowMs,
    row.bet_ms,
    row.lock_ms,
    row.result_ms,
  );
  const showPayload =
    clock.phase === "result" || clock.phase === "closed" ? row.payload : null;
  return {
    game,
    roundId: row.id,
    phase: clock.phase,
    remainingMs: Math.max(0, Math.ceil(clock.remainingMs)),
    betMs: row.bet_ms,
    lockMs: row.lock_ms,
    resultMs: row.result_ms,
    payload: showPayload,
    pots: await potsFor(row.id),
    playerCounts: await playerCountsFor(row.id),
    history: await historyFor(game),
    serverNow: nowMs,
  };
}

export async function playerSnapshot(
  game: GameId,
  userId: string,
  nowMs = Date.now(),
): Promise<PlayerView> {
  const snap = await snapshot(game, nowMs);
  const sql = await getSql();
  await ensureWallet(userId);
  const bets = await sql<BetRow>`
    select market, amount, payout, status
    from bets
    where round_id = ${snap.roundId} and user_id = ${userId}
  `;
  return {
    ...snap,
    balance: await getBalance(userId),
    myBets: bets.map((b) => ({
      ...b,
      amount: Number(b.amount),
      payout: Number(b.payout),
    })),
  };
}

export async function placeBet(opts: {
  userId: string;
  game: GameId;
  market: string;
  amount: number;
  requestId: string;
}): Promise<
  | { ok: true; snapshot: PlayerView }
  | { ok: false; reason: string; snapshot: PlayerView }
> {
  const { userId, game, market, amount, requestId } = opts;
  const view = await playerSnapshot(game, userId);
  if (!isLegalMarket(game, market)) {
    return { ok: false, reason: "market", snapshot: view };
  }
  if (!Number.isInteger(amount) || amount < 1000) {
    return { ok: false, reason: "min", snapshot: view };
  }
  if (amount > 500_000) {
    return { ok: false, reason: "max", snapshot: view };
  }
  if (view.phase !== "betting") {
    return { ok: false, reason: "closed", snapshot: view };
  }

  const sql = await getSql();
  const existingReq = await sql<{ id: number }>`
    select id from bets where user_id = ${userId} and request_id = ${requestId}
    limit 1
  `;
  if (existingReq.length) {
    return { ok: true, snapshot: await playerSnapshot(game, userId) };
  }

  const debit = await debitBet({
    userId,
    amount,
    game,
    roundId: view.roundId,
    market,
    requestId,
  });
  if (!debit.ok) {
    return {
      ok: false,
      reason: debit.reason,
      snapshot: await playerSnapshot(game, userId),
    };
  }

  try {
    await sql`
      insert into bets (user_id, game, round_id, market, amount, request_id)
      values (${userId}, ${game}, ${view.roundId}, ${market}, ${amount}, ${requestId})
      on conflict (user_id, round_id, market)
      do update set amount = bets.amount + excluded.amount
    `;
  } catch (err) {
    log("error", {
      module: "engine",
      event: "bet_insert_failed",
      game,
      roundId: view.roundId,
      userId,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    await creditPayout({
      userId,
      amount,
      type: "refund",
      game,
      roundId: view.roundId,
      market: `failed:${market}:${requestId}`,
    });
    return {
      ok: false,
      reason: "error",
      snapshot: await playerSnapshot(game, userId),
    };
  }

  log("info", {
    module: "engine",
    event: "bet_placed",
    game,
    roundId: view.roundId,
    userId,
    market,
    amount,
  });
  return { ok: true, snapshot: await playerSnapshot(game, userId) };
}

export async function gamesHealth() {
  const out: Record<
    string,
    { roundId: number | null; phase: Phase | "idle"; remainingMs: number }
  > = {};
  for (const game of ["taixiu", "baucua", "xocdia"] as const) {
    try {
      const snap = await snapshot(game);
      out[game] = {
        roundId: snap.roundId,
        phase: snap.phase,
        remainingMs: snap.remainingMs,
      };
    } catch (err) {
      log("error", {
        module: "engine",
        event: "health_game_failed",
        game,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      out[game] = { roundId: null, phase: "idle", remainingMs: 0 };
    }
  }
  return out;
}

export async function recentRounds(game: GameId, limit = 12) {
  const sql = await getSql();
  return sql<{
    id: number;
    status: string;
    payload: GamePayload | null;
    started_at: string;
    settled: boolean;
  }>`
    select id, status, payload, started_at, settled
    from game_rounds
    where game = ${game}
    order by id desc
    limit ${limit}
  `;
}
