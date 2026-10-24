# Swamp Biome (`M00 The Bog`) Tileset Revision Plan

## 1. Overview & Asset Architecture
We will integrate the revised `240×240px` (`15×15` tiles of `16×16px`, organized as a `5×5` grid of `3×3` / `48×48px` clusters) Swamp Biome tileset into Project Orion's `belldor_bog` and `global_toxic_wetlands` rendering pipeline.

- **Primary Visual Source**: `/public/assets/aistudio/bogtiles01__2__e9b9511b.png` and the individual `16×16` Base64 tile definitions from `/public/assets/aistudio/1000248459.base64_889a7ed7.txt`.
- **PNG Override for Cluster `(Row 4, Col 5)` (`10_13..12_15`)**: As confirmed, tiles `10_13` through `12_15` will be sourced from the PNG (`bogtiles01__2__e9b9511b.png`) so the **Pale Ruins Brick → Swamp Water** transition ring and its dark water-pit center (`11_14`) are preserved instead of duplicating `10_10..12_12`.

---

## 2. Complete `5×5` Cluster (`15×15` Tile) Mapping

### A. Column 1 (`Cols 01..03`) — The 5 Canonical Swamp Floor Types
Each `3×3` cluster (`NW, N, NE / W, C, E / SW, S, SE`) in Column 1 defines one of the 5 canonical swamp ground types:
1. **`mire` / `dungeon` (`Rows 01..03, Cols 01..03`)**: Dark Mire / Black Dungeon Stone (`bogTiles_01_01..03_03`). Used in deep bog hollows, dungeon/interior chambers (`-4,0`), and dark mire patches (`;`).
2. **`grass` (`Rows 04..06, Cols 01..03`, `,`)**: Overgrown Marsh Grass (`bogTiles_04_01..06_03`). Used in the Downed Trees forest trail (`-3,0`, `-2,0`, `-1,0`, `0,0`) and reed hollows.
3. **`dirt` (`Rows 07..09, Cols 01..03`, `.`)**: Brown Peat / Bog Dirt (`bogTiles_07_01..09_03`). Default walkable marsh soil across the bog trails and clearings.
4. **`ruins` (`Rows 10..12, Cols 01..03`, `:`)**: Ancient Temple / Monastery Ruins Brick (`bogTiles_10_01..12_03`). Used in the Overgrown Ruin Approach (`0,-1`), Poe Lantern Clearing (`0,-2`), Sir Bedivere's Temple Ruins (`1,0`), and Lady of the Lake Sanctum (`2,1`).
5. **`aether` / `water` (`Rows 13..15, Cols 01..03`, `~`)**: Corrosive Bog Water (`bogTiles_13_01..15_03`). Used for armor-corroding swamp pools and channels.

### B. Columns 2–5 (`Cols 04..15`) — Ordered `3×3` Terrain Transition Rings
The outer 8 tiles (`NW, N, NE, W, E, SW, S, SE`) of each transition cluster smoothly blend `fromTerrain -> toTerrain`:
- **Row 1 (`mire` outer)**:
  - `Col 2 (04..06)`: `mire -> grass`
  - `Col 3 (07..09)`: `mire -> dirt`
  - `Col 4 (10..12)`: `mire -> ruins`
  - `Col 5 (13..15)`: `mire -> aether`
- **Row 2 (`grass` outer)**:
  - `Col 2 (04..06)`: `grass -> mire`
  - `Col 3 (07..09)`: `grass -> dirt`
  - `Col 4 (10..12)`: `grass -> ruins`
  - `Col 5 (13..15)`: `grass -> aether`
- **Row 3 (`dirt` outer)**:
  - `Col 2 (04..06)`: `dirt -> grass`
  - `Col 3 (07..09)`: `dirt -> mire`
  - `Col 4 (10..12)`: `dirt -> ruins`
  - `Col 5 (13..15)`: `dirt -> aether`
- **Row 4 (`ruins` outer)**:
  - `Col 2 (04..06)`: `ruins -> grass`
  - `Col 3 (07..09)`: `ruins -> dirt`
  - `Col 4 (10..12)`: `ruins -> mire`
  - `Col 5 (13..15)`: `ruins -> aether` *(sliced from PNG `bogtiles01__2__e9b9511b.png`)*
- **Row 5 (`aether` outer)**:
  - `Col 2 (04..06)`: `aether -> mire`

### C. Terrain-Matched Wall Types (Center Wall Faces + Row 5 Structure Clusters)
Every floor type resolves to its canonical wall family for outer walls (`#`), interior barriers/pillars (`P`), and gates (`G`):

