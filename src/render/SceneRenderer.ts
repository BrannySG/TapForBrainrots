import * as THREE from "three";
import type { EventBus } from "../core/events/EventBus";
import { HeroObject } from "./HeroObject";

/**
 * Owns the Three.js scene for the single hero object on a transparent
 * background (the blue game frame shows through via CSS, matching the mockup).
 *
 * It subscribes only to `targetSpawned` (which object to show). All juice
 * (hit/break/shake) is driven imperatively by the FX layer, keeping this a
 * thin, replaceable view.
 */
export class SceneRenderer {
  readonly hero = new HeroObject();

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;

  private shakeEnergy = 0;
  private width = 1;
  private height = 1;

  constructor(canvas: HTMLCanvasElement, bus: EventBus) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(40, 9 / 16, 0.1, 100);
    this.camera.position.set(0, 0, 6.5);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x3355aa, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 5, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x88bbff, 0.6);
    rim.position.set(-4, 1, -3);
    this.scene.add(rim);

    this.scene.add(this.hero.root);

    bus.on("targetSpawned", ({ target }) => {
      this.hero.setTarget(target.kind, target.rarity);
    });
  }

  /** Camera shake impulse (0..1+), called by the FX layer. */
  shake(amount: number): void {
    this.shakeEnergy = Math.min(1.2, this.shakeEnergy + amount);
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  /** Advance animation and draw a frame. Called by the game loop. */
  render(dt: number): void {
    this.hero.update(dt);

    this.shakeEnergy = Math.max(0, this.shakeEnergy - dt * 3);
    const s = this.shakeEnergy * this.shakeEnergy;
    this.camera.position.x = (Math.random() * 2 - 1) * 0.25 * s;
    this.camera.position.y = (Math.random() * 2 - 1) * 0.25 * s;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
