# Project Orion — World, Content & Base64 Asset Authoring Guide

Welcome to the **Project Orion** authoring manual. The cartridge is built around **recursive module auto-discovery** (`import.meta.glob`), a **five-tier nested spatial hierarchy** (`Biomes → Rooms → Maps → Areas → Regions`), a **globally classless, hardware-driven build architecture (`v0.8`)**, and a **unified classical-mechanics Inertia & Stability physics engine (`inertia-v0.md`)**.

> **The Golden Rule of Orion Authoring:**
> Unless new content requires a brand-new engine mechanic or a new route entry in `KEY_NODE_ROUTES`, **you never edit engine files or `index.ts` registries**. Dropping a new `.ts` file into the appropriate `database/` subfolder automatically registers it on boot.

---

## 0. Quick-Jump Code Anchor Map (`[ORION-ANCHOR: ID]`)

Every critical registry, world-composer boundary, and engine hook in the codebase is tagged with a standardized `// [ORION-ANCHOR: <ID>]` comment block. Search for any anchor ID below to jump directly to the exact block of code to inspect or edit:

| Anchor Tag | File Path | Purpose & When to Edit |
| :--- | :--- | :--- |
| `[ORION-ANCHOR: TYPES-WORLD-HIERARCHY]` | `src/cartridges/orion/types/world.ts` | `BiomeDefinition` (`tileTypes`, `enemySpawnTypes`, `tileRules`, `tileAssets`), `TileDefinition`, `RoomDefinition`, `MapDefinition`, `AreaWikiDefinition`, and `RegionDefinition` schemas. |
| `[ORION-ANCHOR: U00-UNIVERSE-CATALOG]` | `src/cartridges/orion/database/world/universe.ts` | The 20-World `u00` Universe catalog (`8 Major`, `7 Minor`, `5 Unstable`) and `specStatus: 'LOCKED' \| 'UNDEFINED'` world status flags. |
| `[ORION-ANCHOR: WORLD-GLOB-REGISTRY]` | `src/cartridges/orion/database/world/index.ts` | Single polymorphic `import.meta.glob` scanner that auto-registers Regions, Areas, Maps, Rooms, Biomes, Tiles, Waystations, and Waygates. |
| `[ORION-ANCHOR: ASCII-CHAR-REGISTRY]` | `src/cartridges/orion/database/world/index.ts` | Centralized ASCII character resolver (`getTileDefinition`, `resolveRoomEnemyTypeAtChar`) and `getMasterAsciiCharacterRegistry()` collision audit. |
| `[ORION-ANCHOR: ENEMY-GLOB-REGISTRY]` | `src/cartridges/orion/database/enemies/index.ts` | Recursive auto-discovery for all Enemy, Boss, and NPC modules (`ENEMY_REGISTRY`, `CHAR_TO_ENEMY_TYPE`, `ENEMY_SPAWN_COLLISIONS`). |
| `[ORION-ANCHOR: ENEMY-SPAWN-RESOLVER]` | `src/cartridges/orion/database/enemies/index.ts` | `resolveEnemyTypeForChar(char, biomeEnemyMap)` and `getEnemyBySpawnChar` supporting biome-scoped spawn overrides. |
| `[ORION-ANCHOR: WORLD-KEY-ROUTES]` | `src/cartridges/orion/systems/world/roomLoader.ts` | Declarative `KEY_NODE_ROUTES` graph connecting authored `key` rooms (`"rx,ry"`) across cardinal directions with `routeTotal` general nodes. |
| `[ORION-ANCHOR: U00-ZONE-SEALS]` | `src/cartridges/orion/systems/world/worldTransitions.ts` | `getUndefinedZoneSealReason` enforcing `specStatus: 'UNDEFINED'` Æther Fog seals until a zone's canonical spec is unlocked. |
| `[ORION-ANCHOR: WORLD-COMPOSER-INIT]` | `src/cartridges/orion/systems/world/roomLoader.ts` | `assembleNestedWorld()` 5-tier world composer (`Region → Area → Map → Room`) and automatic cardinal doorway carver. |
| `[ORION-ANCHOR: AETHER-FOG-TOPOLOGY]` | `src/cartridges/orion/systems/world/worldTransitions.ts` | 5-node Æther Fog graph engine (`key`, `general`, `side`, `loop`, `end`) and `maxDepth = clvl + 1` loop scaling. |
| `[ORION-ANCHOR: ROOM-TRANSITION-GATE]` | `src/cartridges/orion/systems/world/worldTransitions.ts` | `transitionViaAetherDoor()` handling room-to-room doorway alignment, area banners, and dynamic enemy/feature spawning. |
| `[ORION-ANCHOR: WAYSTATION-WAYGATE-TRAVEL]` | `src/cartridges/orion/systems/world/worldTransitions.ts` | `fastTravelToWaystation()` and Colossal Waygate inter-region / inter-world teleportation & armor repair. |
| `[ORION-ANCHOR: CONTEXTUAL-LOOT-TABLES]` | `src/cartridges/orion/systems/world/worldPersistence.ts` | `ENEMY_EQUIPMENT_DROP_POOLS` and `resolveContextualEquipmentDrop()` hierarchical loot table resolution (`Enemy → Room → Area → Region`). |
| `[ORION-ANCHOR: ENTITY-SPAWN-ROOM]` | `src/cartridges/orion/systems/entitySystem.ts` | `spawnRoomEnemies()` parsing `10 × 9` room ASCII grids using `resolveRoomEnemyTypeAtChar(char, state.biomeId)`. |
| `[ORION-ANCHOR: RENDER-CLUSTER-BAKE]` | `src/cartridges/orion/systems/render/worldRenderer.ts` | `bakeBiomeClusterTileset()` offscreen sub-tile micro-composer baking 20 separated `3×3` biome clusters (`ruins_tileset` & `bog_tileset`). |
| `[ORION-ANCHOR: RENDER-VISION-LIGHTING]` | `src/cartridges/orion/systems/render/effectsRenderer.ts` | `resolveRoomLightingProfile()` dynamic vision radius (`baseLight` tiles), raycast wall/tree shadow occlusion, and static campfire/lantern light anchors. |
| `[ORION-ANCHOR: RENDER-POST-PROCESS]` | `src/cartridges/orion/systems/render/effectsRenderer.ts` | `drawDynamicLightingAndBloomPass()` 5-pass 2.5D lighting, water reflection, 1px outline, blade trail, and weather pipeline. |
| `[ORION-ANCHOR: PROG-LEVEL-SEQUENCE]` | `src/cartridges/orion/database/progression/index.ts` | `LEVEL_UNLOCK_SEQUENCE` (`Levels 1–20`) onboarding & expression milestones. |
| `[ORION-ANCHOR: PROG-SKILL-SCALING]` | `src/cartridges/orion/database/progression/index.ts` | `PILOT_SKILL_DEFINITIONS` (`6 Combat Discipline Skills`, `Lv 1–20`, funded by Discipline + Reactor Gemstones). |
| `[ORION-ANCHOR: PROG-FEAT-SYNERGY]` | `src/cartridges/orion/database/progression/index.ts` | `doesPilotMeetFeatEquipmentRequirement()` classless hardware & weapon-family prerequisite verifier for all 97 Feats. |
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
│   ├── EQUIPMENT_AND_FEATS.md    # 29 Magitech weapons, hardware & 97 canonical feats
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
│   │   ├── belldor/              # 1. Belldor (Camelot) — Arthurian, canon (LOCKED)
│   │   ├── tyrranus/             # 2. Tyrranus (Greek/Roman, non-canon · UNDEFINED zone docs)
│   │   ├── global/               # Reusable procedural & inter-world templates
│   │   └── tiles/                # Shared tile & 2.5D prop definitions + embedded 16x16 base tiles
│   ├── enemies/                  # [ORION-ANCHOR: ENEMY-GLOB-REGISTRY] Self-contained Enemy, Boss & NPC modules
│   ├── items/                    # Consumables, 9 Gemstones, Currency & Quest Relics
│   ├── equipment/                # Slot-organized Weapons, Hardware, Frame Plating, Reactors & Utilities
│   ├── characters/               # 6 Classless Starting Loadout Kit profiles (Bastion, Fortress, Dawnforge, etc.)
│   └── progression/              # [ORION-ANCHOR: PROG-FEAT-SYNERGY] 97 Canonical Feats, Hardware items & Level Gates
│
├── systems/                      # Modular Domain Engine Systems
│   ├── combat/                   # Modular Combat Subsystem
│   │   ├── combatHelpers.ts      # Aiming, target resolution, cooldowns & stance helpers
│   │   ├── damageSystem.ts       # [ORION-ANCHOR: COMBAT-DEFENSE-MATH] 3 Defense Layers + Inertia hit reaction
│   │   ├── projectileSystem.ts   # Projectile spawning, homing, beam/ballistic updates & enemy hits
│   │   └── skillExecution.ts     # [ORION-ANCHOR: COMBAT-ACTION-PAYLOAD] 5-action weapon & utility execution
│   ├── render/                   # Modular Render Subsystem
│   │   ├── spriteAtlasCache.ts   # Base64 image decoding, 1px outline baking & directional transforms
│   │   ├── worldRenderer.ts      # [ORION-ANCHOR: RENDER-CLUSTER-BAKE] 3x3 cluster auto-tiler, reflections & shadows
│   │   ├── entityRenderer.ts     # Depth-sorted 2.5D entities, props, telegraphs & player mech rendering
│   │   └── effectsRenderer.ts    # [ORION-ANCHOR: RENDER-POST-PROCESS] Blade trails, weather, lighting & particles
│   ├── world/                    # Modular World Subsystem
│   │   ├── roomLoader.ts         # [ORION-ANCHOR: WORLD-COMPOSER-INIT] & [ORION-ANCHOR: WORLD-KEY-ROUTES]
│   │   ├── worldPersistence.ts   # Persistent caches, contextual loot pools & Cathedral Door evaluator
│   │   ├── worldTransitions.ts   # [ORION-ANCHOR: AETHER-FOG-TOPOLOGY] & [ORION-ANCHOR: WAYSTATION-WAYGATE-TRAVEL]
│   │   └── tutorialSystem.ts     # Desync walls, environmental hazards, raids, bosses & world interactions
│   ├── combatSystem.ts           # Combat orchestrator (`updateCombat`) & barrel re-export
│   ├── renderSystem.ts           # Render orchestrator (`drawOrionGame`) & barrel re-export
│   ├── renderHudAndFogTells.ts   # Canonical 3-Layer HUD & Aether Fog wayfinding tells
│   ├── playerSpriteSystem.ts     # 3-layer composite Mech renderer & 5-phase Magic-Current Glide state machine
│   ├── worldSystem.ts            # World barrel re-export
│   ├── playerSystem.ts           # State store, save/load, 2.5D physics, player controller & state gates
│   ├── inertiaSystem.ts          # [ORION-ANCHOR: INERTIA-PHYSICS-ENGINE] Inertia v0.1 physics & stability engine
│   └── entitySystem.ts           # [ORION-ANCHOR: ENTITY-SPAWN-ROOM] Enemy spawning/AI, pickups & particles
│
└── ui/                           # React HUD, Satchel & Menu overlays
    ├── OrionHud.tsx              # HUD orchestrator
    ├── OrionSatchel.tsx          # Satchel menu orchestrator
    ├── hud/                      # Modular HUD subcomponents (HudTitleModal, HudDefenseBars, HudSkillDeck)
    └── satchel/                  # Modular Satchel subcomponents (SatchelCanvases, SatchelStatusTab, SatchelLoadoutTab, SatchelFeatsTab, SatchelWorldTab)
