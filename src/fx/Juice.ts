import type { EventBus } from "../core/events/EventBus";
import type { SceneRenderer } from "../render/SceneRenderer";
import { formatNumber } from "../ui/format";
import { ICONS } from "../ui/icons";
import { FX_SPRITES } from "../ui/fxSprites";

const COIN_LAUNCH_STAGGER_MS = 55;
/** Vertical position (fraction of frame height) of the enemy's body for impacts. */
const IMPACT_Y = 0.42;

/**
 * The "juice" layer: screenshake, hit squash, the enemy flinch flipbook, and
 * the kill-reward coin burst. It only listens to core events and drives the
 * renderer + ephemeral DOM. Toggling it off changes nothing about game logic or
 * the HUD numbers - purely presentation. (The Lucky Block summon reveal is
 * owned by `RevealOverlay`, not this layer.)
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
        // Tap: snappy squash + in-plane wobble, the flinch flipbook frame, and
        // a comic damage-burst (slash + starburst flash + sparks) on the enemy.
        this.renderer.hero.hit(1);
        this.renderer.hero.flinch();
        this.renderer.shake(0.26);
        this.hitBurst();
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
      if (e.kind === "enemy") {
        // Hold the death frame; the coin burst fires on `killReward`.
        this.renderer.hero.playDeath();
        this.renderer.shake(0.5);
      } else {
        this.renderer.hero.playBreak();
        this.renderer.shake(0.9);
      }
    });

    bus.on("killReward", (e) => {
      if (!this.enabled) return;
      // Coins burst out of the enemy while the death frame is still held, then
      // fly up to the gold pill.
      const rect = this.fxLayer.getBoundingClientRect();
      if (rect.width === 0) return;
      const originX = rect.width * 0.5;
      const originY = rect.height * 0.48;
      const coinCount = Math.max(8, Math.min(20, 6 + Math.floor(Math.log2(e.gold + 1))));
      this.burstCoins(originX, originY, coinCount);
      this.popup(`+${formatNumber(e.gold)}`, undefined, true);
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
   * A punchy comic impact on the enemy for each tap: a quick warm flash ring, a
   * randomly-angled slash (the FantasyWarrior "DamageDirection" sprite), a white
   * starburst, and a spray of sparks. Built from the white alpha FX sprites the
   * same way the summon reveal tints them (CSS mask + background colour).
   */
  private hitBurst(): void {
    const rect = this.fxLayer.getBoundingClientRect();
    if (rect.width === 0) return;

    const x = rect.width * 0.5 + (Math.random() * 2 - 1) * rect.width * 0.06;
    const y = rect.height * IMPACT_Y + (Math.random() * 2 - 1) * rect.height * 0.035;
    const rot = Math.random() * 360;

    // Warm flash ring (soft, blended) - the "pow" glow behind the hit.
    const ring = this.maskLayer(x, y, FX_SPRITES.radialGlowSemi, 34, "#ffd54a");
    ring.style.mixBlendMode = "screen";
    this.animateOut(ring, [
      { transform: "translate(-50%, -50%) scale(0.45)", opacity: 0.85 },
      { transform: "translate(-50%, -50%) scale(1.35)", opacity: 0 },
    ], 200);

    // White starburst core.
    const star = this.maskLayer(x, y, FX_SPRITES.raysOuter, 40, "#ffffff", 3);
    this.animateOut(star, [
      { transform: `translate(-50%, -50%) scale(0.2) rotate(${rot}deg)`, opacity: 0 },
      { transform: `translate(-50%, -50%) scale(1.05) rotate(${rot}deg)`, opacity: 1, offset: 0.3 },
      { transform: `translate(-50%, -50%) scale(1.3) rotate(${rot}deg)`, opacity: 0 },
    ], 230);

    // Directional slash on top (the damage-direction sprite), angled randomly.
    const slash = this.maskLayer(x, y, FX_SPRITES.raysTriangle, 46, "#ffffff", 2.5);
    this.animateOut(slash, [
      { transform: `translate(-50%, -50%) scale(0.3) rotate(${rot + 30}deg)`, opacity: 0 },
      { transform: `translate(-50%, -50%) scale(1.15) rotate(${rot + 30}deg)`, opacity: 1, offset: 0.28 },
      { transform: `translate(-50%, -50%) scale(1.35) rotate(${rot + 30}deg)`, opacity: 0 },
    ], 220);

    // A small spray of sparks flying outward.
    const sparks = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < sparks; i++) {
      const size = 4 + Math.random() * 3;
      const spark = this.maskLayer(x, y, FX_SPRITES.sparkle, size, "#fff6cf", 1.5);
      const angle = Math.random() * Math.PI * 2;
      const dist = rect.width * (0.05 + Math.random() * 0.07);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      this.animateOut(spark, [
        { transform: "translate(-50%, -50%) translate(0px, 0px) scale(0.2)", opacity: 1 },
        { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.9)`, opacity: 0 },
      ], 260 + Math.random() * 160);
    }
  }

  /** Create a white alpha FX sprite tinted via CSS mask at (x,y), in frame units. */
  private maskLayer(
    x: number,
    y: number,
    url: string,
    sizeU: number,
    color: string,
    glowU = 0
  ): HTMLDivElement {
    const node = document.createElement("div");
    node.className = "fx-hit";
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.width = `calc(var(--frame-unit) * ${sizeU})`;
    node.style.height = `calc(var(--frame-unit) * ${sizeU})`;
    node.style.background = color;
    node.style.webkitMaskImage = `url(${url})`;
    node.style.maskImage = `url(${url})`;
    if (glowU > 0) {
      node.style.filter = `drop-shadow(0 0 calc(var(--frame-unit) * ${glowU}) ${color})`;
    }
    this.fxLayer.append(node);
    return node;
  }

  private animateOut(
    node: HTMLElement,
    frames: Keyframe[],
    duration: number
  ): void {
    const anim = node.animate(frames, {
      duration,
      easing: "cubic-bezier(0.2, 0.8, 0.3, 1.1)",
      fill: "forwards",
    });
    anim.onfinish = () => node.remove();
  }

  /**
   * Kill coin burst: coins explode up + outward from the enemy, fall and bounce
   * onto the "floor" (just above the health bar), pile up for a beat, then launch
   * one-by-one and accelerate up to the gold pill.
   */
  private burstCoins(x: number, y: number, count: number): void {
    const target = this.goldAnchorPoint();
    const layerRect = this.fxLayer.getBoundingClientRect();
    const targetX = target.x - layerRect.left;
    const targetY = target.y - layerRect.top;
    // The floor the coins land on: just above the health bar / enemy base.
    const floorY = layerRect.height * 0.585;
    const pile = layerRect.width * 0.03;

    for (let i = 0; i < count; i++) {
      const startX = x + (Math.random() * 2 - 1) * pile;
      const startY = y + (Math.random() * 2 - 1) * pile * 0.6;

      const coin = document.createElement("img");
      coin.className = "fx-coin";
      coin.src = ICONS.coin;
      coin.style.left = `${startX}px`;
      coin.style.top = `${startY}px`;
      this.fxLayer.append(coin);

      // Explosion vector: out sideways + up.
      const explodeX = (Math.random() * 2 - 1) * layerRect.width * 0.24;
      const explodeY = -layerRect.height * (0.05 + Math.random() * 0.12);
      // Where it settles on the floor (drifts a little from the explosion x).
      const restDx = startX + explodeX - startX + (Math.random() * 2 - 1) * layerRect.width * 0.03;
      const restDy = floorY - startY + (Math.random() * 2 - 1) * layerRect.height * 0.012;
      const bounce = layerRect.height * 0.04;

      // Phase 1: burst out/up, then fall and bounce onto the floor.
      const fallMs = 460 + Math.random() * 160;
      const fall = coin.animate(
        [
          { transform: "translate(-50%, -50%) translate(0px, 0px) scale(0.3)", opacity: 0, offset: 0 },
          {
            transform: `translate(-50%, -50%) translate(${explodeX}px, ${explodeY}px) scale(1.25)`,
            opacity: 1,
            offset: 0.26,
          },
          {
            transform: `translate(-50%, -50%) translate(${restDx}px, ${restDy - bounce}px) scale(1)`,
            opacity: 1,
            offset: 0.74,
          },
          {
            transform: `translate(-50%, -50%) translate(${restDx}px, ${restDy}px) scale(1)`,
            opacity: 1,
            offset: 1,
          },
        ],
        { duration: fallMs, easing: "cubic-bezier(0.3, 0.5, 0.5, 1)", fill: "forwards" }
      );

      // Phase 2: hold on the floor, then hop and accelerate up to the gold pill.
      fall.onfinish = () => {
        const dx = targetX - startX;
        const dy = targetY - startY;
        const launchDelay = 120 + i * COIN_LAUNCH_STAGGER_MS + Math.random() * 60;
        const fly = coin.animate(
          [
            { transform: `translate(-50%, -50%) translate(${restDx}px, ${restDy}px) scale(1)`, opacity: 1, offset: 0 },
            {
              transform: `translate(-50%, -50%) translate(${restDx}px, ${restDy - bounce * 1.2}px) scale(1.12)`,
              opacity: 1,
              offset: 0.16,
            },
            { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.55)`, opacity: 0.95, offset: 1 },
          ],
          {
            duration: 360 + Math.random() * 120,
            delay: launchDelay,
            easing: "cubic-bezier(0.5, 0, 0.75, 0.25)",
            fill: "forwards",
          }
        );
        fly.onfinish = () => {
          coin.remove();
          this.bumpGold();
        };
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
