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
- Roadblock: Over-engineered the cove background (generate 3 layers -> Pillow compositing -> seam/feather tuning) because the image generator only outputs 3:2 landscape and the frame is 9:16; chasing seamless joins wasted effort and the user just supplied a finished 9:16 image.
- Solution: Dropped all generation/compositing. Copied the provided `Available Assets/Backgrounds/T_BackgroundImage_Cove.jpg` to `src/assets/backgrounds/castaway_cove/castaway_cove.jpg`, kept the simple single-image `Background` (one `#bg-image`, cover, world-aware), and deleted the scratch scripts/intermediate layer JPGs.
- Prevention: For full-frame world art, prefer a single correctly-sized (9:16) source image over compositing AI tiles. Ask for / check `Available Assets` for a ready portrait background before generating. Also: when the Cursor browser shows a blank/white frame after a dev-server restart, it's a stale GL/compositor state - a cache-busting reload fixes it (the DOM/CDP was fine).

- Date: 2026-05-30
- Roadblock: A runtime multi-layer background with pointer parallax felt bad on a tap-to-play game (cursor drag moved the world) and the layered look didn't read as intended; we needed a single cohesive image with the beach where the enemy stands.
- Solution: Baked the three landscape layers into ONE 1080x1920 portrait JPG (`scripts/compose_background.py`): extend sky upward (sky->sky), place the cove so the waterline sits ~60% down, and colour-match + long-fade the foreground sand onto the beach so the joins are seamless. Background is now one static `#bg-image` (cover), no parallax/masks.
- Prevention: For tap/clicker games, avoid pointer-driven background parallax (it competes with the tap input and feels wrong). When compositing separately-generated AI images, only join within the same tonal family (sky->sky, sand->sand) and colour-match before blending; never vertically stretch a strip that contains props (it smears into streaks).

- Date: 2026-05-30
- Roadblock: The image generator returns landscape (3:2) frames even when asked for a 9:16 portrait, which doesn't fit the tall game frame and would crop away the edge framing if force-cropped.
- Solution: Treated the layers as horizontal bands stacked in the portrait frame (far sky band on top, mid cove band, near foreground band) and feathered them with CSS `mask-image` gradients; opaque JPGs are fine since masks/oversize handle blending and parallax has no edge gaps.
- Prevention: Plan world backgrounds as banded/parallax layers (not one portrait image); prompt for "open/calm center, scenery framed at left/right" so the playable center stays readable, and oversize each layer (~110-116%) so parallax never reveals edges.

- Date: 2026-05-30
- Roadblock: Chaining validation commands with `&&` failed in this shell ("token '&&' is not a valid statement separator"), which blocked running typecheck then tests in one step.
- Solution: Used a PowerShell-compatible sequence: run `npm run typecheck`, then gate the test command with `$LASTEXITCODE`.
- Prevention: On this Windows setup, prefer `; if ($LASTEXITCODE -eq 0) { ... }` for dependent command chains instead of `&&`.

- Date: 2026-05-30
- Roadblock: Verifying the lucky-block reveal in a backgrounded Cursor browser tab: the rAF-driven `GameLoop` is throttled/paused when the tab isn't focused, so passive damage + respawn never advanced and the next target stayed null after `resolveReveal`.
- Solution: Drive deterministic state via the `window.__GAME` debug API (`advanceRespawn`) instead of waiting on rAF; setTimeout-based flows (the reveal cycle) still run, but anything in the rAF loop won't.
- Prevention: For headless/background browser checks, assert state through debug commands, not by waiting on the real-time game loop.

- Date: 2026-05-30
- Roadblock: A test that broke a lucky block then `fastForward`ed expected a target to exist, but the freshly granted brainrot's passive DPS broke the new chest and left the sim on a respawn gap (target null) - flaky.
- Solution: Assert the next spawn via the `targetSpawned` event (subscribed after `resolveReveal`) rather than snapshotting `target` after an arbitrary fast-forward.
- Prevention: When passive damage can race a time-advance in tests, assert on events, not on a post-delay state snapshot.

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
