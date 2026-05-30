import type { Rarity, TargetKind, TargetState, DerivedStats } from "../types";

/**
 * The full set of events the game core can emit. Presentation layers (render,
 * UI, FX) subscribe to these; the core never knows who is listening. This is
 * the seam that decouples game logic from visuals/polish.
 */
export interface GameEventMap {
  targetSpawned: { target: TargetState; isLucky: boolean };
  targetDamaged: {
    amount: number;
    isTap: boolean;
    health: number;
    maxHealth: number;
  };
  targetBroken: { kind: TargetKind; rarity: Rarity; name: string };
  itemDropped: {
    name: string;
    rarity: Rarity;
    sellValue: number;
    isNew: boolean;
  };
  goldChanged: { gold: number; delta: number };
  gemsChanged: { gems: number; delta: number };
  upgradePurchased: { id: string; level: number; cost: number };
  upgradeFailed: { id: string; reason: "insufficient-gold" | "max-level" };
  stageChanged: { stage: number };
  luckyReveal: {
    brainrotId: string;
    name: string;
    rarity: Rarity;
    isNew: boolean;
    level: number;
    /** Brainrot ids the reveal carousel can cycle through for anticipation. */
    candidates: string[];
  };
  brainrotGained: {
    id: string;
    name: string;
    rarity: Rarity;
    level: number;
    isNew: boolean;
  };
  statsChanged: DerivedStats;
}

export type GameEventName = keyof GameEventMap;
export type GameEventHandler<K extends GameEventName> = (
  payload: GameEventMap[K]
) => void;

/** Minimal typed pub/sub. No external deps so it ports easily. */
export class EventBus {
  private handlers: {
    [K in GameEventName]?: Set<GameEventHandler<K>>;
  } = {};

  on<K extends GameEventName>(event: K, handler: GameEventHandler<K>): () => void {
    let set = this.handlers[event] as Set<GameEventHandler<K>> | undefined;
    if (!set) {
      set = new Set();
      this.handlers[event] = set as never;
    }
    set.add(handler);
    return () => this.off(event, handler);
  }

  off<K extends GameEventName>(event: K, handler: GameEventHandler<K>): void {
    (this.handlers[event] as Set<GameEventHandler<K>> | undefined)?.delete(
      handler
    );
  }

  emit<K extends GameEventName>(event: K, payload: GameEventMap[K]): void {
    const set = this.handlers[event] as Set<GameEventHandler<K>> | undefined;
    if (!set) return;
    // Copy to allow handlers to unsubscribe during dispatch.
    for (const handler of [...set]) handler(payload);
  }

  clear(): void {
    this.handlers = {};
  }
}
