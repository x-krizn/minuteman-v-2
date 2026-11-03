# Project Orion — Codebase Grooming, Rule Compliance & Commit-Readiness Audit

Deliver a clean, fully documented, rule-compliant codebase ready for commit by backfilling JSDoc contracts across all exported symbols, removing temporary diagnostic artifacts, synchronizing canonical documentation and the Orion Code Wiki index, and verifying zero outstanding tasks or build warnings.

## User Review & Critical Decisions

> [!IMPORTANT]
> Both grooming decisions have been confirmed and are locked into this plan:

- **Confirmed Decision 1 — Temporary Asset Cleanup**: Remove the temporary bug-report screenshot (`public/assets/aistudio/image_d2fb7d7b.png`) and its empty parent directory while preserving all intentional `UNDEFINED` world/zone placeholders (`Tyrranus`, `Stage 3: What Waits Below`, and future `u00` worlds).
- **Confirmed Decision 2 — Full Export JSDoc Backfill & Wiki Sync**: Backfill complete JSDoc blocks on all exported functions, interfaces, types, constants, and registries across `src/cartridges/orion`, `src/engine`, and `src/components`, then regenerate the Orion Code Wiki index (`public/wiki/index.json`) and update the verified baseline metrics in `CODE_RULES.md` and `README.md`.

---

## 1. Overview & Core Concept

- **What It Does**: Audits and grooms every module in the repository against Project Orion's mandatory engineering standards (`CODE_RULES.md`), ensuring 100% Apache-2.0 license header coverage, complete JSDoc contracts on exported symbols, strict `[ORION-ANCHOR]` parity between source code and markdown documentation, zero dead code or leftover diagnostic files, and verified build/lint/wiki health.
- **Target Audience / Persona**: Human developers, AI coding agents, and players browsing the in-game **Orion Code Wiki** (`[START] → 📖 Code Wiki` or `/wiki/`).
- **Key Value**: Guarantees that every exported symbol in the Orion Code Wiki has a clear, unit-annotated description, eliminates stale temporary assets, and confirms commit readiness with zero background tasks or drift.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **In-Game Orion Code Wiki (`[START] → 📖 Code Wiki`)**: Opening the Code Wiki displays live repository health counters (`160` source files, `23` `[ORION-ANCHOR]` tags, `0` `any`/`@ts-ignore`/`TODO` violations, `0` anchor drift) and complete JSDoc descriptions for every exported function, type, interface, and data registry.
  2. **Intentional Placeholder Preservation**: Exploring or inspecting `UNDEFINED` world zones (such as `Tyrranus`, `Camelot Interior`, or `Subterranean Dungeon`) in the Cosmic World Map, Pilot Codex, or Æther Fog seals continues to present their intentional lore and `specStatus: 'UNDEFINED'` seals cleanly.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Retains the established dark cursed-land palette (corpse-slate `#141d24`, abyssal indigo `#080612`, sickly mire `#17221e`, and tight `2.5–3.5` tile lantern halos) and high-contrast tactical HUD/Satchel typography.
  - *Color Palette & Mood*: Preserves all visual tokens across the handheld shell, HUD overlays, and standalone Code Wiki viewer.
  - *Typography & Hierarchy*: Keeps crisp monospace technical telemetry paired with clean documentation tables in the markdown guides.
  - *Component Styling & Layout*: Maintains zero-allocation render paths and responsive integer-scaled viewport geometry (`160×144`).
- **Interactive Feedback & Motion**:
  - Preserves universal 2D spatial menu navigation (`UniversalMenuNavigator`) across Keyboard, Physical Gamepad, Virtual Handheld Controls, and Mouse/Touch with proper listener cleanup on unmount.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Preserve Intentional Spec Placeholders While Removing Diagnostic Leftovers**
  - *Chosen Approach*: Delete only the temporary user-uploaded bug screenshot (`public/assets/aistudio`) and any unused local symbols, while strictly retaining `specStatus: 'UNDEFINED'` world/region entries, legacy compatibility aliases (`CANONICAL_AUXILIARIES`, `CoreplateDefinition`), and future stage hooks documented in `INDEX.md`.
  - *Why*: `CODE_RULES.md` §7 states that condensing/grooming never removes a current function or export and that `UNDEFINED` zones are intentional architectural placeholders.
  - *Alternatives Considered*: Removing unvisited world stubs was rejected because the Cosmic World Map (`u00`) and Zone Seal system (`[ORION-ANCHOR: U00-ZONE-SEALS]`) actively rely on them.
