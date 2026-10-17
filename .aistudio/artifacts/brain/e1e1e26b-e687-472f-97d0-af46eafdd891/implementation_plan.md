# Project Orion — Belldor Campaign Systems & Mechanics Plan

Deliver all core gameplay systems, enemy AI archetypes, environmental hazards, faction dispositions, dynamic raid events, and secret triggers defined in *Project Orion — Index* so that Stage 1 (The Bog), Stage 2 (Camelot Border Town), and Part V (Secrets) can be authored and tested immediately via map data and state flags.

## User Review & Critical Decisions

> [!IMPORTANT]
> All core scope decisions were confirmed in our planning interview and follow the strict modular system isolation rule: systems are general-purpose and state-driven, never hardcoded to specific room coordinates.

- **Confirmed Decision 1 — Full Stage 1 & Stage 2 System Scope**: Build all missing Stage 1 (The Bog) and Stage 2 (Camelot Border Town) gameplay systems into isolated cartridge modules right now.
- **Confirmed Decision 2 — Three-Way Cathedral Dungeon Door**: Support all three canonical unlock paths via state flags (**By Force** with 3 Grail Fragments, **By Exploration** with 3 hidden district switches, and **By Trust** via town raid defense reputation).
- **Confirmed Decision 3 — Part V Secrets Included**: Implement Bedivere's Signet Ring choice (**Take** vs. **Leave**), **Bedivere's Numbered List** and its scattered nonsense artifacts, and the **Lady of the Lake** secret boss awakening in the Bog.

---

## 1. Overview & Core Concept

- **What It Does**: Equips the Project Orion cartridge with every mechanical system described in *Project Orion — Index*:
  1. **Corrosive Bog Water Hazard System**: Water tiles (`~`) corrode Layer 2 Armor Durability on both the player mech and any enemy standing in the water.
  2. **Stage 1 Canonical Encounters**: Linked **Orc Pairs** (**Orc Warrior** shield brawler + **Orc Scout** ranged kiter that retreats to heal), the **Bog Wurm** (submerges invisible in water, strikes first, retreats underwater to regenerate), and the **Poe & Lantern** encounter (**Help**, **Ignore**, or **Kill** to unseal the Bog exit and earn the lantern gift that reveals the submerged Wurm).
  3. **Bedivere's Choice & Secrets**: Interactive choice at Bedivere's body to **Take** or **Leave** the Signet Ring (driving Border Town Loyalist reactions), plus collecting **Bedivere's Numbered List** and its scattered items to summon the **Lady of the Lake** in the Bog.
  4. **Stage 2 Border Town Systems**:
     - **Grail Sickness & Loyalist Disposition**: Town NPCs exhibit **Calm (Trade)**, **Linger-Unstable** (turns hostile if the player lingers nearby), or **Feral** behavior; **Loyalist** NPCs refuse trade or attack on sight if the pilot carries Bedivere's Ring.
     - **Desynchronization Phasing & Orc Raids**: Phasing walls (`%`) that cycle between intact and ruined to expose hidden switches/caches, plus dynamic **Orc Raid** events (war horn, red pulse, sealed Bog exit, NPCs turning feral, Orcs prioritizing NPCs first, and tracking survivor **Town Trust**).
     - **The Three Knights & Knight's Oath Feat**: **Percival** (shield wall + charge + shield recovery), **Tristan** (ranged volley + smoke escape + cover sight), and **Bors** (stacking hit damage + 50% HP enrage + execution lunge), supporting 1v1 pulls or a simultaneous 3v1 fight that awards the **Knight's Oath** feat.
     - **Cathedral Dungeon Door**: Opens when any of the 3 canonical state conditions (**Force**, **Exploration**, or **Trust**) is satisfied.
