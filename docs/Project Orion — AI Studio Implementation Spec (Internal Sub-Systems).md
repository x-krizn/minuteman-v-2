# Project Orion — AI Studio Implementation Specification: Internal Sub-Systems (`Mech-Unique Tech` vs. `Material-Type Components`)

> **Purpose**: Self-contained engineering specification for implementing Project Orion's **Internal Chassis Sub-Systems** (`Reactor Core / Energy Storage`, `Optics`, `Sensory A/B`, `Arm Actuators`, `Leg Striders`, and `Auxiliary / Tactical Utility` modules), enforcing **Physical Domain Separation (`0` Layer 2 Armor)**, **`0G` pure hardware on mechanical/sensor slots**, **`1G–2G` crystal/lens socketing on Reactors & Optics**, and **zero stat-profile redundancy**.

---

## 1. Architectural Invariants & Domain Rules

1. **Physical Domain Separation (`0` Layer 2 Armor)**:
   - Every internal sub-system (`reactor`, `optics`, `sensory_a`, `sensory_b`, `actuators`, `legs`, `aux_3`, `aux_4`, `utility`) **MUST** grant `armor: { durability: 0, rating: 0, threshold: 0 }`.
2. **Two-Tier Classification (`Mech-Unique Tech` vs. `Material-Type Components`)**:
   - **`mech_unique_tech`**: Proprietary manufacturer systems native to the 6 Starting Loadout Kits (`Sets 0–5`: `Warrior`, `Marauder`, `Guardian`, `Rogue`, `Wizard`, `Cleric`). The 1 chosen kit starts equipped; the remaining 5 sets' Mech-Unique Tech modules are discovered alongside their unchosen starter frames in Camelot post-boss chambers.
   - **`material_looted` / `material_crafted`**: Field-salvaged and workbench-crafted sub-system parts named strictly by their **physical/material construction** (never mech brand names). Each material-type component fills a distinct mechanical gap not covered by the 6 Mech-Unique Tech sets.
3. **Gemstone Socket Eligibility by Physical Domain**:
   - **Gem-Socketable (`1G–2G`)**: Only **Reactor Cores (`2G` unique / `1G` crafted)**, **Energy Storage (`1G`)**, and **Optics Suites (`1G`)** accept gemstones, using the dedicated **Internal Crystal Conduit & Optical Lens Table (`Section 4`)**—never the exterior armor plating table.
   - **Pure Mechanical / Electronic Hardware (`0G`)**: **Sensory A**, **Sensory B**, **Arm Actuators**, and **Leg Striders** **MUST** enforce `maxGemSlots: 0`.
4. **No Weapon or Exterior Armor Edits**: Do **not** alter Weapon (`Section 7.1`), Weapon Component (`Section 7.2`), or Exterior Armor (`AI_STUDIO_EXTERIOR_ARMOR_SPEC.md`) definitions.

---

## 2. TypeScript Data Structures

```typescript
export type SubSystemSlot =
  | 'reactor'
  | 'optics'
  | 'sensory_a'
  | 'sensory_b'
  | 'actuators'
  | 'legs'
  | 'aux_3'
  | 'aux_4'
  | 'utility';

export type SubSystemOrigin =
  | 'mech_unique_tech'
  | 'material_looted'
  | 'material_crafted';

export type ReactorFamily = 'ichor' | 'mana' | 'ether';

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

export interface SubSystemStatDelta {
  loadCapacity?: number;
  effectiveWeightDelta?: number;
  weight?: number;
  shield?: number;
  stability?: number;
  strikeMass?: number;
  strideSpeedPct?: number;
  heatVentingPct?: number;
  cooldownPct?: number;
  swingWindupPct?: number;
  lockAccuracyPct?: number;
  staggerDamagePct?: number;
  lightRadius?: number;
  enablesInertiaHud?: boolean;
}

export interface SubSystemModule {
  id: string;
  name: string;
  slot: SubSystemSlot;
  origin: SubSystemOrigin;
  heritageOrMaterial: string;
  reactorFamily?: ReactorFamily; // Present when slot === 'reactor'
  weight: number;
  capacityBonus?: number;        // Present on 'reactor' and 'legs'
  maxGemSlots: 0 | 1 | 2;        // 0 for sensory_a, sensory_b, actuators, legs, aux, utility
  modifiers: SubSystemStatDelta;
  craftRecipe?: {
    scrapCost: number;
    gemCosts: Partial<Record<GemstoneId, number>>;
  };
}
```

