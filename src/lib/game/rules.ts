const BAUCUA_FACES = ["nai", "bau", "ga", "ca", "cua", "tom"] as const;
export type BauCuaFace = (typeof BAUCUA_FACES)[number];

export type TaiXiuPayload = {
  kind: "taixiu";
  d1: number;
  d2: number;
  d3: number;
  sum: number;
  triple: boolean;
  side: "tai" | "xiu";
  even: boolean;
};

export type BauCuaPayload = {
  kind: "baucua";
  faces: [BauCuaFace, BauCuaFace, BauCuaFace];
};

export type XocDiaPayload = {
  kind: "xocdia";
  coins: [0 | 1, 0 | 1, 0 | 1, 0 | 1];
  red: number;
  even: boolean;
};

export type GamePayload = TaiXiuPayload | BauCuaPayload | XocDiaPayload;

export type SettleResult = { status: "won" | "lost" | "push"; payout: number };

function d6(rand: () => number): number {
  return 1 + Math.floor(rand() * 6);
}

export function rollTaiXiu(rand: () => number = Math.random): TaiXiuPayload {
  const d1 = d6(rand);
  const d2 = d6(rand);
  const d3 = d6(rand);
  const sum = d1 + d2 + d3;
  const triple = d1 === d2 && d2 === d3;
  return {
    kind: "taixiu",
    d1,
    d2,
    d3,
    sum,
    triple,
    side: sum >= 11 ? "tai" : "xiu",
    even: sum % 2 === 0,
  };
}

export function settleTaiXiu(
  market: string,
  amount: number,
  p: TaiXiuPayload,
): SettleResult {
  if (market === "tai" || market === "xiu") {
    if (p.triple) return { status: "push", payout: amount };
    if (market === p.side) return { status: "won", payout: amount * 2 };
    return { status: "lost", payout: 0 };
  }
  if (market === "chan" || market === "le") {
    if (p.triple) return { status: "push", payout: amount };
    const even = market === "chan";
    if (p.even === even) return { status: "won", payout: amount * 2 };
    return { status: "lost", payout: 0 };
  }
  return { status: "lost", payout: 0 };
}

export function rollBauCua(rand: () => number = Math.random): BauCuaPayload {
  const pick = (): BauCuaFace =>
    BAUCUA_FACES[Math.floor(rand() * BAUCUA_FACES.length)]!;
  return { kind: "baucua", faces: [pick(), pick(), pick()] };
}

export function settleBauCua(
  market: string,
  amount: number,
  p: BauCuaPayload,
): SettleResult {
  const count = p.faces.filter((f) => f === market).length;
  if (count <= 0) return { status: "lost", payout: 0 };
  return { status: "won", payout: amount * (1 + count) };
}

export function rollXocDia(rand: () => number = Math.random): XocDiaPayload {
  const coins: XocDiaPayload["coins"] = [
    rand() < 0.5 ? 1 : 0,
    rand() < 0.5 ? 1 : 0,
    rand() < 0.5 ? 1 : 0,
    rand() < 0.5 ? 1 : 0,
  ];
  const red = coins.reduce<number>((s, c) => s + c, 0);
  return { kind: "xocdia", coins, red, even: red % 2 === 0 };
}

export function settleXocDia(
  market: string,
  amount: number,
  p: XocDiaPayload,
): SettleResult {
  if (market === "chan") {
    return p.even
      ? { status: "won", payout: amount * 2 }
      : { status: "lost", payout: 0 };
  }
  if (market === "le") {
    return !p.even
      ? { status: "won", payout: amount * 2 }
      : { status: "lost", payout: 0 };
  }
  if (market === "red4") {
    return p.red === 4
      ? { status: "won", payout: amount * 8 }
      : { status: "lost", payout: 0 };
  }
  if (market === "red0") {
    return p.red === 0
      ? { status: "won", payout: amount * 8 }
      : { status: "lost", payout: 0 };
  }
  return { status: "lost", payout: 0 };
}

export function rollFor(
  game: "taixiu" | "baucua" | "xocdia",
  rand?: () => number,
): GamePayload {
  if (game === "taixiu") return rollTaiXiu(rand);
  if (game === "baucua") return rollBauCua(rand);
  return rollXocDia(rand);
}

export function settleBet(
  game: "taixiu" | "baucua" | "xocdia",
  market: string,
  amount: number,
  payload: GamePayload,
): SettleResult {
  if (game === "taixiu" && payload.kind === "taixiu") {
    return settleTaiXiu(market, amount, payload);
  }
  if (game === "baucua" && payload.kind === "baucua") {
    return settleBauCua(market, amount, payload);
  }
  if (game === "xocdia" && payload.kind === "xocdia") {
    return settleXocDia(market, amount, payload);
  }
  return { status: "lost", payout: 0 };
}

export function phaseAt(
  startedAtMs: number,
  nowMs: number,
  betMs: number,
  lockMs: number,
  resultMs: number,
): { phase: "betting" | "lock" | "result" | "closed"; remainingMs: number } {
  const elapsed = nowMs - startedAtMs;
  if (elapsed < betMs) {
    return { phase: "betting", remainingMs: betMs - elapsed };
  }
  if (elapsed < betMs + lockMs) {
    return { phase: "lock", remainingMs: betMs + lockMs - elapsed };
  }
  if (elapsed < betMs + lockMs + resultMs) {
    return { phase: "result", remainingMs: betMs + lockMs + resultMs - elapsed };
  }
  return { phase: "closed", remainingMs: 0 };
}

export function isLegalMarket(
  game: "taixiu" | "baucua" | "xocdia",
  market: string,
): boolean {
  if (game === "taixiu") {
    return market === "tai" || market === "xiu" || market === "chan" || market === "le";
  }
  if (game === "baucua") {
    return (BAUCUA_FACES as readonly string[]).includes(market);
  }
  return (
    market === "chan" ||
    market === "le" ||
    market === "red4" ||
    market === "red0"
  );
}
