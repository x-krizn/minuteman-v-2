# MINUTEMAN REPOSITORY — CODE RULES
### Rules for any AI or human writing code in this repo: Minuteman (the console shell), Knight and Orion (Gemini / AI Studio system instruction)
*Version: 0.4 | Updated: 2026-11-14 | Location: `docs/CODE_RULES.md`*

---

## AREAS

Code is code. **Sections 1 to 8 apply identically to all three areas.** Orion-only rules are in section 11.

| Area | Path | Edit policy |
|---|---|---|
| **Minuteman** | Everything outside `src/cartridges/`, plus `src/cartridges/index.ts`: `src/App.tsx`, `src/main.tsx`, `src/engine/`, `src/components/`, `src/types/`, `src/utils/`, `index.html`, `public/`, `vite.config.ts`, `package.json`, `tsconfig.json`, `scripts/`, `.github/` | **Frozen** (section 10) |
| **Knight** | `src/cartridges/knight/` | Edit for Knight tasks only |
| **Orion** | `src/cartridges/orion/` | Edit for Orion tasks only |

---

## HARD STOPS (READ FIRST)

1. **Minuteman is frozen.** Do not edit it. The only exception is a change a new cartridge feature cannot be built without, made under every condition in section 10.2. If you think you need one, stop and ask.
2. **A task edits one area.** Orion work edits only `src/cartridges/orion/`. Knight work edits only `src/cartridges/knight/`. Never edit a second area to make the first one easier.
3. **Cartridges import Minuteman only through the allowlist** in section 10.5, and never import each other.
4. **Minuteman never imports cartridge internals.** It reaches a cartridge only through `src/cartridges/index.ts`.
5. **New code is additive and independent.** It lives in new files, depends on existing code and not the reverse, and is removed by deleting those files and one wiring line (section 8).

---

## 1. COMMENTING

- **License header.** Every `.ts` / `.tsx` file starts with exactly:
  ```ts
  /**
   * @license
   * SPDX-License-Identifier: Apache-2.0
   */
  ```
- **JSDoc on every exported function, type, interface and registry.** The first sentence says what it does and when it applies. Put identifiers, coordinates and concrete values in backticks (`"rx,ry"`, `10 x 9`, `cx=3..4`).
- **Comment the why and the invariants,** not what the line already says. Put units in names or comments (`px`, `tiles`, `ms`, `frames`).
- **Anchors** belong to Orion (section 11). Do not add anchors to Knight or Minuteman code.
- **Forbidden:** commented-out code, `TODO` / `FIXME`, `@ts-ignore`, `@ts-expect-error`, `any`. Record a gap as an Open Decision with an `OD-` id in the relevant doc (section 5).
- **Spec-driven code** cites its source section in the JSDoc (for example `mechanics-v1.md §9`).

---

## 2. MODULARITY

- **Content is data, one entity per file.** Wherever an area has a `database/` folder (Knight and Orion), enemies, weapons, items, equipment, rooms, maps, tiles and skills live as separate files under `database/<domain>/`, picked up by `import.meta.glob`. New content means a new file. Do not edit engine files or registry `index.ts` files to add content.
- **Code goes in its domain folder.** A new system goes in the folder that matches its job. If none matches, create a new domain folder and add it to the table below in the same change. Do not grow an existing large file.

  | Area | Domain folders |
  |---|---|
  | Minuteman | `engine/core/`, `engine/input/`, `components/gamepad/`, `components/screen/`, `types/`, `utils/` |
  | Knight | `database/`, `renderer/`, `ui/`, `assets/`, plus flat modules at the root (`combat.ts`, `enemies.ts`, `physics.ts`, `pickups.ts`, `particles.ts`, `skills.ts`, `stateStore.ts`) |
  | Orion | `types/`, `database/`, `systems/combat/`, `systems/render/`, `systems/world/`, `ui/hud/`, `ui/satchel/`, `ui/settings/` |

- **Import direction (all areas):**
  - `types/` imports only other types.
  - `database/` imports only types, sibling data and `constants.ts`.
  - Logic modules never import `ui/` or `components/`. The cartridge entry file (`<area>Cartridge.ts`) may import its own `ui/`, because `renderOverlay` returns React nodes.
  - Known exceptions that exist today: Orion `database/` files import `systems/` in 28 places, Knight `database/` files import `physics` and `assets/sprites` in 5. Do not add new ones and do not copy the pattern.