---

## 3. Complete Zero-Redundancy Sub-Systems Catalog (`79` Total Modules)

### 3.1 Core Systems, Reactors & Energy Storage (`slot: 'reactor'` · `11` Modules · `1G–2G`)
*(Zero looted material cores; the 6 Mech-Unique Reactors + 2 Energy Storage modules + 3 Crafted Material Cores cover all three families `Ichor`, `Mana`, `Ether` with zero stat-profile overlap).*

| ID | Name | Origin | Family | Cap Bonus | WT | Gem Slots | Modifiers (`SubSystemStatDelta`) | Craft Recipe |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `reactor_pnsy_turbine_mk4` | PNSY Alchemic Turbine Core Mk.IV | `mech_unique_tech` (`Warrior`) | `ichor` | `+24` | `8` | `2` | `heatVentingPct: +0.12, cooldownPct: -0.04, stability: -3` | — |
| `reactor_rad_battleheart_mk5` | RAD Battleheart Ether Reactor Mk.V | `mech_unique_tech` (`Marauder`) | `ichor` | `+26` | `14` | `2` | `heatVentingPct: +0.16, shield: +6, stability: +6, strideSpeedPct: -0.03` | — |
| `reactor_ti_manaheart_mk4` | TI Manaheart Reactor Mk.IV | `mech_unique_tech` (`Guardian`) | `mana` | `+24` | `8` | `2` | `shield: +14, heatVentingPct: +0.08, swingWindupPct: +0.03` | — |
| `reactor_vx_phantom_mk3` | VX Phantom Core Mk.III | `mech_unique_tech` (`Rogue`) | `ether` | `+28` | `4` | `2` | `heatVentingPct: +0.14, cooldownPct: -0.06, stability: -4` | — |
| `reactor_arc_infinite_well_mk6` | ARC Infinite Well Reactor Mk.VI | `mech_unique_tech` (`Wizard`) | `ether` | `+26` | `8` | `2` | `shield: +12, heatVentingPct: +0.12, cooldownPct: -0.06, stability: -4` | — |
| `reactor_sanc_heartwell_mk4` | SANC Heartwell Reactor Mk.IV | `mech_unique_tech` (`Cleric`) | `mana` | `+24` | `8` | `2` | `shield: +12, cooldownPct: -0.06, heatVentingPct: +0.08, strikeMass: -3` | — |
| `storage_cd_erd_lodestone` | Crystal Dynamics ERD Lodestone | `mech_unique_tech` (`Warrior Storage`) | `ichor` | `+24` | `8` | `1` | `cooldownPct: -0.08, heatVentingPct: +0.10, stability: -3` | — |
| `storage_vx_shadow_capacitor` | VX Shadow Capacitor | `mech_unique_tech` (`Rogue Storage`) | `ether` | `+28` | `4` | `1` | `cooldownPct: -0.08, heatVentingPct: +0.12, stability: -5` | — |
| `reactor_crafted_hematite_furnace` | Synthesized Ichor Overbore Core | `material_crafted` | `ichor` | `+28` | `18` | `1` | `heatVentingPct: +0.18, cooldownPct: -0.06` *(heavy 18 WT)* | `45 Scrap`, `hematite: 2, carnelian: 1` |
| `reactor_crafted_moonstone_well` | Synthesized Harmonic Mana Condenser | `material_crafted` | `mana` | `+18` | `11` | `1` | `shield: +20, heatVentingPct: +0.10` *(lower +18 Cap)* | `40 Scrap`, `moonstone: 1, demantoid: 1` |
| `reactor_crafted_rubellite_well` | Synthesized Ether Phase-Well Core | `material_crafted` | `ether` | `+20` | `7` | `1` | `cooldownPct: -0.08, shield: +12, stability: -5` | `40 Scrap`, `rubellite: 1, kyanite: 1` |

