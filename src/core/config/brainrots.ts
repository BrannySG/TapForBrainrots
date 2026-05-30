import type { Rarity } from "../types";

/**
 * Effect a brainrot contributes. Values are the level-1 base plus a per-level
 * increment, so a brainrot at level L contributes `base + perLevel * (L - 1)`.
 */
export interface BrainrotEffect {
  passiveDps?: number;
  passiveDpsPerLevel?: number;
  /** Additive gold multiplier in percent (10 = +10% gold). */
  goldMultPct?: number;
  goldMultPctPerLevel?: number;
  /** Additive Lucky Block chance in percentage points (5 = +5%). */
  luckyChancePct?: number;
  luckyChancePctPerLevel?: number;
}

export interface BrainrotDef {
  id: string;
  name: string;
  rarity: Rarity;
  effect: BrainrotEffect;
}

export const BRAINROTS: BrainrotDef[] = [
  {
    id: "goblin_guy",
    name: "Goblin Guy",
    rarity: "common",
    effect: { passiveDps: 2, passiveDpsPerLevel: 1 },
  },
  {
    id: "skibidi_goon",
    name: "Skibidi Goon",
    rarity: "common",
    effect: { passiveDps: 3, passiveDpsPerLevel: 1 },
  },
  {
    id: "toilet_king",
    name: "Toilet King",
    rarity: "rare",
    effect: { goldMultPct: 10, goldMultPctPerLevel: 2 },
  },
  {
    id: "cappuccino_assassino",
    name: "Cappuccino Assassino",
    rarity: "rare",
    effect: { passiveDps: 8, passiveDpsPerLevel: 3, goldMultPct: 3 },
  },
  {
    id: "radioactive_gremlin",
    name: "Radioactive Gremlin",
    rarity: "epic",
    effect: {
      passiveDps: 25,
      passiveDpsPerLevel: 8,
      luckyChancePct: 5,
      luckyChancePctPerLevel: 1,
    },
  },
  {
    id: "tung_tung_sahur",
    name: "Tung Tung Sahur",
    rarity: "legendary",
    effect: {
      passiveDps: 50,
      passiveDpsPerLevel: 18,
      goldMultPct: 25,
      goldMultPctPerLevel: 5,
    },
  },
  {
    id: "mythic_sigma_beast",
    name: "Mythic Sigma Beast",
    rarity: "mythic",
    effect: {
      passiveDps: 100,
      passiveDpsPerLevel: 25,
      goldMultPct: 50,
      goldMultPctPerLevel: 10,
    },
  },
];

export const BRAINROTS_BY_ID: Record<string, BrainrotDef> = Object.fromEntries(
  BRAINROTS.map((b) => [b.id, b])
);

/**
 * Cumulative duplicate copies required to *reach* a given level.
 * Level 1 = first copy (0 banked). Mirrors the GDD example table.
 */
const COPIES_TO_REACH_LEVEL = [0, 0, 1, 2, 3, 5, 8, 12, 18, 26];

export function copiesToReachLevel(level: number): number {
  if (level <= 1) return 0;
  if (level < COPIES_TO_REACH_LEVEL.length) return COPIES_TO_REACH_LEVEL[level];
  // Beyond the table, keep growing roughly linearly.
  return COPIES_TO_REACH_LEVEL[COPIES_TO_REACH_LEVEL.length - 1] + (level - 9) * 10;
}

/** Copies needed to go from `level` to `level + 1`. */
export function copiesForNextLevel(level: number): number {
  return copiesToReachLevel(level + 1) - copiesToReachLevel(level);
}

/**
 * Reward rarity weights when a Lucky Block is broken. Higher stages slightly
 * improve the odds of a better brainrot.
 */
export function luckyRewardWeights(stage: number): Record<Rarity, number> {
  const t = Math.min(stage / 100, 1);
  return {
    common: 60 - 25 * t,
    rare: 27 + 8 * t,
    epic: 9 + 9 * t,
    legendary: 3 + 5 * t,
    mythic: 1 + 3 * t,
  };
}
