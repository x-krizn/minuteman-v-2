# Project Orion — M00 Bog Mapping, Atmospheric Lighting & Loot Table Overhaul

Overhaul the opening world area (**M00 The Bog**) and procedural **Æther Fog** templates from cramped single-screen `10×9` rooms into expansive multi-screen (`14×11` to `20×15`) sectors with distinct sub-zone landmarks, dynamic threat/visibility lighting that shrouds distant hazards and enemies in shadow while brightening safe sanctuaries, directional 2.5D wall/tree shadows, and structured Enemy, Area, and Region loot tables.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All core architectural choices below incorporate your confirmed preferences from the design review:

- **Confirmed Decision 1 — Multi-Screen Room Scale (`14×11` to `20×15`)**: Expand all authored Bog rooms (`map_bog_drop_zone` and `map_deep_bog_maze`) as well as procedural **General**, **Side**, **Loop**, and **End** room templates in the Æther Fog composer from `10×9` to multi-screen layouts (`14×11` up to `20×15`) with smooth scrolling camera tracking and multi-tile cardinal doorways.
- **Confirmed Decision 2 — Dynamic Vision Radius, Corner Shadows & Safe/Threat Lighting**:
  - **Dynamic Threat & Awareness Fog**: Restrict player visibility in dark/hostile zones to an active vision radius around the player (expanded by equipped **Optics / Sensory Hardware**, **Poe Lantern** guidance, and active sanctuaries). Distant enemies outside the awareness radius remain hidden in the mire or appear only as faint emissive eyes/ripples until within detection range or telegraphing an attack.
  - **Safe vs. Threat Lighting Posture**: Safe sanctuaries (**First Campfire `0,0`**, **Poe Lantern Clearing `0,-2`**, **Drop-Pod Beacon `-3,0`**) cast warm, wide radial illumination that pushes back corner shadows; deep marsh trails, corrosive basins, and **Æther Loop** rooms tighten the vision cone and deepen corner darkness.
  - **Corner Darkness & 2.5D Directional Shadows**: Add room-corner ambient occlusion gradients and angled 2.5D drop shadows cast by walls (`#`), ancient pylons (`P`), downed trees, and ruins.
- **Confirmed Decision 3 — Distinct Sub-Zone Palettes & Environmental Storytelling Landmarks**: Differentiate every Bog room so none bleed together—featuring orbital scorch rings and wreckage trails in the Crater, felled timber mazes and hollow logs in the Downed Trees, dry flagstone sanctuary rings at the Campfire, drowned monastic colonnades and glowing shrines in the Poe Branch, Sir Bedivere's ruined temple courtyard, and Bubbling Corrosive Mire basins leading to the Lake Sanctum.
- **Confirmed Decision 4 — Structured Enemy, Area & Region Loot Tables**: Replace ad-hoc weapon/equipment drops with deterministic + weighted **Contextual Loot Tables** scoped by **Enemy Archetype**, **Area (`AreaWikiDefinition`)**, and **Region (`RegionDefinition`)**, including support for finding 1st and 2nd weapon copies (`×2` for Dual-Wield Paired Stance), hardware modules, gemstones, and consumables.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms world exploration from a sequence of similar single-screen boxes into atmospheric, multi-screen tactical zones where terrain layout, lighting contrast, line-of-sight awareness, and environmental props tell the story of each sector.
- **Target Audience / Persona**: Players exploring Belldor's outskirts who need immediate visual and spatial context to orient themselves, read environmental danger before stepping into ambushes or corrosive traps, and hunt specific enemies or areas for targeted equipment and second weapon copies.
- **Key Value**: Eliminates "room bleed" by giving each sector a bespoke spatial footprint, sub-biome palette, landmark props, and dynamic light-and-shadow tension.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Multi-Screen Sector Exploration**:
   - Stepping out of the Drop-Pod Bay (`-4,0`) into the **Drop-Pod Impact Crater (`-3,0`, `16×12`)**, the camera smoothly tracks across a smoking orbital trench bordered by shattered fuselage plating and glowing beacon pylons before funneling east into the **Maze of Downed Trees (`-2,0` & `-1,0`, `16×12` / `16×13`)**.
   - Navigating through giant felled trunks, mud channels, and ambush pockets leads into the open **First Campfire Clearing (`0,0`, `16×12`)**, where warm amber hearth light pushes the darkness out to the room perimeter.
