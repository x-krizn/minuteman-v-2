Minuteman V-2 — Data-Driven Architecture Audit

Purpose

This document records how the current Minuteman V-2 codebase compares with the intended data-driven architecture.

The goal is to identify:

- Fits: Existing systems that already follow the intended architecture.
- Partial: Systems with the right foundation but remaining hardcoded behavior, duplicated configuration, or incomplete data integration.
- Overhaul: Systems whose current design must be substantially replaced or reorganized to meet the target architecture.
- Unverified: Areas requiring further inspection before assigning a reliable status.

This is an architectural assessment, not an implementation checklist. No code changes should be made solely because an item appears in this table.

1. Target Architecture

The intended data flow is:

CONTENT DEFINITIONS
    |
    | Characters, weapons, armor, enemies, items,
    | skills, tiles, rooms, maps, interactions
    v
DEFINITION LOADER AND VALIDATOR
    |
    | Resolve IDs and references
    | Validate schemas and required properties
    | Apply defaults and validate asset references
    v
GENERIC RUNTIME SYSTEMS
    |
    | Movement, combat, collision, inventory,
    | interaction, projectiles, rendering, AI
    v
LIVE GAME STATE
    |
    | Position, health, equipment, projectiles,
    | world changes, progression
    v
RENDERED AND INTERACTIVE GAME

Architectural rule

«Content definitions describe what an entity is, what properties it has, and what capabilities it exposes. Generic runtime systems determine how those properties and capabilities are executed.»

For example, adding a hammer should primarily require a hammer definition and its referenced assets. It should not require modifying the combat engine, renderer, or main game loop merely because the weapon is a hammer.

Exceptions are appropriate when introducing genuinely new mechanics that the engine does not yet support.

2. Current State Audit

Status key

- [x] Fits
- [~] Partial
- [!] Overhaul needed
- [?] Unverified

The ratings below are preliminary. They reflect static source inspection and should be revised when actual data-consumption paths are traced.

