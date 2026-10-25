# Project Orion — World, Content & Base64 Asset Authoring Guide

Welcome to the **Project Orion** authoring manual. The cartridge is built around **recursive module auto-discovery** (`import.meta.glob`), a **five-tier nested spatial hierarchy** (`Biomes → Rooms → Maps → Areas → Regions`), and a **globally classless, hardware-driven build architecture (`v0.8`)**.

> **The Golden Rule of Orion Authoring:**
> Unless new content requires a brand-new engine mechanic or a new route entry in `KEY_NODE_ROUTES`, **you never edit engine files or `index.ts` registries**. Dropping a new `.ts` file into the appropriate `database/` subfolder automatically registers it on boot.

---

## 0. Quick-Jump Code Anchor Map (`[ORION-ANCHOR: ID]`)

Every critical registry, world-composer boundary, and engine hook in the codebase is tagged with a standardized `// [ORION-ANCHOR: <ID>]` comment block. Search for any anchor ID below to jump directly to the exact block of code to inspect or edit:

| Anchor Tag | File Path | Purpose & When to Edit |
| :--- | :--- | :--- |
| `[ORION-ANCHOR: TYPES-WORLD-HIERARCHY]` | `src/cartridges/orion/types.ts` | `BiomeDefinition` (`tileTypes`, `enemySpawnTypes`, `tileRules`, `tileAssets`), `TileDefinition`, `RoomDefinition`, `MapDefinition`, `AreaWikiDefinition`, and `RegionDefinition` schemas. |
| `[ORION-ANCHOR: U00-UNIVERSE-CATALOG]` | `src/cartridges/orion/database/world/universe.ts` | The 20-World `u00` Universe catalog (`8 Major`, `7 Minor`, `5 Unstable`) and `specStatus: 'LOCKED' \| 'UNDEFINED'` world status flags. |
| `[ORION-ANCHOR: WORLD-GLOB-REGISTRY]` | `src/cartridges/orion/database/world/index.ts` | Single polymorphic `import.meta.glob` scanner that auto-registers Regions, Areas, Maps, Rooms, Biomes, Tiles, Waystations, and Waygates. |
| `[ORION-ANCHOR: ASCII-CHAR-REGISTRY]` | `src/cartridges/orion/database/world/index.ts` | Centralized ASCII character resolver (`getTileDefinition`, `resolveRoomEnemyTypeAtChar`) and `getMasterAsciiCharacterRegistry()` collision audit. |
| `[ORION-ANCHOR: ENEMY-GLOB-REGISTRY]` | `src/cartridges/orion/database/enemies/index.ts` | Recursive auto-discovery for all Enemy, Boss, and NPC modules (`ENEMY_REGISTRY`, `CHAR_TO_ENEMY_TYPE`, `ENEMY_SPAWN_COLLISIONS`). |
| `[ORION-ANCHOR: ENEMY-SPAWN-RESOLVER]` | `src/cartridges/orion/database/enemies/index.ts` | `resolveEnemyTypeForChar(char, biomeEnemyMap)` and `getEnemyBySpawnChar` supporting biome-scoped spawn overrides. |
| `[ORION-ANCHOR: WORLD-KEY-ROUTES]` | `src/cartridges/orion/systems/worldSystem.ts` | Declarative `KEY_NODE_ROUTES` graph connecting authored `key` rooms (`"rx,ry"`) across cardinal directions with `routeTotal` general nodes. |
| `[ORION-ANCHOR: U00-ZONE-SEALS]` | `src/cartridges/orion/systems/worldSystem.ts` | `getUndefinedZoneSealReason` enforcing `specStatus: 'UNDEFINED'` Æther Fog seals until a zone's canonical spec is unlocked. |
| `[ORION-ANCHOR: WORLD-COMPOSER-INIT]` | `src/cartridges/orion/systems/worldSystem.ts` | `assembleNestedWorld()` 5-tier world composer (`Region → Area → Map → Room`) and automatic cardinal doorway carver. |
| `[ORION-ANCHOR: AETHER-FOG-TOPOLOGY]` | `src/cartridges/orion/systems/worldSystem.ts` | 5-node Æther Fog graph engine (`key`, `general`, `side`, `loop`, `end`) and `maxDepth = clvl + 1` loop scaling. |
| `[ORION-ANCHOR: ROOM-TRANSITION-GATE]` | `src/cartridges/orion/systems/worldSystem.ts` | `transitionViaAetherDoor()` handling room-to-room doorway alignment, area banners, and dynamic enemy/feature spawning. |
| `[ORION-ANCHOR: WAYSTATION-WAYGATE-TRAVEL]` | `src/cartridges/orion/systems/worldSystem.ts` | `fastTravelToWaystation()` and Colossal Waygate inter-region / inter-world teleportation & armor repair. |
| `[ORION-ANCHOR: ENTITY-SPAWN-ROOM]` | `src/cartridges/orion/systems/entitySystem.ts` | `spawnRoomEnemies()` parsing `10 × 9` room ASCII grids using `resolveRoomEnemyTypeAtChar(char, state.biomeId)`. |
| `[ORION-ANCHOR: RENDER-CLUSTER-BAKE]` | `src/cartridges/orion/systems/renderSystem.ts` | `bakeBiomeClusterTileset()` offscreen sub-tile micro-composer baking 20 separated `3×3` biome clusters (`ruins_tileset` & `bog_tileset`). |
| `[ORION-ANCHOR: RENDER-POST-PROCESS]` | `src/cartridges/orion/systems/renderSystem.ts` | `drawDynamicLightingAndBloomPass()` 5-pass 2.5D lighting, water reflection, 1px outline, blade trail, and weather pipeline. |
| `[ORION-ANCHOR: PROG-LEVEL-SEQUENCE]` | `src/cartridges/orion/database/progression/index.ts` | `LEVEL_UNLOCK_SEQUENCE` (`Levels 1–20`) onboarding & expression milestones. |
| `[ORION-ANCHOR: PROG-SKILL-SCALING]` | `src/cartridges/orion/database/progression/index.ts` | `PILOT_SKILL_DEFINITIONS` (`6 Combat Discipline Skills`, `Lv 1–20`, funded by Discipline + Reactor Gemstones). |
| `[ORION-ANCHOR: PROG-FEAT-SYNERGY]` | `src/cartridges/orion/database/progression/index.ts` | `doesPilotMeetFeatEquipmentRequirement()` classless hardware & weapon-family prerequisite verifier for all 97 Feats. |
| `[ORION-ANCHOR: COMBAT-ACTION-PAYLOAD]` | `src/cartridges/orion/systems/combatSystem.ts` | `executeActionPayload()` resolving multi-source `[L]`/`[R]` actions, weapon skills, adaptive damage types, and support pulses. |
| `[ORION-ANCHOR: COMBAT-DEFENSE-MATH]` | `src/cartridges/orion/systems/combatSystem.ts` | `applyDamageToLayers()` Three Defense Layers resolution (`Layer 1 Shields → Layer 2 Armor → Layer 3 200 Frame HP`). |

