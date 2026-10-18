# Project Orion — Hierarchy-Aligned Database Structure, Base64 PNG Pipeline & Authoring Guide

Reorganize the Orion database into a clean, hierarchy-aligned nested structure (`World [Regions → Areas → Maps → Rooms + Biomes → Tiles]` and `Content Domains`), add a zero-latency **Base64 PNG & Grid Spritesheet/Tilemap** rendering pipeline, and provide a comprehensive standalone **World & Content Authoring Guide**.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed during clarification and revision feedback and govern this implementation:

- **Confirmed Decision 1 — Sane, Hierarchy-Aligned Nested Database Structure**:
  - Consolidate all spatial tiers (`Regions`, `Areas`, `Maps`, `Rooms`, `Biomes`, `Tiles`, and `Generation`) cleanly under the unified `world` domain (eliminating the split between top-level folders and legacy `world` subfolders).
  - Organize `local` definitions into nested sub-groups matching their parent in the hierarchy (Local Areas grouped by Region, Local Maps grouped by Area, Local Rooms grouped by Map) and upgrade every tier registry to use recursive auto-discovery (`**/*.ts`) so files can be nested at any depth matching the world tree without manual imports.
- **Confirmed Decision 2 — Standalone Cartridge Authoring Guide**: The complete authoring manual will live as a standalone Markdown reference inside the Orion cartridge folder, structured as a practical recipe book reflecting the cleaned-up nested hierarchy, modular content domains (`Tiles`, `Enemies`, `Weapons`, `Items`, `Equipment`), and asset integration.
- **Confirmed Decision 3 — Fast Base64 Embedded Asset System**: Rather than relying on external network fetches or slow runtime file I/O, the engine will include a dedicated Base64 image & atlas cache that pre-decodes `data:image/png;base64,...` strings (or raw Base64 payloads) into cached `HTMLImageElement` instances with `imageSmoothingEnabled = false` for crisp pixel art and automatic fallback to procedural Canvas 2D drawing.
- **Confirmed Decision 4 — Dual Support for Individual PNGs & Grid Spritesheets/Tilemaps**: Every visual entity (Tiles, Props, Biome Tile Atlases, Enemies, Weapons, Pickups, and Equipment Icons) will support either a single Base64 PNG sprite or a grid-based Base64 spritesheet/tilemap (specifying cell dimensions, grid coordinates, directional rows, or animation frame strips).

---

### 1. Overview & Core Concept

- **What It Does**:
  1. **Hierarchy-Aligned Database Consolidation**: Restructures the database so the world tiers mirror the actual spatial architecture (`Regions → Areas → Maps → Rooms` and `Biomes → Tiles`). Local content modules are nested by their parent tier (e.g., a room lives under its parent region/area/map subgroup) and are auto-discovered recursively so the database stays organized as the world scales.
  2. **Zero-Config Base64 Asset Registry & Renderer**: Adds a lightweight, cached Base64 sprite & tilemap utility (`drawBase64Sprite`, `drawBase64TileFromAtlas`, `drawBase64AnimatedFrame`) plus declarative `sprite` / `tilemap` fields on Biome, Tile, Enemy, Weapon, Item, and Equipment definitions. If a Base64 PNG or spritesheet frame is defined on an entity, the 2.5D renderer draws it automatically with pixel-crisp scaling, 2.5D elevation (`Z_SCALE`) offset, and hurt-flash tinting; otherwise, it falls back seamlessly to the existing procedural Canvas 2D renderer.
  3. **Complete Written Authoring Guide**: Provides copy-pasteable templates, hierarchy organization rules, ASCII grid legends, coordinate linking rules, lore fast-travel setup (`Waygates` & `Æther Waystations`), and Base64 PNG / spritesheet recipes for building out Project Orion from bottom to top without touching engine code.
- **Target Audience / Persona**: The cartridge creator and level/content designer building out Belldor, the Shattered Worlds, and custom PNG artwork.
- **Key Value**: Eliminates legacy folder clutter so the database hierarchy is intuitive at a glance, while making drafted PNG assets (both standalone sprites and grid tilemaps) work out-of-the-box via embedded Base64 strings.

---

### 2. User Experience & Visual Design

