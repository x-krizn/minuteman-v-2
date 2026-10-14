# Gradual Asset Override Architecture & Hierarchical Maps

Enables incremental replacement of sprite sheets and procedural graphics with dedicated per-entry asset overrides (`assets: { imageUri?: string, sheetIndex?: number }`) across all database items, weapons, enemies, and tiles, while establishing the 5-tier map hierarchy (`world > region > area > local > room`) and relocating initial spawn coordinates into map definitions.

> [!IMPORTANT]
> **User Decisions Confirmed**:
> 1. **Asset Override Architecture**:
>    - Add a standard `assets: { imageUri?: string, sheetIndex?: number, frameWidth?: number, frameHeight?: number }` object to all items, weapons, enemies, and tiles.
>    - Entries with an empty/omitted `imageUri` fall back to `sheetIndex` or procedural rendering.
>    - When the user pastes a custom sprite (base64 data URL) into `imageUri`, the engine automatically prioritizes it, allowing gradual migration until legacy sheets become obsolete.
> 2. **Scope**: Applied across all items (consumables, equipment, valuables, keys), weapons, enemies, and tiles.
> 3. **5-Tier Map Hierarchy**: Organize world data under `database/world/`:
>    - **Tier 1 (World Map)**: `world/maps/world.ts`
>    - **Tier 2 (Region Map)**: `world/regions/` (e.g. `ancient_depths.ts`)
>    - **Tier 3 (Area Map)**: `world/areas/` (e.g. `forgotten_crypt.ts`, `verdant_ruins.ts`, `boss_arena.ts`)
>    - **Tier 4 (Local Map)**: `world/maps/local/` (e.g. `tutorial.ts` with spawn coordinates and room layouts)
>    - **Tier 5 (Room Map)**: `world/rooms/recycled/` and `world/rooms/special/`
> 4. **Spawn Points**: Move `INITIAL_START` (`{ room: '0,0', x: 32, y: 128 }`) out of `constants.ts` directly into the map entry (`world/maps/local/tutorial.ts`).
> 5. **Bridge Cleanup**: Delete the temporary `src/cartridges/knight/database/areas/` bridge folder.

---

## 1. Overview & Core Concept

### Incremental Asset Replacement Strategy
Currently, entities either sample a tile index from a legacy sheet (`ITEMS_PNG`, `TILES_PNG`, `TILES_G_PNG`) or draw via procedural vector rendering (`drawProceduralPickup`, etc.). 

With the new contract:
- Every entry explicitly declares its asset configuration:
  ```typescript
  assets: {
    imageUri: '', // PLACEHOLDER: Paste dedicated base64 data URL here to override
    sheetIndex: 0, // Fallback index on legacy sprite sheet
  }
  ```
- The renderer checks `entry.assets?.imageUri`. If present and non-empty, it renders the dedicated image immediately.
- If `imageUri` is empty or undefined, it smoothly falls back to the existing `sheetIndex` or procedural routine.
- The user can paste and test custom sprites one by one without breaking anything.

---

## 2. Technical Architecture & File Structure

### Asset Override Contract (`EntityAssetConfig`)

```typescript
export interface EntityAssetConfig {
  imageUri?: string; // Dedicated base64 data URL or asset path
  sheetIndex?: number; // Legacy sprite sheet frame/cell index fallback
  frameWidth?: number; // Optional frame dimension (defaults to 16)
  frameHeight?: number; // Optional frame dimension (defaults to 16)
  frames?: number; // Total animation frames (default 1)
  fps?: number; // Animation playback speed
  anchorX?: number; // Center/pivot anchor
  anchorY?: number;
}
```

### 5-Tier Map Hierarchy

