import type { EventBus } from "../core/events/EventBus";
import type { SceneRenderer } from "../render/SceneRenderer";
import type { Rarity } from "../core/types";
import { formatNumber } from "../ui/format";

const RARITY_CSS: Record<Rarity, string> = {
  common: "var(--rarity-common)",
  rare: "var(--rarity-rare)",
  epic: "var(--rarity-epic)",
  legendary: "var(--rarity-legendary)",
  mythic: "var(--rarity-mythic)",
};

/**
 * The "juice" layer: screenshake, hit squash, floating numbers, reveal flash,
 * and the brainrot reveal toast. It only listens to core events and drives the
 * renderer + ephemeral DOM. Toggling it off changes nothing about game logic
 * or the HUD numbers - purely presentation.
 */
export class Juice {
  enabled = true;

  private readonly fxLayer: HTMLDivElement;
  private readonly flash: HTMLDivElement;
  private readonly toast: HTMLDivElement;
  private toastTimer = 0;

  constructor(
    parent: HTMLElement,
    private readonly renderer: SceneRenderer,
    bus: EventBus
  ) {
    this.fxLayer = document.createElement("div");
    this.fxLayer.className = "fx-layer";

    this.flash = document.createElement("div");
    this.flash.className = "reveal-flash";

    this.toast = document.createElement("div");
    this.toast.className = "toast";

    parent.append(this.fxLayer, this.flash, this.toast);

    bus.on("targetDamaged", (e) => {
      if (!this.enabled) return;
      this.renderer.hero.hit(e.isTap ? 1 : 0.35);
      this.renderer.shake(e.isTap ? 0.18 : 0.05);
      if (e.isTap) this.popup(`-${formatNumber(e.amount)}`, "#ffffff");
    });

    bus.on("targetBroken", (e) => {
      if (!this.enabled) return;
      this.renderer.hero.playBreak();
      this.renderer.shake(e.kind === "lucky" ? 0.9 : 0.4);
    });

    bus.on("itemDropped", (e) => {
      if (!this.enabled) return;
      this.popup(`+${formatNumber(e.sellValue)}`, undefined, true);
    });

    bus.on("luckyReveal", (e) => {
      if (!this.enabled) return;
      this.fireFlash(RARITY_CSS[e.rarity]);
      const status = e.isNew ? "NEW!" : `Level ${e.level}`;
      this.showToast(e.name, `${e.rarity.toUpperCase()} - ${status}`, RARITY_CSS[e.rarity]);
    });
  }

  /** Called by the game loop to tick toast lifetime. */
  update(dt: number): void {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toast.classList.remove("show");
    }
  }

  private popup(text: string, color?: string, gold = false): void {
    const node = document.createElement("div");
    node.className = gold ? "fx-popup gold" : "fx-popup";
    node.textContent = text;
    if (color) node.style.color = color;
    node.style.left = `${48 + (Math.random() * 8 - 4)}%`;
    node.style.top = `${42 + (Math.random() * 6 - 3)}%`;
    this.fxLayer.append(node);
    window.setTimeout(() => node.remove(), 750);
  }

  private fireFlash(color: string): void {
    this.flash.style.background = `radial-gradient(circle at 50% 42%, ${color}, transparent 60%)`;
    this.flash.classList.remove("fire");
    // Force reflow so the animation restarts.
    void this.flash.offsetWidth;
    this.flash.classList.add("fire");
  }

  private showToast(title: string, sub: string, color: string): void {
    this.toast.innerHTML = "";
    const t = document.createElement("div");
    t.className = "toast-title";
    t.textContent = title;
    t.style.color = color;
    const s = document.createElement("div");
    s.className = "toast-sub";
    s.textContent = sub;
    this.toast.append(t, s);
    this.toast.classList.add("show");
    this.toastTimer = 2.2;
  }
}
