# Project Orion — AI Studio Implementation Specification: Exterior Armor, Cyclopean Forge & Gemstone Socket Harmonics

> **Purpose**: Self-contained engineering specification for implementing the **Exterior Armor Roster (30 pieces across 10 sets)**, **Cyclopean Dwarf Forge crafting (`Scrap + Gemstones`)**, **Per-Slot Gemstone Socketing (`Core Frame` / `Dome` / `Aperture`)**, **`100% / 70% / 40%` Duplicate Diminishing Returns**, and **3-Tier Gemstone Resonance Combos** without modifying existing Weapon (`Section 7.1`) or Weapon Component (`Section 7.2`) catalogs.

---

## 1. Architectural Invariants & Domain Rules

1. **Physical Domain Separation**:
   - **Exterior Armor** (`slot: 'plating' | 'head' | 'arms'`) and **Shields** are the **ONLY** items permitted to grant Layer 2 Armor (`durability`, `rating`, `threshold`).
   - **Internal Chassis Modules** (`optics`, `sensory_a`, `sensory_b`, `actuators`, `reactor`, `legs`) MUST always have `armor: { durability: 0, rating: 0, threshold: 0 }`.
2. **Anatomical Coverage**:
   - **`plating` (`Core Frame`)**: Covers **Torso + Lower Body** (`~75%–80%` of combined exterior armor stats) and sets `baseLoadCapacity` (`84–116 WT`). `maxGemSlots: 3`.
   - **`head` (`Dome`)**: Covers **Head** (`~8%–10%` of combined exterior armor stats). `maxGemSlots: 2` (`3` on `head_camelot_knight`).
   - **`arms` (`Aperture`)**: Covers **Arms** (`~12%–15%` of combined exterior armor stats). `maxGemSlots: 2` (`3` on `arms_camelot_knight`).
3. **Acquisition & Equipping Rules**:
   - **`starter_post_boss` (`Sets 0–5` · `18` pieces)**: Pre-fitted universal pilot-standardized chassis sets. Directly equippable on pickup. The 1 chosen at New Game starts equipped; the other 5 are placed in Camelot post-boss chambers (not direct boss drop tables).
   - **`forge_blueprint` (`Sets 12–15` · `12` pieces)**: Custom-fitted armors cannot be looted as ready-to-wear gear. Players loot an **Armor Blueprint** item (`category: 'blueprint'`) and forge each piece at a stationary **Cyclopean Dwarf Forge** using **Scrap + Gemstones** (no new material item types).
4. **Weapons Untouched**: Do **not** alter weapon definitions, weapon modification components, or weapon gem socket rules.

---

## 2. TypeScript Data Structures

```typescript
export type ExteriorArmorSlot = 'plating' | 'head' | 'arms';
export type ArmorAcquisitionType = 'starter_post_boss' | 'forge_blueprint';
export type GemstoneId =
  | 'moonstone'
  | 'spinel'
  | 'carnelian'
  | 'titanite'
  | 'demantoid'
  | 'kyanite'
  | 'charoite'
  | 'rubellite'
  | 'hematite';
export type ReactorFamily = 'ichor' | 'mana' | 'ether';

export interface StatDelta {
  durability?: number;
  rating?: number;
  threshold?: number;
  shield?: number;
  loadCapacity?: number;
  effectiveWeightDelta?: number; // Negative reduces equipped load weight
  weight?: number;
  stability?: number;
  strikeMass?: number;
  strideSpeedPct?: number;       // e.g., 0.06 = +6%
  heatVentingPct?: number;       // e.g., 0.06 = +6%
  heatCostPct?: number;          // e.g., -0.03 = -3% heat generated
  cooldownPct?: number;          // e.g., -0.04 = -4% cooldown duration
  swingWindupPct?: number;       // e.g., -0.06 = -6% faster windup
  lockAccuracyPct?: number;      // e.g., 0.06 = +6%
  staggerDamagePct?: number;     // e.g., 0.08 = +8%
  guardMitigationPct?: number;   // e.g., 0.05 = +5%
  shieldRechargeDelayPct?: number;
  armorRepairEfficiencyPct?: number;
  energyCapacityPct?: number;
  lightRadius?: number;
  chargeMassPct?: number;        // Bonus effective weight during directional charge (mu > 0)
}

export interface ExteriorArmorPiece {
  id: string;
  name: string;
  setId: string;
  heritage: string;
  slot: ExteriorArmorSlot;
  acquisition: ArmorAcquisitionType;
  blueprintId?: string;
  weight: number;
  baseLoadCapacity?: number;     // Present only on slot === 'plating'
  armor: {
    durability: number;
    rating: number;
    threshold: number;
  };
  shieldBonus: number;
  maxGemSlots: 2 | 3;
  baseModifiers: StatDelta;
}

export interface ForgeRecipe {
  pieceId: string;
  blueprintId: string;
  scrapCost: number;
  gemCosts: Partial<Record<GemstoneId, number>>;
}
```

