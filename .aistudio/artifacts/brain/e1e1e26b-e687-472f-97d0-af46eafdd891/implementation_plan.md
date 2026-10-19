# Project Orion — Sub-Tile Micro-Composer & 2.5D Post-Processing Pipeline

Drastically reduce embedded asset file size by replacing pre-baked full tilesets with a **Sub-Tile Micro-Composer** (`2×2` of `8×8px` quadrants and `4×4` of `4×4px` micro-blocks baked once into an offscreen atlas cache at startup), and introduce a **Multi-Pass Post-Processing & Visual Effects Pipeline** that handles dynamic lighting, bloom, blade trails, projectile glow, automatic sprite outlines, water reflections, and biome weather without requiring hundreds of hardcoded pixel assets.

## User Review & Critical Decisions

> [!IMPORTANT]
> All choices from your clarifications are locked into this plan. Click **Proceed** to build the offscreen Sub-Tile Micro-Composer, wire the 2.5D Post-Processing & Effect Layers into the renderer, shrink the tileset footprint, and amend the Authoring Guide.

- **Confirmed Decision 1 — Hybrid `2×2` (`8px`) Quadrant & `4×4` (`4px`) Micro-Block Sub-Tile Composer**: A `16×16px` tile is synthesized from either **16 rearranged `4×4px` micro-blocks** (for organic terrains like Dirt, Grass, and Corrosive Aether plus stepped neighbor transitions) or **4 rearranged `8×8px` quadrants** (for architectural Ruins masonry, connected walls, and single pillars).
- **Confirmed Decision 2 — Startup Offscreen Atlas Baking**: All `3×3` terrain, transition, and wall clusters are baked once at startup into an in-memory offscreen canvas cache, shrinking source file size by over 90% while preserving zero-allocation 60fps `drawImage` blitting.
- **Confirmed Decision 3 — Full 5-Pass Post-Processing & Effect Layer Suite**:
  1. **Automatic Sprite Outlines, Drop Shadows & Water/Aether Reflections**
  2. **Procedural Projectiles, Hit Flashes & Sweeping Blade Trails**
  3. **Dynamic Light Sources, Radial Bloom & Ambient Darkness**
  4. **Biome Weather Layers (Rain + Ripples, Siege Ash, Luminous Æther Mist)**
  5. **Optional CRT Scanline, Vignette & Desync Chromatic Glitch Pass**

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Takes Tiny Assets and Makes Them Huge**: Instead of embedding 180 individual `16×16px` PNG tiles (`>60 KB` of Base64 strings), the engine stores compact `4×4px` micro-blocks and `8×8px` quadrant seeds (just a few kilobytes total) and algorithmically permutes, rotates, and blends them into all 20 `3×3` biome clusters (`180` tiles across `Dirt`, `Grass`, `Aether`, and `Ruins`) on an offscreen canvas at boot.
  2. **Shifts Visual Complexity into Engine Effect Layers**: Projectiles, melee weapon arcs, light sources, sprite silhouettes, liquid reflections, hit flashes, and weather are generated dynamically in dedicated rendering passes on top of the base pixel art.
- **Target Audience / Persona**: You (the world and content author) building rich biomes, weapons, and enemies using tiny seed sprites and declarative effect properties rather than hand-painting hundreds of permutation tiles and effect frames.
- **Key Value**: Tiny, maintainable source files paired with atmospheric 2.5D visuals (lighting, bloom, reflections, outlines, weather, and combat trails) at 60fps.

---

## 2. User Experience & Visual Design

