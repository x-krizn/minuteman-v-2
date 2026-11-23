# Project Orion — Legendary Weapons Framework

*A standalone architectural, lore, and data-schema specification for case-by-case folklore relics in Project Orion.*

---

## 📑 Table of Contents

1. [The Three-Tier Weapon Hierarchy](#1-the-three-tier-weapon-hierarchy)
2. [The Four Legendary Authoring Laws](#2-the-four-legendary-authoring-laws)
   - [Law 1: Environmental & Lore Telepathy (`Discernible by Area Lore`)](#law-1-environmental--lore-telepathy-discernible-by-area-lore)
   - [Law 2: Exclusive Engine Exception (`Accomplishes What Nothing Else Can`)](#law-2-exclusive-engine-exception-accomplishes-what-nothing-else-can)
   - [Law 3: Curated Mythic Restraint (`1 Per Folklore World, Case-by-Case`)](#law-3-curated-mythic-restraint-1-per-folklore-world-case-by-case)
   - [Law 4: Zero Standard Modding & Lore-Bound Companion Relics Only](#law-4-zero-standard-modding--lore-bound-companion-relics-only)
3. [Canonical Entry #1: Belldor — `Excalibur` & `The Scabbard of Avalon`](#3-canonical-entry-1-belldor--excalibur--the-scabbard-of-avalon)
   - [3.1 Sequential Acquisition Contract (`Arthur → Lady of the Lake`)](#31-sequential-acquisition-contract-arthur--lady-of-the-lake)
   - [3.2 Weapon & Companion Specification](#32-weapon--companion-specification)
4. [Canonical Entry #2: New Novarin & Novarin — `Yawarakai-Te`, `Juuchi Yosamu`, and `Yawarakai-Te & Juuchi Yosamu`](#4-canonical-entry-2-new-novarin--novarin--yawarakai-te-juuchi-yosamu-and-yawarakai-te--juuchi-yosamu)
   - [4.1 The Creek Contest & Elven–Orcish Schism Lore](#41-the-creek-contest--elvenorcish-schism-lore)
   - [4.2 Frame-Phase Mitigation & Two-Bladed Fusion Specification](#42-frame-phase-mitigation--two-bladed-fusion-specification)
5. [Canonical Entry #3: Tyrranus — `Aegis` & `Medusa's Head`](#5-canonical-entry-3-tyrranus--aegis--medusas-head)
   - [5.1 Sanctum Acquisition & Tyrranus Lore](#51-sanctum-acquisition--tyrranus-lore)
   - [5.2 Shield & Gorgoneion Specification](#52-shield--gorgoneion-specification)
6. [Canonical Entry #4: Golem — `Knives of the Lake of Fire`](#6-canonical-entry-4-golem--knives-of-the-lake-of-fire)
   - [6.1 Underworld Gatekeeper Lore & Secret 4-Boss Drop](#61-underworld-gatekeeper-lore--secret-4-boss-drop)
   - [6.2 Dual-Wield & Soul-Severing Specification](#62-dual-wield--soul-severing-specification)
7. [Canonical Entry #5: Orion — `Balmung`](#7-canonical-entry-5-orion--balmung)
   - [7.1 Deep-Crust Forge Lore & Siegfried Acquisition](#71-deep-crust-forge-lore--siegfried-acquisition)
   - [7.2 Unstoppable Greatsword Specification](#72-unstoppable-greatsword-specification)
8. [World-to-Hazard Summary & Reference Blueprints](#8-world-to-hazard-summary--reference-blueprints)
9. [TypeScript Data Schema & Engine Hook Contract](#9-typescript-data-schema--engine-hook-contract)

---

## 1. The Three-Tier Weapon Hierarchy

With `Custom` and `Magitech` weapons already defined, **Legendary Weapons** complete a three-tier hierarchy with zero functional overlap:

| Tier | Roster Role | Modification Authority | Build Purpose |
| :--- | :--- | :--- | :--- |
| **`Custom` Weapons** *(72 Archetypes)* | Modular gap-fillers (`weapon_mod_overhaul.md`) | **3 Standard Component Slots** (`Contact`, `Delivery`, `Regulation`) + **`1–3` Gem Sockets** | Tune physical behavior (`damageType`, `Impulse J`, `Action 1`, `WT`) to patch holes in open-ended hybrid builds. |
| **`Magitech` Weapons** *(32 Relics)* | Manufacturer purist relics (`magitech_purist_overhaul.md`) | **`0–3` Exposed Mil-Spec Mounts** (per hardware lore) + **`1` Resonance Gem Socket (`1G`)** | Fulfill and elevate the **22 Specialist Martial Stances** and **5 Core Feat Chains**. |
| **`Legendary` Weapons** *(Case-by-Case)* | Mythic folklore artifacts (`legendary_weapons_framework.md`) | **`0` Standard Mods · `0` Gem Sockets**; accepts **only named lore-bound companion relics** | Introduce a **unique mechanical rule** that exists nowhere else in the game, foreshadowed by the origin world's lore and hazards. |

---

## 2. The Four Legendary Authoring Laws

Every Legendary weapon added to Project Orion must satisfy four strict design laws:

### Law 1: Environmental & Lore Telepathy (`Discernible by Area Lore`)
- A Legendary relic's exclusive mechanic must be **thematically legible from the world's environmental hazards, architecture, and folklore** before the player ever inspects its stats.
- *Benchmark Examples*:
  - **The Bog** on Belldor is defined by corrosive mire and periodic Damage-over-Time (`DoT`) decay—foreshadowing **Excalibur's Scabbard** preventing death from DoT.
  - **New Novarin** (Elves) and **Novarin** (corrupted Elves / Orcs) represent a split civilization—foreshadowing two opposing half-swords tested in a mountain creek (`Yawarakai-Te` and `Juuchi Yosamu`) that fuse into one two-bladed whole.
  - **Tyrranus** is defined by relentless phalanx volleys and unstoppable arena champions—foreshadowing **Aegis** and **Medusa's Head**.
  - **Golem** is saturated with reanimated undead and self-repairing constructs—foreshadowing **Knives of the Lake of Fire** permanently killing enemies that normally resurrect.
  - **Orion** is a subterranean dwarven forge-world of crushing seismic crushers and heavy armored giants—foreshadowing **Balmung**'s unyielding hyper armor and zero hit-stop.

### Law 2: Exclusive Engine Exception (`Accomplishes What Nothing Else Can`)
- Legendary weapons never rely on inflated `BCU` multipliers, extra Frame Integrity above `200`, or breaking the $\pm 30\%$ combat speed hard cap.
- Instead, every Legendary weapon (and each lore-bound companion piece) enables a **binary mechanical rule or engine boundary exception** that cannot be replicated by any Feat, Gemstone, `Custom` component, or `Magitech` relic.

### Law 3: Curated Mythic Restraint (`1 Per Folklore World, Case-by-Case`)
- Project Orion does **not** port entire mythological encyclopedias. At most **one Legendary weapon** (or paired world-schism / multi-drop set) is authored per major folklore-anchored world (`Belldor`, `Tyrranus`, `Orion`, `Novarin`, `Chyme`, `Golem`, `New Novarin`, `Sin`, etc.), crafted case-by-case around that world's signature hazard and apex encounter.

### Law 4: Zero Standard Modding & Lore-Bound Companion Relics Only
- **Immutable Relic Rule**: Legendary weapons cannot accept `CRAFTED` or `LOOTED` generic weapon parts (`allowStandardMods: false`) and have no Gemstone sockets (`maxGemSlots: 0`).
- **Lore-Bound Sub-Components**: A Legendary weapon exposes a modification slot **only if its folklore explicitly includes an inseparable companion artifact** (such as *Excalibur + The Scabbard of Avalon*, *Yawarakai-Te + Juuchi Yosamu*, or *Aegis + Medusa's Head*).
- **Functional Class Inheritance**: Every Legendary weapon still declares a canonical **`functionalClass`** (e.g., `Bastard Sword`, `Katana`, `Scutum`, `Khopesh`, `Zweihander`) so it remains compatible with **Specialist Martial Stances** unless explicitly restricted by its own mythic constraint.

---

## 3. Canonical Entry #1: Belldor — `Excalibur` & `The Scabbard of Avalon`

### 3.1 Sequential Acquisition Contract (`Arthur → Lady of the Lake`)

1. **Sole Legendary on Belldor**: **Excalibur** is the **only** Legendary weapon native to Belldor (Camelot).
2. **Step 1 — Defeating King Arthur**: Excalibur is awarded upon defeating **King Arthur** in Camelot's Interior (`worldState.arthurDefeated = true`).
3. **Step 2 — Post-Arthur Awakening of the Lady of the Lake**:
   - In Stage 1 (*The Bog*), Bedivere's wreckage yields his cryptic **Numbered List** of items scattered across Belldor.
   - Gathering every item on Bedivere's list **and** returning to the deep bog water awakens **The Lady of the Lake** (half machine, half serpent) **only if `worldState.arthurDefeated === true`**.
   - *Sequence-Break Guardrail*: If a pilot collects all list items before defeating Arthur, interacting with the deep bog water displays an atmospheric seal message (*"The dark water stirs beneath the mist, yet the sovereign's seal still holds the lake at bay..."*) without spawning the encounter.
4. **Step 3 — Claiming the Scabbard**: Defeating **The Lady of the Lake** awards **The Scabbard of Avalon**, which slots into Excalibur's sole lore-bound slot at the Armory Workbench, transforming its title to **`Excalibur, Sheathed in Avalon`**.

---

### 3.2 Weapon & Companion Specification

| Property | Canonical Specification |
| :--- | :--- |
| **Base Relic Name** | **Excalibur** |
| **Transformed Name** | **Excalibur, Sheathed in Avalon** *(when Scabbard is slotted)* |
| **Tier & Origin World** | `LEGENDARY` · **Belldor (`belldor`)** — *Arthurian Knights & Grail Myth* |
| **Weapon Class & Functional Type** | `Blades: Straight` ▸ `Bastard Sword` (`Versatile 1H / 2H`) |
| **Damage Type & Weight** | `Pierce` (1H thrust/cut) / `Beam` edge arc (2H) · `12 WT` |
| **Modification Authority** | `0` Standard Component Slots · `0` Gem Sockets · **`1` Lore-Bound Slot (`scabbard_of_avalon`)** |
| **Sword Exclusive Feature** | **`Sovereign's Decree` (Unconditional Shield Bypass)**: Melee strikes bypass **Layer 1 Energy Shields** completely on every hit, applying damage directly to **Layer 2 Armor** (and **Layer 3 Frame Integrity** once armor breaks) without requiring active phase-shift intangibility. |
| **Scabbard Exclusive Feature** | **`Avalon's Immortality` (Lethal DoT Prevention)**: **Prevents death from any Damage-over-Time (`DoT`) source.** Any lethal periodic tick (bleed, burn, poison, corrosive/ætheric decay) clamps **Layer 3 Frame Integrity at `1 HP`** instead of `0 HP`. *(Direct physical or energy impact hits still kill normally).* |

---

## 4. Canonical Entry #2: New Novarin & Novarin — `Yawarakai-Te`, `Juuchi Yosamu`, and `Yawarakai-Te & Juuchi Yosamu`

### 4.1 The Creek Contest & Elven–Orcish Schism Lore

- **The Makers (`Masamune` & `Muramasa`)**: Neither blade bears its maker's name; instead, the rival master smiths **Masamune** and **Muramasa** live on in the legend of the **creek contest**. When the two smiths planted their blades in a mountain stream to test their spirit and balance, **Yawarakai-Te** (*"Tender Hands"*), forged by **Masamune**, avoided cutting innocent things like swimming fish and drifting leaves—symbolizing restraint and compassion. **Juuchi Yosamu** (*"10,000 Cold Nights"* / *"10,000 Winters"*), forged by **Muramasa**, cut everything that passed it—leaves, fish, and even the air—symbolizing indiscriminate sharpness and bloodthirst.
- **The Elven–Orcish Split**: On **Novarin**, the ancestral Orc warbands are **corrupted Elves** severed from their kin on **New Novarin**.
  - **Yawarakai-Te** (*Tender Hands*) is safeguarded by the Elves on **New Novarin** (`originWorldId: 'new_novarin'`).
  - **Juuchi Yosamu** (*10,000 Cold Nights*) is wielded by the Orcs on **Novarin** (`originWorldId: 'novarin'`).
- **Armory Fusion (`Juuchi Yosamu` as a Lore-Bound Mod Component)**:
  - **Juuchi Yosamu** can be wielded independently as a standalone Legendary katana **or** installed into **Yawarakai-Te's** sole lore-bound mod slot at the Armory Workbench (and unslotted back into inventory at any time).
  - Combining them joins the two hilts end-to-end into a balanced **two-bladed sword** titled **`Yawarakai-Te & Juuchi Yosamu`**.

---

### 4.2 Frame-Phase Mitigation & Two-Bladed Fusion Specification

Both **Yawarakai-Te** and **Juuchi Yosamu** share the **exact same base moveset** and declare `functionalClass: 'Katana'` (`Blades: Curved`). When fused into **`Yawarakai-Te & Juuchi Yosamu`**, the single two-bladed weapon **behaves as if both swords are equipped together** and counts as a **`Katana`** for all Feats and Specialist Martial Stances (`Odachi Specialist`, `Daisho Specialist`, `Spellblade Specialist`):

| Weapon State | Damage vs. Standard Katana | Attack Windup Frames | Active Hit Frames | Exclusive Frame-Phase Mitigation (`DR`) |
| :--- | :--- | :--- | :--- | :--- |
| **Yawarakai-Te** *(Solo · New Novarin · Forged by Masamune)* | **Weaker** (`~0.80×` Katana `BCU`) | **Longer** (`+20%` windup duration) | **Shorter** (`-20%` active hit window) | **`Tender Hands` (`DR_OUTSIDE_HIT_FRAMES`)**: Reduces incoming damage during **every frame *except* active attack hit frames** (neutral, glide, windup, and recovery). |
| **Juuchi Yosamu** *(Solo · Novarin · Forged by Muramasa)* | **Weaker** (`~0.80×` Katana `BCU`) | **Shorter** (`-20%` windup duration) | **Longer** (`+20%` active hit window) | **`10,000 Cold Nights` (`DR_DURING_HIT_FRAMES`)**: Reduces incoming damage **exclusively during active attack hit frames** (protecting hyper-aggressive trade swings). |
| **Yawarakai-Te & Juuchi Yosamu** *(Combined Two-Bladed Sword)* | **Dual-Equipped Output** *(Triggers both blades' hit instances simultaneously on every combo step)* | **Short Windup** (`-20%` windup — Juuchi Yosamu edge initiates) | **Extended Hit Frames** (`+20%` active window — twin-blade follow-through) | **Unbroken All-Phase Flow**: Combines `DR_OUTSIDE_HIT_FRAMES` + `DR_DURING_HIT_FRAMES` into **100% continuous passive damage reduction across every frame state**, while behaving as dual-equipped Katanas in a single main-hand slot. |

| Property | Canonical Specification |
| :--- | :--- |
| **Weapon Class & Functional Type** | `Blades: Curved` ▸ `Katana` *(Treated as `Katana` for all Feats & Specialist Stances)* |
| **Form & Grip (`Combined`)** | **Two-Bladed Sword** (`2H` twin-end hilt in `slot1`, evaluated as `isDualWielding = true` and `countsAsPairedOffhandBlade = true` for `Daisho Specialist`) |
| **Damage Type & Weight** | `Pierce` · `9 WT` (Solo) / `16 WT` (Combined **Yawarakai-Te & Juuchi Yosamu**) |
| **Modification Authority** | `0` Standard Component Slots · `0` Gem Sockets · **`1` Lore-Bound Slot (`leg_juuchi_yosamu`)** |
| **Exclusive Engine Feature** | **`Frame-Phase Mitigation & Twin-Blade Fusion`**: Frame-conditional damage reduction (`outside hit frames` vs. `inside hit frames`) that merges into continuous all-phase `DR` and simultaneous dual-sword execution when fused into **Yawarakai-Te & Juuchi Yosamu**. |

---

## 5. Canonical Entry #3: Tyrranus — `Aegis` & `Medusa's Head`

### 5.1 Sanctum Acquisition & Tyrranus Lore

- **Sole Legendary on Tyrranus**: **Aegis** is the thunder-forged skyward shield native to **Tyrranus** (`originWorldId: 'tyrranus'`, Greek & Roman folklore).
- **Acquiring Aegis (Post-Zeus Sanctum Vault)**: After defeating **Zeus** in Tyrranus's imperial acropolis, a sealed marble chamber opens behind his throne room; **Aegis** is looted directly from the sanctum chest inside (`worldState.zeusDefeated = true`).
- **Acquiring Medusa's Head (`Gorgoneion`)**: Deep within Tyrranus's sunken marble labyrinth, defeating the Gorgon **Medusa** yields **Medusa's Head**, which mounts onto the central boss of **Aegis** at the Armory Workbench, transforming its title to **`Aegis of the Gorgon`**.
- **Environmental & Lore Alignment**: Tyrranus is defined by overwhelming phalanx volleys, crushing heavy-impulse colossus strikes, and unstoppable arena champions. Aegis answers the relentless barrage with an unbreakable directional guard, while Medusa's Head answers unstoppable arena champions by petrifying targets that normally ignore crowd control.

---

### 5.2 Shield & Gorgoneion Specification

| Property | Canonical Specification |
| :--- | :--- |
| **Base Relic Name** | **Aegis** |
| **Transformed Name** | **Aegis of the Gorgon** *(when Medusa's Head is slotted)* |
| **Tier & Origin World** | `LEGENDARY` · **Tyrranus (`tyrranus`)** — *Greek & Roman Folklore* |
| **Weapon Class & Functional Type** | `Shields` ▸ `Scutum` *(Compatible with `Legionary`, `Spear & Shield`, and `Phalanx` Specialist Stances)* |
| **Damage Type & Weight** | `Impact` (bash/charge) / `Beam` (ward discharge) · `14 WT` |
| **Layer 2 Armor Profile** | `165 DUR` · `14 RTG` · `10 THR` *(Grants Layer 2 Armor per Shield physical domain rules)* |
| **Modification Authority** | `0` Standard Component Slots · `0` Gem Sockets · **`1` Lore-Bound Slot (`medusas_head`)** |
| **Shield Exclusive Feature** | **`Thunder-Forged Skyward` (Unbreakable Directional Guard)**: While actively holding directional guard (`Action 4`), **your guard can never be staggered, crushed, or guard-broken by high-impulse heavy hits or suppression stacks**—even when Layer 1 Shields and Layer 2 Armor Durability reach `0`, Aegis holds its posture against frontal attacks. |
| **Companion Exclusive Feature** | **`Gorgon's Gaze` (CC-Immunity Bypassing Petrification)**: Performing an **Action 4 Perfect Block (`0.34s` window)** or **Action 1 Shield Bash Finisher** unleashes a conical petrifying glare that **turns struck enemies to stone (`Hard-Lock Freeze`) for `2.0s`—including Bosses and Unstoppable enemies that normally resist or ignore crowd control** (`14s` internal cooldown; bosses gain `8s` *Stone-Hardened* immunity after thawing). |

---

## 6. Canonical Entry #4: Golem — `Knives of the Lake of Fire`

### 6.1 Underworld Gatekeeper Lore & Secret 4-Boss Drop

- **Egyptian Funerary Lore (*Book of the Dead*, *Amduat*, *Book of Gates*)**: Khopesh-sized underworld executioner blades—oversized ritual *des* knives and curved celestial cleavers—wielded by **Shesmu and the Slaughterers of Osiris**, the **Gatekeepers of the Duat** (*"He Who Dances in Blood"*, *"Sharp-of-Knives"*, *"Lord of Slaughter"*), the **Cat of Heliopolis** (Aspect of Ra severing Apep beneath the Ished tree), and **Khenti-kheti** temple guardians.
- **Metaphysical Severance & Gatekeeper Radiance**: In funerary lore, these curved blades cut apart a target's spiritual anatomy—severing the **Ba** (soul/personality), **Ka** (life force), and **Shut** (shadow) so the dead can never reassemble—while emitting a blinding funerary radiance that freezes intruders in terror.
- **Area Lore Alignment on Golem**: **Golem** is saturated with **reanimated undead** and **self-rebuilding animated constructs (golems)** that rise again after being felled. An executioner blade that permanently severs resurrecting entities directly counters Golem's core threat.
- **Multi-Drop Acquisition (`Up to 4 Blades in One Pass`)**:
  - Unlike single-instance relics, **Knives of the Lake of Fire** can drop from multiple underworld gatekeeper enemies on Golem.
  - Specifically, Golem's final area contains a **secret 4-boss encounter** (representing the four Gatekeepers of the Lake of Fire) where **each of the 4 bosses can drop 1 blade**, allowing a pilot to acquire **up to 4 total blades in a single pass**—enabling a **true dual-wield** setup (`slot1` + `slot2`) as well as a second paired set in Weapon Set 2.

---

### 6.2 Dual-Wield & Soul-Severing Specification

| Property | Canonical Specification |
| :--- | :--- |
| **Relic Name** | **Knives of the Lake of Fire** *(Collectible up to `4` copies per pass)* |
| **Tier & Origin World** | `LEGENDARY` · **Golem (`golem`)** — *Egyptian Underworld / Book of the Dead Lore* |
| **Weapon Class & Functional Type** | `Blades: Curved` ▸ `Khopesh` *(Compatible with `Shield-Breaker`, `Boarder`, and `Spellblade` Specialist Stances)* |
| **Damage Type & Weight** | `Pierce` (curved executioner edge) · `8 WT` per blade (`16 WT` when dual-wielded in `slot1` + `slot2`) |
| **Grip & Dual-Wield Authority** | **`1H` True Dual-Wield Eligible** (Equips in `slot1` Main Hand, `slot2` Side Hand, or both simultaneously) |
| **Modification Authority** | `0` Standard Component Slots · `0` Gem Sockets · `0` Lore-Bound Slots *(Immutable Relics)* |
| **Exclusive Engine Feature** | **`Sever the Ba, Ka & Shut` (Permanent Resurrection Prevention)**: **Permanently kills enemies that normally resurrect.** Any undead, reanimated husk, or self-repairing construct slain by these blades has its resurrection trigger permanently disabled (`preventResurrection = true`). |
| **Active Tactical Skill (`Action 3`)** | **`Glance of the Gatekeeper` (Frontal Stun/Blind Cone)**: Projects a searing funerary radiance cone in front of the wielder (`[Y]` tap) that **stuns (`1.2s`) and blinds (`2.5s`)** caught enemies. When dual-wielding two *Knives of the Lake of Fire*, the cone widens into an overlapping dual-gatekeeper sweep. |

---

## 7. Canonical Entry #5: Orion — `Balmung`

### 7.1 Deep-Crust Forge Lore & Siegfried Acquisition

- **Germanic & Dwarven Forge Lore (*Nibelungenlied*)**: **Balmung** is a monumental, dwarf-forged two-handed dragon-slayer greatsword born in the deep-crust foundries of **Orion** (`originWorldId: 'orion'`, Dwarven forge-world with Germanic/Nibelung mythic resonance).
- **Acquisition Gate**: Awarded upon defeating **Siegfried** on Orion (`worldState.siegfriedDefeated = true`).
- **Area Lore Alignment on Orion**: Orion is defined by subterranean gravity crushers, heavy industrial forge hammers, and towering armored constructs designed to stagger and pin lighter frames. A dwarf-forged dragon-slayer blade that **never staggers** and **cleaves through armor with zero hit-stop** embodies Orion's relentless kinetic mastery.

---

### 7.2 Unstoppable Greatsword Specification

| Property | Canonical Specification |
| :--- | :--- |
| **Relic Name** | **Balmung** |
| **Tier & Origin World** | `LEGENDARY` · **Orion (`orion`)** — *Germanic / Nibelungenlied & Dwarven Forge Lore* |
| **Weapon Class & Functional Type** | `Blades: Straight` ▸ `Zweihander` *(Compatible with `Zweihander Specialist` / Landsknecht Doppelsöldner Stance)* |
| **Damage Type & Weight** | `Impact` / `Pierce` dragon-slayer edge · `20 WT` (`Heavy` class) |
| **Grip & Strict Pairing Lock** | **`2H` Exclusive (`strictTwoHandedNoOffhand: true`, `allowDorsalLauncherOnly: true`)**: **Cannot be paired with any side-hand (`slot2`) weapon or shield, even if Feats or Unique traits would normally allow 1H/paired wielding**—with the sole exception of **dorsal Back-Mounted Launchers (`Carriers & Munitions`)**. |
| **Modification Authority** | `0` Standard Component Slots · `0` Gem Sockets · `0` Lore-Bound Slots *(Immutable Relic)* |
| **Exclusive Engine Feature 1** | **`Nibelung Unyielding` (Permanent Hyper Armor)**: Grants **unconditional Hyper Armor (`ALWAYS_HYPER_ARMOR`) at all times while equipped**—you can never be flinched, staggered, or interrupted out of windups or movement by incoming hits. *(Incoming damage still applies normally to Shields, Armor, and Frame Integrity).* |
| **Exclusive Engine Feature 2** | **`Dragon-Cleaver Momentum` (Zero Hit-Stop)**: Attacks experience **zero hit-stop freeze frames (`hitStopMultiplier = 0`)** on impact against enemies, armor plates, or shields—cleaving straight through targets at full swing velocity. |
| **Exclusive Engine Feature 3** | **`Siegfried's Riposte` (Perfect-Block Melee Auto-Counter)**: Performing a successful **Action 4 Perfect Block (`0.34s` window)** against any melee strike **automatically triggers an immediate counter-cleave** without spending an action cooldown or input. |

---

## 8. World-to-Hazard Summary & Reference Blueprints

| World (`Folklore`) | Status | Area Lore & Environmental Hazard | Legendary Relic (`Functional Class`) | Companion / Multi-Drop Rule | Exclusive Engine Rule *(Exists Nowhere Else)* |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Belldor** *(Arthurian)* | **Canonical** | **The Bog**: Corrosive mire & periodic DoT decay. | **Excalibur** (`Bastard Sword`) *(Defeat Arthur)* | **The Scabbard of Avalon** *(Post-Arthur Lady of the Lake)* | **Scabbard**: Prevents death from **any DoT source** (`1 HP` clamp).<br>**Sword**: Strikes bypass **Layer 1 Shields** directly. |
| **New Novarin & Novarin** *(Elven / Orc Schism)* | **Canonical** | **Splintered Astral Arbors & Orc War-Forges**: Fractured kin split between restraint and frenzy. | **Yawarakai-Te** (`Katana` — New Novarin · Forged by Masamune) | **Juuchi Yosamu** (`Katana` — Novarin · Forged by Muramasa; fuses into **Yawarakai-Te & Juuchi Yosamu**) | **Solo**: Frame-phase `DR` (`outside hit frames` vs. `during hit frames`).<br>**Combined**: Two-bladed `Katana` acting as both swords equipped together with unbroken all-phase `DR`. |
| **Tyrranus** *(Greek & Roman)* | **Canonical** | **Marble Colonnades & Arena Gauntlets**: Relentless phalanx volleys & unstoppable arena champions. | **Aegis** (`Scutum`) *(Post-Zeus Sanctum Chest)* | **Medusa's Head** *(Defeat Medusa in Sunken Labyrinth)* | **Shield**: Unbreakable directional guard (`Action 4` cannot be staggered/guard-broken).<br>**Medusa's Head**: Perfect Block / Finisher petrifies enemies for `2.0s`, **bypassing Boss CC-immunity**. |
| **Golem** *(Egyptian Underworld)* | **Canonical** | **Necropolis & Automaton Ruins**: Reanimated undead & self-repairing constructs. | **Knives of the Lake of Fire** (`Khopesh`) | **Multi-Drop (`Up to 4`)**: Secret 4-boss stage in final area drops up to `4` blades in one pass (`True Dual-Wield`). | **Soul-Severing**: **Permanently kills enemies that normally resurrect**.<br>**Skill 3 (`Action 3`)**: Frontal **stun/blind cone** (`Glance of the Gatekeeper`). |
| **Orion** *(Germanic / Dwarven)* | **Canonical** | **Deep-Crust Forge-World**: Heavy seismic crushers & towering armored constructs. | **Balmung** (`Zweihander`) *(Defeat Siegfried)* | **None (`0` mods)** · Cannot pair with off-hand weapons/shields except **dorsal launchers**. | **Permanent Hyper Armor** (`ALWAYS_HYPER_ARMOR`), **Zero Hit-Stop** (`0ms` freeze frames), and **Perfect-Block Melee Auto-Counter**. |
| **Chyme** *(Draconic)* | *Template* | **Crucible Spires & Volcanic Vents**: Extreme ambient thermal overload. | **Crucible Wyrm-Blade** (`Odachi` or `Flamberge`) | *None (`0` bound slots)* | **Thermal Overdrive Immunity**: Reactor cannot trigger overheat lockout/self-damage; swings at `100%` heat vent forward flame cones. |

---

## 9. TypeScript Data Schema & Engine Hook Contract

The schema below isolates `Legendary` relics from `Custom` and `Magitech` modification pipelines while exposing clean engine hooks for every canonical Legendary mechanic:

```ts
import type { DamageType, WeaponClass } from './weapon_mod_overhaul';

export type LegendaryEngineHook =
  | 'BYPASS_LAYER1_SHIELDS'
  | 'PREVENT_LETHAL_DOT'
  | 'DR_OUTSIDE_ACTIVE_HIT_FRAMES'
  | 'DR_DURING_ACTIVE_HIT_FRAMES'
  | 'TWIN_BLADE_DUAL_EXECUTION'
  | 'UNBREAKABLE_DIRECTIONAL_GUARD'
  | 'BYPASS_BOSS_CC_IMMUNITY_PETRIFY'
  | 'PERMANENT_KILL_PREVENT_RESURRECT'
  | 'ALWAYS_HYPER_ARMOR'
  | 'ZERO_HIT_STOP'
  | 'PERFECT_BLOCK_MELEE_AUTO_COUNTER'
  | 'IMMUNE_TO_OVERHEAT_LOCKOUT';

export interface LoreBoundAttachment {
  id: string;                      // e.g., 'scabbard_of_avalon' | 'leg_juuchi_yosamu' | 'medusas_head'
  name: string;                    // e.g., 'The Scabbard of Avalon' | 'Juuchi Yosamu' | "Medusa's Head"
  originWorldId: string;           // e.g., 'belldor' | 'novarin' | 'tyrranus'
  requiredWorldFlags: string[];    // e.g., ['arthur_defeated', 'bedivere_list_complete']
  acquisitionSource: string;
  canBeEquippedStandalone?: boolean; // True for Juuchi Yosamu; false for Scabbard / Medusa's Head
  transformedWeaponTitle?: string; // e.g., 'Excalibur, Sheathed in Avalon' | 'Yawarakai-Te & Juuchi Yosamu'
  combinedWeightOverride?: number; // e.g., 16 WT for two-bladed Yawarakai-Te & Juuchi Yosamu
  internalCooldownSeconds?: number; // e.g., 14s for Gorgon's Gaze petrification
  grantedEngineHooks: LegendaryEngineHook[];
  mechanicSummary: string;
}

export interface LegendaryWeaponDefinition {
  id: string;                      // e.g., 'leg_excalibur' | 'leg_yawarakai_te' | 'leg_aegis' | 'leg_lake_of_fire_knife' | 'leg_balmung'
  tier: 'LEGENDARY';
  name: string;
  originWorldId: string;
  folkloreTradition: string;
  areaLoreConnection: string;
  weaponClass: WeaponClass;
  functionalClass: string;         // Compatible with Specialist Martial Stances
  damageType: DamageType;
  weight: number;
  maxObtainableCopies?: number;    // Default 1; 4 for Knives of the Lake of Fire
  armorProfile?: {                 // Populated ONLY for Shield Legendaries (e.g., Aegis)
    durability: number;
    rating: number;
    threshold: number;
  };
  gripMode: '1H' | '2H' | 'VERSATILE' | 'DORSAL_CARRIER';
  legendaryGripOverride?: boolean;
  strictTwoHandedNoOffhand?: boolean; // True for Balmung (blocks slot2 weapons/shields even with Feats)
  allowDorsalLauncherOnly?: boolean;  // True for Balmung (permits dorsal Carriers & Munitions)
  countsAsPairedOffhandBlade?: boolean; // True when fused into two-bladed Yawarakai-Te & Juuchi Yosamu

  // Strict Modification Lock
  allowStandardMods: false;
  maxGemSlots: 0;
  boundRelicSlots: LoreBoundAttachment[];

  // Exclusive Rules
  innateEngineHooks: LegendaryEngineHook[];
  action3Override?: {
    name: string;
    effectType: 'STUN_BLIND_CONE';
    stunSeconds: number;
    blindSeconds: number;
    widensWhenDualWielded?: boolean;
  };
  innateMechanicSummary: string;
  loreDescription: string;
}

/**
 * Validates off-hand / side-slot compatibility when a Legendary weapon enforces
 * strict two-handed isolation (e.g., Balmung permitting only dorsal launchers).
 */
export function canEquipOffhandWithLegendary(
  mainHandWeapon: LegendaryWeaponDefinition,
  offhandWeaponClass: WeaponClass
): { ok: boolean; reason?: string } {
  if (!mainHandWeapon.strictTwoHandedNoOffhand) {
    return { ok: true };
  }
  if (
    mainHandWeapon.allowDorsalLauncherOnly &&
    offhandWeaponClass === 'Carriers & Munitions'
  ) {
    return { ok: true };
  }
  return {
    ok: false,
    reason: `${mainHandWeapon.name} cannot be paired with off-hand weapons or shields (dorsal launchers only).`,
  };
}

/**
 * Combat damage resolver hook for Avalon's Immortality and Yawarakai-Te / Juuchi Yosamu frame-phase DR.
 */
export function resolveFrameDamageWithLegendaryHooks(
  currentFrameHp: number,
  incomingFrameDamage: number,
  isDamageOverTime: boolean,
  isInActiveHitFrames: boolean,
  framePhaseDrMultiplier: number,
  activeHooks: ReadonlySet<LegendaryEngineHook>
): number {
  let effectiveDamage = incomingFrameDamage;

  const hasOutsideHitDr = activeHooks.has('DR_OUTSIDE_ACTIVE_HIT_FRAMES');
  const hasDuringHitDr = activeHooks.has('DR_DURING_ACTIVE_HIT_FRAMES');

  if (
    (!isInActiveHitFrames && hasOutsideHitDr) ||
    (isInActiveHitFrames && hasDuringHitDr)
  ) {
    effectiveDamage *= framePhaseDrMultiplier;
  }

  const nextHp = currentFrameHp - effectiveDamage;
  if (nextHp <= 0 && isDamageOverTime && activeHooks.has('PREVENT_LETHAL_DOT')) {
    return 1;
  }
  return Math.max(0, nextHp);
}
