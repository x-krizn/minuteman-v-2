# Orion World Darkness, Light Stat, Interactable Context Menus, Combat Tuning & 6-Finger Overlapping Hex Feat Grid

Gameplay adjustments, bug fixes, atmospheric lighting overhaul, and the **6-Finger Overlapping Hex Feat Grid** for Project Orion, paired with restarting and verifying the development server on port 3000.

## User Review & Critical Decisions

- **6-Finger Overlapping Hex Feat Grid & Tier Limits (`6 / 5 / 4 / 3 / 2`)**: Renders the interactive **18-Node Interlocking `+` Hex Grid** matching your attached reference diagram (**6 Primary Finger Apex Nodes** + **6 Inter-Finger Overlap Bridge Nodes** on the outer ring + **6 Inner Pastel Convergence Nodes** around the central core), paired with strict per-tier socketed capacity enforcement (**Tier I: 6, Tier II: 5, Tier III: 4, Tier IV: 3, Tier V: 2** — 20 max socketed feats).
- **Interactable Context Menu (`[A]` to Open/Confirm, `[B]` to Cancel, `Up/Down` to Select)**: Interacting with any world object (Chest, Scavenger Cache, Poe, Campfire, Waygate, Fallen Knight, NPC, Lever/Switch, or Sealed Gate) opens a tactical context menu instead of immediately firing a single default action, preventing accidental triggers and resolving overlapping prompts.
- **Per-Coordinate Chest & Cache Persistence**: Removes the room-wide `:reward` flag write/check so looting a chest or cache only marks that exact `(tx, ty)` coordinate as opened. Looted Scavenger Caches (`C`) become passable (`non-solid`) immediately after looting.
- **Universal `Light` Stat (Base `5` Tiles = `80px`, ~Half Screen)**: Both the player and all enemies receive a modifiable `Light` / vision radius stat defaulted to `5` tiles (`80px`). Unexplored areas outside vision fade to **black**, while previously explored areas outside current vision fade to a **muted gray memory shroud**.
- **First Campfire Poe & Firelight Progression**: A Poe is tucked behind trees at the outer edge of the First Campfire clearing (`0,0`). Campfires cannot be lit until the player speaks with this Poe; once the first campfire is lit, the Poe moves out from the trees to hover beside the warm firelight.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. Fixes the bug where opening one chest/cache marked all lootables in the map as opened, makes looted caches (`C`) walkable, and introduces an in-game **Context Menu** for all interactables.
  2. Restricts the **Bog Wurm** so it can only submerge on corrosive water tiles (`'~'`) and actively seeks out `'~'` tiles whenever it wants to submerge or regenerate.
  3. Makes **Orc Warriors** heavier and harder-hitting (increased Frame Integrity, Shield Capacity, Armor Threshold/Durability, knockback impulse, and heavier movement cadence) and increases damage across **all enemies**.
  4. Enforces strict per-tier socketed feat limits (**Tier I: 6, Tier II: 5, Tier III: 4, Tier IV: 3, Tier V: 2**) and renders the **6-Finger Overlapping Hex Grid** in the Satchel (`SKILLS & GEMS`).
  5. Introduces **Light** as a modifiable stat (base `5` tiles) for both player and enemies, darkens the entire game world, and renders dual-state fog of war (fading to **black** for unexplored tiles and **gray** for explored tiles at the vision boundary).
  6. Places the **Poe** at the forested edge of the First Campfire (`0,0`) to gate campfire activation, relocating the Poe into the hearth's light ring after the player lights the first campfire.
  7. Restarts and verifies the Vite development server on port `3000`.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  - **6-Finger Overlapping Hex Grid (`SKILLS & GEMS`)**:
    - Displays the exact **interlocking 5-square `+` cross hex lattice** (`center = (2 * col, 2 * row)` where `col + row` is even) from your reference image:
      - **6 Primary Finger Apex Nodes (Outer Vertices)**:
        - `12:00` **Red (`#ff0000`)** — Finger 1 (`Warrior`)
        - `2:00` **Yellow (`#ffff00`)** — Finger 2 (`Guardian`)
        - `4:00` **Green (`#00ff00`)** — Finger 3 (`Cleric`)
        - `6:00` **Cyan (`#00ffff`)** — Finger 4 (`Wizard`)
        - `8:00` **Blue (`#0000ff`)** — Finger 5 (`Marauder`)
        - `10:00` **Magenta (`#ff00ff`)** — Finger 6 (`Rogue`)
      - **6 Inter-Finger Overlap Bridge Nodes (Outer Edge Midpoints)**:
        - `1:00` **Orange (`#ff8000`)**, `3:00` **Lime (`#80ff00`)**, `5:00` **Spring Green (`#00ff80`)**, `7:00` **Azure (`#0080ff`)**, `9:00` **Violet (`#8000ff`)**, `11:00` **Rose (`#ff0080`)** — representing dual-discipline hybrid overlaps (e.g., `Warrior/Marauder`, `Warrior/Guardian`, `Marauder/Guardian`, `Wizard/Cleric`, `Rogue/Wizard`, `Rogue/Cleric`).
      - **6 Inner Ring Convergence Nodes (Pastel Inner Hexagon)**:
        - `12:00` **Salmon (`#ff8080`)**, `2:00` **Light Yellow (`#ffff80`)**, `4:00` **Mint (`#80ff80`)**, `6:00` **Pale Cyan (`#80ffff`)**, `8:00` **Periwinkle (`#8080ff`)**, `10:00` **Lavender (`#ff80ff`)** — representing high-tier inner convergence nodes around the central core.
    - Clicking any `+` hex node filters and highlights the corresponding Finger or Overlap feats, displays socketed feats within that node, and pairs with the **5-Tier Capacity Tracker (`Tier I: 6 · Tier II: 5 · Tier III: 4 · Tier IV: 3 · Tier V: 2`)**.
  - **Context Menu Interaction Flow**: Approaching a Chest, Cache, Poe, Campfire, or Fallen Knight displays a prompt badge. Pressing `[A]` opens a compact tactical context menu listing context-specific options (e.g., `OPEN CHEST` / `STEP BACK`, `SPEAK WITH THE POE` / `LEAVE`, `LIGHT CAMPFIRE` / `REST & REBOOT ANCHOR` / `FAST TRAVEL` / `LEAVE`). D-Pad `Up/Down` (or mouse click) selects an option; `[A]` executes it and `[B]` closes the menu.
  - **World Darkness & Vision Radius (`Light = 5`)**: The player sees a `5`-tile (`80px`) lit radius around their frame (modifiable via Head/Sensory hardware, Feats, Poe Lantern, and Cheat controls). As the player moves, tiles within their lit radius are recorded as **explored**. Beyond the vision edge, unexplored tiles fade to pitch black (`#000000`), while explored tiles fade to desaturated slate gray (`rgba(18, 24, 34, 0.78)` with gray terrain tinting) so layout memory persists while distant enemies remain unseen.
  - **First Campfire & Poe Discovery**: Reaching the First Campfire (`0,0`), the unlit hearth cannot be used yet (`CAMPFIRE DORMANT — SEEK THE POE AT THE FOREST EDGE`). Exploring the tree-lined perimeter reveals the Poe tucked behind trees (`P`). Talking to the Poe via the context menu unlocks Campfire ignition (`campfire_unlocked`). Lighting the campfire illuminates the clearing and draws the Poe closer to hover beside the flames.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: 6-Finger Overlapping Hex Lattice + Per-Tier Slot Caps (`6 / 5 / 4 / 3 / 2`)**
  - *Chosen Approach*: Render the 18-node interlocking `+` pentomino hex grid on an SVG/Canvas lattice (`(2*col, 2*row)`) mapping pure single-finger feats to the 6 outer apexes, dual-finger hybrid feats (`lineageHint` containing `/`) to the 6 outer overlap bridges, and Tier IV–V mastery/convergence feats to the 6 inner pastel nodes, while enforcing `FEAT_TIER_MAX_SLOTS = { I: 6, II: 5, III: 4, IV: 3, V: 2 }`.
  - *Why*: Matches your attached 6-Finger + Overlaps visual diagram pixel-for-pixel while enforcing the exact `6 / 5 / 4 / 3 / 2` tier budget.