---

## 3. Canonical Exterior Armor Catalog (`30` Pieces · `10` Sets)

> **Migration Note**: Remove the 6 deprecated core-only variant IDs (`hw_plating_reactive`, `hw_plating_hardened`, `hw_plating_layered`, `hw_plating_ablative`, `hw_plating_arcanum_conduit`, `hw_plating_sanctum_reliquary`) if present in legacy data tables.

### 3.1 Core Frame Platings (`slot: 'plating'` · `10` Pieces · `3G` Each)

| ID | Name | Set / Heritage | Acquisition | WT | Cap | `DUR / RTG / THR` | Shield | Base Modifiers (`StatDelta`) |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `coreplate_bwi_bastion` | BWI Bastion Frame Plating | `set_00` (`Warrior`) | `starter_post_boss` | `15` | `90` | `140 / 9 / 5` | `+45` | `stability: +6, heatVentingPct: +0.06, strideSpeedPct: -0.02` |
| `coreplate_fire_ice_fortress` | Fire & Ice Fortress Frame Plating | `set_01` (`Marauder`) | `starter_post_boss` | `32` | `112` | `180 / 12 / 8` | `+35` | `stability: +14, strideSpeedPct: -0.06` |
| `coreplate_dawnforge_guardian` | Dawnforge Guardian Frame Plating | `set_02` (`Guardian`) | `starter_post_boss` | `17` | `90` | `155 / 10 / 6` | `+75` | `stability: +8, cooldownPct: +0.04` |
| `coreplate_shadowcraft_recon` | Shadowcraft Recon Frame Plating | `set_03` (`Rogue`) | `starter_post_boss` | `7` | `84` | `105 / 5 / 3` | `+40` | `strideSpeedPct: +0.06, cooldownPct: -0.04, stability: -6` |
| `coreplate_arcanum_projector` | Arcanum Heavy Projector Frame Plating | `set_04` (`Wizard`) | `starter_post_boss` | `15` | `90` | `110 / 6 / 4` | `+65` | `heatVentingPct: +0.08, cooldownPct: -0.04, stability: -4` |
| `coreplate_sanctum_support` | Sanctum Support Frame Plating | `set_05` (`Cleric`) | `starter_post_boss` | `15` | `90` | `130 / 8 / 4` | `+60` | `cooldownPct: -0.05, heatVentingPct: +0.06, strideSpeedPct: -0.02` |
| `plating_camelot_knight` | Camelot Knight Frame Plating | `set_12` (`Camelot`) | `forge_blueprint` | `31` | `112` | `175 / 12 / 7` | `+50` | `stability: +14, strideSpeedPct: -0.05` |
| `plating_novarin_outrider` | Novarin Outrider Rawhide Core Frame | `set_13` (`Orc Light`) | `forge_blueprint` | `8` | `84` | `110 / 6 / 3` | `+35` | `strideSpeedPct: +0.07, heatVentingPct: +0.06, stability: -7` |
| `plating_novarin_keshig` | Novarin Keshig Lamellar Core Frame | `set_14` (`Orc Medium`) | `forge_blueprint` | `18` | `94` | `150 / 10 / 5` | `+40` | `stability: +8, strideSpeedPct: +0.04, cooldownPct: +0.04` |
| `plating_novarin_tarkhan` | Novarin Tarkhan Cataphract Core Frame | `set_15` (`Orc Heavy`) | `forge_blueprint` | `34` | `116` | `190 / 13 / 8` | `+25` | `stability: +18, chargeMassPct: +0.10, strideSpeedPct: -0.07` |

