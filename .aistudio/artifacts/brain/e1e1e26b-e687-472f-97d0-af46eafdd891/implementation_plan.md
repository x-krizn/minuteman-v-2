# Project Orion — Codebase Cleanup & Modularization Plan

## Goal Description
Refactor and clean up the Project Orion cartridge codebase (`/src/cartridges/orion/`) following the transition to the Inertia v0 combat system and magic-current glide mechanics. This pass breaks down oversized monolithic files (`combatSystem.ts`, `renderSystem.ts`, `worldSystem.ts`, `types.ts`, `OrionSatchel.tsx`, and `OrionHud.tsx`) into focused domain modules, strips out deprecated poise fields and unused code, and consolidates all Project Orion design and authoring documentation into `/src/cartridges/orion/docs/`.

---

## Proposed Changes

### 1. Types Consolidation & Domain Organization (`/src/cartridges/orion/types/`)
Split `/src/cartridges/orion/types.ts` (1,349 lines) into domain-specific definition files while preserving `/src/cartridges/orion/types.ts` as a barrel re-export so existing imports remain unbroken:
- **`types/common.ts`**: Primitives, vectors, elemental affinities, damage types, rarity tiers, and shared utility interfaces.
- **`types/combat.ts`**: Inertia v0 state/config interfaces, attack profiles, skills, projectiles, hitboxes, status effects, and salvo telemetry.
- **`types/equipment.ts`**: Weapons, armor frames, equipment slots, mods, consumables, and crafting/upgrade definitions.
- **`types/entities.ts`**: Player state, enemy definitions, NPCs, bosses, AI states, and animation/glide state structures.
- **`types/world.ts`**: Rooms, biomes, tiles, hazards, interactables, chests, transitions, and map data.
- **`types/state.ts`**: Root `OrionGameState`, UI/Satchel state, save data schemas, and input/settings structures.
- **`types.ts` (Barrel)**: Re-export all domain type modules cleanly.

---

### 2. Legacy Poise & Dead Code Removal
Audit the codebase to remove deprecated poise remnants superseded by Inertia v0 (`inertiaSystem.ts`):
- Strip obsolete poise properties (`poise`, `maxPoise`, `poiseDamage`, `poiseRegen`, `poiseResetTimer`, etc.) from type definitions, enemy templates, equipment/feat definitions, and runtime initializers where no longer used.
- Remove unused helper functions, dead imports, and commented-out legacy blocks across `/src/cartridges/orion/systems/`, `/src/cartridges/orion/database/`, and `/src/cartridges/orion/ui/`.
- Verify that all stagger, micro-flinch, knockback, and hitstop mechanics route exclusively through `inertiaSystem.ts`.

---

### 3. Combat System Modularization (`/src/cartridges/orion/systems/combat/`)
Break down `/src/cartridges/orion/systems/combatSystem.ts` (4,549 lines) into focused combat submodules:
- **`combat/damageSystem.ts`**: Damage calculation, elemental affinity multipliers, Inertia v0 impact resolution hooks, hitstop application, shield/guard mitigation, and floating combat text triggers.
- **`combat/skillExecution.ts`**: Weapon attacks, active skill routines, melee arcs, lunge/glide velocity coupling, and stamina/aether costs.
- **`combat/projectileSystem.ts`**: Projectile spawning, homing/ballistic updates, collision detection, beam/raycast handling, and hazard zones.
- **`combat/combatHelpers.ts`**: Target lock-on resolution, line-of-sight checks, hitbox geometry helpers, and status effect ticking.
- **`combatSystem.ts` (Orchestrator & Barrel)**: Retain main combat loop entry points and re-export all public functions for backward compatibility with `systems/index.ts`.

---

### 4. Render System Modularization (`/src/cartridges/orion/systems/render/`)
Break down `/src/cartridges/orion/systems/renderSystem.ts` (3,805 lines) into focused rendering submodules:
- **`render/spriteAtlasCache.ts`**: Offscreen canvas caching, palette/silhouette baking, and sprite sheet lookup utilities.
- **`render/worldRenderer.ts`**: Floor tiles, walls, environmental props, lighting/ambient overlays, interactables, and room transition masks.
- **`render/entityRenderer.ts`**: Player layered mech sprite rendering (including glide banking/hover), enemy sprites, bosses, telegraphs, and world-space health/inertia bars.
- **`render/effectsRenderer.ts`**: Projectiles, weapon swing trails, thruster/magic-current particles, hit sparks, screen shake, and floating text.
- **`renderSystem.ts` (Orchestrator & Barrel)**: Coordinate the main `renderGame` pipeline and re-export public helpers.

