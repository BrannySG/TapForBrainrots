import type { Rarity } from "../types";
import type { GameState } from "../state/GameState";
import type { Rng } from "../rng/Rng";
import type { EventBus } from "../events/EventBus";
import { baseSellValue } from "../config/balance";
import { ITEMS } from "../config/loot";

/** Handles chest loot drops, auto-selling, gold balance, and item discovery. */
export class EconomySystem {
  constructor(
    private readonly state: GameState,
    private readonly rng: Rng,
    private readonly bus: EventBus
  ) {}

  /** Roll a loot item of the given rarity, auto-sell it, and bank the gold. */
  dropAndSell(rarity: Rarity, goldMultiplier: number): void {
    const pool = ITEMS.filter((i) => i.rarity === rarity);
    // Fall back to common if a rarity has no items defined.
    const item =
      pool.length > 0 ? this.rng.pick(pool) : this.rng.pick(ITEMS);

    const isNew = !this.state.discoveredItems.includes(item.id);
    if (isNew) this.state.discoveredItems.push(item.id);

    const sellValue = Math.ceil(
      baseSellValue(this.state.stage, item.rarity) * goldMultiplier
    );

    this.bus.emit("itemDropped", {
      name: item.name,
      rarity: item.rarity,
      sellValue,
      isNew,
    });
    this.addGold(sellValue);
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
