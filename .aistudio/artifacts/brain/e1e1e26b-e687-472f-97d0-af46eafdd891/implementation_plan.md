# Project Orion — Self-Contained Content & Auto-Registry Architecture Plan

Refactor the Orion cartridge's database and engine boundary so that every content entity (Enemy, Weapon, Item, Equipment Action, World Tile, and Map Room) lives in its own dedicated module and encapsulates all of its data, map spawn tokens, AI/loot parameters, and visual rendering logic—Collected automatically by master registry modules via `import.meta.glob`.

## User Review & Critical Decisions

> [!IMPORTANT]
> All three architectural preferences have been confirmed:
> - **Confirmed Decision 1 (Full Content Domain Split)**: Every content domain (`enemies`, `weapons`, `items`, `equipment`, `world/tiles`, and `world/maps`) will be split into individual one-entity-per-file definitions with a single master registry in each domain.
> - **Confirmed Decision 2 (Zero-Touch Auto-Discovery)**: Each master registry will use `import.meta.glob('./*.ts', { eager: true })` to automatically discover and register all sibling content modules. Creating or modifying content requires editing **only** that entity's file.
> - **Confirmed Decision 3 (Self-Contained Spawning, AI/Loot & Visuals)**: Map spawn tokens (`spawnChar`), AI movement/attack/submerge/aggro rules, death drops/state triggers, and 2.5D canvas visual definitions (or custom `render` hooks) will live inside each entity's file so engine systems (`worldSystem`, `enemies`, `renderer`, `combat`) contain zero hardcoded entity ID branches.

---

## 1. Overview & Core Concept

- **What It Does**: Decouples game content from engine systems. Instead of maintaining monolithic `canonical_*.ts` files and updating `if/else` chains across `worldSystem.ts`, `enemies.ts`, and `renderer.ts` whenever an enemy, weapon, item, tile, or room is added, each content unit becomes a self-contained specification that the engine reads generically.
- **Target Audience / Persona**: The cartridge creator and systems designer building *Project Orion* content iteratively.
- **Key Value**: Enforces the rule that *"unless new content needs new systems, the only edit is the file the content is sourced from."*

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Authoring or Editing Content**: When tweaking an enemy (e.g., *Bog Wurm* or *Sir Percival*), a weapon (e.g., *Scout Khopesh*), an item, an equipment module, a tile, or a room, all stats, map placement characters, loot tables, state hooks, and 2.5D canvas visuals are located in that single entity module.
  2. **Adding New Content**: Dropping a new entity definition module into its domain folder automatically registers it into the runtime game world, map parser, renderer, and Satchel Reference Codex without touching any other file.
  3. **In-Game & Satchel Parity**: All existing gameplay mechanics, 2.5D visuals, stage setpieces, and Satchel UI views continue to work identically, now dynamically populated from the auto-discovered registries.