---

### 3.2 Optics Suites (`slot: 'optics'` · `9` Modules · `1G` Optical Lens Socket)
*(Only `optics_mat_quartz_vent_lens` is added as a looted material lens—uniquely trading Lock Accuracy for `+8%` Heat Venting, a niche absent from all 6 Mech-Unique Optics).*

| ID | Name | Origin | Light | WT | Gem Slots | Modifiers (`SubSystemStatDelta`) | Craft Recipe |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `optics_embersight` | Crystal Dynamics EmberSight Suite | `mech_unique_tech` (`Warrior`) | `+0.5` | `2` | `1` | `lockAccuracyPct: +0.08, staggerDamagePct: +0.06, heatVentingPct: -0.03` | — |
| `optics_be_foresight` | BE Foresight Targeting Array | `mech_unique_tech` (`Marauder`) | `+1.0` | `5` | `1` | `lockAccuracyPct: +0.14, staggerDamagePct: +0.08, swingWindupPct: +0.04` | — |
| `optics_aegis_radiant` | Aegis Radiant Targeting Array | `mech_unique_tech` (`Guardian`) | `+0.5` | `2` | `1` | `shield: +8, lockAccuracyPct: +0.06, cooldownPct: -0.05, heatVentingPct: -0.03` | — |
| `optics_veilsight` | Veilsight Targeting Suite | `mech_unique_tech` (`Rogue`) | `+1.0` | `1` | `1` | `staggerDamagePct: +0.12, lockAccuracyPct: +0.08, stability: -3` | — |
| `optics_arc_omniscient` | ARC Omniscient Array | `mech_unique_tech` (`Wizard`) | `+1.0` | `3` | `1` | `lockAccuracyPct: +0.12, staggerDamagePct: +0.08, shield: +6, heatVentingPct: -0.04` | — |
| `optics_sanc_providence` | SANC Providence Scanner | `mech_unique_tech` (`Cleric`) | `+0.5` | `2` | `1` | `shield: +8, cooldownPct: -0.08, lockAccuracyPct: +0.06, staggerDamagePct: -0.04` | — |
| `optics_mat_quartz_vent_lens` | Quartz-Etched Thermal-Vent Lens | `material_looted` | `+0.5` | `2` | `1` | `heatVentingPct: +0.08, lockAccuracyPct: -0.04` | — |
| `optics_crafted_kyanite_pinpoint` | Synthesized Arclight Pinpoint Lens | `material_crafted` | `+1.0` | `3` | `1` | `lockAccuracyPct: +0.12, staggerDamagePct: +0.08, shield: +4, heatVentingPct: -0.04` | `30 Scrap`, `kyanite: 1, rubellite: 1` |
| `optics_crafted_charoite_nightglass` | Synthesized Phantom Nightglass | `material_crafted` | `+0.5` | `1` | `1` | `staggerDamagePct: +0.10, stability: -4` | `25 Scrap`, `charoite: 1` |

---

### 3.3 Battlefield Sensory Arrays (`slots: 'sensory_a' | 'sensory_b'` · `16` Modules · `0G` Pure Hardware)
*(All 16 Sensory Arrays enforce `maxGemSlots: 0`. `sensory_a_mat_copper_capacitor` uniquely pairs `-6%` Cooldowns + `+4%` Heat Venting in `Sensory A`, while `sensory_b_inertial_gyro_telemetry` unlocks live HUD Inertia readouts in `Sensory B`).*

