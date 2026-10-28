/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FrameLoadCapacity, OrionState } from '../../types';
import { TRAIT_REGISTRY } from '../characters';
import { CANONICAL_ARMS } from './arms';
import { CANONICAL_AUXILIARIES } from './auxiliaries';
import { CANONICAL_HEAD_OPTICS } from './head';
import { CANONICAL_LEGS } from './legs';
import { CANONICAL_FRAME_PLATING } from './plating';
import { CANONICAL_REACTORS } from './reactors';
import { CANONICAL_SENSORY_ARRAYS } from './sensory';

export interface MechPartSpriteStripConfig {
  /** Optional Base64 PNG sprite sheet or strip (64x16 strip, 64x64 4-dir part sheet, or 192x768 master armor sheet) */
  base64?: string;
  /** Number of animation frames per row in the strip (defaults to 4) */
  frameCount?: number;
  /** Number of directional rows in the part block (1 for 64x16 strip, 4 for 64x64 4-dir sheet: 0=E, 1=W, 2=S, 3=N) */
  directionalRows?: number;
  /** Optional column index in a 3-column master armor sheet (0 = Frame Plating, 1 = Arms, 2 = Head) */
  atlasColumn?: 0 | 1 | 2;
  /** Optional set row index (0..11) in a master armor sheet (each set band is 64px tall) */
  atlasSetRow?: number;
  /** Width of each frame cell in pixels (defaults to 16) */
  cellWidth?: number;
  /** Height of each frame cell in pixels (defaults to 16) */
  cellHeight?: number;
}

export interface CanonicalHardwareItemDefinition {
  id: string;
  name: string;
  /** Optional legacy item names for backward-compatible save & loadout resolution */
  legacyNames?: string[];
  slot:
    | 'head'
    | 'arms'
    | 'plating'
    | 'legs'
    | 'reactor'
    | 'sensoryA'
    | 'sensoryB'
    | 'aux3'
    | 'aux4';
  canonicalSlotLabel: string;
  subtype: string;
  /** Optional visual set index (0..11 for the 12 baseline sets; omit for standalone pieces without a full set) */
  setIndex?: number;
  /** Optional set identifier for grouping matching pieces (omit for standalone pieces) */
  setId?: string;
  /** 4-frame (64x16px, 16x16px per frame) aligned sprite strip configuration for head, arms, or frame plating */
  partSprite?: MechPartSpriteStripConfig;
  /** Procedural/fallback palette and geometry theme for the 4-frame 16x16 part strip */
  spriteTheme?: Record<string, any>;
  armorType?: 'Ablative' | 'Reactive' | 'Hardened' | 'Layered';
  baseLoadCapacity?: FrameLoadCapacity;
  armorThreshold?: number;
  armorRating?: number;
  armorDurability?: number;
  shieldBonus?: number;
  reactorFamily?: 'Ichor' | 'Mana' | 'Ether';
  linkedActionId: string;
  description: string;
  /** Whether the hardware currently uses a generic or placeholder icon/visual asset */
  isPlaceholderAsset?: boolean;
  /** Detailed note on planned future dedicated sprite or 3D asset */
  futureAssetPlanned?: string;
}

/**
 * Unified Hardware Catalog aggregated from dedicated slot modules:
 * - Frame Plating (`./plating`)
 * - Reactors & Energy Storage (`./reactors`)
 * - Head Helms & Optics (`./head`)
 * - Sensory A & B Arrays (`./sensory`)
 * - Arms & Shoulder Actuators (`./arms`)
 * - Legs & Striders (`./legs`)
 * - Aux 3 & Aux 4 Tactical Systems (`./auxiliaries`)
 */
export const CANONICAL_HARDWARE_CATALOG: CanonicalHardwareItemDefinition[] = [
  ...CANONICAL_FRAME_PLATING,
  ...CANONICAL_REACTORS,
  ...CANONICAL_HEAD_OPTICS,
  ...CANONICAL_SENSORY_ARRAYS,
  ...CANONICAL_ARMS,
  ...CANONICAL_LEGS,
  ...CANONICAL_AUXILIARIES,
];

