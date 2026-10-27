/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { armor_sheets, set_camelot_knight } from '../armor_sheets';
import { CanonicalHardwareItemDefinition } from '../chassis_hardware';

export const CANONICAL_HEAD_OPTICS: CanonicalHardwareItemDefinition[] = [
  // ─── SET 0: Crystal Dynamics G341 Murmillio ───────────────────────────────
  {
    id: 'head_cd_g341_murmillio',
    name: 'Crystal Dynamics G341 Murmillio',
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Head Helm · Alchemic Optic Core',
    setIndex: 0,
    setId: 'set_01_bastion',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 2,
      atlasSetRow: 1,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#962d2d',
      visorColor: '#000000',
      crestColor: '#fa4b4b',
      crestStyle: 'murmillio',
    },
    linkedActionId: 'mod_head_optic_scan',
    description: 'Reinforced helm, alchemic optic core, heat-dispersing vents (Set 01).',
    isPlaceholderAsset: false,
  },
  // ─── SET 1: BE Ironveil Command Dome ──────────────────────────────────────
  {
    id: 'head_be_ironveil_dome',
    name: 'BE Ironveil Command Dome',
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Command Dome · Interference Dampener',
    setIndex: 1,
    setId: 'set_02_fortress',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 2,
      atlasSetRow: 0,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#999999',
      visorColor: '#000000',
      crestColor: '#ffffff',
      crestStyle: 'ironveil',
    },
    shieldBonus: 8,
    linkedActionId: 'mod_head_optic_scan',
    description: 'Layered shielding, interference dampeners (Set 02).',
    isPlaceholderAsset: false,
  },
  // ─── SET 2: Aegis Halo Command Dome ───────────────────────────────────────
  {
    id: 'head_aegis_halo_dome',
    name: 'Aegis Halo Command Dome',
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Command Dome · Shield Uplink',
    setIndex: 2,
    setId: 'set_03_dawnforge',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 2,
      atlasSetRow: 2,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#965a1e',
      visorColor: '#000000',
      crestColor: '#fa9e32',
      crestStyle: 'aegis',
    },
    shieldBonus: 12,
    linkedActionId: 'mod_head_optic_scan',
    description: 'Mana-channeling conduits, tactical shield uplink (Set 03).',
    isPlaceholderAsset: false,
  },
  // ─── SET 3: VX Veilsight Command Helm ─────────────────────────────────────
  {
    id: 'head_vx_veilsight_helm',
    name: 'VX Veilsight Command Helm',
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Command Helm · Low-Light & Thermal',
    setIndex: 3,
    setId: 'set_04_shadowcraft',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 2,
      atlasSetRow: 3,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#968f26',
      visorColor: '#000000',
      crestColor: '#faef3f',
      crestStyle: 'veilsight',
    },
    linkedActionId: 'mod_head_optic_scan',
    description: 'Low-light optics, thermal dampening (Set 04).',
    isPlaceholderAsset: false,
  },
  // ─── SET 4: ARC Omniscient Command Dome ───────────────────────────────────
  {
    id: 'head_arc_omniscient_dome',
    name: 'ARC Omniscient Command Dome',
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Command Dome · Artillery & Signature Optics',
    setIndex: 4,
    setId: 'set_05_arcanum',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 2,
      atlasSetRow: 4,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#1e871e',
      visorColor: '#000000',
      crestColor: '#32e132',
      crestStyle: 'omniscient',
    },
    linkedActionId: 'mod_head_optic_scan',
    description: 'Crystal lattice, long-range energy signature tracking (Set 05).',
    isPlaceholderAsset: false,
  },
  // ─── SET 5: SANC Providence Command Helm ──────────────────────────────────
  {
    id: 'head_sanc_providence_helm',
    name: 'SANC Providence Command Helm',
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Command Helm · Triage & Threat HUD',
    setIndex: 5,
    setId: 'set_06_sanctum',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 2,
      atlasSetRow: 5,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#4b5478',
      visorColor: '#000000',
      crestColor: '#7d8cc8',
      crestStyle: 'providence',
    },
    linkedActionId: 'mod_head_optic_scan',
    description: 'Ally status HUD, priority threat assessment (Set 06).',
    isPlaceholderAsset: false,
  },
  // ─── SET 6: Crystal Dynamics EmberSight Suite ─────────────────────────────
  {
    id: 'optics_embersight',
    name: 'Crystal Dynamics EmberSight Suite',
    slot: 'head',
    canonicalSlotLabel: 'Optics',
    subtype: 'Optics · Fast Acquisition',
    setIndex: 6,
    setId: 'set_07_blastplate',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 2,
      atlasSetRow: 6,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#5a3596',
      visorColor: '#000000',
      crestColor: '#9659fa',
      crestStyle: 'murmillio',
    },
    linkedActionId: 'mod_head_optic_scan',
    description: 'Mid-short range targeting, fast acquisition (Set 07).',
    isPlaceholderAsset: false,
  },
  // ─── SET 7: BE Foresight Targeting Array ──────────────────────────────────
  {
    id: 'optics_be_foresight',
    name: 'BE Foresight Targeting Array',
    slot: 'head',
    canonicalSlotLabel: 'Optics',
    subtype: 'Optics · Artillery & Missile Tracking',
    setIndex: 7,
    setId: 'set_08_siegebreaker',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 2,
      atlasSetRow: 7,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#872d5a',
      visorColor: '#000000',
      crestColor: '#e14b96',
      crestStyle: 'ironveil',
    },
    linkedActionId: 'mod_head_optic_scan',
    description: 'Long-range, missile tracking (Artillery optics · Set 08).',
    isPlaceholderAsset: false,
  },
  // ─── SET 8: Aegis Radiant Targeting Array ─────────────────────────────────
  {
    id: 'optics_aegis_radiant',
    name: 'Aegis Radiant Targeting Array',
    slot: 'head',
    canonicalSlotLabel: 'Optics',
    subtype: 'Optics · Shield & Cleave Precision',
    setIndex: 8,
    setId: 'set_09_radiant',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 2,
      atlasSetRow: 8,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#69694b',
      visorColor: '#000000',
      crestColor: '#afaf7d',
      crestStyle: 'aegis',
    },
    linkedActionId: 'mod_head_optic_scan',
    description: 'Shield projection and cleave precision (Set 09).',
    isPlaceholderAsset: false,
  },
  // ─── SET 9: Veilsight Targeting Suite ─────────────────────────────────────
  {
    id: 'optics_veilsight',
    name: 'Veilsight Targeting Suite',
    slot: 'head',
    canonicalSlotLabel: 'Optics',
    subtype: 'Optics · Critical Point Identification',
    setIndex: 9,
    setId: 'set_10_whisperblade',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 2,
      atlasSetRow: 9,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#52705a',
      visorColor: '#000000',
      crestColor: '#89bc96',
      crestStyle: 'veilsight',
    },
    linkedActionId: 'mod_head_optic_scan',
    description: 'Low-light optics, thermal masking, critical point identification (Set 10).',
    isPlaceholderAsset: false,
  },
  // ─── SET 10: ARC Omniscient Array ─────────────────────────────────────────
  {
    id: 'optics_arc_omniscient',
    name: 'ARC Omniscient Array',
    slot: 'head',
    canonicalSlotLabel: 'Optics',
    subtype: 'Optics · Artillery & Beam Focusing',
    setIndex: 10,
    setId: 'set_11_conduit',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 2,
      atlasSetRow: 10,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#87704b',
      visorColor: '#000000',
      crestColor: '#e1bc7d',
      crestStyle: 'omniscient',
    },
    linkedActionId: 'mod_head_optic_scan',
    description: 'Long-range, energy signature tracking, beam focusing (Artillery optics · Set 11).',
    isPlaceholderAsset: false,
  },
  // ─── SET 11: SANC Providence Scanner ──────────────────────────────────────
  {
    id: 'optics_sanc_providence',
    name: 'SANC Providence Scanner',
    slot: 'head',
    canonicalSlotLabel: 'Optics',
    subtype: 'Optics · Priority Threat Identification',
    setIndex: 11,
    setId: 'set_12_reliquary',
    partSprite: {
      base64: armor_sheets,
      atlasColumn: 2,
      atlasSetRow: 11,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#323232',
      visorColor: '#000000',
      crestColor: '#646464',
      crestStyle: 'providence',
    },
    linkedActionId: 'mod_head_optic_scan',
    description: 'Ally status monitoring, priority threat identification (Set 12).',
    isPlaceholderAsset: false,
  },
  // ─── CAMELOT KNIGHT SET: Camelot Knight Greathelm ─────────────────────────
  {
    id: 'head_camelot_knight',
    name: 'Camelot Knight Greathelm',
    legacyNames: ['Camelot Knight Helm', 'Camelot Knight Head'],
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Command Helm · Chivalric Visor Array',
    setIndex: 12,
    setId: 'set_camelot_knight',
    partSprite: {
      base64: set_camelot_knight,
      atlasColumn: 2,
      atlasSetRow: 0,
      frameCount: 4,
      directionalRows: 4,
      cellWidth: 16,
      cellHeight: 16,
    },
    spriteTheme: {
      helmColor: '#999999',
      visorColor: '#000000',
      crestColor: '#ffffff',
      crestStyle: 'aegis',
    },
    shieldBonus: 10,
    linkedActionId: 'mod_head_optic_scan',
    description: 'Visored silver-steel knightly greathelm with precision duel-targeting optics (Camelot Knight Set).',
    isPlaceholderAsset: false,
  },
];

// Auto-discover any standalone Head/Optics (.ts) modules dropped into database/equipment/head/
const headModules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });
const seenHeadIds = new Set<string>(CANONICAL_HEAD_OPTICS.map((h) => h.id));

function isHeadDefinition(val: unknown): val is CanonicalHardwareItemDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'slot' in val &&
    (val as { slot?: unknown }).slot === 'head'
  );
}

for (const [path, mod] of Object.entries(headModules)) {
  if (path === './index.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isHeadDefinition(exportedValue) && !seenHeadIds.has(exportedValue.id)) {
      CANONICAL_HEAD_OPTICS.push(exportedValue);
      seenHeadIds.add(exportedValue.id);
    }
  }
}

