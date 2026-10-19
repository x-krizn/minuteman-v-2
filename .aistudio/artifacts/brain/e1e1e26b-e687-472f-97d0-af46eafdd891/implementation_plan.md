# Orion — Aether Fog Dynamic Node Graph & Borderless World Engine

Design and implement the **Aether Fog Node Engine**, replacing rigid outer room boundaries with a borderless, dynamically generated 5-node topology (`key`, `general`, `side`, `loop`, and `end`) that connects Points of Interest via procedural paths, branches into side rooms and reward dead-ends, and silently loops lost travellers in the fog until guided by environmental tells or Poe Lantern cues.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core engine decisions were confirmed during interactive planning and govern how Aether Fog nodes generate, loop, and reset across the world:

- **Confirmed Decision 1 — Navigation & Loop Escape (`Environmental Tells & Poe Lantern Cues`)**: True `general` path doorways emit subtle visual/environmental tells (such as drifting Aether motes, stone boundary markers, or heightened Poe Lantern resonance when the player carries the Poe Lantern Charm), allowing attentive pilots to distinguish the true path from `side` and `loop` exits and break out of fog loops.
- **Confirmed Decision 2 — Chunk Persistence Lifecycle (`Persist Until Waystation Rest`)**: Once a `general`, `side`, `end`, or `loop` chunk is dynamically generated during a trek, its layout, enemies, and connections remain fixed in memory and state so the player can backtrack reliably. Resting or attuning at any Waystation (`D` / `A`) resets the ephemeral fog graph while preserving discovered `key` nodes and permanent progression flags.
- **Confirmed Decision 3 — Borderless Boundary Resolution (`Dynamic Open-Border Spawning`)**: No exterior room border acts as a hard wall. Crossing any unmapped open doorway on a `key` or `general` room dynamically spawns a `general` path node (if aligned with the active Point of Interest heading), a `side` branch node, or a `loop` fog node that silently wraps coordinates back into the fog ring.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms world traversal in *Project Orion* from a static coordinate grid into a living **Aether Fog Node Graph**. Hand-authored Points of Interest (`key` nodes such as the Bog Drop-Pod, Border Town Slums, Cathedral Dungeon, and Waygate Sanctums) are anchored in world space, while the journeys between them—and the uncharted wilds beyond their borders—are dynamically synthesized from five canonical node archetypes:
  1. **`key` Nodes**: Bespoke Points of Interest (quest hubs, towns, bosses, Waystations, Waygates) that anchor progression.
  2. **`general` Nodes**: Dynamic in-between corridor chunks that advance `nodeProgress` along the active route between two `key` nodes.
  3. **`side` Nodes**: Optional off-path chunks branching from `general` or `key` nodes that do **not** increment route `nodeProgress`, leading either to an `end` node or a `loop` node.
  4. **`end` Nodes**: Terminal pockets extending from `side` nodes that house guaranteed Scavenger Caches, mini-boss ambushes, hidden switches, or atmospheric dead-ends with a single return exit.
  5. **`loop` Nodes**: Disorienting Aether Fog rooms where non-escaped exits silently cycle between `loop` chunks without advancing world coordinates, simulating being lost in the mist until the player follows the subtle escape tell back to a `general` or `key` node.
- **Target Audience / Persona**: Action-RPG players and world designers who want exploration to feel mysterious, seamless, and replayable without artificial invisible walls.
- **Key Value**: Eliminates hard map edges, gives real gameplay utility to the Poe Lantern Charm and environmental observation, and turns every trek between towns and dungeons into a tense navigation challenge with optional `side` → `end` risk/reward branches.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Departing a Key Node into the Fog**: When a pilot walks through an open perimeter doorway of a `key` node, the engine checks whether that cardinal direction leads toward a neighboring `key` node or into the uncharted borderlands.
  2. **Traversing `general` Nodes (The True Path)**: Moving along the correct exit sequence generates `general` chunks (`1 / N` to `N / N` progress) until seamlessly arriving at the destination `key` node.
  3. **Branching into `side` & `end` Nodes**: Taking a perpendicular doorway off a `general` node spawns a `side` node (leaving `nodeProgress` unchanged). Continuing down a `side` branch resolves into either a high-value `end` node (containing a Scavenger Cache, mini-boss guardian, or relic secret) or a `loop` node.
  4. **Getting Lost & Escaping `loop` Nodes**: Stepping off an unmapped border or taking a false exit drops the pilot into a `loop` node. Walking out the wrong exits of a `loop` node seamlessly transitions into another `loop` chunk while cycling the player's logical coordinate in place—no hard border bounce, just endless shifting mist. Observing the subtle doorway tell (drifting cyan/amber Aether motes or Poe Lantern directional pulse) reveals the single stabilized exit that breaks the loop and returns to the last `general` or `key` node.
  5. **Waystation Attunement Reset**: Interacting with a Waystation (`D` / `A`) reboots mech systems, saves the game, and clears the ephemeral `general`, `side`, `loop`, and `end` node instances so the surrounding fog shifts anew on the next expedition.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Retro-futuristic 2.5D top-down pixel canvas (`160x192` internal resolution) paired with a crisp tactical mech HUD and World Topology Satchel inspect view.
  - *Color Palette & Mood*:
    - **60% Dominant Canvas**: Deep bog slate (`#131d2d`), wet stone (`#1c2733`), and shadowed Aether caverns (`#0e1624`).
    - **30% Structural Surfaces**: Pylon masonry (`#334155`), slate HUD framing, and subtle fog veils.
    - **10% Accent & Navigation Tells**: Luminous Aether cyan (`#22d3ee`) for true-path directional motes, Poe Lantern amber (`#f59e0b`) for lantern resonance cues, and hazard crimson (`#ef4444`) for mini-boss tells.
  - *Typography & Hierarchy*: Clean tactical sans-serif (`Plus Jakarta Sans` / system geometric sans) for HUD prompts and Satchel wiki inspection, paired with `tabular-nums` monospace readouts for node coordinates, route progress, and defense meters. Metadata is rendered as clean unboxed text with middle-dot (`·`) separators.
