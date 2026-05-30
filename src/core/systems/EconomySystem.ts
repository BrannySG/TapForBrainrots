import type { GameState } from "../state/GameState";
import type { EventBus } from "../events/EventBus";
import { bossGoldForKill, goldForKill } from "../config/balance";

/** Handles kill rewards and the gold balance. */
export class EconomySystem {
  constructor(
    private readonly state: GameState,
    private readonly bus: EventBus
  ) {}

  /**
   * Award stage-scaled gold for a defeated enemy and emit `killReward` so the
   * FX layer can burst coins from the enemy. Bosses pay a larger multiple.
   */
  awardKillGold(goldMultiplier: number, isBoss = false): number {
    const gold = isBoss
      ? bossGoldForKill(this.state.stage, goldMultiplier)
      : goldForKill(this.state.stage, goldMultiplier);
    this.bus.emit("killReward", { gold });
    this.addGold(gold);
    return gold;
  }

  addGold(amount: number): void {
    if (amount === 0) return;
    this.state.gold += amount;
    this.bus.emit("goldChanged", { gold: this.state.gold, delta: amount });
  }

  /** Returns false if the player can't afford `amount`. */
  trySpendGold(amount: number): boolean {
    if (this.state.gold < amount) return false;
    this.state.gold -= amount;
    this.bus.emit("goldChanged", { gold: this.state.gold, delta: -amount });
    return true;
  }
}
