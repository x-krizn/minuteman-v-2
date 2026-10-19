# Orion — `u00 Universe` Catalog, Belldor Canonical Zone Hierarchy & `UNDEFINED` Spec Lockouts

Align the Orion world registry, directory structure, Aether Fog engine, and Satchel UI with the canonical **`u00 Universe`** specification (`worlds.md §1`, `bog-v2.md`, `border-town-v1.md`, and `mapping-v0.md`).

---

## 1. `u00 Universe` 20-World Catalog (`database/world/universe.ts`)

Create a first-class **`U00_UNIVERSE_CATALOG`** registry that codifies all 20 worlds of the `u00 Universe` while keeping physical directory trees clean (playable folders only for defined worlds).

### 1.1 World Classification & Origin Taxonomy (`types.ts`)
- **`UniverseWorldTier`**: `'major' | 'minor' | 'unstable'`
- **`UniverseCanonOrigin`**: `'canon'` *(original stories)* | `'non-canon'` *(derived from folklore, mythology, etc.)*
- **`DesignSpecStatus`**: `'LOCKED' | 'UNDEFINED'`
- **`UniverseWorldDefinition`**:
  - `id: string`
  - `index?: number` *(1–8 for Major Worlds)*
  - `name: string`
  - `subtitle?: string` *(e.g., `'Camelot'`)*
  - `theme: string` *(e.g., `'Arthurian'`, `'Greek/Roman'`, `'Dwarf'`, `'Orc'`, `'Draconic'`, `'Desert'`, `'Elves'`, `'Underworld'`)*
  - `tier: UniverseWorldTier`
  - `origin: UniverseCanonOrigin`
  - `specStatus: DesignSpecStatus`
  - `docRef?: string` *(e.g., `'worlds.md §1, LOCKED'`)*
  - `hasZoneDocs: boolean`
  - `regionIds: string[]`

### 1.2 The 20 Canonical Worlds in `U00_UNIVERSE_CATALOG`
- **MAJOR WORLDS (`worlds.md §1, LOCKED`)**:
  1. **Belldor (Camelot)** — Arthurian, `canon` (Original Story), `LOCKED` *(only world with zone docs: `bog-v2.md`, `border-town-v1.md`, `mapping-v0.md`)*
  2. **Tyrranus** — Greek/Roman, `non-canon` (Derived Mythology), `UNDEFINED` zone docs
  3. **Orion** — Dwarf, `canon` (Original Story), `UNDEFINED` zone docs
  4. **Novarin** — Orc, `canon` (Original Story), `UNDEFINED` zone docs
  5. **Chyme** — Draconic, `canon` (Original Story), `UNDEFINED` zone docs
  6. **Golem** — Desert, `non-canon` (Derived Folklore), `UNDEFINED` zone docs
  7. **New Novarin** — Elves, `canon` (Original Story), `UNDEFINED` zone docs
  8. **Sin** — Underworld, `non-canon` (Derived Mythology), `UNDEFINED` zone docs
- **MINOR WORLDS (`all UNDEFINED`)**:
  - `Sylvis`, `Vox`, `Victor`, `Jager`, `Ferrous`, `Ebony`, `Ivory`
- **UNSTABLE WORLDS (`all UNDEFINED`)**:
  - `Aurora`, `Rhyme`, `Siren`, `Lennus`, `Malleus`

---

## 2. Belldor Canonical 4-Zone (`Area`) Hierarchy (`database/world/belldor/`)

Map Belldor's 4 canonical zones directly as **Areas** under `database/world/belldor/`, with their documented sub-features represented as **Maps**, **Key Nodes**, and explicit **`specStatus` / `openDesignId`** metadata:

```text
src/cartridges/orion/database/world/
├── universe.ts                                 # u00 Universe 20-World Catalog (Major/Minor/Unstable + Canon/Non-Canon)
├── index.ts                                    # Polymorphic World Registry + Universe Catalog exports
├── global/                                     # Procedural Aether Fog templates
├── tiles/                                      # Tile definitions & 4x4/2x2 seeds
└── belldor/
    ├── biomes.ts
    ├── region_belldor_outskirts/
    │   ├── region.ts
    │   ├── m00_the_bog/                        # 1. M00 THE BOG (bog-v2.md) — starting zone, LOCKED
    │   │   ├── area.ts
    │   │   ├── map_bog_drop_zone.ts            # Maze of downed trees, Temple/monastery ruins, Corrosive bog water, Bedivere's corpse (en route to exit; ring + list)
    │   │   └── map_deep_bog_maze.ts            # The Poe (rescuable NPC; triggers L2, unlocks exit) + Lady of the Lake arena (secret boss, return trigger) + Trap systems [UNDEFINED: OD-BOG-01]
    │   └── m01_orc_encampment/                 # 3. M01 ORC ENCAMPMENT — UNDEFINED (mapping-v0.md)
    │       ├── area.ts                         # Tagged specStatus: 'UNDEFINED', docRef: 'mapping-v0.md'
    │       └── map_orc_siege_camp.ts
    └── region_belldor_camelot_heartland/
        ├── region.ts
        ├── camelot_border_town/                # 2. CAMELOT BORDER TOWN (border-town-v1.md), LOCKED
        │   ├── area.ts
        │   ├── map_border_town_market.ts       # Outer Perimeter (spawn from Bog) + Market District (central hub)
        │   ├── map_border_town_barracks.ts     # Barracks Quarter (Percival/Tristan/Bors patrols)
        │   └── map_border_town_cathedral.ts    # Cathedral District (lore zone) + Dungeon Entrance -> Deep Dungeon [UNDEFINED: OD-BT-01] -> Camelot Waygate Key
        └── camelot_interior/                   # 4. CAMELOT INTERIOR — next major zone via waygate; UNDEFINED
            ├── area.ts                         # Tagged specStatus: 'UNDEFINED'
            └── map_camelot_waygate_depths.ts   # Dungeon Entrance / Camelot Waygate threshold (sealed to Camelot Interior)
```