- **Pure functions** for math and resolution. Anything that mutates game state takes the state object explicitly and says so in its JSDoc.
- **No magic numbers.** Shared dimensions and tuning values live in the area's `constants.ts` (Knight and Orion have one). Read it before using a number. Minuteman has no constants module, so adding one is a Minuteman edit (section 10).
- **File size.** Plan a split before a file passes 1,000 lines.
- **Cross-area imports** follow section 10, not this section.

---

## 3. MEMORY SAFETY

- **Every listener, timer, frame request and subscription has a cleanup in the same module.** React code uses a `useEffect` cleanup return. Every `setTimeout` / `setInterval` / `requestAnimationFrame` handle is cleared by a `clear*` / `cancel*` on a cleanup path. A loop that re-schedules itself needs one cancel for the loop, not one per call (see `engine/core/frameLoop.ts` and `engine/input/inputBindingsStore.ts`).
- **No unbounded growth.** Any module-level `Map`, `Set`, array or cache has a size cap or a defined clearing event (room change, waystation rest, and so on). State the eviction rule in its JSDoc.
- **Reuse heavy objects.** Offscreen canvases, bitmaps and audio nodes are created once, reused, and released (set to `null`, or `width = 0` for canvases) when replaced.
- **No allocation in per-frame paths.** No new arrays, objects or closures inside update or draw loops. Reuse buffers.
- **Remove entities everywhere.** When an entity is removed from a list, remove it from every index, map and target reference that points to it.
- **Types.** No `any`. No non-null assertion (`!`) without a comment explaining why it is safe.
- **Cartridges release everything in `Cartridge.destroy`** so Minuteman can unload them.

---

## 4. NETWORK SAFETY

- **No area makes network calls.** Do not add one unless the request explicitly asks for it.
- **If a network call is approved:**
  - Keep all network code in a single module.
  - HTTPS only, with a hard-coded host allowlist.
  - Use an `AbortController` timeout and a response size cap.
  - Treat every response as untrusted: validate its shape before use.
  - Never pass network data to `eval`, `Function` or `innerHTML`.
  - No tokens, keys or secrets in client code or in the repo.
  - The game must still work fully offline.
- **Persisted data (`localStorage`):**
  - Wrap every read and parse in `try` / `catch` and validate the result.
  - New save fields are optional, with defaults applied on load, so older saves still open.
  - Use the existing key constants. Never store credentials.
  - **New keys** are named `minuteman_<area>_<name>_v<N>`, with `<area>` = `knight` or `orion` (for example `minuteman_knight_save_v2`).
  - **Do not rename an existing key.** Renaming orphans saved data. Existing keys that do not match the pattern: `orion_graphics_settings_v1`, `orion_save_slot_canonical`, `orion_pilot_roster_v1`, and `orion_control_bindings_v1` (stored by Minuteman in `engine/input/inputBindingsStore.ts`).
  - A new key version reads the old one and never overwrites it.

---

## 5. HOUSEKEEPING

- **Docs change in the same commit as the code.** Orion's doc duties are in section 11. Record a gap as an Open Decision with an `OD-` id: architecture and cross-area gaps in `docs/OPEN_DECISIONS.md`, Orion design gaps in the relevant Orion doc.
- **Imports:** relative paths, alphabetized inside the braces, no unused imports or variables.
- **Formatting:** single quotes, two-space indent, trailing commas.
- **Naming:** `UPPER_SNAKE_CASE` constants, `camelCase` functions, `PascalCase` types. File names follow the neighbors in the same folder.
- **Before handing back:** `npm run lint` (`tsc --noEmit`) passes and `npm run build` succeeds. List every import you added that points outside the area you edited (expected: none).
- **No leftovers:** no debug logging, no dead code, no stray files.

---

## 6. RESPONSE PROTOCOL

1. Restate the request in one line and name the area it edits.
2. List the files you read.
3. Make the change, as complete files or exact diffs.
4. List files touched, new exports, new imports that leave the area, and anything `UNVERIFIED`. `UNVERIFIED` means you did not check it against the code or the output of a command.
5. If a rule here conflicts with the request, say which rule and ask.

---

## 7. FILE STRUCTURE AND CONDENSING

- The current file layout is not permanent. As the codebase grows, files may be merged or condensed.
- Condensing keeps wiki-like editability: a reader can find the one place that owns a topic, edit it, and not touch anything else.
- Condensing never removes a current function or export.
- Condensing stays inside one area. Never merge files across Minuteman, Knight and Orion.
- Anchors survive any move. Update the docs that name a moved file in the same commit.

---

## 8. NEW CODE IS INDEPENDENT

*Applies to all three areas. If new code causes an error, it is cut out without disturbing what already works.*

