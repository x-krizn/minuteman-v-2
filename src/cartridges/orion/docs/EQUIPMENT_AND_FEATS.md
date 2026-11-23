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
  - **Ranged Weapons & Description-Matched Projectile Hierarchy (`Bolts < Pulses < Waves`, `Beams`, `Arcs` — `resolveRangedBasicShotProfile` & `effectsRenderer.ts`)**:
    - All non-Bow ranged weapons feature doubled (`+100%` / `2×`) basic attack ammo (`shotsPerChain: 8..20`) and distinct per-type projectile silhouettes and collision physics (`ProjectileVisualShape` in `types/combat.ts`) that strictly match their authored weapon descriptions:
      - **Strict Size & Shape Hierarchy (`Bolts < Pulses < Waves`)**:
        - **Bolts (`visualShape: 'bolt'`, `radius: 2.1–2.6 px`)**: Fired by `Bolt Caster`, `N-55 Gladius`, `B-25 Brushcutter`, `SV-12 Viper`, `SV-18 Serpent`, `SR-440 Shadowfang`, and `M-300 Hasta`. Rendered as compact, high-velocity diamond/needle penetrators with slim slipstream wakes—the smallest and tightest projectile class.
        - **Pulses (`visualShape: 'pulse'`, `radius: 4.2 px`)**: Fired by `Pulse Caster`, `ARC Conductor`, and `CL-350 Litany`. Rendered as medium double-concentric harmonic resonance rings with a bright phase core and trailing acoustic wake—distinctly larger than Bolts (`2.1–2.6 px`) and smaller than Waves (`6.8–7.6 px`).
        - **Waves (`visualShape: 'wave'`, `radius: 6.8–7.6 px`, `waveSpanPx: 18–26 px`)**: Fired by `Wave Caster`, `Sanctum Æther Catalyst`, `SANC Aegis Restoration Field`, and hybrid Wave polearms/staves (`LS-900 Swordspear`, `WZ-200 Manacore Staff`, `Hallowed Scepter`). Rendered and collided as wide, expanding horizontal crescent wave crests (`pierceRemaining: 1..4`) that sweep across firing lanes.
      - **Beam Weapons (`visualShape: 'beam'`, `beamLengthPx: 30–46 px`)**: Fired by `Beam Caster`, `Stellar Caster`, `WZ-800 Arclight Cannon`, `WZ-650 Prism Lance`, `RS-450 Radiant Projector`, `CL-700 Sanctifier`, `CL-500 Absolution`, and `HL-220 Lightburst Lance`. Rendered as elongated collimated laser/plasma lances (outer photonic bloom sheath + intense white core ray + lens flare tip) that check collision along their full ray segment and pierce through targets (`pierceRemaining: 1..3`).
      - **Arc Weapons (`visualShape: 'arc'`, `chainCount: 2..4`, `chainRangePx: 48–54 px`)**: Fired by `Arc Caster` and `WZ-450 Sparkstrike`. Rendered as crackling, multi-segment zig-zag lightning bolts with branching fork spurs that physically jump and chain to nearby unhit enemies on impact.
      - **Specialist Casters, Bows & Carrier Munitions**:
        - **Bows, Quivers & Sheaves (`'arrow'`, `'javelin'`)**: Fletched shafts with metallic broadhead/bodkin tips (`M-450 Pilum` and `Javelin` hurls use heavy piercing `'javelin'` shafts).
        - **Plumbata & Bandoliers (`'dart'`)**: Lead-weighted high-arc plunging darts (`lobVz: 18`) and quick-toss percussion darts.
        - **Ordnance Racks & Missiles (`'rocket'`, `Rack`, `LN-1200 Avalanche`, `LG-950 Tomahawk`, `Battery`)**: Finned rockets with flickering thruster exhaust plumes (`Battery` and `LG-950 Tomahawk` apply continuous `homingStrength` soft-lock steering toward targets).
        - **Blast, Nova & Meteoric Casters (`'blast_shell'`, `'nova_orb'`, `'bolide'`)**: Pressurized explosive canisters, equatorial-ringed Nova spheres, and high-arc molten Meteoric bolides (`lobVz: 24`) that detonate in shockwave craters.
    - **Only Basic Attack (`Action 1` / `moveset[0]`) uses the reload function** (including double-tapping `[X]` for a tactical early reload & heat vent). Non-basic ranged skills (`Actions 2–5`) never enter a manual reload state; instead, they specify explicit `ammoCount` multi-round bursts/salvos or `internalCharges` per-shot internal reloads (`internalCycleSec: 0.65s–0.80s`) that enter their full cooldown once depleted.
  - **Tactical Skills (`Actions 2–5` — Enacted Description Mechanics)**: Every weapon skill in `Slots 1–4` (`systems/combat/skillBehaviors.ts` & `skillExecution.ts`) enacts its authored tactical movement and payload behavior: forward lunges/dashes, aerial vaults/leaps (`vz` impulse), evasive backsteps, inward hook/wrench pulls with `2.25×` Layer 1 shield strip, `55%` around-shield bypass strikes (`Shotel`, `Falx`, `Khopesh`, `Flamberge`), heavy shoves, thrown javelins/axes (`'javelin'`), returning boomerang/chakram discs (`'chakram'` on `Disc`, `Corona`, `Rhom`, `Tomahawk`), piercing line beams (`'beam'`), chaining lightning arcs (`'arc'`), wide tidal wave crests (`'wave'`), parabolic mortar/bolide lobs with AoE crater rings, and `360°` omnidirectional whirlwinds/novas.
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
  - **Weapon Slot Eligibility, 2H Side-Holstering & Back Launcher Ownership (`canEquipWeaponInSlot`, `performAuxiliarySwap` — `LOCKED`)**:
    - **2H Weapons (`isTwoHandOnlyWeapon`)**: Restricted to **Main Slot (`slot1`) only** unless overridden by a Feat (`phalanx_specialist`, `daisho_specialist`, `feat_marauder_3`, `feat_marauder_5`, `feat_warrior_5`, `feat_guardian_5`), Unique counterbalanced Magitech trait (`LS-900 Swordspear`, `M-350 Mauler`, `Hallowed Scepter`, `CL-700 Sanctifier`, `WZ-650 Prism Lance`), Legendary flag (`isLegendary`), or versatile weapon variable (`Bastard Sword`, `allowOneHandGrip`, `allowSideSlot`).
    - **1H Weapons & Shields (`isOneHandWeapon`)**: Equippable in **Main (`slot1`) or Side (`slot2`) slot** (never `slot3`).
    - **Launchers & Carriers (`isLauncherEquipment` — `Carriers & Munitions`, including `LN-1200 Avalanche` & `LG-950 Tomahawk`)**: Equippable in **both Side Hand (`slot2`) and Aux Slot (`slot3`, Back Mount)** so Main + Carrier Specialist Doctrines (`Sword & Dart`, `Hoplite Skirmisher`, `Viking Raider`, `Rondel & Quiver`, `Caster & Battery`) can pair in `slot2` or `slot3`. Equipping a Carrier in `slot2` **never alters its rendered position** on the mech—it always renders dorsally on the back mount (`playerSpriteSystem.ts`).
    - **Back Launchers Never Move to Side Hand on Swap (`auxActive`)**: Pressing Weapon Swap (`[L]` / `performAuxiliarySwap`) toggles active secondary skill ownership (`equipmentSlots.auxActive`) on the Back Launcher (`slot3`). The Launcher **stays mounted on the back** (`slot3`) and takes ownership of Skills 4 and 5 (`ac4–ac5`) while the Main weapon retains Skills 1–3 (`ac1–ac3`).
    - **2H Grip with Side Weapon Equipped (`isSideWeaponHolstered`)**: When wielding a 2H weapon (or 2H grip) in `slot1` while a 1H weapon or Shield is equipped in `slot2`, the **Side weapon (`slot2`) stays in `slot2` and is holstered at the hip** (rendered sheathed with a hip-holster clasp overlay) while the **Launcher stays on the back (`slot3`)**.
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
| LN-1200 Avalanche | Marauder | Carriers & Munitions | Rack | Blast | Heavy | — | Aux 1 | Long-range, interference shielding |
| LG-950 Tomahawk | Marauder | Carriers & Munitions | Battery | Blast | Heavy | — | Aux 1 | Long-range, soft lock |
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
- **Non-Sequential Modification Slot Order, 61 Bespoke Weapon Components & Semantic `Custom` Naming (`LOCKED`)**:
  - **3-Slot Non-Sequential Anatomy (`CONTACT`, `DELIVERY`, `REGULATION`)**: All 72 `Custom` weapons feature 3 non-sequential component slots (`Slot 1`, `Slot 2`, `Slot 3`) mapped to three physical domains: **`CONTACT`** (*Blade / Head / Point / Arrowhead / Emitter Nozzle / Face Plate / Warhead Payload*), **`DELIVERY`** (*Hilt / Haft / Collar / Limbs / Accelerator Barrel / Rim & Boss / Feed & Magazine*), and **`REGULATION`** (*Pommel / Counterweight / Butt-Spike / Riser / Capacitor & Heatsink / Harness / Guidance*). Any domain can be installed into any slot index in any order, with at most **1 component per domain** per weapon instance.
  - **61 Bespoke Weapon Components (`28 Crafted` + `33 Looted` in `weaponComponentCatalog.ts`)**:
    - **`CRAFTED` Blueprints (`28` total)**: Forged directly at the Armory Workbench using **Scrap + Gemstone(s)** (`recipe: { scrapCost, gemstones }`), expose **`1` Gem Socket (`maxGemSlots: 1`)**, and never drop in world loot tables.
    - **`LOOTED` Field Salvage (`33` total)**: Recovered from starter salvage pools, world reliquaries/caches, and enemy/boss drops (`recipe: null`), expose **`1–3` Gem Sockets (`maxGemSlots: 1..3`)**, and cannot be forged at the workbench.
  - **Deterministic `CONTACT`-Only Damage-Type Conversion**: A weapon's Action 1 `DamageType` (`Impact`, `Pierce`, `Beam`, `Blast`, `Pulse`, `Wave`) is determined by its base profile unless overridden by an installed **`CONTACT`** domain component (`damageTypeOverride`). **`DELIVERY`**, **`REGULATION`**, and socketed Gemstones are strictly forbidden from changing a weapon's `DamageType`.
  - **Modified items use semantic `Custom` placement (`formatModifiedEquipmentName`)**: **`Custom <BaseName>`** for standard weapon and armor nouns (e.g., `Custom Camelot Longsword`, `Custom Heater`) and **`<BaseName> Custom`** for alphanumeric model designations and manufacturer-coded hardware (e.g., `N-55 Gladius Custom`, `BWI Bastion Frame Plating Custom`), followed by **`+II`** or **`+III`** when 2 or 3 slots are populated (whether by installed components or gemstones).