---

## 1. Where to Start & Database Hierarchy Overview

All game data lives inside `src/cartridges/orion/database/`, organized into two primary branches: the **World Hierarchy (`database/world/`)** and **Gameplay & Asset Domains**.

```
src/cartridges/orion/
├── database/                     # Strictly Self-Contained Content & Asset Entry Files
│   ├── world/                    # Spatial World -> Region -> Area -> Map (+ Rooms) Hierarchy
│   │   ├── index.ts              # [ORION-ANCHOR: WORLD-GLOB-REGISTRY] & [ORION-ANCHOR: ASCII-CHAR-REGISTRY]
│   │   ├── universe.ts           # [ORION-ANCHOR: U00-UNIVERSE-CATALOG] 20-World Catalog (8 Major, 7 Minor, 5 Unstable)
│   │   ├── belldor/              # 1. Belldor (Camelot) — Arthurian, canon (LOCKED)
│   │   │   ├── biomes.ts         # Belldor biomes (belldor_bog, orc_siege_encampment, etc.)
│   │   │   ├── region_belldor_outskirts/
│   │   │   │   ├── region.ts     # Region definition
│   │   │   │   ├── m00_the_bog/  # M00 THE BOG (bog-v2.md · LOCKED)
│   │   │   │   │   ├── area.ts   # Area definition + Waystation + ZoneFeatureSpec
│   │   │   │   │   ├── map_bog_drop_zone.ts # Downed trees, Temple ruins, Bedivere's corpse
│   │   │   │   │   └── map_deep_bog_maze.ts # The Poe, Lady of the Lake arena, OD-BOG-01
│   │   │   │   └── m01_orc_encampment/      # M01 ORC ENCAMPMENT (mapping-v0.md · UNDEFINED)
│   │   │   │       ├── area.ts
│   │   │   │       └── map_orc_siege_camp.ts
│   │   │   └── region_belldor_camelot_heartland/
│   │   │       ├── region.ts     # Region definition + Colossal Waygate
│   │   │       ├── camelot_border_town/     # CAMELOT BORDER TOWN (border-town-v1.md · LOCKED)
│   │   │       │   ├── area.ts
│   │   │       │   ├── map_border_town_market.ts    # Outer Perimeter & Market District
│   │   │       │   ├── map_border_town_barracks.ts  # Barracks Quarter (Percival/Tristan/Bors)
│   │   │       │   └── map_border_town_cathedral.ts # Cathedral District & Dungeon Entrance
│   │   │       └── camelot_interior/        # CAMELOT INTERIOR & Deep Dungeon (OD-BT-01 · UNDEFINED)
│   │   │           ├── area.ts
│   │   │           └── map_camelot_waygate_depths.ts
│   │   ├── tyrranus/             # 2. Tyrranus (Greek/Roman, non-canon · UNDEFINED zone docs)
│   │   │   ├── biomes.ts
│   │   │   └── region_tyrranus_frontier/
│   │   │       ├── region.ts
│   │   │       └── tyrranus_marble_gatehead/
│   │   │           ├── area.ts
│   │   │           └── map_tyrranus_gatehead.ts
│   │   ├── global/               # Reusable procedural & inter-world templates
│   │   │   └── templates.ts      # Global biomes, regions, areas, maps & procedural rooms
│   │   └── tiles/                # Shared tile & 2.5D prop definitions + embedded 16x16 base tiles
│   ├── enemies/                  # [ORION-ANCHOR: ENEMY-GLOB-REGISTRY] Self-contained Enemy, Boss & NPC modules
│   ├── weapons/                  # Self-contained 5-Action Weapon modules (29 Magitech + 12 Heritage)
│   ├── items/                    # Consumables, 9 Gemstones, Keys & Relics
│   ├── equipment/                # Tactical Utilities [Action 6] & Hardware/Reactor assignable [L]/[R] skills
│   ├── characters/               # 6 Classless Starting Loadout Kit profiles (Bastion, Fortress, Dawnforge, etc.)
│   └── progression/              # [ORION-ANCHOR: PROG-FEAT-SYNERGY] 97 Canonical Feats, 58 Hardware items & Level Gates
│
├── systems/                      # 5 Cohesive Engine Systems
│   ├── renderSystem.ts           # [ORION-ANCHOR: RENDER-CLUSTER-BAKE] & [ORION-ANCHOR: RENDER-POST-PROCESS]
│   ├── worldSystem.ts            # [ORION-ANCHOR: WORLD-COMPOSER-INIT] & [ORION-ANCHOR: AETHER-FOG-TOPOLOGY]
│   ├── playerSystem.ts           # State store, save/load, 2.5D physics, player controller & state gates
│   ├── combatSystem.ts           # [ORION-ANCHOR: COMBAT-DEFENSE-MATH] & [ORION-ANCHOR: COMBAT-ACTION-PAYLOAD]
│   └── entitySystem.ts           # [ORION-ANCHOR: ENTITY-SPAWN-ROOM] Enemy spawning/AI, projectiles, pickups & particles
│
└── ui/                           # React HUD, Satchel & Menu overlays
```

### Recommended Order for Building New World Content
1. **Universe Catalog (`database/world/universe.ts` → `[ORION-ANCHOR: U00-UNIVERSE-CATALOG]`)**: If activating a new world or promoting a zone from `UNDEFINED` to `LOCKED`, update its `regionIds` and `specStatus`.
2. **Biome (`world/<world>/biomes.ts`)**: Define the atmosphere, environmental rules (corrosive water, mud slow, desync flicker), `tileTypes`, optional `enemySpawnTypes` overrides, and cluster auto-tiling (`clusterTileSheetBase64`).
3. **Tiles & Enemies (`world/tiles/` & `database/enemies/`)**: *(Optional)* Add any new interactive props, custom walls, or enemies needed by your rooms. Check the **Master ASCII Character Registry** in Section 2B first!
4. **Region (`world/<world>/<regionId>/region.ts`)**: Group your areas and optionally attach a **Colossal Waygate (`Q`)** for inter-world / inter-region fast travel.
5. **Area (`world/<world>/<regionId>/<areaId>/area.ts`)**: Group your maps, set `specStatus: 'LOCKED'` (or `'UNDEFINED'` if sealed), and attach an **Æther Waystation (`A`)** for intra-region fast travel.
6. **Map + Co-Located Rooms (`world/<world>/<regionId>/<areaId>/map_<name>.ts`)**: Paint `10 × 9` ASCII room grids (`COLS = 10`, `ROWS = 9`) and export the `MapDefinition` alongside its `RoomDefinition` entries in the same file.
7. **Key Node Routes (`systems/worldSystem.ts` → `[ORION-ANCHOR: WORLD-KEY-ROUTES]`)**: Connect your new authored `key` room coordinates (`"rx,ry"`) in `KEY_NODE_ROUTES` with `routeTotal` (`0` for direct adjacency, or `1..N` to generate `N` procedural `general` corridor rooms between Points of Interest).

