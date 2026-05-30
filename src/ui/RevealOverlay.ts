import type { GameCore } from "../core/GameCore";
import type { EventBus } from "../core/events/EventBus";
import type { AudioSystem } from "../audio/AudioSystem";
import type { Rarity } from "../core/types";
import { RARITY_ORDER } from "../core/types";
import { BRAINROTS_BY_ID } from "../core/config/brainrots";
import { BRAINROT_ICONS } from "./brainrotIcons";
import { FX_SPRITES } from "./fxSprites";
import { describeEffect } from "./brainrotText";
import { el, img } from "./dom";

const RARITY_COLOR: Record<Rarity, string> = {
  common: "var(--rarity-common)",
  rare: "var(--rarity-rare)",
  epic: "var(--rarity-epic)",
  legendary: "var(--rarity-legendary)",
  mythic: "var(--rarity-mythic)",
};

/** Number of sparkle bursts at the final reveal, by rarity tier. */
const BURST_BY_TIER = [10, 16, 24, 34, 48];

type Phase = "idle" | "cycling" | "revealed";

/**
 * The full-screen Lucky Block "summon" takeover. Listens for `luckyReveal`,
 * cycles black-tinted brainrot silhouettes (scaling up from 0 each beat, with a
 * tick per cycle and a palette that teases the rarity), slows down for tension,
 * then lands on the awarded brainrot with a rarity-scaled burst and a reveal of
 * its name + effect. Tap to continue resumes the (paused) game.
 *
 * This is core flow UI, so the page itself always shows; only the cosmetic
 * sparkle/ray bursts respect the FX toggle.
 */
export class RevealOverlay {
  private readonly root: HTMLDivElement;
  private readonly glow: HTMLDivElement;
  private readonly rays: HTMLDivElement;
  private readonly sprite: HTMLImageElement;
  private readonly title: HTMLDivElement;
  private readonly card: HTMLDivElement;
  private readonly cardName: HTMLDivElement;
  private readonly cardRarity: HTMLDivElement;
  private readonly cardEffect: HTMLDivElement;
  private readonly cta: HTMLDivElement;
  private readonly burstLayer: HTMLDivElement;

  private phase: Phase = "idle";
  private timer = 0;
  private step = 0;
  private canDismiss = false;
  private candidates: string[] = [];
  private winnerId = "";
  private winnerLevel = 1;

