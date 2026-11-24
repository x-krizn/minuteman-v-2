/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArmorAcquisitionType,
  ArmorGemResonanceCombo,
  ExteriorArmorSocketEvalResult,
  FrameLoadCapacity,
  GemId,
  ModPartOrigin,
  OrionState,
  StatDelta,
  SubSystemOrigin,
  SubSystemStatDelta,
} from '../../types';
import { TRAIT_REGISTRY } from '../characters';
import { CANONICAL_ARMS } from './arms';
import {
  evaluateExteriorArmorPieceSockets,
  formatStatDeltaBadges,
  getPerSlotGemstoneHarmonicText,
  sumStatDeltas,
} from './exterior_armor_harmonics';
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

/**
 * Sprite strip and directional atlas configuration for a mech hardware piece (`64x16` 4-frame strip,
 * `64x64` 4-direction part sheet, or `192x768` 3-column master armor sheet).
 */
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

/**
 * Canonical schema for any exterior armor plate (`head`, `arms`, `plating`) or internal chassis sub-module
 * (`optics`, `sensoryA`, `sensoryB`, `actuators`, `reactor`, `legs`, `aux3`, `aux4`).
 */
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
  /** Optional visual set index (0..15 for canonical sets; omit for standalone pieces without a full set) */
  setIndex?: number;
  /** Optional set identifier for grouping matching pieces (`'set_00'..'set_05'`, `'set_12'..'set_15'`) */
  setId?: string;
  /** 4-frame (64x16px, 16x16px per frame) aligned sprite strip configuration for head, arms, or frame plating */
  partSprite?: MechPartSpriteStripConfig;
  /** Procedural/fallback palette and geometry theme for the 4-frame 16x16 part strip */
  spriteTheme?: {
    armColor?: string;
    cuffColor?: string;
    shoulderColor?: string;
    shoulderStyle?: string;
    armWidth?: number;
    helmColor?: string;
    visorColor?: string;
    crestColor?: string;
    crestStyle?: string;
    baseArmorColor?: string;
    trimColor?: string;
    reactorGlowColor?: string;
    legColor?: string;
    chassisWidth?: number;
    chassisHeight?: number;
    torsoStyle?: string;
  };
  armorType?: 'Ablative' | 'Reactive' | 'Hardened' | 'Layered';
  baseLoadCapacity?: FrameLoadCapacity;
  /** Exact numeric Base Load Capacity in WT (`84`, `90`, `94`, `112`, `116`) for Core Frame Plating (`slot: 'plating'`) */
  baseLoadCapacityNumber?: number;
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
  /** Whether this hardware/sub-mod part is crafted from gems or looted standalone */
  origin?: ModPartOrigin;
  /** Internal sub-system classification (`'mech_unique_tech' | 'material_looted' | 'material_crafted'`) */
  subSystemOrigin?: SubSystemOrigin;
  /** Lore heritage or material substrate tag (e.g., `'Warrior'`, `'Quartz'`, `'Kyanite'`) */
  heritageOrMaterial?: string;
  /** Structured internal sub-system modifiers from Internal Sub-Systems Spec §3 */
  subSystemModifiers?: SubSystemStatDelta;
  /** Whether this Sensory B module unlocks the live Inertia HUD readout */
  enablesInertiaHud?: boolean;
  /** Scrap cost required at the Armory workbench when `subSystemOrigin === 'material_crafted'` */
  scrapCost?: number;
  /** Acquisition pathway for Exterior Armor (`'starter_post_boss' | 'forge_blueprint'`) */
  acquisition?: ArmorAcquisitionType;
  /** Required Cyclopean Dwarf Forge blueprint ID if `acquisition === 'forge_blueprint'` */
  blueprintId?: string;
  /** Structured base stat modifiers from Exterior Armor Spec §3 */
  baseModifiers?: StatDelta;
  /** Evaluated socket harmonics & combo breakdown when socketed with gemstones */
  socketEvalResult?: ExteriorArmorSocketEvalResult;
  /** Maximum additional gem slots on this hardware/sub-mod part (`0` on Sensory/Actuators/Legs, `1` on Optics & Energy Storage, `2` on Mech-Unique Reactors, `2..3` on Exterior Armor) */
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
 * Gem-Crafted Sub-Modules (`material_crafted`) for Sensory A/B (`Head Mods 2-3`), Reactor Core (`Frame Mod 1`),
 * and Leg Actuators (`Frame Mod 2`).
 * - Sensory A/B and Leg Actuators are pure mechanical/electronic hardware (`maxGemSlots: 0`).
 * - Crafted Reactor Cores are crystalline energy conduits (`maxGemSlots: 1`).
 * - Internal sub-modules never grant exterior Armor Durability/Rating/Threshold; their bonuses map strictly to their physical domain.
 */
