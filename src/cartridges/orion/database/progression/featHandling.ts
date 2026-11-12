/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FeatTier,
  FrameFeatDefinition,
  OrionState,
  PilotSkillId,
  WeaponCategory,
  WeaponDefinition,
} from '../../types';
import { TRAIT_REGISTRY } from '../characters';
import {
  CanonicalHardwareItemDefinition,
  findHardwareItemByNameOrId,
} from '../equipment/chassis_hardware';
import { parseEquipmentInstanceId } from '../equipment/mod_naming';
import { getWeaponDefinition, isLauncherEquipment, isTwoHandWeapon } from '../equipment/weapons';
import { CANONICAL_FRAME_FEAT_CATALOG } from './canonical_feats';

/**
 * Keyed lookup map of all canonical Frame Feats (`96` feats + `knights_oath`) by feat ID.
 */
export const CANONICAL_FRAME_FEAT_REGISTRY: Record<string, FrameFeatDefinition> = Object.fromEntries(
  CANONICAL_FRAME_FEAT_CATALOG.map((feat) => [feat.id, feat])
);

export { CANONICAL_FRAME_FEAT_CATALOG };

/**
 * Discipline arm metadata for the 6-Arm Hexagonal Feat Constellation (`N`, `NE`, `SE`, `S`, `SW`, `NW`).
 */
export interface DisciplineArmMeta {
  skillId: PilotSkillId;
  armIndex: number;
  compassCode: 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW';
  shortLabel: string;
  fullLabel: string;
  angleDeg: number;
  color: string;
}

/**
 * Canonical 6 radial discipline arms around the central Reactor Core (`0°` = East, `-90°` = North).
 */
export const CONSTELLATION_DISCIPLINE_ARMS: DisciplineArmMeta[] = [
  {
    skillId: 'Warrior',
    armIndex: 0,
    compassCode: 'N',
    shortLabel: 'ASSAULT & TURBINE',
    fullLabel: 'N · ASSAULT BALLISTICS & TURBINE',
    angleDeg: -90,
    color: '#38bdf8',
  },
  {
    skillId: 'Marauder',
    armIndex: 1,
    compassCode: 'NE',
    shortLabel: 'ORDNANCE & SIEGE',
    fullLabel: 'NE · HEAVY ORDNANCE & SIEGE',
    angleDeg: -30,
    color: '#f97316',
  },
  {
    skillId: 'Guardian',
    armIndex: 2,
    compassCode: 'SE',
    shortLabel: 'AEGIS & VANGUARD',
    fullLabel: 'SE · AEGIS BARRIER & VANGUARD',
    angleDeg: 30,
    color: '#a855f7',
  },
  {
    skillId: 'Cleric',
    armIndex: 3,
    compassCode: 'S',
    shortLabel: 'HARMONIC & TRIAGE',
    fullLabel: 'S · HARMONIC SUPPORT & TRIAGE',
    angleDeg: 90,
    color: '#22c55e',
  },
  {
    skillId: 'Wizard',
    armIndex: 4,
    compassCode: 'SW',
    shortLabel: 'BEAM & ARTILLERY',
    fullLabel: 'SW · BEAM & WAVE ARTILLERY',
    angleDeg: 150,
    color: '#eab308',
  },
  {
    skillId: 'Rogue',
    armIndex: 5,
    compassCode: 'NW',
    shortLabel: 'RECON & STEALTH',
    fullLabel: 'NW · RECON, STEALTH & CQC',
    angleDeg: -150,
    color: '#f43f5e',
  },
];

/**
 * Concentric ring radii (`px` in SVG constellation coordinates) for `Tier I` through `Tier V`.
 */
export const CONSTELLATION_TIER_RADII: Record<FeatTier, number> = {
  I: 74,
  II: 132,
  III: 192,
  IV: 252,
  V: 312,
};

/**
 * Role of a Feat node in governing equipment prerequisites and handling proficiency.
 */
export type FeatEquipmentHandlingRole = 'prerequisite' | 'proficiency';

/**
 * Plotted node descriptor for one of the 96 canonical feats on the 6-Arm Hexagonal Constellation.
 */
