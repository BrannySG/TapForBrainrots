import type { EventBus } from "../core/events/EventBus";
import type { WorldId } from "../core/types";

import castawayCove from "../assets/backgrounds/castaway_cove/castaway_cove.jpg?url";

/**
 * Per-world background art: a single cohesive 9:16 image per world. Worlds
 * without art fall back to the flat CSS gradient on `#game-frame`.
 */
const WORLD_ART: Partial<Record<WorldId, string>> = {
  castaway_cove: castawayCove,
};

/**
 * World-themed scenery that sits behind the 3D canvas to give the play field a
 * sense of place. A single static image (no parallax/layers) sized to fill the
 * frame, composed so the beach lands where the enemy stands.
 *
 * Pure presentation subscriber: it only reads the initial world id and listens
 * for `worldChanged` to swap art. It never affects gameplay.
 */
export class Background {
  private readonly el: HTMLDivElement;

  constructor(frame: HTMLElement, bus: EventBus, initialWorld: WorldId) {
    this.el = document.createElement("div");
    this.el.id = "bg-image";
    // Insert behind the canvas + UI (paint order = DOM order for absolute kids).
    frame.insertBefore(this.el, frame.firstChild);

    this.setWorld(initialWorld);
    bus.on("worldChanged", ({ worldId }) => this.setWorld(worldId));
  }

  private setWorld(worldId: WorldId): void {
    const art = WORLD_ART[worldId];
    if (!art) {
      this.el.classList.remove("show");
      this.el.style.backgroundImage = "";
      return;
    }
    this.el.style.backgroundImage = `url("${art}")`;
    this.el.classList.add("show");
  }
}
