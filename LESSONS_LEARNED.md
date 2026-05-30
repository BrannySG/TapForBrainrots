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
- Roadblock: A full-screen FX overlay stole all taps/clicks. The id-based rule `#ui-root > * { pointer-events: auto }` (specificity 0,1,0,0) overrode the `.fx-layer { pointer-events: none }` class rule (0,0,1,0).
- Solution: Removed the blanket id-child rule; made `#ui-root` click-through and opted only genuinely interactive regions (`.bottom-nav`, `.pill`, `.panel-backdrop.open`) back into pointer events.
- Prevention: Don't use high-specificity id descendant selectors to set `pointer-events: auto` broadly; scope pointer-events to interactive elements only, and keep overlays click-through.

- Date: 2026-05-30
- Roadblock: Integration tests that "tapped to break" targets timed out because chest health grows exponentially with stage while tap damage is linear.
- Solution: Added a deterministic `debugKillTarget()` to GameCore and used it in test helpers instead of looping `tap()`.
- Prevention: For headless loop sims, drive state changes through deterministic debug commands, not through scaling-dependent player actions.
