# Project Orion — Boost, Target Lock-On & Modular Action Binding Plan

Upgrade the Orion cartridge's control, mobility, targeting, and combat action architecture while preserving strict modular system isolation:
- **`[B]` Dual-Mode Boost**: Tap `[B]` for an instant dodge burst; hold `[B]` for continuous sustained thruster boost that drains Reactor Heat over time until released or overheated (`100` Heat).
- **`[Y]` Target Lock-On & Hold Weapon Swap**: Tap `[Y]` to lock onto and cycle nearby hostile targets (auto-facing the locked target for strafe movement and aiming `X`, `L`, `R` attacks directly at it); hold `[Y]` (`>= 0.32s`) to swap equipped weapons.
- **`[X]`, `[L]`, `[R]` Multi-Source Action Architecture**:
  - `[X]` is permanently bound to the active weapon's **Basic Attack (Slot 0)**.
  - `[L]` and `[R]` are assignable via the `[SELECT]` Satchel menu to actions supplied by **multiple equipment sources**:
    1. **Weapon Skills** (Default: `L = Weapon Skill 1`, `R = Weapon Skill 2`, plus Weapon Skills 3–4 as unlocked).
    2. **Defensive & Hardware Modules** (`Head`, `Torso`, `Arms`, `Legs` actions such as *Optic Target Painter*, *Ablative Reactive Plating*, *Magnetic Grapple*, *Seismic Stomp*).
    3. **Reactor & Core Abilities** (*Thermal Vent Purge*, *Reactor Overdrive*, *Aegis Barrier Pulse*).

---

## 1. Isolated Systems & Database Architecture

### A. Equipment & Reactor Action Database (`src/cartridges/orion/database/equipment/canonical_equipment_actions.ts`)
- Define a unified `OrionActionDescriptor` interface representing any action that can be bound to `L` or `R`:
  - `id: string` (e.g., `'weapon_skill_1'`, `'weapon_skill_2'`, `'weapon_skill_3'`, `'weapon_skill_4'`, `'reactor_thermal_vent'`, `'reactor_overdrive'`, `'reactor_aegis_pulse'`, `'mod_head_optic_scan'`, `'mod_torso_reactive_burst'`, `'mod_arms_shock_grapple'`, `'mod_legs_seismic_stomp'`)
  - `name: string`
  - `sourceCategory: 'weapon' | 'hardware' | 'reactor'`
  - `hardwareSlot?: 'Head' | 'Torso' | 'Arms' | 'Legs'`
  - `description: string`
  - `tellDurationSec: number` (Combat Law 1: Every ability has a readable tell)
  - `actionDurationSec: number`
  - `cooldownSec: number`
  - `heatCost: number` (negative for *Thermal Vent Purge*, which vents heat)
  - `damage: number`
  - `damageType: DamageType`
  - `damageFamily: DamageFamily`
- Provide dynamic resolution for `'weapon_skill_1' .. 'weapon_skill_4'` so that when `L` or `R` is set to a Weapon Skill slot, it automatically resolves to the **currently active weapon's** corresponding skill (preserving seamless weapon swapping).

### B. Isolated Targeting & Lock-On System (`src/cartridges/orion/systems/targetingSystem.ts`)
- **`cycleTargetLock(state, ctx)`**:
  - Collects all valid targetable enemies in the current room within lock-on range (excluding non-hostile `calm` NPCs and unrevealed submerged Bog Wurms).
  - Sorts targets by distance; tapping `[Y]` locks onto the nearest target, cycles to the next target on subsequent taps, and clears lock-on if tapped after the last target (or if no targets exist).
- **`updateTargetLock(state, dt)`**:
  - Validates that `state.lockedTargetId` still exists, is alive (`frame.integrity > 0`), and is targetable; automatically clears lock if the enemy is defeated or out of range.
  - When locked onto a valid target, computes the normalized aim vector `(aimDx, aimDy)` from the pilot to the locked target and updates `state.dir`, `state.faceX`, and `state.faceY` to face the locked target while allowing independent 8-direction movement (strafing).

### C. Isolated Action Binding & Execution System (`src/cartridges/orion/systems/actionSystem.ts`)
- **`resolveAssignedAction(state, trigger: 'L' | 'R')`**:
  - Resolves `state.assignedActions.L` (default `'weapon_skill_1'`) and `state.assignedActions.R` (default `'weapon_skill_2'`) into concrete `OrionActionDescriptor` metadata, respecting progression/hardware slot gates from `state.gates`.
- **`initiateAssignedAction(state, ctx, trigger: 'L' | 'R')`** & **`executeActionPayload(state, ctx, actionId)`**:
  - Handles windup tells, cooldown tracking (`state.actionCooldowns[actionId]`), heat costs, and payload execution for Weapon Skills, Defensive/Hardware Modules, and Reactor/Core Abilities.

---

## 2. Input & Mobility Upgrades (`orionCartridge.ts` & `combat.ts`)

### A. `[B]` Tap Dodge Burst vs. Hold Continuous Boost
- **Tap `[B]`**: Initiates a `0.18s` high-impulse evade burst (`+16` Heat), granting brief evasion momentum.
- **Hold `[B]`**: After the initial burst (or continuously while `[B]` remains held), sustains **Continuous Thruster Boost** (`state.isContinuousBoosting = true`) at `BOOSTER_SPEED * 0.88`, draining `28 Heat/sec` and emitting continuous thruster exhaust particles.
- **Overheat & Release Safety**: Releasing `[B]` or reaching `state.heat >= state.maxHeat` (`100` Heat) immediately disengages continuous boost with a thermal warning chime (`OVERHEAT — THRUSTERS CUT`).

### B. `[Y]` Tap Lock-On vs. Hold Weapon Swap
- Track `state.yHoldTimer` while `input.held.y` is true:
  - **Hold `[Y]` (`>= 0.32s`)**: Triggers `performWeaponSwap(state, ctx)` once per hold press (with visual progress indicator on HUD).
  - **Tap `[Y]` (released before `0.32s`)**: Triggers `cycleTargetLock(state, combatCtx)` to lock onto or cycle hostile targets.

---

## 3. Visual Reticle, HUD & Satchel Menu Integration

- **2.5D Canvas Lock-On Reticle (`renderer.ts`)**:
  - Draw an animated cyan/amber targeting reticle and corner brackets around the locked enemy (`state.lockedTargetId`) with a subtle aim line from the pilot's mech.
- **HUD Action Readouts (`ui/OrionHud.tsx`)**:
  - Display the currently assigned `[L]` and `[R]` action names, source badges (`WPN`, `MOD`, `CORE`), and cooldown states, plus a Lock-On target indicator and `[Y]` Hold Swap progress bar.
- **Action Loadout Assignment UI (`ui/OrionSatchel.tsx`)**:
  - In the `WEAPONS` (now `ACTIONS & WPN`) tab, allow the player to assign `[L TRIGGER]` and `[R TRIGGER]` to any unlocked **Weapon Skill**, **Defensive/Hardware Module**, or **Reactor/Core Ability**, with a one-click reset to Default Weapon Skills.
  - Update `OrionGameMenu.tsx` controls guide to reflect the new `[B]`, `[Y]`, `[X]`, `[L]`, `[R]` control scheme.
