import type { DerivedStats, TargetState } from "./types";
import { EventBus } from "./events/EventBus";
import { Rng } from "./rng/Rng";
import { createInitialState, type GameState } from "./state/GameState";
import { StatsSystem } from "./systems/StatsSystem";
import { SpawnSystem } from "./systems/SpawnSystem";
import { EconomySystem } from "./systems/EconomySystem";
import { ProgressionSystem } from "./systems/ProgressionSystem";
import { BrainrotSystem } from "./systems/BrainrotSystem";
import { PassiveSystem } from "./systems/PassiveSystem";
import {
  Balance,
  bossHealthForStage,
  enemyHealthForStage,
  isBossStage,
  luckyHealthForStage,
} from "./config/balance";
import { ENEMIES } from "./config/enemies";
import { UPGRADES_BY_ID, upgradeCost } from "./config/upgrades";
import { WORLDS, WORLDS_BY_ID } from "./config/worlds";
import type { WorldId } from "./types";

export interface GameCoreOptions {
  seed?: number;
}

const DEFAULT_SEED = 0x1234abcd;

/**
 * The heart of the game. Owns state + systems, exposes a small command API
 * (`tap`, `buyUpgrade`, `update`) and broadcasts events. Contains no rendering
 * or DOM code, so it is fully unit-testable and portable.
 */
export class GameCore {
  readonly bus = new EventBus();

  private readonly state: GameState;
  private readonly rng: Rng;
  private stats: DerivedStats;

  private readonly statsSystem: StatsSystem;
  private readonly spawn: SpawnSystem;
  private readonly economy: EconomySystem;
  private readonly progression: ProgressionSystem;
  private readonly brainrot: BrainrotSystem;
  private readonly passive: PassiveSystem;

  // Bound so it can be handed to the passive system as a callback.
  private readonly applyDamageBound = (amount: number, isTap: boolean) =>
    this.applyDamage(amount, isTap);

  // Last tenth-of-a-second value broadcast on `bossTick`, so the countdown is
  // emitted ~10/s instead of every frame.
  private lastBossTenth = -1;

  constructor(opts: GameCoreOptions = {}) {
    const seed = opts.seed ?? DEFAULT_SEED;
    this.rng = new Rng(seed);
    this.state = createInitialState(seed);

    this.statsSystem = new StatsSystem(this.state);
    this.spawn = new SpawnSystem(this.state, this.rng);
    this.economy = new EconomySystem(this.state, this.bus);
    this.progression = new ProgressionSystem(this.state, this.bus);
    this.brainrot = new BrainrotSystem(this.state, this.rng, this.bus);
    this.passive = new PassiveSystem();

    this.stats = this.statsSystem.compute();
  }

  /** Spawn the first target and broadcast initial stats. Call once after wiring listeners. */
  start(): void {
    this.recomputeStats();
    if (!this.state.target) this.spawnNext();
  }

  // ---- Commands -----------------------------------------------------------

  tap(): void {
    this.applyDamage(this.stats.tapDamage, true);
  }

  buyUpgrade(id: string): boolean {
    const def = UPGRADES_BY_ID[id];
    if (!def) return false;

    const level = this.state.upgrades[id] ?? 0;
    if (def.maxLevel !== undefined && level >= def.maxLevel) {
      this.bus.emit("upgradeFailed", { id, reason: "max-level" });
      return false;
    }

    const cost = upgradeCost(def, level);
    if (!this.economy.trySpendGold(cost)) {
      this.bus.emit("upgradeFailed", { id, reason: "insufficient-gold" });
      return false;
    }

    this.state.upgrades[id] = level + 1;
    this.bus.emit("upgradePurchased", { id, level: level + 1, cost });
    this.recomputeStats();
    return true;
  }