2. **Restricted Awareness & Threat Discovery**:
   - Entering the **Overgrown Ruin Approach (`0,-1`)** or **Corrosive Marsh Trail (`2,0`, `18×13`)**, ambient darkness creeps in from the room corners and edges.
   - Enemies (`Bog Crawlers`, `Bog Wurms`, `Orc Scouts`) beyond the player's current vision & sensor radius are shrouded by the darkness mask—revealing only subtle mire ripples, faint eye glints, or sound/telegraph flares until the pilot closes distance, fires a tracer, or equips higher-tier **Optics / Sensory** hardware.
   - Traps, sinkholes (`_`), and corrosive pools (`~`) outside the illuminated radius are dimmed under the shadow veil, rewarding deliberate movement and lantern/sensor upgrades.
3. **Environmental Landmarks & Wayfinding**:
   - Every room features a signature central or asymmetric landmark (e.g., **Orbital Crater Scorch Ring**, **Split Great-Tree Bridge**, **Campfire Waystation Dias**, **Sunken Monastic Shrine**, **Sir Bedivere's Broken Lance Courtyard**, **Lady of the Lake's Flooded Amphitheater `20×15`**).
4. **Targeted Loot & Equipment Discovery**:
   - Defeating specific enemies, looting area caches (`C` / `V`), or salvaging fallen knights rolls against the hierarchical **Enemy -> Area -> Region Loot Table**, granting canonical weapons (including `×2` second copies of 1H weapons for Dual-Wielding), Aux/Optics/Leg hardware, and region-specific gemstones.

### Visual Identity & Theme
- **Aesthetic Direction**: Retro-futuristic 2.5D tactical dark fantasy (Magitech mech-knight navigating a toxic, desynchronized Arthurian marshland).
- **Color Palette & Mood**:
  - **Safe Sanctuaries (`0,0` Campfire, `0,-2` Poe Clearing)**: Warm amber hearth glow (`#f59e0b` / `#fde68a`) and cyan-violet lantern resonance (`#22d3ee` / `#c084fc`) with low ambient darkness (`0.18–0.25`).
  - **Downed Timber & Ruin Trails (`-2,0`, `-1,0`, `0,-1`, `1,0`)**: Mossy slate timber, wet flagstone (`#1e293b` / `#334155`), deep corner shadows (`0.48`), and dappled canopy shadow bands.
  - **Deep Corrosive Marsh & Æther Loops (`2,0`, `3,-1`, `3,0`, `Loop` nodes)**: Oppressive abyssal mire (`#090d14` / `#132a38`), bioluminescent acid ripples (`#a855f7` / `#22d3ee`), and high corner/distance darkness (`0.62–0.78`).
- **Typography & HUD Discipline**: Clean pixel/monospace HUD telemetry with outlined floating prompts (`drawOutlinedCanvasText`) and zero intrusive UI chrome over the playfield.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Multi-Screen Room Footprints (`14×11` to `20×15`) with Preserved Graph Topology**
  - *Chosen Approach*: Scale individual rooms to `14×11`–`20×15` tiles (`224×176px` to `320×240px`) while keeping the canonical `KEY_NODE_ROUTES` and 5-node Æther Fog graph structure intact.
  - *Why*: Gives each room 2× to 3.5× the playable surface area so terrain features, cover pillars, elevation sinkholes, and enemy patrols have room to breathe without breaking existing quest coordinates or save states.
  - *Alternatives Considered*: Merging all rooms into a single giant open map was passed over because the doorway-driven **Æther Fog 5-Node Topology** (`SAFE -> 1 -> 2 -> 3 -> 2 -> 1 -> SAFE`) relies on room transitions.