- **New feature, new files.** Put it in the matching domain folder as new files. Do not rewrite existing functions to make room.
- **Dependencies point from new to old.** New files import existing modules in the same area. Existing files do not import new ones, except at the single wiring point below.
- **One wiring point per feature.** Name it in the new file's JSDoc as `Wiring:` (file and function). The feature is switched off by removing that one call.
- **Removal note.** Each new feature's JSDoc states `Removal:` and lists the files to delete and the wiring line to remove. After removal, `npm run lint` and `npm run build` still pass.
- **Existing behavior does not change.** Do not change the signature, return shape, default or meaning of an existing export. Add a new export instead.
- **No shared mutable state with existing systems.** A new module owns its state. Shared state types gain only optional fields with defaults (section 4).

---

## 9. BASELINE

*Measured 2026-11-14 at commit `a3821f5`. Re-measure after major refactors.*

| Check | Minuteman | Knight | Orion |
|---|---|---|---|
| `.ts` / `.tsx` files | 28 | 88 | 168 |
| License header present | 28 of 28 | 88 of 88 | 168 of 168 |
| `any`, `@ts-ignore`, `@ts-expect-error`, `TODO`, `FIXME` | 0 | 0 | 0 |
| Network calls (`fetch`, XHR, WebSocket, `http(s)://`) | 0 | 0 | 0 |
| Exports with no JSDoc block immediately above | 0 of 95 | 0 of 216 | 0 of 1,370 |
| `addEventListener` / `removeEventListener` | 24 / 24 | 0 / 0 | 0 / 0 |
| `setTimeout` / `clearTimeout` | 1 / 1 | 3 / 6 | 3 / 5 |
| `requestAnimationFrame` / `cancelAnimationFrame` | 6 / 2 (two self-rescheduling loops, one cancel each) | 0 / 0 | 3 / 3 |
| Files over 1,000 lines | 0 | 0 | 20 |
| `import.meta.glob` uses | 0 | 9 | 14 |
| Import statements leaving the area | 4 into cartridges (below) | 13 into Minuteman | 43 into Minuteman |
| Imports of another cartridge | n/a | 0 | 0 |
| `[ORION-ANCHOR: …]` comments in code | 0 | 0 | 23 |

| Cross-area fact | Result |
|---|---|
| Minuteman imports of cartridges | `src/cartridges/index.ts` imports both cartridge indexes. `src/App.tsx` imports `cartridges` and `cartridges/orion/systems/graphicsSettingsStore`. The second import is an exception that exists today: do not add others. |
| Knight imports into Minuteman | `engine/core/soundSystem` 8, `types/cartridge` 2, `types/input` 1, `engine/input/inputBindingsStore` 1, `engine/core/registry` 1 (`stateStore.ts`) |
| Orion imports into Minuteman | `engine/core/soundSystem` 31, `engine/input/inputBindingsStore` 4, `types/input` 3, `types/cartridge` 1, `engine/input/hardwareGamepad` 1, `engine/input/gamepadStore` 1, `engine/input/keyboardMapper` 1, `utils/fullscreen` 1 |

---

## 10. AREA BOUNDARY

### 10.1 Minuteman freeze

- Do not edit Minuteman (paths in Areas). That includes small fixes, refactors, renames, formatting and dependency changes.
- Minuteman does not change to suit a cartridge's convenience, naming or structure. Cartridges adapt to Minuteman, not the reverse.
- If cartridge work seems to need a Minuteman change, do not make it. Say which file, why the cartridge cannot do it alone, and ask.

### 10.2 When a Minuteman change is allowed

All of these hold, and the request names the change:

1. A new cartridge feature cannot be implemented without it, and section 10.3 was done first.
2. **Additive only.** A new file, or a new **optional** member on the `Cartridge` contract (`types/cartridge.ts`). No change to the signature, behavior, defaults or imports of anything that exists.
3. **Cartridge-neutral.** Minuteman code never imports, names or branches on a cartridge (no `cart.id === 'orion'`, no cartridge name in a member name). A capability is a generic optional member.
4. **Feature-detected.** Minuteman calls a new member only behind a `typeof cart.member === 'function'` style guard, with errors logged through `registry.logError`, matching the pattern in `engine/core/cartridgeRunner.ts`. A cartridge without the member behaves exactly as before. Knight and Orion both work with no edits.
5. **Independently removable.** Deleting the new file or member leaves Minuteman building and running, and every cartridge unaffected.
6. The new member's JSDoc states its capability name, the version it was added in, what Minuteman does when it is absent, and how to remove it.

### 10.3 Order of work: cartridge first