System / Feature| Relevant Files| Current State| What Already Fits| What Is Partial or Missing| Target / Next Action
Cartridge interface| "src/types/cartridge.ts"| [x] Fits| Defines a contract between the engine and a game cartridge.| Verify whether every cartridge responsibility is covered by the interface.| Preserve the interface; extend only when a concrete requirement exists.
Cartridge registration| "src/cartridges/index.ts"| [x] Fits| Provides a central cartridge registration point.| Verify whether registration and discovery are sufficiently decoupled for future cartridges.| Keep game-specific registration outside generic engine systems.
Cartridge execution| "src/engine/core/cartridgeRunner.ts"| [x] Fits| Separates cartridge startup and execution from the cartridge implementation.| Verify lifecycle handling, error recovery, and cleanup.| Preserve and strengthen the cartridge lifecycle contract.
Main application| "src/App.tsx", "src/main.tsx"| [~] Partial| Provides the application entry point and connects the game runtime.| Confirm how much game-specific behavior remains in application-level code.| Keep application startup generic and cartridge-agnostic.
Frame loop| "src/engine/core/frameLoop.ts"| [x] Fits| Separates recurring update and draw execution from content definitions.| Verify pause, lifecycle, and timing behavior before expanding it.| Preserve as generic runtime infrastructure.
Input handling| "src/input/"| [~] Partial| Input is handled through a separate subsystem.| Verify whether actions are mapped to capabilities or directly to character-specific behavior.| Keep physical inputs separate from gameplay actions and abilities.
Asset loading| "src/engine/core/assetLoader.ts"| [~] Partial| Validates sprite-strip metadata and handles embedded PNG data URIs.| General asset types, external paths, and broader asset metadata need further assessment.| Evolve into a general asset-resolution and validation layer as required.
Rendering| "src/engine/core/renderer.ts"| [~] Partial| Provides a separate rendering subsystem.| Verify how much rendering depends on specific entity types, sprite layouts, or game rules.| Make rendering consume generic renderable data and state.
Audio| "src/engine/core/audio.ts"| [?] Unverified| A dedicated audio module exists.| Its configuration, asset references, and interaction with content definitions have not been fully audited.| Inspect before assigning a final rating.
UI and console| "src/App.tsx", "src/ui/"| [?] Unverified| Application and UI modules exist.| The degree of modularity and data-driven UI configuration is not yet established.| Audit menus, HUD, console, and game-specific UI dependencies.
Character definitions| "src/cartridges/knight/database/characters/proto_knight.ts"| [~] Partial| Character stats, sprite dimensions, and equipment-related data are defined in content.| Movement and other runtime values also exist in code-level constants.| Establish one authoritative definition for character properties and trace every consumer.
Weapon definitions| "src/cartridges/knight/database/weapons/short_sword.ts"| [~] Partial| Weapons contain damage-related properties, animation data, hitbox dimensions, sprite data, and hooks.| Attack selection, timing, and parts of the combat process remain in code.| Define a complete weapon contract and make combat consume it generically.
Weapon registry| "src/cartridges/knight/database/weapons/index.ts"| [x] Fits| Automatically discovers TypeScript weapon modules and builds a registry.| Discovery currently depends on the build-time module system.| Preserve registry-based lookup; separate content format from discovery when needed.
Enemy definitions| "src/cartridges/knight/database/enemies/crawler.ts"| [~] Partial| Enemy properties include health, speed, damage, poise, loot information, and update behavior.| Executable behavior in definitions couples content to the current TypeScript runtime.| Decide which behavior belongs in declarative data and which belongs in reusable AI systems.
Enemy registry| "src/cartridges/knight/database/enemies/index.ts"| [x] Fits| Automatically discovers enemy modules and builds an ID/type-based registry.| Discovery and validation are currently tied to TypeScript modules.| Preserve registry lookup and standardize registration and validation.
Item definitions| "src/cartridges/knight/database/items/"| [~] Partial| Item definitions and registry-based discovery exist; embedded image data is also present.| Item use, interaction, stacking, and effects need a full consumer audit.| Define shared item properties and capability/effect contracts.
World definitions| "src/cartridges/knight/database/world/"| [~] Partial| World content is organized into tiles, biomes, regions, areas, maps, rooms, and related modules.| The relationship between declarative world data and procedural generation or loading code needs tracing.| Establish generic world composition and generation contracts.
Tile registry| "src/cartridges/knight/database/world/tiles/index.ts"| [~] Partial| Automatically discovers tiles and provides lookup by ID or symbol.| Some collision/passability decisions are handled directly in the registry logic.| Move tile-specific properties into definitions and retain generic interpretation rules in world systems.
Progression| "src/cartridges/knight/database/progression/"| [~] Partial| Progression requirements and unlock-related definitions exist.| Runtime checks and triggering logic may remain distributed across code.| Trace each definition to its consumer and consolidate evaluation rules.
Movement and physics| "src/cartridges/knight/constants.ts", "src/cartridges/knight/knightCartridge.ts", "src/cartridges/knight/physics.ts"| [~] Partial| Physics and movement are separated into identifiable modules; character definitions contain some relevant data.| Movement values also live in constants and are consumed by game logic.| Establish authoritative movement properties and generic movement/physics interfaces.
Combat| "src/cartridges/knight/combat.ts", "src/cartridges/knight/constants.ts", weapon definitions| [~] Partial| Combat is isolated in a module, and weapons already expose useful attack metadata.| Attack variants, timing, and execution rules remain partly code-defined.| Trace the entire attack lifecycle, then build a generic data-driven combat pipeline.
Inventory| "src/cartridges/knight/inventory.ts"| [?] Unverified| A dedicated inventory module exists, and item definitions are available.| Inventory behavior, stacking rules, equipment changes, and item-use handling have not been fully traced.| Audit before deciding whether to refactor or preserve most of the implementation.
Collision| "src/cartridges/knight/physics.ts", "src/cartridges/knight/combat.ts", world tile definitions| [~] Partial| Physics, tile solidity, and combat hitboxes have identifiable implementation points.| A unified contract for hurtboxes, hitboxes, terrain, and collision layers is not established by the inspection so far.| Identify common collision primitives and define generic collision layers and properties.
AI and actor behavior| "src/cartridges/knight/enemies.ts", enemy definitions| [~] Partial| Enemy definitions and a dedicated enemy update module exist.| Definition-level update behavior may couple AI to individual content modules.| Separate generic AI execution from actor-specific configuration and behavior selection.
Asset references| Weapon, character, enemy, item, and world definitions| [~] Partial| Definitions can contain or reference sprite-related information.| Asset conventions, resolution, validation, and ownership are not yet uniform across all content categories.| Establish a shared asset-reference contract.
Cross-content references| Character, weapon, item, enemy, and world registries| [?] Unverified| Registries provide a foundation for ID-based lookup.| Missing-reference handling, dependency validation, and consistency across registries need inspection.| Add a unified validation stage after mapping existing reference patterns.

