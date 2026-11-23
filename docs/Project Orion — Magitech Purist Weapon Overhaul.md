# Project Orion — Magitech Purist Weapon Overhaul

*A standalone architectural, lore, and data-schema specification for the 32 Groomed `Magitech` Purist Weapons in Project Orion.*

---

## 📑 Table of Contents

1. [Core Role: `Magitech` Purist Relics vs. `Custom` Gap-Fillers](#1-core-role-magitech-purist-relics-vs-custom-gap-fillers)
2. [Lore-Driven Hardware Architecture (`0` to `3` Open Mounts + `1G`)](#2-lore-driven-hardware-architecture-0-to-3-open-mounts--1g)
   - [2.1 The Four Hardware Architecture Tiers](#21-the-four-hardware-architecture-tiers)
   - [2.2 Sealed vs. Exposed Domain Rules & Stance Isolation](#22-sealed-vs-exposed-domain-rules--stance-isolation)
3. [Specialist Stance Purist Relics (27 Relics Covering All 22 Stances)](#3-specialist-stance-purist-relics-27-relics-covering-all-22-stances)
   - [3.1 Fighter Umbrella (`Warrior` & `Guardian` · 10 Stances · 13 Relics)](#31-fighter-umbrella-warrior--guardian--10-stances--13-relics)
   - [3.2 Rogue Umbrella (`Rogue` & `Marauder` · 9 Stances · 10 Relics)](#32-rogue-umbrella-rogue--marauder--9-stances--10-relics)
   - [3.3 Scholar Umbrella (`Wizard` & `Cleric` · 3 Stances · 4 Relics)](#33-scholar-umbrella-wizard--cleric--3-stances--4-relics)
4. [Core-Chain Apex Relics (5 Non-Stance Purist Weapons)](#4-core-chain-apex-relics-5-non-stance-purist-weapons)
5. [TypeScript Data Schema & Sealed-Mount Enforcement](#5-typescript-data-schema--sealed-mount-enforcement)

---

## 1. Core Role: `Magitech` Purist Relics vs. `Custom` Gap-Fillers

- **Purist Identity**: While the **72 `Custom` Weapons** (`weapon_mod_overhaul.md`) act as flexible, blank-slate gap-fillers for open-ended hybrid builds, the **32 Groomed `Magitech` Weapons** are purpose-built manufacturer relics designed for **Purists** who commit to one of the **22 Specialist Martial Stances** or a **Tier V Core Feat Chain**.
- **100% Stance Alignment**: Every one of the **22 Specialist Martial Stances** (`3` Tier I, `13` Tier II, `6` Tier III) now has dedicated `Magitech` primary (and paired off-hand/dorsal carrier) relics whose functional weapon class, grip, and weight (`WT`) land naturally inside that stance's required **Load Bracket** (`Light`, `Medium`, or `Heavy`).
- **Standardized Manufacturer Designations & Preserved Epithets**: All `Magitech` relics follow a unified industrial naming convention (`<Prefix>-<Code> <Name>`) while preserving iconic titles (*"the Siegebreaker"*, *"this hallowed scepter"*, *"Grace Edge"*, and *"the Aegis Charge Buckler"*) inside their Codex and Armory flavor text.
- **Zero Stance Collision**: Because Specialist Stances override **Actions 2, 4, and 5**, `Magitech` relics express their signature identity through:
  1. A bespoke **Action 1** moveset/emitter,
  2. **1 Resonance Gem Socket (`1G`)**, and
  3. A **Purist Resonance Passive** that activates while its paired Specialist Stance (or Core Chain capstone) is socketed.

---

## 2. Lore-Driven Hardware Architecture (`0` to `3` Open Mounts + `1G`)

Instead of restricting every `Magitech` weapon to a uniform `1`-slot cap, each relic's component slot count (`0`, `1`, `2`, or `3`) is governed by its **physical construction and lore**—specifically, which physical domains (`CONTACT`, `DELIVERY`, `REGULATION`) are hermetically sealed factory assemblies versus exposed mil-spec mounts.

### 2.1 The Four Hardware Architecture Tiers

| Open Slots | Architecture Tier | Lore & Engineering Justification | Modification Authority |
| :---: | :--- | :--- | :--- |
| **`0` Slots** *(6 Relics)* | **Hermetically Sealed Monolith** | Forged from a single continuous crystal lattice, monomolecular blade, or sealed gyro-emitter. Breaking the casing ruins harmonic alignment. | **`0` Component Slots** + **`1` Resonance Gem Socket (`1G`)**. Purest, unalterable factory expression. |
| **`1` Slot** *(9 Relics)* | **Semi-Sealed Assembly** | The proprietary emitter, turbine edge, or relic head is factory-sealed, leaving **1 exposed mechanical mount** (such as a pommel, haft, or rear shroud) for pilot calibration. | **`1` Specific Exposed Domain** (`DELIVERY` or `REGULATION`) + **`1` Resonance Gem Socket (`1G`)**. |
| **`2` Slots** *(13 Relics)* | **Modular-Frame Relic** | Built around **1 sealed signature core** (e.g., an integrated receiver, bow stave, or automated feed), while the remaining **2 physical domains** use standard military rails/fittings. | **`2` Specific Exposed Domains** + **`1` Resonance Gem Socket (`1G`)**. |
| **`3` Slots** *(4 Relics)* | **Open-Frame Reference Platform** | Standardized military reference platforms (such as the `N-55 Gladius` or `HL-110 Dawnblade`) built with full 3-domain mil-spec rails alongside a unique factory action/receiver. | **All `3` Domains** (`CONTACT`, `DELIVERY`, `REGULATION`) + **`1` Resonance Gem Socket (`1G`)**. |

---

### 2.2 Sealed vs. Exposed Domain Rules & Stance Isolation

1. **Shared Component Pool**: Exposed `Magitech` mounts accept standard physical components from their matching **Weapon Class** (`weapon_mod_overhaul.md`), obeying all non-sequential installation and domain-uniqueness rules.
2. **Sealed Domain Protection**: Sealed domains (`sealedDomains`) are locked at the workbench and display their factory assembly description (e.g., `CONTACT [SEALED]: Monomolecular Turbine Edge`). A pilot can never strip or overwrite a relic's signature sealed part.
3. **Semantic Naming for Modified `Magitech` Relics**: When a pilot installs components into exposed mounts on a `Magitech` relic (`1–3` open slots), it follows the manufacturer model-code naming rule: **`<BaseName> Custom`**, appending **`+II`** or **`+III`** when `2` or `3` component slots are populated (e.g., `N-55 Gladius Custom +III`, `S-2 Turbine Khopesh Custom`).

---

## 3. Specialist Stance Purist Relics (27 Relics Covering All 22 Stances)

### 3.1 Fighter Umbrella (`Warrior` & `Guardian` · 10 Stances · 13 Relics)

| Stance (`Tier`) | Code & Relic Name | Functional Class | Damage / WT | Slots (`Open Domains`) | Action 1 Signature, Purist Resonance & Flavor Epithet |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Spear & Buckler** (`I`) | **S-3 Viper Partisan** | `Short Spear` | `Pierce` (`6 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: Serrated viper spearhead.<br>**Action 1**: High-cadence 4-step darting thrust chain.<br>**Resonance (*Darting Viper*)**: Stepping backward after a thrust grants `+12%` next-thrust speed. |
| **Spear & Buckler** (`I`) | **TI-110 Aegis Buckler** | `Buckler` | `Impact` (`7 WT`) | **`1`** (`DELIVERY`) | **Sealed `CONTACT` / `REGULATION`**: Kinetic-boss hard-light buckler.<br>**Action 1**: Concussive boss jab (`+15%` Impulse $J$).<br>**Flavor**: *"Field-designated **the Aegis Charge Buckler** by Vanguard instructors."* |
| **Limitanei** (`II`) | **N-60 Limitanei Spatha** | `Spatha` | `Pierce` (`9 WT`) | **`3`** (`CONTACT`, `DELIVERY`, `REGULATION`) | **Reference Platform**: Frontier service sword with balanced mil-spec tang.<br>**Action 1**: Clean 4-step cut-and-thrust chain.<br>**Resonance (*Plumbata & Spatha*)**: Throwing a `Plumbata` empowers the next melee swing (`+15%` `BCU`). |
| **Limitanei** (`II`) | **N-12 Plumbata Pod** | `Plumbata` | `Pierce` (`6 WT`) | **`2`** (`CONTACT`, `REGULATION`) | **Sealed `DELIVERY`**: Dorsal spring-ejection rail.<br>**Action 1**: Lobs weighted kinetic darts in high arcs over shield walls. |
| **Yeoman Longbow** (`II`) | **M-450 Arbalest Greatbow** | `Great Bow` | `Impact` (`19 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: High-poundage shock-rail war limbs (`+6` `THR` pierce at full draw).<br>**Resonance (*Agincourt Stake-Line*)**: Stationary draws ($\mu = 0$) vent `-3` Reactor Heat. |
| **Yeoman Longbow** (`II`) | **M-10 Bodkin Quiver** | `Quiver` | `Pierce` (`6 WT`) | **`2`** (`CONTACT`, `REGULATION`) | **Sealed `DELIVERY`**: Automated magnetic fletching feed.<br>**Action 1**: Accelerates bow nock/draw cycle tempo by `+10%`. |
| **Repeating Arbalest** (`II`) | **N-55 Gladius** | `Bolt Caster` | `Impact` (`11 WT`) | **`3`** (`CONTACT`, `DELIVERY`, `REGULATION`) | **Reference Platform**: Warrior `BCU = 54` reference bolter.<br>**Action 1**: 3-round stabilized kinetic burst salvo.<br>**Resonance (*Chu-Ko-Nu Volley*)**: Firing from a dorsal carrier vents heat on the next bolt burst. |
| **Repeating Arbalest** (`II`) | **N-20 Rotary Bandolier** | `Bandolier` | `Impact` (`7 WT`) | **`2`** (`CONTACT`, `REGULATION`) | **Sealed `DELIVERY`**: Motorized chest-to-back belt feed.<br>**Action 1**: Eliminates burst-fire recoil drift during sustained volleys. |
| **Legionary** (`II`) | **N-75 Praetorian Spatha** | `Spatha` | `Pierce` (`9 WT`) | **`3`** (`CONTACT`, `DELIVERY`, `REGULATION`) | **Reference Platform**: Heavy legionary short-arc stabbing sword.<br>**Action 1**: Linear thrust combo (`+4` Armor `THR` pierce).<br>**Resonance (*Pilum & Scutum*)**: Striking from behind active guard grants `+4` Stability ($S$). |
| **Legionary** (`II`) | **TI-400 Aegis Scutum** | `Scutum` | `Impact` (`18 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: Curved hard-light reinforced legionary wall.<br>**Action 1**: Heavy forward shield-punch (`+25%` Impulse $J$). |
| **Spear & Shield** (`II`) | **LS-900 Swordspear** | `Broad Spear` | `Wave` (`12 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: Mana-channeling broad leaf-blade.<br>**Action 1**: Wide horizontal mana-wave cleave arc.<br>**Resonance (*Hoplite Othismos*)**: Forward directional charge ($\mu$) widens cleave arc by `+20%`. |
| **Knightly Bastard** (`II`) | **HL-110 Dawnblade** | `Bastard Sword` | `Pierce` (`12 WT`) | **`3`** (`CONTACT`, `DELIVERY`, `REGULATION`) | **Reference Platform**: Versatile 1H/2H Dawnforge knightly blade.<br>**Action 1**: 2H swings emit radiant edge trails.<br>**Resonance (*Fiore Posta di Donna*)**: Toggling 1H/2H grip vents `-5` Reactor Heat. |
| **Knightly Bastard** (`II`) | **TI-350 Radiant Corona** | `Corona` | `Beam` (`11 WT`) | **`1`** (`DELIVERY`) | **Sealed `CONTACT` / `REGULATION`**: Solar-flare projection ring.<br>**Action 1**: Scorches melee attackers on guard contact. |
| **Odachi** (`III`) | **S-9 Turbine Odachi** | `Odachi` (`2H`) | `Pierce` (`16 WT`) | **`1`** (`REGULATION`) | **Sealed `CONTACT` / `DELIVERY`**: Turbine-vented great blade and two-handed tsuka.<br>**Action 1**: 3-step wide draw-cut sweep.<br>**Resonance (*Nodachi Battojutsu*)**: Step 1 lunge distance increased by `+25%`. |
| **Phalanx** (`III`) | **HL-310 Sarissa Pike** | `Pike` | `Pierce` (`18 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: Long-reach phalanx spearhead (1H-eligible with `Phalanx Specialist`).<br>**Resonance (*Syntagma Sarissa*)**: Halts enemy forward charge ($\mu$) on hit. |
| **Cataphract** (`III`) | **HL-220 Lightburst Lance** | `Lance` | `Beam` (`18 WT`) | **`1`** (`REGULATION`) | **Sealed `CONTACT` / `DELIVERY`**: Reactor-linked lance head and vamplate.<br>**Action 1**: Focused light discharge on thrust impact.<br>**Resonance (*Contus Clibanarii*)**: High-speed glide hits convert excess impulse into grounded knockdown. |

---

### 3.2 Rogue Umbrella (`Rogue` & `Marauder` · 9 Stances · 10 Relics)

| Stance (`Tier`) | Code & Relic Name | Functional Class | Damage / WT | Slots (`Open Domains`) | Action 1 Signature, Purist Resonance & Flavor Epithet |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Sword & Buckler** (`I`) | **S-6 Phantom Messer** | `Messer` | `Pierce` (`5 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: Thermal-coated low-emission stealth blade.<br>**Action 1**: Silent 4-step slash chain.<br>**Resonance (*I.33 Ward & Bind*)**: Parries mask thermal signature for `1.5s`. |
| **Sword & Buckler** (`I`) | **VX-10 Eclipse Disc** | `Disc` | `Wave` (`6 WT`) | **`0`** *(Sealed Monolith)* | **Hermetically Sealed**: Revolving hard-light forearm disc (`1G` only).<br>**Action 1**: Centrifugal wave deflection against grazing fire. |
| **Boarder** (`I`) | **S-2 Turbine Khopesh** | `Khopesh` | `Pierce` (`7 WT`) | **`1`** (`REGULATION`) | **Sealed `CONTACT` / `DELIVERY`**: Motorized sickle-sword and hooked grip.<br>**Action 1**: Shield-hooking sweep that strips guard stability.<br>**Resonance (*Brace & Cutlass*)**: Off-hand caster shots reload `+15%` faster after a melee hit. |
| **Boarder** (`I`) | **SV-12 Viper** | `Bolt Caster` | `Pierce` (`6 WT`) | **`2`** (`CONTACT`, `REGULATION`) | **Sealed `DELIVERY`**: High-cyclic micro-bolt receiver.<br>**Action 1**: Rapid close-quarters machine-pistol burst (`2×` salvo). |
| **Daisho** (`II`) | **S-8 Ghost Katana** | `Katana` | `Pierce` (`9 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: Master-folded eastern draw-cut blade.<br>**Action 1**: Precision 4-step curved combo.<br>**Resonance (*Niten Ichi-Ryu*)**: Paired off-hand slashes ignore `+3` Armor `THR`. |
| **Daisho** (`II`) | **S-4 Whisper Wakizashi** | `Wakizashi` | `Pierce` (`5 WT`) | **`0`** *(Sealed Monolith)* | **Hermetically Sealed**: Single-piece monomolecular companion blade (`1G` only).<br>**Action 1**: Rapid close-quarters counter-cuts. |
| **Rapier & Dagger** (`II`) | **SV-22 Stiletto Spatha** | `Spatha` | `Pierce` (`8 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: Needle-tapered linear thrusting blade (`+5` `THR` pierce).<br>**Resonance (*Destreza & Main-Gauche*)**: Backstab/flank thrusts vent `-3` Reactor Heat. |
| **Rapier & Dagger** (`II`) | **S-5 Whisper Cinquedea** | `Cinquedea` | `Pierce` (`5 WT`) | **`0`** *(Sealed Monolith)* | **Hermetically Sealed**: Broad five-finger monomolecular parrying dagger (`1G` only).<br>**Action 1**: Widens off-hand deflection timing. |
| **Mounted Archer** (`II`) | **M-300 Cantabrian Recurve** | `Recurve Bow` | `Pierce` (`8 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: Outward-curved mobile reflex limbs (`-18%` draw time while gliding).<br>**Resonance (*Parthian Cantabrian*)**: Moving shots suffer zero accuracy penalty. |
| **Mounted Archer** (`II`) | **VX-15 Ghost Yebira** | `Yebira` | `Pierce` (`6 WT`) | **`2`** (`CONTACT`, `REGULATION`) | **Sealed `DELIVERY`**: Open-face low-emission magnetic draw rack.<br>**Action 1**: Arrow trails leave minimal visual signature. |
| **Shield-Breaker** (`II`) | **B-40 Ripper Falx** | `Falx` (`2H`) | `Pierce` (`15 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: Forward-curving hook-blade (`+25%` Layer 2 Armor `DUR` shred).<br>**Resonance (*Thracian Rhomphaia*)**: Strikes against guarding targets deal `+20%` chip damage. |
| **Viking Raider** (`II`) | **B-55 Skjaldborg Axe** | `Battle Axe` | `Impact` (`17 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: Integrated energy-vented broad-axe head.<br>**Resonance (*Huscarl Skjaldborg*)**: Guard breaks vent `-5` Reactor Heat.<br>**Flavor**: *"Known across the borderlands as **the Siegebreaker**."* |
| **Zweihander** (`III`) | **B-80 Doppelsöldner Greatsword** | `Zweihander` (`2H`) | `Impact` (`18 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: Heavy shock-wave greatsword blade (`+25%` Impulse $J$).<br>**Resonance (*Landsknecht Doppelsöldner*)**: Hitting `2+` targets vents `-4` Reactor Heat. |
| **Siege Battery** (`III`) | **M-350 Mauler** | `Blast Caster` | `Blast` (`14 WT`) | **`2`** (`CONTACT`, `REGULATION`) | **Sealed `DELIVERY`**: Three-round rotary grenade chamber.<br>**Resonance (*Bombardier Fire-Mission*)**: Direct hits paint targets for `+15%` dorsal rocket lock speed. |
| **Siege Battery** (`III`) | **LN-1200 Avalanche** / **LG-950 Tomahawk** | `Rack` | `Blast` (`19` / `18 WT`) | **`2`** (`CONTACT`, `REGULATION`) | **Sealed `DELIVERY`**: Automated dorsal salvo feed rails.<br>**Action 1**: `LN-1200` unguided rocket saturation; `LG-950` soft-lock multi-missile salvo. |

---

### 3.3 Scholar Umbrella (`Wizard` & `Cleric` · 3 Stances · 4 Relics)

| Stance (`Tier`) | Code & Relic Name | Functional Class | Damage / WT | Slots (`Open Domains`) | Action 1 Signature, Purist Resonance & Flavor Epithet |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Spellblade** (`II`) | **WZ-310 Aether Spatha** | `Spatha` | `Pierce` (`8 WT`) | **`2`** (`DELIVERY`, `REGULATION`) | **Sealed `CONTACT`**: Conduit-channeled blade whose 3rd combo step releases a short `Pulse` arc.<br>**Resonance (*Aether-Conduit Edge*)**: Off-hand caster hits charge the blade for `+15%` `BCU`. |
| **Spellblade** (`II`) | **WZ-450 Sparkstrike** | `Arc Caster` | `Pulse` (`10 WT`) | **`2`** (`CONTACT`, `REGULATION`) | **Sealed `DELIVERY`**: Rapid-cycling arc induction coil.<br>**Action 1**: Close-range chaining arc carbine. |
| **Spellblade** (`II`) | **ARC Conductor** | `Arc Caster` | `Pulse` (`5 WT`) | **`0`** *(Sealed Monolith)* | **Hermetically Sealed**: Ultralight `5 WT` emergency arc-wand sidearm (`1G` only). |
| **Scepter & Ward** (`II`) | **CL-210 Sanctum Mace** | `Mace` | `Wave` (`11 WT`) | **`1`** (`DELIVERY`) | **Sealed `CONTACT` / `REGULATION`**: Consecrated emitter crown and relic core.<br>**Action 1**: Melee sweeps pulse minor shield restoration on finisher.<br>**Flavor**: *"Pilots revere **this hallowed scepter** of the border cathedrals."* |
| **Scepter & Ward** (`II`) | **CL-150 Ward Mote** | `Mote` | `Pulse` (`6 WT`) | **`0`** *(Sealed Monolith)* | **Hermetically Sealed**: Orbiting harmonic micro-shields (`1G` only) intercepting dispersed spell fire. |
| **Archmage Staff** (`III`) | **WZ-200 Manacore Staff** | `Partisan` | `Wave` (`14 WT`) | **`1`** (`REGULATION`) | **Sealed `CONTACT` / `DELIVERY`**: Mana-discharge polearm head and crystal conduit shaft.<br>**Resonance (*Astral Fulcrum*)**: Stationary casting ($\mu = 0$) widens wave radius by `+20%`. |
| **Archmage Staff** (`III`) | **WZ-650 Prism Lance** | `Beam Caster` | `Beam` (`12 WT`) | **`0`** *(Sealed Monolith)* | **Hermetically Sealed**: Monolithic focusing-crystal barrel (`1G` only) with variable beam intensity. |

---

## 4. Core-Chain Apex Relics (5 Non-Stance Purist Weapons)

These **5 retained `Magitech` relics** serve pilots who invest deeply into **non-stance Core Feat Chains** (`C-03`, `C-04`, `C-10`, `C-14`, `C-18`):

| Core Chain Focus | Code & Relic Name | Functional Class | Damage / WT | Slots (`Open Domains`) | Action 1 Signature, Core-Chain Resonance & Flavor Epithet |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **`C-03` Stealth Sniper** (`Phantom Sniper`) | **SR-440 Shadowfang** | `Bolt Caster` | `Pierce` (`11 WT`) | **`2`** (`CONTACT`, `REGULATION`) | **Sealed `DELIVERY`**: Suppressed electromagnetic accelerator rail.<br>**Action 1**: High-velocity marksman bolt (`+6` `THR` pierce).<br>**Resonance**: Breaking stealth with a stationary shot ($\mu = 0$) adds `+20%` weak-point damage. |
| **`C-04` Beam Artillery** (`Arcane Annihilation`) | **WZ-800 Arclight Cannon** | `Beam Caster` | `Beam` (`19 WT`) | **`1`** (`REGULATION`) | **Sealed `CONTACT` / `DELIVERY`**: Heavy thermal focusing array and capacitor bank.<br>**Action 1**: Sustained thermal beam (`+20%` Armor `DUR` scour).<br>**Resonance**: While `Anchored Focus` is active, beam heat buildup is reduced by `-15%`. |
| **`C-10` Suppression** (`Avalanche Surge`) | **B-25 Brushcutter** | `Bolt Caster` | `Pierce` (`20 WT`) | **`2`** (`CONTACT`, `REGULATION`) | **Sealed `DELIVERY`**: Twin-rotor rotary gun receiver.<br>**Action 1**: High-volume suppression streams.<br>**Resonance**: Applies `2×` suppression stacks against targets behind cover or shields. |
| **`C-14` Vanguard Ward** (`Radiant Convergence`) | **RS-450 Radiant Projector** | `Beam Caster` | `Beam` (`12 WT`) | **`2`** (`CONTACT`, `REGULATION`) | **Sealed `DELIVERY`**: Harmonic prism oscillator.<br>**Action 1**: Mid-range beam emitter reinforcing Layer 1 Shields on hit.<br>**Resonance**: Firing from inside a `Radiant Sphere` widens beam thickness. |
| **`C-18` Harmonic Triage** (`Mass Restoration`) | **CL-500 Absolution** | `Beam Caster` | `Beam` (`13 WT`) | **`1`** (`REGULATION`) | **Sealed `CONTACT` / `DELIVERY`**: Consecrated purification crystal emitter.<br>**Action 1**: Damages enemies and restores ally/self shields in its path.<br>**Flavor**: *"Carries the consecrated **Grace Edge** emitter core."* |

---

## 5. TypeScript Data Schema & Sealed-Mount Enforcement

The schema below guarantees compile-time and runtime enforcement of `Magitech` slot budgets (`0..3`), sealed domain protection, and Purist Stance / Core-Chain resonance triggers:

```ts
import type { DamageType, ModDomain, WeaponClass } from './weapon_mod_overhaul';

export type MagitechArchitectureTier =
  | 'SEALED_MONOLITH'      // 0 open component slots + 1G
  | 'SEMI_SEALED_ASSEMBLY' // 1 open component slot  + 1G
  | 'MODULAR_FRAME_RELIC'  // 2 open component slots + 1G
  | 'REFERENCE_PLATFORM';  // 3 open component slots + 1G

export interface PuristResonancePassive {
  triggerType: 'SPECIALIST_STANCE' | 'CORE_FEAT_CHAIN';
  targetId: string; // e.g., 'STANCE_BOARDER' or 'CHAIN_C03_PHANTOM_SNIPER'
  effectSummary: string;
}

export interface MagitechWeaponDefinition {
  id: string;
  code: string;                  // e.g., 'B-55', 'CL-210', 'N-55'
  name: string;                  // e.g., 'B-55 Skjaldborg Axe'
  legacyEpithet?: string;        // e.g., 'the Siegebreaker', 'this hallowed scepter'
  flavorText: string;
  weaponClass: WeaponClass;
  functionalType: string;
  baseDamageType: DamageType;
  weight: number;
  gripMode: '1H' | '2H' | 'VERSATILE' | 'DORSAL_CARRIER';

  // Lore-driven modification budget
  architectureTier: MagitechArchitectureTier;
  openDomains: ModDomain[];      // Length strictly equals 0, 1, 2, or 3
  sealedDomains: Record<ModDomain, string | null>; // Non-null description for sealed domains
  resonanceGemSlots: 1;          // Always 1G Resonance socket

  // Purist identity (never overrides Actions 2, 4, or 5)
  action1Signature: string;
  puristResonance: PuristResonancePassive;
}

/**
 * Runtime validation ensuring a physical component can only be installed into
 * an explicitly exposed domain on a Magitech weapon.
 */
export function canInstallComponentOnMagitech(
  weapon: MagitechWeaponDefinition,
  componentWeaponClass: WeaponClass,
  componentDomain: ModDomain,
  installedDomains: Set<ModDomain>
): { ok: boolean; reason?: string } {
  if (componentWeaponClass !== weapon.weaponClass) {
    return { ok: false, reason: `Requires ${weapon.weaponClass} hardware.` };
  }
  if (!weapon.openDomains.includes(componentDomain)) {
    const sealedLabel = weapon.sealedDomains[componentDomain] ?? 'Factory-Sealed Assembly';
    return { ok: false, reason: `${componentDomain} is sealed (${sealedLabel}).` };
  }
  if (installedDomains.has(componentDomain)) {
    return { ok: false, reason: `${componentDomain} mount is already occupied.` };
  }
  return { ok: true };
}
```