### 3.2 Head Dome Plates (`slot: 'head'` · `10` Pieces · `2G` Standard / `3G` Camelot Knight)

| ID | Name | Set / Heritage | Acquisition | WT | `DUR / RTG / THR` | Shield | Gem Slots | Base Modifiers (`StatDelta`) |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `head_cd_g341_murmillio` | Crystal Dynamics G341 Murmillio | `set_00` (`Warrior`) | `starter_post_boss` | `6` | `20 / 1 / 1` | `+6` | `2` | `heatVentingPct: +0.04, lockAccuracyPct: -0.02` |
| `head_be_ironveil_dome` | BE Ironveil Command Dome | `set_01` (`Marauder`) | `starter_post_boss` | `12` | `24 / 2 / 1` | `+8` | `2` | `stability: +6, cooldownPct: +0.03` |
| `head_aegis_halo_dome` | Aegis Halo Command Dome | `set_02` (`Guardian`) | `starter_post_boss` | `7` | `18 / 2 / 1` | `+12` | `2` | `stability: +4, heatVentingPct: -0.03` |
| `head_vx_veilsight_helm` | VX Veilsight Command Helm | `set_03` (`Rogue`) | `starter_post_boss` | `3` | `10 / 1 / 0` | `+4` | `2` | `lightRadius: +0.5, lockAccuracyPct: +0.05, stability: -3` |
| `head_arc_omniscient_dome` | ARC Omniscient Command Dome | `set_04` (`Wizard`) | `starter_post_boss` | `6` | `14 / 1 / 1` | `+10` | `2` | `lightRadius: +0.5, lockAccuracyPct: +0.06, stability: -3` |
| `head_sanc_providence_helm` | SANC Providence Command Helm | `set_05` (`Cleric`) | `starter_post_boss` | `6` | `16 / 1 / 1` | `+10` | `2` | `cooldownPct: -0.04, swingWindupPct: +0.03` |
| `head_camelot_knight` | Camelot Knight Greathelm | `set_12` (`Camelot`) | `forge_blueprint` | `13` | `22 / 2 / 1` | `+10` | `3` | `stability: +6, lockAccuracyPct: +0.04, heatVentingPct: -0.04` |
| `head_novarin_outrider` | Novarin Outrider Nasal-Guard Dome | `set_13` (`Orc Light`) | `forge_blueprint` | `3` | `12 / 1 / 0` | `+5` | `2` | `lockAccuracyPct: +0.06, lightRadius: +0.5, stability: -3` |
| `head_novarin_keshig` | Novarin Keshig Aventail Dome | `set_14` (`Orc Medium`) | `forge_blueprint` | `7` | `20 / 1 / 1` | `+5` | `2` | `stability: +5, lockAccuracyPct: +0.04, heatVentingPct: -0.03` |
| `head_novarin_tarkhan` | Novarin Tarkhan War-Mask Dome | `set_15` (`Orc Heavy`) | `forge_blueprint` | `13` | `24 / 2 / 1` | `+5` | `2` | `stability: +8, staggerDamagePct: +0.08, heatVentingPct: -0.05` |

### 3.3 Arm Aperture Plates (`slot: 'arms'` · `10` Pieces · `2G` Standard / `3G` Camelot Knight)

