import { describe, it, expect } from "vitest";
import { makeCore, breakCurrentTarget } from "../helpers";

describe("lucky blocks & brainrots", () => {
  it("starts a fresh run with an enemy, not a lucky block", () => {
    // Seed 7 would roll a lucky spawn on the first RNG check without the
    // first-spawn guard, so this catches regressions deterministically.
    const core = makeCore(7);
    expect(core.getSnapshot().target?.kind).toBe("enemy");
  });

  it("never exceeds the pity threshold without a lucky block", () => {
    const core = makeCore(17);
    const pity = core.pityThreshold;
    let maxSinceLucky = 0;

    for (let i = 0; i < 300; i++) {
      breakCurrentTarget(core);
      maxSinceLucky = Math.max(
        maxSinceLucky,
        core.getSnapshot().killsSinceLucky
      );
    }

    // Pity can briefly sit at the threshold when the forced spawn lands on a
    // boss stage (Lucky Blocks never replace a boss), so allow equality.
    expect(maxSinceLucky).toBeLessThanOrEqual(pity);
    expect(core.getSnapshot().luckyBlocksBroken).toBeGreaterThan(0);
  });

  it("breaking a lucky block grants a brainrot", () => {
    const core = makeCore(23);
    let gained = 0;
    core.bus.on("brainrotGained", () => gained++);

    core.debugSpawnLucky();
    breakCurrentTarget(core);

    expect(gained).toBe(1);
    expect(core.getSnapshot().ownedBrainrots).toBe(1);
    expect(core.getSnapshot().luckyBlocksBroken).toBe(1);
  });

  it("pauses the sim during the reveal and resumes on resolve", () => {
    const core = makeCore(23);

    core.debugSpawnLucky();
    core.debugKillTarget();

    // Reward is granted immediately, but the sim is paused for the reveal.
    const afterBreak = core.getSnapshot();
    expect(afterBreak.ownedBrainrots).toBe(1);
    expect(afterBreak.revealPending).toBe(true);
    expect(afterBreak.target).toBeNull();

    // While paused, advancing time must not spawn the next target.
    core.debugFastForward(5);
    expect(core.getSnapshot().target).toBeNull();
    expect(core.getSnapshot().revealPending).toBe(true);

    // Resolving the reveal unpauses and lets the next target spawn.
    core.resolveReveal();
    expect(core.getSnapshot().revealPending).toBe(false);

    let spawnedAfterResolve = false;
    core.bus.on("targetSpawned", () => {
      spawnedAfterResolve = true;
    });
    core.debugFastForward(5);
    expect(spawnedAfterResolve).toBe(true);
  });

  it("duplicate brainrots bank copies and eventually level up", () => {
    const core = makeCore(31);
    // Force the same brainrot repeatedly by reusing the seeded selection.
    let firstId = "";
    let leveledUp = false;
    core.bus.on("brainrotGained", (e) => {
      if (!firstId) firstId = e.id;
      if (e.id === firstId && e.level > 1) leveledUp = true;
    });

    for (let i = 0; i < 60; i++) {
      core.debugSpawnLucky();
      breakCurrentTarget(core);
    }

    expect(leveledUp).toBe(true);
  });
});