- **Slot-Adaptive Gemstones**: Socketing a Gemstone into exterior armor modifies physical mitigation/durability/shielding, whereas socketing the same Gemstone into an internal sub-module or weapon component gem socket adapts its bonus to that slot's physical function.
- **Physical Domain Separation (`Shields` Only for Layer 2 Armor)**: Weapon components on non-`Shields` classes (`Blades`, `Impact & Axes`, `Spears`, `Bows`, `Casters`, `Carriers & Munitions`) never grant Layer 2 Armor stats (`DUR`, `RTG`, `THR`). Only `Shields` components (*Reinforced Face Plate*, *Layered Sacrificial Confront*, *Spiked Boss & Rim*) modify Layer 2 Armor Durability, Threshold, or Rating.
- **Zero-Sum Trade-Off Law**: Every stat increase carries a paired negative draw on another stat or equip weight (`drawbackDescription`), and cumulative Combat Tempo multipliers are hard-clamped to **`[0.70×, 1.30×]` (`±30%`)**.
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

## 7. THE 113-NODE FEAT CONSTELLATION & FIVE GOLDEN RULES (`P-01` – `P-05`)

The **113-Node Hexagonal Feat Constellation** (`90` Groomed Core Feats + `22` Standalone Specialist Martial Stances + `1` Campaign Reward Feat) is organized into **3 Macro-Umbrellas** subdividing into the **6 Combat Discipline Sectors**:

