/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArmorAcquisitionType, FrameLoadCapacity, StatDelta } from '../../../types';
import {
  plating_ablative_cuirass,
  plating_arcanum_projector,
  plating_bwi_bastion,
  plating_camelot_knight,
  plating_dawnforge_guardian,
  plating_fire_ice_fortress,
  plating_hardened_sanctum,
  plating_layered_weave,
  plating_sanctum_support,
  plating_shadowcraft_recon,
} from './sprites';
import { MechPartSpriteStripConfig } from '../chassis_hardware';

/**
 * Type contract for `FramePlatingDefinition` (frame plating definition) in `coreplates.ts`.
 */
export interface FramePlatingDefinition {
  id: string;
  name: string;
  legacyNames?: string[];
  slot: 'plating';
  canonicalSlotLabel: 'Frame Plating';
  subtype: string;
  /** Set index (`0..5` for starter/post-boss sets, `12..15` for Cyclopean Dwarf Forge sets) */
  setIndex?: number;
  /** Canonical set identifier (`'set_00'..'set_05'`, `'set_12'..'set_15'`) */
  setId?: string;
  /** Optional 4-frame (64x16px or 64x64px 4-dir) Torso/Legs animation sheet */
  partSprite?: MechPartSpriteStripConfig;
  armorType: 'Ablative' | 'Reactive' | 'Hardened' | 'Layered';
  baseLoadCapacity: FrameLoadCapacity;
  /** Exact numeric Base Load Capacity in WT (`84`, `90`, `94`, `112`, `116`) per Exterior Armor Spec §3.1 */
  baseLoadCapacityNumber: number;
  armorThreshold: number;
  armorRating: number;
  armorDurability: number;
  shieldBonus: number;
  lightBonus?: number;
  weight: number;
  capacityBonus?: number;
  stabilityBonus?: number;
  moveSpeedMult?: number;
  heatVentMult?: number;
  cooldownMult?: number;
  origin?: 'looted' | 'crafted';
  /** Acquisition type (`'starter_post_boss' | 'forge_blueprint'`) */
  acquisition: ArmorAcquisitionType;
  /** Required Cyclopean Dwarf Forge blueprint ID if `acquisition === 'forge_blueprint'` */
  blueprintId?: string;
  /** Structured base stat modifiers from Exterior Armor Spec §3.1 */
  baseModifiers: StatDelta;
  maxGemSlots: 3;
  drawbackDescription: string;
  linkedActionId: string;
  description: string;
  isPlaceholderAsset?: boolean;
  futureAssetPlanned?: string;
  /** Optional visual theme for the Torso/Legs player sprite layer (used when baking a fallback 4-frame 16x16 strip) */
  spriteTheme?: {
    baseArmorColor: string;
    trimColor: string;
    reactorGlowColor: string;
    legColor?: string;
    chassisWidth?: number;
    chassisHeight?: number;
    torsoStyle?: 'angular' | 'heavy' | 'layered' | 'sleek' | 'prism' | 'winged';
  };
}

/** Backward-compatible type alias */
export type CoreplateDefinition = FramePlatingDefinition;

/**
 * Canonical 10 Core Frame Platings (`slot: 'plating'` · `3G` Each — Exterior Armor & Gem Socketing Spec §3.1).
 * Note: The 6 deprecated core-only variant IDs (`hw_plating_reactive`, `hw_plating_hardened`, `hw_plating_layered`,
 * `hw_plating_ablative`, `hw_plating_arcanum_conduit`, `hw_plating_sanctum_reliquary`) are mapped via `legacyNames`
 * so older saves continue to resolve cleanly.
 */
