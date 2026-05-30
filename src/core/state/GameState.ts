import type { BrainrotOwnedState, TargetState, WorldId } from "../types";
import { Balance } from "../config/balance";
import { FIRST_WORLD_ID } from "../config/worlds";

/**
 * The entire mutable game state. Designed to be a plain serializable object so
 * it can be saved/loaded and ported. No methods, no class instances.
 */
export interface GameState {
  /** Schema version for future save migrations. */
  version: number;
  gold: number;
  gems: number;

  /** The world the player is currently in. */
  worldId: WorldId;
  /** Active stage in the current world (mirrors `worldStages[worldId]`). */
  stage: number;
  /** Per-world stage progress, so each world keeps its own track. */
  worldStages: Record<WorldId, number>;
  /** Worlds the player has unlocked (the first world is always present). */
  unlockedWorlds: WorldId[];

  /** Current chest/Lucky Block on screen. Null only before first spawn. */
  target: TargetState | null;

  /** Pity tracking for Lucky Block spawns. */
  chestsBrokenSinceLucky: number;
  totalChestsBroken: number;
  luckyBlocksBroken: number;

  /** Seconds remaining before the next target spawns (0 when not waiting). */
  respawnTimer: number;

  /** upgradeId -> owned level. */
  upgrades: Record<string, number>;

  /** brainrotId -> ownership progress. */
  brainrots: Record<string, BrainrotOwnedState>;

  /** Unique discovered chest item ids (background collection). */
  discoveredItems: string[];

  /** Serialized PRNG state. */
  rngState: number;
}

export const SAVE_VERSION = 1;

export function createInitialState(rngSeed: number): GameState {
  return {
    version: SAVE_VERSION,
    gold: Balance.startingGold,
    gems: Balance.startingGems,
    worldId: FIRST_WORLD_ID,
    stage: Balance.startingStage,
    worldStages: { castaway_cove: Balance.startingStage, grasslands: Balance.startingStage },
    unlockedWorlds: [FIRST_WORLD_ID],
    target: null,
    chestsBrokenSinceLucky: 0,
    totalChestsBroken: 0,
    luckyBlocksBroken: 0,
    respawnTimer: 0,
    upgrades: {},
    brainrots: {},
    discoveredItems: [],
    rngState: rngSeed >>> 0,
  };
}