| ID | Name | Set / Heritage | Acquisition | WT | `DUR / RTG / THR` | Shield | Gem Slots | Base Modifiers (`StatDelta`) |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `arms_bwi_twinstrike` | BWI Twinstrike Gauntlets | `set_00` (`Warrior`) | `starter_post_boss` | `8` | `24 / 1 / 1` | `0` | `2` | `stability: +6, lockAccuracyPct: +0.04, cooldownPct: +0.03` |
| `arms_fire_ice_line_holder` | Fire & Ice Line Holder | `set_01` (`Marauder`) | `starter_post_boss` | `16` | `34 / 2 / 1` | `0` | `2` | `stability: +10, strikeMass: +6, swingWindupPct: +0.05` |
| `arms_solbright_cleaver` | Solbright Cleaver Assemblies | `set_02` (`Guardian`) | `starter_post_boss` | `9` | `26 / 1 / 1` | `+10` | `2` | `strikeMass: +4, heatVentingPct: -0.03` |
| `arms_shadowcraft_silencer` | Shadowcraft Silencer Gauntlets | `set_03` (`Rogue`) | `starter_post_boss` | `4` | `14 / 1 / 0` | `0` | `2` | `swingWindupPct: -0.07, lockAccuracyPct: +0.04, stability: -4` |
| `arms_arcanum_channeler` | Arcanum Channeler Assemblies | `set_04` (`Wizard`) | `starter_post_boss` | `8` | `18 / 1 / 1` | `+12` | `2` | `lockAccuracyPct: +0.06, stability: -3` |
| `arms_sanctum_benediction` | Sanctum Benediction Assemblies | `set_05` (`Cleric`) | `starter_post_boss` | `8` | `22 / 1 / 1` | `+10` | `2` | `cooldownPct: -0.04, strikeMass: -3` |
| `arms_camelot_knight` | Camelot Knight Gauntlets | `set_12` (`Camelot`) | `forge_blueprint` | `17` | `28 / 2 / 1` | `+10` | `3` | `stability: +8, strikeMass: +6, swingWindupPct: +0.04` |
| `arms_novarin_outrider` | Novarin Outrider Archer Bracers | `set_13` (`Orc Light`) | `forge_blueprint` | `4` | `16 / 1 / 0` | `0` | `2` | `swingWindupPct: -0.08, lockAccuracyPct: +0.04, stability: -3` |
| `arms_novarin_keshig` | Novarin Keshig Vanguard Vambraces | `set_14` (`Orc Medium`) | `forge_blueprint` | `10` | `26 / 2 / 1` | `0` | `2` | `strikeMass: +6, swingWindupPct: -0.05, cooldownPct: +0.03` |
| `arms_novarin_tarkhan` | Novarin Tarkhan Siege Gauntlets | `set_15` (`Orc Heavy`) | `forge_blueprint` | `18` | `34 / 2 / 1` | `0` | `2` | `strikeMass: +10, stability: +8, swingWindupPct: +0.06` |

---

## 4. Cyclopean Dwarf Forge Recipes (`4` Blueprints · `12` Craftable Pieces)

- **Interaction Gate**: Only accessible when interacting with a stationary **Cyclopean Dwarf Forge** (`forge_interact`). Requires owning the corresponding `blueprintId` item plus sufficient `scrap` and `gemstones` in inventory.
- **Forging Output**: Creates the custom-fitted `ExteriorArmorPiece` directly in the player's inventory (ready to equip in `LOADOUT` and socket in `ARMORY`).

| Blueprint ID | Target Piece ID | Scrap Cost | Gemstone Cost |
| :--- | :--- | :---: | :--- |
| `bp_armor_camelot_knight` | `plating_camelot_knight` | `60` | `titanite: 2, moonstone: 1` |
| `bp_armor_camelot_knight` | `head_camelot_knight` | `30` | `titanite: 1, moonstone: 1` |
| `bp_armor_camelot_knight` | `arms_camelot_knight` | `35` | `titanite: 1, spinel: 1` |
| `bp_armor_novarin_outrider` | `plating_novarin_outrider` | `45` | `charoite: 2, rubellite: 1` |
| `bp_armor_novarin_outrider` | `head_novarin_outrider` | `20` | `charoite: 1` |
| `bp_armor_novarin_outrider` | `arms_novarin_outrider` | `25` | `charoite: 1, rubellite: 1` |
| `bp_armor_novarin_keshig` | `plating_novarin_keshig` | `60` | `spinel: 2, hematite: 1` |
| `bp_armor_novarin_keshig` | `head_novarin_keshig` | `25` | `spinel: 1` |
| `bp_armor_novarin_keshig` | `arms_novarin_keshig` | `30` | `spinel: 1, hematite: 1` |
| `bp_armor_novarin_tarkhan` | `plating_novarin_tarkhan` | `75` | `carnelian: 2, hematite: 1` |
| `bp_armor_novarin_tarkhan` | `head_novarin_tarkhan` | `35` | `carnelian: 1, hematite: 1` |
| `bp_armor_novarin_tarkhan` | `arms_novarin_tarkhan` | `40` | `carnelian: 1, hematite: 1` |