export interface FeatConstellationNode {
  index: number;
  feat: FrameFeatDefinition;
  skillId: PilotSkillId;
  tier: FeatTier;
  ringOrder: number;
  armIndex: number;
  armColor: string;
  compassCode: string;
  x: number;
  y: number;
  angleDeg: number;
  radiusPx: number;
  isCoreNode: boolean;
  handlingRole: FeatEquipmentHandlingRole;
  handlingSummary: string;
  targetEquipmentClasses: string[];
}

/**
 * Directed constellation edge connecting two `FeatConstellationNode` entries by `feat.id`.
 */
export interface FeatConstellationEdge {
  fromFeatId: string;
  toFeatId: string;
  kind: 'spine' | 'branch' | 'bridge';
  color: string;
}

/**
 * Key prerequisite feats that gate heavy/specialty equipment classes or stances.
 */
export const PREREQUISITE_HANDLING_FEAT_MAP: Record<
  string,
  { summary: string; classes: string[] }
> = {
  siege_stability: {
    summary: 'Unlocks Heavy/Super-Heavy Chassis & Heavy Ordnance (+1 Load Step)',
    classes: ['Carriers & Munitions', 'Impact & Axes', 'Heavy Plating'],
  },
  booster_evasion: {
    summary: 'Unlocks Heavy Blades, Bows & High-Thrust Mobility Kits',
    classes: ['Blades: Straight', 'Blades: Curved', 'Bows'],
  },
  momentum_guard: {
    summary: 'Unlocks Heavy Polearms & Assault Frame Bracing',
    classes: ['Spears', 'Impact & Axes'],
  },
  shield_charge: {
    summary: 'Unlocks Heavy Shields, Great Lances & Vanguard Bashes',
    classes: ['Shields', 'Spears'],
  },
  anchored_action: {
    summary: 'Unlocks Stabilizer Striders & Anchored Shield Stances',
    classes: ['Shields', 'Heavy Legs'],
  },
  shadow_step: {
    summary: 'Unlocks Recon Stealth Cloaks, Phase Modules & Precision Bows',
    classes: ['Blades: Curved', 'Blades: Straight', 'Bows'],
  },
  phantom_strike: {
    summary: 'Unlocks Stealth Energy Blades & Suppressed Casters',
    classes: ['Blades: Straight', 'Casters'],
  },
  beam_focus: {
    summary: 'Unlocks Heavy Beam, Stellar & Meteoric Casters',
    classes: ['Casters'],
  },
  reactive_healing: {
    summary: 'Unlocks Sanctum Support Platings, Wave Scepters & Restoration Fields',
    classes: ['Casters', 'Impact & Axes', 'Support Reactor'],
  },
  sidearm_twin_link: {
    summary: 'Unlocks Dual-Wield Sidearm Twin-Link Strikes',
    classes: ['Blades: Straight', 'Blades: Curved', 'Casters'],
  },
  suppression_link: {
    summary: 'Unlocks Twin-Link Ranged Suppression Volleys',
    classes: ['Casters', 'Carriers & Munitions'],
  },
  suppression_chainfire: {
    summary: 'Unlocks Heavy Siege Launchers & Sustained Racks (+1 Load Step)',
    classes: ['Carriers & Munitions', 'Casters'],
  },
  shielded_volley: {
    summary: 'Unlocks Firing Sidearms While Raising a Physical/Energy Shield',
    classes: ['Shields', 'Casters'],
  },
  sidearm_parry: {
    summary: 'Unlocks Active Defensive Parrying with 1H Sidearms',
    classes: ['Blades: Straight', 'Blades: Curved'],
  },
  radiant_cleave: {
    summary: 'Unlocks 180° Mana-Wave Cleaves on Main-Slot Melee Weapons',
    classes: ['Spears', 'Blades: Straight', 'Impact & Axes'],
  },
  main_weapon_twin_link: {
    summary: 'Unlocks 1H Handling Override for 2H Main Weapons & Quad-Link Fire',
    classes: ['Casters', 'Spears', 'Blades: Straight', 'Impact & Axes'],
  },
  unyielding_bulwark: {
    summary: 'Unlocks Super-Heavy Shielding & 1H Grip on 2H Weapons (+1 Load Step)',
    classes: ['Shields', 'Heavy Plating', 'Spears'],
  },
  unfaltering: {
    summary: 'Unlocks Super-Heavy Frame Clearance & 1H Grip on 2H Weapons (+1 Load Step)',
    classes: ['Heavy Plating', 'Spears', 'Impact & Axes'],
  },
  salvo_link: {
    summary: 'Unlocks Twin-Link Heavy Salvo Ordnance & +1 Load Step',
    classes: ['Carriers & Munitions', 'Casters'],
  },
  multi_lock_array: {
    summary: 'Unlocks Multi-Target Salvo Homing on Artillery & Missile Racks',
    classes: ['Carriers & Munitions'],
  },
};

