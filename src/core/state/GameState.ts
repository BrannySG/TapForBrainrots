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

  /** Current enemy/Lucky Block on screen. Null only before first spawn. */
  target: TargetState | null;

  /** Pity tracking for Lucky Block spawns. */
  killsSinceLucky: number;
  enemiesDefeated: number;
  luckyBlocksBroken: number;

  /** Kills banked toward clearing the current stage (resets on stage change). */
  stageKills: number;
  /** When true, clearing a stage auto-advances; when false, the player farms. */
  autoProgress: boolean;
  /** Seconds left on the active boss DPS check (0 when no boss is live). */
  bossTimer: number;
  /** The boss stage the player last failed (for Retry Boss); null when none. */
  failedBossStage: number | null;

  /** Seconds remaining before the next target spawns (0 when not waiting). */
  respawnTimer: number;

  /**
   * True while a Lucky Block reward is being revealed. The sim is paused (no
   * passive damage, no respawn) until the reveal is resolved, so the summon
   * takeover can play uninterrupted.
   */
  revealPending: boolean;

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
    killsSinceLucky: 0,
    enemiesDefeated: 0,
    luckyBlocksBroken: 0,
    stageKills: 0,
    autoProgress: true,
    bossTimer: 0,
    failedBossStage: null,
    respawnTimer: 0,
    revealPending: false,
    upgrades: {},
    brainrots: {},
    discoveredItems: [],
    rngState: rngSeed >>> 0,
  };
}
