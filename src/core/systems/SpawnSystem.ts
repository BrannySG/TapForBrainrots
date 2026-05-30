import type { Rarity, TargetState } from "../types";
import { RARITY_ORDER } from "../types";
import type { GameState } from "../state/GameState";
import type { Rng } from "../rng/Rng";
import { Balance, chestHealthForStage, luckyHealthForStage } from "../config/balance";
import { lootRarityWeights } from "../config/loot";
import { luckyRewardWeights } from "../config/brainrots";

function pickRarity(rng: Rng, weights: Record<Rarity, number>): Rarity {
  return rng.weighted(
    RARITY_ORDER,
    RARITY_ORDER.map((r) => weights[r])
  );
}

/**
 * Decides what spawns next (chest vs Lucky Block) and builds the target.
 * Owns the Lucky Block chance + pity logic; the rolled rarity is what the
 * downstream economy/brainrot systems use, so the on-screen rarity is truthful.
 */
export class SpawnSystem {
  constructor(
    private readonly state: GameState,
    private readonly rng: Rng
  ) {}

  spawnNext(luckyChance: number): { target: TargetState; isLucky: boolean } {
    const forcedByPity =
      this.state.chestsBrokenSinceLucky >= Balance.lucky.pity;
    const isLucky = forcedByPity || this.rng.next() < luckyChance;

    let target: TargetState;
    if (isLucky) {
      const rarity = pickRarity(this.rng, luckyRewardWeights(this.state.stage));
      const max = luckyHealthForStage(this.state.stage);
      target = {
        kind: "lucky",
        rarity,
        name: "Lucky Block",
        maxHealth: max,
        health: max,
      };
      this.state.chestsBrokenSinceLucky = 0;
    } else {
      const rarity = pickRarity(this.rng, lootRarityWeights(this.state.stage));
      const max = chestHealthForStage(this.state.stage);
      target = {
        kind: "chest",
        rarity,
        name: "Chest",
        maxHealth: max,
        health: max,
      };
    }

    this.state.target = target;
    return { target, isLucky };
  }
}
