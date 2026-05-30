import { describe, it, expect } from "vitest";
import { makeCore, breakCurrentTarget } from "../helpers";
import { WORLDS_BY_ID } from "../../src/core/config/worlds";

const GRASS_UNLOCK = WORLDS_BY_ID.grasslands.unlock!.stage;

describe("worlds", () => {
  it("starts in Castaway Cove with only the first world unlocked", () => {
    const snap = makeCore(1).getSnapshot();
    expect(snap.worldId).toBe("castaway_cove");
    expect(snap.unlockedWorlds).toEqual(["castaway_cove"]);
  });

  it("cannot travel to a locked world", () => {
    const core = makeCore(2);
    expect(core.switchWorld("grasslands")).toBe(false);
    expect(core.getSnapshot().worldId).toBe("castaway_cove");
  });

  it("unlocks Grasslands at the milestone stage in World 1", () => {
    const core = makeCore(3);
    let unlocked: string | null = null;
    core.bus.on("worldUnlocked", (e) => (unlocked = e.worldId));

    while (core.getSnapshot().stage < GRASS_UNLOCK) breakCurrentTarget(core);

    expect(unlocked).toBe("grasslands");
    expect(core.getSnapshot().unlockedWorlds).toContain("grasslands");
  });

  it("keeps an independent stage track per world after travelling", () => {
    const core = makeCore(4);
    while (core.getSnapshot().stage < GRASS_UNLOCK) breakCurrentTarget(core);
    const coveStage = core.getSnapshot().stage;

    expect(core.switchWorld("grasslands")).toBe(true);
    const snap = core.getSnapshot();
    expect(snap.worldId).toBe("grasslands");
    expect(snap.stage).toBe(1); // fresh track for the new world

    // Travelling back restores the Cove's progress.
    expect(core.switchWorld("castaway_cove")).toBe(true);
    expect(core.getSnapshot().stage).toBe(coveStage);
  });

  it("keeps awarding kill gold after travelling to Grasslands", () => {
    const core = makeCore(5);
    while (core.getSnapshot().stage < GRASS_UNLOCK) breakCurrentTarget(core);
    core.switchWorld("grasslands");
    expect(core.getSnapshot().worldId).toBe("grasslands");

    let rewards = 0;
    core.bus.on("killReward", () => rewards++);

    const goldBefore = core.getSnapshot().gold;
    for (let i = 0; i < 10; i++) {
      core.debugSpawnEnemy();
      breakCurrentTarget(core);
    }

    expect(rewards).toBeGreaterThan(0);
    expect(core.getSnapshot().gold).toBeGreaterThan(goldBefore);
  });
});