function inferEquipmentClassesForFeat(feat: FrameFeatDefinition): {
  handlingRole: FeatEquipmentHandlingRole;
  handlingSummary: string;
  targetEquipmentClasses: string[];
} {
  const explicit = PREREQUISITE_HANDLING_FEAT_MAP[feat.id];
  if (explicit) {
    return {
      handlingRole: 'prerequisite',
      handlingSummary: explicit.summary,
      targetEquipmentClasses: explicit.classes,
    };
  }
  if (feat.loadStepUp && feat.loadStepUp > 0) {
    return {
      handlingRole: 'prerequisite',
      handlingSummary: `System Prerequisite: +${feat.loadStepUp} Load Step & Heavy Equipment Clearance`,
      targetEquipmentClasses: ['Heavy Weapons', 'Heavy Chassis'],
    };
  }

  const reqLower = (feat.requiredEquipment || '').toLowerCase();
  const classes: string[] = [];
  if (reqLower.includes('shield')) classes.push('Shields');
  if (reqLower.includes('beam') || reqLower.includes('energy weapon')) classes.push('Casters');
  if (reqLower.includes('suppression') || reqLower.includes('intercept')) {
    classes.push('Casters', 'Carriers & Munitions');
  }
  if (reqLower.includes('launcher') || reqLower.includes('artillery')) {
    classes.push('Carriers & Munitions');
  }
  if (reqLower.includes('melee') || reqLower.includes('parry') || reqLower.includes('sidearm')) {
    classes.push('Blades: Straight', 'Blades: Curved', 'Spears', 'Impact & Axes');
  }
  if (reqLower.includes('heavy')) {
    classes.push('Impact & Axes', 'Carriers & Munitions', 'Heavy Plating');
  }
  if (classes.length === 0) {
    switch (feat.requiredSkillId) {
      case 'Warrior':
        classes.push('Blades: Straight', 'Bows', 'Casters');
        break;
      case 'Marauder':
        classes.push('Impact & Axes', 'Carriers & Munitions');
        break;
      case 'Guardian':
        classes.push('Shields', 'Spears');
        break;
      case 'Cleric':
        classes.push('Impact & Axes', 'Casters');
        break;
      case 'Wizard':
        classes.push('Casters', 'Spears');
        break;
      case 'Rogue':
        classes.push('Blades: Curved', 'Blades: Straight', 'Bows');
        break;
    }
  }

  return {
    handlingRole: 'proficiency',
    handlingSummary: `Handling Proficiency (${classes.slice(0, 2).join(' / ')}): -10% Heat, +8% Stability, -10% Swap`,
    targetEquipmentClasses: Array.from(new Set(classes)),
  };
}

/**
 * Deterministic 96-Node 6-Arm Hexagonal Constellation Layout.
 * Plots all 96 canonical feats (`95` Tier I–V feats + `knights_oath` at `(0,0)`) onto radial discipline arms
 * and concentric tier rings (`Tier I` inner ring to `Tier V` outer ring).
 */
