import type { GameCore } from "../core/GameCore";
import type { EventBus } from "../core/events/EventBus";
import { UPGRADES } from "../core/config/upgrades";
import { Panel } from "./Panel";
import { ICONS } from "./icons";
import { formatNumber } from "./format";
import { el, img } from "./dom";

interface UpgradeRow {
  level: HTMLElement;
  cost: HTMLElement;
  button: HTMLButtonElement;
}

/** Functional gold-upgrade shop. The other nav tabs are V0 placeholders. */
export class ShopPanel {
  private readonly panel: Panel;
  private readonly rows = new Map<string, UpgradeRow>();

  constructor(parent: HTMLElement, private core: GameCore, bus: EventBus) {
    this.panel = new Panel(parent, "Shop");

    for (const def of UPGRADES) {
      const row = el("div", "upgrade");

      const info = el("div", "upgrade-info");
      info.append(
        el("div", "upgrade-name", def.name),
        el("div", "upgrade-desc", def.description)
      );
      const levelEl = el("div", "upgrade-level");
      info.append(levelEl);

      const button = el("button", "buy-btn") as HTMLButtonElement;
      const costEl = el("span");
      button.append(img(ICONS.gold), costEl);
      button.addEventListener("click", () => this.core.buyUpgrade(def.id));

      row.append(info, button);
      this.panel.body.append(row);

      this.rows.set(def.id, { level: levelEl, cost: costEl, button });
    }

    this.refresh();
    bus.on("goldChanged", () => this.refresh());
    bus.on("upgradePurchased", () => this.refresh());
  }

  open(): void {
    this.refresh();
    this.panel.open();
  }

  private refresh(): void {
    const gold = this.core.getSnapshot().gold;
    for (const def of UPGRADES) {
      const row = this.rows.get(def.id);
      if (!row) continue;
      const level = this.core.getUpgradeLevel(def.id);
      const atMax = def.maxLevel !== undefined && level >= def.maxLevel;
      const cost = this.core.getUpgradeCost(def.id) ?? 0;

      row.level.textContent = `Level ${level}`;
      if (atMax) {
        row.cost.textContent = "MAX";
        row.button.disabled = true;
      } else {
        row.cost.textContent = formatNumber(cost);
        row.button.disabled = gold < cost;
      }
    }
  }
}
