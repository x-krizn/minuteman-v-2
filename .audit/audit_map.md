# Minuteman V-2 — Audit Map

## Purpose

This document maps the connections between content definitions, engine modules, runtime systems, and live game state.

It complements [`data_audit.md`](./data_audit.md), which tracks architectural readiness.

The audit map answers:

- Where is each property defined?
- Which module consumes it?
- How does it travel through the runtime?
- Where is its behavior implemented?
- Are there competing sources of truth?
- Which other modules will be affected by a change?

## Evidence Rules

| Status | Meaning |
|---|---|
| `UNTRACED` | Connection has not been investigated. |
| `PARTIAL` | Some of the connection is confirmed, but the complete path is unknown. |
| `CONFIRMED` | The relevant source-to-consumer path has been inspected. |
| `DUPLICATED` | Multiple sources define or control the same responsibility. |
| `UNUSED` | A definition has been verified as unused within the audited scope. |
| `BLOCKED` | The trace cannot be completed with the available evidence. |

A connection can be confirmed while still representing poor architecture. Confirmation describes evidence, not quality.

Note: these statuses describe **trace completeness**. The Fits / Partial / Overhaul / Unverified ratings in `data_audit.md` describe **architectural readiness**. The two vocabularies are separate.

## 1. System Overview

```
CONTENT DEFINITIONS
  Characters
  Weapons
  Enemies
  Items
  Skills
  Tiles
  Rooms and maps
       |
       v
REGISTRIES AND LOOKUPS
  Definition discovery
  ID/type lookup
       |
       v
CARTRIDGE INITIALIZATION
  Initial state
  Starting equipment
  World initialization
       |
       v
RUNTIME SYSTEMS
  Input
  Movement and physics
  Combat and collision
  Inventory and interactions
  AI and world simulation
       |
       v
LIVE GAME STATE
  Position, health, equipment
  Active attacks and projectiles
  Enemies and world changes
       |
       v
RENDERING AND AUDIO
```

This is the target investigation map, not yet a fully verified execution graph. Each connection must be confirmed by tracing the implementation.

## 2. Connection Register

Paths relative to `src/cartridges/knight/` are abbreviated as `database/...` where indicated.

| ID | Source | Consumer / Destination | Relationship | Status |
|---|---|---|---|---|
| MAP-001 | `src/types/cartridge.ts` | Cartridge implementations and runner | Defines the cartridge contract | PARTIAL |
| MAP-002 | `src/cartridges/index.ts` | Cartridge registration | Registers available game cartridges | CONFIRMED |
| MAP-003 | `src/engine/core/cartridgeRunner.ts` | Active cartridge lifecycle | Starts and initializes a cartridge | PARTIAL |
| MAP-004 | `src/engine/core/frameLoop.ts` | Active cartridge update/draw | Drives recurring runtime execution | PARTIAL |
| MAP-005 | `database/characters/proto_knight.ts` | `knightCartridge.ts` | Supplies character definition data. Only `.stats` is read in the cartridge; `.movement`, `.sprite`, `.startingLoadout` not consumed there (see MAP-015 to MAP-017, MAP-020, MAP-021) | PARTIAL |
| MAP-006 | `knight/constants.ts` | `knightCartridge.ts` and gameplay modules | Supplies code-level movement and gameplay constants. Movement constants are consumed directly in `update` and differ from the definition's values (TRACE-001) | DUPLICATED |
| MAP-007 | `database/weapons/index.ts` | Weapon lookup consumers | Discovers weapon modules and builds the registry | CONFIRMED |
| MAP-008 | `database/weapons/short_sword.ts` | `combat.ts` and other weapon consumers | Supplies weapon properties and behavior hooks | PARTIAL |
| MAP-009 | `database/enemies/index.ts` | Enemy lookup consumers | Discovers enemy modules and builds the registry | CONFIRMED |
| MAP-010 | `database/enemies/crawler.ts` | Enemy runtime and update logic | Supplies enemy properties and behavior | PARTIAL |
| MAP-011 | `database/world/tiles/index.ts` | World and collision logic | Resolves tiles and determines solidity/passability. `physics.solidChar` delegates to `isSolidTile` | PARTIAL |
| MAP-012 | `database/items/` | Item and inventory consumers | Supplies item definitions and related data. `enterRoom` places pickups via `getItemDefinition` | PARTIAL |
| MAP-013 | `database/progression/` | Progression checks | Supplies unlock and requirement definitions. `canPerformAction('dash' / 'air_dash')` is called in `update` | PARTIAL |
| MAP-014 | `engine/core/assetLoader.ts` | Runtime asset consumers | Validates and loads supported asset data | PARTIAL |
| MAP-015 | `database/characters/proto_knight.ts` `.stats` | `knightCartridge.ts` initial state and `init()` | Supplies hp, ap, ep, sp, flasks and their maximums | CONFIRMED |
| MAP-016 | `database/characters/proto_knight.ts` `.movement` | Any runtime consumer | Run, sprint, dash speed, jump velocity, gravity. No consumer found in the four files read | PARTIAL |
| MAP-017 | `knight/constants.ts` movement constants | `knightCartridge.ts` `update` | RUN_SPEED, SPRINT_SPEED, DASH_SPEED, DASH_DURATION, DASH_COOLDOWN, JUMP_VELOCITY, GRAVITY, MAX_FALL_SPEED, STAMINA_REGEN_RATE applied directly | CONFIRMED |
| MAP-018 | `knightCartridge.ts` | `physics.ts` `moveX` / `moveY` | Passes displacement (`vx * dt`, `vy * dt`); physics reads no speed values or character data | CONFIRMED |
| MAP-019 | `knight/constants.ts` HALF_WIDTH, BODY_HEIGHT | `physics.ts` `hits`, `bodyBox` | Body hitbox; no definition source | CONFIRMED |
| MAP-020 | `database/characters/proto_knight.ts` `.sprite` | `knightCartridge.ts` `assets.knight` | Sprite metadata repeated as literals; values currently match. Image source via `KNIGHT_PNG` (`assets.ts` not read) | DUPLICATED |
| MAP-021 | `database/characters/proto_knight.ts` `.startingLoadout` | `knightCartridge.ts` initial state and `init()` | Weapon and skills repeated as literals; off-hand and unlocked skills exist only in the cartridge | DUPLICATED |

