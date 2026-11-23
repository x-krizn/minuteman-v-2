# PROJECT ORION — EQUIPMENT & FEATS

## 1. WEAPONS (`115 CANONICAL WEAPONS` = `72 CUSTOMIZABLE` + `37 UNIQUE MAGITECH PURIST RELICS` + `6 LEGENDARY FOLKLORE ARTIFACTS`)

### 1A. Eight Broad Weapon Classes, Nine Shared Functional Types & Three Subtypes (`LOCKED`)
All weapons in Project Orion are classified into **8 broad Weapon Classes** (`WeaponCategory`), each containing **9 shared Functional Weapon Types** (`WEAPON_FUNCTIONAL_TYPES_BY_CATEGORY`). **Custom**, **Magitech**, and **Legendary** weapons all share the same functional weapon classes (for example, `S-2 Turbine Khopesh` is a `Magitech` subtype and `Knives of the Lake of Fire` is a `Legendary` subtype of `Khopesh` under `Blades: Curved`, alongside the `Custom` `Khopesh`):
1. **`Shields`** (`Buckler` .. `Rhom` + `TI-110 Aegis Buckler`, `TI-400 Aegis Scutum`, `TI-350 Radiant Corona`, `CL-150 Ward Mote`, `VX-10 Eclipse Disc` + Legendary `Aegis`)
2. **`Bows`** (`Self Bow` .. `Great Bow` + `M-300 Cantabrian Recurve`, `M-450 Arbalest Greatbow`)
3. **`Casters`** (`Bolt Caster` .. `Stellar Caster` + `N-55 Gladius`, `B-25 Brushcutter`, `M-350 Mauler`, `RS-450 Radiant Projector`, `SV-12 Viper`, `SR-440 Shadowfang`, `WZ-800 Arclight Cannon`, `WZ-650 Prism Lance`, `WZ-450 Sparkstrike`, `ARC Conductor`, `CL-500 Absolution`)
4. **`Spears`** (`Short Spear` .. `Lance` + `S-3 Viper Partisan`, `LS-900 Swordspear`, `HL-310 Sarissa Pike`, `HL-220 Lightburst Lance`, `WZ-200 Manacore Staff`)
5. **`Impact & Axes`** (`Cudgel` .. `Battle Axe` + `B-55 Skjaldborg Axe`, `CL-210 Sanctum Mace`)
6. **`Blades: Curved`** (`Wakizashi` .. `Dadao` + `S-2 Turbine Khopesh`, `S-4 Whisper Wakizashi`, `S-8 Ghost Katana`, `S-9 Turbine Odachi`, `B-40 Ripper Falx` + Legendary `Yawarakai-Te`, `Juuchi Yosamu`, `Knives of the Lake of Fire`)
7. **`Blades: Straight`** (`Cinquedea` .. `Executioner Sword` + `N-60 Limitanei Spatha`, `N-75 Praetorian Spatha`, `HL-110 Dawnblade`, `S-6 Phantom Messer`, `SV-22 Stiletto Spatha`, `S-5 Whisper Cinquedea`, `B-80 Doppelsöldner Greatsword`, `WZ-310 Æther Spatha` + Legendary `Excalibur`, `Balmung`)
8. **`Carriers & Munitions`** (`Bandolier` .. `Pangao` + `N-20 Rotary Bandolier`, `N-12 Plumbata Pod`, `M-10 Bodkin Quiver`, `VX-15 Ghost Yebira`, `LN-1200 Avalanche`, `LG-950 Tomahawk`)

- **`Custom` Subtype (`weaponTier: 'customizable'` — 72 Archetypes + Legacy Field Weapons)**: Have **3 Non-Sequential Component Slots** (`CONTACT`, `DELIVERY`, `REGULATION`) in the Armory Workbench, with nested gem sockets on each installed component (`1G` on Crafted components, `1–3G` on Looted field salvage).
- **`Magitech` Subtype (`weaponTier: 'unique'` — 37 Unique Magitech Purist Relics)**: Dissolved into the 8 Weapon Classes and their shared Functional Weapon Types while keeping their canonical manufacturer designations and preserved legacy epithets (*"the Siegebreaker"*, *"this hallowed scepter"*, *"Grace Edge"*, *"the Aegis Charge Buckler"*); governed by **Four Hardware Architecture Tiers (`0–3` Open Physical Component Mounts + `1G` Dedicated Factory Resonance Gem Socket)** and **Purist Resonance Passives** paired with the **22 Specialist Martial Stances** and **5 Core-Chain Apex Relics (`C-03`, `C-04`, `C-10`, `C-14`, `C-18`)**.
- **`Legendary` Subtype (`weaponTier: 'legendary'` — 6 Playable Folklore Artifacts across 5 World Entries)**: Reject all 61 standard physical components (`allowStandardMods: false`) and all 11 elemental gemstones (`maxGemSlots: 0`). Each carries a permanent rule-breaking **Engine Hook** (`LegendaryEngineHook`) tied to its origin world's folklore and area hazard, and 3 of the 5 world entries expose **1 Lore-Bound Companion Mount** (*The Scabbard of Avalon* on *Excalibur*, *Juuchi Yosamu* on *Yawarakai-Te*, and *Medusa's Head* on *Aegis*).
- **Weapon Combat Function Laws, Global `BCU = 54` Balance Parity & Anatomical Layering (`LOCKED`)**:
  - **Bows (`Bows` Class — Single-Shot Hold-to-Charge)**: All Bows (`Self Bow` .. `Great Bow`, `M-300 Cantabrian Recurve`, `M-450 Arbalest Greatbow`) are single-shot (`shotsPerChain: 1`, `isChargeable: true`) hold-to-charge weapons on `[X]`. Holding `[X]` draws the bow (`0% → 100%` over `maxChargeSec`), scaling Damage (`1.0× → 1.85×`), Projectile Velocity & Critical Sweet-Spot Range (`1.0× → 1.45×`), and Heat/Energy cost (`1.0× → 1.65×`). Releasing `[X]` fires the arrow and enters the single-arrow nock/reload cycle.
  - **Melee & Shield Weapons (`Spears`, `Impact & Axes`, `Blades: Curved`, `Blades: Straight`, `Shields` — Reload-Free Functional-Type Combos)**: Melee and Shield weapons never reload (`noReload: true`, `reloadDurationSec: 0`). Pressing or holding `[X]` chains through a fluid, functional-type-unique 2-to-5 step combo sequence (`buildWeaponUniqueComboSequence` in `database/equipment/weapons/comboChoreography.ts`) whose swing geometry (`swingStyle`: `slash` | `thrust` | `chop` | `bash` | `whirlwind`), per-step damage, range, arc, and lunge multipliers match each weapon's authored silhouette and description (e.g., `Khopesh` / `Shotel` / `Falx` hooked reach-around chops, `Wakizashi` / `Cinquedea` rapid multi-stab/slash flurries, `Pike` / `Lance` narrow high-reach thrusts, `Executioner Sword` / `Mallet` slow 2-step cleaves/slams, `Disc` / `Corona` rotary shield arcs). Pausing for the internal combo reset window (`comboResetWindowSec: 1.45s`) or completing the final combo finisher (`0.45s` Light / `0.58s` Medium / `0.75s` Heavy recovery) automatically resets the sequence to Step 1.
  - **Ranged Weapons & Description-Matched Projectile Hierarchy (`Bolts < Pulses < Waves`, `Beams`, `Arcs` — `resolveRangedBasicShotProfile` & `effectsRenderer.ts`)**:
    - All non-Bow ranged weapons feature doubled (`+100%` / `2×`) basic attack ammo (`shotsPerChain: 8..20`) and distinct per-type projectile silhouettes and collision physics (`ProjectileVisualShape` in `types/combat.ts`) that strictly match their authored weapon descriptions:
      - **Strict Size & Shape Hierarchy (`Bolts < Pulses < Waves`)**:
        - **Bolts (`visualShape: 'bolt'`, `radius: 2.1–2.6 px`)**: Fired by `Bolt Caster`, `N-55 Gladius`, `B-25 Brushcutter`, `SV-12 Viper`, `SR-440 Shadowfang`, and `M-300 Cantabrian Recurve`. Rendered as compact, high-velocity diamond/needle penetrators with slim slipstream wakes—the smallest and tightest projectile class.
        - **Pulses (`visualShape: 'pulse'`, `radius: 4.2 px`)**: Fired by `Pulse Caster` and `ARC Conductor`. Rendered as medium double-concentric harmonic resonance rings with a bright phase core and trailing acoustic wake—distinctly larger than Bolts (`2.1–2.6 px`) and smaller than Waves (`6.8–7.6 px`).
        - **Waves (`visualShape: 'wave'`, `radius: 6.8–7.6 px`, `waveSpanPx: 18–26 px`)**: Fired by `Wave Caster`, `Sanctum Æther Catalyst`, `SANC Aegis Restoration Field`, `CL-500 Absolution`, and hybrid Wave polearms/staves (`LS-900 Swordspear`, `WZ-200 Manacore Staff`, `CL-210 Sanctum Mace`). Rendered and collided as wide, expanding horizontal crescent wave crests (`pierceRemaining: 1..4`) that sweep across firing lanes.
      - **Beam Weapons (`visualShape: 'beam'`, `beamLengthPx: 30–46 px`)**: Fired by `Beam Caster`, `Stellar Caster`, `WZ-800 Arclight Cannon`, `WZ-650 Prism Lance`, `RS-450 Radiant Projector`, and `HL-220 Lightburst Lance`. Rendered as elongated collimated laser/plasma lances (outer photonic bloom sheath + intense white core ray + lens flare tip) that check collision along their full ray segment and pierce through targets (`pierceRemaining: 1..3`).
      - **Arc Weapons (`visualShape: 'arc'`, `chainCount: 2..4`, `chainRangePx: 48–54 px`)**: Fired by `Arc Caster` and `WZ-450 Sparkstrike`. Rendered as crackling, multi-segment zig-zag lightning bolts with branching fork spurs that physically jump and chain to nearby unhit enemies on impact.
      - **Specialist Casters, Bows & Carrier Munitions**:
        - **Bows, Quivers & Sheaves (`'arrow'`, `'javelin'`)**: Fletched shafts with metallic broadhead/bodkin tips (`M-450 Arbalest Greatbow` and `Javelin` hurls use heavy piercing `'javelin'` shafts).
        - **Plumbata & Bandoliers (`'dart'`)**: Lead-weighted high-arc plunging darts (`lobVz: 18`, `N-12 Plumbata Pod`) and quick-toss percussion darts (`N-20 Rotary Bandolier`).
        - **Ordnance Racks & Missiles (`'rocket'`, `Rack`, `LN-1200 Avalanche`, `LG-950 Tomahawk`, `Battery`)**: Finned rockets with flickering thruster exhaust plumes (`Battery` and `LG-950 Tomahawk` apply continuous `homingStrength` soft-lock steering toward targets).
        - **Blast, Nova & Meteoric Casters (`'blast_shell'`, `'nova_orb'`, `'bolide'`)**: Pressurized explosive canisters (`M-350 Mauler`), equatorial-ringed Nova spheres, and high-arc molten Meteoric bolides (`lobVz: 24`) that detonate in shockwave craters.
    - **Only Basic Attack (`Action 1` / `moveset[0]`) uses the reload function** (including double-tapping `[X]` for a tactical early reload & heat vent). Non-basic ranged skills (`Actions 2–5`) never enter a manual reload state; instead, they specify explicit `ammoCount` multi-round bursts/salvos or `internalCharges` per-shot internal reloads (`internalCycleSec: 0.65s–0.80s`) that enter their full cooldown once depleted.
  - **Tactical Skills (`Actions 2–5` — Enacted Description Mechanics)**: Every weapon skill in `Slots 1–4` (`systems/combat/skillBehaviors.ts` & `skillExecution.ts`) enacts its authored tactical movement and payload behavior: forward lunges/dashes, aerial vaults/leaps (`vz` impulse), evasive backsteps, inward hook/wrench pulls with `2.25×` Layer 1 shield strip, `55%` around-shield bypass strikes (`Shotel`, `Falx`, `Khopesh`, `Flamberge`), heavy shoves, thrown javelins/axes (`'javelin'`), returning boomerang/chakram discs (`'chakram'` on `Disc`, `Corona`, `Rhom`, `Tomahawk`), piercing line beams (`'beam'`), chaining lightning arcs (`'arc'`), wide tidal wave crests (`'wave'`), parabolic mortar/bolide lobs with AoE crater rings, and `360°` omnidirectional whirlwinds/novas.
  - **Global `BCU = 54` Balance Parity Across All Canonical Weapons (`normalizeWeaponCombatFunctions` & `normalizeSkillBcuParameters`)**:
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
    - **2H Weapons (`isTwoHandOnlyWeapon`)**: Restricted to **Main Slot (`slot1`) only** unless overridden by a Feat (`phalanx_specialist`, `daisho_specialist`, `feat_marauder_3`, `feat_marauder_5`, `feat_warrior_5`, `feat_guardian_5`), Unique versatile/counterbalanced Magitech trait (`HL-110 Dawnblade`, `HL-310 Sarissa Pike`, `CL-210 Sanctum Mace`, `LS-900 Swordspear`, `M-350 Mauler`, `WZ-650 Prism Lance`), Legendary flag (`isLegendary`, except `Balmung` which enforces `strictTwoHandedNoOffhand: true`), or versatile weapon variable (`Bastard Sword`, `allowOneHandGrip`, `allowSideSlot`).
    - **1H Weapons & Shields (`isOneHandWeapon`)**: Equippable in **Main (`slot1`) or Side (`slot2`) slot** (never `slot3`).
    - **Launchers & Carriers (`isLauncherEquipment` — `Carriers & Munitions`, including `LN-1200 Avalanche` & `LG-950 Tomahawk`)**: Equippable in **both Side Hand (`slot2`) and Aux Slot (`slot3`, Back Mount)** so Main + Carrier Specialist Doctrines (`Sword & Dart`, `Hoplite Skirmisher`, `Viking Raider`, `Rondel & Quiver`, `Caster & Battery`) can pair in `slot2` or `slot3`. Equipping a Carrier in `slot2` **never alters its rendered position** on the mech—it always renders dorsally on the back mount (`playerSpriteSystem.ts`).
    - **Back Launchers Never Move to Side Hand on Swap (`auxActive`)**: Pressing Weapon Swap (`[L]` / `performAuxiliarySwap`) toggles active secondary skill ownership (`equipmentSlots.auxActive`) on the Back Launcher (`slot3`). The Launcher **stays mounted on the back** (`slot3`) and takes ownership of Skills 4 and 5 (`ac4–ac5`) while the Main weapon retains Skills 1–3 (`ac1–ac3`).
    - **2H Grip with Side Weapon Equipped (`isSideWeaponHolstered`)**: When wielding a 2H weapon (or 2H grip) in `slot1` while a 1H weapon or Shield is equipped in `slot2`, the **Side weapon (`slot2`) stays in `slot2` and is holstered at the hip** (rendered sheathed with a hip-holster clasp overlay) while the **Launcher stays on the back (`slot3`)**.
