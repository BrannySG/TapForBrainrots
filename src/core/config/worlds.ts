import type { WorldId } from "../types";
import type { ItemDef } from "./loot";
import { CASTAWAY_ITEMS, GRASSLANDS_ITEMS } from "./loot";

/**
 * A themed world / loot zone. Each world has its own chest item pool and an
 * independent stage track. Worlds unlock by reaching a milestone stage in a
 * prerequisite world (see `unlock`).
 */
export interface WorldDef {
  id: WorldId;
  name: string;
  /** Short flavour label shown in the world picker. */
  theme: string;
  items: ItemDef[];
  /**
   * Unlock requirement. Omitted for the starting world (always unlocked).
   * `afterWorld` must reach stage `stage` before this world becomes available.
   */
  unlock?: { afterWorld: WorldId; stage: number };
}

export const WORLDS: WorldDef[] = [
  {
    id: "castaway_cove",
    name: "Castaway Cove",
    theme: "Nautical / pirate beach",
    items: CASTAWAY_ITEMS,
  },
  {
    id: "grasslands",
    name: "Grasslands",
    theme: "Verdant meadows & woods",
    items: GRASSLANDS_ITEMS,
    unlock: { afterWorld: "castaway_cove", stage: 50 },
  },
];

export const WORLDS_BY_ID: Record<WorldId, WorldDef> = Object.fromEntries(
  WORLDS.map((w) => [w.id, w])
) as Record<WorldId, WorldDef>;

/** The world the player starts in (always unlocked). */
export const FIRST_WORLD_ID: WorldId = WORLDS[0].id;

/** Chest item pool for a given world. */
export function worldItems(id: WorldId): ItemDef[] {
  return WORLDS_BY_ID[id].items;
}
