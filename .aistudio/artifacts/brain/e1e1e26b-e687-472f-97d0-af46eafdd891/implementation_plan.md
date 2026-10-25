# Project Orion — Lore-Corrected Index & Æther Fog Depth Mechanics (`clvl + 1`)

This update replaces `Project Orion — Index.md` with the new lore-corrected field guide and updates the in-game Æther Fog engine, multi-room depth tiers, max-depth boss frequency, and enemy/loot depth scaling.

## User Review & Critical Decisions

> [!IMPORTANT]
> Summary of confirmed rules from user feedback:
> - **Replace `Index.md` & Align In-Game Fog Mechanics**: Replace `src/cartridges/orion/Project Orion — Index.md` with the updated lore guide and update the runtime Æther Fog system to match.
> - **Max Depth (`maxDepth = clvl + 1`)**: Maximum fog depth equals `character level + 1` (e.g., at Level 4, `maxDepth = 5`). Enemy stats and loot/gemstone drops scale with depth up to `clvl + 1`.
> - **Rooms Per Depth Tier (`d` rooms at Depth `d`)**: Each depth `d` (`1 <= d < maxDepth`) consists of `d` rooms that are traversed/cleared before advancing to depth `d + 1` (e.g., `1` room at Depth 1, `2` rooms at Depth 2, `3` rooms at Depth 3 before reaching Depth 4).
> - **Retracing Before Max Depth**: If the player turns back (`returnDir`) and leaves the fog before reaching `maxDepth`, they can retrace their steps through previously visited rooms (which remain as safe as they were left) back to the main path.
> - **Unlocked Boss Rooms & `1 / (clvl + 1)` Boss Spawn Frequency at Max Depth**:
>   - Once at `maxDepth = clvl + 1`, the player cannot simply walk back out; doorways at `maxDepth` cycle into random `maxDepth` rooms.
>   - **Boss room doors do not lock**: the player may freely flee from a boss room into another random `maxDepth` room.
>   - **Boss spawn frequency at `maxDepth` is `1 / (clvl + 1)`** (e.g., at `clvl = 4`, `maxDepth = 5`, frequency = `1/5 = 0.2`, or 1 in 5 rooms at `maxDepth`).
>   - **Defeating a Boss Clears the Fog**: Defeating a boss at `maxDepth` clears the fog, awards/collects the boss's scaled drops, and returns the player to the last place they stood on the main path (`anchorSafeNodeId`). If the player does not defeat a boss, they must find and defeat one to escape `maxDepth` without dying.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. Updates `Project Orion — Index.md` with the canonical **Part III — The Æther Fog** section (*Density*, *The path*, *Going deeper*, *The Lantern*) and the **Stage 1: The Bog** distinction between corrosive bog water and the Æther fog.
  2. Reworks `loop` (Deep Fog) traversal into a **tiered depth progression (`Depth 1 → 2 → … → clvl + 1`)**:
     - **Depth Tier Room Counts (`d` rooms at Depth `d`)**:
       - Depth 1 has `1` room (`1/1`) before Depth 2.
       - Depth 2 has `2` rooms (`1/2 → 2/2`) before Depth 3.
       - Depth 3 has `3` rooms (`1/3 → 2/3 → 3/3`) before Depth 4, and so on up to `maxDepth = clvl + 1`.
     - **Retracing Steps (`Depth < clvl + 1`)**: Before reaching `maxDepth`, stepping through `returnDir` retraces your exact path backward room-by-room (`(d, step) → (d, step - 1)` or `(d - 1, d - 1)`) all the way back to `anchorSafeNodeId` on the main path. Cleared rooms along your return path stay safe.
     - **Max Depth (`Depth === clvl + 1`) & `1 / (clvl + 1)` Boss Spawn Rate**:
       - At `maxDepth`, doorways never lock—the player can run from any room (including a boss room) into another random `maxDepth` room, but cannot exit the fog until a Fog Boss is slain.
       - Each `maxDepth` room has a `1 / (clvl + 1)` probability (1 in `clvl + 1` rooms) of spawning a Fog Boss.
       - Defeating a Fog Boss at `maxDepth` immediately clears the fog, collects/awards the boss drops, and returns the pilot to `anchorSafeNodeId` on the main path.
     - **Depth-Scaled Enemies & Loot Drops (`1 .. clvl + 1`)**: Enemy defenses, damage, speed, salvage scrap counts, item drop rates, and gemstone drop probabilities scale with current fog depth up to `clvl + 1`.
     - **Bog Water vs. Æther Fog Separation**: Corrosive water (`~`) is governed strictly by the biome (`corrosiveWater: true` in Bog/Wetland biomes), while Æther Fog depth scales mist density, phase-desync frequency, terrain obstacles, and enemy aggression.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  - **Stepping Through Multi-Room Depth Tiers (`Depth d, Room k/d`)**:
    - Forward doorways emit drifting Æther density motes (`increasesDensity: true`) whenever stepping through advances toward deeper fog.
    - While `Depth < clvl + 1`, the player can retrace their steps via `returnDir` at any time to exit safely back to the main path.
  - **Max Depth Survival & Boss Hunt (`Depth = clvl + 1`)**:
    - Reaching `maxDepth = clvl + 1` traps the pilot in endless random `maxDepth` rooms where `1 in (clvl + 1)` rooms spawns a Fog Boss.
    - All 4 cardinal doorways remain open even when a Boss is present, allowing the pilot to kite or flee into another `maxDepth` room if overwhelmed.
    - Slaying any Fog Boss at `maxDepth` clears the Æther fog, awards the boss's scaled loot/gemstones, and returns the pilot to their anchor room on the main path.