- **Decision 2: Line-Scanner-Compatible JSDoc Placement Above Exports**
  - *Chosen Approach*: Place a dedicated `/** ... */` JSDoc block immediately above every `export` declaration (stating what it does, when it applies, whether it mutates `state: OrionState` or supports both HUD modes, and wrapping coordinates/units in backticks).
  - *Why*: The zero-dependency wiki indexer (`scripts/build-index.mjs`) extracts the `/** ... */` comment immediately preceding each `export` line to populate the interactive Code Wiki.
  - *Alternatives Considered*: Relying on single-line `//` comments or file-top summary blocks was rejected because `docAbove()` in `build-index.mjs` specifically parses `/** ... */` blocks directly above each export.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Grooming Pipeline Diagram**:

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                    PROJECT ORION GROOMING & AUDIT PIPELINE                │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       ▼                              ▼                              ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 1. CODE_RULES.md Audit  │  │ 2. Export JSDoc Backfill│  │ 3. Leftover & Doc Sync  │
├─────────────────────────┤  ├─────────────────────────┤  ├─────────────────────────┤
│ • Apache-2.0 headers    │  │ • Constants & Helpers   │  │ • Delete temp diagnostic│
│ • Zero any / @ts-ignore │  │ • Database Registries & │  │   asset in public/      │
│ • Zero TODO / FIXME     │  │   Content Entries       │  │ • Update AUTHORING_GUIDE│
│ • Paired RAF & Timers   │  │ • Combat, World, Inertia│  │   & CODE_RULES baseline │
│ • Paired DOM Listeners  │  │   & Render Subsystems   │  │ • Update README lighting│
│ • Relative alpha imports│  │ • HUD & Satchel UI      │  │   & architecture notes  │
└────────────┬────────────┘  └────────────┬────────────┘  └────────────┬────────────┘
             └────────────────────────────┼────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                    4. COMMIT-READINESS VERIFICATION                       │
├───────────────────────────────────────────────────────────────────────────┤
│  • npm run wiki   -> Zero [ORION-ANCHOR] drift, updated public/wiki/      │
│  • npm run lint   -> tsc --noEmit passes with zero errors                 │
│  • npm run build  -> Production bundle + dist/wiki build cleanly          │
│  • Task & Git Check -> Zero running background tasks or unfinished work   │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - No runtime save schema breaking changes; all `OrionState` and `OrionSaveSlot` contracts remain 100% backward-compatible.
- **Interactive Component & State Mapping**:
  - **Engine & Core (`engine/core`, `engine/input`, `components/`)**: Verify license headers, JSDoc on `UniversalMenuNavigator`, `InputManager`, `SoundSystem`, and React shell components, and confirm `addEventListener` / `removeEventListener` pairing.
  - **Orion Constants & Types (`constants.ts`, `types/*`)**: Document all viewport constants (`px`, `tiles`), physics constants, Æther routing helpers, andUnified Bog Grid coordinate converters.
  - **Orion Database (`database/characters`, `database/enemies`, `database/equipment`, `database/items`, `database/progression`, `database/world`)**: Backfill JSDoc on every exported registry, builder, helper, and content definition so the Code Wiki index shows complete documentation across all 160 files.
  - **Orion Systems & UI (`systems/*`, `ui/*`)**: Document all exported update/render orchestrators, state mutators (`state: OrionState`), and HUD/Satchel components (explicitly noting React overlay HUD vs. pixel canvas HUD support).
  - **Commit Readiness Checks**: Run `npm run wiki`, `npm run lint`, `npm run build`, and verify `manage_task` and `git status` report a clean, self-contained state.
