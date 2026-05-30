/** What a gold upgrade modifies. Consumed by StatsSystem. */
export type UpgradeKind =
  | "tapDamage"
  | "passiveDamage"
  | "goldMult"
  | "luckyChance";

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  kind: UpgradeKind;
  baseCost: number;
  /** Multiplicative cost growth per owned level. */
  costGrowth: number;
  /** Effect added per level (flat for damage, percent for goldMult/lucky). */
  perLevel: number;
  maxLevel?: number;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: "stronger_taps",
    name: "Stronger Taps",
    description: "+2 tap damage",
    kind: "tapDamage",
    baseCost: 10,
    costGrowth: 1.15,
    perLevel: 2,
  },
  {
    id: "brainrot_training",
    name: "Brainrot Training",
    description: "+1 passive DPS",
    kind: "passiveDamage",
    baseCost: 25,
    costGrowth: 1.18,
    perLevel: 1,
  },
  {
    id: "better_loot_sales",
    name: "Better Loot Sales",
    description: "+5% gold earned",
    kind: "goldMult",
    baseCost: 50,
    costGrowth: 1.2,
    perLevel: 5,
  },
  {
    id: "lucky_charm",
    name: "Lucky Charm",
    description: "+0.5% Lucky Block chance",
    kind: "luckyChance",
    baseCost: 100,
    costGrowth: 1.25,
    perLevel: 0.5,
    maxLevel: 40,
  },
];

export const UPGRADES_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u])
);

/** Cost to purchase the next level given the currently-owned level. */
export function upgradeCost(def: UpgradeDef, currentLevel: number): number {
  return Math.ceil(def.baseCost * Math.pow(def.costGrowth, currentLevel));
}