export const FEAT_CONSTELLATION_NODES: FeatConstellationNode[] = (() => {
  const nodes: FeatConstellationNode[] = [];
  const tierOrderMap: Record<FeatTier, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 };

  // 1. Place Knight's Oath at the central Sanctum Reactor Core (0, 0)
  const coreFeat = CANONICAL_FRAME_FEAT_CATALOG.find((f) => f.id === 'knights_oath');
  if (coreFeat) {
    nodes.push({
      index: 0,
      feat: coreFeat,
      skillId: coreFeat.requiredSkillId,
      tier: coreFeat.tier,
      ringOrder: 0,
      armIndex: 2,
      armColor: '#fde047',
      compassCode: 'CORE',
      x: 0,
      y: 0,
      angleDeg: 0,
      radiusPx: 0,
      isCoreNode: true,
      handlingRole: 'proficiency',
      handlingSummary: 'Core Sanctum Relic Feat: +10% Damage vs Camelot Enemies & Frame Resonance',
      targetEquipmentClasses: ['All Loadouts'],
    });
  }

  // 2. Group the remaining 95 feats by (skillId, tier) and fan them cleanly along each of the 6 arms
  for (const arm of CONSTELLATION_DISCIPLINE_ARMS) {
    for (const tier of ['I', 'II', 'III', 'IV', 'V'] as FeatTier[]) {
      const armTierFeats = CANONICAL_FRAME_FEAT_CATALOG.filter(
        (f) => f.id !== 'knights_oath' && f.requiredSkillId === arm.skillId && f.tier === tier
      );
      const count = armTierFeats.length;
      if (count === 0) continue;

      const baseRadius = CONSTELLATION_TIER_RADII[tier];
      // Spread nodes across the 60-degree sector (leave margin at sector borders so adjacent arms are distinct)
      const maxSpreadDeg = count <= 2 ? 18 : count === 3 ? 34 : 44;

      armTierFeats.forEach((feat, localIdx) => {
        const t = count === 1 ? 0 : localIdx / (count - 1) - 0.5;
        const offsetDeg = t * maxSpreadDeg;
        const angleDeg = arm.angleDeg + offsetDeg;
        const angleRad = (angleDeg * Math.PI) / 180;
        // Slight hex stagger in radius for middle vs wing nodes so hexes form a crystalline lattice
        const staggerR =
          count >= 3 && Math.abs(t) < 0.2 ? baseRadius - 6 : baseRadius + Math.abs(t) * 8;
        const x = Number((Math.cos(angleRad) * staggerR).toFixed(1));
        const y = Number((Math.sin(angleRad) * staggerR).toFixed(1));
        const handlingInfo = inferEquipmentClassesForFeat(feat);

        nodes.push({
          index: nodes.length,
          feat,
          skillId: arm.skillId,
          tier,
          ringOrder: tierOrderMap[tier],
          armIndex: arm.armIndex,
          armColor: arm.color,
          compassCode: arm.compassCode,
          x,
          y,
          angleDeg,
          radiusPx: staggerR,
          isCoreNode: false,
          handlingRole: handlingInfo.handlingRole,
          handlingSummary: handlingInfo.handlingSummary,
          targetEquipmentClasses: handlingInfo.targetEquipmentClasses,
        });
      });
    }
  }

  return nodes;
})();

/**
 * Directed constellation edges linking adjacent tiers along each discipline arm and central core.
 */
export const FEAT_CONSTELLATION_EDGES: FeatConstellationEdge[] = (() => {
  const edges: FeatConstellationEdge[] = [];
  const tiers: FeatTier[] = ['I', 'II', 'III', 'IV', 'V'];

  for (const arm of CONSTELLATION_DISCIPLINE_ARMS) {
    const tierGroups = tiers.map((t) =>
      FEAT_CONSTELLATION_NODES.filter(
        (n) => !n.isCoreNode && n.skillId === arm.skillId && n.tier === t
      )
    );

    // Connect Core to Tier I nodes
    for (const t1Node of tierGroups[0]) {
      edges.push({
        fromFeatId: 'knights_oath',
        toFeatId: t1Node.feat.id,
        kind: 'spine',
        color: arm.color,
      });
    }

    // Connect each Tier ring to the next Tier ring within the same arm
    for (let ti = 0; ti < tierGroups.length - 1; ti++) {
      const currentRing = tierGroups[ti];
      const nextRing = tierGroups[ti + 1];
      if (currentRing.length === 0 || nextRing.length === 0) continue;

      for (const target of nextRing) {
        // Connect to the angularly closest node in the previous tier ring
        let bestSource = currentRing[0];
        let bestDiff = Math.abs(target.angleDeg - bestSource.angleDeg);
        for (const cand of currentRing) {
          const diff = Math.abs(target.angleDeg - cand.angleDeg);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestSource = cand;
          }
        }
        edges.push({
          fromFeatId: bestSource.feat.id,
          toFeatId: target.feat.id,
          kind: bestDiff < 8 ? 'spine' : 'branch',
          color: arm.color,
        });
      }

      // Connect sibling nodes within the same tier ring for lateral lattice cohesion
      for (let i = 0; i < currentRing.length - 1; i++) {
        edges.push({
          fromFeatId: currentRing[i].feat.id,
          toFeatId: currentRing[i + 1].feat.id,
          kind: 'bridge',
          color: arm.color,
        });
      }
    }
  }

  return edges;
})();

