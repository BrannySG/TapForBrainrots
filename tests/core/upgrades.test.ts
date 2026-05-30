import { describe, it, expect } from "vitest";
import { makeCore } from "../helpers";

describe("upgrades & stats", () => {
  it("buying a tap upgrade spends gold and raises tap damage", () => {
    const core = makeCore(2);
    core.debugAddGold(1000);

    const beforeDmg = core.getStats().tapDamage;
    const cost = core.getUpgradeCost("stronger_taps")!;
    const goldBefore = core.getSnapshot().gold;

    expect(core.buyUpgrade("stronger_taps")).toBe(true);

    expect(core.getSnapshot().gold).toBe(goldBefore - cost);
    expect(core.getStats().tapDamage).toBeGreaterThan(beforeDmg);
    expect(core.getUpgradeLevel("stronger_taps")).toBe(1);
  });

  it("fails to buy without enough gold", () => {
    const core = makeCore(2);
    let failures = 0;
    core.bus.on("upgradeFailed", (e) => {
      if (e.reason === "insufficient-gold") failures++;
    });
    expect(core.buyUpgrade("stronger_taps")).toBe(false);
    expect(failures).toBe(1);
  });

  it("respects max level", () => {
    const core = makeCore(2);
    core.debugAddGold(1e9);
    for (let i = 0; i < 60; i++) core.buyUpgrade("lucky_charm");
    expect(core.getUpgradeLevel("lucky_charm")).toBe(40);

    let maxFailed = false;
    core.bus.on("upgradeFailed", (e) => {
      if (e.reason === "max-level") maxFailed = true;
    });
    expect(core.buyUpgrade("lucky_charm")).toBe(false);
    expect(maxFailed).toBe(true);
  });
});