- **Interactive Feedback & Motion**:
  - **Subtle Environmental Tells**: On `general` and `loop` rooms, the doorway aligned with the true path (or loop escape) spawns gentle directional Aether drift particles and a soft radial light glow near the threshold—amplified in radius and clarity when the player holds the `poe_lantern_charm`.
  - **Seamless Looping Transitions**: Crossing a `loop` exit triggers a brief 120ms Aether mist shimmer and room transition toast (`ÆTHER FOG DRIFT · SIGNAL LOOPING`) without snapping or blocking player momentum.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Virtual Node Graph Overlay on Top of `rx,ry` Grid**
  - *Chosen Approach*: Maintain an explicit `AetherNodeGraph` state alongside `rooms[coord]` that tracks each room's `nodeType` (`'key' | 'general' | 'side' | 'loop' | 'end'`), its directional edge links (`N`, `S`, `E`, `W`), and its `trueExitDir` / `escapeDir`.
  - *Why*: Pure Euclidean `(rx, ry)` coordinates cannot naturally express non-Euclidean fog loops (where walking East three times cycles through two `loop` rooms without advancing toward a town at `rx + 3`) or `side` branches that avoid colliding with nearby `key` rooms. Routing transitions through the node graph's directional edges lets `loop` nodes wrap seamlessly while keeping `key` nodes anchored at canonical coordinates.
  - *Alternatives Considered*: Mutating raw `(rx, ry)` coordinates without a graph overlay was rejected because `side` and `loop` rooms would overwrite adjacent `key` rooms in the 2D coordinate plane.
- **Decision 2 — Environmental & Poe Lantern Wayfinding Over Explicit UI Arrows**
  - *Chosen Approach*: Render diegetic canvas particle motes and threshold glow on the correct doorway in `renderSystem`, with enhanced visibility when `state.flags.poe_lantern_gift` or `poe_lantern_charm` is active.
  - *Why*: Preserves the feeling of navigating a mysterious fog-shrouded world while rewarding players who helped the Bog Poe or pay close attention to the environment.
  - *Alternatives Considered*: Drawing a giant HUD compass arrow was rejected because it trivializes the "lost in the fog" mechanic.
- **Decision 3 — Waystation-Scoped Ephemeral Persistence**
  - *Chosen Approach*: Store generated nodes in `state.fogGraph` during active exploration so backtracking through visited `general`, `side`, and `end` rooms is deterministic, then flush ephemeral nodes when the player attunes at a Waystation.
  - *Why*: Prevents frustrating room randomization when stepping one screen back during combat, while keeping the broader world dynamic across expeditions.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Node Topology Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        AETHER FOG 5-NODE TOPOLOGY                          │
└────────────────────────────────────────────────────────────────────────────┘

   [ KEY NODE: Point of Interest ] (Anchored: Bog Drop-Pod, Slums, Dungeon)
                 │
                 ├── (True Path Exit: Subtle Aether Mote / Lantern Tell)
                 ▼
   [ GENERAL NODE (1..N) ] ─── (Progresses Route 1/N -> N/N) ───► [ NEXT KEY NODE ]
                 │
                 ├── (Off-Path Border Exit: Does NOT count toward progress)
                 ▼
          [ SIDE NODE ]
           ╱         ╲
   (Reward Roll)   (Fog Drift Roll)
         ╱             ╲
        ▼               ▼
  [ END NODE ]     [ LOOP NODE A ] ◄─── (Silent Non-Euclidean Wrap) ───┐
  • Loot Cache          │      ▲                                       │
  • Mini-Boss           │      └─────── [ LOOP NODE B ] ───────────────┘
  • Secret Switch       │
  • Single Exit         └── (Follow Lantern / Mote Tell Exit) ──► Returns to
                                                                  SIDE / GENERAL