- **Decision 2 — Composite Canvas Darkness Mask + Sensor/Light Cutouts**
  - *Chosen Approach*: Render an offscreen/composite darkness & corner-shadow layer modulated by room safety tier, player **Optics/Sensory** vision radius, **Poe Lantern** state, and local point lights (campfires, lanterns, beacons, projectiles), coupled with distance-based entity opacity/shrouding.
  - *Why*: Delivers authentic survival-tactical tension on the 2D canvas at 60 FPS while making **Optics**, **Sensory**, and **Poe Lantern** items mechanically meaningful in exploration.
- **Decision 3 — Hierarchical Loot Table Resolution (`Enemy -> Room/Area -> Region`)**
  - *Chosen Approach*: Define structured `LootTableEntry` pools on Enemies, Areas, and Regions with deterministic first-time unlocks and weighted duplicate/equipment rolls.
  - *Why*: Prepares the engine for multi-region expansion so specific weapons, second copies (`×2`), and hardware drop from thematic sources rather than a single global pool.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     WORLD & BOG OVERHAUL ARCHITECTURE                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────┐   ┌────────────────────────────────┐ │
│  │   Multi-Screen Room Definitions    │   │   Contextual Loot Registry     │ │
│  │  • Authored Bog Rooms (14x11–20x15)│   │  • Region Loot Pools           │ │
│  │  • Procedural General/Side/Loop    │   │  • Area Cache & Salvage Pools  │ │
│  │  • Sub-Zone Palettes & Landmarks   │   │  • Enemy Equipment & Gem Drops │ │
│  └─────────────────┬──────────────────┘   └───────────────┬────────────────┘ │
│                    │                                      │                  │
│                    ▼                                      ▼                  │
│  ┌────────────────────────────────────┐   ┌────────────────────────────────┐ │
│  │   World & Entity Systems           │   │   Vision & Threat Awareness    │ │
│  │  • Multi-Screen Doorway Carving    │◄──┤  • Base Vision + Optics/Sensor │ │
│  │  • Spawn Scaling & Ambush States   │   │  • Safe Zone vs Threat Radius  │ │
│  │  • Landmark Prop Rendering (2.5D)  │   │  • Enemy Shroud / Eye Glints   │ │
│  └─────────────────┬──────────────────┘   └───────────────┬────────────────┘ │
│                    │                                      │                  │
│                    └──────────────────┬───────────────────┘                  │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                  2.5D Atmospheric Render Pipeline                       │ │
│  │  1. Sub-Zone Ground Clusters & Planar Corrosive Reflections             │ │
│  │  2. Directional 2.5D Wall, Pylon & Felled-Tree Cast Shadows             │ │
│  │  3. Depth-Sorted Props, Landmarks & Visibility-Gated Entities/Traps     │ │
│  │  4. Room-Corner Ambient Occlusion + Dynamic Light Cutout Mask           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **Room Lighting & Atmosphere Metadata (`RoomLightingProfile`)**:
  - Support optional per-room or sub-zone lighting overrides (`safetyTier: 'sanctuary' | 'trail' | 'hazard' | 'abyss'`, `ambientDarkness`, `cornerShadowIntensity`, `playerVisionRadiusPx`, `tintColor`) so safe rooms (`0,0`, `0,-2`, `-3,0`) feel immediately welcoming and hazard rooms (`2,0`, `2,1`, `3,-1`, `Loop` nodes) feel tense and claustrophobic.
