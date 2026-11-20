# Project Orion — World, Content & Base64 Asset Authoring Guide

Welcome to the **Project Orion** authoring manual. The cartridge is built around **recursive module auto-discovery** (`import.meta.glob`), a **five-tier nested spatial hierarchy** (`Biomes → Rooms → Maps → Areas → Regions`), a **globally classless, hardware-driven build architecture (`v0.8`)**, and a **unified classical-mechanics Inertia & Stability physics engine (`inertia-v0.md`)**.

> **The Golden Rule of Orion Authoring:**
> Unless new content requires a brand-new engine mechanic or a new route entry in `KEY_NODE_ROUTES`, **you never edit engine files or `index.ts` registries**. Dropping a new `.ts` file into the appropriate `database/` subfolder automatically registers it on boot.

---

## 0. Quick-Jump Code Anchor Map (`[ORION-ANCHOR: ID]`)

Every critical registry, world-composer boundary, and engine hook in the codebase is tagged with a standardized `// [ORION-ANCHOR: <ID>]` comment block. Search for any anchor ID below to jump directly to the exact block of code to inspect or edit:

| Anchor Tag | File Path | Purpose & When to Edit |
| :--- | :--- | :--- |
| `[ORION-ANCHOR: TYPES-WORLD-HIERARCHY]` | `src/cartridges/orion/types/world.ts` | `EnemySpawnOverride`, `EnemySpawnMap`, `BiomeDefinition` (`tileTypes`, `enemySpawnTypes`, `tileRules`, `tileAssets`), `TileDefinition`, `RoomDefinition`, `MapDefinition`, `AreaWikiDefinition`, and `RegionDefinition` schemas. |
| `[ORION-ANCHOR: U00-UNIVERSE-CATALOG]` | `src/cartridges/orion/database/world/universe.ts` | The 20-World `u00` Universe catalog (`8 Major`, `7 Minor`, `5 Unstable`) and `specStatus: 'LOCKED' \| 'UNDEFINED'` world status flags. |
| `[ORION-ANCHOR: WORLD-GLOB-REGISTRY]` | `src/cartridges/orion/database/world/index.ts` | Single polymorphic `import.meta.glob` scanner that auto-registers Regions, Areas, Maps, Rooms, Biomes, Tiles, Waystations, and Waygates. |
| `[ORION-ANCHOR: ASCII-CHAR-REGISTRY]` | `src/cartridges/orion/database/world/index.ts` | Centralized ASCII character resolver (`getTileDefinition`, 5-tier `resolveRoomEnemyTypeAtChar`) and `getMasterAsciiCharacterRegistry()` collision audit. |
| `[ORION-ANCHOR: ENEMY-GLOB-REGISTRY]` | `src/cartridges/orion/database/enemies/index.ts` | Recursive auto-discovery for all Enemy, Boss, and NPC modules (`ENEMY_REGISTRY`, `CHAR_TO_ENEMY_TYPE`, `ENEMY_SPAWN_COLLISIONS`). |
| `[ORION-ANCHOR: ENEMY-SPAWN-RESOLVER]` | `src/cartridges/orion/database/enemies/index.ts` | `resolveEnemySpawnOverride`, `resolveEnemyTypeForChar(char, biomeEnemyMap, occurrenceIndex)`, and `getEnemyBySpawnChar` supporting string or ordered array overrides. |
| `[ORION-ANCHOR: WORLD-KEY-ROUTES]` | `src/cartridges/orion/systems/world/roomLoader.ts` | Declarative `KEY_NODE_ROUTES` graph connecting authored `key` rooms (`"rx,ry"`) across cardinal directions with `routeTotal` general nodes. |
| `[ORION-ANCHOR: U00-ZONE-SEALS]` | `src/cartridges/orion/systems/world/worldTransitions.ts` | `getUndefinedZoneSealReason` enforcing `specStatus: 'UNDEFINED'` Æther Fog seals until a zone's canonical spec is unlocked. |
| `[ORION-ANCHOR: WORLD-COMPOSER-INIT]` | `src/cartridges/orion/systems/world/roomLoader.ts` | `assembleNestedWorld()` 5-tier world composer (`Region → Area → Map → Room`) and automatic cardinal doorway carver. |
| `[ORION-ANCHOR: AETHER-FOG-TOPOLOGY]` | `src/cartridges/orion/systems/world/worldTransitions.ts` | 5-node Æther Fog graph engine (`key`, `general`, `side`, `loop`, `end`) and `maxDepth = clvl + 1` loop scaling. |
| `[ORION-ANCHOR: ROOM-TRANSITION-GATE]` | `src/cartridges/orion/systems/world/worldTransitions.ts` | `transitionViaAetherDoor()` handling room-to-room doorway alignment, area banners, and dynamic enemy/feature spawning. |
| `[ORION-ANCHOR: WAYSTATION-WAYGATE-TRAVEL]` | `src/cartridges/orion/systems/world/worldTransitions.ts` | `fastTravelToWaystation()` and Colossal Waygate inter-region / inter-world teleportation & armor repair. |
| `[ORION-ANCHOR: CONTEXTUAL-LOOT-TABLES]` | `src/cartridges/orion/systems/world/worldPersistence.ts` | `ENEMY_EQUIPMENT_DROP_POOLS` and `resolveContextualEquipmentDrop()` hierarchical loot table resolution (`Enemy → Room → Area → Region`). |
| `[ORION-ANCHOR: ENTITY-SPAWN-ROOM]` | `src/cartridges/orion/systems/entitySystem.ts` | `spawnRoomEnemies()` parsing `10 × 9` room ASCII grids using 5-tier `resolveRoomEnemyTypeAtChar(char, context, occurrenceIndex)`. |
| `[ORION-ANCHOR: RENDER-CLUSTER-BAKE]` | `src/cartridges/orion/systems/render/worldRenderer.ts` | `bakeBiomeClusterTileset()` offscreen sub-tile micro-composer baking 20 separated `3×3` biome clusters (`ruins_tileset` & `bog_tileset`). |
| `[ORION-ANCHOR: RENDER-VISION-LIGHTING]` | `src/cartridges/orion/systems/render/effectsRenderer.ts` | `resolveRoomLightingProfile()` dynamic vision radius (`baseLight` tiles), raycast wall/tree shadow occlusion, and static campfire/lantern light anchors. |
| `[ORION-ANCHOR: RENDER-POST-PROCESS]` | `src/cartridges/orion/systems/render/effectsRenderer.ts` | `drawDynamicLightingAndBloomPass()` 5-pass 2.5D lighting, water reflection, 1px outline, blade trail, and weather pipeline. |
| `[ORION-ANCHOR: PROG-LEVEL-SEQUENCE]` | `src/cartridges/orion/database/progression/index.ts` | `LEVEL_UNLOCK_SEQUENCE` (`Levels 1–20`) onboarding & expression milestones. |
| `[ORION-ANCHOR: PROG-SKILL-SCALING]` | `src/cartridges/orion/database/progression/index.ts` | `PILOT_SKILL_DEFINITIONS` (`6 Combat Discipline Skills`, `Lv 1–20`, funded by Discipline + Reactor Gemstones). |
| `[ORION-ANCHOR: PROG-FEAT-SYNERGY]` | `src/cartridges/orion/database/progression/index.ts` | `doesPilotMeetFeatEquipmentRequirement()` classless hardware & weapon-family prerequisite verifier for all 118 Feats (including 22 Specialist Feats & Stances). |
| `[ORION-ANCHOR: PROG-SPECIALIST-STANCES]` | `src/cartridges/orion/database/progression/specialistStances.ts` | `SPECIALIST_FEAT_DEFINITIONS`, `evaluateActiveSpecialistStance()`, and `buildActionDefinitionFromStanceOverride()` for all 22 Specialist Feats & Stances. |
| `[ORION-ANCHOR: COMBAT-ACTION-PAYLOAD]` | `src/cartridges/orion/systems/combat/skillExecution.ts` | `executeActionPayload()` resolving multi-source `[L]`/`[R]` actions, weapon skills, adaptive damage types, and support pulses. |
| `[ORION-ANCHOR: COMBAT-DEFENSE-MATH]` | `src/cartridges/orion/systems/combat/damageSystem.ts` | `applyDamageToLayers()` Three Defense Layers resolution (`Layer 1 Shields → Layer 2 Armor → Layer 3 200 Frame HP`). |
| `[ORION-ANCHOR: INERTIA-PHYSICS-ENGINE]` | `src/cartridges/orion/systems/inertiaSystem.ts` | `resolveHitInertiaReaction()` & `applyRangedRecoilImpulse()` implementing `Δv = J / m_eff`, Stability `S` deadband/recovery, directional charge `μ`, and recoil restriction. |

