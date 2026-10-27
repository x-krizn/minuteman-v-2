/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      helmColor: '#334155',
      visorColor: '#f97316',
      crestColor: '#38bdf8',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      helmColor: '#374151',
      visorColor: '#ef4444',
      crestColor: '#f59e0b',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      helmColor: '#e2e8f0',
      visorColor: '#38bdf8',
      crestColor: '#eab308',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      helmColor: '#090d16',
      visorColor: '#a855f7',
      crestColor: '#c084fc',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      helmColor: '#1e1b4b',
      visorColor: '#00f0ff',
      crestColor: '#38bdf8',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      helmColor: '#f8fafc',
      visorColor: '#10b981',
      crestColor: '#f59e0b',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      helmColor: '#475569',
      visorColor: '#38bdf8',
      crestColor: '#f97316',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      helmColor: '#1f2937',
      visorColor: '#f59e0b',
      crestColor: '#ef4444',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      helmColor: '#cbd5e1',
      visorColor: '#eab308',
      crestColor: '#38bdf8',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      helmColor: '#18181b',
      visorColor: '#e879f9',
      crestColor: '#a855f7',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      helmColor: '#312e81',
      visorColor: '#67e8f9',
      crestColor: '#22d3ee',
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
    partSprite: { frameCount: 4, cellWidth: 16, cellHeight: 16 },
    spriteTheme: {
      helmColor: '#e2e8f0',
      visorColor: '#34d399',
      crestColor: '#10b981',
      crestStyle: 'providence',
    },
    linkedActionId: 'mod_head_optic_scan',
    description: 'Ally status monitoring, priority threat identification (Set 12).',
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

