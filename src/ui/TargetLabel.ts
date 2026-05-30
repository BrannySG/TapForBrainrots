import type { GameCore } from "../core/GameCore";
import type { EventBus } from "../core/events/EventBus";
import type { Rarity } from "../core/types";
import { el } from "./dom";

const RARITY_CSS: Record<Rarity, string> = {
  common: "var(--rarity-common)",
  rare: "var(--rarity-rare)",
  epic: "var(--rarity-epic)",
  legendary: "var(--rarity-legendary)",
  mythic: "var(--rarity-mythic)",
};

/** Rarity + current target name, centered above the chest. */
export class TargetLabel {
  private readonly root = el("div", "target-label");
  private readonly rarityEl = el("div", "target-rarity");
  private readonly nameEl = el("div", "target-name");

  constructor(parent: HTMLElement, core: GameCore, bus: EventBus) {
    this.root.append(this.rarityEl, this.nameEl);
    parent.append(this.root);

    const snap = core.getSnapshot();
    if (snap.target)
      this.setTarget(snap.target.rarity, snap.target.name, snap.target.isBoss);

    bus.on("targetSpawned", ({ target }) => {
      this.setTarget(target.rarity, target.name, target.isBoss);
      this.setVisible(true);
    });
    // Hide the rarity/title while the chest is broken + respawning so the
    // stale label doesn't sit over the loot burst. It returns on the next spawn.
    bus.on("targetBroken", () => this.setVisible(false));
  }

  private setVisible(visible: boolean): void {
    this.root.style.visibility = visible ? "visible" : "hidden";
  }

  private setTarget(rarity: Rarity, name: string, isBoss = false): void {
    // Bosses show a "BOSS" tag (in the legendary colour) instead of the rarity.
    this.rarityEl.textContent = isBoss ? "BOSS" : rarity;
    this.rarityEl.style.color = isBoss ? RARITY_CSS.legendary : RARITY_CSS[rarity];
    this.nameEl.textContent = name;
  }
}
