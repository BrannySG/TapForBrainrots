import type { Rarity } from "../types";
import type { GameState } from "../state/GameState";
import type { Rng } from "../rng/Rng";
import type { EventBus } from "../events/EventBus";
import {
  BRAINROTS,
  BRAINROTS_BY_ID,
  copiesForNextLevel,
} from "../config/brainrots";

/**
 * Turns a broken Lucky Block into a brainrot reward: picks a brainrot of the
 * rolled rarity, then either unlocks it or banks a duplicate copy and levels it
 * up. Emits the reveal (with carousel candidates) and the resulting gain.
 */
export class BrainrotSystem {
  constructor(
    private readonly state: GameState,
    private readonly rng: Rng,
    private readonly bus: EventBus
  ) {}

  grantReward(rarity: Rarity): void {
    const pool = BRAINROTS.filter((b) => b.rarity === rarity);
    const def = pool.length > 0 ? this.rng.pick(pool) : this.rng.pick(BRAINROTS);

    let owned = this.state.brainrots[def.id];
    const isNew = !owned;

    if (!owned) {
      owned = { level: 1, copies: 0 };
      this.state.brainrots[def.id] = owned;
    } else {
      owned.copies += 1;
      // Consume banked copies into as many level-ups as they allow.
      let need = copiesForNextLevel(owned.level);
      while (owned.copies >= need) {
        owned.copies -= need;
        owned.level += 1;
        need = copiesForNextLevel(owned.level);
      }
    }

    const candidates = this.buildCandidates(def.id);

    this.bus.emit("luckyReveal", {
      brainrotId: def.id,
      name: def.name,
      rarity: def.rarity,
      isNew,
      level: owned.level,
      candidates,
    });
    this.bus.emit("brainrotGained", {
      id: def.id,
      name: def.name,
      rarity: def.rarity,
      level: owned.level,
      isNew,
    });
  }

  /**
   * Build the reveal cycle sequence (winner is always last). Early spins pull
   * from the whole roster for variety; later spins increasingly bias toward the
   * winner's rarity to tease the result before it lands. Uses the seeded rng so
   * the whole reveal is reproducible.
   */
  private buildCandidates(winnerId: string): string[] {
    const winner = BRAINROTS_BY_ID[winnerId];
    const tier = BRAINROTS.filter((b) => b.rarity === winner.rarity);
    const cycleCount = 16; // visible spins before the final reveal
    const seq: string[] = [];

    for (let i = 0; i < cycleCount; i++) {
      const progress = i / cycleCount;
      // Past ~60% of the spin, ramp up the chance of teasing the winner's tier.
      const teaseWinnerTier =
        progress > 0.6 && this.rng.next() < (progress - 0.6) / 0.4;
      const pool = teaseWinnerTier && tier.length > 0 ? tier : BRAINROTS;

      let pick = this.rng.pick(pool).id;
      // Don't spoil the winner early, and avoid an immediate repeat.
      let guard = 0;
      while (
        (pick === winnerId || pick === seq[seq.length - 1]) &&
        guard < 8
      ) {
        pick = this.rng.pick(pool).id;
        guard++;
      }
      seq.push(pick);
    }

    seq.push(winnerId);
    return seq;
  }
}
