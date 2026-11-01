/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FrameLoadCapacity, GemId, ModPartOrigin, OrionState } from '../../types';
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
    | 'optics'
    | 'arms'
    | 'actuators'
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
  /** Physical weight of this piece for both Equip Load and Inertia mass (m_eff) */
  weight?: number;
  /** Frame Load Capacity bonus granted by Frame Plating or Frame Sub-Mods (Reactor Core, Leg Actuators) */
  capacityBonus?: number;
  /** Movement / glide speed multiplier granted by Leg Actuators (e.g. 1.06 = +6% stride speed) */
  moveSpeedMult?: number;
  /** Reactor thermal venting multiplier granted by Reactor Cores (e.g. 1.15 = +15% cooling rate) */
  heatVentMult?: number;
  /** Action cooldown multiplier granted by Actuators, Sensory Arrays, or Reactors (e.g. 0.92 = -8% cooldowns) */
  cooldownMult?: number;
  /** Weapon attack windup (tell) duration multiplier granted by Arm Actuators (e.g. 0.90 = -10% windup time) */
  tellDurationMult?: number;
  /** Target lock range & projectile tracking/velocity multiplier granted by Head Optics & Sensory Arrays */
  accuracyMult?: number;
  /** Bonus damage multiplier against locked or staggered targets granted by Head Optics & Sensory Arrays */
  staggerDamageMult?: number;
  /** Flat Frame Stability (S) bonus granted by Leg Actuators, Arm Actuators, or Gyro Sensory Arrays */
  stabilityBonus?: number;
  /** Flat Melee Attack Impulse Mass (attack_weight) bonus granted by high-torque Arm Actuators */
  attackMassBonus?: number;
  /** Whether this hardware/sub-mod part is crafted from gems (<=1 gem slot) or looted standalone (1..3 gem slots) */
  origin?: ModPartOrigin;
  /** Maximum additional gem slots on this hardware/sub-mod part (0..1 if crafted, 1..3 if looted) */
  maxGemSlots?: 0 | 1 | 2 | 3;
  /** Variable gem cost when origin === 'crafted' */
  gemCost?: Array<{ gemId: GemId; count: number }>;
  /** Explicit zero-sum stat/weight drawback description */
  drawbackDescription?: string;
  reactorFamily?: 'Ichor' | 'Mana' | 'Ether';
  linkedActionId: string;
  description: string;
  /** Whether the hardware currently uses a generic or placeholder icon/visual asset */
  isPlaceholderAsset?: boolean;
  /** Detailed note on planned future dedicated sprite or 3D asset */
  futureAssetPlanned?: string;
}

/**
 * Gem-Crafted Sub-Modules for Sensory A/B (`Head Mods 2-3`), Reactor Core (`Frame Mod 1`),
 * and Leg Actuators (`Frame Mod 2`).
 * Enforces the rule: Crafted mod parts have variable gem costs and at most 1 additional gem slot (`maxGemSlots: 1`),
 * whereas looted standalone parts in the canonical catalogs have `1..3` gem slots.
 * Internal sub-modules never grant exterior Armor Durability/Rating/Threshold; their bonuses map strictly to their physical domain.
 */
