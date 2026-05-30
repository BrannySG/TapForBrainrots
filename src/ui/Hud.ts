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

  constructor(parent: HTMLElement, core: GameCore, bus: EventBus) {
    const root = el("div", "hud-top");

    const row1 = el("div", "hud-row");
    row1.append(
      this.pill(ICONS.gold, this.goldValue),
      this.pill(ICONS.gem, this.gemsValue)
    );

    const row2 = el("div", "hud-row");
    row2.append(
      this.pill(ICONS.rebirth, this.brainrotValue),
      this.iconButton(ICONS.calendar)
    );

    root.append(row1, row2);
    parent.append(root);

    const snap = core.getSnapshot();
    this.goldValue.textContent = formatNumber(snap.gold);
    this.gemsValue.textContent = formatNumber(snap.gems);
    this.brainrotValue.textContent = String(snap.ownedBrainrots);

    bus.on("goldChanged", ({ gold }) => {
      this.goldValue.textContent = formatNumber(gold);
    });
    bus.on("gemsChanged", ({ gems }) => {
      this.gemsValue.textContent = formatNumber(gems);
    });
    bus.on("brainrotGained", () => {
      this.brainrotValue.textContent = String(core.getSnapshot().ownedBrainrots);
    });
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
