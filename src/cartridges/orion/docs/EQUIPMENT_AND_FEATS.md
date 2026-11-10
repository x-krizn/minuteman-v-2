# PROJECT ORION — EQUIPMENT & FEATS

## 1. WEAPONS (`101 CANONICAL WEAPONS` = `72 CUSTOMIZABLE` + `29 UNIQUE MAGITECH`)

### 1A. Eight Broad Weapon Classes, Nine Shared Functional Types & Two Subtypes (`LOCKED`)
All weapons in Project Orion are classified into **8 broad Weapon Classes** (`WeaponCategory`), each containing **9 shared Functional Weapon Types** (`WEAPON_FUNCTIONAL_TYPES_BY_CATEGORY`). Both **Custom** and **Magitech** weapons share the same functional weapon class (for example, `S-2 Turbine Khopesh` is a `Magitech` subtype of `Khopesh` under `Blades: Curved`, alongside the `Custom` `Khopesh`):
1. **`Shields`** (`Buckler` .. `Rhom` + `Aegis Charge Buckler`)
2. **`Bows`** (`Self Bow` .. `Great Bow` + `M-300 Hasta`, `M-450 Pilum`)
3. **`Casters`** (`Bolt Caster` .. `Stellar Caster` + `N-55 Gladius`, `B-25 Brushcutter`, `M-350 Mauler`, `RS-450 Radiant Projector`, `SV-12 Viper`, `SV-18 Serpent`, `SR-440 Shadowfang`, `WZ-800 Arclight Cannon`, `WZ-650 Prism Lance`, `WZ-450 Sparkstrike`, `ARC Conductor`, `CL-700 Sanctifier`, `CL-500 Absolution`, `CL-350 Litany`)
4. **`Spears`** (`Short Spear` .. `Lance` + `LS-900 Swordspear`, `HL-220 Lightburst Lance`, `WZ-200 Manacore Staff`)
5. **`Impact & Axes`** (`Cudgel` .. `Battle Axe` + `Siegebreaker`, `Hallowed Scepter`)
6. **`Blades: Curved`** (`Wakizashi` .. `Dadao` + `S-2 Turbine Khopesh`)
7. **`Blades: Straight`** (`Cinquedea` .. `Executioner Sword` + `TIG Edge`, `S-4 Whisper Blade`, `S-6 Phantom Edge`, `Grace Edge`)
8. **`Carriers & Munitions`** (`Bandolier` .. `Pangao` + `LN-1200 Avalanche`, `LG-950 Tomahawk`)