---

## 5. Per-Slot Gemstone Base Table (`100%` Copy 1 Values)

Each gemstone defines distinct `positive` and `drawback` `StatDelta` payloads per `ExteriorArmorSlot` (`plating`, `head`, `arms`):

| Gemstone | `plating` (`Core Frame`) Positive | `plating` Drawback | `head` (`Dome`) Positive | `head` Drawback | `arms` (`Aperture`) Positive | `arms` Drawback |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `moonstone` | `shield: +15, heatVentingPct: +0.05` | `weight: +3, durability: -5` | `shield: +10, cooldownPct: -0.04` | `stability: -3` | `shield: +10, guardMitigationPct: +0.05` | `strikeMass: -4` |
| `spinel` | `durability: +14, strideSpeedPct: +0.03` | `weight: +3, heatVentingPct: -0.04` | `lockAccuracyPct: +0.06, staggerDamagePct: +0.05` | `heatVentingPct: -0.03` | `swingWindupPct: -0.06, strikeMass: +4` | `heatVentingPct: -0.04` |
| `carnelian` | `durability: +20, threshold: +1, loadCapacity: +8` | `weight: +7, strideSpeedPct: -0.03` | `stability: +8, staggerDamagePct: +0.08` | `weight: +3, lockAccuracyPct: -0.03` | `strikeMass: +8, threshold: +1` | `weight: +4, swingWindupPct: +0.04` |
| `titanite` | `rating: +1, stability: +8` | `weight: +5, strideSpeedPct: -0.02` | `shield: +8, stability: +6` | `weight: +2, heatVentingPct: -0.03` | `stability: +8, rating: +1` | `weight: +3, swingWindupPct: +0.03` |
| `demantoid` | `heatVentingPct: +0.08, durability: +12` | `weight: +3, cooldownPct: +0.02` | `cooldownPct: -0.06, shield: +6` | `staggerDamagePct: -0.03` | `cooldownPct: -0.05, stability: +5` | `strikeMass: -3` |
| `kyanite` | `shield: +12, cooldownPct: -0.04` | `weight: +2, durability: -5` | `lightRadius: +0.5, lockAccuracyPct: +0.08` | `stability: -3` | `lockAccuracyPct: +0.08, shield: +6` | `stability: -3` |
| `charoite` | `effectiveWeightDelta: -4, strideSpeedPct: +0.04` | `durability: -8` | `lightRadius: +0.5, staggerDamagePct: +0.07` | `stability: -4` | `swingWindupPct: -0.07, effectiveWeightDelta: -2` | `stability: -4` |
| `rubellite` | `shield: +14, strideSpeedPct: +0.03` | `weight: +3, heatVentingPct: -0.04` | `cooldownPct: -0.05, staggerDamagePct: +0.06` | `stability: -3` | `swingWindupPct: -0.05, shield: +8` | `stability: -3` |
| `hematite` | `durability: +22, heatVentingPct: +0.06` | `weight: +5, shield: -5` | `stability: +7, heatVentingPct: +0.04` | `weight: +2, shield: -4` | `strikeMass: +6, heatVentingPct: +0.05` | `weight: +3, shield: -4` |

---

## 6. Socket Calculation Engine (`100% / 70% / 40%` + 3-Tier Combos)

### 6.1 Exact Evaluation Order (Per Equipped Armor Piece)

1. **Duplicate Diminishing Returns (`DUPLICATE_CURVE = [1.0, 0.7, 0.4]`)**:
   - Count occurrences `k` (`0`-indexed: `0` for 1st copy, `1` for 2nd copy, `2` for 3rd copy) of each `GemstoneId` socketed inside **that individual armor piece**.
   - Multiply both `positive` and `drawback` deltas of that socket instance by `DUPLICATE_CURVE[k]`.
