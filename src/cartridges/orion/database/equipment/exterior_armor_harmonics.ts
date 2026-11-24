/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactorFamily } from '../../types/common';
import type {
  ArmorGemResonanceCombo,
  ExteriorArmorPiece,
  ExteriorArmorSlot,
  ExteriorArmorSocketDetail,
  ExteriorArmorSocketEvalResult,
  ExteriorReactorFamily,
  ForgeRecipe,
  GemstoneId,
  StatDelta,
} from '../../types/equipment';
import type { OrionState } from '../../types/state';

/**
 * Duplicate Gemstone Diminishing Returns curve within a single Exterior Armor piece (`[100%, 70%, 40%]`).
 */
export const DUPLICATE_CURVE: readonly [number, number, number] = [1.0, 0.7, 0.4];

/**
 * Reactor Core Harmonic Resonance mapping (`+20%` positive bonus when a socketed gem matches the active Reactor Family).
 */
export const REACTOR_FAMILY_GEMS: Record<ExteriorReactorFamily, GemstoneId[]> = {
  ichor: ['hematite', 'spinel', 'carnelian'],
  mana: ['moonstone', 'titanite', 'demantoid'],
  ether: ['rubellite', 'kyanite', 'charoite'],
};

/**
 * Normalizes a ReactorFamily (`'Ichor' | 'Mana' | 'Ether' | 'ichor' | 'mana' | 'ether'`) to lowercase `ExteriorReactorFamily`.
 */
export function normalizeExteriorReactorFamily(
  family?: ReactorFamily | ExteriorReactorFamily | string | null
): ExteriorReactorFamily | null {
  if (!family) return null;
  const lower = family.toLowerCase();
  if (lower === 'ichor' || lower === 'mana' || lower === 'ether') {
    return lower;
  }
  return null;
}

/**
 * Canonical 30-Piece Exterior Armor Roster (`10` Core Frame Platings, `10` Head Dome Plates, `10` Arm Aperture Plates).
 * Strict Physical Domain Separation: Exterior Armor (`'plating' | 'head' | 'arms'`) and Shields are the ONLY items
 * permitted to grant Layer 2 Armor (`durability`, `rating`, `threshold`).
 */
