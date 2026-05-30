import type { Rarity } from "../types";

/**
 * A chest loot item definition. `value` is the stage-1 base sell value; the
 * final price scales with stage + gold multiplier (see `itemSellValue`). `id`
 * matches the icon asset filename so presentation can resolve the sprite.
 */
export interface ItemDef {
  id: string;
  name: string;
  rarity: Rarity;
  value: number;
}

/** Chest item pool (World 1 / Castaway Cove nautical flavour). */
export const CASTAWAY_ITEMS: ItemDef[] = [
  { id: "old_boot", name: "Old Boot", rarity: "common", value: 5 },
  { id: "tin_can", name: "Tin Can", rarity: "common", value: 6 },
  { id: "driftwood", name: "Driftwood", rarity: "common", value: 7 },
  { id: "fish_hook", name: "Fish Hook", rarity: "common", value: 8 },
  { id: "rope_coil", name: "Rope Coil", rarity: "common", value: 9 },
  { id: "seashell", name: "Seashell", rarity: "common", value: 10 },
  { id: "bait_bucket", name: "Bait Bucket", rarity: "rare", value: 45 },
  { id: "fishing_rod", name: "Fishing Rod", rarity: "rare", value: 55 },
  { id: "lantern", name: "Lantern", rarity: "rare", value: 65 },
  { id: "coral", name: "Coral", rarity: "rare", value: 70 },
  { id: "message_in_bottle", name: "Message in a Bottle", rarity: "rare", value: 80 },
  { id: "compass", name: "Compass", rarity: "epic", value: 260 },
  { id: "spyglass", name: "Spyglass", rarity: "epic", value: 300 },
  { id: "pirate_hat", name: "Pirate Hat", rarity: "epic", value: 360 },
  { id: "goblet", name: "Golden Goblet", rarity: "epic", value: 420 },
  { id: "cutlass", name: "Cutlass", rarity: "legendary", value: 1300 },
  { id: "pirate_hook", name: "Captain's Hook", rarity: "legendary", value: 1700 },
  { id: "ornate_key", name: "Ornate Key", rarity: "legendary", value: 2100 },
  { id: "pearl", name: "Black Pearl", rarity: "mythic", value: 6500 },
  { id: "treasure_map", name: "Treasure Map", rarity: "mythic", value: 9000 },
];

/**
 * Chest item pool (World 2 / Grasslands nature flavour). Mirrors the Castaway
 * rarity spread (6 common / 5 rare / 4 epic / 3 legendary / 2 mythic) and value
 * curve so the two worlds are balance-equivalent.
 */
export const GRASSLANDS_ITEMS: ItemDef[] = [
  { id: "grass_tuft", name: "Grass Tuft", rarity: "common", value: 5 },
  { id: "pebble", name: "Pebble", rarity: "common", value: 6 },
  { id: "twig_bundle", name: "Twig Bundle", rarity: "common", value: 7 },
  { id: "acorn", name: "Acorn", rarity: "common", value: 8 },
  { id: "fern", name: "Fern Frond", rarity: "common", value: 9 },
  { id: "snail_shell", name: "Snail Shell", rarity: "common", value: 10 },
  { id: "berries", name: "Wild Berries", rarity: "rare", value: 45 },
  { id: "clover", name: "Four-Leaf Clover", rarity: "rare", value: 55 },
  { id: "herb_pouch", name: "Herb Pouch", rarity: "rare", value: 65 },
  { id: "cattails", name: "Cattails", rarity: "rare", value: 70 },
  { id: "honeycomb", name: "Honeycomb", rarity: "rare", value: 80 },
  { id: "mushroom", name: "Toadstool", rarity: "epic", value: 260 },
  { id: "firefly_jar", name: "Firefly Jar", rarity: "epic", value: 300 },
  { id: "wooden_flute", name: "Wooden Flute", rarity: "epic", value: 360 },
  { id: "antler_amulet", name: "Antler Amulet", rarity: "epic", value: 420 },
  { id: "wooden_medallion", name: "Wooden Medallion", rarity: "legendary", value: 1300 },
  { id: "mossy_key", name: "Mossy Key", rarity: "legendary", value: 1700 },
  { id: "emerald_staff", name: "Emerald Staff", rarity: "legendary", value: 2100 },
  { id: "clover_emblem", name: "Clover Emblem", rarity: "mythic", value: 6500 },
  { id: "emerald_scepter", name: "Emerald Scepter", rarity: "mythic", value: 9000 },
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
