# Project Orion — World, Content & Base64 Asset Authoring Guide

Welcome to the **Project Orion** authoring manual. The cartridge is built around **recursive module auto-discovery** (`import.meta.glob`) and a **five-tier nested spatial hierarchy** (`Biomes → Rooms → Maps → Areas → Regions`).

> **The Golden Rule of Orion Authoring:**
> Unless new content requires a brand-new engine mechanic, **you never edit engine files or `index.ts` registries**. Dropping a new `.ts` file into the appropriate `database/` subfolder automatically registers it on boot.

---

## 1. Where to Start & Database Hierarchy Overview

All game data lives inside `src/cartridges/orion/database/`, organized into two primary branches: the **World Hierarchy (`database/world/`)** and **Gameplay & Asset Domains**.

```
src/cartridges/orion/
├── database/                     # Strictly Self-Contained Content & Asset Entry Files
│   ├── world/                    # Spatial World -> Region -> Area -> Map (+ Rooms) Hierarchy
│   │   ├── index.ts              # Single Polymorphic Auto-Discovery World Registry
│   │   ├── universe.ts           # u00 Universe 20-World Catalog (8 Major, 7 Minor, 5 Unstable)
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
│   ├── enemies/                  # Self-contained Enemy, Boss & NPC modules (recursive glob)
│   ├── weapons/                  # Self-contained 5-Action Weapon modules (recursive glob)
│   ├── items/                    # Consumables, Keys & Relics (recursive glob)
│   ├── equipment/                # Hardware & Reactor assignable [L]/[R] skills (recursive glob)
│   ├── characters/               # Self-contained Mech Frame / Trait Line modules (recursive glob)
│   └── progression/              # Declarative 1–20 Level Unlock Sequence & Combat Laws
│
├── systems/                      # 5 Cohesive Engine Systems
│   ├── renderSystem.ts           # Sub-tile baker, 3x3 cluster auto-tiler, 2.5D renderer & post-processing
│   ├── worldSystem.ts            # 5-tier world composer, room transitions, waygates & setpiece raids
│   ├── playerSystem.ts           # State store, save/load, 2.5D physics, player controller & state gates
│   ├── combatSystem.ts           # Three Defense Layers math, targeting, weapon swap & L/R actions
│   └── entitySystem.ts           # Enemy spawning/AI, projectiles, pickups & 2.5D particles
│
└── ui/                           # React HUD, Satchel & Menu overlays
```

### Recommended Order for Building New World Content
1. **Biome (`world/<world>/biomes.ts`)**: Define the atmosphere, environmental rules (corrosive water, mud slow, desync flicker), and colors or Base64 tilemap atlas.
2. **Tiles (`world/tiles/`)**: *(Optional)* Add any new interactive props or custom walls needed by your rooms.
3. **Region (`world/<world>/<regionId>/region.ts`)**: Group your areas and optionally attach a **Colossal Waygate (`Q`)** for inter-world / inter-region fast travel.
4. **Area (`world/<world>/<regionId>/<areaId>/area.ts`)**: Group your maps and attach an **Æther Waystation (`A`)** for intra-region fast travel.
5. **Map + Co-Located Rooms (`world/<world>/<regionId>/<areaId>/map_<name>.ts`)**: Paint `10 × 9` ASCII room grids (`COLS = 10`, `ROWS = 9`) and export the `MapDefinition` alongside its `RoomDefinition` entries in the same file.