/**
 * Proficiency tier for an equipment piece based on socketed Feats in the Feat Constellation.
 */
export type EquipmentProficiencyTier = 'locked' | 'baseline' | 'proficient' | 'mastered';

/**
 * Complete evaluation of how the pilot's socketed Feats affect a specific Weapon, Auxiliary, or Hardware item.
 */
export interface EquipmentFeatHandlingEvaluation {
  /** Whether the pilot meets the Feat prerequisite to equip this item in Loadout. */
  canEquip: boolean;
  /** Whether this item is an advanced/heavy piece that requires a Feat prerequisite (outside starter kit). */
  isFeatGatedItem: boolean;
  /** Current handling proficiency tier (`'locked'` | `'baseline'` | `'proficient'` | `'mastered'`). */
  proficiencyTier: EquipmentProficiencyTier;
  /** Short badge text for UI display (`"MASTERED"`, `"PROFICIENT"`, `"BASELINE"`, or `"REQUIRES FEAT"`). */
  badgeLabel: string;
  /** Concise human-readable explanation of current handling status and active bonuses or lock reason. */
  statusSummary: string;
  /** Recommended or required Feat definitions in the Feat Grid for this equipment piece. */
  relevantFeats: FrameFeatDefinition[];
  /** Subset of `relevantFeats` that are currently socketed by the pilot. */
  activeMatchingFeats: FrameFeatDefinition[];
  /** Primary Feat ID to focus when the player clicks `"Locate in Feat Grid"`. */
  recommendedFeatId: string;
  /** Handling combat modifiers granted by active matching feats. */
  handlingModifiers: {
    heatGenMult: number;
    stabilityBonus: number;
    swapTimeMult: number;
  };
}

function getRelevantFeatIdsForWeapon(w: WeaponDefinition): string[] {
  const cat: WeaponCategory = w.category || 'Blades: Straight';
  const ids: string[] = [];

  if (w.weightClass === 'heavy') {
    ids.push('siege_stability', 'suppression_chainfire', 'unyielding_bulwark', 'unfaltering');
  }
  if (isTwoHandWeapon(w)) {
    ids.push('main_weapon_twin_link', 'salvo_link', 'radiant_cleave');
  }

  switch (cat) {
    case 'Shields':
      ids.push(
        'shield_charge',
        'stabilizer_pulse',
        'anchored_action',
        'shielded_volley',
        'twin_guard',
        'protectors_aura',
        'hardening_light'
      );
      break;
    case 'Bows':
      ids.push(
        'booster_evasion',
        'surgical_precision',
        'radiant_intercept',
        'backstab_mastery',
        'assassinate'
      );
      break;
    case 'Casters':
      ids.push(
        'beam_focus',
        'sustained_channeling',
        'suppression_link',
        'phase_beam',
        'overcharge',
        'arcane_mastery',
        'purification_beam'
      );
      break;
    case 'Spears':
      ids.push(
        'momentum_guard',
        'shield_charge',
        'radiant_cleave',
        'overload_cleave',
        'cleave_suppression'
      );
      break;
    case 'Impact & Axes':
      ids.push(
        'siege_stability',
        'momentum_guard',
        'reactive_healing',
        'radiant_cleave',
        'overclock_guard'
      );
      break;
    case 'Blades: Curved':
      ids.push(
        'shadow_step',
        'booster_evasion',
        'sidearm_twin_link',
        'sidearm_parry',
        'backstab_mastery'
      );
      break;
    case 'Blades: Straight':
      ids.push(
        'booster_evasion',
        'phantom_strike',
        'sidearm_twin_link',
        'sidearm_parry',
        'cleave_counter'
      );
      break;
    case 'Carriers & Munitions':
      ids.push(
        'siege_stability',
        'suppression_chainfire',
        'guardians_interference',
        'disruption_field',
        'salvo_link',
        'multi_lock_array'
      );
      break;
  }

  return Array.from(new Set(ids));
}