- **Decision 2: Per-Tile Cache Keys vs. Room-Wide Reward Key**
  - *Chosen Approach*: Key all chests (`V`) and caches (`C`) strictly by `${canonicalRoomKey}:${tx},${ty}` (and chunk-aware coordinates in the Unified Bog Grid), removing the shared `${canonicalKey}:reward` flag that caused one chest to mark every chest in the expanse as opened.
  - *Why*: Preserves individual chest/cache state across both standalone rooms and the 26×18 Unified Bog Grid without cross-contaminating other lootables.
- **Decision 3: Shared `Light` Stat for Player & Enemy Vision + Two-Stage Fog Shroud**
  - *Chosen Approach*: Define base `Light = 5` tiles (`80px`) for all characters. Enemy detection (`canEnemyDetectPlayer`) uses the enemy's `Light` stat (`base 5 tiles = 80px`) as its sight distance alongside tile line-of-sight. Tiles outside active illumination render as solid black if unexplored, or dimmed gray terrain if previously explored (with dynamic enemies hidden when outside current illumination).
  - *Why*: Unifies player visibility and enemy engagement rules under a single tunable stat while rewarding exploration.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        ORION GAMEPLAY & RENDER LOOP                        │
├──────────────────────┬───────────────────────────┬─────────────────────────┤
│  INTERACTION ENGINE  │   COMBAT & AI SYSTEMS     │   LIGHT & FOG RENDERER  │
│  ┌────────────────┐  │  ┌─────────────────────┐  │  ┌───────────────────┐  │
│  │ Context Menu   │  │  │ Light Stat (Base 5) │  │  │ Explored Tile Map │  │
│  │ State & Input  │  │  │ Player & Enemy Sight│  │  │ (Per Room/Chunk)  │  │
│  └───────┬────────┘  │  └──────────┬──────────┘  │  └─────────┬─────────┘  │
│          ▼           │             ▼             │            ▼            │
│  ┌────────────────┐  │  ┌─────────────────────┐  │  ┌───────────────────┐  │
│  │ Per-Tile Cache │  │  │ Bog Wurm '~' Seek   │  │  │ Radial Vision +   │  │
│  │ & Passable 'C' │  │  │ Heavy Orc & +DMG    │  │  │ Gray/Black Shroud │  │
│  └───────┬────────┘  │  └──────────┬──────────┘  │  └─────────┬─────────┘  │
│          ▼           │             ▼             │            ▼            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │Campfire Poe Gate (Edge Trees -> Talk -> Light Fire -> Move to Hearth)│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│         6-FINGER OVERLAPPING HEX FEAT GRID + TIER CAPS (6/5/4/3/2)         │
│                [Red]                                                       │
│         [Rose]       [Orange]         Tier I   [■][■][□][□][□][□] (Max 6)  │
│  [Mag]        [Salm]          [Yel]   Tier II  [■][□][□][□][□]    (Max 5)  │
│         [Lav]        [LtYel]          Tier III [□][□][□][□]       (Max 4)  │
│  [Vio]         (Core)         [Lime]  Tier IV  [□][□][□]          (Max 3)  │
│         [Peri]       [Mint]           Tier V   [□][□]             (Max 2)  │
│  [Blu]        [Ice]           [Grn]                                        │
│         [Azur]       [SprGrn]                                              │
│                [Cyan]                                                      │
└────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & System Specifications
- **Context Menu State (`state.contextMenu`)**:
  - `{ isOpen: boolean; title: string; subtitle?: string; options: Array<{ id: string; label: string; detail?: string; disabled?: boolean }>; selectedIndex: number; targetX: number; targetY: number; targetKey: string }`.
  - Intercepts `up`, `down`, `a`, and `b` inputs in `updatePlayerSystem` when open so the player does not jump or move while choosing an interaction option.
