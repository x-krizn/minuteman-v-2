# Project Orion — Pre-World Expansion Housekeeping & Authoring Guide Plan

Establish a clean, extensible foundation before expanding the **Project Orion** game world by embedding grep-friendly `[ORION-ANCHOR: ID]` comment markers across core engine and database modules, centralizing ASCII tile and enemy spawn character lookup/validation to prevent symbol collisions across new biomes and worlds, and updating the **Authoring Guide** to reflect the `v0.8` Classless Build System, World Expansion workflows, and exact code anchor references.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and documentation decisions were confirmed during Phase 1 clarification:

- **Confirmed Decision 1 — Grep-Friendly Code Anchors (`[ORION-ANCHOR: ID]`)**: Every critical extension point across the world composer, tile/entity registries, progression engine, combat engine, and 2.5D renderer will carry a standardized `// [ORION-ANCHOR: <DOMAIN>-<SECTION>]` comment header. The Authoring Guide will cross-reference these exact anchor IDs so developers and AI agents can locate edit targets instantaneously.
- **Confirmed Decision 2 — Authoring Guide Modernization (`v0.8` Classless + World Expansion + ASCII Registry)**:
  - Update Section 6 of the Authoring Guide to document the **Classless (`v0.8`) Build System** ("Guide, Never Enforce"), Starting Loadout Kits, the 29 Canonical Magitech Weapons, 6 Coreplates, 6 Reactors, 18 Aux/Utility systems, 18 Optics/Sensors, 12 Limb Actuators, and 97 Canonical Feats.
  - Expand Sections 1 & 2 with end-to-end **World Expansion Workflows** (`Universe World -> Region -> Area -> Map -> 10x9 Room`, Aether Fog 5-Node Topology & Route Table registration, Waystations/Waygates, and `LOCKED` vs. `UNDEFINED` `u00` seals).
  - Add a **Master ASCII Tile & Enemy Spawn Character Registry Table** documenting every reserved terrain/prop symbol, enemy/NPC spawn symbol, biome-scoped override capability, and free characters available for upcoming worlds.
- **Confirmed Decision 3 — Codebase Housekeeping & Collision-Safe Character Resolution**:
  - Clean up and annotate the 5-tier world composer, Aether Fog route table, tile/biome registry, and enemy spawn resolver.
  - Centralize ASCII character resolution and add biome-scoped enemy/tile override support plus boot-time collision diagnostics so new worlds and biomes can reuse or introduce ASCII symbols safely without breaking existing rooms.

---

## 1. Overview & Core Concept

- **What It Does**: Prepares Project Orion's world auto-discovery pipeline, ASCII room parser, and documentation for rapid multi-world and multi-region authoring without regressions or symbol conflicts.
- **Target Audience / Persona**: Game designers, world builders, and AI engineering agents adding new regions, biomes, maps, rooms, enemies, and interactive setpieces to Project Orion.
- **Key Value**:
  - **Zero-Guesswork Navigation**: Standardized `[ORION-ANCHOR: ...]` comment blocks connect every section of the Authoring Guide directly to its live implementation block.
  - **Collision-Free World Scaling**: As new worlds and biomes are added, a centralized ASCII Character Registry and biome-scoped spawn/tile resolution prevent single-character grid tokens from colliding across regions.
  - **Single Source of Truth Documentation**: Aligns all authoring documentation with the live `v0.8` Classless Build, Hardware Synergy, and 5-Tier World architecture.

---

## 2. User Experience & Visual Design

- **Developer & Authoring Experience**:
  - Searching any `[ORION-ANCHOR: ...]` tag jumps straight to the exact code block responsible for world routes, room transitions, cluster auto-tiling, enemy spawning, or progression gating.
  - Authoring a new Area or World follows a clear, repeatable checklist with copy-pasteable TypeScript templates and an explicit table of reserved vs. available ASCII grid characters.
