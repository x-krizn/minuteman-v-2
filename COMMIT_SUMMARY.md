# Project Orion — Commit & Architecture Summary

## 1. Inertia & Stability Physics Engine (`inertia-v0.md` Implementation)
- **Weight vs. Weight Classical Mechanics (`src/cartridges/orion/systems/inertiaSystem.ts`)**:
  - Replaced legacy static poise concepts with the unified impulse-momentum model (`Δv = J / m_eff`).
  - **Weight (`m`) & Directional Charge (`μ`)**: Defender effective mass scales with directional forward velocity into an incoming hit (`m_eff = m_defender × (1 + μ_defender)`), while sidestepping or retreating yields `μ = 0`.
  - **Stability (`S`)**: Derived separately from frame weight class, armor plating, leg stabilizers, and equipped feats (`resolvePlayerInertiaProfile`). Governs both the shrug-off deadband (`k1 · S`) and hit recovery speed (`Δv_eff / (k2 · S)`).
  - **Melee vs. Ranged Impulse (`J`)**: Melee impulse combines weapon attack weight, attacker frame weight scaled by `μ_attacker` and body commitment, and attack speed. Ranged impulse is strictly `projectile_weight × projectile_speed` (independent of shooter weight).
  - **Ranged Recoil (`§7`)**: Applies `Δv_recoil = J_recoil / m_shooter_frame` against the `k1 · S` deadband so heavier and more stable frames ignore light recoil and recover faster from heavy ordnance recoil.
  - **4 Outcome Bands (`none`, `flinch`, `stagger`, `knockback`)**: Symmetrically drives hitstop freeze frames, micro-flinch cooldown nudges, action interrupts, physical knockback velocity transfer (`knockbackVx`, `knockbackVy`), and distinct visual tells without altering Base Combat Unit (BCU) damage numbers.
  - **Legibility & Equipment Telemetry Mod**: No numeric inertia stats appear on the default HUD; full physics readouts live in the `MECH STATUS` Satchel tab, and live HUD telemetry is unlocked only when equipping the **Inertial Gyro-Telemetry Array** in `Sensory B`.

## 2. Codebase Cleanup & Domain Modularization
- **Domain-Organized Type Schemas (`src/cartridges/orion/types/`)**:
  - Split the 765-line `types.ts` into focused domain modules (`common.ts`, `combat.ts`, `equipment.ts`, `entities.ts`, `world.ts`, `state.ts`, and `index.ts`), with `src/cartridges/orion/types.ts` re-exporting all symbols for zero breaking changes.
- **Modular Combat Subsystem (`src/cartridges/orion/systems/combat/`)**:
  - Extracted `combatHelpers.ts`, `damageSystem.ts`, `projectileSystem.ts`, and `skillExecution.ts` from `combatSystem.ts`.
  - Removed duplicate `updateProjectiles` implementation from `entitySystem.ts` in favor of `systems/combat/projectileSystem.ts`.
- **Modular Render Subsystem (`src/cartridges/orion/systems/render/`)**:
  - Extracted `spriteAtlasCache.ts`, `worldRenderer.ts`, `entityRenderer.ts`, and `effectsRenderer.ts` from `renderSystem.ts`, keeping `renderSystem.ts` as a concise orchestrator and barrel export.
- **Modular World Subsystem (`src/cartridges/orion/systems/world/`)**:
  - Extracted `roomLoader.ts`, `worldPersistence.ts`, `worldTransitions.ts`, and `tutorialSystem.ts` from `worldSystem.ts`.
- **Modular HUD & Satchel UI (`src/cartridges/orion/ui/hud/` & `src/cartridges/orion/ui/satchel/`)**:
  - Split `OrionHud.tsx` into `HudTitleModal.tsx`, `HudDefenseBars.tsx`, and `HudSkillDeck.tsx`.
  - Split `OrionSatchel.tsx` into `SatchelStatusTab.tsx`, `SatchelLoadoutTab.tsx` (`SatchelLoadoutTab` + `SatchelInventoryTab`), `SatchelFeatsTab.tsx`, `SatchelWorldTab.tsx`, and `SatchelCanvases.tsx`.
- **Consolidated Documentation (`src/cartridges/orion/docs/`)**:
  - Consolidated all Project Orion design and authoring documentation into `src/cartridges/orion/docs/` (`INDEX.md`, `AUTHORING_GUIDE.md`, `EQUIPMENT_AND_FEATS.md`, `INERTIA_SYSTEM.md`).
