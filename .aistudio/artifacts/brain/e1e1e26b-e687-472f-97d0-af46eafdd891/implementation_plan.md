# Project Orion — Modular System Isolation & Multi-State Architecture Plan

## 1. Core Architectural Rules
1. **Isolation of Systems, Not Content**:
   - World areas (such as `M00 — The Bog` and `Border Town Slums`), rooms, tiles, enemies, items, and weapons are permanent **gameworld content** living in `src/cartridges/orion/database/`.
   - Areas are only "tutorial areas" **while the tutorial state is active**. When the tutorial state is inactive (or after completion), those exact same areas function as standard gameworld zones.
2. **Multi-Gate State Architecture**:
   - Level progression is only one gate. The cartridge tracks multiple distinct state domains (World/Campaign Phase, Progression & Slot Gates, Narrative/World Flags, and Area/Anchor State) to determine how systems and rooms behave at any moment.

---

## 2. Isolated System Modules (`src/cartridges/orion/systems/`)

### A. Multi-Domain State & Gate System (`systems/stateSystem.ts`)
Centralizes all state gates on `OrionState` and provides clean selectors/mutators:
1. **System Mode / Phase Gate (`state.mode`)**:
   - Tracks whether `tutorial` state is active (`tutorialActive: boolean`, `tutorialStep: string`), alongside world states like `incursionEnabled: boolean`.
2. **Progression & Hardware Slot Gate (`state.gates`)**:
   - Tracks unlocked mech slots and combat capabilities derived from `state.level` (Levels 1–20), equipped chassis parts (`hasBoosterKit`, generator, optics), and active overrides:
     - `maxWeaponSlots` (`1` $\rightarrow$ `2` $\rightarrow$ `4`)
     - `unlockedSkillSlots` (`[0]` $\rightarrow$ `[0,1,2]` $\rightarrow$ `[0,1,2,3,4]`)
     - `canBoosterDash`, `canWeaponSwap`, `heatSystemActive`, `energySystemActive`
3. **World & Narrative Flags (`state.flags: Record<string, boolean | number | string>`)**:
   - Tracks persistent world state flags (e.g., setpiece states, boss defeats, gate unlocks, discovered anchors) independently of tutorial status.
4. **Spawn & Area State (`state.spawnAnchor`)**:
   - Tracks `{ areaId, room, x, y }` dynamically whenever the player syncs at any Drop-Pod / Spawn Anchor (`D`).

### B. Generic World & Interaction System (`systems/worldSystem.ts`)
Replaces all hardcoded M00 checks in `orionCartridge.ts` and `OrionHud.tsx`:
- Reads room layouts, room titles, biome palettes, and interactive anchors (`D`, `S`, `C`, `G`) from the unified `database/world/` definitions.
- Evaluates anchor prompts and interactions against the current multi-domain state (so an anchor in `M00 — The Bog` can trigger tutorial-state onboarding when `tutorialActive` is true, or standard world behavior when `tutorialActive` is false).
- Handles death and reboot using `state.spawnAnchor` instead of hardcoded coordinates.

### C. Isolated Tutorial System (`systems/tutorialSystem.ts`)
A dedicated **system module** (containing zero hardcoded map geometry) that only runs when `state.tutorialActive === true`:
- Observes player state transitions, applies tutorial-specific gate locks or onboarding prompts, and advances `state.tutorialStep`.
- Can be toggled on/off cleanly via state (e.g., from the `[START]` menu or upon tutorial completion) without affecting `worldSystem.ts`, `combat.ts`, or `physics.ts`.

---

## 3. Files to Create / Refactor (Upon Approval)
1. **Create `src/cartridges/orion/systems/stateSystem.ts`**: Multi-gate state definitions, capability computation, and flag helpers.
2. **Create `src/cartridges/orion/systems/tutorialSystem.ts`**: Isolated tutorial state machine and onboarding logic (active only during tutorial state).
3. **Create `src/cartridges/orion/systems/worldSystem.ts`**: Generic room metadata lookup, dynamic `spawnAnchor` respawn handler, and state-driven anchor interaction dispatcher.
4. **Create `src/cartridges/orion/systems/index.ts`**: Clean barrel export for all isolated cartridge systems.
5. **Refactor `orionCartridge.ts`, `combat.ts`, & `ui/OrionHud.tsx`**: Strip out hardcoded room strings and M00 logic, delegating to `stateSystem`, `worldSystem`, and `tutorialSystem`.