---

## 2. Authoring the 5-Tier World Hierarchy & Aether Fog Topology

### 2A. Aether Fog 5-Node Topology & Depth Progression (`[ORION-ANCHOR: AETHER-FOG-TOPOLOGY]`)
No outer room in Orion has a literal solid map border. Instead, `systems/worldSystem.ts` routes cardinal doorways (`N`, `S`, `E`, `W`) through a dynamic 5-node Æther Fog graph and renders a relative **HUD Mini-Map**:
- **`key` Nodes**: Authored Points of Interest (Drop-Pod, Towns, Boss Sanctums, Waystations, Waygates) registered via `RoomDefinition` files and linked in `KEY_NODE_ROUTES` (`[ORION-ANCHOR: WORLD-KEY-ROUTES]`).
- **`general` Nodes**: Dynamically generated corridor chunks that advance route progress (`1/N .. N/N`) between connected `key` nodes when `routeTotal > 0` in `KEY_NODE_ROUTES`. Room-to-room banners are suppressed unless entering a new Point of Interest or triggering a hazard warning.
- **`side` Nodes**: Off-path branches extending from `general` or `key` nodes; they do **not** advance route progress and lead either to an `end` node or a `loop` node.
- **`end` Nodes**: Terminal single-exit pockets featuring rolled rewards (`loot_cache`, `mini_boss`, `secret_switch`, or `dead_end`). Only their return doorway is open; the other 3 walls are sealed.
- **`loop` Nodes (Depth `1 .. clvl + 1`)**: Going deeper into the Æther fog scales up to `maxDepth = clvl + 1`. Each depth tier `d` (`1 <= d < maxDepth`) spans `d` rooms (`1/d .. d/d`) before advancing to depth `d + 1`. Before reaching `maxDepth`, stepping through the return doorway retraces visited rooms backward toward the main path (`anchorSafeNodeId`), and cleared rooms remain safe. At `maxDepth` (`clvl + 1`), rooms are generated randomly across all exits (boss room doors do not lock, so the player may run from boss rooms into another random `maxDepth` room) with a `1 / (clvl + 1)` boss spawn frequency. Defeating a boss at `maxDepth` clears the fog (`clearAetherFogOnBossDefeat`) and returns the player to their anchor node on the main path.

#### Connecting Authored Key Rooms in `KEY_NODE_ROUTES` (`[ORION-ANCHOR: WORLD-KEY-ROUTES]`)
When adding new authored `RoomDefinition` coordinates (`"rx,ry"`), add their cardinal connections in `KEY_NODE_ROUTES` inside `src/cartridges/orion/systems/worldSystem.ts`:
```ts
// Inside src/cartridges/orion/systems/worldSystem.ts -> [ORION-ANCHOR: WORLD-KEY-ROUTES]
const KEY_NODE_ROUTES: Record<string, Partial<Record<AetherCardinalDir, KeyNodeRouteDescriptor>>> = {
  // ...
  '6,0': {
    W: { targetKeyCoord: '5,0', routeTotal: 1 },
    E: { targetKeyCoord: '7,0', routeTotal: 2 }, // Spawns 2 'general' corridor rooms between 6,0 and 7,0
  },
};
```
Any cardinal doorway on a `key` or `general` room that does **not** have an entry in `KEY_NODE_ROUTES` automatically leads into an off-path `side` or `loop` Æther Fog branch!

---

### 2B. Master ASCII Tile, Doodad & Enemy Spawn Character Registry (`[ORION-ANCHOR: ASCII-CHAR-REGISTRY]`)

Every character in a `10 × 9` Room `grid` resolves through two passes:
1. **Terrain / Wall / Doodad Pass (`getTileDefinition(char, biomeId)`)**: Looks up `biome.tileTypes[char]` first, then falls back to global `TILE_REGISTRY[char]`, then defaults to `.` (`floor`) so enemy spawn characters automatically sit on walkable floor tiles.
2. **Enemy / NPC Spawn Pass (`resolveRoomEnemyTypeAtChar(char, biomeId)` at `[ORION-ANCHOR: ENTITY-SPAWN-ROOM]`)**: Looks up `biome.enemySpawnTypes?.[char]` first, then falls back to global `CHAR_TO_ENEMY_TYPE[char]`.