export const EXTERIOR_ARMOR_CATALOG: ExteriorArmorPiece[] = [
  // ============================================================================
  // 3.1 Core Frame (`slot: 'plating'` · 10 Pieces · `3G` Each)
  // ============================================================================
  {
    id: 'coreplate_bwi_bastion',
    name: 'BWI C-140 Bastion Frame',
    slot: 'plating',
    setId: 'set_00',
    weight: 16,
    baseLoadCapacity: 90,
    armor: { durability: 135, rating: 8, threshold: 4 },
    shieldBonus: 45,
    gemSockets: 3,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      stability: 6,
      heatDissipationPct: 0.08,
    },
    tradeOffSummary: 'Balanced baseline',
  },
  {
    id: 'coreplate_fire_ice_fortress',
    name: 'B&E H-380 Fortress Plate',
    slot: 'plating',
    setId: 'set_01',
    weight: 28,
    baseLoadCapacity: 112,
    armor: { durability: 180, rating: 12, threshold: 8 },
    shieldBonus: 30,
    gemSockets: 3,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      stability: 15,
      heatCapacity: 20,
      moveSpeedPct: -0.08,
    },
    tradeOffSummary: '-8% Move Speed',
  },
  {
    id: 'coreplate_dawnforge_guardian',
    name: 'Aegis Solis Bulwark Plate',
    slot: 'plating',
    setId: 'set_02',
    weight: 26,
    baseLoadCapacity: 112,
    armor: { durability: 160, rating: 10, threshold: 6 },
    shieldBonus: 60,
    gemSockets: 3,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      stability: 10,
      shieldRechargeRatePct: 0.12,
      moveSpeedPct: -0.05,
    },
    tradeOffSummary: '-5% Move Speed',
  },
  {
    id: 'coreplate_shadowcraft_recon',
    name: 'Vanguard-X Recon Carapace',
    slot: 'plating',
    setId: 'set_03',
    weight: 9,
    baseLoadCapacity: 84,
    armor: { durability: 100, rating: 5, threshold: 2 },
    shieldBonus: 35,
    gemSockets: 3,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      moveSpeedPct: 0.08,
      dashIFrameSec: 0.04,
      stealthSignaturePct: -0.25,
      stability: -4,
    },
    tradeOffSummary: '-4 Stability',
  },
  {
    id: 'coreplate_arcanum_projector',
    name: 'Arcanum Resonant Plate',
    slot: 'plating',
    setId: 'set_04',
    weight: 10,
    baseLoadCapacity: 84,
    armor: { durability: 90, rating: 4, threshold: 2 },
    shieldBonus: 85,
    gemSockets: 3,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      heatDissipationPct: 0.18,
      shieldRechargeRatePct: 0.15,
    },
    tradeOffSummary: 'Low Layer 2 THR (2)',
  },
  {
    id: 'coreplate_sanctum_support',
    name: 'Sanctum Aegis Frame',
    slot: 'plating',
    setId: 'set_05',
    weight: 17,
    baseLoadCapacity: 90,
    armor: { durability: 145, rating: 9, threshold: 5 },
    shieldBonus: 55,
    gemSockets: 3,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      supportRepairPowerPct: 0.15,
      stability: 8,
      meleeTempoPct: -0.03,
    },
    tradeOffSummary: '-3% Melee Tempo',
  },
  {
    id: 'plating_camelot_knight',
    name: 'Camelot Knight Errant Cuirass',
    slot: 'plating',
    setId: 'set_12',
    weight: 31,
    baseLoadCapacity: 112,
    armor: { durability: 175, rating: 12, threshold: 7 },
    shieldBonus: 50,
    gemSockets: 3,
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_camelot_knight',
    baseModifiers: {
      stability: 14,
      moveSpeedPct: -0.05,
    },
    tradeOffSummary: '-5% Move Speed',
  },
  {
    id: 'plating_novarin_outrider',
    name: 'Novarin Steppe Outrider Brigandine',
    slot: 'plating',
    setId: 'set_13',
    weight: 8,
    baseLoadCapacity: 84,
    armor: { durability: 110, rating: 6, threshold: 3 },
    shieldBonus: 35,
    gemSockets: 3,
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_novarin_outrider',
    baseModifiers: {
      moveSpeedPct: 0.08,
      reloadDrawSpeedPct: 0.06,
      stability: -3,
    },
    tradeOffSummary: '-3 Stability',
  },
  {
    id: 'plating_novarin_keshig',
    name: 'Novarin Royal Keshig Lamellar',
    slot: 'plating',
    setId: 'set_14',
    weight: 18,
    baseLoadCapacity: 94,
    armor: { durability: 150, rating: 10, threshold: 5 },
    shieldBonus: 40,
    gemSockets: 3,
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_novarin_keshig',
    baseModifiers: {
      stability: 9,
      heatDissipationPct: 0.1,
    },
    tradeOffSummary: 'Slightly heavier than BWI (18 WT)',
  },
  {
    id: 'plating_novarin_tarkhan',
    name: 'Novarin Iron Tarkhan Cataphract Barding',
    slot: 'plating',
    setId: 'set_15',
    weight: 34,
    baseLoadCapacity: 116,
    armor: { durability: 190, rating: 13, threshold: 8 },
    shieldBonus: 25,
    gemSockets: 3,
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_novarin_tarkhan',
    baseModifiers: {
      stability: 18,
      chargeMassPct: 0.1,
      moveSpeedPct: -0.1,
    },
    tradeOffSummary: '-10% Move Speed',
  },

  // ============================================================================
  // 3.2 Head (`slot: 'head'` · 10 Pieces · `2G` Standard / `3G` Camelot Knight)
  // ============================================================================
  {
    id: 'head_cd_g341_murmillio',
    name: 'CD-G341 Murmillo Dome',
    slot: 'head',
    setId: 'set_00',
    weight: 6,
    armor: { durability: 16, rating: 1, threshold: 1 },
    shieldBonus: 5,
    gemSockets: 2,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      stability: 3,
      opticsRangeM: 0.5,
    },
    tradeOffSummary: 'Balanced baseline',
  },
  {
    id: 'head_be_ironveil_dome',
    name: 'B&E Ironveil Casque',
    slot: 'head',
    setId: 'set_01',
    weight: 12,
    armor: { durability: 25, rating: 2, threshold: 1 },
    shieldBonus: 5,
    gemSockets: 2,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      stability: 6,
      heatCapacity: 8,
      opticsRangeM: -1.0,
    },
    tradeOffSummary: '-1.0m Vision Range',
  },
  {
    id: 'head_aegis_halo_dome',
    name: 'Aegis Solis Halo Visor',
    slot: 'head',
    setId: 'set_02',
    weight: 11,
    armor: { durability: 22, rating: 2, threshold: 1 },
    shieldBonus: 15,
    gemSockets: 2,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      lightRadiusM: 1.5,
      stability: 4,
      stealthSignaturePct: 0.1,
    },
    tradeOffSummary: '+10% Detection Signature',
  },
  {
    id: 'head_vx_veilsight_helm',
    name: 'Vanguard-X Veilsight Cowl',
    slot: 'head',
    setId: 'set_03',
    weight: 3,
    armor: { durability: 10, rating: 1, threshold: 0 },
    shieldBonus: 5,
    gemSockets: 2,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      opticsRangeM: 2.0,
      lockOnSpeedPct: 0.15,
      stealthSignaturePct: -0.15,
      stability: -2,
    },
    tradeOffSummary: '-2 Stability, 0 THR',
  },
  {
    id: 'head_arc_omniscient_dome',
    name: 'Arcanum Omniscient Crown',
    slot: 'head',
    setId: 'set_04',
    weight: 4,
    armor: { durability: 12, rating: 1, threshold: 0 },
    shieldBonus: 20,
    gemSockets: 2,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      heatDissipationPct: 0.1,
      projectileTrackingPct: 0.12,
    },
    tradeOffSummary: '0 THR',
  },
  {
    id: 'head_sanc_providence_helm',
    name: 'Sanctum Providence Mitre',
    slot: 'head',
    setId: 'set_05',
    weight: 7,
    armor: { durability: 18, rating: 1, threshold: 1 },
    shieldBonus: 12,
    gemSockets: 2,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      supportRepairPowerPct: 0.1,
      lightRadiusM: 1.0,
      lockOnSpeedPct: -0.04,
    },
    tradeOffSummary: '-4% Lock-On Speed',
  },
  {
    id: 'head_camelot_knight',
    name: 'Camelot Knight Errant Greathelm',
    slot: 'head',
    setId: 'set_12',
    weight: 13,
    armor: { durability: 22, rating: 2, threshold: 1 },
    shieldBonus: 10,
    gemSockets: 3,
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_camelot_knight',
    baseModifiers: {
      stability: 5,
      opticsRangeM: -0.5,
    },
    tradeOffSummary: '-0.5m Vision Range (Unlocks 3G Triad on Head)',
  },
  {
    id: 'head_novarin_outrider',
    name: 'Novarin Steppe Outrider Eagle Cap',
    slot: 'head',
    setId: 'set_13',
    weight: 3,
    armor: { durability: 12, rating: 1, threshold: 0 },
    shieldBonus: 5,
    gemSockets: 2,
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_novarin_outrider',
    baseModifiers: {
      opticsRangeM: 2.5,
      lockOnSpeedPct: 0.12,
      stability: -1,
    },
    tradeOffSummary: '-1 Stability, 0 THR',
  },
  {
    id: 'head_novarin_keshig',
    name: 'Novarin Royal Keshig Plumed Spangenhelm',
    slot: 'head',
    setId: 'set_14',
    weight: 7,
    armor: { durability: 20, rating: 1, threshold: 1 },
    shieldBonus: 5,
    gemSockets: 2,
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_novarin_keshig',
    baseModifiers: {
      stability: 4,
      heatDissipationPct: 0.06,
    },
    tradeOffSummary: 'Balanced cavalry helm',
  },
  {
    id: 'head_novarin_tarkhan',
    name: 'Novarin Iron Tarkhan Masked War-Helm',
    slot: 'head',
    setId: 'set_15',
    weight: 13,
    armor: { durability: 24, rating: 2, threshold: 1 },
    shieldBonus: 5,
    gemSockets: 2,
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_novarin_tarkhan',
    baseModifiers: {
      stability: 7,
      opticsRangeM: -1.0,
    },
    tradeOffSummary: '-1.0m Vision Range',
  },

  // ============================================================================
  // 3.3 Arms (`slot: 'arms'` · 10 Pieces · `2G` Standard / `3G` Camelot Knight)
  // ============================================================================
  {
    id: 'arms_bwi_twinstrike',
    name: 'BWI Twinstrike Vambraces',
    slot: 'arms',
    setId: 'set_00',
    weight: 8,
    armor: { durability: 24, rating: 2, threshold: 1 },
    shieldBonus: 0,
    gemSockets: 2,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      recoilControlPct: 0.08,
      meleeTempoPct: 0.04,
    },
    tradeOffSummary: 'Balanced baseline',
  },
  {
    id: 'arms_fire_ice_line_holder',
    name: 'B&E Line-Holder Pauldrons',
    slot: 'arms',
    setId: 'set_01',
    weight: 16,
    armor: { durability: 35, rating: 2, threshold: 1 },
    shieldBonus: 0,
    gemSockets: 2,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      stability: 8,
      recoilControlPct: 0.2,
      weaponSwapSpeedPct: -0.1,
    },
    tradeOffSummary: '-10% Weapon Swap Speed',
  },
  {
    id: 'arms_solbright_cleaver',
    name: 'Solbright Cleaver Gauntlets',
    slot: 'arms',
    setId: 'set_02',
    weight: 14,
    armor: { durability: 30, rating: 2, threshold: 1 },
    shieldBonus: 10,
    gemSockets: 2,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      parryWindowSec: 0.04,
      stability: 5,
      reloadDrawSpeedPct: -0.05,
    },
    tradeOffSummary: '-5% Ranged Reload Speed',
  },
  {
    id: 'arms_shadowcraft_silencer',
    name: 'Vanguard-X Silencer Bracers',
    slot: 'arms',
    setId: 'set_03',
    weight: 4,
    armor: { durability: 15, rating: 1, threshold: 0 },
    shieldBonus: 0,
    gemSockets: 2,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      weaponSwapSpeedPct: 0.18,
      meleeTempoPct: 0.08,
      reloadDrawSpeedPct: 0.1,
      stability: -3,
    },
    tradeOffSummary: '-3 Stability, 0 THR',
  },
  {
    id: 'arms_arcanum_channeler',
    name: 'Arcanum Channeler Couters',
    slot: 'arms',
    setId: 'set_04',
    weight: 5,
    armor: { durability: 18, rating: 1, threshold: 0 },
    shieldBonus: 15,
    gemSockets: 2,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      heatDissipationPct: 0.12,
      reloadDrawSpeedPct: 0.12,
    },
    tradeOffSummary: '0 THR',
  },
  {
    id: 'arms_sanctum_benediction',
    name: 'Sanctum Benediction Sleeves',
    slot: 'arms',
    setId: 'set_05',
    weight: 9,
    armor: { durability: 26, rating: 2, threshold: 1 },
    shieldBonus: 10,
    gemSockets: 2,
    acquisition: 'starter_post_boss',
    baseModifiers: {
      supportRepairPowerPct: 0.12,
      parryWindowSec: 0.03,
      meleeTempoPct: -0.04,
    },
    tradeOffSummary: '-4% Melee Tempo',
  },
  {
    id: 'arms_camelot_knight',
    name: 'Camelot Knight Errant Vambraces',
    slot: 'arms',
    setId: 'set_12',
    weight: 17,
    armor: { durability: 28, rating: 2, threshold: 1 },
    shieldBonus: 10,
    gemSockets: 3,
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_camelot_knight',
    baseModifiers: {
      stability: 6,
      parryWindowSec: 0.03,
      weaponSwapSpeedPct: -0.05,
    },
    tradeOffSummary: '-5% Swap Speed (Unlocks 3G Triad on Arms)',
  },
  {
    id: 'arms_novarin_outrider',
    name: 'Novarin Steppe Outrider Bow-Bracers',
    slot: 'arms',
    setId: 'set_13',
    weight: 4,
    armor: { durability: 16, rating: 1, threshold: 0 },
    shieldBonus: 0,
    gemSockets: 2,
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_novarin_outrider',
    baseModifiers: {
      reloadDrawSpeedPct: 0.15,
      weaponSwapSpeedPct: 0.12,
      stability: -2,
    },
    tradeOffSummary: '-2 Stability, 0 THR',
  },
  {
    id: 'arms_novarin_keshig',
    name: 'Novarin Royal Keshig Splinted Bazubands',
    slot: 'arms',
    setId: 'set_14',
    weight: 10,
    armor: { durability: 26, rating: 2, threshold: 1 },
    shieldBonus: 0,
    gemSockets: 2,
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_novarin_keshig',
    baseModifiers: {
      meleeTempoPct: 0.07,
      recoilControlPct: 0.1,
    },
    tradeOffSummary: '0 Shield Bonus',
  },
  {
    id: 'arms_novarin_tarkhan',
    name: 'Novarin Iron Tarkhan Crusher Gauntlets',
    slot: 'arms',
    setId: 'set_15',
    weight: 18,
    armor: { durability: 34, rating: 2, threshold: 1 },
    shieldBonus: 0,
    gemSockets: 2,
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_novarin_tarkhan',
    baseModifiers: {
      stability: 9,
      meleeTempoPct: 0.05,
      weaponSwapSpeedPct: -0.12,
    },
    tradeOffSummary: '-12% Weapon Swap Speed',
  },
];

