import type { Rarity } from "../types";

/** A chest loot item definition. Sell value is derived from rarity + stage. */
export interface ItemDef {
  id: string;
  name: string;
  rarity: Rarity;
}

/** Chest item pool (World 1 / Meme Meadow flavour). */
export const ITEMS: ItemDef[] = [
  { id: "fishing_rod", name: "Fishing Rod", rarity: "common" },
  { id: "rusty_spoon", name: "Rusty Spoon", rarity: "common" },
  { id: "soggy_sock", name: "Soggy Sock", rarity: "common" },
  { id: "bent_fork", name: "Bent Fork", rarity: "common" },
  { id: "golden_toilet_roll", name: "Golden Toilet Roll", rarity: "rare" },
  { id: "meme_mug", name: "Meme Mug", rarity: "rare" },
  { id: "meme_crown", name: "Meme Crown", rarity: "epic" },
  { id: "sigma_medallion", name: "Sigma Medallion", rarity: "legendary" },
  { id: "ancient_brainrot_relic", name: "Ancient Brainrot Relic", rarity: "mythic" },
];

/**
 * Rarity weights for chest loot. Returns a fresh map; higher stages nudge the
 * odds slightly toward better loot (kept gentle for V0).
 */
export function lootRarityWeights(stage: number): Record<Rarity, number> {
  const t = Math.min(stage / 100, 1); // 0..1 ramp over first 100 stages
  return {
    common: 70 - 30 * t,
    rare: 22 + 12 * t,
    epic: 6 + 10 * t,
    legendary: 1.6 + 6 * t,
    mythic: 0.4 + 2 * t,
  };
}
