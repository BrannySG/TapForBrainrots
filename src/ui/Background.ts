import type { EventBus } from "../core/events/EventBus";
import type { WorldId } from "../core/types";

import coveSky from "../assets/backgrounds/castaway_cove/sky.jpg?url";
import coveScene from "../assets/backgrounds/castaway_cove/scene.jpg?url";
import coveForeground from "../assets/backgrounds/castaway_cove/foreground.jpg?url";

/** The three parallax depth slots, far -> near. */
interface WorldArt {
  sky: string;
  scene: string;
  foreground: string;
}

/**
 * Per-world background art. Worlds without art fall back to the flat CSS
 * gradient on `#game-frame` (the layer container simply stays empty/hidden).
 */
const WORLD_ART: Partial<Record<WorldId, WorldArt>> = {
  castaway_cove: {
    sky: coveSky,
    scene: coveScene,
    foreground: coveForeground,
  },
};

/**
 * Layered, world-themed scenery that sits behind the 3D canvas to give the
 * play field a sense of place and depth.
 *
 * It is a pure presentation subscriber: it never reads or mutates game state
 * beyond the initial world id, and only listens for `worldChanged` to swap art.
 * Depth comes from three stacked, opaque JPG layers (far sky -> mid cove ->
 * near foreground) feathered together with CSS masks, plus a subtle pointer
 * parallax (far layers drift least, near layers most) and an ambient cloud
 * drift. Disabling it never affects gameplay.
 */
export class Background {
  private readonly container: HTMLDivElement;
  private readonly sky: HTMLDivElement;
  private readonly scene: HTMLDivElement;
  private readonly foreground: HTMLDivElement;

  constructor(frame: HTMLElement, bus: EventBus, initialWorld: WorldId) {
    this.container = document.createElement("div");
    this.container.id = "bg-layers";

    this.sky = this.makeLayer("bg-layer bg-sky");
    this.scene = this.makeLayer("bg-layer bg-scene");
    this.foreground = this.makeLayer("bg-layer bg-foreground");
    this.container.append(this.sky, this.scene, this.foreground);

    // Insert behind the canvas + UI (paint order = DOM order for absolute kids).
    frame.insertBefore(this.container, frame.firstChild);

    this.setWorld(initialWorld);
    bus.on("worldChanged", ({ worldId }) => this.setWorld(worldId));

    // Subtle parallax: map the pointer position within the frame to a -1..1
    // offset the layers read via a CSS variable. Passive listeners keep taps
    // (which drive the game) fully responsive.
    frame.addEventListener("pointermove", this.onPointerMove, { passive: true });
    frame.addEventListener("pointerleave", this.recenter, { passive: true });
  }

  private makeLayer(className: string): HTMLDivElement {
    const div = document.createElement("div");
    div.className = className;
    return div;
  }

  private setWorld(worldId: WorldId): void {
    const art = WORLD_ART[worldId];
    if (!art) {
      this.container.classList.remove("show");
      return;
    }
    this.sky.style.backgroundImage = `url("${art.sky}")`;
    this.scene.style.backgroundImage = `url("${art.scene}")`;
    this.foreground.style.backgroundImage = `url("${art.foreground}")`;
    this.container.classList.add("show");
  }

  private readonly onPointerMove = (e: PointerEvent): void => {
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const py = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    this.container.style.setProperty("--bg-px", clamp(px).toFixed(3));
    this.container.style.setProperty("--bg-py", clamp(py).toFixed(3));
  };

  private readonly recenter = (): void => {
    this.container.style.setProperty("--bg-px", "0");
    this.container.style.setProperty("--bg-py", "0");
  };
}

function clamp(n: number): number {
  return n < -1 ? -1 : n > 1 ? 1 : n;
}