- **`Fighter` Umbrella**: **`Warrior`** (Kinetic Assault, Dual-Wielding, Thermal Overclock, Rapid Ballistics) + **`Guardian`** (Aegis Shields, Radiant Barriers, Vanguard Charges, Cleave Waves)
- **`Scholar` Umbrella**: **`Wizard`** (Sustained Beams, Stationary Focus, Phase/Spatial Geometry, Energy Reactors) + **`Cleric`** (Harmonic Wards, Triage Pulses, Sanctified Zones, Self-Sacrifice)
- **`Rogue` Umbrella**: **`Marauder`** (Heavy Siege Ordnance, Outrigger Bracing, Kinetic Recycling, Area Suppression) + **`Rogue`** (Optical Camouflage, Backstab/Ambush Precision, Phase Evasion, Self-Only Siphon)

### The Five Golden Rules of Feat Progression

| Rule ID | Rule Name | Mechanical Contract |
|---|---|---|
| **`Rule P-01`** | **1:1 Level-to-Feat Cap** | Active socketed feats scale **`1:1` with Character Level** (`Lv 1 = 1 feat`, `Lv 13 = 13 feats`, `Lv 20 = 20 feats max`). |
| **`Rule P-02`** | **Tiers Measure Customization Depth** | Tiers `I–V` represent radial customization depth from the center of the hex chart, not rigid level gates. Tiers `I–IV` have **no per-tier slot caps**, and **tier-jumping is permitted** inside any chain (`Tier I → III` or `Tier I → IV` once any earlier step in that chain is socketed). |
| **`Rule P-03`** | **Tier V Apex Ceiling (`Max = 2`)** | At most **`2` Tier V capstones** (`0`, `1`, or `2`) may be socketed per build. |
| **`Rule P-04`** | **Selective Chain Links (No Spaghetti Web)** | Only **`18` mechanical chains (`C-01` through `C-18`)** draw prerequisite lines on the star chart. Standalone Core Feats and the `22` Specialist Martial Stances have **zero prerequisite lines**. |
| **`Rule P-05`** | **Weapon-Agnostic Event & Geometry Triggers** | Core Feats trigger off **physical events** (`μ = 0` stationary focus for `0.75s`, off-hand parries, melee cleaves, stealth strikes, high-impulse slams) so Bows, Casters, Blades, Spears, Axes, and Shields all share the same core constellation. |

---

## 8. FEATS — TIER I (`15 Core Feats`)

| Feat | Umbrella / Sector | Tier | Chain | Requirement | Effect |
|---|---|---|---|---|---|
| Booster Evasion | Fighter (`Warrior`) | I | `C-01` (Step 1) | Booster kit | Grants brief `i-frames` during booster dash |
| Momentum Guard | Fighter / Rogue (`Warrior/Marauder`) | I | `C-07` (Step 1) | Booster kit | Grants stagger resistance while boosting |
| Radiant Dash | Fighter (`Warrior/Guardian`) | I | `C-08` (Step 1) | Booster kit + Mana core | Boost leaves a radiant shimmer (+Stagger Res) and blinds adjacent enemies (`1.0s`) |
| Siege Stability | Rogue (`Marauder`) | I | `C-09` (Step 1) | Heavy / Super-heavy chassis | Outriggers grant stagger immunity while firing heavy weapons |
| Anchored Action | Rogue / Fighter (`Marauder/Guardian`) | I | `C-09` (Step 2) | Stabilizer frame + Shield / Booster | While anchored, evasion or shield charge gains stagger immunity |
| Stabilizer Pulse | Fighter / Rogue (`Guardian/Marauder`) | I | `C-14` (Step 1) | Stabilizer frame + Energy shield | Anchored shield emits a pulse reducing incoming ranged damage |
| Shield Charge | Fighter (`Guardian`) | I | Standalone | Physical shield | Charge toward enemy with shield raised; impact stuns `1.5s` |
| Shadow Step | Rogue (`Rogue`) | I | `C-15` (Step 1) | Mobility system | Dash grants brief invisibility (capped at max stealth window) |
| Phantom Strike | Rogue / Scholar (`Rogue/Wizard`) | I | `C-03` (Step 1) | Cloak + Ranged / Caster weapon | Attacks from stealth deal bonus energy/precision damage |
| Surgical Precision | Rogue / Scholar (`Rogue/Cleric`) | I | Standalone | — | Critical hits restore a small amount of shield within `10m` |
| Veil of Mercy | Rogue / Scholar (`Rogue/Cleric`) | I | `C-02` (Step 1) | Cloak / Stealth utility | Entering stealth grants **self-only** `-15%` incoming damage reduction for `2.5s` |
| Anchored Focus | Scholar (`Wizard`) | I | `C-04` (Step 1) | Any Ranged / Caster weapon | Remaining stationary (`μ = 0` for `0.75s`) increases ranged/beam/spell damage by `+15%` |
| Radiant Overflow | Scholar (`Wizard/Cleric`) | I | `C-18` (Step 1) | Energy reactor + Support system | Excess energy creates a small heal-over-time zone |
| Empowered Blessing | Scholar (`Wizard/Cleric`) | I | Standalone | Buff / Support system | Weapon hits extend active buff durations by `+0.5s` |
| Reactive Healing | Scholar (`Cleric`) | I | `C-18` (Step 1) | Support reactor | Self or ally within `15m` below `30%` HP auto-pulse heals `15%` HP (`20s` CD) |