#### Table 1: Reserved Global Terrain, Wall & Interactive Doodad Characters (`database/world/tiles/`)
| Char | Tile ID | Entry File | Layer & Collision | Behavior & Auto-Tiler Rules |
| :---: | :--- | :--- | :--- | :--- |
| `.` | `floor` | `tiles/floor.ts` | Layer 0 · Walkable | **Brown Peat / Dirt** (`07_01..09_03` in `bog_tileset`); default fallback floor under enemy spawns. |
| `,` | `grass` | `tiles/grass.ts` | Layer 0 · Walkable | **Moss Grass** (`04_01..06_03` in `bog_tileset`); tree canopy walls connect to grass before dirt. |
| `~` | `mud` | `tiles/mud.ts` | Layer 0 · Walkable Hazard | **Corrosive Bog Water / Aether** (`13_01..15_03`); slows movement and corrodes Layer 2 Armor when `biome.tileRules.corrosiveWater = true`. |
| `:` | `ruins_floor` | `tiles/ruins_floor.ts` | Layer 0 · Walkable | **Pale Ruins Brick** (`10_01..12_03`); renders raised platform/bridge retaining walls when north of `~`. |
| `;` | `mire_floor` | `tiles/mire_floor.ts` | Layer 0 · Walkable | **Dark Dungeon Stone / Mire** (`01_01..03_03`); pairs with dark stone walls. |
| `#` | `pylon_wall` | `tiles/pylon_wall.ts` | Layer 1 · **Solid** | Terrain-matched perimeter/interior wall (Tree Canopy on grass/dirt, Ruins Stone on `:`, Dark Stone on `;`). |
| `P` | `pylon_pillar` | `tiles/pylon_pillar.ts` | Layer 2 · **Solid** | 2.5D depth-sorted single pillar / tree trunk (`blocksHeight: 2`). |
| `_` | `chasm` | `tiles/chasm.ts` | Layer 0 · Pitfall | Open pitfall/sinkhole (`isChasm: true`); player must Jump `[A]` or Booster Dash `[B]` across. |
| `%` | `desync_wall` | `tiles/desync_wall.ts` | Layer 1 · **Dynamic** | Temporal barrier that phases between solid and passable every `biome.tileRules.desyncPeriodSec`. |
| `D` | `drop_pod` | `tiles/drop_pod.ts` | Layer 2 · **Solid** | Drop-Pod Spawn Anchor (`0,0`) & initial repair/attunement point. |
| `S` | `fallen_scout` | `tiles/fallen_scout.ts` | Layer 2 · **Solid** | Bedivere's Fallen Scout Wreckage (`-1,0`); interactive lore/loot object on `[A]`. |
| `C` | `cache` | `tiles/cache.ts` | Layer 2 · **Solid** | Lootable Supply Cache (`room.cache` rewards on `[A]`). |
| `V` | `chest` | `tiles/chest.ts` | Layer 2 · **Solid** | Interactive Treasure Chest (`doodads_01` sprite; rewards gemstones & equipment on `[A]`). |
| `G` | `rusted_gate` | `tiles/rusted_gate.ts` | Layer 1 · **Dynamic** | Locked perimeter gate; opens with `rusted_gate_key` or switch trigger. |
| `M` | `cathedral_door`| `tiles/cathedral_door.ts`| Layer 1 · **Dynamic** | Three-Way Cathedral Dungeon Entrance (opens via Key, 3 Grail Fragments, or 3 Hidden Switches). |
| `L` | `poe_lantern` | `tiles/poe_lantern.ts` | Layer 2 · **Solid** | Decoupled Layer 2 Poe Lantern doodad (inherits neighbor terrain on Layer 0; emits radial light). |
| `A` | `aether_waystation`| `tiles/aether_waystation.ts`| Layer 2 · **Solid** | **Æther Waystation** (`doodads_01` campfire/monolith; attunes Area fast-travel & restores Frame/Armor on `[A]`). |
| `Q` | `colossal_waygate`| `tiles/colossal_waygate.ts` | Layer 2 · **Solid** | **Colossal Waygate** (attunes Region/World signature fast-travel on `[A]`). |
| `1` | `hidden_switch_1` | `tiles/hidden_switch.ts` | Layer 2 · Walkable | Secret exploration floor/wall switch #1 (`[A]` to toggle). |
| `2` | `hidden_switch_2` | `tiles/hidden_switch.ts` | Layer 2 · Walkable | Secret exploration floor/wall switch #2 (`[A]` to toggle). |
| `3` | `hidden_switch_3` | `tiles/hidden_switch.ts` | Layer 2 · Walkable | Secret exploration floor/wall switch #3 (`[A]` to toggle). |
| `!` | `toggle_switch` | `tiles/hidden_switch.ts` | Layer 2 · Walkable | Room mechanism / desync lock lever (`[A]` to toggle). |

#### Table 2: Reserved Global Enemy & NPC Spawn Characters (`database/enemies/`)
| Char | Enemy Type ID | Entry File | Faction | Role & Notes |
| :---: | :--- | :--- | :--- | :--- |
| `E` | `bog_crawler` | `enemies/bog_crawler.ts` | `hostile` | Armored Bog arthropod ambusher (`M00 The Bog`). |
| `W` | `bog_wurm` | `enemies/bog_wurm.ts` | `hostile` | Submerged bio-machine serpent mini-boss (`M00 The Bog`). |
| `p` | `bog_poe` | `enemies/bog_poe.ts` | `poe` | Floating Lantern Spirit (`M00 The Bog`; escort or slay). |
| `o` | `orc_warrior` | `enemies/orc_warrior.ts` | `hostile` | Frontline Orc boarding-axe & shield raider (`Belldor` / `Novarin`). |
| `s` | `orc_scout` | `enemies/orc_scout.ts` | `hostile` | Ranged Orc boltcaster skirmisher (`Belldor` / `Novarin`). |
| `K` | `percival_knight` | `enemies/percival_knight.ts` | `camelot` | Sir Percival — Grail Knight phalanx boss (`Camelot Border Town`). |
| `T` | `tristan_knight` | `enemies/tristan_knight.ts` | `camelot` | Sir Tristan — Corrupted Ranger boss (`Camelot Border Town`). |
| `B` | `bors_knight` | `enemies/bors_knight.ts` | `camelot` | Sir Bors — Berserk Striker boss (`Camelot Border Town`). |
| `N` | `town_npc` | `enemies/town_npc.ts` | `npc` | Border Town Survivor (`calm`, `linger`, or `feral` disposition). |
| *(Event)*| `lady_of_the_lake`| `enemies/lady_of_the_lake.ts`| `hostile` | Awakened via `awakenLadyOfTheLake()` in `0,-2` when carrying Bedivere's items. |

#### Free Unclaimed ASCII Characters for New Global Tiles or Enemies
- **Uppercase Letters Free Globally**: `F`, `H`, `I`, `J`, `O`, `R`, `U`, `X`, `Y`, `Z`
- **Lowercase Letters Free Globally**: `a`, `b`, `c`, `d`, `e`, `f`, `g`, `h`, `i`, `j`, `k`, `l`, `m`, `n`, `q`, `r`, `t`, `u`, `v`, `w`, `x`, `y`, `z`
- **Digits & Symbols Free Globally**: `4`, `5`, `6`, `7`, `8`, `9`, `0`, `@`, `$`, `&`, `*`, `+`, `=`, `?`, `^`

> **How to Reuse Characters Across Worlds Without Collision (`biome.tileTypes` & `biome.enemySpawnTypes`):**
> As Project Orion expands across the 20 worlds of the `u00` Universe, you do **not** need a unique global character for every enemy in the game. Inside any `BiomeDefinition` (`[ORION-ANCHOR: TYPES-WORLD-HIERARCHY]`), you can define `enemySpawnTypes` to map characters locally for rooms in that biome:
> ```ts
> // Inside world/tyrranus/biomes.ts:
> enemySpawnTypes: {
>   E: 'tyrranus_centurion', // In Tyrranus biomes, 'E' spawns a Centurion instead of a Bog Crawler!
>   s: 'tyrranus_velites',   // In Tyrranus biomes, 's' spawns a Velites javelineer!
> },
> ```

