/**
 * Shared domain types for the game core.
 *
 * This module (and everything under `src/core`) must remain free of any
 * rendering or DOM dependencies so it stays portable (e.g. to a Unity C#
 * port) and trivially unit-testable.
 */

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export const RARITY_ORDER: Rarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

export type TargetKind = "enemy" | "lucky";

/** Identifier for a themed world / loot zone. */
export type WorldId = "castaway_cove" | "grasslands";

/** The thing currently on screen being attacked. */
export interface TargetState {
  kind: TargetKind;
  rarity: Rarity;
  name: string;
  maxHealth: number;
  health: number;
  /** For enemies: which enemy def is on screen (drives the sprite). */
  enemyId?: string;
  /** True when this enemy is a boss (timed DPS check, beefier + richer). */
  isBoss?: boolean;
}

/** Per-brainrot ownership progress. */
export interface BrainrotOwnedState {
  level: number;
  /** Copies banked toward the next level. */
  copies: number;
}

/** Derived combat/economy stats, recomputed from upgrades + brainrots. */
export interface DerivedStats {
  tapDamage: number;
  passiveDps: number;
  goldMultiplier: number;
  /** 0..1 chance for a Lucky Block to replace the next chest. */
  luckyChance: number;
}