## 9. FEATS — TIER II (`18 Core Feats`)

| Feat | Umbrella / Sector | Tier | Chain | Requirement | Effect |
|---|---|---|---|---|---|
| Sidearm Twin-Link | Fighter (`Warrior`) | II | `C-06` (Step 1) | Dual 1H weapons / Matching sidearms | Synchronized dual-strike execution |
| Suppression Link | Fighter / Rogue (`Warrior/Marauder`) | II | `C-10` (Step 2) | Paired rapid-fire / suppression weapons | Burst or sustained fire triggers twin-linked volleys |
| Guarded Fire | Fighter (`Warrior/Guardian`) | II | Standalone | Shield + 1H weapon / sidearm | Fire 1H weapons while maintaining active guard and build minor suppression |
| Radiant Ward Flare | Fighter (`Warrior/Guardian`) | II | `C-08` (Step 2) | Parry / Block / Intercept + Mana core | Parries, blocks, or intercept shots emit a radiant flare that blinds nearby enemies (`1.2s`) |
| Suppression Chainfire | Rogue (`Marauder`) | II | `C-10` (Step 1) | Rapid-fire / Suppression weapon | Sustained fire builds cumulative suppression stacks |
| Aura of Suppression | Rogue / Fighter (`Marauder/Guardian`) | II | `C-11` (Step 1) | Mana core + Suppression weapon | Aura reduces nearby enemy accuracy and movement speed |
| Guardian's Interference | Fighter / Rogue (`Guardian/Marauder`) | II | `C-11` (Step 1) | Mana core + Interference launcher | Aura scrambles enemy targeting locks |
| Protector's Aura | Fighter (`Guardian`) | II | `C-14` (Step 2) | Mana core | Reserves energy as interference shielding that blocks ranged energy fire and deflects small arms |
| Backstab Mastery | Rogue (`Rogue`) | II | `C-16` (Step 1) | — | Attacks from behind deal `+50%` damage |
| Arcane Ambush | Rogue / Scholar (`Rogue/Wizard`) | II | `C-03` (Step 2) | Cloak + Ranged / Caster weapon | First attack from stealth overcharges projectile/beam for `+100%` damage |
| Phase Shot | Rogue / Scholar (`Rogue/Wizard`) | II | `C-17` (Step 1) | Phase-shift module + Ranged weapon | Brief intangibility allows projectiles/beams to pierce cover obstacles |
| Healing Shadow | Rogue / Scholar (`Rogue/Cleric`) | II | `C-02` (Step 2) | Cloak / Stealth utility | While cloaked, your **own** Layer 1 Shield regenerates `+50%` faster |
| Mercy Strike | Rogue / Scholar (`Rogue/Cleric`) | II | Standalone | — | Critical hits apply a brief damage buff within `10m` |
| Sustained Channeling | Scholar (`Wizard`) | II | `C-04` (Step 2) | Any Ranged / Caster weapon | Consecutive hits or sustained fire on the same target ramp damage by `+5%/s` (max `+25%`) |
| Energy Redistribution | Scholar (`Wizard/Cleric`) | II | Standalone | Support reactor | Taking damage transfers reactor energy to nearby allies / shield reserves |
| Shared Resonance | Scholar (`Wizard/Cleric`) | II | Standalone | Buff system + Energy pool | Active buffs reduce your own energy/heat costs by `-10%` |
| Purification Sweep | Scholar (`Cleric/Wizard`) | II | Standalone | Support reactor | Line attacks, beam sweeps, or wide melee arcs cleanse debuffs in their path |
| Martyr's Resolve | Scholar (`Cleric`) | II | `C-05` (Step 1) | Support reactor | Gain `+20%` damage reduction when redirecting or absorbing damage via Martyrdom effects |

## 10. FEATS — TIER III (`20 Core Feats`)

