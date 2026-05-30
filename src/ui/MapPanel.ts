import type { GameCore } from "../core/GameCore";
import type { EventBus } from "../core/events/EventBus";
import type { WorldId } from "../core/types";
import { Panel } from "./Panel";
import { el } from "./dom";

interface WorldRow {
  desc: HTMLElement;
  status: HTMLElement;
  button: HTMLButtonElement;
}

/** World / zone selector. Lets the player travel between unlocked worlds. */
export class MapPanel {
  private readonly panel: Panel;
  private readonly rows = new Map<WorldId, WorldRow>();

  constructor(parent: HTMLElement, private core: GameCore, bus: EventBus) {
    this.panel = new Panel(parent, "Map");

    for (const w of core.getWorlds()) {
      const row = el("div", "upgrade");

      const info = el("div", "upgrade-info");
      const desc = el("div", "upgrade-desc");
      const status = el("div", "upgrade-level");
      info.append(el("div", "upgrade-name", w.name), desc, status);

      const button = el("button", "buy-btn") as HTMLButtonElement;
      button.addEventListener("click", () => {
        if (this.core.switchWorld(w.id)) this.panel.close();
      });

      row.append(info, button);
      this.panel.body.append(row);
      this.rows.set(w.id, { desc, status, button });
    }

    this.refresh();
    bus.on("worldChanged", () => this.refresh());
    bus.on("worldUnlocked", () => this.refresh());
    bus.on("stageChanged", () => {
      if (this.panel.isOpen) this.refresh();
    });
  }

  open(): void {
    this.refresh();
    this.panel.open();
  }

  private refresh(): void {
    for (const w of this.core.getWorlds()) {
      const row = this.rows.get(w.id);
      if (!row) continue;

      row.desc.textContent = w.theme;

      if (!w.unlocked) {
        row.status.textContent = w.unlockHint ? `Locked - ${w.unlockHint}` : "Locked";
        row.button.textContent = "Locked";
        row.button.disabled = true;
      } else if (w.current) {
        row.status.textContent = `Current - Stage ${w.stage}`;
        row.button.textContent = "Current";
        row.button.disabled = true;
      } else {
        row.status.textContent = `Stage ${w.stage}`;
        row.button.textContent = "Travel";
        row.button.disabled = false;
      }
    }
  }
}
