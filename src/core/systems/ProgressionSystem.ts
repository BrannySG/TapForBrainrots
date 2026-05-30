import type { GameState } from "../state/GameState";
import type { EventBus } from "../events/EventBus";
import { WORLDS } from "../config/worlds";

/**
 * Stage progression. Each broken chest pushes the player one stage forward in
 * the current world (Lucky Blocks do not advance stages). Stage progress is
 * tracked per world, and reaching a world's unlock milestone makes the next
 * world available to travel to.
 */
export class ProgressionSystem {
  constructor(
    private readonly state: GameState,
    private readonly bus: EventBus
  ) {}

  advanceStage(): void {
    this.state.stage += 1;
    this.state.worldStages[this.state.worldId] = this.state.stage;
    this.bus.emit("stageChanged", { stage: this.state.stage });
    this.checkUnlocks();
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
