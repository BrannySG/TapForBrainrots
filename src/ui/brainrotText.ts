import type { BrainrotEffect } from "../core/config/brainrots";
import { formatNumber } from "./format";

/** Effect value at a given level: base + perLevel * (level - 1). */
function atLevel(base: number | undefined, perLevel: number | undefined, level: number): number {
  if (base === undefined) return 0;
  return base + (perLevel ?? 0) * Math.max(0, level - 1);
}

/**
 * Human-readable summary of what a brainrot contributes at a given level, e.g.
 * "+8 Passive DPS, +3% Gold". Used by the summon reveal card.
 */
export function describeEffect(effect: BrainrotEffect, level = 1): string {
  const parts: string[] = [];

  const dps = atLevel(effect.passiveDps, effect.passiveDpsPerLevel, level);
  if (dps > 0) parts.push(`+${formatNumber(dps)} Passive DPS`);

  const gold = atLevel(effect.goldMultPct, effect.goldMultPctPerLevel, level);
  if (gold > 0) parts.push(`+${formatNumber(gold)}% Gold`);

  const lucky = atLevel(effect.luckyChancePct, effect.luckyChancePctPerLevel, level);
  if (lucky > 0) parts.push(`+${formatNumber(lucky)}% Lucky Chance`);

  return parts.length > 0 ? parts.join(", ") : "No bonus";
}
