import { log } from "./log";

const g = globalThis as typeof globalThis & { __kimlanLife__?: boolean };

export function installProcessGuards(): void {
  if (typeof process === "undefined" || typeof process.on !== "function") return;
  if (g.__kimlanLife__) return;
  g.__kimlanLife__ = true;

  process.on("uncaughtException", (err) => {
    log("error", {
      module: "lifecycle",
      event: "uncaughtException",
      message: err.message,
      stack: err.stack,
    });
  });
  process.on("unhandledRejection", (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    log("error", {
      module: "lifecycle",
      event: "unhandledRejection",
      message: err.message,
      stack: err.stack,
    });
  });
  const shutdown = (signal: string) => {
    log("info", { module: "lifecycle", event: "shutdown", signal });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

export function memorySnapshot() {
  const m = process.memoryUsage();
  return {
    rss: m.rss,
    heapTotal: m.heapTotal,
    heapUsed: m.heapUsed,
    external: m.external,
    arrayBuffers: m.arrayBuffers,
  };
}
