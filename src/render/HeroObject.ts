import * as THREE from "three";
import type { Rarity, TargetKind } from "../core/types";
import { loadLuckyBlock, normalizeToUnitSize } from "./AssetLoader";

const RARITY_COLOR: Record<Rarity, number> = {
  common: 0xc9d4e3,
  rare: 0x4aa3ff,
  epic: 0xc44bff,
  legendary: 0xffb02e,
  mythic: 0xff4d6d,
};

/**
 * Owns the on-screen 3D object and its non-gameplay motion (idle bob, spawn
 * pop, hit squash, break shrink). It is a passive view: it never reads game
 * state, it is told what to show and when to react.
 */
export class HeroObject {
  /** Added to the scene; rotated/bobbed as a whole. */
  readonly root = new THREE.Group();

  // Inner wrapper that we scale for punch/spawn without fighting the bob.
  private readonly pivot = new THREE.Group();
  private readonly chestMesh: THREE.Group;
  private luckyMesh: THREE.Group | null = null;
  private current: THREE.Object3D | null = null;
  private accent: THREE.MeshStandardMaterial;

  private idleTime = 0;
  private punch = 0; // 0..1 tap squash energy, decays fast (snappy)
  private throb = 0; // 0..1 passive-hit swell energy, bigger + slower decay
  private spawnPop = 0; // 0..1, plays on spawn
  private broken = false; // true between a break and the next spawn
  private breakProgress = 0; // 0..1, shrink-to-nothing on break
  private breakSpin = 0; // extra spin (radians) added while breaking

  constructor() {
    this.root.add(this.pivot);
    this.accent = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.1,
    });
    this.chestMesh = this.buildChestPlaceholder();
    void this.preloadLucky();
    this.show(this.chestMesh);
  }

  private async preloadLucky(): Promise<void> {
    try {
      this.luckyMesh = await loadLuckyBlock();
    } catch {
      // If the FBX fails to load we fall back to a tinted box for Lucky Blocks.
      this.luckyMesh = this.buildChestPlaceholder();
    }
  }

  /** Switch the displayed object to match the current target. */
  setTarget(kind: TargetKind, rarity: Rarity): void {
    const next =
      kind === "lucky" && this.luckyMesh ? this.luckyMesh : this.chestMesh;
    this.show(next);
    this.accent.color.setHex(RARITY_COLOR[rarity]);
    this.accent.emissive.setHex(RARITY_COLOR[rarity]);
    this.accent.emissiveIntensity = kind === "lucky" ? 0.35 : 0.15;
    this.spawnPop = 1;
    this.broken = false;
    this.breakProgress = 0;
    this.breakSpin = 0;
    this.punch = 0;
    this.throb = 0;
  }

  private show(object: THREE.Object3D): void {
    if (this.current === object) return;
    if (this.current) this.pivot.remove(this.current);
    this.current = object;
    this.pivot.add(object);
  }

  /** Trigger a snappy tap squash (called by the FX layer). */
  hit(strength = 1): void {
    this.punch = Math.min(1, this.punch + 0.6 * strength);
  }

  /**
   * Trigger a gentle passive-damage swell. Distinct from `hit`: a soft, slow
   * breathing pulse so batched passive ticks read as a calm throb instead of a
   * nauseating per-tick flicker.
   */
  throbPulse(strength = 1): void {
    this.throb = Math.min(1, this.throb + 0.5 * strength);
  }

  /**
   * Trigger the break: the object shrinks to nothing (with a quick spin) and
   * stays hidden until `setTarget` spawns the next one. The respawn gap is
   * driven by the game core, so the chest is genuinely gone in between.
   */
  playBreak(): void {
    this.broken = true;
    this.breakProgress = 0;
    this.breakSpin = 0;
  }

  update(dt: number): void {
    this.idleTime += dt;

    // Idle bob + slow spin.
    const bob = Math.sin(this.idleTime * 1.8) * 0.06;
    this.root.position.y = bob;

    // Tap punch decays fast for a snappy response.
    this.punch = Math.max(0, this.punch - dt * 4);
    // Passive throb decays slowly so the batched ticks blend into a gentle,
    // continuous breathing rather than a hard sawtooth flicker.
    this.throb = Math.max(0, this.throb - dt * 2.2);
    // Spawn pop eases out.
    this.spawnPop = Math.max(0, this.spawnPop - dt * 3);

    // Break shrink: ramp 0 -> 1 over ~0.25s and hold, with an accelerating spin.
    let breakScale = 1;
    if (this.broken) {
      this.breakProgress = Math.min(1, this.breakProgress + dt * 4.5);
      this.breakSpin += dt * (6 + this.breakProgress * 10);
      const eased = 1 - Math.pow(1 - this.breakProgress, 3); // easeOutCubic
      breakScale = 1 - eased;
    }
    this.root.rotation.y = Math.sin(this.idleTime * 0.6) * 0.25 + this.breakSpin;

    const squash = 1 - this.punch * 0.18;
    const stretch = 1 + this.punch * 0.12;
    // Subtle uniform swell for passive hits (gentle breathing, not a flicker).
    const throbScale = 1 + this.throb * 0.08;
    const spawnScale = 1 - this.spawnPop * 0.4;
    const s = spawnScale * breakScale * throbScale;

    this.pivot.scale.set(squash * s, stretch * s, squash * s);
  }

  private buildChestPlaceholder(): THREE.Group {
    const group = new THREE.Group();
    const woodBody = new THREE.MeshStandardMaterial({
      color: 0x8a5a2b,
      roughness: 0.7,
      metalness: 0.05,
    });
    const woodLid = new THREE.MeshStandardMaterial({
      color: 0x6f4421,
      roughness: 0.7,
      metalness: 0.05,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.0), woodBody);
    body.position.y = -0.2;
    group.add(body);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.5, 1.06), woodLid);
    lid.position.y = 0.42;
    group.add(lid);

    // Rarity-tinted latch so the placeholder still conveys rarity.
    const latch = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.4, 0.1),
      this.accent
    );
    latch.position.set(0, 0.18, 0.55);
    group.add(latch);

    // Chest reads slightly smaller than a Lucky Block (2.2) per V0 feedback.
    normalizeToUnitSize(group, 1.7);
    return group;
  }
}
