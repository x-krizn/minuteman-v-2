# PROJECT ORION — CODE RULES
### Rules for any AI or human writing Orion code (Gemini / AI Studio system instruction)
*Version: 0.1 | Updated: 2026-10-29 | Status: Active*

---

## STATUS KEY

| Label | Meaning |
|---|---|
| LOCKED | Stated by the project owner as required. Do not weaken without an explicit design session. |
| PROPOSED | Drafted wording or specifics. Pending owner confirmation. |
| DERIVED | Observed in the repo at the baseline commit (section 10). Match it. |
| UNDEFINED | Known gap. Ask before assuming. |

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
- **Anchors.** Registries, world-composer boundaries and engine hooks carry a `// [ORION-ANCHOR: UPPER-KEBAB-ID]` comment. Never duplicate or delete an ID. A new anchor must be added to the anchor table in `docs/AUTHORING_GUIDE.md` in the same change.
- **Forbidden:** commented-out code, `TODO` / `FIXME` (record gaps as an Open Decision with an `OD-` id in the relevant doc), `@ts-ignore`, `@ts-expect-error`, `any`.
- **Spec-driven code** cites its source section in the JSDoc (for example `mechanics-v1.md §9`).

---

## 2. MODULARITY

- **Content is data, one entity per file.** Enemies, weapons, items, equipment, rooms, maps and tiles live as separate files under `database/<domain>/` and are picked up by `import.meta.glob`. New content means a new file. Do not edit engine files or registry `index.ts` files to add content.
- **Engine code goes in its domain folder:** `types/`, `systems/combat/`, `systems/render/`, `systems/world/`, `ui/hud/`, `ui/satchel/`. A new system goes in the matching folder. Do not grow an existing large file.
- **Import direction:** `database/` imports only from `types/` and sibling data. `systems/` never imports from `ui/`.
- **Pure functions** for math and resolution. Anything that mutates game state takes `state: OrionState` explicitly and says so in its JSDoc.
- **No magic numbers.** Shared dimensions and tuning values live in `constants.ts` (`SCREEN_W`, `SCREEN_H`, room `COLS` / `ROWS`, and so on). Read it before using a number.
- **File size.** Plan a split before a file passes 1,000 lines.
- **Both HUD modes.** Any HUD feature states in its JSDoc whether it supports the React overlay HUD, the pixel canvas HUD, or both.

---

## 3. MEMORY SAFETY

- **Every listener, timer, frame request and subscription has a cleanup in the same module.** React code uses a `useEffect` cleanup return. Every `setTimeout` / `setInterval` / `requestAnimationFrame` has a matching `clear*` / `cancel*`.
- **No unbounded growth.** Any module-level `Map`, `Set`, array or cache has a size cap or a defined clearing event (room change, waystation rest, and so on). State the eviction rule in its JSDoc.
- **Reuse heavy objects.** Offscreen canvases, bitmaps and audio nodes are created once, reused, and released (set to `null`, or `width = 0` for canvases) when replaced.
- **No allocation in per-frame paths.** No new arrays, objects or closures inside update or draw loops. Reuse buffers.
- **Remove entities everywhere.** When an entity is removed from a list, remove it from every index, map and target reference that points to it.
- **Types.** No `any`. No non-null assertion (`!`) without a comment explaining why it is safe.

---

## 4. NETWORK SAFETY

- **The Orion cartridge makes no network calls today.** Do not add one unless the request explicitly asks for it.
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

---

## 5. HOUSEKEEPING

- **Docs change in the same commit as the code.** A new anchor updates `docs/AUTHORING_GUIDE.md`. New equipment or feats update `docs/EQUIPMENT_AND_FEATS.md`. A new gap becomes an Open Decision with an `OD-` id.
- **Imports:** relative paths, alphabetized inside the braces, no unused imports or variables.
- **Formatting:** single quotes, two-space indent, trailing commas.
- **Naming:** `UPPER_SNAKE_CASE` constants, `camelCase` functions, `PascalCase` types. File names follow the neighbors in the same folder.
- **Before handing back:** `npm run lint` (`tsc --noEmit`) passes and `npm run build` succeeds.
- **No leftovers:** no debug logging, no dead code, no stray files.

---

## 6. RESPONSE PROTOCOL

1. Restate the request in one line.
2. List the files you read.
3. Make the change, as complete files or exact diffs.
4. List files touched, new exports, and anything `UNVERIFIED`.
5. If a rule here conflicts with the request, say which rule and ask.

---

## 7. FILE STRUCTURE AND CONDENSING

- The current file layout is **not permanent**. As the codebase grows, files may be merged or condensed.
- Condensing must keep **wiki-like editability**: a reader can find the one place that owns a topic, edit it, and not touch anything else.
- Condensing **never removes a current function or export.**
- Anchors survive any move. Update the docs that name a moved file in the same commit.

---

## 8. DESIGN GUARDRAILS

*DERIVED — from the project docs. See `docs/` for the sources.*

- PvP and PvE share identical rules. No mode-specific balance tracks.
- Player stats are static. Progression unlocks slots and systems, never numbers.
- Damage, healing and feat values are expressed against the Base Combat Unit (`1× BCU = 54`).
- Every skill has a windup tell.

---

## 9. VERIFIED BASELINE (commit c695448, 2026-10-29)

*DERIVED — re-check after major refactors.*

| Check | Result |
|---|---|
| `.ts` / `.tsx` files under `src/cartridges/orion` | 155 |
| License header on every sampled file | Yes (3 of 3 sampled) |
| `/**` JSDoc blocks | 510 |
| Files with no JSDoc at all | 4 |
| `// [ORION-ANCHOR: …]` anchors in code | 22 |
| `any`, `@ts-ignore`, `@ts-expect-error`, `TODO`, `FIXME` | 0 |
| Network calls (`fetch`, XHR, WebSocket, `http(s)://` in code) | 0 |
| `addEventListener` / `removeEventListener` | 0 / 0 |
| `setTimeout` / `clearTimeout` | 4 / 0 (known gap: `ui/OrionGameMenu.tsx`) |
| `requestAnimationFrame` / `cancelAnimationFrame` | 4 / 2 |
| Files over 1,000 lines | 9 (largest: `systems/combat/skillExecution.ts`, 2,860) |
| Docs anchors missing from code | `INERTIA-PHYSICS-ENGINE` |
| Code anchors missing from docs | `CONTEXTUAL-LOOT-TABLES`, `RENDER-VISION-LIGHTING` |

---

*CODE_RULES.md | Project Orion internal documentation*
*Version 0.1 — Initial rules for AI-assisted coding. Requirements from the owner; wording and specifics derived from the repo at c695448.*