/**
 * Lookup map for the 30 canonical `ExteriorArmorPiece` entries by ID.
 */
export const EXTERIOR_ARMOR_BY_ID: Record<string, ExteriorArmorPiece> = Object.fromEntries(
  EXTERIOR_ARMOR_CATALOG.map((piece) => [piece.id, piece])
);

/**
 * Cyclopean Dwarf Forge Recipes (`4` Blueprints · `12` Craftable Pieces — §4.2).
 */
export const FORGE_RECIPES: ForgeRecipe[] = [
  // Set 12: Camelot Knight Errant (Heavy · 3G on ALL 3 pieces)
  {
    outputArmorId: 'plating_camelot_knight',
    blueprintId: 'bp_armor_camelot_knight',
    scrapCost: 220,
    gemCosts: [
      { gemId: 'titanite', count: 2 },
      { gemId: 'moonstone', count: 1 },
    ],
  },
  {
    outputArmorId: 'head_camelot_knight',
    blueprintId: 'bp_armor_camelot_knight',
    scrapCost: 140,
    gemCosts: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
  },
  {
    outputArmorId: 'arms_camelot_knight',
    blueprintId: 'bp_armor_camelot_knight',
    scrapCost: 150,
    gemCosts: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'hematite', count: 1 },
    ],
  },

  // Set 13: Novarin Steppe Outrider (Light · 3G/2G/2G)
  {
    outputArmorId: 'plating_novarin_outrider',
    blueprintId: 'bp_armor_novarin_outrider',
    scrapCost: 160,
    gemCosts: [
      { gemId: 'charoite', count: 2 },
      { gemId: 'kyanite', count: 1 },
    ],
  },
  {
    outputArmorId: 'head_novarin_outrider',
    blueprintId: 'bp_armor_novarin_outrider',
    scrapCost: 95,
    gemCosts: [{ gemId: 'kyanite', count: 1 }],
  },
  {
    outputArmorId: 'arms_novarin_outrider',
    blueprintId: 'bp_armor_novarin_outrider',
    scrapCost: 105,
    gemCosts: [{ gemId: 'charoite', count: 1 }],
  },

  // Set 14: Novarin Royal Keshig (Medium · 3G/2G/2G)
  {
    outputArmorId: 'plating_novarin_keshig',
    blueprintId: 'bp_armor_novarin_keshig',
    scrapCost: 190,
    gemCosts: [
      { gemId: 'carnelian', count: 2 },
      { gemId: 'spinel', count: 1 },
    ],
  },
  {
    outputArmorId: 'head_novarin_keshig',
    blueprintId: 'bp_armor_novarin_keshig',
    scrapCost: 115,
    gemCosts: [{ gemId: 'spinel', count: 1 }],
  },
  {
    outputArmorId: 'arms_novarin_keshig',
    blueprintId: 'bp_armor_novarin_keshig',
    scrapCost: 125,
    gemCosts: [{ gemId: 'carnelian', count: 1 }],
  },

  // Set 15: Novarin Iron Tarkhan (Heavy · 3G/2G/2G)
  {
    outputArmorId: 'plating_novarin_tarkhan',
    blueprintId: 'bp_armor_novarin_tarkhan',
    scrapCost: 240,
    gemCosts: [
      { gemId: 'hematite', count: 2 },
      { gemId: 'carnelian', count: 1 },
    ],
  },
  {
    outputArmorId: 'head_novarin_tarkhan',
    blueprintId: 'bp_armor_novarin_tarkhan',
    scrapCost: 135,
    gemCosts: [{ gemId: 'hematite', count: 1 }],
  },
  {
    outputArmorId: 'arms_novarin_tarkhan',
    blueprintId: 'bp_armor_novarin_tarkhan',
    scrapCost: 145,
    gemCosts: [
      { gemId: 'hematite', count: 1 },
      { gemId: 'carnelian', count: 1 },
    ],
  },
];

/**
 * Per-slot Gemstone base stat delta entry (`positive` + `drawback`).
 */