- **In-Game Continuity & Non-Degradation**:
  - All existing gameplay systems, 2.5D rendering passes, HUD/Satchel overlays, and campaign rooms (`M00 The Bog`, `Camelot Border Town`, `M01 Orc Encampment`, `Tyrranus Frontier`) remain 100% intact and visually unchanged.
  - Optional non-intrusive console diagnostics warn authors during development if two global tiles or enemies accidentally claim the same default ASCII character without a biome-scoped override.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Standardized `[ORION-ANCHOR: ID]` Comment Blocks**
  - *Chosen Approach*: Place structured banner comments (`// [ORION-ANCHOR: <ID>]`) at every major registry, state gate, and world-composition boundary, and index them in a Quick-Jump Reference Table at the top of the Authoring Guide.
  - *Why*: Line numbers shift whenever content is added; unique anchor IDs remain permanent and can be located in one search step.
  - *Alternatives Considered*: Relying solely on function names or line numbers, which become stale as files grow.
- **Decision 2: Biome-Scoped ASCII Spawn & Tile Resolution with Master Registry**
  - *Chosen Approach*: Enhance the ASCII room grid resolver so both tiles (`biome.tileTypes[char]`) and enemy spawns (`biome.enemySpawnTypes?.[char]` fallback to global `CHAR_TO_ENEMY_TYPE[char]`) can be scoped per biome while maintaining a centralized Master ASCII Character Table in code and documentation.
  - *Why*: A `10 × 9` ASCII grid uses single characters for readability. Allowing biomes to map characters locally (while keeping global defaults for common tiles/enemies) ensures unlimited enemy and prop variety across 20 worlds without running out of ASCII characters.
  - *Alternatives Considered*: Switching room grids from ASCII strings to multi-character numeric arrays, which would sacrifice the visual legibility of `10 × 9` room grids.
- **Decision 3: Declarative Route & Seal Registration for World Expansion**
  - *Chosen Approach*: Consolidate and clearly bracket the Key Node Route table (`KEY_NODE_ROUTES`), Area transition anchors, and `u00` `LOCKED` / `UNDEFINED` seal checks so adding a new region or unlocking a sealed zone requires only declarative entries.
  - *Why*: Keeps `worldSystem.ts` modular and maintainable as new regions and dungeons come online.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Anchor Mapping Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     AUTHORING GUIDE (AUTHORING_GUIDE.md)                         │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────┐  │
│  │ Quick-Jump Anchor Map  │  │ Master ASCII Registry  │  │ v0.8 Classless &   │  │
│  │ [ORION-ANCHOR: ...]    │  │ (Tiles, Props, Spawns) │  │ World Workflows    │  │
│  └───────────┬────────────┘  └───────────┬────────────┘  └─────────┬──────────┘  │
└──────────────┼───────────────────────────┼─────────────────────────┼─────────────┘
               │                           │                         │
               ▼                           ▼                         ▼
