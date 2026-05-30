import type { Rarity, WorldId } from "../types";

/**
 * A defeatable enemy. `id` matches the sprite folder slug in
 * `src/assets/enemies/<id>/`. Rarity is currently cosmetic (drives the on-screen
 * label colour); kill gold is stage-scaled, not rarity-scaled (see balance).
 */
export interface EnemyDef {
  id: string;
  name: string;
  rarity: Rarity;
}

export const ENEMIES: EnemyDef[] = [
  { id: "skibidi_slime", name: "Skibidi Slime", rarity: "common" },
];

export const ENEMIES_BY_ID: Record<string, EnemyDef> = Object.fromEntries(
  ENEMIES.map((e) => [e.id, e])
);

/**
 * Enemies available in a given world. Only the test slime exists for now, so
 * every world uses the same pool; this keeps a per-world seam for later.
 */
export function worldEnemies(_world: WorldId): EnemyDef[] {
  return ENEMIES;
}
