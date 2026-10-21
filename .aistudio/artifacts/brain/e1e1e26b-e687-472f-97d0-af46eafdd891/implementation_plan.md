# Game-Side Progression Alignment Plan

## 1. Overview & Goals
Audit and align Project Orion's campaign, equipment, gemstone, and level progression systems so that standard gameplay follows the canonical Belldor progression rules without debug leakage or conflicting state gates:
- **Weapon Set 1 → Set 2 & World Gear Discovery**: Start at Level 1 with only the pilot's primary weapon (`Weapon Set 1`), unlock `Weapon Set 2` at Level 2 (Poe / Bedivere), and earn the remaining 10 weapons, shields, and quivers through world caches, bosses, and scavenger trade.
- **Unified Gemstone Currency & Level 6–20 Advancement**: Make the 9 Gemstones the sole progression currency for Pilot Skills, Feat Sockets, and Equipment Mods (unlocking at Level 6), and allow Frame Level to advance from `6` to `20` through Gemstone build milestones and boss/trial completions.
- **Gemstone-Modified Equipment Combat Effects (Lv 6+)**: Give each of the 9 Gemstones (`Cols 0–8`) a stone-specific combat bonus in addition to its sprite column and blade trail / projectile VFX tint, gated behind Level 6+ progression.
- **Gate Consistency, Drop Tuning & Sandbox Isolation**: Fix the Belt Slot 3–4 level gate mismatch (`Level 2` everywhere), tune enemy Gemstone drop rates by enemy tier, and hide Satchel debug/cheat buttons unless `bypassProgressionGates` (`BYPASS ON`) is active.

---

## 2. Planned Changes by System

### A. Weapon Acquisition, Set 1 → Set 2 Unlock & World Loot (`types.ts`, `playerSystem.ts`, `worldSystem.ts`, `entitySystem.ts`)
- **Owned Gear Tracking (`OrionEquipmentSlots.unlockedEquipment`)**:
  - Add `unlockedEquipment?: string[]` to `OrionEquipmentSlots`.
  - At New Game (`Level 1` in `M00 The Bog [0,0]`), initialize `equippedWeapons` with `[startingWeapons[0]]` (1 weapon in Set 1) and seed `unlockedEquipment` with `[startingWeapons[0]]`.
- **Level 2 Weapon Set 2 Unlock (`Poe` / `Bedivere [S]`)**:
  - When reaching Level 2 via helping/resolving The Poe or salvaging Bedivere (`[S]`), unlock the pilot's canonical secondary gear (`startingWeapons[1]`, plus `khopesh` from Bedivere's salvage) into `unlockedEquipment` and populate `equippedWeapons[1]` (Weapon Set 2) cleanly—preventing duplicate or 3-element `equippedWeapons` arrays.
- **World Gear Discovery & Boss/Cache Drops**:
  - Distribute the remaining weapons, shields, and quivers across Belldor caches, bosses, and merchants:
    - **Bog Caches & Bog Wurm**: Unlock `short_spear`, `buckler_shield`, and `hand_axe`.
    - **Border Town Caches & Scavenger Trade**: Unlock `mace`, `heater_shield`, `great_bow`, and `quiver`.
    - **Three Corrupted Knights (`Percival`, `Tristan`, `Bors`) & Lady of the Lake**: Drop/unlock `pavise_shield`, `long_sword`, `gladius_boltcaster`, and `avalon_siege_lance`.
  - Collecting or unlocking any weapon/shield/quiver adds its ID to `state.equipmentSlots.unlockedEquipment` with a discovery toast.

### B. Unified Gemstone Progression & Frame Level 6–20 Advancement (`database/progression/index.ts`, `playerSystem.ts`)
- **Single-Currency Pilot Skill Progression**:
  - Remove the unused `0–100` combat XP accumulation in `awardPilotSkillXp` so Pilot Skills (`Levels 1–20` across the 6 Trait Lines) are funded exclusively by spending matching Trait or Reactor Gemstones via `fundPilotSkillWithGem` once Level 6 (`isStandardProgressionUnlocked`) is active.
