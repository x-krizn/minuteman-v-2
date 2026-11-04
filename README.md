# Project Orion — Pilot's Field Manual & Encyclopedia

*A player's guide to the Shattered Worlds, magitech mech combat, classless frame engineering, and the road through Belldor.*

---

## 📑 Master Index (Table of Contents)

1. **[The Short Version](#1-the-short-version)**
2. **[Controls, HUD & Pilot Satchel Guide](#2-controls-hud--pilot-satchel-guide)**
   - [2.1 Handheld, Keyboard & Gamepad Controls](#21-handheld-keyboard--gamepad-controls)
   - [2.2 Reading the HUD](#22-reading-the-hud)
   - [2.3 The Pilot Satchel (7 Tactical Tabs)](#23-the-pilot-satchel-7-tactical-tabs)
3. **[Combat Mechanics: Three Defense Layers & Inertia Physics](#3-combat-mechanics-three-defense-layers--inertia-physics)**
   - [3.1 The Golden Rules of Combat](#31-the-golden-rules-of-combat)
   - [3.2 The Three Defense Layers (`Shields → Armor → Frame`)](#32-the-three-defense-layers-shields--armor--frame)
   - [3.3 Weight, Momentum & Stability (`Inertia Physics`)](#33-weight-momentum--stability-inertia-physics)
   - [3.4 The Charge Triangle & Ranged Recoil](#34-the-charge-triangle--ranged-recoil)
4. **[Building Your Mech (`Pilot → Frame → Equipment`)](#4-building-your-mech-pilot--frame--equipment)**
   - [4.1 Six Starting Loadout Kits (Classless Architecture)](#41-six-starting-loadout-kits-classless-architecture)
   - [4.2 The Three Layers of a Build](#42-the-three-layers-of-a-build)
   - [4.3 Mech Doll (`LOADOUT`) vs. Modification Workbench (`ARMORY`)](#43-mech-doll-loadout-vs-modification-workbench-armory)
   - [4.4 The Nine Gemstones & Six Combat Disciplines](#44-the-nine-gemstones--six-combat-disciplines)
   - [4.5 Load Weight Brackets & Zero-Sum Trade-Offs](#45-load-weight-brackets--zero-sum-trade-offs)
   - [4.6 Pilot Level 1–20 Unlock Sequence](#46-pilot-level-120-unlock-sequence)
5. **[The Shattered Worlds (`u00`) & Æther Fog Navigation](#5-the-shattered-worlds-u00--æther-fog-navigation)**
   - [5.1 Lore: Waygates, Tuning Crystals & The Pilots](#51-lore-waygates-tuning-crystals--the-pilots)
   - [5.2 The 20 Worlds of the `u00` Cosmos](#52-the-20-worlds-of-the-u00-cosmos)
   - [5.3 Navigating the Æther Fog](#53-navigating-the-æther-fog)
6. **[The Road Through Belldor (Campaign Field Guide)](#6-the-road-through-belldor-campaign-field-guide)**
   - [6.1 Stage 1: The Bog (Levels 1–2)](#61-stage-1-the-bog-levels-12)
   - [6.2 Stage 2: Camelot Border Town (Levels 3–6)](#62-stage-2-camelot-border-town-levels-36)
   - [6.3 The Three Grail Knights & The Dungeon Door](#63-the-three-grail-knights--the-dungeon-door)
   - [6.4 Whispers, Rumors & What Lies Ahead](#64-whispers-rumors--what-lies-ahead)
7. **[Complete Equipment & Hardware Reference](#7-complete-equipment--hardware-reference)**
   - [7.1 All 29 Magitech Weapons](#71-all-29-magitech-weapons)
   - [7.2 Core Frame Platings (6 Coreplates)](#72-core-frame-platings-6-coreplates)
   - [7.3 Core Systems (6 Generators / Reactors)](#73-core-systems-6-generators--reactors)
   - [7.4 Auxiliary & Tactical Utility Systems (18 Modules)](#74-auxiliary--tactical-utility-systems-18-modules)
   - [7.5 Optics & Battlefield Sensors (18 Modules)](#75-optics--battlefield-sensors-18-modules)
   - [7.6 Head, Arm, Leg & Energy Storage Components](#76-head-arm-leg--energy-storage-components)
8. **[Complete Canonical Feats Catalog (97 Feats)](#8-complete-canonical-feats-catalog-97-feats)**
   - [8.1 Tier I Feats](#81-tier-i-feats)
   - [8.2 Tier II Feats](#82-tier-ii-feats)
   - [8.3 Tier III Feats](#83-tier-iii-feats)
   - [8.4 Tier IV Feats](#84-tier-iv-feats)
   - [8.5 Tier V Capstone Feats](#85-tier-v-capstone-feats)
   - [8.6 Reward Feats](#86-reward-feats)

---

## 1. The Short Version

The worlds were once linked by waygates. Then something was taken that should have stayed, and the links began to drift. You are a **Pilot**: a being no world claims, immune to the corrosive æther between worlds, and able to bond with the war machines called **mechs**. Every faction wants you. None of them trust you.

In **Project Orion**, your mech does not walk—it glides across latent magic currents. Numbers on your pilot never inflate with level: a Level 1 mech and a Level 20 mech share the same `200` Frame Integrity and the same Base Combat Unit (`BCU = 54`) damage scale. Progression unlocks **new hardpoint slots, weapons, internal hardware, gemstone modifications, and feat synergies**—expanding *how* you fight rather than making your numbers bigger.

---

## 2. Controls, HUD & Pilot Satchel Guide

### 2.1 Handheld, Keyboard & Gamepad Controls

Project Orion can be played using the on-screen virtual handheld pad, keyboard, hardware gamepad, or mouse/touch inside menus.

| Input | Handheld Pad | Keyboard Key | Tactical Action |
| :--- | :--- | :--- | :--- |
| **Move / Aim** | 8-Way D-Pad / Stick | `WASD` / `Arrow Keys` | 8-directional Magic-Current glide movement and directional facing. |
| **A** | Face Button A | `Z` / `Space` | **Interact / Jump**: Context interaction at Waystations, Waygates, Caches, Switches, and NPCs; vertical jump over pitfalls and hazards when clear. |
| **B** | Face Button B | `X` / `Shift` | **Booster Dash / Continuous Boost**: Tap for a high-impulse directional dash; hold to sustain continuous boost (generates reactor heat). |
| **X** | Face Button X | `C` / `J` | **Action 1 / Action 2**: Tap for primary weapon salvo/combo (`Action 1`); hold for primary weapon special (`Action 2`). Double-tap for tactical reload/vent. |
| **Y** | Face Button Y | `V` / `K` | **Action 3 / Action 4 (Guard)**: Tap for heavy tactical skill (`Action 3`); hold to raise directional guard (`Action 4`, `0.25s` perfect block/parry window). |
| **R** | Right Trigger | `E` / `I` | **Action 5 / Utility (`Action 6`)**: Tap to trigger off-hand, paired, or tactical utility system. |
| **L** | Left Trigger | `Q` / `U` | **Weapon Set Swap / Target Lock**: Tap to cycle target lock (`SELECT` also cycles lock); hold to swap between Weapon Set 1 and Weapon Set 2 (`5.0s` base cooldown). |
| **SELECT / SHIFT** | Pill Button | `Tab` / `Backspace` | **Pilot Satchel**: Opens the 7-tab tactical menu (`[L]` / `[R]` cycles tabs). |
| **START** | Pill Button | `Enter` | **System Menu**: Opens Pause Menu, HUD mode toggle (Overlay vs. Pixel Canvas), Pilot Roster Save/Load, and Options. |

---

### 2.2 Reading the HUD

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [SHIELD BAR] ████████░░  (Layer 1: Regenerating Energy Barrier)         │
│ [ARMOR BAR]  ███████░░░  (Layer 2: Physical Mitigation & Durability)    │
│ [FRAME HP]   ██████████  (Layer 3: 200 Fixed Structural Integrity)      │
│ [REACTOR]    ▓▓▓▓░░░░░░  (Heat / Energy / Presence Commit Gauge)        │
├─────────────────────────────────────────────────────────────────────────┤
│ • Top-Right / Edge Indicators : Æther Fog Depth & Wayfinding Tells      │
│ • Bottom Skill Deck           : Active [X] [Y] [R] [L] [B] Cooldowns    │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Minimal Clutter by Design**: Hidden physics numbers (like exact Inertia and Stability values) are never shown on the default HUD so you can keep your eyes on enemy telegraphs and terrain hazards.
- **Optional Telemetry Mod**: Installing the **Inertial Gyro-Telemetry Array** into your **Sensory B** slot inside the Armory enables live physics readouts directly on your HUD.

---

### 2.3 The Pilot Satchel (7 Tactical Tabs)

Press **SELECT / SHIFT** (`Tab` / `Backspace`) at any time to open the Pilot Satchel. Use **`[L]`** and **`[R]`** (or click/tap the header tabs) to cycle across all seven modules:

| Tab | Name | Purpose |
| :---: | :--- | :--- |
| **1** | **MECH STATUS** | Full diagnostic readout of your 3 Defense Layers, Load Weight Bracket (`Light / Medium / Heavy / Overloaded`), Reactor thermal output, and Inertia/Stability physics breakdown. |
| **2** | **LOADOUT** | Interactive **Mech Doll** surrounded by anatomical hardpoint nodes (`Head Dome`, `Frame Plating`, `Arm Assembly`, `Leg Striders`, `Main Hand`, `Side Hand`, `Aux Back Mount`, and `[L]`/`[R]` Trigger Binds) with a 4-action context menu (`Equip / Swap`, `Unequip`, `Stance / Grip Toggle`, `Modify in Armory`). |
| **3** | **ARMORY** | The **Modification Workbench**. Install, swap, or remove Weapon Component Parts, Internal Sub-Modules (`Optics`, `Sensory A/B`, `Actuators`, `Reactor Core`, `Leg Actuators`), Gem Sockets, and Action Modifications in any slot order (`Slot 1`, `Slot 2`, `Slot 3`). |
| **4** | **INVENTORY** | Manage your Belt Flasks, Booster Kits, Gemstones, Scrap currency, and Quest Relics. |
| **5** | **SKILLS & FEATS** | Invest Gemstones into the **6 Combat Disciplines** (`Lv 1–20`) and socket or refund **97 Canonical Feats** (`Tiers I–V`) at zero penalty. |
| **6** | **WORLD MAP** | View local area topology and toggle the **Living Æther Cosmos (`u00`)** showing the 20 worlds orbiting the chthonic singularity **Sin**. |
| **7** | **CODEX** | Discovery-gated field encyclopedia. Lore, schematics, and combat profiles unlock automatically as you encounter new worlds, areas, enemies, weapons, hardware, and relics. |

[↑ Back to Master Index](#-master-index-table-of-contents)

---

## 3. Combat Mechanics: Three Defense Layers & Inertia Physics

### 3.1 The Golden Rules of Combat

1. **Unified Rules**: PvE and PvP share the exact same combat math, cooldowns, and crowd-control durations.
2. **Every Skill Has a Tell**: Every heavy attack, boss lunge, and artillery volley has a visible windup telegraph and audio cue before impact.
3. **Static Core Budget**: Every mech has **`200` Frame Integrity** and scales around the **Base Combat Unit (`1× BCU = 54`)**. Survival comes from managing your defense layers, positioning, and momentum.

---

### 3.2 The Three Defense Layers (`Shields → Armor → Frame`)

Incoming damage cascades sequentially through three distinct defensive layers:

```
   INCOMING HIT
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│ LAYER 1: SHIELDS (Energy Barrier)                                 │
│ • Absorbs damage first; regenerates automatically out of combat   │
│   or via Guardian/Cleric shield skills and reactor overflow.      │
└───────┬───────────────────────────────────────────────────────────┘
        │ (Overflow when Shields are depleted or bypassed)
        ▼
┌───────────────────────────────────────────────────────────────────┐
│ LAYER 2: ARMOR (Physical Plating & Shields)                       │
│ • Governed by three values:                                       │
│   - Threshold (THR) : Flat damage ignored from light grazing hits │
│   - Rating (RTG)    : Percentage mitigation applied to the hit    │
│   - Durability (DUR): Degrades as armor absorbs strikes & acid    │
│ • Repaired at Æther Waystations, Drop-Pods, or via Repair Systems.│
└───────┬───────────────────────────────────────────────────────────┘
        │ (Penetrating damage after Armor mitigation)
        ▼
┌───────────────────────────────────────────────────────────────────┐
│ LAYER 3: FRAME INTEGRITY (Fixed 200 HP)                           │
│ • Core structural health of your mech.                            │
│ • Reaching 0 Frame Integrity results in chassis destruction.      │
└───────────────────────────────────────────────────────────────────┘
```

> [!WARNING]
> **Corrosive Bog Water**: Standing in bog water (`~`) corrodes **Layer 2 Armor Durability** over time on *both* you and your enemies. Lure heavily armored threats into the mire to strip their plating—or stay on dry ruins brick (`:`) to protect your own.

---

### 3.3 Weight, Momentum & Stability (`Inertia Physics`)

Project Orion does not use an arbitrary "poise bar." Instead, hit reactions (`none`, `flinch`, `stagger`, `knockback`) are governed by **Weight vs. Weight** and **Stability (`S`)**:

| Property | What Controls It | How It Feels in Combat |
| :--- | :--- | :--- |
| **Weight (`m`)** | Frame Plating + Equipped Weapons & Hardware | Controls **displacement** (`Δv = J / m_eff`)—how far an impact or recoil pushes your mech across the floor. |
| **Directional Charge (`μ`)** | Gliding *into* the direction of an incoming hit | Increases your effective weight (`m_eff = m × (1 + μ)`). Charging head-on into an attack makes you much harder to push back. Moving sideways or retreating gives `μ = 0`. |
| **Stability (`S`)** | Frame Plating + Leg Stabilizers + Hardware + Feats | Controls your **shrug-off deadband** (ignoring small hits completely) and **recovery speed** (how quickly your mech regains control after being staggered or knocked back). |
| **Melee Impulse (`J_melee`)** | Attack Weight + Attacker Frame Weight × Charge (`μ`) × Speed | A heavy mech charging forward puts its own body mass behind a melee swing. |
| **Ranged Impulse (`J_ranged`)** | Projectile Weight × Projectile Speed *(only)* | A bullet or rocket pushes based purely on the ordnance itself—never the shooter's frame weight. |

---

### 3.4 The Charge Triangle & Ranged Recoil

You never need to read equations to master inertia—just remember the **Dynamic Rock-Paper-Scissors Triangle**:

```
                  ┌─────────────────────────────┐
                  │       CHARGING HEAVY        │
                  │ (High m_eff & Stability S)  │
                  │ Shrugs off light/medium fire│
                  └──────────────┬──────────────┘
                                 │
              Beats              │              Loses to
         (Closes distance)       │         (Overcomes charge)
                                 ▼
      ┌─────────────────────────────┐         ┌─────────────────────────────┐
      │     EVASION / SIDESTEP      │◄────────┤        BIG SLOW HIT         │
      │ (Drops off-axis charge μ=0) │  Beats  │  (High Impulse J telegraph) │
      │ Dodges readable windup tells│         │ Breaks through heavy charges│
      └─────────────────────────────┘         └─────────────────────────────┘
```

- **Ranged Recoil**: Firing heavy ballistic or blast weapons applies backward recoil impulse against your own frame weight and Stability (`S`). Heavier, more stable frames absorb recoil inside their deadband and suffer far less movement restriction while firing on the move.

[↑ Back to Master Index](#-master-index-table-of-contents)

---

## 4. Building Your Mech (`Pilot → Frame → Equipment`)

### 4.1 Six Starting Loadout Kits (Classless Architecture)

**Project Orion has no player-facing classes.** When you start a New Game, you choose one of six pre-configured **Starting Loadout Kits** so you enter the Bog with a coherent frame, reactor, weapon set, and two pre-socketed Tier I feats. None of these kits locks you in—any pilot can equip any weapon, coreplate, module, or feat as soon as they meet its hardware and gemstone requirements.

| Starting Kit | Frame Model | Reactor | Starting Load Bracket | Lv.6 Tactical Utility (`Action 6`) | Starting Feats (`Tier I`) & Combat Identity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bastion Striker** | `PNSY W416` | Ichor | Medium (`55%`, `76/138 WT`) | PNSY D-0g Repair Drone | `Booster Evasion` + `Momentum Guard` · Aggressive frontline striker; runs hot. |
| **Fortress Siege** | `RAD HAU` | Ichor | Heavy (`81%`, `150/186 WT`) | RAD R463 Fathomless System | `Siege Stability` + `Anchored Action` · Heavy siege artillery; extreme stability. |
| **Dawnforge Guardian** | `Trinity DE-14` | Mana | Medium (`59%`, `83/140 WT`) | TI Lightwell Recovery System | `Shield Charge` + `Stabilizer Pulse` · Defensive vanguard; shields & radiant cleave. |
| **Phantom Recon** | `VX Phantom` | Ether | Light (`29%`, `39/136 WT`) | VX Smoke Dispersal System | `Shadow Step` + `Phantom Strike` · Ultralight stealth striker; ambush & burst. |
| **Arclight Artillery** | `ARC Arclight` | Ether | Medium (`54%`, `75/140 WT`) | ARC Rift Anchor | `Beam Focus` + `Radiant Overflow` · Long-range energy artillery; sustained beams. |
| **Sanctum Support** | `SANC Sanctum` | Mana | Medium (`54%`, `76/140 WT`) | SANC Radiant Ward Projector | `Reactive Healing` + `Empowered Blessing` · Support anchor; barrier & ally triage. |

---

### 4.2 The Three Layers of a Build

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. PILOT LAYER (6 Combat Disciplines · Levels 1–20)                     │
│    • Invest Gemstones into Warrior, Marauder, Guardian, Rogue, Wizard,  │
│      or Cleric disciplines to unlock Feat Tiers (I–V).                  │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. FRAME LAYER (97 Canonical Feats · Tiers I–V)                         │
│    • System Feats step up Load Capacity (+22 WT per step).              │
│    • Interface Feats alter combat behavior & weapon/hardware synergies. │
│    • Feats can be unsocketed and refunded at any time.                  │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. EQUIPMENT LAYER (LOADOUT Mech Doll & ARMORY Workbench)               │
│    • Exterior Plating & Shields -> Layer 2 Armor (DUR / RTG / THR).     │
│    • Internal Sub-Modules       -> Optics, Sensors, Actuators, Reactor. │
│    • Weapons & Auxiliaries      -> 5-Action Movesets & Utility Skills.  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Mech Doll (`LOADOUT`) vs. Modification Workbench (`ARMORY`)

- **`LOADOUT` (`Mech Doll`)**: Organizes your equipped weapons and hardware around an anatomical diagram of your chassis (`Head Dome`, `Frame Plating`, `Arm Assembly`, `Leg Striders`, `Main Hand`, `Side Hand`, `Auxiliary Back Mount`, and `[L]`/`[R]` Trigger Binds). Select any slot to **Equip / Swap**, **Unequip**, **Toggle Grip / Stance** (1H, 2H, Dual-Wield), or jump directly to **Modify in Armory**.
- **`ARMORY` (`Modification Workbench`)**: Houses all deep engineering:
  - **Non-Sequential Slot Order**: Install, replace, or strip modifications in **any slot order** (`Slot 1`, `Slot 2`, or `Slot 3`).
  - **Physical Domain Separation**: Only exterior armor (**Dome Plates**, **Aperture Plates**, **Frame Platings**) and **Shields** grant Armor (`Durability`, `Rating`, `Threshold`). Internal sub-modules (`Optics`, `Sensory A/B`, `Actuators`, `Reactor Core`, `Leg Actuators`) grant `0` Armor and instead tune vision radius, accuracy, tell duration, attack mass, stability, heat venting, cooldowns, mobility, and weight capacity.
  - **Crafted vs. Looted Mod Parts**: Mod parts crafted from Gemstones have at most `1` additional gem socket (`maxGemSlots: 1`), whereas standalone parts looted in the field can roll `1–3` gem sockets.
  - **Semantic `Custom` Naming**: Modified gear automatically earns a `Custom` designation—**`Custom <BaseName>`** for traditional weapons/shields (e.g., `Custom Heater Shield`) or **`<BaseName> Custom`** for manufacturer model codes (e.g., `N-55 Gladius Custom`, `BWI Bastion Frame Plating Custom`), appending **`+II`** or **`+III`** when 2 or 3 modification slots are populated.

---

### 4.4 The Nine Gemstones & Six Combat Disciplines

Gemstones are a single unified resource with **three uses**:
1. **Skill Investment** (permanently spent to raise your 6 Combat Disciplines and unlock Feat Tiers I–V).
2. **Feat Socketing** (placed into Feat Nodes to activate them; **100% refunded** back to your inventory whenever you unsocket a feat).
3. **Armory Modifications** (spent to craft equipment mods or socketed directly into weapons and hardware—adapting their stat bonus to the physical domain of that slot and tinting your weapon VFX).

| Gemstone | Color | Assignment / Domain | Reactor Affinity | Funds Combat Disciplines |
| :--- | :--- | :--- | :--- | :--- |
| **Moonstone** | White | Mana Reactor Core · Precision, shields & barrier harmonics | Mana Core | `Guardian`, `Cleric` |
| **Spinel** | Red | Assault Ballistics & Turbine · Frontline kinetic output | Ichor (Heat) | `Warrior` |
| **Carnelian** | Orange | Heavy Ordnance & Siege · Blast ordnance & aggression | Ichor (Heat) | `Marauder` |
| **Titanite** | Yellow | Aegis Barrier & Vanguard · Shields, cleave & anchoring | Mana (Presence) | `Guardian` |
| **Demantoid** | Green | Harmonic Support & Restoration · Triage & heat venting | Mana (Energy) | `Cleric` |
| **Kyanite** | Blue | Beam & Wave Artillery · Sustained beams & prism focus | Ether (Energy) | `Wizard` |
| **Charoite** | Purple | Recon, Stealth & CQC · Low-emission cloak & burst | Ether (Energy) | `Rogue` |
| **Rubellite** | Magenta | Ether Reactor Core · High-capacity projectors & stealth cores | Ether Core | `Rogue`, `Wizard` |
| **Hematite** | Black | Ichor Reactor Core · Turbine & kinetic-recycling cores | Ichor Core | `Warrior`, `Marauder` |

> [!NOTE]
> **Funding a Combat Discipline**: Each of the six disciplines accepts either its **Discipline Gem** or its paired **Reactor Core Gem** (for example, `Warrior` can be leveled with **Spinel** or **Hematite**; `Guardian` with **Titanite** or **Moonstone**).

---

### 4.5 Load Weight Brackets & Zero-Sum Trade-Offs

Every positive modification in Project Orion obeys the **Zero-Sum Trade-Off Law**: gaining raw power, stability, or armor always adds weight (`WT`) or draws from another stat. Your total equipped weight divided by your frame's Load Capacity determines your **Load Bracket**:

| Load Bracket | Capacity Ratio | Mobility Modifier | Reactor Heat | Weapon Swap Time | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Light** | `0% – 30%` | **`+8%` Speed** | **`-10%` Heat** | **`-10%` Swap Time** | Ideal for stealth & ambush (*Phantom Recon starts at `29%`*). |
| **Medium** | `31% – 65%` | `1.0×` Baseline | `1.0×` Baseline | `1.0×` Baseline | Balanced combat posture (*Bastion, Dawnforge, Arclight, Sanctum*). |
| **Heavy** | `66% – 100%` | `-10%` Speed | `+12%` Heat | `+18%` Swap Time | High physical mass & recoil absorption (*Fortress Siege starts at `81%`*). |
| **Overloaded** | `> 100%` | **`-35%` Speed** | **`+35%` Heat** | **`+45%` Swap Time** | **Stealth broken**; severe handling penalty. Socket **System Feats** (`+22 WT` each) or leg actuators to raise capacity. |

---

### 4.6 Pilot Level 1–20 Unlock Sequence

During **Levels 1–5** (the Belldor onboarding road), your mech brings its subsystems online step by step as you survive real combat situations:

| Level | Band | Milestone Event | Subsystem Unlocks | Tactical Focus |
| :---: | :--- | :--- | :--- | :--- |
| **1** | Lesson | Enter The Bog | Weapon Set 1 (`Action 1`), Basic Dash `[B]`, Belt Slots 1–2, Frame Plating | Glide movement, dash timing & primary combo chain |
| **2** | Lesson | Poe / Fallen Scout | Weapon Set 1 (`Action 2`), Weapon Set 2 (`Action 1`), Weapon Swap `[L]`, Legs Slot, Belt Slots 3–4 | Weapon switching, leg striders & expanded belt |
| **3** | Lesson | Enter Border Town | Weapon Set 1 (`Actions 3–5`), Weapon Set 2 (`Action 2`), Head Slot | Full primary weapon moveset, directional guard & optics |
| **4** | Lesson | Border Town Midpoint | Reactor / Generator Slot, Weapon Set 2 (`Actions 3–5`), Aux Slots 1–2 | Reactor heat/energy management & full secondary weapon set |
| **5** | Lesson | Border Town Benchmark | Arms Slot, Aux Slots 3–4 *(All 4 armor & 4 aux slots online)* | Full chassis hardware & auxiliary depth |
| **6** | Challenge | Border Town Complete | **Tactical Utility Slot (`Action 6`)** + **Gem Skill Progression Unlocks** | Self-sustain utility & Gemstone → Discipline → Feat loop |
| **7** | Challenge | Post-Belldor Calibration | Feat Tier I calibration (`System` & `Interface` Feat Nodes) | Socketing Discipline + Reactor Gems into Tier I Feats |
| **8** | Challenge | Armory Calibration I | Action Modification Slot 1 | Crafting & slotting zero-sum equipment behavior mods |
| **9** | Challenge | Skill Threshold (`Lv 5`) | **Feat Tier II** access via Combat Discipline `Lv 5` | Load capacity step-up (`+22 WT`) vs. interface synergies |
| **10** | Challenge | Armory Calibration II | Action Modification Slot 2 & Auxiliary synergy | Multi-layer defense & auxiliary timing |
| **11** | Challenge | Presence Calibration | Presence Force-Reaction Field calibration | Threat priority & reaction pressure |
| **12** | Challenge | Skill Threshold (`Lv 9`) | **Feat Tier III** access via Combat Discipline `Lv 9` | Mid-tier frame specialization & parry/cleave counters |
| **13** | Expression | Grip Mastery | Dual-Wield & Two-Handed Weapon Set 1–2 mastery | Mainhand (`Actions 1–2`) & Offhand (`Action 5`) expression |
| **14** | Expression | Skill Threshold (`Lv 14`) | **Feat Tier IV** access via Combat Discipline `Lv 14` | High-commitment frame configurations |
| **15** | Expression | Armory Calibration III | Action Modification Slot 3 & Reactor Overdrive tuning | High-heat commit mastery |
| **16** | Expression | Heavy Clearance | Superheavy Load Capacity threshold via System Feats | Mounting heavy ordnance on lighter frames without penalty |
| **17** | Expression | Core Resonance | Reactor Identity resonance (`Ichor` / `Mana` / `Ether`) | Core sustain & shield/armor harmony |
| **18** | Expression | Skill Threshold (`Lv 18`) | **Feat Tier V** access via Combat Discipline `Lv 18` | Capstone System & Interface Feat Nodes |
| **19** | Expression | Full Synthesis | Full Action Modification & 13-Slot Loadout synthesis | Zero-sum static budget optimization |
| **20** | Expression | Master Pilot | All 6 Disciplines & Feat Tiers unconstrained | Complete build freedom across all Shattered Worlds |

[↑ Back to Master Index](#-master-index-table-of-contents)

---

## 5. The Shattered Worlds (`u00`) & Æther Fog Navigation

### 5.1 Lore: Waygates, Tuning Crystals & The Pilots

- **The Waygates**: At the heart of every known world stands a colossal archway of stone, root, and mineral that looks more like a canyon mouth than a building. There are no controls and no inscriptions. You walk through, and the gate reads your ætheric signature and carries you on.
- **The Æther**: Between the worlds churns an active, hostile medium. Living tissue that touches it disintegrates instantly—on an interworld vessel, a single strand of an elven bride's hair crossed a flux-field breach and she died on the spot, sparking an eight-year clan war before the truth came out.
- **The Mining Operation & Desynchronization**: A dwarven civilization once mined rare **tuning crystals**—calibration structures that kept the worlds synchronized. Worlds did not break; **they drifted**. Landscapes shift without cause, ruins flicker between intact and destroyed, and the stars no longer match the records.
- **The Pilots**: Pilots appeared only after the catastrophe. No world claims them, and no record of them exists before it. They can walk through the æther unprotected and bond with mechs at once. Factions whisper that pilots are walking fractures in reality—and recruit them anyway.

---

### 5.2 The 20 Worlds of the `u00` Cosmos

Open the **WORLD MAP** tab in your Satchel to view the real-time **Living Æther Cosmos (`u00`)**, where 20 worlds orbit the underworld singularity **Sin**:

#### The Eight Major Worlds
| # | World | Culture / Theme | Heritage | Narrative Identity |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Belldor (Camelot)** | Arthurian Knights & Grail Myth | Canon | Your starting road. Phasing ruins, grail sickness, and contested waygates. |
| **2** | **Tyrranus** | Greek & Roman | Folklore | Imperial marble colonnades and gladiatorial frontier outposts across the drift. |
| **3** | **Orion** | Dwarven | Canon | Subterranean forge-world of deep-crust reactors and heavy chassis smiths. |
| **4** | **Novarin** | Orc | Canon | Ancestral homeworld of the orc warbands raiding Belldor's borderlands. |
| **5** | **Chyme** | Draconic | Canon | Crucible spires, volcanic vents, and high-temperature Ichor traditions. |
| **6** | **Golem** | Desert | Folklore | Sun-bleached monoliths and ancient clay-automaton ruins. |
| **7** | **New Novarin** | Elven | Canon | Splintered astral arbors beyond Old Novarin; volatile Ether traditions. |
| **8** | **Sin** | Underworld Singularity | Canon | The chthonic gravitational vortex at the center of the `u00` cosmos. |

#### Minor & Unstable Worlds
- **Seven Minor Worlds**: **Sylvis**, **Vox**, **Victor**, **Jager**, **Ferrous**, **Ebony**, and **Ivory**.
- **Five Unstable (Drift) Worlds**: **Aurora**, **Rhyme**, **Siren**, **Lennus**, and **Malleus**—worlds in severe desynchronization where waygate links are intermittent and hazardous.

---

### 5.3 Navigating the Æther Fog

Beyond authored settlements and sanctums, Belldor frays into **Æther Fog**: shifting stretches of ruined country that fold back on themselves. There is no artificial wall at the edge of the map—only deeper fog.

```
   [Key Place: Drop-Pod] ──► [Corridor 1/N..N/N] ──► [Key Place: Border Town]
                                     │
                                     ├──► [Side Pocket] ──► [Reward Cache / Switch / Mini-Boss]
                                     │
                                     └──► [Deep Fog Loop: Depth 1 .. Max]
                                                  │
                                                  ▼
                                        [Deepest Fog Boss]
                                 (Defeating it clears the fog &
                                  returns you to the main path)
```

- **Authored Places & Corridors**: Main roads connect key places (Drop-Pod, Towns, Boss Sanctums, Waystations, Waygates) through corridor rooms that advance your route progress.
- **Side Branches**: Stepping off the main route leads into side pockets holding supply caches, ambushes, or hidden mechanisms without advancing or resetting your main road progress.
- **Going Deeper**: Venturing into the deep fog increases **Fog Density** step by step—mist hangs thicker, vision tightens, and enemies grow more aggressive. At any depth *before* the bottom, you can turn around and retrace your steps safely. Reaching the deepest room triggers a **Fog Boss**; defeating it clears the local fog and returns you to your last anchor on the main path.
- **Æther Waystations (`Campfires / Monoliths`)**: Interact `[A]` with any Waystation to attune it for fast-travel, restore Frame Integrity, and repair Layer 2 Armor Durability.

[↑ Back to Master Index](#-master-index-table-of-contents)

---

## 6. The Road Through Belldor (Campaign Field Guide)

> **Belldor teaches you how to fight. Every other world tests whether you learned.**

### 6.1 Stage 1: The Bog (Levels 1–2)

You make planetfall in a drowned maze of fallen trees and sunken temple ruins. Pitch-black darkness presses in beyond your mech's personal light halo, and the marsh water is **corrosive** to armor plating.

- **Bog Crawlers**: Armored arthropods lurking in the mire that ambush pilots who wander off the stone causeways.
- **Orc Pairs**: Orcs hunt in coordinated pairs—a shield-bearing **Warrior** who charges in to pin you down, and a ranged **Scout** who fires from cover and slips away to heal when wounded. Focus the Scout, but never let the Warrior trap you in corrosive water.
- **The Bog Wurm**: A submerged bio-mechanical serpent with glowing ætheric veins. It stalks invisible beneath the water, strikes from ambush, and dives back under to regenerate.

> [!TIP]
> **Choices in the Mist (Spoiler-Free Hints)**:
> - **The Poe**: Somewhere in the drowned maze floats a small lantern-spirit calling itself *"Poe."* Helping it back to its lantern earns a lasting gift that changes how you read the fog and what hides beneath the water—though ignoring or slaying it is also possible. Either way, the road out of the bog will not open until you resolve the encounter.
> - **Bedivere's Wreckage**: Further on lies the fallen scout mech of a knight named **Bedivere**, carrying a **Signet Ring** and a cryptic **Numbered List**. Whether you take the ring or leave it with the dead has real consequences when you reach the next settlement. The game will not warn you which choice is wiser.

---

### 6.2 Stage 2: Camelot Border Town (Levels 3–6)

Emerging from the bog brings you to the outer perimeter of a contested border settlement between orc territory and Camelot's heartland:

| District | Battlefield Profile |
| :--- | :--- |
| **Outer Perimeter** | Collapsed fortifications, abandoned orc siege engines, and burnt waystations. Your arrival point and the first line of defense. |
| **Market District** | A fracturing market where buildings phase between intact and ruined every few seconds. Caches hold components, flasks, and blueprints. |
| **Barracks Quarter** | The former knight garrison, now a heavily fortified holdout patrolled by Camelot's fallen champions. |
| **Cathedral District** | Scorched grail tapestries, a defiled altar, and out-of-rhythm bells guarding the descent beneath the town. |

- **Grail Sickness & The Ring**: The survivors here suffer from grail sickness. Some are calm enough to trade, some turn hostile if you linger too close, and others are already feral. If you chose to carry **Bedivere's Ring**, Camelot loyalists will brand you a grave robber on sight.
- **Orc Raids**: Without warning, war horns echo from the southern siege camp, the sky pulses crimson, and the road back to the bog seals shut. During a raid, **every town NPC goes feral**, and orc raiders target townsfolk before they target you. You can fight to save the settlement, let the market burn, or slip toward the cathedral while the garrison is distracted—the survivors will remember what you did.

---

### 6.3 The Three Grail Knights & The Dungeon Door

Three corrupted champions patrol the Barracks and Cathedral districts. You can draw them out one by one, or challenge all three together for the ultimate reward:

| Champion | Combat Archetype | Tactical Profile & Counterplay |
| :--- | :--- | :--- |
| **Sir Percival**, *Grail Knight* | Guardian Phalanx | An immovable shield wall with a gap-closing charge. Protects his allies and regenerates shields when critically wounded—keep up pressure or flank his guard. |
| **Sir Tristan**, *Corrupted Ranger* | Kiting Marksman | Fires rapid arrow volleys, drops smoke to break lock-on in corners, and tracks targets behind cover. Fragile once cornered, lethal if you stand still. |
| **Sir Bors**, *Berserk Striker* | Relentless Brawler | Grows stronger with every consecutive strike he lands and enrages at half health. Watch for the windup tell on his execution lunge and sidestep off-axis. |

- **The Cathedral Dungeon Door**: At the far end of the Cathedral, a stone staircase descends into mist toward the Camelot Waygate. There are **three distinct ways** to unseal the door—**by force** (through the Three Knights), **by exploration** (uncovering hidden mechanisms across the phasing districts), or **by trust** (proving yourself to the town during orc raids).

---

### 6.4 Whispers, Rumors & What Lies Ahead

- **The Numbered List & The Water**: The strange items written on Bedivere's list are scattered across more than one zone. Pilots who gather everything on that list and return to the deep bog water may awaken something ancient—half machine, half serpent—that answers to the **Lady of the Lake**.
- **Hidden Blueprints**: Phasing walls and tucked-away caches in Border Town conceal standalone hardware and weapon modifications for pilots who watch the desynchronization cycle closely.
- **Beyond the Staircase**: The **Orc Encampment**, the **Deep Dungeon**, **Camelot's Interior**, the other worlds of `u00`, and opt-in **Æther Incursions** await past the borderlands.

[↑ Back to Master Index](#-master-index-table-of-contents)

---

## 7. Complete Equipment & Hardware Reference

### 7.1 All 29 Magitech Weapons

*Note: Trait Line indicates the weapon's design heritage and discipline synergy—never a class restriction.*

| Weapon Name | Heritage | Weapon Class | Damage Type | Weight Class | Primary Slot | Combat Identity |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **N-55 Gladius** | Warrior | Bolter | Impact | Medium | Main Hand | BCU reference weapon; burst-fire stabilization |
| **M-300 Hasta** | Warrior | Polybolos | Impact | Medium | Main Hand | Mid-range sustained kinetic fire |
| **M-450 Pilum** | Warrior | Ballista | Impact | Heavy | Main Hand | Shock-channeling heavy artillery hitter |
| **S-2 Turbine Khopesh** | Warrior | Blade | Pierce | Light | Aux / Side | Compact fallback blade; dual-wield capable |
| **B-25 Brushcutter** | Marauder | Gatling Gun | Pierce | Heavy | Main Hand | Twin-rotor rotary gun; intercept & suppression |
| **M-350 Mauler** | Marauder | Grenade Cannon | Blast | Medium | Main Hand | Three-shot explosive burst suppression |
| **LN-1200 Avalanche** | Marauder | Rocket System | Blast | Heavy | Main Hand | Long-range rocket pod; interference shielding |
| **LG-950 Tomahawk** | Marauder | Missile System | Blast | Heavy | Main Hand | Long-range soft-lock missile salvo |
| **Siegebreaker** | Marauder | Battle Axe | Impact | Heavy | Aux / Side | Two-handed cleaver with integrated energy vent |
| **LS-900 Swordspear** | Guardian | Polearm | Wave (Mana) | Medium | Main Hand | Mana-channeling reach weapon; wide cleave strikes |
| **RS-450 Radiant Projector** | Guardian | Beam Emitter | Beam | Medium | Main Hand | Mid-range beam; reinforces personal shields |
| **HL-220 Lightburst Lance** | Guardian | Lance | Beam | Heavy | Main Hand | Reactor-linked heavy lance; Judgment Strike |
| **TIG Edge / Guardian's Edge** | Guardian | Energy Blade | Pulse | Light | Aux / Side | Compact precision melee defense blade |
| **Aegis Charge Buckler** | Guardian | Physical Shield | Impact | Medium | Aux / Side | Physical barrier; enables `Shield Charge` feat |
| **SV-12 Viper** | Rogue | SMG | Pierce | Light | Main Hand | High fire rate; close-range rapid burst |
| **SV-18 Serpent** | Rogue | Carbine | Pierce | Light | Main Hand | Suppressed carbine for mid-range stealth ops |
| **SR-440 Shadowfang** | Rogue | Marksman Rifle | Pierce | Medium | Main Hand | Long-range precision rifle; critical amplification |
| **S-4 Whisper Blade** | Rogue | Dagger | Pierce | Light | Aux / Side | Monomolecular edge; dual-wield capable |
| **S-6 Phantom Edge** | Rogue | Knife | Pierce | Light | Aux / Side | Thermal-coated blade; heat-dampened strikes |
| **WZ-800 Arclight Cannon** | Wizard | Beam Projector | Beam | Heavy | Main Hand | Long-range heavy sustained beam cannon |
| **WZ-650 Prism Lance** | Wizard | Beam Rifle | Beam | Medium | Main Hand | Focusing crystal rifle with variable intensity |
| **WZ-450 Sparkstrike** | Wizard | Energy Carbine | Pulse | Medium | Main Hand | Rapid pulse burst for close-range defense |
| **WZ-200 Manacore Staff** | Wizard | Polearm | Wave (Mana) | Heavy | Main Hand | AoE mana discharge and area denial |
| **ARC Conductor** | Wizard | Energy Pistol | Pulse | Light | Aux / Side | Lightweight emergency energy sidearm |
| **CL-700 Sanctifier** | Cleric | Hybrid Rifle | Beam / Pierce | Medium | Main Hand | Adaptive damage type per target defense |
| **CL-500 Absolution** | Cleric | Beam Projector | Beam | Medium | Main Hand | Area purification beam; buffs allies on sustained fire |
| **CL-350 Litany** | Cleric | Support Carbine | Pulse | Medium | Main Hand | Applies ally tactical buffs on enemy hit |
| **Hallowed Scepter** | Cleric | Hybrid Staff | Wave / Impact | Medium | Main Hand | Hybrid melee sweeps + ranged healing pulses |
| **Grace Edge** | Cleric | Consecrated Blade | Pierce | Light | Aux / Side | Releases a healing pulse on critical hit |

---

### 7.2 Core Frame Platings (6 Coreplates)

| Coreplate Name | Heritage | Plating Type | Base Capacity | Weight | Armor (`DUR / RTG / THR`) | Shield Bonus | Built-In Trade-Off |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **BWI Bastion Frame Plating** | Warrior | Physical / Reactive | `90 WT` | `15 WT` | `135 / 11 / 7` | `+55` | `+4%` Venting, `+6` Stability / `-2%` Speed |
| **Fire & Ice Fortress Frame Plating** | Marauder | Physical / Hardened | `112 WT` | `32 WT` | `205 / 15 / 11` | `+35` | `+18` Stability / `-6%` Speed |
| **Dawnforge Guardian Frame Plating** | Guardian | Physical / Layered | `90 WT` | `17 WT` | `170 / 13 / 9` | `+75` | `+12` Stability / `-3%` Speed |
| **Shadowcraft Recon Frame Plating** | Rogue | Physical / Ablative | `84 WT` | `7 WT` | `95 / 6 / 4` | `+40` | `+6%` Speed, `+0.5` Light / `-8` Stability |
| **Arcanum Heavy Projector Frame Plating** | Wizard | Physical / Layered | `90 WT` | `15 WT` | `120 / 8 / 6` | `+95` | `-6%` Cooldowns, `+0.5` Light / `-4` Stability |
| **Sanctum Support Frame Plating** | Cleric | Physical / Reactive | `90 WT` | `15 WT` | `145 / 10 / 7` | `+70` | `+6%` Venting, `-4%` Cooldowns / `-2%` Speed |

---

### 7.3 Core Systems (6 Generators / Reactors)

| Reactor Name | Heritage | Core Identity & Combat Behavior |
| :--- | :--- | :--- |
| **PNSY Alchemic Turbine Core Mk.IV** | Warrior | Ichor magitech turbine; volatile heat output that powers overclock maneuvers. |
| **RAD Battleheart Ether Reactor Mk.V** | Marauder | Heavy reactor with kinetic-recycling feedback loops under sustained siege. |
| **TI Manaheart Reactor Mk.IV** | Guardian | High-stability Mana core that powers barriers, aura projection, and cleave waves. |
| **VX Phantom Core Mk.III** | Rogue | Low-emission Ether reactor tuned for thermal masking, stealth, and burst output. |
| **ARC Infinite Well Reactor Mk.VI** | Wizard | Massive energy reservoir built for sustained beam discharge and overflow venting. |
| **SANC Heartwell Reactor Mk.IV** | Cleric | Balanced Mana core that distributes overflow energy to ally shields and repair fields. |

---

### 7.4 Auxiliary & Tactical Utility Systems (18 Modules)

| System Name | Heritage | Slot | System Type | Tactical Function |
| :--- | :--- | :--- | :--- | :--- |
| **PNSY R-11 Rockweiler Buckler** | Warrior | Aux 3 | Physical Shield | Parrying buckler with reactive impact plating |
| **PNSY UF-9 Rough Rider Booster** | Warrior | Aux 4 | Mobility | Thruster engagement and evasion kit |
| **PNSY D-0g Repair Drone** | Warrior | Utility | Utility | Bay-launched autonomous armor/frame repair drone |
| **RAD R-22 Bastion Kinetic Recycling** | Marauder | Aux 3 | Armor Augment | Reactive plating absorbs kinetic hits and recycles power |
| **RAD UF-12 Ether Vapor Launcher** | Marauder | Aux 4 | Utility | Launches obscuring vapor clouds that scramble enemy targeting |
| **RAD R463 Fathomless System** | Marauder | Utility | Self-Repair | Channels excess reactor energy into subsystem and armor repair |
| **TI Aegis Hard-Light Shield** | Guardian | Aux 3 | Energy Shield | Deployable frontal hard-light barrier |
| **TI Radiant Sphere Generator** | Guardian | Aux 4 | Energy Shield | Projects a protective dome barrier around nearby allies |
| **TI Lightwell Recovery System** | Guardian | Utility | Self-Repair | Converts excess reactor energy into shield and subsystem restoration |
| **VX Eclipse Cloak Generator** | Rogue | Aux 3 | Stealth | Active optical camouflage and thermal signature masking |
| **VX Phase-Shift Module** | Rogue | Aux 4 | Evasion | Grants a brief burst of phase intangibility |
| **VX Smoke Dispersal System** | Rogue | Utility | Utility | Deploys thermal-masking smoke canisters |
| **ARC Prismatic Barrier** | Wizard | Aux 3 | Energy Shield | Refractive barrier that deflects incoming energy beams |
| **ARC Feedback Loop Capacitor** | Wizard | Aux 4 | Energy Shield | Absorbs incoming energy attacks and stores them for counter-discharge |
| **ARC Rift Anchor** | Wizard | Utility | Mobility | High-energy short-range spatial teleport escape |
| **SANC Aegis Restoration Field** | Cleric | Aux 3 | Repair | Area-effect shield and armor restoration field |
| **SANC Martyrdom Plating** | Cleric | Aux 4 | Armor Augment | Reactive armor that redirects nearby ally damage to your own chassis |
| **SANC Radiant Ward Projector** | Cleric | Utility | Barrier | Deployable ward that absorbs status effects and incoming fire |

---

### 7.5 Optics & Battlefield Sensors (18 Modules)

| Module Name | Heritage | Internal Slot | Sensor Function |
| :--- | :--- | :--- | :--- |
| **Crystal Dynamics EmberSight Suite** | Warrior | Optics | Mid-short range targeting with rapid lock acquisition |
| **Federated T7 Sensor Array** | Warrior | Sensory A | Thermal and motion battlefield monitor |
| **Federated EchoPulse Scanner** | Warrior | Sensory B | Acoustic radar and close-quarters breach detection |
| **BE Foresight Targeting Array** | Marauder | Optics | Long-range artillery and missile lock tracking |
| **NDS ArcPulse Sensor Grid** | Marauder | Sensory A | Blast wave and suppression disruption scanner |
| **NDS EchoStorm Threat Analyzer** | Marauder | Sensory B | Incoming ordnance and lock-on warning analyzer |
| **Aegis Radiant Targeting Array** | Guardian | Optics | Shield projection alignment and cleave arc precision |
| **Solbright Flux Sensor Grid** | Guardian | Sensory A | Shield harmonics and vanguard threat awareness |
| **Aegis Lightveil Analyzer** | Guardian | Sensory B | Artillery saturation and barrier stress monitor |
| **Veilsight Targeting Suite** | Rogue | Optics | Low-light vision enhancement and critical weak-point optics |
| **VX Phantom Network Sensor** | Rogue | Sensory A | Motion tracker and counter-stealth detection array |
| **VX Echo-Null Scanner** | Rogue | Sensory B | Acoustic dampening and ambush breach prediction |
| **ARC Omniscient Array** | Wizard | Optics | Long-range energy signature tracking and beam focusing |
| **ARC Manaflow Analyzer** | Wizard | Sensory A | Ambient æther/mana field monitor and discharge timer |
| **ARC Convergence Predictor** | Wizard | Sensory B | Beam trajectory computer and weak-point lock |
| **SANC Providence Scanner** | Cleric | Optics | Ally status telemetry and priority threat identification |
| **SANC Lifeline Monitor** | Cleric | Sensory A | Real-time triage and barrier integrity tracking |
| **SANC Blessing Resonance Grid** | Cleric | Sensory B | Buff harmonic optimizer and formation tracker |

---

### 7.6 Head, Arm, Leg & Energy Storage Components

| Heritage | Slot | Component Name | Mechanical Role |
| :--- | :--- | :--- | :--- |
| **Warrior** | Head | **Crystal Dynamics G341 Murmillio** | Reinforced helm with alchemic optic core and heat-dispersing vents |
| **Warrior** | Arms | **BWI Twinstrike Gauntlets** | Recoil dampeners and reinforced joints for sustained burst fire |
| **Warrior** | Legs | **BWI Gatecrasher Striders** | Shock-absorbing, booster-linked leg actuators |
| **Warrior** | Energy Storage | **Crystal Dynamics ERD Lodestone** | Field-controlled energy reservoir for rapid combat discharge |
| **Marauder** | Head | **BE Ironveil Command Dome** | Layered siege dome with interference dampeners |
| **Marauder** | Arms | **Fire & Ice Line Holder** | Shock-channeling conduits and heavy recoil bracing |
| **Marauder** | Legs | **Fire & Ice Outrigger Striders** | Heavy outrigger plates for maximum stability under siege |
| **Guardian** | Head | **Aegis Halo Command Dome** | Mana-channeling conduits and tactical shield uplink |
| **Guardian** | Arms | **Solbright Cleaver Assemblies** | Reactor-linked polearm and cleave actuator channels |
| **Guardian** | Legs | **Dawnforge Stabilizer Striders** | Heavy-duty stabilizer anchors |
| **Rogue** | Head | **VX Veilsight Command Helm** | Low-light optics and thermal signature dampening |
| **Rogue** | Arms | **Shadowcraft Silencer Gauntlets** | Recoil suppression and CQC vibration dampening |
| **Rogue** | Legs | **Shadowcraft Ghost Striders** | Silent actuators tuned for burst acceleration |
| **Rogue** | Energy Storage | **VX Shadow Capacitor** | Rapid-discharge capacitor for stealth mobility and critical strikes |
| **Wizard** | Head | **ARC Omniscient Command Dome** | Crystal lattice dome for long-range energy signature tracking |
| **Wizard** | Arms | **Arcanum Channeler Assemblies** | High-output energy conduits and beam focusing arrays |
| **Wizard** | Legs | **Arcanum Anchor Striders** | Energy grounding and sustained beam recoil absorption |
| **Cleric** | Head | **SANC Providence Command Helm** | Triage command HUD and threat assessment uplink |
| **Cleric** | Arms | **Sanctum Benediction Assemblies** | Hybrid weapon integration and ally buff emitters |
| **Cleric** | Legs | **Sanctum Steadfast Striders** | Stabilizer anchors for frontline support positioning |

[↑ Back to Master Index](#-master-index-table-of-contents)

---

## 8. Complete Canonical Feats Catalog (97 Feats)

Feats are unlocked by leveling your **6 Combat Disciplines** (`Tier I` at `Lv 2`, `Tier II` at `Lv 5`, `Tier III` at `Lv 9`, `Tier IV` at `Lv 14`, `Tier V` at `Lv 18`) and require specific **equipped hardware or weapon families**—never a class lock.

### 8.1 Tier I Feats

| Feat Name | Discipline Affinity | Hardware / Weapon Prerequisite | Combat Effect |
| :--- | :--- | :--- | :--- |
| **Booster Evasion** | Warrior | Booster kit equipped | Grants brief invulnerability frames (`i-frames`) during booster dash |
| **Momentum Guard** | Warrior / Marauder | Booster kit | Grants stagger resistance while boosting |
| **Radiant Step** | Warrior / Guardian | Booster kit + Mana core | Boost leaves a radiant shimmer granting stagger resistance |
| **Radiant Dash** | Warrior / Guardian | Booster kit + Mana core | Boost leaves a radiant afterimage that blinds nearby enemies |
| **Siege Stability** | Marauder | Heavy / Super-heavy chassis | Outriggers grant stagger immunity while firing heavy weapons |
| **Anchored Action** | Marauder / Guardian | Stabilizer frame + Shield / Booster | While anchored, evasion or shield charge gains stagger immunity |
| **Stabilizer Pulse** | Marauder / Guardian | Stabilizer frame + Energy shield | Anchored shield emits a pulse reducing incoming ranged damage |
| **Shield Charge** | Guardian | Physical shield | Charge forward with shield raised; impact stuns target for `1.5s` |
| **Shadow Step** | Rogue | Mobility system | Dash grants brief invisibility (capped at max stealth window) |
| **Phantom Strike** | Rogue / Wizard | Cloak + Energy weapon | Attacks from stealth deal bonus energy damage |
| **Surgical Precision** | Rogue / Cleric | — | Critical hits restore a portion of shield energy within `10m` |
| **Veil of Mercy** | Rogue / Cleric | Cloak + Support reactor | Entering stealth applies a brief damage reduction aura |
| **Beam Focus** | Wizard | Energy weapon equipped | Standing still increases beam damage by `+15%` |
| **Radiant Overflow** | Wizard / Cleric | Energy reactor + Support system | Excess reactor energy creates a localized heal-over-time zone |
| **Empowered Blessing** | Wizard / Cleric | Energy weapon + Buff system | Weapon hits extend active buff durations by `+0.5s` |
| **Reactive Healing** | Cleric | Support reactor | Dropping below `30%` HP triggers an automatic `15%` HP pulse (`20s` CD) |

---

### 8.2 Tier II Feats

| Feat Name | Discipline Affinity | Hardware / Weapon Prerequisite | Combat Effect |
| :--- | :--- | :--- | :--- |
| **Sidearm Twin-Link** | Warrior | Matching sidearms | Executes synchronized dual-sidearm strikes |
| **Suppression Link** | Warrior / Marauder | Matching suppression weapons | Burst or sustained fire triggers twin-linked suppression volleys |
| **Shielded Volley** | Warrior / Guardian | Shield + Sidearms | Allows firing sidearms while maintaining active guard |
| **Twin Guard** | Warrior / Guardian | Shield + Sidearms | Delivers suppressive fire while defending |
| **Radiant Intercept** | Warrior / Guardian | Intercept weapon + Mana core | Intercept shots emit a radiant flare that blinds enemies |
| **Suppression Chainfire** | Marauder | Suppression / Intercept weapon | Sustained fire builds cumulative suppression stacks |
| **Aura of Suppression** | Marauder / Guardian | Mana core + Suppression weapon | Projects an aura that reduces nearby enemy accuracy and movement speed |
| **Guardian's Interference** | Guardian / Marauder | Mana core + Interference launcher | Aura scrambles enemy targeting locks |
| **Protector's Aura** | Guardian | Mana core | Reserves energy as interference shielding that blocks ranged energy fire and deflects small arms |
| **Backstab Mastery** | Rogue | — | Attacks from behind the target deal `+50%` damage |
| **Arcane Ambush** | Rogue / Wizard | Cloak + Beam weapon | First attack from stealth overcharges beam for `+100%` damage |
| **Phase Beam** | Rogue / Wizard | Phase-shift module + Energy weapon | Brief intangibility allows firing beams through cover obstacles |
| **Healing Shadow** | Rogue / Cleric | Stealth + Support field | Cloaked field restores shield energy over time |
| **Mercy Strike** | Rogue / Cleric | — | Critical hits grant a brief damage buff within `10m` |
| **Sustained Channeling** | Wizard | Beam weapon | Continuous fire on the same target ramps damage by `+5%/s` (up to `+25%`) |
| **Energy Redistribution** | Wizard / Cleric | Support reactor | Taking damage transfers reactor energy into barrier/ally reserves |
| **Shared Resonance** | Wizard / Cleric | Buff system + Energy pool | Active buffs reduce your own energy costs by `-10%` |
| **Purification Beam** | Cleric / Wizard | Support reactor + Energy weapon | Beam attacks cleanse negative status effects along their path |
| **Martyr's Resolve** | Cleric | Support reactor | Gain `+20%` damage reduction while redirecting or absorbing damage via Martyrdom systems |

---

### 8.3 Tier III Feats

| Feat Name | Discipline Affinity | Hardware / Weapon Prerequisite | Combat Effect |
| :--- | :--- | :--- | :--- |
| **Sidearm Parry** | Warrior | Parry-capable sidearm | Enables precision defensive melee parry |
| **Attrition Riposte** | Warrior / Marauder | Parry weapon | Successful parries restore reactor energy (once per enemy attack cycle) |
| **Reactive Overload** | Warrior / Marauder | Suppression weapon | Taking damage reduces active skill cooldowns (stacks decay after `5s`) |
| **Overclock Guard** | Warrior / Marauder | Overclock core + Defensive plating | Overclock hardens plating and reduces damage at increased reactor heat |
| **Overload Cleave** | Warrior / Guardian | Mana reactor + Melee weapon | Cleave strikes build overload stacks (up to `3`); next boost restores shield energy |
| **Cleave Counter** | Warrior / Guardian | Mana reactor + Parry weapon | Successful parry automatically triggers a radiant cleave wave |
| **Attrition Guard** | Marauder | Defensive plating | Converts incoming damage into reactor energy |
| **Radiant Barrage** | Marauder / Guardian | Mana reactor + Heavy weapon | Cleave strikes trigger a rapid follow-up burst barrage |
| **Cleave Suppression** | Guardian / Marauder | Mana reactor + Suppression weapon | Cleave strikes apply suppression stacks to hit enemies |
| **Radiant Cleave** | Guardian | Mana reactor + Main-hand melee | Charged melee unleashes a `180°` mana-energy wave |
| **Assassinate** | Rogue | — | Critical hits against targets above `90%` HP deal `+200%` damage |
| **Phantom Barrage** | Rogue / Wizard | Cloak + Rapid-fire weapon | Attacks from stealth trigger burst fire with zero reactor heat cost |
| **Void Strike** | Rogue / Wizard | Phase-shift + Energy weapon | Attacks during phase intangibility bypass enemy shields and armor |
| **Guardian Angel** | Rogue / Cleric | Cloak + Support field | While stealthed, absorbs `50%` of nearby ally damage |
| **Vital Strike** | Rogue / Cleric | — | Critical hits restore `10%` of damage dealt as integrity |
| **Overcharge** | Wizard | Energy reactor | Spend `30%` of your energy pool to boost your next attack by `+150%` |
| **Convergence Field** | Wizard / Cleric | Energy overflow + Support system | Boosts nearby energy regeneration by `+25%` |
| **Empowered Ward** | Wizard / Cleric | Energy shield + Buff system | Active shields reflect `25%` of incoming damage back to the attacker |
| **Benediction Pulse** | Cleric / Wizard | Support system + Energy weapon | Killing blows release a `20m` healing pulse |
| **Mass Restoration** | Cleric | Support reactor + Area healing system | Doubles healing field radius (`2×`) and increases restoration by `+25%` |

---

### 8.4 Tier IV Feats

| Feat Name | Discipline Affinity | Hardware / Weapon Prerequisite | Combat Effect |
| :--- | :--- | :--- | :--- |
| **Main Weapon Twin-Link** | Warrior | Matching main weapons | Fires linked weapon mounts simultaneously |
| **Overclock Barrage** | Warrior / Marauder | Overclock core + Suppression weapon | Resets weapon cooldowns and boosts suppression fire rate at reactor heat cost |
| **Disruption Riposte** | Warrior / Marauder | Interference launcher | Activating interference launcher grants a brief parry window |
| **Guardian's Dash** | Warrior / Guardian | Booster kit + Energy shield | Boosting through enemies triggers a shield pulse that stuns for `1.5s` and restores shields (`10s` CD) |
| **Overclocked Ward** | Warrior / Guardian | Overclock core + Energy shield | Boosts shield recharge rate and grants crowd-control immunity |
| **Suppression Ward** | Warrior / Guardian | Energy shield + Suppression weapon | Activating your shield projects suppression stacks onto nearby enemies |
| **Disruption Field** | Marauder | Interference launcher | Doubles interference aura duration |
| **Unyielding Bulwark** | Marauder / Guardian | Heavy frame + Energy shield | Grants crowd-control immunity while shielding |
| **Siege Ward** | Guardian / Marauder | Heavy frame + Radiant sphere | Protective dome grants stagger and stun immunity inside its radius |
| **Unfaltering** | Guardian | Heavy / Super-heavy frame | Grants crowd-control immunity for the duration of active support buffs |
| **Perfect Ambush** | Rogue | — | First attack from stealth is a guaranteed critical hit with `+100%` critical damage |
| **Dimensional Strike** | Rogue / Wizard | Phase-shift + Energy weapon | Teleports behind target for a guaranteed critical strike before returning to origin |
| **Spectral Volley** | Rogue / Wizard | Cloak + Energy weapon | Fire while cloaked without breaking stealth (`3s` window) |
| **Merciful Execution** | Rogue / Cleric | — | Killing blows restore `25%` of the target's max HP to your field |
| **Shadow Sanctuary** | Rogue / Cleric | — | Deploys a `10m` stealth field that cloaks and heals for `5s` |
| **Arcane Mastery** | Wizard | — | Beam weapons ignore `50%` of target energy resistance |
| **Font of Power** | Wizard / Cleric | Support reactor + Energy pool | Grants `+30%` energy regeneration within `20m` |
| **Barrier Network** | Wizard / Cleric | Energy shield | Links active shields to distribute and share damage absorption |
| **Consecrated Ground** | Cleric / Wizard | — | Deploys a `10s` sanctified zone that heals allies and damages enemies inside it |
| **Selfless Sacrifice** | Cleric | Martyrdom system | Intercepts lethal damage and grants `3s` of damage immunity on survival (`60s` CD) |

---

### 8.5 Tier V Capstone Feats

| Feat Name | Discipline Affinity | Hardware / Weapon Prerequisite | Combat Effect |
| :--- | :--- | :--- | :--- |
| **Core Overclock** | Warrior | Overclock core | Resets all skill cooldowns at a volatile reactor heat trade-off |
| **Salvo Link** | Warrior / Marauder | Matching heavy weapons | Chains heavy weapons into twin-linked salvo bursts |
| **Avalanche Surge** | Warrior / Marauder | Artillery optics | Overclocks salvos into rapid multi-target chains at escalating heat and energy cost |
| **Lightstorm Barrage** | Warrior / Guardian | Mana reactor + Artillery optics | Radiant salvo projectiles deal wide cleave damage on impact |
| **Lightstorm Salvo** | Warrior / Guardian | Mana reactor + Artillery optics | Radiant salvo projectiles inflict heavy suppression on impact |
| **Multi-Lock Array** | Marauder | Artillery optics | Salvo missile/rocket systems lock onto multiple targets simultaneously |
| **Judgment Battery** | Marauder / Guardian | Mana reactor + Artillery optics | Cleave strikes restore reactor energy and accelerate salvo lock speed |
| **Radiant Convergence** | Marauder / Guardian | Mana reactor + Radiant sphere | Executing cleave or salvo inside your radiant sphere amplifies damage |
| **Avalanche Light** | Guardian / Marauder | Mana reactor + Artillery optics | Radiant salvos inflict area suppression damage |
| **Hardening Light** | Guardian | Energy shield | Hits against your energy shield reflect damage and restore reactor energy |
| **Shadow Master** | Rogue | — | Doubles cloak duration and allows up to `3` attacks without breaking stealth (`8s` cap) |
| **Quantum Assassin** | Rogue / Wizard | — | `3`-target chain teleport strike across up to `20m` per jump |
| **Phantom Artillery** | Rogue / Wizard | Cloak + Beam weapon | Enter stealth and plant in immobile turret stance to fire a `+200%` damage beam while invisible |
| **Divine Veil** | Rogue / Cleric | — | Deploys an `8s` cloaking zone granting status-effect immunity |
| **Angel of Death** | Rogue / Cleric | — | Stealth kills trigger a BCU-scaled heal and grant `+50%` damage for `6s` |
| **Arcane Annihilation** | Wizard | — | `3s` immobile channeled charge unleashes an `800%` damage piercing beam (`120s` CD) |
| **Infinite Wellspring** | Wizard / Cleric | — | Sustained proximity healing aura fueled by reactor energy per tick |
| **Empowered Singularity** | Wizard / Cleric | Energy reactor + Buff system | Deploys a `12s` singularity zone amplifying damage by `+60%` |
| **Radiant Apocalypse** | Cleric / Wizard | Support reactor + Energy weapon | Fires a massive beam that simultaneously heals allies and damages enemies in its path |
| **Martyrdom Transcendent** | Cleric | — | Absorbs `60%` of nearby damage into your shields first for `8s`, then releases a restorative burst (`180s` CD) |

---

### 8.6 Reward Feats

| Feat Name | How It Is Earned | Permanent Effect |
| :--- | :--- | :--- |
| **Knight's Oath** | Defeat **Sir Percival**, **Sir Tristan**, and **Sir Bors** in a combined encounter in Camelot Border Town | **`+10%` permanent bonus damage** against all Camelot enemies |

[↑ Back to Master Index](#-master-index-table-of-contents)
