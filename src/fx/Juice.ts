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
const COIN_LAUNCH_STAGGER_MS = 60;
const ITEM_POP_TAIL_MS = 120;
const ITEM_READ_MS = 650;
const POP_START_RATIO = 0.4;

/**
 * The "juice" layer: screenshake, hit squash, floating numbers, and the loot
 * sell burst. It only listens to core events and drives the renderer +
 * ephemeral DOM. Toggling it off changes nothing about game logic or the HUD
 * numbers - purely presentation. (The Lucky Block summon reveal is owned by
 * `RevealOverlay`, not this layer.)
 */
export class Juice {
  enabled = true;

  private readonly fxLayer: HTMLDivElement;
  /** Cached gold HUD pill used as the coin-flight destination. */
  private goldAnchor: HTMLElement | null = null;

  constructor(
    parent: HTMLElement,
    private readonly renderer: SceneRenderer,
    bus: EventBus
  ) {
    this.fxLayer = document.createElement("div");
    this.fxLayer.className = "fx-layer";

    parent.append(this.fxLayer);

    bus.on("targetDamaged", (e) => {
      if (!this.enabled) return;
      if (e.isTap) {
        this.renderer.hero.hit(1);
        this.renderer.shake(0.18);
        this.popup(`-${formatNumber(e.amount)}`, "#ffffff");
      } else {
        // Passive ticks are batched (~0.33s); keep them a soft breathing pulse
        // with almost no camera shake so idle damage isn't nauseating.
        this.renderer.hero.throbPulse(1);
        this.renderer.shake(0.05);
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

    // Chest centre: the items should feel like they burst from the middle of
    // the chest, so anchor on the vertical centre of the frame.
    const originX = rect.width * 0.5;
    const originY = rect.height * 0.5;
    const color = RARITY_CSS[rarity];

    // Fan items out horizontally; keep them near the chest centre vertically
    // (a hair of jitter) so they sit centrally instead of floating high.
    const centered = index - (count - 1) / 2; // ...-0.5, +0.5 (2) / 0 (1)
    const offX = centered * rect.width * 0.24 + (Math.random() * 2 - 1) * rect.width * 0.02;
    const offY = (Math.random() * 2 - 1) * rect.height * 0.02;
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

    // Items live long enough to read clearly, then "pop" while the full coin
    // launch wave happens so the conversion feels contiguous.
    const lingerMs = ITEM_READ_MS;
    const coinCount = COINS_BY_RARITY[rarity];
    const popStartMs = lingerMs * POP_START_RATIO;
    const coinSpawnWindowMs = Math.max(0, (coinCount - 1) * COIN_LAUNCH_STAGGER_MS);
    const totalMs = Math.max(lingerMs, popStartMs + coinSpawnWindowMs + ITEM_POP_TAIL_MS);
    const holdOffset = popStartMs / totalMs;
    const popOffset = holdOffset + (1 - holdOffset) * 0.45;
    // Burst outward (overshoot), settle at the fan position, then hold.
    item.animate(
      [
        { transform: "translate(-50%, -50%) translate(0px, 0px) scale(0.2) rotate(0deg)", opacity: 0, offset: 0 },
        {
          transform: `translate(-50%, -50%) translate(${offX * 1.12}px, ${offY * 1.12}px) scale(1.28) rotate(${tilt * 1.15}deg)`,
          opacity: 1,
          offset: 0.15,
        },
        {
          transform: `translate(-50%, -50%) translate(${offX}px, ${offY}px) scale(1) rotate(${tilt}deg)`,
          opacity: 1,
          offset: 0.27,
        },
        {
          transform: `translate(-50%, -50%) translate(${offX}px, ${offY}px) scale(1) rotate(${tilt}deg)`,
          opacity: 1,
          offset: holdOffset,
        },
        {
          transform: `translate(-50%, -50%) translate(${offX}px, ${offY}px) scale(1.18) rotate(${tilt + 8}deg)`,
          opacity: 1,
          offset: popOffset,
        },
        {
          transform: `translate(-50%, -50%) translate(${offX}px, ${offY}px) scale(0.26) rotate(${tilt + 16}deg)`,
          opacity: 0,
          offset: 1,
        },
      ],
      { duration: totalMs, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.3)", fill: "forwards" }
    );

    // Start coins right as the pop begins; the item remains visible during the
    // full launch cadence so it reads as "item bursts into coins".
    window.setTimeout(() => {
      this.burstCoins(originX + offX, originY + offY, coinCount);
    }, popStartMs);
    window.setTimeout(() => item.remove(), totalMs);
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
      const delay = i * COIN_LAUNCH_STAGGER_MS;
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
}