| Feat | Umbrella / Sector | Tier | Chain | Requirement | Effect |
|---|---|---|---|---|---|
| Off-Hand Deflection | Fighter (`Warrior`) | III | Standalone | Any non-shield off-hand / 2H parry | Enables precision off-hand weapon parry with `+0.06s` perfect parry window |
| Attrition Riposte | Fighter / Rogue (`Warrior/Marauder`) | III | Standalone | Parry-capable weapon | Successful parries restore reactor energy / vent `-10` heat (once per attack cycle) |
| Reactive Overload | Fighter / Rogue (`Warrior/Marauder`) | III | `C-07` (Step 2) | Any weapon | Taking damage reduces active skill cooldowns (stacks decay after `5s`) |
| Overclock Guard | Fighter / Rogue (`Warrior/Marauder`) | III | Standalone | Overclock core + Defensive plating | Overclock hardens plating and reduces damage at increased reactor heat |
| Overload Cleave | Fighter (`Warrior/Guardian`) | III | `C-12` (Step 2) | Mana reactor + Melee weapon | Cleave builds overload stacks (cap `3`); next boost restores shield energy |
| Cleave Counter | Fighter (`Warrior/Guardian`) | III | `C-12` (Step 2) | Mana reactor + Parry weapon | Successful parry triggers an automatic radiant cleave wave |
| Attrition Guard | Rogue (`Marauder`) | III | Standalone | Defensive plating | Converts incoming damage into reactor energy with diminishing returns |
| Radiant Barrage | Rogue / Fighter (`Marauder/Guardian`) | III | `C-13` (Step 1) | Mana reactor + Heavy weapon | Cleave or heavy slam triggers a short follow-up burst barrage |
| Cleave Suppression | Fighter / Rogue (`Guardian/Marauder`) | III | `C-12` (Step 2) | Mana reactor + Melee / Suppression | Cleave applies suppression stacks to hit enemies |
| Radiant Cleave | Fighter (`Guardian`) | III | `C-12` (Step 1) | Mana reactor + Main-hand melee | Charged melee unleashes a `180°` mana-energy wave |
| Assassinate | Rogue (`Rogue`) | III | `C-16` (Step 2) | — | Critical hit against target above `90%` HP (or below `40%` execute threshold) deals massive bonus damage |
| Phantom Barrage | Rogue / Scholar (`Rogue/Wizard`) | III | `C-03` (Step 3) | Cloak + Ranged weapon | Stealth attacks trigger rapid burst fire with zero heat cost |
| Void Strike | Rogue / Scholar (`Rogue/Wizard`) | III | `C-17` (Step 2) | Phase-shift + Any weapon | Attacks during intangibility bypass enemy shields and armor |
| Shadow Aegis | Rogue / Scholar (`Rogue/Cleric`) | III | Standalone | Cloak | Breaking stealth with an attack converts `20%` of damage dealt into a temporary Layer 1 Overshield (`4s`) |
| Vital Strike | Rogue / Scholar (`Rogue/Cleric`) | III | Standalone | — | Critical hits restore `10%` of damage dealt to self |
| Overcharge | Scholar (`Wizard`) | III | `C-04` (Step 3) | Energy reactor | Spend `30%` energy pool (or `+22` heat) to boost next attack by `+150%` |
| Convergence Field | Scholar (`Wizard/Cleric`) | III | `C-18` (Step 2) | Energy overflow + Support system | Standing near allies / anchor boosts energy regen by `+25%` |
| Empowered Ward | Scholar (`Wizard/Cleric`) | III | Standalone | Energy shield + Buff system | Active shields reflect `25%` of damage back to the attacker |
| Benediction Pulse | Scholar (`Cleric/Wizard`) | III | Standalone | Support system | Killing blows pulse heal to self and allies in a `20m` radius |
| Mass Restoration | Scholar (`Cleric`) | III | `C-18` (Step 2) | Support reactor + Area healing | Healing fields gain `2×` radius and `+25%` HP restored (obeys Law 3 HPS rule) |

## 11. FEATS — TIER IV (`20 Core Feats`)

| Feat | Umbrella / Sector | Tier | Chain | Requirement | Effect |
|---|---|---|---|---|---|
| Main Weapon Twin-Link | Fighter (`Warrior`) | IV | `C-06` (Step 2) | Dual weapons / Aux rig | Fires linked primary and off-hand/aux weapon mounts simultaneously |
| Overclock Barrage | Fighter / Rogue (`Warrior/Marauder`) | IV | `C-07` (Step 3) | Overclock core | Resets weapon skill cooldowns and boosts fire/strike rate at heat cost (cannot reset Core Overclock) |
| Disruption Riposte | Fighter / Rogue (`Warrior/Marauder`) | IV | Standalone | Interference / Utility module | Activating utility/interference grants a brief parry window |
| Guardian's Dash | Fighter (`Warrior/Guardian`) | IV | `C-01` (Step 2) | Booster kit + Energy shield | Boost through enemies triggers a shield pulse that stuns `1.5s` and restores shields (`10s` CD) |
| Overclocked Ward | Fighter (`Warrior/Guardian`) | IV | `C-08` (Step 3) | Overclock core + Energy shield | Boosts shield recharge and grants crowd-control immunity |
| Suppression Ward | Fighter (`Warrior/Guardian`) | IV | Standalone | Energy shield | Shield activation projects suppression stacks onto nearby enemies |
| Disruption Field | Rogue (`Marauder`) | IV | `C-11` (Step 2) | Interference launcher | Doubles interference/suppression aura duration |
| Unyielding Bulwark | Rogue / Fighter (`Marauder/Guardian`) | IV | `C-09` (Step 3) | Heavy frame + Energy shield | Grants crowd-control immunity while shielding |
| Siege Ward | Fighter / Rogue (`Guardian/Marauder`) | IV | `C-14` (Step 3) | Heavy frame + Radiant sphere | Protective dome grants stagger and stun immunity inside its radius |
| Unfaltering | Fighter (`Guardian`) | IV | Standalone | Heavy / Super-heavy frame | Grants crowd-control immunity for the duration of active buffs |
| Perfect Ambush | Rogue (`Rogue`) | IV | `C-16` (Step 3) | — | First attack from stealth is an automatic critical hit with `+100%` critical damage |
| Dimensional Strike | Rogue / Scholar (`Rogue/Wizard`) | IV | `C-17` (Step 3) | Phase-shift | Teleport behind target for a guaranteed critical hit, then return to origin |
| Spectral Volley | Rogue / Scholar (`Rogue/Wizard`) | IV | `C-03` (Step 4) | Cloak + Ranged weapon | Fire while cloaked without breaking stealth (`3s` window, consumes stealth duration) |
| Shadow Siphon | Rogue / Scholar (`Rogue/Cleric`) | IV | `C-02` (Step 3) | — | Stealth attacks siphon `15%` of damage dealt directly into your **own** Shield / Frame integrity |
| Phantom Shroud | Rogue / Scholar (`Rogue/Cleric`) | IV | `C-15` (Step 2) | Mobility / Cloak system | Dashing through an enemy attack during `i-frames` triggers `2.0s` stealth and cleanses `1` debuff |
| Arcane Mastery | Scholar (`Wizard`) | IV | `C-04` (Step 4) | — | Sustained or charged attacks ignore `50%` of target energy/armor resistance |
| Font of Power | Scholar (`Wizard/Cleric`) | IV | `C-18` (Step 3) | Support reactor + Energy pool | Grants `+30%` energy regeneration and heat venting within `20m` |
| Barrier Network | Scholar (`Wizard/Cleric`) | IV | Standalone | Energy shield | Links active shields to distribute and share damage absorption |
| Consecrated Ground | Scholar (`Cleric/Wizard`) | IV | Standalone | — | Deployable `10s` zone heals allies and damages enemies inside it |
| Selfless Sacrifice | Scholar (`Cleric`) | IV | `C-05` (Step 2) | Martyrdom system | Intercepts lethal damage and grants `3s` damage immunity on survival (`60s` CD) |

