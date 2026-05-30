import { GameCore } from "../core/GameCore";
import { SceneRenderer } from "../render/SceneRenderer";
import { Ui } from "../ui/Ui";
import { RevealOverlay } from "../ui/RevealOverlay";
import { Layout } from "../ui/Layout";
import { Juice } from "../fx/Juice";
import { AudioSystem } from "../audio/AudioSystem";
import { GameLoop } from "./GameLoop";
import { installDebugApi } from "./debug";

/** Optional `?seed=123` URL param for reproducible runs; otherwise time-based. */
function resolveSeed(): number {
  const param = new URLSearchParams(window.location.search).get("seed");
  if (param !== null) {
    const n = Number(param);
    if (Number.isFinite(n)) return n >>> 0;
  }
  return Date.now() >>> 0;
}

export function bootstrap(): void {
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const uiRoot = document.getElementById("ui-root") as HTMLElement;
  const frame = document.getElementById("game-frame") as HTMLElement;

  const core = new GameCore({ seed: resolveSeed() });
  const renderer = new SceneRenderer(canvas, core.bus);

  // UI + FX + audio are pure subscribers to the core's event bus.
  new Ui(uiRoot, core, core.bus);
  const juice = new Juice(uiRoot, renderer, core.bus);
  const audio = new AudioSystem(core.bus);
  // The Lucky Block summon takeover. Appended last so it sits above the HUD/FX;
  // its cosmetic bursts honour the FX toggle, the page itself always shows.
  new RevealOverlay(uiRoot, core, core.bus, audio, () => juice.enabled);

  const layout = new Layout(frame, (w, h) => renderer.resize(w, h));
  layout.apply();

  // Tapping the empty center (the 3D area) damages the target. HUD/panel
  // elements capture their own clicks, so this only fires on the play area.
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    // Browsers require a user gesture to start audio; safe to call repeatedly.
    audio.unlock();
    core.tap();
  });

  installDebugApi(core, juice, audio);

  core.start();
  new GameLoop(core, renderer).start();
}
