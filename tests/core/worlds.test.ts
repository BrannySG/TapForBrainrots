import { describe, it, expect } from "vitest";
import { makeCore, breakCurrentTarget } from "../helpers";
import { GRASSLANDS_ITEMS } from "../../src/core/config/loot";
import { WORLDS_BY_ID } from "../../src/core/config/worlds";

const grassIds = new Set(GRASSLANDS_ITEMS.map((i) => i.id));
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

  it("drops Grasslands items while in the Grasslands world", () => {
    const core = makeCore(5);
    while (core.getSnapshot().stage < GRASS_UNLOCK) breakCurrentTarget(core);
    core.switchWorld("grasslands");

    const dropped: string[] = [];
    core.bus.on("itemDropped", (e) => dropped.push(e.id));
    for (let i = 0; i < 30; i++) {
      core.debugSpawnChest();
      breakCurrentTarget(core);
    }

    expect(dropped.length).toBeGreaterThan(0);
    for (const id of dropped) expect(grassIds.has(id)).toBe(true);
  });
});