## 12. FEATS — TIER V (`17 Apex Capstones` · Rule P-03 Max 2)

| Feat | Umbrella / Sector | Tier | Chain | Requirement | Effect |
|---|---|---|---|---|---|
| Core Overclock | Fighter (`Warrior`) | V | `C-07` (Step 4) | Overclock core | Resets all skill cooldowns at a volatile heat trade-off (cannot reset itself or other reset feats) |
| Salvo Link | Fighter / Rogue (`Warrior/Marauder`) | V | `C-06` (Step 3) | Heavy / Dual weapons | Chains heavy or paired weapons into twin-linked salvo bursts |
| Avalanche Surge | Fighter / Rogue (`Warrior/Marauder`) | V | `C-10` (Step 3) | Artillery optics | Salvos overclock into rapid multi-target chains at escalating heat and energy cost |
| Multi-Lock Array | Rogue (`Marauder`) | V | `C-11` (Step 3) | Artillery optics | Salvo systems lock onto multiple targets simultaneously |
| Judgment Battery | Rogue / Fighter (`Marauder/Guardian`) | V | `C-13` (Step 2) | Mana reactor + Artillery optics | Cleave strikes restore reactor energy and accelerate salvo lock speed |
| Radiant Convergence | Rogue / Fighter (`Marauder/Guardian`) | V | `C-14` (Step 4) | Mana reactor + Radiant sphere | Executing cleave or salvo inside your radiant sphere amplifies damage |
| Lightstorm Convergence | Fighter / Rogue (`Guardian/Marauder`) | V | `C-12` (Step 3) | Mana reactor + Artillery optics | Radiant salvos unleash a `3.5m` cleave shockwave on impact and apply `2` suppression stacks |
| Hardening Light | Fighter (`Guardian`) | V | `C-08` (Step 4) | Energy shield | Hits against your energy shield reflect damage and restore reactor energy |
| Shadow Master | Rogue (`Rogue`) | V | `C-15` (Step 3) / `C-16` (Step 4) | — | Doubles cloak duration and allows up to `3` attacks without breaking stealth (`8s` cap) |
| Quantum Assassin | Rogue / Scholar (`Rogue/Wizard`) | V | `C-17` (Step 4) | — | `3`-target chain teleport strike within `20m` (`0.5s` landing vulnerability after each jump) |
| Phantom Sniper | Rogue / Scholar (`Rogue/Wizard`) | V | `C-03` (Step 5) | Cloak + Any Ranged / Caster weapon | Standing still for `1.25s` engages optical camo (`+120%` next ranged shot). *Balance Rule*: Charging any weapon prevents stealth; pressing or releasing an attack input applies a `0.75s` `Revealed` debuff blocking stealth. |
| Angel of Death | Rogue / Scholar (`Rogue/Cleric`) | V | `C-02` (Step 4) | — | Stealth kills restore `25%` of your **own** max Shield + `15%` Frame Integrity and grant `+50%` damage for `6s` |
| Reaper's Shroud | Rogue / Scholar (`Rogue/Cleric`) | V | Standalone | — | Dropping below `35%` Frame Integrity automatically triggers a `4.0s` personal cloak, cleanses all CC/status effects, and grants `+25%` move speed (`45s` CD) |
| Arcane Annihilation | Scholar (`Wizard`) | V | `C-04` (Step 5) | — | `3s` immobile channeled charge unleashes an `800%` damage piercing discharge (`120s` CD) |
| Infinite Wellspring | Scholar (`Wizard/Cleric`) | V | `C-18` (Step 4) | — | Sustained `10m` proximity restoration aura fueled by energy per tick |
| Empowered Singularity | Scholar (`Wizard/Cleric`) | V | Standalone | Energy reactor + Buff system | Deploys a `12s` zone amplifying all damage by `+60%` |
| Martyrdom Transcendent | Scholar (`Cleric`) | V | `C-05` (Step 3) | — | Absorbs `60%` of damage within `30m` into your shield first (`10%` HP floor) for `8s`, then releases a restorative burst (`180s` CD) |

## 13. REWARD FEAT, 22 SPECIALIST MARTIAL STANCES & 13 EMERGENT HISTORICAL META-CLASSES

### 13.1 Campaign Reward Feat (`1 Node`)

| Feat | Source | Effect |
|---|---|---|
| **Knight's Oath** | Combined boss fight (**Sir Percival**, **Sir Tristan**, **Sir Bors**) | **`+10%` damage** vs Camelot enemies (permanent; `0` prerequisite lines) |

### 13.2 Standalone Specialist Martial Stances (`22 Nodes` — Zero Prerequisite Lines)

