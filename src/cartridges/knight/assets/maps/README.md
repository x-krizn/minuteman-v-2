# Bitmap Level Design Guide

Manual map design in the engine uses **1:1 pixel art bitmaps**:
- **Scale:** **1 pixel = 1 tile (16×16 px)** in-game.
- **Tools:** Use Aseprite, Photoshop, Piskel, or any pixel editor. Turn off anti-aliasing / smoothing.

---

## Room Dimensions (in Pixels)

| Room Type | Width × Height (Pixels) | Screens | Use Case |
| :--- | :--- | :--- | :--- |
| **Standard Room** | **10 × 9** | 1×1 | Standard chambers, corridor sections, shops |
| **Wide Room** | **20 × 9** | 2×1 | Long hallways, courtyards, bridges |
| **Tall Room** | **10 × 18** | 1×2 | Vertical climbing shafts, elevators, towers |
| **Grand Arena** | **20 × 18** | 2×2 | Boss sanctums, multi-tiered colosseums |
| **Custom Scale** | Any $(10 \times W) \times (9 \times H)$ | $W \times H$ | Flexible arbitrary spaces |

The engine automatically clamps and smoothly lerps the camera within the room bounds with viewport frustum culling.

---

## Color Palette & Tile Legend

| Color | Hex Code | RGB | Tile Char | Engine Entity / Tile |
| :--- | :--- | :--- | :--- | :--- |
| **White** | `#FFFFFF` | `255, 255, 255` | `#` | Walls and Floors (solid collision) |
| **Black** | `#000000` | `0, 0, 0` | `.` | Background / Traversable Air |
| **Green** | `#00FF00` | `0, 255, 0` | `P` | Hero Spawn / Respawn Point |
| **Red** | `#FF0000` | `255, 0, 0` | `E` | Enemy Spawn |
| **Orange** | `#FF9800` | `255, 152, 0` | `K` | Key Pickup |
| **Blue** | `#0000FF` | `0, 0, 255` | `D` | Room Door / Archway |
| **Yellow** | `#FFFF00` | `255, 255, 0` | `1` / `D` | Double Jump Relic |
| **Purple** | `#9900FF` | `153, 0, 255` | `L` | Boss Door (Locked Gate) |
| **Cyan** | `#00FFFF` | `0, 255, 255` | `O` | Campfire / Checkpoint / Respawn |
| **Magenta** | `#FF00FF` | `255, 0, 255` | `H` | Boss Loot (Heart Container / Relic) |
| **Rose / Deep Pink** | `#FF0098` | `255, 0, 152` | `B` | Boss Enemy |

---

## How to Drop In Maps

### 1. Static Maps (Handcrafted Areas)
Just commit your PNG directly into `src/cartridges/knight/assets/maps/`:
- **Full Area Atlas:** Name the file `<areaId>.png` (e.g. `tutorial.png` or `boss_sanctum.png`). Any multi-room atlas (e.g. $30 \times 27$ for a $3 \times 3$ grid) is automatically sliced into $10 \times 9$ rooms (`0,0`, `1,0`, etc.) and loaded into that area.
- **Individual Room Slices:** Place as `src/cartridges/knight/assets/maps/<areaId>/<rx>,<ry>.png` (e.g. `tutorial/0,0.png`).

### 2. Dynamic Rooms (Procedural Dungeon Templates)
Drop any $10 \times 9$ pixel PNG into `src/cartridges/knight/assets/maps/dynamic/` prefixing the filename with its doorway sockets:
- `EW_<name>.png` — Horizontal corridor (East + West open)
- `NS_<name>.png` — Vertical shaft (North + South open)
- `ENSW_<name>.png` — 4-way cross junction (all 4 directions open)
- `ES_<name>.png`, `SW_<name>.png`, `EN_<name>.png`, `NW_<name>.png` — 2-way corner bends
- `ESW_<name>.png`, `ENW_<name>.png`, `NSW_<name>.png`, `ENS_<name>.png` — 3-way T-junctions
- `W_<name>.png`, `E_<name>.png`, `N_<name>.png`, `S_<name>.png` — 1-way dead ends (treasure vaults / shrines)

The procedural generator automatically discovers and pools these templates, matching them whenever a room on the dungeon graph requires those socket connections.