```
src/cartridges/knight/database/world/
├── maps/
│   ├── world.ts          ◄── Tier 1: World Map (overarching realm topology)
│   ├── local/            ◄── Tier 4: Local Map (room layout & spawnPoint)
│   │   ├── tutorial.ts   ◄── spawnPoint: { room: '0,0', x: 32, y: 128 }
│   │   └── index.ts
│   └── index.ts
├── regions/              ◄── Tier 2: Region Map (regional zones)
│   ├── ancient_depths.ts
│   └── index.ts
├── areas/                ◄── Tier 3: Area Map (thematic sub-zones & biomes)
│   ├── forgotten_crypt.ts
│   ├── verdant_ruins.ts
│   ├── boss_arena.ts
│   └── index.ts
├── rooms/                ◄── Tier 5: Room Map (chambers & corridors)
│   ├── recycled/
│   │   ├── corridors.ts
│   │   ├── shafts.ts
│   │   ├── vaults.ts
│   │   └── index.ts
│   ├── special/
│   │   ├── sanctuary.ts
│   │   └── index.ts
│   └── index.ts
├── biomes/               ◄── Visual & audio atmosphere
├── tiles/                ◄── Individual tile definitions with asset overrides
└── generation/           ◄── Procedural floor generator
```

---

## 3. Implementation Steps

1. **Update Type Definitions (`src/cartridges/knight/types.ts`)**:
   - Define `EntityAssetConfig` interface.
   - Attach `assets?: EntityAssetConfig` to `ItemDefinition`, `EnemyWikiDefinition`, `TileDefinition`, `WeaponDefinition`, and `CharacterDefinition`.
   - Add `RegionDefinition`, `AreaDefinition`, `LocalMapDefinition`, and `WorldMapDefinition` interfaces.
2. **Apply Asset Placeholders Across Database Entries**:
   - **Items (`database/items/`)**:
     - Consumables (`flask_refill.ts`, `potion_hp.ts`, `potion_ap.ts`, `potion_ep.ts`, `potion_sp.ts`).
     - Equipment (`ability_double_jump.ts`, `flask_shard.ts`).
     - Valuables (`coin.ts`, `amber.ts`, `amethyst.ts`, `emerald.ts`, `ruby.ts`, `sapphire.ts`, `topaz.ts`).
     - Keys (`key.ts`).
   - **Weapons (`database/weapons/`)**:
     - `short_sword.ts`, `iron_round_shield.ts`.
   - **Enemies (`database/enemies/`)**:
     - `crawler.ts`, `sentry.ts`, `wisp.ts`, `enemy_knight.ts`.
   - **Tiles (`database/world/tiles/`)**:
     - `wall.ts`, `platform.ts`, `gate.ts`, `air.ts`.
3. **Build 5-Tier Map Hierarchy**:
   - Create `database/world/regions/` (`ancient_depths.ts`, `index.ts`).
   - Create `database/world/areas/` (`forgotten_crypt.ts`, `verdant_ruins.ts`, `boss_arena.ts`, `index.ts`).
   - Restructure `database/world/maps/` into `world.ts` and `local/tutorial.ts` (defining `spawnPoint: { room: '0,0', x: 32, y: 128 }`).
   - Update `knightCartridge.ts` to read player initial spawn from `tutorialMap.spawnPoint` and remove `INITIAL_START` from `constants.ts`.
4. **Update Render Pipeline for Asset Overrides**:
   - In `renderer.ts` and `proceduralRenderer.ts`:
     - When drawing items/pickups: if `itemDef.assets?.imageUri` exists and is non-empty, render the image; otherwise fall back to `sheetIndex` on `items` strip or procedural icon.
     - When drawing tiles: if `tileDef.assets?.imageUri` exists and is non-empty, render the image; otherwise use active biome sheet.
     - When drawing enemies: if `enemyDef.assets?.imageUri` exists and is non-empty, render the custom image; otherwise use default enemy render.
5. **Clean Up Bridge Directory**:
   - Delete `src/cartridges/knight/database/areas/` bridge folder.
6. **Verification**:
   - Run `compile_applet` and `lint_applet` to confirm complete type safety and clean execution.
