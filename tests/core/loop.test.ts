import { describe, it, expect } from "vitest";
import { makeCore, breakCurrentTarget } from "../helpers";

describe("core loop", () => {
  it("breaking a chest sells loot for gold and advances the stage", () => {
    const core = makeCore(5);
    core.debugSpawnChest();

    const before = core.getSnapshot();
    expect(before.target?.kind).toBe("chest");

    breakCurrentTarget(core);

    const after = core.getSnapshot();
    expect(after.gold).toBeGreaterThan(before.gold);
    expect(after.totalChestsBroken).toBe(before.totalChestsBroken + 1);
    expect(after.stage).toBe(before.stage + 1);
    expect(after.discoveredItems).toBeGreaterThanOrEqual(1);
  });

  it("gold only increases from selling loot (no spending)", () => {
    const core = makeCore(11);
    let lastGold = core.getSnapshot().gold;
    for (let i = 0; i < 40; i++) {
      breakCurrentTarget(core);
      const gold = core.getSnapshot().gold;
      expect(gold).toBeGreaterThanOrEqual(lastGold);
      lastGold = gold;
    }
  });

  it("always has a live target after a break", () => {
    const core = makeCore(3);
    for (let i = 0; i < 10; i++) {
      breakCurrentTarget(core);
      const t = core.getSnapshot().target;
      expect(t).not.toBeNull();
      expect(t!.health).toBe(t!.maxHealth);
    }
  });
});