function getRelevantFeatIdsForHardware(hw: CanonicalHardwareItemDefinition): string[] {
  const ids: string[] = [];
  if (hw.baseLoadCapacity === 'heavy' || hw.baseLoadCapacity === 'superheavy') {
    ids.push('siege_stability', 'anchored_action', 'unyielding_bulwark', 'unfaltering');
  }
  if (hw.armorType === 'Hardened' || hw.armorType === 'Layered') {
    ids.push('siege_stability', 'attrition_guard', 'overclock_guard', 'protectors_aura');
  }
  if (hw.reactorFamily === 'Mana') {
    ids.push('radiant_step', 'protectors_aura', 'reactive_healing', 'radiant_overflow');
  } else if (hw.reactorFamily === 'Ether') {
    ids.push('shadow_step', 'beam_focus', 'overcharge', 'phantom_strike');
  } else if (hw.reactorFamily === 'Ichor') {
    ids.push('booster_evasion', 'siege_stability', 'overclock_guard', 'core_overclock');
  }
  if (hw.slot === 'legs') {
    ids.push('booster_evasion', 'shadow_step', 'anchored_action');
  }
  if (hw.slot === 'optics' || hw.slot === 'sensoryA' || hw.slot === 'sensoryB') {
    ids.push('surgical_precision', 'beam_focus', 'multi_lock_array');
  }
  if (ids.length === 0) {
    ids.push('booster_evasion', 'momentum_guard', 'shield_charge');
  }
  return Array.from(new Set(ids));
}

/**
 * Evaluates hybrid equipment prerequisites and handling proficiency for any Weapon, Auxiliary, or Chassis Hardware item.
 * - Heavy/Siege weapons and Heavy Chassis armor require at least 1 matching prerequisite feat from the Feat Grid
 *   (unless part of the pilot's starting kit, already equipped, or in Cheat/Training mode).
 * - Basic/Light/Medium equipment can always be equipped, and socketing matching feats upgrades handling from
 *   `'baseline'` to `'proficient'` (1 feat) or `'mastered'` (2+ feats), granting heat, stability, and swap bonuses.
 */