---

### 5. World System Modularization (`/src/cartridges/orion/systems/world/`)
Break down `/src/cartridges/orion/systems/worldSystem.ts` (3,365 lines) into focused world management submodules:
- **`world/roomLoader.ts`**: Room instantiation, entity/enemy spawning, chest/pickup placement, and room layout parsing.
- **`world/worldTransitions.ts`**: Door/gate traversal, zone transitions, respawn/beacon logic, and camera bounds clamping.
- **`world/worldPersistence.ts`**: Save/load serialization (`localStorage`), world flags, unlocked shortcuts, and state migration helpers.
- **`world/tutorialSystem.ts`**: Tutorial room triggers, combat dummy scenarios, and onboarding prompts.
- **`worldSystem.ts` (Orchestrator & Barrel)**: Main world update loop and barrel re-exports.

---

### 6. UI Modularization (`/src/cartridges/orion/ui/`)
Extract cohesive subcomponents from the two largest UI files while keeping state management responsive and clean:
- **Satchel Subcomponents (`/src/cartridges/orion/ui/satchel/`)**:
  - `SatchelMechPreview.tsx`: Interactive/animated mech canvas preview cycling through idle, windup, glide, and wind-down states.
  - `SatchelLoadoutTab.tsx`: Armor frame, weapons, mods, and Inertia/weight readout panel.
  - `SatchelFeatsTab.tsx`: Aspect progression, feats tree, and stat allocation views.
  - `SatchelInventoryTab.tsx`: Consumables, key items, crafting/salvage, and item detail cards.
  - `SatchelMapTab.tsx`: World map, room discovery, and lore/codex entries.
  - `OrionSatchel.tsx`: Top-level Satchel container, tab navigation, and keyboard/controller shortcut handling.
- **HUD Subcomponents (`/src/cartridges/orion/ui/hud/`)**:
  - `HudStatusBars.tsx`: Player HP, Stamina, Aether, and conditional Inertia HUD mod gauge.
  - `HudActionBar.tsx`: Weapon slots, active skills, salvo cooldowns, and quick-use items.
  - `HudTargetOverlay.tsx`: Boss health bars, target lock indicators, and combat notifications.
  - `OrionHud.tsx`: Top-level HUD layout orchestrating the subcomponents.

---

### 7. Documentation Consolidation (`/src/cartridges/orion/docs/`)
Organize all Project Orion markdown documentation into `/src/cartridges/orion/docs/` and synchronize content with the current codebase:
- Move and update:
  - `/src/cartridges/orion/docs/INDEX.md` (from `Project Orion — Index.md`)
  - `/src/cartridges/orion/docs/AUTHORING_GUIDE.md` (from `AUTHORING_GUIDE.md`)
  - `/src/cartridges/orion/docs/EQUIPMENT_AND_FEATS.md` (from `Project Orion — Equipment & Feats.md`)
  - `/src/cartridges/orion/docs/INERTIA_SYSTEM.md` (from `/public/assets/aistudio/inertia-v0_84295f9f.md`)
- Update directory diagrams, system architecture references, and authoring instructions to reflect the new modular folder structure and Inertia v0 mechanics.
- Update `/COMMIT_SUMMARY.md` with a comprehensive summary of the Inertia v0 system, glide animation architecture, and codebase modularization.

---

## Verification Plan
1. **Static Analysis & Type Checking**: Run `lint_applet` (`npm run lint`) to verify zero TypeScript errors, broken imports, or unused symbol issues across all split modules.
2. **Production Bundle Compilation**: Run `compile_applet` (`npm run build`) to ensure Vite bundles all new submodules and barrel exports cleanly.
3. **Runtime Integrity**: Confirm that all barrel exports (`types.ts`, `systems/index.ts`, `combatSystem.ts`, `renderSystem.ts`, `worldSystem.ts`) preserve exact signatures for `OrionCartridge.tsx` and all UI components.
