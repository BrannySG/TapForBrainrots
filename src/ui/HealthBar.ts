import type { GameCore } from "../core/GameCore";
import type { EventBus } from "../core/events/EventBus";
import { formatNumber } from "./format";
import { el } from "./dom";

/** Target health bar. Updates on damage + spawn events. */
export class HealthBar {
  private readonly fill = el("div", "health-fill");
  private readonly text = el("div", "health-text");

  constructor(parent: HTMLElement, core: GameCore, bus: EventBus) {
    const root = el("div", "health-bar");
    root.append(this.fill, this.text);
    parent.append(root);

    const snap = core.getSnapshot();
    if (snap.target) this.set(snap.target.health, snap.target.maxHealth);

    bus.on("targetSpawned", ({ target }) =>
      this.set(target.health, target.maxHealth)
    );
    bus.on("targetDamaged", ({ health, maxHealth }) =>
      this.set(health, maxHealth)
    );
  }

  private set(health: number, maxHealth: number): void {
    const ratio = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;
    this.fill.style.transform = `scaleX(${ratio})`;
    this.text.textContent = `${formatNumber(Math.ceil(health))}/${formatNumber(
      maxHealth
    )}`;
  }
}
