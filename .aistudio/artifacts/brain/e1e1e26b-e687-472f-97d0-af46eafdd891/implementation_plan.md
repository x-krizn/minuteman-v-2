# Project Orion — Nested World Mapping & Lore Fast-Travel Architecture Plan

Revise Project Orion's mapping and world-streaming system into a five-tier nested hierarchy (**Biomes → Rooms → Maps → Areas → Regions**) where every tier supports `global` (reusable/procedural) and `local` (bespoke/location-unique) modules, the entire world is seamlessly traversable on foot, and fast travel operates through lore-authentic **Waygates** and **Æther Waystations**.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and lore decisions were confirmed during clarification and govern this implementation:

- **Confirmed Decision 1 — Global & Local Scoping Per Tier**: Each of the five hierarchy tiers (**Biomes**, **Rooms**, **Maps**, **Areas**, and **Regions**) separates `global` reusable definitions from `local` location-specific definitions, auto-discovered via module registries so adding new world content never requires modifying engine code.
- **Confirmed Decision 2 — Lore-Accurate Dual-Tier Fast Travel**:
  - **Colossal Waygates (`W`)**: Located at the heart of major regions/worlds. Walking into or interacting with an active Waygate reads the pilot's ætheric signature to transit between Regions/Worlds (including synchronization status and desynchronization drift warnings for unstable worlds).
  - **Æther Waystations / Monoliths (`D` / `M`)**: Field anchors that attune to the pilot upon discovery, enabling intra-region fast travel between discovered Areas and Waystations while repairing armor and syncing spawn anchors.
- **Confirmed Decision 3 — Hybrid On-Foot World Stitching**: Bespoke `local` rooms and maps are anchored at their canonical world coordinates, while `global` rooms and `global` maps procedurally fill connecting corridors and wildlands between anchors so the player can walk continuously from room to room, map to map, area to area, and region to region across the entire world on foot.

---

### 1. Overview & Core Concept

