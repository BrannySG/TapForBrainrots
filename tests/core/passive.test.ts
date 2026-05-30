import { describe, it, expect } from "vitest";
import { makeCore } from "../helpers";

describe("passive damage", () => {
  it("does no damage with zero passive DPS", () => {
    const core = makeCore(8);
    core.debugSpawnChest();
    expect(core.getStats().passiveDps).toBe(0);

    const before = core.getSnapshot().target!.health;
    core.debugFastForward(5);
    expect(core.getSnapshot().target!.health).toBe(before);
  });

  it("passive DPS damages and eventually breaks the target over time", () => {
    const core = makeCore(8);
    core.debugAddGold(1e6);
    // Brainrot Training adds flat passive DPS.
    for (let i = 0; i < 20; i++) core.buyUpgrade("brainrot_training");
    expect(core.getStats().passiveDps).toBeGreaterThan(0);

    core.debugSpawnChest();
    const breaksBefore =
      core.getSnapshot().totalChestsBroken + core.getSnapshot().luckyBlocksBroken;

    core.debugFastForward(30);

    const breaksAfter =
      core.getSnapshot().totalChestsBroken + core.getSnapshot().luckyBlocksBroken;
    expect(breaksAfter).toBeGreaterThan(breaksBefore);
  });
});
