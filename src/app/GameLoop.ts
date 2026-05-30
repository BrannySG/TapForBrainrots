import type { GameCore } from "../core/GameCore";
import type { SceneRenderer } from "../render/SceneRenderer";

/**
 * Drives the frame loop: a fixed-step core update (deterministic passive
 * damage) plus a variable-step render. Logic and rendering are decoupled in
 * time as well as in code.
 */
export class GameLoop {
  private readonly step = 1 / 30;
  private last = 0;
  private acc = 0;
  private raf = 0;
  private running = false;

  constructor(
    private readonly core: GameCore,
    private readonly renderer: SceneRenderer
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private tick = (now: number): void => {
    const dt = Math.min(0.25, (now - this.last) / 1000);
    this.last = now;

    this.acc += dt;
    while (this.acc >= this.step) {
      this.core.update(this.step);
      this.acc -= this.step;
    }

    this.renderer.render(dt);

    if (this.running) this.raf = requestAnimationFrame(this.tick);
  };
}