- Build the cartridge side before any Minuteman change. Minuteman does not look for members it has not been told about, so a cartridge feature that Minuteman does not yet support is harmless.
- Declare new cartridge-level members on a cartridge-owned interface that extends `Cartridge` (for example `OrionCartridge`), and have the cartridge's create function return it. Do not edit `types/cartridge.ts` until Minuteman needs the member.
- The cartridge runs fully with Minuteman ignoring every new member. A feature that only works if Minuteman changes is unfinished until 10.2 is satisfied.

### 10.4 Cartridge to cartridge

- Knight never imports Orion and Orion never imports Knight.
- Shared code does not live in either cartridge. If both need it, stop and ask.

### 10.5 Allowed imports from a cartridge into Minuteman

Use named imports of exports that already exist. Do not change the Minuteman module to suit the cartridge.

| Minuteman module | Knight | Orion | Notes |
|---|---|---|---|
| `engine/core/soundSystem` | allowed | allowed | Stateful. Use the shared instance, never a copy. |
| `engine/input/inputBindingsStore` | allowed | allowed | Stateful. Same rule. |
| `types/input` | allowed | allowed | Use `import type`. |
| `types/cartridge` | allowed | allowed | Use `import type`. |
| `engine/input/hardwareGamepad`, `engine/input/gamepadStore`, `engine/input/keyboardMapper`, `utils/fullscreen` | not allowed | allowed | |
| `engine/core/registry` | not allowed | not allowed | Knight's `stateStore.ts` imports it today. Do not add imports of it and do not copy the pattern. |

- **Never import** from a cartridge: `src/components/`, `src/App.tsx`, `engine/core/cartridgeRunner`, `engine/core/shellStateMachine`, `engine/core/frameLoop`, `engine/core/assetLoader`, or the other cartridge.
- Any import that is not marked allowed for your cartridge is not allowed. Adding one requires the owner's explicit request.

### 10.6 What may depend on a cartridge

- Outside code reaches a cartridge only through `src/cartridges/<area>/index.ts`, and only for its `create<Area>Cartridge` function.
- Do not add exports to a cartridge `index.ts` for outside use.
- Do not export cartridge stores for Minuteman to read. Settings Minuteman owns (scanlines, sound, fullscreen) reach a cartridge through `CartridgeOverlayProps` or `CartridgeSurface`.

### 10.7 Versioning

- A cartridge sets `Cartridge.version` (a string). Minuteman displays it in cartridge labels and does not enforce it. Do not rely on it for compatibility.
- Persisted data is versioned by key suffix (section 4).

### 10.8 Enforcement

- No automated check enforces this section. Review is the control: every response lists new imports that leave the area (section 6), and every Minuteman edit is checked against 10.2.

---

## 11. ORION ONLY

*These rules depend on Orion's design, indexer or state type. Knight and Minuteman do not follow them.*

### 11.1 Anchors

- Registries, world-composer boundaries and engine hooks carry a `// [ORION-ANCHOR: UPPER-KEBAB-ID]` comment. Never duplicate or delete an ID. A new anchor is added to the anchor table in `docs/AUTHORING_GUIDE.md` (in `src/cartridges/orion/docs/`) in the same change.
- In any doc under `src/cartridges/orion/`, write `ORION-ANCHOR:` followed by an id only when that id exists in Orion code. The only other ids allowed are the placeholders `UPPER-KEBAB-ID` and `ID`.

### 11.2 State and HUD

- Anything that mutates game state takes `state: OrionState` explicitly and says so in its JSDoc.
- Any HUD feature states in its JSDoc whether it supports the React overlay HUD, the pixel canvas HUD, or both.

### 11.3 Docs

- Orion docs live in `src/cartridges/orion/docs/`. `scripts/build-index.mjs` reads `.md` files only under `src/cartridges/orion/`, and `npm run build` runs it with `--strict`, so any difference between anchors in code and anchors in those docs fails the build.
- New equipment or feats update `docs/EQUIPMENT_AND_FEATS.md`. A new anchor updates `docs/AUTHORING_GUIDE.md`.
- Do not hand-edit `public/wiki/`. The build generates it.

### 11.4 Design guardrails

*Source: the Orion docs in `src/cartridges/orion/docs/`.*

- Orion docs mark settled design decisions `LOCKED`. Do not change or weaken a `LOCKED` decision without an explicit design session.
- PvP and PvE share identical rules. No mode-specific balance tracks.
- Player stats are static. Progression unlocks slots and systems, never numbers.
- Damage, healing and feat values are expressed against the Base Combat Unit (`1× BCU = 54`).
- Every skill has a windup tell.

---

*CODE_RULES.md | Minuteman repository internal documentation | Version 0.4*
