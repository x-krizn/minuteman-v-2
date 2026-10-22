# Project Orion — Scoped Pre-GitHub Codebase Cleanup

Streamline the Project Orion cartridge codebase prior to pushing to GitHub by removing superseded procedural tile and doodad fallback drawing routines, eliminating duplicate tile definitions, and pruning unused legacy properties and helpers strictly within the Project Orion module hierarchy while leaving the Minuteman shell and Knight cartridge untouched.

## User Review & Critical Decisions

> [!IMPORTANT]
> This revised plan scopes all code cleanup strictly to Project Orion and its subfolders, preserving the Minuteman handheld engine and Knight cartridge untouched by design:

- **Confirmed Decision 1 — Strict Orion Boundary**: Keep the Minuteman shell and Knight cartridge completely untouched; perform all code cleanup strictly inside Project Orion and its subfolders.
- **Confirmed Decision 2 — Replaced Procedural Tile & Doodad Fallbacks**: Remove legacy procedural `fillRect` fallback drawing code from Orion's cluster-backed terrain tiles (`.`, `,`, `~`, `:`), wall/pillar tiles (`#`, `P`), and `doodads01`-backed interactive props (`V`, `A`, `Q`, `L`, `1`, `2`, `3`, `!`), relying cleanly on the 3×3 cluster auto-tiler and embedded `doodads01` sprite sheet.
- **Confirmed Decision 3 — Prune Unused Exports, Dead Helpers & Duplicate Tiles in Orion**: Remove the duplicate base `hidden_switch` tile definition (superseded by `hidden_switch_1`), remove unused legacy biome sheet helpers (`drawBiomeSheetTile`, `BiomeTilesetCell`, `tileSheetBase64`, `tileSheetCoords`, and the legacy `palette` alias on `BiomeDefinition`), and prune unreferenced barrel exports inside Orion.
- **Confirmed Decision 4 — Temporary Screenshot Attachments**: Remove the two temporary debugging screenshots while keeping the source sprite sheets intact.

---

## 1. Overview & Core Concept

- **What It Does**: Cleans up leftover, replaced, and redundant code across Project Orion's world database, tile definitions, type contracts, and rendering pipeline so the Orion cartridge is lean and self-consistent for GitHub release.
- **Target Audience / Persona**: Developers and contributors working within the Project Orion cartridge inside the Minuteman multi-cartridge architecture.
- **Key Value**: Every tile definition, biome schema field, and rendering pass inside Project Orion reflects the active 3×3 sub-tile cluster composer and `doodads01` sprite pipeline without carrying obsolete procedural placeholder code.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Multi-Cartridge Preservation**: Both Project Orion and Knight remain registered and playable inside the Minuteman handheld shell.
  2. **2.5D Cluster & Doodad Scene Rendering**: Layer 0 terrain and transitions render through the 20 baked 3×3 sub-tile clusters (`dirt01`, `grass01`, `aether01`, `ruins01`), while Layer 1 walls (`#`), single pillars (`P`), and Layer 2 doodads (`V` Chests, `A` Campfires, `Q` Waygates, `L` Poe Lanterns, `1`/`2`/`3`/`!` Levers) render directly from their baked/embedded sprite atlases with procedural lighting and flame overlays.
  3. **Clean World Wiki & Asset Studio Inspection**: Inspecting Orion's tile and biome registries surfaces only canonical, active definitions without duplicate switch entries or legacy palette aliases.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Crisp 16×16 pixel-art 2.5D dark-fantasy sci-fi RPG (Golden Sun / ALTTP / Metroid Fusion inspired).
  - *Color Palette & Mood*: Deep obsidian slate (`#090d14`), toxic marsh greens, ancient ruins sandstone, and luminous Æther cyan/amber lighting accents.
  - *Typography & Hierarchy*: High-contrast retro monospace HUD telemetry paired with clean sans-serif modal headers.
  - *Component Styling & Layout*: Contained within the Minuteman LCD viewport frame with crisp `image-rendering: pixelated` canvas scaling.
