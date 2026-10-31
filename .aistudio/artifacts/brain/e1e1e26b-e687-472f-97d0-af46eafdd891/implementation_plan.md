# Project Orion — Codebase & Repository Cleanup Plan

A targeted repository, dependency, and codebase hygiene pass that removes temporary uploaded assets, updates root documentation and configuration for Project Orion, prunes unused npm dependencies, eliminates dead functions and unused types without altering the existing module structure, and synchronizes all `[ORION-ANCHOR]` tags with the Code Wiki index.

## User Review & Critical Decisions

> [!IMPORTANT]
> All cleanup boundaries below reflect your confirmed choices from Phase 1.

- **Repository & Root Hygiene**:
  - Remove temporary uploaded files and screenshots inside `public/assets/aistudio/` (since menu and feat blueprint artwork are now self-contained in `titleMenuAssets.ts` and the `u00` cosmos is rendered procedurally by `AetherCosmosCanvas.tsx`).
  - Remove the temporary root `COMMIT_SUMMARY.md` file and modernize `README.md`, `.gitignore`, and `package.json` metadata to accurately document Project Orion, the Minuteman handheld engine, and the Orion Code Wiki workflow.
  - Prune unused npm packages (`express`, `@types/express`, `dotenv`, `@google/genai`, `motion`) that are not imported anywhere in the client application.
- **Preserve Existing File Layout**:
  - Keep the current file and directory layout in `src/cartridges/orion/` intact—no disruptive file splitting—focusing strictly on removing dead code, unused exports, and duplicate helpers.
- **Code Quality & Documentation Sync**:
  - Audit `src/cartridges/orion/` for dead functions, unused types, and redundant helpers, while preserving every active `[ORION-ANCHOR]` tag and JSDoc contract.
  - Run `scripts/build-index.mjs --strict` to verify 100% anchor alignment and regenerate `public/wiki/wiki-index.json`.

---

## 1. Overview & Core Concept

- **What It Does**: Cleans the repository root, static assets directory, dependency tree, and TypeScript modules so the repository is lean, fast to install and deploy on GitHub Pages, and accurately documented.
- **Target Audience / Persona**: Developers and contributors cloning, building, or browsing Project Orion and its interactive Code Wiki on GitHub.
- **Key Value**: Eliminates multi-megabyte orphaned screenshot/upload clutter in `public/assets/aistudio/`, shrinks `node_modules` install overhead by removing unused server/animation packages, replaces outdated README documentation with accurate Project Orion & Code Wiki documentation, and guarantees zero dead exports or broken wiki anchors.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  - **Repository & GitHub Pages Visitors**: Cloning or viewing the repo on GitHub presents a comprehensive **Project Orion & Minuteman Engine** `README.md` covering controls, architecture, the in-game Pilot Codex (`SHIFT` -> `CODEX`), the standalone Code Wiki (`/wiki/` & `npm run wiki`), and GitHub Pages deployment.
  - **In-App Experience**: Zero visual regressions—the title screen, Pilot Satchel, Hex Feat Tree, Living Æther Cosmic World Map, Discovery-Gated Pilot Codex, and in-app Code Wiki viewer continue functioning identically with self-contained assets.
- **Visual Identity & Theme**:
  - Retains the existing Project Orion dark retro-industrial handheld aesthetic and oppressive cursed-bog lighting without layout changes.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Delete `public/assets/aistudio/` Temporary Attachments**
  - *Chosen Approach*: Remove all 14 temporary uploaded files (screenshots, duplicate `.md`/`.mjs`/`.html` attachments, and superseded PNGs) from `public/assets/aistudio/`.
  - *Why*: All required menu graphics (`LOGO1`, `menu-example-001`, and the Hex Feat blueprint) are embedded as self-contained Base64 data URIs in `titleMenuAssets.ts`, the world map is rendered live on HTML5 Canvas via `AetherCosmosCanvas.tsx`, and the wiki generator lives at `scripts/build-index.mjs` + `scripts/wiki/index.html`. Removing `public/assets/aistudio/` prevents shipping megabytes of raw Chrome screenshots in every production `dist/` build.
- **Decision 2: Prune Unused Runtime & Dev Dependencies**
  - *Chosen Approach*: Remove `express`, `@types/express`, `dotenv`, `@google/genai`, and `motion` from `package.json`, and rename the package from `"react-example"` to `"project-orion"`.
  - *Why*: The application is a pure client-side Vite + React 19 SPA with a zero-dependency Node `.mjs` wiki indexer. None of those packages are imported anywhere in `src/` or `scripts/`.
- **Decision 3: Conservative Dead-Code Pruning Without File Splitting**
  - *Chosen Approach*: Keep all current module boundaries intact and only remove unreferenced internal helpers, dead exports, and duplicate utility functions.
  - *Why*: Preserves git blame history, import paths, and `[ORION-ANCHOR]` stability while eliminating dead code.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                     REPOSITORY & BUILD PIPELINE                          │
├──────────────────────────────────────────────────────────────────────────┤
│  package.json ("project-orion")                                          │
│   ├─ npm run wiki  ──► scripts/build-index.mjs --out public/wiki --strict│
│   ├─ npm run dev   ──► build-index.mjs + vite --port=3000                │
│   ├─ npm run build ──► build-index (public) + vite build + (dist/wiki)   │
│   └─ npm run lint  ──► tsc --noEmit (strict + noUnusedLocals/Parameters) │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        CLEANED WORKSPACE LAYOUT                          │
├──────────────────────────────────────────────────────────────────────────┤
│  /README.md             (Updated for Project Orion, Controls & Wiki)     │
│  /.gitignore            (Updated for build artifacts & local caches)     │
│  /scripts/              (build-index.mjs + wiki/index.html template)     │
│  /public/wiki/          (Generated wiki-index.json + viewer)             │
│  /src/engine/           (Minuteman virtual console core & Web Audio)     │
│  /src/cartridges/orion/ (Orion systems, database, types, UI & docs)      │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Cleanup & Verification Sequence**:
  1. Remove all temporary files in `public/assets/aistudio/` and delete `COMMIT_SUMMARY.md`.
  2. Update `package.json` (prune unused packages `express`, `@types/express`, `dotenv`, `@google/genai`, `motion`; set package name to `"project-orion"`), update `.gitignore`, and rewrite `README.md` for Project Orion.
  3. Audit `src/` for unused exports, dead functions, and unused type definitions, removing any unreferenced code while keeping all active symbols and `[ORION-ANCHOR]` tags intact.
  4. Regenerate the Code Wiki (`node scripts/build-index.mjs --out public/wiki --strict`) and run `lint_applet` + `compile_applet` to verify zero TypeScript, Vite, or anchor errors.