- **`Custom` Subtype (`weaponTier: 'customizable'` — 72 Archetypes + 5 Legacy Field Weapons)**: Have **3 Component & Gem Slots** (`maxModSlots: 3`) in the Armory Workbench (`Hilt / Grip / Stock`, `Blade / Head / Limbs`, `Counterweight / Focus / Payload`).
- **`Magitech` Subtype (`weaponTier: 'unique'` — 29 Unique Magitech Relics)**: Dissolved into the 8 Weapon Classes and their shared Functional Weapon Types while keeping their canonical names; feature **fixed internal components**, distinct movesets, and **1 Resonance Gem Socket** (`maxModSlots: 1`).
- **Weapon Combat Function Laws, Global `BCU = 54` Balance Parity & Anatomical Layering (`LOCKED`)**:
  - **Bows (`Bows` Class — Single-Shot Hold-to-Charge)**: All Bows (`Self Bow` .. `Great Bow`, `M-300 Hasta`, `M-450 Pilum`) are single-shot (`shotsPerChain: 1`, `isChargeable: true`) hold-to-charge weapons on `[X]`. Holding `[X]` draws the bow (`0% → 100%` over `maxChargeSec`), scaling Damage (`1.0× → 1.85×`), Projectile Velocity & Critical Sweet-Spot Range (`1.0× → 1.45×`), and Heat/Energy cost (`1.0× → 1.65×`). Releasing `[X]` fires the arrow and enters the single-arrow nock/reload cycle.
  - **Melee & Shield Weapons (`Spears`, `Impact & Axes`, `Blades: Curved`, `Blades: Straight`, `Shields` — Reload-Free Functional-Type Combos)**: Melee and Shield weapons never reload (`noReload: true`, `reloadDurationSec: 0`). Pressing or holding `[X]` chains through a fluid, functional-type-unique 2-to-5 step combo sequence (`buildWeaponUniqueComboSequence` in `database/equipment/weapons/comboChoreography.ts`) whose swing geometry (`swingStyle`: `slash` | `thrust` | `chop` | `bash` | `whirlwind`), per-step damage, range, arc, and lunge multipliers match each weapon's authored silhouette and description (e.g., `Khopesh` / `Shotel` / `Falx` hooked reach-around chops, `Wakizashi` / `Cinquedea` rapid multi-stab/slash flurries, `Pike` / `Lance` narrow high-reach thrusts, `Executioner Sword` / `Mallet` slow 2-step cleaves/slams, `Disc` / `Corona` rotary shield arcs). Pausing for the internal combo reset window (`comboResetWindowSec: 1.45s`) or completing the final combo finisher (`0.45s` Light / `0.58s` Medium / `0.75s` Heavy recovery) automatically resets the sequence to Step 1.
  - **Ranged Weapons (`Casters`, `Carriers & Munitions` — Functional-Type Shot Profiles & Reload Strictly on Basic Attack)**: All non-Bow ranged weapons feature doubled (`+100%` / `2×`) basic attack ammo (`shotsPerChain: 8..20`) and distinct per-type shot delivery profiles (`resolveRangedBasicShotProfile` in `comboChoreography.ts`: rapid bolts, continuous beams, forked arcs, twin pulses, wide sonic waves, high-arc lobbed mortars/bolides, thrown javelins/darts, and multi-pellet buckshot sheaves). **Only Basic Attack (`Action 1` / `moveset[0]`) uses the reload function** (including double-tapping `[X]` for a tactical early reload & heat vent). Non-basic ranged skills (`Actions 2–5`) never enter a manual reload state; instead, they specify explicit `ammoCount` multi-round bursts/salvos or `internalCharges` per-shot internal reloads (`internalCycleSec: 0.65s–0.80s`) that enter their full cooldown once depleted.
  - **Tactical Skills (`Actions 2–5` — Enacted Description Mechanics)**: Every weapon skill in `Slots 1–4` (`systems/combat/skillBehaviors.ts` & `skillExecution.ts`) enacts its authored tactical movement and payload behavior: forward lunges/dashes, aerial vaults/leaps (`vz` impulse), evasive backsteps, inward hook/wrench pulls with `2.25×` Layer 1 shield strip, `55%` around-shield bypass strikes (`Shotel`, `Falx`, `Khopesh`, `Flamberge`), heavy shoves, thrown javelins/axes, returning boomerang/chakram discs (`Disc`, `Tomahawk`), piercing line beams/vacuum waves, parabolic mortar/bolide lobs with AoE crater rings, and `360°` omnidirectional whirlwinds/novas.
  - **Global `BCU = 54` Balance Parity Across All 101 Weapons (`normalizeWeaponCombatFunctions` & `normalizeSkillBcuParameters`)**:
    - Every weapon across all 8 Classes and 3 Weight Classes (`Light`, `Medium`, `Heavy`) is normalized to the canonical **`WEAPON_BCU_REFERENCE = 54`** reference chain budget, trading off range, exposure risk, cadence, and reactor heat:
      - **Bows**: Single full-draw arrow targets `~52–66` charged damage (`28` Light / `31` Medium / `36` Heavy base × `1.85×` full draw).
      - **Melee & Shields**: Full combo chain totals `56` (`Light`), `62` (`Medium`), or `70` (`Heavy`) damage (`+4%` to `+30%` close-quarters exposure bonus over ranged BCU, or `46–52` on defensive Shields with active guard mitigation).
      - **Casters & Carriers**: Reference 6-shot burst window delivers `54 BCU` (`9–12` per shot depending on weight and cadence), while full magazines (`8–20` rounds) sustain `90–116` total magazine output before reload.
      - **Tactical Skills (`Slots 1–4`)**: Normalized by slot tier (`Slot 1`: `0.58× BCU ≈ 31`, `Slot 2`: `0.78× BCU ≈ 42`, `Slot 3`: `0.96× BCU ≈ 52`, `Slot 4`: `1.22× BCU ≈ 66`), scaled by weapon weight (`0.92×` Light / `1.00×` Medium / `1.12×` Heavy), reach tradeoff, and defensive utility.
  - **Combat Tempo Baseline (`Medium = 1.00×`, `±30%` Band & `[0.70×, 1.30×]` Multiplier Cap)**:
    - **Medium (`1.00×`)** weapons and frames define the deliberate tactical combat tempo (`0.34s/shot` ranged basic cadence, `0.45s/step` melee combo cadence, `1.15s` full bow draw, `0.34s` Perfect Block window, `44 px/s` base glide speed, `0.75s` booster dash cooldown, `0.45s` heat dissipation delay).
    - **Light** weapons operate up to **`+30%` faster** (`0.77×` cycle duration: `0.26s/shot` ranged basic, `0.35s/step` melee combo, `0.88s` bow draw) and **Heavy** weapons operate up to **`-30%` slower** (`1.30×` cycle duration: `0.44s/shot` ranged basic, `0.59s/step` melee combo, `1.50s` bow draw).
    - Ranged per-shot cadence is strictly decoupled from magazine size (`shotsPerChain`) so doubled magazines increase sustained fire capacity without compressing per-shot timings (hard floor `>= 0.22s/shot`).
    - **Attack Movement Commitment & Enemy Readability**: Melee swings (`0.20×–0.36×` glide speed), ranged fire (`0.32×–0.48×`), bow draw (`0.45×`), reloading (`0.68×`), and active guard (`0.55×`) require deliberate positional commitment, while enemy attacks feature `0.68s–0.95s` windup tells and `0.55s–0.85s` post-attack recovery windows.
    - Cumulative speed multipliers from Feats, Gemstones, Chassis Hardware, Action Modifications, and Load Brackets are hard-capped to **`[0.70×, 1.30×]` (`±30%`)** for attack cadence/tell windups, skill cooldowns, and passive glide speed.
  - **3-Pass Anatomical Weapon Layering & Procedural Attachment Overlays (`systems/playerSpriteSystem.ts`)**:
    - `drawCompositePlayerMech` and `drawPlayerWeaponMounts25D` interleave mech anatomy and weapon hardpoints across **3 depth passes**:
      1. **`behindBody`**: Auxiliary Back-Mount holsters (with dorsal magnetic clamp straps), north-facing weapons, and off-side dual-wield/shield mounts tucked behind the torso.
      2. **`platingSlice`** (`Frame Plating` torso + legs).
      3. **`betweenPlatingAndArms`**: Active Main-Hand and Side-Hand weapons when gripping across the torso or drawing behind the front arm, so the **sword/axe/spear handle is naturally occluded behind the front arm (`armsSlice`)** while sitting in front of the chest plating.
      4. **`armsSlice` & `headSlice`** (`Arm Assembly` gauntlets + `Head Dome`).
      5. **`inFrontOfBody` & `drawEquipmentAttachmentOverlay`**: Forward thrusts, raised shields, and **procedural attachment overlays**—including armored gauntlet knuckle-grip clasps over the weapon hilt (`gauntlet_grip`), secondary two-handed foregrip/bowstring clasps (`offhand_support`), twin forearm shield straps (`shield_straps`), and dorsal shoulder-holster clamps (`back_holster`)—so every equipped item looks physically held or strapped onto the mech.
    - **Class-Specific 2.5D North & South Perspective Projection (`resolveClassBaseProjection25D`)**: Because all 72 weapon strips were drawn in an East-facing right-hand profile (`-45°` diagonal for melee/spears/axes, `-22°` for casters, `0°` for bows/shields), `drawSinglePlayerEquipmentMount` applies weapon-class-specific 2.5D angles, perspective foreshortening (`foreshortenScaleX`, `foreshortenScaleY`), isometric shear (`skewX`, `skewY`), depth shading (`depthShadeAlpha`), South caster muzzle-bore cues, and facing-aligned North/South cross-body slash/chop/thrust arcs so North- and South-facing weapons read as dimensional 3D equipment rather than flat side-profile stickers.