- **72 Vertical `16×224` Pixel-Art Sprite Strips & Palette Row Convention (`LOCKED`)**:
  - Every functional weapon type across all 8 Weapon Classes (`8 × 9 = 72` archetypes) has a dedicated **`16×224` vertical sprite strip** (`16×16` px frame × `14` vertical rows: `rows 0..12` populated with `13` palette variants and `row 13` transparent) in `database/equipment/weapons/base_sprites.ts` (`shield_*`, `bow_*`, `caster_*`, `spear_*`, `impact_axe_*`, `blade_curved_*`, `blade_straight_*`, `launcher_*`), resolved via `getWeaponStripForFunctionalType` with `isPlaceholderAsset: false` across all canonical weapons.
  - **Palette Row Selection (`resolveSpriteStripSliceCoords`)**: Unmodified **`Custom`** weapons render **`row: 0`** (Base Iron/Steel), unmodified **`Magitech`** unique weapons and **`Legendary`** folklore artifacts render **`row: 12`** (Gilded/Unique variant), hardware-modified weapons without a socketed Gem render **`row: 12`**, and gem-socketed weapons render **`row: 1..11`** mapped via `VERTICAL_STRIP_GEM_ROW_MAP` by the primary socketed Gemstone.

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

### 1C. The 37 Unique Magitech Purist Relics (22 Specialist Martial Stances + 5 Core-Chain Apex Relics)

