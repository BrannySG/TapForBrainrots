import { describe, it, expect } from "vitest";
import { makeCore, breakCurrentTarget } from "../helpers";
import { Balance } from "../../src/core/config/balance";

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

  it("drops 1-2 items per chest, each summing to the gold gained", () => {
    const core = makeCore(7);

    for (let i = 0; i < 30; i++) {
      core.debugSpawnChest();

      const drops: { id: string; sellValue: number; count: number }[] = [];
      const off = core.bus.on("itemDropped", (e) => {
        drops.push({ id: e.id, sellValue: e.sellValue, count: e.count });
      });

      const goldBefore = core.getSnapshot().gold;
      breakCurrentTarget(core);
      const goldAfter = core.getSnapshot().gold;
      off();

      // 1-2 items, each carrying a non-empty id.
      expect(drops.length).toBeGreaterThanOrEqual(1);
      expect(drops.length).toBeLessThanOrEqual(2);
      for (const d of drops) {
        expect(d.id).not.toBe("");
        expect(d.count).toBe(drops.length);
      }

      // Gold gained equals the summed sell values.
      const summed = drops.reduce((acc, d) => acc + d.sellValue, 0);
      expect(goldAfter - goldBefore).toBe(summed);
    }
  });

  it("waits for the respawn delay before spawning the next target", () => {
    const core = makeCore(9);
    core.debugSpawnChest();
    core.debugKillTarget();

    // Immediately after a break there is no target (cosmetic gap).
    expect(core.getSnapshot().target).toBeNull();

    // Still empty partway through the delay.
    core.update(Balance.respawn.delay * 0.5);
    expect(core.getSnapshot().target).toBeNull();

    // A new target appears once the delay elapses.
    core.update(Balance.respawn.delay);
    expect(core.getSnapshot().target).not.toBeNull();
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