  constructor(
    parent: HTMLElement,
    private readonly core: GameCore,
    bus: EventBus,
    private readonly audio: AudioSystem,
    private readonly isFxEnabled: () => boolean
  ) {
    this.root = el("div", "reveal-overlay");

    const bg = el("div", "reveal-bg");

    this.glow = el("div", "reveal-glow");
    this.maskWith(this.glow, FX_SPRITES.radialGlowThick);

    this.rays = el("div", "reveal-rays");
    this.maskWith(this.rays, FX_SPRITES.raysOuter);

    this.burstLayer = el("div", "reveal-burst");

    this.title = el("div", "reveal-title", "NEW BRAINROT");

    const stage = el("div", "reveal-stage");
    this.sprite = img("", "");
    this.sprite.className = "reveal-sprite";
    stage.append(this.glow, this.rays, this.sprite, this.burstLayer);

    this.card = el("div", "reveal-card");
    this.cardName = el("div", "reveal-name");
    this.cardRarity = el("div", "reveal-rarity");
    this.cardEffect = el("div", "reveal-effect");
    this.card.append(this.cardRarity, this.cardName, this.cardEffect);

    this.cta = el("div", "reveal-cta", "Tap to continue");

    this.root.append(bg, this.title, stage, this.card, this.cta);
    parent.append(this.root);

    this.root.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.onTap();
    });

    bus.on("luckyReveal", (e) => this.begin(e.brainrotId, e.candidates, e.isNew, e.level));
  }

  private maskWith(node: HTMLElement, url: string): void {
    node.style.webkitMaskImage = `url(${url})`;
    node.style.maskImage = `url(${url})`;
  }

  private begin(
    winnerId: string,
    candidates: string[],
    isNew: boolean,
    level: number
  ): void {
    this.cancelTimer();
    this.winnerId = winnerId;
    // Defensive: ensure the winner is the last entry to reveal.
    this.candidates =
      candidates.length > 0 ? candidates : [winnerId];
    if (this.candidates[this.candidates.length - 1] !== winnerId) {
      this.candidates = [...this.candidates, winnerId];
    }

    // Preload art so silhouettes don't flicker as they cycle.
    for (const id of this.candidates) {
      const url = BRAINROT_ICONS[id];
      if (url) new Image().src = url;
    }

    const winner = BRAINROTS_BY_ID[winnerId];
    this.title.textContent = isNew ? "NEW BRAINROT" : "LEVEL UP";
    this.cardName.textContent = winner?.name ?? winnerId;
    this.cardRarity.textContent = (winner?.rarity ?? "common").toUpperCase();
    this.cardEffect.textContent = winner
      ? describeEffect(winner.effect, level)
      : "";
    this.winnerLevel = level;

    this.card.classList.remove("show");
    this.cta.classList.remove("show");
    this.rays.classList.remove("fire");
    this.burstLayer.innerHTML = "";
    this.sprite.classList.add("silhouette");

    this.phase = "cycling";
    this.canDismiss = false;
    this.step = 0;
    this.root.classList.add("open");

    this.cycle();
  }

  private cycle(): void {
    const ticks = this.candidates.length - 1; // last entry is the reveal
    if (this.step >= ticks) {
      this.doReveal();
      return;
    }

    const id = this.candidates[this.step];
    this.showSilhouette(id);

    const progress = ticks <= 1 ? 1 : this.step / (ticks - 1);
    this.audio.playTick(progress);

    // Ease-out: start snappy, slow dramatically toward the reveal.
    const interval = 70 + (520 - 70) * Math.pow(progress, 1.8);
    this.step += 1;
    this.timer = window.setTimeout(() => this.cycle(), interval);
  }

  private showSilhouette(id: string): void {
    const def = BRAINROTS_BY_ID[id];
    this.setPalette(def?.rarity ?? "common");
    const url = BRAINROT_ICONS[id];
    if (url) this.sprite.src = url;
    this.sprite.classList.add("silhouette");
    // Re-trigger the scale-from-zero pop.
    this.sprite.animate(
      [
        { transform: "scale(0)", opacity: 0.2 },
        { transform: "scale(1.06)", opacity: 1, offset: 0.7 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 220, easing: "cubic-bezier(0.2, 0.85, 0.3, 1.4)", fill: "both" }
    );
  }

  private doReveal(): void {
    this.cancelTimer();
    this.phase = "revealed";

    const winner = BRAINROTS_BY_ID[this.winnerId];
    const rarity = winner?.rarity ?? "common";
    this.setPalette(rarity);

    const url = BRAINROT_ICONS[this.winnerId];
    if (url) this.sprite.src = url;
    // Drop the black tint - the actual character is revealed.
    this.sprite.classList.remove("silhouette");
    this.sprite.animate(
      [
        { transform: "scale(0.4)", opacity: 0 },
        { transform: "scale(1.18)", opacity: 1, offset: 0.55 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 520, easing: "cubic-bezier(0.15, 0.9, 0.25, 1.5)", fill: "both" }
    );

    this.fireRays();
    this.spawnBurst(rarity);
    this.audio.playReveal(rarity);

    this.cardRarity.textContent = rarity.toUpperCase();
    this.cardEffect.textContent = winner
      ? describeEffect(winner.effect, this.winnerLevel)
      : "";
    this.cta.textContent = "Tap to continue";

    window.setTimeout(() => this.card.classList.add("show"), 220);
    window.setTimeout(() => {
      this.cta.classList.add("show");
      this.canDismiss = true;
    }, 700);
  }

  private fireRays(): void {
    if (!this.isFxEnabled()) return;
    this.rays.classList.remove("fire");
    void this.rays.offsetWidth; // restart animation
    this.rays.classList.add("fire");
  }

  private spawnBurst(rarity: Rarity): void {
    if (!this.isFxEnabled()) return;
    const tier = Math.max(0, RARITY_ORDER.indexOf(rarity));
    const count = BURST_BY_TIER[tier] ?? 12;
    const reach = 26 + tier * 6; // % of stage, grander for higher rarity

    for (let i = 0; i < count; i++) {
      const star = el("div", "reveal-spark");
      this.maskWith(star, FX_SPRITES.sparkle);
      this.burstLayer.append(star);

      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = reach * (0.6 + Math.random() * 0.6);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const size = 4 + Math.random() * (3 + tier);

      star.style.width = `calc(var(--frame-unit) * ${size})`;
      star.style.height = `calc(var(--frame-unit) * ${size})`;

      const anim = star.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.2)", opacity: 0 },
          {
            transform: `translate(calc(-50% + ${dx}%), calc(-50% + ${dy}%)) scale(1)`,
            opacity: 1,
            offset: 0.4,
          },
          {
            transform: `translate(calc(-50% + ${dx * 1.25}%), calc(-50% + ${dy * 1.25}%)) scale(0.3)`,
            opacity: 0,
          },
        ],
        {
          duration: 600 + Math.random() * 400,
          delay: Math.random() * 120,
          easing: "cubic-bezier(0.2, 0.7, 0.3, 1)",
          fill: "forwards",
        }
      );
      anim.onfinish = () => star.remove();
    }
  }

  private setPalette(rarity: Rarity): void {
    this.root.style.setProperty("--reveal-color", RARITY_COLOR[rarity]);
    this.root.dataset.rarity = rarity;
  }

  private onTap(): void {
    if (this.phase === "cycling") {
      // Impatient player: jump straight to the reveal.
      this.cancelTimer();
      this.doReveal();
    } else if (this.phase === "revealed" && this.canDismiss) {
      this.finish();
    }
  }

  private finish(): void {
    this.phase = "idle";
    this.root.classList.remove("open");
    this.core.resolveReveal();
  }

  private cancelTimer(): void {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = 0;
    }
  }
}
