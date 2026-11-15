# PROJECT ORION — SPECIALIST FEATS & STANCES

**Design Draft v0.2**  
**Status:** Complete Canonical Specification / Ready for Engine Implementation  
**Scope:** 72 Custom weapons (`3S`) across 8 Weapon Classes (`README (1).md` aligned)

---

## 📑 Table of Contents

1. **[Design Intent & Governing Principles](#1-design-intent--governing-principles)**
2. **[System Terminology & Architecture](#2-system-terminology--architecture)**
3. **[Specialist Feat Categories](#3-specialist-feat-categories)**
4. **[Current Weapon Roster (72 Custom Weapons)](#4-current-weapon-roster-72-custom-weapons)**
5. **[Master Specialist Feat Register (22 Doctrines)](#5-master-specialist-feat-register-22-doctrines)**
6. **[Complete Specialist Feat Specifications (22 Data Blocks)](#6-complete-specialist-feat-specifications-22-data-blocks)**
7. **[Caster & Munitions Integration Matrix](#7-caster--munitions-integration-matrix)**
8. **[Weapon Overlap & Multi-Doctrine Matrix](#8-weapon-overlap--multi-doctrine-matrix)**
9. **[Stance Mechanics & Engine Physics Rules](#9-stance-mechanics--engine-physics-rules)**
10. **[Standalone Weapons & Exclusion Audit](#10-standalone-weapons--exclusion-audit)**
11. **[Resolved Design Rules (Engine Integration)](#11-resolved-design-rules-engine-integration)**
12. **[Implementation Roadmap](#12-implementation-roadmap)**

---

## 1. Design Intent & Governing Principles

**Specialist Feats** represent learned combat doctrines. They allow a Pilot to operate particular weapons, or asymmetric combinations of weapons and carriers, in a specialized manner.

The system is **equipment-driven rather than class-driven**. A Pilot does not select a weapon class or combat profession; instead, the Pilot invests Gemstones into Combat Disciplines to unlock Specialist Feats and equips valid weapon combinations in the `LOADOUT` Mech Doll to activate their **Specialist Stances**.

Historical weapon systems provide the foundation for Specialist Feats, while Project Orion extends those doctrines to mechanically compatible pairings and magitech/carrier configurations that were not historically standardized.

### 1.1 Governing Principles

1. **Doctrines Over Combos:** Specialist Feats represent combat doctrines, not isolated button macros.
2. **Feat-to-Stance Link:** A Specialist Feat permanently unlocks its associated Specialist Stance.
3. **Equipment Activation:** The stance becomes available in combat when the Pilot equips a valid weapon combination and selects the required grip (`1H`, `2H`, or `Dual-Wield`).
4. **Multi-Combination Support:** A single Specialist Feat may support multiple valid weapon pairings.
5. **Multi-Feat Qualification:** A single weapon may qualify for multiple Specialist Feats depending on what is paired with it.
6. **Historical Foundation:** Historical pairings are preferred where appropriate, but historical accuracy does not restrict gameplay possibilities.
7. **Orion-Specific Extensions:** Mechanically compatible, nonhistorical combinations are permitted when clearly labeled as Orion-expanded doctrines.
8. **Standalone Doctrines:** Some Specialist Feats enhance a single weapon (`1H` or `2H`) without requiring a second weapon.
9. **Intentional Exclusions:** Some weapons require no Specialist Feat or pairing and remain complete as standalone baseline gear.
10. **Earned Dual-Wielding:** Equipping two weapons does not automatically grant dual-wielding capabilities; asymmetric paired movesets require an active Specialist Stance (or matching-weapon `Twin-Link` feats).

---

## 2. System Terminology & Architecture

| Term | Definition |
| :--- | :--- |
| **Weapon Class** | One of the 8 functional categories (`Shields`, `Bows`, `Casters`, `Spears`, `Impact & Axes`, `Blades: Curved`, `Blades: Straight`, `Carriers & Munitions`). |
| **Weapon** | An individual Custom equipment item (`3S` component/gem slots) with its own damage type, weight (`WT`), and base 5-action moveset. |
| **Pairing** | Two compatible weapons (or a weapon + carrier) equipped in `Main Hand` and `Side Hand` within the same Weapon Set. |
| **Specialist Feat** | Permanent learned doctrine unlocked via Combat Disciplines (`Tiers I–IV`) that authorizes a Specialist Stance. |
| **Specialist Stance** | The active combat state enabled by a Specialist Feat and valid equipped hardware, remapping `Action 2`, `Action 4`, and `Action 5`. |
| **Doctrine** | The underlying method of fighting, spacing, and physics manipulation associated with a stance. |
| **Prerequisite Feat** | Discipline tier or foundational feat required before a Specialist Feat can be socketed. |
| **Weapon Requirement** | The exact `Main Hand`, `Side Hand`, and `Grip` configuration required to activate a stance. |

### 2.1 Dependency Chain

```
WEAPONS (Main Hand + Side Hand)
   │
   ▼
WEAPON PAIRING / GRIP CHECK
   │
   ▼
SPECIALIST FEAT (Permanent Pilot Knowledge)
   │
   ▼
SPECIALIST STANCE (Active Combat State)
   │
   ▼
COMBAT DOCTRINE (Action 2 / Action 4 / Action 5 Overrides + Physics Modifiers)
```

### 2.2 Feat vs. Stance vs. Equipment

* **Feat (Permanent Knowledge):** e.g., *Daishō Specialist*. Retained permanently in the Pilot's feat pool (and 100% refundable if unsocketed).
* **Stance (Active Combat State):** e.g., *Daishō Stance*. Automatically engages when valid equipment is active in the current Weapon Set (`Set 1` or `Set 2`).
* **Equipment (Triggering Hardware):** e.g., *Katana + Wakizashi*. Swapping to a non-qualifying Weapon Set cleanly deactivates the stance without removing the feat.

---

## 3. Specialist Feat Categories

| Code | Category | Definition | Canonical Examples |
| :---: | :--- | :--- | :--- |
| **A** | **Historical Pairing** | Recognizable historical two-weapon fighting system. | *Daishō*, *Sword & Buckler*, *Sword & Shield*, *Spear & Shield* |
| **B** | **Historical Weapon Doctrine** | Fighting method built around a single iconic weapon or family (`1H` or `2H`). | *Pike*, *Longbow*, *Great Blade*, *Falx*, *Shotel*, *Khopesh* |
| **C** | **Functional Pairing** | Weapons and carriers paired because their mechanics complement one another. | *Spear & Buckler*, *Hammer & Buckler*, *Battery Conduit*, *Heavy Ordnance* |
| **D** | **Orion-Specific Doctrine** | Magitech-era expansions sharing combat methodology without historical standardization. | *Odachi + Katana (Iaido)*, *Consecrated Lash (Kaad)*, *Sapper (Pangao)* |

---

## 4. Current Weapon Roster (72 Custom Weapons)

All 72 weapons below are **Custom** weapons featuring **3 non-sequential Component & Gem Slots (`3S`)** in the Armory Workbench. Damage types and weights (`WT`) are reference data from `README (1).md`.

### 4.1 Shields (9)
| Weapon | Damage | Weight |
| :--- | :---: | :---: |
| Buckler | Impact | `5 WT` |
| Heater | Impact | `10 WT` |
| Tower | Impact | `22 WT` |
| Norman | Impact | `13 WT` |
| Scutum | Impact | `19 WT` |
| Corona | Beam | `11 WT` |
| Mote | Pulse | `6 WT` |
| Disc | Wave | `7 WT` |
| Rhom | Beam | `18 WT` |

### 4.2 Bows (9)
| Weapon | Damage | Weight |
| :--- | :---: | :---: |
| Self Bow | Pierce | `5 WT` |
| Short Bow | Pierce | `6 WT` |
| Flat Bow | Pierce | `9 WT` |
| Recurve Bow | Pierce | `10 WT` |
| Reflex Bow | Pierce | `7 WT` |
| Composite Bow | Pierce | `11 WT` |
| Long Bow | Pierce | `16 WT` |
| Compound Bow | Pierce | `13 WT` |
| Great Bow | Pierce | `20 WT` |

### 4.3 Casters (9)
| Weapon | Damage | Weight |
| :--- | :---: | :---: |
| Bolt Caster | Pierce | `6 WT` |
| Beam Caster | Beam | `10 WT` |
| Arc Caster | Pulse | `7 WT` |
| Pulse Caster | Pulse | `10 WT` |
| Wave Caster | Wave | `12 WT` |
| Blast Caster | Blast | `13 WT` |
| Nova Caster | Wave | `16 WT` |
| Meteoric Caster | Blast | `18 WT` |
| Stellar Caster | Beam | `21 WT` |

### 4.4 Spears (9)
| Weapon | Damage | Weight |
| :--- | :---: | :---: |
| Short Spear | Pierce | `7 WT` |
| Winged Spear | Pierce | `10 WT` |
| Javelin | Pierce | `6 WT` |
| Spetum | Pierce | `12 WT` |
| Broad Spear | Pierce | `13 WT` |
| Partisan | Pierce | `14 WT` |
| Pike | Pierce | `18 WT` |
| Boar Spear | Pierce | `16 WT` |
| Lance | Impact | `21 WT` |

### 4.5 Impact & Axes (9)
| Weapon | Damage | Weight |
| :--- | :---: | :---: |
| Cudgel | Impact | `6 WT` |
| Mace | Impact | `11 WT` |
| Spike | Pierce | `8 WT` |
| Hammer | Impact | `14 WT` |
| Mallet | Impact | `20 WT` |
| Tomahawk | Pierce | `7 WT` |
| Parashu | Pierce | `13 WT` |
| Labrys | Impact | `17 WT` |
| Battle Axe | Impact | `19 WT` |

### 4.6 Blades: Curved (9)
| Weapon | Damage | Weight |
| :--- | :---: | :---: |
| Wakizashi | Pierce | `5 WT` |
| Katana | Pierce | `10 WT` |
| Khopesh | Pierce | `8 WT` |
| Shotel | Pierce | `8 WT` |
| Odachi | Pierce | `17 WT` |
| Kilij | Pierce | `11 WT` |
| Falx | Pierce | `15 WT` |
| Dao | Pierce | `12 WT` |
| Dadao | Impact | `18 WT` |

### 4.7 Blades: Straight (9)
| Weapon | Damage | Weight |
| :--- | :---: | :---: |
| Cinquedea | Pierce | `5 WT` |
| Spatha | Pierce | `9 WT` |
| Falchion | Pierce | `10 WT` |
| Arming Sword | Pierce | `10 WT` |
| Bastard Sword | Pierce | `13 WT` |
| Messer | Pierce | `12 WT` |
| Zweihander | Impact | `18 WT` |
| Flamberge | Pierce | `17 WT` |
| Executioner Sword | Impact | `21 WT` |

### 4.8 Carriers & Munitions (9)
| Weapon | Damage | Weight |
| :--- | :---: | :---: |
| Bandolier | Impact | `6 WT` |
| Quiver | Pierce | `5 WT` |
| Yebira | Pierce | `8 WT` |
| Battery | Pulse | `13 WT` |
| Sheaf | Pierce | `7 WT` |
| Rack | Blast | `14 WT` |
| Plumbata | Pierce | `6 WT` |
| Kaad | Wave | `6 WT` |
| Pangao | Blast | `11 WT` |

---

## 5. Master Specialist Feat Register (22 Doctrines)

Overlapping draft candidates (*Great Blade* + *Great Sword*, *Shield Wall* + *Hoplite*, and *War Hammer* + *Hammer & Buckler*) have been deduplicated into **22 distinct, non-redundant Specialist Feats**:

| # | Specialist Feat | Category | Discipline & Tier | Weapon Requirement (`Main Hand` + `Side Hand`) | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | **Daishō Specialist** | A / D | Warrior / Rogue (`Tier II`) | `Katana` + `Wakizashi` *(or `Odachi` + `Katana`/`Wakizashi`)* | Accepted |
| **2** | **Sword & Buckler Specialist** | A | Warrior / Guardian (`Tier I`) | `1H Straight Blade` + `Buckler` *(or `Mote`/`Disc`)* | Accepted |
| **3** | **Sword & Shield Specialist** | A | Guardian / Warrior (`Tier I`) | `1H Straight Blade` + `Heater`/`Norman`/`Scutum`/`Tower` | Accepted |
| **4** | **Spear & Shield Specialist** | A / C | Guardian / Warrior (`Tier II`) | `1H Spear` + `Heater`/`Norman`/`Scutum`/`Tower` | Accepted |
| **5** | **Spear & Buckler Specialist** | C | Rogue / Warrior (`Tier I`) | `Short Spear` or `Javelin` + `Buckler` | Accepted |
| **6** | **Phalanx Specialist** | A | Guardian / Marauder (`Tier III`) | `Pike`/`Partisan`/`Broad`/`Boar`/`Winged Spear` + `Scutum`/`Tower`/`Norman` | Accepted |
| **7** | **Pike Specialist** | B | Warrior / Marauder (`Tier II`) | `Pike` (`2H`, empty `Side Hand`) | Accepted |
| **8** | **Longbow Specialist** | B | Warrior / Rogue (`Tier II`) | `Long Bow` or `Great Bow` (`2H` or + `Yebira`) | Accepted |
| **9** | **Archer / Quiver Specialist** | C | Rogue / Warrior (`Tier I`) | Any `Bow` + `Quiver`, `Yebira`, or `Sheaf` | Accepted |
| **10** | **Skirmisher Specialist** | A / C | Rogue (`Tier I`) | `Javelin` or `Plumbata` + `Buckler` or `Bandolier` | Accepted |
| **11** | **Axe & Shield Specialist** | C | Warrior / Marauder (`Tier II`) | `Tomahawk`/`Parashu`/`Labrys`/`Battle Axe` (`1H`) + `Buckler`/`Heater`/`Norman`/`Scutum` | Accepted |
| **12** | **Great Axe Specialist** | B | Marauder (`Tier II`) | `Battle Axe` or `Labrys` (`2H`, empty `Side Hand`) | Accepted |
| **13** | **Mace & Shield Specialist** | A / C | Guardian / Cleric (`Tier I`) | `Mace` + `Heater`, `Norman`, or `Scutum` | Accepted |
| **14** | **Bludgeon & Trauma Specialist** | B / C | Marauder / Warrior (`Tier II`) | `Hammer` or `Mace` (`1H`/`2H` or + `Buckler`) | Accepted |
| **15** | **Tomahawk Specialist** | A / C | Rogue / Marauder (`Tier I`) | `Tomahawk` + `Buckler` or `Bandolier` | Accepted |
| **16** | **Falx Specialist** | B | Marauder / Warrior (`Tier II`) | `Falx` (`2H`, empty `Side Hand`) | Accepted |
| **17** | **Shotel Specialist** | B | Rogue / Warrior (`Tier II`) | `Shotel` (`1H` or + `Buckler`) | Accepted |
| **18** | **Khopesh Specialist** | B | Warrior / Guardian (`Tier I`) | `Khopesh` (`1H` or + `Buckler`) | Accepted |
| **19** | **Eastern Saber Specialist** | C / D | Warrior / Rogue (`Tier II`) | `Kilij`, `Dao`, or `Dadao` (`2H` or paired `Kilij + Dao` / `Dao + Dadao`) | Accepted |
| **20** | **Great Blade Specialist** | B / C | Marauder / Warrior (`Tier II`) | `Odachi`, `Zweihander`, `Flamberge`, `Executioner Sword`, or `Bastard Sword` (`2H`) | Accepted |
| **21** | **Battery Conduit Specialist** | C | Wizard / Cleric (`Tier II`) | `Beam`/`Arc`/`Pulse`/`Wave`/`Nova`/`Stellar Caster` + `Battery` | Accepted |
| **22** | **Ordnance & Munitions Specialist** | C / D | Marauder / Wizard (`Tier II`) | `Blast`/`Meteoric Caster` + `Rack`; `Bolt Caster` + `Sheaf`; or `Pangao`/`Kaad` pairings | Accepted |

---

## 6. Complete Specialist Feat Specifications (22 Data Blocks)

### 6.1 Daishō Specialist
* **Category:** Historical Pairing (`A`) / Orion-Expanded Doctrine (`D`) | **Status:** Accepted
* **Historical Reference:** Samurai paired long and short blades (*katana* and *wakizashi*), expanded in Orion to include *ōdachi* draw-transitions.
* **Combat Identity:** Asymmetric paired-blade discipline uniting long-reach cutting sweeps with close-quarters parries and zero-recovery draw transitions.
* **Weapon Requirements:**
  * *Standard Dual-Wield:* `Katana` (`Main Hand`) + `Wakizashi` (`Side Hand`), or reversed (`Wakizashi` + `Katana`).
  * *Orion-Expanded Iaido:* `Odachi` (`Main Hand`, `2H`) + `Katana` or `Wakizashi` (`Side Hand`, sheathed).
* **Prerequisites:** `Warrior` or `Rogue` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * `Action 2` (`[X]` Alt): Weaves rapid `Wakizashi` close-range thrusts that cancel `Katana` recovery frames.
  * `Action 4` (`[Y]` Guard): Crosses both blades, widening the perfect parry window from `0.25s` to `0.32s` against melee strikes.
  * `Action 5` (`[R]` Off-Hand): Executes an instant `Wakizashi`/`Katana` draw-cut during `Odachi` recovery without triggering the `5.0s` Weapon Swap cooldown.
* **Restrictions:** Identical blades (`Katana + Katana`) route to `Main Weapon Twin-Link`. Disabled if `Overloaded` (`>100% WT`).

---

### 6.2 Sword & Buckler Specialist
* **Category:** Historical Pairing (`A`) | **Status:** Accepted
* **Historical Reference:** Medieval European I.33 sword-and-buckler fencing traditions.
* **Combat Identity:** Mobile, aggressive close-quarters fencing where an active center-grip shield intercepts incoming blades and opens immediate ripostes.
* **Weapon Requirements:** `Main Hand`: `Cinquedea`, `Spatha`, `Falchion`, `Arming Sword`, `Bastard Sword` (`1H`), or `Messer` | `Side Hand`: `Buckler` (or energy bucklers `Mote` / `Disc`).
* **Prerequisites:** `Warrior` or `Guardian` Discipline `Lv 2` (`Tier I`).
* **Stance Mechanics:**
  * `Action 4` (`[Y]` Guard): Perfect parries (`0.25s` window) apply a `0.45s` micro-stagger to the attacker and negate incoming melee impulse (`J_melee`).
  * `Action 2` (`[X]` Alt after Parry): Follows a deflection with a centerline thrust ignoring `50%` of target Armor Threshold (`THR`).
  * `Action 5` (`[R]` Off-Hand): Iron-boss punch (`Impact`) dealing high Stability (`S`) disruption to open enemy guards.
* **Restrictions:** Larger shields (`Heater`, `Norman`, `Scutum`, `Tower`) route to *Sword & Shield Specialist*.

---

### 6.3 Sword & Shield Specialist
* **Category:** Historical Pairing (`A`) | **Status:** Accepted
* **Historical Reference:** Classical cavalry and infantry sword-and-shield systems.
* **Combat Identity:** Balanced frontline offense and directional protection where shield mass governs mobility vs. impact absorption.
* **Weapon Requirements:** `Main Hand`: `Spatha`, `Falchion`, `Arming Sword`, `Bastard Sword` (`1H`), or `Messer` | `Side Hand`: `Heater`, `Norman`, `Scutum`, or `Tower`.
* **Prerequisites:** `Guardian` or `Warrior` Discipline `Lv 2` (`Tier I`).
* **Stance Mechanics:**
  * `Action 2` (`[X]` Alt): Shield-check combo finisher that transitions directly into raised guard (`Action 4`) with zero recovery gap.
  * `Action 4` (`[Y]` Guard): Increases directional guard angle by `+25°` and reduces chip damage through Layer 1 Shields.
  * `Action 5` (`[R]` Off-Hand): Forward shield slam scaling push impulse (`J_melee`) with shield weight (`Heater` `10 WT` → `Tower` `22 WT`).
* **Restrictions:** `Tower` (`22 WT`) and `Scutum` (`19 WT`) impose `-10%` lateral strafe speed while guarding.

---

### 6.4 Spear & Shield Specialist
* **Category:** Historical Pairing (`A`) / Functional Pairing (`C`) | **Status:** Accepted
* **Historical Reference:** Infantry spear-and-shield formations across antiquity and medieval warfare.
* **Combat Identity:** Mid-line zone control allowing protected overhand/underhand thrusts from behind a physical shield wall.
* **Weapon Requirements:** `Main Hand`: `Short Spear`, `Winged Spear`, `Spetum`, `Broad Spear`, `Partisan`, or `Boar Spear` (`1H`) | `Side Hand`: `Heater`, `Norman`, `Scutum`, or `Tower`.
* **Prerequisites:** `Guardian` or `Warrior` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * `Action 1` (while holding `Action 4` Guard): Performs guarded spear thrusts without dropping frontal shield coverage (`-15%` attack tempo).
  * `Action 2` (`[X]` Alt): Hook-and-pull sweep (`Spetum` / `Winged Spear` bonus) that reduces target Directional Charge (`μ`) to `0`.
  * `Action 5` (`[R]` Off-Hand): Anti-charge brace; doubles Directional Charge mass (`μ`) against frontal dash attackers.
* **Restrictions:** Excludes `Pike` and `Lance` unless *Phalanx Specialist* is socketed.

---

### 6.5 Spear & Buckler Specialist
* **Category:** Functional Pairing (`C`) | **Status:** Accepted
* **Historical Reference:** Light skirmisher and duelist buckler-spear techniques.
* **Combat Identity:** High-mobility skirmishing combining swift reach pokes with active buckler deflections and disengage footwork.
* **Weapon Requirements:** `Main Hand`: `Short Spear` or `Javelin` (`1H`) | `Side Hand`: `Buckler`.
* **Prerequisites:** `Rogue` or `Warrior` Discipline `Lv 2` (`Tier I`).
* **Stance Mechanics:**
  * `Action 2` (`[X]` Alt): Lunging thrust followed by an automatic backward hop (`disengage`) that preserves forward facing.
  * `Action 4` (`[Y]` Guard): Allows full glide speed (`100%` movement) while holding buckler guard.
  * `Action 5` (`[R]` Off-Hand): Deflecting bash that resets `Javelin` throw readiness or chains into a rapid double-thrust.
* **Restrictions:** Requires `Light` or `Medium` Load Bracket (`<= 65% WT`).

---

### 6.6 Phalanx Specialist
* **Category:** Historical Weapon Doctrine (`B`) | **Status:** Accepted
* **Historical Reference:** Hellenic hoplite phalanx and Roman testudo/shield-wall formations.
* **Combat Identity:** Heavy anchored formation doctrine trading lateral agility for extreme frontal Stability (`S`) and anti-charge supremacy.
* **Weapon Requirements:** `Main Hand`: `Pike`, `Partisan`, `Broad Spear`, `Boar Spear`, or `Winged Spear` | `Side Hand`: `Scutum`, `Tower`, or `Norman`.
* **Prerequisites:** `Guardian` or `Marauder` Discipline `Lv 9` (`Tier III`).
* **Stance Mechanics:**
  * `Action 4` (`[Y]` Guard): Locks chassis into **Phalanx Anchor**, adding `+35` effective Stability (`S`) against frontal attacks and projecting a `2.5m` cover arc for adjacent allies.
  * `Action 1` (while anchored): Executes braced long-reach thrusts through the shield's notch without lowering guard.
  * `Action 5` (`[R]` Off-Hand): Coordinated shield-wall advance (`1.2s` slow march) with full frontal stagger immunity.
* **Restrictions:** Reduces turn rate by `-35%` and lateral glide speed by `-25%` while anchored; flank/rear hits bypass bonus Stability (`S`).

---

### 6.7 Pike Specialist
* **Category:** Historical Weapon Doctrine (`B`) | **Status:** Accepted
* **Historical Reference:** Renaissance Swiss and Landsknecht pikemen.
* **Combat Identity:** Extreme-reach corridor denial and anti-charge bracing with a deliberate point-blank dead zone.
* **Weapon Requirements:** `Main Hand`: `Pike` (`18 WT`, `2H`) | `Side Hand`: Empty (`None`).
* **Prerequisites:** `Warrior` or `Marauder` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * `Passive Doctrine`: Increases thrust reach by `+45%` and grants `+25%` Armor penetration at the outer `35%` sweet-spot tip.
  * `Action 4` (`[Y]` Guard): Plants the pike butt into the ground (`Hedgehog Brace`); enemies dashing into the tip suffer reflected melee impulse (`J_melee`) and grounded knockdown.
  * `Action 5` (`[R]` Off-Hand): Two-handed shaft-butt shove (`Impact`) to knock point-blank enemies back into optimal pike range.
* **Restrictions:** Targets inside minimum point-blank range take `-35%` damage from `Action 1` thrusts.

---

### 6.8 Longbow Specialist
* **Category:** Historical Weapon Doctrine (`B`) | **Status:** Accepted
* **Historical Reference:** English/Welsh warbow and heavy composite siege archery.
* **Combat Identity:** High-draw-weight deliberate marksmanship trading mobility for extreme range, armor penetration, and projectile impulse.
* **Weapon Requirements:** `Main Hand`: `Long Bow` (`16 WT`) or `Great Bow` (`20 WT`) | `Side Hand`: Empty (`2H`) or `Yebira` (`8 WT`).
* **Prerequisites:** `Warrior` or `Rogue` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * `Action 1` (Full Draw Hold `>= 1.1s`): Enters **Overdraw Focus**, increasing projectile velocity by `+30%`, range by `+35%`, and piercing through Layer 1 Shields into Layer 2 Armor.
  * `Action 4` (`[Y]` Guard): Plants footing (`Anchored Draw`), eliminating reticle sway and boosting projectile impulse (`J_ranged`) to stagger charging heavies.
  * `Action 5` (`[R]` Off-Hand): High-arc plunging volley (`Bodkin Rain`) that strikes behind low cover and frontal shields.
* **Restrictions:** Movement speed is reduced by `-40%` during Overdraw Focus.

---

### 6.9 Archer / Quiver Specialist
* **Category:** Functional Pairing (`C`) | **Status:** Accepted
* **Historical Reference:** Rapid-fire horse-archery and quiver-fed field archery.
* **Combat Identity:** Fluid mobile archery with zero-interruption draw cycles and tactical arrow-head switching.
* **Weapon Requirements:** `Main Hand`: Any `Bow` (all 9 Custom Bows) | `Side Hand`: `Quiver`, `Yebira`, or `Sheaf`.
* **Prerequisites:** `Rogue` or `Warrior` Discipline `Lv 2` (`Tier I`).
* **Stance Mechanics:**
  * `Passive Doctrine`: Reduces bow draw reactor heat by `-15%` and prevents light grazing hits from interrupting bow draw.
  * `Action 2` (`[X]` Alt): Fires a rapid twin-arrow snap shot (`0.45s` draw) usable during Booster Dash `[B]`.
  * `Action 5` (`[R]` Off-Hand): Cycles munition feed between **Standard Bodkin** (`Pierce`), **Broadhead** (`+25%` Armor Durability shred), and **Blunt Whistle** (`Impact` stagger).
* **Restrictions:** Requires a compatible carrier equipped in `Side Hand`.

---

### 6.10 Skirmisher Specialist
* **Category:** Historical Pairing (`A`) / Functional Pairing (`C`) | **Status:** Accepted
* **Historical Reference:** Roman *velites*, Iberian *caetrati*, and peltast skirmishers.
* **Combat Identity:** Hit-and-run thrown-munition harassment designed to strip enemy shields and punish pursuit.
* **Weapon Requirements:** `Main Hand`: `Javelin` or `Plumbata` | `Side Hand`: `Buckler` or `Bandolier`.
* **Prerequisites:** `Rogue` Discipline `Lv 2` (`Tier I`).
* **Stance Mechanics:**
  * `Action 2` (`[X]` Alt): Launches a high-arc `Plumbata` or `Javelin` volley (`3`-dart spread for `Plumbata`) that bypasses frontal shield guard angles.
  * `Action 4` (`[Y]` Guard): Raises `Buckler` while advancing or retreating without slowing throw-charge recovery.
  * `Action 5` (`[R]` Off-Hand): **Peltast Disengage**—performs an immediate backward vault while hurling a crippling point-blank javelin.
* **Restrictions:** Requires `Light` or `Medium` Load Bracket (`<= 65% WT`).

---

### 6.11 Axe & Shield Specialist
* **Category:** Functional Pairing (`C`) | **Status:** Accepted
* **Historical Reference:** Viking shield-wall axe-and-roundshield and Frankish infantry tactics.
* **Combat Identity:** Brutal guard-hooking and shield-bashing pressure that strips enemy defensive posture before delivering heavy cleaves.
* **Weapon Requirements:** `Main Hand`: `Tomahawk`, `Parashu`, `Labrys` (`1H`), or `Battle Axe` (`1H`) | `Side Hand`: `Buckler`, `Heater`, `Norman`, or `Scutum`.
* **Prerequisites:** `Warrior` or `Marauder` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * `Action 2` (`[X]` Alt): **Beard Hook**—hooks the rim of an enemy's shield or weapon on hit, temporarily lowering their directional guard for `0.6s`.
  * `Action 4` (`[Y]` Guard): Standard shield guard; absorbing a hit empowers the next `Action 1` chop with `+20%` Armor Durability damage.
  * `Action 5` (`[R]` Off-Hand): Shield-edge slam that sets up an unguardable overhead chop.
* **Restrictions:** `Tower` shield (`22 WT`) is too heavy for one-handed `Battle Axe` recovery and is excluded.

---

### 6.12 Great Axe Specialist
* **Category:** Historical Weapon Doctrine (`B`) | **Status:** Accepted
* **Historical Reference:** Norse *breiðøx* (Dane axe) and two-handed executioner/battle axes.
* **Combat Identity:** Wide, high-momentum sweeping arcs designed to cleave multiple foes and shatter armor plating.
* **Weapon Requirements:** `Main Hand`: `Battle Axe` (`19 WT`, `2H`) or `Labrys` (`17 WT`, `2H`) | `Side Hand`: Empty (`None`).
* **Prerequisites:** `Marauder` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * `Action 1` Combo: Expands horizontal cleave arc to `210°` and adds attacker Directional Charge (`μ`) directly to swing impulse (`J_melee`).
  * `Action 2` (`[X]` Alt): **Figure-Eight Reversal** (`Labrys` double-bit bonus)—immediately reverses swing direction on miss or deflection without full recovery delay.
  * `Action 5` (`[R]` Off-Hand): **Sundering Cleave**—committed overhead slam that deals `2×` Armor Durability (`DUR`) damage.
* **Restrictions:** High miss recovery (`+0.25s` recovery if a heavy swing whiffs completely).

---

### 6.13 Mace & Shield Specialist
* **Category:** Historical Pairing (`A`) / Functional Pairing (`C`) | **Status:** Accepted
* **Historical Reference:** Heavy armored cavalry and shock-infantry flanged mace + shield tactics.
* **Combat Identity:** Relentless concussive pressure designed to batter through heavy armor and induce grounded knockdowns.
* **Weapon Requirements:** `Main Hand`: `Mace` (`11 WT`) | `Side Hand`: `Heater`, `Norman`, or `Scutum`.
* **Prerequisites:** `Guardian` or `Cleric` Discipline `Lv 2` (`Tier I`).
* **Stance Mechanics:**
  * `Action 1` Combo: Ignores `35%` of target Armor Rating (`RTG`) on consecutive impacts against guarded targets.
  * `Action 2` (`[X]` Alt): Shield-pinned concussion blow that converts excess push impulse into grounded **Knockdown** (`0.85s`).
  * `Action 5` (`[R]` Off-Hand): **Anvil Bash**—clashes mace against shield to emit a short-range concussive wave (`Pulse` stagger).
* **Restrictions:** Excludes `Buckler` (covered under *Bludgeon & Trauma Specialist*) and `Tower`.

---

### 6.14 Bludgeon & Trauma Specialist
* **Category:** Historical Weapon Doctrine (`B`) / Functional Pairing (`C`) | **Status:** Accepted
* **Historical Reference:** Medieval war-hammer and pollaxe armor-crushing techniques.
* **Combat Identity:** Precision armor-puncturing beak strikes and concussive hammer blows aimed at disabling heavy chassis.
* **Weapon Requirements:** `Main Hand`: `Hammer` (`14 WT`, `1H`/`2H`) or `Mace` (`11 WT`, `1H`) | `Side Hand`: Empty (`None`) or `Buckler` (`5 WT`).
* **Prerequisites:** `Marauder` or `Warrior` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * `Action 2` (`[X]` Alt): **Lucerne Beak Flip**—rotates the hammer head to strike with the rear piercing spike (`Pierce` damage, ignores `60%` Armor Threshold `THR`).
  * `Action 4` (`[Y]` Guard): With `Buckler`, enables active parry; without `Buckler` (`2H` grip), uses shaft half-swording guard with `+15` Stability (`S`).
  * `Action 5` (`[R]` Off-Hand): **Knee-Capping Sweep**—low impact blow that halves target glide speed for `2.5s`.
* **Restrictions:** Heavy `Mallet` (`20 WT`) remains a standalone weapon outside this technical doctrine.

---

### 6.15 Tomahawk Specialist
* **Category:** Historical Weapon Doctrine (`B`) / Functional Pairing (`C`) | **Status:** Accepted
* **Historical Reference:** Frontier woodland hatchet-and-knife/buckler close-combat systems.
* **Combat Identity:** Seamless alternation between rapid melee chops and mid-range spinning throws.
* **Weapon Requirements:** `Main Hand`: `Tomahawk` (`7 WT`) | `Side Hand`: `Buckler` (`5 WT`) or `Bandolier` (`6 WT`).
* **Prerequisites:** `Rogue` or `Marauder` Discipline `Lv 2` (`Tier I`).
* **Stance Mechanics:**
  * `Action 2` (`[X]` Alt): Instant mid-combo spinning throw (`Pierce`) that immediately draws a fresh hatchet from `Bandolier` (or retrieves via magnetic tether).
  * `Action 4` (`[Y]` Guard): With `Buckler`, deflects incoming strikes into an immediate upward hatchet hook.
  * `Action 5` (`[R]` Off-Hand): **Closing Sprint Chop**—high-impulse forward lunge (`+20%` Directional Charge `μ`).
* **Restrictions:** Dual identical `Tomahawk + Tomahawk` uses `Sidearm Twin-Link`.

---

### 6.16 Falx Specialist
* **Category:** Historical Weapon Doctrine (`B`) | **Status:** Accepted
* **Historical Reference:** Dacian two-handed forward-curving war *falx*.
* **Combat Identity:** Reverse-curve shield-hooking geometry that reaches over guards and punishes defensive turtles.
* **Weapon Requirements:** `Main Hand`: `Falx` (`15 WT`, `2H`) | `Side Hand`: Empty (`None`).
* **Prerequisites:** `Marauder` or `Warrior` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * `Action 1` Combo: Forward-curving tip bypasses `40%` of frontal shield mitigation on angled slashes.
  * `Action 2` (`[X]` Alt): **Shield-Rim Tear**—hooks the top edge of an enemy shield, yanking the target forward (`negative displacement`) and breaking their guard stance.
  * `Action 5` (`[R]` Off-Hand): **Scythe Overhead**—committed downward chop targeting head/dome weak points (`+30%` Armor Durability damage).
* **Restrictions:** Two-handed only; incompatible with off-hand shields or weapons.

---

### 6.17 Shotel Specialist
* **Category:** Historical Weapon Doctrine (`B`) | **Status:** Accepted
* **Historical Reference:** Abyssinian sickle-sword (*shotel*) designed to reach around shields.
* **Combat Identity:** Unpredictable curved-arc fencing that wraps around frontal defenses and punishes static blockers.
* **Weapon Requirements:** `Main Hand`: `Shotel` (`8 WT`, `1H`) | `Side Hand`: Empty (`None`) or `Buckler` (`5 WT`).
* **Prerequisites:** `Rogue` or `Warrior` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * `Action 1` Combo: Deeply curved lateral slashes hit from a `45°` offset angle, ignoring frontal shield coverage unless the target actively turns into the swing.
  * `Action 2` (`[X]` Alt): **Kidney Hook**—circling step-slash that automatically places the Pilot at a flanking angle (`+25%` damage vs. guarding targets).
  * `Action 5` (`[R]` Off-Hand): Disarming blade-snag that delays the target's next weapon action by `+0.5s`.
* **Restrictions:** Reduced reach compared to straight swords (`-10%` thrust range).

---

### 6.18 Khopesh Specialist
* **Category:** Historical Weapon Doctrine (`B`) | **Status:** Accepted
* **Historical Reference:** Bronze-Age Egyptian sickle-sword (*khopesh*) hooking and binding techniques.
* **Combat Identity:** Close-range weapon binding, shield hooking, and aggressive follow-up cleaves.
* **Weapon Requirements:** `Main Hand`: `Khopesh` (`8 WT`, `1H`) | `Side Hand`: Empty (`None`) or `Buckler` (`5 WT`).
* **Prerequisites:** `Warrior` or `Guardian` Discipline `Lv 2` (`Tier I`).
* **Stance Mechanics:**
  * `Action 2` (`[X]` Alt): **Outer-Hook Pull**—catches an enemy's weapon arm or shield, pulling light/medium frames off balance (`stagger`).
  * `Action 4` (`[Y]` Guard): Hooking guard; successful parries (`0.25s` window) strip the attacker's Directional Charge (`μ = 0`).
  * `Action 5` (`[R]` Off-Hand): Crescent-belly chopping follow-up with bonus `Pierce` penetration against staggered targets.
* **Restrictions:** Effective only at close range; cannot pair with heavy shields under this doctrine.

---

### 6.19 Eastern Saber Specialist
* **Category:** Functional Pairing (`C`) / Orion-Specific Doctrine (`D`) | **Status:** Accepted
* **Historical Reference:** Steppe cavalry *kilij*, Chinese *dao* broadsword, and heavy *dadao* cleaver forms.
* **Combat Identity:** Flowing momentum-driven draw-cuts that reward continuous glide movement without slowing down during swings.
* **Weapon Requirements:**
  * *Single/2H Mode:* `Kilij` (`11 WT`), `Dao` (`12 WT`), or `Dadao` (`18 WT`, `2H`) with empty `Side Hand`.
  * *Orion Paired Mode:* `Kilij` + `Dao` or `Dao` + `Dadao` (`Sheathed Transition`).
* **Prerequisites:** `Warrior` or `Rogue` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * `Passive Doctrine`: Eliminates the movement speed penalty during `Action 1` melee slashes while gliding laterally or forward.
  * `Action 2` (`[X]` Alt): **Momentum Draw-Cut**—scales slash impulse and Armor penetration with current glide velocity.
  * `Action 5` (`[R]` Off-Hand): Circular deflection spin that redirects incoming light projectiles and resets combo chain.
* **Restrictions:** Requires continuous movement; standing stationary forfeits momentum scaling.

---

### 6.20 Great Blade Specialist
* **Category:** Historical Weapon Doctrine (`B`) / Functional Pairing (`C`) | **Status:** Accepted
* **Historical Reference:** European *Zweihänder* / *Montante* greatsword and Japanese *Ōdachi* battlefield forms.
* **Combat Identity:** Massive two-handed area control using continuous rotational momentum, half-swording, and high-impulse cleaves.
* **Weapon Requirements:** `Main Hand`: `Odachi` (`17 WT`), `Zweihander` (`18 WT`), `Flamberge` (`17 WT`), `Executioner Sword` (`21 WT`), or `Bastard Sword` (`13 WT`) in **`2H` Grip** | `Side Hand`: Empty (`None`).
* **Prerequisites:** `Marauder` or `Warrior` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * `Action 1` Combo: Sweeping `240°` battlefield arcs with hyper-armor Stability (`+20` effective Stability `S` mid-swing).
  * `Action 2` (`[X]` Alt): **Half-Sword Thrust** (or **Executioner Cleave** on `Executioner Sword`)—shortens grip for rapid close-range armor piercing.
  * `Action 4` (`[Y]` Guard): Ricasso/parrying-lug cross-guard (`Zweihander` / `Flamberge` gain `+0.05s` parry window and blade-vibration stagger on parry).
  * `Action 5` (`[R]` Off-Hand): **Montante Whirlwind**—`360°` area-denial sweep that knocks back surrounding enemies (`High Impulse J`).
* **Restrictions:** Incompatible with shields (`Bastard Sword` must be toggled to `2H` grip in `LOADOUT`).

---

### 6.21 Battery Conduit Specialist
* **Category:** Functional Pairing (`C`) | **Status:** Accepted
* **Historical Reference:** Orion magitech capacitor-linked beam and wave artillery doctrine.
* **Combat Identity:** Sustained energy channeling where an off-hand `Battery` absorbs reactor thermal spike and converts excess charge into pulse discharges.
* **Weapon Requirements:** `Main Hand`: `Beam Caster`, `Arc Caster`, `Pulse Caster`, `Wave Caster`, `Nova Caster`, or `Stellar Caster` | `Side Hand`: `Battery` (`13 WT`).
* **Prerequisites:** `Wizard` or `Cleric` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * `Passive Doctrine`: Routes `25%` of caster reactor heat into the `Battery` capacitor, extending continuous beam/channel duration before overheat.
  * `Action 2` (`[X]` Alt): Overcharges the caster shot using stored `Battery` charge (`+25%` Shield damage, `Pulse` disruption).
  * `Action 4` (`[Y]` Guard): **Capacitor Vent Barrier**—projects a forward energy screen that absorbs incoming energy fire to recharge the `Battery`.
  * `Action 5` (`[R]` Off-Hand): **Arc Discharge**—dumps stored `Battery` charge in a close-range `360°` `Pulse` shockwave that vents reactor heat.
* **Restrictions:** Incompatible with ballistic `Bolt Caster` or explosive `Blast`/`Meteoric` casters.

---

### 6.22 Ordnance & Munitions Specialist
* **Category:** Functional Pairing (`C`) / Orion-Specific Doctrine (`D`) | **Status:** Accepted
* **Historical Reference:** Orion heavy artillery rack, repeating bolt-sheaf, and consecrated sapper doctrines.
* **Combat Identity:** Specialized payload delivery uniting `Rack`, `Sheaf`, `Pangao`, and `Kaad` carriers with compatible weapons.
* **Weapon Requirements (4 Supported Sub-Pairings):**
  1. `Blast Caster` or `Meteoric Caster` + `Rack` (`14 WT`)
  2. `Bolt Caster` (`6 WT`) + `Sheaf` (`7 WT`)
  3. `Cudgel`, `Mace`, `Falchion`, `Arming Sword`, or `Blast Caster` + `Pangao` (`11 WT`)
  4. `Wave Caster`, `Arc Caster`, `Khopesh`, or `Shotel` + `Kaad` (`6 WT`)
* **Prerequisites:** `Marauder` or `Wizard` Discipline `Lv 5` (`Tier II`).
* **Stance Mechanics:**
  * *With `Rack`:* Increases Stability (`S`) by `+18` while firing heavy blast ordnance to negate recoil knockback; `Action 5` launches a 4-micro-missile salvo.
  * *With `Sheaf`:* Eliminates manual double-tap reload on `Bolt Caster`; `Action 5` fires a 3-bolt horizontal fan burst.
  * *With `Pangao`:* `Action 5` lobs a short-fuse concussive breach charge (`Blast`, `High Impulse J`) that shatters braced shields.
  * *With `Kaad`:* `Action 4` widens melee parry window to `0.35s` via consecrated weighted cords; `Action 5` unleashes a mid-range `Wave` lash sweep.
* **Restrictions:** Each sub-pairing activates only the mechanics corresponding to the equipped `Side Hand` carrier.

---

## 7. Caster & Munitions Integration Matrix

All 9 Custom Carriers in Section 4.8 occupy the **`Side Hand`** slot in a Weapon Set (or `Main Hand` when used standalone) and operate as active munition/conduit systems:

| Carrier (`Side Hand`) | Damage / WT | Compatible `Main Hand` Weapons | Governing Specialist Feat | Primary Tactical Override (`Action 5`) |
| :--- | :---: | :--- | :--- | :--- |
| **Quiver** | `Pierce / 5 WT` | All 9 Custom Bows | *Archer / Quiver Specialist* | Rapid twin-arrow snap shot (`0.45s` draw) |
| **Yebira** | `Pierce / 8 WT` | `Recurve`, `Composite`, `Long`, `Great Bow` | *Archer / Quiver* / *Longbow* | On-the-fly arrow-head switch (`Pierce` / `DUR` / `Impact`) |
| **Sheaf** | `Pierce / 7 WT` | `Bolt Caster`, `Short Bow`, `Flat Bow` | *Ordnance & Munitions* / *Archer* | 3-round fan burst; eliminates `Bolt Caster` reload |
| **Bandolier** | `Impact / 6 WT` | `Tomahawk`, `Javelin`, `Cinquedea`, `Messer` | *Skirmisher* / *Tomahawk* | Instant thrown-weapon replenishment + back-dash throw |
| **Battery** | `Pulse / 13 WT` | `Beam`, `Arc`, `Pulse`, `Wave`, `Nova`, `Stellar` Casters | *Battery Conduit Specialist* | `360°` `Pulse` discharge that vents reactor heat |
| **Rack** | `Blast / 14 WT` | `Blast Caster`, `Meteoric Caster` | *Ordnance & Munitions Specialist* | Recoil-stabilized 4-rocket micro-salvo |
| **Plumbata** | `Pierce / 6 WT` | `Buckler`, `Heater`, `Norman`, `Short Spear` | *Skirmisher Specialist* | High-arc 3-dart volley that drops behind frontal shields |
| **Kaad** | `Wave / 6 WT` | `Wave Caster`, `Arc Caster`, `Khopesh`, `Shotel` | *Ordnance & Munitions Specialist* | Weighted-cord weapon bind (`0.35s` parry) + `Wave` lash |
| **Pangao** | `Blast / 11 WT` | `Cudgel`, `Mace`, `Falchion`, `Arming Sword`, `Blast Caster` | *Ordnance & Munitions Specialist* | Short-fuse concussive sapper satchel (`High Impulse J`) |

---

## 8. Weapon Overlap & Multi-Doctrine Matrix

A single weapon may participate in multiple Specialist Feats depending on grip (`1H` vs. `2H`) and `Side Hand` pairing:

| Weapon | Qualifying Specialist Feats | How the System Resolves Priority |
| :--- | :--- | :--- |
| **Buckler** | *Sword & Buckler*, *Spear & Buckler*, *Skirmisher*, *Axe & Shield*, *Bludgeon & Trauma*, *Tomahawk*, *Shotel*, *Khopesh* | Determined by the `Main Hand` weapon equipped alongside it. |
| **Bastard Sword** | *Sword & Buckler* (`1H` + `Buckler`), *Sword & Shield* (`1H` + `Shield`), *Great Blade* (`2H` empty `Side Hand`) | Toggling `1H` vs. `2H` grip in `LOADOUT` switches between Shield and Great Blade stances. |
| **Odachi** | *Daishō Specialist* (`2H` + `Katana`/`Wakizashi`), *Great Blade Specialist* (`2H` + empty `Side Hand`) | Equipping `Katana` or `Wakizashi` in `Side Hand` engages *Daishō*; leaving `Side Hand` empty engages *Great Blade*. |
| **Katana** | *Daishō Specialist* (`Katana + Wakizashi` or `Odachi + Katana`) | Standalone `Katana` uses base moveset; pairing with `Wakizashi` or `Odachi` engages *Daishō*. |
| **Pike** | *Pike Specialist* (`2H` + empty `Side Hand`), *Phalanx Specialist* (`Pike` + `Scutum`/`Tower`/`Norman`) | Equipping a heavy shield in `Side Hand` transitions from *Pike* to *Phalanx*. |
| **Mace** | *Mace & Shield* (`Mace` + `Heater`/`Norman`/`Scutum`), *Bludgeon & Trauma* (`Mace` + `Buckler` or empty `Side Hand`) | `Side Hand` shield size selects between heavy shield-wall pressure and nimble trauma strikes. |
| **Long Bow / Great Bow** | *Longbow Specialist* (`2H` or + `Yebira`), *Archer / Quiver Specialist* (+ `Quiver`/`Yebira`/`Sheaf`) | If both feats are socketed, *Longbow* governs `Action 4` Anchored Overdraw while *Archer* governs `Action 5` ammo swap. |

---

## 9. Stance Mechanics & Engine Physics Rules

1. **No Arbitrary Damage Inflation:** Specialist Stances never apply flat `+X%` global damage multipliers. Power comes from **Armor Threshold (`THR`) bypass**, **Armor Durability (`DUR`) shred**, **sweet-spot spacing**, and **combo recovery cancels**.
2. **Tempo Cap Compliance (`0.70×–1.30×`):** Any attack-speed or recovery reduction granted by a stance is subject to Project Orion's global `±30%` combat tempo cap (`0.21s–0.39s/step` melee, `0.15s–0.29s/shot` ranged).
3. **Inertia Physics Integration:**
   * **Braced Stances** (*Phalanx*, *Pike*, *Spear & Shield*) multiply **Directional Charge (`μ`)** and add flat **Stability (`S`)**, increasing the hit shrug-off deadband and converting enemy dashes into grounded knockdowns (`Δv_eff >= 72`).
   * **Hooking Stances** (*Falx*, *Khopesh*, *Axe & Shield*) strip target Directional Charge (`μ → 0`) and apply forward pull displacement (`-Δv`).
   * **Momentum Stances** (*Eastern Saber*, *Great Axe*) add the attacker's frame weight (`m`) and velocity directly into `J_melee`.
4. **3S Component & Gemstone Inheritance:** When a stance triggers an off-hand attack, bash, parry, or carrier discharge (`Action 4` or `Action 5`), damage type, status buildup, and VFX color read directly from the `Side Hand` item's installed components and Gemstones.

---

## 10. Standalone Weapons & Exclusion Audit

Out of the **72 Custom Weapons**, **64 weapons** participate in one or more of the 22 Specialist Feats above, while **8 weapons** are intentionally designated as **Standalone Weapons** that are complete without a Specialist Stance:

| Standalone Weapon | Class / WT | Design Rationale for Exclusion |
| :--- | :---: | :--- |
| **Corona** | Shield (`11 WT`) | Self-contained radiant solar-flare barrier ring; operates via energy projection rather than physical guard stances. |
| **Rhom** | Shield (`18 WT`) | Heavy asymmetric rhombus-phase energy lattice; functions as a standalone anti-ordnance barrier. |
| **Lance** | Spear (`21 WT`) | Dedicated high-velocity Booster Dash `[B]` jousting weapon (`J_melee = m × (1 + μ) × v`); incompatible with foot stances. |
| **Cudgel** | Impact (`6 WT`) | Simple baseline bludgeon; serves as the unspecialized entry-level impact weapon (can still hold `Pangao` in `Side Hand`). |
| **Spike** | Pierce (`8 WT`) | Dedicated armor-puncturing pick whose base moveset already focuses on pure `THR` penetration. |
| **Mallet** | Impact (`20 WT`) | Massive two-handed demolition maul whose base `Action 1–5` moveset already delivers maximum stagger and knockdown. |
| **Stellar Caster** *(Solo)* | Caster (`21 WT`) | Heavy deep-space beam cannon; fully self-sufficient solo (though compatible with *Battery Conduit* if paired with `Battery`). |
| **Meteoric Caster** *(Solo)* | Caster (`18 WT`) | Heavy atmospheric artillery caster; fully self-sufficient solo (though compatible with *Ordnance & Munitions* if paired with `Rack`). |

---

## 11. Resolved Design Rules (Engine Integration)

These rulings resolve all open questions from Draft v0.1 Section 12:

1. **Hand Assignment (`12.1`):** Every Weapon Set has `Main Hand` (`Actions 1–3`) and `Side Hand` (`Actions 4–5`). Carriers (`Quiver`, `Battery`, `Rack`, etc.) occupy `Side Hand` when paired with a weapon, keeping `Aux 1–4` free for chassis modules.
2. **Identical Weapons (`12.1`):** Identical pairs (`Katana + Katana`, `Tomahawk + Tomahawk`) are governed by `Sidearm Twin-Link` and `Main Weapon Twin-Link`. Specialist Feats govern standalone mastery (`1H`/`2H`) or asymmetric pairings.
3. **Two-Handed + Off-Hand Rule (`12.1`):** Two-handed weapons (`2H`) require an empty `Side Hand` unless the active Specialist Feat explicitly authorizes **Sheathed Transition** (*Daishō*: `Odachi + Katana/Wakizashi`) or **Braced Support** (*Phalanx*: `Pike + Scutum`).
4. **Feat Prerequisites & Progression (`12.2`):** Specialist Feats sit in `Tier I` (`Discipline Lv 2`), `Tier II` (`Discipline Lv 5`), and `Tier III` (`Discipline Lv 9`) alongside canonical feats, require zero weapon-specific grind levels, and can be unsocketed at any time for a 100% Gemstone refund.
5. **Automatic Stance Activation & Manual Toggle (`12.3`):** Equipping a valid pairing with the matching Specialist Feat socketed activates the stance automatically. Pilots who prefer a weapon's raw base `Actions 2/4/5` can toggle `Stance: Active / Base Moveset` in the `LOADOUT` Mech Doll context menu.
6. **Weapon Swap Interaction (`12.3`):** Swapping between `Weapon Set 1` and `Weapon Set 2` (`Hold [L]`, `5.0s` cooldown) cleanly transitions stances based on the newly active Weapon Set's hardware.

---

## 12. Implementation Roadmap

1. **Data Schema (`specialistFeats.json`):** Encode the 22 Specialist Feats with `id`, `category`, `disciplineReq`, `tier`, `validPairs[]` (`mainHand`, `sideHand`, `gripMode`), and `actionOverrides` (`action2`, `action4`, `action5`).
2. **Loadout Evaluator (`evaluateActiveStance()`):** Hook into `LOADOUT` equip/grip events to check equipped `Main Hand` + `Side Hand` + `gripMode` against socketed Specialist Feats and display an active **Stance Badge** on the Mech Doll.
3. **First Vertical Slice (4 Core Doctrines):** Implement and playtest the four foundational archetypes first:
   * **Daishō Specialist** (Dual-wield & draw-transition prototype)
   * **Sword & Buckler Specialist** (Active parry & riposte prototype)
   * **Spear & Shield Specialist** (Guarded thrust & anti-charge prototype)
   * **Pike Specialist** (Standalone reach & sweet-spot prototype)
4. **Carrier & Caster Pass:** Wire `Battery`, `Rack`, `Quiver`, `Yebira`, `Sheaf`, `Bandolier`, `Plumbata`, `Kaad`, and `Pangao` `Action 5` discharge overrides into the `Side Hand` controller.
5. **Full 22-Doctrine Balance Audit:** Verify every stance against the `±30%` tempo cap, `200 HP` Frame Integrity budget, and `BCU = 54` damage baseline in both PvE and PvP.