# Lessons Learned

Keep entries brief and practical. Review this file before planning or implementing any change.

## Entry Format

- Date:
- Roadblock:
- Solution:
- Prevention:

## Entries

<!-- Add newest entries at the top. -->

- Date: 2026-05-30
- Roadblock: `python` is not on PATH on this Windows machine (the Microsoft Store alias shadows it), and numpy isn't installed; the integrated shell also returned "no exit status" until it warmed up.
- Solution: Use the `py` launcher for Python; did sprite-sheet extraction with pure Pillow (alpha projection profiles + `getbbox`) so no numpy/ImageMagick needed. Re-run a trivial `echo` first if the shell reports no exit status.
- Prevention: Prefer `py` over `python` here; avoid numpy/scipy-only approaches for asset scripts; warm the shell with a no-op before relying on output.

- Date: 2026-05-30
- Roadblock: Adding a "Grasslands" world meant introducing a world dimension the code never had (single global `stage` + one flat `ITEMS` pool), touching state/economy/progression/UI.
- Solution: Added `WorldId` + `worlds.ts` config, per-world stage tracks in `GameState` (`worldStages`, `unlockedWorlds`), `GameCore.switchWorld`, `worldChanged`/`worldUnlocked` events, a `MapPanel`, and pool selection via `worldItems(state.worldId)`. No save migration needed (no persistence yet).
- Prevention: When a GDD feature (worlds) isn't yet modeled in code, confirm world identity/unlock/stage-tracking decisions before building, and keep loot pools behind a per-world lookup from day one.

- Date: 2026-05-30
- Roadblock: Lucky Block FBX rendered muddy brown because the base-color map is a vertical-strip palette atlas and the loader forced `texture.flipY = false`, sampling the wrong palette rows.
- Solution: Set `texture.flipY = true` in `AssetLoader.loadLuckyBlock`; block now renders correct red body / white wings / face.
- Prevention: For palette/atlas textures, verify `flipY` in-browser per asset; don't assume FBX always needs `flipY = false`.

- Date: 2026-05-30
- Roadblock: Browser verification was unreliable - stray pointer events kept tapping the canvas and breaking the spawned target between CDP calls (HUD showed a respawned chest while state said lucky).
- Solution: `browser_lock` before driving the game via `window.__GAME`, then unlock when done.
- Prevention: Lock the Cursor browser during deterministic `__GAME` verification so ambient input can't mutate state mid-check.

- Date: 2026-05-30
- Roadblock: A full-screen FX overlay stole all taps/clicks. The id-based rule `#ui-root > * { pointer-events: auto }` (specificity 0,1,0,0) overrode the `.fx-layer { pointer-events: none }` class rule (0,0,1,0).
- Solution: Removed the blanket id-child rule; made `#ui-root` click-through and opted only genuinely interactive regions (`.bottom-nav`, `.pill`, `.panel-backdrop.open`) back into pointer events.
- Prevention: Don't use high-specificity id descendant selectors to set `pointer-events: auto` broadly; scope pointer-events to interactive elements only, and keep overlays click-through.

- Date: 2026-05-30
- Roadblock: Integration tests that "tapped to break" targets timed out because chest health grows exponentially with stage while tap damage is linear.
- Solution: Added a deterministic `debugKillTarget()` to GameCore and used it in test helpers instead of looping `tap()`.
- Prevention: For headless loop sims, drive state changes through deterministic debug commands, not through scaling-dependent player actions.
