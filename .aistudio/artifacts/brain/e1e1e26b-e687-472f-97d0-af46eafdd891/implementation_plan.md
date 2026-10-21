# Orion: Dynamic Room Sizes, Smooth Camera & Expanded Story/Boss Arenas

## 1. Executive Summary
Rooms in **Orion: Belldor Expedition** will support variable grid dimensions (`cols × rows`) instead of being locked to the single-screen `10 × 9` (`160 × 144 px`) viewport. Standard rooms remain `10 × 9` for crisp single-screen pacing, while key boss trials, story hubs, Colossal Waygate sanctums, and Aether Fog corridors/mini-boss lairs expand into multi-screen or custom-aspect arenas with smooth camera tracking and intelligent doorway alignment.

---

## 2. Core Systems Architecture

```
+-------------------------------------------------------------------------+
|                       ROOM DIMENSION RESOLVER                           |
|   Room Grid (string[]) ---> { cols, rows, widthPx, heightPx }           |
|   Default Fallback: 10 cols x 9 rows (160 x 144 px)                     |
+------------------------------------+------------------------------------+
                                     |
         +---------------------------+---------------------------+
         |                                                       |
         v                                                       v
+------------------------------------+  +---------------------------------+
|   CAMERA & RENDER PIPELINE         |  |   DOORWAY & WORLD TRANSITIONS   |
|                                    |  |                                 |
| 1. Target: Pilot (x, y) centered   |  | 1. Scan arrival wall (N/S/E/W)  |
|    in 160x144 viewport             |  |    for carved open doorway      |
| 2. If room > viewport:             |  |    tiles ('.', ':', '~')        |
|    Smooth lerp & clamp to          |  | 2. Align pilot to target door   |
|    [0 .. roomPx - screenPx]        |  |    center (or proportional      |
| 3. If room <= viewport:            |  |    coordinate fallback)         |
|    Center room in viewport         |  | 3. Snap camera immediately to   |
| 4. World layers (0..3.5, lights)   |  |    new room entry position      |
|    translated by (-camX, -camY)    |  | 4. Scale collision, AI bounds,  |
| 5. Screen layers (Vignette, HUD)   |  |    & projectiles to roomPx      |
|    fixed to 160x144 screen space   |  |                                 |
+------------------------------------+  +---------------------------------+
```

### A. Dynamic Room Dimension Resolver
- Every room grid (`string[]`) dynamically resolves its own `rows` (`grid.length`), `cols` (`max row length`), `widthPx` (`cols × 16`), and `heightPx` (`rows × 16`).
- Optional explicit `cols` and `rows` metadata on room definitions is supported for validation and procedural Aether Fog generation, while defaulting to `10 × 9` whenever unspecified.

### B. Viewport Camera Tracking (`160 × 144` Screen Space vs. World Space)
- **Smooth Clamped Follow**: When a room's width or height exceeds `160 × 144 px`, the camera smoothly tracks the pilot (`camX`, `camY`) and clamps strictly to `[0, widthPx - 160]` horizontally and `[0, heightPx - 144]` vertically so no out-of-bounds void appears around oversized rooms.
- **Centered Compact Rooms**: If a narrow corridor or shrine axis is smaller than `10` columns or `9` rows, that axis centers cleanly inside the `160 × 144` viewport.
- **Instant Snap on Room Entry**: Crossing an Aether Doorway or teleporting via Waystation/Waygate immediately snaps `camX` and `camY` to the pilot's entry position on the first frame so the camera never sweeps across the room on load.
- **Layer Separation**:
  - **World-Space Layers** (Floor, Elevation Walls, Water Reflections, Y-Sorted Entities/Props, Projectiles/Blade Trails/Particles, Doorway Motes, Wisp Tether, and Dynamic Point Lights) render with `(-camX, -camY)` translation and viewport frustum culling for visible tile ranges.
  - **Screen-Space Layers** (Ambient Darkness/Vignette, Weather Overlay, Scanlines, and Top/Bottom HUD Bars) remain anchored to the `160 × 144` screen.

### C. Doorway Carving & Cross-Size Room Transitions
- **Dynamic Cardinal Door Carving**: Procedural and Aether Fog doorway carving automatically centers 2-tile cardinal doorways (`N`/`S` at `floor(cols / 2) - 1 .. floor(cols / 2)`, `W`/`E` at `floor(rows / 2) .. floor(rows / 2) + 1`) while respecting any pre-authored door openings in custom room grids.
- **Auto-Locating Arrival Doorways**: When transitioning across `N`, `S`, `E`, or `W` edges between two rooms of different sizes (e.g., walking East from a `10 × 9` room into a `16 × 12` plaza), the transition system scans the arrival wall of the destination room for open doorway tiles and places the pilot directly inside the matching doorway opening. If a wall has a wide open edge, proportional coordinate mapping preserves the pilot's relative offset along that edge.
- **Dynamic Physics & Combat Bounds**: Tile collision checks, enemy patrol/dash/reposition bounds, combat knockback clamping, and projectile despawn boundaries all query the active room's `widthPx` and `heightPx` rather than fixed `160 × 144` constants.

---

## 3. Expanded Story, Boss, Hub & Aether Fog Rooms

### 1. Boss & Trial Arenas
- **Three Knights Cathedral Plaza (`[5,0]`) — `16 × 12` (`256 × 192 px`)**:
  - Expanded grand ruined cathedral courtyard giving the Three Knights (Gawain, Lancelot, Percival) room for synchronized formation charges, flanking arcs, and pillar cover around the northern exit gate.
- **Lady of the Lake Sanctum (`[2,1]`) — `14 × 11` (`224 × 176 px`)**:
  - Expanded subterranean water sanctum featuring a wider central island dais surrounded by deep mystical channels, sunken ruin pillars, and the Excalibur pedestal.
- **Poe & Bog Wurm Clearing (`[3,0]`) — `14 × 11` (`224 × 176 px`)**:
  - Expanded misty bog arena with staggered mire pools, ancient root clusters, and lantern posts that give the burrowing Bog Wurm and Poe multi-angle ambush lanes.

### 2. Hub & Story Landmarks
- **Camelot Border Town Square (`[4,0]`) — `16 × 12` (`256 × 192 px`)**:
  - Expanded fortified settlement hub with distinct districts: western gate approach, central town plaza and fountain/hearth, garrison quartermaster stalls, and the northern cathedral approach.
- **Colossal Waygate Sanctums (`[6,0]` & Region Waygates) — `14 × 12` (`224 × 192 px`)**:
  - Monumental ancient monolith chambers with a ceremonial flagstone causeway, flanking ruin colonnades, and a spacious northern sanctum housing the Colossal Waygate arch.

### 3. Aether Fog Dynamic Templates
- **Aether Fog End Mini-Boss Lair**:
  - When a procedural Aether Fog `end` node rolls a `mini_boss` encounter, its room grid upgrades to an expanded `14 × 11` arena with pillars and hazard pockets suited for elite combat.
- **Aether Fog Bridge & Corridor Templates**:
  - Adds elongated causeway/bridge templates (such as `14 × 9` horizontal causeways and `10 × 13` vertical spans) to the global template pool so Aether Fog traversal features varied spatial rhythm between standard rooms and boss arenas.