### Aether Fog 5-Node Topology (`key`, `general`, `side`, `loop`, `end`)
No outer room in Orion has a literal solid map border. Instead, `systems/worldSystem.ts` routes cardinal doorways through a dynamic 5-node Aether Fog graph that persists until the player rests at a Waystation (`D` / `A`):
- **`key` Nodes**: Authored Points of Interest (Drop-Pod, Towns, Boss Sanctums, Waystations, Waygates).
- **`general` Nodes**: Dynamically generated corridor chunks that advance route progress (`1/N .. N/N`) between connected `key` nodes. The true doorway (`trueExitDir`) emits subtle drifting Aether motes and Poe Lantern resonance.
- **`side` Nodes**: Off-path branches extending from `general` or `key` nodes; they do **not** advance route progress and lead either to an `end` node or a `loop` node.
- **`end` Nodes**: Terminal single-exit pockets featuring rolled rewards (`loot_cache`, `mini_boss`, `secret_switch`, or `dead_end`).
- **`loop` Nodes**: Borderless mist rooms where false exits silently cycle between `loop` chunks until the player follows the subtle threshold tell or Poe Lantern wisp through `trueExitDir`.

---

## 2. Authoring the 5-Tier World Hierarchy

### Tier 1A: Biomes (`database/world/<world>/biomes.ts` or `database/world/global/templates.ts`)
Biomes supply **tile character mappings (`tileTypes`)**, **environmental hazard rules (`tileRules`)**, **procedural color palettes (`tileAssets`)**, and optional **Base64 grid tilemaps (`tileSheetBase64` + `tileSheetCoords`)** to rooms.

- **Inheritance Chain**: A Room uses its own `biomeId` first; if omitted, it inherits from `Map.biomeId → Area.biomeId → Region.defaultBiomeId`.
- **Where to create**:
  - Reusable procedural biome: `database/world/global/templates.ts`
  - World-specific biome: `database/world/<world>/biomes.ts`

```ts
// Example: inside src/cartridges/orion/database/world/belldor/biomes.ts
import { BiomeDefinition } from '../../../types';

export const sunkenCatacombsBiome: BiomeDefinition = {
  id: 'sunken_catacombs',
  name: 'Sunken Grail Catacombs',
  scope: 'local',
  world: 'Belldor (Camelot)',
  description: 'Flooded crypts beneath Camelot with corrosive ichor pools and rapid desync.',
  tileTypes: {
    '.': 'floor',
    '#': 'pylon_wall',
    P: 'pylon_pillar',
    '~': 'mud',
    _: 'chasm',
    D: 'drop_pod',
    S: 'fallen_scout',
    C: 'cache',
    G: 'rusted_gate',
    '%': 'desync_wall',
    L: 'poe_lantern',
    '1': 'hidden_switch',
    '2': 'hidden_switch',
    '3': 'hidden_switch',
    M: 'cathedral_door',
    A: 'aether_waystation',
    Q: 'colossal_waygate',
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
  palette: {
    ground: '#1e293b',
    mud: '#0f172a',
    water: '#132a38',
    pylonTop: '#475569',
    pylonFront: '#1e293b',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
  lightColor: '#38bdf8',
};
```

---

### Tier 1B: Tiles & 2.5D Props (`database/world/tiles/`)
Every character in a Room's `10 × 9` ASCII grid resolves to a `TileDefinition` (or an Enemy spawn character).