export interface PerSlotGemstonePayload {
  positive: StatDelta;
  drawback: StatDelta;
}

/**
 * Canonical Per-Slot Gemstone Base Table (`1st Copy = 100%` — §5).
 * Each gemstone has a distinct positive payload and non-zero drawback payload depending on whether it is
 * socketed into `'plating'` (Core Frame), `'head'` (Dome), or `'arms'` (Aperture).
 */
export const PER_SLOT_GEMSTONE_TABLE: Record<
  GemstoneId,
  Record<ExteriorArmorSlot, PerSlotGemstonePayload>
> = {
  moonstone: {
    plating: {
      positive: { shieldCapacity: 18, shieldRechargeRatePct: 0.06 },
      drawback: { armorDurability: -8 },
    },
    head: {
      positive: { lightRadiusM: 1.0, shieldRechargeDelayPct: -0.08 },
      drawback: { stealthSignaturePct: 0.08 },
    },
    arms: {
      positive: { parryWindowSec: 0.03, shieldCapacity: 8 },
      drawback: { meleeTempoPct: -0.03 },
    },
  },
  spinel: {
    plating: {
      positive: { heatCapacity: 15, heatDissipationPct: 0.1 },
      drawback: { shieldCapacity: -10 },
    },
    head: {
      positive: { heatDissipationPct: 0.08, opticsRangeM: 1.0 },
      drawback: { shieldCapacity: -6 },
    },
    arms: {
      positive: { heatCostPct: -0.08 },
      drawback: { stability: -2 },
    },
  },
  carnelian: {
    plating: {
      positive: { stability: 6, loadCapacity: 4 },
      drawback: { heatDissipationPct: -0.05 },
    },
    head: {
      positive: { stability: 4, lockOnSpeedPct: 0.1 },
      drawback: { heatDissipationPct: -0.04 },
    },
    arms: {
      positive: { meleeTempoPct: 0.06, stability: 3 },
      drawback: { heatCostPct: 0.05 },
    },
  },
  titanite: {
    plating: {
      positive: { armorDurability: 22, armorThreshold: 1 },
      drawback: { moveSpeedPct: -0.02 },
    },
    head: {
      positive: { armorDurability: 10, stability: 3 },
      drawback: { lockOnSpeedPct: -0.04 },
    },
    arms: {
      positive: { armorDurability: 12, guardMitigationPct: 0.08 },
      drawback: { weaponSwapSpeedPct: -0.04 },
    },
  },
  demantoid: {
    plating: {
      positive: { supportRepairPowerPct: 0.1, armorDurability: 12 },
      drawback: { meleeTempoPct: -0.03 },
    },
    head: {
      positive: { supportRepairPowerPct: 0.08, lightRadiusM: 0.5 },
      drawback: { lockOnSpeedPct: -0.03 },
    },
    arms: {
      positive: { reloadDrawSpeedPct: 0.08, supportRepairPowerPct: 0.06 },
      drawback: { stability: -2 },
    },
  },
  kyanite: {
    plating: {
      positive: { shieldRechargeRatePct: 0.1, heatDissipationPct: 0.06 },
      drawback: { stability: -3 },
    },
    head: {
      positive: { opticsRangeM: 1.5, projectileTrackingPct: 0.1 },
      drawback: { armorDurability: -5 },
    },
    arms: {
      positive: { reloadDrawSpeedPct: 0.1, recoilControlPct: 0.1 },
      drawback: { armorDurability: -6 },
    },
  },
  charoite: {
    plating: {
      positive: { moveSpeedPct: 0.04, stealthSignaturePct: -0.12 },
      drawback: { armorDurability: -10 },
    },
    head: {
      positive: { stealthSignaturePct: -0.1, lockOnSpeedPct: 0.12 },
      drawback: { stability: -2 },
    },
    arms: {
      positive: { weaponSwapSpeedPct: 0.15, effectiveWeightDelta: -1 },
      drawback: { stability: -2 },
    },
  },
  rubellite: {
    plating: {
      positive: { shieldCapacity: 14, energyCapacityPct: 0.1 },
      drawback: { armorDurability: -8 },
    },
    head: {
      positive: { lockOnSpeedPct: 0.12, shieldCapacity: 8 },
      drawback: { heatCapacity: -5 },
    },
    arms: {
      positive: { meleeTempoPct: 0.05, reloadDrawSpeedPct: 0.06 },
      drawback: { armorDurability: -5 },
    },
  },
  hematite: {
    plating: {
      positive: { armorRating: 2, armorDurability: 16 },
      drawback: { shieldCapacity: -12 },
    },
    head: {
      positive: { armorRating: 1, stability: 4 },
      drawback: { shieldCapacity: -8 },
    },
    arms: {
      positive: { recoilControlPct: 0.12, armorDurability: 10 },
      drawback: { shieldCapacity: -8 },
    },
  },
};

/**
 * Tier 3 Three-Gem Triads (evaluated only on `3G` pieces when all 3 sockets are filled — §6.1 Step 2A).
 */
export const TIER3_TRIAD_COMBOS: Record<
  'ichor_crucible' | 'mana_sanctuary' | 'ether_astral' | 'prismatic_core',
  ArmorGemResonanceCombo
> = {
  ichor_crucible: {
    id: 'ichor_crucible',
    name: 'Ichor Crucible Triad',
    tier: 3,
    positiveBoost: 0.35,
    boostedGems: 'ALL',
    flatBonus: {
      armorThreshold: 1,
      heatCapacity: 15,
      stability: 8,
    },
    summary: '+35% positive gem stats on piece + +1 THR, +15 Heat Cap, +8 Stability',
  },
  mana_sanctuary: {
    id: 'mana_sanctuary',
    name: 'Mana Sanctuary Triad',
    tier: 3,
    positiveBoost: 0.35,
    boostedGems: 'ALL',
    flatBonus: {
      shieldCapacity: 25,
      armorDurability: 20,
      supportRepairPowerPct: 0.1,
    },
    summary: '+35% positive gem stats on piece + +25 Shield, +20 Armor DUR, +10% Repair Power',
  },
  ether_astral: {
    id: 'ether_astral',
    name: 'Ether Astral Triad',
    tier: 3,
    positiveBoost: 0.35,
    boostedGems: 'ALL',
    flatBonus: {
      moveSpeedPct: 0.05,
      dashIFrameSec: 0.04,
      weaponSwapSpeedPct: 0.15,
    },
    summary: '+35% positive gem stats on piece + +5% Move Speed, +0.04s Dash i-Frames, +15% Swap Speed',
  },
  prismatic_core: {
    id: 'prismatic_core',
    name: 'Prismatic Core Triad',
    tier: 3,
    positiveBoost: 0.3,
    boostedGems: 'ALL',
    flatBonus: {},
    grantsPrismaticUniversalAffinity: true,
    summary: '+30% positive gem stats on piece + +10% positive gem stats on Head & Arms',
  },
};

/**
 * Tier 2 Two-Gem Pair Resonances (`9` canonical pairs — §6.1 Step 2B).
 */
