import { describe, it, expect } from "vitest";
import { makeCore, breakCurrentTarget } from "../helpers";
import { Balance, goldForKill } from "../../src/core/config/balance";

describe("core loop", () => {
  it("defeating an enemy awards stage-scaled gold and counts toward the stage", () => {
    const core = makeCore(5);
    core.debugSpawnEnemy();

    const before = core.getSnapshot();
    expect(before.target?.kind).toBe("enemy");

    const expectedGold = goldForKill(before.stage, before.stats.goldMultiplier);

    breakCurrentTarget(core);

    const after = core.getSnapshot();
    expect(after.gold).toBe(before.gold + expectedGold);
    expect(after.enemiesDefeated).toBe(before.enemiesDefeated + 1);
    // A single kill no longer advances; it banks one kill toward the objective.
    expect(after.stage).toBe(before.stage);
    expect(after.stageKills).toBe(before.stageKills + 1);
  });

  it("advances one stage after clearing the kills-per-stage objective", () => {
    const core = makeCore(5);
    const required = core.getSnapshot().stageRequired;
    const startStage = core.getSnapshot().stage;

    for (let i = 0; i < required; i++) {
      core.debugSpawnEnemy();
      breakCurrentTarget(core);
    }

    const after = core.getSnapshot();
    expect(after.stage).toBe(startStage + 1);
    expect(after.stageKills).toBe(0);
  });

  it("emits a killReward (and no item drops) when an enemy dies", () => {
    const core = makeCore(7);
    core.debugSpawnEnemy();

    let reward = 0;
    let itemDrops = 0;
    const offReward = core.bus.on("killReward", (e) => {
      reward = e.gold;
    });
    const offItems = core.bus.on("itemDropped", () => {
      itemDrops += 1;
    });

    const goldBefore = core.getSnapshot().gold;
    breakCurrentTarget(core);
    const goldAfter = core.getSnapshot().gold;
    offReward();
    offItems();

    expect(itemDrops).toBe(0);
    expect(reward).toBeGreaterThan(0);
    expect(goldAfter - goldBefore).toBe(reward);
  });

  it("gold only increases from kills (no spending)", () => {
    const core = makeCore(11);
    let lastGold = core.getSnapshot().gold;
    for (let i = 0; i < 40; i++) {
      breakCurrentTarget(core);
      const gold = core.getSnapshot().gold;
      expect(gold).toBeGreaterThanOrEqual(lastGold);
      lastGold = gold;
    }
  });

  it("waits for the respawn delay before spawning the next target", () => {
    const core = makeCore(9);
    core.debugSpawnEnemy();
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