export const CRAFTED_SUBMODULE_HARDWARE: CanonicalHardwareItemDefinition[] = [
  {
    id: 'sensory_a_crafted_demantoid_pulse',
    name: 'Synthesized Harmonic Field Sensor',
    slot: 'sensoryA',
    canonicalSlotLabel: 'Sensory A',
    subtype: 'Crafted Sensory A Mod · Max 1 Gem Slot',
    shieldBonus: 8,
    lightBonus: 0.5,
    cooldownMult: 0.94,
    weight: 4,
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [{ gemId: 'demantoid', count: 1 }],
    drawbackDescription: '+4 WT Sensor Array Draw (Crafted: Max 1 Gem Slot)',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Gem-crafted Sensory A sub-module: +8 Shield Harmonics, +0.5 Light Radius & -6% Cooldowns, drawing +4 WT load.',
    isPlaceholderAsset: true,
  },
  {
    id: 'sensory_b_crafted_titanite_gyro',
    name: 'Synthesized Aegis Gyro-Scanner',
    slot: 'sensoryB',
    canonicalSlotLabel: 'Sensory B',
    subtype: 'Crafted Sensory B Mod · Max 1 Gem Slot',
    stabilityBonus: 14,
    shieldBonus: 8,
    accuracyMult: 1.06,
    weight: 6,
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    drawbackDescription: '+6 WT Heavy Gyro Housing (Crafted: Max 1 Gem Slot)',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Gem-crafted Sensory B sub-module: +14 Gyro Stability, +8 Shield & +6% Target Lock Accuracy, adding +6 WT.',
    isPlaceholderAsset: true,
  },
  {
    id: 'reactor_crafted_hematite_furnace',
    name: 'Synthesized Ichor Overbore Core',
    slot: 'reactor',
    canonicalSlotLabel: 'Reactor Core',
    subtype: 'Crafted Reactor Core Mod · Max 1 Gem Slot',
    reactorFamily: 'Ichor',
    heatVentMult: 1.18,
    cooldownMult: 0.94,
    capacityBonus: 28,
    weight: 18,
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [
      { gemId: 'hematite', count: 2 },
      { gemId: 'carnelian', count: 1 },
    ],
    drawbackDescription: '+18 WT Heavy Boiler Mass (Crafted: Max 1 Gem Slot)',
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Gem-crafted Frame Mod 1 (Reactor Core): Grants +28 Load Capacity, +18% Thermal Venting & -6% Cooldowns, but weighs 18 WT.',
    isPlaceholderAsset: true,
  },
  {
    id: 'reactor_crafted_moonstone_well',
    name: 'Synthesized Harmonic Mana Condenser',
    slot: 'reactor',
    canonicalSlotLabel: 'Reactor Core',
    subtype: 'Crafted Reactor Core Mod · Max 1 Gem Slot',
    reactorFamily: 'Mana',
    shieldBonus: 20,
    heatVentMult: 1.1,
    capacityBonus: 18,
    weight: 11,
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [
      { gemId: 'moonstone', count: 1 },
      { gemId: 'demantoid', count: 1 },
    ],
    drawbackDescription: '+11 WT Condenser Coils & Lower Load Cap (+18 vs +28 Heavy)',
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Gem-crafted Frame Mod 1 (Reactor Core): Grants +20 Shield Capacity, +10% Cooling & +18 Load Capacity at 11 WT.',
    isPlaceholderAsset: true,
  },
  {
    id: 'legs_crafted_carnelian_outriggers',
    name: 'Synthesized Siege Load-Bearing Striders',
    slot: 'legs',
    canonicalSlotLabel: 'Leg Actuators',
    subtype: 'Crafted Leg Actuators Mod · Max 1 Gem Slot',
    stabilityBonus: 16,
    moveSpeedMult: 0.95,
    capacityBonus: 32,
    weight: 16,
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [
      { gemId: 'carnelian', count: 2 },
      { gemId: 'titanite', count: 1 },
    ],
    drawbackDescription: '+16 WT Reinforced Strider Pistons & -5% Stride Speed (Crafted: Max 1 Gem Slot)',
    linkedActionId: 'mod_legs_seismic_stomp',
    description: 'Gem-crafted Frame Mod 2 (Leg Actuators): Massive +32 Load Capacity & +16 Grounding Stability, adding +16 WT (-5% Stride Speed).',
    isPlaceholderAsset: true,
  },
  {
    id: 'legs_crafted_charoite_featherstep',
    name: 'Synthesized Phantom Featherstep Striders',
    slot: 'legs',
    canonicalSlotLabel: 'Leg Actuators',
    subtype: 'Crafted Leg Actuators Mod · Max 1 Gem Slot',
    moveSpeedMult: 1.08,
    stabilityBonus: -4,
    capacityBonus: 12,
    weight: 5,
    origin: 'crafted',
    maxGemSlots: 1,
    gemCost: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    drawbackDescription: 'Low +12 Load Capacity & -4 Stability for Ultralight 5 WT Striders (Crafted: Max 1 Gem Slot)',
    linkedActionId: 'mod_legs_seismic_stomp',
    description: 'Gem-crafted Frame Mod 2 (Leg Actuators): Ultralight 5 WT striders (+8% Stride Speed, +12 Load Cap, -4 Stability) for Light Load (<30%) builds.',
    isPlaceholderAsset: true,
  },
];

/**
 * Unified Hardware Catalog aggregated from dedicated slot modules:
 * - Head: Dome Plate (`slot: 'head'`) + Mod 1 = Optics (`slot: 'optics'`) + Mod 2 = Sensory A + Mod 3 = Sensory B
 * - Arms: Aperture Plate (`slot: 'arms'`) + Mod 1 = Actuators (`slot: 'actuators'`)
 * - Frame: Frame Plating (`slot: 'plating'`) + Mod 1 = Reactor Core (`slot: 'reactor'`) + Mod 2 = Leg Actuators (`slot: 'legs'`)
 */
export const CANONICAL_HARDWARE_CATALOG: CanonicalHardwareItemDefinition[] = [
  ...CANONICAL_FRAME_PLATING,
  ...CANONICAL_REACTORS,
  ...CANONICAL_HEAD_OPTICS,
  ...CANONICAL_SENSORY_ARRAYS,
  ...CANONICAL_ARMS,
  ...CANONICAL_LEGS,
  ...CANONICAL_AUXILIARIES,
  ...CRAFTED_SUBMODULE_HARDWARE,
];

export { CANONICAL_FRAME_PLATING };

export type ChassisHardwareItemDefinition = CanonicalHardwareItemDefinition;
export const CHASSIS_HARDWARE_CATALOG: ChassisHardwareItemDefinition[] = CANONICAL_HARDWARE_CATALOG;

const MODIFIED_HARDWARE_CACHE: Record<string, CanonicalHardwareItemDefinition> = {};

/**
 * Computes default physical weight (`WT`) for any hardware/armor/sub-mod piece if not explicitly set.
 * Scaled by chassis weight class (Light Recon vs. Medium Tactical/Arcane/Sanctum vs. Heavy Siege).
 */
