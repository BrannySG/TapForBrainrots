import type { GameCore } from "../core/GameCore";
import type { Juice } from "../fx/Juice";

/**
 * Exposes `window.__GAME` so automated tooling (the Cursor Browser tool / CDP)
 * and humans can inspect and drive the game deterministically without clicking.
 */
export interface DebugApi {
  core: GameCore;
  snapshot: () => ReturnType<GameCore["getSnapshot"]>;
  stats: () => ReturnType<GameCore["getStats"]>;
  tap: (times?: number) => void;
  buy: (upgradeId: string) => boolean;
  spawnLucky: () => void;
  spawnChest: () => void;
  kill: () => void;
  addGold: (amount: number) => void;
  fastForward: (seconds: number) => void;
  setFx: (enabled: boolean) => void;
  pity: number;
}

declare global {
  interface Window {
    __GAME?: DebugApi;
  }
}

export function installDebugApi(core: GameCore, juice: Juice): DebugApi {
  const api: DebugApi = {
    core,
    snapshot: () => core.getSnapshot(),
    stats: () => core.getStats(),
    tap: (times = 1) => {
      for (let i = 0; i < times; i++) core.tap();
    },
    buy: (upgradeId: string) => core.buyUpgrade(upgradeId),
    spawnLucky: () => core.debugSpawnLucky(),
    spawnChest: () => core.debugSpawnChest(),
    kill: () => core.debugKillTarget(),
    addGold: (amount: number) => core.debugAddGold(amount),
    fastForward: (seconds: number) => core.debugFastForward(seconds),
    setFx: (enabled: boolean) => {
      juice.enabled = enabled;
    },
    pity: core.pityThreshold,
  };
  window.__GAME = api;
  return api;
}
