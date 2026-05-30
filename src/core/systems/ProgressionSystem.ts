import type { GameState } from "../state/GameState";
import type { EventBus } from "../events/EventBus";
import { WORLDS, WORLDS_BY_ID } from "../config/worlds";
import { Balance, isBossStage } from "../config/balance";

/**
 * Stage progression. Normal stages require a fixed number of kills before the
 * player advances; every Nth stage is a boss DPS check. Lucky Blocks count as a
 * stage kill on normal stages. Stage progress is tracked per world, and reaching
 * a world's unlock milestone makes the next world available to travel to.
 *
 * This system owns the state transitions only; the boss timer + spawn timing
 * live in `GameCore`, which calls into here on the relevant beats.
 */
export class ProgressionSystem {
  constructor(
    private readonly state: GameState,
    private readonly bus: EventBus
  ) {}

  /** Kills required to clear the current stage (1 for boss stages). */
  get required(): number {
    return isBossStage(this.state.stage) ? 1 : Balance.stage.killsPerStage;
  }

  /** Count a kill toward the current stage objective and broadcast progress. */
  registerKill(): void {
    this.state.stageKills += 1;
    this.emitProgress();
  }

  /** Broadcast the current stage objective progress (e.g. on spawn). */
  emitProgress(): void {
    this.bus.emit("stageProgress", {
      kills: this.state.stageKills,
      required: this.required,
      isBoss: isBossStage(this.state.stage),
    });
  }

  /**
   * Advance a normal stage if its kill objective is met and auto-progress is on.
   * Returns true if the stage advanced. No-op on boss stages (bosses advance via
   * `bossSucceeded`).
   */
  tryAdvanceNormal(): boolean {
    if (isBossStage(this.state.stage)) return false;
    if (this.state.stageKills < Balance.stage.killsPerStage) return false;
    if (!this.state.autoProgress) return false;
    this.advanceStage();
    return true;
  }

  /** Boss defeated before the timer expired: clear the fail flag and advance. */
  bossSucceeded(): void {
    this.state.failedBossStage = null;
    this.advanceStage();
  }

  /**
   * Boss timer expired with the boss alive: remember the failed boss, drop back
   * to the previous (farming) stage, and disable auto-progress so the player can
   * power up and Retry Boss when ready.
   */
  bossFailed(): void {
    const failed = this.state.stage;
    this.state.failedBossStage = failed;
    this.state.bossTimer = 0;
    this.state.stage = Math.max(Balance.startingStage, failed - 1);
    this.state.worldStages[this.state.worldId] = this.state.stage;
    this.state.stageKills = 0;
    this.state.autoProgress = false;

    this.bus.emit("bossFailed", { stage: failed });
    this.bus.emit("autoProgressChanged", { on: false });
    this.bus.emit("stageChanged", { stage: this.state.stage });
    this.emitStageEntered();
  }

  /** Move forward one stage and reset the per-stage kill count. */
  advanceStage(): void {
    this.state.stage += 1;
    this.state.stageKills = 0;
    this.state.worldStages[this.state.worldId] = this.state.stage;
    this.bus.emit("stageChanged", { stage: this.state.stage });
    this.emitStageEntered();
    this.checkUnlocks();
  }

  private emitStageEntered(): void {
    this.bus.emit("stageEntered", {
      stage: this.state.stage,
      worldName: WORLDS_BY_ID[this.state.worldId].name,
      isBoss: isBossStage(this.state.stage),
    });
  }

  /** Unlock any world whose milestone is met by the current world's stage. */
  private checkUnlocks(): void {
    for (const world of WORLDS) {
      const req = world.unlock;
      if (!req) continue;
      if (this.state.unlockedWorlds.includes(world.id)) continue;
      if (req.afterWorld === this.state.worldId && this.state.stage >= req.stage) {
        this.state.unlockedWorlds.push(world.id);
        this.bus.emit("worldUnlocked", { worldId: world.id, name: world.name });
      }
    }
  }
}