export function getHardwareBaseWeight(item: CanonicalHardwareItemDefinition | undefined): number {
  if (!item) return 0;
  if (typeof item.weight === 'number') return item.weight;
  const text = `${item.id} ${item.name} ${item.subtype || ''}`.toLowerCase();
  const isLightHardware =
    item.baseLoadCapacity === 'light' ||
    text.includes('shadowcraft') ||
    text.includes('veilsight') ||
    text.includes('vx ') ||
    text.includes('_vx_') ||
    text.includes('whisperblade') ||
    text.includes('ghost') ||
    text.includes('phantom') ||
    text.includes('ablative');
  const isHeavyHardware =
    item.baseLoadCapacity === 'heavy' ||
    item.baseLoadCapacity === 'superheavy' ||
    text.includes('fortress') ||
    text.includes('fire & ice') ||
    text.includes('fire_ice') ||
    text.includes('ironveil') ||
    text.includes('be ') ||
    text.includes('_be_') ||
    text.includes('nds ') ||
    text.includes('_nds_') ||
    text.includes('siegebreaker') ||
    text.includes('outrigger') ||
    text.includes('battleheart') ||
    text.includes('camelot') ||
    text.includes('hardened');

  switch (item.slot) {
    case 'plating':
      if (item.baseLoadCapacity === 'superheavy') return 36;
      if (isHeavyHardware) return 32;
      if (isLightHardware) return 7;
      return text.includes('dawnforge') ? 17 : 15;
    case 'head':
      if (isHeavyHardware) return 12;
      if (isLightHardware) return 3;
      return 6;
    case 'optics':
      if (isHeavyHardware) return 5;
      if (isLightHardware) return 1;
      return 2;
    case 'sensoryA':
    case 'sensoryB':
      if (isHeavyHardware) return 4;
      if (isLightHardware) return 1;
      return 2;
    case 'arms':
      if (isHeavyHardware) return 16;
      if (isLightHardware) return 4;
      return 8;
    case 'actuators':
      if (isHeavyHardware) return 8;
      if (isLightHardware) return 2;
      return 4;
    case 'reactor':
      if (isHeavyHardware) return 14;
      if (isLightHardware) return 4;
      return 8;
    case 'legs':
      if (isHeavyHardware) return 14;
      if (isLightHardware) return 3;
      return 7;
    default:
      return 6;
  }
}

/**
 * Computes the Frame Load Capacity bonus granted by Frame sub-mods (`Reactor Core` and `Leg Actuators`).
 */
export function getHardwareCapacityBonus(item: CanonicalHardwareItemDefinition | undefined): number {
  if (!item) return 0;
  if (typeof item.capacityBonus === 'number') return item.capacityBonus;
  const descLower = `${item.name} ${item.subtype} ${item.description}`.toLowerCase();
  if (item.slot === 'reactor') {
    if (descLower.includes('phantom') || descLower.includes('shadow')) {
      return 28;
    }
    if (descLower.includes('infinite') || descLower.includes('battleheart') || descLower.includes('furnace')) {
      return 26;
    }
    return 24;
  }
  if (item.slot === 'legs') {
    if (
      descLower.includes('outrigger') ||
      descLower.includes('piledriver') ||
      descLower.includes('stabilizer') ||
      descLower.includes('camelot')
    ) {
      return 26;
    }
    if (descLower.includes('ghost') || descLower.includes('shadow')) {
      return 24;
    }
    return 24;
  }
  return 0;
}

/**
 * Returns a concise slot-adaptive summary of what socketing a Gemstone into a given hardware slot does.
 */
