# Drop-Pod Cheat Room Gate, Bog Topology Restructure & Minimal Wayfinding

Transforms Project Orion from an open testing sandbox into an authentic, spoiler-free player experience by gating all developer/testing tools inside a dedicated **Drop-Pod Cheat Room**, tying player respawn and fast travel exclusively to **Campfires**, restructuring the **M00 Bog** room graph to match the exact room distances, and stripping back **Poe Lantern wayfinding** and UI tooltips to subtle, bare-minimum environmental cues.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The plan reflects your confirmed design choices:

- **Dedicated Drop-Pod Cheat Room**: The Drop Pod no longer acts as a campfire or waystation. Instead, it serves solely as the initial landing point and the door into an interior **Cheat Room** housing interactive debug terminals (instant gear unlock, trait hot-swap, campaign flag toggles, and room teleporters) and unlocking the full Dev UI while inside or toggled on.
- **Campfire-Driven Respawn & Transit**: Player spawn anchors now move exclusively with **Campfires (Waystations)** when the player rests at them.
- **Bog Room Distances & Missable Poe Lantern**:
  - **Drop Pod → First Campfire**: **3 rooms** (`Drop Pod` → 2 trail rooms → `First Campfire`).
  - **Drop Pod → Poe Lantern**: **5 rooms** (`First Campfire` + **2-room side branch** to the `Poe Lantern Sanctuary`).
  - **Drop Pod → Main Bog Entrance**: **6 rooms** (`First Campfire` + **3 main-path rooms** to the `Main Bog Hub`).
  - Because the Poe Lantern sits on the 2-room side branch after the First Campfire, players can miss it, enter the Main Bog area, and freely loop back and re-explore the bog at any time.
- **Minimal Wayfinding & Spoiler-Free UI**:
  - **Unlit (Without Poe Lantern)**: Bare-minimum 1–2 pixel faint shimmer at the true doorway threshold, with zero doorway text prompts and no HUD node/step spoilers.
  - **Lit (With Poe Lantern)**: Reduced to the previous subtle "without" mode (gentle drifting motes at the doorway threshold only; the orbiting player pointer wisp and explicit route-step text banners are removed).

---

## 1. Overview & Core Concept

### What It Does
1. **Separates Player Mode from Cheat/Dev Mode**:
   - In normal play, the HUD and Satchel only show in-universe information the pilot actually possesses (defense gauges, equipped slots, discovered weapons, current inventory items, and attuned campfires).
   - Entering the **Drop Pod** transitions the pilot into the **Orbital Drop-Pod Bay (Cheat Room)**, where interactive terminals and the full developer Satchel tabs allow testing any build, boss state, or world sector.
2. **Restructures the Opening Bog Expedition**:
   - Establishes a deliberate 6-room onboarding cadence from the crash site to the main bog, with the First Campfire at room 3 and a missable 2-room side branch leading to the Poe Lantern at room 5.
3. **Subtle, Environmental Wayfinding**:
   - Replaces explicit text prompts, hover tooltips, and HUD node counters with quiet visual observation.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Crash Landing & The Drop-Pod Cheat Room**:
   - A new pilot deploys outside the crashed Drop Pod (`Room 0`).
   - Walking away into the bog begins the natural survival experience.
   - Interacting with the Drop Pod hatch (`[A] Enter Drop-Pod Bay`) steps inside the **Drop-Pod Cheat Room**, featuring physical terminals for:
     - **Armory Locker**: Unlock all weapons, shields, quivers, and mods.
     - **Bio-Reactor Console**: Hot-swap Trait Lines, adjust Pilot Level (1–20), and dispense Gemstones.
     - **World & Campaign Simulator**: Toggle the Cheat UI overlay anywhere, trigger the Orc Raid or Three Knights Trial, or teleport to any sector.
