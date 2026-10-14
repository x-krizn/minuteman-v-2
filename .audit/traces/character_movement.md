# TRACE-001 — Character Definitions and Movement

**Status:** PARTIAL
**Last updated:** 2026-10-14
**Evidence tier:** Tier 2 — static source inspection of `main` (no commit hash recorded). No runtime testing.

## 1. Scope

Files read in full:

| File | Path |
|---|---|
| Character definition | `src/cartridges/knight/database/characters/proto_knight.ts` |
| Constants | `src/cartridges/knight/constants.ts` |
| Cartridge | `src/cartridges/knight/knightCartridge.ts` |
| Physics | `src/cartridges/knight/physics.ts` |

Not read (any of these could consume the character definition, so UNUSED cannot be assigned yet):

- `src/cartridges/knight/types.ts` (is `movement` part of `CharacterDefinition`?)
- `src/cartridges/knight/assets.ts` (re-exported by `constants.ts`)
- `src/cartridges/knight/database/characters/index.ts`
- `src/cartridges/knight/combat.ts`, `skills.ts`, `enemies.ts`, `pickups.ts`
- `src/cartridges/knight/renderer.ts`, `ui`, `stateStore`
- `src/cartridges/knight/database/progression/` (`canPerformAction`)

## 2. Property trace

Result vocabulary follows `audit_map.md`.

| Property | Definition source | Runtime consumer | Additional source | Result |
|---|---|---|---|---|
| Run speed | `proto_knight.movement.runSpeed` = 80 | None found in the four files | `constants.RUN_SPEED` = 60, used in `knightCartridge.update` (`moveSpeed`) | DUPLICATED |
| Sprint speed | `movement.sprintSpeed` = 120 | None found | `constants.SPRINT_SPEED` = 95, same `moveSpeed` expression | DUPLICATED |
| Jump velocity | `movement.jumpVelocity` = 230 | None found | `constants.JUMP_VELOCITY` = 270, used for jump, air jump and variable-height cut (`* 0.4`) | DUPLICATED |
| Gravity | `movement.gravity` = 600 | None found | `constants.GRAVITY` = 700, applied as `vy + GRAVITY * dt` | DUPLICATED |
| Dash speed | `movement.dashSpeed` = 160 | None found | `constants.DASH_SPEED` = 180, `vx = face * DASH_SPEED` | DUPLICATED |
| Dash duration | No field | `knightCartridge.update` | `constants.DASH_DURATION` = 0.16 | CONFIRMED (code-only) |
| Dash cooldown | No field | `knightCartridge.update` | `constants.DASH_COOLDOWN` = 0.35 | CONFIRMED (code-only) |
| Stamina regeneration | No field (`stats.sp` / `maxSp` exist) | `knightCartridge.update` | `constants.STAMINA_REGEN_RATE` = 2.5 SP/s | CONFIRMED (code-only) |

Additional movement-related values found:

