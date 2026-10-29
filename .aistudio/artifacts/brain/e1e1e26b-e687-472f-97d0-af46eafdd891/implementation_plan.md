# Debugger `.split()` Crash Fix, Solid Wall Fallback & Enemy Engagement Overhaul

This plan resolves the `Cannot read properties of undefined (reading 'split')` crash shown in the Minuteman Debugger screenshot, introduces a solid wall-tile (`#`) fallback for all ungenerated tiles and room-padding cells across the Unified Bog Grid, overhauls enemy engagement with finite aggro range, line-of-sight checks, and wall collision, and establishes a protected Sanctuary Zone around the Drop-Pod Impact Crater (`-3,0`) and First Campfire (`0,0`).

## User Review & Critical Decisions

> [!IMPORTANT]
> **Root Cause Found from Your Minuteman Debugger Screenshot (`Cannot read properties of undefined (reading 'split')`)**:
> 1. In `resolveChunkBlueprint`, `chunkHash` is a 32-bit unsigned integer (`0 .. 4,294,967,295`), but lines 678, 689, 693, and 706 used **signed right-shift (`>>`)** instead of **unsigned right-shift (`>>>`)**. Whenever `chunkHash >= 0x80000000` (50% of chunks), `(chunkHash >> 7) % elitePool.length` evaluated to a negative index (`-1`, `-2`, or `-3`), making `typeC` evaluate to `undefined` and crashing on `typeC.split('_')[0]` during `orion update`.
> 2. Because `state` persists across cartridge restarts and `state.generatedChunks[chunkKey]` was not marked complete before the throw, re-launching the cartridge immediately re-ran `updateChunkedRoomStreaming` on the same chunk and threw the identical error during `orion init`.

- **Confirmed Decision 1 — Fix Signed Bit-Shift & Harden All `.split()` Calls**: Replace all signed bit-shifts (`>>`) on `chunkHash` with unsigned shifts (`>>>`), add null-safe string guards on every `.split()` call across the world/chunk systems, and ensure `init()` safely recovers if a previous session halted mid-stream.
- **Confirmed Decision 2 — Solid Wall (`#`) Fallback & Doorway Alignment**: All ungenerated expanse grid cells and `20×18` room-padding margins around smaller authored rooms (`16×12`, `18×13`, `20×15`) default to solid walls (`#`). Causeway openings (`:`) are carved only where the authored room actually has an open doorway or where a Set-Path Corridor connects.
- **Confirmed Decision 3 — Enemy Aggro Range, Line-of-Sight, Wall Collision & Safe Spawn Sanctuary**: All Belldor enemies enforce finite detection range, tile line-of-sight raycasting (blocked by `#` and closed gates `G`), and axis-separated wall collision (`moveEntityX` / `moveEntityY`). Zero off-path ambush spawns occur in chunks adjacent to the Drop-Pod (`-3,0`) and First Campfire (`0,0`), a `3.0s` spawn grace timer protects the player upon arrival, and baseline enemy counts are reduced (`0–1` on Set-Path Corridors, `1–2` in shallow off-path fog chunks).

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Eliminates the `.split()` Debugger Crash**: Fixes negative modulo indexing on 32-bit chunk hashes (`>>>` vs `>>`) and hardens all coordinate/grid `.split()` helpers so neither `orion update` nor `orion init` can ever dereference `undefined`.
  2. **Solid Wall (`#`) Fallback**: Seals ungenerated expanse regions and `20×18` room-padding margins with solid `#` walls, opening `:` causeways strictly at real doorways.
  3. **Tactical Enemy Engagement & Safe Spawn Zone**: Stops enemies from aggroing across rooms or phasing through solid `#` walls, clears adjacent off-path chunks around `-3,0` and `0,0`, and lowers baseline enemy density.