---

### 2C. Tier 1A: Biomes (`database/world/<world>/biomes.ts` or `database/world/global/templates.ts`)
Biomes supply **tile character mappings (`tileTypes`)**, **optional biome-scoped enemy spawns (`enemySpawnTypes`)**, **environmental hazard rules (`tileRules`)**, **lighting & water reflection colors (`tileAssets`)**, and **cluster auto-tiling (`clusterTileSheetBase64`: `'bog_tileset'` or `'ruins_tileset'` + `defaultClusterTerrain`)** to rooms.

- **Inheritance Chain**: A Room uses its own `biomeId` first; if omitted, it inherits from `Map.biomeId → Area.biomeId → Region.defaultBiomeId`.

```ts
// Example: inside src/cartridges/orion/database/world/belldor/biomes.ts
import { BiomeDefinition } from '../../../types';

export const sunkenCatacombsBiome: BiomeDefinition = {
  id: 'sunken_catacombs',
  name: 'Sunken Grail Catacombs',
  scope: 'local',
  world: 'Belldor (Camelot)',
  description: 'Flooded crypts beneath Camelot with corrosive ichor pools and rapid desync.',
  clusterTileSheetBase64: 'bog_tileset', // 'bog_tileset' (5x5 clusters of 3x3) or 'ruins_tileset' (4x5 clusters of 3x3)
  defaultClusterTerrain: 'mire',         // 'dirt' | 'grass' | 'aether' | 'ruins' | 'mire'
  tileTypes: {
    '.': 'floor',
    ',': 'grass',
    ':': 'ruins_floor',
    ';': 'mire_floor',
    '#': 'pylon_wall',
    P: 'pylon_pillar',
    '~': 'mud',
    _: 'chasm',
    D: 'drop_pod',
    S: 'fallen_scout',
    C: 'cache',
    V: 'chest',
    G: 'rusted_gate',
    '%': 'desync_wall',
    L: 'poe_lantern',
    '1': 'hidden_switch_1',
    '2': 'hidden_switch_2',
    '3': 'hidden_switch_3',
    '!': 'toggle_switch',
    M: 'cathedral_door',
    A: 'aether_waystation',
    Q: 'colossal_waygate',
  },
  enemySpawnTypes: {
    E: 'bog_crawler',
    W: 'bog_wurm',
  },
  tileRules: {
    corrosiveWater: true,        // If true, '~' tiles eat Layer 2 Armor Durability
    corrosiveDamagePerSec: 5.5,  // Armor durability lost per second in '~'
    mudSlowMultiplier: 0.65,     // Movement speed multiplier on '~' tiles
    desyncPeriodSec: 2.5,        // Seconds per phase cycle for '%' Desync Walls
    aetherMistDensity: 0.6,
  },
  tileAssets: {
    groundPrimary: '#1e293b',
    groundSecondary: '#172030',
    mudColor: '#0f172a',
    waterColor: '#132a38',
    waterRippleColor: '#38bdf8',
    pylonTop: '#475569',
    pylonFront: '#1e293b',
    pylonTrim: '#7dd3fc',
    shadow: 'rgba(0, 0, 0, 0.45)',
    lightColor: '#38bdf8',
  },
  lightColor: '#38bdf8',
};
```

---

### 2D. Tiers 2 & 3: Maps & Co-Located Rooms (`database/world/<world>/<regionId>/<areaId>/map_<name>.ts`)
Rooms are `10` columns wide by `9` rows tall (`16×16` pixels per tile = `160×144` logical canvas) and are co-located directly inside their parent Map file.

#### On-Foot Doorway Alignment Rule (`[ORION-ANCHOR: WORLD-COMPOSER-INIT]`)
So the player can walk continuously from room to room on foot, `carveRoomCardinalDoors` in `worldSystem.ts` automatically opens or seals doorways on the 4 edges (`N`, `S`, `E`, `W`), preserving authored openings when present:
- **North Edge (`ry - 1`)**: Row `0`, columns `4` and `5` (`####..####`)
- **South Edge (`ry + 1`)**: Row `8`, columns `4` and `5` (`####..####`)
- **West Edge (`rx - 1`)**: Column `0`, rows `5` and `6`
- **East Edge (`rx + 1`)**: Column `9`, rows `5` and `6`

```ts
// Example Map + Rooms: src/cartridges/orion/database/world/belldor/region_belldor_outskirts/m00_the_bog/map_southern_fens.ts
import { MapDefinition, RoomDefinition } from '../../../../../types';

export const room02SunkenShrine: RoomDefinition = {
  id: 'room_0_2_sunken_shrine',
  scope: 'local',
  coord: '0,2', // World grid coordinate "rx,ry"
  mapId: 'map_southern_fens',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Sunken Grail Shrine',
  bannerTitle: 'M00: SUNKEN GRAIL SHRINE',
  grid: [
    '####..####', // North doorway connects to (0,1)
    '#..P..P..#',
    '#...C....#', // Supply Cache (C)
    '#..~~~~..#',
    '#..~~~~..#',
    '#........#',
    '#...E....#', // Spawns Bog Crawler ('E')
    '#........#',
    '##########',
  ],
  cache: {
    scrap: 45,
    items: [{ itemId: 'repair_kit', count: 2 }],
    toast: 'LOOTED SHRINE: +45 SCRAP & 2x REPAIR KITS',
  },
};

export const mapSouthernFens: MapDefinition = {
  id: 'map_southern_fens',
  name: 'Southern Fenlands',
  title: 'Sunken Shrine & Reed Causeways',
  scope: 'local',
  areaId: 'm00_the_bog',
  biomeId: 'belldor_bog',
  description: 'Southern marsh sector combining the Sunken Shrine with procedural marsh crossings.',
  localRoomCoords: ['0,2'],
  globalRoomSlots: [
    {
      coord: '1,2',
      globalRoomId: 'global_marsh_crossing',
      biomeId: 'belldor_bog',
      title: 'Eastern Fen Crossing',
      bannerTitle: 'M00: EASTERN FEN CROSSING',
    },
  ],
  connectedMapIds: ['map_bog_drop_zone'],
};
```

---

