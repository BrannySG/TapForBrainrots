import type { GameCore } from "../core/GameCore";
import type { EventBus } from "../core/events/EventBus";
import { ICONS } from "./icons";
import { formatNumber } from "./format";
import { el, img } from "./dom";

/**
 * Top HUD: gold + gems (row 1) and brainrot count + calendar (row 2), matching
 * the mockup. Reads initial values from the core snapshot then stays in sync
 * purely via events.
 */
export class Hud {
  private readonly goldValue = el("span", "value");
  private readonly gemsValue = el("span", "value");
  private readonly brainrotValue = el("span", "badge");

  // Count-up tween state for the gold display (presentation only; the true
  // gold in core is always correct, we just animate how it is shown).
  private goldShown = 0;
  private goldTarget = 0;
  private goldRaf = 0;

  constructor(parent: HTMLElement, core: GameCore, bus: EventBus) {
    const root = el("div", "hud-top");

    const goldPill = this.pill(ICONS.gold, this.goldValue);
    // Stable hook so the FX layer can fly coins to the gold counter.
    goldPill.classList.add("hud-gold");

    const row1 = el("div", "hud-row");
    row1.append(goldPill, this.pill(ICONS.gem, this.gemsValue));

    const row2 = el("div", "hud-row");
    row2.append(
      this.pill(ICONS.rebirth, this.brainrotValue),
      this.iconButton(ICONS.calendar)
    );

    root.append(row1, row2);
    parent.append(root);

    const snap = core.getSnapshot();
    this.goldShown = snap.gold;
    this.goldTarget = snap.gold;
    this.goldValue.textContent = formatNumber(snap.gold);
    this.gemsValue.textContent = formatNumber(snap.gems);
    this.brainrotValue.textContent = String(snap.ownedBrainrots);

    bus.on("goldChanged", ({ gold, delta }) => {
      this.goldTarget = gold;
      // Spends snap instantly; earnings climb so coins read as "accumulating".
      if (delta < 0) {
        this.goldShown = gold;
        this.goldValue.textContent = formatNumber(gold);
        return;
      }
      this.startGoldTween();
    });
    bus.on("gemsChanged", ({ gems }) => {
      this.gemsValue.textContent = formatNumber(gems);
    });
    bus.on("brainrotGained", () => {
      this.brainrotValue.textContent = String(core.getSnapshot().ownedBrainrots);
    });
  }

  private startGoldTween(): void {
    if (this.goldRaf) return;
    const tick = (): void => {
      const remaining = this.goldTarget - this.goldShown;
      if (Math.abs(remaining) < 1) {
        this.goldShown = this.goldTarget;
        this.goldValue.textContent = formatNumber(this.goldTarget);
        this.goldRaf = 0;
        return;
      }
      // Ease toward the target, with a floor so large jumps still resolve fast.
      this.goldShown += Math.max(1, remaining * 0.18);
      if (this.goldShown > this.goldTarget) this.goldShown = this.goldTarget;
      this.goldValue.textContent = formatNumber(Math.floor(this.goldShown));
      this.goldRaf = requestAnimationFrame(tick);
    };
    this.goldRaf = requestAnimationFrame(tick);
  }

  private pill(icon: string, valueEl: HTMLElement): HTMLElement {
    const pill = el("div", "pill");
    pill.append(img(icon), valueEl);
    return pill;
  }

  private iconButton(icon: string): HTMLElement {
    const pill = el("div", "pill icon-only");
    pill.append(img(icon));
    return pill;
  }
}