- **Passable Looted Caches (`C`)**:
  - Add `checkSolid(state, _room, tx, ty)` to Scavenger Cache tile definition (`C`) returning `!isRoomCacheLooted(state, tx, ty)` (with `tx, ty` forwarded into `checkSolid` inside `isSolidAt`).
- **Bog Wurm Water-Seeking AI**:
  - Helper `findNearestWaterTilePx(roomGrid, ex, ey)` locates the closest `'~'` tile center.
  - When `bog_wurm` is not on `'~'`, `e.isSubmerged` is forced to `false`. Whenever it wants to submerge (retreating to heal at `< 65%` integrity, or stalking outside strike range), if `!onWater`, it steers toward the nearest `'~'` tile using `stepEnemyWithCollision` and only sets `e.isSubmerged = !lanternReveals` once `onWater` is `true`.
- **Orc Warrior & Global Enemy Damage Scaling**:
  - **Orc Warrior**: `frameIntegrity: 95` (up from 60), `shields.capacity: 60` (up from 45), `armor: { type: 'Hardened', threshold: 9, rating: 4, durability: 75 }`, `speed: 26` (heavier stride), `damage: 28` (up from 16), plus increased chop knockback/impulse.
  - **All Enemies**: Increase base `damage` across all enemy definitions (~35%–50% boost: Bog Crawler `12 -> 18`, Bog Wurm `20 -> 28`, Orc Scout `11 -> 17`, Orc Warrior `16 -> 28`, Feral NPC `9 -> 14`, Percival `20 -> 28`, Tristan `18 -> 26`, Bors `22 -> 32`, Lady of the Lake `24 -> 34`).
