# Project Orion — Codebase Housekeeping & Modular Architecture Plan

This housekeeping pass refactors Project Orion's database, gameplay systems, and tactical UI from monolithic files into clean, domain-aligned modules while eliminating duplicate hardware definitions, legacy item aliases, and obsolete directory shims.

## User Review & Critical Decisions

> [!IMPORTANT]
> All four housekeeping tracks and structural preferences were confirmed during interactive clarification. Review the architectural boundaries below before execution begins.

- **Confirmed Decision 1 (Full Housekeeping Scope)**: Execute all four tracks: (1) reorganize database domains for equipment, items, and enemies; (2) split monolithic UI and system engines into focused sub-modules; (3) clean up legacy state fields, dead code, and duplicate definitions; and (4) update the authoring documentation to reflect the canonical architecture.
- **Confirmed Decision 2 (Slot-Based Equipment Architecture & Deduplication)**: Decompose the monolithic hardware catalog into dedicated slot domains (Head/Optics, Arms, Legs, Coreplate/Plating, Reactors, Sensory Arrays, Auxiliaries, Utilities, and Weapons) and remove duplicate coreplate definitions.
- **Confirmed Decision 3 (Direct Equipment Weapon Resolution)**: Migrate all weapon imports across systems and UI directly to the equipment domain and remove the legacy top-level weapons forwarding directory.

---

## 1. Overview & Core Concept

- **What It Does**: Establishes a clean, single-source-of-truth architecture across Project Orion's data registries, simulation systems, and tactical interface without altering canonical Belldor gameplay mechanics, combat laws, or visual fidelity.
- **Target Audience / Persona**: Game designers, world authors, and engineers extending Project Orion with new worlds, mechs, equipment, enemies, and quests.
- **Key Value**: Eliminates multi-thousand-line monolithic files, prevents data drift from duplicate definitions, removes superseded item/weapon shims, and makes authoring new content predictable and self-contained.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  - **Tactical Satchel & Loadout Flow**: Pilots open the Satchel (`LOADOUT`, `MECH STATUS`, `FEATS & MODS`, ` GEM POUCH`, `WORLD & CODEX`), inspect their live composite mech sprite (`Head + Arms + Coreplate + Weapon`), and swap hardware or weapons with immediate visual and stat feedback.
  - **Field Exploration & Combat Flow**: Seamless 60fps top-down 2.5D rendering with Three Defense Layers HUD (Shields, Armor, Frame Integrity), reactor heat management, and Aether Fog navigation.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Tactical retro-futuristic Magitech console UI paired with crisp 2.5D pixel-art canvas rendering.
  - *Color Palette & Mood*: Following the 60-30-10 discipline — 60% deep obsidian/slate tactical surfaces (`#05070a`, `#090d14`, `#0f172a`), 30% structural frame panels and metallic borders (`#1e293b`, `#334155`), and 10% high-contrast telemetry accents (Shield Cyan `#38bdf8`, Armor Amber `#facc15`, Critical Crimson `#ef4444`, Ichor Orange `#f97316`, Emerald Restoration `#10b981`).
  - *Typography & Hierarchy*: Crisp monospace pixel/tactical typography with tabular numerals (`tabular-nums`) for all defense layer meters, damage readouts, and stat comparisons; single-line controls (`whitespace-nowrap shrink-0`) with unboxed metadata separators (`·`).
  - *Component Styling & Layout*: Unobtrusive HUD framing the viewport without obscuring combat; modular Satchel tabs with clear active states and zero dead controls.
- **Interactive Feedback & Motion**: Instantaneous equipment swap previews on the composite mech canvas, crisp Web Audio synthesized sound cues on menu and combat actions, and smooth compositor transitions.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Slot-Specific Hardware Modules as Single Source of Truth**
  - *Chosen Approach*: Partition chassis hardware into dedicated slot modules (Head, Arms, Legs, Plating, Reactors, Sensory, Auxiliaries, Utilities, Weapons) that auto-register into the unified Equipment & Hardware Registry, eliminating redundant array declarations.
  - *Why*: Previously, coreplates were defined in both a plating module and the general chassis hardware catalog. Consolidating each slot into its own domain guarantees zero stat drift and pairs each piece's combat stats directly with its composite sprite theme.
  - *Alternatives Considered*: Keeping a single monolithic hardware catalog file was rejected by user preference because it scales poorly as new worlds and manufacturers are added.
- **Decision 2: Decomposing Monolithic UI & Gameplay Engines by Responsibility**
  - *Chosen Approach*: Break up the ~3,200-line Satchel UI into tab-focused sub-components (Loadout View, Mech Status View, Feats & Gems View, World & Codex View, and Shared Sprite Canvases) and modularize the 3,300–4,300 line system engines (separating HUD/lighting passes from world rendering, and separating Aether Fog graph generation from room interaction logic).
  - *Why*: Improves maintainability, isolates rendering and state-mutation concerns, and keeps barrel exports clean so external callers require zero breaking signature changes.
  - *Alternatives Considered*: Leaving systems as 4,000-line single files was rejected as it impedes readability and future feature work.
- **Decision 3: Eradicating Superseded Item Aliases & Legacy Shims**
  - *Chosen Approach*: Remove legacy `repair_kit` alias shims, standardize currency pickups around Belldor Trade Coins (`currency`), organize enemies by region/faction (Belldor Bog, Orc Raiders, Camelot Knights, Town NPCs), and categorize items into Consumables, Gemstones, Currency, and Regional Quest items.
  - *Why*: Ensures every ID in the runtime state corresponds strictly to canon lore and eliminates dead fallback branches.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        PROJECT ORION RUNTIME STATE                         │
