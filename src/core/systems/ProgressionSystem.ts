import type { GameState } from "../state/GameState";
import type { EventBus } from "../events/EventBus";

/**
 * Stage progression. In V0 each broken chest pushes the player one stage
 * forward (Lucky Blocks do not advance stages).
 */
export class ProgressionSystem {
  constructor(
    private readonly state: GameState,
    private readonly bus: EventBus
  ) {}

  advanceStage(): void {
    this.state.stage += 1;
    this.bus.emit("stageChanged", { stage: this.state.stage });
  }
}
