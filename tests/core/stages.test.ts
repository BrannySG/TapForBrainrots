import { describe, it, expect } from "vitest";
import { makeCore, breakCurrentTarget } from "../helpers";
import { Balance } from "../../src/core/config/balance";

/** Advance to the first boss stage (stage 5) with auto-progress on. */
function reachFirstBoss(core: ReturnType<typeof makeCore>): void {
  while (!core.getSnapshot().isBossStage) {
    core.debugSpawnEnemy();
    breakCurrentTarget(core);
  }
}

describe("stage progression", () => {
  it("requires killsPerStage kills to clear a normal stage", () => {
    const core = makeCore(1);
    const required = core.getSnapshot().stageRequired;
    expect(required).toBe(Balance.stage.killsPerStage);

    // One short of the objective: still on the same stage.
    for (let i = 0; i < required - 1; i++) {
      core.debugSpawnEnemy();
      breakCurrentTarget(core);
    }
    expect(core.getSnapshot().stage).toBe(1);

    core.debugSpawnEnemy();
    breakCurrentTarget(core);
    expect(core.getSnapshot().stage).toBe(2);
  });

  it("makes every 5th stage a boss with a timer and no lucky block", () => {
    const core = makeCore(2);
    reachFirstBoss(core);

    const snap = core.getSnapshot();
    expect(snap.stage % Balance.stage.bossEvery).toBe(0);
    expect(snap.isBossStage).toBe(true);
    expect(snap.target?.isBoss).toBe(true);
    expect(snap.target?.kind).toBe("enemy");
    expect(snap.stageRequired).toBe(1);
    expect(snap.bossTimer).toBeGreaterThan(0);
  });

  it("advances when the boss is defeated before the timer expires", () => {
    const core = makeCore(3);
    reachFirstBoss(core);
    const bossStage = core.getSnapshot().stage;

    let defeated = 0;
    core.bus.on("bossDefeated", () => defeated++);

    breakCurrentTarget(core);

    expect(defeated).toBe(1);
    expect(core.getSnapshot().stage).toBe(bossStage + 1);
    expect(core.getSnapshot().failedBossStage).toBeNull();
  });

  it("drops back a stage and disables auto-progress when the boss timer expires", () => {
    const core = makeCore(4);
    reachFirstBoss(core);
    const bossStage = core.getSnapshot().stage;

    let failed = 0;
    core.bus.on("bossFailed", () => failed++);

    // Let the whole boss timer elapse without dealing damage.
    core.debugFastForward(Balance.stage.bossTimer + 1);

    const snap = core.getSnapshot();
    expect(failed).toBe(1);
    expect(snap.stage).toBe(bossStage - 1);
    expect(snap.autoProgress).toBe(false);
    expect(snap.failedBossStage).toBe(bossStage);
  });

  it("re-enters the failed boss on retryBoss with a fresh timer", () => {
    const core = makeCore(5);
    reachFirstBoss(core);
    const bossStage = core.getSnapshot().stage;
    core.debugFastForward(Balance.stage.bossTimer + 1);
    expect(core.getSnapshot().stage).toBe(bossStage - 1);

    expect(core.retryBoss()).toBe(true);
    const snap = core.getSnapshot();
    expect(snap.stage).toBe(bossStage);
    expect(snap.target?.isBoss).toBe(true);
    expect(snap.bossTimer).toBe(Balance.stage.bossTimer);
  });

  it("does not auto-advance a cleared normal stage when auto-progress is off", () => {
    const core = makeCore(6);
    core.setAutoProgress(false);
    const required = core.getSnapshot().stageRequired;

    for (let i = 0; i < required + 3; i++) {
      core.debugSpawnEnemy();
      breakCurrentTarget(core);
    }

    expect(core.getSnapshot().stage).toBe(1);
    // Flipping auto-progress back on clears the banked stage immediately.
    core.setAutoProgress(true);
    expect(core.getSnapshot().stage).toBe(2);
  });

  it("counts a lucky block as a stage kill", () => {
    const core = makeCore(7);
    const before = core.getSnapshot().stageKills;

    core.debugSpawnLucky();
    breakCurrentTarget(core);

    expect(core.getSnapshot().stageKills).toBe(before + 1);
  });
});
