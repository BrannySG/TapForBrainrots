# Brainrot Idle Clicker (V0)

A 3D, mobile-first (vertical 9:16) idle clicker built for the web with
**Vite + TypeScript + Three.js**. V0 implements the core loop, Lucky Blocks,
and Brainrots. See `IMPORTANT_GAME_GDD.md` for the full design.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

Append `?seed=42` to the URL for a deterministic run (handy for testing).

## Scripts

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the Vite dev server                |
| `npm run build`     | Type-check + production build to `dist/` |
| `npm run preview`   | Preview the production build             |
| `npm test`          | Run the headless Vitest suite            |
| `npm run typecheck` | Type-check only                          |

## Architecture

The project is split so game logic is fully decoupled from presentation. This
keeps polish (screenshake/animations) separate from rules and makes the core
portable (e.g. to a Unity C# port).

```
src/
  core/      Pure TypeScript game logic. No Three.js, no DOM.
    config/  All balance tunables + content (loot, brainrots, upgrades).
    events/  Typed EventBus (the only outward channel from the core).
    rng/     Seedable deterministic PRNG.
    state/   Serializable GameState.
    systems/ Stats, Spawn, Economy, Progression, Brainrot, Passive.
    GameCore.ts  Command API (tap/buyUpgrade/update) + orchestration.
  render/    Three.js scene: single hero object on a transparent background.
  ui/        DOM/CSS HUD, target label, health bar, bottom nav, shop panel.
  fx/        Event-driven "juice" (toggleable, zero impact on logic).
  app/       bootstrap, game loop, and the window.__GAME debug API.
tests/       Seeded headless tests for the core.
```

Data flow: UI sends commands to `GameCore`; the core mutates `GameState` and
emits events; `render`, `ui`, and `fx` subscribe and react. Nothing outside the
core mutates state.

## Testing & validation

- **Headless:** `npm test` runs deterministic, seeded tests over the pure core.
- **Browser:** with `npm run dev` running, open `http://localhost:5173/?seed=42`
  and drive the game via the `window.__GAME` debug API:

```js
__GAME.snapshot();        // read current state
__GAME.stats();           // derived stats
__GAME.tap(10);           // tap 10 times
__GAME.addGold(1000);     // grant gold
__GAME.buy("stronger_taps");
__GAME.spawnLucky();      // force a Lucky Block
__GAME.kill();            // destroy the current target
__GAME.fastForward(30);   // simulate 30s of passive damage
__GAME.setFx(false);      // disable juice (logic unaffected)
```

## Assets

Production assets are copied (never moved) from `Available Assets/` into
`src/assets/`: the Lucky Block FBX + texture and UI icons. The chest is a
placeholder primitive pending real art.

## Deployment (GitHub Pages)

`vite.config.ts` uses a relative `base` (`./`), so the build works on any Pages
subpath without further configuration. Pushing to the default branch triggers
`.github/workflows/deploy.yml`, which builds and publishes `dist/` to Pages
(enable Pages -> "GitHub Actions" in the repo settings once).