- **72 Vertical `16×224` Pixel-Art Sprite Strips & Palette Row Convention (`LOCKED`)**:
  - Every functional weapon type across all 8 Weapon Classes (`8 × 9 = 72` archetypes) has a dedicated **`16×224` vertical sprite strip** (`16×16` px frame × `14` vertical rows: `rows 0..12` populated with `13` palette variants and `row 13` transparent) in `database/equipment/weapons/base_sprites.ts` (`shield_*`, `bow_*`, `caster_*`, `spear_*`, `impact_axe_*`, `blade_curved_*`, `blade_straight_*`, `launcher_*`), resolved via `getWeaponStripForFunctionalType` with `isPlaceholderAsset: false` across all 101 canonical weapons.
  - **Palette Row Selection (`resolveSpriteStripSliceCoords`)**: Unmodified **`Custom`** weapons render **`row: 0`** (Base Iron/Steel), unmodified **`Magitech`** unique weapons render **`row: 12`** (Gilded/Unique variant), hardware-modified weapons without a socketed Gem render **`row: 12`**, and gem-socketed weapons render **`row: 1..11`** mapped via `VERTICAL_STRIP_GEM_ROW_MAP` by the primary socketed Gemstone.

### 1B. The 72 Customizable Weapons (9 Shared Functional Types × 8 Weapon Classes)

| Weapon Class | Type 1 | Type 2 | Type 3 | Type 4 | Type 5 | Type 6 | Type 7 | Type 8 | Type 9 |
|---|---|---|---|---|---|---|---|---|---|
| **Shields** | Buckler | Heater | Tower | Norman | Scutum | Corona | Mote | Disc | Rhom |
| **Bows** | Self Bow | Short Bow | Flat Bow | Recurve Bow | Reflex Bow | Composite Bow | Long Bow | Compound Bow | Great Bow |
| **Casters** | Bolt Caster | Beam Caster | Arc Caster | Pulse Caster | Wave Caster | Blast Caster | Nova Caster | Meteoric Caster | Stellar Caster |
| **Spears** | Short Spear | Winged Spear | Javelin | Spetum | Broad Spear | Partisan | Pike | Boar Spear | Lance |
| **Impact & Axes** | Cudgel | Mace | Spike | Hammer | Mallet | Tomahawk | Parashu | Labrys | Battle Axe |
| **Blades: Curved** | Wakizashi | Katana | Khopesh | Shotel | Odachi | Kilij | Falx | Dao | Dadao |
| **Blades: Straight** | Cinquedea | Spatha | Falchion | Arming Sword | Bastard Sword | Messer | Zweihander | Flamberge | Executioner Sword |
| **Carriers & Munitions** | Bandolier | Quiver | Yebira | Battery | Sheaf | Rack | Plumbata | Kaad | Pangao |

### 1C. The 29 Unique Magitech Weapons (Dissolved into the 8 Weapon Classes & Functional Types)

| Name | Trait Line | Weapon Class | Functional Class (`Magitech`) | Damage Type | Weight | Skill Count | Loadout Slot | Identity |
|---|---|---|---|---|---|---|---|---|
| N-55 Gladius | Warrior | Casters | Bolt Caster | Impact | Medium | 3 | Weapon 1, Weapon 2 | BCU reference weapon, burst-fire stabilization |
| M-300 Hasta | Warrior | Bows | Compound Bow | Impact | Medium | 3 | Weapon 3 | Mid-range sustained fire |
| M-450 Pilum | Warrior | Bows | Great Bow | Impact | Heavy | 4 | Weapon 4 | Shock-channeling, heavy hitter |
| S-2 Turbine Khopesh | Warrior | Blades: Curved | Khopesh | Pierce | Light | — | Aux 1, Aux 2 | Compact fallback, dual-wield capable |
| B-25 Brushcutter | Marauder | Casters | Bolt Caster | Pierce | Heavy | — | Weapon 1 | Twin-rotor, intercept + suppression |
| M-350 Mauler | Marauder | Casters | Blast Caster | Blast | Medium | — | Weapon 2 | Three-shot burst suppression |
| LN-1200 Avalanche | Marauder | Carriers & Munitions | Rack | Blast | Heavy | — | Weapon 3 | Long-range, interference shielding |
| LG-950 Tomahawk | Marauder | Carriers & Munitions | Battery | Blast | Heavy | — | Weapon 4 | Long-range, soft lock |
| Siegebreaker | Marauder | Impact & Axes | Battle Axe | Impact | Heavy | — | Aux 1 | Two-handed, integrated energy vent |
| LS-900 Swordspear | Guardian | Spears | Partisan | Wave (Mana) | Medium | — | Weapon 1 | Mana-channeling, cleave strikes |
| RS-450 Radiant Projector | Guardian | Casters | Beam Caster | Beam | Medium | — | Weapon 2 | Mid-range, shield reinforcement |
| HL-220 Lightburst Lance | Guardian | Spears | Lance | Beam | Heavy | — | Weapon 3 | Reactor-linked, Judgment Strike |
| TIG Edge / Guardian's Edge | Guardian | Blades: Straight | Arming Sword | Pulse | Light | — | Aux 1 | Compact, precision melee defense |
| Aegis Charge Buckler | Guardian | Shields | Buckler | Impact | — | — | Aux 2 | Physical shield, enables Shield Charge feat |
| SV-12 Viper | Rogue | Casters | Bolt Caster | Pierce | Light | — | Weapon 1 | High fire rate, close-range burst |
| SV-18 Serpent | Rogue | Casters | Bolt Caster | Pierce | Light | — | Weapon 2 | Suppressed, mid-range stealth operations |
| SR-440 Shadowfang | Rogue | Casters | Bolt Caster | Pierce | Medium | — | Weapon 3 | Critical amplification, long-range precision |
| S-4 Whisper Blade | Rogue | Blades: Straight | Cinquedea | Pierce | Light | — | Aux 1 | Monomolecular edge, dual-wield capable |
| S-6 Phantom Edge | Rogue | Blades: Straight | Spatha | Pierce | Light | — | Aux 2 | Thermal-coated, heat-dampened strikes |
| WZ-800 Arclight Cannon | Wizard | Casters | Stellar Caster | Beam | Heavy | — | Weapon 1 | Long-range, sustained fire |
| WZ-650 Prism Lance | Wizard | Casters | Beam Caster | Beam | Medium | — | Weapon 2 | Focusing crystal, variable intensity |
| WZ-450 Sparkstrike | Wizard | Casters | Arc Caster | Pulse | Medium | — | Weapon 3 | Rapid burst, close-range defense |
| WZ-200 Manacore Staff | Wizard | Spears | Spetum | Wave (Mana) | Heavy | — | Weapon 4 | AoE discharge, area denial |
| ARC Conductor | Wizard | Casters | Pulse Caster | Pulse | Light | — | Aux 1 | Emergency sidearm |
| CL-700 Sanctifier | Cleric | Casters | Beam Caster | Beam / Pierce | Medium | — | Weapon 1 | Adaptive damage type per target |
| CL-500 Absolution | Cleric | Casters | Wave Caster | Beam | Medium | — | Weapon 2 | Area purification, ally buff on sustained fire |
| CL-350 Litany | Cleric | Casters | Pulse Caster | Pulse | Medium | — | Weapon 3 | Ally buff application on hit |
| Hallowed Scepter | Cleric | Impact & Axes | Mace | Wave / Impact | Medium | — | Weapon 4 | Melee + ranged healing pulses |
| Grace Edge | Cleric | Blades: Straight | Spatha | Pierce | Light | — | Aux 1 | Healing pulse on critical hit |