2. **First Campfire & Missable Poe Branch**:
   - Traveling 3 rooms from the Drop Pod brings the player to the **First Campfire**. Resting here attunes the campfire and moves the player's respawn anchor forward.
   - From the First Campfire:
     - Heading along the **2-room side branch** leads to the **Poe Lantern Clearing** (5 rooms total from the Drop Pod).
     - Continuing along the **3-room main trail** (passing Sir Bedivere's corpse) leads into the **Main Bog Entrance** (6 rooms total from the Drop Pod).
   - If the player enters the Main Bog without lighting the Poe Lantern, the bog remains open for repeated exploration and backtracking so the player can still discover the Poe Lantern branch or find the Rusted Gate Key.
3. **Observational Fog Navigation**:
   - **Before lighting the Poe Lantern**: Doorways have no text popups. Only a faint 1–2 pixel glimmer appears at the true threshold for attentive players.
   - **After lighting the Poe Lantern**: The true doorway emits the gentle 5-mote drift (the previous unlit visual), without any floating compass wisp or step counter text.

### Visual Identity & HUD/Satchel Restraint
- **Cockpit HUD**: Displays only the pilot callsign, three defense bars (Shield, Armor, Frame HP), Reactor Heat, active weapon magazine, and clean control prompts (`[X]`, `[Y]`, `[R]`, `[L]`, `[B]`, `[A]`) without hover tooltips or node-type spoilers (`GENERAL NODE 1/2`, `LOOP DEPTH`).
- **Player Satchel**:
  - **Status & Loadout**: Shows defense stats, active equipment in Slots 1–3, and hardware in Head, Arms, Plating, and Utility.
  - **Inventory & Gems**: Lists only items and gemstones currently held in the satchel, plus socketable feats/skills once unlocked.
  - **Campfire Transit**: Lists only discovered campfires and waygates without revealing undiscovered zones or internal design specification tags.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Physical Interior Cheat Room vs. Hidden Keybind**
  - *Chosen Approach*: Repurpose the Drop Pod (`D`) into a physical door leading to an interior Cheat Room at the start of the game, while moving all respawn/waystation duties to Campfires (`A`).
  - *Why*: Gives the Drop Pod a distinct, memorable purpose right at spawn for playtesting while keeping normal progression completely free of debug clutter once the player walks away toward the First Campfire.
- **Decision 2: Repeatable Bog Exploration When Poe Lantern Is Missed**
  - *Chosen Approach*: Keep all routes between the First Campfire, the 2-room Poe Lantern side branch, and the Main Bog bidirectional and repeatable, and allow the Main Bog to be explored continuously whether or not the Poe Lantern has been lit.
  - *Why*: Ensures missing the Poe Lantern on the first pass feels like natural non-linear exploration rather than a dead end.
- **Decision 3: Two-Tier Subtle Wayfinding (Bare Minimum -> Gentle Motes)**
  - *Chosen Approach*: Shift the previous "without lantern" particle effect to be the new "with lantern" effect, and make the new "without lantern" effect a subtle 1–2 pixel threshold shimmer with zero UI prompt text.
  - *Why*: Rewards player attention and makes rescuing the Poe genuinely meaningful without hand-holding.

---

## 4. Technical Architecture & Data Strategy

### M00 Bog Room Topology & Distance Graph

```
                       [Drop-Pod Cheat Room]
                        (Dev Terminals & UI)
                                 ▲
                                 │ [A] Enter Hatch
                                 ▼
 [Room 0: Drop-Pod Crater] (Start · 0 rooms)
            │
            ▼ (1)
 [Room 1: Downed Trees West] (1 room from Drop Pod)
            │
            ▼ (2)
 [Room 2: Downed Trees East] (2 rooms from Drop Pod)
            │
            ▼ (3)
 [Room 3: First Campfire] ◄── (3 rooms from Drop Pod · Respawn moves here)
       │               │
       │ (Side Branch) │ (Main Path)
       ▼ (4)           ▼ (4)
 [Branch 1: Ruin]   [Main 1: Sunken Trail & Bedivere]
       │               │
       ▼ (5)           ▼ (5)
 [Branch 2: Poe]    [Main 2: Corrosive Marsh Approach]
 (5 rooms from         │
  Drop Pod)            ▼ (6)
                    [Main 3: Main Bog Area Entrance]
                    (6 rooms from Drop Pod · Repeatable Hub)
                       ├──► Deep Bog / Bog Exit Gate
                       └──► Secret Lady of the Lake Arena
```

### System & State Updates
1. **Drop-Pod & Campfire Separation**:
   - Remove `ws_bog_drop_pod` from the waystation registry and replace it with `ws_bog_first_campfire` at the First Campfire room (3 rooms from Drop Pod).
   - Initial pilot deployment spawns at the Drop-Pod Crater (`0,0`). Interacting with `D` enters the interior Cheat Room (`-1,0` / `cheat_room`), and interacting with the exit hatch inside returns to `0,0`.
   - Interacting with any Campfire (`A`) updates `state.spawnAnchor`, restores integrity/armor/shields/ammo, resets dynamic fog rooms, and offers fast travel between discovered campfires.
2. **Wayfinding & Prompt Reduction**:
   - In the world prompt resolver: remove doorway fog tell prompts (`POE LANTERN RESONATES...`, `FAINT ÆTHER MOTES...`, `POE LANTERN DIMS...`) and shorten object interaction prompts to concise actions (`[A] LIGHT LANTERN`, `[A] REST AT CAMPFIRE`, `[A] OPEN CHEST`).
   - In the canvas renderer:
     - When `hasPoeLanternGuidance` is `false`: render 1–2 single-pixel faint motes (`size: 1`, `alpha <= 0.22`) at `trueExitDir` and no wisp tether.
     - When `hasPoeLanternGuidance` is `true`: render 5 subtle drifting motes (`size: 1.5`, `alpha <= 0.48`) at `trueExitDir` and remove the orbiting wisp tether.
3. **UI Gating (Normal Mode vs. Cheat Room Mode)**:
   - Track `inCheatRoom` (when `state.room === '-1,0'` or `state.bypassProgressionGates` is enabled inside the Cheat Room).
   - When `inCheatRoom` is `false`, hide the `STATES & LAWS` debug tab, hide undiscovered waygates/zones and fog telemetry in `WORLD`, lock trait switching in `STATUS`, and hide locked weapons in `ACTIONS & WPN`.
