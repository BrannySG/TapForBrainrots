import * as THREE from "three";
import type { Rarity, TargetKind } from "../core/types";
import {
  loadEnemyFrames,
  loadLuckyBlock,
  normalizeToUnitSize,
  type EnemyFrame,
  type EnemyFrames,
} from "./AssetLoader";

const RARITY_COLOR: Record<Rarity, number> = {
  common: 0xc9d4e3,
  rare: 0x4aa3ff,
  epic: 0xc44bff,
  legendary: 0xffb02e,
  mythic: 0xff4d6d,
};

/** On-screen display height (world units) for an enemy sprite plane. */
const ENEMY_DISPLAY_HEIGHT = 2.6;
/** Fixed vertical offset (world units) so the enemy sits higher on screen. */
const ENEMY_RAISE = 0.55;
/** Fixed vertical offset (world units) so the Lucky Block sits higher too. */
const LUCKY_RAISE = 0.6;
/** How long the spawn frame shows before settling into idle (seconds). */
const SPAWN_FRAME_HOLD = 0.18;
/** How long a flinch frame shows before returning to idle (seconds). */
const FLINCH_HOLD = 0.12;
/** How long the death frame holds before the shrink begins (seconds). */
const DEATH_HOLD = 0.35;

/**
 * Owns the on-screen object and its non-gameplay motion (idle bob, spawn pop,
 * hit squash/wobble, flinch flipbook, death hold + shrink). It is a passive
 * view: it never reads game state, it is told what to show and when to react.
 *
 * Enemies render as a 2D sprite plane (flipbook frames swapped on the material);
 * Lucky Blocks render as the FBX mesh.
 */
export class HeroObject {
  /** Added to the scene; bobbed/rotated as a whole. */
  readonly root = new THREE.Group();

  // Inner wrapper we scale/rotate for punch/spawn/death without fighting the bob.
  private readonly pivot = new THREE.Group();

  private readonly enemyPlane: THREE.Mesh;
  private readonly enemyMaterial: THREE.MeshBasicMaterial;
  private luckyMesh: THREE.Group | null = null;
  private accent: THREE.MeshStandardMaterial;

  private current: THREE.Object3D | null = null;
  private currentKind: TargetKind = "enemy";

  // Loaded flipbook frames, cached per enemy id.
  private readonly frameCache = new Map<string, EnemyFrames>();
  private activeFrames: EnemyFrames | null = null;
  private currentFrame: EnemyFrame = "idle";

  private idleTime = 0;
  private punch = 0; // 0..1 tap squash energy, decays fast (snappy)
  private wobbleDir = 1; // randomized in-plane lean direction per hit
  private throb = 0; // 0..1 passive-hit swell energy, bigger + slower decay
  private spawnPop = 0; // 0..1, plays on spawn
  private spawnFrameTimer = 0; // shows the spawn frame, then idle
  private flinchTimer = 0; // shows the flinch frame, then idle
  private dying = false; // death frame is held / shrinking
  private deathHoldTimer = 0; // hold death frame before shrink
  private broken = false; // true once the shrink has begun
  private breakProgress = 0; // 0..1, shrink-to-nothing
  private breakSpin = 0; // extra spin/lean added while breaking