| Value | Where it lives | Notes |
|---|---|---|
| Max fall speed 320 | `constants.MAX_FALL_SPEED` | No definition field |
| Body half-width 4.5, body height 13 | `constants.HALF_WIDTH`, `BODY_HEIGHT` | Used by `physics.hits` and `bodyBox`; no definition field (the definition's sprite is 16x16) |
| Sprint SP drain 1.2 per second | Literal in `knightCartridge.update` | Not in constants or definition |
| Dash SP cost 1 (also the `sp >= 1` check) | Literal in `knightCartridge.update` | Not in constants or definition |
| Coyote 0.08 s, jump buffer 0.1 s, jump-cut 0.4 | Literals in `knightCartridge.update` | Not in constants or definition |
| Frame time cap 0.033 s | Literal in `knightCartridge.update` | Engine-wide behavior living in a cartridge |
| Dash and air dash gating | `canPerformAction('dash' / 'air_dash', state)` from `database/progression` | Progression module not read |

## 3. Confirmed observations

1. `knightCartridge.ts` imports `RUN_SPEED`, `SPRINT_SPEED`, `DASH_SPEED`, `DASH_DURATION`, `DASH_COOLDOWN`, `JUMP_VELOCITY`, `GRAVITY`, `MAX_FALL_SPEED` and `STAMINA_REGEN_RATE` from `./constants` and uses them directly in `update`.
2. `physics.ts` takes a displacement (`state.vx * dt`, `state.vy * dt`) in `moveX` and `moveY`. It reads no speed values and does not reference the character definition.
3. `knightCartridge.ts` reads only `protoKnightCharacter.stats.*` (hp, maxHp, ap, maxAp, ep, maxEp, sp, maxSp, flasks, maxFlasks). It does not read `.movement`, `.sprite` or `.startingLoadout`.
4. All five movement values present in both files differ (see table above).
5. The definition's `sprite` data (16x16 frames, 4 frames, 8 fps, anchor 8/16) matches values hardcoded in the cartridge's `assets.knight` entry (`cw:16, ch:16, frames:4, fps:8, ax:8, ay:16`). The values are duplicated but consistent.
6. The definition's `startingLoadout` (`short_sword`, `heal`, `fireball`) is repeated as literals in the cartridge's initial `state` and again in `init()`. `offHand: 'iron_round_shield'` and `unlockedSkills` exist only in the cartridge. `ALL_SKILL_IDS` is also a hardcoded array there.
7. `flasks || 3` and `maxFlasks || 5` repeat the definition's own values as fallbacks.
8. `physics.enemyBox` hardcodes enemy sizes by type string (`'sentry'`, `'wisp'`). This is out of scope here and is logged for TRACE-003.

## 4. Inferences (not verified)

- Editing `proto_knight.movement` would likely not change in-game movement, because no consumer was found in the files read.
- At runtime, the `constants.ts` values appear to be the effective source of truth for movement.
- The definition's `movement` block may be unused, or may be consumed by a file not yet read.

## 5. Unverified

- Whether any unread file reads `protoKnightCharacter.movement`, `.sprite` or `.startingLoadout`.
- Whether `KNIGHT_PNG` imported from `./constants` (via `assets.ts`) is the same image as `PROTO_KNIGHT_PNG` in the definition.
- Which set of values is intended (the definition's or the constants').
- Whether `CharacterDefinition` in `types.ts` requires the `movement` block.

## 6. Competing sources of truth

| Responsibility | Source A | Source B | Notes |
|---|---|---|---|
| Run, sprint, dash speed, jump velocity, gravity | `proto_knight.movement` | `constants.ts` | Values differ; B is the one used |
| Sprite sheet metadata | `proto_knight.sprite` | `knightCartridge.assets.knight` | Values currently match |
| Starting weapon and skills | `proto_knight.startingLoadout` | Literals in `knightCartridge.ts` | Values currently match; off-hand only in B |
| Starting flasks and max flasks | `proto_knight.stats` | `|| 3` / `|| 5` fallbacks | Values currently match |

## 6a. Decision needed (owner)

Which set of movement values is intended. The audit does not recommend a direction yet. Per the update protocol, no implementation change should be made solely from this trace.

## 7. Downstream traces affected

- **TRACE-002 (weapons and combat):** `constants.ts` also holds `SWORD_ATTACKS`, `CHARGE_TIME_REQUIRED` and `PARRY_WINDOW_DURATION`. Compare against the hitbox and timing data in `short_sword.ts` (not yet compared).
- **TRACE-003 (enemies and AI):** `physics.enemyBox` hardcodes sizes per enemy type. `enterRoom` in the cartridge chooses enemy types by tile position and `state.cleared`.
- **TRACE-004 (items and inventory):** `enterRoom` places pickups through `getItemDefinition(c)`.
- **TRACE-005 (world and tiles):** `physics.solidChar` delegates to `isSolidTile`; `tileIndex` selects tile rows by neighbor solidity.

## 8. To complete this trace

Read and check each unread file listed in Section 1 for references to `.movement`, `.sprite`, `.startingLoadout`, and the constants above. Then change the Result column from DUPLICATED/CONFIRMED to final values, and mark the trace complete only after the full path has been inspected.

## 9. Proposed follow-up to `data_audit.md` (not applied)

- Keep **Character definitions** and **Movement and physics** rated Partial.
- Replace "Movement values also exist in code-level constants" with "Confirmed within four files (TRACE-001): the definition's movement values differ from, and are not consumed in place of, the constants."
- Add a row to the audit log: `2026-10-14 | Character definitions and movement | Duplicated movement values confirmed in four files; consumers elsewhere unchecked | Finish TRACE-001`.