## 2. ARMOR / CORE FRAMES & HARDWARE DOMAIN RULES

### 2A. Physical Domain Separation, Load Brackets, Armory Workbench & Gem Socket Laws (`LOCKED`)
- **Exterior Armor vs. Internal Hardware**: Only **Dome Plates** (`slot: 'head'`), **Aperture Plates** (`slot: 'arms'`), **Frame Platings** (`slot: 'plating'`), and physical/ward **Shields** grant Armor (`armorDurability`, `armorRating`, `armorThreshold`). Internal sub-modules (**Optics**, **Sensory A/B**, **Actuators**, **Reactor Core**, **Leg Actuators**) never grant armor values; they strictly modify their mechanical domains (`lightBonus`, `accuracyMult`, `staggerDamageMult`, `tellDurationMult`, `attackMassBonus`, `stabilityBonus`, `heatVentMult`, `cooldownMult`, `moveSpeedMult`, `capacityBonus`).
- **Mech Doll `LOADOUT` vs. `ARMORY` Workbench**:
  - **`LOADOUT`**: Displays a central interactive **Mech Doll** surrounded by selectable anatomical hardpoint nodes (`Head Dome`, `Frame Plating`, `Arm Assembly`, `Leg Striders`, `Main Hand`, `Side Hand`, `Auxiliary Back Mount`, and `[L]`/`[R]` Trigger Binds) with a 4-action Slot Context Menu (`Equip / Swap`, `Unequip`, `Stance / Grip Toggle`, and `Modify in Armory`), a nested **3-tier Weapon Selector** (`8 Weapon Classes` ▸ `9 Shared Functional Weapon Types` ▸ `Custom / Magitech Subtypes`), and `128×128` technical schematics.
  - **`ARMORY`**: Houses all equipment modification systems—**Weapon Component Parts** (`3` slots on `Custom` weapons; locked on `Magitech` unique weapons), **Weapon Gem Sockets** (`3` slots on `Custom` weapons; `1` socket on `Magitech` unique weapons), **Internal Sub-Modules**, **Hardware Gem Sockets**, and **Action Modifications** (`Structure / Melee`, `Integration / Ranged`, `Mobility Kit`).
- **Non-Sequential Modification Slot Order & Semantic `Custom` Naming**:
  - Modifications and Gemstones can be installed, replaced, or removed in **any slot order** (`Slot 1`, `Slot 2`, or `Slot 3`) using positional slot encoding (`<baseId>::<slot1>+<slot2>+<slot3>` with `'none'` placeholders).
  - Modified items use semantic **`Custom`** placement (`formatModifiedEquipmentName`): **`Custom <BaseName>`** for standard weapon and armor nouns (e.g., `Custom Camelot Longsword`, `Custom Heater`) and **`<BaseName> Custom`** for alphanumeric model designations and manufacturer-coded hardware (e.g., `N-55 Gladius Custom`, `BWI Bastion Frame Plating Custom`), followed by **`+II`** or **`+III`** when 2 or 3 slots are populated.
- **Slot-Adaptive Gemstones**: Socketing a Gemstone into exterior armor modifies physical mitigation/durability/shielding, whereas socketing the same Gemstone into an internal sub-module adapts its bonus to that slot's physical function.
- **Crafted vs. Looted Mod Parts**: Mod parts crafted from Gemstones (`origin: 'crafted'`) have variable gem costs and at most `1` additional gem slot (`maxGemSlots <= 1`). Looted or standalone components (`origin: 'looted'`) have `1–3` gem slots (`maxGemSlots: 1..3`).
- **Zero-Sum Trade-Off Law**: Every stat increase carries a paired negative draw on another stat or equip weight (`drawbackDescription`).
- **Percentage Load Limit Brackets**: Total weight capacity is defined by Frame Plating base capacity (`84..140 WT`), Frame sub-mods (Reactor Core + Leg Actuators + Mobility Kit), and System Feats (`+22 WT` per step):
  - `0–30%` = **Light** (`+8%` Mobility, `-10%` Heat, `-10%` Swap Time) — *Rogue starts at `29%`*
  - `31–65%` = **Medium** (`1.0×` baseline) — *Warrior (`55%`), Cleric (`54%`), Dawnforge Guardian (`59%`), and Wizard (`54%`) start in Medium*
  - `66–100%` = **Heavy** (`-10%` Mobility, `+12%` Heat, `+18%` Swap Time) — *Marauder starts at `81%`*
  - `>100%` = **Overloaded** (`-35%` Mobility, `+35%` Heat, `+45%` Swap Time, stealth broken)