| ID | Name | Slot | Origin | WT | Gem Slots | Modifiers (`SubSystemStatDelta`) | Craft Recipe |
| :--- | :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| `sensory_a_federated_t7` | Federated T7 Sensor Array | `sensory_a` | `mech_unique_tech` (`Warrior`) | `2` | `0` | `lightRadius: +0.5, lockAccuracyPct: +0.06, cooldownPct: +0.02` | — |
| `sensory_a_nds_arcpulse` | NDS ArcPulse Sensor Grid | `sensory_a` | `mech_unique_tech` (`Marauder`) | `4` | `0` | `staggerDamagePct: +0.08, stability: +6, swingWindupPct: +0.03` | — |
| `sensory_a_solbright_flux` | Solbright Flux Sensor Grid | `sensory_a` | `mech_unique_tech` (`Guardian`) | `2` | `0` | `shield: +8, lightRadius: +0.5, heatVentingPct: -0.03` | — |
| `sensory_a_vx_phantom_net` | VX Phantom Network Sensor | `sensory_a` | `mech_unique_tech` (`Rogue`) | `1` | `0` | `lightRadius: +0.5, staggerDamagePct: +0.08, stability: -3` | — |
| `sensory_a_arc_manaflow` | ARC Manaflow Analyzer | `sensory_a` | `mech_unique_tech` (`Wizard`) | `2` | `0` | `cooldownPct: -0.06, lockAccuracyPct: +0.06, stability: -3` | — |
| `sensory_a_sanc_lifeline` | SANC Lifeline Monitor | `sensory_a` | `mech_unique_tech` (`Cleric`) | `2` | `0` | `shield: +6, cooldownPct: -0.05, staggerDamagePct: -0.03` | — |
| `sensory_a_mat_copper_capacitor` | Copper-Braid Capacitor Grid | `sensory_a` | `material_looted` | `2` | `0` | `cooldownPct: -0.06, heatVentingPct: +0.04, stability: -3` | — |
| `sensory_a_crafted_demantoid_pulse` | Synthesized Harmonic Field Sensor | `sensory_a` | `material_crafted` | `4` | `0` | `shield: +8, lightRadius: +0.5, cooldownPct: -0.06` | `25 Scrap`, `demantoid: 1` |
| `sensory_b_federated_echopulse` | Federated EchoPulse Scanner | `sensory_b` | `mech_unique_tech` (`Warrior`) | `2` | `0` | `lockAccuracyPct: +0.06, staggerDamagePct: +0.05, heatVentingPct: -0.02` | — |
| `sensory_b_nds_echostorm` | NDS EchoStorm Threat Analyzer | `sensory_b` | `mech_unique_tech` (`Marauder`) | `4` | `0` | `lockAccuracyPct: +0.10, stability: +6, cooldownPct: +0.03` | — |
| `sensory_b_aegis_lightveil` | Aegis Lightveil Analyzer | `sensory_b` | `mech_unique_tech` (`Guardian`) | `2` | `0` | `shield: +6, stability: +8, swingWindupPct: +0.03` | — |
| `sensory_b_vx_echonull` | VX Echo-Null Scanner | `sensory_b` | `mech_unique_tech` (`Rogue`) | `1` | `0` | `staggerDamagePct: +0.10, cooldownPct: -0.05, stability: -3` | — |
| `sensory_b_arc_convergence` | ARC Convergence Predictor | `sensory_b` | `mech_unique_tech` (`Wizard`) | `2` | `0` | `lockAccuracyPct: +0.10, staggerDamagePct: +0.06, heatVentingPct: -0.03` | — |
| `sensory_b_sanc_blessing_grid` | SANC Blessing Resonance Grid | `sensory_b` | `mech_unique_tech` (`Cleric`) | `2` | `0` | `cooldownPct: -0.07, shield: +6, lockAccuracyPct: -0.03` | — |
| `sensory_b_inertial_gyro_telemetry` | Inertial Gyro-Telemetry Array | `sensory_b` | `material_looted` | `3` | `0` | `enablesInertiaHud: true, stability: +12, lockAccuracyPct: +0.04, cooldownPct: +0.03` | — |
| `sensory_b_crafted_titanite_gyro` | Synthesized Aegis Gyro-Scanner | `sensory_b` | `material_crafted` | `6` | `0` | `stability: +14, shield: +8, lockAccuracyPct: +0.06` | `30 Scrap`, `titanite: 1, moonstone: 1` |

---

### 3.4 Arm Actuators (`slot: 'actuators'` · `9` Modules · `0G` Pure Hardware)
*(All 9 Arm Actuators enforce `maxGemSlots: 0`. `actuators_mat_torsion_counterweight` uniquely provides heat-neutral Stability + Swing Windup reduction without Reactor Heat penalties).*

