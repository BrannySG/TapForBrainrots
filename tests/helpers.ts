import { GameCore } from "../src/core/GameCore";

/** Create a core with a fixed seed and its first target spawned. */
export function makeCore(seed = 1): GameCore {
  const core = new GameCore({ seed });
  core.start();
  return core;
}

/** Total targets destroyed so far (enemies + lucky blocks). */
export function totalBreaks(core: GameCore): number {
  const s = core.getSnapshot();
  return s.enemiesDefeated + s.luckyBlocksBroken;
}

/**
 * Destroy the current target deterministically. Uses the debug kill so it is
 * independent of tap damage vs. exponential health scaling, then skips the
 * cosmetic respawn gap so a fresh target is immediately available.
 */
export function breakCurrentTarget(core: GameCore): void {
  const before = totalBreaks(core);
  core.debugKillTarget();
  if (totalBreaks(core) === before) {
    throw new Error("target did not break");
  }
  core.debugAdvanceRespawn();
}