export const TIER2_PAIR_COMBOS: ArmorGemResonanceCombo[] = [
  {
    id: 'tempered_crux',
    name: 'Tempered Crux Pair',
    tier: 2,
    positiveBoost: 0.25,
    boostedGems: ['hematite', 'spinel'],
    flatBonus: { armorDurability: 10, heatDissipationPct: 0.06 },
    summary: '+25% Hematite/Spinel positives + +10 Armor DUR, +6% Heat Dissipation',
  },
  {
    id: 'siege_bastion',
    name: 'Siege Bastion Pair',
    tier: 2,
    positiveBoost: 0.25,
    boostedGems: ['hematite', 'carnelian'],
    flatBonus: { stability: 5, chargeStability: 4 },
    summary: '+25% Hematite/Carnelian positives + +5 Stability, +4 Charge Stability',
  },
  {
    id: 'aegis_lattice',
    name: 'Aegis Lattice Pair',
    tier: 2,
    positiveBoost: 0.25,
    boostedGems: ['moonstone', 'titanite'],
    flatBonus: { shieldCapacity: 12, armorDurability: 10 },
    summary: '+25% Moonstone/Titanite positives + +12 Shield Cap, +10 Armor DUR',
  },
  {
    id: 'sanctum_choir',
    name: 'Sanctum Choir Pair',
    tier: 2,
    positiveBoost: 0.25,
    boostedGems: ['moonstone', 'demantoid'],
    flatBonus: { supportRepairPowerPct: 0.08, shieldRechargeDelayPct: -0.1 },
    summary: '+25% Moonstone/Demantoid positives + +8% Support Repair, -10% Shield Recharge Delay',
  },
  {
    id: 'prism_conduit',
    name: 'Prism Conduit Pair',
    tier: 2,
    positiveBoost: 0.25,
    boostedGems: ['rubellite', 'kyanite'],
    flatBonus: { reloadDrawSpeedPct: 0.08, lockOnSpeedPct: 0.1 },
    summary: '+25% Rubellite/Kyanite positives + +8% Reload/Draw Speed, +10% Lock-On Speed',
  },
  {
    id: 'veil_specter',
    name: 'Veil Specter Pair',
    tier: 2,
    positiveBoost: 0.25,
    boostedGems: ['kyanite', 'charoite'],
    flatBonus: { stealthSignaturePct: -0.1, effectiveWeightDelta: -2 },
    summary: '+25% Kyanite/Charoite positives + -10% Detection Signature, -2 WT Effective Weight',
  },
  {
    id: 'forge_quench',
    name: 'Forge Quench Pair',
    tier: 2,
    positiveBoost: 0.25,
    boostedGems: ['titanite', 'hematite'],
    flatBonus: { armorRating: 1, armorRepairEfficiencyPct: 0.12 },
    summary: '+25% Titanite/Hematite positives + +1 Armor RTG, +12% Armor Repair Efficiency',
  },
  {
    id: 'mirrored_glaze',
    name: 'Mirrored Glaze Pair',
    tier: 2,
    positiveBoost: 0.25,
    boostedGems: ['moonstone', 'kyanite'],
    flatBonus: { shieldCapacity: 15, shieldRechargeRatePct: 0.08 },
    summary: '+25% Moonstone/Kyanite positives + +15 Shield Cap, +8% Shield Recharge Rate',
  },
  {
    id: 'dusk_striker',
    name: 'Dusk Striker Pair',
    tier: 2,
    positiveBoost: 0.25,
    boostedGems: ['carnelian', 'charoite'],
    flatBonus: { meleeTempoPct: 0.05, weaponSwapSpeedPct: 0.1 },
    summary: '+25% Carnelian/Charoite positives + +5% Melee Tempo, +10% Weapon Swap Speed',
  },
];

/**
 * Flat integer keys on `StatDelta` that round to the nearest integer via `Math.round()` (§6.1 Step 4).
 */
const INTEGER_STAT_DELTA_KEYS: ReadonlyArray<keyof StatDelta> = [
  'armorDurability',
  'armorRating',
  'armorThreshold',
  'shieldCapacity',
  'stability',
  'heatCapacity',
  'loadCapacity',
  'effectiveWeightDelta',
  'chargeStability',
];

/**
 * Percentage and floating-point keys on `StatDelta` that round to 2 decimal places (`Math.round(v * 100) / 100` — §6.1 Step 4).
 */
const FLOAT_STAT_DELTA_KEYS: ReadonlyArray<keyof StatDelta> = [
  'shieldRechargeRatePct',
  'shieldRechargeDelayPct',
  'heatDissipationPct',
  'heatCostPct',
  'energyCapacityPct',
  'moveSpeedPct',
  'dashIFrameSec',
  'stealthSignaturePct',
  'opticsRangeM',
  'lightRadiusM',
  'lockOnSpeedPct',
  'projectileTrackingPct',
  'meleeTempoPct',
  'reloadDrawSpeedPct',
  'weaponSwapSpeedPct',
  'recoilControlPct',
  'guardMitigationPct',
  'parryWindowSec',
  'supportRepairPowerPct',
  'armorRepairEfficiencyPct',
  'chargeMassPct',
];

/**
 * Scales a `StatDelta` by `multiplier` and applies the §6.1 Step 4 rounding rules:
 * - Integer stats (`armorDurability`, `armorRating`, `armorThreshold`, `shieldCapacity`, `stability`, `heatCapacity`, `loadCapacity`, `effectiveWeightDelta`, `chargeStability`) use `Math.round()`.
 * - Percentage/float stats (`*Pct`, `*Sec`, `*M`) round to 2 decimal places (`Math.round(v * 100) / 100`).
 */
export function scaleAndRoundStatDelta(delta: StatDelta, multiplier: number): StatDelta {
  const out: StatDelta = {};
  for (const key of INTEGER_STAT_DELTA_KEYS) {
    const val = delta[key];
    if (typeof val === 'number' && val !== 0) {
      const scaled = Math.round(val * multiplier);
      if (scaled !== 0) {
        out[key] = scaled;
      }
    }
  }
  for (const key of FLOAT_STAT_DELTA_KEYS) {
    const val = delta[key];
    if (typeof val === 'number' && val !== 0) {
      const scaled = Math.round(val * multiplier * 100) / 100;
      if (scaled !== 0) {
        out[key] = scaled;
      }
    }
  }
  return out;
}

/**
 * Adds one or more `StatDelta` objects together with clean 2-decimal precision on float fields.
 */
export function sumStatDeltas(...deltas: Array<StatDelta | undefined | null>): StatDelta {
  const acc: StatDelta = {};
  for (const delta of deltas) {
    if (!delta) continue;
    for (const key of INTEGER_STAT_DELTA_KEYS) {
      const val = delta[key];
      if (typeof val === 'number' && val !== 0) {
        acc[key] = Math.round((acc[key] ?? 0) + val);
      }
    }
    for (const key of FLOAT_STAT_DELTA_KEYS) {
      const val = delta[key];
      if (typeof val === 'number' && val !== 0) {
        acc[key] = Math.round(((acc[key] ?? 0) + val) * 100) / 100;
      }
    }
  }
  return acc;
}

/**
 * Returns the Reactor Family (`'ichor' | 'mana' | 'ether'`) of a `GemstoneId`.
 */
export function getGemstoneReactorFamily(gemId: GemstoneId): ExteriorReactorFamily {
  if (REACTOR_FAMILY_GEMS.ichor.includes(gemId)) return 'ichor';
  if (REACTOR_FAMILY_GEMS.mana.includes(gemId)) return 'mana';
  return 'ether';
}

