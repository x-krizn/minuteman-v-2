# Project Orion — Codebase Grooming, Strict Compiler Standards & Architecture Polish

Bring the entire repository to a strict, zero-warning engineering standard by enabling strict TypeScript and unused-symbol compiler flags, pruning legacy aliases and `.gitkeep` artifacts, completing item registry definitions, and synchronizing developer documentation.

---

## 1. Strict TypeScript & Unused-Symbol Compiler Enforcement (`tsconfig.json`)

Update `tsconfig.json` so `npm run lint` (`tsc --noEmit`) enforces strict type safety and catches dead code automatically:
- Enable `"strict": true`
- Enable `"noUnusedLocals": true`
- Enable `"noUnusedParameters": true`
- Enable `"noFallthroughCasesInSwitch": true`

### 1.1 Resolve All Strict & Unused-Symbol Diagnostics
Clean up the 9 unused-import / unused-parameter diagnostics surfaced by `--strict --noUnusedLocals --noUnusedParameters`:
- `src/App.tsx`: Remove unused default `React` import (React 19 `react-jsx` transform).
- `src/engine/core/shellStateMachine.ts`: Remove unused `Cartridge` type import.
- `src/cartridges/orion/ui/OrionSatchel.tsx`: Remove unused `REGION_REGISTRY` import.
- `src/cartridges/knight/combat.ts`: Remove unused `SWORD_ATTACKS` import.
- `src/cartridges/knight/database/enemies/enemy_knight.ts`: Prefix unused `_state` parameter in `update`.
- `src/cartridges/knight/database/progression/index.ts`: Remove unused `EquipmentLoadout` and `getItemDefinition` imports.
- `src/cartridges/knight/database/vendors/index.ts`: Remove unused `wanderingMerchant` import.
- `src/cartridges/knight/ui/KnightSatchel.tsx`: Remove unused `ALL_ITEMS` import.

---

## 2. Orion Codebase Grooming & Legacy Alias Removal

### 2.1 Remove `.gitkeep` & Legacy Export Aliases
- Delete `src/cartridges/orion/.gitkeep` and any other stray `.gitkeep` placeholders.
- In `src/cartridges/orion/database/world/index.ts`, remove the legacy `camelotBorderTownArea as borderTownSlumsArea` alias and export only canonical `u00 Universe` identifiers (`camelotBorderTownArea`, `m00TheBogArea`, `regionBelldorOutskirts`, `U00_UNIVERSE_CATALOG`, `UNIVERSE_WORLD_BY_ID`).

### 2.2 Complete Missing Item Registry Entry (`dungeon_key.ts`)
- Create `src/cartridges/orion/database/items/dungeon_key.ts` (`id: 'dungeon_key'`, **Camelot Waygate Key**) so the key item awarded by the Cathedral Dungeon Entrance / Reliquary (`border-town-v1.md`) resolves with a full `ItemWikiDefinition` (name, lore, icon color, and satchel tooltip) in `ITEM_REGISTRY`.

### 2.3 Clean Up Section Headers & Dead Helpers in the 5 Core Systems
- Audit `src/cartridges/orion/systems/` (`renderSystem.ts`, `worldSystem.ts`, `playerSystem.ts`, `combatSystem.ts`, `entitySystem.ts`) to ensure:
  - Consistent numbered section banners (`// ─── 1. ... ───`).
  - No duplicate or dead helper functions.
  - Consistent formatting and explicit return types on exported functions.

---

## 3. Documentation & Authoring Guide Synchronization (`AUTHORING_GUIDE.md`)

- Update `src/cartridges/orion/AUTHORING_GUIDE.md` so all file-tree diagrams and examples reflect the canonical **`u00 Universe`** catalog (`database/world/universe.ts`) and Belldor's 4 canonical zone directories (`m00_the_bog`, `camelot_border_town`, `m01_orc_encampment`, `camelot_interior`), plus instructions for adding a `Base64SpriteConfig` to character frames in `database/characters/`.
