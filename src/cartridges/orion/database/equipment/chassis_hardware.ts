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
import { CANONICAL_COREPLATES } from './plating';
import { CANONICAL_REACTORS } from './reactors';
import { CANONICAL_SENSORY_ARRAYS } from './sensory';

export interface CanonicalHardwareItemDefinition {
  id: string;
  name: string;
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
 * - Coreplates & Cuirasses (`./plating`)
 * - Reactors & Energy Storage (`./reactors`)
 * - Head Helms & Optics (`./head`)
 * - Sensory A & B Arrays (`./sensory`)
 * - Arms & Actuators (`./arms`)
 * - Legs & Striders (`./legs`)
 * - Aux 3 & Aux 4 Tactical Systems (`./auxiliaries`)
 */
export const CANONICAL_HARDWARE_CATALOG: CanonicalHardwareItemDefinition[] = [
  ...CANONICAL_COREPLATES,
  ...CANONICAL_REACTORS,
  ...CANONICAL_HEAD_OPTICS,
  ...CANONICAL_SENSORY_ARRAYS,
  ...CANONICAL_ARMS,
  ...CANONICAL_LEGS,
  ...CANONICAL_AUXILIARIES,
];

export type ChassisHardwareItemDefinition = CanonicalHardwareItemDefinition;
export const CHASSIS_HARDWARE_CATALOG: ChassisHardwareItemDefinition[] = CANONICAL_HARDWARE_CATALOG;

export function findHardwareItemByNameOrId(
  nameOrId: string | undefined | null
): CanonicalHardwareItemDefinition | undefined {
  if (!nameOrId) return undefined;
  const norm = nameOrId.trim().toLowerCase();
  return CANONICAL_HARDWARE_CATALOG.find(
    (item) => item.id.toLowerCase() === norm || item.name.toLowerCase() === norm
  );
}

/**
 * Resolves the pilot's active Coreplate, Reactor, and Aux 3/4 stats dynamically from equipped hardware.
 * In classless Project Orion, swapping a Coreplate or Reactor immediately updates Armor Type,
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