export function getHardwareGemBonusDescription(
  slot: CanonicalHardwareItemDefinition['slot'],
  gem: GemId
): string {
  const isExteriorArmor = slot === 'plating' || slot === 'head' || slot === 'arms';
  if (isExteriorArmor) {
    switch (gem) {
      case 'titanite':
        return '+12 Shield, +1 Armor Rating / +6 WT';
      case 'moonstone':
        return '+10 Shield / +3 WT, -4 Armor Dur';
      case 'hematite':
        return '+18 Armor Durability / +5 WT, -4 Shield';
      case 'carnelian':
        return `+15 Armor Dur, +1 Threshold${slot === 'plating' ? ', +6 Cap' : ''} / +8 WT`;
      case 'spinel':
        return '+8 Shield, +8 Armor Dur / +4 WT';
      case 'demantoid':
        return '+8 Shield, +10 Armor Dur / +3 WT';
      case 'kyanite':
        return '+6 Shield, +0.5 Light / +2 WT, -3 Dur';
      case 'charoite':
        return '+6 Shield, -4 WT Ultralight / -6 Armor Dur';
      case 'rubellite':
        return '+10 Shield, +10 Armor Dur / +4 WT';
    }
  }
  if (slot === 'actuators') {
    switch (gem) {
      case 'carnelian':
        return '+8 Strike Mass, +6 Stability / +6 WT, +4% Windup';
      case 'spinel':
        return '-8% Swing Windup, +4 Strike Mass / +4 WT, -4 Stability';
      case 'titanite':
        return '+12 Recoil Stability, +6 Shield / +5 WT';
      case 'hematite':
        return '+6 Strike Mass, -6% Cooldowns / +4 WT, -4 Shield';
      case 'moonstone':
        return '+10 Shield Coupling, -5% Cooldowns / +3 WT';
      case 'demantoid':
        return '+8 Shield Coupling, +6 Stability / +3 WT';
      case 'kyanite':
        return '-6% Swing Windup, +6% Lock Accuracy / +2 WT';
      case 'charoite':
        return '-10% Swing Windup, -2 WT Ultralight / -5 Stability';
      case 'rubellite':
        return '-8% Cooldowns, +5 Strike Mass / +3 WT, -3 Stability';
    }
  }
  if (slot === 'optics' || slot === 'sensoryA' || slot === 'sensoryB') {
    switch (gem) {
      case 'kyanite':
        return '+0.5 Light, +8% Lock Accuracy / +2 WT';
      case 'charoite':
        return '+0.5 Light, +8% Stagger Dmg, -1 WT / -4 Stability';
      case 'titanite':
        return '+10 Gyro Stability, +6 Shield / +4 WT';
      case 'moonstone':
        return '+8 Shield Harmonics, -6% Cooldowns / +2 WT';
      case 'hematite':
        return '+8% Stagger Dmg, -5% Cooldowns / +3 WT, -4 Shield';
      case 'carnelian':
        return '+8 Gyro Stability, +6% Lock Accuracy / +4 WT';
      case 'spinel':
        return '+6% Lock Accuracy, +6% Stagger Dmg / +3 WT';
      case 'demantoid':
        return '+8 Shield Harmonics, +0.5 Light / +2 WT';
      case 'rubellite':
        return '-8% Cooldowns, +6% Stagger Dmg / +3 WT';
    }
  }
  if (slot === 'reactor') {
    switch (gem) {
      case 'hematite':
        return '+12% Heat Venting, +6 Load Cap / +5 WT, -4 Shield';
      case 'moonstone':
        return '+14 Shield Output, +8% Heat Venting / +3 WT';
      case 'carnelian':
        return '+10 Load Cap, +6% Heat Venting / +7 WT';
      case 'titanite':
        return '+12 Shield Output, +6 Load Cap / +5 WT';
      case 'spinel':
        return '-6% Cooldowns, +10% Heat Venting / +4 WT';
      case 'demantoid':
        return '+10 Shield Output, +6 Load Cap / +3 WT';
      case 'kyanite':
        return '+10% Heat Venting, +8 Shield Output / +2 WT';
      case 'charoite':
        return '+8% Heat Venting, -3 WT Ultralight / -4 Load Cap';
      case 'rubellite':
        return '-8% Cooldowns, +8 Shield Output / +4 WT';
    }
  }
  // slot === 'legs'
  switch (gem) {
    case 'carnelian':
      return '+10 Load Cap, +10 Stability / +7 WT, -3% Speed';
    case 'charoite':
      return '+6% Stride Speed, -2 WT Ultralight / -4 Stability';
    case 'titanite':
      return '+12 Grounding Stability, +6 Load Cap / +5 WT';
    case 'spinel':
      return '+5% Stride Speed, +4 Load Cap / +3 WT';
    case 'hematite':
      return '+8 Load Cap, +6 Stability / +4 WT';
    case 'moonstone':
      return '+6 Shield Grounding, +4% Stride Speed / +3 WT';
    case 'demantoid':
      return '+6 Load Cap, +6 Stability / +3 WT';
    case 'kyanite':
      return '+5% Stride Speed, +6 Stability / +2 WT';
    case 'rubellite':
      return '+6% Stride Speed, +4 Load Cap / +3 WT, -3 Stability';
  }
}

