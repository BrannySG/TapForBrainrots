import type { EventBus } from "../core/events/EventBus";
import type { SceneRenderer } from "../render/SceneRenderer";
import type { Rarity } from "../core/types";
import { formatNumber } from "../ui/format";
import { ICONS } from "../ui/icons";
import { ITEM_ICONS } from "../ui/itemIcons";

const RARITY_CSS: Record<Rarity, string> = {
  common: "var(--rarity-common)",
  rare: "var(--rarity-rare)",
  epic: "var(--rarity-epic)",
  legendary: "var(--rarity-legendary)",
  mythic: "var(--rarity-mythic)",
};

/** How many coins a dropped item bursts into, by rarity. */
const COINS_BY_RARITY: Record<Rarity, number> = {
  common: 3,
  rare: 4,
  epic: 5,
  legendary: 7,
  mythic: 9,
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
  /** Cached gold HUD pill used as the coin-flight destination. */
  private goldAnchor: HTMLElement | null = null;

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
      if (e.isTap) {
        this.renderer.hero.hit(1);
        this.renderer.shake(0.18);
        this.popup(`-${formatNumber(e.amount)}`, "#ffffff");
      } else {
        // Passive ticks are now batched (~0.33s); make each a clear throb.
        this.renderer.hero.throbPulse(1);
        this.renderer.shake(0.14);
      }
    });

    bus.on("targetBroken", (e) => {
      if (!this.enabled) return;
      this.renderer.hero.playBreak();
      this.renderer.shake(e.kind === "lucky" ? 0.9 : 0.4);
    });

    bus.on("itemDropped", (e) => {
      if (!this.enabled) return;
      // Tiny stagger so a 2-drop reads as two distinct bursts.
      window.setTimeout(
        () => this.sellItem(e.id, e.rarity, e.sellValue, e.index, e.count),
        e.index * 110
      );
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

  /**
   * The sell sequence: the item bursts out of the chest in a fanned direction,
   * lingers ~1s with a rarity glow, then "pops" into a pile of coins that fly
   * up to the gold counter one by one.
   */
  private sellItem(
    id: string,
    rarity: Rarity,
    sellValue: number,
    index: number,
    count: number
  ): void {
    const rect = this.fxLayer.getBoundingClientRect();
    if (rect.width === 0) return;

    // Chest centre, slightly above the vertical middle of the frame.
    const originX = rect.width * 0.5;
    const originY = rect.height * 0.46;
    const color = RARITY_CSS[rarity];

    // Fan items out: centre a single drop, spread multiples left/right + up.
    const centered = index - (count - 1) / 2; // ...-0.5, +0.5 (2) / 0 (1)
    const offX = centered * rect.width * 0.24 + (Math.random() * 2 - 1) * rect.width * 0.02;
    const offY = -rect.height * 0.13 - Math.random() * rect.height * 0.03;
    const tilt = centered * 14 + (Math.random() * 6 - 3); // degrees

    const item = document.createElement("div");
    item.className = "fx-item";
    item.style.left = `${originX}px`;
    item.style.top = `${originY}px`;
    item.style.setProperty("--glow", color);

    const icon = document.createElement("img");
    icon.src = ITEM_ICONS[id] ?? ICONS.coin;
    item.append(icon);

    const value = document.createElement("div");
    value.className = "fx-item-value";
    value.textContent = `+${formatNumber(sellValue)}`;
    value.style.color = color;
    item.append(value);

    this.fxLayer.append(item);

    const lingerMs = 1000;
    // Burst outward (overshoot), settle at the fan position, then hold.
    item.animate(
      [
        { transform: "translate(-50%, -50%) translate(0px, 0px) scale(0.2) rotate(0deg)", opacity: 0, offset: 0 },
        {
          transform: `translate(-50%, -50%) translate(${offX * 1.12}px, ${offY * 1.12}px) scale(1.28) rotate(${tilt * 1.15}deg)`,
          opacity: 1,
          offset: 0.22,
        },
        {
          transform: `translate(-50%, -50%) translate(${offX}px, ${offY}px) scale(1) rotate(${tilt}deg)`,
          opacity: 1,
          offset: 0.4,
        },
        {
          transform: `translate(-50%, -50%) translate(${offX}px, ${offY}px) scale(1) rotate(${tilt}deg)`,
          opacity: 1,
          offset: 0.88,
        },
        {
          transform: `translate(-50%, -50%) translate(${offX}px, ${offY}px) scale(1.35) rotate(${tilt}deg)`,
          opacity: 0,
          offset: 1,
        },
      ],
      { duration: lingerMs, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.3)", fill: "forwards" }
    );

    window.setTimeout(() => {
      item.remove();
      this.burstCoins(originX + offX, originY + offY, COINS_BY_RARITY[rarity]);
    }, lingerMs);
  }

  /** Spawn `count` coins as a pile at (x,y) that fly to the gold pill one by one. */
  private burstCoins(x: number, y: number, count: number): void {
    const target = this.goldAnchorPoint();
    const layerRect = this.fxLayer.getBoundingClientRect();
    const targetX = target.x - layerRect.left;
    const targetY = target.y - layerRect.top;
    const pile = layerRect.width * 0.04;

    for (let i = 0; i < count; i++) {
      // Start scattered in a small pile so the conversion reads as "a stack".
      const startX = x + (Math.random() * 2 - 1) * pile;
      const startY = y + (Math.random() * 2 - 1) * pile * 0.6;

      const coin = document.createElement("img");
      coin.className = "fx-coin";
      coin.src = ICONS.coin;
      coin.style.left = `${startX}px`;
      coin.style.top = `${startY}px`;
      this.fxLayer.append(coin);

      const dx = targetX - startX;
      const dy = targetY - startY;
      // Upward arc on the way in, with a clear one-by-one launch cadence.
      const arc = layerRect.height * (0.1 + Math.random() * 0.08);
      const delay = i * 85;
      const duration = 480 + Math.random() * 160;

      const anim = coin.animate(
        [
          { transform: "translate(-50%, -50%) translate(0px, 0px) scale(0.3)", opacity: 0, offset: 0 },
          { transform: "translate(-50%, -50%) translate(0px, 0px) scale(1.15)", opacity: 1, offset: 0.18 },
          {
            transform: `translate(-50%, -50%) translate(${dx * 0.5}px, ${dy * 0.5 - arc}px) scale(1)`,
            opacity: 1,
            offset: 0.6,
          },
          {
            transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.6)`,
            opacity: 0.95,
            offset: 1,
          },
        ],
        { duration, delay, easing: "cubic-bezier(0.45, 0, 0.55, 1)", fill: "forwards" }
      );

      anim.onfinish = () => {
        coin.remove();
        this.bumpGold();
      };
    }
  }

  /** Centre point (viewport coords) of the gold HUD pill, with a fallback. */
  private goldAnchorPoint(): { x: number; y: number } {
    if (!this.goldAnchor) {
      this.goldAnchor = document.querySelector<HTMLElement>(".hud-gold");
    }
    const rect = this.fxLayer.getBoundingClientRect();
    if (this.goldAnchor) {
      const r = this.goldAnchor.getBoundingClientRect();
      return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 };
    }
    // Fallback: top-left HUD area if the pill isn't mounted yet.
    return { x: rect.left + rect.width * 0.18, y: rect.top + rect.height * 0.05 };
  }

  /** A small pulse on the gold pill as coins land, reinforcing accumulation. */
  private bumpGold(): void {
    if (!this.goldAnchor) {
      this.goldAnchor = document.querySelector<HTMLElement>(".hud-gold");
    }
    const pill = this.goldAnchor;
    if (!pill) return;
    pill.classList.remove("bump");
    void pill.offsetWidth; // restart the animation
    pill.classList.add("bump");
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