- **Key Visual & Gameplay Flows**:
  1. **Sub-Tile World Rendering (Layer 0 & Layer 1)**:
     - **Organic Terrains (`4×4` of `4×4px` Micro-Blocks)**: `Dirt` (`.`), `Grass` (`,`), and `Corrosive Aether` (`~`) permute 16 `4×4px` micro-blocks per `16×16` cell so ground textures never visibly repeat, and weave `4×4px` edge/corner micro-blocks from neighboring terrains to form seamless `from(to)` transitions.
     - **Architectural Masonry & Walls (`2×2` of `8×8px` Quadrants)**: `Ruins` (`:`), connected solid walls (`#`), and standalone single walls (`P`) assemble `8×8px` top-left, top-right, bottom-left, and bottom-right quadrants with automatic bevels and mortar joints.
  2. **Planar Water/Aether Reflections & Sprite Outlines (Layer 2)**:
     - Entities, pillars, and lanterns standing on or immediately north of Corrosive Aether / Bog Water (`~`) cast a **vertically flipped, horizontal-ripple-sheared reflection** into the liquid surface.
     - Small entity and prop sprites can enable **automatic 1px pixel-art outlines** (cached offscreen) and **elevation-scaled ground shadows**.
  3. **Combat Trails, Projectiles & Hit Effects (Layer 3)**:
     - **Blade Swing Trails**: Melee attacks (such as the Khopesh sickle combo and lunge) emit a sweeping crescent ribbon with tapered alpha and additive edge glow.
     - **Post-Processed Projectiles & Hit Flashes**: Bolts, plasma slugs, and grenades render an emissive core, motion-blurred velocity tail, and expanding impact ring, while struck targets trigger a crisp white-hot silhouette flash.
  4. **Biome Weather, Dynamic Lighting & Bloom (Layers 4 & 5)**:
     - **Weather Pass**: Biomes automatically drive atmospheric particles—slanted **Bog Rain** with ground splash rings in `belldor_bog`, drifting **Cinder Ash** in `orc_siege_encampment`, and rising **Æther Spores / Mist** in waygate sanctums.
     - **Lighting & Bloom Pass**: A soft ambient darkness veil is carved out by radial light sources (Player Reactor Core, Poe Lantern `L`, Drop-Pod `D`, Waystations `A`, Waygates `Q`, Corrosive Aether `~`, and projectiles) with additive bloom halos.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-contrast Golden Sun / GBA-inspired 2.5D pixel art enhanced with modern HD-2D post-processing (crisp nearest-neighbor pixels underneath soft radial bloom, planar water reflections, and atmospheric weather).
  - *Color Palette & Mood*: Deep bog slate (`#090d14`) ambient shadow, cyan shield/waystation glow (`#38bdf8`), violet corrosive aether (`#a855f7`), warm sandstone ruins (`#c8b980`), and ember-orange reactor/ash accents (`#f97316`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Startup Offscreen Baking of `4×4px` and `8×8px` Sub-Tiles vs. Static 60KB Base64 Blobs**
  - *Chosen Approach*: Define compact micro-tile seeds (`4×4px` and `8×8px` pixel matrices / mini-PNGs) and bake the 20 `3×3` cluster atlases (`dirt_general`, `dirt_to_grass`, `ruins_walls`, etc.) onto offscreen canvases once at module initialization.
  - *Why*: Cuts tile asset code size by >90%, eliminates massive Base64 strings in source files, and lets you author new terrains by defining just a `4×4` or `8×8` micro-pattern.
- **Decision 2: Declarative Post-Processing Config per Biome, Weapon & Entity**
  - *Chosen Approach*: Expose lightweight optional properties (`lightSource`, `weather`, `outlineColor`, `bladeTrailColor`, `reflectiveLiquid`) on Biomes, Tiles, Weapons, and Enemies that the renderer's post-processing pipeline reads automatically.
  - *Why*: Lets you add lighting, weather, outlines, or weapon trails to any content file with 1–2 lines of config instead of writing custom Canvas drawing code.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Sub-Tile Micro-Composer & Multi-Pass Post-Processing Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                 1. STARTUP SUB-TILE MICRO-COMPOSER (Baked Once)                     │
│                                                                                     │
│  ┌───────────────────────────────┐        ┌──────────────────────────────────────┐  │
│  │ 4×4 Micro-Blocks (4×4px each) │        │ 2×2 Quadrant Seeds (8×8px each)      │  │
│  │ • Dirt, Grass, Aether seeds   │        │ • Ruins masonry, Wall caps, Pillars  │  │
│  │ • Permuted into 16×16 tiles   │        │ • Assembled into 16×16 walls/floors  │  │
│  └───────────────┬───────────────┘        └──────────────────┬───────────────────┘  │
│                  └─────────────────────┬─────────────────────┘                      │
│                                        ▼                                            │
│         ┌──────────────────────────────────────────────────────────────┐            │
│         │ Offscreen Atlas Cache (20 Separated 3×3 Clusters + 4×5 Sheet)│            │
│         └──────────────────────────────┬───────────────────────────────┘            │
└────────────────────────────────────────┼────────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                 2. 60FPS MULTI-PASS RENDER & POST-PROCESSING PIPELINE               │
│                                                                                     │
│  [Pass 0: Ground & Transitions] ──► Blits cached 16×16 auto-tiles (Dirt/Grass/Ruins)│
│                 │                                                                   │
│                 ▼                                                                   │
│  [Pass 1: Liquid Reflections]   ──► Planar flipped + ripple-sheared reflections on ~│
│                 │                                                                   │
│                 ▼                                                                   │
│  [Pass 2: 2.5D Walls & Entities]──► Cached 1px Sprite Outliner + Z-Sorted Shadows   │
│                 │                                                                   │
│                 ▼                                                                   │
│  [Pass 3: Combat Effect Layer]  ──► Sweeping Blade Trails + Glow Projectiles + Hits │
│                 │                                                                   │
│                 ▼                                                                   │
│  [Pass 4: Biome Weather Layer]  ──► Rain Streaks/Ripples, Siege Ash, or Æther Mist  │
│                 │                                                                   │
│                 ▼                                                                   │
│  [Pass 5: Lighting, Bloom & CRT]──► Ambient Veil + Radial Light Cutouts + Desync FX │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Authoring Hooks
- **Sub-Tile Seed Definition**:
  - `MicroTileSeed`: Supports `'4x4'` mode (array of `4×4px` micro-blocks arranged in a `4×4` grid to form a `16×16` tile, with automatic edge-block substitution for `from(to)` transitions) and `'2x2'` mode (`8×8px` top-left, top-right, bottom-left, bottom-right quadrants for masonry and walls).
- **Post-Processing & Effect Layer Hooks**:
  - `BiomeDefinition.postProcess`: `{ ambientDarkness?: number; bloomIntensity?: number; weather?: 'rain' | 'ash' | 'aether_mist' | 'none'; liquidReflection?: boolean }`
  - `TileDefinition.lightSource` / `EnemyWikiDefinition.lightSource`: `{ color: string; radius: number; intensity?: number; pulseSpeed?: number }`
  - `SpriteOutline`: Automatic offscreen 1px silhouette generator (`getOutlinedSpriteCanvas`) for any Base64 or procedural sprite.
  - `BladeTrailEffect`: Ring buffer of recent melee arc angles/positions rendered as an alpha-tapered crescent slash with additive bloom.
