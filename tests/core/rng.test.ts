import { describe, it, expect } from "vitest";
import { Rng } from "../../src/core/rng/Rng";

describe("Rng", () => {
  it("is deterministic for a given seed", () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("produces values in [0, 1)", () => {
    const r = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("restores state for reproducible saves", () => {
    const r = new Rng(123);
    r.next();
    r.next();
    const saved = r.getState();
    const expected = [r.next(), r.next(), r.next()];

    const restored = new Rng();
    restored.setState(saved);
    expect([restored.next(), restored.next(), restored.next()]).toEqual(expected);
  });

  it("respects weighting (heavily weighted option dominates)", () => {
    const r = new Rng(99);
    let a = 0;
    for (let i = 0; i < 2000; i++) {
      if (r.weighted(["a", "b"], [95, 5]) === "a") a++;
    }
    expect(a).toBeGreaterThan(1700);
  });
});