- **Vision & Threat Awareness Calculation**:
  - Base player vision radius (`~68px` in standard trails, `~110px` in sanctuaries, `~48px` in deep bog / Æther Loop rooms).
  - Expanded dynamically by equipped **Optics** and **Sensory** hardware (`+12px` to `+26px`) and **Poe Lantern** guidance (`+16px`).
  - Enemies and traps beyond `visionRadiusPx` fade into shadow (`alpha` scaled down to `0.08–0.15` silhouette or submerged state, with only faint emissive eye glints or attack windup flares visible) and cannot be soft-locked until within sensor range.
- **Structured Loot Tables (`LootTableConfig`)**:
  - `RegionDefinition.lootPool`, `AreaWikiDefinition.lootPool`, and `EnemyDefinition.equipmentDrops` allow each enemy (e.g., `orc_warrior`, `bog_wurm`, `percival_knight`, `lady_of_the_lake`) and each area cache (`m00_the_bog`, `orc_siege_encampment`, `camelot_border_town`) to drop specific canonical weapons (including `×2` second copies of 1H weapons), hardware pieces, and materials.

### Interactive Component & State Mapping
1. **Multi-Screen Room Redesign (`M00 The Bog` & Global Procedural Templates)**:
   - `-3,0` **Drop-Pod Impact Crater (`16×12`)**: Central scorched impact crater, smoking pod beacon, shattered fuselage walls, and western security door to `-4,0`.
   - `-2,0` **Downed Trees West (`16×12`)** & `-1,0` **Downed Trees East (`16×12`)**: Winding hollow-log corridors, moss-draped pylon stumps, flanking mire pockets, and hidden cache alcoves.
   - `0,0` **First Campfire Clearing (`16×12`)**: Raised ancient flagstone sanctuary ring around the Waystation Campfire (`A`), warm radial hearth illumination, and clear 4-way crossroads.
   - `0,-1` **Overgrown Ruin Approach (`16×13`)** & `0,-2` **Poe Lantern Sanctuary (`16×12`)**: Sunken monastic colonnade leading to a tranquil lantern shrine (`L`) with cyan-gold light falloff.
   - `1,0` **Temple Ruins & Sir Bedivere's Corpse (`18×12`)**: Shattered temple nave, broken pillar rows, Sir Bedivere's fallen frame (`S`) in a central courtyard, and multi-angle crawler ambushes.
   - `2,0` **Corrosive Marsh Trail (`18×13`)**, `3,-1` **Northern Bog Hollow (`16×12`)**, `3,0` **Main Bog Expanse & Exit Gate (`18×13`)**, and `2,1` **Lady of the Lake Arena (`20×15`)**: Expansive hazardous marshlands with stepping-stone islands, corrosive channels, and boss amphitheater.
   - **Global Procedural Templates (`templates.ts` & `worldSystem.ts`)**: Expand `global_marsh_crossing`, `global_sinkhole_bridge`, `global_pillar_sanctuary`, `global_ruined_arcade`, and `generateProceduralRoomGrid` from `10×9` to `16×12` / `14×11` so procedural **General**, **Side**, and **Loop** nodes match the larger room scale.
2. **2.5D Directional Shadows, Corner Darkness & Vision Mask (`renderSystem.ts`)**:
   - Render angled 2.5D cast shadows on the ground layer to the south-east of walls (`#`), pillars (`P`), and large props.
   - Render room-perimeter corner darkness gradients in world space so the four corners and wall recesses of every multi-screen room are naturally darker.
   - Apply dynamic visibility gating to enemies, traps/sinkholes, and lock-on targeting based on distance to player + active light sources + equipped Optics/Sensors.
3. **Enemy / Area / Region Loot Table Wiring (`entitySystem.ts`, `worldSystem.ts`, `database/`)**:
   - Wire `resolveContextualEquipmentDrop(state, context)` so enemy kills, area caches, and scavenger trades pull from area- and enemy-specific equipment pools (unlocking 1st copies first and allowing 2nd copies of 1H weapons from matching faction/area sources).