```

---

## 2. Authoring the 5-Tier World Hierarchy & Aether Fog Topology

### 2A. Aether Fog 5-Node Topology & Depth Progression (`[ORION-ANCHOR: AETHER-FOG-TOPOLOGY]`)
No outer room in Orion has a literal solid map border. Instead, `systems/world/worldTransitions.ts` routes cardinal doorways (`N`, `S`, `E`, `W`) through a dynamic 5-node Æther Fog graph with real-time HUD depth gauge and in-world environmental tells:
- **`key` Nodes**: Authored Points of Interest (Drop-Pod, Towns, Boss Sanctums, Waystations, Waygates) registered via `RoomDefinition` files and linked in `KEY_NODE_ROUTES` (`[ORION-ANCHOR: WORLD-KEY-ROUTES]`).
- **`general` Nodes**: Dynamically generated corridor chunks that advance route progress (`1/N .. N/N`) between connected `key` nodes when `routeTotal > 0` in `KEY_NODE_ROUTES`.
- **`side` Nodes**: Off-path branches extending from `general` or `key` nodes; they do **not** advance route progress and lead either to an `end` node or a `loop` node.
- **`end` Nodes**: Terminal single-exit pockets featuring rolled rewards (`loot_cache`, `mini_boss`, `secret_switch`, or `dead_end`).
- **`loop` Nodes (Depth `1 .. clvl + 1`)**: Going deeper into the Æther fog scales up to `maxDepth = clvl + 1`. Defeating a boss at `maxDepth` clears the fog (`clearAetherFogOnBossDefeat`) and returns the player to their anchor node on the main path.

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

#### Table 2: Reserved Global Enemy & NPC Spawn Characters (`database/enemies/belldor/`)
| Char | Enemy Type ID | Entry File | Faction | Role & Notes |
| :---: | :--- | :--- | :--- | :--- |
| `E` | `bog_crawler` | `enemies/belldor/bog_crawler.ts` | `hostile` | Armored Bog arthropod ambusher (`M00 The Bog`). |
| `W` | `bog_wurm` | `enemies/belldor/bog_wurm.ts` | `hostile` | Submerged bio-machine serpent mini-boss (`M00 The Bog`). |
| `p` | `bog_poe` | `enemies/belldor/bog_poe.ts` | `poe` | Floating Lantern Spirit (`M00 The Bog`; escort or slay). |
| `o` | `orc_warrior` | `enemies/belldor/orc_warrior.ts` | `hostile` | Frontline Orc boarding-axe & shield raider (`Belldor` / `Novarin`). |
| `s` | `orc_scout` | `enemies/belldor/orc_scout.ts` | `hostile` | Ranged Orc boltcaster skirmisher (`Belldor` / `Novarin`). |
| `K` | `percival_knight` | `enemies/belldor/percival_knight.ts` | `camelot` | Sir Percival — Grail Knight phalanx boss (`Camelot Border Town`). |
| `T` | `tristan_knight` | `enemies/belldor/tristan_knight.ts` | `camelot` | Sir Tristan — Corrupted Ranger boss (`Camelot Border Town`). |
| `B` | `bors_knight` | `enemies/belldor/bors_knight.ts` | `camelot` | Sir Bors — Berserk Striker boss (`Camelot Border Town`). |
| `N` | `town_npc` | `enemies/belldor/town_npc.ts` | `npc` | Border Town Survivor (`calm`, `linger`, or `feral` disposition). |
| *(Event)*| `lady_of_the_lake`| `enemies/belldor/lady_of_the_lake.ts`| `hostile` | Awakened via `awakenLadyOfTheLake()` in `0,-2` when carrying Bedivere's items. |

---

## 3. Inertia & Stability Physics System (`docs/INERTIA_SYSTEM.md`)

Project Orion uses a **weight-vs-weight classical mechanics Inertia & Stability model** (`src/cartridges/orion/systems/inertiaSystem.ts`) instead of a static poise pool:
- **Weight (`m`) & Directional Charge (`μ`)**: Controls physical displacement (`Δv = J / m_eff`, where `m_eff = m_defender × (1 + μ_defender)` and `μ` only applies when moving into the incoming hit).
- **Stability (`S`)**: Derived from frame weight + armor + leg stabilizers + feats; controls the shrug-off deadband (`k1·S`) and hit recovery speed (`Δv_eff / (k2·S)`).
- **Melee vs. Ranged Impulse (`J`)**: Melee impulse combines attack weight + attacker body weight × `μ_attacker` × commitment factor; Ranged impulse is strictly `projectile_weight × projectile_speed` (independent of shooter weight).
- **Ranged Recoil (`§7`)**: Uses the exact same impulse equation (`Δv_recoil = J_recoil / m_shooter_frame`) with deadband `k1·S`, so heavier and more stable frames suffer less movement restriction while firing heavy weapons.
- **No HUD Clutter by Default**: Inertia and Stability numbers are never shown on the default HUD; full physics telemetry is available in the `MECH STATUS` Satchel tab, and live HUD readouts only appear when the **Inertial Gyro-Telemetry Array** equipment mod is installed in Sensory B.
