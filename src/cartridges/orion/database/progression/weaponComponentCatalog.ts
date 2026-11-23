/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Action1Mode,
  GemId,
  ModDomain,
  TraitLine,
  WeaponCategory,
  WeaponComponentMod,
  WeaponComponentPartDefinition,
  WeaponComponentSlotId,
} from '../../types';

/**
 * Maps canonical `CraftingRecipe['gemstoneType']` display titles to lowercase `GemId` keys (`Project Orion — Weapon Modification Overhaul Specification.md` §4).
 */
export const RECIPE_GEMSTONE_TO_ID: Record<
  | 'Moonstone'
  | 'Spinel'
  | 'Carnelian'
  | 'Titanite'
  | 'Demantoid'
  | 'Kyanite'
  | 'Charoite'
  | 'Rubellite'
  | 'Hematite',
  GemId
> = {
  Moonstone: 'moonstone',
  Spinel: 'spinel',
  Carnelian: 'carnelian',
  Titanite: 'titanite',
  Demantoid: 'demantoid',
  Kyanite: 'kyanite',
  Charoite: 'charoite',
  Rubellite: 'rubellite',
  Hematite: 'hematite',
};

/**
 * Human-readable anatomical labels for the three physical domains (`CONTACT`, `DELIVERY`, `REGULATION`) per Weapon Class (`Project Orion — Weapon Modification Overhaul Specification.md` §2.1).
 */
export const WEAPON_DOMAIN_ANATOMY_LABELS: Record<
  WeaponCategory,
  Record<ModDomain, string>
> = {
  'Blades: Straight': {
    CONTACT: 'Blade Grind & Point',
    DELIVERY: 'Crossguard & Hilt Grip',
    REGULATION: 'Pommel & Tang Balance',
  },
  'Blades: Curved': {
    CONTACT: 'Curved Belly & Spine',
    DELIVERY: 'Tsuka Wrap & Hilt Cant',
    REGULATION: 'Tsuba Guard & Tang Core',
  },
  'Impact & Axes': {
    CONTACT: 'Striking Crown & Beak',
    DELIVERY: 'Haft & Neck Langets',
    REGULATION: 'Butt-Cap & Vent Port',
  },
  Spears: {
    CONTACT: 'Spearhead & Lugs',
    DELIVERY: 'Shaft & Telescoping Haft',
    REGULATION: 'Sauroter Spike & Crossbar',
  },
  Bows: {
    CONTACT: 'Bow Limbs & Arrow Shelf',
    DELIVERY: 'Bowstring, Cams & Feed',
    REGULATION: 'Center Riser & Dampener',
  },
  Casters: {
    CONTACT: 'Emitter Nozzle & Chamber',
    DELIVERY: 'Ether Cell & Induction Coil',
    REGULATION: 'Heat-Sink Shroud & Stock',
  },
  Shields: {
    CONTACT: 'Rim Band & Center Boss',
    DELIVERY: 'Enarme Straps & Grip Boss',
    REGULATION: 'Core Backing & Vent Lattice',
  },
  'Carriers & Munitions': {
    CONTACT: 'Munition Payload & Primer',
    DELIVERY: 'Release Latch & Feed Hopper',
    REGULATION: 'Baffle Housing & Harness',
  },
};

/**
 * Resolves the baseline `Action1Mode` (`'MAGAZINE' | 'DRAW_CHARGE' | 'MELEE_COMBO' | 'BURST_VOLLEY'`) for any of the 8 Weapon Classes (`Project Orion — Weapon Modification Overhaul Specification.md` §2.4 & §4).
 */
export function resolveWeaponClassAction1Mode(
  weaponClass: WeaponCategory | undefined
): Action1Mode {
  switch (weaponClass) {
    case 'Bows':
      return 'DRAW_CHARGE';
    case 'Casters':
      return 'MAGAZINE';
    case 'Carriers & Munitions':
      return 'BURST_VOLLEY';
    case 'Blades: Straight':
    case 'Blades: Curved':
    case 'Impact & Axes':
    case 'Spears':
    case 'Shields':
    default:
      return 'MELEE_COMBO';
  }
}

/**
 * Maps a (`WeaponCategory`, `ModDomain`) pair to its legacy `WeaponComponentSlotId` for backward compatibility with older save payloads.
 */
export function mapDomainToLegacyComponentSlot(
  weaponClass: WeaponCategory,
  domain: ModDomain
): WeaponComponentSlotId {
  switch (weaponClass) {
    case 'Blades: Straight':
    case 'Blades: Curved':
      return domain === 'CONTACT' ? 'blade' : domain === 'DELIVERY' ? 'grip' : 'hilt';
    case 'Impact & Axes':
      return domain === 'CONTACT' ? 'head' : domain === 'DELIVERY' ? 'grip' : 'hilt';
    case 'Spears':
      return domain === 'CONTACT' ? 'tip' : domain === 'DELIVERY' ? 'grip' : 'head';
    case 'Bows':
      return domain === 'CONTACT' ? 'focus' : domain === 'DELIVERY' ? 'grip' : 'catalyst';
    case 'Casters':
      return domain === 'CONTACT' ? 'focus' : domain === 'DELIVERY' ? 'grip' : 'sight';
    case 'Carriers & Munitions':
      return domain === 'CONTACT' ? 'sight' : domain === 'DELIVERY' ? 'actuator' : 'grip';
    case 'Shields':
      return domain === 'CONTACT' ? 'head' : domain === 'DELIVERY' ? 'grip' : 'focus';
  }
}

/**
 * Complete catalog of the 61 Bespoke Weapon Components across all 8 Weapon Classes (`Project Orion — Weapon Modification Overhaul Specification.md` §3.1–§3.8).
 * Strictly partitions `CRAFTED` (28 components, `maxGemSlots: 1`, forged from `Scrap + Gemstones`)
 * from `LOOTED` (33 components, `maxGemSlots: 1..3`, field discovery only, `recipe: null`).
 *
 * Wiring: Imported by `database/progression/weaponComponentMods.ts` and `database/progression/index.ts`.
 * Removal: Delete `weaponComponentCatalog.ts` and `weaponComponentMods.ts` and remove their re-export line in `database/progression/index.ts`.
 */
