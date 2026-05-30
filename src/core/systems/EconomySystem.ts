import type { Rarity } from "../types";
import { RARITY_ORDER } from "../types";
import type { GameState } from "../state/GameState";
import type { Rng } from "../rng/Rng";
import type { EventBus } from "../events/EventBus";
import { Balance, itemSellValue } from "../config/balance";
import { lootRarityWeights } from "../config/loot";
import { worldItems } from "../config/worlds";

/** Handles chest loot drops, auto-selling, gold balance, and item discovery. */
export class EconomySystem {
  constructor(
    private readonly state: GameState,
    private readonly rng: Rng,
    private readonly bus: EventBus
  ) {}

  /**
   * Roll 1-2 loot items for a broken chest, auto-sell each, and bank the gold.
   * The first item inherits the chest's on-screen `chestRarity` (so the rolled
   * rarity stays truthful); any extra item rolls its own rarity.
   */
  dropAndSell(chestRarity: Rarity, goldMultiplier: number): void {
    const count =
      this.rng.next() < Balance.loot.secondItemChance ? 2 : 1;

    for (let i = 0; i < count; i++) {
      const rarity =
        i === 0 ? chestRarity : this.rollLootRarity();
      this.dropOne(rarity, goldMultiplier, i, count);
    }
  }

  private rollLootRarity(): Rarity {
    const weights = lootRarityWeights(this.state.stage);
    return this.rng.weighted(
      RARITY_ORDER,
      RARITY_ORDER.map((r) => weights[r])
    );
  }

  private dropOne(
    rarity: Rarity,
    goldMultiplier: number,
    index: number,
    count: number
  ): void {
    const items = worldItems(this.state.worldId);
    const pool = items.filter((i) => i.rarity === rarity);
    // Fall back to the full pool if a rarity has no items defined.
    const item = pool.length > 0 ? this.rng.pick(pool) : this.rng.pick(items);

    const isNew = !this.state.discoveredItems.includes(item.id);
    if (isNew) this.state.discoveredItems.push(item.id);

    const sellValue = itemSellValue(this.state.stage, item.value, goldMultiplier);

    this.bus.emit("itemDropped", {
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      sellValue,
      isNew,
      index,
      count,
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
