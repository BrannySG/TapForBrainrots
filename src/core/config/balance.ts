import type { Rarity } from "../types";

/**
 * Central tunables + scaling formulas. Everything a balance designer would
 * touch lives here, never inside system logic.
 */
export const Balance = {
  startingGold: 0,
  startingGems: 0,
  startingStage: 1,

  /** Base tap damage before upgrades. */
  baseTapDamage: 1,

  chest: {
    baseHealth: 10,
    /** Multiplicative health growth per stage. */
    healthGrowth: 1.13,
  },

  lucky: {
    /** Base per-chest chance to spawn a Lucky Block instead of a chest. */
    baseChance: 0.05,
    /** Guaranteed Lucky Block after this many chests without one. */
    pity: 25,
    /** Lucky Block health = chest health at current stage * this. */
    healthMultiplier: 2,
  },

  gold: {
    /** Base sell value at stage 1 for a common item. */
    baseSellValue: 5,
    /** Multiplicative gold growth per stage. */
    sellGrowth: 1.12,
  },
} as const;

/** Chest health for a given stage. */
export function chestHealthForStage(stage: number): number {
  return Math.ceil(
    Balance.chest.baseHealth * Math.pow(Balance.chest.healthGrowth, stage - 1)
  );
}

/** Lucky Block health for a given stage. */
export function luckyHealthForStage(stage: number): number {
  return Math.ceil(chestHealthForStage(stage) * Balance.lucky.healthMultiplier);
}

/** Sell-value multiplier applied per rarity tier. */
export const RARITY_SELL_MULTIPLIER: Record<Rarity, number> = {
  common: 1,
  rare: 9,
  epic: 50,
  legendary: 250,
  mythic: 1200,
};

/** Base sell value (before gold multiplier) for a rarity at a stage. */
export function baseSellValue(stage: number, rarity: Rarity): number {
  const stageScale = Math.pow(Balance.gold.sellGrowth, stage - 1);
  return Math.ceil(
    Balance.gold.baseSellValue * RARITY_SELL_MULTIPLIER[rarity] * stageScale
  );
}