#### Canonical ASCII Grid Legend (4×5 Cluster Terrains, Walls & Doodads)
| Char | Tile / Entity | Behavior |
| :--- | :--- | :--- |
| `.` | `floor` (**Dirt** — Col 1) | Walkable dirt ground; auto-tiles Row 1 general variants & Rows 2–4 transitions |
| `,` | `grass` (**Grass** — Col 2) | Walkable grass ground; auto-tiles Row 1 general variants & Rows 2–4 transitions |
| `~` | `mud` (**Aether Corrosive** — Col 3) | Corrosive liquid/mud hazard (`mudSlowMultiplier` + Armor corrosion); auto-tiles Row 1 & Rows 2–4 |
| `:` | `ruins_floor` (**Ruins** — Col 4) | Walkable ancient flagstones; auto-tiles Row 1 general variants & Rows 2–4 transitions |
| `#` | `pylon_wall` (Row 5 Solid/Single Wall) | Connected `#` slices Row 5 top row (`[left, center, right]`); isolated `#` slices Row 5 bottom left/right single wall |
| `P` | `pylon_pillar` (Row 5 Single Wall) | 2.5D depth-sorted interior single wall (`solid: true`); slices Row 5 bottom left/right single wall |
| `_` | `chasm` | Open pit/sinkhole (must Jump `[A]` or Booster Dash `[B]` across) |
| `%` | `desync_wall` | Temporal wall that phases between solid and passable every `desyncPeriodSec` |
| `D` | `drop_pod` | Drop-Pod Spawn Anchor & initial Bog Waystation |
| `A` | `aether_waystation` | **Æther Waystation** (attunes Area fast-travel & repairs armor on `[A]`) |
| `Q` | `colossal_waygate` | **Colossal Waygate** (attunes Region/World signature fast-travel on `[A]`) |
| `C` | `cache` | Lootable Supply Cache (rewards defined in `room.cache`) |
| `G` | `rusted_gate` | Locked perimeter gate |
| `M` | `cathedral_door` | Three-Way Cathedral Dungeon Door |
| `L` | `poe_lantern` | Decoupled Layer 2 Poe Lantern doodad (inherits neighbor terrain on Layer 0) |
| `1`,`2`,`3` | `hidden_switch` | Secret switches for unlocking the Cathedral Door via Exploration |

```ts
// Example: src/cartridges/orion/database/world/tiles/braziers.ts
import { TileDefinition } from '../../../types';

export const aetherBrazierTile: TileDefinition = {
  id: 'aether_brazier',
  char: 'F', // Use 'F' in any Room grid!
  name: 'Ætheric Brazier',
  type: 'lantern',
  solid: true,
  blocksHeight: 1,
  // Optional: embed a Base64 PNG prop sprite directly (see Section 4)
  // propSprite: { base64: 'iVBORw0KGgo...', anchor: 'bottom-center' },
  renderProp25D(g, _tx, _ty, sx, sy, state) {
    g.fillStyle = '#334155';
    g.fillRect(sx - 3, sy - 10, 6, 10);
    const flicker = Math.sin(state.t * 10) * 1.5;
    g.fillStyle = '#38bdf8';
    g.beginPath();
    g.arc(sx, sy - 12, 4 + flicker * 0.3, 0, Math.PI * 2);
    g.fill();
  },
};
```

---

### Tiers 2 & 3: Maps & Co-Located Rooms (`database/world/<world>/<regionId>/<areaId>/map_<name>.ts`)
Rooms are `10` columns wide by `9` rows tall (`16×16` pixels per tile = `160×144` logical canvas) and are co-located directly inside their parent Map file.

#### On-Foot Doorway Alignment Rule
So the player can walk continuously from room to room on foot, carve `..` openings on shared edges:
- **North Edge (`ry - 1`)**: Row `0`, columns `4` and `5` (`####..####`)
- **South Edge (`ry + 1`)**: Row `8`, columns `4` and `5` (`####..####`)
- **West Edge (`rx - 1`)**: Column `0`, rows `5` and `6`
- **East Edge (`rx + 1`)**: Column `9`, rows `5` and `6`

*(Note: For **Global Rooms** in `world/global/templates.ts`, `worldSystem.ts` automatically seals or opens the 4 doorway edges based on whether a neighboring room exists at that coordinate!)*

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

### Tier 4: Areas & Æther Waystations (`database/world/<world>/<regionId>/<areaId>/area.ts`)
Areas assemble `localMapIds` and `globalMapIds`, and can declare a lore-accurate **Æther Waystation (`waystation`)** for intra-region fast travel.
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

### Tier 5: Regions & Colossal Waygates (`database/world/<world>/<regionId>/region.ts`)
Regions are top-level territories or Shattered Worlds assembled from `localAreaIds` and `globalAreaIds`. Major Regions can define a **Colossal Waygate (`waygate`)** paired with a `'Q'` tile in the sanctum room grid.

---

## 3. Authoring Gameplay Entities (Enemies, Weapons, Items, Equipment)