┌──────────────────────────┐ ┌──────────────────────────┐ ┌────────────────────────┐
│   WORLD AUTO-DISCOVERY   │ │  WORLD & ENTITY SYSTEMS  │ │  BUILD & COMBAT ENGINE │
│  [ORION-ANCHOR:          │ │  [ORION-ANCHOR:          │ │  [ORION-ANCHOR:        │
│   WORLD-GLOB-REGISTRY]   │ │   WORLD-KEY-ROUTES]      │ │   PROG-SKILL-SCALING]  │
│  [ORION-ANCHOR:          │ │  [ORION-ANCHOR:          │ │  [ORION-ANCHOR:        │
│   ASCII-CHAR-REGISTRY]   │ │   AETHER-FOG-TOPOLOGY]   │ │   PROG-FEAT-SYNERGY]   │
│  [ORION-ANCHOR:          │ │  [ORION-ANCHOR:          │ │  [ORION-ANCHOR:        │
│   U00-UNIVERSE-CATALOG]  │ │   ROOM-TRANSITION-GATE]  │ │   COMBAT-DEFENSE-MATH] │
│                          │ │  [ORION-ANCHOR:          │ │  [ORION-ANCHOR:        │
│  • Polymorphic glob scan │ │   ENEMY-SPAWN-RESOLVER]  │ │   RENDER-CLUSTER-BAKE] │
│  • Tile & Spawn char     │ │  • 5-Tier World Composer │ │  • Classless Kits      │
│    collision audit       │ │  • Biome-scoped spawns   │ │  • 29 Weapons & 97     │
│  • Biome overrides       │ │  • Waystations/Waygates  │ │    Hardware Feats      │
└──────────────────────────┘ └──────────────────────────┘ └────────────────────────┘
```

### Standardized `[ORION-ANCHOR: ID]` Catalog to Install
1. **World Registry & Universe Catalog**:
   - `[ORION-ANCHOR: WORLD-GLOB-REGISTRY]` — Polymorphic `import.meta.glob` auto-discovery loop for Regions, Areas, Maps, Rooms, Biomes, and Tiles.
   - `[ORION-ANCHOR: ASCII-CHAR-REGISTRY]` — Centralized ASCII Tile & Enemy Spawn character map, biome-scoped lookup helpers, and dev collision audit.
   - `[ORION-ANCHOR: U00-UNIVERSE-CATALOG]` — 20-World `u00` catalog and `LOCKED` vs. `UNDEFINED` zone seal definitions.
2. **World Composer & Aether Fog System**:
   - `[ORION-ANCHOR: WORLD-KEY-ROUTES]` — Declarative `KEY_NODE_ROUTES` graph connecting authored Points of Interest across coordinates.
   - `[ORION-ANCHOR: AETHER-FOG-TOPOLOGY]` — 5-node Aether Fog generator (`key`, `general`, `side`, `loop`, `end`) and `clvl + 1` depth scaling.
   - `[ORION-ANCHOR: WORLD-COMPOSER-INIT]` — 5-Tier hierarchy assembly (`Region -> Area -> Map -> Room`) and doorway auto-sealing.
   - `[ORION-ANCHOR: ROOM-TRANSITION-GATE]` — Cardinal doorway transitions, `u00` seal enforcement, and Area/Region boundary handoffs.
   - `[ORION-ANCHOR: WAYSTATION-WAYGATE-TRAVEL]` — Attunement, armor repair, and fast-travel teleportation logic.
3. **Entity, Render, Progression & Combat Systems**:
   - `[ORION-ANCHOR: ENEMY-GLOB-REGISTRY]` & `[ORION-ANCHOR: ENEMY-SPAWN-RESOLVER]` — Enemy auto-discovery and room grid spawn resolution (with optional biome-level spawn overrides).
   - `[ORION-ANCHOR: RENDER-CLUSTER-BAKE]` & `[ORION-ANCHOR: RENDER-POST-PROCESS]` — Sub-tile 3×3 cluster baker, `bog_tileset` / `ruins_tileset` auto-tiler, and 5-pass 2.5D lighting/reflection pipeline.
   - `[ORION-ANCHOR: PROG-LEVEL-SEQUENCE]`, `[ORION-ANCHOR: PROG-SKILL-SCALING]`, `[ORION-ANCHOR: PROG-FEAT-SYNERGY]` — Level 1–20 tutorial sequence, 6 Combat Discipline skills, and 97 hardware-gated Feats.
   - `[ORION-ANCHOR: COMBAT-DEFENSE-MATH]` & `[ORION-ANCHOR: COMBAT-ACTION-PAYLOAD]` — Three Defense Layers math (`Shields -> Armor -> 200 Frame HP`), adaptive damage, and support pulses.

### Interactive Component & State Mapping
- **Biome-Scoped Spawn & Tile Resolution**:
  - Extend `BiomeDefinition` with an optional `enemySpawnTypes?: Record<string, string>` map (paralleling `tileTypes?: Record<string, string>`).
  - When `spawnRoomEnemies` parses a `10 × 9` room grid, it resolves `getEnemyBySpawnChar(char, roomBiomeId)` so a biome can map `'V'` or `'S'` to a local faction unit without colliding with another world's enemy definitions, while falling back seamlessly to the global `CHAR_TO_ENEMY_TYPE` registry.
- **Boot-Time ASCII Registry Summary & Collision Check**:
  - Provide a clean helper (`getAsciiRegistryReport()`) that catalogs all bound Tile characters, Doodad characters, and Enemy spawn characters, logging a clear warning if two global files accidentally bind the same character.