  /**
   * Travel to a different (unlocked) world. Saves the current world's stage,
   * restores the target world's stage, and spawns a fresh target there.
   * Returns false if the world is unknown, already active, or still locked.
   */
  switchWorld(id: WorldId): boolean {
    if (!WORLDS_BY_ID[id]) return false;
    if (id === this.state.worldId) return false;
    if (!this.state.unlockedWorlds.includes(id)) return false;

    this.state.worldStages[this.state.worldId] = this.state.stage;
    this.state.worldId = id;
    this.state.stage = this.state.worldStages[id] ?? Balance.startingStage;
    // Stage objective + boss/fail state are per active world; reset on travel.
    this.state.stageKills = 0;
    this.state.bossTimer = 0;
    this.state.failedBossStage = null;
    this.lastBossTenth = -1;

    const def = WORLDS_BY_ID[id];
    this.bus.emit("worldChanged", { worldId: id, name: def.name, stage: this.state.stage });
    this.bus.emit("stageChanged", { stage: this.state.stage });

    // Spawn a fresh target in the new world right away.
    this.state.target = null;
    this.state.respawnTimer = 0;
    this.spawnNext();
    return true;
  }

  /** Advance the boss timer, passive damage, and the respawn timer. `dt` is seconds. */
  update(dt: number): void {
    if (dt <= 0) return;
    // A pending Lucky Block reveal freezes the whole sim (no passive damage,
    // no respawn) so the summon takeover plays uninterrupted behind the overlay.
    if (this.state.revealPending) return;
    this.tickBoss(dt);
    this.tickRespawn(dt);
    this.passive.update(dt, this.stats.passiveDps, this.applyDamageBound);
  }

  /** Toggle auto-progress. Turning it on clears a pending normal stage immediately. */
  setAutoProgress(on: boolean): void {
    if (this.state.autoProgress === on) return;
    this.state.autoProgress = on;
    this.bus.emit("autoProgressChanged", { on });
    if (on && this.progression.tryAdvanceNormal()) {
      this.state.target = null;
      this.state.respawnTimer = 0;
      this.spawnNext();
    }
  }

  /**
   * Re-enter the boss stage the player last failed and spawn a fresh boss with a
   * full timer. Returns false if there is no failed boss to retry.
   */
  retryBoss(): boolean {
    const stage = this.state.failedBossStage;
    if (stage == null) return false;
    this.state.stage = stage;
    this.state.worldStages[this.state.worldId] = stage;
    this.state.stageKills = 0;
    this.state.target = null;
    this.state.respawnTimer = 0;
    this.bus.emit("stageChanged", { stage });
    this.bus.emit("stageEntered", {
      stage,
      worldName: WORLDS_BY_ID[this.state.worldId].name,
      isBoss: true,
    });
    this.spawnNext();
    return true;
  }

  /**
   * Finish a Lucky Block reveal: unpause the sim and start the respawn timer so
   * the next target spawns. Called by the reveal overlay on tap-to-continue.
   * No-op if no reveal is pending.
   */
  resolveReveal(): void {
    if (!this.state.revealPending) return;
    this.state.revealPending = false;
    // The Lucky Block counted as a stage kill; if it cleared the stage, advance
    // now that the reveal is done so the next spawn lands on the new stage.
    this.progression.tryAdvanceNormal();
    this.state.respawnTimer = Balance.respawn.delay;
  }

  /** Count down the active boss timer; a fail drops the player back a stage. */
  private tickBoss(dt: number): void {
    const target = this.state.target;
    if (!target || !target.isBoss || this.state.bossTimer <= 0) return;

    this.state.bossTimer -= dt;
    if (this.state.bossTimer <= 0) {
      this.state.bossTimer = 0;
      this.state.target = null;
      this.lastBossTenth = -1;
      this.bus.emit("bossTick", { remaining: 0, total: Balance.stage.bossTimer });
      this.progression.bossFailed();
      // Spawn the previous (farming) stage's enemy after the usual gap.
      this.state.respawnTimer = Balance.respawn.delay;
      return;
    }
    this.maybeEmitBossTick();
  }

  /** Broadcast the boss countdown at ~10/s (when the displayed tenth changes). */
  private maybeEmitBossTick(): void {
    const tenth = Math.ceil(this.state.bossTimer * 10);
    if (tenth === this.lastBossTenth) return;
    this.lastBossTenth = tenth;
    this.bus.emit("bossTick", {
      remaining: this.state.bossTimer,
      total: Balance.stage.bossTimer,
    });
  }

  private tickRespawn(dt: number): void {
    if (this.state.respawnTimer <= 0) return;
    this.state.respawnTimer -= dt;
    if (this.state.respawnTimer <= 0) {
      this.state.respawnTimer = 0;
      this.spawnNext();
    }
  }

