# Project Orion — Final System Completion & Canonical Polish Plan

This plan completes the remaining items identified in our audit against **`pilot-frame-equipment-v0.md` (`v0.7`)**, **`worlds.md` (`u00 Universe`)**, **`bog-v2.md`**, and **`border-town-v1.md`**.

---

## 1. §2.4 Pilot Creation (`Trait Line → Pilot Name → Level 1`) & Multi-Pilot Load Roster

### Goal
Fulfill the **LOCKED** rule in `§2.4 Pilot as a game object`:
- **New Game Flow**: Select **Trait Line** (`Warrior / PNSY W416`, `Marauder / RAD HAU`, `Guardian / Trinity DE-14`, `Rogue / VX Phantom`, `Wizard / ARC Arclight`, `Cleric / SANC Sanctum`) $\rightarrow$ enter **Pilot Name** $\rightarrow$ deploy at **Level 1** in `M00 The Bog` (`0,0`) with that trait line's canonical default frame, reactor, and loadout.
- **Load Game Roster**: Persist a multi-character roster in `localStorage` (`orion_pilot_roster_v1`) alongside the active slot so the **Load Game** screen lists saved pilots with their **Pilot Name**, **Trait Line**, **Frame Model**, **Level (`Lv 1–20`)**, **Current Zone**, and **Last Played Timestamp**, allowing instant switching, loading, or deletion.
- **Title Overlay & Start Menu Integration**:
  - Add a **[NEW PILOT]** / **[LOAD PILOT ROSTER]** prompt directly accessible from the Title Overlay and the `[START]` Game Menu (`OrionGameMenu.tsx`).

### Files to Update
- `src/cartridges/orion/types.ts`: Add `OrionSavedPilotEntry` metadata interface for the multi-pilot character roster.
- `src/cartridges/orion/systems/playerSystem.ts`:
  - Add `loadPilotRoster()`, `savePilotToRoster(state)`, `loadPilotById(pilotId)`, `createNewPilotState(traitLineId, pilotName)`, and `deletePilotFromRoster(pilotId)`.
  - Ensure `saveOrionProgress(state)` automatically updates both the active save and the pilot's entry in the character roster.
- `src/cartridges/orion/ui/OrionGameMenu.tsx` & `src/cartridges/orion/OrionTitleOverlay.tsx`:
  - Upgrade the Start Menu with a dedicated **NEW GAME (PILOT CREATION)** modal/sub-panel (Trait Line selector + Pilot Name input + Frame/Reactor preview) and a **LOAD GAME (PILOT ROSTER)** character list screen.
  - Add a quick **[NEW PILOT / ROSTER]** button on the Title Overlay before dismissal so players can create or pick a pilot right at boot or jump straight in.

---

## 2. Level 6 Class Utility Item (`Action 6`) & Belt Slots (`Actions 7–10`) in Combat & `[L]/[R]`

### Goal
Ensure every slot unlocked by the **§5 Level Sequence** is interactive in gameplay, not just displayed in the 13-slot Satchel taxonomy:
- **Class Utility Slot (`Action 6`, unlocked at Level 6 — Border Town Complete)**:
  - Each Trait Line grants a signature **Class Utility Action** in `equipmentSlots.utilitySlot` (e.g., Warrior *Ichor Surge Injector*, Marauder *Siege Anchor Brace*, Guardian *Aegis Bastion Pulse*, Rogue *Phantom Blink Shroud*, Wizard *Arclight Capacitor Discharge*, Cleric *Sanctum Ward Font*).
  - Can be bound directly to `[L]` or `[R]` once Level 6 (`capabilities.utilitySlotUnlocked`) is reached, or triggered from the Satchel/HUD.
- **Belt Slots 1–4 (`Actions 7–10`, unlocked at Lv 1, Lv 1, Lv 5, Lv 12)**:
  - Allow equipping consumable/tactical items into Belt Slots 1–4 and binding an active Belt Action (`belt_slot_1` .. `belt_slot_4`) to `[L]` or `[R]` (or quick-activating from the Satchel) to trigger field repairs, heat coolant purges, or energy cells in combat.

### Files to Update
- `src/cartridges/orion/database/equipment/index.ts`:
  - Register Class Utility actions (`utility_ichor_surge`, `utility_siege_brace`, `utility_aegis_pulse`, `utility_phantom_shroud`, `utility_arclight_capacitor`, `utility_sanctum_font`) and Belt Slot tactical actions (`belt_repair_kit`, `belt_coolant_flush`) in `ASSIGNABLE_ACTION_CATALOG` with `actionSlotType: 'utility' | 'belt'`.
- `src/cartridges/orion/systems/combatSystem.ts`:
  - Enforce `capabilities.utilitySlotUnlocked` (`Lv 6`) for Utility actions and `capabilities.beltSlotCount` (`Lv 1 / 5 / 12`) for Belt actions in `isActionUnlocked()`, and execute their combat payloads (shield/armor restore, heat vent, stealth/overdrive buff, and `defense_shield` / `reactor_overdrive` skill XP).
- `src/cartridges/orion/ui/OrionSatchel.tsx` & `src/cartridges/orion/ui/OrionHud.tsx`:
  - Allow equipping/changing the Class Utility slot (`Lv 6+`) and Belt Slots (`1–4`), and binding them to `[L]` / `[R]` in the Satchel.

---

## 3. Deduplicate `orionCartridge.ts` State Initialization

### Goal
Eliminate the ~150-line duplicate `OrionState` literal in `src/cartridges/orion/orionCartridge.ts` so `orionCartridge.init()` delegates directly to `createInitialOrionState()` in `systems/playerSystem.ts`.

### Files to Update
- `src/cartridges/orion/orionCartridge.ts`: Replace the inline state literal with `createInitialOrionState()`, keeping a single canonical source of truth for initial state and save restoration.

---

## 4. Sync In-Repo Documentation (`Project Orion — Index.md` & `AUTHORING_GUIDE.md`)

### Goal
Update the repository's reference markdown files so they reflect all current canonical specifications:
- `src/cartridges/orion/Project Orion — Index.md`: Sync status table and cross-reference notes with `pilot-frame-equipment-v0.md (v0.7)`.
- `src/cartridges/orion/AUTHORING_GUIDE.md`: Document the `v0.7` Three-Layer Build & Progression architecture (`Pilot Skills → Feat Tiers I–V → System & Interface Feats → 13-Slot Equipment & Action Modifications`) and the `u00 Universe` `UNDEFINED` zone seal conventions (`worldStatus: 'undefined_spec'`).

---

## Verification Criteria
1. Run `compile_applet` and `lint_applet` with strict TypeScript flags (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) and confirm **0 errors**.
2. Verify **New Game (`Trait Line → Pilot Name → Level 1`)** creates a fresh Level 1 pilot in `M00 The Bog` and adds them to the **Load Game** character roster.
3. Verify **Class Utility (`Lv 6`)** and **Belt Slots (`Lv 1/5/12`)** can be bound to `[L]/[R]` and triggered in combat.
