# Frame Plating Slot Rename & Modular 3-Piece (64×16) Mech Sprite System

Renames the **Core Plate / Coreplate** slot and terminology to **Frame Plating** across the equipment database, UI, and progression system, and upgrades the player mech composite renderer and equipment schemas to support an extensible catalog of **12+ sets of 3 aligned sprite pieces** (`Head`, `Shoulders/Arms`, `Torso/Legs`), where each piece is a **4-frame (`64×16 px`, four `16×16 px` frames) walk/idle animation strip**.

## User Review & Critical Decisions

> [!IMPORTANT]
> All three Phase 1 clarifications have been incorporated into this architecture:
> 1. **4-Frame (`64×16 px`) Strip Format**: Each part sprite is a 4-frame (`16×16 px` per frame) walk/idle animation strip aligned on a shared `16×16` canvas origin.
> 2. **3 Visual Sprite Pieces Mapped to Equipment Slots**:
>    - **Torso / Legs Layer**: Driven by the **Frame Plating** (`plating`) slot.
>    - **Shoulders / Arms Layer**: Driven by the **Arms** (`arms`) slot.
>    - **Head Layer**: Driven by the **Head** (`head`) slot.
> 3. **12 Baseline Sets + Extensible Registry**: The equipment catalog and sprite resolver are structured for 12 baseline sets of 3 pieces each (`head`, `arms`, `plating`) with zero hardcoded enum limits so additional sets drop in seamlessly.

- **Confirmed Decision 1**: Rename `Coreplate` / `Core Plate` / `Core Frame` slot labels and terminology to **Frame Plating** (`FramePlatingDefinition`, `CANONICAL_FRAME_PLATING`), while preserving backward compatibility for saved games.
- **Confirmed Decision 2**: Each of the 3 visual equipment slots (`plating` for Torso/Legs, `arms` for Shoulders/Arms, `head` for Head) supports a `partSprite` (`64×16 px` Base64 PNG strip, `4` frames × `16×16 px`) and procedural/offscreen-baked 4-frame `64×16` fallback strips for all 12 baseline sets until custom PNG strips are pasted in.

---

## 1. Overview & Core Concept

- **What It Does**:
  - Standardizes the primary chassis armor slot name to **Frame Plating** across all equipment definitions, UI labels, synergy categories, and feat prerequisite descriptions.
  - Establishes a data-driven **3-Layer × 4-Frame (`64×16 px`) Composite Mech Sprite Pipeline** where equipping any **Frame Plating** (Torso/Legs), **Arms** (Shoulders/Arms), or **Head** piece renders its aligned `16×16` frame (`col 0` when idle, `cols 0..3` cycling during movement) both in the 2.5D game world and in the Satchel Mech Status / Loadout preview.
- **Target Audience / Persona**: Players customizing their mech build in Project Orion and content authors dropping new `64×16` PNG part strips into equipment entries.
- **Key Value**: Pixel-accurate `16×16` alignment across all 3 body layers (`Torso/Legs`, `Shoulders/Arms`, `Head`) and effortless expansion from the 12 baseline sets to any number of future armor sets.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Satchel Loadout & Inventory**: The armor slot is labeled **Frame Plating** (`FRAME PLATING`). Filtering or editing the slot shows all 12 baseline Frame Plating items (plus any future additions), alongside the 12 Head items and 12 Arms items.
  2. **Live 3-Piece Composite Mech Preview & In-World Rendering**:
     - Swapping **Frame Plating** immediately updates the **Torso / Legs** `16×16` layer.
     - Swapping **Arms** immediately updates the **Shoulders / Arms** `16×16` layer.
     - Swapping **Head** immediately updates the **Head** `16×16` layer.
     - Standing still displays frame `0` (or gentle idle cadence); moving cycles smoothly across frames `0 → 1 → 2 → 3` of the `64×16` strip, with automatic horizontal flip when facing West.
- **Visual Identity & Theme**: Crisp `16×16` pixel-art alignment (`imageSmoothingEnabled = false`) with 1px silhouette outline caching and directional weapon hardpoint layering.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Open String `spriteSetId` + Direct `partSprite` (`64×16` Strip) on Hardware Items**
  - *Chosen Approach*: Replace the closed 6-value union in `playerSpriteSystem.ts` with an open, data-driven lookup that checks `item.partSprite` (`64×16` Base64 PNG strip or pre-baked `64×16` canvas atlas) on the equipped `plating`, `arms`, and `head` definitions.
  - *Why*: Supports 12 baseline sets immediately and allows sets `13+` to be added simply by adding a new item entry in `plating/`, `arms/`, or `head/` without touching renderer code.
- **Decision 2: Backward-Compatible Rename to Frame Plating**
  - *Chosen Approach*: Update all display names, slot labels (`canonicalSlotLabel: 'Frame Plating'`), synergy filter labels (`'Frame Plating & Defense'`), and exports (`CANONICAL_FRAME_PLATING`, with `CANONICAL_COREPLATES` kept as a deprecated alias for internal imports), and match both `'Frame Plating'` and legacy `'Coreplate'` strings when loading existing pilot saves.
  - *Why*: Ensures zero broken saves or feat prerequisite checks while completing the terminology transition everywhere players and authors interact with the system.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌─────────────────────────────────────────────────────────────────────────┐
│                EQUIPMENT CATALOG (12+ Baseline Sets)                    │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌───────────────────┐  │
│  │   Frame Plating     │ │    Arms (12+ Sets)  │ │  Head (12+ Sets)  │  │
│  │   (Torso / Legs)    │ │  (Shoulders / Arms) │ │   (Head / Helm)   │  │
│  │ 64x16 Strip (4x16)  │ │ 64x16 Strip (4x16)  │ │ 64x16 Strip (4x16)│  │
│  └──────────┬──────────┘ └──────────┬──────────┘ └─────────┬─────────┘  │
└─────────────┼───────────────────────┼──────────────────────┼────────────┘
              │                       │                      │
              ▼                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             COMPOSITE MECH SPRITE RENDERER (16x16 Aligned)              │
│  Frame Index: isMoving ? floor(t * 8) % 4 : 0  (srcX = frame * 16)      │
│  Layer 1 (Bottom): Frame Plating (Torso / Legs) 16x16 @ (0,0)           │
│  Layer 2 (Middle): Arms (Shoulders / Arms)      16x16 @ (0,0)           │
│  Layer 3 (Top):    Head (Helm / Dome / Visor)   16x16 @ (0,0)           │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌───────────────────────────┐   ┌─────────────────────────────────────────┐
│   2.5D World Render Pass  │   │  Satchel Mech Preview (SatchelCanvases) │
│  + Weapon Hardpoint Layer │   │  Live 4-Frame Walk/Idle Preview Toggle  │
└───────────────────────────┘   └─────────────────────────────────────────┘
```

- **Data Model & State**:
  - `MechPartSpriteStripConfig`: `{ base64?: string; atlasId?: string; frameCount?: 4; cellWidth?: 16; cellHeight?: 16 }` attached to `CanonicalHardwareItemDefinition` for `plating`, `arms`, and `head`.
  - Baseline 12 sets across `database/equipment/plating/`, `database/equipment/arms/`, and `database/equipment/head/`, each pre-configured with its `setIndex` (`0..11`) and `64×16` (`4 × 16×16`) sprite strip slot ready for custom Base64 PNG strings.
- **Interactive Component & State Mapping**:
  - `OrionSatchel.tsx` and `SatchelCanvases.tsx` display `FRAME PLATING` in all slot headers, filters, and feat synergy badges, and render the 3 aligned `16×16` layers directly from the equipped `plating`, `arms`, and `head` items.
