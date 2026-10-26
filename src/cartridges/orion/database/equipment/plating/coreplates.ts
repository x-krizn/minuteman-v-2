/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FrameLoadCapacity } from '../../../types';

export interface CoreplateDefinition {
  id: string;
  name: string;
  slot: 'plating';
  canonicalSlotLabel: 'Core Frame';
  subtype: string;
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
  /** Visual theme for the player sprite layer */
  spriteTheme: {
    baseArmorColor: string;
    trimColor: string;
    reactorGlowColor: string;
    chassisWidth: number;
    chassisHeight: number;
    shoulderStyle: 'angular' | 'heavy' | 'layered' | 'sleek' | 'prism' | 'winged';
  };
}

export const CANONICAL_COREPLATES: CoreplateDefinition[] = [
  {
    id: 'coreplate_bwi_bastion',
    name: 'BWI Bastion Coreplate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Physical / Reactive',
    armorType: 'Reactive',
    baseLoadCapacity: 'medium',
    armorThreshold: 7,
    armorRating: 11,
    armorDurability: 140,
    shieldBonus: 45,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Heavy frontal, turbine shielding (Physical / Reactive).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#334155',
      trimColor: '#38bdf8',
      reactorGlowColor: '#ea580c',
      chassisWidth: 10,
      chassisHeight: 11,
      shoulderStyle: 'angular',
    },
  },
  {
    id: 'coreplate_fire_ice_fortress',
    name: 'Fire & Ice Fortress Coreplate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Physical / Hardened',
    armorType: 'Hardened',
    baseLoadCapacity: 'superheavy',
    armorThreshold: 10,
    armorRating: 15,
    armorDurability: 180,
    shieldBonus: 35,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Super-heavy frontal, outrigging stabilizers (Physical / Hardened).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#1f2937',
      trimColor: '#f97316',
      reactorGlowColor: '#ef4444',
      chassisWidth: 12,
      chassisHeight: 12,
      shoulderStyle: 'heavy',
    },
  },
  {
    id: 'coreplate_dawnforge_guardian',
    name: 'Dawnforge Guardian Coreplate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Physical / Layered',
    armorType: 'Layered',
    baseLoadCapacity: 'heavy',
    armorThreshold: 8,
    armorRating: 13,
    armorDurability: 155,
    shieldBonus: 75,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Heavy, stabilizer anchors, shield emitters (Physical / Layered).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#e2e8f0',
      trimColor: '#eab308',
      reactorGlowColor: '#60a5fa',
      chassisWidth: 10,
      chassisHeight: 11,
      shoulderStyle: 'layered',
    },
  },
  {
    id: 'coreplate_shadowcraft_recon',
    name: 'Shadowcraft Recon Coreplate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Physical / Ablative',
    armorType: 'Ablative',
    baseLoadCapacity: 'light',
    armorThreshold: 4,
    armorRating: 7,
    armorDurability: 105,
    shieldBonus: 40,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Lightweight, emission dampeners (Physical / Ablative).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#0f172a',
      trimColor: '#a855f7',
      reactorGlowColor: '#c084fc',
      chassisWidth: 8,
      chassisHeight: 10,
      shoulderStyle: 'sleek',
    },
  },
  {
    id: 'coreplate_arcanum_projector',
    name: 'Arcanum Heavy Projector Coreplate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Physical / Layered',
    armorType: 'Layered',
    baseLoadCapacity: 'light',
    armorThreshold: 5,
    armorRating: 8,
    armorDurability: 110,
    shieldBonus: 65,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Reinforced, crystal lattice, beam stabilizers (Physical / Layered).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#1e1b4b',
      trimColor: '#38bdf8',
      reactorGlowColor: '#00f0ff',
      chassisWidth: 9,
      chassisHeight: 11,
      shoulderStyle: 'prism',
    },
  },
  {
    id: 'coreplate_sanctum_support',
    name: 'Sanctum Support Coreplate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Physical / Reactive',
    armorType: 'Reactive',
    baseLoadCapacity: 'medium',
    armorThreshold: 6,
    armorRating: 10,
    armorDurability: 130,
    shieldBonus: 60,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Balanced, distributed buffer systems (Physical / Reactive).',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#f8fafc',
      trimColor: '#f59e0b',
      reactorGlowColor: '#10b981',
      chassisWidth: 9,
      chassisHeight: 11,
      shoulderStyle: 'winged',
    },
  },
  {
    id: 'hw_plating_ablative',
    name: 'Ablative Cuirass Plating',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Ablative Armor',
    armorType: 'Ablative',
    baseLoadCapacity: 'light',
    armorThreshold: 5,
    armorRating: 8,
    armorDurability: 115,
    shieldBonus: 40,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'High-durability sacrificial ceramic plates with balanced threshold and rating.',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#1e293b',
      trimColor: '#64748b',
      reactorGlowColor: '#94a3b8',
      chassisWidth: 9,
      chassisHeight: 10,
      shoulderStyle: 'sleek',
    },
  },
  {
    id: 'hw_plating_reactive',
    name: 'Reactive Blast-Plate Cuirass',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Reactive Armor',
    armorType: 'Reactive',
    baseLoadCapacity: 'medium',
    armorThreshold: 7,
    armorRating: 11,
    armorDurability: 140,
    shieldBonus: 45,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Explosive counter-charge torso armor that repels close-quarters attackers on burst.',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#334155',
      trimColor: '#f97316',
      reactorGlowColor: '#ea580c',
      chassisWidth: 10,
      chassisHeight: 11,
      shoulderStyle: 'angular',
    },
  },
  {
    id: 'hw_plating_hardened',
    name: 'Hardened Sanctum Carapace',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Hardened Armor',
    armorType: 'Hardened',
    baseLoadCapacity: 'heavy',
    armorThreshold: 9,
    armorRating: 14,
    armorDurability: 165,
    shieldBonus: 40,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Dense cathedral-forged alloy cuirass with high damage threshold against light fire.',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#475569',
      trimColor: '#eab308',
      reactorGlowColor: '#fbbf24',
      chassisWidth: 11,
      chassisHeight: 12,
      shoulderStyle: 'heavy',
    },
  },
  {
    id: 'hw_plating_layered',
    name: 'Layered Weave Laminate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Layered Armor',
    armorType: 'Layered',
    baseLoadCapacity: 'medium',
    armorThreshold: 6,
    armorRating: 10,
    armorDurability: 130,
    shieldBonus: 55,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Flexible composite weave plating favored by agile frames for rapid heat dissipation.',
    isPlaceholderAsset: false,
    spriteTheme: {
      baseArmorColor: '#0f172a',
      trimColor: '#38bdf8',
      reactorGlowColor: '#38bdf8',
      chassisWidth: 10,
      chassisHeight: 11,
      shoulderStyle: 'layered',
    },
  },
];

export function getCoreplateDefinition(idOrName?: string | null): CoreplateDefinition | undefined {
  if (!idOrName) return undefined;
  return (
    CANONICAL_COREPLATES.find((p) => p.id === idOrName) ||
    CANONICAL_COREPLATES.find((p) => p.name.toLowerCase() === idOrName.toLowerCase()) ||
    CANONICAL_COREPLATES.find((p) => idOrName.toLowerCase().includes(p.id.replace('coreplate_', '')))
  );
}
