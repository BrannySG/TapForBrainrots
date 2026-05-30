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

/** World + stage + rarity + current target name, centered near the top. */
export class TargetLabel {
  private readonly worldEl = el("div", "target-rarity");
  private readonly stageEl = el("div", "target-rarity");
  private readonly rarityEl = el("div", "target-rarity");
  private readonly nameEl = el("div", "target-name");

  constructor(parent: HTMLElement, core: GameCore, bus: EventBus) {
    const root = el("div", "target-label");
    this.worldEl.style.color = "rgba(255,255,255,0.65)";
    this.stageEl.style.color = "rgba(255,255,255,0.8)";
    root.append(this.worldEl, this.stageEl, this.rarityEl, this.nameEl);
    parent.append(root);

    const snap = core.getSnapshot();
    this.setWorld(snap.worldName);
    this.setStage(snap.stage);
    if (snap.target) this.setTarget(snap.target.rarity, snap.target.name);

    bus.on("targetSpawned", ({ target }) => {
      this.setTarget(target.rarity, target.name);
    });
    bus.on("stageChanged", ({ stage }) => this.setStage(stage));
    bus.on("worldChanged", ({ name }) => this.setWorld(name));
  }

  private setWorld(name: string): void {
    this.worldEl.textContent = name;
  }

  private setStage(stage: number): void {
    this.stageEl.textContent = `Stage ${stage}`;
  }

  private setTarget(rarity: Rarity, name: string): void {
    this.rarityEl.textContent = rarity;
    this.rarityEl.style.color = RARITY_CSS[rarity];
    this.nameEl.textContent = name;
  }
}