### Adding an Enemy (`database/enemies/<enemy_name>.ts`)
Every enemy file encapsulates its own **spawn token (`spawnChar`)**, **Three Defense Layers (`shields`, `armor`, `frameIntegrity`)**, **telegraph (`tellDurationSec`, `tellRadius`)**, **loot table**, **AI (`update`)**, and **visuals (`sprite` or `render25D`)**.
- Once you set `spawnChar: 'Z'`, placing `'Z'` anywhere in a Room's `grid` spawns that enemy automatically!

```ts
// Example: src/cartridges/orion/database/enemies/tyrranus_centurion.ts
import { EnemyWikiDefinition } from '../../types';

export const tyrranusCenturionEnemy: EnemyWikiDefinition = {
  type: 'tyrranus_centurion',
  name: 'Tyrranus Bronze Centurion',
  spawnChar: 'V', // Place 'V' in any Room grid to spawn!
  faction: 'hostile',
  tellRadius: 26,
  emissiveColor: '#fbbf24',
  description: 'Heavy Greco-Roman automaton armed with a shock-pilum.',
  lore: 'Guards the marble colonnades of the Tyrranus Waygate frontier.',
  shields: { type: 'physical', capacity: 40 },
  armor: { type: 'Heavy Plate', threshold: 10, rating: 45, durability: 60 },
  frameIntegrity: 95,
  speed: 28,
  damage: 18,
  damageType: 'Piercing',
  tellDurationSec: 0.65,
  attackCooldownSec: 1.6,
  lootTable: [
    { itemId: 'salvage_scrap', dropChance: 1.0, minCount: 15, maxCount: 25 },
    { itemId: 'repair_kit', dropChance: 0.35, minCount: 1, maxCount: 1 },
  ],
  // Optional: embed a Base64 PNG or animated spritesheet (see Section 4)
  // sprite: { base64: '...', cellWidth: 16, cellHeight: 20, frameCount: 4, fps: 6 },
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

### Adding a Weapon (`database/weapons/<weapon_name>.ts`)
Every weapon defines a 5-action moveset (`slot: 0` = primary chain, `slot: 1..4` = active skills assignable to `[L]` and `[R]`) and an optional `hardpointSprite` or `renderHardpoint25D`.

### Adding an Item (`database/items/<item_name>.ts`)
Create a file exporting an `ItemWikiDefinition` (`id`, `name`, `category`, `iconColor`, optional `iconSprite`, and optional `onUse(state, ctx)` callback). Reference its `id` in any Room `cache` or Enemy `lootTable`.

---

## 4. Embedding Drafted PNG Assets Directly in Entry Files

All visual assets in Project Orion are embedded directly inside their respective entry files (`database/world/tiles/`, `database/world/<world>/biomes.ts`, `database/enemies/`, `database/items/`, `database/weapons/`) — there is no separate `assets/` directory.
- Images and sub-tile clusters are decoded and baked once into an in-memory `Map<string, HTMLImageElement | HTMLCanvasElement>` cache (`systems/renderSystem.ts`) and drawn with `imageSmoothingEnabled = false` so pixel art stays razor-sharp.
- You can pass either a full `data:image/png;base64,...` URI or a raw Base64 payload directly inside the entry file.
- If `sprite` / `layer0Sprite` / `baseTileBase64` / `tileSheetBase64` is omitted, the renderer automatically falls back to procedural Canvas 2D drawing.

### Quick Command to Convert a Drafted PNG to Base64
You can turn any `.png` into a single-line Base64 string in your terminal:
```bash
# Linux / macOS:
echo "data:image/png;base64,$(base64 -w 0 my_sprite.png)"
```

---

### Recipe A: Individual Base64 PNG Embedded in a Tile, Prop, Enemy, Weapon, or Item Entry File
Paste the Base64 string directly inside the entity's `.ts` entry file:

```ts
// Inside any EnemyWikiDefinition, TileDefinition, WeaponDefinition, or ItemWikiDefinition:
sprite: {
  base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9h...',
  renderWidth: 16,       // Optional override (defaults to PNG width)
  renderHeight: 20,      // Optional override (defaults to PNG height)
  offsetX: 0,            // Fine-tune horizontal pixel pivot
  offsetY: 2,            // Fine-tune vertical 2.5D foot alignment
  scale: 1,              // Uniform scale multiplier
  anchor: 'bottom-center', // 'top-left' for floor tiles, 'bottom-center' for 2.5D props & enemies
}
```

---

### Recipe B: Biome Tilemap Sheet Embedded in a Biome Entry File (`database/world/<world>/biomes.ts`)
To skin a biome with a custom grid sheet, embed the Base64 string directly in the `BiomeDefinition` entry file:

```ts
// Inside a BiomeDefinition (e.g., world/belldor/biomes.ts):
tileSheetBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHL...',
tileSheetCellSize: 16,
tileSheetCoords: {
  '.': { col: 0, row: 0 },                        // Static floor tile at (col 0, row 0)
  '~': { col: 0, row: 1, frameCount: 4, fps: 5 }, // 4-frame animated bog water strip on row 1!
  'pylon_wall:layer1': { col: 2, row: 0 },        // Layer 1 wall tile at (col 2, row 0)
},
```

---

### Recipe C: Animated & Directional Grid Spritesheet on an Enemy
If your enemy PNG is a grid spritesheet (e.g., columns = animation frames, rows = states or facing directions), configure `cellWidth`, `cellHeight`, `frameCount`, `fps`, `stateRowMap`, or `dirRowMap`:

```ts
// Inside an EnemyWikiDefinition:
sprite: {
  base64: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHe...', // Or registered atlas ID
  cellWidth: 24,
  cellHeight: 24,
  col: 0,
  row: 0,
  frameCount: 4, // Cycles columns 0, 1, 2, 3 automatically
  fps: 8,
  // Map enemy AI state to spritesheet row:
  stateRowMap: {
    idle: 0,
    patrol: 1,
    windup: 2,
    attack: 3,
    stagger: 4,
  },
  // Or map 8-way facing direction ('N','NE','E','SE','S','SW','W','NW') to spritesheet row:
  dirRowMap: {
    S: 0,
    W: 1,
    E: 2,
    N: 3,
  },
  anchor: 'bottom-center',
}
```

---

### Recipe D: Sub-Tile Micro-Composer & Separated `3×3` Biome Cluster Atlases (`systems/renderSystem.ts`)
Rather than hardcoding 180 individual `16×16px` PNG tiles (`>60 KB` of Base64 strings), Project Orion uses an offscreen **Sub-Tile Micro-Composer** (`systems/renderSystem.ts`) that takes the 4 `16×16px` base tiles embedded directly in `floor.ts` (`dirt01`), `grass.ts` (`grass01`), `mud.ts` (`aether01`), and `ruins_floor.ts` (`ruins01`) and bakes all 20 separated `3×3` biome clusters (`48×48px` each) plus the combined `192×240px` `ruins_tileset` sheet onto offscreen canvases once at startup.

- **Two Sub-Tile Granularities**:
  1. **`4×4` Micro-Block Mode (`16` blocks of `4×4px` per `16×16px` tile)**:
     - Used for organic terrains (`dirt` `.`, `grass` `,`, `aether` `~`).
     - Each `16×16px` general tile permutes, rotates, and flips 4 `4×4px` micro-block templates across a `4×4` sub-grid so ground textures never visibly repeat.
     - For `from(to)` transition clusters (`Rows 2–4`), border `4×4px` micro-blocks along the 8 neighbor edges/corners automatically substitute in the `to` terrain's micro-blocks with a 1px dark lip contour.
  2. **`2×2` Quadrant Mode (`4` quadrants of `8×8px` per `16×16px` tile)**:
     - Used for architectural masonry (`ruins` `:`), connected solid walls (`#`), and standalone single walls (`P`).
     - Assembles top-left, top-right, bottom-left, and bottom-right `8×8px` quadrants with bevel highlights and mortar joints.

