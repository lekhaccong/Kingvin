import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  phaseAt,
  rollTaiXiu,
  settleBauCua,
  settleTaiXiu,
  settleXocDia,
} from "./rules.ts";

describe("phaseAt", () => {
  it("moves betting → lock → result → closed on the clock", () => {
    const t0 = 1_000_000;
    assert.equal(phaseAt(t0, t0 + 100, 18_000, 4_000, 8_000).phase, "betting");
    assert.equal(phaseAt(t0, t0 + 18_000, 18_000, 4_000, 8_000).phase, "lock");
    assert.equal(phaseAt(t0, t0 + 22_000, 18_000, 4_000, 8_000).phase, "result");
    assert.equal(phaseAt(t0, t0 + 30_000, 18_000, 4_000, 8_000).phase, "closed");
  });

  it("never returns negative remaining time", () => {
    const r = phaseAt(0, 99_999, 18_000, 4_000, 8_000);
    assert.equal(r.remainingMs, 0);
    assert.equal(r.phase, "closed");
  });
});

describe("taixiu settlement", () => {
  it("pays 1:1 on tài / xỉu including triples", () => {
    const tai = {
      kind: "taixiu" as const,
      d1: 5,
      d2: 6,
      d3: 4,
      sum: 15,
      triple: false,
      side: "tai" as const,
      even: false,
    };
    assert.deepEqual(settleTaiXiu("tai", 1000, tai), {
      status: "won",
      payout: 2000,
    });
    assert.deepEqual(settleTaiXiu("xiu", 1000, tai), {
      status: "lost",
      payout: 0,
    });
    const triple = {
      kind: "taixiu" as const,
      d1: 3,
      d2: 3,
      d3: 3,
      sum: 9,
      triple: true,
      side: "xiu" as const,
      even: false,
    };
    assert.deepEqual(settleTaiXiu("xiu", 5000, triple), {
      status: "won",
      payout: 10000,
    });
  });

  it("rolls stay in 1–6 and 1000 rolls always close", () => {
    let seq = 0;
    const rand = () => {
      seq += 1;
      return (seq % 1000) / 1000;
    };
    for (let i = 0; i < 1000; i++) {
      const r = rollTaiXiu(rand);
      assert.ok(r.d1 >= 1 && r.d1 <= 6);
      assert.equal(r.sum, r.d1 + r.d2 + r.d3);
      assert.equal(r.side, r.sum >= 11 ? "tai" : "xiu");
      const a = settleTaiXiu("tai", 1000, r);
      const b = settleTaiXiu("xiu", 1000, r);
      assert.equal(a.status === "won", r.side === "tai");
      assert.equal(b.status === "won", r.side === "xiu");
    }
  });
});

describe("baucua / xocdia settlement", () => {
  it("pays 1+count on bầu cua matches", () => {
    const p = {
      kind: "baucua" as const,
      faces: ["cua", "cua", "nai"] as ["cua", "cua", "nai"],
    };
    assert.deepEqual(settleBauCua("cua", 1000, p), {
      status: "won",
      payout: 3000,
    });
    assert.deepEqual(settleBauCua("tom", 1000, p), {
      status: "lost",
      payout: 0,
    });
  });

  it("pays even/odd, 4x on mixed colors and 16x on four of a color", () => {
    const four = {
      kind: "xocdia" as const,
      coins: [1, 1, 1, 1] as [1, 1, 1, 1],
      red: 4,
      even: true,
    };
    assert.deepEqual(settleXocDia("chan", 1000, four), {
      status: "won",
      payout: 2000,
    });
    assert.deepEqual(settleXocDia("red4", 1000, four), {
      status: "won",
      payout: 16000,
    });
    assert.deepEqual(settleXocDia("le", 1000, four), {
      status: "lost",
      payout: 0,
    });
    const three = { ...four, coins: [1, 1, 1, 0] as [1, 1, 1, 0], red: 3, even: false };
    assert.deepEqual(settleXocDia("red3", 1000, three), {
      status: "won",
      payout: 4000,
    });
    const one = { ...four, coins: [1, 0, 0, 0] as [1, 0, 0, 0], red: 1, even: false };
    assert.deepEqual(settleXocDia("red1", 1000, one), {
      status: "won",
      payout: 4000,
    });
  });
});