### 2E. Tier 4: Areas & Æther Waystations (`database/world/<world>/<regionId>/<areaId>/area.ts`)
Areas assemble `localMapIds` and `globalMapIds`, declare `specStatus` (`'LOCKED'` or `'UNDEFINED'`), and can attach a lore-accurate **Æther Waystation (`waystation`)** for intra-region fast travel (`[ORION-ANCHOR: WAYSTATION-WAYGATE-TRAVEL]`).
- To place the physical Waystation in the world, put `'A'` (or `'D'` for the initial Drop-Pod) in the corresponding Room grid at the matching coordinate.

```ts
// Example Area: src/cartridges/orion/database/world/belldor/region_belldor_outskirts/whispering_fens/area.ts
import { AreaWikiDefinition } from '../../../../../types';

export const whisperingFensArea: AreaWikiDefinition = {
  id: 'whispering_fens',
  name: 'The Whispering Fens',
  title: 'Outer Marsh Sanctuaries',
  scope: 'local',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  world: 'Belldor (Camelot)',
  specStatus: 'LOCKED',
  recommendedLevels: 'Levels 2–4',
  description: 'Mist-shrouded southern marshes bordering the Drop-Pod zone.',
  lore: 'Ancient calibration pylons hum beneath the reedbeds.',
  localMapIds: ['map_southern_fens'],
  globalMapIds: ['global_wetland_expanse_map'],
  connectedAreaIds: ['m00_the_bog'],
  spawnAnchor: { room: '0,2', x: 80, y: 72 },
  exitAnchor: { room: '1,2', x: 80, y: 72 },
  waystation: {
    id: 'ws_whispering_fens',
    name: 'Whispering Fen Waystation',
    regionId: 'region_belldor_outskirts',
    areaId: 'whispering_fens',
    mapId: 'map_southern_fens',
    room: '0,2',
    x: 80,
    y: 40,
    lore: 'Field monolith attuned to your pilot ætheric signature.',
  },
};
```

---

### 2F. Tier 5: Regions & Colossal Waygates (`database/world/<world>/<regionId>/region.ts`)
Regions are top-level territories or Shattered Worlds assembled from `localAreaIds` and `globalAreaIds`. Major Regions can define a **Colossal Waygate (`waygate`)** paired with a `'Q'` tile in the sanctum room grid.

---

## 3. Authoring Gameplay Entities (Enemies, Weapons, Items, Equipment)

### Adding an Enemy (`database/enemies/<enemy_name>.ts` → `[ORION-ANCHOR: ENEMY-GLOB-REGISTRY]`)
Every enemy file encapsulates its own **spawn token (`spawnChar`)**, **Three Defense Layers (`shields`, `armor`, `frameIntegrity`)**, **telegraph (`tellDurationSec`, `tellRadius`)**, **loot table**, **AI (`update`)**, and **visuals (`sprite` or `render25D`)**.
- Check Section 2B's **Master ASCII Registry** to pick an unclaimed `spawnChar` (such as `'H'`, `'J'`, `'R'`, `'U'`, `'X'`, `'Y'`, `'Z'`), or map the enemy per-biome in `biome.enemySpawnTypes`.

```ts
// Example: src/cartridges/orion/database/enemies/tyrranus_centurion.ts
import { EnemyWikiDefinition } from '../../types';

export const tyrranusCenturionEnemy: EnemyWikiDefinition = {
  type: 'tyrranus_centurion',
  name: 'Tyrranus Bronze Centurion',
  spawnChar: 'Z', // Unclaimed global char 'Z' (or map in biome.enemySpawnTypes)
  faction: 'hostile',
  tellRadius: 26,
  emissiveColor: '#fbbf24',
  description: 'Heavy Greco-Roman automaton armed with a shock-pilum.',
  lore: 'Guards the marble colonnades of the Tyrranus Waygate frontier.',
  shields: { type: 'physical', capacity: 40 },
  armor: { type: 'Hardened', threshold: 10, rating: 45, durability: 60 },
  frameIntegrity: 95,
  speed: 28,
  damage: 18,
  damageType: 'Pierce',
  tellDurationSec: 0.65,
  attackCooldownSec: 1.6,
  lootTable: [
    { itemId: 'salvage_scrap', chance: 1.0, count: 20 },
    { itemId: 'repair_kit', chance: 0.35, count: 1 },
  ],
  update(_rooms, state, e, dt) {
    const dx = state.x - e.x;
    const dy = state.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 90 && e.state === 'idle') {
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;
    }
  },
};
```

### Adding a Weapon (`database/weapons/<weapon_name>.ts` or `database/weapons/magitech_catalog.ts`)
Every weapon defines a 5-action moveset (`slot: 0` = primary chain, `slot: 1..4` = active skills assignable to `[L]` and `[R]`), `weaponClass`, `weightClass` (`'light' | 'medium' | 'heavy'`), optional `adaptiveDamageTypes` (`[DamageType, DamageType]`), optional `supportPulseOnHit`, and an optional `hardpointSprite` or `renderHardpoint25D`.

### Adding an Item (`database/items/<item_name>.ts`)
Create a file exporting an `ItemWikiDefinition` (`id`, `name`, `category`, `iconColor`, optional `iconSprite`, and optional `onUse(state, ctx)` callback). Reference its `id` in any Room `cache` or Enemy `lootTable`.

---

## 4. Embedding Drafted PNG Assets Directly in Entry Files (`[ORION-ANCHOR: RENDER-CLUSTER-BAKE]`)

All visual assets in Project Orion are embedded directly inside their respective entry files (`database/world/tiles/`, `database/world/<world>/biomes.ts`, `database/enemies/`, `database/items/`, `database/weapons/`) — there is no separate `assets/` directory.
- Images and sub-tile clusters are decoded and baked once into an in-memory `Map<string, HTMLImageElement | HTMLCanvasElement>` cache (`systems/renderSystem.ts`) and drawn with `imageSmoothingEnabled = false` so pixel art stays razor-sharp.
- Floor terrain tiles (`.`, `,`, `~`, `:`, `;`), walls (`#`), and pillars (`P`) are automatically rendered via the `bog_tileset` (`5×5` clusters of `3×3` tiles) or `ruins_tileset` (`4×5` clusters of `3×3` tiles) auto-tiler, while interactive doodads (`V`, `A`, `Q`, `L`, `1`/`2`/`3`/`!`) slice directly from `DOODADS_01_BASE64`.

### Quick Command to Convert a Drafted PNG to Base64
```bash
# Linux / macOS:
echo "data:image/png;base64,$(base64 -w 0 my_sprite.png)"
```