- **6-Finger Overlapping Hex Grid & Tier Limits (`FEAT_TIER_MAX_SLOTS`)**:
  - `FEAT_TIER_MAX_SLOTS = { I: 6, II: 5, III: 4, IV: 3, V: 2 }`.
  - Validated inside `toggleFeatNodeGemSocket`: if equipping a feat of tier `T` would exceed `FEAT_TIER_MAX_SLOTS[T]`, block socketing and display a toast (`TIER ${T} FEAT LIMIT REACHED (${max}/${max}) — UNSOCKET A TIER ${T} FEAT FIRST`).
  - Render the interactive **18-Node `+` Pentomino Hex Grid** in `SatchelFeatsTab` alongside the `6 / 5 / 4 / 3 / 2` Tier Slot Bars so clicking any Finger Apex, Overlap Bridge, or Inner Convergence node filters/selects its matching feats and displays socketed status directly on the hex cross cells.
- **Light Stat & Explored/Unexplored World Darkness**:
  - Add `baseLight: number` (default `5` tiles) and computed effective `light` stat (`computeEffectivePlayerLightTiles(state)`) to `OrionState` (displayed in Mech Status & HUD, adjustable in Cheat Console).
  - Add `visionRadiusTiles` (default `5` tiles = `80px`) to enemies and use `e.visionRadiusTiles * TILE_SIZE` as the base detection distance in `canEnemyDetectPlayer`.
  - Track `state.exploredTiles: Record<string, Record<string, boolean>>` (serialized in save data). Each frame, mark tiles within the player's `Light` radius (and lit campfires) as explored.
  - In the world/lighting renderer, darken the entire world so tiles outside active light sources fade to **gray** (`rgba(15, 23, 36, 0.76)` with muted gray saturation) if explored, or **pitch black** (`rgba(0, 0, 0, 0.98)`) if unexplored. Hide enemies located in unlit tiles (`visibilityFactor <= 0.08`).
- **First Campfire (`0,0`) Poe & Firelight Relocation**:
  - Update `0,0` (`room00DropPodCrater`) so a Poe (`p`) spawns at the outer edge tucked behind trees (`P`).
  - Gate Campfire (`A`) lighting/resting behind `state.flags.campfire_unlocked` (unlocked by choosing `SPEAK WITH THE POE` in the Poe's context menu, or in Cheat Mode).
  - Track whether the First Campfire is lit (`state.discoveredWaystations.includes('ws_bog_first_campfire')` or `state.flags.first_campfire_lit`). Unlit campfires emit minimal light; once lit, the campfire emits a warm `5.5`-tile firelight aura and the `bog_poe` in `0,0` smoothly glides from its hidden tree alcove to hover beside the lit campfire (`tx = 8, ty = 4`).
