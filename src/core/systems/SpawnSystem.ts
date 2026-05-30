import type { Rarity, TargetState } from "../types";
import { RARITY_ORDER } from "../types";
import type { GameState } from "../state/GameState";
import type { Rng } from "../rng/Rng";
import {
  Balance,
  bossHealthForStage,
  enemyHealthForStage,
  isBossStage,
  luckyHealthForStage,
} from "../config/balance";
import { lootRarityWeights } from "../config/loot";
import { luckyRewardWeights } from "../config/brainrots";
import { worldEnemies } from "../config/enemies";

function pickRarity(rng: Rng, weights: Record<Rarity, number>): Rarity {
  return rng.weighted(
    RARITY_ORDER,
    RARITY_ORDER.map((r) => weights[r])
  );
}

/**
 * Decides what spawns next (enemy vs Lucky Block) and builds the target.
 * Owns the Lucky Block chance + pity logic; the rolled rarity is what the
 * downstream economy/brainrot systems use, so the on-screen rarity is truthful.
 */
export class SpawnSystem {
  constructor(
    private readonly state: GameState,
    private readonly rng: Rng
  ) {}

  spawnNext(luckyChance: number): { target: TargetState; isLucky: boolean } {
    // Boss stages are clean and focused: a single beefy enemy on a timer, never
    // a Lucky Block. Build it and skip the lucky/pity roll entirely.
    if (isBossStage(this.state.stage)) {
      const target = this.buildBoss();
      this.state.target = target;
      return { target, isLucky: false };
    }

    // First-time runs should always start with a normal enemy; Lucky Blocks are
    // introduced only after at least one target has been broken.
    const isFirstSpawn =
      this.state.enemiesDefeated === 0 && this.state.luckyBlocksBroken === 0;
    const forcedByPity = this.state.killsSinceLucky >= Balance.lucky.pity;
    const isLucky = !isFirstSpawn && (forcedByPity || this.rng.next() < luckyChance);

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
      this.state.killsSinceLucky = 0;
    } else {
      const pool = worldEnemies(this.state.worldId);
      const enemy = this.rng.pick(pool);
      // Rarity is cosmetic for enemies (label colour); roll it so the on-screen
      // tag still varies stage to stage.
      const rarity = pickRarity(this.rng, lootRarityWeights(this.state.stage));
      const max = enemyHealthForStage(this.state.stage);
      target = {
        kind: "enemy",
        rarity,
        name: enemy.name,
        maxHealth: max,
        health: max,
        enemyId: enemy.id,
      };
    }

    this.state.target = target;
    return { target, isLucky };
  }

  /** Build the boss enemy for the current (boss) stage. */
  private buildBoss(): TargetState {
    const pool = worldEnemies(this.state.worldId);
    const enemy = this.rng.pick(pool);
    const max = bossHealthForStage(this.state.stage);
    return {
      kind: "enemy",
      rarity: "legendary",
      name: enemy.name,
      maxHealth: max,
      health: max,
      enemyId: enemy.id,
      isBoss: true,
    };
  }
}
