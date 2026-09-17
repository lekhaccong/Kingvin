import { getSql, type Sql } from "@/lib/db";
import { log } from "@/lib/server/log";
import {
  DAILY_XU,
  RELIEF_BELOW,
  RELIEF_XU,
  WELCOME_XU,
} from "./constants";

export type LedgerType =
  | "welcome"
  | "daily"
  | "relief"
  | "bet"
  | "payout"
  | "refund";

async function ensureWalletWith(sql: Sql, userId: string): Promise<number> {
  await sql`
    insert into wallets (user_id, balance)
    values (${userId}, 0)
    on conflict (user_id) do nothing
  `;
  try {
    await applyCreditWith(sql, {
      userId,
      type: "welcome",
      amount: WELCOME_XU,
      referenceId: `welcome:${userId}`,
    });
  } catch (err) {
    log("error", {
      module: "wallet",
      event: "welcome_failed",
      userId,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
  const rows = await sql<{ balance: number }>`
    select balance from wallets where user_id = ${userId}
  `;
  return Number(rows[0]?.balance ?? 0);
}

export async function ensureWallet(userId: string): Promise<number> {
  const sql = await getSql();
  return sql.transaction((tx) => ensureWalletWith(tx, userId));
}

async function getBalanceWith(sql: Sql, userId: string): Promise<number> {
  const rows = await sql<{ balance: number }>`
    select balance from wallets where user_id = ${userId}
  `;
  if (!rows[0]) return ensureWalletWith(sql, userId);
  return Number(rows[0].balance);
}

export async function getBalance(userId: string): Promise<number> {
  const sql = await getSql();
  return getBalanceWith(sql, userId);
}

async function applyCreditWith(sql: Sql, opts: {
  userId: string;
  type: LedgerType;
  amount: number;
  referenceId: string;
  game?: string;
  roundId?: number;
}): Promise<{ applied: boolean; balance: number }> {
  if (opts.amount <= 0) {
    const bal = await getBalanceWith(sql, opts.userId);
    return { applied: false, balance: bal };
  }
  const walletRows = await sql<{ balance: number }>`
    select balance from wallets where user_id = ${opts.userId} for update
  `;
  if (!walletRows[0]) {
    throw new Error(`Wallet missing for user ${opts.userId}`);
  }
  const existing = await sql<{ id: number }>`
    select id from wallet_ledger
    where user_id = ${opts.userId} and reference_id = ${opts.referenceId}
    limit 1
  `;
  if (existing.length) {
    const bal = await getBalanceWith(sql, opts.userId);
    return { applied: false, balance: bal };
  }
  const updated = await sql<{ balance: number }>`
    update wallets
    set balance = balance + ${opts.amount}, updated_at = now()
    where user_id = ${opts.userId}
    returning balance
  `;
  const after = Number(updated[0]?.balance ?? 0);
  const before = after - opts.amount;
  await sql`
    insert into wallet_ledger (
      user_id, type, amount, balance_before, balance_after,
      game, round_id, reference_id
    ) values (
      ${opts.userId}, ${opts.type}, ${opts.amount}, ${before}, ${after},
      ${opts.game ?? null}, ${opts.roundId ?? null}, ${opts.referenceId}
    )
  `;
  return { applied: true, balance: after };
}

async function applyCredit(opts: Parameters<typeof applyCreditWith>[1]) {
  const sql = await getSql();
  return sql.transaction((tx) => applyCreditWith(tx, opts));
}

export async function debitBet(opts: {
  userId: string;
  amount: number;
  game: string;
  roundId: number;
  market: string;
  requestId: string;
}): Promise<{ ok: true; balance: number } | { ok: false; reason: string; balance: number }> {
  const sql = await getSql();
  return sql.transaction((tx) => debitBetWithSql(tx, opts));
}

export async function debitBetWithSql(sql: Sql, opts: {
  userId: string;
  amount: number;
  game: string;
  roundId: number;
  market: string;
  requestId: string;
}): Promise<{ ok: true; balance: number } | { ok: false; reason: string; balance: number }> {
  await ensureWalletWith(sql, opts.userId);
  const referenceId = `bet:${opts.roundId}:${opts.userId}:${opts.market}:${opts.requestId}`;
  const dup = await sql<{ id: number }>`
    select id from wallet_ledger
    where user_id = ${opts.userId} and reference_id = ${referenceId}
    limit 1
  `;
  if (dup.length) {
    const bal = await getBalanceWith(sql, opts.userId);
    return { ok: false, reason: "duplicate", balance: bal };
  }
  const updated = await sql<{ balance: number }>`
    update wallets
    set balance = balance - ${opts.amount}, updated_at = now()
    where user_id = ${opts.userId} and balance >= ${opts.amount}
    returning balance
  `;
  if (!updated[0]) {
    const bal = await getBalanceWith(sql, opts.userId);
    return { ok: false, reason: "insufficient", balance: bal };
  }
  const after = Number(updated[0].balance);
  const before = after + opts.amount;
  await sql`
    insert into wallet_ledger (
      user_id, type, amount, balance_before, balance_after,
      game, round_id, reference_id
    ) values (
      ${opts.userId}, ${"bet"}, ${-opts.amount}, ${before}, ${after},
      ${opts.game}, ${opts.roundId}, ${referenceId}
    )
  `;
  return { ok: true, balance: after };
}

export async function creditPayout(opts: {
  userId: string;
  amount: number;
  type: "payout" | "refund";
  game: string;
  roundId: number;
  market: string;
}): Promise<void> {
  await applyCredit({
    userId: opts.userId,
    type: opts.type,
    amount: opts.amount,
    referenceId: `${opts.type}:${opts.roundId}:${opts.userId}:${opts.market}`,
    game: opts.game,
    roundId: opts.roundId,
  });
}

export async function creditPayoutWithSql(sql: Sql, opts: {
  userId: string;
  amount: number;
  type: "payout" | "refund";
  game: string;
  roundId: number;
  market: string;
}): Promise<void> {
  await applyCreditWith(sql, {
    userId: opts.userId,
    type: opts.type,
    amount: opts.amount,
    referenceId: `${opts.type}:${opts.roundId}:${opts.userId}:${opts.market}`,
    game: opts.game,
    roundId: opts.roundId,
  });
}

export async function claimDaily(userId: string): Promise<{
  ok: boolean;
  kind: "daily" | "relief" | "none";
  amount: number;
  balance: number;
  message: string;
}> {
  const sql = await getSql();
  return sql.transaction(async (tx) => {
    const balance = await ensureWalletWith(tx, userId);
    const todayRows = await tx<{ d: string }>`select current_date::text as d`;
    const day = todayRows[0]?.d ?? new Date().toISOString().slice(0, 10);
    const existing = await tx<{ ok: number }>`
      select 1 as ok from daily_claims where user_id = ${userId} and day = ${day}
      limit 1
    `;
    if (existing.length) {
      return {
        ok: false,
        kind: "none" as const,
        amount: 0,
        balance,
        message: "Hôm nay đã nhận xu rồi.",
      };
    }
    const kind = balance < RELIEF_BELOW ? "relief" : "daily";
    const amount = kind === "relief" ? RELIEF_XU : DAILY_XU;
    await tx`
      insert into daily_claims (user_id, day, kind, amount)
      values (${userId}, ${day}, ${kind}, ${amount})
    `;
    const credit = await applyCreditWith(tx, {
      userId,
      type: kind,
      amount,
      referenceId: `${kind}:${userId}:${day}`,
    });
    return {
      ok: credit.applied,
      kind,
      amount: credit.applied ? amount : 0,
      balance: credit.balance,
      message: credit.applied
        ? kind === "relief"
          ? `Nhận xu hỗ trợ ${amount.toLocaleString("vi-VN")}.`
          : `Nhận xu ngày ${amount.toLocaleString("vi-VN")}.`
        : "Hôm nay đã nhận xu rồi.",
    };
  });
}

export async function listLedger(userId: string, limit = 40) {
  const sql = await getSql();
  return sql<{
    id: number;
    type: string;
    amount: number;
    balance_after: number;
    game: string | null;
    round_id: number | null;
    created_at: string;
  }>`
    select id, type, amount, balance_after, game, round_id, created_at
    from wallet_ledger
    where user_id = ${userId}
    order by id desc
    limit ${limit}
  `;
}