/**
 * Finds a canonical hardware item by its ID, display name, or Gem-modified composite instance ID
 * (`<baseId>::<gem1>+<gem2>`). Applies slot-adaptive physical domain bonuses and zero-sum trade-offs per Gem.
 * Exterior Armor (`plating`, `head`, `arms`) receives Armor Durability/Rating/Threshold, while internal
 * sub-modules (`actuators`, `optics`, `sensoryA`, `sensoryB`, `reactor`, `legs`) receive domain-accurate stats.
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

  const isExteriorArmor =
    baseItem.slot === 'plating' || baseItem.slot === 'head' || baseItem.slot === 'arms';

  let extraShield = 0;
  let extraArmorDurability = 0;
  let extraArmorRating = 0;
  let extraArmorThreshold = 0;
  let extraLight = 0;
  let extraWeight = 0;
  let extraCapacity = 0;
  let extraStability = 0;
  let extraAttackMass = 0;
  let moveSpeedMult = baseItem.moveSpeedMult ?? 1.0;
  let heatVentMult = baseItem.heatVentMult ?? 1.0;
  let cooldownMult = baseItem.cooldownMult ?? 1.0;
  let tellDurationMult = baseItem.tellDurationMult ?? 1.0;
  let accuracyMult = baseItem.accuracyMult ?? 1.0;
  let staggerDamageMult = baseItem.staggerDamageMult ?? 1.0;
  const drawbackNotes: string[] = [];

  for (const gem of installedGems) {
    if (isExteriorArmor) {
      switch (gem) {
        case 'titanite':
          extraShield += 12;
          extraArmorRating += 1;
          extraWeight += 6;
          drawbackNotes.push('Aegis (+6 WT)');
          break;
        case 'moonstone':
          extraShield += 10;
          extraWeight += 3;
          extraArmorDurability -= 4;
          drawbackNotes.push('Harmonic (+3 WT, -4 Dur)');
          break;
        case 'hematite':
          extraArmorDurability += 18;
          extraWeight += 5;
          extraShield -= 4;
          drawbackNotes.push('Ichor (+5 WT, -4 Shield)');
          break;
        case 'carnelian':
          extraArmorDurability += 15;
          extraArmorThreshold += 1;
          extraWeight += 8;
          if (baseItem.slot === 'plating') {
            extraCapacity += 6;
          }
          drawbackNotes.push('Heavy (+8 WT Inertia/Equip Mass)');
          break;
        case 'spinel':
          extraShield += 8;
          extraArmorDurability += 8;
          extraWeight += 4;
          drawbackNotes.push('Assault (+4 WT Overclock)');
          break;
        case 'demantoid':
          extraShield += 8;
          extraArmorDurability += 10;
          extraWeight += 3;
          drawbackNotes.push('Radiant (+3 WT)');
          break;
        case 'kyanite':
          extraLight += 0.5;
          extraShield += 6;
          extraWeight += 2;
          extraArmorDurability -= 3;
          drawbackNotes.push('Arclight (+2 WT, -3 Dur)');
          break;
        case 'charoite':
          extraLight += 0.5;
          extraShield += 6;
          extraWeight -= 4;
          extraArmorDurability -= 6;
          drawbackNotes.push('Phantom (-4 WT Ultralight, -6 Dur)');
          break;
        case 'rubellite':
          extraShield += 10;
          extraArmorDurability += 10;
          extraWeight += 4;
          drawbackNotes.push('Volatile (+4 WT)');
          break;
      }
    } else if (baseItem.slot === 'actuators') {
      switch (gem) {
        case 'carnelian':
          extraAttackMass += 8;
          extraStability += 6;
          tellDurationMult *= 1.04;
          extraWeight += 6;
          drawbackNotes.push('Heavy Piston (+6 WT, +4% Windup)');
          break;
        case 'spinel':
          tellDurationMult *= 0.92;
          extraAttackMass += 4;
          extraStability -= 4;
          extraWeight += 4;
          drawbackNotes.push('Overclock Servo (+4 WT, -4 Stability)');
          break;
        case 'titanite':
          extraStability += 12;
          extraShield += 6;
          tellDurationMult *= 1.03;
          extraWeight += 5;
          drawbackNotes.push('Counter-Gyro (+5 WT, +3% Windup)');
          break;
        case 'hematite':
          extraAttackMass += 6;
          cooldownMult *= 0.94;
          extraShield -= 4;
          extraWeight += 4;
          drawbackNotes.push('Hydraulic Drive (+4 WT, -4 Shield)');
          break;
        case 'moonstone':
          extraShield += 10;
          cooldownMult *= 0.95;
          extraAttackMass -= 3;
          extraWeight += 3;
          drawbackNotes.push('Harmonic Coupler (+3 WT, -3 Strike Mass)');
          break;
        case 'demantoid':
          extraShield += 8;
          extraStability += 6;
          extraWeight += 3;
          drawbackNotes.push('Radiant Coupler (+3 WT)');
          break;
        case 'kyanite':
          tellDurationMult *= 0.94;
          accuracyMult *= 1.06;
          extraStability -= 3;
          extraWeight += 2;
          drawbackNotes.push('Collimated Servo (+2 WT, -3 Stability)');
          break;
        case 'charoite':
          tellDurationMult *= 0.9;
          extraWeight -= 2;
          extraStability -= 5;
          drawbackNotes.push('Feather-Gyro (-2 WT, -5 Stability)');
          break;
        case 'rubellite':
          cooldownMult *= 0.92;
          extraAttackMass += 5;
          extraStability -= 3;
          extraWeight += 3;
          drawbackNotes.push('Volatile Actuator (+3 WT, -3 Stability)');
          break;
      }
    } else if (
      baseItem.slot === 'optics' ||
      baseItem.slot === 'sensoryA' ||
      baseItem.slot === 'sensoryB'
    ) {
      switch (gem) {
        case 'kyanite':
          extraLight += 0.5;
          accuracyMult *= 1.08;
          extraWeight += 2;
          drawbackNotes.push('Arclight Lens (+2 WT)');
          break;
        case 'charoite':
          extraLight += 0.5;
          staggerDamageMult *= 1.08;
          extraWeight -= 1;
          extraStability -= 4;
          drawbackNotes.push('Nightglass (-1 WT, -4 Stability)');
          break;
        case 'titanite':
          extraStability += 10;
          extraShield += 6;
          extraWeight += 4;
          drawbackNotes.push('Armored Gyro Housing (+4 WT)');
          break;
        case 'moonstone':
          extraShield += 8;
          cooldownMult *= 0.94;
          extraWeight += 2;
          drawbackNotes.push('Resonance Telemetry (+2 WT)');
          break;
        case 'hematite':
          staggerDamageMult *= 1.08;
          cooldownMult *= 0.95;
          extraShield -= 4;
          extraWeight += 3;
          drawbackNotes.push('Bloodhound Sensor (+3 WT, -4 Shield)');
          break;
        case 'carnelian':
          extraStability += 8;
          accuracyMult *= 1.06;
          extraWeight += 4;
          drawbackNotes.push('Ballistic Rangefinder (+4 WT)');
          break;
        case 'spinel':
          accuracyMult *= 1.06;
          staggerDamageMult *= 1.06;
          extraWeight += 3;
          drawbackNotes.push('Target Overclock (+3 WT)');
          break;
        case 'demantoid':
          extraShield += 8;
          extraLight += 0.5;
          extraWeight += 2;
          drawbackNotes.push('Triage Optics (+2 WT)');
          break;
        case 'rubellite':
          cooldownMult *= 0.92;
          staggerDamageMult *= 1.06;
          extraWeight += 3;
          drawbackNotes.push('Pulse Telemetry (+3 WT)');
          break;
      }
    } else if (baseItem.slot === 'reactor') {
      switch (gem) {
        case 'hematite':
          heatVentMult *= 1.12;
          extraCapacity += 6;
          extraShield -= 4;
          extraWeight += 5;
          drawbackNotes.push('Overbore Boiler (+5 WT, -4 Shield)');
          break;
        case 'moonstone':
          extraShield += 14;
          heatVentMult *= 1.08;
          extraWeight += 3;
          drawbackNotes.push('Mana Condenser (+3 WT)');
          break;
        case 'carnelian':
          extraCapacity += 10;
          heatVentMult *= 1.06;
          extraWeight += 7;
          drawbackNotes.push('Heavy Flywheel (+7 WT)');
          break;
        case 'titanite':
          extraShield += 12;
          extraCapacity += 6;
          extraWeight += 5;
          drawbackNotes.push('Bastion Core (+5 WT)');
          break;
        case 'spinel':
          cooldownMult *= 0.94;
          heatVentMult *= 1.1;
          extraWeight += 4;
          drawbackNotes.push('Injector Overdrive (+4 WT)');
          break;
        case 'demantoid':
          extraShield += 10;
          extraCapacity += 6;
          extraWeight += 3;
          drawbackNotes.push('Harmonic Core (+3 WT)');
          break;
        case 'kyanite':
          heatVentMult *= 1.1;
          extraShield += 8;
          extraWeight += 2;
          drawbackNotes.push('Cryo-Shunt (+2 WT)');
          break;
        case 'charoite':
          heatVentMult *= 1.08;
          extraWeight -= 3;
          extraCapacity -= 4;
          drawbackNotes.push('Ultralight Coil (-3 WT, -4 Cap)');
          break;
        case 'rubellite':
          cooldownMult *= 0.92;
          extraShield += 8;
          extraWeight += 4;
          drawbackNotes.push('Surge Capacitor (+4 WT)');
          break;
      }
    } else if (baseItem.slot === 'legs') {
      switch (gem) {
        case 'carnelian':
          extraCapacity += 10;
          extraStability += 10;
          moveSpeedMult *= 0.97;
          extraWeight += 7;
          drawbackNotes.push('Siege Outrigger (+7 WT, -3% Speed)');
          break;
        case 'charoite':
          moveSpeedMult *= 1.06;
          extraWeight -= 2;
          extraStability -= 4;
          drawbackNotes.push('Featherstep (-2 WT, -4 Stability)');
          break;
        case 'titanite':
          extraStability += 12;
          extraCapacity += 6;
          extraWeight += 5;
          drawbackNotes.push('Anchor Struts (+5 WT)');
          break;
        case 'spinel':
          moveSpeedMult *= 1.05;
          extraCapacity += 4;
          extraWeight += 3;
          drawbackNotes.push('Burst Striders (+3 WT)');
          break;
        case 'hematite':
          extraCapacity += 8;
          extraStability += 6;
          extraWeight += 4;
          drawbackNotes.push('Piston Bracing (+4 WT)');
          break;
        case 'moonstone':
          extraShield += 6;
          moveSpeedMult *= 1.04;
          extraWeight += 3;
          drawbackNotes.push('Glider Coils (+3 WT)');
          break;
        case 'demantoid':
          extraCapacity += 6;
          extraStability += 6;
          extraWeight += 3;
          drawbackNotes.push('Steadfast Struts (+3 WT)');
          break;
        case 'kyanite':
          moveSpeedMult *= 1.05;
          extraStability += 6;
          extraWeight += 2;
          drawbackNotes.push('Vector Gyros (+2 WT)');
          break;
        case 'rubellite':
          moveSpeedMult *= 1.06;
          extraCapacity += 4;
          extraStability -= 3;
          extraWeight += 3;
          drawbackNotes.push('Overdrive Pistons (+3 WT, -3 Stability)');
          break;
      }
    }
  }

  const baseWeight = getHardwareBaseWeight(baseItem);
  const baseCap = getHardwareCapacityBonus(baseItem);
  const canonicalCompositeId = buildEquipmentInstanceId(baseItem.id, installedGems);
  const derived: CanonicalHardwareItemDefinition = {
    ...baseItem,
    id: canonicalCompositeId,
    name: formatModifiedEquipmentName(baseItem.name, installedGems),
    weight: Math.max(1, baseWeight + extraWeight),
    capacityBonus:
      baseCap + extraCapacity > 0 ? baseCap + extraCapacity : baseItem.capacityBonus,
    drawbackDescription: [baseItem.drawbackDescription, ...drawbackNotes]
      .filter(Boolean)
      .join(' · '),
    shieldBonus:
      (baseItem.shieldBonus || 0) + extraShield > 0
        ? (baseItem.shieldBonus || 0) + extraShield
        : baseItem.shieldBonus,
    armorDurability: isExteriorArmor
      ? (baseItem.armorDurability || 0) + extraArmorDurability > 0
        ? Math.max(2, (baseItem.armorDurability || 0) + extraArmorDurability)
        : baseItem.armorDurability
      : undefined,
    armorRating: isExteriorArmor
      ? typeof baseItem.armorRating === 'number'
        ? baseItem.armorRating + extraArmorRating
        : extraArmorRating > 0
          ? extraArmorRating
          : baseItem.armorRating
      : undefined,
    armorThreshold: isExteriorArmor
      ? typeof baseItem.armorThreshold === 'number'
        ? baseItem.armorThreshold + extraArmorThreshold
        : extraArmorThreshold > 0
          ? extraArmorThreshold
          : baseItem.armorThreshold
      : undefined,
    lightBonus:
      (baseItem.lightBonus || 0) + extraLight > 0
        ? Number(((baseItem.lightBonus || 0) + extraLight).toFixed(2))
        : baseItem.lightBonus,
    stabilityBonus:
      (baseItem.stabilityBonus || 0) + extraStability !== 0
        ? (baseItem.stabilityBonus || 0) + extraStability
        : baseItem.stabilityBonus,
    attackMassBonus:
      (baseItem.attackMassBonus || 0) + extraAttackMass !== 0
        ? (baseItem.attackMassBonus || 0) + extraAttackMass
        : baseItem.attackMassBonus,
    moveSpeedMult:
      Math.abs(moveSpeedMult - 1.0) > 0.001
        ? Number(moveSpeedMult.toFixed(3))
        : baseItem.moveSpeedMult,
    heatVentMult:
      Math.abs(heatVentMult - 1.0) > 0.001
        ? Number(heatVentMult.toFixed(3))
        : baseItem.heatVentMult,
    cooldownMult:
      Math.abs(cooldownMult - 1.0) > 0.001
        ? Number(cooldownMult.toFixed(3))
        : baseItem.cooldownMult,
    tellDurationMult:
      Math.abs(tellDurationMult - 1.0) > 0.001
        ? Number(tellDurationMult.toFixed(3))
        : baseItem.tellDurationMult,
    accuracyMult:
      Math.abs(accuracyMult - 1.0) > 0.001
        ? Number(accuracyMult.toFixed(3))
        : baseItem.accuracyMult,
    staggerDamageMult:
      Math.abs(staggerDamageMult - 1.0) > 0.001
        ? Number(staggerDamageMult.toFixed(3))
        : baseItem.staggerDamageMult,
  };
  MODIFIED_HARDWARE_CACHE[nameOrId] = derived;
  MODIFIED_HARDWARE_CACHE[canonicalCompositeId] = derived;
  return derived;
}

/**
 * Resolves the pilot's active Frame Plating, Dome Plate + Optics/Sensory, Aperture Plate + Actuators,
 * Reactor Core, and Leg Actuators stats dynamically from equipped gear.
 * Enforces physical intuition: ONLY exterior armor plating (`plating`, `head`, `arms`) and physical/ward
 * shields grant Armor Threshold, Armor Rating, and Armor Durability.
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
  moveSpeedMult: number;
  heatVentMult: number;
  cooldownMult: number;
  tellDurationMult: number;
  accuracyMult: number;
  staggerDamageMult: number;
  stabilityBonus: number;
  attackMassBonus: number;
} {
  const fallbackProfile = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;

  const equippedTorsoItem = findHardwareItemByNameOrId(state.equipmentSlots?.plating);
  const equippedReactorItem = findHardwareItemByNameOrId(state.equipmentSlots?.reactorCore);
  const equippedHeadItem = findHardwareItemByNameOrId(state.equipmentSlots?.head);
  const equippedOpticsItem = findHardwareItemByNameOrId(state.equipmentSlots?.headOptics);
  const equippedArmsItem = findHardwareItemByNameOrId(state.equipmentSlots?.arms);
  const equippedActuatorsItem = findHardwareItemByNameOrId(state.equipmentSlots?.armActuators);
  const equippedLegsItem = findHardwareItemByNameOrId(state.equipmentSlots?.legs);
  const equippedSensoryA = findHardwareItemByNameOrId(state.equipmentSlots?.sensoryA);
  const equippedSensoryB = findHardwareItemByNameOrId(state.equipmentSlots?.sensoryB);

  const baseLoadCapacity: FrameLoadCapacity =
    equippedTorsoItem?.baseLoadCapacity ||
    (fallbackProfile.weightClass as FrameLoadCapacity) ||
    'medium';

  const armorType: 'Ablative' | 'Reactive' | 'Hardened' | 'Layered' =
    equippedTorsoItem?.armorType || fallbackProfile.baseArmor?.type || 'Reactive';

  // Only exterior plating (Frame Plating, Dome Plate, Aperture Plate) contributes to Armor Threshold & Rating
  const armorThreshold =
    (equippedTorsoItem?.armorThreshold ?? fallbackProfile.baseArmor?.threshold ?? 6) +
    (equippedHeadItem?.armorThreshold ?? 0) +
    (equippedArmsItem?.armorThreshold ?? 0);

  const armorRating =
    (equippedTorsoItem?.armorRating ?? fallbackProfile.baseArmor?.rating ?? 10) +
    (equippedHeadItem?.armorRating ?? 0) +
    (equippedArmsItem?.armorRating ?? 0);

  const baseArmorDurability =
    equippedTorsoItem?.armorDurability ?? fallbackProfile.baseArmor?.durability ?? 130;

  const baseShieldCapacity =
    equippedTorsoItem?.shieldBonus ?? fallbackProfile.baseShield?.capacity ?? 50;

  let hardwareShieldBonus = 0;
  let hardwareArmorBonus = 0;
  let hardwareLightBonus = 0;
  let moveSpeedMult = 1.0;
  let heatVentMult = 1.0;
  let cooldownMult = 1.0;
  let tellDurationMult = 1.0;
  let accuracyMult = 1.0;
  let staggerDamageMult = 1.0;
  let stabilityBonus = 0;
  let attackMassBonus = 0;

  // Exterior Armor Pieces (Head Dome Plate & Arms Aperture Plate) grant Armor Durability
  for (const exteriorArmor of [equippedHeadItem, equippedArmsItem]) {
    if (exteriorArmor?.armorDurability) {
      hardwareArmorBonus += exteriorArmor.armorDurability;
    }
  }

  // All non-torso hardware pieces can contribute Shield, Light, and Mechanical Domain stats
  for (const hw of [
    equippedReactorItem,
    equippedHeadItem,
    equippedOpticsItem,
    equippedArmsItem,
    equippedActuatorsItem,
    equippedLegsItem,
    equippedSensoryA,
    equippedSensoryB,
  ]) {
    if (!hw) continue;
    if (hw.shieldBonus) hardwareShieldBonus += hw.shieldBonus;
    if (hw.lightBonus) hardwareLightBonus += hw.lightBonus;
    if (hw.moveSpeedMult) moveSpeedMult *= hw.moveSpeedMult;
    if (hw.heatVentMult) heatVentMult *= hw.heatVentMult;
    if (hw.cooldownMult) cooldownMult *= hw.cooldownMult;
    if (hw.tellDurationMult) tellDurationMult *= hw.tellDurationMult;
    if (hw.accuracyMult) accuracyMult *= hw.accuracyMult;
    if (hw.staggerDamageMult) staggerDamageMult *= hw.staggerDamageMult;
    if (hw.stabilityBonus) stabilityBonus += hw.stabilityBonus;
    if (hw.attackMassBonus) attackMassBonus += hw.attackMassBonus;
  }

  if (equippedTorsoItem) {
    if (equippedTorsoItem.lightBonus) hardwareLightBonus += equippedTorsoItem.lightBonus;
    if (equippedTorsoItem.moveSpeedMult) moveSpeedMult *= equippedTorsoItem.moveSpeedMult;
    if (equippedTorsoItem.heatVentMult) heatVentMult *= equippedTorsoItem.heatVentMult;
    if (equippedTorsoItem.cooldownMult) cooldownMult *= equippedTorsoItem.cooldownMult;
    if (equippedTorsoItem.stabilityBonus) stabilityBonus += equippedTorsoItem.stabilityBonus;
  }

  // Only physical/ward shields or explicit sacrificial plating auxiliaries grant passiveArmorBonus
  for (const wpnSlotId of [
    state.equipmentSlots?.slot1,
    state.equipmentSlots?.slot2,
    state.equipmentSlots?.slot3,
  ]) {
    if (!wpnSlotId) continue;
    const wDef = getWeaponDefinition(wpnSlotId);
    if (
      wDef?.passiveArmorBonus &&
      (wDef.equipmentRole === 'shield' || wDef.id.includes('martyrdom_plating'))
    ) {
      hardwareArmorBonus += wDef.passiveArmorBonus;
    }
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
    moveSpeedMult: Number(moveSpeedMult.toFixed(3)),
    heatVentMult: Number(heatVentMult.toFixed(3)),
    cooldownMult: Number(cooldownMult.toFixed(3)),
    tellDurationMult: Number(tellDurationMult.toFixed(3)),
    accuracyMult: Number(accuracyMult.toFixed(3)),
    staggerDamageMult: Number(staggerDamageMult.toFixed(3)),
    stabilityBonus,
    attackMassBonus,
  };
}