| ID | Name | Origin | WT | Gem Slots | Modifiers (`SubSystemStatDelta`) | Craft Recipe |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `arms_cd_striker_vambraces` | Crystal Dynamics Striker Vambraces | `mech_unique_tech` (`Warrior`) | `4` | `0` | `swingWindupPct: -0.12, strikeMass: +6, cooldownPct: -0.06, heatVentingPct: -0.04` | — |
| `arms_be_siegebreaker_pauldrons` | BE Siegebreaker Stabilizer Servos | `mech_unique_tech` (`Marauder`) | `8` | `0` | `stability: +16, strikeMass: +10, swingWindupPct: +0.05` | — |
| `arms_aegis_radiant_vambraces` | Aegis Radiant Coupler Actuators | `mech_unique_tech` (`Guardian`) | `4` | `0` | `shield: +10, stability: +10, cooldownPct: -0.06, swingWindupPct: +0.03` | — |
| `arms_vx_whisperblade_gauntlets` | VX Whisperblade Micro-Gyros | `mech_unique_tech` (`Rogue`) | `2` | `0` | `swingWindupPct: -0.15, stability: +8, cooldownPct: -0.05, strikeMass: -4` | — |
| `arms_arc_prism_refractors` | ARC Prism Refractor Servos | `mech_unique_tech` (`Wizard`) | `4` | `0` | `shield: +12, lockAccuracyPct: +0.08, cooldownPct: -0.06, lightRadius: +0.5, stability: -4` | — |
| `arms_sanc_seraphic_pinions` | SANC Seraphic Pinion Actuators | `mech_unique_tech` (`Cleric`) | `4` | `0` | `shield: +10, cooldownPct: -0.10, stability: +8, strikeMass: -3` | — |
| `actuators_mat_torsion_counterweight` | Torsion-Spring Counterweight Joints | `material_looted` | `5` | `0` | `stability: +8, swingWindupPct: -0.06, strikeMass: -4` | — |
| `actuators_crafted_carnelian_piston` | Synthesized Heavy Siege Pistons | `material_crafted` | `12` | `0` | `strikeMass: +14, stability: +12, swingWindupPct: +0.06` | `30 Scrap`, `carnelian: 1, hematite: 1` |
| `actuators_crafted_spinel_overdrive` | Synthesized Assault Torque Servos | `material_crafted` | `5` | `0` | `swingWindupPct: -0.14, strikeMass: +6, cooldownPct: -0.07, heatVentingPct: -0.05` | `25 Scrap`, `spinel: 1` |

---

### 3.5 Leg Striders (`slot: 'legs'` · `9` Modules · `0G` Pure Hardware · `0` Armor)
*(All 9 Leg Striders enforce `maxGemSlots: 0` and `armor: { durability: 0, rating: 0, threshold: 0 }`. `legs_mat_baffled_radiator_strut` is the sole Leg Strider granting positive `+8%` Heat Venting).*