- **20 Separated `3×3` Cluster Atlases (`48×48px` each) + Master `4×5` Sheet (`192×240px`)**:
  - **Row 1 (General `3×3` Clusters)**: `dirt_general`, `grass_general`, `aether_general`, `ruins_general`
  - **Row 2 (Transitions to Dirt/Grass)**: `dirt_to_grass`, `grass_to_dirt`, `aether_to_dirt`, `ruins_to_dirt`
  - **Row 3 (Transitions to Aether/Grass)**: `dirt_to_aether`, `grass_to_aether`, `aether_to_grass`, `ruins_to_grass`
  - **Row 4 (Transitions to Ruins/Aether)**: `dirt_to_ruins`, `grass_to_ruins`, `aether_to_ruins`, `ruins_to_aether`
  - **Row 5 (Walls & Associated Floors)**: `dirt_walls`, `grass_walls`, `aether_walls`, `ruins_walls` (`localRow 0` = connected solid `#` wall `[left, center, right]`; `localRow 1` = associated floor; `localRow 2` left/right = single `#`/`P` walls, center = floor)

To enable automatic 8-neighbor cluster auto-tiling on any Biome:
```ts
// Inside any BiomeDefinition:
clusterTileSheetBase64: 'ruins_tileset', // Uses the offscreen-baked 20-cluster cache (or custom PNG)
defaultClusterTerrain: 'ruins',          // 'dirt' | 'grass' | 'aether' | 'ruins'
```