### Recipe A: Individual Base64 PNG Embedded in a Tile, Prop, Enemy, Weapon, or Item Entry File
```ts
// Inside any EnemyWikiDefinition, TileDefinition, WeaponDefinition, or ItemWikiDefinition:
sprite: {
  base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9h...',
  renderWidth: 16,
  renderHeight: 20,
  offsetX: 0,
  offsetY: 2,
  scale: 1,
  anchor: 'bottom-center', // 'top-left' for floor tiles, 'bottom-center' for 2.5D props & enemies
}
```

### Recipe B: 3×3 Sub-Tile Cluster Auto-Tiling in a Biome (`database/world/<world>/biomes.ts`)
```ts
// Inside a BiomeDefinition (e.g., world/belldor/biomes.ts):
clusterTileSheetBase64: 'bog_tileset', // 'bog_tileset' or 'ruins_tileset'
defaultClusterTerrain: 'grass',        // 'dirt' | 'grass' | 'aether' | 'ruins' | 'mire'
```

### Recipe C: Animated & Directional Grid Spritesheet on an Enemy
```ts
sprite: {
  base64: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHe...',
  cellWidth: 24,
  cellHeight: 24,
  col: 0,
  row: 0,
  frameCount: 4,
  fps: 8,
  stateRowMap: { idle: 0, patrol: 1, windup: 2, attack: 3, stagger: 4 },
  dirRowMap: { S: 0, W: 1, E: 2, N: 3 },
  anchor: 'bottom-center',
}
```

---

## 5. 2.5D Post-Processing & Visual Effect Layers (`[ORION-ANCHOR: RENDER-POST-PROCESS]`)

The engine provides a **5-Pass Post-Processing Pipeline** (`src/cartridges/orion/systems/renderSystem.ts`) controlled declaratively from your Biome, Tile, Weapon, and Enemy definitions:
1. **Pass 1 — Planar Water / Corrosive Aether (`~`) Reflections**: Vertically-flipped, ripple-sheared planar reflections of north-bordering pillars (`P`), walls (`#`), Poe Lanterns (`L`), the Player, and Enemies clipped inside `~` liquid tiles.
2. **Pass 2 — Automatic 1px Pixel-Art Outlines & Elevation Shadows**: Set `outlineColor: '#090d14'` on any `Base64SpriteConfig`.
3. **Pass 3 — Sweeping Blade Trails, Glow Projectiles & Hit Flashes**: Set `bladeTrailColor: '#38bdf8'` on any `WeaponDefinition`.
4. **Pass 4 — Biome Weather Layers (`rain`, `ash`, `aether_mist`)**: Configured via `biome.postProcess`.
5. **Pass 5 — Dynamic Light Sources & Radial Bloom (`drawDynamicLightingAndBloomPass`)**: Attach `lightSource: { color, radius, intensity, pulseSpeed, flicker }` to any `TileDefinition` or `EnemyWikiDefinition`.

---

## 6. Classless Build, Equipment & Feat Architecture (`v0.8` Canonical Spec — "Guide, Never Enforce")

> **Core Design Mandate ("Guide, Never Enforce"):**
> Project Orion has **no player-facing classes or class restrictions**. Archetype profiles exist strictly behind the scenes to guide item theming and offer optional **Starting Loadout Kits** at New Game. Any pilot can equip any weapon, coreplate, reactor, sensor, limb actuator, tactical utility (`Action 6`), or socket any of the **97 Canonical Feats** as long as they meet the **Pilot Skill Tier level (`I–V`), Gemstone sockets, and equipped Hardware/Weapon prerequisites** (`[ORION-ANCHOR: PROG-FEAT-SYNERGY]`).

### 6.1 The Nine Gemstones & Three-Layer Progression Chain (`[ORION-ANCHOR: PROG-SKILL-SCALING]`)
Progression is flat (`Static Budget Rule`): total base stats never inflate. **Gems** are a single unified build currency with three uses across the progression chain:

```
Frame Level (1–20 Milestones, No Gems)
  ──▶ Gem Use 1: 6 Combat Discipline Pilot Skills (Lv 1–20, Gems Permanently Consumed -> Unlocks Feat Tiers I–V)
  ──▶ Gem Use 2: 97 Feat Nodes (Tiers I–V, Discipline + Reactor Gems Socketed & Retained, 100% Refunded on Unsocket)
  ──▶ Gem Use 3: Weapon & Action Modifications (Gems Permanently Spent to Unlock Mod; Mod Retained)
```

1. **The Nine Canonical Gemstones (`database/items/gemstones.ts`)**:
   - **White — `moonstone`**: Mana Reactor Resonance (funds *Aegis Barrier & Vanguard* and *Harmonic Support & Triage*)
   - **Red — `spinel`**: *Assault Ballistics & Turbine* Discipline (Heat / Ichor)
   - **Orange — `carnelian`**: *Heavy Ordnance & Siege* Discipline (Heat / Ichor)
   - **Yellow — `titanite`**: *Aegis Barrier & Vanguard* Discipline (Presence / Mana)
   - **Green — `demantoid`**: *Harmonic Support & Triage* Discipline (Energy / Mana)
   - **Blue — `kyanite`**: *Beam & Wave Artillery* Discipline (Energy / Ether)
   - **Purple — `charoite`**: *Recon, Stealth & CQC* Discipline (Energy / Ether)
   - **Magenta — `rubellite`**: Ether Reactor Resonance (funds *Beam & Wave Artillery* and *Recon, Stealth & CQC*)
   - **Black — `hematite`**: Ichor Reactor Resonance (funds *Assault Ballistics & Turbine* and *Heavy Ordnance & Siege*)

