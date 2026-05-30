import type { GameCore } from "../core/GameCore";
import type { EventBus } from "../core/events/EventBus";
import { Hud } from "./Hud";
import { TargetLabel } from "./TargetLabel";
import { HealthBar } from "./HealthBar";
import { BottomNav, type NavTab } from "./BottomNav";
import { ShopPanel } from "./ShopPanel";
import { MapPanel } from "./MapPanel";
import { Panel } from "./Panel";
import { el } from "./dom";

const TAB_TITLES: Record<NavTab, string> = {
  bag: "Bag",
  map: "Map",
  shop: "Shop",
  loot: "Loot",
  codex: "Codex",
};

/** Composition root for the DOM UI. Owns all HUD widgets and panels. */
export class Ui {
  private readonly shop: ShopPanel;
  private readonly map: MapPanel;
  private readonly placeholder: Panel;

  constructor(root: HTMLElement, core: GameCore, bus: EventBus) {
    new Hud(root, core, bus);
    new TargetLabel(root, core, bus);
    new HealthBar(root, core, bus);

    this.shop = new ShopPanel(root, core, bus);
    this.map = new MapPanel(root, core, bus);

    this.placeholder = new Panel(root, "");
    this.placeholder.body.append(
      el("div", "panel-empty", "Coming soon in a future version.")
    );

    new BottomNav(root, (tab) => this.onNav(tab));
  }

  private onNav(tab: NavTab): void {
    if (tab === "shop") {
      this.shop.open();
      return;
    }
    if (tab === "map") {
      this.map.open();
      return;
    }
    this.placeholder.setTitle(TAB_TITLES[tab]);
    this.placeholder.open();
  }
}