To customize or swap any of the 4 base `16×16px` tiles, edit `baseTileBase64` (`dirt01`, `grass01`, `aether01`, or `ruins01`) directly inside its respective tile entry file (`database/world/tiles/floor.ts`, `grass.ts`, `mud.ts`, or `ruins_floor.ts`):
```ts
// Example: src/cartridges/orion/database/world/tiles/floor.ts
export const dirt01 = 'data:image/png;base64,...';

export const groundTile: TileDefinition = {
  id: 'floor',
  char: '.',
  name: 'Solid Island Soil',
  type: 'floor',
  solid: false,
  blocksHeight: 0,
  clusterTerrain: 'dirt', // 'dirt' | 'grass' | 'aether' | 'ruins'
  subTileMode: '4x4',     // '4x4' (16 4x4px groups) or '2x2' (4 8x8px quadrants)
  baseTileBase64: dirt01, // Auto-collected on boot & baked into all 20 3x3 clusters!
};
```

---

## 5. 2.5D Post-Processing & Visual Effect Layers (`systems/renderSystem.ts`)

Instead of hardcoding hundreds of pixel effect frames for lighting, weapon trails, projectiles, outlines, reflections, and weather, the engine provides a **5-Pass Post-Processing Pipeline** (`src/cartridges/orion/systems/renderSystem.ts`) controlled declaratively from your Biome, Tile, Weapon, and Enemy definitions:

### Pass 1: Planar Water / Corrosive Aether (`~`) Reflections
Any biome with `liquidReflection: true` (enabled by default) automatically renders vertically-flipped, horizontal-ripple-sheared planar reflections of north-bordering pillars (`P`), walls (`#`), Poe Lanterns (`L`), the Player, and Enemies clipped strictly inside `~` liquid tiles.

### Pass 2: Automatic 1px Pixel-Art Outlines & Elevation Shadows
You can add a crisp 1px outer silhouette around any Base64 sprite (cached offscreen on first draw) or procedural 2.5D prop without hand-drawing outline pixels:
```ts
// On any Base64SpriteConfig (Tile, Prop, Item, or Enemy):
sprite: {
  base64: '...',
  outlineColor: '#090d14', // Automatically bakes a 4-neighbor 1px outline onto an offscreen canvas!
}
```

