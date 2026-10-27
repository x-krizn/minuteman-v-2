/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { armor_sheets, set_camelot_knight } from '../armor_sheets';
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
    setId: 'set_01_bastion',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 1,
      atlasSetRow: 1,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#962d2d',
      cuffColor: '#fa4b4b',
      shoulderColor: '#641e1e',
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
    setId: 'set_02_fortress',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 1,
      atlasSetRow: 0,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#999999',
      cuffColor: '#ffffff',
      shoulderColor: '#666666',
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
    setId: 'set_03_dawnforge',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 1,
      atlasSetRow: 2,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#965a1e',
      cuffColor: '#fa9e32',
      shoulderColor: '#643814',
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
    setId: 'set_04_shadowcraft',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 1,
      atlasSetRow: 3,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#968f26',
      cuffColor: '#faef3f',
      shoulderColor: '#645f19',
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
    setId: 'set_05_arcanum',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 1,
      atlasSetRow: 4,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#1e871e',
      cuffColor: '#32e132',
      shoulderColor: '#145a14',
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
    setId: 'set_06_sanctum',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 1,
      atlasSetRow: 5,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#4b5478',
      cuffColor: '#7d8cc8',
      shoulderColor: '#323850',
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
    setId: 'set_07_blastplate',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 1,
      atlasSetRow: 6,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#5a3596',
      cuffColor: '#9659fa',
      shoulderColor: '#3c2364',
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
    setId: 'set_08_siegebreaker',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 1,
      atlasSetRow: 7,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#872d5a',
      cuffColor: '#e14b96',
      shoulderColor: '#5a1e3c',
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
    setId: 'set_09_radiant',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 1,
      atlasSetRow: 8,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#69694b',
      cuffColor: '#afaf7d',
      shoulderColor: '#464632',
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
    setId: 'set_10_whisperblade',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 1,
      atlasSetRow: 9,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#52705a',
      cuffColor: '#89bc96',
      shoulderColor: '#374b3c',
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
    setId: 'set_11_conduit',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 1,
      atlasSetRow: 10,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#87704b',
      cuffColor: '#e1bc7d',
      shoulderColor: '#5a4b32',
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
    setId: 'set_12_reliquary',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 1,
      atlasSetRow: 11,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#323232',
      cuffColor: '#646464',
      shoulderColor: '#1e1e1e',
      shoulderStyle: 'winged',
      armWidth: 3,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Seraphic shoulder pinions that broadcast restorative barrier harmonics (Set 12).',
    isPlaceholderAsset: false,
  },
  // ─── CAMELOT KNIGHT SET: Camelot Knight Gauntlets ─────────────────────────
  {
    id: 'arms_camelot_knight',
    name: 'Camelot Knight Gauntlets',
    legacyNames: ['Camelot Knight Arms', 'Camelot Knight Pauldrons'],
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Chivalric Pauldrons & Lance Bracing',
    setIndex: 12,
    setId: 'set_camelot_knight',
    partSprite: {
      base64: set_camelot_knight,
      atlasColumn: 1,
      atlasSetRow: 0,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      armColor: '#999999',
      cuffColor: '#ffffff',
      shoulderColor: '#666666',
      shoulderStyle: 'layered',
      armWidth: 3,
    },
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Articulated silver-steel knightly pauldrons and heavy lance-bracing gauntlets (Camelot Knight Set).',
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