/**
 * Evaluates Step 2A (Three-Gem Triad) and Step 2B (Two-Gem Pair) on a single Exterior Armor piece's socketed gems.
 */
export function detectArmorPieceResonanceCombo(
  gemSocketsCount: 2 | 3,
  socketedGems: Array<GemstoneId | null | undefined>
): ArmorGemResonanceCombo | null {
  const validGems = socketedGems
    .slice(0, gemSocketsCount)
    .filter((g): g is GemstoneId => Boolean(g));

  // Step 2A: Check Three-Gem Triad first (only on 3G pieces when all 3 sockets are filled)
  if (gemSocketsCount === 3 && validGems.length === 3) {
    const distinctGems = new Set(validGems);
    if (distinctGems.size === 3) {
      const isIchorTriad = REACTOR_FAMILY_GEMS.ichor.every((g) => distinctGems.has(g));
      if (isIchorTriad) return TIER3_TRIAD_COMBOS.ichor_crucible;

      const isManaTriad = REACTOR_FAMILY_GEMS.mana.every((g) => distinctGems.has(g));
      if (isManaTriad) return TIER3_TRIAD_COMBOS.mana_sanctuary;

      const isEtherTriad = REACTOR_FAMILY_GEMS.ether.every((g) => distinctGems.has(g));
      if (isEtherTriad) return TIER3_TRIAD_COMBOS.ether_astral;
    }

    // Prismatic Core Triad: 1 Ichor gem + 1 Mana gem + 1 Ether gem (3 distinct Reactor Families)
    const distinctFamilies = new Set(validGems.map((g) => getGemstoneReactorFamily(g)));
    if (distinctFamilies.size === 3) {
      return TIER3_TRIAD_COMBOS.prismatic_core;
    }
  }

  // Step 2B: If no Triad is active, check Two-Gem Pair Resonance (any 2 distinct socketed gems matching a canonical pair)
  if (validGems.length >= 2) {
    // Evaluate in socket order so the earliest matching canonical pair on the piece is deterministic
    for (let i = 0; i < validGems.length; i++) {
      for (let j = i + 1; j < validGems.length; j++) {
        const gA = validGems[i];
        const gB = validGems[j];
        if (gA === gB) continue;
        const matchedPair = TIER2_PAIR_COMBOS.find(
          (combo) =>
            Array.isArray(combo.boostedGems) &&
            combo.boostedGems.includes(gA) &&
            combo.boostedGems.includes(gB)
        );
        if (matchedPair) {
          return matchedPair;
        }
      }
    }
  }

  return null;
}

/**
 * Evaluates a single Exterior Armor piece's socketed gemstones using the §6.1 5-step Socket Calculation Engine:
 * - Step 1: Duplicate Gemstone Diminishing Returns (`100% -> 70% -> 40%` within the piece)
 * - Step 2: Piece-Local Combo Detection (Tier 3 Triad or Tier 2 Pair)
 * - Step 3: Reactor Core Harmonic Resonance (`+20%` positive when matching active `ReactorFamily`, plus `+10%` on `'head' | 'arms'` if Core Frame has `prismatic_core`)
 * - Step 4: Final Per-Socket Stat Calculation & Rounding
 */
export function evaluateExteriorArmorPieceSockets(
  piece: Pick<ExteriorArmorPiece, 'id' | 'slot' | 'gemSockets'>,
  socketedGems: Array<GemstoneId | null | undefined>,
  options?: {
    reactorFamily?: ReactorFamily | ExteriorReactorFamily | string | null;
    prismaticUniversalAffinity?: boolean;
  }
): ExteriorArmorSocketEvalResult {
  const normalizedReactor = normalizeExteriorReactorFamily(options?.reactorFamily);
  const clampedSockets = socketedGems.slice(0, piece.gemSockets);
  const activeCombo = detectArmorPieceResonanceCombo(piece.gemSockets, clampedSockets);

  const prismaticUniversalAffinityActive =
    activeCombo?.id === 'prismatic_core' || Boolean(options?.prismaticUniversalAffinity);

  // Prismatic Universal Affinity from Core Frame grants +0.10 positive boost to Head and Arms
  const prismaticBoost =
    (piece.slot === 'head' || piece.slot === 'arms') && options?.prismaticUniversalAffinity
      ? 0.1
      : 0;

  const occurrenceCounter: Partial<Record<GemstoneId, number>> = {};
  const socketDetails: ExteriorArmorSocketDetail[] = [];
  const accumulatedDeltas: StatDelta[] = [];

  for (let idx = 0; idx < clampedSockets.length; idx++) {
    const gemId = clampedSockets[idx];
    if (!gemId) continue;
    const basePayload = PER_SLOT_GEMSTONE_TABLE[gemId]?.[piece.slot];
    if (!basePayload) continue;

    const occurrenceIndex = Math.min(2, occurrenceCounter[gemId] ?? 0);
    occurrenceCounter[gemId] = (occurrenceCounter[gemId] ?? 0) + 1;

    const duplicateScalar = DUPLICATE_CURVE[occurrenceIndex] ?? 0.4;

    let comboPositiveBoost = 0;
    if (activeCombo) {
      if (activeCombo.boostedGems === 'ALL') {
        comboPositiveBoost = activeCombo.positiveBoost;
      } else if (activeCombo.boostedGems.includes(gemId)) {
        comboPositiveBoost = activeCombo.positiveBoost;
      }
    }

    const reactorBoost =
      normalizedReactor && REACTOR_FAMILY_GEMS[normalizedReactor].includes(gemId) ? 0.2 : 0;

    const positiveMultiplier =
      duplicateScalar * (1 + comboPositiveBoost + reactorBoost + prismaticBoost);
    const drawbackMultiplier = duplicateScalar;

    const scaledPositive = scaleAndRoundStatDelta(basePayload.positive, positiveMultiplier);
    const scaledDrawback = scaleAndRoundStatDelta(basePayload.drawback, drawbackMultiplier);

    socketDetails.push({
      socketIndex: idx,
      gemId,
      occurrenceIndex,
      duplicateScalar,
      comboPositiveBoost,
      reactorBoost,
      prismaticBoost,
      positiveMultiplier,
      drawbackMultiplier,
      scaledPositive,
      scaledDrawback,
    });

    accumulatedDeltas.push(scaledPositive, scaledDrawback);
  }

  if (activeCombo) {
    accumulatedDeltas.push(activeCombo.flatBonus);
  }

  return {
    pieceId: piece.id,
    slot: piece.slot,
    activeCombo,
    prismaticUniversalAffinityActive,
    socketDetails,
    totalGemAndComboDelta: sumStatDeltas(...accumulatedDeltas),
  };
}

/**
 * Evaluates all 3 equipped Exterior Armor pieces (`plating`, `head`, `arms`) together, propagating
 * Core Frame `prismatic_core` (`prismaticUniversalAffinity = true` -> `+10%` positive gem stats on Head and Arms)
 * and clamping cumulative combat tempo / stride speed modifiers to `[-0.30, +0.30]` (`0.70x` to `1.30x` — §6.1 Step 5).
 */
