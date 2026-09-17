export const GAMES = ["taixiu", "baucua", "xocdia"] as const;
export type GameId = (typeof GAMES)[number];

export const PHASES = ["betting", "lock", "result", "closed"] as const;
export type Phase = (typeof PHASES)[number];

/** Live round timings. Short enough to play; long enough to place a bet. */
export const TIMING = {
  betMs: 18_000,
  lockMs: 4_000,
  resultMs: 8_000,
} as const;

export const WELCOME_XU = 100_000;
export const DAILY_XU = 15_000;
export const RELIEF_XU = 50_000;
export const RELIEF_BELOW = 1_000;
export const MIN_BET = 1_000;
export const MAX_BET = 500_000;
export const CHIP_VALUES = [1_000, 5_000, 10_000, 50_000, 100_000] as const;

export const BAUCUA_FACES = [
  "nai",
  "bau",
  "ga",
  "ca",
  "cua",
  "tom",
] as const;
export type BauCuaFace = (typeof BAUCUA_FACES)[number];

export const BAUCUA_LABEL: Record<BauCuaFace, string> = {
  nai: "Nai",
  bau: "Bầu",
  ga: "Gà",
  ca: "Cá",
  cua: "Cua",
  tom: "Tôm",
};

export const GAME_LABEL: Record<GameId, string> = {
  taixiu: "Tài Xỉu",
  baucua: "Bầu Cua",
  xocdia: "Xóc Đĩa",
};