- **Target Audience / Persona**: The cartridge designer and map builder assembling and testing rooms across Stage 1 and Stage 2, as well as players experiencing the Belldor campaign.
- **Key Value**: Complete mechanical parity with *Project Orion — Index* in clean, modular systems controllable and inspectable through the in-game State & Gate Controller.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Stage 1 Bog Loop**: Navigate corrosive water (`~`) while watching both player and enemy Armor Durability degrade; engage Orc Warrior + Scout pairs; encounter the Poe (`p`) and either guide it to its Lantern (`L`), ignore it, or destroy it to reveal the Bog exit and counter the Bog Wurm's stealth; inspect Bedivere's body (`S`) and choose whether to take or leave his Signet Ring.
  2. **Stage 2 Border Town Loop**: Enter contested districts where Grail-sick NPCs (`N`) either trade, grow agitated if lingered near, or attack; observe Loyalist hostility if carrying Bedivere's Ring; time movement through desynchronizing market walls (`%`) to flip hidden switches (`1`, `2`, `3`); defend townsfolk during sudden Orc Raids; challenge Percival, Tristan, and Bors individually or together; open the Cathedral Dungeon Door (`M`).
  3. **Map Builder & State Inspector Flow**: Open the Pilot Satchel (`[SELECT]` $\rightarrow$ `STATES & LAWS`) to inspect or toggle any Belldor campaign state flag (Poe outcome, Bedivere's Ring taken/left, List items collected, Orc Raid trigger, Town Trust score, Grail Fragments, Hidden Switches, and Knight's Oath feat).
- **Visual Identity & Theme**:
  - **Aesthetic Direction**: Retro-futuristic 2.5D cockpit tactical HUD over a baked Golden Sun top-down pixel canvas.
  - **Color Palette & Mood**: 60% deep obsidian and marsh/slum canvas (`#05070a`, `#090d14`), 30% slate tactical frames (`#1e293b`, `#334155`), and 10% high-contrast telemetry accents (`#38bdf8` shield cyan, `#fbbf24` armor amber, `#4ade80` frame emerald, `#ef4444` raid/overheat crimson, `#c084fc` æther violet).
  - **Typography & Hierarchy**: Crisp monospace cockpit readouts (`tabular-nums`) with unboxed `·` metadata separators and single-line controls (`whitespace-nowrap`).
- **Interactive Feedback & Motion**:
  - Corrosive water sizzle particles on armor degradation; submerged ripple tells for the Bog Wurm and Lady of the Lake; glowing lantern aura when the Poe gift is active; red screen pulse and war-horn audio synthesis when an Orc Raid begins; phase-flicker visual cadence on desynchronizing market walls.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Isolated Domain Systems over Monolithic Room Scripts**
  - *Chosen Approach*: Separate environmental hazards, Poe/Wurm interactions, NPC/Faction disposition, and Raid/Desynchronization mechanics into dedicated system modules driven by tile characters and `state.flags`.
  - *Why*: Allows you to place a corrosive water tile (`~`), a desynchronizing wall (`%`), a Poe (`p`), an Orc Pair (`o`/`s`), or a Grail Knight (`P`/`T`/`B`) into **any** room grid and have it work automatically without touching system code.
- **Decision 2 — Non-Modal In-Place Choice for Bedivere's Ring & Poe**
  - *Chosen Approach*: Use the docked lower-screen tactical prompt bar (`[A]` vs. `[B]` or sequential interaction) to let the pilot take or leave Bedivere's Ring and help, ignore, or attack the Poe without interrupting 2.5D movement with full-screen dialog curtains.
  - *Why*: Preserves the user's requirement that pop-ups stay docked in the lower HUD and never clutter the playfield.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        ORION CARTRIDGE RUNTIME LOOP                        │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│   STATE & GATE SYS   │   │  HAZARD & SYNC SYS   │   │  WORLD & ANCHOR SYS  │