export function evaluateEquipmentFeatHandling(
  state: OrionState,
  itemIdOrName: string | null | undefined
): EquipmentFeatHandlingEvaluation {
  const fallbackFeat = CANONICAL_FRAME_FEAT_CATALOG[0];
  if (!itemIdOrName) {
    return {
      canEquip: true,
      isFeatGatedItem: false,
      proficiencyTier: 'baseline',
      badgeLabel: 'BASELINE',
      statusSummary: 'Standard equipment handling.',
      relevantFeats: [fallbackFeat],
      activeMatchingFeats: [],
      recommendedFeatId: fallbackFeat.id,
      handlingModifiers: { heatGenMult: 1.0, stabilityBonus: 0, swapTimeMult: 1.0 },
    };
  }

  const baseId = parseEquipmentInstanceId(itemIdOrName).baseId;
  const wDef = getWeaponDefinition(itemIdOrName);
  const hwDef = !wDef ? findHardwareItemByNameOrId(itemIdOrName) : undefined;
  const equippedFeats = state.equippedFeats || [];
  const isCheat = state.room === '-4,0' || Boolean(state.bypassProgressionGates);

  // Check if item is part of the pilot's starting kit or currently equipped
  const kit = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;
  const isStarterItem =
    (kit.startingWeapons || []).includes(baseId) ||
    state.equipmentSlots?.slot1 === itemIdOrName ||
    state.equipmentSlots?.slot2 === itemIdOrName ||
    state.equipmentSlots?.slot3 === itemIdOrName ||
    state.equipmentSlots?.plating === itemIdOrName ||
    state.equipmentSlots?.head === itemIdOrName ||
    state.equipmentSlots?.arms === itemIdOrName ||
    state.equipmentSlots?.legs === itemIdOrName;

  const relevantIds = wDef
    ? getRelevantFeatIdsForWeapon(wDef)
    : hwDef
      ? getRelevantFeatIdsForHardware(hwDef)
      : ['booster_evasion'];

  const relevantFeats = relevantIds
    .map((id) => CANONICAL_FRAME_FEAT_CATALOG.find((f) => f.id === id))
    .filter((f): f is FrameFeatDefinition => Boolean(f));

  const activeMatchingFeats = relevantFeats.filter((f) => equippedFeats.includes(f.id));
  const recommendedFeat =
    relevantFeats.find((f) => !equippedFeats.includes(f.id)) ||
    relevantFeats[0] ||
    fallbackFeat;

  // Determine whether this item is Heavy / Siege / Advanced and therefore Feat-Gated
  const isHeavyWeapon = Boolean(
    wDef &&
      (wDef.weightClass === 'heavy' ||
        (isLauncherEquipment(wDef) && wDef.weightClass !== 'light'))
  );
  const isHeavyHardware = Boolean(
    hwDef && (hwDef.baseLoadCapacity === 'heavy' || hwDef.baseLoadCapacity === 'superheavy')
  );
  const isFeatGatedItem = isHeavyWeapon || isHeavyHardware;

  if (isFeatGatedItem && activeMatchingFeats.length === 0 && !isStarterItem && !isCheat) {
    const reqNames = relevantFeats
      .slice(0, 2)
      .map((f) => f.name)
      .join(' or ');
    return {
      canEquip: false,
      isFeatGatedItem: true,
      proficiencyTier: 'locked',
      badgeLabel: 'FEAT PREREQ REQUIRED',
      statusSummary: `Requires Feat Prerequisite (${reqNames}) in the Feat Grid to handle this heavy equipment.`,
      relevantFeats,
      activeMatchingFeats,
      recommendedFeatId: recommendedFeat.id,
      handlingModifiers: { heatGenMult: 1.15, stabilityBonus: -6, swapTimeMult: 1.2 },
    };
  }

  if (activeMatchingFeats.length >= 2) {
    return {
      canEquip: true,
      isFeatGatedItem,
      proficiencyTier: 'mastered',
      badgeLabel: 'MASTERED HANDLING',
      statusSummary: `Mastered via ${activeMatchingFeats.map((f) => f.name).join(' + ')} (-16% Heat, +12 Stability, -15% Swap).`,
      relevantFeats,
      activeMatchingFeats,
      recommendedFeatId: recommendedFeat.id,
      handlingModifiers: { heatGenMult: 0.84, stabilityBonus: 12, swapTimeMult: 0.85 },
    };
  }

  if (activeMatchingFeats.length === 1) {
    return {
      canEquip: true,
      isFeatGatedItem,
      proficiencyTier: 'proficient',
      badgeLabel: 'PROFICIENT HANDLING',
      statusSummary: `Proficient via ${activeMatchingFeats[0].name} (-10% Heat, +8 Stability, -10% Swap). Socket ${recommendedFeat.name} for Mastery.`,
      relevantFeats,
      activeMatchingFeats,
      recommendedFeatId: recommendedFeat.id,
      handlingModifiers: { heatGenMult: 0.9, stabilityBonus: 8, swapTimeMult: 0.9 },
    };
  }

  return {
    canEquip: true,
    isFeatGatedItem,
    proficiencyTier: 'baseline',
    badgeLabel: 'BASELINE HANDLING',
    statusSummary: `Unproficient baseline handling. Socket ${recommendedFeat.name} in the Feat Grid for -10% Heat & +8 Stability.`,
    relevantFeats,
    activeMatchingFeats,
    recommendedFeatId: recommendedFeat.id,
    handlingModifiers: { heatGenMult: 1.0, stabilityBonus: 0, swapTimeMult: 1.0 },
  };
}
