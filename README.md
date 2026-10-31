# Project Orion & Minuteman Virtual Handheld Engine

**Project Orion** is a tactical 2.5D top-down mech-fantasy action RPG running on the **Minuteman** modular virtual handheld console engine. Set across the fractured worlds of `u00` orbiting the chthonic singularity **Sin**, pilots navigate oppressive, mist-choked biomes, attune Æther Waystations and Colossal Waygates, customize multi-layer chassis loadouts (`Shields → Armor → Frame`), and master weight-and-stability impulse physics.

---

## 🎮 Controls (Project Orion)

| Input | Handheld Pad | Keyboard Key | Tactical Action |
| :--- | :--- | :--- | :--- |
| **Move / Aim** | 8-Way D-Pad / Stick | `WASD` / `Arrow Keys` | 8-directional Magic-Current glide movement and directional facing. |
| **A** | Face Button A | `Z` / `Space` | **Interact / Jump**: Context interaction at Campfires, Waygates, Caches, and NPCs; vertical jump when clear. |
| **B** | Face Button B | `X` / `Shift` | **Booster Dash / Continuous Boost**: Tap for a high-impulse directional dash; hold to sustain continuous boost (generates reactor heat). |
| **X** | Face Button X | `C` / `J` | **Skill 1 / Skill 2**: Tap for primary weapon salvo/combo (`ac1`); hold for primary weapon special (`ac2`). Double-tap for tactical reload. |
| **Y** | Face Button Y | `V` / `K` | **Skill 3 / Skill 4 (Block)**: Tap for heavy tactical skill (`ac3`); hold to raise directional guard (`ac4`, `0.25s` perfect block window). |
| **R** | Right Trigger | `E` / `I` | **Skill 5 / Utility**: Tap to trigger paired/off-hand/utility skill (`ac5`). |
| **L** | Left Trigger | `Q` / `U` | **Auxiliary Swap / Target Lock**: Tap to cycle target lock (`SELECT` also cycles lock); hold to swap auxiliary/side loadout. |
| **SHIFT** | Pill Button | `Tab` / `Backspace` | **Pilot Satchel**: Opens **Mech Status**, **Loadout**, **Inventory**, **Hex Feat Tree**, **Cosmic World Map (`u00`)**, and **Pilot Codex**. |
| **START** | Pill Button | `Enter` | **System Menu**: Opens game settings, HUD mode toggle, save/load, **Pilot Codex**, and the **Orion Code Wiki**. |

---

## 🧭 Key Systems & Architecture

```text
src/
├── engine/
│   ├── core/                 # Frame loop, cartridge runner, Web Audio chiptune synthesizer
│   └── input/                # Normalized stick vectors, edge detection, keyboard & haptics
├── cartridges/
│   ├── orion/                # Project Orion cartridge
│   │   ├── constants.ts      # Viewport metrics, physics constants, Aether routing helpers
│   │   ├── types/            # Domain schemas (combat, equipment, entities, world, state)
│   │   ├── database/         # Canonical weapons, mods, gems, hex feats, u00 worlds & tiles
│   │   ├── systems/          # Player glide, inertia physics, combat, chunk streaming, renderer
│   │   ├── ui/               # HUD overlays, Pilot Satchel tabs, Living Aether Cosmos, Codex
│   │   └── docs/             # Markdown documentation linked via [ORION-ANCHOR] tags
│   └── knight/               # Bonus Metroid-Souls side-scrolling action cartridge
└── components/               # Virtual handheld shell, integer-scaled canvas & tactile controls
```

### Highlights
- **3-Layer Defense & Classical Impulse Inertia (`systems/inertiaSystem.ts`)**:
  - Damage cascades through **Shields** (regenerating energy barrier), **Armor** (physical mitigation + durability), and **Frame Integrity** (`200` base).
  - Hits resolve via classical momentum transfer (`Δv = J / m_eff`) against defender **Weight (`m`)**, directional charge (`μ`), and **Stability (`S`)** across four outcome bands (`none`, `flinch`, `stagger`, `knockback`).
- **Oppressive Cursed-Bog Lighting (`systems/render/effectsRenderer.ts`)**:
  - Multi-stop cold bog penumbra, radial shadow cones cast behind trees and ruins, drifting ground miasma ribbons, and suspended spore motes illuminated within the player's lantern cone.
- **Living Æther Cosmic World Map (`ui/satchel/AetherCosmosCanvas.tsx`)**:
  - Real-time procedural canvas simulation of the `u00` universe: **Sin** churns at the central gravitational vortex while Major (`1–8`), Minor (`1–7`), and Unstable/Drift worlds orbit along swirling Æther currents.
- **Discovery-Gated Pilot Codex (`ui/satchel/SatchelCodexTab.tsx`)**:
  - In-game field encyclopedia that reveals lore, stats, and schematics only as worlds, areas, weapons, chassis mods, gemstones, feats, and enemies are discovered during play.
- **Orion Code Wiki (`scripts/build-index.mjs` & `/wiki/`)**:
  - Zero-dependency AST/regex indexer that cross-references every source file, export, JSDoc block, and `// [ORION-ANCHOR: <ID>]` tag against `src/cartridges/orion/docs/*.md`.
  - Accessible standalone at `/wiki/` or directly inside the Start Menu via **📖 Code Wiki**.

---

## 💻 Local Development & Scripts

```bash
# Install dependencies
npm install

# Start development server (regenerates public/wiki index automatically)
npm run dev

# Regenerate and strictly validate the Orion Code Wiki index & [ORION-ANCHOR] tags
npm run wiki

# Type-check the codebase
npm run lint

# Build production bundle (verifies strict wiki anchors and outputs dist/ + dist/wiki/)
npm run build
```