│     Pilot Profile · Equipment Slots · Defense Layers · World & Fog Graph   │
└──────────────────┬──────────────────────────────────────┬──────────────────┘
                   │                                      │
                   ▼                                      ▼
┌─────────────────────────────────────┐ ┌────────────────────────────────────┐
│      MODULAR DATABASE REGISTRIES    │ │       MODULAR GAMEPLAY SYSTEMS     │
│                                     │ │                                    │
│ ┌─────────────────────────────────┐ │ │ ┌────────────────────────────────┐ │
│ │ Equipment Domain                │ │ │ │ Player & Sprite System         │ │
│ │  ├─ Weapons (Lineage Builders)  │ │ │ │  ├─ Composite Mech Renderer    │ │
│ │  ├─ Plating (Coreplates)        │ │ │ │  ├─ Capability & Gate Sync     │ │
│ │  ├─ Head & Optics               │ │ │ │  └─ Movement & Physics         │ │
│ │  ├─ Arms & Actuators            │ │ │ └────────────────────────────────┘ │
│ │  ├─ Legs & Striders             │ │ │ ┌────────────────────────────────┐ │
│ │  ├─ Reactors & Storage          │ │ │ │ Combat & Action System         │ │
│ │  ├─ Sensory Arrays (A & B)      │ │ │ │  ├─ 3-Layer Damage Resolution  │ │
│ │  └─ Auxiliaries & Utilities     │ │ │ │  ├─ Weapon Stances & Skills    │ │
│ └─────────────────────────────────┘ │ │ │  └─ Enemy AI & Boss Trials     │ │
│ ┌─────────────────────────────────┐ │ │ └────────────────────────────────┘ │
│ │ Items Domain                    │ │ │ ┌────────────────────────────────┐ │
│ │  ├─ Consumables (Gem Flasks)    │ │ │ │ World & Aether Fog System      │ │
│ │  ├─ Gemstones (9 Canonical)     │ │ │ │  ├─ Aether Graph Generator     │ │
│ │  ├─ Currency (Trade Coins)      │ │ │ │  ├─ Room & Cache Interactions  │ │
│ │  └─ Quest / Belldor Relics      │ │ │ │  └─ Contextual Loot Resolver   │ │
│ └─────────────────────────────────┘ │ │ └────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │ │ ┌────────────────────────────────┐ │
│ │ Enemies Domain (Regional)       │ │ │ │ Render & Lighting System       │ │
│ │  ├─ Belldor Bog Fauna           │ │ │ │  ├─ 2.5D Room & Prop Renderer  │ │
│ │  ├─ Orc Siege Raiders           │ │ │ │  ├─ Weather & Bloom Pass       │ │
│ │  └─ Camelot Knights & Town      │ │ │ │  └─ Canvas HUD Overlay         │ │
│ └─────────────────────────────────┘ │ │ └────────────────────────────────┘ │
└──────────────────┬──────────────────┘ └─────────────────┬──────────────────┘
                   │                                      │
                   └──────────────────┬───────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        TACTICAL UI & SATCHEL SHELL                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │ Loadout &    │ │ Mech Status  │ │ Feats, Mods  │ │ World Map, Wiki   │  │
│  │ Composite    │ │ & Defense    │ │ & Gemstone   │ │ Codex & Dev       │  │
│  │ Mech Preview │ │ Telemetry    │ │ Crafting     │ │ Inspector         │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └───────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State Cleanup

- **Unified Equipment & Hardware Resolution**:
  - Every hardware slot (`head`, `arms`, `legs`, `plating`, `reactor`, `sensoryA`, `sensoryB`, `aux3`, `aux4`) and weapon slot (`slot1`, `slot2`, `slot3`, `utility`, `belt`) resolves from its dedicated domain module in the Equipment Registry.
  - Duplicate coreplate definitions between the general hardware catalog and the plating module are unified so `CANONICAL_HARDWARE_CATALOG` derives its `plating` entries directly from `CANONICAL_COREPLATES`.
- **Clean Item & Enemy Taxonomy**:
  - Items are grouped into logical sub-domains: `consumables` (Gem Flasks, Booster Kit), `gemstones` (the 9 canonical gemstones), `currency` (Belldor Trade Coins), and `quest/belldor` (signet ring, cryptic list, keys, relics, grail artifacts).
  - Legacy `repair_kit` fallback shims and dead item references are removed from state initialization and registries.
  - Enemies are grouped into regional/faction sub-domains under the enemy registry while preserving auto-discovery.

### Interactive Component & State Mapping

- **Loadout Sub-View**: Handles slot selection (`slot1`, `slot2`, `slot3`, `head`, `arms`, `legs`, `plating`, `reactorCore`, `sensoryA`, `sensoryB`, `aux3`, `aux4`, `utility`, `belt`), triggers `syncStateGates(state)`, and immediately re-renders the `CompositeMechPreviewCanvas` and active weapon stance skills (`ac1`–`ac5`).
- **Mech Status & Progression Sub-Views**: Handle gemstone funding into pilot skills, feat socketing, and real-time calculation of Layer 1 Shield Capacity, Layer 2 Armor Threshold/Rating/Durability, and Layer 3 Frame Integrity.
- **World & Codex Sub-Views**: Provide interactive fast-travel to discovered Waystations/Waygates, live Aether Fog graph inspection, and dynamically populated Codex entries for all registered Equipment, Weapons, Items, Enemies, and Biomes.
- **Authoring Documentation Synchronization**: Update `AUTHORING_GUIDE.md` so all documented domain structures, weapon/equipment registration instructions, and quest item templates accurately reflect the cleaned-up architecture.
