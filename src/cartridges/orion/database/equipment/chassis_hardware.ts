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
import {
  buildEquipmentInstanceId,
  formatModifiedEquipmentName,
  parseEquipmentInstanceId,
} from './mod_naming';
import { CANONICAL_FRAME_PLATING } from './plating';
import { CANONICAL_REACTORS } from './reactors';
import { CANONICAL_SENSORY_ARRAYS } from './sensory';
import { getWeaponDefinition } from './weapons';

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
  /** Passive Light stat bonus in tiles granted by this hardware component (e.g. Head Optics, Sensory Array) */
  lightBonus?: number;
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

const MODIFIED_HARDWARE_CACHE: Record<string, CanonicalHardwareItemDefinition> = {};

/**
 * Finds a canonical hardware item by its ID, display name, or Gem-modified composite instance ID
 * (`<baseId>::<gem1>+<gem2>`).
 */
export function findHardwareItemByNameOrId(
  nameOrId: string | undefined | null
): CanonicalHardwareItemDefinition | undefined {
  if (!nameOrId) return undefined;
  if (MODIFIED_HARDWARE_CACHE[nameOrId]) {
    return MODIFIED_HARDWARE_CACHE[nameOrId];
  }

  const { baseId, installedGems } = parseEquipmentInstanceId(nameOrId);
  const norm = baseId.trim().toLowerCase();
  const baseItem = CANONICAL_HARDWARE_CATALOG.find(
    (item) =>
      item.id.toLowerCase() === norm ||
      item.name.toLowerCase() === norm ||
      item.legacyNames?.some((legacy) => legacy.toLowerCase() === norm)
  );
  if (!baseItem) return undefined;
  if (installedGems.length === 0) return baseItem;

  let extraShield = 0;
  let extraArmorDurability = 0;
  let extraArmorRating = 0;
  let extraArmorThreshold = 0;
  let extraLight = 0;

  for (const gem of installedGems) {
    switch (gem) {
      case 'titanite':
        extraShield += 12;
        extraArmorRating += 1;
        break;
      case 'moonstone':
        extraShield += 10;
        break;
      case 'hematite':
        extraArmorDurability += 18;
        break;
      case 'carnelian':
        extraArmorDurability += 15;
        extraArmorThreshold += 1;
        break;
      case 'spinel':
        extraShield += 8;
        extraArmorDurability += 8;
        break;
      case 'demantoid':
        extraShield += 8;
        extraArmorDurability += 10;
        break;
      case 'kyanite':
      case 'charoite':
        extraLight += 0.5;
        extraShield += 6;
        break;
      case 'rubellite':
        extraShield += 10;
        extraArmorDurability += 10;
        break;
    }
  }

  const canonicalCompositeId = buildEquipmentInstanceId(baseItem.id, installedGems);
  const derived: CanonicalHardwareItemDefinition = {
    ...baseItem,
    id: canonicalCompositeId,
    name: formatModifiedEquipmentName(baseItem.name, installedGems),
    shieldBonus:
      (baseItem.shieldBonus || 0) + extraShield > 0
        ? (baseItem.shieldBonus || 0) + extraShield
        : baseItem.shieldBonus,
    armorDurability:
      (baseItem.armorDurability || 0) + extraArmorDurability > 0
        ? (baseItem.armorDurability || 0) + extraArmorDurability
        : baseItem.armorDurability,
    armorRating:
      typeof baseItem.armorRating === 'number'
        ? baseItem.armorRating + extraArmorRating
        : baseItem.armorRating,
    armorThreshold:
      typeof baseItem.armorThreshold === 'number'
        ? baseItem.armorThreshold + extraArmorThreshold
        : baseItem.armorThreshold,
    lightBonus:
      (baseItem.lightBonus || 0) + extraLight > 0
        ? Number(((baseItem.lightBonus || 0) + extraLight).toFixed(2))
        : baseItem.lightBonus,
  };
  MODIFIED_HARDWARE_CACHE[nameOrId] = derived;
  MODIFIED_HARDWARE_CACHE[canonicalCompositeId] = derived;
  return derived;
}

/**
 * Resolves the pilot's active Frame Plating, Reactor, Hardware, and Auxiliary stats dynamically from equipped gear.
 * In classless Project Orion, swapping Frame Plating, a Reactor, or an Auxiliary immediately updates Armor Type,
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
  hardwareLightBonus: number;
  reactorFamily: 'Ichor' | 'Mana' | 'Ether';
} {
  const fallbackProfile = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;

  const equippedTorsoItem = findHardwareItemByNameOrId(state.equipmentSlots?.plating);
  const equippedReactorItem = findHardwareItemByNameOrId(state.equipmentSlots?.reactorCore);
  const equippedHeadItem = findHardwareItemByNameOrId(state.equipmentSlots?.head);
  const equippedArmsItem = findHardwareItemByNameOrId(state.equipmentSlots?.arms);
  const equippedLegsItem = findHardwareItemByNameOrId(state.equipmentSlots?.legs);
  const equippedSensoryA = findHardwareItemByNameOrId(state.equipmentSlots?.sensoryA);
  const equippedSensoryB = findHardwareItemByNameOrId(state.equipmentSlots?.sensoryB);

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
  let hardwareLightBonus = 0;

  for (const hw of [
    equippedReactorItem,
    equippedHeadItem,
    equippedArmsItem,
    equippedLegsItem,
    equippedSensoryA,
    equippedSensoryB,
  ]) {
    if (hw?.shieldBonus) hardwareShieldBonus += hw.shieldBonus;
    if (hw?.armorDurability) hardwareArmorBonus += hw.armorDurability;
  }

  for (const wpnSlotId of [
    state.equipmentSlots?.slot1,
    state.equipmentSlots?.slot2,
    state.equipmentSlots?.slot3,
  ]) {
    if (!wpnSlotId) continue;
    const wDef = getWeaponDefinition(wpnSlotId);
    if (wDef?.passiveArmorBonus) {
      hardwareArmorBonus += wDef.passiveArmorBonus;
    }
  }

  for (const hw of [
    equippedTorsoItem,
    equippedReactorItem,
    equippedHeadItem,
    equippedArmsItem,
    equippedLegsItem,
    equippedSensoryA,
    equippedSensoryB,
  ]) {
    if (hw?.lightBonus) hardwareLightBonus += hw.lightBonus;
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
    hardwareLightBonus,
    reactorFamily,
  };
}

