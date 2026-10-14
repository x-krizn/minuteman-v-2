Minuteman V-2 — Audit Map

Purpose

This document maps the connections between content definitions, engine modules, runtime systems, and live game state.

It complements ""data_audit.md"" (./data_audit.md), which tracks architectural readiness.

The audit map answers:

- Where is each property defined?
- Which module consumes it?
- How does it travel through the runtime?
- Where is its behavior implemented?
- Are there competing sources of truth?
- Which other modules will be affected by a change?

Evidence Rules

Status| Meaning
"UNTRACED"| Connection has not been investigated.
"PARTIAL"| Some of the connection is confirmed, but the complete path is unknown.
"CONFIRMED"| The relevant source-to-consumer path has been inspected.
"DUPLICATED"| Multiple sources define or control the same responsibility.
"UNUSED"| A definition has been verified as unused within the audited scope.
"BLOCKED"| The trace cannot be completed with the available evidence.

A connection can be confirmed while still representing poor architecture. Confirmation describes evidence, not quality.

1. System Overview

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

This is the target investigation map, not yet a fully verified execution graph. Each connection must be confirmed by tracing the implementation.

2. Initial Connection Register

ID| Source| Consumer / Destination| Relationship| Status
MAP-001| "src/types/cartridge.ts"| Cartridge implementations and runner| Defines the cartridge contract| PARTIAL
MAP-002| "src/cartridges/index.ts"| Cartridge registration| Registers available game cartridges| CONFIRMED
MAP-003| "src/engine/core/cartridgeRunner.ts"| Active cartridge lifecycle| Starts and initializes a cartridge| PARTIAL
MAP-004| "src/engine/core/frameLoop.ts"| Active cartridge update/draw| Drives recurring runtime execution| PARTIAL
MAP-005| "database/characters/proto_knight.ts"| "knightCartridge.ts"| Supplies character definition data| PARTIAL
MAP-006| "knight/constants.ts"| "knightCartridge.ts" and gameplay modules| Supplies code-level movement and gameplay constants| PARTIAL
MAP-007| "database/weapons/index.ts"| Weapon lookup consumers| Discovers weapon modules and builds the registry| CONFIRMED
MAP-008| "database/weapons/short_sword.ts"| "combat.ts" and other weapon consumers| Supplies weapon properties and behavior hooks| PARTIAL
MAP-009| "database/enemies/index.ts"| Enemy lookup consumers| Discovers enemy modules and builds the registry| CONFIRMED
MAP-010| "database/enemies/crawler.ts"| Enemy runtime and update logic| Supplies enemy properties and behavior| PARTIAL
MAP-011| "database/world/tiles/index.ts"| World and collision logic| Resolves tiles and determines solidity/passability| PARTIAL
MAP-012| "database/items/"| Item and inventory consumers| Supplies item definitions and related data| PARTIAL
MAP-013| "database/progression/"| Progression checks| Supplies unlock and requirement definitions| PARTIAL
MAP-014| "engine/core/assetLoader.ts"| Runtime asset consumers| Validates and loads supported asset data| PARTIAL

Paths relative to "src/cartridges/knight/" are abbreviated as "database/..." where indicated.

3. Active Trace

Trace: Character definitions and movement

Status: UNTRACED

Objective: Establish the authoritative source for every character movement property.

Investigate:

1. "database/characters/proto_knight.ts"
2. "constants.ts"
3. "knightCartridge.ts"
4. "physics.ts"
5. Any movement, dash, jump, sprint, stamina, or action-related consumers.

For each relevant property, record:

Property| Definition source| Runtime consumer| Additional source| Result
Run speed| To trace| To trace| To check| UNTRACED
Sprint speed| To trace| To trace| To check| UNTRACED
Jump velocity| To trace| To trace| To check| UNTRACED
Gravity| To trace| To trace| To check| UNTRACED
Dash speed| To trace| To trace| To check| UNTRACED
Dash duration| To trace| To trace| To check| UNTRACED
Dash cooldown| To trace| To trace| To check| UNTRACED
Stamina regeneration| To trace| To trace| To check| UNTRACED

Do not classify a property as unused merely because it is absent from one file. Trace its relevant consumers first.

4. Completed Trace Log

Trace ID| Area| Status| Document| Last Updated
TRACE-001| Character definitions and movement| UNTRACED| "traces/character_movement.md"| Pending
TRACE-002| Weapon definitions and combat| UNTRACED| "traces/weapon_combat.md"| Pending
TRACE-003| Enemy definitions and AI| UNTRACED| "traces/enemy_ai.md"| Pending
TRACE-004| Items and inventory| UNTRACED| "traces/items_inventory.md"| Pending
TRACE-005| World definitions and tiles| UNTRACED| "traces/world_tiles.md"| Pending

5. Update Protocol

When a trace is completed:

1. Record the source-to-consumer chain in its trace document.
2. Document relevant properties, functions, state changes, and dependencies.
3. Separate confirmed observations from architectural inferences.
4. Update the corresponding connections in this map.
5. Update "data_audit.md" if the findings change a system's architectural rating.
6. Record the result in the completed trace log.
7. Identify downstream traces that depend on the new findings.

Do not mark a trace complete until its relevant execution path has been inspected.

6. Evidence Standard

Current evidence tier: Tier 2 — static source inspection.

A confirmed connection means the relevant code path was inspected. It does not automatically mean the behavior has been runtime-tested.

Where practical, runtime checks and automated tests should be recorded separately from static findings.

Next action: Complete TRACE-001, establish the actual character movement data flow, and use its findings to update this map before making implementation changes.