3. Important Findings

3.1 The project already has useful architectural foundations

The engine/cartridge boundary, frame loop, dedicated subsystems, content directories, and registry pattern are all useful foundations.

These should not be discarded simply because the overall architecture needs further work.

3.2 Data definitions and runtime behavior are mixed

Some content modules contain descriptive properties, while also exposing executable TypeScript behavior. Meanwhile, other behavior is defined in shared modules or constants.

This is not automatically wrong. The problem arises when the same responsibility has multiple sources of truth or when adding content requires modifying unrelated systems.

Target: Definitions provide validated properties and references; generic systems interpret those properties consistently.

3.3 Registries are ahead of the loading architecture

Automatic discovery through "import.meta.glob" is a useful build-time mechanism for collecting modules. It is not, by itself, a general runtime content loader.

The project does not necessarily need external JSON files immediately. First, it needs consistent schemas, validation, references, and runtime consumption.

A later migration could support external data without requiring a rewrite of the gameplay systems.

3.4 A field existing in a definition does not prove the engine uses it

Every important property needs to be traced from definition to consumer.

For example, a character can define a movement speed while the movement system independently reads a constant. Until the relevant paths are verified, the definition should not be treated as the authoritative source.

3.5 Avoid premature overhauls

A subsystem should receive an overhaul rating only when inspection shows that its design prevents the intended architecture or requires widespread special cases.

The absence of a completed audit is not evidence that a system needs to be replaced.

4. Recommended Audit Order

Priority| Audit| Required Result
1| Character definitions and movement| A field-by-field map showing which values are consumed, duplicated, ignored, or missing.
2| Weapon definitions and combat| A complete trace from attack input through selection, animation, hit detection, effects, and recovery.
3| Enemy definitions and AI| A clear boundary between enemy data, reusable AI logic, and live actor state.
4| Items and inventory| A trace of item definition, acquisition, storage, use, equipment, and effects.
5| World and tiles| A trace from tile/room/map definitions through loading, generation, collision, and rendering.
6| Shared assets and references| A common asset-reference model and a list of unresolved or inconsistently handled references.
7| Engine-wide validation| A consistent way to validate definitions before gameplay starts.

5. Completion Criteria

The architecture should be considered ready for a broader content expansion when:

- [ ] Each content type has a defined schema or equivalent TypeScript contract.
- [ ] Every important property has an identified runtime consumer.
- [ ] Duplicated configuration has been eliminated or explicitly justified.
- [ ] Content references can be resolved and validated consistently.
- [ ] Generic systems operate on shared contracts rather than individual content identities.
- [ ] Adding a normal new weapon, enemy, item, tile, or room does not require unrelated engine changes.
- [ ] Exceptional or genuinely new mechanics have an explicit extension path.
- [ ] Existing content continues to work after each incremental refactor.
- [ ] Automated tests or reproducible runtime checks verify the affected behavior.

6. Audit Notes and Evidence

Current assessment: Preliminary static source review.

Evidence tier: Tier 2 — direct inspection of repository source files and their relationships. This is not runtime verification or a completed field-by-field data-consumption audit.

Fact vs. inference:

- Observed fact: A module, registry, definition, or code path exists in the inspected source.
- Architectural inference: A system may have duplicated configuration, incomplete data-driven behavior, or a future refactoring need based on those observations.
- Unverified: The full execution path has not yet been traced, so no firm conclusion should be drawn.

Last reviewed: 2026-10-14

Next action: Complete the character-definition and movement-consumption audit before changing implementation code.

Date| Area Reviewed| Finding| Decision / Follow-up
2026-10-14| Initial architecture review| Registries and subsystem boundaries exist, but data consumption is not yet consistently established.| Begin with character definitions and movement.