All **22 Specialist Martial Stances** (`3` Tier I, `13` Tier II, `6` Tier III) are standalone weapon-mastery nodes (`Rule P-04`) distributed across the 6 Combat Discipline sectors. Both **Custom (`72`)** and **Magitech (`29`)** weapons qualify by shared **Functional Weapon Type** (`resolveWeaponFunctionalType`). When socketed and paired with matching equipment and Frame Load Bracket (`Light` / `Medium` / `Heavy`), the stance overrides **Action 2**, **Action 4**, and **Action 5** and applies passive BCU/Inertia modifiers:

| Feat ID | Feat Name | Historical Martial Stance | Umbrella / Sector | Tier | Qualifying Pairing & Load Bracket |
|---|---|---|---|---|---|
| `spear_buckler_specialist` | Spear & Buckler Specialist | Darting Viper Stance | Fighter (`Warrior`) | I | `Short Spear`/`Winged Spear`/`Partisan`/`Spetum` + `Buckler`/`Disc`/`Mote` · Light/Medium |
| `sword_buckler_specialist` | Sword & Buckler Specialist | I.33 Ward & Bind Stance | Rogue (`Rogue`) | I | `Arming Sword`/`Spatha`/`Messer`/`Falchion` + `Buckler`/`Disc`/`Mote` · Light/Medium |
| `pistol_cutlass_specialist` | Boarder Specialist | Brace & Cutlass Stance | Rogue (`Rogue`) | I | `Falchion`/`Messer`/`Kilij`/`Dao`/`Khopesh`/`Wakizashi` ↔ `Bolt`/`Pulse`/`Blast`/`Arc Caster` · Light/Medium |
| `limitanei_specialist` | Limitanei Specialist | Plumbata & Spatha Stance | Fighter (`Warrior`) | II | `Spatha`/`Arming Sword`/`Falchion` + `Plumbata`/`Bandolier` · Light/Medium |
| `longbow_specialist` | Yeoman Longbow Specialist | Agincourt Stake-Line Stance | Fighter (`Warrior`) | II | `Long Bow`/`Great Bow`/`Flat Bow`/`Self Bow`/`Compound Bow` + `Quiver`/`Sheaf`/`Bandolier` · Medium/Heavy |
| `repeating_arbalest_specialist` | Repeating Arbalest Specialist | Chu-Ko-Nu Volley Stance | Fighter (`Warrior`) | II | `Bolt Caster`/`Pulse Caster`/`Blast Caster` + `Bandolier`/`Quiver`/`Rack`/`Battery` · Light/Medium/Heavy |
| `legionary_specialist` | Legionary Specialist | Pilum & Scutum Stance | Fighter (`Guardian`) | II | `Spatha`/`Cinquedea`/`Arming Sword` + `Scutum`/`Tower`/`Norman` · Medium/Heavy |
| `spear_shield_specialist` | Spear & Shield Specialist | Hoplite Othismos Stance | Fighter (`Guardian`) | II | `Short`/`Winged`/`Broad`/`Boar Spear`/`Partisan` + `Heater`/`Norman`/`Scutum`/`Tower`/`Corona`/`Rhom` · Medium/Heavy |
| `knightly_bastard_specialist` | Knightly Bastard Specialist | Fiore Posta di Donna Stance | Fighter (`Guardian`) | II | `Bastard Sword`/`Arming Sword`/`Spatha` + `Heater`/`Norman`/`Corona`/`Rhom` · Medium/Heavy |
| `daisho_specialist` | Daisho Specialist | Niten Ichi-Ryu Stance | Rogue (`Rogue`) | II | `Katana`/`Odachi`/`Dao`/`Kilij` + `Wakizashi`/`Cinquedea` · Light/Medium |
| `rapier_dagger_specialist` | Rapier & Dagger Specialist | Destreza & Main-Gauche Stance | Rogue (`Rogue`) | II | `Spatha`/`Arming Sword`/`Messer` + `Cinquedea`/`Wakizashi` · Light/Medium |
| `mounted_archer_specialist` | Mounted Archer Specialist | Parthian Cantabrian Stance | Rogue (`Rogue`) | II | `Recurve`/`Reflex`/`Composite`/`Short`/`Compound Bow` + `Quiver`/`Yebira` · Light/Medium |
| `shield_breaker_specialist` | Shield-Breaker Specialist | Thracian Rhomphaia Stance | Rogue (`Marauder`) | II | `Shotel`/`Falx`/`Khopesh` (+ optional Shield/Blade/Carrier) · Light/Medium/Heavy |
| `viking_raider_specialist` | Viking Raider Specialist | Huscarl Skjaldborg Stance | Rogue (`Marauder`) | II | `Battle Axe`/`Tomahawk`/`Parashu`/`Labrys` + `Norman`/`Heater`/`Buckler`/`Sheaf`/`Kaad` · Medium/Heavy |
| `battlemage_specialist` | Spellblade Specialist | Aether-Conduit Edge Stance | Scholar (`Wizard`) | II | `Arming`/`Bastard Sword`/`Spatha`/`Katana`/`Khopesh` ↔ `Beam`/`Arc`/`Wave`/`Pulse`/`Nova Caster` · Light/Medium |
| `scepter_orb_specialist` | Scepter & Ward Specialist | Sanctum Hierophant Stance | Scholar (`Cleric`) | II | `Mace`/`Cudgel`/`Hammer`/`Spike` + `Corona`/`Mote`/`Rhom`/`Disc`/`Buckler` · Medium/Heavy |
| `odachi_specialist` | Odachi Specialist | Nodachi Battojutsu Stance | Fighter (`Warrior`) | III | `Odachi`/`Dadao`/`Katana` (2H) · Light/Medium |
| `phalanx_specialist` | Phalanx Specialist | Syntagma Sarissa Stance | Fighter (`Guardian`) | III | `Pike`/`Lance`/`Broad Spear` + `Scutum`/`Tower`/`Norman` · Medium/Heavy |
| `cataphract_specialist` | Cataphract Specialist | Contus Clibanarii Stance | Fighter (`Guardian`) | III | `Lance`/`Pike`/`Boar Spear`/`Mace`/`Hammer` (+ optional Shield/Mace) · Heavy |
| `zweihander_specialist` | Zweihander Specialist | Landsknecht Doppelsöldner Stance | Rogue (`Marauder`) | III | `Zweihander`/`Flamberge`/`Executioner Sword` (2H) · Medium/Heavy |
| `artillery_battery_specialist` | Siege Battery Specialist | Bombardier Fire-Mission Stance | Rogue (`Marauder`) | III | `Blast`/`Meteoric`/`Nova`/`Stellar`/`Beam Caster` + `Rack`/`Battery`/`Pangao`/`Plumbata` · Heavy |
| `manacore_staff_specialist` | Archmage Staff Specialist | Astral Fulcrum Stance | Scholar (`Wizard`) | III | `Spetum`/`Partisan`/`Short Spear`/`Stellar`/`Beam`/`Wave Caster` (+ optional `Mote`/`Corona`/`Battery`) · Light/Medium |