| Name | Trait Line | Type | Base Capacity | Weight | Armor (DUR / RTG / THR) | Shield | Identity & Trade-Off |
|---|---|---|---|---|---|---|---|
| BWI Bastion Frame Plating | Warrior | Physical / Reactive | Medium (`90 WT`) | `15 WT` | `135 / 11 / 7` | `+55` | Heavy frontal turbine shielding (`+4%` Venting, `+6` Stability / `-2%` Speed) |
| Fire & Ice Fortress Frame Plating | Marauder | Physical / Hardened | Heavy (`112 WT`) | `32 WT` | `205 / 15 / 11` | `+35` | Super-heavy frontal outrigging stabilizers (`+18` Stability / `-6%` Speed) |
| Dawnforge Guardian Frame Plating | Guardian | Physical / Layered | Medium (`90 WT`) | `17 WT` | `170 / 13 / 9` | `+75` | Stabilizer anchors & shield emitters (`+12` Stability / `-3%` Speed) |
| Shadowcraft Recon Frame Plating | Rogue | Physical / Ablative | Light (`84 WT`) | `7 WT` | `95 / 6 / 4` | `+40` | Ultralight emission dampeners (`+6%` Speed, `+0.5` Light / `-8` Stability) |
| Arcanum Heavy Projector Frame Plating | Wizard | Physical / Layered | Medium (`90 WT`) | `15 WT` | `120 / 8 / 6` | `+95` | Reinforced crystal lattice (`-6%` Cooldowns, `+0.5` Light / `-4` Stability) |
| Sanctum Support Frame Plating | Cleric | Physical / Reactive | Medium (`90 WT`) | `15 WT` | `145 / 10 / 7` | `+70` | Distributed buffer systems (`+6%` Venting, `-4%` Cooldowns / `-2%` Speed) |

## 3. CORE SYSTEMS (GENERATORS / REACTORS)

| Name | Trait Line | Identity |
|---|---|---|
| PNSY Alchemic Turbine Core Mk.IV | Warrior | Magitech engine, volatile heat output, supports overclock |
| RAD Battleheart Ether Reactor Mk.V | Marauder | Ether reactor with recycling feedback loops |
| TI Manaheart Reactor Mk.IV | Guardian | Powers shields, aura projection, cleave systems |
| VX Phantom Core Mk.III | Rogue | Low-emission reactor, stealth and burst |
| ARC Infinite Well Reactor Mk.VI | Wizard | Massive energy pool, sustained discharge, overflow venting |
| SANC Heartwell Reactor Mk.IV | Cleric | Balanced, overflow distribution to ally systems |

## 4. AUX / UTILITY SYSTEMS (DEFENSIVE & TACTICAL)

| Name | Trait Line | Slot | Type | Identity |
|---|---|---|---|---|
| PNSY R-11 Rockweiler Buckler | Warrior | Aux 3 | Physical Shield | Parrying shield, reactive plating |
| PNSY UF-9 Rough Rider Booster | Warrior | Aux 4 | Mobility | Engagement/evasion kit with thrusters |
| PNSY D-0g Repair Drone | Warrior | Utility | Utility | Bay-launched repair drone |
| RAD R-22 Bastion Kinetic Recycling | Marauder | Aux 3 | Armor Augment | Reactive plating absorbs energy, recycles power |
| RAD UF-12 Ether Vapor Launcher | Marauder | Aux 4 | Utility | Vision obscurement, targeting scramble |
| RAD R463 Fathomless System | Marauder | Utility | Self-Repair | Excess energy repairs subsystems and armor |
| TI Aegis Hard-Light Shield | Guardian | Aux 3 | Energy Shield | Deployable frontal barrier (Hardening Light) |
| TI Radiant Sphere Generator | Guardian | Aux 4 | Energy Shield | Protective dome around allies |
| TI Lightwell Recovery System | Guardian | Utility | Self-Repair | Converts excess reactor energy to subsystem and shield repair |
| VX Eclipse Cloak Generator | Rogue | Aux 3 | Stealth | Active camouflage, heat masking |
| VX Phase-Shift Module | Rogue | Aux 4 | Evasion | Brief intangibility burst |
| VX Smoke Dispersal System | Rogue | Utility | Utility | Obscurement canisters, thermal masking |
| ARC Prismatic Barrier | Wizard | Aux 3 | Energy Shield | Refracts incoming beams |
| ARC Feedback Loop Capacitor | Wizard | Aux 4 | Energy Shield | Absorbs energy attacks, stores for counter-discharge |
| ARC Rift Anchor | Wizard | Utility | Mobility | Short-range teleport escape (energy-intensive) |
| SANC Aegis Restoration Field | Cleric | Aux 3 | Repair | Area-effect shield and armor repair for allies |
| SANC Martyrdom Plating | Cleric | Aux 4 | Armor Augment | Reactive armor redirects ally damage to self |
| SANC Radiant Ward Projector | Cleric | Utility | Barrier | Deployable barrier absorbs status effects and damage |

## 5. OPTICS & SENSORS