  constructor() {
    this.root.add(this.pivot);
    this.accent = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.1,
    });

    this.enemyMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      color: 0xffffff,
    });
    this.enemyPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      this.enemyMaterial
    );
    this.enemyPlane.scale.setScalar(ENEMY_DISPLAY_HEIGHT);

    void this.preloadLucky();
    void this.preloadEnemy("skibidi_slime");
    this.show(this.enemyPlane);
  }

  private async preloadLucky(): Promise<void> {
    try {
      this.luckyMesh = await loadLuckyBlock();
    } catch {
      // If the FBX fails to load we fall back to a tinted box for Lucky Blocks.
      this.luckyMesh = this.buildLuckyPlaceholder();
    }
  }

  private async preloadEnemy(id: string): Promise<EnemyFrames | null> {
    if (this.frameCache.has(id)) return this.frameCache.get(id)!;
    try {
      const frames = await loadEnemyFrames(id);
      this.frameCache.set(id, frames);
      // If this enemy is still the one on screen, apply its current frame now.
      if (this.currentKind === "enemy" && this.current === this.enemyPlane) {
        this.activeFrames = frames;
        this.applyFrameAspect(frames.idle);
        this.setFrame(this.currentFrame);
      }
      return frames;
    } catch {
      return null;
    }
  }

  /** Switch the displayed object to match the current target. */
  setTarget(kind: TargetKind, rarity: Rarity, enemyId?: string, isBoss = false): void {
    this.currentKind = kind;
    this.accent.color.setHex(RARITY_COLOR[rarity]);
    this.accent.emissive.setHex(RARITY_COLOR[rarity]);
    this.accent.emissiveIntensity = kind === "lucky" ? 0.35 : 0.15;

    // Bosses are visually beefier. The per-frame motion scales the pivot, so we
    // scale the root here and it persists across updates.
    this.root.scale.setScalar(isBoss ? 1.5 : 1);

    // Reset motion/anim state.
    this.spawnPop = 1;
    this.punch = 0;
    this.throb = 0;
    this.dying = false;
    this.deathHoldTimer = 0;
    this.broken = false;
    this.breakProgress = 0;
    this.breakSpin = 0;
    this.flinchTimer = 0;
    this.spawnFrameTimer = 0;

    if (kind === "lucky") {
      this.activeFrames = null;
      this.show(this.luckyMesh ?? this.enemyPlane);
      return;
    }

    // Enemy: show the sprite plane, start on the spawn frame, then settle.
    const id = enemyId ?? "skibidi_slime";
    this.show(this.enemyPlane);
    const frames = this.frameCache.get(id) ?? null;
    this.activeFrames = frames;
    if (frames) {
      this.applyFrameAspect(frames.idle);
      this.currentFrame = "spawn";
      this.setFrame("spawn");
      this.spawnFrameTimer = SPAWN_FRAME_HOLD;
    } else {
      this.currentFrame = "idle";
      void this.preloadEnemy(id);
    }
  }

  private show(object: THREE.Object3D): void {
    if (this.current === object) return;
    if (this.current) this.pivot.remove(this.current);
    this.current = object;
    this.pivot.add(object);
  }

  /** Set the active flipbook frame (no-op if frames aren't loaded yet). */
  private setFrame(frame: EnemyFrame): void {
    this.currentFrame = frame;
    if (!this.activeFrames) return;
    this.enemyMaterial.map = this.activeFrames[frame];
    this.enemyMaterial.needsUpdate = true;
  }

  /** Size the plane to the texture's aspect ratio at a fixed display height. */
  private applyFrameAspect(tex: THREE.Texture): void {
    const img = tex.image as { width?: number; height?: number } | undefined;
    const w = img?.width ?? 1;
    const h = img?.height ?? 1;
    const aspect = h > 0 ? w / h : 1;
    this.enemyPlane.scale.set(
      ENEMY_DISPLAY_HEIGHT * aspect,
      ENEMY_DISPLAY_HEIGHT,
      1
    );
  }

  /** Trigger a snappy tap squash + in-plane wobble (called by the FX layer). */
  hit(strength = 1): void {
    this.punch = Math.min(1, this.punch + 0.6 * strength);
    this.wobbleDir = Math.random() < 0.5 ? -1 : 1;
  }

  /**
   * Trigger the flinch flipbook frame: shows the flinch sprite briefly, then
   * snaps back to idle (handled in `update`). No-op while dying.
   */
  flinch(): void {
    if (this.dying || this.currentKind !== "enemy") return;
    this.setFrame("flinch");
    this.flinchTimer = FLINCH_HOLD;
    this.spawnFrameTimer = 0;
  }

  /**
   * Trigger a gentle passive-damage swell (soft breathing pulse, distinct from
   * the snappy tap `hit`).
   */
  throbPulse(strength = 1): void {
    this.throb = Math.min(1, this.throb + 0.5 * strength);
  }

  /**
   * Lucky Block break: shrink to nothing with a quick spin (no death frame).
   */
  playBreak(): void {
    this.dying = false;
    this.broken = true;
    this.breakProgress = 0;
    this.breakSpin = 0;
  }

  /**
   * Enemy death: show the death frame, hold it briefly (so the coin burst can
   * fly out), then shrink to nothing.
   */
  playDeath(): void {
    this.dying = true;
    this.flinchTimer = 0;
    this.spawnFrameTimer = 0;
    this.setFrame("death");
    this.deathHoldTimer = DEATH_HOLD;
    this.broken = false;
    this.breakProgress = 0;
    this.breakSpin = 0;
  }

  update(dt: number): void {
    this.idleTime += dt;

    // No idle bob: the object sits still, raised to sit higher on screen.
    this.root.position.y =
      this.currentKind === "enemy" ? ENEMY_RAISE : LUCKY_RAISE;

    // Energy decays.
    this.punch = Math.max(0, this.punch - dt * 4);
    this.throb = Math.max(0, this.throb - dt * 2.2);
    this.spawnPop = Math.max(0, this.spawnPop - dt * 3);

    // Spawn frame -> idle.
    if (this.spawnFrameTimer > 0) {
      this.spawnFrameTimer -= dt;
      if (this.spawnFrameTimer <= 0 && !this.dying) this.setFrame("idle");
    }
    // Flinch frame -> idle.
    if (this.flinchTimer > 0) {
      this.flinchTimer -= dt;
      if (this.flinchTimer <= 0 && !this.dying) this.setFrame("idle");
    }
    // Death hold -> begin shrink.
    if (this.deathHoldTimer > 0) {
      this.deathHoldTimer -= dt;
      if (this.deathHoldTimer <= 0) {
        this.broken = true;
        this.breakProgress = 0;
        this.breakSpin = 0;
      }
    }

    // Break shrink: ramp 0 -> 1 over ~0.25s and hold, with an accelerating spin.
    let breakScale = 1;
    if (this.broken) {
      this.breakProgress = Math.min(1, this.breakProgress + dt * 4.5);
      this.breakSpin += dt * (6 + this.breakProgress * 10);
      const eased = 1 - Math.pow(1 - this.breakProgress, 3); // easeOutCubic
      breakScale = 1 - eased;
    }

    if (this.currentKind === "lucky") {
      // FBX spins in 3D on its break.
      this.root.rotation.y = Math.sin(this.idleTime * 0.6) * 0.25 + this.breakSpin;
      this.pivot.rotation.z = 0;
    } else {
      // Sprite plane: keep it facing the camera; lean in-plane for hit/death.
      this.root.rotation.y = 0;
      const hitLean = this.punch * 0.15 * this.wobbleDir;
      this.pivot.rotation.z = hitLean + this.breakSpin * 0.25;
    }

    const squash = 1 - this.punch * 0.18;
    const stretch = 1 + this.punch * 0.12;
    const throbScale = 1 + this.throb * 0.08;
    const spawnScale = 1 - this.spawnPop * 0.4;
    const s = spawnScale * breakScale * throbScale;

    this.pivot.scale.set(squash * s, stretch * s, squash * s);
  }

  private buildLuckyPlaceholder(): THREE.Group {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 1.4),
      this.accent
    );
    group.add(body);
    normalizeToUnitSize(group, 2.2);
    return group;
  }
}