- **Target Audience / Persona**: Players exploring M00 The Bog who expect crash-free streaming into deep fog, solid physical room walls, and fair room-by-room combat pacing.
- **Key Value**: Resolves the blocker crash immediately while fixing the two core gameplay issues (wall fallback and immediate spawn ambushes).

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Booting & Streaming Deep Fog Without Crashes**: Launching Orion (`orion init`) and walking into any Off-Path Fog or Deep-Fog Dungeon chunk (`orion update`) cleanly resolves enemy pools and tile matrices without negative-modulo `undefined` lookups.
  2. **Spawning at the Drop-Pod (`-3,0`)**: The player awakens inside a sealed crater enclosure surrounded by solid `#` walls, with a sole eastern exit leading toward `-2,0`. A `3.0s` spawn grace period is active, and adjacent off-path chunks around `-3,0` and `0,0` spawn zero enemies.
  3. **Traversing Room Perimeters & Doorways**: Smaller authored rooms (`16×12`) stamped into `20×18` (`2×2` chunk) footprints have their outer padding filled with solid `#` walls rather than open mud (`,`), with 4-tile causeways (`:`) carved strictly where the room's authored doorway opens.
  4. **Encountering Enemies**: Enemies remain in an unalerted idle/patrol state until the player steps within their detection radius (`80–115 px`) with unobstructed line-of-sight, and respect solid `#` walls during movement and lunges.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Dark retro-futuristic 16-bit action-RPG (`#0d1410` bog slate, `#2a382f` mire stone walls `#`, `#6a5a44` ancient causeway `:`).
  - *Interactive Feedback & Motion*: Enemies display subtle wall-colliding patrol movement prior to aggro and only trigger combat windups when within range and line-of-sight.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Unsigned Bit-Shift (`>>>`) & Null-Safe `.split()` Guards**
  - *Chosen Approach*: Convert `chunkHash >> n` to `chunkHash >>> n` in `resolveChunkBlueprint`, guard `typeC`, and add defensive string fallbacks (`String(val || '')`) before `.split()` in `finalizeChunkGridBorders`, `parseCoordPair`, `getKeyBorderBranchType`, and room transition helpers.
  - *Why*: JavaScript's `>>` preserves the sign bit of 32-bit hashes `>= 2^31`, producing negative remainders with `%` and returning `undefined` from array lookups.
- **Decision 2: Solid Wall (`#`) Default for Unfilled Grid Spots & Room Padding**
  - *Chosen Approach*: Initialize ungenerated expanse cells to `'#'`, fallback any missing character during chunk stitching to `'#'`, and fill the `20×18` stamp buffer in authored room stamping with `'#'` before stamping the room interior and carving doorway channels.
  - *Why*: Guarantees players and entities can never walk into uninitialized void space or bypass authored room walls through mud padding.
- **Decision 3: Line-of-Sight Raycast + Axis-Separated Wall Collision + Sanctuary Zone**
  - *Chosen Approach*: Provide a shared `canEnemyDetectPlayer(rooms, state, e, baseAggroRadius)` helper that checks distance, spawn grace timer, and stepped tile raycasting against solid wall tiles (`#`, closed `G`), paired with `moveEntityX` / `moveEntityY` on all enemy movement vectors and zero off-path spawns adjacent to `-3,0` and `0,0`.
  - *Why*: Prevents enemies in neighboring chunks or behind walls from detecting or walking through solid geometry to attack the player.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     UNIFIED BOG GRID (26×18 Chunks)                      │
├────────────────────────┬─────────────────────────┬───────────────────────┤
│  Hash & .split() Guard │  Wall (#) Fallback      │  Enemy Engagement AI  │
│                        │                         │                       │
│ • chunkHash >>> n      │ • Unfilled expanse &    │ • Sanctuary Buffer    │
│   unsigned shifts      │   20×18 room padding    │   around (-3,0)/(0,0) │
│ • Safe string guards   │   default to '#'        │ • 3.0s Spawn Grace    │
│   on all .split()      │ • Doorway detector only │ • Line-of-Sight +     │
│   calls in init/update │   opens true exits ':'  │   moveEntityX/Y walls │
└────────────────────────┴─────────────────────────┴───────────────────────┘
```

- **Data Model & State**:
  - **Unsigned Chunk Hash Indexing**: All array index derivations from `chunkHash` use `(chunkHash >>> shift) % array.length`.
  - **Wall Fallback**: Any unfilled cell (`undefined`, `' '`, or unstreamed chunk cell) resolves to `'#'`.
  - **Doorway Detection**: Inspects the authored room's N/S/E/W edges and `SET_PATH_CORRIDOR_BY_CHUNK` adjacency before carving a 4-tile causeway through the `#` padding.
  - **Enemy Engagement State**: Enemies evaluate `canEnemyDetectPlayer(rooms, state, e, radius)` each tick and move via `moveEntityX` / `moveEntityY` so solid `#` walls block movement across all Belldor enemy types.