| Name | Trait Line | Slot | Identity |
|---|---|---|---|
| Crystal Dynamics EmberSight Suite | Warrior | Optics | Mid-short range targeting, fast acquisition |
| Federated T7 Sensor Array | Warrior | Sensory A | Heat and motion battlefield monitor |
| Federated EchoPulse Scanner | Warrior | Sensory B | Acoustic scanner, breach detection |
| BE Foresight Targeting Array | Marauder | Optics | Long-range, missile tracking |
| NDS ArcPulse Sensor Grid | Marauder | Sensory A | Blast disruption scanner |
| NDS EchoStorm Threat Analyzer | Marauder | Sensory B | Missile lock detection |
| Aegis Radiant Targeting Array | Guardian | Optics | Shield projection and cleave precision |
| Solbright Flux Sensor Grid | Guardian | Sensory A | Shield harmonics and battlefield awareness |
| Aegis Lightveil Analyzer | Guardian | Sensory B | Artillery saturation and shield stress |
| Veilsight Targeting Suite | Rogue | Optics | Low-light optics, thermal masking, critical point identification |
| VX Phantom Network Sensor | Rogue | Sensory A | Motion tracker, stealth detection countermeasures |
| VX Echo-Null Scanner | Rogue | Sensory B | Acoustic dampening, breach prediction |
| ARC Omniscient Array | Wizard | Optics | Long-range, energy signature tracking, beam focusing |
| ARC Manaflow Analyzer | Wizard | Sensory A | Energy field monitor, discharge timing optimization |
| ARC Convergence Predictor | Wizard | Sensory B | Beam trajectory calculator, weak-point targeting |
| SANC Providence Scanner | Cleric | Optics | Ally status monitoring, priority threat identification |
| SANC Lifeline Monitor | Cleric | Sensory A | Real-time ally health and status tracking |
| SANC Blessing Resonance Grid | Cleric | Sensory B | Buff duration optimizer, ally position tracker |

## 6. FRAME COMPONENTS BY LOADOUT (HEAD / ARMS / LEGS / ENERGY STORAGE)

| Trait Line | Slot | Component | Description |
|---|---|---|---|
| Warrior | Head | Crystal Dynamics G341 Murmillio | Reinforced helm, alchemic optic core, heat-dispersing vents |
| Warrior | Arms | BWI Twinstrike Gauntlets | Recoil dampeners, reinforced joints for sustained fire |
| Warrior | Legs | BWI Gatecrasher Striders | Shock-absorbing, booster-linked actuators |
| Warrior | Energy Storage | Crystal Dynamics ERD Lodestone | Field-controlled energy reservoir for rapid discharge |
| Marauder | Head | BE Ironveil Command Dome | Layered shielding, interference dampeners |
| Marauder | Arms | Fire & Ice Line Holder | Shock-channeling conduits, reinforced recoil bracing |
| Marauder | Legs | Fire & Ice Outrigger Striders | Heavy plates, enhanced stability under siege |
| Guardian | Head | Aegis Halo Command Dome | Mana-channeling conduits, tactical shield uplink |
| Guardian | Arms | Solbright Cleaver Assemblies | Reactor-linked sword-spear channels |
| Guardian | Legs | Dawnforge Stabilizer Striders | Heavy-duty, stabilizer anchors (supports Unfaltering feat) |
| Rogue | Head | VX Veilsight Command Helm | Low-light optics, thermal dampening |
| Rogue | Arms | Shadowcraft Silencer Gauntlets | Recoil suppression, vibration dampening |
| Rogue | Legs | Shadowcraft Ghost Striders | Silent actuators, burst acceleration |
| Rogue | Energy Storage | VX Shadow Capacitor | Rapid-discharge for mobility and critical strikes |
| Wizard | Head | ARC Omniscient Command Dome | Crystal lattice, long-range energy signature tracking |
| Wizard | Arms | Arcanum Channeler Assemblies | Energy conduits, beam focusing arrays |
| Wizard | Legs | Arcanum Anchor Striders | Energy grounding, recoil absorption |
| Cleric | Head | SANC Providence Command Helm | Ally status HUD, priority threat assessment |
| Cleric | Arms | Sanctum Benediction Assemblies | Hybrid weapon integration, ally buff emitters |
| Cleric | Legs | Sanctum Steadfast Striders | Stabilizer anchors for support positioning |

## 7. FEATS — TIER I

| Feat | Trait Line | Tier | Requirement | Effect |
|---|---|---|---|---|
| Booster Evasion | Warrior | I | Booster kit equipped | Grants i-frames during boost |
| Momentum Guard | Warrior/Marauder | I | Booster kit | Stagger resistance while boosting |
| Radiant Step | Warrior/Guardian | I | Booster kit + mana core | Boost leaves radiant shimmer granting allies stagger resistance |
| Radiant Dash | Warrior/Guardian | I | Booster kit + mana core | Boost leaves radiant afterimage that blinds enemies |
| Siege Stability | Marauder | I | Heavy/super-heavy chassis | Outriggers grant stagger immunity while firing heavy weapons |
| Anchored Action | Marauder/Guardian | I | Stabilizer frame + shield/booster | While anchored, evasion or shield charge gains stagger immunity |
| Stabilizer Pulse | Marauder/Guardian | I | Stabilizer frame + energy shield | Anchored shield emits pulse reducing ranged damage for allies |
| Shield Charge | Guardian | I | Physical shield | Charge toward enemy with shield raised; impact stuns 1.5 sec |
| Shadow Step | Rogue | I | Mobility system | Dash grants brief invisibility (capped at stealth duration max) |
| Phantom Strike | Rogue/Wizard | I | Cloak + energy weapon | Attacks from stealth deal bonus energy damage |
| Surgical Precision | Rogue/Cleric | I | — | Critical hits restore small amount of ally shield within 10 m |
| Veil of Mercy | Rogue/Cleric | I | Cloak + support reactor | Stealth applies brief ally damage reduction aura |
| Beam Focus | Wizard | I | Energy weapon equipped | Standing still increases beam damage by 15% |
| Radiant Overflow | Wizard/Cleric | I | Energy reactor + support system | Excess energy creates small heal-over-time zone |
| Empowered Blessing | Wizard/Cleric | I | Energy weapon + buff system | Weapon hits extend active buff durations by 0.5 sec |
| Reactive Healing | Cleric | I | Support reactor | Ally within 15 m below 30% HP auto-pulse heals 15% HP; cooldown 20 sec per ally |