| ID | Name | Origin | Cap Bonus | WT | Gem Slots | Modifiers (`SubSystemStatDelta`) | Craft Recipe |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `legs_bwi_gatecrasher` | BWI Gatecrasher Striders | `mech_unique_tech` (`Warrior`) | `+24` | `7` | `0` | `strideSpeedPct: +0.04, stability: +6, heatVentingPct: -0.03` | — |
| `legs_fire_ice_outrigger` | Fire & Ice Outrigger Striders | `mech_unique_tech` (`Marauder`) | `+26` | `14` | `0` | `stability: +16, strideSpeedPct: -0.04` | — |
| `legs_dawnforge_stabilizer` | Dawnforge Stabilizer Striders | `mech_unique_tech` (`Guardian`) | `+26` | `7` | `0` | `stability: +12, strideSpeedPct: -0.02` | — |
| `legs_shadowcraft_ghost` | Shadowcraft Ghost Striders | `mech_unique_tech` (`Rogue`) | `+24` | `3` | `0` | `strideSpeedPct: +0.07, stability: -4` | — |
| `legs_arcanum_anchor` | Arcanum Anchor Striders | `mech_unique_tech` (`Wizard`) | `+24` | `7` | `0` | `stability: +10, shield: +6, strideSpeedPct: -0.02` | — |
| `legs_sanctum_steadfast` | Sanctum Steadfast Striders | `mech_unique_tech` (`Cleric`) | `+26` | `7` | `0` | `stability: +10, strideSpeedPct: +0.03, cooldownPct: +0.02` | — |
| `legs_mat_baffled_radiator_strut` | Baffled Radiator-Strut Legs | `material_looted` | `+26` | `8` | `0` | `heatVentingPct: +0.08, stability: +6, strideSpeedPct: -0.02` | — |
| `legs_crafted_carnelian_outriggers` | Synthesized Siege Load-Bearing Striders | `material_crafted` | `+32` | `16` | `0` | `loadCapacity: +32, stability: +16, strideSpeedPct: -0.05` | `35 Scrap`, `carnelian: 2, titanite: 1` |
| `legs_crafted_charoite_featherstep` | Synthesized Phantom Featherstep Striders | `material_crafted` | `+12` | `5` | `0` | `strideSpeedPct: +0.08, stability: -4` *(lower +12 Cap)* | `30 Scrap`, `charoite: 1, rubellite: 1` |

---

## 4. Sub-System Gemstone Tuning Table (`reactor` & `optics` Only)

- **Hard Validation Guard**: Attempting to socket any gemstone into `sensory_a`, `sensory_b`, `actuators`, or `legs` **MUST** be rejected (`maxGemSlots === 0`).
- **Duplicate Diminishing Returns on `2G` Reactors**: If a player sockets 2 identical gemstones into a `2G` `mech_unique_tech` Reactor Core, apply `[1.0, 0.7]` scaling (`100%` Copy 1, `70%` Copy 2) to both positive stats and drawbacks.
- **No Exterior Armor Stats**: Gemstones socketed into `reactor` or `optics` never grant `durability`, `rating`, or `threshold`.

| Gemstone | `reactor` (`1G–2G` · Energy & Thermal Conduit) Positive | `reactor` Drawback | `optics` (`1G` · Optical Focusing Lens) Positive | `optics` Drawback |
| :--- | :--- | :--- | :--- | :--- |
| `moonstone` | `shield: +14, cooldownPct: -0.03` | `weight: +2` | `shield: +8, lockAccuracyPct: +0.05` | `heatVentingPct: -0.02` |
| `spinel` | `heatVentingPct: +0.06, cooldownPct: -0.03` | `weight: +2` | `lockAccuracyPct: +0.07, staggerDamagePct: +0.05` | `heatVentingPct: -0.02` |
| `carnelian` | `loadCapacity: +8, heatVentingPct: +0.04` | `weight: +4` | `staggerDamagePct: +0.09, stability: +4` | `lockAccuracyPct: -0.03` |
| `titanite` | `shield: +10, stability: +4` | `weight: +3` | `shield: +6, lockAccuracyPct: +0.06` | `heatVentingPct: -0.02` |
| `demantoid` | `heatVentingPct: +0.08, cooldownPct: -0.04` | `weight: +2` | `cooldownPct: -0.06, lockAccuracyPct: +0.05` | `staggerDamagePct: -0.03` |
| `kyanite` | `cooldownPct: -0.05, shield: +8` | `weight: +2` | `lightRadius: +0.6, lockAccuracyPct: +0.08` | `stability: -2` |
| `charoite` | `cooldownPct: -0.04, effectiveWeightDelta: -2` | `shield: -4` | `lightRadius: +0.6, staggerDamagePct: +0.08` | `stability: -3` |
| `rubellite` | `shield: +12, cooldownPct: -0.04` | `heatVentingPct: -0.03` | `staggerDamagePct: +0.08, cooldownPct: -0.04` | `stability: -2` |
| `hematite` | `heatVentingPct: +0.10, loadCapacity: +4` | `weight: +3, shield: -4` | `lockAccuracyPct: +0.06, heatVentingPct: +0.04` | `shield: -3` |