1. **Forest / Downed Trees & Grass/Mud Regions (`grass` & `dirt` floors)**:
   - **Swamp Tree Walls (`Cluster (5, 5)` — `13_13..13_15`, `14_13`, `14_15`)**: Gnarled canopy trees used as walls and pillars in forest/tree-maze rooms (`-3,0` Crater, `-2,0` Downed Trees West, `-1,0` Downed Trees East, `0,0` First Campfire, and global hollow groves).
   - **Grass & Dirt Embankment Walls**: Combined with the grass-topped dirt wall faces (`05_05`, `05_08`, `05_11`, `05_14`), brown dirt/peat wall faces (`08_05`, `08_08`, `08_11`, `08_14`), and root/timber embankment tiles (`14_14`, `15_13..15_15`) so mud and grass rooms feature a natural mix of downed trees and dirt walls.
2. **Temple / Monastery Ruins (`ruins` floor, `:`)**:
   - **Pale Stone Ruins & Canal Ledge Walls (`Cluster (5, 3)` — `13_07..15_09` & `11_05`)**: Weathered pale monastery masonry (`13_07..13_09` upper wall caps, `14_07..14_09` stone wall front over water channel, `15_07..15_09` lower masonry/pillars, and `11_05` brick-topped wall face) used when `#` or `P` borders `:`.
3. **Dungeon / Dark Stone & Perimeter Gate (`mire` floor & `G` gates)**:
   - **Dark Stone Dungeon Walls (`Cluster (5, 4)` — `13_10..14_12` & `02_08`, `02_11`, `02_14`)**: Dark grey masonry parapet (`13_10..13_12`) and wall faces (`02_08`, `02_11`, `02_14`, `14_10`, `14_12`) used for dungeon chambers (`-4,0`) and fortified perimeter walls (`3,0`).
   - **Arched Gate & Iron Portcullis (`14_11`, `15_10..15_12`)**: Mapped directly to `rusted_gate` (`G`) and dungeon/cheat bay doors (`M`) so locked gates display the iron portcullis bars (`15_10`, `15_12`) and central arched gate (`14_11` / `15_11`).

---

## 3. Planned Code Changes

1. **Create Swamp Tileset Atlas Module (`/src/cartridges/orion/database/world/tiles/bog_tileset_atlas.ts`)**:
   - Export the `BOG_TILESET_ATLAS_ID = 'bog_tileset'` (`240×240px`, `15×15` cells of `16×16px`) and register the `bogTiles_01_01..15_15` dictionary (using the PNG data for `10_13..12_15` and the `.txt` Base64 constants for all other tiles).
   - Provide helper lookups for:
     - Base `3×3` floor clusters (`mire`, `grass`, `dirt`, `ruins`, `aether`)
     - All 17 `3×3` transition rings `(fromTerrain, toTerrain)`
     - Terrain-specific wall & pillar resolvers (Forest Trees + Dirt Walls for `grass`/`dirt`, Monastery Stone + Canal Walls for `ruins`, Dark Stone + Portcullis for `mire`/dungeon/gates).
2. **Update Biome & Auto-Tiler Pipeline (`/src/cartridges/orion/types.ts`, `/src/cartridges/orion/systems/renderSystem.ts`, `/src/cartridges/orion/database/world/belldor/biomes.ts`)**:
   - Extend `ClusterTerrainType` to support `'mire'` alongside `'dirt' | 'grass' | 'aether' | 'ruins'` (with `;` as the optional explicit grid character for dark mire / dungeon stone).
   - Point `belldorBogBiome` and `globalToxicWetlandsBiome` to `clusterTileSheetBase64: 'bog_tileset'`.
   - Update `resolveClusterLayer0Coord` and `resolveClusterWallCoord` in `renderSystem.ts` so rooms using `'bog_tileset'` sample the `15×15` (`5×5` cluster) coordinate table and select the matching wall family per floor type and canonical room context (forest trees + dirt walls on grass/mud, pale monastery stone on ruins, dark stone on dungeon/mire).
   - Update `rustedGateTile` (`G`) to render the iron portcullis / arched gate tiles (`14_11`, `15_10..15_12`) from `bog_tileset`.
3. **Update Canonical Bog Room Grids (`map_bog_drop_zone.ts`, `map_deep_bog_maze.ts`, `templates.ts`)**:
   - Refine floor character distributions across `M00 The Bog` so the canonical zones (Drop-Pod Crater `-3,0`, Downed Trees `-2,0` & `-1,0`, First Campfire `0,0`, Temple Ruin Branch & Poe Clearing `0,-1` & `0,-2`, Bedivere's Temple Ruins `1,0`, Corrosive Marsh & Deep Bog `2,0`, `3,-1`, `3,0`, and Lady of the Lake Arena `2,1`) showcase all 5 swamp floor types, their transition borders, and their matching wall families.