## 8. FEATS — TIER II

| Feat | Trait Line | Tier | Requirement | Effect |
|---|---|---|---|---|
| Sidearm Twin-Link | Warrior | II | Matching sidearms | Dual strike execution |
| Suppression Link | Warrior/Marauder | II | Matching suppression weapons | Burst or sustained fire triggers twin-link bursts |
| Shielded Volley | Warrior/Guardian | II | Shield + sidearms | Fire sidearms while shielding |
| Twin Guard | Warrior/Guardian | II | Shield + sidearms | Suppressive fire while defending |
| Radiant Intercept | Warrior/Guardian | II | Intercept weapon + mana core | Intercept shots emit radiant flare that blinds enemies |
| Suppression Chainfire | Marauder | II | Suppression/intercept weapon | Sustained fire builds suppression stacks |
| Aura of Suppression | Marauder/Guardian | II | Mana core + suppression weapon | Aura reduces enemy accuracy and movement |
| Guardian's Interference | Guardian/Marauder | II | Mana core + interference launcher | Aura scrambles enemy targeting |
| Protector's Aura | Guardian | II | Mana core | Reserves energy as interference shielding for self and nearby allies; prevents ranged energy damage (except AoE); deflects but does not fully block small arms |
| Backstab Mastery | Rogue | II | — | Attacks from behind deal +50% damage |
| Arcane Ambush | Rogue/Wizard | II | Cloak + beam weapon | First attack from stealth overcharges beam for +100% damage |
| Phase Beam | Rogue/Wizard | II | Phase-shift module + energy weapon | Brief intangibility allows firing through cover |
| Healing Shadow | Rogue/Cleric | II | Stealth + support field | Allies near cloaked position receive shield restoration over time |
| Mercy Strike | Rogue/Cleric | II | — | Critical hit on enemy applies brief ally damage buff within 10 m |
| Sustained Channeling | Wizard | II | Beam weapon | Continuous fire on same target +5% damage per sec (max 25%) |
| Energy Redistribution | Wizard/Cleric | II | Support reactor | Taking damage transfers energy to nearby allies |
| Shared Resonance | Wizard/Cleric | II | Buff system + energy pool | Ally buffs reduce own energy costs by 10% |
| Purification Beam | Cleric/Wizard | II | Support reactor + energy weapon | Beam attacks cleanse ally debuffs in path |
| Martyr's Resolve | Cleric | II | Support reactor | When redirecting damage to self via Martyrdom effects, gain +20% damage reduction |

## 9. FEATS — TIER III

| Feat | Trait Line | Tier | Requirement | Effect |
|---|---|---|---|---|
| Sidearm Parry | Warrior | III | Parry-capable sidearm | Enables defensive parry |
| Attrition Riposte | Warrior/Marauder | III | Parry weapon | Successful parries restore reactor energy; once per enemy attack cycle |
| Reactive Overload | Warrior/Marauder | III | Suppression weapon | Damage taken reduces cooldowns; stacks decay after 5 sec |
| Overclock Guard | Warrior/Marauder | III | Overclock core + defensive plating | Overclock hardens plating, reduces damage, increases reactor heat |
| Overload Cleave | Warrior/Guardian | III | Mana reactor + melee | Cleave builds overload stacks (cap 3); next boost restores shield energy |
| Cleave Counter | Warrior/Guardian | III | Mana reactor + parry weapon | Parry triggers radiant cleave wave |
| Attrition Guard | Marauder | III | Defensive plating | Converts incoming damage into reactor energy; diminishing returns per trigger |
| Radiant Barrage | Marauder/Guardian | III | Mana reactor + heavy weapon | Cleave triggers short burst barrage |
| Cleave Suppression | Guardian/Marauder | III | Mana reactor + suppression weapon | Cleave applies suppression stacks; suppression immunity window on enemies |
| Radiant Cleave | Guardian | III | Mana reactor + main slot melee | Charge melee for 180° sweep releasing mana-energy wave; one secondary effect per cleave |
| Assassinate | Rogue | III | — | Critical hit against target above 90% HP deals +200% damage |
| Phantom Barrage | Rogue/Wizard | III | Cloak + rapid-fire weapon | Stealth attacks trigger burst fire with no heat cost |
| Void Strike | Rogue/Wizard | III | Phase-shift + energy weapon | Intangibility attacks bypass shields and armor entirely |
| Guardian Angel | Rogue/Cleric | III | Cloak + support field | While stealthed, redirect 50% of ally damage to self |
| Vital Strike | Rogue/Cleric | III | — | Critical hits heal self and nearby allies for 10% of damage dealt |
| Overcharge | Wizard | III | Energy reactor | Sacrifice 30% energy pool to boost next attack by 150% |
| Convergence Field | Wizard/Cleric | III | Energy overflow + support system | Standing near allies boosts their energy regen by 25% |
| Empowered Ward | Wizard/Cleric | III | Energy shield + buff system | Shields on allies reflect 25% damage back to attacker |
| Benediction Pulse | Cleric/Wizard | III | Support system + energy weapon | Killing blows pulse heal to all allies in 20 m radius |
| Mass Restoration | Cleric | III | Support reactor + area healing system | Healing fields 2× radius, +25% HP restored; must satisfy Law 3 HPS rule |

## 10. FEATS — TIER IV