2. **Triad vs. Pair Resonance Detection (On Unique Gems Present in That Piece)**:
   - Let `uniqueGems = new Set(socketedGems)`.
   - **Check Tier 3 Triads first** (only possible when `uniqueGems.size === 3`):
     - `ichor_crucible`: `{'hematite', 'spinel', 'carnelian'}` → `comboPositiveBoost = +0.35`, flat bonus `{ threshold: +1, heatVentingPct: +0.06 }`.
     - `mana_sanctuary`: `{'moonstone', 'titanite', 'demantoid'}` → `comboPositiveBoost = +0.35`, flat bonus `{ shield: +15, cooldownPct: -0.05 }`.
     - `ether_astral`: `{'rubellite', 'kyanite', 'charoite'}` → `comboPositiveBoost = +0.35`, flat bonus `{ lightRadius: +0.5, strideSpeedPct: +0.04 }`.
     - `prismatic_core`: `{'hematite', 'moonstone', 'rubellite'}` → `comboPositiveBoost = +0.30`, plus sets chassis-wide flag `prismaticUniversalAffinity = true` (`+0.10` positive gem boost on `head` and `arms` pieces).
   - **If no Triad is active**, check **Tier 2 Two-Gem Pairs** (for `3G` pieces with 2 distinct gems + 1 duplicate, a matching pair boosts **only the two paired gem types** by `+0.25`):
     - `tempered_crux`: `{'spinel', 'hematite'}` → `+0.25` positive boost to both gems + `{ heatCostPct: -0.03 }`.
     - `siege_bastion`: `{'carnelian', 'hematite'}` → `+0.25` positive boost to both gems + `{ chargeStability: +4 }`.
     - `aegis_lattice`: `{'titanite', 'moonstone'}` → `+0.25` positive boost to both gems + `{ shieldRechargeDelayPct: -0.10 }`.
     - `sanctum_choir`: `{'demantoid', 'moonstone'}` → `+0.25` positive boost to both gems + `{ armorRepairEfficiencyPct: +0.10 }`.
     - `prism_conduit`: `{'kyanite', 'rubellite'}` → `+0.25` positive boost to both gems + `{ energyCapacityPct: +0.05 }`.
     - `veil_specter`: `{'charoite', 'rubellite'}` → `+0.25` positive boost to both gems + `{ effectiveWeightDelta: -2 }`.
     - `forge_quench`: `{'carnelian', 'demantoid'}` → `+0.25` positive boost to both gems + `{ heatVentingPct: +0.04 }`.
     - `mirrored_glaze`: `{'titanite', 'kyanite'}` → `+0.25` positive boost to both gems + `{ lockAccuracyPct: +0.04 }`.
     - `dusk_striker`: `{'spinel', 'charoite'}` → `+0.25` positive boost to both gems + `{ swingWindupPct: -0.03 }`.
3. **Tier 1 Reactor Core Harmonic Resonance (`+20%` Core-Matched Boost)**:
   - Map equipped Reactor Core to `ReactorFamily`:
     - `ichor`: `{'hematite', 'spinel', 'carnelian'}`
     - `mana`: `{'moonstone', 'titanite', 'demantoid'}`
     - `ether`: `{'rubellite', 'kyanite', 'charoite'}`
   - If `gem` belongs to the equipped `ReactorFamily`, add `reactorBoost = +0.20`.
   - If `prismaticUniversalAffinity` is active from a Core Frame `Prismatic Core Triad` and `piece.slot !== 'plating'`, add `prismaticBoost = +0.10`.
4. **Final Per-Socket Multiplier**:
   - `positiveMultiplier = DUPLICATE_CURVE[k] * (1 + comboPositiveBoost + reactorBoost + prismaticBoost)`
   - `drawbackMultiplier = DUPLICATE_CURVE[k]` *(drawbacks never scale up from positive resonance combos)*
   - Round integer stats (`durability`, `rating`, `threshold`, `shield`, `loadCapacity`, `weight`, `effectiveWeightDelta`, `stability`, `strikeMass`) via `Math.round()`, and keep percentage/float stats (`strideSpeedPct`, `heatVentingPct`, `cooldownPct`, `swingWindupPct`, `lockAccuracyPct`, `staggerDamagePct`, `guardMitigationPct`, `lightRadius`) at 2 decimal places (`Math.round(v * 100) / 100`).
5. **Global Clamp**:
   - Cumulative combat tempo / stride speed modifiers remain hard-clamped to `[-0.30, +0.30]` (`0.70×` to `1.30×`) per Combat Golden Rule #4.