### Pass 3: Sweeping Blade Trails, Glow Projectiles & Hit Flashes
- **Melee Blade Swing Trails**: Melee weapons automatically emit a sweeping crescent ribbon (`state.bladeTrails`) with tapered alpha and additive edge bloom. Customize a weapon's trail color in its `WeaponWikiDefinition`:
  ```ts
  // Inside a WeaponWikiDefinition (e.g., database/weapons/khopesh.ts):
  bladeTrailColor: '#38bdf8',
  ```
- **Procedural Projectiles & Hit Flashes**: Projectiles (`state.bullets`) automatically render a motion-blurred velocity tail, additive outer halo, and bright core without requiring projectile sprites. Struck enemies flash with a crisp white-hot silhouette.

### Pass 4: Biome Weather Layers (`rain`, `ash`, `aether_mist`)
Biomes can enable procedural weather layers that animate across the viewport:
- `'rain'`: Slanted rain streaks + animated ground splash ripples (default in Bog/Wetland biomes).
- `'ash'`: Drifting ember cinders and rising soot motes (default in Orc Siege / Tyrranus biomes).
- `'aether_mist'`: Floating luminous violet/cyan spores and low-lying mist banks (default in Waygate/Ruins biomes).

Configure weather and lighting per biome via `postProcess`:
```ts
// Inside any BiomeDefinition:
postProcess: {
  ambientDarkness: 0.26,     // 0.0 (bright day) to 0.75 (deep cavern shadow)
  bloomIntensity: 0.6,       // Additive radial glow multiplier for lights & projectiles
  weather: 'rain',           // 'rain' | 'ash' | 'aether_mist' | 'none'
  weatherIntensity: 0.7,     // 0.0 to 1.0 particle density
  liquidReflection: true,    // Planar reflections on '~' tiles
  scanlines: false,          // Optional per-biome CRT scanline overlay
}
```

### Pass 5: Dynamic Light Sources & Radial Bloom
The lighting pass carves soft radial cutouts through the biome's ambient darkness veil and adds colored bloom halos around light-emitting tiles, props, entities, and projectiles. Attach a `lightSource` to any `TileDefinition` or `EnemyWikiDefinition`:
```ts
// Inside any TileDefinition (e.g., tiles/poe_lantern.ts) or EnemyWikiDefinition:
lightSource: {
  color: '#fbbf24',     // Hex or RGB glow color
  radius: 56,           // Radial illumination radius in pixels
  intensity: 0.85,      // 0.0 to 1.0 bloom strength
  pulseSpeed: 3.5,      // Optional sinusoidal breathing speed
  flicker: 0.12,        // Optional organic torch/lantern flicker amplitude
}
```

---

## 6. Three-Layer Build & Progression Architecture (`v0.7` Canonical Spec) & `u00` Zone Seals

### 6.1 The Nine-Gemstone & Three-Layer Progression Loop (`database/progression/index.ts`, `database/items/gemstones.ts`)
Progression is flat (`Static Budget Rule`): total base stats never inflate. **Gems** are a single unified build currency with three uses across the progression chain:

```
Frame Level (1–20 Tutorial, No Gems) ──▶ Pilot Skill Level (6 Trait Line Skills, Lv 1–20, Gems Permanently Consumed)
  ──▶ Feat Node (Tiers I–V, Trait + Reactor Gems Socketed & Retained in Build, Refunded on Unsocket)
  ──▶ Feat (Unlocks Equipment & Mods, No Gems)
  ──▶ Equipment Mod (1–2 Gems Permanently Spent to Generate; Mod Retained)
```

1. **The Nine Canonical Gemstones (`database/items/gemstones.ts`)**:
   - **White — `moonstone`**: Mana Reactor (`Guardian`, `Cleric`)
   - **Red — `spinel`**: `Warrior` (Heat / Ichor)
   - **Orange — `carnelian`**: `Marauder` (Heat / Ichor)
   - **Yellow — `titanite`**: `Guardian` (Presence / Mana)
   - **Green — `demantoid`**: `Cleric` (Energy / Mana)
   - **Blue — `kyanite`**: `Wizard` (Energy / Ether)
   - **Purple — `charoite`**: `Rogue` (Energy / Ether)
   - **Magenta — `rubellite`**: Ether Reactor (`Rogue`, `Wizard`)
   - **Black — `hematite`**: Ichor Reactor (`Warrior`, `Marauder`)
