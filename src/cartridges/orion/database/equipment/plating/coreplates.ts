/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FrameLoadCapacity } from '../../../types';
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
  /** Optional 4-frame (64x16px, four 16x16px frames) Torso/Legs animation strip */
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
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
      baseArmorColor: '#334155',
      trimColor: '#38bdf8',
      reactorGlowColor: '#ea580c',
      legColor: '#1e293b',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
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
      baseArmorColor: '#1f2937',
      trimColor: '#f97316',
      reactorGlowColor: '#ef4444',
      legColor: '#111827',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
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
      baseArmorColor: '#e2e8f0',
      trimColor: '#eab308',
      reactorGlowColor: '#60a5fa',
      legColor: '#94a3b8',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
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
      baseArmorColor: '#0f172a',
      trimColor: '#a855f7',
      reactorGlowColor: '#c084fc',
      legColor: '#090d16',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
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
      baseArmorColor: '#1e1b4b',
      trimColor: '#38bdf8',
      reactorGlowColor: '#00f0ff',
      legColor: '#17153b',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
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
      baseArmorColor: '#f8fafc',
      trimColor: '#f59e0b',
      reactorGlowColor: '#10b981',
      legColor: '#cbd5e1',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
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
      baseArmorColor: '#475569',
      trimColor: '#f97316',
      reactorGlowColor: '#fb923c',
      legColor: '#334155',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
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
      baseArmorColor: '#374151',
      trimColor: '#eab308',
      reactorGlowColor: '#fbbf24',
      legColor: '#1f2937',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
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
      baseArmorColor: '#1e293b',
      trimColor: '#38bdf8',
      reactorGlowColor: '#7dd3fc',
      legColor: '#0f172a',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
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
      baseArmorColor: '#18181b',
      trimColor: '#94a3b8',
      reactorGlowColor: '#e879f9',
      legColor: '#09090b',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
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
      baseArmorColor: '#312e81',
      trimColor: '#22d3ee',
      reactorGlowColor: '#67e8f9',
      legColor: '#1e1b4b',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
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
      baseArmorColor: '#e2e8f0',
      trimColor: '#10b981',
      reactorGlowColor: '#34d399',
      legColor: '#94a3b8',
      chassisWidth: 9,
      chassisHeight: 7,
      torsoStyle: 'winged',
    },
  },
];

/** Backward-compatible catalog alias */
export const CANONICAL_COREPLATES: FramePlatingDefinition[] = CANONICAL_FRAME_PLATING;

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

/** Backward-compatible lookup alias */
export const getCoreplateDefinition = getFramePlatingDefinition;