- **HUD Mini-Map & Visual Feedback**:
  - Displays current depth and room progress within that depth tier (`DEPTH d/${clvl + 1} · RM ${step}/${d}` for `d < maxDepth`, or `MAX DEPTH ${clvl + 1} · BOSS ${Math.round(100 / (clvl + 1))}%` at `maxDepth`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Unlocked Doors & `1 / (clvl + 1)` Boss Frequency at Max Depth**
  - *Chosen Approach*: Keep all 4 cardinal doorways open at `maxDepth` so the player can run from a boss room into a fresh random `maxDepth` room, while rolling a `1 / (clvl + 1)` boss spawn chance (with a guarantee on the `(clvl + 1)`-th consecutive non-boss `maxDepth` room so streaks of bad luck never prevent finding a boss).
  - *Why*: Respects player agency to retreat from an unfavorable boss room at `maxDepth` while enforcing that the only way out of `maxDepth` alive is to find and defeat a Fog Boss.
- **Decision 2: `d` Rooms Per Depth `d` (`1 <= d < clvl + 1`)**
  - *Chosen Approach*: Track `loopDepth` (`1 .. clvl + 1`) and `loopStage` (`1 .. loopDepth`, the room index within the current depth tier). Moving forward from `(d, k)` goes to `(d, k + 1)` when `k < d`, and advances to `(d + 1, 1)` when `k === d`.
  - *Why*: Implements the exact progression rule where Depth 1 has 1 room, Depth 2 has 2 rooms, Depth 3 has 3 rooms before Depth 4, while preserving a linear chain of `returnDir` parent pointers so the player can retrace every room back to safety before `maxDepth`.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     Main Path Node (key / general / side)                │
│                       anchorSafeNodeId (Depth 0 · Safe)                  │
└───────────────────┬──────────────────────────────────────▲───────────────┘
                    │ Enter Fog Pocket                     │ Retrace (returnDir)
                    ▼                                      │
┌───────────────────────────────────────┐                  │
│   Depth 1: Room 1/1                   │──────────────────┘
└───────────────────┬───────────────────┘
                    │ Forward (dir !== returnDir)          ▲ Retrace (returnDir)
                    ▼                                      │
┌───────────────────────────────────────┐                  │
│   Depth 2: Room 1/2 ──▶ Room 2/2      │──────────────────┘
└───────────────────┬───────────────────┘
                    │ Forward after Room d/d               ▲ Retrace (returnDir)
                    ▼                                      │
┌───────────────────────────────────────┐                  │
│   Depth d: Room 1/d ──▶ … ──▶ Room d/d│──────────────────┘
└───────────────────┬───────────────────┘
                    │ Forward after Room (clvl)/clvl reaches maxDepth = clvl + 1
                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│           Max Depth (d = clvl + 1): Endless Random Fog Rooms             │
│   - Doors DO NOT lock: player can run between random maxDepth rooms      │
│   - Boss Spawn Frequency = 1 / (clvl + 1) (e.g. 0.20 at clvl 4)          │
│   - Cannot retrace to shallower depth; must defeat a Boss to escape      │
│   - Defeating a Boss clears the fog & returns pilot to anchorSafeNodeId  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Data Model Updates (`AetherGraphNode` & `AetherFogGraphState`)**:
  - `loopDepth`: Current depth (`1 .. clvl + 1`).
  - `loopStage`: Room step within current depth (`1 .. loopDepth` when `loopDepth < maxDepth`, or room counter at `maxDepth`).
  - `loopMaxDepth`: `clvl + 1` (`Math.max(2, (state.level || 1) + 1)`).
  - `hasFogBoss`: Boolean on `maxDepth` nodes rolled with probability `1 / loopMaxDepth`.
- **Interactive Component & State Mapping**:
  - `getDoorwayAetherTransitionInfo(state, dir)`:
    - When `loopDepth < loopMaxDepth`:
      - `dir === currentNode.returnDir`: steps backward (`(d, k) -> (d, k - 1)` if `k > 1`, `(d - 1, d - 1)` if `k === 1` and `d > 1`, or `0` Safe if `d === 1, k === 1`), `increasesDensity = false`.
      - `dir !== currentNode.returnDir`: steps forward (`(d, k + 1)` if `k < d`, or `(d + 1, 1)` if `k === d`), `increasesDensity = true`.
    - When `loopDepth >= loopMaxDepth`:
      - All 4 cardinal doorways remain unlocked and route to a new random `maxDepth` room (`nextDepth = loopMaxDepth`, `increasesDensity = true`).
  - `updateEnemies(rooms, state, ctx, dt)`:
    - Scales enemy loot/gemstone drops by `loopDepth` (up to `clvl + 1`).
    - When a Fog Boss (`e.isFogBoss`) is defeated at `maxDepth`, auto-collects its dropped loot/gemstones, clears the fog graph state, and transitions the player back to `anchorSafeNodeId` on the main path.
