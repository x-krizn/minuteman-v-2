/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CanonicalHardwareItemDefinition } from '../chassis_hardware';

export const CANONICAL_ARMS: CanonicalHardwareItemDefinition[] = [
  // ─── SET 0: BWI Twinstrike Gauntlets ──────────────────────────────────────
  {
    id: 'arms_bwi_twinstrike',
    name: 'BWI Twinstrike Gauntlets',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Recoil Dampeners & Sustained Fire',
    setIndex: 0,
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      armColor: '#475569',
      cuffColor: '#38bdf8',
      shoulderColor: '#334155',
      shoulderStyle: 'angular',
      armWidth: 3,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Recoil dampeners, reinforced shoulder & arm joints for sustained fire (Set 01).',
    isPlaceholderAsset: false,
  },
  // ─── SET 1: Fire & Ice Line Holder ────────────────────────────────────────
  {
    id: 'arms_fire_ice_line_holder',
    name: 'Fire & Ice Line Holder',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Shock-Channeling & Recoil Bracing',
    setIndex: 1,
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      armColor: '#374151',
      cuffColor: '#f97316',
      shoulderColor: '#1f2937',
      shoulderStyle: 'heavy',
      armWidth: 3,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Shock-channeling shoulder bulwarks and reinforced recoil bracing (Set 02).',
    isPlaceholderAsset: false,
  },
  // ─── SET 2: Solbright Cleaver Assemblies ──────────────────────────────────
  {
    id: 'arms_solbright_cleaver',
    name: 'Solbright Cleaver Assemblies',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Reactor-Linked Sword-Spear Channels',
    setIndex: 2,
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      armColor: '#e2e8f0',
      cuffColor: '#eab308',
      shoulderColor: '#cbd5e1',
      shoulderStyle: 'layered',
      armWidth: 3,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Layered golden pauldrons and reactor-linked sword-spear channels (Set 03).',
    isPlaceholderAsset: false,
  },
  // ─── SET 3: Shadowcraft Silencer Gauntlets ────────────────────────────────
  {
    id: 'arms_shadowcraft_silencer',
    name: 'Shadowcraft Silencer Gauntlets',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Recoil Suppression & Vibration Dampening',
    setIndex: 3,
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      armColor: '#18181b',
      cuffColor: '#a855f7',
      shoulderColor: '#0f172a',
      shoulderStyle: 'sleek',
      armWidth: 2,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Low-profile stealth shoulders, recoil suppression, vibration dampening (Set 04).',
    isPlaceholderAsset: false,
  },
  // ─── SET 4: Arcanum Channeler Assemblies ──────────────────────────────────
  {
    id: 'arms_arcanum_channeler',
    name: 'Arcanum Channeler Assemblies',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Energy Conduits & Beam Focusing',
    setIndex: 4,
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      armColor: '#312e81',
      cuffColor: '#00f0ff',
      shoulderColor: '#1e1b4b',
      shoulderStyle: 'prism',
      armWidth: 3,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Floating prism shoulder pylons, energy conduits, beam focusing arrays (Set 05).',
    isPlaceholderAsset: false,
  },
  // ─── SET 5: Sanctum Benediction Assemblies ────────────────────────────────
  {
    id: 'arms_sanctum_benediction',
    name: 'Sanctum Benediction Assemblies',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Hybrid Integration & Buff Emitters',
    setIndex: 5,
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      armColor: '#f8fafc',
      cuffColor: '#10b981',
      shoulderColor: '#e2e8f0',
      shoulderStyle: 'winged',
      armWidth: 3,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Winged shoulder cowls, hybrid weapon integration, ally buff emitters (Set 06).',
    isPlaceholderAsset: false,
  },
  // ─── SET 6: Crystal Dynamics Striker Vambraces ────────────────────────────
  {
    id: 'arms_cd_striker_vambraces',
    name: 'Crystal Dynamics Striker Vambraces',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Alchemic Servo-Actuators',
    setIndex: 6,
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      armColor: '#334155',
      cuffColor: '#f97316',
      shoulderColor: '#475569',
      shoulderStyle: 'angular',
      armWidth: 3,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'High-torque alchemic shoulder & forearm actuators for rapid CQC chains (Set 07).',
    isPlaceholderAsset: false,
  },
  // ─── SET 7: BE Siegebreaker Pauldrons ─────────────────────────────────────
  {
    id: 'arms_be_siegebreaker_pauldrons',
    name: 'BE Siegebreaker Pauldrons',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Heavy Ballistic Stabilizers',
    setIndex: 7,
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      armColor: '#1f2937',
      cuffColor: '#eab308',
      shoulderColor: '#374151',
      shoulderStyle: 'heavy',
      armWidth: 3,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Oversized blast-shielded shoulder pauldrons and rotary weapon stabilizers (Set 08).',
    isPlaceholderAsset: false,
  },
  // ─── SET 8: Aegis Radiant Vambraces ───────────────────────────────────────
  {
    id: 'arms_aegis_radiant_vambraces',
    name: 'Aegis Radiant Vambraces',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Hard-Light Shield Couplings',
    setIndex: 8,
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      armColor: '#cbd5e1',
      cuffColor: '#38bdf8',
      shoulderColor: '#f8fafc',
      shoulderStyle: 'layered',
      armWidth: 3,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Mana-braided shoulder plates and hard-light buckler projection couplings (Set 09).',
    isPlaceholderAsset: false,
  },
  // ─── SET 9: VX Whisperblade Gauntlets ─────────────────────────────────────
  {
    id: 'arms_vx_whisperblade_gauntlets',
    name: 'VX Whisperblade Gauntlets',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Stealth CQC & Micro-Gyros',
    setIndex: 9,
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      armColor: '#090d16',
      cuffColor: '#e879f9',
      shoulderColor: '#1e293b',
      shoulderStyle: 'sleek',
      armWidth: 2,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Acoustic-damped shoulder fins and precision wrist gyros for surgical strikes (Set 10).',
    isPlaceholderAsset: false,
  },
  // ─── SET 10: ARC Prism Refractors ─────────────────────────────────────────
  {
    id: 'arms_arc_prism_refractors',
    name: 'ARC Prism Refractors',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Wave & Beam Focusing Pylons',
    setIndex: 10,
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      armColor: '#1e1b4b',
      cuffColor: '#38bdf8',
      shoulderColor: '#312e81',
      shoulderStyle: 'prism',
      armWidth: 3,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Crystalline shoulder refractors that collimate high-output beam salvos (Set 11).',
    isPlaceholderAsset: false,
  },
  // ─── SET 11: SANC Seraphic Pinions ────────────────────────────────────────
  {
    id: 'arms_sanc_seraphic_pinions',
    name: 'SANC Seraphic Pinions',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Triage & Barrier Projectors',
    setIndex: 11,
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      armColor: '#e2e8f0',
      cuffColor: '#f59e0b',
      shoulderColor: '#f8fafc',
      shoulderStyle: 'winged',
      armWidth: 3,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Seraphic shoulder pinions that broadcast restorative barrier harmonics (Set 12).',
    isPlaceholderAsset: false,
  },
];

// Auto-discover any standalone Shoulders/Arms (.ts) modules dropped into database/equipment/arms/
const armModules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });
const seenArmIds = new Set<string>(CANONICAL_ARMS.map((a) => a.id));

function isArmsDefinition(val: unknown): val is CanonicalHardwareItemDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'slot' in val &&
    (val as { slot?: unknown }).slot === 'arms'
  );
}

for (const [path, mod] of Object.entries(armModules)) {
  if (path === './index.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isArmsDefinition(exportedValue) && !seenArmIds.has(exportedValue.id)) {
      CANONICAL_ARMS.push(exportedValue);
      seenArmIds.add(exportedValue.id);
    }
  }
}