export function evaluateChassisExteriorArmorHarmonics(params: {
  platingPiece?: Pick<ExteriorArmorPiece, 'id' | 'slot' | 'gemSockets' | 'baseModifiers'> | null;
  platingGems?: Array<GemstoneId | null | undefined>;
  headPiece?: Pick<ExteriorArmorPiece, 'id' | 'slot' | 'gemSockets' | 'baseModifiers'> | null;
  headGems?: Array<GemstoneId | null | undefined>;
  armsPiece?: Pick<ExteriorArmorPiece, 'id' | 'slot' | 'gemSockets' | 'baseModifiers'> | null;
  armsGems?: Array<GemstoneId | null | undefined>;
  reactorFamily?: ReactorFamily | ExteriorReactorFamily | string | null;
}): {
  platingEval: ExteriorArmorSocketEvalResult | null;
  headEval: ExteriorArmorSocketEvalResult | null;
  armsEval: ExteriorArmorSocketEvalResult | null;
  prismaticUniversalAffinity: boolean;
  combinedGemAndComboDelta: StatDelta;
  combinedTotalExteriorDelta: StatDelta;
} {
  const platingEval = params.platingPiece
    ? evaluateExteriorArmorPieceSockets(params.platingPiece, params.platingGems ?? [], {
        reactorFamily: params.reactorFamily,
        prismaticUniversalAffinity: false,
      })
    : null;

  const prismaticUniversalAffinity = platingEval?.activeCombo?.id === 'prismatic_core';

  const headEval = params.headPiece
    ? evaluateExteriorArmorPieceSockets(params.headPiece, params.headGems ?? [], {
        reactorFamily: params.reactorFamily,
        prismaticUniversalAffinity,
      })
    : null;

  const armsEval = params.armsPiece
    ? evaluateExteriorArmorPieceSockets(params.armsPiece, params.armsGems ?? [], {
        reactorFamily: params.reactorFamily,
        prismaticUniversalAffinity,
      })
    : null;

  const combinedGemAndComboDelta = sumStatDeltas(
    platingEval?.totalGemAndComboDelta,
    headEval?.totalGemAndComboDelta,
    armsEval?.totalGemAndComboDelta
  );

  const combinedTotalExteriorDelta = sumStatDeltas(
    params.platingPiece?.baseModifiers,
    params.headPiece?.baseModifiers,
    params.armsPiece?.baseModifiers,
    combinedGemAndComboDelta
  );

  // §6.1 Step 5: Global Clamp on cumulative combat tempo or stride speed modifiers to [-0.30, +0.30]
  const clampTempo = (val?: number): number | undefined => {
    if (typeof val !== 'number') return undefined;
    return Math.max(-0.3, Math.min(0.3, Math.round(val * 100) / 100));
  };

  combinedGemAndComboDelta.moveSpeedPct = clampTempo(combinedGemAndComboDelta.moveSpeedPct);
  combinedGemAndComboDelta.meleeTempoPct = clampTempo(combinedGemAndComboDelta.meleeTempoPct);
  combinedGemAndComboDelta.reloadDrawSpeedPct = clampTempo(
    combinedGemAndComboDelta.reloadDrawSpeedPct
  );
  combinedGemAndComboDelta.weaponSwapSpeedPct = clampTempo(
    combinedGemAndComboDelta.weaponSwapSpeedPct
  );

  combinedTotalExteriorDelta.moveSpeedPct = clampTempo(combinedTotalExteriorDelta.moveSpeedPct);
  combinedTotalExteriorDelta.meleeTempoPct = clampTempo(combinedTotalExteriorDelta.meleeTempoPct);
  combinedTotalExteriorDelta.reloadDrawSpeedPct = clampTempo(
    combinedTotalExteriorDelta.reloadDrawSpeedPct
  );
  combinedTotalExteriorDelta.weaponSwapSpeedPct = clampTempo(
    combinedTotalExteriorDelta.weaponSwapSpeedPct
  );

  return {
    platingEval,
    headEval,
    armsEval,
    prismaticUniversalAffinity,
    combinedGemAndComboDelta,
    combinedTotalExteriorDelta,
  };
}

/**
 * Formats a `StatDelta` into concise human-readable UI badges (e.g. `['+18 Shield', '+6% Shield Regen', '-8 Armor DUR']`).
 */
export function formatStatDeltaBadges(delta?: StatDelta | null): string[] {
  if (!delta) return [];
  const badges: string[] = [];
  const fmtInt = (v: number | undefined, label: string, unit = '') => {
    if (typeof v === 'number' && v !== 0) {
      badges.push(`${v > 0 ? '+' : ''}${v}${unit} ${label}`.trim());
    }
  };
  const fmtPct = (v: number | undefined, label: string) => {
    if (typeof v === 'number' && v !== 0) {
      const pct = Math.round(v * 100);
      badges.push(`${pct > 0 ? '+' : ''}${pct}% ${label}`);
    }
  };
  const fmtFloat = (v: number | undefined, label: string, unit: string) => {
    if (typeof v === 'number' && v !== 0) {
      const clean = Number(v.toFixed(2));
      badges.push(`${clean > 0 ? '+' : ''}${clean}${unit} ${label}`);
    }
  };

  fmtInt(delta.armorDurability, 'Armor DUR');
  fmtInt(delta.armorRating, 'Armor RTG');
  fmtInt(delta.armorThreshold, 'Armor THR');
  fmtInt(delta.shieldCapacity, 'Shield');
  fmtPct(delta.shieldRechargeRatePct, 'Shield Regen');
  fmtPct(delta.shieldRechargeDelayPct, 'Shield Delay');
  fmtInt(delta.stability, 'Stability');
  fmtInt(delta.chargeStability, 'Charge Stability');
  fmtInt(delta.heatCapacity, 'Heat Cap');
  fmtPct(delta.heatDissipationPct, 'Heat Vent');
  fmtPct(delta.heatCostPct, 'Action Heat Cost');
  fmtPct(delta.energyCapacityPct, 'Energy Cap');
  fmtPct(delta.moveSpeedPct, 'Move Speed');
  fmtFloat(delta.dashIFrameSec, 'Dash i-Frames', 's');
  fmtPct(delta.stealthSignaturePct, 'Detection Sig');
  fmtFloat(delta.opticsRangeM, 'Optics Range', 'm');
  fmtFloat(delta.lightRadiusM, 'Light Radius', 'm');
  fmtPct(delta.lockOnSpeedPct, 'Lock-On Speed');
  fmtPct(delta.projectileTrackingPct, 'Tracking');
  fmtPct(delta.meleeTempoPct, 'Melee Tempo');
  fmtPct(delta.reloadDrawSpeedPct, 'Reload/Draw');
  fmtPct(delta.weaponSwapSpeedPct, 'Swap Speed');
  fmtPct(delta.recoilControlPct, 'Recoil Ctrl');
  fmtPct(delta.guardMitigationPct, 'Guard Mitig');
  fmtFloat(delta.parryWindowSec, 'Parry Window', 's');
  fmtPct(delta.supportRepairPowerPct, 'Support Repair');
  fmtPct(delta.armorRepairEfficiencyPct, 'Armor Repair Eff');
  fmtInt(delta.loadCapacity, 'Load Cap', ' WT');
  fmtInt(delta.effectiveWeightDelta, 'Eff. Weight', ' WT');
  fmtPct(delta.chargeMassPct, 'Charge Mass');

  return badges;
}

/**
 * Returns a concise human-readable description of a gemstone's Per-Slot Harmonic positive & drawback payload (§5).
 */