- **Key Authoring Workflows Documented & Supported**:
  1. **Navigating the Nested World Hierarchy**:
     - Every spatial tier lives inside the unified World hierarchy, and each tier's `local` collection is organized into parent-named subfolders (Regions → Areas per Region → Maps per Area → Rooms per Map). Adding a file anywhere inside a tier's `global` or nested `local` hierarchy automatically registers it on boot.
  2. **Where to Start — Bottom-Up vs. Top-Down World Building**:
     - *Bottom-Up Workflow*: Define a Biome palette/tilemap → Craft a custom Tile or Prop → Paint a 20×12 Room ASCII grid inside its Map subgroup → Assemble Rooms into a Map → Group Maps into an Area with an Æther Waystation → Anchor the Area inside a Region with a Colossal Waygate.
     - *Quick Encounters Workflow*: Drop a new Enemy, Weapon, Item, or Equipment module into its domain, assign a `spawnChar` or cache reward ID, and place that character directly inside any Room grid.
  3. **Embedding Individual Base64 PNGs & Grid Tilemaps**:
     - *Single Sprite Mode*: Paste a Base64 PNG string directly onto a Tile (`layer0Sprite`, `layer1Sprite`, `propSprite`), Enemy (`sprite`), Weapon (`hardpointSprite`), or Item (`iconSprite`), along with optional anchor/offset tuning.
     - *Grid Tilemap & Animation Sheet Mode*: Register a shared Base64 PNG tileset on a Biome or spritesheet on an Enemy/Weapon, specifying `cellWidth`, `cellHeight`, `col`, `row`, `frameCount`, and `fps`. The engine slices the exact sub-rectangle in real time with `imageSmoothingEnabled = false`.
- **Visual Identity & Rendering Rules**:
  - *Crisp Nearest-Neighbor Pixel Rendering*: Disables browser bilinear blurring on canvas when blitting Base64 PNGs so 16×16, 24×24, or 32×32 pixel art stays razor-sharp at any display scale.
  - *2.5D Depth & Hurt Feedback Preservation*: Embedded PNG sprites automatically inherit the engine's ground drop-shadows, `z * Z_SCALE` vertical elevation, windup telegraph rings, and white hit-flash overlays.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Unified World Hierarchy with Recursive Parent-Grouped Auto-Discovery**
  - *Chosen Approach*: Consolidate all 5 spatial tiers (`Regions`, `Areas`, `Maps`, `Rooms`, `Biomes`, plus `Tiles` and `Generation`) under the World database domain, remove redundant split folders, organize `local` modules into subdirectories named after their parent tier, and use recursive glob patterns (`./global/**/*.ts` and `./local/**/*.ts`) in each tier's registry.
  - *Why*: Previously, world tiers were split between top-level database folders and `world/`, and all local rooms/maps sat in a flat list. Grouping local modules by parent hierarchy while using recursive discovery keeps hundreds of rooms and maps cleanly organized by region/area/map without ever needing manual index edits.
  - *Alternatives Considered*: Keeping flat `local/` directories at the top level of `database/` (rejected because it fails to reflect the nested `Region → Area → Map → Room` ownership as content grows).
- **Decision 2: Synchronous-Feel Pre-Decoded Image Cache for Base64 Strings**
  - *Chosen Approach*: Normalize both `data:image/png;base64,...` URIs and raw Base64 strings into a singleton `Map<string, HTMLImageElement>` cache on first reference or cartridge boot. Once decoded in memory, `ctx.drawImage(...)` blits directly from GPU/memory in sub-millisecond time every frame.
  - *Why*: Calling `new Image()` inside a 60fps render loop stalls rendering and causes flicker; caching by Base64 hash/ID guarantees instant zero-allocation blitting.
- **Decision 3: Declarative `SpriteAssetConfig` Alongside Custom `render25D` Hooks**
  - *Chosen Approach*: Entity definitions can specify a declarative `sprite` / `tileSheet` object (supporting both single Base64 images and `[col, row]` grid sheets) OR use helper functions inside their custom `render25D` / `renderLayer0` / `renderProp25D` callbacks.
  - *Why*: Lets simple tiles, props, and enemies render a PNG or spritesheet strip with zero drawing code, while still allowing complex multi-part bosses or phase-shifting walls to combine Base64 sprites with custom Canvas effects.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                HIERARCHY-ALIGNED ORION DATABASE ARCHITECTURE               │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  WORLD HIERARCHY DOMAIN (Recursive Auto-Discovery per Tier)          │  │