## 3. Active Trace

### Trace: Character definitions and movement

**Status:** PARTIAL (four files read; remaining consumers unchecked)
**Details:** [`traces/character_movement.md`](./traces/character_movement.md)

**Objective:** Establish the authoritative source for every character movement property.

| Property | Definition source | Runtime consumer | Additional source | Result |
|---|---|---|---|---|
| Run speed | `movement.runSpeed` = 80 | None found | `constants.RUN_SPEED` = 60 (used in `update`) | DUPLICATED |
| Sprint speed | `movement.sprintSpeed` = 120 | None found | `constants.SPRINT_SPEED` = 95 (used in `update`) | DUPLICATED |
| Jump velocity | `movement.jumpVelocity` = 230 | None found | `constants.JUMP_VELOCITY` = 270 (used in `update`) | DUPLICATED |
| Gravity | `movement.gravity` = 600 | None found | `constants.GRAVITY` = 700 (used in `update`) | DUPLICATED |
| Dash speed | `movement.dashSpeed` = 160 | None found | `constants.DASH_SPEED` = 180 (used in `update`) | DUPLICATED |
| Dash duration | No definition field | `knightCartridge.update` | `constants.DASH_DURATION` = 0.16 | CONFIRMED |
| Dash cooldown | No definition field | `knightCartridge.update` | `constants.DASH_COOLDOWN` = 0.35 | CONFIRMED |
| Stamina regeneration | No definition field | `knightCartridge.update` | `constants.STAMINA_REGEN_RATE` = 2.5 | CONFIRMED |

Files still to inspect before this trace can be marked complete: `types.ts`, `assets.ts`, `database/characters/index.ts`, `combat.ts`, `skills.ts`, `enemies.ts`, `renderer.ts`, `ui`, `stateStore`, `database/progression/`.

Do not classify a property as unused merely because it is absent from one file. Trace its relevant consumers first.

## 4. Trace Log

| Trace ID | Area | Status | Document | Last Updated |
|---|---|---|---|---|
| TRACE-001 | Character definitions and movement | PARTIAL | `traces/character_movement.md` | 2026-10-14 |
| TRACE-002 | Weapon definitions and combat | UNTRACED | `traces/weapon_combat.md` | Pending |
| TRACE-003 | Enemy definitions and AI | UNTRACED | `traces/enemy_ai.md` | Pending |
| TRACE-004 | Items and inventory | UNTRACED | `traces/items_inventory.md` | Pending |
| TRACE-005 | World definitions and tiles | UNTRACED | `traces/world_tiles.md` | Pending |

## 5. Update Protocol

When a trace is completed:

1. Record the source-to-consumer chain in its trace document.
2. Document relevant properties, functions, state changes, and dependencies.
3. Separate confirmed observations from architectural inferences.
4. Update the corresponding connections in this map.
5. Update `data_audit.md` if the findings change a system's architectural rating.
6. Record the result in the trace log.
7. Identify downstream traces that depend on the new findings.

Do not mark a trace complete until its relevant execution path has been inspected.

### Downstream traces identified by TRACE-001

- TRACE-002: `constants.ts` holds `SWORD_ATTACKS`, `CHARGE_TIME_REQUIRED`, `PARRY_WINDOW_DURATION`. Compare with `short_sword.ts` (not yet compared).
- TRACE-003: `physics.enemyBox` hardcodes sizes by enemy type; `enterRoom` selects enemy types by tile position and `state.cleared`.
- TRACE-004: pickups are placed through `getItemDefinition`.
- TRACE-005: `physics.solidChar` and `tileIndex` depend on the tile registry.

## 6. Evidence Standard

Current evidence tier: **Tier 2 — static source inspection.**

A confirmed connection means the relevant code path was inspected. It does not automatically mean the behavior has been runtime-tested.

Where practical, runtime checks and automated tests should be recorded separately from static findings.

**Next action:** Finish TRACE-001 by inspecting the remaining consumers listed in Section 3, then make the owner decision on which movement values are intended before changing implementation code.
