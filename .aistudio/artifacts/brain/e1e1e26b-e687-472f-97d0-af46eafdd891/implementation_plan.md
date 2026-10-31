# Project Orion — Live Code Wiki & Strict Anchor Indexer Integration

Turn the Orion Code Wiki into a live, self-updating knowledge base and codebase health monitor that runs automatically during development and production builds, enforces zero anchor drift between source code and documentation, serves at `/wiki/`, and is directly browsable inside the in-game `[START]` menu.

## User Review & Critical Decisions

> [!IMPORTANT]
> All architectural and workflow decisions below were confirmed during interactive clarification:

- **Confirmed Decision 1 (Dual Access — `/wiki/` + In-App Start Menu Viewer)**: Serve the standalone Orion Code Wiki at `/wiki/` (`index.html` + `index.json`) and provide a dedicated **Code Wiki** sub-view inside the in-game `[START]` pause menu so developers and players can inspect anchors, file exports, markdown docs, and codebase health directly on the console screen.
- **Confirmed Decision 2 (Automated Dev/Build Indexing + `npm run wiki`)**: Run the zero-dependency indexer automatically on `dev` and `build`, and expose a dedicated `npm run wiki` script for on-demand regeneration.
- **Confirmed Decision 3 (Zero Anchor Drift + `--strict` Enforcement)**: Audit and reconcile any `ORION-ANCHOR` drift between TypeScript source files and markdown documentation now, and enable `--strict` mode in build/CI so future drift fails the build.

---

## 1. Overview & Core Concept

- **What It Does**: Indexes every TypeScript module, exported symbol, JSDoc block, `[ORION-ANCHOR: ...]` tag, markdown documentation page, and `CODE_RULES.md` health metric across Project Orion into a structured `index.json` dataset and interactive Wiki interface.
- **Target Audience / Persona**: The project author, contributors, and AI coding agents maintaining Project Orion's architecture and knowledge graph.
- **Key Value**: Eliminates documentation drift and makes the entire Orion knowledge graph (`anchors`, `files`, `docs`, and `health` telemetry) searchable in real time both as a standalone web wiki and inside the game's pause menu.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Standalone Web Wiki (`/wiki/index.html`)**: Opening `/wiki/` (or `/wiki/index.html`) in the browser loads the clean, fast, zero-dependency Orion Code Wiki with instant search across **Anchors**, **Files**, **Docs**, and **Health** metrics, complete with commit SHA metadata and GitHub source deep-links.
  2. **In-Game `[START]` Menu Code Wiki Viewer**: Pressing `START` during gameplay and selecting **CODE WIKI** opens an integrated terminal-styled viewer powered by the same live `index.json` payload—allowing instant filtering across all four tabs (`ANCHORS`, `FILES`, `DOCS`, `HEALTH`), collapsible export/JSDoc inspection, full Markdown document reading, and a quick-switch toggle to view the standalone `/wiki/index.html` page.
  3. **Automated Build & Strict Drift Gate**: Running `npm run wiki` or `npm run build` scans the Orion cartridge, verifies that every `ORION-ANCHOR` in code matches the markdown documentation (`inCodeNotDocs = 0`, `inDocsNotCode = 0`), and writes the fresh index for both local preview and GitHub Pages deployment.
- **Visual Identity & Theme**:
  - *Standalone Wiki*: Clean light/dark adaptive documentation theme (`#0f1512` dark surface, `#50fa7b` emerald accent, `ui-monospace` code blocks) from the provided wiki template.
  - *In-Menu Console Viewer*: Matches the Orion `[START]` menu tactical slate aesthetic (`#0f172a` / `#1e293b` panels, `#50fa7b` emerald and `#38bdf8` cyan accents, compact monospace tables) tailored to fit cleanly within the handheld console screen.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Output to Static Public Assets & Production Dist**
  - *Chosen Approach*: Configure the indexer script to populate the static public wiki folder prior to Vite dev/build and also emit directly to the production build output folder with `--strict` enabled.
  - *Why*: Generating into the static public directory makes `/wiki/index.json` and `/wiki/index.html` immediately fetchable at `/wiki/` in the Vite dev server (and inside the AI Studio preview iframe without `window.open`), while also bundling cleanly into the GitHub Pages deployment artifact.
- **Decision 2: Native Console Sub-View + Standalone Page Parity**
  - *Chosen Approach*: Feed the live `/wiki/index.json` into the `[START]` menu's Code Wiki sub-view with the same four tabs (`anchors`, `files`, `docs`, `health`) and instant search, plus a mode toggle to preview the raw standalone HTML wiki inside the viewport.
  - *Why*: Avoids `window.open` (which is blocked in sandboxed preview iframes) while giving full access to both the console-fitted viewer and the exact standalone HTML wiki page.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                   Orion Source & Markdown Knowledge Graph                 │
│     (TypeScript Exports, JSDoc Headers, ORION-ANCHOR Tags, Docs/*.md)     │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                    Zero-Dependency Wiki Indexer Script                    │
│  • Scans exports, JSDoc blocks, line counts, and CODE_RULES health stats  │
│  • Cross-checks code ORION-ANCHOR IDs against Markdown doc references     │
│  • Enforces --strict zero-drift check on build                            │
└───────────────────┬───────────────────────────────────┬───────────────────┘
                    │                                   │
                    ▼                                   ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────┐
│     Standalone Orion Code Wiki        │   │   In-Game [START] Menu Wiki   │
│         (/wiki/index.html)            │   │       Sub-View Overlay        │
│ • Instant search bar                  │   │ • Fetches live /wiki/index.json│
│ • Tabs: Anchors | Files | Docs | Health│  │ • Tabs: Anchors | Files |     │
│ • Safe DOM Markdown & table renderer  │   │   Docs | Health | Standalone  │
└───────────────────────────────────────┘   └───────────────────────────────┘
```

- **Data Model & State (`index.json`)**:
  - `meta`: `{ repo, sha, date, root }`
  - `stats`: `{ sourceFiles, jsdocBlocks, filesWithoutJsdoc, filesOver1000Lines, anchors, anyCasts, tsSuppressions, todoFixme, networkCalls, addEventListener, removeEventListener, setTimeout, clearTimeout, requestAnimationFrame, cancelAnimationFrame }`
  - `drift`: `{ inCodeNotDocs: string[], inDocsNotCode: string[] }`
  - `anchors`: `Array<{ id, path, line }>`
  - `files`: `Array<{ path, lines, jsdoc, exports: Array<{ kind, name, line, doc }> }>`
  - `docs`: `Array<{ path, title, text }>`
- **Interactive Component & State Mapping**:
  - **Search Input**: Filters `anchors` (by ID or path), `files` (by path or exported symbol name), and `docs` (by title, path, or full markdown body) in real time.
  - **Tab Switcher (`anchors` | `files` | `docs` | `health`)**: Switches active view and resets any open document reader state.
  - **Docs Reader**: Clicking any markdown document title renders its headings, code fences, tables, and bullet lists with a `← docs` back button.
  - **Health & Drift Audit**: Displays all 15 `CODE_RULES.md` health counters and highlights anchor sync status (`No anchor drift.`).