│  • Capability Gates  │   │  • Corrosive Bog (~) │   │  • Spawn Anchors (D) │
│  • Belldor Flags     │   │    (Player + Enemy   │   │  • Bedivere Ring     │
│  • Feats (Knight's   │   │     Armor Decay)     │   │    Choice & List (S) │
│    Oath)             │   │  • Market Desync (%) │   │  • Poe & Lantern     │
│  • 6 Trait Lines     │   │    Phase Cycle       │   │  • 3-Way Dungeon     │
└──────────┬───────────┘   └──────────┬───────────┘   │    Door (M)          │
           │                          │               └──────────┬───────────┘
           └──────────────────────────┼──────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   ENEMY AI, FACTION NPC & ORC RAID SYSTEMS                 │
├──────────────────────────┬──────────────────────────┬──────────────────────┤
│     STAGE 1 ARCHETYPES   │    STAGE 2 ARCHETYPES    │   FACTION & RAIDS    │
│  • Orc Warrior (Shield)  │  • Percival (Guardian)   │  • Grail-Sick NPCs   │
│  • Orc Scout (Ranged +   │  • Tristan (Kiting       │    (Calm / Linger /  │
│    Retreat Heal)         │    Ranger + Smoke)       │     Feral + Ring)    │
│  • Bog Wurm (Submerge    │  • Bors (Enrage Brawler) │  • Dynamic Orc Raid  │
│    Stealth + Regen)      │  • 3v1 Knight's Oath     │    & Town Trust      │
│  • Lady of the Lake      │    Feat Trigger          │    Survivor Tracking │
└──────────────────────────┴──────────────────────────┴──────────────────────┘
```

### Data Model & State Flags (`state.flags`)

All campaign mechanics read and write standardized keys in `state.flags` so any room or map can query or override them:
- **Stage 1 Bog Flags**:
  - `poe_state`: `'unmet' | 'following' | 'helped' | 'ignored' | 'killed'`
  - `poe_lantern_gift`: `boolean` (illuminates submerged Bog Wurm in water `~`)
  - `bog_exit_revealed`: `boolean` (unlocked once Poe is helped, ignored past threshold, or killed)
  - `bedivere_ring_choice`: `'unchosen' | 'taken' | 'left'`
  - `bedivere_list_collected`: `boolean`
  - `bedivere_list_items`: `number` (`0..3` scattered nonsense items collected across zones)
  - `lady_of_the_lake_defeated`: `boolean`
- **Stage 2 Border Town Flags**:
  - `orc_raid_active`: `boolean` (seals Bog exit, pulses red, turns NPCs feral, spawns raiders)
  - `town_trust`: `number` (incremented by saving NPCs during Orc Raids; penalized for Loyalists if `bedivere_ring_choice === 'taken'`)
  - `grail_fragments`: `number` (`0..3` dropped by Percival, Tristan, and Bors)
  - `dungeon_switches`: `number` (`0..3` hidden switches in Market, Cathedral, Barracks)
  - `knights_pulled_together`: `boolean` (awards `knights_oath` feat when all three knights are defeated in a simultaneous pull)
  - `cathedral_door_open`: `boolean` (true when `grail_fragments >= 3` OR `dungeon_switches >= 3` OR `town_trust >= 3`)

### Interactive Component & State Mapping

1. **Corrosive Water & Desynchronization (`hazardSystem`)**:
   - Every frame, checks if the player (`z <= 0`) or any active enemy is standing on `~`. Degrades `armor.durability` at a steady rate with corrosive sizzle feedback.
   - Cycles desynchronizing wall tiles (`%`) between solid and passable on a deterministic timer so hidden switches and caches can be reached.
2. **Stage 1 & Stage 2 Enemy AI Registry (`canonical_enemies`)**:
   - Registers `orc_warrior`, `orc_scout`, `bog_wurm`, `lady_of_the_lake`, `percival_knight`, `tristan_knight`, `bors_knight`, and `town_npc` with their exact *Index* behaviors, Three Defense Layers, and combat tells.
3. **World Anchor & Choice Dispatcher (`worldSystem`)**:
   - Handles Poe & Lantern interactions (`[A]` Help / Guide to Lantern, or attack to Kill, or walk past to Ignore), Bedivere's Ring choice (`[A]` Take Ring & List vs. `[B]` Take List Only & Leave Ring), Hidden Switches (`1`, `2`, `3`), and the 3-Way Cathedral Dungeon Door (`M`).
4. **In-Game State & Gate Inspector (`OrionSatchel`)**:
   - Expands the `STATES & LAWS` tab with a live **Belldor Campaign & Flags Inspector** so you can toggle or test any Stage 1 / Stage 2 flag, trigger an Orc Raid on demand, or spawn-test encounters while building maps.