export const BESPOKE_WEAPON_COMPONENT_CATALOG: WeaponComponentMod[] = [
  // ─── 3.1 BLADES: STRAIGHT (8 Components: 3 Crafted, 5 Looted) ──────────────
  {
    id: 'wmod_straight_hollow_fuller',
    name: 'Hollow-Ground Fuller',
    weaponClass: 'Blades: Straight',
    domain: 'CONTACT',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 22, gemstoneType: 'Charoite', gemstoneCount: 1 },
    primaryGemId: 'charoite',
    statModifiers: {
      tempoDelta: 0.1,
      weightDelta: -2,
      impulseMultDelta: -0.15,
    },
    effectSummary: '+10% swing tempo, -2 WT',
    tradeOffSummary: '-15% Melee Impulse (J)',
  },
  {
    id: 'wmod_straight_ribbed_cord_grip',
    name: 'Ribbed Cord Grip',
    weaponClass: 'Blades: Straight',
    domain: 'DELIVERY',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 18, gemstoneType: 'Titanite', gemstoneCount: 1 },
    primaryGemId: 'titanite',
    statModifiers: {
      stabilityDelta: 4,
      weightDelta: 1,
    },
    effectSummary: '+4 Stability (S) during combo chains',
    tradeOffSummary: '+1 WT',
  },
  {
    id: 'wmod_straight_wheel_pommel',
    name: 'Wheel Counterweight Pommel',
    weaponClass: 'Blades: Straight',
    domain: 'REGULATION',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 24, gemstoneType: 'Demantoid', gemstoneCount: 1 },
    primaryGemId: 'demantoid',
    statModifiers: {
      tempoDelta: 0.12,
      swapSpeedMultDelta: 0.1,
      weightDelta: 3,
    },
    effectSummary: '-12% post-swing recovery, +10% swap speed',
    tradeOffSummary: '+3 WT',
  },
  {
    id: 'wmod_straight_bodkin_tip',
    name: 'Reinforced Bodkin Tip',
    weaponClass: 'Blades: Straight',
    domain: 'CONTACT',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'spinel',
    damageTypeOverride: 'Pierce',
    statModifiers: {
      thrPierceDelta: 4,
      cleaveArcMultDelta: -0.18,
    },
    effectSummary: 'Sets damageType to Pierce and ignores +4 Armor THR on thrust steps',
    tradeOffSummary: '-18% horizontal cleave arc',
  },
  {
    id: 'wmod_straight_executioner_grind',
    name: 'Flat-Tipped Executioner Grind',
    weaponClass: 'Blades: Straight',
    domain: 'CONTACT',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 3,
    recipe: null,
    primaryGemId: 'carnelian',
    damageTypeOverride: 'Impact',
    statModifiers: {
      finisherBcuMultDelta: 0.2,
      impulseMultDelta: 0.2,
      durShredMultDelta: 0.15,
      tempoDelta: -0.1,
      weightDelta: 2,
      thrPierceDelta: -3,
    },
    effectSummary: 'Converts damageType to Impact, +20% BCU on finisher steps, +20% Impulse (J)',
    tradeOffSummary: '-10% swing tempo, +2 WT, -3 THR pierce',
  },
  {
    id: 'wmod_straight_parrying_lugs',
    name: 'Flanged Parrying Lugs',
    weaponClass: 'Blades: Straight',
    domain: 'DELIVERY',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'titanite',
    statModifiers: {
      parryWindowBonusSec: 0.05,
      weightDelta: 2,
      swapSpeedMultDelta: -0.06,
    },
    effectSummary: '+0.05s Action 4 Perfect Parry window',
    tradeOffSummary: '+2 WT, -6% swap speed',
  },
  {
    id: 'wmod_straight_conduit_crossguard',
    name: 'Conduit-Vented Crossguard',
    weaponClass: 'Blades: Straight',
    domain: 'DELIVERY',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 3,
    recipe: null,
    primaryGemId: 'kyanite',
    action1Override: {
      kind: 'BEHAVIORAL',
      requiresMode: 'MELEE_COMBO',
      secondaryProjectile: {
        damageType: 'Wave',
        bcuScale: 0.35,
        rangeMeters: 3.0,
        triggerStep: 'FINISHER',
      },
    },
    statModifiers: {
      heatPerActionDelta: 3,
      weightDelta: 2,
    },
    effectSummary: 'Emits short-range Wave arc (3.0m, 0.35x BCU) on Combo Step 3 / Finisher',
    tradeOffSummary: '+3 Reactor Heat per wave, +2 WT',
  },
  {
    id: 'wmod_straight_thermal_tang',
    name: 'Thermal-Vented Tang',
    weaponClass: 'Blades: Straight',
    domain: 'REGULATION',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'hematite',
    statModifiers: {
      heatVentOnHit: 3,
      stabilityDelta: -3,
    },
    effectSummary: 'Vents -3 Reactor Heat per hit',
    tradeOffSummary: '-3 Stability (S)',
  },

  // ─── 3.2 BLADES: CURVED (7 Components: 4 Crafted, 3 Looted) ────────────────
  {
    id: 'wmod_curved_broadened_belly',
    name: 'Broadened Belly Grind',
    weaponClass: 'Blades: Curved',
    domain: 'CONTACT',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 22, gemstoneType: 'Carnelian', gemstoneCount: 1 },
    primaryGemId: 'carnelian',
    statModifiers: {
      cleaveArcMultDelta: 0.15,
      durShredMultDelta: 0.1,
      tempoDelta: -0.08,
    },
    effectSummary: '+15% cleave arc width & +10% Layer 2 Armor DUR shred',
    tradeOffSummary: '-8% swing tempo',
  },
  {
    id: 'wmod_curved_iaijutsu_profile',
    name: 'Lightweight Iaijutsu Profile',
    weaponClass: 'Blades: Curved',
    domain: 'CONTACT',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 28, gemstoneType: 'Charoite', gemstoneCount: 1 },
    primaryGemId: 'charoite',
    action1Override: {
      kind: 'BEHAVIORAL',
      requiresMode: 'MELEE_COMBO',
      comboStepCountOverride: 3,
    },
    statModifiers: {
      tempoDelta: 0.12,
      lungeMultDelta: 0.15,
      impulseMultDelta: -0.15,
    },
    effectSummary: 'Fast 3-step draw-cut chain (+12% step tempo) with +15% lunge on Step 1',
    tradeOffSummary: '-15% Melee Impulse (J)',
  },
  {
    id: 'wmod_curved_silk_cord_wrap',
    name: 'Tapered Silk-Cord Wrap',
    weaponClass: 'Blades: Curved',
    domain: 'DELIVERY',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 18, gemstoneType: 'Spinel', gemstoneCount: 1 },
    primaryGemId: 'spinel',
    statModifiers: {
      step1BcuMultDelta: 0.08,
      stabilityDelta: -2,
    },
    effectSummary: '+8% draw-cut BCU scaling on Step 1',
    tradeOffSummary: '-2 Stability (S)',
  },
  {
    id: 'wmod_curved_heavy_guard_disc',
    name: 'Heavy Iron Guard Disc',
    weaponClass: 'Blades: Curved',
    domain: 'REGULATION',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 22, gemstoneType: 'Titanite', gemstoneCount: 1 },
    primaryGemId: 'titanite',
    statModifiers: {
      stabilityDelta: 5,
      weightDelta: 3,
    },
    effectSummary: '+5 Stability (S) on guard/parry',
    tradeOffSummary: '+3 WT',
  },
  {
    id: 'wmod_curved_serrated_sawback',
    name: 'Serrated Spine Sawback',
    weaponClass: 'Blades: Curved',
    domain: 'CONTACT',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'rubellite',
    statModifiers: {
      shieldRegenDebuffSec: 3,
      durShredMultDelta: 0.12,
      heatPerActionDelta: 2,
    },
    effectSummary: 'Inflicts -15% armor repair / shield regen for 3s',
    tradeOffSummary: '+2 Reactor Heat per combo',
  },
  {
    id: 'wmod_curved_canted_duelling_hilt',
    name: 'Forward-Canted Duelling Hilt',
    weaponClass: 'Blades: Curved',
    domain: 'DELIVERY',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'kyanite',
    statModifiers: {
      lungeMultDelta: 0.2,
      guardMitigationMultDelta: -0.1,
    },
    effectSummary: '+20% forward lunge step distance',
    tradeOffSummary: '-10% guard mitigation (RTG)',
  },
  {
    id: 'wmod_curved_resonance_core',
    name: 'Hollow Resonance Core',
    weaponClass: 'Blades: Curved',
    domain: 'REGULATION',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 3,
    recipe: null,
    primaryGemId: 'carnelian',
    statModifiers: {
      impulseMultDelta: 0.15,
      weightDelta: 2,
      swapSpeedMultDelta: -0.1,
    },
    effectSummary: '+15% Melee Impulse (J) on finisher steps',
    tradeOffSummary: '+2 WT, -10% swap speed',
  },

  // ─── 3.3 IMPACT & AXES (7 Components: 3 Crafted, 4 Looted) ─────────────────
  {
    id: 'wmod_hafted_flanged_crown',
    name: 'Flanged Impact Crown',
    weaponClass: 'Impact & Axes',
    domain: 'CONTACT',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 24, gemstoneType: 'Carnelian', gemstoneCount: 1 },
    primaryGemId: 'carnelian',
    damageTypeOverride: 'Impact',
    statModifiers: {
      durShredMultDelta: 0.2,
      impulseMultDelta: 0.2,
      tempoDelta: -0.1,
      thrPierceDelta: -3,
    },
    effectSummary: 'Sets damageType to Impact and adds +20% DUR shred',
    tradeOffSummary: '-10% swing tempo, -3 THR pierce',
  },
  {
    id: 'wmod_hafted_steel_langets',
    name: 'Steel-Reinforced Langets',
    weaponClass: 'Impact & Axes',
    domain: 'DELIVERY',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 20, gemstoneType: 'Titanite', gemstoneCount: 1 },
    primaryGemId: 'titanite',
    statModifiers: {
      stabilityDelta: 6,
      weightDelta: 3,
    },
    effectSummary: '+6 Stability (S) mid-swing',
    tradeOffSummary: '+3 WT',
  },
  {
    id: 'wmod_hafted_lead_ballast_cap',
    name: 'Lead Ballast Butt-Cap',
    weaponClass: 'Impact & Axes',
    domain: 'REGULATION',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 24, gemstoneType: 'Hematite', gemstoneCount: 1 },
    primaryGemId: 'hematite',
    statModifiers: {
      impulseMultDelta: 0.2,
      weightDelta: 4,
      tempoDelta: -0.08,
    },
    effectSummary: '+20% Melee Impulse (J) (easier grounded knockdowns)',
    tradeOffSummary: '+4 WT, -8% tempo',
  },
  {
    id: 'wmod_hafted_crows_beak',
    name: "Armor-Piercing Crow's Beak",
    weaponClass: 'Impact & Axes',
    domain: 'CONTACT',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'spinel',
    damageTypeOverride: 'Pierce',
    statModifiers: {
      thrPierceDelta: 6,
      cleaveArcMultDelta: -0.25,
      impulseMultDelta: -0.2,
    },
    effectSummary: 'Converts damageType to Pierce and ignores +6 THR',
    tradeOffSummary: '-25% cleave arc, -20% Impulse (J)',
  },
  {
    id: 'wmod_hafted_seismic_anvil',
    name: 'Seismic Anvil Head',
    weaponClass: 'Impact & Axes',
    domain: 'CONTACT',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 3,
    recipe: null,
    primaryGemId: 'carnelian',
    damageTypeOverride: 'Impact',
    action1Override: {
      kind: 'BEHAVIORAL',
      requiresMode: 'MELEE_COMBO',
      secondaryProjectile: {
        damageType: 'Impact',
        bcuScale: 0.4,
        rangeMeters: 2.6,
        triggerStep: 'FINISHER',
      },
    },
    statModifiers: {
      impulseMultDelta: 0.35,
      durShredMultDelta: 0.15,
      tempoDelta: -0.12,
      weightDelta: 4,
      thrPierceDelta: -3,
    },
    effectSummary: 'Converts damageType to Impact; final step triggers grounded shockwave slam (+35% Impulse J)',
    tradeOffSummary: '-12% swing tempo, +4 WT',
  },
  {
    id: 'wmod_hafted_ash_haft',
    name: 'Shock-Absorbing Ash Haft',
    weaponClass: 'Impact & Axes',
    domain: 'DELIVERY',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'demantoid',
    statModifiers: {
      recoilMultDelta: -0.35,
      impulseMultDelta: -0.1,
    },
    effectSummary: '-35% hit-stop recoil on blocked blows',
    tradeOffSummary: '-10% Melee Impulse (J)',
  },
  {
    id: 'wmod_hafted_kinetic_vent_cap',
    name: 'Kinetic Heat-Vent Cap',
    weaponClass: 'Impact & Axes',
    domain: 'REGULATION',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'hematite',
    statModifiers: {
      heatVentOnHit: 5,
      stabilityDelta: -4,
    },
    effectSummary: 'Vents -5 Reactor Heat on heavy hits',
    tradeOffSummary: '-4 Stability (S)',
  },

  // ─── 3.4 SPEARS (8 Components: 5 Crafted, 3 Looted) ────────────────────────
  {
    id: 'wmod_spear_narrow_bodkin',
    name: 'Narrow Bodkin Point',
    weaponClass: 'Spears',
    domain: 'CONTACT',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 24, gemstoneType: 'Spinel', gemstoneCount: 1 },
    primaryGemId: 'spinel',
    damageTypeOverride: 'Pierce',
    statModifiers: {
      thrPierceDelta: 5,
      cleaveArcMultDelta: -0.2,
    },
    effectSummary: 'Sets damageType to Pierce and ignores +5 Armor THR',
    tradeOffSummary: '-20% sweep/cleave damage',
  },
  {
    id: 'wmod_spear_blunt_coronal',
    name: 'Blunt Coronal Tourney Head',
    weaponClass: 'Spears',
    domain: 'CONTACT',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 24, gemstoneType: 'Carnelian', gemstoneCount: 1 },
    primaryGemId: 'carnelian',
    damageTypeOverride: 'Impact',
    statModifiers: {
      impulseMultDelta: 0.25,
      durShredMultDelta: 0.15,
      thrPierceDelta: -4,
    },
    effectSummary: 'Converts damageType to Impact with +25% Impulse (J) & +15% DUR shred',
    tradeOffSummary: '-4 Armor THR penetration',
  },
  {
    id: 'wmod_spear_fluted_ashwood',
    name: 'Fluted Ashwood Shaft',
    weaponClass: 'Spears',
    domain: 'DELIVERY',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 20, gemstoneType: 'Charoite', gemstoneCount: 1 },
    primaryGemId: 'charoite',
    statModifiers: {
      tempoDelta: 0.12,
      weightDelta: -2,
      stabilityDelta: -4,
    },
    effectSummary: '+12% thrust tempo, -2 WT',
    tradeOffSummary: '-4 Stability (S)',
  },
  {
    id: 'wmod_spear_telescoping_haft',
    name: 'Telescoping Spring Haft',
    weaponClass: 'Spears',
    domain: 'DELIVERY',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 28, gemstoneType: 'Kyanite', gemstoneCount: 1 },
    primaryGemId: 'kyanite',
    action1Override: {
      kind: 'PARAMETRIC',
      requiresMode: 'MELEE_COMBO',
      finisherReachMultiplier: 1.22,
    },
    statModifiers: {
      rangeMultDelta: 0.22,
      stabilityDelta: -4,
    },
    effectSummary: 'Extends Action 1 thrust reach by +22% on the final combo step',
    tradeOffSummary: '-4 Stability (S) while extended',
  },
  {
    id: 'wmod_spear_bronze_sauroter',
    name: 'Bronze Sauroter Spike',
    weaponClass: 'Spears',
    domain: 'REGULATION',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 20, gemstoneType: 'Titanite', gemstoneCount: 1 },
    primaryGemId: 'titanite',
    statModifiers: {
      stabilityDelta: 5,
      swapSpeedMultDelta: 0.15,
      weightDelta: 3,
    },
    effectSummary: '+5 Stability (S) & +15% swap speed',
    tradeOffSummary: '+3 WT',
  },
  {
    id: 'wmod_spear_crescent_lugs',
    name: 'Crescent Hook-Lugs',
    weaponClass: 'Spears',
    domain: 'CONTACT',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'demantoid',
    statModifiers: {
      targetMuStripOnHit: 0.2,
      weightDelta: 2,
      tempoDelta: -0.06,
    },
    effectSummary: 'Strips -20% target directional charge (μ) on hit',
    tradeOffSummary: '+2 WT, -6% tempo',
  },
  {
    id: 'wmod_spear_iron_shod_haft',
    name: 'Iron-Shod War Haft',
    weaponClass: 'Spears',
    domain: 'DELIVERY',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'carnelian',
    statModifiers: {
      muChargeMultDelta: 0.25,
      weightDelta: 4,
    },
    effectSummary: '+25% Directional Charge (μ) bonus when gliding forward',
    tradeOffSummary: '+4 WT',
  },
  {
    id: 'wmod_spear_boar_stop_crossbar',
    name: 'Boar-Stop Crossbar',
    weaponClass: 'Spears',
    domain: 'REGULATION',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 3,
    recipe: null,
    primaryGemId: 'titanite',
    statModifiers: {
      impulseMultDelta: 0.35,
      swapSpeedMultDelta: -0.12,
    },
    effectSummary: '+35% Impulse (J) against charging enemies',
    tradeOffSummary: '-12% swap speed',
  },

  // ─── 3.5 BOWS (8 Components: 4 Crafted, 4 Looted) ──────────────────────────
  {
    id: 'wmod_bow_reflex_recurve_tips',
    name: 'Reflex Recurve Tips',
    weaponClass: 'Bows',
    domain: 'CONTACT',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 22, gemstoneType: 'Charoite', gemstoneCount: 1 },
    primaryGemId: 'charoite',
    statModifiers: {
      drawTimeMultDelta: -0.15,
      tempoDelta: 0.15,
      rangeMultDelta: -0.15,
    },
    effectSummary: '-15% Action 1 draw time (faster snap-shots)',
    tradeOffSummary: '-15% max projectile range',
  },
  {
    id: 'wmod_bow_blunt_stun_limbs',
    name: 'Blunt Stun-Shaft Limbs & Shelf',
    weaponClass: 'Bows',
    domain: 'CONTACT',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 24, gemstoneType: 'Carnelian', gemstoneCount: 1 },
    primaryGemId: 'carnelian',
    damageTypeOverride: 'Impact',
    statModifiers: {
      rangedImpulseMultDelta: 0.3,
      durShredMultDelta: 0.15,
      rangeMultDelta: -0.2,
      thrPierceDelta: -3,
    },
    effectSummary: 'Converts damageType to Impact with +30% Ranged Impulse (J_ranged)',
    tradeOffSummary: '-20% max range, -3 THR pierce',
  },
  {
    id: 'wmod_bow_sinew_cord',
    name: 'Pre-Stressed Sinew Cord',
    weaponClass: 'Bows',
    domain: 'DELIVERY',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 20, gemstoneType: 'Spinel', gemstoneCount: 1 },
    primaryGemId: 'spinel',
    statModifiers: {
      projectileVelocityMultDelta: 0.15,
      rangedImpulseMultDelta: 0.15,
      heatPerActionDelta: 2,
    },
    effectSummary: '+15% projectile velocity & Ranged Impulse (J_ranged)',
    tradeOffSummary: '+2 Reactor Heat per draw',
  },
  {
    id: 'wmod_bow_weighted_riser',
    name: 'Weighted Center Riser',
    weaponClass: 'Bows',
    domain: 'REGULATION',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 20, gemstoneType: 'Titanite', gemstoneCount: 1 },
    primaryGemId: 'titanite',
    statModifiers: {
      recoilMultDelta: -0.3,
      stabilityDelta: 3,
      weightDelta: 3,
    },
    effectSummary: '-30% ranged recoil, +3 Stability (S)',
    tradeOffSummary: '+3 WT',
  },
  {
    id: 'wmod_bow_heavy_laminate_limbs',
    name: 'Heavy Laminate War-Limbs',
    weaponClass: 'Bows',
    domain: 'CONTACT',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'spinel',
    statModifiers: {
      thrPierceDelta: 6,
      drawTimeMultDelta: 0.18,
      tempoDelta: -0.18,
      weightDelta: 3,
    },
    effectSummary: '+6 Armor THR penetration at full draw',
    tradeOffSummary: '+18% draw time, +3 WT',
  },
  {
    id: 'wmod_bow_twin_cam_pulley',
    name: 'Twin-Cam Pulley Rig',
    weaponClass: 'Bows',
    domain: 'DELIVERY',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'demantoid',
    statModifiers: {
      drawHoldDrainMultDelta: -0.6,
      weightDelta: 2,
      swapSpeedMultDelta: -0.1,
    },
    effectSummary: '-60% draw-hold energy/heat drain',
    tradeOffSummary: '+2 WT, -10% swap speed',
  },
  {
    id: 'wmod_bow_gravity_repeating_box',
    name: 'Gravity-Feed Repeating Box',
    weaponClass: 'Bows',
    domain: 'DELIVERY',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 3,
    recipe: null,
    primaryGemId: 'rubellite',
    action1Override: {
      kind: 'BEHAVIORAL',
      requiresMode: 'DRAW_CHARGE',
      setsMode: 'BURST_VOLLEY',
      volleyBonusCount: 2,
    },
    statModifiers: {
      bcuMultDelta: -0.25,
      rangeMultDelta: -0.25,
      weightDelta: 3,
    },
    effectSummary: 'Turns Action 1 into a 3-arrow rapid burst on tap (replaces full-charge draw)',
    tradeOffSummary: '-25% per-arrow BCU & range, +3 WT',
  },
  {
    id: 'wmod_bow_harmonic_dampener',
    name: 'Harmonic Dampener Rod',
    weaponClass: 'Bows',
    domain: 'REGULATION',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'kyanite',
    statModifiers: {
      eliminateMoveAimSway: 1,
      weightDelta: 2,
    },
    effectSummary: 'Eliminates aim sway while moving at full draw',
    tradeOffSummary: '+2 WT',
  },

  // ─── 3.6 CASTERS (9 Components: 5 Crafted, 4 Looted) ───────────────────────
  {
    id: 'wmod_caster_choke_collimator',
    name: 'Choke Collimator Nozzle',
    weaponClass: 'Casters',
    domain: 'CONTACT',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 22, gemstoneType: 'Kyanite', gemstoneCount: 1 },
    primaryGemId: 'kyanite',
    statModifiers: {
      rangeMultDelta: 0.15,
      cleaveArcMultDelta: -0.15,
    },
    effectSummary: '-30% spread & +15% effective range',
    tradeOffSummary: '-15% AoE / beam width',
  },
  {
    id: 'wmod_caster_concussive_pulse_barrel',
    name: 'Concussive Pulse Chamber-Barrel',
    weaponClass: 'Casters',
    domain: 'CONTACT',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 26, gemstoneType: 'Moonstone', gemstoneCount: 1 },
    primaryGemId: 'moonstone',
    damageTypeOverride: 'Pulse',
    statModifiers: {
      shieldDmgMultDelta: 0.2,
      rangeMultDelta: -0.2,
    },
    effectSummary: 'Converts damageType to Pulse with +20% Layer 1 Shield damage',
    tradeOffSummary: '-20% effective range',
  },
  {
    id: 'wmod_caster_extended_drum_mag',
    name: 'Extended Drum Magazine',
    weaponClass: 'Casters',
    domain: 'DELIVERY',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 28, gemstoneType: 'Rubellite', gemstoneCount: 1 },
    primaryGemId: 'rubellite',
    action1Override: {
      kind: 'PARAMETRIC',
      requiresMode: 'MAGAZINE',
      ammoMultiplier: 1.5,
      reloadTimeMultiplier: 1.2,
    },
    statModifiers: {
      weightDelta: 3,
    },
    effectSummary: 'Increases Action 1 ammoCount by +50%',
    tradeOffSummary: '+3 WT, +20% tactical reload/vent time',
  },
  {
    id: 'wmod_caster_cyclic_capacitor',
    name: 'Cyclic Capacitor Chamber',
    weaponClass: 'Casters',
    domain: 'DELIVERY',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 24, gemstoneType: 'Spinel', gemstoneCount: 1 },
    primaryGemId: 'spinel',
    statModifiers: {
      tempoDelta: 0.12,
      heatCostMultDelta: 0.15,
    },
    effectSummary: '+12% fire rate / tick tempo',
    tradeOffSummary: '+15% Reactor Heat per shot',
  },
  {
    id: 'wmod_caster_finned_heatsink',
    name: 'Finned Heat-Sink Shroud',
    weaponClass: 'Casters',
    domain: 'REGULATION',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 24, gemstoneType: 'Hematite', gemstoneCount: 1 },
    primaryGemId: 'hematite',
    statModifiers: {
      heatCostMultDelta: -0.2,
      weightDelta: 3,
    },
    effectSummary: '-20% Reactor Heat generated per shot',
    tradeOffSummary: '+3 WT',
  },
  {
    id: 'wmod_caster_wide_scatter_diffuser',
    name: 'Wide Scatter Diffuser',
    weaponClass: 'Casters',
    domain: 'CONTACT',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'moonstone',
    statModifiers: {
      cleaveArcMultDelta: 0.35,
      shieldDmgMultDelta: 0.15,
      rangeMultDelta: -0.25,
    },
    effectSummary: '+35% projectile/wave width & +15% Shield damage',
    tradeOffSummary: '-25% effective range',
  },
  {
    id: 'wmod_caster_tri_prism_splitter',
    name: 'Tri-Prism Splitter Nozzle',
    weaponClass: 'Casters',
    domain: 'CONTACT',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 3,
    recipe: null,
    primaryGemId: 'kyanite',
    action1Override: {
      kind: 'BEHAVIORAL',
      requiresMode: 'MAGAZINE',
      volleyBonusCount: 2,
    },
    statModifiers: {
      bcuMultDelta: -0.55,
      rangeMultDelta: -0.25,
      heatPerActionDelta: 2,
    },
    effectSummary: 'Splits single-bolt Action 1 into a 3-bolt horizontal fan (3 x 0.45x BCU)',
    tradeOffSummary: '-25% range, +2 Reactor Heat per shot',
  },
  {
    id: 'wmod_caster_overclocked_coil',
    name: 'Overclocked Induction Coil',
    weaponClass: 'Casters',
    domain: 'DELIVERY',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'rubellite',
    statModifiers: {
      bcuMultDelta: 0.2,
      rangedImpulseMultDelta: 0.2,
      heatCostMultDelta: 0.25,
      tempoDelta: -0.1,
    },
    effectSummary: '+20% BCU scaling & +20% Ranged Impulse (J_ranged)',
    tradeOffSummary: '+25% Reactor Heat, -10% tempo',
  },
  {
    id: 'wmod_caster_magnetic_recoil_stock',
    name: 'Magnetic Recoil Stock',
    weaponClass: 'Casters',
    domain: 'REGULATION',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'titanite',
    statModifiers: {
      recoilMultDelta: -0.45,
      stabilityDelta: 4,
      weightDelta: 4,
      swapSpeedMultDelta: -0.15,
    },
    effectSummary: '-45% Ranged Recoil & +4 Stability (S)',
    tradeOffSummary: '+4 WT, +15% swap time',
  },

  // ─── 3.7 SHIELDS (7 Components: 3 Crafted, 4 Looted) ───────────────────────
  {
    id: 'wmod_shield_hardened_rim',
    name: 'Hardened Rim Band',
    weaponClass: 'Shields',
    domain: 'CONTACT',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 24, gemstoneType: 'Titanite', gemstoneCount: 1 },
    primaryGemId: 'titanite',
    statModifiers: {
      shieldDurabilityDelta: 25,
      armorThresholdDelta: 2,
      weightDelta: 3,
    },
    effectSummary: '+25 Shield Durability (DUR) & +2 THR',
    tradeOffSummary: '+3 WT',
  },
  {
    id: 'wmod_shield_forearm_straps',
    name: 'Forearm Enarme Straps',
    weaponClass: 'Shields',
    domain: 'DELIVERY',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 20, gemstoneType: 'Carnelian', gemstoneCount: 1 },
    primaryGemId: 'carnelian',
    statModifiers: {
      stabilityDelta: 6,
      swapSpeedMultDelta: -0.15,
    },
    effectSummary: '+6 Stability (S) while guarding',
    tradeOffSummary: '+15% weapon swap time',
  },
  {
    id: 'wmod_shield_lightened_core',
    name: 'Lightened Core Backing',
    weaponClass: 'Shields',
    domain: 'REGULATION',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 20, gemstoneType: 'Charoite', gemstoneCount: 1 },
    primaryGemId: 'charoite',
    statModifiers: {
      weightDelta: -3,
      tempoDelta: 0.1,
      shieldDurabilityDelta: -20,
    },
    effectSummary: '-3 WT & +10% guard-raise speed',
    tradeOffSummary: '-20 Shield Durability (DUR)',
  },
  {
    id: 'wmod_shield_spiked_boss',
    name: 'Spiked Impact Boss',
    weaponClass: 'Shields',
    domain: 'CONTACT',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'carnelian',
    statModifiers: {
      bcuMultDelta: 0.3,
      impulseMultDelta: 0.3,
      weightDelta: 2,
    },
    effectSummary: '+30% Shield Bash/Charge BCU & Impulse (J)',
    tradeOffSummary: '+2 WT',
  },
  {
    id: 'wmod_shield_capacitor_rim',
    name: 'Capacitor Rim Emitter',
    weaponClass: 'Shields',
    domain: 'CONTACT',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 3,
    recipe: null,
    primaryGemId: 'moonstone',
    damageTypeOverride: 'Pulse',
    action1Override: {
      kind: 'BEHAVIORAL',
      requiresMode: 'MELEE_COMBO',
      secondaryProjectile: {
        damageType: 'Pulse',
        bcuScale: 0.35,
        rangeMeters: 2.2,
        triggerStep: 'STEP_1',
      },
    },
    statModifiers: {
      shieldDmgMultDelta: 0.2,
      shieldDurabilityDelta: -15,
    },
    effectSummary: 'Converts Action 1 Shield Bash to Pulse (+20% Shield damage & stun jolt)',
    tradeOffSummary: '-15 Shield Durability (DUR)',
  },
  {
    id: 'wmod_shield_pivot_grip_boss',
    name: 'Pivot Center-Grip Boss',
    weaponClass: 'Shields',
    domain: 'DELIVERY',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'demantoid',
    statModifiers: {
      parryWindowBonusSec: 0.05,
      stabilityDelta: -5,
    },
    effectSummary: '+0.05s Action 4 Perfect Block window',
    tradeOffSummary: '-5 Stability (S) on heavy hits',
  },
  {
    id: 'wmod_shield_reactive_vent_lattice',
    name: 'Reactive Vent Lattice',
    weaponClass: 'Shields',
    domain: 'REGULATION',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'hematite',
    statModifiers: {
      heatVentOnBlock: 4,
      armorRatingDelta: -2,
    },
    effectSummary: 'Blocking vents -4 Reactor Heat per hit',
    tradeOffSummary: '-2 Armor Rating (RTG)',
  },

  // ─── 3.8 CARRIERS & MUNITIONS (7 Components: 4 Crafted, 3 Looted) ──────────
  {
    id: 'wmod_carrier_ap_sabot_pack',
    name: 'Armor-Piercing Sabot Pack',
    weaponClass: 'Carriers & Munitions',
    domain: 'CONTACT',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 24, gemstoneType: 'Spinel', gemstoneCount: 1 },
    primaryGemId: 'spinel',
    damageTypeOverride: 'Pierce',
    statModifiers: {
      thrPierceDelta: 5,
      cleaveArcMultDelta: -0.15,
    },
    effectSummary: 'Sets damageType to Pierce and ignores +5 Armor THR',
    tradeOffSummary: '-15% blast/splash radius',
  },
  {
    id: 'wmod_carrier_quick_draw_latch',
    name: 'Quick-Draw Tension Latch',
    weaponClass: 'Carriers & Munitions',
    domain: 'DELIVERY',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 20, gemstoneType: 'Kyanite', gemstoneCount: 1 },
    primaryGemId: 'kyanite',
    statModifiers: {
      tempoDelta: 0.2,
      heatPerActionDelta: 2,
    },
    effectSummary: '-20% salvo reload/cycle cooldown',
    tradeOffSummary: '+2 Reactor Heat per cycle',
  },
  {
    id: 'wmod_carrier_dual_feed_hopper',
    name: 'Dual-Feed Hopper',
    weaponClass: 'Carriers & Munitions',
    domain: 'DELIVERY',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 28, gemstoneType: 'Rubellite', gemstoneCount: 1 },
    primaryGemId: 'rubellite',
    action1Override: {
      kind: 'PARAMETRIC',
      requiresMode: 'BURST_VOLLEY',
      volleyBonusCount: 1,
      reloadTimeMultiplier: 1.15,
    },
    statModifiers: {
      weightDelta: 3,
      tempoDelta: -0.15,
    },
    effectSummary: 'Increases Action 1 / basic munition volley count by +1 projectile per burst',
    tradeOffSummary: '+3 WT, +15% cycle cooldown',
  },
  {
    id: 'wmod_carrier_blast_dampened_housing',
    name: 'Blast-Dampened Housing',
    weaponClass: 'Carriers & Munitions',
    domain: 'REGULATION',
    acquisitionSource: 'CRAFTED',
    maxGemSlots: 1,
    recipe: { scrapCost: 20, gemstoneType: 'Titanite', gemstoneCount: 1 },
    primaryGemId: 'titanite',
    statModifiers: {
      recoilMultDelta: -0.35,
      stabilityDelta: 3,
      weightDelta: 3,
    },
    effectSummary: '-35% salvo recoil & +3 Stability (S)',
    tradeOffSummary: '+3 WT',
  },
  {
    id: 'wmod_carrier_concussive_shock_charge',
    name: 'Concussive Shock-Charge',
    weaponClass: 'Carriers & Munitions',
    domain: 'CONTACT',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'carnelian',
    damageTypeOverride: 'Impact',
    statModifiers: {
      rangedImpulseMultDelta: 0.3,
      durShredMultDelta: 0.15,
      projectileVelocityMultDelta: -0.15,
    },
    effectSummary: 'Converts damageType to Impact (or Blast on Racks) with +30% Ranged Impulse (J_ranged)',
    tradeOffSummary: '-15% projectile velocity',
  },
  {
    id: 'wmod_carrier_rotary_indexing_feed',
    name: 'Rotary Indexing Feed',
    weaponClass: 'Carriers & Munitions',
    domain: 'DELIVERY',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 2,
    recipe: null,
    primaryGemId: 'spinel',
    statModifiers: {
      tempoDelta: 0.15,
      weightDelta: 3,
      heatCostMultDelta: 0.1,
    },
    effectSummary: '+15% salvo fire cadence',
    tradeOffSummary: '+3 WT, +10% heat',
  },
  {
    id: 'wmod_carrier_counter_balanced_frame',
    name: 'Counter-Balanced Frame',
    weaponClass: 'Carriers & Munitions',
    domain: 'REGULATION',
    acquisitionSource: 'LOOTED',
    maxGemSlots: 3,
    recipe: null,
    primaryGemId: 'charoite',
    statModifiers: {
      weightDelta: -4,
      swapSpeedMultDelta: 0.12,
      internalAmmoDelta: -1,
    },
    effectSummary: '-4 WT effective load & +12% swap speed',
    tradeOffSummary: '-1 internal ammo capacity',
  },
];

