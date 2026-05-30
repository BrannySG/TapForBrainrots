import type { DerivedStats } from "../types";
import type { GameState } from "../state/GameState";
import { Balance } from "../config/balance";
import { UPGRADES_BY_ID } from "../config/upgrades";
import { BRAINROTS_BY_ID } from "../config/brainrots";

/**
 * Pure aggregation of all upgrade + brainrot contributions into the final
 * stats used by combat/economy. Stateless: always derived from GameState, so
 * it can never drift out of sync.
 */
export class StatsSystem {
  constructor(private readonly state: GameState) {}

  compute(): DerivedStats {
    let tapDamage = Balance.baseTapDamage;
    let passiveDps = 0;
    let goldMultPct = 0;
    let luckyChancePct = 0;

    // Upgrades.
    for (const [id, level] of Object.entries(this.state.upgrades)) {
      const def = UPGRADES_BY_ID[id];
      if (!def || level <= 0) continue;
      const total = def.perLevel * level;
      switch (def.kind) {
        case "tapDamage":
          tapDamage += total;
          break;
        case "passiveDamage":
          passiveDps += total;
          break;
        case "goldMult":
          goldMultPct += total;
          break;
        case "luckyChance":
          luckyChancePct += total;
          break;
      }
    }

    // Brainrots (effect = base + perLevel * (level - 1)).
    for (const [id, owned] of Object.entries(this.state.brainrots)) {
      const def = BRAINROTS_BY_ID[id];
      if (!def || owned.level <= 0) continue;
      const lv = owned.level - 1;
      const e = def.effect;
      if (e.passiveDps)
        passiveDps += e.passiveDps + (e.passiveDpsPerLevel ?? 0) * lv;
      if (e.goldMultPct)
        goldMultPct += e.goldMultPct + (e.goldMultPctPerLevel ?? 0) * lv;
      if (e.luckyChancePct)
        luckyChancePct += e.luckyChancePct + (e.luckyChancePctPerLevel ?? 0) * lv;
    }

    return {
      tapDamage,
      passiveDps,
      goldMultiplier: 1 + goldMultPct / 100,
      luckyChance: Balance.lucky.baseChance + luckyChancePct / 100,
    };
  }
}