| Code | Name & Preserved Epithet | Umbrella / Sector | Weapon Class (`Functional Type`) | Architecture Tier (`Open Mounts + 1G`) | Open Domains | Damage / WT | Paired Doctrine & Purist Resonance Passive |
|---|---|---|---|---|---|---|---|
| `S-3` | S-3 Viper Partisan | Fighter (`Guardian`) | Spears (`Partisan`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `DELIVERY`, `REGULATION` | Pierce · `8 WT` | `Hoplite Skirmisher` — *Viper Skirmish Feed* |
| `TI-110` | TI-110 Aegis Buckler (*"the Aegis Charge Buckler"*) | Fighter (`Guardian`) | Shields (`Buckler`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `DELIVERY` | Impact · `5 WT` | `Hoplite Skirmisher` — *Hard-Light Rim Deflection* |
| `N-60` | N-60 Limitanei Spatha | Fighter (`Warrior`) | Blades: Straight (`Spatha`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `CONTACT`, `REGULATION` | Pierce · `9 WT` | `Legionnaire Advance` — *Plumbata Breach Signal* |
| `N-12` | N-12 Plumbata Pod | Fighter (`Warrior`) | Carriers & Munitions (`Plumbata`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `CONTACT` | Pierce · `9 WT` | `Legionnaire Advance` — *Weighted Plunge Link* |
| `M-450` | M-450 Arbalest Greatbow | Fighter (`Warrior`) | Bows (`Great Bow`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `CONTACT` | Pierce · `18 WT` | `Yeoman Longbowman` — *Magnetic Rail Overdraw* |
| `M-10` | M-10 Bodkin Quiver | Fighter (`Warrior`) | Carriers & Munitions (`Quiver`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `CONTACT`, `DELIVERY` | Pierce · `8 WT` | `Yeoman Longbowman` — *Auto-Indexer Nock Feed* |
| `N-55` | N-55 Gladius | Fighter (`Warrior`) | Casters (`Bolt Caster`) | `REFERENCE_PLATFORM` (`3S + 1G`) | `CONTACT`, `DELIVERY`, `REGULATION` | Impact · `10 WT` | `Sword & Dart` — *BCU Reference Stabilizer* |
| `N-20` | N-20 Rotary Bandolier | Fighter (`Warrior`) | Carriers & Munitions (`Bandolier`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `CONTACT` | Impact · `7 WT` | `Sword & Dart` — *Rotary Quick-Toss Feed* |
| `S-9` | S-9 Turbine Odachi | Fighter (`Warrior`) | Blades: Curved (`Odachi`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `REGULATION` | Pierce · `19 WT` | `Odachi Cleaver` — *Centrifugal Spool Momentum* |
| `N-75` | N-75 Praetorian Spatha | Fighter (`Guardian`) | Blades: Straight (`Spatha`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `REGULATION` | Pierce · `10 WT` | `Legionnaire Footman` — *Scutum Firing Port Lock* |
| `TI-400` | TI-400 Aegis Scutum | Fighter (`Guardian`) | Shields (`Scutum`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `REGULATION` | Impact · `18 WT` | `Legionnaire Footman` — *Interlocking Testudo Wall* |
| `LS-900` | LS-900 Swordspear | Fighter (`Guardian`) | Spears (`Partisan`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `REGULATION` | Wave · `14 WT` | `Peltast Javelineer` — *Harmonic Crest Sweeper* |
| `HL-110` | HL-110 Dawnblade | Fighter (`Guardian`) | Blades: Straight (`Bastard Sword`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `DELIVERY`, `REGULATION` | Beam · `12 WT` | `Landsknecht / Corona Guard` — *Solar Half-Swording* |
| `TI-350` | TI-350 Radiant Corona | Fighter (`Guardian`) | Shields (`Corona`) | `SEALED_MONOLITH` (`0S + 1G`) | None (`0`) | Pulse · `11 WT` | `Corona Guard` — *Solar Flare Deflection* |
| `HL-310` | HL-310 Sarissa Pike | Fighter (`Guardian`) | Spears (`Pike`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `DELIVERY` | Pierce · `20 WT` | `Phalanx Specialist` — *Magnetic Counter-Torque Grip* |
| `HL-220` | HL-220 Lightburst Lance | Fighter (`Guardian`) | Spears (`Lance`) | `SEALED_MONOLITH` (`0S + 1G`) | None (`0`) | Beam · `22 WT` | `Cataphract Lancer` — *Judgment Strike Overdrive* |
| `S-6` | S-6 Phantom Messer | Rogue (`Rogue`) | Blades: Straight (`Messer`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `CONTACT`, `REGULATION` | Pierce · `7 WT` | `Saboteur Blade` — *Thermal-Null Backswing* |
| `VX-10` | VX-10 Eclipse Disc | Rogue (`Rogue`) | Shields (`Disc`) | `SEALED_MONOLITH` (`0S + 1G`) | None (`0`) | Pierce · `6 WT` | `Saboteur Blade` — *Phase-Skip Ricochet* |
| `B-40` | B-40 Ripper Falx | Rogue (`Marauder`) | Blades: Curved (`Falx`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `REGULATION` | Pierce · `12 WT` | `Sica & Buckler` — *Chain-Ripper Guard Hook* |
| `B-55` | B-55 Skjaldborg Axe (*"the Siegebreaker"*) | Rogue (`Marauder`) | Impact & Axes (`Battle Axe`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `DELIVERY` | Impact · `13 WT` | `Viking Raider` — *Siegebreaker Exhaust Vent* |
| `S-2` | S-2 Turbine Khopesh | Rogue (`Rogue`) | Blades: Curved (`Khopesh`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `DELIVERY`, `REGULATION` | Pierce · `6 WT` | `Mamluk Twin-Scimitar` — *Twin-Turbine Hook* |
| `SV-12` | SV-12 Viper | Rogue (`Rogue`) | Casters (`Bolt Caster`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `CONTACT`, `REGULATION` | Pierce · `6 WT` | `Mamluk / Daisho / Main-Gauche` — *Point-Blank Viper Volley* |
| `S-8` | S-8 Ghost Katana | Rogue (`Rogue`) | Blades: Curved (`Katana`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `DELIVERY` | Pierce · `9 WT` | `Daisho Specialist` — *Iaijutsu Phase Draw* |
| `S-4` | S-4 Whisper Wakizashi | Rogue (`Rogue`) | Blades: Curved (`Wakizashi`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `REGULATION` | Pierce · `5 WT` | `Daisho Specialist` — *Monomolecular Riposte* |
| `SV-22` | SV-22 Stiletto Spatha | Rogue (`Rogue`) | Blades: Straight (`Spatha`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `DELIVERY`, `REGULATION` | Pierce · `8 WT` | `Main-Gauche Duelist` — *Acoustic-Null Thrust* |
| `S-5` | S-5 Whisper Cinquedea | Rogue (`Rogue`) | Blades: Straight (`Cinquedea`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `DELIVERY` | Pierce · `5 WT` | `Main-Gauche / Rondel & Quiver` — *Five-Finger Blade Catch* |
| `M-300` | M-300 Cantabrian Recurve | Rogue (`Rogue`) | Bows (`Recurve Bow`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `CONTACT`, `REGULATION` | Pierce · `9 WT` | `Steppe Horse-Archer` — *Cantabrian Glide Draw* |
| `VX-15` | VX-15 Ghost Yebira | Rogue (`Rogue`) | Carriers & Munitions (`Yebira`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `CONTACT` | Pierce · `6 WT` | `Rondel & Quiver / Steppe` — *Phase-Cased Nock Feed* |
| `B-80` | B-80 Doppelsöldner Greatsword | Rogue (`Marauder`) | Blades: Straight (`Zweihander`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `DELIVERY` | Impact · `22 WT` | `Doppelsöldner` — *Pike-Cleaver Ignition* |
| `M-350` | M-350 Mauler | Rogue (`Marauder`) | Casters (`Blast Caster`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `CONTACT`, `REGULATION` | Blast · `13 WT` | `Heavy Bombardier` — *Tri-Barrel Breach Salvo* |
| `LN-1200` | LN-1200 Avalanche | Rogue (`Marauder`) | Carriers & Munitions (`Rack`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `REGULATION` | Blast · `19 WT` | `Heavy Bombardier` — *Chaff-Screen Salvo* |
| `LG-950` | LG-950 Tomahawk | Rogue (`Marauder`) | Carriers & Munitions (`Battery`) | `SEALED_MONOLITH` (`0S + 1G`) | None (`0`) | Blast · `18 WT` | `Heavy Bombardier / Caster & Battery` — *Multi-Target Soft-Lock* |
| `CL-210` | CL-210 Sanctum Mace (*"this hallowed scepter"*) | Scholar (`Cleric`) | Impact & Axes (`Mace`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `DELIVERY` | Wave · `10 WT` | `Templar Companion` — *Choir Bell Triage* |
| `CL-150` | CL-150 Ward Mote | Scholar (`Cleric`) | Shields (`Mote`) | `SEALED_MONOLITH` (`0S + 1G`) | None (`0`) | Pulse · `6 WT` | `Templar Companion` — *Autonomous Orbiting Ward* |
| `WZ-310` | WZ-310 Æther Spatha | Scholar (`Wizard`) | Blades: Straight (`Spatha`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `DELIVERY`, `REGULATION` | Beam · `8 WT` | `Spellblade Conduit` — *Conduit Edge Siphon* |
| `WZ-450` | WZ-450 Sparkstrike | Scholar (`Wizard`) | Casters (`Arc Caster`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `REGULATION` | Pulse · `10 WT` | `Spellblade / Caster & Battery` — *Forked Lightning Jump* |
| `ARC-10` | ARC Conductor | Scholar (`Wizard`) | Casters (`Pulse Caster`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `CONTACT`, `DELIVERY` | Pulse · `6 WT` | `Spellblade / Caster & Battery` — *Emergency Capacitor Tap* |
| `WZ-200` | WZ-200 Manacore Staff | Scholar (`Wizard`) | Spears (`Spetum`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `DELIVERY` | Wave · `16 WT` | `Battle-Monk Staves` — *Manacore Horizon Wave* |
| `WZ-650` | WZ-650 Prism Lance | Scholar (`Wizard`) | Casters (`Beam Caster`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `REGULATION` | Beam · `12 WT` | `Caster & Battery` — *Prismatic Intensity Ramp* |
| `SR-440` | SR-440 Shadowfang | Rogue (`Rogue`) | Casters (`Bolt Caster`) | `MODULAR_FRAME_RELIC` (`2S + 1G`) | `DELIVERY`, `REGULATION` | Pierce · `11 WT` | Core Chain `C-03` (*Phantom Strike → Ghost Protocol*) — *Ghost Protocol Optics* |
| `WZ-800` | WZ-800 Arclight Cannon | Scholar (`Wizard`) | Casters (`Stellar Caster`) | `SEALED_MONOLITH` (`0S + 1G`) | None (`0`) | Beam · `22 WT` | Core Chain `C-04` (*Anchored Focus → Cataclysm Beam*) — *Anchored Singularity Bore* |
| `B-25` | B-25 Brushcutter | Rogue (`Marauder`) | Casters (`Bolt Caster`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `REGULATION` | Pierce · `18 WT` | Core Chain `C-10` (*Suppression Chainfire → Mauler's Rhythm*) — *Twin-Rotor Intercept Curtain* |
| `RS-450` | RS-450 Radiant Projector | Fighter (`Guardian`) | Casters (`Beam Caster`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `REGULATION` | Beam · `11 WT` | Core Chain `C-14` (*Stabilizer Pulse → Bulwark Projection*) — *Aegis Tether Beam* |
| `CL-500` | CL-500 Absolution (*"Grace Edge"*) | Scholar (`Cleric`) | Casters (`Wave Caster`) | `SEMI_SEALED_ASSEMBLY` (`1S + 1G`) | `REGULATION` | Wave · `11 WT` | Core Chain `C-18` (*Radiant Overflow → Divine Conduit*) — *Sanctified Wavefront* |

### 1D. The 5 Canonical Legendary World Entries (`6` Playable Folklore Artifacts + `3` Lore-Bound Companion Mounts)

| World | ID | Name (& Transformed Title) | Weapon Class (`Functional Type`) | Damage / WT / Handing | Lore-Bound Companion Slot | Rule-Breaking Engine Hooks & Folklore Mechanics |
|---|---|---|---|---|---|---|
| **Belldor** (`belldor`) | `leg_excalibur` (aliases `avalon_siege_lance`) | **Excalibur** (→ **Excalibur, Sheathed in Avalon**) | Blades: Straight (`Bastard Sword`) | Beam · `12 WT` · Versatile `1H/2H` | `1` Slot: **The Scabbard of Avalon** (`scabbard_of_avalon`) | **`BYPASS_LAYER1_SHIELDS`**: All attacks completely bypass Layer 1 Energy Shields (`100%` shield penetration), striking Layer 2 Armor Durability & Layer 3 Structure directly. Mounting **The Scabbard of Avalon** (dropped by *The Lady of the Lake* after defeating *Arthur* and offering Bedivere's 3 relics at the deep bog water) adds **`PREVENT_LETHAL_DOT`**, preventing environmental decay (Belldor corrosive bog mire, burns, bleeds, poison) from reducing Structure below `1 HP`. |
| **New Novarin & Novarin** (`new_novarin` / `novarin`) | `leg_yawarakai_te` | **Yawarakai-Te** (→ **Yawarakai-Te & Juuchi Yosamu**) | Blades: Curved (`Katana`) | Pierce · `9 WT` (`16 WT` fused) · `1H/2H` | `1` Slot: **Juuchi Yosamu** (`leg_juuchi_yosamu`) | **`DR_OUTSIDE_ACTIVE_HIT_FRAMES`**: Forged by Masamune (`~0.80×` solo Katana BCU, `+20%` windup, `-20%` active hit window); grants `20%` damage reduction during idle, movement, windup, and recovery frames. Mounting **Juuchi Yosamu** into its lore-bound slot fuses both blades into **Yawarakai-Te & Juuchi Yosamu** (`16 WT`, **`TWIN_BLADE_DUAL_EXECUTION`** `2×` hit execution per swing, continuous all-phase `20%` DR, and `countsAsPairedOffhandBlade: true` for *Daisho Specialist*). |
| **New Novarin & Novarin** (`novarin`) | `leg_juuchi_yosamu` | **Juuchi Yosamu** | Blades: Curved (`Katana`) | Pierce · `9 WT` · `1H/2H` (or Lore-Bound Relic) | `0` Slots (mounts into `leg_yawarakai_te`) | **`DR_DURING_ACTIVE_HIT_FRAMES`**: Forged by Muramasa (`~0.80×` solo Katana BCU, `-20%` windup, `+20%` active hit window); grants `20%` damage reduction strictly during active hit frames. Can be wielded standalone or slotted into *Yawarakai-Te* at the Armory Workbench. |
| **Tyrranus** (`tyrranus`) | `leg_aegis` | **Aegis** (→ **Aegis of the Gorgon**) | Shields (`Scutum`) | Impact · `14 WT` · `1H` (`165 DUR / 14 RTG / 10 THR`) | `1` Slot: **Medusa's Head** (`medusas_head`) | **`UNBREAKABLE_DIRECTIONAL_GUARD`**: Active frontal guard cannot be guard-broken or posture-collapsed regardless of enemy impact mass. Mounting **Medusa's Head** adds **`BYPASS_BOSS_CC_IMMUNITY_PETRIFY`** (*Gorgon's Gaze*, `14s` internal CD): Perfect Blocks or Shield Bashes emit a `72px` frontal petrifying flash that turns enemies and bosses to stone for `2.2s` (`+25%` incoming Impact/Blast damage, followed by `8.0s` *Stone-Hardened* immunity). |
| **Golem** (`golem`) | `leg_lake_of_fire_knife` | **Knives of the Lake of Fire** (`maxObtainableCopies: 4`) | Blades: Curved (`Khopesh`) | Pierce · `8 WT` · `1H` (True Dual-Wield `slot1 + slot2`) | `0` Slots | **`PERMANENT_KILL_PREVENT_RESURRECT`**: Targets slain by these bronze flame-sickles are soul-severed (`preventResurrection = true`) and cannot self-reassemble, spawn death-splits, or be revived. Action 3 **Glance of the Gatekeeper** projects a `78px` frontal judgment flash (`1.2s` Stun + `2.5s` Blind); dual-wielding two copies widens the cone (`1.15 rad → 1.55 rad`) and extends stun/blind duration (`1.6s` Stun + `3.2s` Blind). |
| **Orion** (`orion`) | `leg_balmung` | **Balmung** | Blades: Straight (`Zweihander`) | Wave · `20 WT` · Strict `2H` (`strictTwoHandedNoOffhand: true`) | `0` Slots (`allowDorsalLauncherOnly: true`) | **`ALWAYS_HYPER_ARMOR` + `ZERO_HIT_STOP` + `PERFECT_BLOCK_MELEE_AUTO_COUNTER`**: Uninterruptible hyper-armor during all attack animations, zero hit-stop frame pause when cleaving through heavy armor, and an automatic `1.35×` *Gram Counter-Slash* (`Wave`) upon any Perfect Block against a melee attack. Strictly locks Side Hand (`slot2`) while leaving the dorsal Aux Launcher (`slot3`) open. |

### 1E. Starting-Kit & Field Legacy Weapons (`9` Campaign Kit Variants)

| ID | Weapon Name | Weapon Class (`Functional Type`) | Tier | Handing / Slots | Damage / WT | Kit / Field Assignment |
|---|---|---|---|---|---|---|
| `camelot_longsword` | **Camelot Longsword** | Blades: Straight (`Bastard Sword`) | `Custom` (`3S`) | Versatile `1H/2H` (`Main` / `Side`) | Pierce · `10 WT` | Dawnforge Guardian & Sanctum Support starting kit main blade |
| `camelot_shield` | **Camelot Heater Shield** | Shields (`Heater`) | `Custom` (`3S`) | `1H` (`Main` / `Side`) | Impact · `11 WT` | Starting kit physical guard shield (`55 DUR / 10 RTG / 7 THR`) |
| `camelot_mace` | **Camelot Flanged Mace** | Impact & Axes (`Mace`) | `Custom` (`3S`) | `1H` (`Main` / `Side`) | Impact · `10 WT` | Starting kit armor-crushing sidearm |
| `orc_cleaver` | **Orcish Iron Cleaver** | Blades: Curved (`Falchion`) | `Custom` (`3S`) | `1H` (`Main` / `Side`) | Pierce · `9 WT` | M00 The Bog / Border Town Orc Warrior salvage blade |
| `orc_composite_bow` | **Orcish Horn Bow** | Bows (`Composite Bow`) | `Custom` (`3S`) | `2H` (`Main`) | Pierce · `11 WT` | M00 The Bog / Border Town Orc Scout salvage bow |
| `pnsy_carbine` | **PNSY Carbine** | Casters (`Bolt Caster`) | `Custom` (`3S`) | `1H` (`Main` / `Side`) | Impact · `9 WT` | Bastion Striker starting kit rapid bolt carbine |
| `vx_whisper_dagger` | **VX Whisper Dagger** | Blades: Straight (`Cinquedea`) | `Custom` (`3S`) | `1H` (`Main` / `Side`) | Pierce · `5 WT` | Phantom Recon starting kit stealth thrusting blade |
| `arc_focus_staff` | **Arcanum Focus Staff** | Casters (`Beam Caster`) | `Custom` (`3S`) | `2H` (`Main`) | Beam · `12 WT` | Arclight Artillery starting kit sustained beam stave |
| `sanctum_aether_catalyst` | **Sanctum Æther Catalyst** | Casters (`Wave Caster`) | `Custom` (`3S`) | `1H` (`Main` / `Side`) | Wave · `8 WT` | Sanctum Support starting kit harmonic wave projector |

### 1F. The 61 Bespoke Weapon Modification Components (`28 Crafted` + `33 Looted`)

| Weapon Class | Component Name (`ID`) | Domain | Acquisition & Recipe (`GemSockets`) | Damage Override | Positive Mechanical Gain | Zero-Sum Trade-Off (`WT Δ`) |
|---|---|---|---|---|---|---|
| **Blades (`Straight` & `Curved`)** | **Fullered Blade** (`comp_blade_contact_fullered`) | `CONTACT` | `LOOTED` (`2G`) | — | `-12%` attack cadence duration, `-8%` skill cooldowns | `-2 WT`, `-6%` base damage |
| **Blades (`Straight` & `Curved`)** | **Hollow-Ground Blade** (`comp_blade_contact_hollow_ground`) | `CONTACT` | `CRAFTED` (`28 Scrap + 1 Ruby`, `1G`) | `Pierce` | `+14%` base damage, `+8%` critical hit chance | `-1 WT`, `-8%` stagger impulse |
| **Blades (`Straight` & `Curved`)** | **Diamond-Section Blade** (`comp_blade_contact_diamond_section`) | `CONTACT` | `LOOTED` (`2G`) | `Pierce` | `+16%` base damage, `+15%` stagger impulse | `+2 WT`, `+10%` attack cadence duration |
| **Blades (`Straight` & `Curved`)** | **Serrated Spine Edge** (`comp_blade_contact_serrated_spine`) | `CONTACT` | `CRAFTED` (`32 Scrap + 1 Citrine`, `1G`) | — | `+12%` base damage, `+22%` stagger/guard chip | `+1 WT`, `+12%` heat generation |
| **Blades (`Straight` & `Curved`)** | **Thermal-Conduit Edge** (`comp_blade_contact_thermal_conduit`) | `CONTACT` | `CRAFTED` (`38 Scrap + 1 Topaz`, `1G`) | `Beam` | Converts Action 1 to `Beam`; `+15%` base damage | `+2 WT`, `+16%` heat generation |
| **Blades (`Straight` & `Curved`)** | **Swept-Ringing Crossguard** (`comp_blade_delivery_swept_crossguard`) | `DELIVERY` | `LOOTED` (`2G`) | — | `+18%` stagger impulse, `-8%` skill cooldowns | `+1 WT`, `+6%` attack cadence duration |
| **Blades (`Straight` & `Curved`)** | **Counter-Balanced Grip Assembly** (`comp_blade_delivery_counter_grip`) | `DELIVERY` | `CRAFTED` (`26 Scrap + 1 Emerald`, `1G`) | — | `-14%` attack cadence duration, `+10%` accuracy/tracking | `0 WT`, `-8%` stagger impulse |
| **Blades (`Straight` & `Curved`)** | **Hydraulic Assist Hilt** (`comp_blade_delivery_hydraulic_hilt`) | `DELIVERY` | `LOOTED` (`3G`) | — | `+15%` base damage, `+12%` projectile/wave velocity | `+2 WT`, `+14%` heat generation |
| **Blades (`Straight` & `Curved`)** | **Weighted Wheel Pommel** (`comp_blade_reg_wheel_pommel`) | `REGULATION` | `LOOTED` (`2G`) | — | `+20%` stagger impulse, `+8%` base damage | `+2 WT`, `+8%` attack cadence duration |
| **Blades (`Straight` & `Curved`)** | **Ring-Counterweight Pommel** (`comp_blade_reg_ring_pommel`) | `REGULATION` | `CRAFTED` (`24 Scrap + 1 Aquamarine`, `1G`) | — | `-10%` skill cooldowns, `-12%` heat generation | `-1 WT`, `-6%` base damage |
| **Blades (`Straight` & `Curved`)** | **Aether-Capacitor Pommel** (`comp_blade_reg_aether_pommel`) | `REGULATION` | `CRAFTED` (`36 Scrap + 1 Sapphire`, `1G`) | — | `+12%` base damage, `-10%` skill cooldowns | `+1 WT`, `+12%` heat generation |
| **Impact & Axes** | **Flanged Striking Head** (`comp_impact_contact_flanged_head`) | `CONTACT` | `LOOTED` (`2G`) | `Impact` | `+16%` base damage, `+20%` stagger impulse | `+2 WT`, `+10%` attack cadence duration |
| **Impact & Axes** | **Bearded Hook-Bit** (`comp_impact_contact_bearded_bit`) | `CONTACT` | `LOOTED` (`2G`) | `Pierce` | Converts Action 1 to `Pierce`; `+14%` base damage, `+6%` crit | `+1 WT`, `+8%` skill cooldowns |
| **Impact & Axes** | **Crow's-Beak Armor Spike** (`comp_impact_contact_crows_beak`) | `CONTACT` | `CRAFTED` (`30 Scrap + 1 Ruby`, `1G`) | `Pierce` | Converts Action 1 to `Pierce`; `+12%` damage, `+10%` crit | `+1 WT`, `-10%` cleave arc stability |
| **Impact & Axes** | **Concussion Flux-Head** (`comp_impact_contact_concussion_flux`) | `CONTACT` | `CRAFTED` (`38 Scrap + 1 Citrine`, `1G`) | `Blast` | Converts Action 1 to `Blast`; `+18%` damage, `+22%` stagger | `+3 WT`, `+18%` heat generation |
| **Impact & Axes** | **Langets-Reinforced Haft** (`comp_impact_delivery_langets_haft`) | `DELIVERY` | `LOOTED` (`2G`) | — | `+18%` stagger impulse, `+8%` base damage | `+2 WT`, `+8%` attack cadence duration |
| **Impact & Axes** | **Piston-Driven Impact Collar** (`comp_impact_delivery_piston_collar`) | `DELIVERY` | `CRAFTED` (`34 Scrap + 1 Ruby`, `1G`) | — | `+16%` base damage, `+16%` stagger impulse | `+2 WT`, `+15%` heat generation |
| **Impact & Axes** | **Ash-Flex Shock Haft** (`comp_impact_delivery_ash_flex_haft`) | `DELIVERY` | `LOOTED` (`3G`) | — | `-14%` attack cadence duration, `-10%` heat generation | `-2 WT`, `-10%` stagger impulse |
| **Impact & Axes** | **Lead-Cored Counterweight Cap** (`comp_impact_reg_lead_cap`) | `REGULATION` | `LOOTED` (`2G`) | — | `+24%` stagger impulse, `+10%` base damage | `+3 WT`, `+12%` attack cadence duration |
| **Impact & Axes** | **Lanyard Wrist-Loop Assembly** (`comp_impact_reg_wrist_loop`) | `REGULATION` | `CRAFTED` (`24 Scrap + 1 Emerald`, `1G`) | — | `-12%` skill cooldowns, `-10%` attack cadence duration | `-1 WT`, `-8%` stagger impulse |
| **Spears** | **Leaf-Bladed Broadhead** (`comp_spear_contact_leaf_head`) | `CONTACT` | `LOOTED` (`2G`) | `Pierce` | `+14%` base damage, `+10%` stagger impulse | `+1 WT`, `+8%` attack cadence duration |
| **Spears** | **Ahlspiess Bodkin Awl-Pike** (`comp_spear_contact_ahlspiess_awl`) | `CONTACT` | `CRAFTED` (`30 Scrap + 1 Ruby`, `1G`) | `Pierce` | `+12%` base damage, `+10%` critical hit chance | `+1 WT`, `-8%` stagger impulse |
| **Spears** | **Boar-Winged Lugged Head** (`comp_spear_contact_winged_lugs`) | `CONTACT` | `LOOTED` (`2G`) | `Impact` | Converts Action 1 to `Impact`; `+22%` stagger, `+8%` damage | `+2 WT`, `+10%` attack cadence duration |
| **Spears** | **Harmonic Wave-Fork Prongs** (`comp_spear_contact_wave_fork`) | `CONTACT` | `CRAFTED` (`38 Scrap + 1 Sapphire`, `1G`) | `Wave` | Converts Action 1 to `Wave`; `+15%` damage, `+15%` wave speed | `+2 WT`, `+16%` heat generation |
| **Spears** | **Tapered Ash & Carbon Shaft** (`comp_spear_delivery_tapered_shaft`) | `DELIVERY` | `LOOTED` (`2G`) | — | `-14%` attack cadence duration, `+12%` thrust/throw velocity | `-2 WT`, `-8%` stagger impulse |
| **Spears** | **Vamplate Hand-Guard Cone** (`comp_spear_delivery_vamplate_cone`) | `DELIVERY` | `CRAFTED` (`30 Scrap + 1 Citrine`, `1G`) | — | `+18%` stagger impulse, `+10%` base damage | `+2 WT`, `+8%` attack cadence duration |
| **Spears** | **Telescoping Servo-Shaft** (`comp_spear_delivery_telescoping_shaft`) | `DELIVERY` | `LOOTED` (`3G`) | — | `+14%` base damage, `-10%` skill cooldowns | `+2 WT`, `+12%` heat generation |
| **Spears** | **Sauroter Bronze Butt-Spike** (`comp_spear_reg_sauroter_spike`) | `REGULATION` | `LOOTED` (`2G`) | — | `+18%` stagger impulse, `-8%` skill cooldowns | `+2 WT`, `+6%` attack cadence duration |
| **Spears** | **Weighted Counter-Ferrule** (`comp_spear_reg_counter_ferrule`) | `REGULATION` | `CRAFTED` (`26 Scrap + 1 Emerald`, `1G`) | — | `-12%` attack cadence duration, `+10%` accuracy/tracking | `0 WT`, `-6%` base damage |
| **Bows** | **Bodkin Armor-Needle Tips** (`comp_bow_contact_bodkin_tips`) | `CONTACT` | `LOOTED` (`2G`) | `Pierce` | `+12%` base damage, `+8%` critical hit chance | `0 WT`, `-10%` stagger impulse |
| **Bows** | **Barbed Broadhead Tips** (`comp_bow_contact_broadhead_tips`) | `CONTACT` | `LOOTED` (`2G`) | `Pierce` | `+16%` base damage, `+14%` stagger impulse | `+1 WT`, `-10%` projectile velocity |
| **Bows** | **Crescent Moon-Cutter Tips** (`comp_bow_contact_crescent_tips`) | `CONTACT` | `CRAFTED` (`28 Scrap + 1 Emerald`, `1G`) | `Wave` | Converts Action 1 to `Wave`; `+12%` damage, `+15%` stagger | `+1 WT`, `+8%` draw duration |
| **Bows** | **Pyro-Capsule Whistle Tips** (`comp_bow_contact_pyro_tips`) | `CONTACT` | `CRAFTED` (`34 Scrap + 1 Citrine`, `1G`) | `Blast` | Converts Action 1 to `Blast`; `+18%` damage, `+18%` stagger | `+2 WT`, `+16%` heat generation |
| **Bows** | **Horn-Sinew Composite Limbs** (`comp_bow_delivery_horn_sinew`) | `DELIVERY` | `LOOTED` (`2G`) | — | `+14%` base damage, `+16%` arrow velocity | `+1 WT`, `+8%` draw duration |
| **Bows** | **Eccentric Pulley Cam-Limbs** (`comp_bow_delivery_pulley_cams`) | `DELIVERY` | `CRAFTED` (`32 Scrap + 1 Topaz`, `1G`) | — | `-14%` draw duration, `+12%` accuracy | `+2 WT`, `-6%` base damage |
| **Bows** | **Yew High-Draw War-Limbs** (`comp_bow_delivery_yew_war_limbs`) | `DELIVERY` | `LOOTED` (`3G`) | — | `+20%` base damage, `+18%` stagger impulse | `+3 WT`, `+14%` draw duration |
| **Bows** | **reflexed Siyah Ear-Tips & String** (`comp_bow_reg_siyah_ears`) | `REGULATION` | `LOOTED` (`2G`) | — | `+18%` arrow velocity, `-10%` skill cooldowns | `0 WT`, `+8%` heat generation |
| **Bows** | **Gyro-Stabilized Riser Grip** (`comp_bow_reg_gyro_riser`) | `REGULATION` | `CRAFTED` (`26 Scrap + 1 Aquamarine`, `1G`) | — | `+14%` accuracy, `+6%` critical hit chance | `+1 WT`, `-8%` stagger impulse |
| **Casters** | **Collimated Beam-Lens Nozzle** (`comp_caster_contact_beam_lens`) | `CONTACT` | `CRAFTED` (`36 Scrap + 1 Topaz`, `1G`) | `Beam` | Converts Action 1 to `Beam`; `+14%` damage, `+16%` beam speed | `+1 WT`, `+14%` heat generation |
| **Casters** | **High-Velocity Bolt Choke** (`comp_caster_contact_bolt_choke`) | `CONTACT` | `LOOTED` (`2G`) | `Pierce` | Converts Action 1 to `Pierce`; `+20%` bolt speed, `+8%` crit | `0 WT`, `-10%` stagger impulse |
| **Casters** | **Harmonic Wave-Diffuser Bell** (`comp_caster_contact_wave_diffuser`) | `CONTACT` | `CRAFTED` (`34 Scrap + 1 Sapphire`, `1G`) | `Wave` | Converts Action 1 to `Wave`; `+12%` damage, `+16%` stagger | `+1 WT`, `-12%` projectile velocity |
| **Casters** | **Pressurized Blast-Chamber Muzzle** (`comp_caster_contact_blast_muzzle`) | `CONTACT` | `LOOTED` (`2G`) | `Blast` | Converts Action 1 to `Blast`; `+18%` damage, `+20%` stagger | `+2 WT`, `+16%` heat generation |
| **Casters** | **Tesla Arc-Prong Crown** (`comp_caster_contact_arc_crown`) | `CONTACT` | `CRAFTED` (`36 Scrap + 1 Amethyst`, `1G`) | `Pulse` | Converts Action 1 to `Pulse`; `+14%` damage, `-8%` cooldowns | `+1 WT`, `+12%` heat generation |
| **Casters** | **Rifled Magnetic Accelerator Rails** (`comp_caster_delivery_magnetic_rails`) | `DELIVERY` | `LOOTED` (`2G`) | — | `+15%` base damage, `+22%` projectile velocity | `+2 WT`, `+12%` heat generation |
| **Casters** | **Rotary Multi-Bore Barrel Assembly** (`comp_caster_delivery_rotary_barrel`) | `DELIVERY` | `CRAFTED` (`34 Scrap + 1 Ruby`, `1G`) | — | `-16%` firing cadence duration, `-8%` skill cooldowns | `+2 WT`, `-8%` base damage per shot |
| **Casters** | **Aether-Lined Resonance Conduit** (`comp_caster_delivery_aether_conduit`) | `DELIVERY` | `LOOTED` (`3G`) | — | `+12%` base damage, `-12%` heat generation | `+1 WT`, `+8%` firing cadence duration |
| **Casters** | **Cryo-Vented Heatsink Jacket** (`comp_caster_reg_cryo_heatsink`) | `REGULATION` | `LOOTED` (`2G`) | — | `-22%` heat generation, `-10%` skill cooldowns | `+2 WT`, `-6%` base damage |
| **Casters** | **Overclocked Flux Capacitor Bank** (`comp_caster_reg_flux_capacitor`) | `REGULATION` | `CRAFTED` (`38 Scrap + 1 Diamond`, `1G`) | — | `+18%` base damage, `+6%` critical hit chance | `+1 WT`, `+18%` heat generation |
| **Casters** | **Harmonic Recoil Buffer Stock** (`comp_caster_reg_recoil_stock`) | `REGULATION` | `CRAFTED` (`26 Scrap + 1 Aquamarine`, `1G`) | — | `+14%` accuracy, `-10%` firing cadence duration | `+1 WT`, `-10%` stagger impulse |
| **Shields** | **Reinforced Steel-Laminate Face Plate** (`comp_shield_contact_reinforced_plate`) | `CONTACT` | `LOOTED` (`2G`) | `Impact` | `+25` Armor DUR, `+2` Armor RTG, `+1` Armor THR | `+3 WT`, `+10%` bash cadence duration |
| **Shields** | **Layered Sacrificial Confront** (`comp_shield_contact_sacrificial_confront`) | `CONTACT` | `CRAFTED` (`30 Scrap + 1 Garnet`, `1G`) | — | `+35` Armor DUR, `+2` Armor THR, `-10%` heat generation | `+2 WT`, `-8%` bash damage |
| **Shields** | **Hard-Light Prismatic Projector Face** (`comp_shield_contact_prismatic_face`) | `CONTACT` | `CRAFTED` (`38 Scrap + 1 Topaz`, `1G`) | `Pulse` | Converts Shield Bash to `Pulse`; `+18` Layer 1 Shield, `+12%` bash | `+1 WT`, `-12` physical Armor DUR |
| **Shields** | **Spiked Umbo Boss & Rim** (`comp_shield_delivery_spiked_boss`) | `DELIVERY` | `LOOTED` (`2G`) | `Pierce` | `+18%` bash damage, `+20%` stagger impulse, `+10` Armor DUR | `+2 WT`, `+8%` skill cooldowns |
| **Shields** | **Sword-Catching Notched Rim** (`comp_shield_delivery_notched_rim`) | `DELIVERY` | `CRAFTED` (`28 Scrap + 1 Emerald`, `1G`) | — | `+16%` stagger impulse, `-10%` skill cooldowns | `+1 WT`, `-10` Armor DUR |
| **Shields** | **Quick-Release Enarmes & Guige Strap** (`comp_shield_reg_quick_enarmes`) | `REGULATION` | `LOOTED` (`2G`) | — | `-14%` bash cadence duration, `-10%` skill cooldowns | `-2 WT`, `-1` Armor RTG |
| **Shields** | **Hydraulic Forearm Brace Clamp** (`comp_shield_reg_hydraulic_brace`) | `REGULATION` | `CRAFTED` (`32 Scrap + 1 Citrine`, `1G`) | — | `+22%` stagger impulse, `+1` Armor RTG, `+1` Armor THR | `+2 WT`, `+10%` heat generation |
| **Carriers & Munitions** | **Shaped-Charge Breaching Payload** (`comp_carrier_contact_shaped_charge`) | `CONTACT` | `CRAFTED` (`36 Scrap + 1 Citrine`, `1G`) | `Blast` | Converts payload to `Blast`; `+18%` damage, `+20%` stagger | `+2 WT`, `+15%` heat generation |
| **Carriers & Munitions** | **Flechette Sabot Dart Cluster** (`comp_carrier_contact_flechette_sabot`) | `CONTACT` | `LOOTED` (`2G`) | `Pierce` | Converts payload to `Pierce`; `+22%` projectile speed, `+8%` crit | `0 WT`, `-10%` stagger impulse |
| **Carriers & Munitions** | **Autoloading Rotary Feed Drum** (`comp_carrier_delivery_autoloader_drum`) | `DELIVERY` | `LOOTED` (`2G`) | — | `-16%` firing cadence duration, `-10%` skill cooldowns | `+2 WT`, `-8%` per-shot damage |
| **Carriers & Munitions** | **Pneumatic High-Impulse Launch Tube** (`comp_carrier_delivery_pneumatic_tube`) | `DELIVERY` | `CRAFTED` (`30 Scrap + 1 Ruby`, `1G`) | — | `+14%` base damage, `+18%` launch velocity | `+2 WT`, `+10%` heat generation |
| **Carriers & Munitions** | **Optical Target-Lock Guidance Fins** (`comp_carrier_reg_guidance_fins`) | `REGULATION` | `CRAFTED` (`32 Scrap + 1 Aquamarine`, `1G`) | — | `+16%` accuracy/homing, `+6%` critical hit chance | `+1 WT`, `-8%` stagger impulse |

## 2. ARMOR / CORE FRAMES & HARDWARE DOMAIN RULES

### 2A. Physical Domain Separation, Load Brackets, Armory Workbench & Gem Socket Laws (`LOCKED`)
- **Exterior Armor vs. Internal Hardware**: Only **Dome Plates** (`slot: 'head'`), **Aperture Plates** (`slot: 'arms'`), **Frame Platings** (`slot: 'plating'`), and physical/ward **Shields** grant Armor (`armorDurability`, `armorRating`, `armorThreshold`). Internal sub-modules (**Optics**, **Sensory A/B**, **Actuators**, **Reactor Core**, **Leg Actuators**) never grant armor values; they strictly modify their mechanical domains (`lightBonus`, `accuracyMult`, `staggerDamageMult`, `tellDurationMult`, `attackMassBonus`, `stabilityBonus`, `heatVentMult`, `cooldownMult`, `moveSpeedMult`, `capacityBonus`).
- **Mech Doll `LOADOUT` vs. `ARMORY` Workbench**:
  - **`LOADOUT`**: Displays a central interactive **Mech Doll** surrounded by selectable anatomical hardpoint nodes (`Head Dome`, `Frame Plating`, `Arm Assembly`, `Leg Striders`, `Main Hand`, `Side Hand`, `Auxiliary Back Mount`, and `[L]`/`[R]` Trigger Binds) with a 4-action Slot Context Menu (`Equip / Swap`, `Unequip`, `Stance / Grip Toggle`, and `Modify in Armory`), a nested **3-tier Weapon Selector** (`8 Weapon Classes` ▸ `9 Shared Functional Weapon Types` ▸ `Custom / Magitech / Legendary Subtypes`), and `128×128` technical schematics.
  - **`ARMORY`**: Houses all equipment modification systems—**Weapon Component Parts** (`3` non-sequential slots on `Custom` weapons; `0–3` open domain mounts on `Magitech` Purist relics; hermetically sealed lore assemblies on `Legendary` folklore artifacts with optional `Lore-Bound Companion Mount`), **Weapon Gem Sockets** (`1G` Crafted / `1–3G` Looted nested component gem sockets + a dedicated `1G` Factory Resonance Socket on every `Magitech` Purist relic), **Internal Sub-Modules**, **Hardware Gem Sockets**, and **Action Modifications** (`Structure / Melee`, `Integration / Ranged`, `Mobility Kit`).
- **Non-Sequential Modification Slot Order, 61 Bespoke Weapon Components, Magitech Architecture Tiers & Semantic `Custom` Naming (`LOCKED`)**:
  - **3-Slot Non-Sequential Anatomy (`CONTACT`, `DELIVERY`, `REGULATION`)**: All 72 `Custom` weapons feature 3 non-sequential component slots (`Slot 1`, `Slot 2`, `Slot 3`) mapped to three physical domains: **`CONTACT`** (*Blade / Head / Point / Arrowhead / Emitter Nozzle / Face Plate / Warhead Payload*), **`DELIVERY`** (*Hilt / Haft / Collar / Limbs / Accelerator Barrel / Rim & Boss / Feed & Magazine*), and **`REGULATION`** (*Pommel / Counterweight / Butt-Spike / Riser / Capacitor & Heatsink / Harness / Guidance*). Any domain can be installed into any slot index in any order, with at most **1 component per domain** per weapon instance.
  - **Four Magitech Purist Hardware Architecture Tiers (`0–3` Open Component Mounts + `1G` Factory Resonance Socket)**:
    - **`SEALED_MONOLITH` (`0` Open Component Mounts + `1G` Resonance Socket)**: Experimental, monolithic, or autonomous relics (`HL-220 Lightburst Lance`, `WZ-800 Arclight Cannon`, `TI-350 Radiant Corona`, `CL-150 Ward Mote`, `VX-10 Eclipse Disc`, `LG-950 Tomahawk`) whose internal assemblies are hermetically sealed.
    - **`SEMI_SEALED_ASSEMBLY` (`1` Open Component Mount + `1G` Resonance Socket)**: Specialized Magitech weapons where two physical domains are factory-sealed to preserve the relic's core mechanism, leaving **1 open mount** (`CONTACT`, `DELIVERY`, or `REGULATION`).
    - **`MODULAR_FRAME_RELIC` (`2` Open Component Mounts + `1G` Resonance Socket)**: Field-serviceable Magitech relics where only the signature heart is sealed, exposing **2 open mounts** (`CONTACT + DELIVERY`, `CONTACT + REGULATION`, or `DELIVERY + REGULATION`).
    - **`REFERENCE_PLATFORM` (`3` Open Component Mounts + `1G` Resonance Socket)**: The **`N-55 Gladius`** (`Casters` · `Bolt Caster`), engineered as the universal BCU calibration benchmark with all three physical domains (`CONTACT`, `DELIVERY`, `REGULATION`) exposed alongside its `1G` Factory Resonance Socket.
  - **61 Bespoke Weapon Components (`28 Crafted` + `33 Looted` in `weaponComponentCatalog.ts`)**:
    - **`CRAFTED` Blueprints (`28` total)**: Forged directly at the Armory Workbench using **Scrap + Gemstone(s)** (`recipe: { scrapCost, gemstones }`), expose **`1` Gem Socket (`maxGemSlots: 1`)**, and never drop in world loot tables.
    - **`LOOTED` Field Salvage (`33` total)**: Recovered from starter salvage pools, world reliquaries/caches, and enemy/boss drops (`recipe: null`), expose **`1–3` Gem Sockets (`maxGemSlots: 1..3`)**, and cannot be forged at the workbench.
  - **Deterministic `CONTACT`-Only Damage-Type Conversion**: A weapon's Action 1 `DamageType` (`Impact`, `Pierce`, `Beam`, `Blast`, `Pulse`, `Wave`) is determined by its base profile unless overridden by an installed **`CONTACT`** domain component (`damageTypeOverride`). When a Magitech relic's `CONTACT` domain is factory-sealed, its Action 1 `DamageType` is immutable. **`DELIVERY`**, **`REGULATION`**, and socketed Gemstones are strictly forbidden from changing a weapon's `DamageType`.
  - **Modified items use semantic `Custom` placement (`formatModifiedEquipmentName`)**: **`Custom <BaseName>`** for standard weapon and armor nouns (e.g., `Custom Camelot Longsword`, `Custom Heater`) and **`<BaseName> Custom`** for alphanumeric model designations, Magitech Purist relics, and manufacturer-coded hardware (e.g., `N-55 Gladius Custom`, `S-2 Turbine Khopesh Custom +II`), followed by **`+II`** or **`+III`** when 2 or 3 open component mounts are populated.
- **Slot-Adaptive Gemstones**: Socketing a Gemstone into exterior armor modifies physical mitigation/durability/shielding, whereas socketing the same Gemstone into an internal sub-module or weapon component gem socket adapts its bonus to that slot's physical function.
- **Physical Domain Separation (`Shields` Only for Layer 2 Armor)**: Weapon components on non-`Shields` classes (`Blades`, `Impact & Axes`, `Spears`, `Bows`, `Casters`, `Carriers & Munitions`) never grant Layer 2 Armor stats (`DUR`, `RTG`, `THR`). Only `Shields` components (*Reinforced Face Plate*, *Layered Sacrificial Confront*, *Spiked Boss & Rim*) modify Layer 2 Armor Durability, Threshold, or Rating.
- **Zero-Sum Trade-Off Law**: Every stat increase carries a paired negative draw on another stat or equip weight (`drawbackDescription`), and cumulative Combat Tempo multipliers are hard-clamped to **`[0.70×, 1.30×]` (`±30%`)**.
- **Percentage Load Limit Brackets**: Total weight capacity is defined by Frame Plating base capacity (`84..140 WT`), Frame sub-mods (Reactor Core + Leg Actuators + Mobility Kit), and System Feats (`+22 WT` per step):
  - `0–30%` = **Light** (`+8%` Mobility, `-10%` Heat, `-10%` Swap Time) — *Rogue starts at `29%`*
  - `31–65%` = **Medium** (`1.0×` baseline) — *Warrior (`55%`), Cleric (`54%`), Dawnforge Guardian (`59%`), and Wizard (`54%`) start in Medium*
  - `66–100%` = **Heavy** (`-10%` Mobility, `+12%` Heat, `+18%` Swap Time) — *Marauder starts at `81%`*
  - `>100%` = **Overloaded** (`-35%` Mobility, `+35%` Heat, `+45%` Swap Time, stealth broken)

### 2B. All 13 Core Frame Platings (`CANONICAL_FRAME_PLATING`)

| ID | Name | Trait Line | Type | Base Capacity | Weight | Armor (`DUR / RTG / THR`) | Shield | Gem Slots | Identity & Zero-Sum Trade-Off |
|---|---|---|---|---|---|---|---|---|---|
| `bwi_bastion_coreplate` | **BWI Bastion Frame Plating** | Warrior | Physical / Reactive | Medium (`90 WT`) | `15 WT` | `135 / 11 / 7` | `+55` | `3G` | Heavy frontal turbine shielding (`+4%` Venting, `+6` Stability / `-2%` Speed) |
| `fire_ice_fortress_coreplate` | **Fire & Ice Fortress Frame Plating** | Marauder | Physical / Hardened | Heavy (`112 WT`) | `32 WT` | `205 / 15 / 11` | `+35` | `3G` | Super-heavy frontal outrigging stabilizers (`+18` Stability / `-6%` Speed) |
| `dawnforge_guardian_coreplate` | **Dawnforge Guardian Frame Plating** | Guardian | Physical / Layered | Medium (`90 WT`) | `17 WT` | `170 / 13 / 9` | `+75` | `3G` | Stabilizer anchors & shield emitters (`+12` Stability / `-3%` Speed) |
| `shadowcraft_recon_coreplate` | **Shadowcraft Recon Frame Plating** | Rogue | Physical / Ablative | Light (`84 WT`) | `7 WT` | `95 / 6 / 4` | `+40` | `3G` | Ultralight emission dampeners (`+6%` Speed, `+0.5` Light / `-8` Stability) |
| `arcanum_heavy_projector_coreplate` | **Arcanum Heavy Projector Frame Plating** | Wizard | Physical / Layered | Medium (`90 WT`) | `15 WT` | `120 / 8 / 6` | `+95` | `3G` | Reinforced crystal lattice (`-6%` Cooldowns, `+0.5` Light / `-4` Stability) |
| `sanctum_support_coreplate` | **Sanctum Support Frame Plating** | Cleric | Physical / Reactive | Medium (`90 WT`) | `15 WT` | `145 / 10 / 7` | `+70` | `3G` | Distributed buffer systems (`+6%` Venting, `-4%` Cooldowns / `-2%` Speed) |
| `camelot_errant_brigandine` | **Camelot Errant Brigandine** | Guardian | Physical / Layered | Medium (`92 WT`) | `14 WT` | `140 / 10 / 7` | `+50` | `2G` | Field-riveted knightly brigandine (`+8` Stability / `-2%` Speed) |
| `camelot_grail_cataphract_harness` | **Camelot Grail Cataphract Harness** | Guardian | Physical / Hardened | Heavy (`108 WT`) | `28 WT` | `195 / 14 / 10` | `+60` | `3G` | Fluted Grail-knight barding (`+16` Stability, `+4%` Venting / `-5%` Speed) |
| `novarin_ironhide_lamellar` | **Novarin Ironhide Lamellar** | Marauder | Physical / Hardened | Heavy (`104 WT`) | `24 WT` | `180 / 13 / 9` | `+30` | `2G` | Orcish bog-iron lamellar (`+14` Stability, `+2.5` Attack Mass / `-4%` Speed) |
| `tyrranus_lorica_segmentata` | **Tyrranus Lorica Segmentata** | Warrior | Physical / Layered | Medium (`94 WT`) | `16 WT` | `155 / 12 / 8` | `+45` | `2G` | Articulated legionary hoop-plate (`+10` Stability, `+1.5` Attack Mass / `-2%` Speed) |
| `new_novarin_silverscale_cuirass` | **New Novarin Silverscale Cuirass** | Rogue | Physical / Ablative | Light (`86 WT`) | `9 WT` | `108 / 7 / 5` | `+65` | `3G` | Elven leaf-scale aether mail (`+5%` Speed, `-5%` Cooldowns / `-6` Stability) |
| `orion_deepforge_carapace` | **Orion Deepforge Carapace** | Marauder | Physical / Hardened | Super-Heavy (`122 WT`) | `36 WT` | `225 / 16 / 12` | `+40` | `3G` | Dwarven tuning-forge siege carapace (`+22` Stability / `-8%` Speed) |
| `golem_sunbleached_aegis_shell` | **Golem Sunbleached Aegis Shell** | Wizard | Physical / Reactive | Medium (`92 WT`) | `14 WT` | `128 / 9 / 6` | `+85` | `3G` | Bronze-and-quartz desert mirror plating (`+10%` Venting, `-4%` Cooldowns / `-3` Stability) |

## 3. CORE SYSTEMS (REACTORS & ENERGY STORAGE — `10 Modules`)

| ID | Name | Trait Line | Slot / Type | Weight & Cap Bonus | Gem Slots | Identity & Zero-Sum Trade-Off |
|---|---|---|---|---|---|---|
| `pnsy_alchemic_turbine_core` | **PNSY Alchemic Turbine Core Mk.IV** | Warrior | Frame Mod 1 (Reactor) | `12 WT` (`+24 WT` Cap) | `2G` | Magitech engine, volatile heat output (`+14%` Venting, `-6%` Cooldowns, `+3` Stability / `+4 WT`) |
| `rad_battleheart_ether_reactor` | **RAD Battleheart Ether Reactor Mk.V** | Marauder | Frame Mod 1 (Reactor) | `16 WT` (`+38 WT` Cap) | `2G` | Heavy ether reactor with recycling feedback loops (`+8` Stability, `+8%` Venting / `-3%` Speed) |
| `ti_manaheart_reactor` | **TI Manaheart Reactor Mk.IV** | Guardian | Frame Mod 1 (Reactor) | `13 WT` (`+26 WT` Cap) | `2G` | Powers shields, aura projection, and cleave systems (`+35` Shield, `+6` Stability, `-4%` Cooldowns / `+3 WT`) |
| `vx_phantom_core` | **VX Phantom Core Mk.III** | Rogue | Frame Mod 1 (Reactor) | `7 WT` (`+24 WT` Cap) | `2G` | Low-emission stealth reactor (`+5%` Speed, `-8%` Cooldowns, `+8%` Venting / `-4` Stability) |
| `arc_infinite_well_reactor` | **ARC Infinite Well Reactor Mk.VI** | Wizard | Frame Mod 1 (Reactor) | `11 WT` (`+26 WT` Cap) | `2G` | High-capacity energy pool (`+40` Shield, `-12%` Cooldowns, `+10%` Venting / `-3` Stability) |
| `sanc_heartwell_reactor` | **SANC Heartwell Reactor Mk.IV** | Cleric | Frame Mod 1 (Reactor) | `12 WT` (`+26 WT` Cap) | `2G` | Balanced overflow distribution (`+30` Shield, `-8%` Cooldowns, `+8%` Venting, `+4` Stability) |
| `cd_erd_lodestone` | **Crystal Dynamics ERD Lodestone** | Warrior | Frame Mod 1 (Energy Storage) | `9 WT` (`+18 WT` Cap) | `2G` | Field-controlled energy reservoir for rapid discharge (`+15` Shield, `+16%` Venting, `-5%` Cooldowns) |
| `vx_shadow_capacitor` | **VX Shadow Capacitor** | Rogue | Frame Mod 1 (Energy Storage) | `6 WT` (`+18 WT` Cap) | `2G` | Rapid-discharge capacitor (`+15` Shield, `+6%` Speed, `-8%` Cooldowns / `-4` Stability) |
| `craft_alchemical_furnace_core` | **Crafted Alchemical Furnace Core** | Warrior | Frame Mod 1 (`CRAFTED`: `40 Scrap + 1 Ruby + 1 Citrine`) | `14 WT` (`+28 WT` Cap) | `1G` | Workbench-forged high-pressure furnace (`+18%` Venting, `+2.5` Attack Mass, `+5` Stability / `-3%` Speed) |
| `craft_harmonic_mana_condenser` | **Crafted Harmonic Mana Condenser** | Wizard | Frame Mod 1 (`CRAFTED`: `40 Scrap + 1 Sapphire + 1 Topaz`) | `10 WT` (`+22 WT` Cap) | `1G` | Workbench-forged crystal condenser (`+45` Shield, `-10%` Cooldowns / `-4` Stability) |

## 4. AUX / UTILITY SYSTEMS & ASSIGNABLE TRIGGER MODULES (`25 Modules`)

### 4A. Heritage Auxiliary & Tactical Utility Systems (`18 Modules`)

| ID | Name | Trait Line | Slot | Type | Weight | Cooldown / Cost | Identity & Mechanical Payload |
|---|---|---|---|---|---|---|---|
| `pnsy_rockweiler_buckler` | **PNSY R-11 Rockweiler Buckler** | Warrior | Aux 3 (`Mobility / Aux`) | Physical Shield | `6 WT` | `8.0s` · `+8 Heat` | Parrying shield & reactive plating (`1.1s` frontal active guard + parry counter-impulse) |
| `pnsy_rough_rider_booster` | **PNSY UF-9 Rough Rider Booster** | Warrior | Aux 4 (`Mobility Kit`) | Mobility | `7 WT` | `5.5s` · `+10 Heat` | Engagement/evasion thruster kit (`+14 WT` Cap, `+6%` Speed, `64px` high-impulse booster dash) |
| `pnsy_repair_drone` | **PNSY D-0g Repair Drone** | Warrior | Utility (`Action 6`) | Autonomous Drone | `8 WT` | `24.0s` · `+14 Heat` | Bay-launched repair drone restoring `+35` Frame Structure and `+25` Armor Durability over `6.0s` |
| `rad_bastion_kinetic_recycling` | **RAD R-22 Bastion Kinetic Recycling** | Marauder | Aux 3 (`Structure / Melee`) | Armor Augment | `10 WT` | `14.0s` · `+10 Heat` | Reactive plating absorbs kinetic hits for `4.5s`, venting `-18` Heat and granting `+16` Stability |
| `rad_ether_vapor_launcher` | **RAD UF-12 Ether Vapor Launcher** | Marauder | Aux 4 (`Integration / Ranged`) | Utility | `9 WT` | `16.0s` · `+12 Heat` | Fires an ether-vapor screen (`68px` radius, `5.0s`) that obscures vision and scrambles enemy locks |
| `rad_fathomless_system` | **RAD R463 Fathomless System** | Marauder | Utility (`Action 6`) | Self-Repair | `11 WT` | `26.0s` · `+16 Heat` | Converts excess reactor heat/energy into `+45` Structure and `+35` Armor Durability |
| `ti_aegis_hardlight_shield` | **TI Aegis Hard-Light Shield** | Guardian | Aux 3 (`Structure / Melee`) | Energy Shield | `8 WT` | `12.0s` · `+12 Heat` | Projects a deployable frontal hard-light barrier (`+55` Layer 1 Overshield for `5.0s`) |
| `ti_radiant_sphere_generator` | **TI Radiant Sphere Generator** | Guardian | Aux 4 (`Integration / Ranged`) | Energy Shield | `10 WT` | `20.0s` · `+16 Heat` | Deploys a `76px` protective dome (`6.0s`) granting `-25%` incoming ranged damage inside |
| `ti_lightwell_recovery_system` | **TI Lightwell Recovery System** | Guardian | Utility (`Action 6`) | Self-Repair | `9 WT` | `22.0s` · `+14 Heat` | Converts reactor overflow into `+50` Layer 1 Shield and `+30` Structure |
| `vx_eclipse_cloak_generator` | **VX Eclipse Cloak Generator** | Rogue | Aux 3 (`Mobility Kit`) | Stealth | `5 WT` | `16.0s` · `+10 Heat` | Active optical camouflage & heat masking (`3.5s` stealth + `+15%` move speed) |
| `vx_phaseshift_module` | **VX Phase-Shift Module** | Rogue | Aux 4 (`Mobility Kit`) | Evasion | `5 WT` | `11.0s` · `+12 Heat` | Brief intangibility phase-dash (`0.55s` `i-frames`, passes through units and obstacles) |
| `vx_smoke_dispersal_system` | **VX Smoke Dispersal System** | Rogue | Utility (`Action 6`) | Utility | `6 WT` | `18.0s` · `+10 Heat` | Releases thermal-masking smoke canisters (`64px` radius, `4.5s` blind + `2.0s` personal cloak) |
| `arc_prismatic_barrier` | **ARC Prismatic Barrier** | Wizard | Aux 3 (`Integration / Ranged`) | Energy Shield | `7 WT` | `14.0s` · `+12 Heat` | Prismatic lattice (`+45` Overshield for `5.0s`) that refracts and reflects `25%` of incoming beams |
| `arc_feedback_loop_capacitor` | **ARC Feedback Loop Capacitor** | Wizard | Aux 4 (`Integration / Ranged`) | Energy Shield | `8 WT` | `16.0s` · `+14 Heat` | Absorbs incoming energy damage for `4.0s` and discharges a `72px` counter-pulse |
| `arc_rift_anchor` | **ARC Rift Anchor** | Wizard | Utility (`Action 6`) | Mobility | `7 WT` | `15.0s` · `+16 Heat` | Short-range `84px` phase-blink teleport escape that leaves an arcane snare at origin |
| `sanc_aegis_restoration_field` | **SANC Aegis Restoration Field** | Cleric | Aux 3 (`Integration / Ranged`) | Repair | `8 WT` | `18.0s` · `+14 Heat` | Pulses an `80px` harmonic wave restoring `+40` Layer 1 Shield and `+20` Armor Durability |
| `sanc_martyrdom_plating` | **SANC Martyrdom Plating** | Cleric | Aux 4 (`Structure / Melee`) | Armor Augment | `10 WT` | `20.0s` · `+12 Heat` | Hardens frame for `6.0s` (`+20%` DR, redirects nearby ally damage to your Layer 1 Shield) |
| `sanc_radiant_ward_projector` | **SANC Radiant Ward Projector** | Cleric | Utility (`Action 6`) | Barrier | `9 WT` | `20.0s` · `+15 Heat` | Deploys a sanctified ward (`74px` radius, `6.0s`) that cleanses status effects and absorbs damage |

### 4B. Assignable Hardware & Reactor Trigger Actions (`7 Active Modules`)

| Action ID | Module Name | Source Hardware / Reactor | Cooldown / Cost | Tactical Execution |
|---|---|---|---|---|
| `hw_act_turbine_overclock` | **Alchemic Turbine Overclock** | `PNSY Alchemic Turbine Core Mk.IV` | `18.0s` · `+18 Heat` | Surges turbine pressure for `5.0s` (`+18%` attack & move tempo, `-20%` cooldowns) |
| `hw_act_battleheart_recycle` | **Battleheart Kinetic Purge** | `RAD Battleheart Ether Reactor Mk.V` | `16.0s` · `0 Heat` | Vents `-28` Reactor Heat and converts it into a `60px` concussive shockwave (`Impact`) |
| `hw_act_manaheart_aegis` | **Manaheart Aegis Pulse** | `TI Manaheart Reactor Mk.IV` | `18.0s` · `+12 Heat` | Instantly restores `+45` Layer 1 Shield and emits a `64px` stagger-resistant radiant pulse |
| `hw_act_phantom_veil` | **Phantom Low-Emission Veil** | `VX Phantom Core Mk.III` | `16.0s` · `+8 Heat` | Drops thermal signature for `2.8s` (`Stealth` + `-15` Heat vent + `+12%` glide speed) |
| `hw_act_infinite_well_surge` | **Infinite Well Singularity Tap** | `ARC Infinite Well Reactor Mk.VI` | `20.0s` · `+14 Heat` | Empowering surge (`5.0s`) granting `+22%` ranged/caster damage and `-25%` skill cooldowns |
| `hw_act_heartwell_benediction` | **Heartwell Sanctuary Pulse** | `SANC Heartwell Reactor Mk.IV` | `20.0s` · `+12 Heat` | Restores `+30` Structure, `+35` Shield, and cleanses active DoT/corrosive status effects |
| `hw_act_lodestone_discharge` | **ERD Lodestone Arc Discharge** | `Crystal Dynamics ERD Lodestone` | `14.0s` · `+10 Heat` | Releases stored capacitor charge as a chaining `76px` lightning arc (`Pulse`, chains up to `3` targets) |

## 5. HEAD DOME PLATES, OPTICS & BATTLEFIELD SENSORS (`30 Items`)

### 5A. Exterior Head Dome Plates (`7 Items`)

| ID | Name | Trait Line | Weight | Armor (`DUR / RTG / THR`) | Shield | Gem Slots | Identity & Zero-Sum Trade-Off |
|---|---|---|---|---|---|---|---|
| `cd_g341_murmillio` | **Crystal Dynamics G341 Murmillio** | Warrior | `6 WT` | `55 / 5 / 3` | `+15` | `2G` | Reinforced crest helm & heat vents (`+0.5` Light, `+3%` Venting, `+3` Stability) |
| `be_ironveil_command_dome` | **BE Ironveil Command Dome** | Marauder | `10 WT` | `80 / 7 / 5` | `+10` | `2G` | Heavy siege command dome (`+7` Stability / `-2%` Speed) |
| `aegis_halo_command_dome` | **Aegis Halo Command Dome** | Guardian | `7 WT` | `68 / 6 / 4` | `+25` | `2G` | Mana-channeling halo dome (`+0.5` Light, `+5` Stability) |
| `vx_veilsight_command_helm` | **VX Veilsight Command Helm** | Rogue | `3 WT` | `40 / 3 / 2` | `+15` | `2G` | Ultralight low-light visor (`+1.5` Light, `+4%` Accuracy, `+2%` Speed / `-3` Stability) |
| `arc_omniscient_command_dome` | **ARC Omniscient Command Dome** | Wizard | `5 WT` | `48 / 4 / 3` | `+35` | `2G` | Crystal lattice telemetry dome (`+1.0` Light, `+4%` Accuracy, `-4%` Cooldowns / `-2` Stability) |
| `sanc_providence_command_helm` | **SANC Providence Command Helm** | Cleric | `6 WT` | `58 / 5 / 3` | `+25` | `2G` | Ally triage HUD helm (`+0.8` Light, `-4%` Cooldowns, `+3` Stability) |
| `camelot_great_basinet` | **Camelot Great Basinet** | Guardian | `8 WT` | `72 / 6 / 4` | `+20` | `2G` |Hinged houndskull knightly visor (`+6` Stability, `+10%` Tell Readability / `-2%` Speed) |

### 5B. Internal Head Mod 1 — Optics Suites (`8 Items`)

| ID | Name | Trait Line | Acquisition | Weight | Gem Slots | Optical Domain Modifiers & Zero-Sum Trade-Off |
|---|---|---|---|---|---|---|
| `cd_embersight_suite` | **Crystal Dynamics EmberSight Suite** | Warrior | `LOOTED` | `2 WT` | `2G` | `+1.0` Light, `+8%` Accuracy, `+6%` Stagger Damage / `+1 WT` thermal draw |
| `be_foresight_targeting_array` | **BE Foresight Targeting Array** | Marauder | `LOOTED` | `3 WT` | `2G` | `+0.8` Light, `+12%` Accuracy, `+8%` Stagger Damage / `-2%` Move Speed |
| `aegis_radiant_targeting_array` | **Aegis Radiant Targeting Array** | Guardian | `LOOTED` | `2 WT` | `2G` | `+1.2` Light, `+7%` Accuracy, `+10%` Enemy Tell Readability / `+2 WT` |
| `veilsight_targeting_suite` | **Veilsight Targeting Suite** | Rogue | `LOOTED` | `1 WT` | `2G` | `+2.0` Light, `+10%` Accuracy, `+12%` Stagger/Crit Precision / `-2` Stability |
| `arc_omniscient_array` | **ARC Omniscient Array** | Wizard | `LOOTED` | `2 WT` | `2G` | `+1.4` Light, `+11%` Accuracy, `-4%` Cooldowns / `-2` Stability |
| `sanc_providence_scanner` | **SANC Providence Scanner** | Cleric | `LOOTED` | `2 WT` | `2G` | `+1.0` Light, `+6%` Accuracy, `+14%` Enemy Tell Readability, `-3%` Cooldowns |
| `craft_thermal_pinpoint_lens` | **Crafted Thermal Pinpoint Lens** | Rogue | `CRAFTED` (`28 Scrap + 1 Ruby`) | `2 WT` | `1G` | `+1.5` Light, `+12%` Accuracy, `+10%` Stagger/Crit Damage / `+3%` Heat |
| `craft_aether_prism_sight` | **Crafted Æther Prism Sight** | Wizard | `CRAFTED` (`28 Scrap + 1 Topaz`) | `2 WT` | `1G` | `+1.8` Light, `+9%` Accuracy, `-5%` Cooldowns / `-2` Stability |

### 5C. Internal Head Mod 2 & Mod 3 — Battlefield Sensory Arrays (`15 Items`)

| ID | Name | Trait Line | Slot (`Acquisition`) | Weight | Gem Slots | Sensory Domain Modifiers & Zero-Sum Trade-Off |
|---|---|---|---|---|---|---|
| `fed_t7_sensor_array` | **Federated T7 Sensor Array** | Warrior | Sensory A (`LOOTED`) | `2 WT` | `1G` | `+0.8` Light, `+12%` Enemy Tell Window, `+5%` Accuracy |
| `nds_arcpulse_sensor_grid` | **NDS ArcPulse Sensor Grid** | Marauder | Sensory A (`LOOTED`) | `3 WT` | `1G` | `+0.6` Light, `+10%` Stagger Damage, `+10%` Tell Window / `+3 WT` |
| `solbright_flux_sensor_grid` | **Solbright Flux Sensor Grid** | Guardian | Sensory A (`LOOTED`) | `2 WT` | `1G` | `+1.0` Light, `+15` Layer 1 Shield harmonics, `+10%` Tell Window |
| `vx_phantom_network_sensor` | **VX Phantom Network Sensor** | Rogue | Sensory A (`LOOTED`) | `1 WT` | `2G` | `+1.4` Light, `+15%` Tell Window, `+6%` Accuracy / `-2` Stability |
| `arc_manaflow_analyzer` | **ARC Manaflow Analyzer** | Wizard | Sensory A (`LOOTED`) | `2 WT` | `1G` | `+0.8` Light, `-5%` Cooldowns, `+5%` Venting |
| `sanc_lifeline_monitor` | **SANC Lifeline Monitor** | Cleric | Sensory A (`LOOTED`) | `2 WT` | `1G` | `+0.8` Light, `+14%` Tell Window, `-4%` Cooldowns |
| `craft_seismic_tremor_sensor` | **Crafted Seismic Tremor Sensor** | Marauder | Sensory A (`CRAFTED`: `24 Scrap + 1 Garnet`) | `2 WT` | `1G` | `+16%` Enemy Tell Window, `+4` Stability, `+8%` Stagger Damage |
| `fed_echopulse_scanner` | **Federated EchoPulse Scanner** | Warrior | Sensory B (`LOOTED`) | `2 WT` | `1G` | `+0.8` Light, `+8%` Stagger Damage, `+10%` Tell Window |
| `nds_echostorm_threat_analyzer` | **NDS EchoStorm Threat Analyzer** | Marauder | Sensory B (`LOOTED`) | `3 WT` | `1G` | `+0.6` Light, `+8%` Accuracy, `+12%` Tell Window |
| `aegis_lightveil_analyzer` | **Aegis Lightveil Analyzer** | Guardian | Sensory B (`LOOTED`) | `2 WT` | `1G` | `+1.0` Light, `+15` Shield stress buffer, `+4` Stability |
| `vx_echonull_scanner` | **VX Echo-Null Scanner** | Rogue | Sensory B (`LOOTED`) | `1 WT` | `2G` | `+1.2` Light, `+10%` Stagger/Crit Precision, `+12%` Tell Window |
| `arc_convergence_predictor` | **ARC Convergence Predictor** | Wizard | Sensory B (`LOOTED`) | `2 WT` | `1G` | `+0.8` Light, `+9%` Accuracy, `+8%` Stagger Damage |
| `sanc_blessing_resonance_grid` | **SANC Blessing Resonance Grid** | Cleric | Sensory B (`LOOTED`) | `2 WT` | `1G` | `+0.8` Light, `-6%` Cooldowns, `+10` Layer 1 Shield |
| `poe_bog_lantern_sensor` | **Poe's Bog-Lantern Array** | Rogue | Sensory B (`QUEST RELIC`) | `1 WT` | `2G` | `+2.6` Light, reveals submerged Bog Wurms & deep æther fog pockets, `+15%` Tell Window |
| `craft_chronometric_tell_predictor` | **Crafted Chronometric Tell Predictor** | Guardian | Sensory B (`CRAFTED`: `26 Scrap + 1 Aquamarine`) | `2 WT` | `1G` | `+20%` Enemy Tell Window, `+6%` Accuracy / `+4%` Cooldowns |

## 6. ARM ASSEMBLIES, ACTUATORS & LEG STRIDERS (`23 Items`)

### 6A. Exterior Arm Aperture Plates (`7 Items`) & Internal Arm Actuators (`8 Items`)

| ID | Name | Trait Line | Slot (`Acquisition`) | Weight | Armor (`DUR / RTG / THR`) | Shield | Gem Slots | Mechanical Domain & Zero-Sum Trade-Off |
|---|---|---|---|---|---|---|---|---|
| `bwi_twinstrike_gauntlets` | **BWI Twinstrike Gauntlets** | Warrior | Arms Exterior (`LOOTED`) | `8 WT` | `65 / 5 / 3` | `+10` | `2G` | Recoil dampeners (`+2.0` Attack Mass, `+3%` Accuracy, `+3` Stability) |
| `fire_ice_line_holder` | **Fire & Ice Line Holder** | Marauder | Arms Exterior (`LOOTED`) | `13 WT` | `95 / 7 / 5` | `+10` | `2G` | Heavy siege bracing gauntlets (`+4.0` Attack Mass, `+8` Stability / `-2%` Speed) |
| `solbright_cleaver_assemblies` | **Solbright Cleaver Assemblies** | Guardian | Arms Exterior (`LOOTED`) | `9 WT` | `78 / 6 / 4` | `+20` | `2G` | Reactor-linked sword-spear channels (`+2.5` Attack Mass, `+5` Stability) |
| `shadowcraft_silencer_gauntlets` | **Shadowcraft Silencer Gauntlets** | Rogue | Arms Exterior (`LOOTED`) | `4 WT` | `45 / 3 / 2` | `+10` | `2G` | Vibration-damped gauntlets (`+6%` Accuracy, `+8%` Stagger/Crit / `-2` Stability) |
| `arcanum_channeler_assemblies` | **Arcanum Channeler Assemblies** | Wizard | Arms Exterior (`LOOTED`) | `6 WT` | `52 / 4 / 3` | `+25` | `2G` | Beam-focusing conduit vambraces (`+5%` Accuracy, `-4%` Cooldowns) |
| `sanctum_benediction_assemblies` | **Sanctum Benediction Assemblies** | Cleric | Arms Exterior (`LOOTED`) | `7 WT` | `62 / 5 / 3` | `+20` | `2G` | Harmonic emitter gauntlets (`+1.5` Attack Mass, `-4%` Cooldowns, `+3` Stability) |
| `camelot_vanguard_vambraces` | **Camelot Vanguard Vambraces** | Guardian | Arms Exterior (`LOOTED`) | `9 WT` | `75 / 6 / 4` | `+15` | `2G` | Fluted plate vambraces (`+3.0` Attack Mass, `+6` Stability / `-1%` Speed) |
| `act_bwi_twin_servos` | **BWI Twin-Link Servo Actuators** | Warrior | Arms Mod 1 (`LOOTED`) | `3 WT` | `0 / 0 / 0` | `0` | `2G` | `+2.5` Attack Mass, `+5%` Accuracy, `+6%` Stagger Damage |
| `act_rad_siege_braces` | **RAD Hydraulic Siege Braces** | Marauder | Arms Mod 1 (`LOOTED`) | `5 WT` | `0 / 0 / 0` | `0` | `2G` | `+4.5` Attack Mass, `+8` Stability, `+10%` Stagger Damage / `-2%` Speed |
| `act_ti_aegis_couplers` | **TI Aegis Guard Couplers** | Guardian | Arms Mod 1 (`LOOTED`) | `3 WT` | `0 / 0 / 0` | `+15` | `2G` | `+2.5` Attack Mass, `+6` Stability, `+15` Shield guard coupler |
| `act_vx_whisper_gyros` | **VX Whisper Recoil Gyros** | Rogue | Arms Mod 1 (`LOOTED`) | `2 WT` | `0 / 0 / 0` | `0` | `2G` | `+8%` Accuracy, `+10%` Stagger/Crit Precision, `-3%` Cooldowns |
| `act_arc_conduit_relays` | **ARC Flux Conduit Relays** | Wizard | Arms Mod 1 (`LOOTED`) | `2 WT` | `0 / 0 / 0` | `+15` | `2G` | `+6%` Accuracy, `-6%` Cooldowns, `+5%` Venting |
| `act_sanc_harmonic_links` | **SANC Harmonic Grip Links** | Cleric | Arms Mod 1 (`LOOTED`) | `3 WT` | `0 / 0 / 0` | `+15` | `2G` | `+1.5` Attack Mass, `-5%` Cooldowns, `+4` Stability |
| `craft_pneumatic_pile_actuators` | **Crafted Pneumatic Pile Actuators** | Marauder | Arms Mod 1 (`CRAFTED`: `30 Scrap + 1 Ruby`) | `4 WT` | `0 / 0 / 0` | `0` | `1G` | `+5.0` Attack Mass, `+14%` Stagger Damage / `+6%` Heat |
| `craft_gyro_draw_stabilizers` | **Crafted Gyro-Draw Stabilizers** | Rogue | Arms Mod 1 (`CRAFTED`: `28 Scrap + 1 Emerald`) | `2 WT` | `0 / 0 / 0` | `0` | `1G` | `+10%` Accuracy, `-5%` Cooldowns / `-2` Stability |

### 6B. Leg Striders & Stabilizer Actuators (`8 Items`)

| ID | Name | Trait Line | Acquisition | Weight & Cap Bonus | Gem Slots | Mobility / Stability Modifiers & Zero-Sum Trade-Off |
|---|---|---|---|---|---|---|
| `bwi_gatecrasher_striders` | **BWI Gatecrasher Striders** | Warrior | `LOOTED` | `9 WT` (`+10 WT` Cap) | `2G` | Shock-absorbing booster legs (`+5%` Move Speed, `+5` Stability, `+1.5` Attack Mass) |
| `fire_ice_outrigger_striders` | **Fire & Ice Outrigger Striders** | Marauder | `LOOTED` | `15 WT` (`+22 WT` Cap) | `2G` | Heavy siege outriggers (`+16` Stability, `+3.0` Attack Mass / `-5%` Move Speed) |
| `dawnforge_stabilizer_striders` | **Dawnforge Stabilizer Striders** | Guardian | `LOOTED` | `11 WT` (`+16 WT` Cap) | `2G` | Stabilizer anchor greaves (`+12` Stability, `+2.0` Attack Mass / `-2%` Move Speed) |
| `shadowcraft_ghost_striders` | **Shadowcraft Ghost Striders** | Rogue | `LOOTED` | `5 WT` (`+8 WT` Cap) | `2G` | Silent burst-acceleration legs (`+10%` Move Speed, `-4%` Cooldowns / `-6` Stability) |
| `arcanum_anchor_striders` | **Arcanum Anchor Striders** | Wizard | `LOOTED` | `8 WT` (`+12 WT` Cap) | `2G` | Energy grounding greaves (`+6` Stability, `+6%` Venting, `-4%` Cooldowns) |
| `sanctum_steadfast_striders` | **Sanctum Steadfast Striders** | Cleric | `LOOTED` | `9 WT` (`+14 WT` Cap) | `2G` | Support positioning anchors (`+9` Stability, `+4%` Venting, `+2%` Move Speed) |
| `craft_mag_rail_skates` | **Crafted Mag-Rail Skates** | Rogue | `CRAFTED` (`32 Scrap + 1 Emerald`) | `6 WT` (`+8 WT` Cap) | `1G` | High-glide magnetic skates (`+12%` Move Speed, `-5%` Cooldowns / `-8` Stability) |
| `craft_siege_spade_outriggers` | **Crafted Siege-Spade Outriggers** | Marauder | `CRAFTED` (`34 Scrap + 1 Garnet`) | `16 WT` (`+26 WT` Cap) | `1G` | Hydraulic ground-spade anchors (`+20` Stability, `+3.5` Attack Mass / `-6%` Move Speed) |

## 6C. GEMSTONES, BELT FLASKS, CONSUMABLES, CURRENCIES & QUEST / RELIC ITEMS (`36 Items`)

### 6C.1 The 9 Canonical Gemstones (`Slot-Adaptive Equipment Sockets & Skill Investment`)

| Gemstone | Color / Palette Row | Weapon / Component Socket Bonus | Exterior Armor Socket Bonus (`Head`, `Arms`, `Plating`) | Internal Sub-Module Socket Bonus (`Optics`, `Sensors`, `Actuators`, `Reactor`, `Legs`) |
|---|---|---|---|---|
| **Ruby** (`ruby`) | Crimson (`Row 1`) | `+8%` Base Damage, `+1.0` Attack Mass | `+12` Armor Durability, `+1` Armor Rating | `+1.5` Attack Mass, `+5%` Stagger Damage |
| **Sapphire** (`sapphire`) | Cobalt (`Row 2`) | `-8%` Heat Cost, `+6%` Wave/Beam Velocity | `+18` Layer 1 Shield Capacity | `+8%` Heat Venting, `-4%` Skill Cooldowns |
| **Emerald** (`emerald`) | Viridian (`Row 3`) | `-6%` Attack Cadence Duration, `+6%` Accuracy | `+3%` Move Speed, `+8` Armor Durability | `+4%` Move Speed, `+6%` Accuracy |
| **Topaz** (`topaz`) | Amber-Gold (`Row 4`) | `+6%` Base Damage, `+8%` Beam/Projectile Speed | `+14` Layer 1 Shield, `+0.4` Light Radius | `+0.8` Light Radius, `-5%` Skill Cooldowns |
| **Amethyst** (`amethyst`) | Violet (`Row 5`) | `+5%` Critical Hit Chance, `-6%` Skill Cooldowns | `+12` Layer 1 Shield, `-3%` Skill Cooldowns | `-6%` Skill Cooldowns, `+8%` Enemy Tell Window |
| **Diamond** (`diamond`) | Prismatic White (`Row 6`) | `+6%` Base Damage, `+4%` Crit Chance, `-4%` Heat | `+15` Armor Durability, `+15` Layer 1 Shield, `+1` RTG | `+4` Stability, `-4%` Cooldowns, `+5%` Venting |
| **Citrine** (`citrine`) | Solar Orange (`Row 7`) | `+10%` Stagger Impulse, `+5%` Base Damage | `+10` Armor Durability, `+4` Stability | `+6%` Stagger Damage, `+5%` Heat Venting |
| **Garnet** (`garnet`) | Deep Bordeaux (`Row 8`) | `+12%` Stagger Impulse, `+1.5` Attack Mass | `+18` Armor Durability, `+1` Armor Threshold, `+5` Stability | `+8` Stability, `+6 WT` Load Capacity |
| **Aquamarine** (`aquamarine`) | Seafoam Cyan (`Row 9`) | `-10%` Heat Generation, `+8%` Accuracy | `+14` Layer 1 Shield, `+4%` Heat Venting | `+10%` Enemy Tell Window, `+6%` Heat Venting |

### 6C.2 Belt Flasks, Gem-Infused Elixirs & Field Consumables (`11 Items`)

| Item ID | Name | Category | Charges / Cooldown | Effect & Tactical Use |
|---|---|---|---|---|
| `moonstone_grail_flask` | **Moonstone Grail Flask** | Primary Belt Flask (`[C]` / `[RB]`) | `3` Charges (refills at Waystations) | Restores **`+45` Frame Structure**, **`+35` Layer 1 Shield**, and vents **`-20` Reactor Heat** |
| `flask_ruby` | **Ruby Ignition Draught** | Gem-Infused Belt Flask | `2` Charges · `18s` duration | Grants **`+18%` melee & physical damage** and **`+2.5` Attack Mass** for `18.0s` |
| `flask_sapphire` | **Sapphire Coolant Phial** | Gem-Infused Belt Flask | `2` Charges · Instant + `15s` | Immediately vents **`-45` Reactor Heat** and grants **`+30%` Heat Dissipation** for `15.0s` |
| `flask_emerald` | **Emerald Quicksilver Tonic** | Gem-Infused Belt Flask | `2` Charges · `18s` duration | Grants **`+15%` Move Speed**, **`-15%` Booster Dash Cooldown**, and **`+10%` Accuracy** for `18.0s` |
| `flask_topaz` | **Topaz Luminary Elixir** | Gem-Infused Belt Flask | `2` Charges · `20s` duration | Restores **`+50` Layer 1 Overshield**, expands **Light Radius (`+2.5`)**, and boosts **Beam/Caster damage by `+15%`** |
| `flask_amethyst` | **Amethyst Veil Tincture** | Gem-Infused Belt Flask | `2` Charges · `16s` duration | Grants **`2.5s` Optical Camouflage** on drink and **`+12%` Critical Hit Chance** for `16.0s` |
| `flask_citrine` | **Citrine Siege-Breaker Brew** | Gem-Infused Belt Flask | `2` Charges · `18s` duration | Grants **`+25%` Stagger & Guard-Break Impulse** and **`+10` Stability** for `18.0s` |
| `flask_garnet` | **Garnet Ironclad Decoction** | Gem-Infused Belt Flask | `2` Charges · `20s` duration | Repairs **`+40` Layer 2 Armor Durability** and grants **`+3` Armor Rating** & **`+14` Stability** for `20.0s` |
| `flask_aquamarine` | **Aquamarine Clarity Draught** | Gem-Infused Belt Flask | `2` Charges · `20s` duration | Cleanses all corrosive/DoT effects, prevents bog corrosion for `20.0s`, and extends **Enemy Tell Windows by `+20%`** |
| `orc_war_paint` | **Orcish Blood-Ochre War Paint** | Field Consumable | Single-Use (`Stackable`) | Grants **`+15%` melee damage**, **`+8` Stability**, and **`-10%` heat generation** for `30.0s` |
| `basic_booster_kit` | **Field Patch & Booster Cell** | Field Consumable | Single-Use (`Stackable`) | Field maintenance charge restoring **`+25` Structure**, **`+25` Armor Durability**, and **`+25` Shield** |

### 6C.3 Scrap & Coin Pickups (`3 Tiers`) & Campaign Quest / Key / Relic Items (`13 Items`)

| Item ID | Name | Category | Zone / Source | Purpose & Campaign Interaction |
|---|---|---|---|---|
| `coin_copper` | **Copper Bog-Scrip (`+5 Scrap`)** | Currency Pickup | Standard enemy & crate drop | Adds **`+5` Scrap** for Armory Workbench crafting and merchant trade |
| `coin_silver` | **Silver Camelot Denier (`+15 Scrap`)** | Currency Pickup | Elite knight, patrol & chest drop | Adds **`+15` Scrap** for Armory Workbench crafting and merchant trade |
| `coin_gold` | **Gold Waygate Sovereign (`+50 Scrap`)** | Currency Pickup | Boss & deep reliquary cache drop | Adds **`+50` Scrap** for Armory Workbench crafting and merchant trade |
| `poe_lantern_fragment` | **Poe's Fractured Lantern Core** | Quest Item (`M00 The Bog`) | Drowned monastery ruin in The Bog | Returned to the Poe spirit to rekindle its lantern and receive **Poe's Bog-Lantern Array** |
| `bedivere_signet_ring` | **Sir Bedivere's Signet Ring** | Quest / Consequence Relic (`M00 → M01`) | Sir Bedivere's fallen chassis in The Bog | Taking it marks you as a grave robber to Camelot loyalists in Border Town, but unlocks the **Cathedral Crypt & Lady of the Lake** subplot |
| `bedivere_numbered_list` | **Bedivere's Numbered Vellum List** | Quest Cipher (`M00 → M01`) | Sir Bedivere's satchel in The Bog | Lists the **3 Arthurian Offering Relics** (*Tarnished Chalice*, *Broken Spur of Camlann*, *Vial of Avalon Dew*) required at the deep bog water |
| `bedivere_relic_chalice` | **Tarnished Grail Chalice (`List #1`)** | Secret Offering Relic | Hidden behind a desynchronizing wall in Market District | First of Bedivere's three listed relics for the **Lady of the Lake** ritual |
| `bedivere_relic_spur` | **Broken Spur of Camlann (`List #2`)** | Secret Offering Relic | Locked armory cache in Barracks Quarter | Second of Bedivere's three listed relics for the **Lady of the Lake** ritual |
| `bedivere_relic_dew` | **Vial of Avalon Dew (`List #3`)** | Secret Offering Relic | Beneath the defiled altar in Cathedral District | Third of Bedivere's three listed relics; offering all 3 in The Bog summons **The Lady of the Lake** |
| `grail_fragment_percival` | **Percival's Grail Fragment** | Boss Key (`Camelot Border Town`) | Dropped by **Sir Percival, Grail Knight** | One of three Grail Fragments needed to unseal the **Cathedral Dungeon Door** by force |
| `grail_fragment_tristan` | **Tristan's Grail Fragment** | Boss Key (`Camelot Border Town`) | Dropped by **Sir Tristan, Corrupted Ranger** | Second of three Grail Fragments needed to unseal the **Cathedral Dungeon Door** by force |
| `grail_fragment_bors` | **Bors's Grail Fragment** | Boss Key (`Camelot Border Town`) | Dropped by **Sir Bors, Berserk Striker** | Third of three Grail Fragments; defeating Percival, Tristan, and Bors together also awards **Knight's Oath** |
| `camelot_waygate_tuning_fork` | **Camelot Waygate Tuning Crystal** | Major Campaign Key | Deep Dungeon sanctum beneath Cathedral District | Stabilizes the **Belldor Waygate** aperture for interworld transit |
| `scabbard_of_avalon` | **The Scabbard of Avalon** | Lore-Bound Legendary Relic (`Belldor`) | Dropped by **The Lady of the Lake** (`lady_of_the_lake_defeated`) | Mounts exclusively into **Excalibur** (`leg_excalibur`) at the Armory Workbench, transforming it into **Excalibur, Sheathed in Avalon** (`PREVENT_LETHAL_DOT`) |
| `medusas_head` | **Medusa's Head** | Lore-Bound Legendary Relic (`Tyrranus`) | Dropped by **The Gorgon Medusa** (`medusa_defeated`) | Mounts exclusively into **Aegis** (`leg_aegis`) at the Armory Workbench, transforming it into **Aegis of the Gorgon** (*Gorgon's Gaze* boss-piercing petrification) |
| `leg_juuchi_yosamu` | **Juuchi Yosamu (Muramasa Companion Blade)** | Playable Legendary Katana & Lore-Bound Relic (`Novarin`) | Recovered after **The Demon Blade Trial** (`juuchi_yosamu_claimed`) | Wielded standalone (`DR_DURING_ACTIVE_HIT_FRAMES`) or mounted into **Yawarakai-Te** (`leg_yawarakai_te`) to fuse into **Yawarakai-Te & Juuchi Yosamu** (`TWIN_BLADE_DUAL_EXECUTION`) |

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

All **22 Specialist Martial Stances** (`3` Tier I, `13` Tier II, `6` Tier III) are standalone weapon-mastery nodes (`Rule P-04`) distributed across the 6 Combat Discipline sectors. All **Custom (`72`)**, **Magitech (`37`)**, and **Legendary (`6`)** weapons qualify by shared **Functional Weapon Type** (`resolveWeaponFunctionalType`). When socketed and paired with matching equipment and Frame Load Bracket (`Light` / `Medium` / `Heavy`), the stance overrides **Action 2**, **Action 4**, and **Action 5** and applies passive BCU/Inertia modifiers:

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

