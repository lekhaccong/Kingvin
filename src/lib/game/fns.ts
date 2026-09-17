import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, dbSource } from "@/lib/db";
import { GAMES, type GameId } from "./constants";
import {
  gamesHealth,
  placeBet,
  playerSnapshot,
  recentRounds,
  snapshot,
} from "./engine";
import { claimDaily, ensureWallet, listLedger } from "./wallet";
import { installProcessGuards, memorySnapshot } from "@/lib/server/lifecycle";
import { log } from "@/lib/server/log";

async function buildHealth() {
  installProcessGuards();
  let database: "connected" | "error" = "error";
  try {
    const sql = await getSql();
    await sql`select 1 as ok`;
    database = "connected";
  } catch (err) {
    log("error", {
      module: "health",
      event: "db_ping_failed",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
  const games = await gamesHealth();
  return {
    status: database === "connected" ? "ok" : "degraded",
    database,
    dbSource,
    uptime: process.uptime(),
    memory: memorySnapshot(),
    games,
  };
}

const gameSchema = z.object({
  game: z.enum(GAMES),
});

export const syncPublic = createServerFn({ method: "POST" })
  .validator(gameSchema)
  .handler(async ({ data }) => {
    return snapshot(data.game as GameId);
  });

export const syncMine = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(gameSchema)
  .handler(async ({ data, context }) => {
    return playerSnapshot(data.game as GameId, context.userId);
  });

export const betFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      game: z.enum(GAMES),
      market: z.string().min(1).max(16),
      amount: z.number().int().positive(),
      requestId: z.string().min(8).max(80),
    }),
  )
  .handler(async ({ data, context }) => {
    return placeBet({
      userId: context.userId,
      game: data.game as GameId,
      market: data.market,
      amount: data.amount,
      requestId: data.requestId,
    });
  });

export const claimFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return claimDaily(context.userId);
  });

export const ledgerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const balance = await ensureWallet(context.userId);
    const rows = await listLedger(context.userId);
    return { balance, rows };
  });

export const healthFn = createServerFn({ method: "GET" }).handler(async () => {
  return buildHealth();
});

export const opsFn = createServerFn({ method: "GET" }).handler(async () => {
  const health = await buildHealth();
  const taixiu = await recentRounds("taixiu", 10);
  const baucua = await recentRounds("baucua", 8);
  const xocdia = await recentRounds("xocdia", 8);
  return { health, recent: { taixiu, baucua, xocdia } };
});

export const lobbyFn = createServerFn({ method: "GET" }).handler(async () => {
  const [taixiu, baucua, xocdia] = await Promise.all([
    snapshot("taixiu"),
    snapshot("baucua"),
    snapshot("xocdia"),
  ]);
  return { taixiu, baucua, xocdia };
});