/**
 * O(1) lookup map of all 61 Bespoke Weapon Components by ID.
 */
export const BESPOKE_WEAPON_COMPONENT_BY_ID: Record<string, WeaponComponentMod> =
  Object.fromEntries(BESPOKE_WEAPON_COMPONENT_CATALOG.map((m) => [m.id, m]));

/**
 * Converts a canonical `WeaponComponentMod` into a backward-compatible `WeaponComponentPartDefinition`
 * so legacy callers of `WEAPON_COMPONENT_PART_CATALOG` continue to work seamlessly.
 */
export function toLegacyWeaponComponentPartDefinition(
  mod: WeaponComponentMod
): WeaponComponentPartDefinition {
  const gemCost =
    mod.acquisitionSource === 'CRAFTED'
      ? [
          {
            gemId: RECIPE_GEMSTONE_TO_ID[mod.recipe.gemstoneType],
            count: mod.recipe.gemstoneCount,
          },
        ]
      : [];
  const weightDelta = mod.statModifiers.weightDelta ?? 0;
  const impulseDelta = Math.round((mod.statModifiers.impulseMultDelta ?? 0) * 20);
  const rangedImpulseDelta = Math.round(
    (mod.statModifiers.rangedImpulseMultDelta ?? 0) * 18
  );
  return {
    id: mod.id,
    name: mod.name,
    componentSlot: mapDomainToLegacyComponentSlot(mod.weaponClass, mod.domain),
    origin: mod.acquisitionSource === 'CRAFTED' ? 'crafted' : 'looted',
    maxGemSlots: mod.maxGemSlots,
    gemCost,
    primaryGemId: mod.primaryGemId,
    gainDescription: mod.effectSummary,
    drawbackDescription: mod.tradeOffSummary,
    weightDelta,
    attackWeightDelta: impulseDelta !== 0 ? impulseDelta : undefined,
    projectileWeightDelta: rangedImpulseDelta !== 0 ? rangedImpulseDelta : undefined,
    weaponClass: mod.weaponClass,
    domain: mod.domain,
    scrapCost: mod.acquisitionSource === 'CRAFTED' ? mod.recipe.scrapCost : 0,
    damageTypeOverride: mod.damageTypeOverride,
    action1Override: mod.action1Override,
    statModifiers: mod.statModifiers,
  };
}

