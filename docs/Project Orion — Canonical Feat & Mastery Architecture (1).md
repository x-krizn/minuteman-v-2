# Project Orion — Canonical Feat & Mastery Architecture (`v2.3`)

*Nested Constellation Specification: Interface Systems (Pilot Neural Link & Combat Records) vs. Frame Systems (Chassis Defense & Sub-System Engineering) — Tuned for Skill-First, Old-School Min-Max Combat & Mutual-Exclusion Defensive Action Rules.*

---

## 1. Core Architectural & Balance Laws (`Rules P-01` – `P-10`)

| Rule ID | Rule Name | Mechanical Contract |
| :--- | :--- | :--- |
| **`Rule P-01`** | **1:1 Level-to-Feat Cap & Gem Socket Costs** | Active socketed feats scale `1:1` with Pilot Level (`Lv 1 = 1` socketed feat up to `Lv 20 = 20` max). Gemstones socketed into feat nodes are refunded `100%` on unsocket:<br>• **Tier I / Tier II:** `1` matching Umbrella/Discipline Gem<br>• **Tier III (Doctrines & Masteries) / Tier IV:** `2` matching Gems (`1` from each parent Umbrella if hybrid)<br>• **Tier V (Apex Capstones):** `3` matching Gems (`2` Discipline + `1` Reactor Core Gem) |
| **`Rule P-02`** | **Radial Progression (`Foundation → Specialization → Apex`)** | **Tiers I–II** house foundational physical, neural, and chassis mechanics (`0–1` prerequisites). **Tiers III–IV** house specialized Martial Doctrines, Single-Weapon Transformations, and advanced tactical links earned from `1–2` Tier I–II foundations. Tier-jumping is permitted once any earlier node in a chain is socketed. |
| **`Rule P-03`** | **Tier V Apex Ceiling (`Max = 2`)** | At most **`2` Tier V Apex Capstones** (`0`, `1`, or `2`) may be socketed per build. |
| **`Rule P-04`** | **Nested Root Domains (`Interface` vs. `Frame`)** | Every node belongs strictly to either **Interface Systems** (pilot neural link, combat records, weapon execution, tactical input protocols) or **Frame Systems** (chassis defenses, inertia/load capacity, reactor/thermal/optics sub-systems). |
| **`Rule P-05`** | **Zero RNG Crit Chance — Geometry Tip/Edge Sweetspot Detection** | Project Orion has **no random critical-hit chance stat** and **no critical multiplier modifiers**. Perfect hits ("Criticals") are registered exclusively via fighting-game **hitbox tip/edge sweetspot spacing**:<br>• **Melee Outer `22%` Tip/Edge Arc:** Deals **`1.25× BCU`**, **`+20%` Melee Impulse (`J`)**, and ignores **`+2` Armor `THR`**.<br>• **Ranged / Bow Optimal Band (`75%–100%` range or full-draw release):** Deals **`1.20× BCU`** and **`+15%` `J_ranged`**.<br>• No feat, gem, or item ever alters `1.25×` / `1.20×` or adds RNG crit chance. |
| **`Rule P-06`** | **Doctrine Names vs. Literal Single-Weapon Masteries** | Multi-weapon styles are named strictly after their **Combat Doctrine or Warrior Role** (never a single weapon noun). Single-weapon names are reserved exclusively for **literal single-weapon mechanical transformations** that alter grip, action bindings, or weapon role (e.g., *Reverse-Grip Dual Katana*, *Kaad: Iron-Bind Grapple*, *Kaad: Sanctified Palm*). |
| **`Rule P-07`** | **Discipline Unlock Thresholds & Reactor Parity** | Investing Gemstones into the **6 Combat Disciplines** across the **3 Macro-Umbrellas** (`Fighter`: Warrior/Guardian; `Scholar`: Wizard/Cleric; `Rogue`: Marauder/Rogue) unlocks radial rings at **`Lv 2` (Tier I)**, **`Lv 5` (Tier II)**, **`Lv 9` (Tier III)**, **`Lv 14` (Tier IV)**, and **`Lv 18` (Tier V)**. Hardware triggers map directly to `Ichor`, `Mana`, and `Ether` reactor families and canonical `Section 7` equipment tags. |
| **`Rule P-08`** | **Skill-First Ceiling (`+35%` Sustained Damage Cap & `±30%` Tempo Band)** | Combat revolves around the static **`200` Frame Integrity** and **`BCU = 54`** budget. Cumulative sustained damage bonuses from feats are hard-capped at **`+35%`** (`1.35× BCU`), and cumulative tempo/attack-speed modifiers remain strictly inside **`±30%` (`0.70×–1.30×`)**. Feats never passively inflate stats; `80%` unlock mechanical rules/actions, and `20%` offer sharp situational conversions. |
| **`Rule P-09`** | **Old-School Min-Max Trade-Off Law** | Any feat granting an extreme offensive burst (`> +35%`), heavy capacity expansion, or rule-breaking survival effect imposes an **explicit structural vulnerability** (dropped Layer 1 Shields, locked movement $\mu = 0$, lowered Armor `RTG`/Stability $S$, or critical Reactor Heat spikes). |
| **`Rule P-10`** | **`Action 4` (`[Y]`) Mutual Exclusion & Legendary Precedence Law** | **Block** and **Parry** occupy the **exact same slot (`Action 4` / `[Y]`)** and are **strictly mutually exclusive**: if `Action 4` is set to **Block**, it never parries; if set to **Parry**, it never blocks. Hybrid items capable of both still favor one mode in performance, and selecting between **Block** and **Parry** is configured explicitly inside the **`LOADOUT` (`Mech Doll`) screen**. **Legendary Engine Hooks** (such as *Balmung*'s `PERFECT_BLOCK_MELEE_AUTO_COUNTER`) override feat-controlled counter actions whenever equipped. |

---

## 2. Defensive Action Matrix (`Action 4` / `[Y]` Block vs. Parry vs. Counters)

### 2.1 Precedence Hierarchy
1. **Priority 1 — Legendary Engine Hook Override:** *Balmung* (`leg_balmung`) replaces manual `[X]` Block-Counter and feat Parry-Counter actions with its automatic `1.35×` `Wave` *Gram Counter-Slash* on any melee Perfect Block.
2. **Priority 2 — Single-Weapon `Action 4` Replacements:** *Kaad Mastery: Iron-Bind Grapple* and *Kaad Mastery: Sanctified Palm* replace `Action 4` entirely (neither Block nor Parry) with a Cestus Grapple or Harmonic Palm Counter.
3. **Priority 3 — `LOADOUT`-Selected `Action 4` Mode (`Block` vs. `Parry`):** Configured per loadout inside the `LOADOUT` (`Mech Doll`) slot menu when equipped gear, feats, or Doctrines support both modes.

### 2.2 Mutual-Exclusion Comparison (`Mode A: Block` vs. `Mode B: Parry`)

| Property | **Mode A: Block (`Action 4` Hold `[Y]`)** | **Mode B: Parry (`Action 4` Active Frame `[Y]`)** |
| :--- | :--- | :--- |
| **Core Nature** | **Passive Defensive Absorption / Evasion Posture** | **Active Offensive Deflection & Interrupt** |
| **How It Is Selected** | Default on Shields, 2H Grips, and Dual-Wield; selectable in `LOADOUT` on hybrid gear (`Toggle Action 4: Block`). | Selected in `LOADOUT` (`Toggle Action 4: Parry`) when equipping Parry-biased gear (`Buckler`, `Disc`, `Mote`, `Cinquedea`, `Flanged Parrying Lugs`) or a Parry Feat/Doctrine (*Off-Hand Deflection*, *Destreza*, *Niten Ichi-Ryu*, *Reverse-Grip Dual Katana*). |
| **Sustained Guard Hold** | **Yes.** Holding `[Y]` after the Perfect Block window expires maintains directional guard until released. | **No (`Zero Block`).** If it parries, it never blocks—holding `[Y]` does not raise a sustained guard; whiffing leaves you in recovery frames. |
| **Initial Window Data** | • **Shield:** Full Perfect Block window (`0.34s` base) with **`i-frames` + `Hyper Armor`**.<br>• **2H Grip:** Full Perfect Block window (`0.34s` base) with **`i-frames`** (`No Hyper Armor`).<br>• **Dual-Wield:** Shorter Perfect Block window (`~0.20s` base) with **`i-frames`** (`No Hyper Armor`). | • **Parry-Favored Gear (`Buckler`, `Disc`, `Cinquedea`):** Wide active deflection window (`0.26s` base) + fast recovery.<br>• **Block-Favored / Standard Gear (via Feat):** Tight active deflection window (`0.18s` base) + heavier recovery. |
| **Sustained Hold Mitigation** *(After `i-frames` Expire)* | • **Shield:** Routes damage through **Shield `DUR / RTG / THR`** first.<br>• **2H Grip:** Grants **`+4` Guard `THR`** and **`+15%` Armor `RTG`**, routing `25%` of mitigated damage into **Reactor Heat**.<br>• **Dual-Wield:** Grants **`+2` Guard `THR`** and **`+8%` Armor `RTG`**, routing `25%` of mitigated damage into **Reactor Heat**. | **None** (cannot sustain block). |
| **Effect on Attacker** | **None.** Attacker finishes their swing/combo normally while you slip (`i-frames`) or absorb (`Hyper Armor` / sustained block) the blow. | **Interrupts & Staggers Attacker.** Deflects melee strikes mid-swing (inducing hit-stop recoil stagger and stripping $\mu = 0$) or bats away deflectable projectiles. |
| **Counter Follow-Up** | **Block-Counter (`[X]` / `Action 1` after Perfect Block):** Independent weapon skill using **main-hand weapon stats** (`BCU`, `DamageType`, `Impulse J`, components/gems). *(Overridden by Balmung's `Gram Counter-Slash`).* | **Parry-Counter (`[X]` / `Action 1` or Doctrine auto-riposte):** Technique-specific riposte driven by the parrying weapon, feat, or Doctrine (e.g., *Attrition Riposte* `-10` Heat vent, *Destreza* main-gauche thrust) that bypasses guard pushback. |

---

## 3. Nested Constellation Taxonomy (`113 Nodes`)

```
                    PILOT & MECH FEAT CONSTELLATION (113 NODES)
                                        │
          ┌─────────────────────────────┴─────────────────────────────┐
          ▼                                                           ▼
1. INTERFACE SYSTEMS (59 Nodes)                             2. FRAME SYSTEMS (53 Nodes)
   Pilot Neural Link, Combat Records & Execution               Chassis Defense, Inertia & Sub-System Tuning
   │                                                           │
   ├── 1A. Combat Records & Martial Mastery (40 Nodes)         ├── 2A. Defensive Architecture (24 Nodes)
   │   • Tier I–II Foundations (12): Sweetspot spacing,        │   • Tier I–II Foundations (11): Shield charge, guard
   │     Parry unlock, μ-counters, cleave, stealth             │     stability, hazard/corrosive seals, interference
   │   • Tier III–IV Multi-Weapon Doctrines (17): Earned         │   • Tier III–IV Chassis Bulwarks (9): Recoil-to-μ
   │     fighting styles across all 8 weapon classes             │     absorption, barrier networks, consecrated zones
   │   • Tier III–IV Single-Weapon Masteries (4): Literal        │   • Tier V Defensive Capstones (3): Hardening Light,
   │     single-weapon mechanical transformations                │     Judgment Battery, Martyrdom Transcendent
   │   • Tier V Interface Capstones (7): Shadow Master,          │
   │     Quantum Assassin, Phantom Sniper, etc.                └── 2B. Sub-System, Load & Reactor Tuning (29 Nodes)
   │                                                               • Tier I–II Foundations (11): Booster i-frames, load
   └── 1B. Tactical Input & Link Protocols (19 Nodes)                struts (+18 WT), siege bracing, reactor overflow
       • Tier I–II Foundations (6): Dual-wield link,               • Tier III–IV Sub-System Engines (13): Dorsal auto-
         suppression fire, stationary focus (μ=0)                    loaders, thermal vent shockwaves, overclock loops
       • Tier III–IV Fire-Control Links (10): Main/Aux             • Tier V Sub-System Capstones (5): Core Overclock,
         twin-links, spectral volley, overcharge                     Avalanche Surge, Infinite Wellspring, etc.
       • Tier V Fire-Control Capstones (3): Salvo Link,
         Multi-Lock Array, Arcane Annihilation              [+] 3. CAMPAIGN REWARD FEAT (1 Node): Knight's Oath
```

---

## 4. Domain 1: Interface Systems (`59 Nodes`)

*Governs how the pilot interfaces with the mech—storing martial combat records, hitbox spacing, `Action 4` Parry techniques, weapon-grip transformations, stealth execution, and multi-weapon fire-control links.*

### 4.1 Branch 1A: Combat Records & Martial Mastery (`40 Nodes`)

#### Tier I — Foundational Combat Records (`6 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Chain / Role | Mechanical Effect & Skill Requirement |
| :--- | :--- | :--- | :---: | :--- |
| `if_sweetspot_spacing` | **Sweetspot Spacing** | Fighter (`Warrior`) | Foundation (`F-01`) | Tip/edge spacing hits (`1.25×` / `1.20×` Sweetspots) deal `+15%` Layer 2 Armor `DUR` shred and `+15%` Impulse (`J`) *(no raw HP/BCU inflation)*. |
| `if_offhand_deflection` | **Off-Hand Deflection** | Fighter (`Warrior`) | Foundation (`F-02`) | Unlocks **`Action 4: Parry` mode** in `LOADOUT` for non-shield off-hand and 2H weapons (`0.22s` active deflection frame; interrupts attackers and enables **Parry-Counter**; disables sustained block when active). |
| `if_radiant_cleave` | **Radiant Cleave** | Fighter (`Guardian`) | Chain `C-12` (Step 1) | Charged main-hand melee with a `Mana` reactor emits a `180°` energy wave (`0.45× BCU`, `+8` Heat). |
| `if_shadow_step` | **Shadow Step** | Rogue (`Rogue`) | Chain `C-15` (Step 1) | Booster dash grants `1.2s` optical camouflage (`+6` Heat; broken immediately on attack or collision). |
| `if_veil_of_mercy` | **Veil of Mercy** | Rogue / Scholar (`Rogue/Cleric`) | Chain `C-02` (Step 1) | Entering stealth grants **self-only** `-12%` incoming damage reduction for `2.0s`. |
| `if_empowered_blessing` | **Empowered Blessing** | Scholar (`Wizard/Cleric`) | Foundation (`F-03`) | Sweetspot weapon hits extend active ward/buff durations by `+0.5s` (max `+2.0s` per cast). |

#### Tier II — Foundational Combat Records (`6 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Skill Requirement |
| :--- | :--- | :--- | :---: | :--- |
| `if_mu_counter` | **Momentum Counter ($\mu$-Break)** | Fighter (`Warrior/Guardian`) | `F-01` (*Sweetspot Spacing*) | Intercepting a forward-charging target ($\mu > 0$) multiplies knockdown impulse ($\Delta v$) by `+35%` to floor heavy rushers. |
| `if_attrition_riposte` | **Attrition Riposte** | Fighter / Rogue (`Warrior/Marauder`) | `F-02` (*Off-Hand Deflection*) | Successful **Parry-Counters** (`Action 4: Parry`) vent `-12` Reactor Heat and restore `+12` Energy (once per enemy attack cycle). |
| `if_backstab_mastery` | **Backstab Mastery** | Rogue (`Rogue`) | Chain `C-16` (Step 1) | Strikes landed inside a target's `90°` rear arc deal `+20%` damage and ignore `4` Armor `THR`. |
| `if_healing_shadow` | **Healing Shadow** | Rogue / Scholar (`Rogue/Cleric`) | `C-02` (Step 2) ← *Veil of Mercy* | While cloaked, your **own** Layer 1 Shield regeneration delay is halved and regen rate increases by `+30%`. |
| `if_purification_sweep` | **Purification Sweep** | Scholar (`Cleric/Wizard`) | `F-03` (*Empowered Blessing*) | Wide melee arcs, line waves, or beam sweeps cleanse `1` negative status effect along their path (`8s` CD). |
| `if_guiding_triage` | **Harmonic Strike Triage** | Scholar (`Cleric`) | `F-03` (*Empowered Blessing*) | Sweetspot melee or wave hits restore `+8` Layer 1 Shield to self and allies within `8m` (`3.0s` internal CD). |

#### Tier III — Earned Multi-Weapon Martial Doctrines (`11 Nodes`)
*All Multi-Weapon Doctrines require `1–2` foundational nodes, qualify all `Custom`, `Magitech`, and `Legendary` weapons sharing the listed Functional Weapon Types, and override `Actions 2, 4, and 5` with historical martial movesets when active.*

| Node ID | Doctrine Name (`Martial Stance`) | Umbrella / Sector | Earned From (Prereqs) | Qualifying Functional Weapons, Load Bracket & `Action 4` Bias |
| :--- | :--- | :--- | :--- | :--- |
| `doc_doppelsoldner` | **Doppelsöldner Doctrine** (*Montante Pike-Cleaver*) | Fighter (`Warrior`) | `if_sweetspot_spacing` + `fr_siege_stability` | `Zweihander` / `Flamberge` / `Executioner Sword` (`2H Grip` · `Medium` / `Heavy` · *Hybrid Block/Parry, Block-favored*). |
| `doc_battojutsu` | **Battojutsu Doctrine** (*Iaido Draw-Cut*) | Fighter (`Warrior`) | `if_sweetspot_spacing` + `if_offhand_deflection` | `Odachi` / `Dadao` / `Katana` (`2H Grip` · `Light` / `Medium` · *Parry-favored scabbard deflection*). |
| `doc_limitanei` | **Limitanei Doctrine** (*Plumbata & Spatha*) | Fighter (`Warrior`) | `if_mu_counter` + `if_sidearm_twin_link` | `Spatha` / `Arming Sword` / `Falchion` + `Plumbata` / `Bandolier` (`Light` / `Medium`). |
| `doc_yeoman` | **Yeoman Stake-Line Doctrine** (*Heavy Volley*) | Fighter (`Warrior`) | `if_anchored_focus` + `fr_siege_stability` | `Long Bow` / `Great Bow` / `Flat Bow` / `Self Bow` / `Compound Bow` + `Quiver` / `Sheaf` (`Medium` / `Heavy`). |
| `doc_fusilier` | **Fusilier Repeater Doctrine** (*Cyclic Caster*) | Fighter (`Warrior`) | `if_sidearm_twin_link` + `if_suppression_chainfire` | `Bolt` / `Pulse` / `Blast Caster` + `Bandolier` / `Quiver` / `Rack` / `Battery` (`Light` / `Medium` / `Heavy`). |
| `doc_hoplite` | **Hoplite Othismos Doctrine** (*Spear & Shield*) | Fighter (`Guardian`) | `if_mu_counter` + `fr_shield_charge` | `Short` / `Winged` / `Broad` / `Boar Spear` / `Partisan` + `Heater` / `Norman` / `Scutum` / `Tower` / `Corona` / `Rhom` (`Medium` / `Heavy` · *Block-favored*). |
| `doc_legionary` | **Legionary Testudo Doctrine** (*Gladius & Scutum*) | Fighter (`Guardian`) | `fr_shield_charge` + `fr_anchored_action` | `Spatha` / `Cinquedea` / `Arming Sword` + `Scutum` / `Tower` / `Norman` (`Medium` / `Heavy` · *Block-favored*). |
| `doc_knightly_bastard` | **Fiore Half-Sword Doctrine** (*Bastard & Heater*) | Fighter (`Guardian`) | `if_offhand_deflection` + `if_radiant_cleave` | `Bastard Sword` / `Arming Sword` / `Spatha` + `Heater` / `Norman` / `Corona` / `Rhom` (`Medium` / `Heavy` · *Hybrid Block/Parry*). |
| `doc_earthshaker` | **Earthshaker Maul Doctrine** (*2H Heavy Impact*) | Rogue (`Marauder`) | `if_sweetspot_spacing` + `fr_siege_stability` | `Mallet` / `Labrys` / `Battle Axe` (`2H Grip` · `Medium` / `Heavy` · *Block-favored; combo finishers emit grounded seismic shockwaves*). |
| `doc_huscarl` | **Huscarl Skjaldborg Doctrine** (*Axe & Hook*) | Rogue (`Marauder`) | `if_attrition_riposte` + `fr_shield_charge` | `Battle Axe` / `Tomahawk` / `Parashu` / `Labrys` + `Norman` / `Heater` / `Buckler` / `Sheaf` (`Medium` / `Heavy`). |
| `doc_shield_breaker` | **Thracian Hook-Blade Doctrine** (*Guard-Bypass*) | Rogue (`Marauder`) | `if_sweetspot_spacing` + `if_attrition_riposte` | `Shotel` / `Falx` / `Khopesh` (+ optional Shield, Blade, or Carrier · `Light` / `Medium` / `Heavy`). |

#### Tier III — Earned Multi-Weapon Doctrines (`6 Nodes`) & Single-Weapon Masteries (`4 Nodes`)
| Node ID | Doctrine / Mastery Name | Umbrella / Sector | Earned From (Prereqs) | Qualifying Weapon(s) & Mechanical Transformation |
| :--- | :--- | :--- | :--- | :--- |
| `doc_daisho` | **Niten Ichi-Ryu Doctrine** (*Matched Daisho*) | Rogue (`Rogue`) | `if_offhand_deflection` + `if_sidearm_twin_link` | `Katana` / `Odachi` / `Dao` / `Kilij` + `Wakizashi` / `Cinquedea` (`Light` / `Medium` · *Parry-favored two-sword deflection*). |
| `doc_destreza` | **Destreza Main-Gauche Doctrine** | Rogue (`Rogue`) | `if_offhand_deflection` + `if_sweetspot_spacing` | `Spatha` / `Arming Sword` / `Messer` + `Cinquedea` / `Wakizashi` (`Light` / `Medium` · *Parry-favored main-gauche bind*). |
| `doc_boarder` | **Corsair Boarder Doctrine** (*Blade & Sidearm*) | Rogue (`Rogue`) | `if_sidearm_twin_link` + `if_shadow_step` | `Falchion` / `Messer` / `Kilij` / `Dao` / `Khopesh` / `Wakizashi` ↔ `Bolt` / `Pulse` / `Blast` / `Arc Caster` (`Light` / `Medium`). |
| `doc_outrider_archer` | **Cantabrian Outrider Doctrine** (*Glide Bow*) | Rogue (`Rogue`) | `if_shadow_step` + `if_sweetspot_spacing` | `Recurve` / `Reflex` / `Composite` / `Short` / `Compound Bow` + `Quiver` / `Yebira` (`Light` / `Medium`). |
| `doc_spellblade` | **Aether-Conduit Spellblade Doctrine** | Scholar (`Wizard`) | `if_anchored_focus` + `if_offhand_deflection` | `Arming` / `Bastard Sword` / `Spatha` / `Katana` / `Khopesh` ↔ `Beam` / `Arc` / `Wave` / `Pulse` / `Nova Caster` (`Light` / `Medium`). |
| `doc_hierophant` | **Sanctum Hierophant Doctrine** (*Mace & Ward*) | Scholar (`Cleric`) | `if_purification_sweep` + `if_guiding_triage` | `Mace` / `Cudgel` / `Hammer` / `Spike` + `Corona` / `Mote` / `Rhom` / `Disc` / `Buckler` (`Medium` / `Heavy`). |
| `mast_reverse_katana` | **Reverse-Grip Dual Katana (`Gyaku-Te`)** | Rogue (`Rogue`) | `if_offhand_deflection` + `if_backstab_mastery` | **Single-Weapon Mastery (`Katana` + `Katana` toggled in `LOADOUT` · `Light` / `Medium`)**: Replaces wide slash chains with ultra-close hooking parries (`Action 4: Parry`) and elbow-pivot draw cuts; **trade-off:** `-30%` horizontal reach and zero sustained block. |
| `mast_kaad_grapple` | **Kaad Mastery: Iron-Bind Grapple** | Fighter / Rogue (`Warrior/Marauder`) | `if_mu_counter` + `if_offhand_deflection` | **Single-Weapon Mastery (`Kaad` equipped in `slot1` · `Light` / `Medium`)**: Converts `Kaad` into close-quarters pugilism and replaces `Action 4` (neither Block nor Parry) with a **Cestus Grapple (`28px`)** that beats standard Block and stationary targets ($\mu = 0$) for grounded knockdown, but loses to active `Hyper Armor` or targets `> 2.0×` your chassis Weight ($m$). |
| `mast_kaad_sanctified` | **Kaad Mastery: Sanctified Palm** | Scholar (`Cleric`) | `if_guiding_triage` + `if_purification_sweep` | **Single-Weapon Mastery (`Kaad` equipped in `slot1` · `Light` / `Medium`)**: Channels Mana pulses through close-range palm strikes—each hit vents `-4` Heat and restores `+8` Shield/Armor integrity in `8m`, replacing `Action 4` with a **Harmonic Palm Counter**; **trade-off:** `-25%` physical strike BCU and forfeits sustained block. |
| `mast_sarissa_phalanx` | **Sarissa Pike Mastery** (*Syntagma One-Hand*) | Fighter (`Guardian`) | `doc_hoplite` (*Hoplite Othismos*) | **Single-Weapon Mastery (`Pike` or `Lance` + `Scutum` / `Tower` · `Medium` / `Heavy`)**: Unlocks counter-torqued **1H `Pike` / `Lance` + Heavy Shield** pairing; **trade-off:** `-15%` attack tempo (`Rule P-08`). |

#### Tier IV — Advanced Martial Masteries & Execution Records (`6 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Min-Max Trade-Off |
| :--- | :--- | :--- | :---: | :--- |
| `if_overload_cleave` | **Overload Cleave** | Fighter (`Warrior/Guardian`) | `C-12` (Step 2) ← *Radiant Cleave* | Cleave waves build overload stacks (up to `3`); next boost converts stacks into `+18` Layer 1 Shield (`+6` per stack). |
| `doc_cataphract` | **Cataphract Clibanarii Doctrine** | Fighter (`Guardian`) | `doc_hoplite` (*Hoplite Othismos*) | `Lance` / `Pike` / `Boar Spear` / `Mace` / `Hammer` (`Heavy` load): Converts forward Directional Charge ($\mu$) into `+25%` Impulse (`J`) and `+6` Armor `THR` pierce; **trade-off:** `-15%` turn rate while charging. |
| `doc_archmage_fulcrum` | **Astral Fulcrum Doctrine** | Scholar (`Wizard`) | `doc_spellblade` (*Spellblade*) | `Spetum` / `Partisan` / `Short Spear` / `Stellar` / `Beam` / `Wave Caster` (`Light` / `Medium`): Converts polearm/caster pivots into wide horizon-sweeping waves (`+10` Heat per sweep). |
| `if_perfect_ambush` | **Shadow Ambush Execution** | Rogue (`Rogue`) | `C-16` (Step 2) ← *Backstab Mastery* | First strike from stealth deals `+30%` flat ambush damage and heavy stagger impulse ($\Delta v$); **trade-off:** applies `1.5s` `Revealed` preventing immediate re-cloak. |
| `if_shadow_siphon` | **Shadow Siphon** | Rogue / Scholar (`Rogue/Cleric`) | `C-02` (Step 3) ← *Healing Shadow* | Stealth strikes siphon `15%` of damage dealt into your **own Layer 1 Shield** (never Frame HP); **trade-off:** `-15%` max Layer 2 Armor `DUR`. |
| `if_phantom_shroud` | **Phantom Shroud** | Rogue / Scholar (`Rogue/Cleric`) | `C-15` (Step 2) ← *Shadow Step* | Dashing through an enemy attack during `i-frames` triggers `1.8s` stealth and cleanses `1` debuff (`12s` CD). |

#### Tier V — Apex Interface Capstones (`7 Nodes` · `Rule P-03` Max 2 Total)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Old-School Min-Max Trade-Off |
| :--- | :--- | :--- | :---: | :--- |
| `apex_lightstorm_convergence` | **Lightstorm Convergence** | Fighter / Rogue (`Guardian/Marauder`) | `C-12` (Step 3) ← *Overload Cleave* | Radiant cleaves and salvos unleash a `3.5m` shockwave (`0.5× BCU`) and apply `2` suppression stacks; **trade-off:** `+14` Reactor Heat per wave. |
| `apex_shadow_master` | **Shadow Master** | Rogue (`Rogue`) | `C-15` (Step 3) / `C-16` (Step 3) | Doubles cloak duration and allows up to `2` attacks without breaking stealth (`6s` cap); **trade-off:** `-20%` Armor Rating (`RTG`) and `-10` Stability ($S$) while slotted. |
| `apex_quantum_assassin` | **Quantum Assassin** | Rogue / Scholar (`Rogue/Wizard`) | `C-17` (Step 4) ← *Dimensional Strike* | `3`-target chain phase-blink strike (`0.65× BCU` per jump, up to `16m`); **trade-off:** drains all Layer 1 Shields on activation (`22s` CD). |
| `apex_phantom_sniper` | **Phantom Sniper** | Rogue / Scholar (`Rogue/Wizard`) | `C-03` (Step 4) ← *Spectral Volley* | Standing still ($\mu = 0$) for `1.5s` engages optical camo (`+65%` next ranged shot); **trade-off:** `-25%` Armor `RTG` while camouflaged, firing applies `1.5s` `Revealed` + heavy recoil recovery. |
| `apex_angel_of_death` | **Angel of Death** | Rogue / Scholar (`Rogue/Cleric`) | `C-02` (Step 4) ← *Shadow Siphon* | Stealth kills restore `+25` Layer 1 Shield and grant `+20%` damage for `5s`; **trade-off:** disables passive out-of-combat Shield regeneration. |
| `apex_reapers_shroud` | **Reaper's Shroud** | Rogue / Scholar (`Rogue/Cleric`) | `if_phantom_shroud` | Dropping below `30%` Frame Integrity auto-triggers `3.5s` personal cloak, cleanses CC/status, and grants `+20%` speed (`60s` CD); **trade-off:** vents `+35` Heat on trigger. |
| `apex_emp_singularity` | **Empowered Singularity** | Scholar (`Wizard/Cleric`) | `doc_archmage_fulcrum` | Deploys a `10s` gravity-well zone amplifying damage taken inside by `+25%` and pulling projectiles (`30s` CD); **trade-off:** drains `35%` Reactor Energy and immobilizes caster for `0.8s` on deployment. |

---

### 4.2 Branch 1B: Tactical Input & Link Protocols (`19 Nodes`)

#### Tier I — Foundational Input Protocols (`3 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Chain / Role | Mechanical Effect & Skill Requirement |
| :--- | :--- | :--- | :---: | :--- |
| `if_phantom_strike` | **Phantom Strike** | Rogue / Scholar (`Rogue/Wizard`) | Chain `C-03` (Step 1) | First attack from stealth converts `50%` of its damage into Layer 1 Shield-bypassing energy *(no raw damage inflation)*. |
| `if_anchored_focus` | **Anchored Focus** | Scholar (`Wizard`) | Chain `C-04` (Step 1) | Remaining stationary ($\mu = 0$ for `0.75s`) increases ranged/beam damage by `+15%` and eliminates aim sway; **trade-off:** `-10` Stability ($S$) if struck while rooted. |
| `if_guard_fire` | **Guarded Fire Protocol** | Fighter (`Warrior/Guardian`) | Foundation (`F-04`) | Allows firing 1H weapons (`Action 1`) while maintaining active `Action 4: Block` sustained guard at `-15%` fire cadence. |

#### Tier II — Foundational Link Protocols (`3 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Skill Requirement |
| :--- | :--- | :--- | :---: | :--- |
| `if_sidearm_twin_link` | **Sidearm Twin-Link** | Fighter (`Warrior`) | Chain `C-06` (Step 1) | Synchronizes dual 1H weapon / matching sidearm inputs into simultaneous twin strikes (`+25%` combined Heat/Recoil). |
| `if_suppression_chainfire` | **Suppression Chainfire** | Rogue (`Marauder`) | Chain `C-10` (Step 1) | Sustained rapid fire builds suppression stacks (`-12%` target accuracy/speed for `3s`). |
| `if_sustained_channeling` | **Sustained Channeling** | Scholar (`Wizard`) | `C-04` (Step 2) ← *Anchored Focus* | Consecutive hits or beam ticks on the same target ramp damage by `+4%/s` (up to `+16%`); missing or switching targets resets stacks. |

#### Tier III — Fire-Control & Phase Links (`5 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Min-Max Trade-Off |
| :--- | :--- | :--- | :---: | :--- |
| `if_suppression_link` | **Suppression Link** | Fighter / Rogue (`Warrior/Marauder`) | `C-10` (Step 2) ← *Suppression Chainfire* | Burst fire triggers twin-linked suppression volleys across paired mounts (`+15%` Heat per salvo). |
| `if_phantom_barrage` | **Phantom Barrage** | Rogue / Scholar (`Rogue/Wizard`) | `C-03` (Step 2) ← *Phantom Strike* | First ranged burst fired from stealth costs `0` Reactor Heat; **trade-off:** `+25%` post-burst reload/vent time. |
| `if_phase_shot` | **Phase-Geometry Shot** | Rogue / Scholar (`Rogue/Wizard`) | `C-17` (Step 1) ← *Phantom Strike* | Activating phase-shift allows projectiles and beams to pierce solid cover obstacles at `-15%` projectile damage. |
| `if_void_strike` | **Void Phase Strike** | Rogue / Scholar (`Rogue/Wizard`) | `C-17` (Step 2) ← *Phase-Geometry Shot* | Attacks landed during phase intangibility bypass Layer 1 Shields and `50%` of Armor `THR`; **trade-off:** `+18` Heat per phase strike. |
| `if_overcharge` | **Reactor Overcharge** | Scholar (`Wizard`) | `C-04` (Step 3) ← *Sustained Channeling* | Spend `35%` Energy + `+25` Heat to empower next attack by `+45%`; **trade-off:** disables Layer 1 Shield regen for `3.5s`. |

#### Tier IV — Advanced Fire-Control Links (`5 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Min-Max Trade-Off |
| :--- | :--- | :--- | :---: | :--- |
| `if_main_twin_link` | **Main-Aux Twin-Link** | Fighter (`Warrior`) | `C-06` (Step 2) ← *Sidearm Twin-Link* | Links main-hand (`slot1`) and off-hand/aux (`slot2`/`slot3`) weapons to fire synchronized volleys (`+30%` combined Recoil & Heat). |
| `doc_siege_battery` | **Bombardier Fire-Mission Doctrine** | Rogue (`Marauder`) | `if_suppression_link` + `fr_siege_stability` | `Blast` / `Meteoric` / `Nova` / `Stellar` / `Beam Caster` + `Rack` / `Battery` / `Pangao` / `Plumbata` (`Heavy`): Overrides dorsal munitions with multi-target soft-lock artillery barrages; **trade-off:** `-20%` stride speed while locked. |
| `if_spectral_volley` | **Spectral Volley** | Rogue / Scholar (`Rogue/Wizard`) | `C-03` (Step 3) ← *Phantom Barrage* | Fire suppressed/energy ranged shots while cloaked without breaking stealth for `2.5s` (`-25%` projectile BCU while cloaked). |
| `if_dimensional_strike` | **Dimensional Blink Strike** | Rogue / Scholar (`Rogue/Wizard`) | `C-17` (Step 3) ← *Void Phase Strike* | Phase-teleports behind locked target for an automatic sweetspot strike (`1.0× BCU`) before returning to origin (`16s` CD, `+20` Heat). |
| `if_arcane_mastery` | **Resonance Penetration** | Scholar (`Wizard`) | `C-04` (Step 4) ← *Reactor Overcharge* | Sustained or charged energy attacks ignore `40%` of target Shield/Armor mitigation (`RTG`); **trade-off:** `-20%` damage against unshielded/unarmored targets. |

#### Tier V — Apex Fire-Control Capstones (`3 Nodes` · `Rule P-03` Max 2 Total)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Old-School Min-Max Trade-Off |
| :--- | :--- | :--- | :---: | :--- |
| `apex_salvo_link` | **Salvo Link** | Fighter / Rogue (`Warrior/Marauder`) | `C-06` (Step 3) ← *Main-Aux Twin-Link* | Chains heavy or paired weapons into synchronized twin-linked salvo bursts; **trade-off:** `1.2s` weapon-lockout cooling vent after each linked salvo. |
| `apex_multi_lock` | **Multi-Lock Array** | Rogue (`Marauder`) | `doc_siege_battery` + `artilleryOptics` | Dorsal rocket/missile batteries lock onto up to `4` targets simultaneously (`0.75× BCU` per warhead); **trade-off:** `+25` Heat per multi-lock salvo. |
| `apex_arcane_annihilation` | **Arcane Annihilation** | Scholar (`Wizard`) | `C-04` (Step 5) ← *Resonance Penetration* | `3.0s` immobile ($\mu = 0$) channeled charge unleashes a `320% BCU` (`173` dmg) piercing beam discharge (`90s` CD); **trade-off:** spikes Reactor Heat to `100%` and strips all Layer 1 Shields on fire. |

---

## 5. Domain 2: Frame Systems (`53 Nodes`)

*Governs chassis engineering—Layer 1 Shields, Layer 2 Armor plating, corrosive hazard seals, Inertia/Stability ($S$), Load Weight capacity, Booster thrusters, and Reactor thermal regulation.*

### 5.1 Branch 2A: Defensive Architecture (`24 Nodes`)

#### Tier I — Foundational Chassis Defenses (`5 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Chain / Role | Mechanical Effect & Skill Requirement |
| :--- | :--- | :--- | :---: | :--- |
| `fr_shield_charge` | **Shield Charge** | Fighter (`Guardian`) | Chain `C-01` (Step 1) | Charge forward with `Action 4: Block` shield raised; impact stuns target for `1.2s` (`8s` CD, `+10` Heat). |
| `fr_radiant_dash` | **Radiant Dash** | Fighter (`Warrior/Guardian`) | Chain `C-08` (Step 1) | Booster dash leaves a radiant shimmer (`+8` Stability) and blinds adjacent enemies (`0.9s`, `10s` CD). |
| `fr_stabilizer_pulse` | **Stabilizer Pulse** | Fighter / Rogue (`Guardian/Marauder`) | Chain `C-14` (Step 1) | Anchored `Action 4: Block` shield ($\mu = 0$) emits a pulse reducing incoming ranged damage by `-12%`. |
| `fr_momentum_guard` | **Momentum Guard** | Fighter / Rogue (`Warrior/Marauder`) | Chain `C-07` (Step 1) | Grants `+12` Stability ($S$) and stagger resistance while boosting. |
| `fr_reactive_healing` | **Reactive Triage Pulse** | Scholar (`Cleric`) | Chain `C-18` (Step 1) | Self or ally within `15m` dropping below `30%` Integrity triggers an auto-pulse restoring `+24` Layer 1 Shield (`20s` CD). |

#### Tier II — Foundational Chassis Defenses (`6 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Skill Requirement |
| :--- | :--- | :--- | :---: | :--- |
| `fr_radiant_ward_flare` | **Radiant Ward Flare** | Fighter (`Warrior/Guardian`) | `C-08` (Step 2) ← *Radiant Dash* | Successful **Perfect Blocks** (`Action 4: Block`) emit a flash blinding nearby enemies (`1.1s`, `8s` CD). |
| `fr_protectors_aura` | **Protector's Interference Aura** | Fighter (`Guardian`) | `C-14` (Step 2) ← *Stabilizer Pulse* | Reserves `20%` max Energy to project an interference field that deflects light ballistics (`< 0.35× BCU`). |
| `fr_aura_of_suppression` | **Suppression Field Projector** | Rogue / Fighter (`Marauder/Guardian`) | `C-11` (Step 1) ← *Stabilizer Pulse* | Projects an `8m` electronic field reducing nearby enemy lock accuracy by `-15%` (`+4` Heat/s while active). |
| `fr_corrosive_seal` | **Corrosive Plating Seal** | Fighter / Rogue (`Guardian/Marauder`) | `fr_momentum_guard` | Reduces Layer 2 Armor `DUR` corrosion from bog water (`~`) and acid/DoT ticks by `-50%`. |
| `fr_martyrs_resolve` | **Martyr's Resolve** | Scholar (`Cleric`) | Chain `C-05` (Step 1) | Gain `+15%` damage reduction while redirecting ally damage via Martyrdom plating. |
| `fr_energy_redistribution` | **Capacitor Redistribution** | Scholar (`Wizard/Cleric`) | `fr_reactive_healing` | Taking hull/armor damage converts `20%` of raw hit into Reactor Energy (`2s` internal CD). |

#### Tier III — Chassis Bulwarks & Reactive Plating (`5 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Min-Max Trade-Off |
| :--- | :--- | :--- | :---: | :--- |
| `fr_overclock_guard` | **Overclocked Reactive Plate** | Fighter / Rogue (`Warrior/Marauder`) | `C-07` (Step 2) ← *Momentum Guard* | Above `65%` Reactor Heat, exterior plating hardens (`+2` Armor `RTG`, `+10` Stability); **trade-off:** `-10%` stride speed while superheated. |
| `fr_recoil_absorber` | **Recoil-to-Kinetic Absorber** | Fighter / Rogue (`Warrior/Marauder`) | `fr_corrosive_seal` | Converts Ranged Recoil impulse and blocked impact force directly into `+15%` forward Directional Charge ($\mu$). |
| `fr_attrition_guard` | **Kinetic Recycling Plating** | Rogue (`Marauder`) | `fr_corrosive_seal` | Converts incoming armor hits into Reactor Energy (`+6` Energy per hit, `1.5s` CD). |
| `fr_empowered_ward` | **Reflective Aegis Lattice** | Scholar (`Wizard/Cleric`) | `fr_energy_redistribution` | Active Layer 1 Shields reflect `20%` of blocked energy damage back to the attacker (`+4` Heat per reflection). |
| `fr_mass_restoration` | **Expanded Triage Field** | Scholar (`Cleric`) | `C-18` (Step 2) ← *Reactive Triage Pulse* | Increases triage/ward aura radius by `+50%` and adds `+10` Shield restoration; **trade-off:** `+15%` utility cooldown. |

#### Tier IV — Heavy Fortress & Sanctified Wards (`5 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Min-Max Trade-Off |
| :--- | :--- | :--- | :---: | :--- |
| `fr_overclocked_ward` | **Overclocked Barrier Core** | Fighter / Rogue (`Warrior/Guardian`) | `C-08` (Step 3) ← *Radiant Ward Flare* | Accelerates Layer 1 Shield recharge by `+25%` and grants stagger immunity while shields hold; **trade-off:** `-20` Layer 2 Armor `DUR`. |
| `fr_siege_ward` | **Sanctified Siege Dome** | Fighter / Rogue (`Guardian/Marauder`) | `C-14` (Step 3) ← *Protector's Interference Aura* | Protective shield spheres grant stagger immunity to allies inside (`8s` duration, `24s` CD). |
| `fr_barrier_network` | **Linked Barrier Network** | Scholar (`Wizard/Cleric`) | `fr_empowered_ward` | Links active shields across nearby allies within `12m` to share incoming damage absorption (`50/50` split). |
| `fr_consecrated_ground` | **Consecrated Ground** | Scholar (`Cleric/Wizard`) | `C-18` (Step 2) ← *Expanded Triage Field* | Deploys a `8s` sanctified zone (`6m` radius) that restores `+4` Shield/s to allies and deals `0.2× BCU/s` Wave damage to hostiles (`25s` CD). |
| `fr_selfless_sacrifice` | **Selfless Sacrifice** | Scholar (`Cleric`) | `C-05` (Step 2) ← *Martyr's Resolve* | Intercepts lethal ally damage onto your own Frame (`clamping ally at 1 HP`) and grants `2.5s` damage immunity (`60s` CD). |

#### Tier V — Apex Defensive Capstones (`3 Nodes` · `Rule P-03` Max 2 Total)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Old-School Min-Max Trade-Off |
| :--- | :--- | :--- | :---: | :--- |
| `apex_hardening_light` | **Hardening Light** | Fighter (`Guardian`) | `C-08` (Step 4) ← *Overclocked Barrier Core* | **Perfect Blocks** (`Action 4: Block`) with an energy shield reflect `100%` of the blocked projectile and restore `+15` Energy; **trade-off:** guard-break triggers a `2.5s` Shield Overload lockout. |
| `apex_judgment_battery` | **Judgment Battery** | Rogue / Fighter (`Marauder/Guardian`) | `C-14` (Step 4) ← *Sanctified Siege Dome* | Executing cleaves or salvos inside your radiant barrier grants `+20%` damage and `+8` Energy per hit; **trade-off:** leaving the dome drains `50%` of current Layer 1 Shields. |
| `apex_martyrdom_transcendent` | **Martyrdom Transcendent** | Scholar (`Cleric`) | `C-05` (Step 3) ← *Selfless Sacrifice* | Absorbs `50%` of nearby ally damage into your shields/armor (`10%` Frame HP floor) for `8s`, then releases a `+45` Shield restorative burst (`180s` CD). |

---

### 5.2 Branch 2B: Sub-System, Load & Reactor Tuning (`29 Nodes`)

#### Tier I — Foundational Sub-Systems (`4 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Chain / Role | Mechanical Effect & Skill Requirement |
| :--- | :--- | :--- | :---: | :--- |
| `sub_booster_evasion` | **Booster Evasion** | Fighter (`Warrior`) | Chain `C-01` (Step 1) | Grants `0.18s` `i-frames` during `[B]` booster dash (`+4` Heat per dash). |
| `sub_siege_stability` | **Siege Outrigger Bracing** | Rogue (`Marauder`) | Chain `C-09` (Step 1) | Heavy/Medium outriggers grant `+18` Stability ($S$) while firing heavy ordnance or swinging 2H weapons. |
| `sub_load_struts` | **Load-Bearing Hydraulic Struts** | Fighter / Rogue (`Warrior/Marauder`) | Foundation (`F-05`) | Increases chassis Load Capacity by **`+18 WT`**; **trade-off:** `-6%` booster dash distance. |
| `sub_radiant_overflow` | **Reactor Overflow Venting** | Scholar (`Wizard/Cleric`) | Chain `C-18` (Step 1) | Casting at `> 85%` Reactor Energy vents excess charge into a `+12` Layer 1 Shield pulse (`8s` CD). |

#### Tier II — Foundational Sub-Systems (`7 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Min-Max Trade-Off |
| :--- | :--- | :--- | :---: | :--- |
| `sub_anchored_action` | **Anchored Action Servos** | Rogue / Fighter (`Marauder/Guardian`) | `C-09` (Step 2) ← *Siege Outrigger Bracing* | While stationary ($\mu = 0$), shield raises (`Action 4: Block`) and counter-attacks gain full stagger immunity. |
| `sub_superheavy_clearance` | **Superheavy Gimbal Clearance** | Fighter / Rogue (`Warrior/Marauder`) | `F-05` (*Load-Bearing Hydraulic Struts*) | Grants **`+20 WT`** Load Capacity and eliminates recoil movement penalties on `Heavy` weapons; **trade-off:** `-6%` base stride speed. |
| `sub_shared_resonance` | **Harmonic Capacitor Efficiency** | Scholar (`Wizard/Cleric`) | `C-18` (Step 1) ← *Reactor Overflow Venting* | Active buffs and wards reduce Reactor Heat and Energy costs by `-10%`. |
| `sub_optic_telemetry_link` | **Optic Telemetry Amplifier** | Rogue / Scholar (`Rogue/Wizard`) | Foundation (`F-06`) | Extends personal light halo by `+0.5` tiles and reveals submerged/cloaked targets `+25%` further in Æther Fog. |
| `sub_vent_baffles` | **Rapid Radiator Baffles** | Fighter / Scholar (`Warrior/Wizard`) | Foundation (`F-07`) | Double-tapping `[X]` tactical reload/vent purges `-20%` additional Reactor Heat and trims vent recovery time by `-12%`. |
| `sub_stabilizer_gyros` | **Inertial Gyro-Stabilizers** | Fighter (`Guardian`) | `sub_anchored_action` | Increases base chassis Stability ($S$) by `+10` and speeds knockdown recovery by `+20%`. |
| `sub_sprint_thrusters` | **Continuous Glide Thrusters** | Rogue (`Rogue`) | `sub_booster_evasion` | Reduces Reactor Heat buildup during sustained `[B]` continuous boost by `-25%`. |

#### Tier III — Sub-System Engines & Dorsal Automation (`7 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Min-Max Trade-Off |
| :--- | :--- | :--- | :---: | :--- |
| `sub_reactive_overload` | **Reactive Thermal Overload** | Fighter / Rogue (`Warrior/Marauder`) | `C-07` (Step 2) ← *Momentum Guard* | Taking damage trims active skill cooldowns by `-6%` per hit (max `3×`, decays after `4s`; `+5` Heat per trigger). |
| `sub_thermal_shockwave` | **Thermal Vent Shockwave** | Fighter / Scholar (`Warrior/Wizard`) | `F-07` (*Rapid Radiator Baffles*) | Venting Reactor Heat (`[X]` reload/vent or `Thermal Vent Purge`) releases an outward `3.0m` concussive heat-blast (`0.35× BCU`, high pushback). |
| `sub_dorsal_autoloader` | **Dorsal Launcher Auto-Loader** | Rogue (`Marauder`) | `F-05` (*Load-Bearing Hydraulic Struts*) | Dorsal Back-Mounted Launchers (`slot3` Carriers & Munitions) auto-cycle `+1` salvo charge every `4.5s` while main-hand weapons fire. |
| `sub_disruption_field` | **Extended Disruption Emitter** | Rogue (`Marauder`) | `C-11` (Step 2) ← *Suppression Field Projector* | Increases the duration and radius of interference/vapor launcher clouds by `+40%`. |
| `sub_benediction_pulse` | **Kill-Switch Benediction Relay** | Scholar (`Cleric/Wizard`) | `sub_shared_resonance` | Defeating an enemy triggers a `15m` harmonic pulse restoring `+12` Shield and `+10` Energy to allies (`6s` CD). |
| `sub_phase_capacitor` | **Phase-Shift Capacitor** | Rogue / Scholar (`Rogue/Wizard`) | `F-06` (*Optic Telemetry Amplifier*) | Trims cooldowns on `VX Phase-Shift`, `ARC Rift Anchor`, and mobility utilities by `-15%`. |
| `sub_kinetic_dynamo` | **Kinetic Dynamo Striders** | Fighter / Rogue (`Warrior/Rogue`) | `sub_sprint_thrusters` | Gliding at full speed for `1.5s` vents `-8` Reactor Heat and charges `+10` Energy. |

#### Tier IV — High-Commit Sub-System Loops (`6 Nodes`)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Min-Max Trade-Off |
| :--- | :--- | :--- | :---: | :--- |
| `sub_overclock_barrage` | **Overclock Barrage** | Fighter / Rogue (`Warrior/Marauder`) | `C-07` (Step 3) ← *Reactive Thermal Overload* | Boosts fire/strike tempo by `+15%` (respecting `±30%` cap) for `5s` (`18s` CD); **trade-off:** `+40%` Reactor Heat generation during surge. |
| `sub_guardians_dash` | **Guardian's Ram-Thruster** | Fighter (`Warrior/Guardian`) | `C-01` (Step 2) ← *Booster Evasion* | Boosting through enemies triggers a shield shock-pulse that stuns for `1.2s` and restores `+18` Shield (`12s` CD, `+14` Heat). |
| `sub_font_of_power` | **Font of Power** | Scholar (`Wizard/Cleric`) | `C-18` (Step 3) ← *Expanded Triage Field* | Grants `+25%` Energy regeneration and `+20%` Heat venting to self and allies within `16m`. |
| `sub_recoil_compensator` | **Siege Hydraulic Anchor** | Rogue (`Marauder`) | `C-09` (Step 3) ← *Anchored Action Servos* | Eliminates backward Ranged Recoil displacement while anchored ($\mu = 0$) and boosts heavy cannon velocity by `+15%`; **trade-off:** `0.4s` anchor-deploy windup before moving. |
| `sub_aether_sensor_fusion` | **Æther Sensor Fusion** | Rogue / Scholar (`Rogue/Wizard`) | `sub_phase_capacitor` | Marked/scanned targets (`Optic Target Painter` or `VX Smoke`) suffer `+15%` sweetspot spacing damage (`+10%` Armor `DUR` shred). |
| `sub_emergency_heatsink` | **Emergency Cryo-Shunt** | Fighter / Scholar (`Warrior/Wizard`) | `sub_thermal_shockwave` | Reaching `100%` Reactor Overheat auto-purges `-60` Heat into a `3.5m` wave ring instead of locking weapons (`45s` CD); **trade-off:** drains `50%` of current Layer 1 Shields. |

#### Tier V — Apex Sub-System Capstones (`5 Nodes` · `Rule P-03` Max 2 Total)
| Node ID | Feat Name | Umbrella / Sector | Prereq / Chain | Mechanical Effect & Old-School Min-Max Trade-Off |
| :--- | :--- | :--- | :---: | :--- |
| `apex_core_overclock` | **Core Overclock** | Fighter (`Warrior`) | `C-07` (Step 4) ← *Overclock Barrage* | Immediately resets all active skill and utility cooldowns (`45s` CD); **trade-off:** spikes `+55` Reactor Heat and inflicts `-20` Stability ($S$) for `5.0s`. |
| `apex_avalanche_surge` | **Avalanche Surge** | Fighter / Rogue (`Warrior/Marauder`) | `C-10` (Step 3) ← *Suppression Link* | Fires `+1` bonus projectile per burst/salvo (`0.65× BCU` per extra round); **trade-off:** `+35%` Reactor Heat and `+25%` Ranged Recoil. |
| `apex_infinite_wellspring` | **Infinite Wellspring** | Scholar (`Wizard/Cleric`) | `C-18` (Step 4) ← *Font of Power* | Projects a sustained `12m` restoration aura (`+6` Shield/s) while stationary ($\mu = 0$); **trade-off:** drains `12` Energy/s and disables weapon fire while channeling. |
| `apex_colossus_frame` | **Colossus Gimbal Architecture** | Rogue (`Marauder`) | `sub_recoil_compensator` + `sub_superheavy_clearance` | Eliminates `Heavy` load bracket (`66%–100%`) movement/heat penalties and grants `+15` Stability ($S$); **trade-off:** disables `[B]` continuous boost and reduces turn rate by `-20%` (walking fortress). |
| `apex_zero_point_reactor` | **Zero-Point Harmonic Core** | Scholar (`Wizard`) | `sub_emergency_heatsink` | Reactor Heat venting directly converts `40%` of purged heat into Layer 1 Shield restoration; **trade-off:** `-25` max Layer 2 Armor `DUR`. |

---

## 6. Campaign Reward Feat (`1 Node`)

| Node ID | Feat Name | Domain | How It Is Earned | Permanent Effect |
| :--- | :--- | :---: | :--- | :--- |
| `reward_knights_oath` | **Knight's Oath** | `Interface` (`1A`) | Defeat **Sir Percival**, **Sir Tristan**, and **Sir Bors** simultaneously in Camelot Border Town | **`+10%` permanent bonus damage** against all Camelot enemies (`0` prerequisites) |

---

## 7. Emergent Historical Meta-Classes (`13 Archetypes`)

The Satchel `STATUS` and `FEATS` tabs automatically synthesize your **Interface (`1A/1B`) + Frame (`2A/2B`)** investments into **13 Emergent Historical Meta-Classes** without ever locking your chassis:

| Historical Class Title | Nested Domain Synthesis | Signature Doctrine / Mastery + Core Nodes |
| :--- | :--- | :--- |
| **Paladin / Hospitaller** | `Interface 1A` (Guardian/Cleric) + `Frame 2A` | `Fiore Half-Sword` or `Sanctum Hierophant` + `Radiant Cleave` + `Consecrated Ground` / `Martyr's Resolve` |
| **Knight** | `Interface 1A` (Guardian/Warrior) + `Frame 2A/2B` | `Fiore Half-Sword` or `Cataphract Clibanarii` + `Shield Charge` + `Inertial Gyro-Stabilizers` |
| **Hoplite / Phalangite** | `Interface 1A` (Guardian) + `Frame 2A` | `Hoplite Othismos` + `Sarissa Pike Mastery` + `Anchored Action Servos` + `Protector's Interference Aura` |
| **Samurai / Bushi** | `Interface 1A` (Warrior/Rogue) + `Frame 2B` | `Battojutsu`, `Niten Ichi-Ryu`, or `Reverse-Grip Dual Katana` + `Off-Hand Deflection` + `Backstab Mastery` |
| **Landsknecht** | `Interface 1A` (Warrior) + `Frame 2A/2B` | `Doppelsöldner Doctrine` + `Overload Cleave` + `Kinetic Recycling Plating` |
| **Huscarl / Viking Raider** | `Interface 1A` (Marauder/Guardian) + `Frame 2A` | `Huscarl Skjaldborg` or `Thracian Hook-Blade` + `Shield Charge` + `Attrition Riposte` |
| **Yeoman / Marksman** | `Interface 1A/1B` (Warrior/Rogue) + `Frame 2B` | `Yeoman Stake-Line` or `Cantabrian Outrider` + `Anchored Focus` + `Phantom Sniper` |
| **Corsair / Swashbuckler** | `Interface 1A/1B` (Rogue/Warrior) + `Frame 2B` | `Corsair Boarder` or `Destreza Main-Gauche` + `Sidearm Twin-Link` + `Shadow Step` |
| **Inquisitor** | `Interface 1A` (Cleric/Rogue) + `Frame 2A` | `Veil of Mercy` → `Healing Shadow` → `Shadow Siphon` → `Angel of Death` (`C-02`) |
| **Spellblade / Battlemage** | `Interface 1A/1B` (Wizard/Warrior) + `Frame 2B` | `Aether-Conduit Spellblade` + `Phase-Geometry Shot` → `Void Phase Strike` + `Reactor Overcharge` |
| **Hierophant / Monastic Cleric** | `Interface 1A` (Cleric) + `Frame 2A/2B` | `Sanctum Hierophant` or `Kaad: Sanctified Palm` + `Expanded Triage Field` + `Martyrdom Transcendent` |
| **Archmage / Artillerist** | `Interface 1A/1B` (Wizard) + `Frame 2B` | `Astral Fulcrum` + `Anchored Focus` → `Sustained Channeling` → `Arcane Annihilation` (`C-04`) |
| **Bombardier / Siegebreaker** | `Interface 1B` (Marauder) + `Frame 2B` | `Bombardier Fire-Mission` + `Dorsal Launcher Auto-Loader` + `Multi-Lock Array` + `Avalanche Surge` |