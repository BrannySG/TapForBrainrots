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
  chestHealthForStage,
  luckyHealthForStage,
} from "./config/balance";
import { UPGRADES_BY_ID, upgradeCost } from "./config/upgrades";

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

  constructor(opts: GameCoreOptions = {}) {
    const seed = opts.seed ?? DEFAULT_SEED;
    this.rng = new Rng(seed);
    this.state = createInitialState(seed);

    this.statsSystem = new StatsSystem(this.state);
    this.spawn = new SpawnSystem(this.state, this.rng);
    this.economy = new EconomySystem(this.state, this.rng, this.bus);
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

  /** Advance passive damage. `dt` is seconds. */
  update(dt: number): void {
    if (dt <= 0) return;
    this.passive.update(dt, this.stats.passiveDps, this.applyDamageBound);
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

    if (target.kind === "chest") {
      this.economy.dropAndSell(target.rarity, this.stats.goldMultiplier);
      this.state.totalChestsBroken += 1;
      this.state.chestsBrokenSinceLucky += 1;
      this.progression.advanceStage();
    } else {
      this.state.luckyBlocksBroken += 1;
      this.brainrot.grantReward(target.rarity);
      // Brainrot ownership changed -> stats must refresh.
      this.recomputeStats();
    }

    this.spawnNext();
  }

  private spawnNext(): void {
    const { target, isLucky } = this.spawn.spawnNext(this.stats.luckyChance);
    this.bus.emit("targetSpawned", { target, isLucky });
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
      stage: this.state.stage,
      target: this.state.target ? { ...this.state.target } : null,
      stats: { ...this.stats },
      totalChestsBroken: this.state.totalChestsBroken,
      luckyBlocksBroken: this.state.luckyBlocksBroken,
      chestsBrokenSinceLucky: this.state.chestsBrokenSinceLucky,
      ownedBrainrots,
      discoveredItems: this.state.discoveredItems.length,
    };
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
    this.state.chestsBrokenSinceLucky = 0;
    this.bus.emit("targetSpawned", { target: this.state.target, isLucky: true });
  }

  /** Force a normal chest at the current stage (debug/testing). */
  debugSpawnChest(): void {
    const max = chestHealthForStage(this.state.stage);
    this.state.target = {
      kind: "chest",
      rarity: "common",
      name: "Chest",
      maxHealth: max,
      health: max,
    };
    this.bus.emit("targetSpawned", { target: this.state.target, isLucky: false });
  }

  debugAddGold(amount: number): void {
    this.economy.addGold(amount);
  }

  /** Instantly destroy the current target (debug/testing); runs full break flow. */
  debugKillTarget(): void {
    if (this.state.target) this.applyDamage(this.state.target.health, false);
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
