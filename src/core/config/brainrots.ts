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

/**
 * Raw roster: id (matches the sprite slug in `src/assets/brainrots/<id>.png`),
 * display name, and rarity. Effects are derived from rarity below so the table
 * stays compact and easy to rebalance. These are placeholder stats - tune later.
 */
const ROSTER: ReadonlyArray<readonly [id: string, name: string, rarity: Rarity]> = [
  // Common
  ["67", "67", "common"],
  ["noobini_pizzanini", "Noobini Pizzanini", "common"],
  ["tim_cheese", "Tim Cheese", "common"],
  ["matteo", "Matteo", "common"],
  ["antonio", "Antonio", "common"],
  ["alessio", "Alessio", "common"],
  ["pipi_kiwi", "Pipi Kiwi", "common"],
  ["pipi_corni", "Pipi Corni", "common"],
  ["pipi_avocado", "Pipi Avocado", "common"],
  ["dul_dul_dul", "Dul Dul Dul", "common"],
  ["brr_brr_patapim", "Brr Brr Patapim", "common"],
  ["gangster_footera", "Gangster Footera", "common"],
  ["bandito_bobritto", "Bandito Bobritto", "common"],
  ["bandito_axolito", "Bandito Axolito", "common"],
  ["salamino_penguino", "Salamino Penguino", "common"],
  ["penguino_cocosino", "Penguino Cocosino", "common"],
  // Rare
  ["cappuccino_assassino", "Cappuccino Assassino", "rare"],
  ["boneca_ambalabu", "Boneca Ambalabu", "rare"],
  ["trippi_troppi", "Trippi Troppi", "rare"],
  ["brr_es_teh_patipum", "Brr es Teh Patipum", "rare"],
  ["carrotini_brainini", "Carrotini Brainini", "rare"],
  ["gattatino_nyanino", "Gattatino Nyanino", "rare"],
  ["frigo_camelo", "Frigo Camelo", "rare"],
  ["rhino_toasterino", "Rhino Toasterino", "rare"],
  ["burbaloni_loliloli", "Burbaloni Loliloli", "rare"],
  ["perochello_lemonchello", "Perochello Lemonchello", "rare"],
  ["piccione_macchina", "Piccione Macchina", "rare"],
  // Epic
  ["chimpanzini_bananini", "Chimpanzini Bananini", "epic"],
  ["brri_brri_bicus_dicus_bombicus", "Brri Brri Bicus Dicus Bombicus", "epic"],
  ["cocofanto_elefanto", "Cocofanto Elefanto", "epic"],
  ["bananita_dolphinita", "Bananita Dolphinita", "epic"],
  ["spioniro_golubiro", "Spioniro Golubiro", "epic"],
  ["ganganzelli_trulala", "Ganganzelli Trulala", "epic"],
  ["agarrini_la_palini", "Agarrini la Palini", "epic"],
  ["chef_crabracadabra", "Chef Crabracadabra", "epic"],
  ["pakrahmatmamat", "Pakrahmatmamat", "epic"],
  // Legendary
  ["lirili_larila", "Lirili Larila", "legendary"],
  ["espresso_signora", "Espresso Signora", "legendary"],
  ["orcalero_orcala", "Orcalero Orcala", "legendary"],
  ["gorillo_watermelondrillo", "Gorillo Watermelondrillo", "legendary"],
  ["dragon_cannelloni", "Dragon Cannelloni", "legendary"],
  // Mythic
  ["graipuss_medussi", "Graipuss Medussi", "mythic"],
  ["extinct_tralalero", "Extinct Tralalero", "mythic"],
  ["sigma_boy", "Sigma Boy", "mythic"],
];

/**
 * Placeholder effect for a brainrot, derived from its rarity with a little
 * variation by its index within the tier so they aren't all identical. Higher
 * rarity = stronger base stats and stronger per-level scaling.
 */
function rosterEffect(rarity: Rarity, i: number): BrainrotEffect {
  switch (rarity) {
    case "common":
      return { passiveDps: 2 + (i % 4), passiveDpsPerLevel: 1 };
    case "rare":
      return i % 2 === 0
        ? { goldMultPct: 8 + (i % 3) * 2, goldMultPctPerLevel: 2 }
        : { passiveDps: 8 + (i % 3) * 2, passiveDpsPerLevel: 3, goldMultPct: 3 };
    case "epic":
      return {
        passiveDps: 22 + (i % 3) * 4,
        passiveDpsPerLevel: 8,
        luckyChancePct: 3 + (i % 2),
        luckyChancePctPerLevel: 1,
      };
    case "legendary":
      return {
        passiveDps: 45 + (i % 3) * 6,
        passiveDpsPerLevel: 18,
        goldMultPct: 20 + (i % 3) * 4,
        goldMultPctPerLevel: 5,
      };
    case "mythic":
      return {
        passiveDps: 90 + (i % 3) * 12,
        passiveDpsPerLevel: 25,
        goldMultPct: 50,
        goldMultPctPerLevel: 10,
      };
  }
}

export const BRAINROTS: BrainrotDef[] = (() => {
  const perRarity: Partial<Record<Rarity, number>> = {};
  return ROSTER.map(([id, name, rarity]) => {
    const i = perRarity[rarity] ?? 0;
    perRarity[rarity] = i + 1;
    return { id, name, rarity, effect: rosterEffect(rarity, i) };
  });
})();

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