export const CANONICAL_FRAME_PLATING: FramePlatingDefinition[] = [
  // ─── SET 0: BWI C-140 Bastion Frame (`set_00`) ────────────────────────────
  {
    id: 'coreplate_bwi_bastion',
    name: 'BWI C-140 Bastion Frame',
    legacyNames: [
      'BWI Bastion Frame Plating',
      'BWI Bastion Coreplate',
      'hw_plating_reactive',
      'Reactive Blast-Plate Frame Plating',
      'Reactive Blast-Plate Cuirass',
    ],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Physical / Reactive',
    setIndex: 0,
    setId: 'set_00',
    partSprite: {
      base64: plating_bwi_bastion,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Reactive',
    baseLoadCapacity: 'medium',
    baseLoadCapacityNumber: 90,
    armorThreshold: 4,
    armorRating: 8,
    armorDurability: 135,
    shieldBonus: 45,
    stabilityBonus: 6,
    heatVentMult: 1.08,
    weight: 16,
    origin: 'looted',
    acquisition: 'starter_post_boss',
    baseModifiers: {
      stability: 6,
      heatDissipationPct: 0.08,
    },
    maxGemSlots: 3,
    drawbackDescription: 'Balanced baseline',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'Balanced BWI C-140 frontal torso & leg plating (+135 DUR, 8 RTG, 4 THR, +45 Shield, +6 Stability, +8% Heat Dissipation / 16 WT, Cap 90 WT).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#962d2d',
      trimColor: '#fa4b4b',
      reactorGlowColor: '#ea580c',
      legColor: '#641e1e',
      chassisWidth: 8,
      chassisHeight: 7,
      torsoStyle: 'angular',
    },
  },
  // ─── SET 1: B&E H-380 Fortress Plate (`set_01`) ───────────────────────────
  {
    id: 'coreplate_fire_ice_fortress',
    name: 'B&E H-380 Fortress Plate',
    legacyNames: [
      'Fire & Ice Fortress Frame Plating',
      'Fire & Ice Fortress Coreplate',
      'hw_plating_hardened',
      'Hardened Sanctum Frame Plating',
      'Hardened Sanctum Carapace',
    ],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Physical / Hardened',
    setIndex: 1,
    setId: 'set_01',
    partSprite: {
      base64: plating_fire_ice_fortress,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Hardened',
    baseLoadCapacity: 'heavy',
    baseLoadCapacityNumber: 112,
    armorThreshold: 8,
    armorRating: 12,
    armorDurability: 180,
    shieldBonus: 30,
    stabilityBonus: 15,
    moveSpeedMult: 0.92,
    weight: 28,
    origin: 'looted',
    acquisition: 'starter_post_boss',
    baseModifiers: {
      stability: 15,
      heatCapacity: 20,
      moveSpeedPct: -0.08,
    },
    maxGemSlots: 3,
    drawbackDescription: '-8% Move Speed',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'Heavy B&E H-380 siege torso & leg plating with thermal expansion sinks (+180 DUR, 12 RTG, 8 THR, +30 Shield, +15 Stability, +20 Heat Cap / 28 WT, Cap 112 WT, -8% Move Speed).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#999999',
      trimColor: '#ffffff',
      reactorGlowColor: '#ef4444',
      legColor: '#666666',
      chassisWidth: 10,
      chassisHeight: 8,
      torsoStyle: 'heavy',
    },
  },
  // ─── SET 2: Aegis Solis Bulwark Plate (`set_02`) ──────────────────────────
  {
    id: 'coreplate_dawnforge_guardian',
    name: 'Aegis Solis Bulwark Plate',
    legacyNames: [
      'Dawnforge Guardian Frame Plating',
      'Dawnforge Guardian Coreplate',
      'hw_plating_layered',
      'Layered Weave Frame Plating',
      'Layered Weave Laminate',
    ],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Physical / Layered',
    setIndex: 2,
    setId: 'set_02',
    partSprite: {
      base64: plating_dawnforge_guardian,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Layered',
    baseLoadCapacity: 'heavy',
    baseLoadCapacityNumber: 112,
    armorThreshold: 6,
    armorRating: 10,
    armorDurability: 160,
    shieldBonus: 60,
    stabilityBonus: 10,
    moveSpeedMult: 0.95,
    weight: 26,
    origin: 'looted',
    acquisition: 'starter_post_boss',
    baseModifiers: {
      stability: 10,
      shieldRechargeRatePct: 0.12,
      moveSpeedPct: -0.05,
    },
    maxGemSlots: 3,
    drawbackDescription: '-5% Move Speed',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'Radiant vanguard torso & leg bulwark with integrated barrier relays (+160 DUR, 10 RTG, 6 THR, +60 Shield, +10 Stability, +12% Shield Recharge / 26 WT, Cap 112 WT, -5% Move Speed).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#965a1e',
      trimColor: '#fa9e32',
      reactorGlowColor: '#60a5fa',
      legColor: '#643814',
      chassisWidth: 9,
      chassisHeight: 7,
      torsoStyle: 'layered',
    },
  },
  // ─── SET 3: Vanguard-X Recon Carapace (`set_03`) ──────────────────────────
  {
    id: 'coreplate_shadowcraft_recon',
    name: 'Vanguard-X Recon Carapace',
    legacyNames: [
      'Shadowcraft Recon Frame Plating',
      'Shadowcraft Recon Coreplate',
      'hw_plating_ablative',
      'Ablative Cuirass Frame Plating',
      'Ablative Cuirass Plating',
    ],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Physical / Ablative',
    setIndex: 3,
    setId: 'set_03',
    partSprite: {
      base64: plating_shadowcraft_recon,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Ablative',
    baseLoadCapacity: 'light',
    baseLoadCapacityNumber: 84,
    armorThreshold: 2,
    armorRating: 5,
    armorDurability: 100,
    shieldBonus: 35,
    moveSpeedMult: 1.08,
    stabilityBonus: -4,
    weight: 9,
    origin: 'looted',
    acquisition: 'starter_post_boss',
    baseModifiers: {
      moveSpeedPct: 0.08,
      dashIFrameSec: 0.04,
      stealthSignaturePct: -0.25,
      stability: -4,
    },
    maxGemSlots: 3,
    drawbackDescription: '-4 Stability',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'Low-observable Vanguard-X infiltration carapace (+100 DUR, 5 RTG, 2 THR, +35 Shield, +8% Move Speed, +0.04s Dash i-Frames, -25% Stealth Signature / 9 WT, Cap 84 WT, -4 Stability).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#968f26',
      trimColor: '#faef3f',
      reactorGlowColor: '#c084fc',
      legColor: '#645f19',
      chassisWidth: 7,
      chassisHeight: 7,
      torsoStyle: 'sleek',
    },
  },
  // ─── SET 4: Arcanum Resonant Plate (`set_04`) ─────────────────────────────
  {
    id: 'coreplate_arcanum_projector',
    name: 'Arcanum Resonant Plate',
    legacyNames: [
      'Arcanum Heavy Projector Frame Plating',
      'Arcanum Heavy Projector Coreplate',
      'hw_plating_arcanum_conduit',
      'Arcanum Conduit Frame Plating',
    ],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Physical / Layered',
    setIndex: 4,
    setId: 'set_04',
    partSprite: {
      base64: plating_arcanum_projector,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Layered',
    baseLoadCapacity: 'light',
    baseLoadCapacityNumber: 84,
    armorThreshold: 2,
    armorRating: 4,
    armorDurability: 90,
    shieldBonus: 85,
    heatVentMult: 1.18,
    weight: 10,
    origin: 'looted',
    acquisition: 'starter_post_boss',
    baseModifiers: {
      heatDissipationPct: 0.18,
      shieldRechargeRatePct: 0.15,
    },
    maxGemSlots: 3,
    drawbackDescription: 'Low Layer 2 THR (2)',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'High-capacitance Arcanum crystal lattice frame (+90 DUR, 4 RTG, 2 THR, +85 Shield, +18% Heat Dissipation, +15% Shield Recharge / 10 WT, Cap 84 WT).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#1e871e',
      trimColor: '#32e132',
      reactorGlowColor: '#00f0ff',
      legColor: '#145a14',
      chassisWidth: 8,
      chassisHeight: 7,
      torsoStyle: 'prism',
    },
  },
  // ─── SET 5: Sanctum Aegis Frame (`set_05`) ────────────────────────────────
  {
    id: 'coreplate_sanctum_support',
    name: 'Sanctum Aegis Frame',
    legacyNames: [
      'Sanctum Support Frame Plating',
      'Sanctum Support Coreplate',
      'hw_plating_sanctum_reliquary',
      'Sanctum Reliquary Frame Plating',
      'plating_sanc_reliquary_vestments',
    ],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Physical / Reactive',
    setIndex: 5,
    setId: 'set_05',
    partSprite: {
      base64: plating_sanctum_support,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Reactive',
    baseLoadCapacity: 'medium',
    baseLoadCapacityNumber: 90,
    armorThreshold: 5,
    armorRating: 9,
    armorDurability: 145,
    shieldBonus: 55,
    stabilityBonus: 8,
    weight: 17,
    origin: 'looted',
    acquisition: 'starter_post_boss',
    baseModifiers: {
      supportRepairPowerPct: 0.15,
      stability: 8,
      meleeTempoPct: -0.03,
    },
    maxGemSlots: 3,
    drawbackDescription: '-3% Melee Tempo',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'Consecrated Sanctum support chassis with harmonic restoration relays (+145 DUR, 9 RTG, 5 THR, +55 Shield, +15% Support/Repair Power, +8 Stability / 17 WT, Cap 90 WT, -3% Melee Tempo).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#4b5478',
      trimColor: '#7d8cc8',
      reactorGlowColor: '#10b981',
      legColor: '#323850',
      chassisWidth: 8,
      chassisHeight: 7,
      torsoStyle: 'winged',
    },
  },
  // ─── SET 12: Camelot Knight Errant Cuirass (`set_12`) ─────────────────────
  {
    id: 'plating_camelot_knight',
    name: 'Camelot Knight Errant Cuirass',
    legacyNames: ['Camelot Knight Frame Plating', 'Camelot Knight Coreplate', 'Camelot Knight'],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Chivalric / Hardened Alloy',
    setIndex: 12,
    setId: 'set_12',
    partSprite: {
      base64: plating_camelot_knight,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Hardened',
    baseLoadCapacity: 'heavy',
    baseLoadCapacityNumber: 112,
    armorThreshold: 7,
    armorRating: 12,
    armorDurability: 175,
    shieldBonus: 50,
    stabilityBonus: 14,
    moveSpeedMult: 0.95,
    weight: 31,
    origin: 'crafted',
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_camelot_knight',
    baseModifiers: {
      stability: 14,
      moveSpeedPct: -0.05,
    },
    maxGemSlots: 3,
    drawbackDescription: '-5% Move Speed',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'Cyclopean-forged Camelot Knight Errant chivalric cuirass (+175 DUR, 12 RTG, 7 THR, +50 Shield, +14 Stability / 31 WT, Cap 112 WT, -5% Move Speed).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#999999',
      trimColor: '#ffffff',
      reactorGlowColor: '#38bdf8',
      legColor: '#666666',
      chassisWidth: 9,
      chassisHeight: 7,
      torsoStyle: 'layered',
    },
  },
  // ─── SET 13: Novarin Steppe Outrider Brigandine (`set_13`) ────────────────
  {
    id: 'plating_novarin_outrider',
    name: 'Novarin Steppe Outrider Brigandine',
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Steppe Cavalry / Ablative Brigandine',
    setIndex: 13,
    setId: 'set_13',
    partSprite: {
      base64: plating_ablative_cuirass,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Ablative',
    baseLoadCapacity: 'light',
    baseLoadCapacityNumber: 84,
    armorThreshold: 3,
    armorRating: 6,
    armorDurability: 110,
    shieldBonus: 35,
    moveSpeedMult: 1.08,
    stabilityBonus: -3,
    weight: 8,
    origin: 'crafted',
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_novarin_outrider',
    baseModifiers: {
      moveSpeedPct: 0.08,
      reloadDrawSpeedPct: 0.06,
      stability: -3,
    },
    maxGemSlots: 3,
    drawbackDescription: '-3 Stability',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'Cyclopean-forged Novarin Steppe Outrider riveted brigandine (+110 DUR, 6 RTG, 3 THR, +35 Shield, +8% Move Speed, +6% Reload/Draw Speed / 8 WT, Cap 84 WT, -3 Stability).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#52705a',
      trimColor: '#89bc96',
      reactorGlowColor: '#a855f7',
      legColor: '#374b3c',
      chassisWidth: 7,
      chassisHeight: 7,
      torsoStyle: 'sleek',
    },
  },
  // ─── SET 14: Novarin Royal Keshig Lamellar (`set_14`) ─────────────────────
  {
    id: 'plating_novarin_keshig',
    name: 'Novarin Royal Keshig Lamellar',
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Royal Vanguard / Layered Lamellar',
    setIndex: 14,
    setId: 'set_14',
    partSprite: {
      base64: plating_layered_weave,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Layered',
    baseLoadCapacity: 'medium',
    baseLoadCapacityNumber: 94,
    armorThreshold: 5,
    armorRating: 10,
    armorDurability: 150,
    shieldBonus: 40,
    stabilityBonus: 9,
    heatVentMult: 1.1,
    weight: 18,
    origin: 'crafted',
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_novarin_keshig',
    baseModifiers: {
      stability: 9,
      heatDissipationPct: 0.1,
    },
    maxGemSlots: 3,
    drawbackDescription: 'Slightly heavier than BWI (18 WT)',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'Cyclopean-forged Novarin Royal Keshig laced steel lamellar (+150 DUR, 10 RTG, 5 THR, +40 Shield, +9 Stability, +10% Heat Dissipation / 18 WT, Cap 94 WT).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#87704b',
      trimColor: '#e1bc7d',
      reactorGlowColor: '#f97316',
      legColor: '#5a4b32',
      chassisWidth: 8,
      chassisHeight: 7,
      torsoStyle: 'layered',
    },
  },
  // ─── SET 15: Novarin Iron Tarkhan Cataphract Barding (`set_15`) ───────────
  {
    id: 'plating_novarin_tarkhan',
    name: 'Novarin Iron Tarkhan Cataphract Barding',
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Cataphract / Hardened Barding',
    setIndex: 15,
    setId: 'set_15',
    partSprite: {
      base64: plating_hardened_sanctum,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Hardened',
    baseLoadCapacity: 'heavy',
    baseLoadCapacityNumber: 116,
    armorThreshold: 8,
    armorRating: 13,
    armorDurability: 190,
    shieldBonus: 25,
    stabilityBonus: 18,
    moveSpeedMult: 0.9,
    weight: 34,
    origin: 'crafted',
    acquisition: 'forge_blueprint',
    blueprintId: 'bp_armor_novarin_tarkhan',
    baseModifiers: {
      stability: 18,
      chargeMassPct: 0.1,
      moveSpeedPct: -0.1,
    },
    maxGemSlots: 3,
    drawbackDescription: '-10% Move Speed',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'Cyclopean-forged Novarin Iron Tarkhan heavy cataphract barding (+190 DUR, 13 RTG, 8 THR, +25 Shield, +18 Stability, +10% Directional Charge Mass / 34 WT, Cap 116 WT, -10% Move Speed).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#5a1e3c',
      trimColor: '#e14b96',
      reactorGlowColor: '#fbbf24',
      legColor: '#321020',
      chassisWidth: 10,
      chassisHeight: 8,
      torsoStyle: 'heavy',
    },
  },
];

/**
 * Executes `getFramePlatingDefinition` (get frame plating definition) in `coreplates.ts`.
 */
export function getFramePlatingDefinition(
  idOrName?: string | null
): FramePlatingDefinition | undefined {
  if (!idOrName) return undefined;
  const norm = idOrName.trim().toLowerCase();
  return (
    CANONICAL_FRAME_PLATING.find((p) => p.id.toLowerCase() === norm) ||
    CANONICAL_FRAME_PLATING.find((p) => p.name.toLowerCase() === norm) ||
    CANONICAL_FRAME_PLATING.find((p) => p.legacyNames?.some((l) => l.toLowerCase() === norm)) ||
    CANONICAL_FRAME_PLATING.find((p) =>
      norm.includes(p.id.replace('coreplate_', '').replace('plating_', ''))
    )
  );
}