---

## 1. Where to Start & Codebase Hierarchy Overview

All game data lives inside `src/cartridges/orion/database/`, domain types live in `src/cartridges/orion/types/`, and runtime systems and UI are cleanly modularized by responsibility:

```
src/cartridges/orion/
├── docs/                         # Consolidated Canonical Design & Authoring Docs
│   ├── INDEX.md                  # Narrative worldbuilding, Belldor stages & doc index
│   ├── CODE_RULES.md             # Engineering & AI authoring rules (commenting, modularity, memory/network safety)
│   ├── AUTHORING_GUIDE.md        # Technical architecture & content authoring manual
│   ├── EQUIPMENT_AND_FEATS.md    # 101 weapons (72 Custom + 29 Magitech across 8 Classes), hardware & 118 canonical feats (incl. 22 Specialist Stances)
│   └── INERTIA_SYSTEM.md         # Inertia v0.1 physics & stability specification
│
├── types/                        # Domain-Organized TypeScript Schemas
│   ├── common.ts                 # Shared primitives, Base64SpriteConfig & PostProcessConfig
│   ├── combat.ts                 # DamageType, Three Defense Layers, Projectiles & Inertia
│   ├── equipment.ts              # Weapons, Chassis Hardware, Gemstones, Skills & Feats
│   ├── entities.ts               # Enemies, NPCs, Pickups, Particles & Floating Texts
│   ├── world.ts                  # [ORION-ANCHOR: TYPES-WORLD-HIERARCHY] 5-Tier World & Aether Fog
│   ├── state.ts                  # OrionState & OrionSaveSlot
│   └── index.ts                  # Barrel export re-exported by ../types.ts
│
├── database/                     # Strictly Self-Contained Content & Asset Entry Files
│   ├── world/                    # Spatial World -> Region -> Area -> Map (+ Rooms) Hierarchy
│   │   ├── index.ts              # [ORION-ANCHOR: WORLD-GLOB-REGISTRY] & [ORION-ANCHOR: ASCII-CHAR-REGISTRY]
│   │   ├── universe.ts           # [ORION-ANCHOR: U00-UNIVERSE-CATALOG] 20-World Catalog (8 Major, 7 Minor, 5 Unstable)
│   │   ├── worldAudit.ts         # Startup world registry duplicate & cross-reference verifier (`WORLD_AUDIT_ISSUES`)
│   │   ├── global/               # Shared tile defaults & general biome tile folders
│   │   │   ├── templates.ts      # Canonical DEFAULT_BIOME_TILE_TYPES & DEFAULT_BIOME_ENEMY_SPAWN_TYPES
│   │   │   └── biomes/general/tiles/ # Shared tile & 2.5D prop definitions + embedded 16x16 base tiles & atlases
│   │   └── overworld/            # Self-Contained Authored Overworld Hierarchies (<world>/<region>/<area>/map_<sector>.ts)
│   │       ├── topology.ts       # Co-located Set-Path routes (KEY_NODE_ROUTES), Unified Bog placements & corridor chunk aggregator
│   │       ├── aether_drift/     # Inter-world Aether Sea Expanse & procedural Aether Fog zones (shattered_wilds, drift_corridor)
│   │       ├── belldor/          # 1. Belldor (Camelot) — Arthurian, canon (outskirts/{the_bog,orc_encampment}, camelot_heartland/{border_town,camelot_interior})
│   │       └── tyrranus/         # 2. Tyrranus (Greek/Roman, non-canon · frontier/marble_gatehead)
│   ├── enemies/                  # [ORION-ANCHOR: ENEMY-GLOB-REGISTRY] Self-contained Enemy, Boss & NPC modules
│   ├── items/                    # Consumables, 9 Gemstones, Currency & Quest Relics
│   ├── equipment/                # Slot-organized Weapons, Hardware, Frame Plating, Reactors & Utilities
│   ├── characters/               # 6 Classless Starting Loadout Kit profiles (Bastion, Fortress, Dawnforge, etc.)
│   └── progression/              # [ORION-ANCHOR: PROG-FEAT-SYNERGY] 118 Canonical Feats, 118-Node Constellation & Equipment Handling
│       ├── index.ts              # Canonical feats, gemstone economy, and progression helpers
│       ├── specialistStances.ts  # [ORION-ANCHOR: PROG-SPECIALIST-STANCES] 22 Specialist Feats & Stances (active stance resolver & skill overrides)
│       └── featHandling.ts       # 118-node 6-arm hexagonal constellation coordinates & hybrid equipment prerequisite/handling evaluator
│
├── systems/                      # Modular Domain Engine Systems
│   ├── combat/                   # Modular Combat Subsystem
│   │   ├── combatHelpers.ts      # Aiming, target resolution, cooldowns & stance helpers
│   │   ├── damageSystem.ts       # [ORION-ANCHOR: COMBAT-DEFENSE-MATH] 3 Defense Layers + Inertia hit reaction
│   │   ├── projectileSystem.ts   # Projectile spawning, description-matched shapes (`bolt < pulse < wave`, `beam`, `arc`), homing & ray/crescent hits
│   │   ├── skillBehaviors.ts     # Enacted tactical skill movement, displacement (hook/bypass/shove), thrown/returning & lobbed mechanics
│   │   └── skillExecution.ts     # [ORION-ANCHOR: COMBAT-ACTION-PAYLOAD] 5-action execution, 2H side-holstering & Back Launcher (`auxActive`) ownership
│   ├── render/                   # Modular Render Subsystem
│   │   ├── spriteAtlasCache.ts   # Base64 image decoding, 1px outline baking & directional transforms
│   │   ├── worldRenderer.ts      # [ORION-ANCHOR: RENDER-CLUSTER-BAKE] 3x3 cluster auto-tiler, reflections & shadows
│   │   ├── entityRenderer.ts     # Depth-sorted 2.5D entities, props, telegraphs & player mech rendering
│   │   └── effectsRenderer.ts    # [ORION-ANCHOR: RENDER-POST-PROCESS] Blade trails, description-matched projectile/beam/arc rendering, weather & lighting
│   ├── world/                    # Modular World Subsystem
│   │   ├── roomLoader.ts         # [ORION-ANCHOR: WORLD-COMPOSER-INIT] & [ORION-ANCHOR: WORLD-KEY-ROUTES]
│   │   ├── worldPersistence.ts   # Persistent caches, contextual loot pools & Cathedral Door evaluator
│   │   ├── worldTransitions.ts   # [ORION-ANCHOR: AETHER-FOG-TOPOLOGY] & [ORION-ANCHOR: WAYSTATION-WAYGATE-TRAVEL]
│   │   └── tutorialSystem.ts     # Desync walls, environmental hazards, raids, bosses & world interactions
│   ├── combatSystem.ts           # Combat orchestrator (`updateCombat`) & barrel re-export
│   ├── renderSystem.ts           # Render orchestrator (`drawOrionGame`) & barrel re-export
│   ├── renderHudAndFogTells.ts   # In-world Aether Fog wayfinding tells (`drawAetherFogWayfindingTells`) & legacy canvas HUD helper
│   ├── playerSpriteSystem.ts     # 3-pass anatomical Mech & Weapon layerer, class-tailored 2.5D N/S perspective projection & hip-holster/gauntlet overlays
│   ├── worldSystem.ts            # World barrel re-export
│   ├── playerSystem.ts           # State store, save/load, 2.5D physics, player controller & state gates
│   ├── graphicsSettingsStore.ts  # Persistent Graphics, HUD & Developer Mode settings store (`devModeEnabled`, `toggleOrionDevMode`, `formatOrionLoreLabel`)
│   ├── inertiaSystem.ts          # [ORION-ANCHOR: INERTIA-PHYSICS-ENGINE] Inertia v0.1 physics & stability engine
│   └── entitySystem.ts           # [ORION-ANCHOR: ENTITY-SPAWN-ROOM] Enemy spawning/AI, pickups & particles
│
└── ui/                           # React HUD, Satchel & Menu overlays (operable via Keyboard, Gamepad, Virtual Controls & Mouse/Touch via UniversalMenuNavigator)
    ├── OrionHud.tsx              # Retro-Modern React HUD orchestrator (`Full Tactical` & `Compact Retro`), `[F3 / `]` Dev Mode hotkey & Planet/Æther Map modals
    ├── OrionGameMenu.tsx         # [START] Pause Menu & Roster/Mini-Map/Options subviews
    ├── OrionSatchel.tsx          # Consolidated 5-tab Tactical Menu (STATUS, LOADOUT [Slots/Armory/Inventory], FEATS [118], MAP [Local Mini-Map], CODEX)
    ├── hud/                      # Modular HUD subcomponents (HudTitleModal, HudDefenseBars, HudSkillDeck)
    ├── satchel/                  # Modular Satchel subcomponents (LocalMiniMapCanvas, PlanetMapModalView, AetherCosmosCanvas, SatchelWorldTab, SatchelStatusTab, SatchelLoadoutTab, SatchelArmoryTab, SatchelFeatsTab, SatchelCodexTab)
    └── settings/                 # Unified Controls, Graphics & Audio settings panel (OrionSettingsPanel)
```

---

## 2. Authoring the 5-Tier World Hierarchy & Aether Fog Topology

### 2A. Uniform Overworld Directory Layout & Co-Located Topology (`overworld/topology.ts`)
All authored overworld content lives inside `src/cartridges/orion/database/world/overworld/` under a uniform four-level naming convention without redundant parent prefixes:
- `overworld/<world>/biomes.ts`: Canonical `BiomeDefinition` records for `<world>`, spreading `DEFAULT_BIOME_TILE_TYPES` and `DEFAULT_BIOME_ENEMY_SPAWN_TYPES` from `../../global/templates`.
- `overworld/<world>/<region>/region.ts`: Single `RegionDefinition` and optional regional `WaygateNode`.
- `overworld/<world>/<region>/<area>/area.ts`: Single `AreaWikiDefinition` and optional area `WaystationNode`.
- `overworld/<world>/<region>/<area>/map_<sector>.ts`: Single `MapDefinition` (plus optional `corridorChunks` for seamless chunked maps) followed by its co-located `RoomDefinition` exports (each carrying optional `routes` and `chunkPlacement` fields aggregated by `overworld/topology.ts` into `KEY_NODE_ROUTES`, `UNIFIED_BOG_ROOM_PLACEMENTS`, and `SET_PATH_CORRIDOR_CHUNKS`).

### 2B. Aether Fog 5-Node Topology & Depth Progression (`[ORION-ANCHOR: AETHER-FOG-TOPOLOGY]`)
No outer room in Orion has a literal solid map border. Instead, `systems/world/worldTransitions.ts` routes cardinal doorways (`N`, `S`, `E`, `W`) through a dynamic 5-node Æther Fog graph with real-time HUD depth gauge and in-world environmental tells:
- **`key` Nodes**: Authored Points of Interest (Drop-Pod, Towns, Boss Sanctums, Waystations, Waygates) registered via `RoomDefinition` files with co-located `routes` (aggregated into `KEY_NODE_ROUTES` by `overworld/topology.ts` and consumed at `[ORION-ANCHOR: WORLD-KEY-ROUTES]`).
- **`general` Nodes**: Dynamically generated corridor chunks that advance route progress (`1/N .. N/N`) between connected `key` nodes when `routeTotal > 0` in `KEY_NODE_ROUTES`.
- **`side` Nodes**: Off-path branches extending from `general` or `key` nodes; they do **not** advance route progress and lead either to an `end` node or a `loop` node.
- **`end` Nodes**: Terminal single-exit pockets featuring rolled rewards (`loot_cache`, `mini_boss`, `secret_switch`, or `dead_end`).
- **`loop` Nodes (Depth `1 .. clvl + 1`)**: Going deeper into the Æther fog scales up to `maxDepth = clvl + 1`. Defeating a boss at `maxDepth` clears the fog (`clearAetherFogOnBossDefeat`) and returns the player to their anchor node on the main path.

---

### 2B. Master ASCII Tile, Doodad & Enemy Spawn Character Registry (`[ORION-ANCHOR: ASCII-CHAR-REGISTRY]`)

Every character in a `10 × 9` Room `grid` resolves through two passes:
1. **Terrain / Wall / Doodad Pass (`getTileDefinition(char, biomeId)`)**: Looks up `biome.tileTypes[char]` first, then falls back to global `TILE_REGISTRY[char]`, then defaults to `.` (`floor`) so enemy spawn characters automatically sit on walkable floor tiles.
2. **Enemy / NPC Spawn Pass (`resolveRoomEnemyTypeAtChar(char, context, occurrenceIndex)` at `[ORION-ANCHOR: ENTITY-SPAWN-ROOM]`)**: Conserves ASCII symbols by treating room characters as role tokens (`E`, `W`, `p`, `K`, `o`, `s`, `N`) and resolving them across the 5-tier spatial hierarchy in priority order:
   `Room.enemySpawnTypes -> Map.enemySpawnTypes -> Area.enemySpawnTypes -> Biome.enemySpawnTypes -> Global CHAR_TO_ENEMY_TYPE[char]`.
   An override value may be either a single enemy type ID (`string`) or an ordered array (`string[]`) indexed by the character's reading-order occurrence in the room grid (`occurrenceIndex % list.length`).

#### Table 1: Reserved Global Terrain, Wall & Interactive Doodad Characters (`database/world/global/biomes/general/tiles/`)
| Char | Tile ID | Entry File | Layer & Collision | Behavior & Auto-Tiler Rules |
| :---: | :--- | :--- | :--- | :--- |
| `.` | `floor` | `global/biomes/general/tiles/floor.ts` | Layer 0 · Walkable | **Brown Peat / Dirt** (`07_01..09_03` in `bog_tileset`); default fallback floor under enemy spawns. |
| `,` | `grass` | `global/biomes/general/tiles/grass.ts` | Layer 0 · Walkable | **Moss Grass** (`04_01..06_03` in `bog_tileset`); tree canopy walls connect to grass before dirt. |
| `~` | `mud` | `global/biomes/general/tiles/mud.ts` | Layer 0 · Walkable Hazard | **Corrosive Bog Water / Aether** (`13_01..15_03`); slows movement and corrodes Layer 2 Armor when `biome.tileRules.corrosiveWater = true`. |
| `:` | `ruins_floor` | `global/biomes/general/tiles/ruins_floor.ts` | Layer 0 · Walkable | **Pale Ruins Brick** (`10_01..12_03`); renders raised platform/bridge retaining walls when north of `~`. |
| `;` | `mire_floor` | `global/biomes/general/tiles/mire_floor.ts` | Layer 0 · Walkable | **Dark Dungeon Stone / Mire** (`01_01..03_03`); pairs with dark stone walls. |
| `#` | `pylon_wall` | `global/biomes/general/tiles/pylon_wall.ts` | Layer 1 · **Solid** | Terrain-matched perimeter/interior wall (Tree Canopy on grass/dirt, Ruins Stone on `:`, Dark Stone on `;`). |
| `P` | `pylon_pillar` | `global/biomes/general/tiles/pylon_pillar.ts` | Layer 2 · **Solid** | 2.5D depth-sorted single pillar / tree trunk (`blocksHeight: 2`). |
| `_` | `chasm` | `global/biomes/general/tiles/chasm.ts` | Layer 0 · Pitfall | Open pitfall/sinkhole (`isChasm: true`); player must Jump `[A]` or Booster Dash `[B]` across. |
| `%` | `desync_wall` | `global/biomes/general/tiles/desync_wall.ts` | Layer 1 · **Dynamic** | Temporal barrier that phases between solid and passable every `biome.tileRules.desyncPeriodSec`. |
| `D` | `drop_pod` | `global/biomes/general/tiles/drop_pod.ts` | Layer 2 · **Solid** | Drop-Pod Spawn Anchor (`0,0`) & initial repair/attunement point. |
| `S` | `fallen_scout` | `global/biomes/general/tiles/fallen_scout.ts` | Layer 2 · **Solid** | Bedivere's Fallen Scout Wreckage (`-1,0`); interactive lore/loot object on `[A]`. |
| `C` | `cache` | `global/biomes/general/tiles/cache.ts` | Layer 2 · **Solid** | Lootable Supply Cache (`room.cache` rewards on `[A]`). |
| `V` | `chest` | `global/biomes/general/tiles/chest.ts` | Layer 2 · **Solid** | Interactive Treasure Chest (`doodads_01` sprite; rewards gemstones & equipment on `[A]`). |
| `G` | `rusted_gate` | `global/biomes/general/tiles/rusted_gate.ts` | Layer 1 · **Dynamic** | Locked perimeter gate; opens with `rusted_gate_key` or switch trigger. |
| `M` | `cathedral_door`| `global/biomes/general/tiles/cathedral_door.ts`| Layer 1 · **Dynamic** | Three-Way Cathedral Dungeon Entrance (opens via Key, 3 Grail Fragments, or 3 Hidden Switches). |
| `L` | `poe_lantern` | `global/biomes/general/tiles/poe_lantern.ts` | Layer 2 · **Solid** | Decoupled Layer 2 Poe Lantern doodad (inherits neighbor terrain on Layer 0; emits radial light). |
| `A` | `aether_waystation`| `global/biomes/general/tiles/aether_waystation.ts`| Layer 2 · **Solid** | **Æther Waystation** (`doodads_01` campfire/monolith; attunes Area fast-travel & restores Frame/Armor on `[A]`). |
| `Q` | `colossal_waygate`| `global/biomes/general/tiles/colossal_waygate.ts` | Layer 2 · **Solid** | **Colossal Waygate** (attunes Region/World signature fast-travel on `[A]`). |
| `1` | `hidden_switch_1` | `global/biomes/general/tiles/hidden_switch.ts` | Layer 2 · Walkable | Secret exploration floor/wall switch #1 (`[A]` to toggle). |
| `2` | `hidden_switch_2` | `global/biomes/general/tiles/hidden_switch.ts` | Layer 2 · Walkable | Secret exploration floor/wall switch #2 (`[A]` to toggle). |
| `3` | `hidden_switch_3` | `global/biomes/general/tiles/hidden_switch.ts` | Layer 2 · Walkable | Secret exploration floor/wall switch #3 (`[A]` to toggle). |
| `!` | `toggle_switch` | `global/biomes/general/tiles/hidden_switch.ts` | Layer 2 · Walkable | Room mechanism / desync lock lever (`[A]` to toggle). |

#### Table 2: Conserved Role-Based Enemy & NPC Spawn Characters (`database/enemies/belldor/`)
| Char | Default Enemy Type ID | Entry File | Faction | Conserved Role & Contextual Override Rules |
| :---: | :--- | :--- | :--- | :--- |
| `E` | `bog_crawler` | `enemies/belldor/bog_crawler.ts` | `hostile` | **Generic Hostile Enemy** (defaults to `bog_crawler`; overridden to `orc_warrior` in `orc_siege_encampment`). |
| `W` | `bog_wurm` | `enemies/belldor/bog_wurm.ts` | `hostile` | **Wurm / Serpent** (submerged bio-machine serpent mini-boss in `M00 The Bog`; reusable for non-Bog wurms). |
| `p` | `bog_poe` | `enemies/belldor/bog_poe.ts` | `poe` | **Primary Objective / Spirit Entity** (first Bog objective — Floating Lantern Spirit; uppercase `P` remains `pylon_pillar`). |
| `K` | `camelot_knight` | `enemies/belldor/camelot_knight.ts` | `camelot` | **Knight** (spawns generic `camelot_knight` by default; overridden in `4,-1` and `5,0` via `enemySpawnTypes` to spawn named story knights below). |
| `o` | `orc_warrior` | `enemies/belldor/orc_warrior.ts` | `orc` | **Heavy Raider / Brawler** (frontline Orc boarding-axe & shield raider; pairs with `s`). |
| `s` | `orc_scout` | `enemies/belldor/orc_scout.ts` | `orc` | **Ranged Scout / Skirmisher** (ranged Orc boltcaster skirmisher; pairs with `o`). |
| `N` | `town_npc` | `enemies/belldor/town_npc.ts` | `npc` | **Settlement NPC / Citizen** (Border Town Survivor with `calm`, `linger`, or `feral` disposition). |
| *(Override `K`)* | `percival_knight` | `enemies/belldor/percival_knight.ts` | `camelot` | Sir Percival (Grail Knight) — spawned via `enemySpawnTypes.K` in `map_border_town_barracks` (`4,-1`) & `map_border_town_cathedral` (`5,0`). |
| *(Override `K`)* | `tristan_knight` | `enemies/belldor/tristan_knight.ts` | `camelot` | Sir Tristan (Corrupted Ranger) — spawned via `enemySpawnTypes.K` in `map_border_town_barracks` (`4,-1`) & `map_border_town_cathedral` (`5,0`). |
| *(Override `K`)* | `bors_knight` | `enemies/belldor/bors_knight.ts` | `camelot` | Sir Bors (Berserk Striker) — spawned via `enemySpawnTypes.K` in `map_border_town_cathedral` (`5,0`). |
| *(Event)*| `lady_of_the_lake`| `enemies/belldor/lady_of_the_lake.ts`| `hostile` | Awakened via `awakenLadyOfTheLake()` in `0,-2` when carrying Bedivere's items. |

---

### 2C. Startup World Registry Audit (`database/world/worldAudit.ts`)
Immediately after `database/world/index.ts` finishes scanning `./**/*.ts`, it invokes `auditWorldRegistries(...)` from `database/world/worldAudit.ts` and exports the diagnostic array `WORLD_AUDIT_ISSUES: string[]` (also surfaced in `getMasterAsciiCharacterRegistry().collisions` alongside `TILE_CHAR_COLLISIONS` and `ENEMY_SPAWN_COLLISIONS`):
- **Duplicate Detection**: Flags duplicate IDs or coordinates across `RegionDefinition`, `AreaWikiDefinition`, `MapDefinition`, `RoomDefinition` (`local` coord, `local` ID, `global` ID), `BiomeDefinition`, `TileDefinition`, `WaygateNode`, `WaystationNode`, and `globalRoomSlots`.
- **Cross-Reference Verification**: Verifies that every referenced `regionId`, `areaId`, `mapId`, `biomeId`, `tileId`, `globalRoomId`, and room coordinate across `U00_UNIVERSE_CATALOG`, `REGION_REGISTRY`, `AREA_REGISTRY`, `MAP_REGISTRY`, `LOCAL_ROOM_REGISTRY`, `GLOBAL_ROOM_REGISTRY`, and `BIOME_REGISTRY` resolves to a registered definition without silent fallback.
- **Additive & Removable**: Wired at a single call site in `database/world/index.ts`; deleting `worldAudit.ts` and its single call in `database/world/index.ts` leaves all runtime registries untouched.

---

## 3. Inertia & Stability Physics System (`docs/INERTIA_SYSTEM.md`)

Project Orion uses a **weight-vs-weight classical mechanics Inertia & Stability model** (`src/cartridges/orion/systems/inertiaSystem.ts`) instead of a static poise pool:
- **Weight (`m`) & Directional Charge (`μ`)**: Controls physical displacement (`Δv = J / m_eff`, where `m_eff = m_defender × (1 + μ_defender)` and `μ` only applies when moving into the incoming hit).
- **Stability (`S`)**: Derived from frame weight + armor + leg stabilizers + feats; controls the shrug-off deadband (`k1·S`) and hit recovery speed (`Δv_eff / (k2·S)`).
- **Melee vs. Ranged Impulse (`J`)**: Melee impulse combines attack weight + attacker body weight × `μ_attacker` × commitment factor; Ranged impulse is strictly `projectile_weight × projectile_speed` (independent of shooter weight).
- **Ranged Recoil (`§7`)**: Uses the exact same impulse equation (`Δv_recoil = J_recoil / m_shooter_frame`) with deadband `k1·S`, so heavier and more stable frames suffer less movement restriction while firing heavy weapons.
- **No HUD Clutter by Default**: Inertia and Stability numbers are never shown on the default HUD; full physics telemetry is available in the `MECH STATUS` Satchel tab, and live HUD readouts only appear when the **Inertial Gyro-Telemetry Array** equipment mod is installed in Sensory B (configured in `ARMORY`) or when **Developer Mode** (`devModeEnabled`) is enabled.

---

## 4. Controls Remapping, Graphics Settings & Responsive Virtual Gamepad

### 4A. Isolated In-Game Control Remapping & Live Key Badges (`src/engine/input/`)
- **Menu vs. In-Game Isolation (`keyboardMapper.ts` & `inputBindingsStore.ts`)**: Custom keyboard and physical controller bindings (`localStorage` key `minuteman_control_bindings_v1`) apply strictly to **in-game gameplay actions** (`up`, `down`, `left`, `right`, `a`, `b`, `x`, `y`, `l`, `r`, `start`, `select`). Universal menu navigation (`UniversalMenuNavigator.ts`) always uses fixed menu keys (`Arrow` / `WASD`, `Enter`, `Escape`, `Q`/`E`, `Tab`) so remapping in-game controls can never lock the player out of menus.
- **Release-Gated Capture Modal (`OrionSettingsPanel.tsx`)**: Interactive key and controller button capture sessions set `isInputCaptureActive() = true`, flush held input states (`keyboardMapper.releaseAll()`, `gamepadStore.resetAll()`), preview the detected physical key or W3C button while held, and commit the binding only on key/button release (`keyup` / button release) so the captured input never leaks into the active menu.
- **Live Key & Prompt Display Synchronization**: All HUD skill slots (`HudSkillDeck.tsx`, `renderHudAndFogTells.ts`), defense bar quick-triggers (`HudDefenseBars.tsx`), world interaction prompts (`formatPromptControlLabels`), Virtual Gamepad buttons (`VirtualGamepad.tsx`, `ActionButtons.tsx`, `DPad.tsx`, `SystemButtons.tsx`), and How-To guides (`shellStateMachine.ts`, `KnightGameMenu.tsx`) subscribe to `inputBindingsStore` and display the active primary key badge (`getActionPrimaryKeyBadge`) and live physical key press pop-up (`gamepadStore.activeKeyLabels`).

### 4B. Responsive Landscape-Split Virtual Gamepad (`src/components/gamepad/`)
- **Layout Modes (`VirtualGamepadLayoutMode`)**: Stored in `inputBindingsStore` (`virtualPadLayout: 'auto' | 'bottom' | 'hidden'`) and toggled via the header bar or `OrionSettingsPanel`:
  - **`auto` (Split Wide in Landscape)**: Automatically splits the Virtual Gamepad into left (`L` shoulder, D-Pad, `SELECT`) and right (`R` shoulder, `X`/`Y`/`A`/`B` diamond, `START`) side docks flanking the 10:9 game screen whenever the viewport is in landscape (`width > height && width >= 640px`) on both PC and mobile, maximizing vertical screen height. Falls back to the bottom deck in portrait viewports.
  - **`bottom` (Classic Bottom Deck)**: Docks the unified handheld controller deck below the screen viewport.
  - **`hidden` (Hide Pad)**: Hides the on-screen virtual gamepad for dedicated keyboard or physical controller play while keeping the top bar quick-toggle accessible.

### 4C. Real-Time Graphics, Retro-Modern React HUD & Developer Mode Store (`systems/graphicsSettingsStore.ts`)
- **Persistent Settings (`orion_graphics_settings_v1`)**: `OrionSettingsPanel.tsx` (`GRAPHICS` & `AUDIO & HUD` tabs) and `effectsRenderer.ts` synchronize real-time visual presets (`low`, `medium`, `high`, `retro`, `custom`), dynamic raycast lighting & darkness depth, additive radial bloom, biome weather/miasma particle density, water reflections, 1px tactical sprite outlines, CRT scanlines, screen shake scale, HUD style (`hudResolution`), and Developer Mode (`devModeEnabled`).
- **Modernized Retro React HUD (`Full Tactical` vs. `Compact Retro`)**: Both HUD style modes (`hires` -> **Full Tactical Retro**, `pixel` -> **Compact Retro**) render crisp, high-DPI retro-styled React HUD panels (`OrionHud.tsx`, `HudDefenseBars.tsx`, `HudSkillDeck.tsx`) over the `160 × 144` pixel canvas rather than drawing low-resolution text onto the canvas.
- **Developer Mode (`devModeEnabled`, Hotkey `[F3]` / `` [`] ``)**: Off by default so player-facing UI presents clean lore names (`formatOrionLoreLabel`) and segmented gauge bars with zero coordinate metadata on the gameplay HUD. When toggled on via `OrionSettingsPanel`, `OrionGameMenu`, `OrionSatchel`, or the `[F3]` / Backquote `` [`] `` shortcut, all engine testing telemetry is revealed: floating viewport `FULLSCREEN`/`PAD` controls, lantern & Poe status (`LANTERN LIT`, `☀5`, `POE LANTERN +1.0`), Æther Fog depth/loot gauges & 5-node topology diagnostics, set-path/off-path status (`SET PATH · SAFE`, `OFF-PATH · DIST`), numerical Shield/Armor/Frame/Heat/Enemy HP readouts, raw map/item/weapon/hardware/feat file IDs & internal prefixes (`M00`, `M01`, `u00`), and room/chunk/world coordinates (`[rx,ry]`, `CHK(x,y)`).

### 4D. Three-Tier Map Architecture & Campfire Rest Lifecycle
- **Progressive Local Mini-Map (`[SELECT] -> MAP`, `ui/satchel/LocalMiniMapCanvas.tsx`)**: The Satchel `MAP` tab renders a tile-accurate progressive local mini-map drawn exclusively from rooms and `10×10`-tile chunks visited by the pilot (`exploredTiles`), plotting terrain, water/mud hazards, walls, cardinal doorways, and landmark icons (Drop-Pod, Campfire Waystations, Colossal Waygates, Caches, Poe Lanterns, and Boss Sanctums).
- **Campfire Planet Map vs. Waygate Æther Map (`ui/satchel/PlanetMapModalView.tsx` & `ui/satchel/SatchelWorldTab.tsx`)**:
  - Interacting with an **Æther Waystation (`A`, Campfire)** opens a context menu separating **Rest at Campfire** from **Planet Map** (`worldMapModalMode = 'campfire'`), which displays the planetary region/area atlas and allows fast travel between attuned Waystations on the current world.
  - Interacting with a **Colossal Waygate (`Q`)** opens the **Æther Map** (`worldMapModalMode = 'waygate'`), displaying the 20-world `u00` cosmic orb for inter-world and regional teleportation.
- **Campfire Rest Fade-to-Black & Post-Rest Story Hook Registry (`systems/world/tutorialSystem.ts`)**: Selecting **Rest at Campfire** initiates a `1.3s` fade-to-black / full-black hold / fade-in sequence (`startCampfireRestSequence`, `updateCampfireRestSequence`, `drawCampfireRestFadeOverlay`) without opening a fast-travel modal. At the full-black midpoint (`midpointTriggered`), the engine restores all Three Defense Layers (Shields, Armor Durability, and `200` Frame HP), vents Reactor Heat, resets enemy patrols across the local zone, and evaluates `CAMPFIRE_REST_STORY_HOOKS` (location- and flag-gated post-rest narrative events, spawns, and lore captions).

### 4E. Unified 4-Tier `9px`–`13px` UI Typography & Multi-Line Toast Standard (`ui/`)
- **Strict 4-Tier Pixel-Aligned Font Scale**: All 17 React overlay files under `src/cartridges/orion/ui/` enforce a bounded `9px`–`13px` typography hierarchy with zero sub-`9px` micro-text and zero oversized display classes:
  - **Tier 1 (`text-[9px]`)**: Caption, badge, keycap, and compact telemetry floor.
  - **Tier 2 (`text-[10px]`)**: Standard body copy, button labels, and list row descriptions.
  - **Tier 3 (`text-[11px]`)**: Emphasized labels, toast copy, and interactive text `<input>` fields (Callsign, Pilot Name, Codex Search).
  - **Tier 4 (`text-[12px]`–`text-[13px]`)**: Section titles and modal header ceiling.
- **Multi-Line Bottom-Center Toast Banner (`OrionHud.tsx`, `HudSkillDeck.tsx`)**: All gameplay toasts and story notifications anchor consistently at `bottom-11 left-1/2 -translate-x-1/2 text-center` using `whitespace-normal break-words leading-snug` (`10px`–`11px`) so multi-sentence lore and combat messages wrap cleanly and never truncate.