```

### Engine Data Flow Diagram

```
┌───────────────────────────┐     ┌──────────────────────────────────────────┐
│   database/world/         │     │           systems/worldSystem.ts         │
│ • Authored KEY Rooms      │────►│ • Aether Fog Node Graph Resolver         │
│ • Procedural Templates    │     │ • Borderless Doorway & Loop Router       │
│   (General/Side/End/Loop) │     │ • Waystation Graph Reset Handler         │
└───────────────────────────┘     └────────────────────┬─────────────────────┘
                                                       │
                         ┌─────────────────────────────┼─────────────────────┐
                         ▼                             ▼                     ▼
          ┌────────────────────────────┐ ┌──────────────────────┐ ┌─────────────────────┐
          │   systems/renderSystem.ts  │ │systems/entitySystem  │ │  ui/OrionHud.tsx &  │
          │ • Threshold Mote Tells     │ │• End-Node Mini-Boss  │ │  OrionSatchel.tsx   │
          │ • Poe Lantern Resonance    │ │  & Secret Spawners   │ │• Node Type & Fog    │
          │ • Aether Fog Veil Shimmer  │ │• Loop Ambush Spawns  │ │  Topology Readout   │
          └────────────────────────────┘ └──────────────────────┘ └─────────────────────┘
```

### Data Model & State

- **`AetherNodeType`**: `'key' | 'general' | 'side' | 'loop' | 'end'`
- **`AetherGraphNode`**:
  - `id: string` — Unique node key (canonical `"rx,ry"` for `key` nodes, or virtual key such as `"fog:gen:1"`, `"fog:side:2"`, `"fog:loop:3"`, `"fog:end:4"` for dynamic chunks).
  - `nodeType: AetherNodeType` — One of the 5 node classifications.
  - `coord: string` — Display/anchor coordinate in the world registry.
  - `sourceKeyCoord?: string` & `targetKeyCoord?: string` — The `key` node anchor pair this path bridges.
  - `routeStep?: number` & `routeTotal?: number` — Tracks `general` node progress (`1..N`) toward the target `key` node (`side` and `loop` nodes preserve the parent's step without incrementing it).
  - `trueExitDir?: 'N' | 'S' | 'E' | 'W'` — The doorway direction that advances along the `general` path or escapes a `loop` node.
  - `edges: Partial<Record<'N' | 'S' | 'E' | 'W', string>>` — Resolved neighbor node IDs so visited chunks persist until a Waystation rest.
  - `endFeature?: 'loot_cache' | 'mini_boss' | 'secret_switch' | 'dead_end'` — Feature rolled for `end` nodes.
- **`OrionState.fogGraph`**:
  - Stores the active session's generated `nodes: Record<string, AetherGraphNode>`, `activeNodeId: string`, `loopDepth: number` (how many consecutive loop transitions the player has made), and `seed: number`.

### Interactive Component & State Mapping

1. **Borderless Room Transition Resolver (`handleWorldRoomTransition` in `worldSystem.ts`)**:
   - All exterior perimeter walls on `key`, `general`, `side`, and `loop` rooms keep their central 2-tile cardinal doorways open (`N`, `S`, `E`, `W`), while `end` nodes open **only** the single entry doorway back to the parent `side` node.
   - When the player crosses a doorway boundary in direction `dir`:
     - If `currentNode.edges[dir]` already exists in `state.fogGraph`, transition directly to that persisted node.
     - If departing a `key` or `general` node along `trueExitDir`, either step into the destination `key` node (when `routeStep >= routeTotal`) or dynamically generate the next `general` node (`routeStep + 1`).
     - If departing a `key` or `general` node through any **other** open border, dynamically generate a `side` node (or a `loop` node if on an outer world perimeter).
     - If departing a `side` node, roll between generating a terminal `end` node (spawning a Scavenger Cache, mini-boss guardian, or secret switch) or a `loop` node.
     - If inside a `loop` node: crossing `trueExitDir` escapes the fog loop back to the anchor `side`/`general`/`key` node and resets `loopDepth = 0`; crossing any of the other 3 exits silently links to a sibling `loop` node, increments `loopDepth`, and wraps the player seamlessly without hitting a hard border.
2. **Environmental & Poe Lantern Tell Renderer (`renderSystem.ts`)**:
   - In `general` and `loop` nodes, the doorway corresponding to `trueExitDir` renders subtle drifting Aether particles flowing toward the exit threshold plus a faint floor rune/beacon tint.
   - If the player possesses `poe_lantern_charm` (or `state.flags.poe_lantern_gift`), a warm Poe Lantern wisp tether gently orbits the player and points toward `trueExitDir`, and the HUD prompt notes `POE LANTERN RESONATES TOWARD THE TRUE PATH` when standing near the correct threshold.
3. **Waystation Reset & Satchel Topology Inspector (`worldSystem.ts`, `OrionHud.tsx`, `OrionSatchel.tsx`)**:
   - Attuning at a Waystation (`D` / `A`) calls `resetEphemeralFogGraph(state)`, pruning all dynamic `general`, `side`, `loop`, and `end` rooms from `rooms` and `state.fogGraph` while restoring `key` rooms to their canonical state.
   - The HUD and Satchel World Architecture tab display the current room's `AetherNodeType` (`KEY`, `GENERAL`, `SIDE`, `LOOP`, `END`), current route progress (`PATH STEP X/Y` on `general` nodes, `OFF-PATH BRANCH` on `side` nodes, `ÆTHER FOG LOOP` on `loop` nodes), and active `end` node rewards.