  // ---- Internal flow ------------------------------------------------------

  private applyDamage(amount: number, isTap: boolean): void {
    const target = this.state.target;
    if (!target || amount <= 0) return;

    target.health -= amount;
    const shownHealth = Math.max(target.health, 0);
    this.bus.emit("targetDamaged", {
      amount,
      isTap,
      health: shownHealth,
      maxHealth: target.maxHealth,
    });

    if (target.health <= 0) this.handleBreak(target);
  }

  private handleBreak(target: TargetState): void {
    this.bus.emit("targetBroken", {
      kind: target.kind,
      rarity: target.rarity,
      name: target.name,
    });

    this.state.target = null;

    if (target.kind === "enemy") {
      this.state.enemiesDefeated += 1;
      this.progression.registerKill();

      if (target.isBoss) {
        // Boss kills are not part of the Lucky Block pity stream (Lucky Blocks
        // never spawn on boss stages), so they don't bump `killsSinceLucky`.
        const gold = this.economy.awardKillGold(this.stats.goldMultiplier, true);
        this.state.bossTimer = 0;
        this.lastBossTenth = -1;
        this.bus.emit("bossDefeated", { stage: this.state.stage, gold });
        this.progression.bossSucceeded();
      } else {
        this.state.killsSinceLucky += 1;
        this.economy.awardKillGold(this.stats.goldMultiplier);
        this.progression.tryAdvanceNormal();
      }

      // Wait a beat so the death frame + coin burst can be felt; the next
      // target spawns once `respawnTimer` elapses in `update`.
      this.state.respawnTimer = Balance.respawn.delay;
    } else {
      this.state.luckyBlocksBroken += 1;
      // A Lucky Block counts as a stage kill; the advance check happens once the
      // reveal resolves (see `resolveReveal`).
      this.progression.registerKill();
      this.brainrot.grantReward(target.rarity);
      // Brainrot ownership changed -> stats must refresh.
      this.recomputeStats();
      // Pause the sim and hold for the summon reveal; the respawn timer starts
      // only once the reveal is resolved (see `resolveReveal`).
      this.state.revealPending = true;
    }
  }

  private spawnNext(): void {
    const { target, isLucky } = this.spawn.spawnNext(this.stats.luckyChance);
    if (target.isBoss) {
      this.state.bossTimer = Balance.stage.bossTimer;
      this.lastBossTenth = -1;
    }
    this.bus.emit("targetSpawned", { target, isLucky });
    this.progression.emitProgress();
    if (target.isBoss) this.maybeEmitBossTick();
  }

  private recomputeStats(): void {
    this.stats = this.statsSystem.compute();
    this.bus.emit("statsChanged", this.stats);
  }

  // ---- Read access (presentation + debug) --------------------------------

  getStats(): DerivedStats {
    return this.stats;
  }

  /** Read-only view of the live state (do not mutate). */
  getState(): Readonly<GameState> {
    return this.state;
  }

  getSnapshot() {
    const ownedBrainrots = Object.keys(this.state.brainrots).length;
    return {
      gold: this.state.gold,
      gems: this.state.gems,
      worldId: this.state.worldId,
      worldName: WORLDS_BY_ID[this.state.worldId].name,
      unlockedWorlds: [...this.state.unlockedWorlds],
      stage: this.state.stage,
      target: this.state.target ? { ...this.state.target } : null,
      revealPending: this.state.revealPending,
      stats: { ...this.stats },
      enemiesDefeated: this.state.enemiesDefeated,
      luckyBlocksBroken: this.state.luckyBlocksBroken,
      killsSinceLucky: this.state.killsSinceLucky,
      stageKills: this.state.stageKills,
      stageRequired: this.progression.required,
      isBossStage: isBossStage(this.state.stage),
      bossTimer: this.state.bossTimer,
      autoProgress: this.state.autoProgress,
      failedBossStage: this.state.failedBossStage,
      ownedBrainrots,
      discoveredItems: this.state.discoveredItems.length,
    };
  }

