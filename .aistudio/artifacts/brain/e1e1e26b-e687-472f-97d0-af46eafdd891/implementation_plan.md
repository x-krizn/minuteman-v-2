# Project Orion — Code Rules (`CODE_RULES.md`) Implementation & Baseline Remediation

Adopt the canonical **Project Orion Code Rules (`v0.1`)** into the cartridge documentation and resolve the baseline gaps identified in Section 9 (timer/RAF memory safety, missing license/JSDoc headers, HUD-mode JSDoc annotations, and `ORION-ANCHOR` synchronization between code and `AUTHORING_GUIDE.md`).

## User Review & Critical Decisions

> [!IMPORTANT]
> The scope below reflects your confirmed selections from the clarification step: we will add `CODE_RULES.md` to the cartridge docs, fix all timer and `requestAnimationFrame` cleanups, synchronize all `ORION-ANCHOR` tags between code and docs, and complete missing license/JSDoc blocks while keeping the existing file structure intact.

- **Confirmed Scope 1 — Documentation & Anchor Sync**: Add `CODE_RULES.md` to the `docs/` directory, index it in `INDEX.md` and `AUTHORING_GUIDE.md`, add `// [ORION-ANCHOR: INERTIA-PHYSICS-ENGINE]` in the inertia physics module, and register `[ORION-ANCHOR: CONTEXTUAL-LOOT-TABLES]` and `[ORION-ANCHOR: RENDER-VISION-LIGHTING]` in the `AUTHORING_GUIDE.md` anchor table.
- **Confirmed Scope 2 — Memory Safety Cleanups**: Ensure every `setTimeout` in the in-game menu has a tracked timer reference and a matching `clearTimeout` on replacement and unmount, and ensure `requestAnimationFrame` loops in the HUD and Satchel preview canvases pair 1:1 with `cancelAnimationFrame`.
- **Confirmed Scope 3 — License Headers & JSDoc**: Add the required Apache-2.0 license header and exported symbol JSDoc blocks to the 4 sprite/sheet modules that had zero JSDoc blocks, and document exported UI/HUD components (including whether each supports the React overlay HUD, pixel canvas HUD, or both) and state-mutating functions.
- **Confirmed Scope 4 — File Layout Preserved**: Keep the current file structure untouched in this pass without splitting files over 1,000 lines.

---

## 1. Overview & Core Concept

- **What It Does**: Establishes `CODE_RULES.md` as an active, tracked engineering standard inside the Orion documentation suite and brings the cartridge codebase into compliance with its memory safety, commenting, and anchor-tracking rules.
- **Target Audience / Persona**: Human developers and AI coding agents authoring or maintaining Project Orion systems, content modules, and UI overlays.
- **Key Value**: Prevents timer leaks on rapid menu navigation, eliminates drift between code anchors and documentation tables, and guarantees every module carries consistent license headers and JSDoc contracts.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  - **In-Game Menu & Toast Feedback**: Rapidly saving, loading, or deploying pilots in the pause menu cleanly cancels any pending toast or auto-resume timeout if the menu unmounts early, preventing stale callbacks after returning to gameplay.
  - **HUD & Satchel Canvas Loops**: Opening and closing the HUD or Satchel mech preview canvas cleanly starts and cancels its animation frame loop with zero orphaned frame requests.
  - **Documentation & Anchor Navigation**: Searching any `[ORION-ANCHOR: ID]` tag across code and `AUTHORING_GUIDE.md` resolves 1:1 in both directions.
- **Visual Identity & Theme**:
  - Preserves the existing pixel-art Title Menu, Cosmic World Map, and cockpit HUD visuals without altering gameplay balance or visual layout.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Centralized Timer Cleanup in `OrionGameMenu`**
  - *Chosen Approach*: Track both toast feedback timeouts and delayed resume timeouts in `useRef` handles, clear any previous handle before scheduling a new timeout, and clear both handles inside a `useEffect` unmount cleanup.
  - *Why*: Satisfies §3 ("Every `setTimeout` / `setInterval` / `requestAnimationFrame` has a matching `clear*` / `cancel*`") and eliminates the `4 / 0` `setTimeout` / `clearTimeout` gap in Section 9.
- **Decision 2 — Bidirectional Anchor Table Synchronization**
  - *Chosen Approach*: Tag the inertia engine with `// [ORION-ANCHOR: INERTIA-PHYSICS-ENGINE]` and add `[ORION-ANCHOR: CONTEXTUAL-LOOT-TABLES]` and `[ORION-ANCHOR: RENDER-VISION-LIGHTING]` to `AUTHORING_GUIDE.md`.
  - *Why*: Satisfies §1 and §5 so every anchor in `AUTHORING_GUIDE.md` exists in code and every anchor in code is documented in `AUTHORING_GUIDE.md`.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   PROJECT ORION — CODE_RULES COMPLIANCE                  │
├──────────────────────┬───────────────────────────┬───────────────────────┤
│  1. Docs & Anchors   │   2. Memory Safety (§3)   │  3. JSDoc & Headers   │
├──────────────────────┼───────────────────────────┼───────────────────────┤
│ • docs/CODE_RULES.md │ • OrionGameMenu timeouts  │ • 4 Sprite/Sheet      │
│ • docs/INDEX.md      │   tracked via useRef +    │   modules: Apache-2.0 │
│ • AUTHORING_GUIDE.md │   useEffect clearTimeout  │   + export JSDocs     │
│   + CONTEXTUAL-LOOT  │ • OrionHud & Satchel      │ • HUD & World Map     │
│   + VISION-LIGHTING  │   RAF loops paired with   │   exports: JSDoc with │
│ • inertiaSystem      │   cancelAnimationFrame    │   HUD-mode & state    │
│   + INERTIA-ANCHOR   │   & unmount guard         │   mutation contracts  │
└──────────────────────┴───────────────────────────┴───────────────────────┘
```

- **Data Model & State**: No changes to save schemas or `localStorage` keys; all existing pilot saves remain 100% compatible.
- **Verification**: Run automated audit checks for license headers, JSDoc presence, anchor parity, `setTimeout`/`clearTimeout` parity, and `tsc --noEmit` + production build verification.