2. **Layer 1: Pilot (`§2`)**:
   - **Pilot Creation (`§2.4`)**: Created at New Game (`Trait Line Selection → Pilot Name → Deploy at Level 1 in M00 The Bog`) and persisted in the multi-pilot **Load Game Roster** (`orion_pilot_roster_v1`).
   - **Pilot Skill Leveling (`Gem Use 1`)**: 6 Trait Line Pilot Skills (`Warrior`, `Marauder`, `Guardian`, `Cleric`, `Wizard`, `Rogue`, Levels `1–20`). Spending a skill's assigned **Trait Gem** or **Reactor Gem** permanently consumes `1` Gem to raise that skill by `+1 Level`, unlocking **Feat Tiers I–V** (`Lv 2 → Tier I`, `Lv 5 → Tier II`, `Lv 9 → Tier III`, `Lv 14 → Tier IV`, `Lv 18 → Tier V`).
3. **Layer 2: Frame (`§3`)**:
   - **Canonical Frames by Trait Line (`§3.2`)**:
     - `Warrior`: `PNSY W416` (`Ichor`, `medium` load)
     - `Marauder`: `RAD HAU` (`Ichor`, `superheavy` load)
     - `Guardian`: `Trinity DE-14` (`Mana`, `heavy` load)
     - `Rogue`: `VX Phantom` (`Ether`, `light` load)
     - `Wizard`: `ARC Arclight` (`Ether`, `light` load)
     - `Cleric`: `SANC Sanctum` (`Mana`, `medium` load)
   - **Feat Node Gem Sockets (`§3.3` · `Gem Use 2`)**:
     - Installing a Feat Node requires specific **Trait Gem + Reactor Gem** sockets (`feat.gemSockets`). Socketed gems are removed from inventory and **retained in the build** (`state.socketedFeatGems`), and are **100% refunded to inventory** whenever the node is unsocketed.
     - **System Feats**: Step up the frame's effective Load Capacity (`light → medium → heavy → superheavy`) to eliminate heavy weapon penalties (`§3.4`).
     - **Interface Feats**: Zero-sum stat trade-offs within the static budget (e.g., `+20% Damage / +18% Heat Generation`).
   - **Critical Frame State (`§3.5`)**: At `≤ 40 HP`, movement speed drops by `-30%` and weapon attacks suffer a `15%` misfire chance per shot until repaired.
4. **Layer 3: Equipment (`§4`)**:
   - **13-Slot Equipment & 5-Piece Armor Taxonomy**: Weapon Set 1 (`2`), Weapon Set 2 (`2`), Class Utility (`1`, `Action 6` unlocked at `Lv 6`), Aux (`4`, `Actions 7–10`), Belt (`4`, `Actions 7–10`), plus `Head`, `Torso`, `Arms`, `Legs`, and `Generator`.
   - **Gem-Generated Equipment Mods (`§4.2` · `Gem Use 3`)**: Spending `1–2` Gems permanently generates an Action Modification (`state.equipment.unlockedMods`). The generated mod is permanently retained by the pilot and can be freely installed or swapped across `ranged`, `melee`, and `mobility` slots; the spent gems are not retained.

### 6.2 `u00 Universe` Canonical `LOCKED` vs. `UNDEFINED` Zone Seal Conventions (`database/world/universe.ts`)
Only **M00 The Bog (`bog-v2.md`)** and **Camelot Border Town (`border-town-v1.md`)** have `LOCKED` zone specifications. All other zones (`m01_orc_encampment`, `camelot_interior`, and the other 19 worlds in `U00_UNIVERSE_CATALOG`) carry `worldStatus: 'undefined_spec'` and are sealed in standard campaign mode until their canonical design specifications are authored.