  /** World list with travel/unlock status for the Map UI. */
  getWorlds(): {
    id: WorldId;
    name: string;
    theme: string;
    stage: number;
    unlocked: boolean;
    current: boolean;
    unlockHint?: string;
  }[] {
    return WORLDS.map((w) => {
      const unlocked = this.state.unlockedWorlds.includes(w.id);
      const stage =
        w.id === this.state.worldId
          ? this.state.stage
          : this.state.worldStages[w.id] ?? Balance.startingStage;
      let unlockHint: string | undefined;
      if (!unlocked && w.unlock) {
        const from = WORLDS_BY_ID[w.unlock.afterWorld];
        unlockHint = `Reach Stage ${w.unlock.stage} in ${from.name}`;
      }
      return {
        id: w.id,
        name: w.name,
        theme: w.theme,
        stage,
        unlocked,
        current: w.id === this.state.worldId,
        unlockHint,
      };
    });
  }

  getUpgradeCost(id: string): number | null {
    const def = UPGRADES_BY_ID[id];
    if (!def) return null;
    return upgradeCost(def, this.state.upgrades[id] ?? 0);
  }

  getUpgradeLevel(id: string): number {
    return this.state.upgrades[id] ?? 0;
  }

  // ---- Debug helpers (used by the browser debug API + tests) -------------

  /** Force the current target to become a Lucky Block (debug/testing). */
  debugSpawnLucky(): void {
    const max = luckyHealthForStage(this.state.stage);
    this.state.target = {
      kind: "lucky",
      rarity: "epic",
      name: "Lucky Block",
      maxHealth: max,
      health: max,
    };
    this.state.killsSinceLucky = 0;
    this.state.respawnTimer = 0;
    this.bus.emit("targetSpawned", { target: this.state.target, isLucky: true });
  }

  /** Force a normal enemy at the current stage (debug/testing). */
  debugSpawnEnemy(): void {
    const max = enemyHealthForStage(this.state.stage);
    const enemy = ENEMIES[0];
    this.state.target = {
      kind: "enemy",
      rarity: "common",
      name: enemy.name,
      maxHealth: max,
      health: max,
      enemyId: enemy.id,
    };
    this.state.respawnTimer = 0;
    this.bus.emit("targetSpawned", { target: this.state.target, isLucky: false });
    this.progression.emitProgress();
  }

  /** Force a boss enemy at the current stage with a full timer (debug/testing). */
  debugSpawnBoss(): void {
    const max = bossHealthForStage(this.state.stage);
    const enemy = ENEMIES[0];
    this.state.target = {
      kind: "enemy",
      rarity: "legendary",
      name: enemy.name,
      maxHealth: max,
      health: max,
      enemyId: enemy.id,
      isBoss: true,
    };
    this.state.respawnTimer = 0;
    this.state.bossTimer = Balance.stage.bossTimer;
    this.lastBossTenth = -1;
    this.bus.emit("targetSpawned", { target: this.state.target, isLucky: false });
    this.progression.emitProgress();
    this.maybeEmitBossTick();
  }

  debugAddGold(amount: number): void {
    this.economy.addGold(amount);
  }

  /** Instantly destroy the current target (debug/testing); runs full break flow. */
  debugKillTarget(): void {
    if (this.state.target) this.applyDamage(this.state.target.health, false);
  }

  /**
   * Skip the cosmetic respawn gap and spawn the next target immediately
   * (debug/testing) so flows stay deterministic without simulating the delay.
   */
  debugAdvanceRespawn(): void {
    // A pending reveal would otherwise pause everything; clear it so headless
    // flows (tests) don't soft-lock waiting for a tap-to-continue.
    this.state.revealPending = false;
    if (this.state.respawnTimer > 0 || !this.state.target) {
      this.state.respawnTimer = 0;
      if (!this.state.target) this.spawnNext();
    }
  }

  /** Resolve a pending Lucky Block reveal (debug/testing). */
  debugResolveReveal(): void {
    this.resolveReveal();
  }

  /** Run `seconds` of passive simulation in fixed steps (debug/testing). */
  debugFastForward(seconds: number, step = 0.1): void {
    let remaining = seconds;
    while (remaining > 0) {
      this.update(Math.min(step, remaining));
      remaining -= step;
    }
  }

  get pityThreshold(): number {
    return Balance.lucky.pity;
  }
}
