# Project Orion — Weapon Component Modification Overhaul

*A complete architectural, mechanical, and data-schema specification for modular engineering across the 72 `Custom` Weapons in Project Orion.*

---

## 📑 Table of Contents

1. [Core Design Philosophy & Scope](#1-core-design-philosophy--scope)
2. [Canonical System Rules & Hard Constraints](#2-canonical-system-rules--hard-constraints)
   - [2.1 Three-Slot Non-Sequential Anatomy (`Contact`, `Delivery`, `Regulation`)](#21-three-slot-non-sequential-anatomy-contact-delivery-regulation)
   - [2.2 Strict `CRAFTED` vs. `LOOTED` Mutual Exclusion](#22-strict-crafted-vs-looted-mutual-exclusion)
   - [2.3 Physical Geometry-to-Damage-Type Conversion Law](#23-physical-geometry-to-damage-type-conversion-law)
   - [2.4 Action 1 Modification Rules & Stance Isolation](#24-action-1-modification-rules--stance-isolation)
   - [2.5 Zero-Sum Trade-Off Law, Speed Hard Caps & Semantic Naming](#25-zero-sum-trade-off-law-speed-hard-caps--semantic-naming)
3. [Complete Bespoke Component Catalog (All 8 Weapon Classes)](#3-complete-bespoke-component-catalog-all-8-weapon-classes)
   - [3.1 Blades: Straight (7 Components)](#31-blades-straight-7-components)
   - [3.2 Blades: Curved (7 Components)](#32-blades-curved-7-components)
   - [3.3 Impact & Axes (7 Components)](#33-impact--axes-7-components)
   - [3.4 Spears (8 Components)](#34-spears-8-components)
   - [3.5 Bows (8 Components)](#35-bows-8-components)
   - [3.6 Casters (9 Components)](#36-casters-9-components)
   - [3.7 Shields (7 Components)](#37-shields-7-components)
   - [3.8 Carriers & Munitions (7 Components)](#38-carriers--munitions-7-components)
4. [TypeScript Data Schema & Runtime Resolution Rules](#4-typescript-data-schema--runtime-resolution-rules)
5. [Validation Checklist & Fragile Edge-Case Guardrails](#5-validation-checklist--fragile-edge-case-guardrails)

---

## 1. Core Design Philosophy & Scope

- **Scope (`Custom` Weapons Only)**: This overhaul governs the **72 `Custom` Weapons** (`9` functional weapon types across `8` weapon classes) engineered at the **Armory Workbench** (`LOADOUT → ARMORY`). The **29 `Magitech` Weapons** (and future Legendary relics) remain excluded from component swapping and are reserved for dedicated build-defining archetypes later.
- **Role of `Custom` Weapons ("Build Gap-Fillers")**: Because Project Orion is strictly classless (`200` static Frame Integrity, `BCU = 54`), `Custom` weapons allow pilots to bridge mechanical gaps in open-ended builds—such as converting a fast thrusting spear into an `Impact` knockdown tool, venting Reactor Heat on melee strikes for an `Ichor` turbine build, or dampening ranged recoil so a light `Wizard` frame can hold `Anchored Focus` ($\mu = 0$).
- **Physical Literalism & Immersion**: Every component represents a real physical assembly belonging to its weapon class. A part may **only** alter combat mechanics that its physical geometry, mass distribution, or mechanism directly governs.
- **Horizontal Sidegrades (Zero Quality Tiers)**: There are **no** `+1 / +2 / +3` quality tiers or linear vertical upgrades. Every component is a lateral, zero-sum engineering trade-off.

---

## 2. Canonical System Rules & Hard Constraints

### 2.1 Three-Slot Non-Sequential Anatomy (`Contact`, `Delivery`, `Regulation`)

Every `Custom` weapon exposes **3 Component & Gem Slots** (`Slot 1`, `Slot 2`, `Slot 3`). In accordance with canonical Armory rules:
- **Non-Sequential Installation**: Pilots may install, swap, or strip components in **any slot order** (`Slot 1`, `Slot 2`, or `Slot 3`).
- **Domain Uniqueness Guardrail**: Every component belongs to one of **three physical domains** (`CONTACT`, `DELIVERY`, or `REGULATION`). A weapon may hold **at most one component per domain** regardless of which visual slot (`1`, `2`, or `3`) it occupies (e.g., you cannot bolt two pommels onto one sword).

| Physical Domain | Anatomical Role | Allowed Mechanical Levers | Forbidden Levers |
| :--- | :--- | :--- | :--- |
| **`CONTACT`** | **Contact / Emitter Core** *(Blade Grind, Striking Head, Spearhead, Bow Limbs, Barrel/Nozzle, Shield Face, Munition Payload)* | • Primary `damageType` conversion (`Pierce`, `Impact`, `Beam`, `Pulse`, `Wave`, `Blast`)<br>• Armor Layer interaction (`THR` penetration, `DUR` shred, `Shield` disruption)<br>• Strike/projectile geometry (cleave arc, spread/choke, effective range) | Never modifies weapon swap speed, reactor heat venting, or carry capacity. |
| **`DELIVERY`** | **Grip / Kinematics / Feed** *(Crossguard/Hilt, Haft/Langets, String/Cam, Chamber/Coil, Shield Strapping, Feed Rail)* | • Combat tempo within the $\pm 30\%$ cap (combo cadence, bow draw curve, burst rate)<br>• Handling & guard (`Action 4` parry/block window, recoil control, moving accuracy)<br>• Action 1 cycle mechanics (magazine capacity, reload/vent cycle, draw-hold drain, or single secondary emitter) | Never modifies Armor `THR` penetration or passive mass balance. |
| **`REGULATION`** | **Balance / Thermal / Chassis Rig** *(Pommel, Tsuba, Butt-Spike, Riser/Stabilizer, Vent Shroud/Stock, Shield Core, Harness)* | • Inertia Physics (`Weight WT`, `Impulse J`, `Stability S`)<br>• Thermal / energy loop (Reactor Heat per swing/shot, heat vented on hit or block)<br>• Recovery & swap speed (post-swing recovery frames, weapon swap cooldown) | Never modifies blade sharpness, barrel choke, or arrow velocity. |

---

### 2.2 Strict `CRAFTED` vs. `LOOTED` Mutual Exclusion

Component acquisition is strictly partitioned into two **mutually exclusive pools** with zero overlap:

| Pool | Acquisition Source | Gem Sockets | Engineering Identity |
| :--- | :--- | :---: | :--- |
| **`CRAFTED`** | **Armory Workbench** *(Forged from `Scrap` + `Gemstones`)* | **`1` Socket Max** (`maxGemSlots: 1`) | Standardized guild/military engineering. Reliable, predictable physical tuning built on demand to patch build gaps. **Never spawns in loot tables.** |
| **`LOOTED`** | **Field Discovery** *(Caches, Bosses, Faction Drops, Phasing Ruins)* | **`1–3` Sockets** (`maxGemSlots: 1..3`) | Specialized, salvaged, or masterwork field assemblies. **Never appears in crafting recipes.** |

---

### 2.3 Physical Geometry-to-Damage-Type Conversion Law

Only **`CONTACT`** domain components may override a weapon's baseline `damageType`. Because at most one `CONTACT` component can be installed per weapon, damage-type resolution (`weapon.effectiveDamageType`) is **100% deterministic and order-independent**.

Whenever a `CONTACT` component alters `damageType`, it automatically enforces the matching physical behavior:

| Physical Geometry | Effective `damageType` | Inherent Combat Physics Shift |
| :--- | :---: | :--- |
| **Blunted / Flanged / Flat-Tipped / Hammer-Faced** | **`Impact`** | Transfers kinetic shock across wide surfaces: **`+20%` to `+30%` Impulse ($J$)** (triggers grounded knockdowns at $\Delta v_{\text{eff}} \ge 72$) and **`+15%` to `+20%` Layer 2 Armor Durability (`DUR`) shred**; loses **`-3` to `-4` Armor Threshold (`THR`) penetration**. |
| **Needle-Tapered / Bodkin / Beaked / Sabot-Cored** | **`Pierce`** | Concentrates kinetic force onto a fine point: ignores **`+4` to `+6` Armor Threshold (`THR`)**; loses **`-15%` to `-20%` Impulse ($J$)** and narrows cleave arc by **`-15%` to `-25%`**. |
| **Collimated Thermal Lens** | **`Beam`** | Continuous focused thermal scouring against armor seams (`+15%` sustained `DUR` burn); increases Reactor Heat per second. |
| **Acoustic / Capacitor Discharge** | **`Pulse`** | Rhythmic electromagnetic/concussive shock (`+20%` Layer 1 Shield damage & stagger pressure); reduced effective range. |
| **Wide-Aperture Diffuser** | **`Wave`** | Broad horizontal energy crest (`+30%` projectile/cleave width); shorter range and lower single-target `THR` pierce. |
| **High-Pressure Compression** | **`Blast`** | Volatile shockwave detonation (`AoE` splash + high `Impulse J`); high Reactor Heat, recoil, and `+WT`. |

---

### 2.4 Action 1 Modification Rules & Stance Isolation

- **Zero Conflict with Specialist Stances**: All **22 Specialist Martial Stances** override **Actions 2, 4, and 5** based on functional weapon class and Load Bracket (`Light`, `Medium`, `Heavy`). Weapon components **never** overwrite Actions 2, 4, or 5.
- **Two Tiers of Action 1 Modification**:
  1. **Parametric Action 1 Mods**: Modify numeric parameters of the weapon's existing Action 1 (`ammoCount`, tactical reload/vent duration, combo step count, thrust reach, or draw curve). Parametric mods stack cleanly up to engine hard caps.
  2. **Behavioral Action 1 Mods**: Attach a physical mechanism or emitter to Action 1 (e.g., a hilt-mounted wave projector on Combo Step 3, a gravity-feed repeating box on a bow, or a tri-prism splitter nozzle on a caster).
     - **Single-Behavior Guardrail**: A weapon may have **at most one Behavioral Action 1 override** active at a time.
     - **Secondary Emitter Rule**: When a `DELIVERY` component adds a secondary discharge (such as a short-range `Wave` on a sword finisher), the **blade itself** retains its `CONTACT` `damageType`, while only the **emitted wave projectile** deals `Wave` damage.
     - **Mode Compatibility Guardrail**: Action 1 mods are gated by `requiresAction1Mode` (`"MAGAZINE"`, `"DRAW_CHARGE"`, or `"MELEE_COMBO"`) so magazine parts cannot be installed on bows or swords.

---

### 2.5 Zero-Sum Trade-Off Law, Speed Hard Caps & Semantic Naming

- **Zero-Sum Budget**: Every beneficial stat or mechanism carries an authentic physical drawback (`+WT` pushing Load Bracket toward `Heavy` or `Overloaded`, `+Reactor Heat`, `-Stability S`, `-Tempo`, or `-Range/Arc`).
- **Cumulative Combat Tempo Hard Cap ($\pm 30\%$)**: Across all equipped components, feats, gemstones, and hardware, combat tempo is strictly clamped between **`0.70×` and `1.30×`** around the `1.00×` Medium baseline.
- **Physical Domain Separation (`Shields` vs. Other Weapons)**: Only **Shields** (and exterior Frame/Head Platings) modify Layer 2 Armor stats (`DUR`, `RTG`, `THR`). The other 7 weapon classes grant `0` Armor.
- **Semantic Naming Convention**: Installing components automatically updates the weapon's display name:
  - Traditional `Custom` weapons prefix **`Custom <BaseName>`** (e.g., `Custom Short Spear`, `Custom Arming Sword`).
  - Populating `2` or `3` slots appends **`+II`** or **`+III`** (e.g., `Custom Short Spear +II`, `Custom Bolt Caster +III`).

---

## 3. Complete Bespoke Component Catalog (All 8 Weapon Classes)

The catalog below defines **60 bespoke physical components** (`27 Crafted` + `33 Looted`) across all **8 Weapon Classes**, covering every anatomical domain, `damageType` conversion, and Action 1 modification.

---

### 3.1 Blades: Straight (7 Components)

*Compatible Functional Types: `Cinquedea`, `Spatha`, `Falchion`, `Arming Sword`, `Bastard Sword`, `Messer`, `Zweihander`, `Flamberge`, `Executioner Sword`.*

| Source | Domain | Component Name | Physical Mechanism & Mechanical Effect | Zero-Sum Trade-Off |
| :--- | :---: | :--- | :--- | :--- |
| **Crafted** (`1G`) | `CONTACT` | **Hollow-Ground Fuller** | Deep channels carved along the flat reduce blade inertia: **`+10%` swing tempo**, **`-2 WT`**. | **`-15%` Melee Impulse ($J$)** |
| **Crafted** (`1G`) | `DELIVERY` | **Ribbed Cord Grip** | Indexed leather-over-cord grip prevents hand-roll: **`+4` Stability ($S$)** during combo chains. | **`+1 WT`** |
| **Crafted** (`1G`) | `REGULATION` | **Wheel Counterweight Pommel** | Heavy iron disc shifts balance toward the hilt: **`-12%` post-swing recovery**, **`+10%` swap speed**. | **`+3 WT`** |
| **Looted** (`1–3G`) | `CONTACT` | **Reinforced Bodkin Tip** | Thickened diamond-section point: sets `damageType` to **`Pierce`** and ignores **`+4` Armor `THR`** on thrust steps. | **`-18%` horizontal cleave arc** |
| **Looted** (`1–3G`) | `CONTACT` | **Flat-Tipped Executioner Grind** | Re-profiles the tip into a heavy squared chopping blade: converts `damageType` to **`Impact`**, **`+20%` `BCU` on finisher steps**, **`+20%` Impulse ($J$)**. | **`-10%` swing tempo**, **`+2 WT`**, **`-3` `THR` pierce** |
| **Looted** (`1–3G`) | `DELIVERY` | **Flanged Parrying Lugs** | Twin steel lugs above the ricasso bind enemy blades: **`+0.05s` Action 4 Perfect Parry window**. | **`+2 WT`**, **`-6%` swap speed** |
| **Looted** (`1–3G`) | `DELIVERY` | **Conduit-Vented Crossguard** *(Action 1 Behavioral)* | Hilt emitter channels swing momentum into a **short-range `Wave` arc (`3.0m`, `0.35× BCU`)** on **Combo Step 3 / Finisher**. | **`+3` Reactor Heat** per wave, **`+2 WT`** |
| **Looted** (`1–3G`) | `REGULATION` | **Thermal-Vented Tang** | Hollowed fuller channels bleed friction heat into the hilt: vents **`-3` Reactor Heat** per hit. | **`-3` Stability ($S$)** |

*(Note: 8 total components for Blades: Straight including both Contact grind options.)*

---

### 3.2 Blades: Curved (7 Components)

*Compatible Functional Types: `Wakizashi`, `Katana`, `Khopesh`, `Shotel`, `Odachi`, `Kilij`, `Falx`, `Dao`, `Dadao`.*

| Source | Domain | Component Name | Physical Mechanism & Mechanical Effect | Zero-Sum Trade-Off |
| :--- | :---: | :--- | :--- | :--- |
| **Crafted** (`1G`) | `CONTACT` | **Broadened Belly Grind** | Widens the curved cutting belly: **`+15%` cleave arc width** & **`+10%` Layer 2 Armor `DUR` shred**. | **`-8%` swing tempo** |
| **Crafted** (`1G`) | `CONTACT` | **Lightweight Iaijutsu Profile** *(Action 1 Behavioral)* | Narrowed spine shifts Action 1 into a **fast 3-step draw-cut chain (`+12%` step tempo)** with **`+15%` lunge** on Step 1. | **`-15%` Melee Impulse ($J$)** |
| **Crafted** (`1G`) | `DELIVERY` | **Tapered Silk-Cord Wrap** | Tightly bound oval grip indexes edge alignment: **`+8%` draw-cut `BCU` scaling** on Step 1. | **`-2` Stability ($S$)** |
| **Crafted** (`1G`) | `REGULATION` | **Heavy Iron Guard Disc** | Thickened tsuba-style guard shifts center of mass back: **`+5` Stability ($S$)** on guard/parry. | **`+3 WT`** |
| **Looted** (`1–3G`) | `CONTACT` | **Serrated Spine Sawback** | Reverse-edge teeth catch armor seams on backswings: inflicts **`-15%` armor repair / shield regen** for `3s`. | **`+2` Reactor Heat** per combo |
| **Looted** (`1–3G`) | `DELIVERY` | **Forward-Canted Duelling Hilt** | Angled grip aligns wrist for lunges: **`+20%` forward lunge step distance**. | **`-10%` guard mitigation (`RTG`)** |
| **Looted** (`1–3G`) | `REGULATION` | **Hollow Resonance Core** | Tuned acoustic channel inside the tang: **`+15%` Melee Impulse ($J$)** on finisher steps. | **`+2 WT`**, **`-10%` swap speed** |

---

### 3.3 Impact & Axes (7 Components)

*Compatible Functional Types: `Cudgel`, `Mace`, `Spike`, `Hammer`, `Mallet`, `Tomahawk`, `Parashu`, `Labrys`, `Battle Axe`.*

| Source | Domain | Component Name | Physical Mechanism & Mechanical Effect | Zero-Sum Trade-Off |
| :--- | :---: | :--- | :--- | :--- |
| **Crafted** (`1G`) | `CONTACT` | **Flanged Impact Crown** | Angled steel flanges focus blunt trauma: sets `damageType` to **`Impact`** and adds **`+20%` `DUR` shred**. | **`-10%` swing tempo**, **`-3` `THR` pierce** |
| **Crafted** (`1G`) | `DELIVERY` | **Steel-Reinforced Langets** | Iron straps bolted down the neck prevent haft flex: **`+6` Stability ($S$)** mid-swing. | **`+3 WT`** |
| **Crafted** (`1G`) | `REGULATION` | **Lead Ballast Butt-Cap** | Weighted end-cap anchors momentum: **`+20%` Melee Impulse ($J$)** (easier grounded knockdowns). | **`+4 WT`**, **`-8%` tempo** |
| **Looted** (`1–3G`) | `CONTACT` | **Armor-Piercing Crow's Beak** | Rear-mounted steel pick punches through plate: converts `damageType` to **`Pierce`** and ignores **`+6` `THR`**. | **`-25%` cleave arc**, **`-20%` Impulse ($J$)** |
| **Looted** (`1–3G`) | `CONTACT` | **Seismic Anvil Head** *(Action 1 Behavioral)* | Oversized flat striking crown converts `damageType` to **`Impact`** and replaces the final combo step with a **grounded shockwave slam (`+35%` `Impulse J`)**. | **`-12%` swing tempo**, **`+4 WT`** |
| **Looted** (`1–3G`) | `DELIVERY` | **Shock-Absorbing Ash Haft** | Spring-tempered hardwood core dampens rebound: **`-35%` hit-stop recoil** on blocked blows. | **`-10%` Melee Impulse ($J$)** |
| **Looted** (`1–3G`) | `REGULATION` | **Kinetic Heat-Vent Cap** | Impact shock drives air through haft ports: vents **`-5` Reactor Heat** on heavy hits. | **`-4` Stability ($S$)** |

---

### 3.4 Spears (8 Components)

*Compatible Functional Types: `Short Spear`, `Winged Spear`, `Javelin`, `Spetum`, `Broad Spear`, `Partisan`, `Pike`, `Boar Spear`, `Lance`.*

| Source | Domain | Component Name | Physical Mechanism & Mechanical Effect | Zero-Sum Trade-Off |
| :--- | :---: | :--- | :--- | :--- |
| **Crafted** (`1G`) | `CONTACT` | **Narrow Bodkin Point** | Needle-tapered four-sided point: sets `damageType` to **`Pierce`** and ignores **`+5` Armor `THR`**. | **`-20%` sweep/cleave damage** |
| **Crafted** (`1G`) | `CONTACT` | **Blunt Coronal Tourney Head** | Broad three-pronged blunt steel crown: converts `damageType` from `Pierce` → **`Impact`** with **`+25%` Impulse ($J$)** & **`+15%` `DUR` shred**. | **`-4` Armor `THR` penetration** |
| **Crafted** (`1G`) | `DELIVERY` | **Fluted Ashwood Shaft** | Longitudinal grooves lighten shaft inertia: **`+12%` thrust tempo**, **`-2 WT`**. | **`-4` Stability ($S$)** |
| **Crafted** (`1G`) | `DELIVERY` | **Telescoping Spring Haft** *(Action 1 Parametric)* | Pneumatic inner core extends **Action 1 thrust reach by `+22%`** on the final combo step. | **`-4` Stability ($S$)** while extended |
| **Crafted** (`1G`) | `REGULATION` | **Bronze Sauroter Spike** | Counter-balanced butt-spike stabilizes long reach: **`+5` Stability ($S$)** & **`+15%` swap speed**. | **`+3 WT`** |
| **Looted** (`1–3G`) | `CONTACT` | **Crescent Hook-Lugs** | Curved side blades behind the head snag guards: strips **`-20%` target directional charge ($\mu$)** on hit. | **`+2 WT`**, **`-6%` tempo** |
| **Looted** (`1–3G`) | `DELIVERY` | **Iron-Shod War Haft** | Steel-sleeved shaft resists deflection: **`+25%` Directional Charge ($\mu$)** bonus when gliding forward. | **`+4 WT`** |
| **Looted** (`1–3G`) | `REGULATION` | **Boar-Stop Crossbar** | Heavy cross-lug halts rushing targets: **`+35%` Impulse ($J$)** against charging enemies. | **`-12%` swap speed** |

---

### 3.5 Bows (8 Components)

*Compatible Functional Types: `Self Bow`, `Short Bow`, `Flat Bow`, `Recurve Bow`, `Reflex Bow`, `Composite Bow`, `Long Bow`, `Compound Bow`, `Great Bow`.*

| Source | Domain | Component Name | Physical Mechanism & Mechanical Effect | Zero-Sum Trade-Off |
| :--- | :---: | :--- | :--- | :--- |
| **Crafted** (`1G`) | `CONTACT` | **Reflex Recurve Tips** | Outward-curved limb tips accelerate early draw: **`-15%` Action 1 draw time** (faster snap-shots). | **`-15%` max projectile range** |
| **Crafted** (`1G`) | `CONTACT` | **Blunt Stun-Shaft Limbs & Shelf** | Calibrates stave and shelf for heavy blunt shock-bolts: converts `damageType` from `Pierce` → **`Impact`** with **`+30%` Ranged Impulse ($J_{\text{ranged}}$)**. | **`-20%` max range**, **`-3` `THR` pierce** |
| **Crafted** (`1G`) | `DELIVERY` | **Pre-Stressed Sinew Cord** | High-tension string transfers cleaner snap: **`+15%` projectile velocity & Ranged Impulse ($J_{\text{ranged}}$)**. | **`+2` Reactor Heat** per draw |
| **Crafted** (`1G`) | `REGULATION` | **Weighted Center Riser** | Mass centered in the grip dampens bow hand jump: **`-30%` ranged recoil**, **`+3` Stability ($S$)**. | **`+3 WT`** |
| **Looted** (`1–3G`) | `CONTACT` | **Heavy Laminate War-Limbs** | High-poundage stave drives heavy bodkin shafts: **`+6` Armor `THR` penetration** at full draw. | **`+18%` draw time**, **`+3 WT`** |
| **Looted** (`1–3G`) | `DELIVERY` | **Twin-Cam Pulley Rig** | Mechanical cams let off holding tension at peak draw: **`-60%` draw-hold energy/heat drain**. | **`+2 WT`**, **`-10%` swap speed** |
| **Looted** (`1–3G`) | `DELIVERY` | **Gravity-Feed Repeating Box** *(Action 1 Behavioral)* | Top-mounted cassette turns Action 1 into a **3-arrow rapid burst** on tap (replaces full-charge draw). | **`-25%` per-arrow `BCU` & range**, **`+3 WT`** |
| **Looted** (`1–3G`) | `REGULATION` | **Harmonic Dampener Rod** | Forward-mounted vibration absorber: eliminates aim sway while moving at full draw. | **`+2 WT`** |

---

### 3.6 Casters (9 Components)

*Compatible Functional Types: `Bolt Caster`, `Beam Caster`, `Arc Caster`, `Pulse Caster`, `Wave Caster`, `Blast Caster`, `Nova Caster`, `Meteoric Caster`, `Stellar Caster`.*

| Source | Domain | Component Name | Physical Mechanism & Mechanical Effect | Zero-Sum Trade-Off |
| :--- | :---: | :--- | :--- | :--- |
| **Crafted** (`1G`) | `CONTACT` | **Choke Collimator Nozzle** | Narrows emitter aperture: **`-30%` spread** & **`+15%` effective range**. | **`-15%` AoE / beam width** |
| **Crafted** (`1G`) | `CONTACT` | **Concussive Pulse Chamber-Barrel** | Acoustic compression tube: converts `damageType` to **`Pulse`** with **`+20%` Layer 1 Shield damage**. | **`-20%` effective range** |
| **Crafted** (`1G`) | `DELIVERY` | **Extended Drum Magazine** *(Action 1 Parametric)* | High-capacity rotary ether cell increases Action 1 **`ammoCount` by `+50%`**. | **`+3 WT`**, **`+20%` tactical reload/vent time** |
| **Crafted** (`1G`) | `DELIVERY` | **Cyclic Capacitor Chamber** | Faster discharge cycling: **`+12%` fire rate / tick tempo**. | **`+15%` Reactor Heat** per shot |
| **Crafted** (`1G`) | `REGULATION` | **Finned Heat-Sink Shroud** | Radiating fins bleed barrel heat: **`-20%` Reactor Heat** generated per shot. | **`+3 WT`** |
| **Looted** (`1–3G`) | `CONTACT` | **Wide Scatter Diffuser** | Flared emitter disperses energy across a wide front: **`+35%` projectile/wave width** & **`+15%` Shield damage**. | **`-25%` effective range** |
| **Looted** (`1–3G`) | `CONTACT` | **Tri-Prism Splitter Nozzle** *(Action 1 Behavioral)* | Splits single-bolt Action 1 into a **3-bolt horizontal fan (`3 × 0.45× BCU`)**. | **`-25%` range**, **`+2` Reactor Heat** per shot |
| **Looted** (`1–3G`) | `DELIVERY` | **Overclocked Induction Coil** | Supercharges discharge pulse: **`+20%` `BCU` scaling** & **`+20%` Ranged Impulse ($J_{\text{ranged}}$)**. | **`+25%` Reactor Heat**, **`-10%` tempo** |
| **Looted** (`1–3G`) | `REGULATION` | **Magnetic Recoil Stock** | Shoulder-braced damper absorbs kickback: **`-45%` Ranged Recoil** & **`+4` Stability ($S$)**. | **`+4 WT`**, **`+15%` swap time** |

---

### 3.7 Shields (7 Components)

*Compatible Functional Types: `Buckler`, `Heater`, `Tower`, `Norman`, `Scutum`, `Corona`, `Mote`, `Disc`, `Rhom`.*
*(Only weapon class permitted to modify Layer 2 Armor stats per Physical Domain Separation).*

| Source | Domain | Component Name | Physical Mechanism & Mechanical Effect | Zero-Sum Trade-Off |
| :--- | :---: | :--- | :--- | :--- |
| **Crafted** (`1G`) | `CONTACT` | **Hardened Rim Band** | Steel-reinforced outer perimeter resists chipping: **`+25` Shield Durability (`DUR`)** & **`+2` `THR`**. | **`+3 WT`** |
| **Crafted** (`1G`) | `DELIVERY` | **Forearm Enarme Straps** | Dual-strap bracing locks shield to forearm: **`+6` Stability ($S$)** while guarding. | **`+15%` weapon swap time** |
| **Crafted** (`1G`) | `REGULATION` | **Lightened Core Backing** | Fluted inner framing trims dead weight: **`-3 WT`** & **`+10%` guard-raise speed**. | **`-20` Shield Durability (`DUR`)** |
| **Looted** (`1–3G`) | `CONTACT` | **Spiked Impact Boss** | Conical steel center-boss turns blocks into strikes: **`+30%` Shield Bash/Charge `BCU` & Impulse ($J$)**. | **`+2 WT`** |
| **Looted** (`1–3G`) | `CONTACT` | **Capacitor Rim Emitter** *(Action 1 Behavioral)* | Edge-mounted discharge ring converts **Action 1 Shield Bash** to **`Pulse`** (`+20%` Shield damage & stun jolt). | **`-15` Shield Durability (`DUR`)** |
| **Looted** (`1–3G`) | `DELIVERY` | **Pivot Center-Grip Boss** | Single-hand central grip enables active deflection: **`+0.05s` Action 4 Perfect Block window**. | **`-5` Stability ($S$)** on heavy hits |
| **Looted** (`1–3G`) | `REGULATION` | **Reactive Vent Lattice** | Channels absorbed kinetic shock into cooling vents: blocking vents **`-4` Reactor Heat** per hit. | **`-2` Armor Rating (`RTG`)** |

---

### 3.8 Carriers & Munitions (7 Components)

*Compatible Functional Types: `Bandolier`, `Quiver`, `Yebira`, `Battery`, `Sheaf`, `Rack`, `Plumbata`, `Kaad`, `Pangao`.*

| Source | Domain | Component Name | Physical Mechanism & Mechanical Effect | Zero-Sum Trade-Off |
| :--- | :---: | :--- | :--- | :--- |
| **Crafted** (`1G`) | `CONTACT` | **Armor-Piercing Sabot Pack** | Hardened penetrator cores inside munitions: sets `damageType` to **`Pierce`** and ignores **`+5` Armor `THR`**. | **`-15%` blast/splash radius** |
| **Crafted** (`1G`) | `DELIVERY` | **Quick-Draw Tension Latch** | Spring-assisted release clips speed extraction: **`-20%` salvo reload/cycle cooldown**. | **`+2` Reactor Heat** per cycle |
| **Crafted** (`1G`) | `DELIVERY` | **Dual-Feed Hopper** *(Action 1 Parametric)* | Parallel feed chute increases Action 1 / basic munition volley count by **`+1` projectile per burst**. | **`+3 WT`**, **`+15%` cycle cooldown** |
| **Crafted** (`1G`) | `REGULATION` | **Blast-Dampened Housing** | Padded internal baffles absorb recoil kick: **`-35%` salvo recoil** & **`+3` Stability ($S$)**. | **`+3 WT`** |
| **Looted** (`1–3G`) | `CONTACT` | **Concussive Shock-Charge** | High-impulse secondary primer: converts `damageType` to **`Impact`** (or **`Blast`** on Racks) with **`+30%` Ranged Impulse ($J_{\text{ranged}}$)**. | **`-15%` projectile velocity** |
| **Looted** (`1–3G`) | `DELIVERY` | **Rotary Indexing Feed** | Automated drum feeder cycles back-mount munitions: **`+15%` salvo fire cadence**. | **`+3 WT`**, **`+10%` heat** |
| **Looted** (`1–3G`) | `REGULATION` | **Counter-Balanced Frame** | Redistributes dorsal/hip carrier mass onto chassis: **`-4 WT` effective load** & **`+12%` swap speed**. | **`-1` internal ammo capacity** |

---

## 4. TypeScript Data Schema & Runtime Resolution Rules

The schema below guarantees compile-time and runtime enforcement of every architectural rule (strict `CRAFTED` vs. `LOOTED` isolation, domain uniqueness, `damageType` determinism, and Action 1 mode safety):

```ts
export type WeaponClass =
  | 'Shields'
  | 'Bows'
  | 'Casters'
  | 'Spears'
  | 'Impact & Axes'
  | 'Blades: Curved'
  | 'Blades: Straight'
  | 'Carriers & Munitions';

export type DamageType = 'Pierce' | 'Impact' | 'Beam' | 'Pulse' | 'Wave' | 'Blast';
export type ModDomain = 'CONTACT' | 'DELIVERY' | 'REGULATION';
export type Action1Mode = 'MAGAZINE' | 'DRAW_CHARGE' | 'MELEE_COMBO' | 'BURST_VOLLEY';

export interface CraftingRecipe {
  scrapCost: number;
  gemstoneType:
    | 'Moonstone'
    | 'Spinel'
    | 'Carnelian'
    | 'Titanite'
    | 'Demantoid'
    | 'Kyanite'
    | 'Charoite'
    | 'Rubellite'
    | 'Hematite';
  gemstoneCount: number;
}

export interface Action1Override {
  kind: 'PARAMETRIC' | 'BEHAVIORAL';
  requiresMode?: Action1Mode;
  setsMode?: Action1Mode;
  ammoMultiplier?: number;          // e.g., 1.50 for +50% magazine
  reloadTimeMultiplier?: number;    // e.g., 1.20 for +20% reload time
  volleyBonusCount?: number;        // e.g., +1 projectile per burst
  comboStepCountOverride?: number;  // e.g., 3-step draw-cut chain
  finisherReachMultiplier?: number; // e.g., 1.22 for +22% reach
  secondaryProjectile?: {
    damageType: DamageType;
    bcuScale: number;
    rangeMeters: number;
    triggerStep: 'STEP_1' | 'FINISHER' | 'EVERY_SHOT';
  };
}

export type WeaponComponentMod =
  | {
      id: string;
      name: string;
      weaponClass: WeaponClass;
      domain: ModDomain;
      acquisitionSource: 'CRAFTED';
      maxGemSlots: 1;
      recipe: CraftingRecipe; // Required for CRAFTED; never in loot tables
      damageTypeOverride?: DamageType; // Allowed ONLY when domain === 'CONTACT'
      action1Override?: Action1Override;
      statModifiers: Record<string, number>;
      tradeOffSummary: string;
    }
  | {
      id: string;
      name: string;
      weaponClass: WeaponClass;
      domain: ModDomain;
      acquisitionSource: 'LOOTED';
      maxGemSlots: 1 | 2 | 3;
      recipe: null; // Forbidden for LOOTED; cannot be crafted
      damageTypeOverride?: DamageType; // Allowed ONLY when domain === 'CONTACT'
      action1Override?: Action1Override;
      statModifiers: Record<string, number>;
      tradeOffSummary: string;
    };
```

### Runtime Resolution Order (Deterministic Evaluation)

1. **Validate Installation**: Confirm `mod.weaponClass === weapon.weaponClass`, no other installed slot shares `mod.domain`, and at most one installed mod defines `action1Override?.kind === 'BEHAVIORAL'`.
2. **Resolve Effective Damage Type**:
   $$\text{effectiveDamageType} = \text{contactMod?.damageTypeOverride} \ ?? \ \text{weapon.baseDamageType}$$
3. **Accumulate Stats & Clamp Tempo**: Sum weight (`WT`), `THR` penetration, `DUR` shred, `Impulse (J)`, `Stability (S)`, `Reactor Heat`, and `Action 1` parametric modifiers across all populated slots (`1..3`), then clamp total combat tempo strictly to **`[0.70, 1.30]`**.
4. **Generate Semantic Display Name**: Count populated slots $k \in \{0, 1, 2, 3\}$:
   - $k = 0 \rightarrow \text{BaseName}$
   - $k = 1 \rightarrow \text{Custom } \langle\text{BaseName}\rangle$
   - $k = 2 \rightarrow \text{Custom } \langle\text{BaseName}\rangle \text{ +II}$
   - $k = 3 \rightarrow \text{Custom } \langle\text{BaseName}\rangle \text{ +III}$