- **What It Does**: Replaces the flat room dictionary with a five-layer spatial composition engine:
  1. **Biomes (`global` & `local`)**: Supply tile types, environmental tile rules (corrosive bog water, desynchronization phase-flicker, mud drag, elevation blockage), and visual palettes/assets to rooms.
  2. **Rooms (`global` & `local`)**: Assembled from biome-governed tiles. `local` rooms define unique narrative/combat encounters (e.g., Drop-Pod Crater, Poe's Marsh, Cathedral Altar), while `global` rooms serve as procedural templates (e.g., Marsh Crossing, Ruined Arcade, Chasm Bridge) stitched into open connectors.
  3. **Maps (`global` & `local`)**: Assembled from a coordinate grid of `local` and `global` rooms with explicit edge portals. `local` maps represent authored zones (e.g., Lower Bog Maze, Market District, Barracks Quarter), while `global` maps generate procedural wilderness/dungeon sectors.
  4. **Areas (`global` & `local`)**: Assembled from connected `local` and `global` maps (e.g., *M00 — The Bog*, *Camelot Border Town*, *Orc Encampment*, *Deep Dungeon & Waygate Sanctum*).
  5. **Regions (`global` & `local`)**: Top-level macro-territories and Shattered Worlds assembled from `local` and `global` areas (e.g., *Belldor — Camelot Heartlands*, *Belldor — Contested Outskirts*, *Tyrranus Frontier*, *Orion Tuning Mines*).
- **Target Audience / Persona**: Pilots exploring Belldor and the Shattered Worlds who want both uninterrupted on-foot expedition continuity and lore-grounded fast travel.
- **Key Value**: Every tier is self-contained and extensible—new biomes, rooms, maps, areas, or regions drop in as standalone modules, while players can either hike across the entire interconnected world on foot or transit via attuned Waystations and Waygates.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Continuous On-Foot World Traversal**: Walking off the north, south, east, or west boundary of any room transitions seamlessly into the adjacent room. When crossing the outer boundary of a Map, Area, or Region, the world resolver automatically streams the connected neighboring Map/Area/Region (or stitches a `global` connector room/map if traversing uncharted wildlands) and displays a HUD banner with the new Region, Area, Map, and Biome title.
  2. **Biome-Driven Environmental Rules & Palettes**: Entering a room governed by a different Biome (such as moving from the *Belldor Toxic Marshes* into the *Desynchronized Market Arcade*, *Scorched Orc Siegeworks*, or *Subterranean Waygate Sanctum*) dynamically shifts the 2.5D renderer's ground/water/pylon palette, ambient lighting, and active tile rules (corrosion ticks, desync wall phase cadence, or ætheric mist density).
  3. **Æther Waystation & Waygate Transit**:
     - Stepping onto an **Æther Waystation (`D` / `M`)** attunes that node to the pilot's discovery log, sets the respawn anchor, and unlocks fast travel to any previously attuned Waystation across discovered Areas.
     - Reaching the **Camelot Waygate (`W`)** beyond the Cathedral Dungeon Door reads the pilot's ætheric signature, allowing inter-region / inter-world transit or on-foot passage into connected Regions.
     - Opening the **Pilot Satchel (`[SELECT]`) → World & Waygates** tab displays the nested hierarchy (`Region → Area → Map → Room`), active Biome rules, discovered Waystations/Waygates, and one-click lore fast travel when standing near an attuned anchor (or anywhere when testing in State Gate bypass mode).
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Tactical retro-futuristic mech HUD meets Arthurian-ætheric cartography.
  - *Color Palette & Mood*: Biome-specific 2.5D palettes rendered on canvas (toxic teal `#0c4a6e` and slate `#253243` for Belldor Bog; flickering amber `#ffd27d` and violet `#c084fc` for Desync Cathedral/Market; iron-crimson `#7f1d1d` for Orc Siegeworks; deep cyan `#38bdf8` for Waygate Sanctums).
  - *Typography & Hierarchy*: Crisp monospace tactical banners for Region/Area/Map entry alerts and structured hierarchical breadcrumbs in the Satchel World Atlas.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Unified Global World Coordinate & Portal Graph**
  - *Chosen Approach*: Each Region places its Areas on a macro-grid, each Area places its Maps on a sector grid, and each Map places its Rooms on a local room grid—linked both by coordinate adjacency and explicit boundary portals.
  - *Why*: Allows the player to walk on foot from `(0,0)` in the Bog all the way through Border Town, the Orc Encampment, the Deep Dungeon, and into neighboring Regions without ever hitting a disconnected dead-end, while still supporting non-linear dungeon staircases and Waygate jumps.
  - *Alternatives Considered*: Separate isolated coordinate spaces per area requiring menu teleports (rejected because the entire world must be traversable location-to-location on foot).
- **Decision 2: Biome Inheritance Chain (`Region → Area → Map → Room → Tile`)**
  - *Chosen Approach*: A Room can specify its own `local` or `global` Biome ID, or inherit the default Biome of its parent Map, Area, or Region. The active Biome supplies tile asset palettes and environmental rules (`corrosiveWater`, `desyncFlickerPeriod`, `mudSlowMultiplier`, `aetherToxicity`) to the physics, combat, and 2.5D rendering systems.
  - *Why*: Eliminates hardcoded palette colors and hazard rules in the renderer and world loop while letting individual rooms override their atmosphere (e.g., a localized desync pocket inside a marsh map).
- **Decision 3: Deterministic Hybrid Gap-Filling with Global Rooms & Maps**
  - *Chosen Approach*: When a Map or Area defines open connectors between authored `local` rooms/maps, the world assembler selects matching `global` rooms or `global` maps (using deterministic coordinate hashing so the layout stays consistent across visits) and carves aligned doorways on shared borders.
  - *Why*: Ensures on-foot travel between distant bespoke locations feels expansive and continuous without requiring hundreds of hand-authored filler rooms.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     NESTED WORLD DATABASE (AUTO-DISCOVERED)                │
│                                                                            │
│  ┌──────────────────────┐   ┌──────────────────────┐                       │
│  │  REGIONS             │   │  AREAS               │                       │
│  │  ├─ global/          │──▶│  ├─ global/          │                       │
│  │  └─ local/           │   │  └─ local/           │                       │
│  └──────────────────────┘   └──────────┬───────────┘                       │
│                                        ▼                                   │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌────────────────┐  │
│  │  BIOMES              │   │  MAPS                │   │  ROOMS         │  │
│  │  ├─ global/          │──▶│  ├─ global/          │──▶│  ├─ global/    │  │
│  │  └─ local/           │   │  └─ local/           │   │  └─ local/     │  │
│  │  (Tile Types, Rules, │   │  (Assembled of       │   │  (Assembled of │  │
│  │   Palettes, Assets)  │   │   Global/Local Rooms)│   │   Biome Tiles) │  │
│  └──────────────────────┘   └──────────────────────┘   └────────────────┘  │
└────────────────────────────────────────┬───────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   HYBRID WORLD COMPOSER & FOOT-TRAVEL GRAPH                │
│  • Anchors bespoke Local Rooms & Local Maps at canonical world coords      │
│  • Stitches Global Rooms & Global Maps across open boundary connectors     │
│  • Resolves active Biome inheritance (Region → Area → Map → Room)          │
│  • Evaluates Lore Fast-Travel Graph (Attuned Waystations & Waygates)       │
└───────────────────┬────────────────────────────────────┬───────────────────┘
                    │                                    │
                    ▼                                    ▼
┌───────────────────────────────────────┐  ┌─────────────────────────────────┐
│     2.5D ENGINE & BIOME RULES         │  │   SATCHEL WORLD & WAYGATE UI    │
│  • Seamless 4-edge on-foot room/map/  │  │  • Hierarchy breadcrumb & atlas │
│    area/region transitions            │  │  • Discovered Waystations list  │
│  • Biome palette & lighting rendering │  │  • Colossal Waygate inter-world │
│  • Tile rule ticks (corrosion, mud,   │  │    signature transit & desync   │
│    desync phase walls, waygates)      │  │    status monitor               │
└───────────────────────────────────────┘  └─────────────────────────────────┘
```

- **Data Model & State**:
  - `BiomeDefinition` (`scope: 'global' | 'local'`): Defines `id`, `name`, `scope`, `tileTypes` (mapping or overriding tile chars to `TileDefinition` IDs), `tileRules` (`corrosiveWaterDamage`, `mudSpeedMultiplier`, `desyncPeriodSeconds`, `ambientParticleType`), and `palette` (`ground`, `mud`, `water`, `pylonTop`, `pylonFront`, `shadow`, `lightColor`).
  - `RoomDefinition` (`scope: 'global' | 'local'`): Defines `id`, `coord` (for local rooms) or `doorMask` / tags (for global procedural rooms), `biomeId`, `grid`, `cache`, and optional `portals` (for staircases/waygates/cross-map links).
  - `MapDefinition` (`scope: 'global' | 'local'`): Defines `id`, `name`, `scope`, `biomeId`, `localRoomIds`, `proceduralSlots` (filled from `global` rooms), and boundary links to neighboring Maps.
  - `AreaWikiDefinition` (`scope: 'global' | 'local'`): Defines `id`, `name`, `scope`, `regionId`, `biomeId`, `mapIds` (both `local` and `global` maps), `waystationAnchor`, and seamless foot-travel connections to adjacent Areas.
  - `RegionDefinition` (`scope: 'global' | 'local'`): Defines `id`, `name`, `world`, `scope`, `defaultBiomeId`, `areaIds`, `waygateAnchor`, `desyncStability`, and foot/waygate connections to neighboring Regions.
  - `OrionState` extensions: Tracks `currentRegionId`, `currentAreaId`, `currentMapId`, `currentBiomeId`, `discoveredWaystations: string[]`, and `discoveredWaygates: string[]`.
- **Interactive Component & State Mapping**:
  - **On-Foot Boundary Transition Handler (`worldSystem.ts`)**: When the player crosses any room edge (`x < 0`, `x >= WORLD_WIDTH`, `y < 0`, `y >= WORLD_HEIGHT`) or steps onto a staircase/portal tile (`>`, `<`, `W`), resolves the destination coordinate or linked Map/Area/Region, updates `currentRegionId` / `currentAreaId` / `currentMapId` / `currentBiomeId`, applies the new Biome's tile rules, and triggers an area/region transition banner if changing macro-zones.
  - **Lore Fast Travel Handler (`worldSystem.ts` & `OrionSatchel.tsx`)**:
    - Interacting with an **Æther Waystation (`D` / `M`)** registers the current Area's Waystation in `state.discoveredWaystations` and opens/unlocks intra-region transit between discovered Waystations.
    - Interacting with a **Waygate (`W`)** registers the Region's Waygate in `state.discoveredWaygates` and transits the pilot across Regions/Worlds according to their ætheric signature (including a newly reachable *Camelot Waygate Sanctum & Outlands* region so both intra-region Waystations and inter-region Waygates can be experienced on foot or via fast travel).
