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

  /** A small shuffled set of ids (winner last) for the reveal carousel. */
  private buildCandidates(winnerId: string): string[] {
    const others = BRAINROTS.map((b) => b.id).filter((id) => id !== winnerId);
    // Fisher-Yates using the seeded rng so the carousel is deterministic too.
    for (let i = others.length - 1; i > 0; i--) {
      const j = this.rng.int(0, i);
      [others[i], others[j]] = [others[j], others[i]];
    }
    const lead = others.slice(0, Math.min(5, others.length));
    return [...lead, winnerId].map((id) => BRAINROTS_BY_ID[id].id);
  }
}