- **Interactive Feedback & Motion**: Smooth 60 FPS depth-sorted rendering, 3-state lever transitions (`1 → 2 → 3` and `3 → 2 → 1`), flickering campfire embers, bobbing Waygate orbs, and blinking Scavenger Cache glints.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Removing Superseded Procedural Fallbacks in Orion Tiles**
  - *Chosen Approach*: Remove `renderLayer0` from the 4 cluster-backed terrain tiles (`.`, `,`, `~`, `:`), remove procedural box fallbacks from `#` (Pylon Wall) and `P` (Pylon Pillar), and remove `if (!drewSprite)` placeholder box branches from the `doodads01` prop tiles (`V`, `A`, `Q`, `L`, `1`, `2`, `3`, `!`).
  - *Why*: The 20 3×3 biome clusters and `doodads01` atlas are synchronously registered at boot. Removing dead procedural fallback branches eliminates redundant code and ensures a single source of visual truth.
  - *Alternatives Considered*: Leaving procedural `fillRect` fallbacks alongside sprite rendering, which obscures which tiles are sprite-backed vs. procedural (`D` Drop-Pod, `S` Fallen Scout, `G` Rusted Gate, `M` Cathedral Door, `%` Desync Wall, `_` Chasm).
- **Decision 2: Deduplicating Orion's Tile Registry & Pruning Legacy Biome Fields**
  - *Chosen Approach*: Remove the duplicate `hiddenSwitchTile` (`id: 'hidden_switch'`, `char: '1'`) that collided with `hiddenSwitch1Tile` (`id: 'hidden_switch_1'`, `char: '1'`) during polymorphic auto-discovery, and remove the unused `palette` alias and legacy `tileSheetBase64` / `tileSheetCoords` / `drawBiomeSheetTile` scaffolding from Orion's biome definitions and renderer.
  - *Why*: Eliminates duplicate `char: '1'` overwrite behavior in `TILE_REGISTRY` and removes legacy compatibility fields that were replaced by `tileAssets` and the 3×3 cluster auto-tiler.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 Minuteman Handheld Shell (Untouched)                     │
│          (Cartridge Registry · Knight Cartridge · Project Orion)         │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                Project Orion Cartridge Scope (Cleanup Target)            │
│       (5-Tier World Auto-Discovery · Aether Fog Graph · State Store)     │
└───────────────┬──────────────────────────────────────────┬───────────────┘
                │                                          │
                ▼                                          ▼
┌───────────────────────────────────────┐  ┌───────────────────────────────┐
│     3×3 Sub-Tile Cluster Composer     │  │   3×3 Doodad Sprite Pipeline  │
│  (dirt01 · grass01 · aether01 ·       │  │  (Chest · Campfire · Waygate  │
│   ruins01 -> 20 Baked 48×48 Clusters) │  │   Poe Lantern · 3-Pos Lever)  │
└───────────────────┬───────────────────┘  └───────────────┬───────────────┘
                    │                                      │
                    └──────────────────┬───────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  2.5D Depth-Sorted Scene & Lighting Pass                 │
│     (Layer 0 Cluster Terrain -> Water Reflections -> Layer 1 Walls ->    │
│      Layer 2 Depth-Sorted Entities/Doodads -> Dynamic Bloom & Weather)   │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **One-to-One Tile Registry**: Every ASCII room character maps to exactly one canonical `TileDefinition` in Orion's auto-discovery registry.
  - **Streamlined Biome Schema**: Biomes define `tileTypes`, `tileRules`, `tileAssets`, `clusterTileSheetBase64`, `defaultClusterTerrain`, `postProcess`, and `lightColor` without dead `palette` or `tileSheetCoords` fields.
- **Interactive Component & State Mapping**:
  - **Cluster Auto-Tiler**: Handles Layer 0 terrain (`.`, `,`, `~`, `:`), Layer 1 walls (`#`), and Layer 2 pillars (`P`) directly from the baked 3×3 cluster atlases.
  - **Doodad Prop Renderer**: Renders `V` (Chest), `A` (Waystation Campfire), `Q` (Colossal Waygate), `L` (Poe Lantern), and `1`/`2`/`3`/`!` (Levers) directly from `DOODADS_01_BASE64` with layered procedural flame/glow effects, while `C` (Scavenger Cache) renders only its subtle ground shadow and periodic glint.
