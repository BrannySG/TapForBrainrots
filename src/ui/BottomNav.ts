import { ICONS } from "./icons";
import { el, img } from "./dom";

export type NavTab = "bag" | "map" | "shop" | "loot" | "codex";

const TABS: { id: NavTab; label: string; icon: string }[] = [
  { id: "bag", label: "BAG", icon: ICONS.navBag },
  { id: "map", label: "MAP", icon: ICONS.navMap },
  { id: "shop", label: "SHOP", icon: ICONS.navShop },
  { id: "loot", label: "LOOT", icon: ICONS.navLoot },
  { id: "codex", label: "CODEX", icon: ICONS.navCodex },
];

/** Bottom navigation bar. Reports tab presses; panel wiring lives in Ui. */
export class BottomNav {
  constructor(parent: HTMLElement, onSelect: (tab: NavTab) => void) {
    const root = el("div", "bottom-nav");
    for (const tab of TABS) {
      const btn = el("button", "nav-btn") as HTMLButtonElement;
      btn.append(img(tab.icon, tab.label), el("span", undefined, tab.label));
      btn.addEventListener("click", () => onSelect(tab.id));
      root.append(btn);
    }
    parent.append(root);
  }
}
