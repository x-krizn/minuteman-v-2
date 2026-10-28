/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FrameLoadCapacity } from '../../../types';
import {
  plating_ablative_cuirass,
  plating_arcanum_conduit,
  plating_arcanum_projector,
  plating_bwi_bastion,
  plating_camelot_knight,
  plating_dawnforge_guardian,
  plating_fire_ice_fortress,
  plating_hardened_sanctum,
  plating_layered_weave,
  plating_reactive_blastplate,
  plating_sanctum_reliquary,
  plating_sanctum_support,
  plating_shadowcraft_recon,
} from './sprites';
import { MechPartSpriteStripConfig } from '../chassis_hardware';

export interface FramePlatingDefinition {
  id: string;
  name: string;
  legacyNames?: string[];
  slot: 'plating';
  canonicalSlotLabel: 'Frame Plating';
  subtype: string;
  /** Optional set index (0..11 for the 12 baseline sets; omit for standalone pieces that aren't part of a set) */
  setIndex?: number;
  /** Optional set identifier for grouping matching pieces (omit for standalone pieces) */
  setId?: string;
  /** Optional 4-frame (64x16px or 64x64px 4-dir) Torso/Legs animation sheet */
  partSprite?: MechPartSpriteStripConfig;
  armorType: 'Ablative' | 'Reactive' | 'Hardened' | 'Layered';
  baseLoadCapacity: FrameLoadCapacity;
  armorThreshold: number;
  armorRating: number;
  armorDurability: number;
  shieldBonus: number;
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

export const CANONICAL_FRAME_PLATING: FramePlatingDefinition[] = [
  // ─── SET 0: BWI Bastion Frame Plating ─────────────────────────────────────
  {
    id: 'coreplate_bwi_bastion',
    name: 'BWI Bastion Frame Plating',
    legacyNames: ['BWI Bastion Coreplate'],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Physical / Reactive',
    setIndex: 0,
    setId: 'set_01_bastion',
    partSprite: {
      base64: plating_bwi_bastion,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Reactive',
    baseLoadCapacity: 'medium',
    armorThreshold: 7,
    armorRating: 11,
    armorDurability: 140,
    shieldBonus: 45,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Heavy frontal torso & leg plating with turbine shielding (Physical / Reactive · Set 01).',
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
  // ─── SET 1: Fire & Ice Fortress Frame Plating ─────────────────────────────
  {
    id: 'coreplate_fire_ice_fortress',
    name: 'Fire & Ice Fortress Frame Plating',
    legacyNames: ['Fire & Ice Fortress Coreplate'],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Physical / Hardened',
    setIndex: 1,
    setId: 'set_02_fortress',
    partSprite: {
      base64: plating_fire_ice_fortress,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Hardened',
    baseLoadCapacity: 'superheavy',
    armorThreshold: 10,
    armorRating: 15,
    armorDurability: 180,
    shieldBonus: 35,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Super-heavy frontal torso & leg plating with outrigging stabilizers (Physical / Hardened · Set 02).',
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
  // ─── SET 2: Dawnforge Guardian Frame Plating ──────────────────────────────
  {
    id: 'coreplate_dawnforge_guardian',
    name: 'Dawnforge Guardian Frame Plating',
    legacyNames: ['Dawnforge Guardian Coreplate'],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Physical / Layered',
    setIndex: 2,
    setId: 'set_03_dawnforge',
    partSprite: {
      base64: plating_dawnforge_guardian,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Layered',
    baseLoadCapacity: 'heavy',
    armorThreshold: 8,
    armorRating: 13,
    armorDurability: 155,
    shieldBonus: 75,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Heavy vanguard torso & leg plating with stabilizer anchors and shield emitters (Physical / Layered · Set 03).',
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
  // ─── SET 3: Shadowcraft Recon Frame Plating ───────────────────────────────
  {
    id: 'coreplate_shadowcraft_recon',
    name: 'Shadowcraft Recon Frame Plating',
    legacyNames: ['Shadowcraft Recon Coreplate'],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Physical / Ablative',
    setIndex: 3,
    setId: 'set_04_shadowcraft',
    partSprite: {
      base64: plating_shadowcraft_recon,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Ablative',
    baseLoadCapacity: 'light',
    armorThreshold: 4,
    armorRating: 7,
    armorDurability: 105,
    shieldBonus: 40,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Lightweight stealth torso & leg plating with emission dampeners (Physical / Ablative · Set 04).',
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
  // ─── SET 4: Arcanum Heavy Projector Frame Plating ─────────────────────────
  {
    id: 'coreplate_arcanum_projector',
    name: 'Arcanum Heavy Projector Frame Plating',
    legacyNames: ['Arcanum Heavy Projector Coreplate'],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Physical / Layered',
    setIndex: 4,
    setId: 'set_05_arcanum',
    partSprite: {
      base64: plating_arcanum_projector,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Layered',
    baseLoadCapacity: 'light',
    armorThreshold: 5,
    armorRating: 8,
    armorDurability: 110,
    shieldBonus: 65,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Reinforced crystal lattice torso & leg plating with beam stabilizers (Physical / Layered · Set 05).',
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
  // ─── SET 5: Sanctum Support Frame Plating ─────────────────────────────────
  {
    id: 'coreplate_sanctum_support',
    name: 'Sanctum Support Frame Plating',
    legacyNames: ['Sanctum Support Coreplate'],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Physical / Reactive',
    setIndex: 5,
    setId: 'set_06_sanctum',
    partSprite: {
      base64: plating_sanctum_support,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Reactive',
    baseLoadCapacity: 'medium',
    armorThreshold: 6,
    armorRating: 10,
    armorDurability: 130,
    shieldBonus: 60,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Balanced torso & leg plating with distributed buffer systems (Physical / Reactive · Set 06).',
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
  // ─── SET 6: Reactive Blast-Plate Frame Plating ────────────────────────────
  {
    id: 'hw_plating_reactive',
    name: 'Reactive Blast-Plate Frame Plating',
    legacyNames: ['Reactive Blast-Plate Cuirass'],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Reactive Armor',
    setIndex: 6,
    setId: 'set_07_blastplate',
    partSprite: {
      base64: plating_reactive_blastplate,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Reactive',
    baseLoadCapacity: 'medium',
    armorThreshold: 7,
    armorRating: 11,
    armorDurability: 140,
    shieldBonus: 45,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Explosive counter-charge torso & leg frame plating that repels close-quarters attackers (Set 07).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#5a3596',
      trimColor: '#9659fa',
      reactorGlowColor: '#fb923c',
      legColor: '#3c2364',
      chassisWidth: 8,
      chassisHeight: 7,
      torsoStyle: 'angular',
    },
  },
  // ─── SET 7: Hardened Sanctum Frame Plating ────────────────────────────────
  {
    id: 'hw_plating_hardened',
    name: 'Hardened Sanctum Frame Plating',
    legacyNames: ['Hardened Sanctum Carapace'],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Hardened Armor',
    setIndex: 7,
    setId: 'set_08_siegebreaker',
    partSprite: {
      base64: plating_hardened_sanctum,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Hardened',
    baseLoadCapacity: 'heavy',
    armorThreshold: 9,
    armorRating: 14,
    armorDurability: 165,
    shieldBonus: 40,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Dense cathedral-forged alloy frame plating with high damage threshold against light fire (Set 08).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#872d5a',
      trimColor: '#e14b96',
      reactorGlowColor: '#fbbf24',
      legColor: '#5a1e3c',
      chassisWidth: 10,
      chassisHeight: 8,
      torsoStyle: 'heavy',
    },
  },
  // ─── SET 8: Layered Weave Frame Plating ───────────────────────────────────
  {
    id: 'hw_plating_layered',
    name: 'Layered Weave Frame Plating',
    legacyNames: ['Layered Weave Laminate'],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Layered Armor',
    setIndex: 8,
    setId: 'set_09_radiant',
    partSprite: {
      base64: plating_layered_weave,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Layered',
    baseLoadCapacity: 'medium',
    armorThreshold: 6,
    armorRating: 10,
    armorDurability: 130,
    shieldBonus: 55,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Flexible composite weave frame plating favored by agile frames for rapid heat dissipation (Set 09).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#69694b',
      trimColor: '#afaf7d',
      reactorGlowColor: '#7dd3fc',
      legColor: '#464632',
      chassisWidth: 8,
      chassisHeight: 7,
      torsoStyle: 'layered',
    },
  },
  // ─── SET 9: Ablative Cuirass Frame Plating ────────────────────────────────
  {
    id: 'hw_plating_ablative',
    name: 'Ablative Cuirass Frame Plating',
    legacyNames: ['Ablative Cuirass Plating'],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Ablative Armor',
    setIndex: 9,
    setId: 'set_10_whisperblade',
    partSprite: {
      base64: plating_ablative_cuirass,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Ablative',
    baseLoadCapacity: 'light',
    armorThreshold: 5,
    armorRating: 8,
    armorDurability: 115,
    shieldBonus: 40,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'High-durability sacrificial ceramic torso & leg plates with balanced threshold (Set 10).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#52705a',
      trimColor: '#89bc96',
      reactorGlowColor: '#e879f9',
      legColor: '#374b3c',
      chassisWidth: 7,
      chassisHeight: 7,
      torsoStyle: 'sleek',
    },
  },
  // ─── SET 10: Arcanum Conduit Frame Plating ────────────────────────────────
  {
    id: 'hw_plating_arcanum_conduit',
    name: 'Arcanum Conduit Frame Plating',
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Layered / Æther Lattice',
    setIndex: 10,
    setId: 'set_11_conduit',
    partSprite: {
      base64: plating_arcanum_conduit,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Layered',
    baseLoadCapacity: 'medium',
    armorThreshold: 6,
    armorRating: 9,
    armorDurability: 120,
    shieldBonus: 70,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'High-refraction Æther conduit torso & leg plating for sustained artillery channeling (Set 11).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#87704b',
      trimColor: '#e1bc7d',
      reactorGlowColor: '#67e8f9',
      legColor: '#5a4b32',
      chassisWidth: 8,
      chassisHeight: 7,
      torsoStyle: 'prism',
    },
  },
  // ─── SET 11: Sanctum Reliquary Frame Plating ──────────────────────────────
  {
    id: 'hw_plating_sanctum_reliquary',
    name: 'Sanctum Reliquary Frame Plating',
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Reactive / Harmonic',
    setIndex: 11,
    setId: 'set_12_reliquary',
    partSprite: {
      base64: plating_sanctum_reliquary,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Reactive',
    baseLoadCapacity: 'heavy',
    armorThreshold: 8,
    armorRating: 12,
    armorDurability: 150,
    shieldBonus: 65,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Consecrated reliquary torso & leg plating with harmonic barrier stabilizers (Set 12).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#323232',
      trimColor: '#646464',
      reactorGlowColor: '#34d399',
      legColor: '#1e1e1e',
      chassisWidth: 9,
      chassisHeight: 7,
      torsoStyle: 'winged',
    },
  },
  // ─── CAMELOT KNIGHT SET: Camelot Knight Frame Plating ─────────────────────
  {
    id: 'plating_camelot_knight',
    name: 'Camelot Knight Frame Plating',
    legacyNames: ['Camelot Knight Coreplate', 'Camelot Knight'],
    slot: 'plating',
    canonicalSlotLabel: 'Frame Plating',
    subtype: 'Chivalric / Hardened Alloy',
    setIndex: 12,
    setId: 'set_camelot_knight',
    partSprite: {
      base64: plating_camelot_knight,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    armorType: 'Hardened',
    baseLoadCapacity: 'heavy',
    armorThreshold: 9,
    armorRating: 14,
    armorDurability: 165,
    shieldBonus: 55,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Polished silver-steel chivalric torso & leg frame plating forged for frontline knightly lancers (Camelot Knight Set).',
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
];

export function getFramePlatingDefinition(idOrName?: string | null): FramePlatingDefinition | undefined {
  if (!idOrName) return undefined;
  const norm = idOrName.trim().toLowerCase();
  return (
    CANONICAL_FRAME_PLATING.find((p) => p.id.toLowerCase() === norm) ||
    CANONICAL_FRAME_PLATING.find((p) => p.name.toLowerCase() === norm) ||
    CANONICAL_FRAME_PLATING.find((p) => p.legacyNames?.some((l) => l.toLowerCase() === norm)) ||
    CANONICAL_FRAME_PLATING.find((p) => norm.includes(p.id.replace('coreplate_', '').replace('hw_plating_', '')))
  );
}
