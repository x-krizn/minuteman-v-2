# MINUTEMAN REPOSITORY — OPEN DECISIONS
*Not rules. These are questions for the owner. When one is decided, the answer becomes rule text in `docs/CODE_RULES.md` and the row is removed here.*

| ID | Question | Current rule |
|---|---|---|
| OD-ARC-01 | `src/App.tsx` reads and writes Orion's graphics settings (`scanlinesEnabled`) through `systems/graphicsSettingsStore`. Move the setting into Minuteman and pass it through `CartridgeOverlayProps`, which already carries `scanlinesEnabled` and `onToggleScanlines`? This is a Minuteman edit. | CODE_RULES §9 (exception, do not add others), §10.1 |
| OD-ARC-02 | Orion has 28 and Knight 5 `database/` imports of logic modules. Move the shared helpers to a neutral folder, or relax the import-direction rule? | CODE_RULES §2 |
| OD-ARC-03 | 56 cartridge imports into Minuteman (Knight 13, Orion 43). Keep the section 10.5 allowlist as the permanent contract, define a stable Minuteman API (for example `src/sdk/`), or inject services through `Cartridge.init`? | CODE_RULES §10.5 |
| OD-ARC-04 | Add a boundary check to `npm run build` so sections 2 and 10 fail the build instead of relying on review? | CODE_RULES §10.8 |
| OD-ARC-06 | `scripts/build-index.mjs` defaults its root to `src/cartridges/orion` and `npm run build` runs it with `--strict`, so Minuteman's build depends on an Orion path. Keep, or give Orion its own wiki command? | CODE_RULES §11.3 |
| OD-ARC-07 | Should cartridges declare the Minuteman capabilities and versions they use, and Minuteman the ones it offers, so a mismatch turns a feature off instead of failing? Needs a new optional contract member. | CODE_RULES §10.7 |
| OD-ARC-08 | `engine/input/inputBindingsStore.ts` (Minuteman) stores under `orion_control_bindings_v1`, so a Minuteman file carries an Orion name. Renaming orphans saved bindings. Keep, or migrate? | CODE_RULES §4 |
| OD-ARC-09 | Knight's `stateStore.ts` imports `engine/core/registry`. Remove it through a Knight-side change? | CODE_RULES §10.5 |
| OD-ARC-10 | Anchors exist only for Orion. Extend an anchor convention to Knight and Minuteman, or leave them without? | CODE_RULES §1 |

*Closed: OD-ARC-05 (rules are repo-wide), OD-ARC-11 (location is `docs/CODE_RULES.md`).*