export { CANONICAL_FRAME_PLATING };

export type ChassisHardwareItemDefinition = CanonicalHardwareItemDefinition;
export const CHASSIS_HARDWARE_CATALOG: ChassisHardwareItemDefinition[] = CANONICAL_HARDWARE_CATALOG;

export function findHardwareItemByNameOrId(
  nameOrId: string | undefined | null
): CanonicalHardwareItemDefinition | undefined {
  if (!nameOrId) return undefined;
  const norm = nameOrId.trim().toLowerCase();
  return CANONICAL_HARDWARE_CATALOG.find(
    (item) =>
      item.id.toLowerCase() === norm ||
      item.name.toLowerCase() === norm ||
      item.legacyNames?.some((legacy) => legacy.toLowerCase() === norm)
  );
}

/**
 * Resolves the pilot's active Frame Plating, Reactor, and Aux 3/4 stats dynamically from equipped hardware.
 * In classless Project Orion, swapping Frame Plating or a Reactor immediately updates Armor Type,
 * Base Load Capacity, Shield/Armor baseline, and Reactor Family.
 */
export function resolveEquippedHardwareStats(state: OrionState): {
  baseLoadCapacity: FrameLoadCapacity;
  armorType: 'Ablative' | 'Reactive' | 'Hardened' | 'Layered';
  armorThreshold: number;
  armorRating: number;
  baseArmorDurability: number;
  baseShieldCapacity: number;
  hardwareShieldBonus: number;
  hardwareArmorBonus: number;
  reactorFamily: 'Ichor' | 'Mana' | 'Ether';
} {
  const fallbackProfile = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;

  const equippedTorsoItem = findHardwareItemByNameOrId(state.equipmentSlots?.plating);
  const equippedReactorItem = findHardwareItemByNameOrId(state.equipmentSlots?.reactorCore);
  const equippedAux3Item = findHardwareItemByNameOrId(state.equipmentSlots?.aux3);
  const equippedAux4Item = findHardwareItemByNameOrId(state.equipmentSlots?.aux4);
  const equippedHeadItem = findHardwareItemByNameOrId(state.equipmentSlots?.head);

  const baseLoadCapacity: FrameLoadCapacity =
    equippedTorsoItem?.baseLoadCapacity ||
    (fallbackProfile.weightClass as FrameLoadCapacity) ||
    'medium';

  const armorType: 'Ablative' | 'Reactive' | 'Hardened' | 'Layered' =
    equippedTorsoItem?.armorType || fallbackProfile.baseArmor?.type || 'Reactive';

  const armorThreshold =
    equippedTorsoItem?.armorThreshold ?? fallbackProfile.baseArmor?.threshold ?? 6;

  const armorRating =
    equippedTorsoItem?.armorRating ?? fallbackProfile.baseArmor?.rating ?? 10;

  const baseArmorDurability =
    equippedTorsoItem?.armorDurability ?? fallbackProfile.baseArmor?.durability ?? 130;

  const baseShieldCapacity =
    equippedTorsoItem?.shieldBonus ?? fallbackProfile.baseShield?.capacity ?? 50;

  let hardwareShieldBonus = 0;
  let hardwareArmorBonus = 0;

  for (const aux of [equippedAux3Item, equippedAux4Item, equippedHeadItem]) {
    if (aux?.shieldBonus) hardwareShieldBonus += aux.shieldBonus;
    if (aux?.armorDurability) hardwareArmorBonus += aux.armorDurability;
  }

  const reactorFamily: 'Ichor' | 'Mana' | 'Ether' =
    equippedReactorItem?.reactorFamily || state.reactor || fallbackProfile.reactor || 'Ichor';

  return {
    baseLoadCapacity,
    armorType,
    armorThreshold,
    armorRating,
    baseArmorDurability,
    baseShieldCapacity,
    hardwareShieldBonus,
    hardwareArmorBonus,
    reactorFamily,
  };
}