### 13.3 Emergent Historical Meta-Classes (`13 Archetypes` — `evaluateEmergentMetaClass`)

Without locking any pilot into a permanent class, the Satchel `STATUS` and `FEATS` tabs automatically recognize **13 Emergent Historical Meta-Classes** from the pilot's socketed Umbrella combination, Specialist Stance, and signature chains:

| Historical Class Title | Umbrella Synthesis | Defining Stance / Feat Combination | Historical & Mechanical Fantasy |
|---|---|---|---|
| **Paladin / Hospitaller** | `Fighter` (`Guardian`) + `Scholar` (`Cleric`) | `Knightly Bastard` or `Scepter & Ward` + `Radiant Cleave` + `Consecrated Ground` / `Martyr's Resolve` | Sacred heavy vanguard who cleaves with radiant waves and sanctifies ground. |
| **Knight** | Pure `Fighter` (`Guardian` + `Warrior`) | `Knightly Bastard` or `Cataphract` + `Shield Charge` + `Unyielding Bulwark` | Armored shock lancer and sword-and-heater duelist with high Stability (`S`). |
| **Hoplite / Phalangite** | Pure `Fighter` (`Guardian`) | `Spear & Shield` or `Phalanx` + `Anchored Action` + `Protector's Aura` | Immovable spear-and-scutum shield wall with frontal guard speed. |
| **Samurai / Bushi** | `Fighter` (`Warrior`) + `Rogue` (`Rogue`) | `Odachi` or `Daisho` + `Off-Hand Deflection` + `Backstab Mastery` | Master of the two-sword *Niten Ichi-Ryu* parry-riposte and *Nodachi* draw-cuts. |
| **Landsknecht** | `Rogue` (`Marauder`) + `Fighter` (`Warrior`) | `Zweihander` + `Overload Cleave` + `Attrition Guard` | Frontline *Doppelsöldner* swinging wide figure-eight greatsword arcs through pike lines. |
| **Huscarl / Viking Raider** | `Rogue` (`Marauder`) + `Fighter` (`Guardian`) | `Viking Raider` or `Shield-Breaker` + `Shield Charge` + `Attrition Riposte` | Bearded-axe shield-hooker who rips open enemy guards and vents heat on impact. |
| **Yeoman / Marksman** | `Fighter` (`Warrior`) + `Rogue` (`Rogue`) | `Yeoman Longbow` or `Mounted Archer` + `Anchored Focus` + `Phantom Sniper` | Stationary stake-line longbowman or cantabrian horse-archer loosing armor-piercing volleys. |
| **Corsair / Swashbuckler** | `Rogue` (`Rogue`) + `Fighter` (`Warrior`) | `Boarder` or `Rapier & Dagger` + `Sidearm Twin-Link` + `Shadow Step` | Cutlass-and-caster deck stormer or *Destreza* duelist weaving point-blank shots into blade combos. |
| **Inquisitor** | `Scholar` (`Cleric`) + `Rogue` (`Rogue`) | `Veil of Mercy` → `Healing Shadow` → `Shadow Siphon` → `Angel of Death` (`C-02`) | Self-sustaining shadow executioner who cloaks, siphons shield energy on strike, and purges high-value targets. |
| **Spellblade / Battlemage** | `Scholar` (`Wizard`) + `Fighter` (`Warrior`) | `Spellblade` + `Phase Shot` + `Void Strike` + `Overcharge` | Aether-conduit swordsman who charges his blade with reactor overflow and teleports through cover. |
| **Hierophant / Cleric** | Pure `Scholar` (`Cleric`) | `Scepter & Ward` + `Reactive Healing` + `Mass Restoration` + `Martyrdom Transcendent` | Frontline harmonic anchor who absorbs damage into layered wards and pulses restorative waves. |
| **Archmage / Artillerist** | Pure `Scholar` (`Wizard`) | `Archmage Staff` + `Anchored Focus` → `Sustained Channeling` → `Arcane Annihilation` (`C-04`) | High-output astral fulcrum channeling sustained, resistance-piercing beam and wave artillery. |
| **Bombardier / Siegebreaker** | `Rogue` (`Marauder`) + `Scholar` (`Wizard`) | `Siege Battery` + `Siege Stability` + `Multi-Lock Array` + `Avalanche Surge` | Anchored heavy ordnance platform saturating the battlefield with multi-lock missile and blast salvos. |