2. **Six Optional Starting Loadout Kits (`database/characters/`)**:
   - **Bastion Striker Kit (`PNSY W416`)**: `BWI Bastion Coreplate`, `PNSY Alchemic Turbine Core Mk.IV`, `Crystal Dynamics G341 Murmillio` (Head), `BWI Twinstrike Gauntlets` (Arms), `BWI Gatecrasher Striders` (Legs), `N-55 Gladius`, `PNSY D-0g Repair Drone`.
   - **Fortress Siege Kit (`RAD HAU`)**: `Fire & Ice Fortress Coreplate`, `RAD Battleheart Ether Reactor Mk.V`, `BE Ironveil Command Dome` (Head), `Fire & Ice Line Holder` (Arms), `Fire & Ice Outrigger Striders` (Legs), `B-25 Brushcutter`, `RAD R463 Fathomless System`.
   - **Dawnforge Vanguard Kit (`Trinity DE-14`)**: `Dawnforge Guardian Coreplate`, `TI Manaheart Reactor Mk.IV`, `Aegis Halo Command Dome` (Head), `Solbright Cleaver Assemblies` (Arms), `Dawnforge Stabilizer Striders` (Legs), `LS-900 Swordspear`, `TI Lightwell Recovery System`.
   - **Phantom Recon Kit (`VX Phantom`)**: `Shadowcraft Recon Coreplate`, `VX Phantom Core Mk.III`, `VX Veilsight Command Helm` (Head), `Shadowcraft Silencer Gauntlets` (Arms), `Shadowcraft Ghost Striders` (Legs), `SV-12 Viper`, `VX Smoke Dispersal System`.
   - **Arclight Artillery Kit (`ARC Arclight`)**: `Arcanum Heavy Projector Coreplate`, `ARC Infinite Well Reactor Mk.VI`, `ARC Omniscient Command Dome` (Head), `Arcanum Channeler Assemblies` (Arms), `Arcanum Anchor Striders` (Legs), `WZ-800 Arclight Cannon`, `ARC Rift Anchor`.
   - **Sanctum Support Kit (`SANC Sanctum`)**: `Sanctum Support Coreplate`, `SANC Heartwell Reactor Mk.IV`, `SANC Providence Command Helm` (Head), `Sanctum Benediction Assemblies` (Arms), `Sanctum Steadfast Striders` (Legs), `CL-700 Sanctifier`, `SANC Radiant Ward Projector`.

3. **Canonical Equipment Catalog (`Project Orion — Equipment & Feats.md`)**:
   - **Weapons (`database/weapons/magitech_catalog.ts` + Heritage Set)**: 29 canonical Magitech weapons (Bolters, Polybolos, Ballistas, Gatling Guns, Grenade/Rocket/Missile Systems, Beam Projectors/Lances, Energy Carbines, Hybrid Rifles/Staves, Monomolecular/Thermal Blades, and Physical Shields) alongside the 12 heritage field weapons, all executing weapon-class-authentic melee/ranged combat payloads across Skills 1–5 (`[ORION-ANCHOR: COMBAT-ACTION-PAYLOAD]`).
   - **Chassis Hardware & Frame Components (`database/progression/canonical_feats_and_hardware.ts`)**: 6 Coreplates (`plating`), 6 Reactors (`reactorCore`), 6 Head Command Domes/Helms (`head`), 6 Sensory A (`sensoryA`), 6 Sensory B (`sensoryB`, including `SANC Blessing Resonance Grid`), 6 Arms Gauntlets/Assemblies (`arms`), 6 Legs Striders (`legs`), 6 Aux 3 Systems (`aux3`), 6 Aux 4 Systems (`aux4`), and Energy Storage (`Crystal Dynamics ERD Lodestone`, `VX Shadow Capacitor`). Equipping any Coreplate, Reactor, or Aux module dynamically drives live frame stats (`armor.type`, `armor.threshold`, `armor.rating`, `armor.maxDurability`, `shields.maxCapacity`, `reactor`, and `effectiveLoadCapacity`) via `resolveEquippedHardwareStats(state)`.
   - **Tactical Utilities (`database/equipment/utility_and_belt_modules.ts`)**: 6 classless `Action 6` utilities (`PNSY D-0g Repair Drone`, `RAD R463 Fathomless System`, `TI Lightwell Recovery System`, `VX Smoke Dispersal System`, `ARC Rift Anchor`, `SANC Radiant Ward Projector`).

4. **95 Verbatim Lore Feats (Tiers I–V) + `Knight's Oath` Reward Feat (`database/progression/canonical_feats_and_hardware.ts` → `[ORION-ANCHOR: PROG-FEAT-SYNERGY]`)**:
   - Restored verbatim from `# PROJECT ORION — EQUIPMENT & FEATS` Sections 7–12 across **Tiers I–V** (`Lv 2 → Tier I` [24 feats], `Lv 5 → Tier II` [23 feats], `Lv 9 → Tier III` [22 feats], `Lv 14 → Tier IV` [15 feats], `Lv 18 → Tier V` [11 feats]) plus the permanent **`Knight's Oath`** reward feat (`+10% damage vs Camelot enemies (permanent)`).
   - Validated in real time via `doesPilotMeetFeatEquipmentRequirement(state, feat)` against the pilot's equipped weapons and hardware slots, with live combat hooks for signature feats (`booster_evasion`, `shield_charge`, `beam_focus`, `backstab_mastery`, `sustained_channeling`, `assassinate`, `hardening_light`, and `knights_oath`).

5. **Canonical 6 Damage Types × 3 Defense Layers Math (`systems/combatSystem.ts` → `[ORION-ANCHOR: COMBAT-DEFENSE-MATH]`)**:
   - **Layer 1 — Shields**: `Pulse` deals `1.30x` shield drain and extends recharge delay (`4.0s` / `5.0s` overload); `Beam` deals `1.20x`; `Wave` (Mana) deals `1.15x` and bleeds `20%` directly past active shields; `Impact` deals `1.10x`; `Pierce` deals `0.85x`.
   - **Layer 2 — Armor (`Ablative`, `Reactive`, `Hardened`, `Layered`)**: `Blast` shreds `1.6x` armor durability and ignores `25%` of armor rating; `Pierce` bypasses `35%` of armor threshold and `30%` of armor rating; `Wave` bypasses `30%` of `Hardened` armor rating; `Layered` crystal/mana lattice resists `Beam`, `Pulse`, and `Wave` (`+15%` threshold, `+20%` rating); `Reactive` plating dampens `Impact` and `Blast` (`+20%` rating).
   - **Layer 3 — Frame Integrity**: Receives remaining damage after Shield and Armor mitigation; triggers Critical Frame State (`<= 40 HP`, `-30%` move speed & `15%` misfire risk) and Frame Defeat (`0 HP`).

---

### 6.2 `u00 Universe` Canonical `LOCKED` vs. `UNDEFINED` Zone Seal Conventions (`[ORION-ANCHOR: U00-ZONE-SEALS]`)
Only **M00 The Bog (`bog-v2.md`)** and **Camelot Border Town (`border-town-v1.md`)** currently have `LOCKED` zone specifications (`specStatus: 'LOCKED'`). All other zones (`m01_orc_encampment`, `camelot_interior`, and the other 19 worlds in `U00_UNIVERSE_CATALOG`) carry `specStatus: 'UNDEFINED'` and are sealed by the Æther Fog in standard campaign mode until their canonical design specifications are authored and promoted to `'LOCKED'`.