- **Natural Frame Level 6 → 20 Progression**:
  - Add `syncPostTutorialFrameLevel(state, ctx)` in `playerSystem.ts`: once `isStandardProgressionUnlocked(state)` is true (`Level 6+`), calculate the pilot's progression milestones (total Gemstones invested in Pilot Skills, active socketed Feat Nodes, generated Action/Weapon Mods, Corrupted Knights defeated, and Lady of the Lake defeated) to advance `state.level` smoothly from `6` up to `20` during real gameplay.

### C. Gemstone Weapon Modification Combat Bonuses (`database/progression/index.ts`, `combatSystem.ts`)
- **Level 6+ Gate**:
  - Gate `modifyWeaponWithGem` behind `isStandardProgressionUnlocked(state)` (Level 6: Border Town Complete, or Sandbox Bypass).
- **Stone-Specific Combat Modifiers (`getWeaponGemCombatModifiers`)**:
  - Define and apply per-stone combat bonuses whenever a weapon, shield, or quiver is modified with a Gemstone (`Cols 0–8`):
    - **Moonstone (`Col 0`)**: `+8 Max Shield Capacity` and `-10% Active Skill Cooldowns`.
    - **Spinel (`Col 1`)**: `+15% Weapon Damage` (scales to `+22%` when Reactor Heat `≥ 50`).
    - **Carnelian (`Col 2`)**: `+25% Bonus Armor Durability Damage` and `+15 Presence` on hit.
    - **Titanite (`Col 3`)**: `+15 Max Shield Capacity` and restores `+4 Shield` on skill hit.
    - **Demantoid (`Col 4`)**: Repairs `+3 Frame Integrity` on skill hit and `-15% Skill Heat Cost`.
    - **Kyanite (`Col 5`)**: `+15% Projectile Velocity / Range` and `-12% Skill Cooldowns`.
    - **Charoite (`Col 6`)**: `+20% Damage vs. Locked-On or Submerged/Staggered Targets` and `+8% Move Speed`.
    - **Rubellite (`Col 7`)**: `+12% All Weapon Damage` and `+1 Max Chain Ammo`.
    - **Hematite (`Col 8`)**: Vents `-4 Reactor Heat` per basic hit and restores `+4 Armor Durability` on kill.

### D. Belt Slot Alignment, Enemy Gemstone Drop Rates & Satchel Bypass Gating (`combatSystem.ts`, `entitySystem.ts`, `OrionSatchel.tsx`)
- **Belt Slots 3–4 at Level 2**:
  - Update `isActionUnlocked` in `combatSystem.ts` so Belt Slots 1–2 require Level 1 and Belt Slots 3–4 require Level 2 (`reqLvl = idx <= 1 ? 1 : 2`), matching `computeCapabilityGates` and `LEVEL_UNLOCK_SEQUENCE`.
- **Tiered Enemy Gemstone Drop Rates (`entitySystem.ts`)**:
  - Replace the 100% guaranteed Gemstone drop on all enemies with tiered drop chances:
    - Basic enemies (`bog_crawler`, `orc_scout`, `orc_warrior`): `22%` drop chance.
    - Elite / Sub-bosses (`bog_wurm`): `60%` drop chance (`1–2` Gemstones).
    - Bosses & Trials (`percival_knight`, `tristan_knight`, `bors_knight`, `lady_of_the_lake`, Fog Mini-Bosses): `100%` guaranteed drop (`1–2` Gemstones).
- **Satchel Sandbox Gate Isolation (`OrionSatchel.tsx`)**:
  - In `OrionSatchel.tsx`, only allow equipping weapons/shields/quivers present in `unlockedEquipment` (or all 12 when `state.bypassProgressionGates` is enabled).
  - Lock mid-run Trait Line frame switching and cross-class Utility selection when `state.bypassProgressionGates` is off.
  - Gate debug buttons (`+1 ALL 9 GEMS`, `+1 ALL 9 FLASKS`, `+1 RELICS & KEYS`, manual Level `-1/+1`, campaign flag cyclers, and `ATTUNE ALL WAYSTATIONS & WAYGATES`) behind `state.bypassProgressionGates`, while keeping the **Sandbox Gate Bypass (`STRICT` / `BYPASS ON`)** toggle accessible in the `STATES & LAWS` tab for testing.