/**
 * Returns all bespoke weapon components compatible with the specified `WeaponCategory`.
 */
export function getBespokeComponentsForWeaponClass(
  weaponClass: WeaponCategory | undefined
): WeaponComponentMod[] {
  if (!weaponClass) return [];
  return BESPOKE_WEAPON_COMPONENT_CATALOG.filter(
    (m) => m.weaponClass === weaponClass
  );
}

/**
 * Creates the pilot's starter salvage pool of `LOOTED` weapon components (`partId -> count`),
 * giving every starting loadout kit an initial field-salvaged assortment across the 8 Weapon Classes
 * while keeping the remaining `LOOTED` components discoverable from world caches and enemy drops.
 */
export function createStarterLootedComponentsByTrait(
  traitLine: TraitLine = 'Warrior'
): Record<string, number> {
  const pool: Record<string, number> = {
    // 1 starter salvaged part per weapon class for immediate Armory experimentation
    wmod_straight_bodkin_tip: 1,
    wmod_curved_serrated_sawback: 1,
    wmod_hafted_ash_haft: 1,
    wmod_spear_crescent_lugs: 1,
    wmod_bow_twin_cam_pulley: 1,
    wmod_caster_wide_scatter_diffuser: 1,
    wmod_shield_spiked_boss: 1,
    wmod_carrier_concussive_shock_charge: 1,
  };

  switch (traitLine) {
    case 'Warrior':
      pool.wmod_straight_conduit_crossguard = 1;
      pool.wmod_curved_resonance_core = 1;
      pool.wmod_caster_overclocked_coil = 1;
      break;
    case 'Marauder':
      pool.wmod_hafted_seismic_anvil = 1;
      pool.wmod_caster_magnetic_recoil_stock = 1;
      pool.wmod_carrier_rotary_indexing_feed = 1;
      break;
    case 'Guardian':
      pool.wmod_shield_capacitor_rim = 1;
      pool.wmod_spear_boar_stop_crossbar = 1;
      pool.wmod_shield_pivot_grip_boss = 1;
      break;
    case 'Rogue':
      pool.wmod_bow_gravity_repeating_box = 1;
      pool.wmod_straight_parrying_lugs = 1;
      pool.wmod_carrier_counter_balanced_frame = 1;
      break;
    case 'Wizard':
      pool.wmod_caster_tri_prism_splitter = 1;
      pool.wmod_spear_iron_shod_haft = 1;
      pool.wmod_bow_harmonic_dampener = 1;
      break;
    case 'Cleric':
      pool.wmod_shield_reactive_vent_lattice = 1;
      pool.wmod_hafted_kinetic_vent_cap = 1;
      pool.wmod_straight_thermal_tang = 1;
      break;
  }

  return pool;
}

/**
 * List of all 33 `LOOTED` weapon components eligible to drop from field caches, elite enemies, and bosses.
 * Never includes any `CRAFTED` component (`Project Orion — Weapon Modification Overhaul Specification.md` §2.2).
 */
export const LOOTED_WEAPON_COMPONENT_POOL: WeaponComponentMod[] =
  BESPOKE_WEAPON_COMPONENT_CATALOG.filter(
    (m) => m.acquisitionSource === 'LOOTED'
  );