export function getPerSlotGemstoneHarmonicText(
  slot: ExteriorArmorSlot,
  gemId: GemstoneId
): string {
  const payload = PER_SLOT_GEMSTONE_TABLE[gemId]?.[slot];
  if (!payload) return '';
  const pos = formatStatDeltaBadges(payload.positive).join(', ');
  const neg = formatStatDeltaBadges(payload.drawback).join(', ');
  return neg ? `${pos} (${neg})` : pos;
}

/**
 * Looks up the Cyclopean Dwarf Forge recipe for a `forge_blueprint` Exterior Armor piece ID.
 */
export function getForgeRecipeForArmorPiece(armorId: string): ForgeRecipe | undefined {
  return FORGE_RECIPES.find((r) => r.outputArmorId === armorId);
}

/**
 * Checks whether the player has unlocked a specific Cyclopean Dwarf Forge Armor Blueprint (`bp_armor_*`).
 */
export function isArmorBlueprintUnlocked(state: OrionState, blueprintId: string): boolean {
  if (state.bypassProgressionGates || state.room === '-4,0') return true;
  if (state.equipmentSlots?.unlockedBlueprints?.includes(blueprintId)) return true;
  if (state.equipmentSlots?.unlockedEquipment?.includes(blueprintId)) return true;
  if (state.inventorySlots?.some((s) => s.itemId === blueprintId && s.count > 0)) return true;
  return false;
}

/**
 * Unlocks an Armor Blueprint (`bp_armor_*`) in the player's persistent loadout record.
 */
export function unlockArmorBlueprint(state: OrionState, blueprintId: string): boolean {
  if (!state.equipmentSlots) return false;
  if (!state.equipmentSlots.unlockedBlueprints) {
    state.equipmentSlots.unlockedBlueprints = [];
  }
  if (!state.equipmentSlots.unlockedBlueprints.includes(blueprintId)) {
    state.equipmentSlots.unlockedBlueprints.push(blueprintId);
    return true;
  }
  return false;
}

/**
 * Returns the number of copies of a Gemstone currently held in `state.inventorySlots`.
 */
function getHeldGemCount(state: OrionState, gemId: GemstoneId): number {
  const slot = state.inventorySlots?.find((s) => s.itemId === gemId);
  return slot ? slot.count : 0;
}

/**
 * Checks whether the player can craft a `forge_blueprint` Exterior Armor piece at a Cyclopean Dwarf Forge.
 */
export function canForgeExteriorArmorPiece(
  state: OrionState,
  outputArmorId: string
): {
  canForge: boolean;
  reason?: string;
  recipe?: ForgeRecipe;
  piece?: ExteriorArmorPiece;
  alreadyOwned: boolean;
  hasBlueprint: boolean;
  hasScrap: boolean;
  hasGems: boolean;
} {
  const recipe = getForgeRecipeForArmorPiece(outputArmorId);
  const piece = EXTERIOR_ARMOR_BY_ID[outputArmorId];
  if (!recipe || !piece) {
    return {
      canForge: false,
      reason: 'Unknown Forge Recipe',
      alreadyOwned: false,
      hasBlueprint: false,
      hasScrap: false,
      hasGems: false,
    };
  }

  const unlockedList = state.equipmentSlots?.unlockedEquipment ?? [];
  const alreadyOwned =
    unlockedList.includes(outputArmorId) ||
    state.equipmentSlots?.plating?.split('::')[0] === outputArmorId ||
    state.equipmentSlots?.head?.split('::')[0] === outputArmorId ||
    state.equipmentSlots?.arms?.split('::')[0] === outputArmorId;

  const isFreeSandbox = Boolean(state.bypassProgressionGates || state.room === '-4,0');
  const hasBlueprint = isArmorBlueprintUnlocked(state, recipe.blueprintId);
  const currentScrap = state.salvageScrap ?? 0;
  const hasScrap = isFreeSandbox || currentScrap >= recipe.scrapCost;

  const hasGems =
    isFreeSandbox ||
    recipe.gemCosts.every(({ gemId, count }) => getHeldGemCount(state, gemId) >= count);

  if (alreadyOwned) {
    return {
      canForge: false,
      reason: 'Already Forged',
      recipe,
      piece,
      alreadyOwned,
      hasBlueprint,
      hasScrap,
      hasGems,
    };
  }
  if (!hasBlueprint) {
    return {
      canForge: false,
      reason: 'Missing Blueprint',
      recipe,
      piece,
      alreadyOwned,
      hasBlueprint,
      hasScrap,
      hasGems,
    };
  }
  if (!hasScrap) {
    return {
      canForge: false,
      reason: `Needs ${recipe.scrapCost} Scrap`,
      recipe,
      piece,
      alreadyOwned,
      hasBlueprint,
      hasScrap,
      hasGems,
    };
  }
  if (!hasGems) {
    return {
      canForge: false,
      reason: 'Insufficient Gemstones',
      recipe,
      piece,
      alreadyOwned,
      hasBlueprint,
      hasScrap,
      hasGems,
    };
  }

  return {
    canForge: true,
    recipe,
    piece,
    alreadyOwned,
    hasBlueprint,
    hasScrap,
    hasGems,
  };
}

/**
 * Executes Cyclopean Dwarf Forge crafting for a `forge_blueprint` Exterior Armor piece (§4.2):
 * 1. Validates blueprint ownership, Scrap, and Gemstone requirements.
 * 2. Deducts `scrapCost` and `gemCosts` (unless in Cheat/Training mode where costs are waived if insufficient).
 * 3. Adds `outputArmorId` to `state.equipmentSlots.unlockedEquipment` and `ownedWeaponCounts`.
 */
export function forgeExteriorArmorPieceAtCyclopeanForge(
  state: OrionState,
  outputArmorId: string,
  ctx?: { say: (msg: string) => void }
): boolean {
  const status = canForgeExteriorArmorPiece(state, outputArmorId);
  if (!status.canForge || !status.recipe || !status.piece || !state.equipmentSlots) {
    return false;
  }

  const { recipe, piece } = status;

  // Deduct scrap & gemstones if held
  if ((state.salvageScrap ?? 0) >= recipe.scrapCost) {
    state.salvageScrap = Math.max(0, (state.salvageScrap ?? 0) - recipe.scrapCost);
  }
  if (state.inventorySlots) {
    for (const { gemId, count } of recipe.gemCosts) {
      const slot = state.inventorySlots.find((s) => s.itemId === gemId);
      if (slot && slot.count >= count) {
        slot.count -= count;
      }
    }
    state.inventorySlots = state.inventorySlots.filter((s) => s.count > 0);
  }

  if (!state.equipmentSlots.unlockedEquipment) {
    state.equipmentSlots.unlockedEquipment = [];
  }
  if (!state.equipmentSlots.unlockedEquipment.includes(outputArmorId)) {
    state.equipmentSlots.unlockedEquipment.push(outputArmorId);
  }
  if (!state.equipmentSlots.ownedWeaponCounts) {
    state.equipmentSlots.ownedWeaponCounts = {};
  }
  state.equipmentSlots.ownedWeaponCounts[outputArmorId] = Math.max(
    1,
    state.equipmentSlots.ownedWeaponCounts[outputArmorId] ?? 0
  );

  ctx?.say(`CYCLOPEAN FORGE: ${piece.name.toUpperCase()}`);
  return true;
}