| Feat | Trait Line | Tier | Requirement | Effect |
|---|---|---|---|---|
| Main Weapon Twin-Link | Warrior | IV | Matching main weapons | Fire all 4 simultaneously |
| Overclock Barrage | Warrior/Marauder | IV | Overclock core + suppression weapon | Resets cooldowns, boosts suppression fire rate; adds reactor heat each use; cannot reset Core Overclock |
| Disruption Riposte | Warrior/Marauder | IV | Interference launcher | Activation grants brief parry window |
| Guardian's Dash | Warrior/Guardian | IV | Booster kit + energy shield | Boost through enemies triggers shield pulse, stuns 1.5 sec and restores ally shields; 10 sec cooldown |
| Overclocked Ward | Warrior/Guardian | IV | Overclock core + energy shield | Boosts shield recharge, grants CC immunity |
| Suppression Ward | Warrior/Guardian | IV | Energy shield + suppression weapon | Shield activation projects suppression stacks onto enemies |
| Disruption Field | Marauder | IV | Interference launcher | Aura doubles effect duration |
| Unyielding Bulwark | Marauder/Guardian | IV | Heavy frame + energy shield | CC immunity while shielding allies |
| Siege Ward | Guardian/Marauder | IV | Heavy frame + radiant sphere | Dome grants stagger/stun immunity to allies |
| Unfaltering | Guardian | IV | Heavy or super-heavy frame | While buffing an ally, immune to CC for buff duration |
| Perfect Ambush | Rogue | IV | — | First attack from stealth is automatic critical with +100% critical damage |
| Dimensional Strike | Rogue/Wizard | IV | Phase-shift + energy weapon | Teleport behind target, guaranteed critical, return to origin |
| Spectral Volley | Rogue/Wizard | IV | Cloak + energy weapon | Fire while cloaked without breaking stealth (3 sec window, consumes stealth duration) |
| Merciful Execution | Rogue/Cleric | IV | — | Killing blow heals all allies for 25% of target's max HP |
| Shadow Sanctuary | Rogue/Cleric | IV | — | Deploy stealth field cloaking and healing allies in 10 m radius for 5 sec |
| Arcane Mastery | Wizard | IV | — | All beam weapons ignore 50% of target energy resistance |
| Font of Power | Wizard/Cleric | IV | Support reactor + energy pool | Allies within 20 m gain +30% energy regeneration |
| Barrier Network | Wizard/Cleric | IV | Energy shield | Ally shields chain together, sharing damage absorption |
| Consecrated Ground | Cleric/Wizard | IV | — | Deployable zone heals allies and damages enemies inside it (10 sec) |
| Selfless Sacrifice | Cleric | IV | Martyrdom system | When ally would die, redirect lethal damage to self; if self survives both gain damage immunity 3 sec; cooldown 60 sec |

## 11. FEATS — TIER V

| Feat | Trait Line | Tier | Requirement | Effect | Status |
|---|---|---|---|---|---|
| Core Overclock | Warrior | V | Overclock core | Resets all cooldowns, volatile heat tradeoff; cannot reset itself or other reset feats | — |
| Salvo Link | Warrior/Marauder | V | Matching heavy weapons | Chain into twin-link salvo bursts | — |
| Avalanche Surge | Warrior/Marauder | V | Artillery optics | Salvos overclock into rapid multi-target chains at heat cost; escalating energy cost per chain | — |
| Lightstorm Barrage | Warrior/Guardian | V | Mana reactor + artillery optics | Radiant salvo projectiles deal cleave damage | — |
| Lightstorm Salvo | Warrior/Guardian | V | Mana reactor + artillery optics | Radiant salvo projectiles deal suppression damage | — |
| Multi-Lock Array | Marauder | V | Artillery optics | Salvo systems lock multiple targets | — |
| Judgment Battery | Marauder/Guardian | V | Mana reactor + artillery optics | Cleave restores energy, boosts salvo lock speed | Pending BCU validation |
| Radiant Convergence | Marauder/Guardian | V | Mana reactor + radiant sphere generator | Cleave/salvo inside sphere amplifies ally damage briefly | — |
| Avalanche Light | Guardian/Marauder | V | Mana reactor + artillery optics | Radiant salvo inflicts suppression damage | — |
| Hardening Light | Guardian | V | Energy shield | Attacks against energy shield return a portion of damage and restore that amount of energy to reactor | Pending BCU loop analysis |
| Shadow Master | Rogue | V | — | Cloak duration doubled; can attack without breaking stealth; 8 sec cap limits attacks to 3 in window | — |
| Quantum Assassin | Rogue/Wizard | V | — | 3-target chain teleport; each target within 20 m of last; 0.5 sec landing vulnerability after each teleport | Revised |
| Phantom Artillery | Rogue/Wizard | V | Cloak + beam weapon | Enter stealth, plant immobile turret mode, fire sustained beam at +200% damage while invisible | Pending BCU validation |
| Divine Veil | Rogue/Cleric | V | — | Zone cloaking all allies with status effect immunity for 8 sec | — |
| Angel of Death | Rogue/Cleric | V | — | After stealth kill: flat BCU-validated heal and +50% damage buff for 6 sec | Revised |
| Arcane Annihilation | Wizard | V | — | 800% damage beam, pierces all targets; requires 3 sec immobile channel with visible charge-up; interruption cancels discharge; cooldown 120 sec | Revised |
| Infinite Wellspring | Wizard/Cleric | V | — | Team heal requiring active 10 m proximity; costs energy per heal tick; falls off if caster takes damage | Revised |
| Empowered Singularity | Wizard/Cleric | V | Energy reactor + buff system | Deploy zone amplifying all ally damage by 60% for 12 sec | — |
| Radiant Apocalypse | Cleric/Wizard | V | Support reactor + energy weapon | Beam heals allies and damages enemies simultaneously in path | Pending BCU validation |
| Martyrdom Transcendent | Cleric | V | — | Redirect 60% of ally damage within 30 m for 8 sec; self HP floor 10%; redirected damage hits Cleric shield first; heal after 50% of damage absorbed; cooldown 180 sec | Revised |

## 12. REWARD FEATS

| Feat | Source | Effect |
|---|---|---|
| Knight's Oath | Combined boss fight (Percival, Tristan, Bors) | +10% damage vs Camelot enemies (permanent) |
