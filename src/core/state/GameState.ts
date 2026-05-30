import type { BrainrotOwnedState, TargetState } from "../types";
import { Balance } from "../config/balance";

/**
 * The entire mutable game state. Designed to be a plain serializable object so
 * it can be saved/loaded and ported. No methods, no class instances.
 */
export interface GameState {
  /** Schema version for future save migrations. */
  version: number;
  gold: number;
  gems: number;
  stage: number;

  /** Current chest/Lucky Block on screen. Null only before first spawn. */
  target: TargetState | null;

  /** Pity tracking for Lucky Block spawns. */
  chestsBrokenSinceLucky: number;
  totalChestsBroken: number;
  luckyBlocksBroken: number;

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
    stage: Balance.startingStage,
    target: null,
    chestsBrokenSinceLucky: 0,
    totalChestsBroken: 0,
    luckyBlocksBroken: 0,
    upgrades: {},
    brainrots: {},
    discoveredItems: [],
    rngState: rngSeed >>> 0,
  };
}