### 2.1 Detailed Feature Checklist per Belldor Zone
1. **`M00 THE BOG` (`m00_the_bog`, `bog-v2.md`, `LOCKED`)**:
   - Sub-features registered on the Area & Maps:
     - **Maze of downed trees** (`0,0` & `1,0`)
     - **Temple/monastery ruins** (`1,0` & `2,0`)
     - **Corrosive bog water zones** (`~` tiles across `0,0`–`3,0`)
     - **Trap systems** — flagged in metadata as `UNDEFINED (OD-BOG-01)`
     - **The Poe** (`3,0` — rescuable NPC; triggers L2, unlocks exit)
     - **Bedivere's corpse** (`1,0` — en route to exit; drops `bedivere_ring` + `bedivere_relic` list)
     - **Lady of the Lake arena** (`2,1` — secret boss, return trigger)
2. **`CAMELOT BORDER TOWN` (`camelot_border_town`, `border-town-v1.md`, `LOCKED`)**:
   - Sub-features registered on the Area & Maps:
     - **Outer Perimeter** — spawn anchor from the Bog (`4,0` west gate)
     - **Market District** — central hub & Waystation (`4,0`)
     - **Barracks Quarter** — Percival / Tristan / Bors patrols (`4,-1`)
     - **Cathedral District** — lore zone (`5,0`)
     - **Dungeon Entrance** (`5,0` `M` gate) $\rightarrow$ **Deep Dungeon (`UNDEFINED: OD-BT-01`)** $\rightarrow$ **Camelot Waygate Key**
3. **`M01 ORC ENCAMPMENT` (`m01_orc_encampment`, `mapping-v0.md`, `UNDEFINED`)**:
   - Marked `specStatus: 'UNDEFINED'` (`docRef: 'mapping-v0.md'`).
   - Locked behind an **Aether Fog Seal** in-game so stepping toward its threshold from the Bog displays an engine seal notice (`[UNDEFINED SPEC · mapping-v0.md] M01 Orc Encampment is veiled in impenetrable Aether Fog`) and routes into a fog loop rather than entering unfinalized content.
4. **`CAMELOT INTERIOR` (`camelot_interior`, `UNDEFINED`)**:
   - Marked `specStatus: 'UNDEFINED'` (`docRef: 'worlds.md §1'`).
   - The **Deep Dungeon (`OD-BT-01`)** and **Camelot Interior Waygate** remain sealed behind their `UNDEFINED` spec barriers (`[UNDEFINED SPEC · OD-BT-01] Deep Dungeon & Camelot Interior Waygate sealed`), while still allowing the player to inspect the Dungeon Entrance and acquire the Camelot Waygate Key milestone in Border Town.

---

## 3. In-Game Lockouts & Satchel `u00 Universe` Inspector (`worldSystem.ts`, `OrionSatchel.tsx`)

- **Metadata Extensions (`types.ts`)**:
  - Add `specStatus?: 'LOCKED' | 'UNDEFINED'`, `docRef?: string`, `openDesignId?: string` (e.g., `'OD-BOG-01'`, `'OD-BT-01'`), and `zoneFeatures?: Array<{ name: string; status: 'LOCKED' | 'UNDEFINED'; openDesignId?: string }>` to `AreaWikiDefinition` and `MapDefinition`.
- **Aether Fog & Waygate Seal Enforcement (`worldSystem.ts`)**:
  - Stepping into a doorway or interacting with a gate/waystation/waygate that leads into an Area or Map with `specStatus === 'UNDEFINED'` (`m01_orc_encampment`, `OD-BT-01` Deep Dungeon / `camelot_interior`, or non-Belldor Waygate destinations) blocks entry with a clear lore/spec banner (`SEALED BY AETHER FOG · UNDEFINED ZONE SPEC`) and diverts perimeter travel into a `loop` node.
- **Satchel World & Universe Tab (`OrionSatchel.tsx`)**:
  - Add a **`u00 Universe` Catalog view** showing:
    - **Major Worlds (1–8)** with `CANON (Original Story)` vs. `NON-CANON (Folklore / Mythology)` badges and `LOCKED` vs. `UNDEFINED` spec status.
    - **Belldor Zone Breakdown** (`M00 THE BOG`, `CAMELOT BORDER TOWN`, `M01 ORC ENCAMPMENT`, `CAMELOT INTERIOR`) including open design tags (`OD-BOG-01`, `OD-BT-01`, `mapping-v0.md`).
    - **Minor Worlds (7)** & **Unstable Worlds (5)** listed under their canonical tiers as `UNDEFINED`.