- **Visual Identity & Theme**:
  - Preserves the 2.5D top-down oblique pixel-art aesthetic, dynamic elevation shadows, telegraphed attack tells, and tactical HUD/Satchel overlays.
  - Entity and tile rendering is driven by declarative visual descriptors and optional custom canvas draw hooks embedded in each entity's definition.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Vite `import.meta.glob` Master Registries**
  - *Chosen Approach*: Each domain's master index uses `import.meta.glob('./*.ts', { eager: true })` (filtering out `./index.ts`) to collect exported definitions into a unified lookup map, array, and helper functions (such as `getEnemyBySpawnChar(char)` or `getTileDefinition(char)`).
  - *Why*: Eliminates boilerplate barrel export lists and prevents merge or registration omissions when adding new content files.
  - *Alternatives Considered*: Manual re-exports in `index.ts`—passed over because it violates the single-file-edit goal when adding new content.
- **Decision 2: Data-Driven Entity Schema (Spawning, Behavior, Loot & Visuals)**
  - *Chosen Approach*: Expand `EnemyWikiDefinition`, `TileDefinition`, `WeaponDefinition`, and `RoomDefinition` to carry their own runtime behavior and rendering contracts:
    - **Enemies**: Include `spawnChar`, `runtime` config (move speed, attack cooldown, projectile speed/color, ranged vs. melee, submerged-by-default, calm NPC until provoked, linked pair bonus tags, on-death state mutations, and drop table), and a `render25D(g, entity, state, sx, sy)` visual drawer (or declarative palette/shape preset).
    - **Tiles**: Include `char`, collision/height flags, dynamic state-gate rules (e.g., desync phase, gate open state key, interactive prompt handler), and a self-contained `render25D(g, tile, state, sx, sy)` drawer.
    - **Weapons**: Separate each weapon (`gladius_boltcaster`, `khopesh`) into its own module with its moveset and execution payload rules.
    - **Rooms**: Separate each map room (`room_0_0_drop_zone`, `room_1_0_sunken_approach`, `room_0_1_overgrown_pylon`, `room_1_1_corrupted_clearing`, `room_2_0_camelot_border_town`, etc.) into its own room module containing its ASCII grid, metadata, and scavenger caches.
  - *Why*: Engine loops (`worldSystem`, `enemies`, `renderer`, `combat`) become pure interpreters of the schema rather than switchboards of entity names.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    INDIVIDUAL SELF-CONTAINED CONTENT FILES                │
│                                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │ Enemies      │ │ Weapons &    │ │ Items &      │ │ World Tiles &    │  │
│  │ (1 per enemy)│ │ Equipment    │ │ Progression  │ │ Map Rooms        │  │
│  │ - Stats/Lore │ │ (1 per item) │ │ (1 per item) │ │ (1 per tile/room)│  │
│  │ - spawnChar  │ │ - Moveset    │ │ - Cost/Lore  │ │ - ASCII / Caches │  │
│  │ - AI & Loot  │ │ - Action Hook│ │ - onUse Hook │ │ - Collision/Gate │  │
│  │ - render25D  │ │              │ │              │ │ - render25D      │  │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘  │
└─────────┼────────────────┼────────────────┼──────────────────┼────────────┘
          │                │                │                  │
          ▼                ▼                ▼                  ▼
┌───────────────────────────────────────────────────────────────────────────┐
│             MASTER DOMAIN REGISTRIES (import.meta.glob eager)             │
│                                                                           │
│  • Auto-discovers all sibling entity modules at build/dev time            │
│  • Builds ID registries, spawn-char lookup maps, and Codex collections    │
└─────────┬───────────────────────┬──────────────────────┬──────────────────┘
          │                       │                      │
          ▼                       ▼                      ▼
┌─────────────────────┐ ┌──────────────────────┐ ┌──────────────────────────┐
│   WORLD PARSER      │ │  SIMULATION ENGINE   │ │   2.5D CANVAS & UI       │
│  (worldSystem.ts)   │ │(enemies/combat/act.) │ │ (renderer.ts / Satchel)  │
│                     │ │                      │ │                          │
│ • Queries Tile &    │ │ • Runs generic AI,   │ │ • Calls tile.render25D   │
│   Enemy registries  │ │   loot drops, &      │ │   and enemy.render25D    │
│   by ASCII char     │ │   state hooks from   │ │ • Populates Satchel Wiki │
│ • Loads Room files  │ │   entity definitions │ │   from master registries │
└─────────────────────┘ └──────────────────────┘ └──────────────────────────┘
```

### Data Model & State

1. **Enemy Definition Contract (`EnemyWikiDefinition`)**:
   - **Identity & Codex**: `id`, `name`, `faction`, `role`, `levelRange`, `description`, `lore`, `frameIntegrity`, `armorDurability`, `armorThreshold`, `shieldCapacity`, `weakness`, `resistance`, `tells`.
   - **World Spawning**: `spawnChar?: string`, `defaultElevation?: number`, `initialStateFlags?: { isSubmerged?: boolean; isCalmNpc?: boolean }`.
   - **Runtime AI & Loot (`runtimeConfig`)**: `radius`, `speed`, `aggroRange`, `attackCooldownSec`, `tellDurationSec`, `attackDurationSec`, `isRanged`, `projectileSpeed`, `projectileColor`, `scrapDrop`, `itemDrops`, and `onDeath?: (state, enemy, ctx) => void`.
   - **Visual Representation (`render25D`)**: Encapsulated canvas drawing callback invoked by `renderer.ts` after elevation and lock-on reticle transforms.
2. **Tile Definition Contract (`TileDefinition`)**:
   - **Identity & Collision**: `id`, `char`, `name`, `type`, `solid`, `blocksHeight`, `isMud`, `isWater`, `isCorrosive`, `isChasm`, `isDesync`, `bakedTopColor`, `bakedFrontColor`.
   - **Visual Representation (`render25D`)**: Encapsulated 2.5D tile renderer invoked by `renderer.ts` so new tiles render without modifying `renderer.ts`.
3. **Room Definition Contract (`RoomDefinition`)**:
   - Each room module exports a `RoomDefinition` (`coord`, `name`, `areaId`, `grid`, `caches`) automatically assembled by the maps master registry into `ORION_TUTORIAL_ROOMS`, `ORION_ROOM_METADATA`, and `ORION_CACHE_DEFINITIONS`.
4. **Weapons, Items & Equipment Actions**:
   - Each weapon (`gladius_boltcaster`, `khopesh`), item (all 13 items), and assignable equipment action module lives in its own file and is auto-registered by its folder's master `index.ts`.