export const CRAFTED_SUBMODULE_HARDWARE: CanonicalHardwareItemDefinition[] = [
  {
    id: 'sensory_a_crafted_demantoid_pulse',
    name: 'Synthesized Harmonic Field Sensor',
    slot: 'sensoryA',
    canonicalSlotLabel: 'Sensory A',
    subtype: 'Material-Crafted Sensory A · 0G Pure Hardware',
    shieldBonus: 8,
    lightBonus: 0.5,
    cooldownMult: 0.94,
    weight: 4,
    origin: 'crafted',
    subSystemOrigin: 'material_crafted',
    heritageOrMaterial: 'Demantoid',
    maxGemSlots: 0,
    scrapCost: 25,
    gemCost: [{ gemId: 'demantoid', count: 1 }],
    subSystemModifiers: {
      shield: 8,
      lightRadius: 0.5,
      cooldownPct: -0.06,
    },
    drawbackDescription: '+4 WT Sensor Array Draw (25 Scrap + 1 Demantoid · 0G Pure Hardware)',
    linkedActionId: 'mod_head_optic_scan',
    description:
      'Material-crafted Sensory A sub-module: +8 Shield Harmonics, +0.5 Light Radius & -6% Cooldowns, drawing +4 WT load.',
    isPlaceholderAsset: true,
  },
  {
    id: 'sensory_b_crafted_titanite_gyro',
    name: 'Synthesized Aegis Gyro-Scanner',
    slot: 'sensoryB',
    canonicalSlotLabel: 'Sensory B',
    subtype: 'Material-Crafted Sensory B · 0G Pure Hardware',
    stabilityBonus: 14,
    shieldBonus: 8,
    accuracyMult: 1.06,
    weight: 6,
    origin: 'crafted',
    subSystemOrigin: 'material_crafted',
    heritageOrMaterial: 'Titanite + Moonstone',
    maxGemSlots: 0,
    scrapCost: 30,
    gemCost: [
      { gemId: 'titanite', count: 1 },
      { gemId: 'moonstone', count: 1 },
    ],
    subSystemModifiers: {
      stability: 14,
      shield: 8,
      lockAccuracyPct: 0.06,
    },
    drawbackDescription: '+6 WT Heavy Gyro Housing (30 Scrap + 1 Titanite + 1 Moonstone · 0G Pure Hardware)',
    linkedActionId: 'mod_head_optic_scan',
    description:
      'Material-crafted Sensory B sub-module: +14 Gyro Stability, +8 Shield & +6% Target Lock Accuracy, adding +6 WT.',
    isPlaceholderAsset: true,
  },
  {
    id: 'reactor_crafted_hematite_furnace',
    name: 'Synthesized Ichor Overbore Core',
    slot: 'reactor',
    canonicalSlotLabel: 'Reactor Core',
    subtype: 'Material-Crafted Reactor Core · 1G Conduit',
    reactorFamily: 'Ichor',
    heatVentMult: 1.18,
    cooldownMult: 0.94,
    capacityBonus: 28,
    weight: 18,
    origin: 'crafted',
    subSystemOrigin: 'material_crafted',
    heritageOrMaterial: 'Hematite + Carnelian',
    maxGemSlots: 1,
    scrapCost: 45,
    gemCost: [
      { gemId: 'hematite', count: 2 },
      { gemId: 'carnelian', count: 1 },
    ],
    subSystemModifiers: {
      loadCapacity: 28,
      heatVentingPct: 0.18,
      cooldownPct: -0.06,
    },
    drawbackDescription: '+18 WT Heavy Boiler Mass (45 Scrap + 2 Hematite + 1 Carnelian · 1G Socket)',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'Material-crafted Frame Mod 1 (Ichor Reactor Core): Grants +28 Load Capacity, +18% Thermal Venting & -6% Cooldowns, weighing 18 WT.',
    isPlaceholderAsset: true,
  },
  {
    id: 'reactor_crafted_moonstone_well',
    name: 'Synthesized Harmonic Mana Condenser',
    slot: 'reactor',
    canonicalSlotLabel: 'Reactor Core',
    subtype: 'Material-Crafted Reactor Core · 1G Conduit',
    reactorFamily: 'Mana',
    shieldBonus: 20,
    heatVentMult: 1.1,
    capacityBonus: 18,
    weight: 11,
    origin: 'crafted',
    subSystemOrigin: 'material_crafted',
    heritageOrMaterial: 'Moonstone + Demantoid',
    maxGemSlots: 1,
    scrapCost: 40,
    gemCost: [
      { gemId: 'moonstone', count: 1 },
      { gemId: 'demantoid', count: 1 },
    ],
    subSystemModifiers: {
      loadCapacity: 18,
      shield: 20,
      heatVentingPct: 0.1,
    },
    drawbackDescription: '+11 WT Condenser Coils & Lower Load Cap (+18 vs +28 Heavy · 40 Scrap + 1 Moonstone + 1 Demantoid · 1G Socket)',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'Material-crafted Frame Mod 1 (Mana Reactor Core): Grants +20 Shield Capacity, +10% Cooling & +18 Load Capacity at 11 WT.',
    isPlaceholderAsset: true,
  },
  {
    id: 'reactor_crafted_rubellite_well',
    name: 'Synthesized Ether Phase-Well Core',
    slot: 'reactor',
    canonicalSlotLabel: 'Reactor Core',
    subtype: 'Material-Crafted Reactor Core · 1G Conduit',
    reactorFamily: 'Ether',
    cooldownMult: 0.92,
    shieldBonus: 12,
    stabilityBonus: -5,
    capacityBonus: 20,
    weight: 7,
    origin: 'crafted',
    subSystemOrigin: 'material_crafted',
    heritageOrMaterial: 'Rubellite + Kyanite',
    maxGemSlots: 1,
    scrapCost: 40,
    gemCost: [
      { gemId: 'rubellite', count: 1 },
      { gemId: 'kyanite', count: 1 },
    ],
    subSystemModifiers: {
      loadCapacity: 20,
      cooldownPct: -0.08,
      shield: 12,
      stability: -5,
    },
    drawbackDescription: '-5 Frame Stability for Ultralight 7 WT Ether Core (40 Scrap + 1 Rubellite + 1 Kyanite · 1G Socket)',
    linkedActionId: 'mod_torso_reactive_burst',
    description:
      'Material-crafted Frame Mod 1 (Ether Reactor Core): Grants -8% Cooldowns, +12 Shield Capacity & +20 Load Capacity at an ultralight 7 WT (-5 Stability).',
    isPlaceholderAsset: true,
  },
  {
    id: 'legs_crafted_carnelian_outriggers',
    name: 'Synthesized Siege Load-Bearing Striders',
    slot: 'legs',
    canonicalSlotLabel: 'Leg Actuators',
    subtype: 'Material-Crafted Leg Striders · 0G Pure Hardware',
    stabilityBonus: 16,
    moveSpeedMult: 0.95,
    capacityBonus: 32,
    weight: 16,
    origin: 'crafted',
    subSystemOrigin: 'material_crafted',
    heritageOrMaterial: 'Carnelian + Titanite',
    maxGemSlots: 0,
    scrapCost: 35,
    gemCost: [
      { gemId: 'carnelian', count: 2 },
      { gemId: 'titanite', count: 1 },
    ],
    subSystemModifiers: {
      loadCapacity: 32,
      stability: 16,
      strideSpeedPct: -0.05,
    },
    drawbackDescription: '+16 WT Reinforced Strider Pistons & -5% Stride Speed (35 Scrap + 2 Carnelian + 1 Titanite · 0G Pure Hardware)',
    linkedActionId: 'mod_legs_seismic_stomp',
    description:
      'Material-crafted Frame Mod 2 (Leg Actuators): Massive +32 Load Capacity & +16 Grounding Stability, adding +16 WT (-5% Stride Speed).',
    isPlaceholderAsset: true,
  },
  {
    id: 'legs_crafted_charoite_featherstep',
    name: 'Synthesized Phantom Featherstep Striders',
    slot: 'legs',
    canonicalSlotLabel: 'Leg Actuators',
    subtype: 'Material-Crafted Leg Striders · 0G Pure Hardware',
    moveSpeedMult: 1.08,
    stabilityBonus: -4,
    capacityBonus: 12,
    weight: 5,
    origin: 'crafted',
    subSystemOrigin: 'material_crafted',
    heritageOrMaterial: 'Charoite + Rubellite',
    maxGemSlots: 0,
    scrapCost: 30,
    gemCost: [
      { gemId: 'charoite', count: 1 },
      { gemId: 'rubellite', count: 1 },
    ],
    subSystemModifiers: {
      loadCapacity: 12,
      strideSpeedPct: 0.08,
      stability: -4,
    },
    drawbackDescription: 'Low +12 Load Capacity & -4 Stability for Ultralight 5 WT Striders (30 Scrap + 1 Charoite + 1 Rubellite · 0G Pure Hardware)',
    linkedActionId: 'mod_legs_seismic_stomp',
    description:
      'Material-crafted Frame Mod 2 (Leg Actuators): Ultralight 5 WT striders (+8% Stride Speed, +12 Load Cap, -4 Stability) for Light Load (<30%) builds.',
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
  ...CRAFTED_SUBMODULE_HARDWARE,
];

export { CANONICAL_FRAME_PLATING };

/** Type alias for a canonical chassis hardware or sub-module item definition. */
export type ChassisHardwareItemDefinition = CanonicalHardwareItemDefinition;

/** Master registry of all canonical exterior armor pieces, internal sub-modules, and crafted hardware parts. */
export const CHASSIS_HARDWARE_CATALOG: ChassisHardwareItemDefinition[] = CANONICAL_HARDWARE_CATALOG;

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
    text.includes('outrider') ||
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
    text.includes('tarkhan') ||
    text.includes('hardened');

  switch (item.slot) {
    case 'plating':
      if (item.baseLoadCapacity === 'superheavy') return 36;
      if (isHeavyHardware) return 32;
      if (isLightHardware) return 8;
      return text.includes('dawnforge') ? 26 : 16;
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
export function getHardwareCapacityBonus(
  item: CanonicalHardwareItemDefinition | undefined
): number {
  if (!item) return 0;
  if (typeof item.capacityBonus === 'number') return item.capacityBonus;
  const descLower = `${item.name} ${item.subtype} ${item.description}`.toLowerCase();
  if (item.slot === 'reactor') {
    if (descLower.includes('phantom') || descLower.includes('shadow')) {
      return 28;
    }
    if (
      descLower.includes('infinite') ||
      descLower.includes('battleheart') ||
      descLower.includes('furnace')
    ) {
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
 * Section 4 Sub-System Gemstone Tuning Entry for `reactor` (`1G–2G`) and `optics` (`1G`).
 */
export interface SubSystemGemTuningEntry {
  delta: SubSystemStatDelta;
  weightDelta: number;
  summaryText: string;
}

/**
 * Canonical Section 4 Sub-System Gemstone Tuning Table (`reactor` & `optics` Only).
 * - `sensoryA`, `sensoryB`, `actuators`, and `legs` are `0G` pure mechanical/electronic hardware and do not accept gemstones.
 * - Duplicate gemstones in a `2G` Reactor Core apply `[1.0, 0.7]` diminishing returns to both positive stats and drawbacks.
 * - Never grants Exterior Armor stats (`durability`, `rating`, `threshold`).
 */
export const SUBSYSTEM_GEM_TUNING_TABLE: Record<
  'reactor' | 'optics',
  Record<GemId, SubSystemGemTuningEntry>
> = {
  reactor: {
    moonstone: {
      delta: { shield: 14, cooldownPct: -0.03 },
      weightDelta: 2,
      summaryText: '+14 Shield, -3% Cooldowns / +2 WT',
    },
    spinel: {
      delta: { heatVentingPct: 0.06, cooldownPct: -0.03 },
      weightDelta: 2,
      summaryText: '+6% Heat Venting, -3% Cooldowns / +2 WT',
    },
    carnelian: {
      delta: { loadCapacity: 8, heatVentingPct: 0.04 },
      weightDelta: 4,
      summaryText: '+8 Load Cap, +4% Heat Venting / +4 WT',
    },
    titanite: {
      delta: { shield: 10, stability: 4 },
      weightDelta: 3,
      summaryText: '+10 Shield, +4 Stability / +3 WT',
    },
    demantoid: {
      delta: { heatVentingPct: 0.08, cooldownPct: -0.04 },
      weightDelta: 2,
      summaryText: '+8% Heat Venting, -4% Cooldowns / +2 WT',
    },
    kyanite: {
      delta: { cooldownPct: -0.05, shield: 8 },
      weightDelta: 2,
      summaryText: '-5% Cooldowns, +8 Shield / +2 WT',
    },
    charoite: {
      delta: { cooldownPct: -0.04, effectiveWeightDelta: -2, shield: -4 },
      weightDelta: -2,
      summaryText: '-4% Cooldowns, -2 WT Ultralight / -4 Shield',
    },
    rubellite: {
      delta: { shield: 12, cooldownPct: -0.04, heatVentingPct: -0.03 },
      weightDelta: 0,
      summaryText: '+12 Shield, -4% Cooldowns / -3% Heat Venting',
    },
    hematite: {
      delta: { heatVentingPct: 0.1, loadCapacity: 4, shield: -4 },
      weightDelta: 3,
      summaryText: '+10% Heat Venting, +4 Load Cap / +3 WT, -4 Shield',
    },
  },
  optics: {
    moonstone: {
      delta: { shield: 8, lockAccuracyPct: 0.05, heatVentingPct: -0.02 },
      weightDelta: 0,
      summaryText: '+8 Shield, +5% Lock Accuracy / -2% Heat Venting',
    },
    spinel: {
      delta: { lockAccuracyPct: 0.07, staggerDamagePct: 0.05, heatVentingPct: -0.02 },
      weightDelta: 0,
      summaryText: '+7% Lock Accuracy, +5% Stagger Dmg / -2% Heat Venting',
    },
    carnelian: {
      delta: { staggerDamagePct: 0.09, stability: 4, lockAccuracyPct: -0.03 },
      weightDelta: 0,
      summaryText: '+9% Stagger Dmg, +4 Stability / -3% Lock Accuracy',
    },
    titanite: {
      delta: { shield: 6, lockAccuracyPct: 0.06, heatVentingPct: -0.02 },
      weightDelta: 0,
      summaryText: '+6 Shield, +6% Lock Accuracy / -2% Heat Venting',
    },
    demantoid: {
      delta: { cooldownPct: -0.06, lockAccuracyPct: 0.05, staggerDamagePct: -0.03 },
      weightDelta: 0,
      summaryText: '-6% Cooldowns, +5% Lock Accuracy / -3% Stagger Dmg',
    },
    kyanite: {
      delta: { lightRadius: 0.6, lockAccuracyPct: 0.08, stability: -2 },
      weightDelta: 0,
      summaryText: '+0.6 Light, +8% Lock Accuracy / -2 Stability',
    },
    charoite: {
      delta: { lightRadius: 0.6, staggerDamagePct: 0.08, stability: -3 },
      weightDelta: 0,
      summaryText: '+0.6 Light, +8% Stagger Dmg / -3 Stability',
    },
    rubellite: {
      delta: { staggerDamagePct: 0.08, cooldownPct: -0.04, stability: -2 },
      weightDelta: 0,
      summaryText: '+8% Stagger Dmg, -4% Cooldowns / -2 Stability',
    },
    hematite: {
      delta: { lockAccuracyPct: 0.06, heatVentingPct: 0.04, shield: -3 },
      weightDelta: 0,
      summaryText: '+6% Lock Accuracy, +4% Heat Venting / -3 Shield',
    },
  },
};

/**
 * Returns a concise slot-adaptive summary of what socketing a Gemstone into a given hardware slot does.
 * - For Exterior Armor (`'plating' | 'head' | 'arms'`), returns the exact §5 Per-Slot Gemstone Harmonic payload.
 * - For `reactor` (`1G–2G`) and `optics` (`1G`), returns the exact Internal Sub-Systems Spec §4 Gemstone Tuning payload.
 * - For `0G` mechanical/electronic hardware (`sensoryA`, `sensoryB`, `actuators`, `legs`), returns a clear `0G` notice.
 */
export function getHardwareGemBonusDescription(
  slot: CanonicalHardwareItemDefinition['slot'],
  gem: GemId
): string {
  if (slot === 'plating' || slot === 'head' || slot === 'arms') {
    return getPerSlotGemstoneHarmonicText(slot, gem);
  }
  if (slot === 'reactor' || slot === 'optics') {
    return SUBSYSTEM_GEM_TUNING_TABLE[slot][gem]?.summaryText || 'Sub-System Harmonic Conduit';
  }
  return '0G Pure Mechanical / Electronic Hardware (No Gemstone Sockets)';
}

/**
 * Finds a canonical hardware item by its ID, display name, or Gem-modified composite instance ID
 * (`<baseId>::<gem1>+<gem2>`).
 * - For Exterior Armor (`'plating' | 'head' | 'arms'`), runs the §6.1 5-Step Socket Calculation Engine:
 *   - Step 1: Duplicate Gemstone Diminishing Returns (`100% -> 70% -> 40%`)
 *   - Step 2: Piece-Local Combo Detection (Tier 3 Triad or Tier 2 Pair)
 *   - Step 3: Reactor Core Harmonic Resonance (`+20%` positive when matching active `ReactorFamily`, plus `+10%` Prismatic Universal Affinity on `'head' | 'arms'`)
 *   - Step 4: Final Per-Socket Stat Calculation & Rounding
 * - For Internal Sub-Modules:
 *   - `0G` hardware (`sensoryA`, `sensoryB`, `actuators`, `legs`, or `maxGemSlots === 0`) rejects all socketed gemstones and returns the unmodified `baseItem`.
 *   - `reactor` (`1G–2G`) and `optics` (`1G`) apply the Section 4 `SUBSYSTEM_GEM_TUNING_TABLE` with `[1.0, 0.7]` duplicate diminishing returns on `2G` Reactors and enforce `0` Armor (`durability: 0, rating: 0, threshold: 0`).
 */
export function findHardwareItemByNameOrId(
  nameOrId: string | undefined | null,
  options?: {
    reactorFamily?: string | null;
    prismaticUniversalAffinity?: boolean;
  }
): CanonicalHardwareItemDefinition | undefined {
  if (!nameOrId) return undefined;

  const { baseId, installedGems, slotGems } = parseEquipmentInstanceId(nameOrId);
  const norm = baseId.trim().toLowerCase();
  const baseItem = CANONICAL_HARDWARE_CATALOG.find(
    (item) =>
      item.id.toLowerCase() === norm ||
      item.name.toLowerCase() === norm ||
      item.legacyNames?.some((legacy) => legacy.toLowerCase() === norm)
  );
  if (!baseItem) return undefined;
  if (installedGems.length === 0) return baseItem;

  const baseWeight = getHardwareBaseWeight(baseItem);
  const baseCap = getHardwareCapacityBonus(baseItem);
  const canonicalCompositeId = buildEquipmentInstanceId(
    baseItem.id,
    slotGems.length > 0 ? slotGems : installedGems
  );

  // ─── Exterior Armor 5-Step Socket Calculation Engine (§5 & §6) ──────────────
  if (baseItem.slot === 'plating' || baseItem.slot === 'head' || baseItem.slot === 'arms') {
    const gemSocketsCount: 2 | 3 = baseItem.maxGemSlots === 3 ? 3 : 2;
    const socketArray = slotGems.length > 0 ? slotGems : installedGems;
    const evalResult = evaluateExteriorArmorPieceSockets(
      {
        id: baseItem.id,
        slot: baseItem.slot,
        gemSockets: gemSocketsCount,
      },
      socketArray,
      {
        reactorFamily: options?.reactorFamily,
        prismaticUniversalAffinity: options?.prismaticUniversalAffinity,
      }
    );

    const gemDelta = evalResult.totalGemAndComboDelta;
    const combinedPieceModifiers = sumStatDeltas(baseItem.baseModifiers, gemDelta);

    const extraArmorDurability = gemDelta.armorDurability ?? 0;
    const extraArmorRating = gemDelta.armorRating ?? 0;
    const extraArmorThreshold = gemDelta.armorThreshold ?? 0;
    const extraShield = gemDelta.shieldCapacity ?? 0;
    const extraStability = (gemDelta.stability ?? 0) + (gemDelta.chargeStability ?? 0);
    const extraCapacity = gemDelta.loadCapacity ?? 0;
    const extraWeight = gemDelta.effectiveWeightDelta ?? 0;
    const extraLight = (gemDelta.lightRadiusM ?? 0) + (gemDelta.opticsRangeM ?? 0);

    const moveSpeedMult = (baseItem.moveSpeedMult ?? 1.0) * (1 + (gemDelta.moveSpeedPct ?? 0));
    const heatVentMult =
      (baseItem.heatVentMult ?? 1.0) * (1 + (gemDelta.heatDissipationPct ?? 0));
    const tellDurationMult =
      (baseItem.tellDurationMult ?? 1.0) * Math.max(0.5, 1 - (gemDelta.meleeTempoPct ?? 0));
    const cooldownMult =
      (baseItem.cooldownMult ?? 1.0) *
      Math.max(
        0.5,
        1 -
          ((gemDelta.reloadDrawSpeedPct ?? 0) * 0.5 +
            (gemDelta.heatCostPct ? -gemDelta.heatCostPct * 0.5 : 0))
      );
    const accuracyMult =
      (baseItem.accuracyMult ?? 1.0) *
      (1 +
        (gemDelta.lockOnSpeedPct ?? 0) * 0.5 +
        (gemDelta.projectileTrackingPct ?? 0) * 0.5 +
        (gemDelta.recoilControlPct ?? 0) * 0.5);

    const comboLabel = evalResult.activeCombo ? `[${evalResult.activeCombo.name}]` : null;
    const deltaBadges = formatStatDeltaBadges(gemDelta);

    return {
      ...baseItem,
      id: canonicalCompositeId,
      name: formatModifiedEquipmentName(baseItem.name, installedGems),
      weight: Math.max(1, baseWeight + extraWeight),
      capacityBonus:
        baseCap + extraCapacity !== 0 ? baseCap + extraCapacity : baseItem.capacityBonus,
      baseLoadCapacityNumber: baseItem.baseLoadCapacityNumber,
      baseModifiers: combinedPieceModifiers,
      socketEvalResult: evalResult,
      drawbackDescription: [
        baseItem.drawbackDescription,
        comboLabel,
        deltaBadges.length > 0 ? deltaBadges.join(', ') : null,
      ]
        .filter(Boolean)
        .join(' · '),
      shieldBonus: Math.max(0, (baseItem.shieldBonus ?? 0) + extraShield),
      armorDurability: Math.max(1, (baseItem.armorDurability ?? 0) + extraArmorDurability),
      armorRating: Math.max(0, (baseItem.armorRating ?? 0) + extraArmorRating),
      armorThreshold: Math.max(0, (baseItem.armorThreshold ?? 0) + extraArmorThreshold),
      lightBonus:
        (baseItem.lightBonus ?? 0) + extraLight !== 0
          ? Number(((baseItem.lightBonus ?? 0) + extraLight).toFixed(2))
          : baseItem.lightBonus,
      stabilityBonus:
        (baseItem.stabilityBonus ?? 0) + extraStability !== 0
          ? (baseItem.stabilityBonus ?? 0) + extraStability
          : baseItem.stabilityBonus,
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
    };
  }

  // ─── Internal Chassis Sub-Modules (§4: Only `reactor` 1G-2G & `optics` 1G accept gems) ───
  const maxAllowedSubSystemGems = baseItem.maxGemSlots ?? 0;
  if (
    maxAllowedSubSystemGems === 0 ||
    (baseItem.slot !== 'reactor' && baseItem.slot !== 'optics')
  ) {
    // Hard validation guard (§4): 0G slots never apply gemstone effects
    return baseItem;
  }

  const activeSubSystemGems = installedGems.slice(0, maxAllowedSubSystemGems);
  if (activeSubSystemGems.length === 0) return baseItem;

  const validSlotGems: Array<GemId | null> =
    slotGems.length > 0
      ? slotGems.slice(0, maxAllowedSubSystemGems)
      : activeSubSystemGems;
  const clampedCompositeId = buildEquipmentInstanceId(baseItem.id, validSlotGems);

  let extraShield = 0;
  let extraLight = 0;
  let extraWeight = 0;
  let extraCapacity = 0;
  let extraStability = 0;
  let heatVentPctDelta = 0;
  let cooldownPctDelta = 0;
  let lockAccuracyPctDelta = 0;
  let staggerDamagePctDelta = 0;
  const drawbackNotes: string[] = [];
  const copyCounts = new Map<GemId, number>();

  for (const gem of activeSubSystemGems) {
    const tuning = SUBSYSTEM_GEM_TUNING_TABLE[baseItem.slot][gem];
    if (!tuning) continue;
    const prevCopies = copyCounts.get(gem) ?? 0;
    // §4: Duplicate Diminishing Returns on 2G Reactors: [1.0, 0.7] scaling
    const scale = prevCopies === 0 ? 1.0 : 0.7;
    copyCounts.set(gem, prevCopies + 1);

    const d = tuning.delta;
    if (d.shield) extraShield += Math.round(d.shield * scale);
    if (d.lightRadius) extraLight += Number((d.lightRadius * scale).toFixed(2));
    if (d.loadCapacity) extraCapacity += Math.round(d.loadCapacity * scale);
    if (d.stability) extraStability += Math.round(d.stability * scale);
    if (d.heatVentingPct) heatVentPctDelta += d.heatVentingPct * scale;
    if (d.cooldownPct) cooldownPctDelta += d.cooldownPct * scale;
    if (d.lockAccuracyPct) lockAccuracyPctDelta += d.lockAccuracyPct * scale;
    if (d.staggerDamagePct) staggerDamagePctDelta += d.staggerDamagePct * scale;
    extraWeight += Math.round(tuning.weightDelta * scale);

    const scaleSuffix = scale < 1.0 ? ' (70% Dup)' : '';
    drawbackNotes.push(`${tuning.summaryText}${scaleSuffix}`);
  }

  const heatVentMult = (baseItem.heatVentMult ?? 1.0) * (1 + heatVentPctDelta);
  const cooldownMult = (baseItem.cooldownMult ?? 1.0) * (1 + cooldownPctDelta);
  const accuracyMult = (baseItem.accuracyMult ?? 1.0) * (1 + lockAccuracyPctDelta);
  const staggerDamageMult =
    (baseItem.staggerDamageMult ?? 1.0) * (1 + staggerDamagePctDelta);

  return {
    ...baseItem,
    id: clampedCompositeId,
    name: formatModifiedEquipmentName(baseItem.name, activeSubSystemGems),
    weight: Math.max(1, baseWeight + extraWeight),
    capacityBonus:
      baseCap + extraCapacity !== 0 ? baseCap + extraCapacity : baseItem.capacityBonus,
    drawbackDescription: [baseItem.drawbackDescription, ...drawbackNotes]
      .filter(Boolean)
      .join(' · '),
    shieldBonus:
      (baseItem.shieldBonus || 0) + extraShield !== 0
        ? Math.max(0, (baseItem.shieldBonus || 0) + extraShield)
        : baseItem.shieldBonus,
    // Spec §1 Rule 2 & §4: Internal Chassis Modules MUST always have 0 Armor
    armorDurability: undefined,
    armorRating: undefined,
    armorThreshold: undefined,
    lightBonus:
      (baseItem.lightBonus || 0) + extraLight > 0
        ? Number(((baseItem.lightBonus || 0) + extraLight).toFixed(2))
        : baseItem.lightBonus,
    stabilityBonus:
      (baseItem.stabilityBonus || 0) + extraStability !== 0
        ? (baseItem.stabilityBonus || 0) + extraStability
        : baseItem.stabilityBonus,
    heatVentMult:
      Math.abs(heatVentMult - 1.0) > 0.001
        ? Number(heatVentMult.toFixed(3))
        : baseItem.heatVentMult,
    cooldownMult:
      Math.abs(cooldownMult - 1.0) > 0.001
        ? Number(cooldownMult.toFixed(3))
        : baseItem.cooldownMult,
    accuracyMult:
      Math.abs(accuracyMult - 1.0) > 0.001
        ? Number(accuracyMult.toFixed(3))
        : baseItem.accuracyMult,
    staggerDamageMult:
      Math.abs(staggerDamageMult - 1.0) > 0.001
        ? Number(staggerDamageMult.toFixed(3))
        : baseItem.staggerDamageMult,
  };
}

/**
 * Resolves the pilot's active Frame Plating, Dome Plate + Optics/Sensory, Aperture Plate + Actuators,
 * Reactor Core, and Leg Actuators stats dynamically from equipped gear.
 * Enforces physical intuition (§1) and the 5-Step Socket Calculation Engine (§6.1):
 * - ONLY exterior armor plating (`plating`, `head`, `arms`) and physical/ward shields grant Armor Threshold, Armor Rating, and Armor Durability.
 * - Evaluates Reactor Core first so `reactorFamily` (`Ichor` | `Mana` | `Ether`) provides the `+20%` Tier 1 Reactor Core Harmonic Resonance to matching exterior armor gems.
 * - Evaluates Core Frame (`plating`) first so `prismatic_core` Triad propagates `+10%` Prismatic Universal Affinity to Head and Arms.
 * - Clamps cumulative combat tempo & stride speed modifiers to `[-0.30, +0.30]` (`0.70x` to `1.30x` — §6.1 Step 5).
 */
export function resolveEquippedHardwareStats(state: OrionState): {
  baseLoadCapacity: FrameLoadCapacity;
  baseLoadCapacityNumber: number;
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
  chargeMassPct: number;
  chargeStabilityBonus: number;
  heatCapacityBonus: number;
  shieldRechargeRateMult: number;
  shieldRechargeDelayMult: number;
  parryWindowBonusSec: number;
  supportRepairPowerMult: number;
  armorRepairEfficiencyMult: number;
  effectiveWeightDelta: number;
  prismaticUniversalAffinity: boolean;
  enablesInertiaHud: boolean;
  activeArmorCombos: Array<{ slot: 'plating' | 'head' | 'arms'; combo: ArmorGemResonanceCombo }>;
} {
  const fallbackProfile = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;

  const equippedReactorItem = findHardwareItemByNameOrId(state.equipmentSlots?.reactorCore);
  const reactorFamily: 'Ichor' | 'Mana' | 'Ether' =
    equippedReactorItem?.reactorFamily || state.reactor || fallbackProfile.reactor || 'Ichor';

  // Evaluate Core Frame first to detect Prismatic Core Triad (`prismaticUniversalAffinity`)
  const equippedTorsoItem = findHardwareItemByNameOrId(state.equipmentSlots?.plating, {
    reactorFamily,
    prismaticUniversalAffinity: false,
  });
  const prismaticUniversalAffinity =
    equippedTorsoItem?.socketEvalResult?.activeCombo?.id === 'prismatic_core';

  const equippedHeadItem = findHardwareItemByNameOrId(state.equipmentSlots?.head, {
    reactorFamily,
    prismaticUniversalAffinity,
  });
  const equippedArmsItem = findHardwareItemByNameOrId(state.equipmentSlots?.arms, {
    reactorFamily,
    prismaticUniversalAffinity,
  });

  const equippedOpticsItem = findHardwareItemByNameOrId(state.equipmentSlots?.headOptics);
  const equippedActuatorsItem = findHardwareItemByNameOrId(state.equipmentSlots?.armActuators);
  const equippedLegsItem = findHardwareItemByNameOrId(state.equipmentSlots?.legs);
  const equippedSensoryA = findHardwareItemByNameOrId(state.equipmentSlots?.sensoryA);
  const equippedSensoryB = findHardwareItemByNameOrId(state.equipmentSlots?.sensoryB);

  const baseLoadCapacity: FrameLoadCapacity =
    equippedTorsoItem?.baseLoadCapacity ||
    (fallbackProfile.weightClass as FrameLoadCapacity) ||
    'medium';

  const defaultLoadCapByClass =
    baseLoadCapacity === 'superheavy'
      ? 140
      : baseLoadCapacity === 'heavy'
        ? 112
        : baseLoadCapacity === 'light'
          ? 84
          : 90;

  const baseLoadCapacityNumber =
    equippedTorsoItem?.baseLoadCapacityNumber ?? defaultLoadCapByClass;

  const armorType: 'Ablative' | 'Reactive' | 'Hardened' | 'Layered' =
    equippedTorsoItem?.armorType || fallbackProfile.baseArmor?.type || 'Reactive';

  // Only exterior plating (Frame Plating, Dome Plate, Aperture Plate) contributes to Armor Threshold & Rating
  const armorThreshold = Math.max(
    0,
    (equippedTorsoItem?.armorThreshold ?? fallbackProfile.baseArmor?.threshold ?? 6) +
      (equippedHeadItem?.armorThreshold ?? 0) +
      (equippedArmsItem?.armorThreshold ?? 0)
  );

  const armorRating = Math.max(
    0,
    (equippedTorsoItem?.armorRating ?? fallbackProfile.baseArmor?.rating ?? 10) +
      (equippedHeadItem?.armorRating ?? 0) +
      (equippedArmsItem?.armorRating ?? 0)
  );

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

  // Aggregate combined Exterior Armor StatDeltas (baseModifiers + socketed gem & combo deltas)
  const combinedExteriorModifiers = sumStatDeltas(
    equippedTorsoItem?.baseModifiers,
    equippedHeadItem?.baseModifiers,
    equippedArmsItem?.baseModifiers
  );

  // §6.1 Step 5: Global Clamp on cumulative combat tempo and stride speed modifiers to [0.70, 1.30]
  moveSpeedMult = Math.max(0.7, Math.min(1.3, moveSpeedMult));
  tellDurationMult = Math.max(0.7, Math.min(1.3, tellDurationMult));

  const activeArmorCombos: Array<{
    slot: 'plating' | 'head' | 'arms';
    combo: ArmorGemResonanceCombo;
  }> = [];
  if (equippedTorsoItem?.socketEvalResult?.activeCombo) {
    activeArmorCombos.push({
      slot: 'plating',
      combo: equippedTorsoItem.socketEvalResult.activeCombo,
    });
  }
  if (equippedHeadItem?.socketEvalResult?.activeCombo) {
    activeArmorCombos.push({
      slot: 'head',
      combo: equippedHeadItem.socketEvalResult.activeCombo,
    });
  }
  if (equippedArmsItem?.socketEvalResult?.activeCombo) {
    activeArmorCombos.push({
      slot: 'arms',
      combo: equippedArmsItem.socketEvalResult.activeCombo,
    });
  }

  const enablesInertiaHud = Boolean(
    equippedSensoryB?.enablesInertiaHud ||
      equippedSensoryA?.enablesInertiaHud
  );

  return {
    baseLoadCapacity,
    baseLoadCapacityNumber,
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
    chargeMassPct: combinedExteriorModifiers.chargeMassPct ?? 0,
    chargeStabilityBonus: combinedExteriorModifiers.chargeStability ?? 0,
    heatCapacityBonus: combinedExteriorModifiers.heatCapacity ?? 0,
    shieldRechargeRateMult: Number(
      (1 + (combinedExteriorModifiers.shieldRechargeRatePct ?? 0)).toFixed(3)
    ),
    shieldRechargeDelayMult: Number(
      Math.max(0.4, 1 + (combinedExteriorModifiers.shieldRechargeDelayPct ?? 0)).toFixed(3)
    ),
    parryWindowBonusSec: combinedExteriorModifiers.parryWindowSec ?? 0,
    supportRepairPowerMult: Number(
      (1 + (combinedExteriorModifiers.supportRepairPowerPct ?? 0)).toFixed(3)
    ),
    armorRepairEfficiencyMult: Number(
      (1 + (combinedExteriorModifiers.armorRepairEfficiencyPct ?? 0)).toFixed(3)
    ),
    effectiveWeightDelta: combinedExteriorModifiers.effectiveWeightDelta ?? 0,
    prismaticUniversalAffinity,
    enablesInertiaHud,
    activeArmorCombos,
  };
}