│  │                                                                      │  │
│  │   [Tier 5: REGIONS]  (global + local by world)                       │  │
│  │          │                                                           │  │
│  │          ▼                                                           │  │
│  │   [Tier 4: AREAS]    (global + local nested by parent Region)        │  │
│  │          │                                                           │  │
│  │          ▼                                                           │  │
│  │   [Tier 3: MAPS]     (global + local nested by parent Area)          │  │
│  │          │                                                           │  │
│  │          ▼                                                           │  │
│  │   [Tier 2: ROOMS]    (global + local nested by parent Map)           │  │
│  │          ▲                                                           │  │
│  │          │                                                           │  │
│  │   [Tier 1: BIOMES & TILES] (global/local Biomes ──▶ Tile Registry)   │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
│                                     │                                      │
│  ┌──────────────────────────────────┴───────────────────────────────────┐  │
│  │  ENTITY & GAMEPLAY DOMAINS + BASE64 ASSET REGISTRY                   │  │
│  │  • Characters, Enemies, Weapons, Equipment, Items, Progression       │  │
│  │  • Base64 Sprite & Grid Tilemap Cache (Individual PNGs + Atlases)    │  │
│  └──────────────────────────────────┬───────────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   2.5D RENDERER & AUTHORING WORKFLOW                       │
│  • Resolves Region → Area → Map → Room → Biome → Tile hierarchy            │
│  • Renders Base64 PNG sprites & grid tilemap cells (nearest-neighbor)      │
│  • Falls back automatically to procedural Canvas 2D drawing                │
│  • Documented end-to-end in standalone Cartridge Authoring Guide           │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Recursive Tier Registries**: Every world tier (`regions`, `areas`, `maps`, `rooms`, `biomes`, `tiles`) uses recursive glob discovery (`./global/**/*.ts` and `./local/**/*.ts`) so local content can be nested cleanly by parent Region, Area, and Map while re-exporting a unified API from `database/world` and `database/index.ts`.
  - `Base64SpriteConfig`:
    - `base64: string` (either a full `data:image/png;base64,...` URI, raw Base64 string, or an ID key referencing a shared Base64 atlas)
    - `cellWidth?: number` and `cellHeight?: number` (for grid tilemaps/spritesheets; defaults to full image dimensions for individual PNGs)
    - `col?: number` and `row?: number` (static tile coordinate in a grid atlas)
    - `frameCount?: number` and `fps?: number` (optional horizontal strip animation)
    - `offsetX?: number`, `offsetY?: number`, `scale?: number` (pixel pivot & 2.5D alignment tuning)
  - Extended Optional Asset Fields:
    - `BiomeDefinition.tileSheetBase64?: string` and `tileSheetCoords?: Record<string, { col: number; row: number; cellWidth?: number; cellHeight?: number }>`
    - `TileDefinition.layer0Sprite?: Base64SpriteConfig`, `layer1Sprite?: Base64SpriteConfig`, `propSprite?: Base64SpriteConfig`
    - `EnemyWikiDefinition.sprite?: Base64SpriteConfig` (with optional state/direction row mapping)
    - `WeaponDefinition.hardpointSprite?: Base64SpriteConfig`
    - `ItemDefinition.iconSprite?: Base64SpriteConfig` & `EquipmentDefinition.iconSprite?: Base64SpriteConfig`
- **Interactive Component & State Mapping**:
  - **Hierarchy-Aligned World Resolver (`world/index.ts` & `generation/procedural25dFloor.ts`)**: Imports all five spatial tiers from their unified `world/` hierarchy and resolves parent-child relationships (`Region → Area → Map → Room → Biome → Tile`) seamlessly.
  - **Base64 Asset Helper (`assets/base64AssetLoader.ts`)**: Exposes `registerBase64Atlas(key, base64)`, `getBase64Image(base64OrKey)`, and `drawBase64Sprite(ctx, config, screenX, screenY, stateTime, options)` so any auto-discovered content file can embed or reference Base64 PNGs with zero boilerplate.
  - **Renderer Integration (`renderer.ts`)**: Checks declarative `layer0Sprite`, `layer1Sprite`, `propSprite`, `biome.tileSheetCoords`, `enemyDef.sprite`, and `weaponDef.hardpointSprite` automatically during the depth-sorted render pass while preserving full procedural fallbacks for every existing entity.
