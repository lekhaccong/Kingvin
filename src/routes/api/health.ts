import { createFileRoute } from "@tanstack/react-router";
import { dbSource, getSql } from "@/lib/db";
import { gamesHealth } from "@/lib/game/engine";
import { installProcessGuards, memorySnapshot } from "@/lib/server/lifecycle";
import { log } from "@/lib/server/log";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        installProcessGuards();
        let database: "connected" | "error" = "error";
        try {
          const sql = await getSql();
          await sql`select 1 as ok`;
          database = "connected";
        } catch (err) {
          log("error", {
            module: "health",
            event: "http_db_ping_failed",
            message: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
          });
        }
        const games = await gamesHealth();
        const body = {
          status: database === "connected" ? "ok" : "degraded",
          database,
          dbSource,
          uptime: process.uptime(),
          memory: memorySnapshot(),
          games,
        };
        return Response.json(body, {
          status: database === "connected" ? 200 : 503,
        });
      },
    },
  },
});
