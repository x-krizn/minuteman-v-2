/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ConstellationUmbrellaId,
  FeatChainId,
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
import {
  getWeaponDefinition,
  isLauncherEquipment,
  isTwoHandWeapon,
  resolveWeaponFunctionalType,
} from '../equipment/weapons';
import {
  CANONICAL_FRAME_FEAT_CATALOG,
  FEAT_CHAIN_NAMES,
  LEGACY_CORE_FEAT_ID_MAP,
  normalizeCanonicalFeatId,
} from './canonical_feats';
import {
  evaluateActiveSpecialistStance,
  SPECIALIST_STANCE_BY_FEAT_ID,
  SPECIALIST_STANCE_LIST,
} from './specialistStances';

/**
 * Keyed lookup map of all 113 canonical Frame Feats (`90` Core + `22` Specialist + `knights_oath`) by feat ID,
 * plus legacy ID aliases for save compatibility.
 */
export const CANONICAL_FRAME_FEAT_REGISTRY: Record<string, FrameFeatDefinition> = (() => {
  const map: Record<string, FrameFeatDefinition> = Object.fromEntries(
    CANONICAL_FRAME_FEAT_CATALOG.map((feat) => [feat.id, feat])
  );
  for (const [legacyId, canonicalId] of Object.entries(LEGACY_CORE_FEAT_ID_MAP)) {
    if (map[canonicalId] && !map[legacyId]) {
      map[legacyId] = map[canonicalId];
    }
  }
  return map;
})();

/**
 * Re-exported canonical 113-node Frame Feat catalog and chain utilities.
 */
export { CANONICAL_FRAME_FEAT_CATALOG, FEAT_CHAIN_NAMES, normalizeCanonicalFeatId };

/**
 * Macro-hemisphere archetype umbrella metadata (`Fighter`, `Scholar`, `Rogue`).
 */
export interface ConstellationUmbrellaMeta {
  id: ConstellationUmbrellaId;
  label: string;
  sectors: [PilotSkillId, PilotSkillId];
  color: string;
  summary: string;
  theme: string;
}

/**
 * Canonical 3 Macro-Hemispheres / Archetype Umbrellas (`Project Orion — Feat System & Constellation Overhaul.md` §2 & §7).
 */
export const CONSTELLATION_UMBRELLAS: ConstellationUmbrellaMeta[] = [
  {
    id: 'Fighter',
    label: 'FIGHTER UMBRELLA (WAR + GRD)',
    sectors: ['Warrior', 'Guardian'],
    color: '#38bdf8',
    summary: 'Directional Guard, Polearm/Shield Walls, Booster Kinetics & Dual-Wield Ripostes',
    theme: 'Directional Guard, Polearm/Shield Walls, Booster Kinetics & Dual-Wield Ripostes',
  },
  {
    id: 'Scholar',
    label: 'SCHOLAR UMBRELLA (WIZ + CLR)',
    sectors: ['Wizard', 'Cleric'],
    color: '#eab308',
    summary: 'Sustained Beams, Overcharge, Barrier Harmonics, Triage Pulses & Martyrdom',
    theme: 'Sustained Beams, Overcharge, Barrier Harmonics, Triage Pulses & Martyrdom',
  },
  {
    id: 'Rogue',
    label: 'ROGUE UMBRELLA (MRD + ROG)',
    sectors: ['Marauder', 'Rogue'],
    color: '#f43f5e',
    summary: 'Cloak Ambush, Self-Only Greedy Siphon, Phase-Shift, Siege Mass & Reactor Overclock',
    theme: 'Cloak Ambush, Self-Only Greedy Siphon, Phase-Shift, Siege Mass & Reactor Overclock',
  },
];

/**
 * Discipline arm metadata for the 6-Sector Hexagonal Feat Constellation (`N`, `NE`, `SE`, `S`, `SW`, `NW`).
 */
export interface DisciplineArmMeta {
  skillId: PilotSkillId;
  umbrella: ConstellationUmbrellaId;
  armIndex: number;
  compassCode: 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW';
  shortLabel: string;
  fullLabel: string;
  angleDeg: number;
  color: string;
}

/**
 * Canonical 6 radial discipline sectors grouped into the 3 Macro-Umbrellas (`Fighter`, `Scholar`, `Rogue`).
 */
export const CONSTELLATION_DISCIPLINE_ARMS: DisciplineArmMeta[] = [
  {
    skillId: 'Warrior',
    umbrella: 'Fighter',
    armIndex: 0,
    compassCode: 'N',
    shortLabel: 'ASSAULT & TURBINE',
    fullLabel: 'N · FIGHTER: WARRIOR (ASSAULT & TURBINE)',
    angleDeg: -90,
    color: '#38bdf8',
  },
  {
    skillId: 'Guardian',
    umbrella: 'Fighter',
    armIndex: 1,
    compassCode: 'NE',
    shortLabel: 'AEGIS & VANGUARD',
    fullLabel: 'NE · FIGHTER: GUARDIAN (AEGIS & VANGUARD)',
    angleDeg: -30,
    color: '#a855f7',
  },
  {
    skillId: 'Wizard',
    umbrella: 'Scholar',
    armIndex: 2,
    compassCode: 'SE',
    shortLabel: 'BEAM & ARTILLERY',
    fullLabel: 'SE · SCHOLAR: WIZARD (BEAM & ARTILLERY)',
    angleDeg: 30,
    color: '#eab308',
  },
  {
    skillId: 'Cleric',
    umbrella: 'Scholar',
    armIndex: 3,
    compassCode: 'S',
    shortLabel: 'HARMONIC & TRIAGE',
    fullLabel: 'S · SCHOLAR: CLERIC (HARMONIC & TRIAGE)',
    angleDeg: 90,
    color: '#22c55e',
  },
  {
    skillId: 'Marauder',
    umbrella: 'Rogue',
    armIndex: 4,
    compassCode: 'SW',
    shortLabel: 'ORDNANCE & SIEGE',
    fullLabel: 'SW · ROGUE: MARAUDER (ORDNANCE & SIEGE)',
    angleDeg: 150,
    color: '#f97316',
  },
  {
    skillId: 'Rogue',
    umbrella: 'Rogue',
    armIndex: 5,
    compassCode: 'NW',
    shortLabel: 'RECON & STEALTH',
    fullLabel: 'NW · ROGUE: ROGUE (RECON & STEALTH)',
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
 * Plotted node descriptor for one of the 113 canonical feats on the 6-Sector Hexagonal Constellation.
 */
export interface FeatConstellationNode {
  index: number;
  feat: FrameFeatDefinition;
  umbrella: ConstellationUmbrellaId;
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
 * Directed constellation edge connecting two `FeatConstellationNode` entries inside one of the 18 selective chains (`C-01..C-18`).
 */
export interface FeatConstellationEdge {
  fromFeatId: string;
  toFeatId: string;
  chainId: FeatChainId;
  chainName: string;
  fromStep: number;
  toStep: number;
  kind: 'spine' | 'branch' | 'bridge';
  color: string;
}

/**
 * Evaluation of a Feat's selective chain prerequisite under Golden Rules `P-02` and `P-04`.
 */
export interface FeatChainPrerequisiteEvaluation {
  /** True when the feat belongs to one of the 18 chains (`C-01..C-18`) */
  isChainFeat: boolean;
  /** True when the feat is a Step 1 Entry node, a Standalone Core Feat, a Specialist Stance, or a Reward Feat (requires 0 prerequisite feats) */
  isEntryOrStandalone: boolean;
  /** True when the pilot currently satisfies the chain prerequisite to socket this feat */
  met: boolean;
  /** Chain ID (`'C-01'..'C-18'`) if part of a chain */
  chainId?: FeatChainId;
  /** Human-readable chain name */
  chainName?: string;
  /** Step index (`1..5`) within the chain */
  chainStep?: number;
  /** All earlier feats (`step < feat.chainStep`) in this chain, any ONE of which unlocks this step (allowing tier-jumping) */
  earlierChainFeats: FrameFeatDefinition[];
  /** Subset of `earlierChainFeats` that are currently socketed by the pilot */
  activeEarlierFeats: FrameFeatDefinition[];
  /** All feats in this chain ordered from Step 1 to Step 5 */
  allFeatsInChain: FrameFeatDefinition[];
  /** Concise human-readable status summary for the UI inspector */
  summary: string;
  /** Alias for `summary` used by progression and inspector consumers */
  reason: string;
}

/**
 * Evaluates whether a feat's selective chain prerequisite (`C-01..C-18`) is satisfied (`Rule P-02` & `Rule P-04`):
 * - Entry nodes (`chainStep === 1`), Standalone Core Feats, Campaign Reward Feats, and all 22 Specialist Martial Stances require **zero** prerequisite feats.
 * - Escalation nodes (`chainStep >= 2`) unlock as soon as **any earlier feat (`step < feat.chainStep`) in the same `chainId`** is socketed, permitting tier jumps (`Tier I → III` or `Tier I → IV`).
 */
export function evaluateFeatChainPrerequisite(
  state: OrionState,
  feat: FrameFeatDefinition
): FeatChainPrerequisiteEvaluation {
  const equippedIds = (state.equippedFeats || []).map(normalizeCanonicalFeatId);
  if (!feat.chainId || !feat.chainStep) {
    const summaryText = feat.isSpecialistStance
      ? 'Standalone Specialist Martial Stance (0 Feat Prerequisites)'
      : feat.isRewardFeat
        ? 'Campaign Reward Feat (0 Feat Prerequisites)'
        : 'Standalone Core Feat (0 Feat Prerequisites)';
    return {
      isChainFeat: false,
      isEntryOrStandalone: true,
      met: true,
      earlierChainFeats: [],
      activeEarlierFeats: [],
      allFeatsInChain: [feat],
      summary: summaryText,
      reason: summaryText,
    };
  }

  const allFeatsInChain = CANONICAL_FRAME_FEAT_CATALOG.filter(
    (f) => f.chainId === feat.chainId
  ).sort((a, b) => (a.chainStep || 1) - (b.chainStep || 1));

  const earlierChainFeats = allFeatsInChain.filter(
    (f) => (f.chainStep || 1) < (feat.chainStep || 1)
  );
  const activeEarlierFeats = earlierChainFeats.filter((f) => equippedIds.includes(f.id));

  if (feat.chainStep <= 1 || earlierChainFeats.length === 0) {
    const summaryText = `${feat.chainId} (${feat.chainName || FEAT_CHAIN_NAMES[feat.chainId]}) · Entry Step 1 (No Prereq Feat)`;
    return {
      isChainFeat: true,
      isEntryOrStandalone: true,
      met: true,
      chainId: feat.chainId,
      chainName: feat.chainName || FEAT_CHAIN_NAMES[feat.chainId],
      chainStep: feat.chainStep,
      earlierChainFeats: [],
      activeEarlierFeats: [],
      allFeatsInChain,
      summary: summaryText,
      reason: summaryText,
    };
  }

  const met = Boolean(state.bypassProgressionGates) || activeEarlierFeats.length > 0;
  const earlierNames = earlierChainFeats.map((f) => `${f.name} [T-${f.tier}]`).join(' or ');
  const summaryText = met
    ? `${feat.chainId} Step ${feat.chainStep} Linked via ${activeEarlierFeats.map((f) => f.name).join(' + ')}`
    : `Requires any earlier ${feat.chainId} (${feat.chainName || FEAT_CHAIN_NAMES[feat.chainId]}) feat: ${earlierNames}`;

  return {
    isChainFeat: true,
    isEntryOrStandalone: false,
    met,
    chainId: feat.chainId,
    chainName: feat.chainName || FEAT_CHAIN_NAMES[feat.chainId],
    chainStep: feat.chainStep,
    earlierChainFeats,
    activeEarlierFeats,
    allFeatsInChain,
    summary: summaryText,
    reason: summaryText,
  };
}

/**
 * Checks if unsocketing a feat would orphan any currently socketed downstream feat in the same chain (`C-01..C-18`).
 * Returns the list of downstream socketed feats that depend solely on `feat` as their only earlier anchor.
 */
export function findDependentDownstreamChainFeats(
  state: OrionState,
  feat: FrameFeatDefinition
): FrameFeatDefinition[] {
  if (!feat.chainId || !feat.chainStep) return [];
  const equippedIds = (state.equippedFeats || [])
    .map(normalizeCanonicalFeatId)
    .filter((id) => id !== feat.id);

  const downstreamEquipped = CANONICAL_FRAME_FEAT_CATALOG.filter(
    (f) =>
      f.chainId === feat.chainId &&
      (f.chainStep || 1) > (feat.chainStep || 1) &&
      equippedIds.includes(f.id)
  );

  return downstreamEquipped.filter((downFeat) => {
    const remainingEarlier = CANONICAL_FRAME_FEAT_CATALOG.filter(
      (cand) =>
        cand.chainId === feat.chainId &&
        (cand.chainStep || 1) < (downFeat.chainStep || 1) &&
        equippedIds.includes(cand.id)
    );
    return remainingEarlier.length === 0;
  });
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
  anchored_focus: {
    summary: 'Unlocks Heavy Beam, Stellar & Meteoric Casters (Stationary μ = 0 Focus)',
    classes: ['Casters', 'Bows'],
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
  guarded_fire: {
    summary: 'Unlocks Firing 1H Weapons While Maintaining Directional Guard',
    classes: ['Shields', 'Casters', 'Bows'],
  },
  off_hand_deflection: {
    summary: 'Unlocks Active 0.34s Defensive Parry Window on Off-Hand Weapons & Bucklers',
    classes: ['Blades: Straight', 'Blades: Curved', 'Shields'],
  },
  radiant_cleave: {
    summary: 'Unlocks 180° Mana-Wave Cleaves on Melee Combo Finishers',
    classes: ['Spears', 'Blades: Straight', 'Impact & Axes'],
  },
  main_weapon_twin_link: {
    summary: 'Unlocks Synchronized Twin Strikes for Matching Weapon Classes in Slot 1 & Slot 2',
    classes: ['Casters', 'Spears', 'Blades: Straight', 'Impact & Axes'],
  },
  unyielding_bulwark: {
    summary: 'Unlocks Super-Heavy Shielding & CC Immunity (+1 Load Step)',
    classes: ['Shields', 'Heavy Plating', 'Spears'],
  },
  unfaltering: {
    summary: 'Unlocks Super-Heavy Frame Clearance & CC Immunity (+1 Load Step)',
    classes: ['Heavy Plating', 'Spears', 'Impact & Axes'],
  },
  salvo_link: {
    summary: 'Unlocks High-Impulse Shock Detonations & +1 Load Step',
    classes: ['Carriers & Munitions', 'Casters', 'Impact & Axes'],
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
  const specialist = SPECIALIST_STANCE_BY_FEAT_ID[feat.id];
  if (specialist) {
    return {
      handlingRole: 'proficiency',
      handlingSummary: specialist.doctrineSummary,
      targetEquipmentClasses: Array.from(
        new Set([
          ...specialist.mainFunctionalTypes,
          ...(specialist.mainCategories || []),
          ...specialist.offhandFunctionalTypes,
        ])
      ).slice(0, 6),
    };
  }
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
  if (reqLower.includes('shield') || reqLower.includes('guard')) classes.push('Shields');
  if (
    reqLower.includes('beam') ||
    reqLower.includes('energy') ||
    reqLower.includes('ranged') ||
    reqLower.includes('stationary')
  ) {
    classes.push('Casters', 'Bows');
  }
  if (reqLower.includes('suppression') || reqLower.includes('intercept') || reqLower.includes('rapid')) {
    classes.push('Casters', 'Carriers & Munitions');
  }
  if (reqLower.includes('launcher') || reqLower.includes('artillery') || reqLower.includes('salvo')) {
    classes.push('Carriers & Munitions');
  }
  if (
    reqLower.includes('melee') ||
    reqLower.includes('parry') ||
    reqLower.includes('cleave') ||
    reqLower.includes('1h')
  ) {
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
    handlingSummary: `Weapon-Agnostic Trigger (${classes.slice(0, 2).join(' / ')}): -10% Heat, +8% Stability, -10% Swap`,
    targetEquipmentClasses: Array.from(new Set(classes)),
  };
}

/**
 * Deterministic 113-Node 6-Sector Polar Hex Constellation Layout (`Project Orion — Feat System & Constellation Overhaul.md` §7).
 * Plots all 113 canonical feats (`90` Core Feats + `22` Specialist Martial Stances + `knights_oath` at `(0,0)`)
 * onto the 3 Macro-Umbrellas (`Fighter`, `Scholar`, `Rogue`) and 5 radial depth rings (`Tier I..V`).
 * Orders nodes within each `(skillId, tier)` sector by `chainId` so chain vectors radiate cleanly without crossing.
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
      umbrella: 'Fighter',
      skillId: coreFeat.requiredSkillId,
      tier: coreFeat.tier,
      ringOrder: 0,
      armIndex: 1,
      armColor: '#fde047',
      compassCode: 'CORE',
      x: 0,
      y: 0,
      angleDeg: 0,
      radiusPx: 0,
      isCoreNode: true,
      handlingRole: 'proficiency',
      handlingSummary: 'Campaign Reward Feat: +10% Permanent Damage vs Camelot Enemies',
      targetEquipmentClasses: ['All Loadouts'],
    });
  }

  // 2. Group the remaining 112 feats by (skillId, tier), sorting chain nodes consistently so chains align radially
  for (const arm of CONSTELLATION_DISCIPLINE_ARMS) {
    for (const tier of ['I', 'II', 'III', 'IV', 'V'] as FeatTier[]) {
      const armTierFeats = CANONICAL_FRAME_FEAT_CATALOG.filter(
        (f) => f.id !== 'knights_oath' && f.requiredSkillId === arm.skillId && f.tier === tier
      ).sort((a, b) => {
        // Place Core Chain Feats first (sorted by chainId), then Standalone Core Feats, then Specialist Stances
        const aType = a.chainId ? 0 : a.isSpecialistStance ? 2 : 1;
        const bType = b.chainId ? 0 : b.isSpecialistStance ? 2 : 1;
        if (aType !== bType) return aType - bType;
        if (a.chainId && b.chainId && a.chainId !== b.chainId) {
          return a.chainId.localeCompare(b.chainId);
        }
        return a.name.localeCompare(b.name);
      });

      const count = armTierFeats.length;
      if (count === 0) continue;

      const baseRadius = CONSTELLATION_TIER_RADII[tier];
      const maxSpreadDeg = count <= 2 ? 18 : count === 3 ? 34 : count <= 5 ? 44 : 50;

      armTierFeats.forEach((feat, localIdx) => {
        const t = count === 1 ? 0 : localIdx / (count - 1) - 0.5;
        const offsetDeg = t * maxSpreadDeg;
        const angleDeg = arm.angleDeg + offsetDeg;
        const angleRad = (angleDeg * Math.PI) / 180;
        const staggerR =
          count >= 3 && Math.abs(t) < 0.2 ? baseRadius - 6 : baseRadius + Math.abs(t) * 8;
        const x = Number((Math.cos(angleRad) * staggerR).toFixed(1));
        const y = Number((Math.sin(angleRad) * staggerR).toFixed(1));
        const handlingInfo = inferEquipmentClassesForFeat(feat);

        nodes.push({
          index: nodes.length,
          feat,
          umbrella: feat.umbrella || arm.umbrella,
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
 * Selective Chain Constellation Edges (`Rule P-04: Selective Chain Links — No Spaghetti Web`).
 * Connects ONLY nodes belonging to the same mechanical customization chain (`C-01` through `C-18`)
 * from each occupied step to the next occupied step in that chain.
 * Standalone Core Feats and the 22 Specialist Martial Stances have zero prerequisite edges.
 */
export const FEAT_CONSTELLATION_EDGES: FeatConstellationEdge[] = (() => {
  const edges: FeatConstellationEdge[] = [];
  const nodeById = new Map(FEAT_CONSTELLATION_NODES.map((n) => [n.feat.id, n]));
  const chainIds = Object.keys(FEAT_CHAIN_NAMES) as FeatChainId[];

  for (const chainId of chainIds) {
    const chainNodes = FEAT_CONSTELLATION_NODES.filter((n) => n.feat.chainId === chainId);
    if (chainNodes.length < 2) continue;

    const distinctSteps = Array.from(
      new Set(chainNodes.map((n) => n.feat.chainStep || 1))
    ).sort((a, b) => a - b);

    for (let si = 0; si < distinctSteps.length - 1; si++) {
      const fromStep = distinctSteps[si];
      const toStep = distinctSteps[si + 1];
      const fromGroup = chainNodes.filter((n) => (n.feat.chainStep || 1) === fromStep);
      const toGroup = chainNodes.filter((n) => (n.feat.chainStep || 1) === toStep);

      for (const targetNode of toGroup) {
        // Connect to each earlier node in the immediate preceding occupied step band of this chain
        for (const sourceNode of fromGroup) {
          const armColor = nodeById.get(targetNode.feat.id)?.armColor || '#38bdf8';
          edges.push({
            fromFeatId: sourceNode.feat.id,
            toFeatId: targetNode.feat.id,
            chainId,
            chainName: FEAT_CHAIN_NAMES[chainId],
            fromStep,
            toStep,
            kind: fromGroup.length === 1 && toGroup.length === 1 ? 'spine' : 'branch',
            color: armColor,
          });
        }
      }
    }
  }

  return edges;
})();

// ─── §6. EMERGENT HISTORICAL META-CLASSES (BOTTOM-UP BUILD SYNTHESIS) ────────

/**
 * Definition of one of the 13 Emergent Historical Meta-Classes (`Project Orion — Feat System & Constellation Overhaul.md` §6).
 */
export interface EmergentMetaClassDefinition {
  id: string;
  title: string;
  umbrellaSynthesis: string;
  primaryUmbrellas: ConstellationUmbrellaId[];
  typicalLoadAndGear: string;
  historicalDoctrine: string;
  signatureFeatIds: string[];
  preferredWeaponTypes: string[];
}

/**
 * Canonical 13 Emergent Historical Meta-Classes recognized by the `STATUS` and `FEATS` screens.
 */
export const EMERGENT_META_CLASS_CATALOG: EmergentMetaClassDefinition[] = [
  {
    id: 'knight',
    title: 'Knight',
    umbrellaSynthesis: 'Fighter (Warrior + Guardian)',
    primaryUmbrellas: ['Fighter'],
    typicalLoadAndGear: 'Medium / Heavy · Bastard/Arming Sword + Heater/Norman Shield',
    historicalDoctrine:
      'Chivalric Armizare frontline duelist combining directional shield guard, half-sword plate thrusts, and parry ripostes.',
    signatureFeatIds: [
      'knightly_bastard_specialist',
      'shield_charge',
      'guarded_fire',
      'off_hand_deflection',
      'attrition_riposte',
      'unyielding_bulwark',
      'hardening_light',
      'knights_oath',
    ],
    preferredWeaponTypes: ['Bastard Sword', 'Arming Sword', 'Spatha', 'Heater', 'Norman'],
  },
  {
    id: 'paladin_hospitaller',
    title: 'Paladin / Hospitaller',
    umbrellaSynthesis: 'Fighter + Scholar (Guardian + Cleric)',
    primaryUmbrellas: ['Fighter', 'Scholar'],
    typicalLoadAndGear: 'Heavy · Mace/Sword + Shield/Ward + Support Reactor',
    historicalDoctrine:
      'Sanctified frontline hospitaller who anchors the battle line with consecrated ground, cleansing sweeps, and martyrdom absorption.',
    signatureFeatIds: [
      'scepter_orb_specialist',
      'radiant_cleave',
      'purification_sweep',
      'benediction_pulse',
      'consecrated_ground',
      'selfless_sacrifice',
      'martyrdom_transcendent',
      'reactive_healing',
    ],
    preferredWeaponTypes: ['Mace', 'Hammer', 'Cudgel', 'Corona', 'Heater'],
  },
  {
    id: 'hoplite_phalangite',
    title: 'Hoplite / Phalangite',
    umbrellaSynthesis: 'Fighter (Guardian + Warrior)',
    primaryUmbrellas: ['Fighter'],
    typicalLoadAndGear: 'Medium / Heavy · Pike/Spear + Scutum/Tower Shield',
    historicalDoctrine:
      'Macedonian & Hellenic shield-wall phalangite locking down approach corridors with over-rim sarissa reach and anchored stability.',
    signatureFeatIds: [
      'phalanx_specialist',
      'spear_shield_specialist',
      'legionary_specialist',
      'anchored_action',
      'stabilizer_pulse',
      'siege_ward',
      'unfaltering',
      'hardening_light',
    ],
    preferredWeaponTypes: ['Pike', 'Short Spear', 'Winged Spear', 'Broad Spear', 'Scutum', 'Tower'],
  },
  {
    id: 'cataphract',
    title: 'Cataphract',
    umbrellaSynthesis: 'Fighter + Rogue (Guardian + Marauder)',
    primaryUmbrellas: ['Fighter', 'Rogue'],
    typicalLoadAndGear: 'Heavy · Lance/Mace + Heavy Shield + Booster Kit',
    historicalDoctrine:
      'Clibanarii heavy shock-lancer converting full chassis mass and booster velocity into high-impulse couched overruns.',
    signatureFeatIds: [
      'cataphract_specialist',
      'legionary_specialist',
      'guardians_dash',
      'momentum_guard',
      'overclock_guard',
      'salvo_link',
      'core_overclock',
    ],
    preferredWeaponTypes: ['Lance', 'Boar Spear', 'Mace', 'Hammer', 'Scutum', 'Tower'],
  },
  {
    id: 'landsknecht_berserker',
    title: 'Landsknecht / Berserker',
    umbrellaSynthesis: 'Rogue + Fighter (Marauder + Warrior)',
    primaryUmbrellas: ['Rogue', 'Fighter'],
    typicalLoadAndGear: 'Heavy · Zweihander / Flamberge / Battle Axe (2H Grip)',
    historicalDoctrine:
      'Doppelsöldner shock-trooper wielding two-handed great blades and axes through volatile reactor overclocks and high-impulse cleaves.',
    signatureFeatIds: [
      'zweihander_specialist',
      'shield_breaker_specialist',
      'siege_stability',
      'reactive_overload',
      'overclock_barrage',
      'core_overclock',
      'salvo_link',
    ],
    preferredWeaponTypes: ['Zweihander', 'Flamberge', 'Executioner Sword', 'Labrys', 'Falx'],
  },
  {
    id: 'varangian_huscarl',
    title: 'Varangian / Huscarl',
    umbrellaSynthesis: 'Rogue + Fighter (Marauder + Guardian)',
    primaryUmbrellas: ['Rogue', 'Fighter'],
    typicalLoadAndGear: 'Medium / Heavy · Battle Axe + Norman/Heater Shield',
    historicalDoctrine:
      'Heavy axe-and-shield vanguard hooking enemy guards open to shred Layer 2 Armor durability while shrugging off counter-strikes.',
    signatureFeatIds: [
      'viking_raider_specialist',
      'shield_breaker_specialist',
      'guarded_fire',
      'overload_cleave',
      'attrition_guard',
      'unyielding_bulwark',
      'salvo_link',
    ],
    preferredWeaponTypes: ['Battle Axe', 'Tomahawk', 'Parashu', 'Labrys', 'Norman', 'Heater'],
  },
  {
    id: 'samurai_bushi',
    title: 'Samurai / Bushi',
    umbrellaSynthesis: 'Fighter + Rogue (Warrior + Rogue)',
    primaryUmbrellas: ['Fighter', 'Rogue'],
    typicalLoadAndGear: 'Light / Medium · Katana + Wakizashi / Odachi + Bow',
    historicalDoctrine:
      'Versatile martial weapons master blending Niten Ichi-Ryu paired blades, Nodachi draw-cuts, and mounted archery without relying on Tier V capstones.',
    signatureFeatIds: [
      'daisho_specialist',
      'odachi_specialist',
      'mounted_archer_specialist',
      'sidearm_twin_link',
      'attrition_riposte',
      'cleave_counter',
      'main_weapon_twin_link',
    ],
    preferredWeaponTypes: ['Katana', 'Odachi', 'Wakizashi', 'Long Bow', 'Recurve Bow'],
  },
  {
    id: 'ninja_shinobi',
    title: 'Ninja / Shinobi',
    umbrellaSynthesis: 'Rogue + Scholar (Rogue + Wizard)',
    primaryUmbrellas: ['Rogue', 'Scholar'],
    typicalLoadAndGear: 'Light · Wakizashi / Cinquedea + Cloak / Phase-Shift',
    historicalDoctrine:
      'Phase-shifting infiltrator chaining stealth ambushes, cover-piercing phase strikes, and multi-target quantum assassinations.',
    signatureFeatIds: [
      'daisho_specialist',
      'shadow_step',
      'phantom_strike',
      'phase_beam',
      'void_strike',
      'dimensional_strike',
      'spectral_volley',
      'shadow_master',
      'quantum_assassin',
    ],
    preferredWeaponTypes: ['Wakizashi', 'Cinquedea', 'Katana', 'Short Bow'],
  },
  {
    id: 'parthian_stradiot',
    title: 'Parthian / Stradiot',
    umbrellaSynthesis: 'Rogue + Fighter (Rogue + Warrior)',
    primaryUmbrellas: ['Rogue', 'Fighter'],
    typicalLoadAndGear: 'Light / Medium · Recurve/Long Bow + Quiver/Yebira',
    historicalDoctrine:
      'High-mobility ranged skirmisher alternating between thumb-draw glide volleys and stationary cloaked Phantom Sniper precision shots.',
    signatureFeatIds: [
      'mounted_archer_specialist',
      'longbow_specialist',
      'repeating_arbalest_specialist',
      'arcane_ambush',
      'assassinate',
      'perfect_ambush',
      'phantom_sniper',
    ],
    preferredWeaponTypes: ['Recurve Bow', 'Reflex Bow', 'Composite Bow', 'Long Bow', 'Quiver', 'Yebira'],
  },
  {
    id: 'witch_hunter_inquisitor',
    title: 'Witch-Hunter / Inquisitor',
    umbrellaSynthesis: 'Rogue + Scholar (Rogue + Cleric)',
    primaryUmbrellas: ['Rogue', 'Scholar'],
    typicalLoadAndGear: 'Light / Medium · Spatha + Cinquedea / Bolt Caster',
    historicalDoctrine:
      'Self-sustaining duelist and caster-hunter utilizing the Greedy Siphon (C-02) personal shroud chain and critical execution bursts.',
    signatureFeatIds: [
      'pistol_cutlass_specialist',
      'rapier_dagger_specialist',
      'veil_of_mercy',
      'healing_shadow',
      'shadow_siphon',
      'shadow_sanctuary',
      'phantom_shroud',
      'merciful_execution',
    ],
    preferredWeaponTypes: ['Spatha', 'Cinquedea', 'Falchion', 'Bolt Caster', 'Crossbow'],
  },
  {
    id: 'warmage_spellblade',
    title: 'Warmage / Spellblade',
    umbrellaSynthesis: 'Fighter + Scholar (Warrior + Wizard)',
    primaryUmbrellas: ['Fighter', 'Scholar'],
    typicalLoadAndGear: 'Light / Medium · Arming Sword/Katana + Arc/Beam Caster',
    historicalDoctrine:
      'Hybrid blade-and-conduit tactician weaving close-quarters sword strikes into overcharged arclight beams and singularity fields.',
    signatureFeatIds: [
      'battlemage_specialist',
      'anchored_focus',
      'sustained_channeling',
      'overcharge',
      'arcane_mastery',
      'arcane_annihilation',
      'empowered_singularity',
    ],
    preferredWeaponTypes: ['Arming Sword', 'Bastard Sword', 'Katana', 'Beam Caster', 'Arc Caster'],
  },
  {
    id: 'thaumaturge_hermeticist',
    title: 'Thaumaturge / Hermeticist',
    umbrellaSynthesis: 'Scholar (Wizard + Cleric)',
    primaryUmbrellas: ['Scholar'],
    typicalLoadAndGear: 'Light / Medium · Partisan/Stellar Caster + Mote/Corona',
    historicalDoctrine:
      'Deep Scholar channeler mastering reactor overflow, barrier networks, and 800% Arcane Annihilation convergence discharges.',
    signatureFeatIds: [
      'manacore_staff_specialist',
      'anchored_focus',
      'sustained_channeling',
      'convergence_field',
      'font_of_power',
      'barrier_network',
      'mass_restoration',
      'arcane_annihilation',
      'infinite_wellspring',
    ],
    preferredWeaponTypes: ['Stellar Caster', 'Beam Caster', 'Wave Caster', 'Spetum', 'Partisan', 'Mote'],
  },
  {
    id: 'bombardier_janissary',
    title: 'Bombardier / Janissary',
    umbrellaSynthesis: 'Rogue + Fighter (Marauder + Warrior)',
    primaryUmbrellas: ['Rogue', 'Fighter'],
    typicalLoadAndGear: 'Heavy · Blast/Meteoric Caster + Rack/Battery',
    historicalDoctrine:
      'Combined-arms artillery officer saturating the battlefield with multi-lock dorsal racks, suppression chainfire, and avalanche salvos.',
    signatureFeatIds: [
      'artillery_battery_specialist',
      'repeating_arbalest_specialist',
      'suppression_link',
      'suppression_chainfire',
      'guardians_interference',
      'radiant_barrage',
      'multi_lock_array',
      'avalanche_surge',
      'lightstorm_barrage',
    ],
    preferredWeaponTypes: ['Blast Caster', 'Meteoric Caster', 'Nova Caster', 'Rack', 'Battery', 'Bandolier'],
  },
];

/**
 * Live evaluation result for the pilot's synthesized Emergent Historical Meta-Class (§6).
 */
export interface EmergentMetaClassEvaluation {
  /** Matched Emergent Historical Meta-Class definition */
  metaClass: EmergentMetaClassDefinition;
  /** Display title (e.g., `'Paladin / Hospitaller'` or `'Knight'`) */
  title: string;
  /** Umbrella synthesis label (e.g., `'Fighter + Scholar (Guardian + Cleric)'`) */
  umbrellaSynthesis: string;
  /** Alias for `umbrellaSynthesis` used by Satchel UI readouts */
  umbrellaCombination: string;
  /** Historical doctrine summary */
  historicalDoctrine: string;
  /** Alias for `historicalDoctrine` used by Satchel UI readouts */
  historicalFantasy: string;
  /** Signature feat names from this meta-class that the pilot currently has socketed */
  matchedSignatureFeatNames: string[];
  /** Alias for `matchedSignatureFeatNames` used by Satchel UI readouts */
  matchedFeats: string[];
  /** Active Specialist Martial Stance name if one is currently active */
  activeSpecialistStanceName: string | null;
  /** Count of socketed feats by macro-umbrella (`Fighter`, `Scholar`, `Rogue`) */
  umbrellaCounts: Record<ConstellationUmbrellaId, number>;
  /** Count of socketed Tier V Apex capstones (`0..2`) */
  tierVCount: number;
}

/**
 * Evaluates the pilot's currently illuminated Constellation nodes (`state.equippedFeats`) and equipped hardware
 * to synthesize their bottom-up **Emergent Historical Meta-Class** (`Project Orion — Feat System & Constellation Overhaul.md` §6).
 * Does not mutate `state: OrionState`.
 */
export function evaluateEmergentMetaClass(state: OrionState): EmergentMetaClassEvaluation {
  const equippedIds = (state.equippedFeats || []).map(normalizeCanonicalFeatId);
  const umbrellaCounts: Record<ConstellationUmbrellaId, number> = {
    Fighter: 0,
    Scholar: 0,
    Rogue: 0,
  };
  let tierVCount = 0;

  for (const id of equippedIds) {
    const feat = CANONICAL_FRAME_FEAT_REGISTRY[id];
    if (!feat) continue;
    const umb = feat.umbrella || 'Fighter';
    umbrellaCounts[umb] = (umbrellaCounts[umb] || 0) + 1;
    if (feat.tier === 'V') tierVCount += 1;
  }

  const activeStanceEval = evaluateActiveSpecialistStance(state);
  const activeStanceFeatId = activeStanceEval.stance?.featId || null;
  const activeSpecialistStanceName =
    activeStanceEval.active && activeStanceEval.stance
      ? activeStanceEval.stance.stanceName
      : null;

  const eq = state.equipmentSlots;
  const equippedWeaponTypes = [eq?.slot1, eq?.slot2, eq?.slot3, ...(state.equippedWeapons || [])]
    .filter(Boolean)
    .map((id) => {
      const w = getWeaponDefinition(id!);
      if (!w) return '';
      return resolveWeaponFunctionalType(w.id, w.category || 'Blades: Straight', w.weaponClass, w.name);
    })
    .filter(Boolean);

  let bestMeta = EMERGENT_META_CLASS_CATALOG[0];
  let bestScore = -1;
  let bestMatchedNames: string[] = [];

  for (const cand of EMERGENT_META_CLASS_CATALOG) {
    let score = 0;
    const matchedNames: string[] = [];

    for (const sigId of cand.signatureFeatIds) {
      if (equippedIds.includes(sigId)) {
        const f = CANONICAL_FRAME_FEAT_REGISTRY[sigId];
        // Specialist Stance feats carry higher weight for historical class identity
        score += f?.isSpecialistStance ? 4 : 2.5;
        if (f) matchedNames.push(f.name);
      }
      if (activeStanceFeatId && sigId === activeStanceFeatId) {
        score += 3.5;
      }
    }

    for (const wType of equippedWeaponTypes) {
      if (
        cand.preferredWeaponTypes.some(
          (pref) => pref.toLowerCase() === wType.toLowerCase()
        )
      ) {
        score += 1.5;
      }
    }

    for (const umb of cand.primaryUmbrellas) {
      score += (umbrellaCounts[umb] || 0) * 0.6;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMeta = cand;
      bestMatchedNames = matchedNames;
    }
  }

  return {
    metaClass: bestMeta,
    title: bestMeta.title,
    umbrellaSynthesis: bestMeta.umbrellaSynthesis,
    umbrellaCombination: bestMeta.umbrellaSynthesis,
    historicalDoctrine: bestMeta.historicalDoctrine,
    historicalFantasy: bestMeta.historicalDoctrine,
    matchedSignatureFeatNames: bestMatchedNames,
    matchedFeats: bestMatchedNames,
    activeSpecialistStanceName,
    umbrellaCounts,
    tierVCount,
  };
}

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
  const fnType = resolveWeaponFunctionalType(w.id, cat, w.weaponClass, w.name);

  for (const stance of SPECIALIST_STANCE_LIST) {
    if (
      stance.mainFunctionalTypes.includes(fnType) ||
      stance.offhandFunctionalTypes.includes(fnType)
    ) {
      ids.push(stance.featId);
    }
  }

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
        'guarded_fire',
        'radiant_ward_flare',
        'protectors_aura',
        'hardening_light'
      );
      break;
    case 'Bows':
      ids.push(
        'booster_evasion',
        'surgical_precision',
        'anchored_focus',
        'backstab_mastery',
        'assassinate',
        'phantom_sniper'
      );
      break;
    case 'Casters':
      ids.push(
        'anchored_focus',
        'sustained_channeling',
        'suppression_link',
        'phase_beam',
        'overcharge',
        'arcane_mastery',
        'purification_sweep'
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
        'off_hand_deflection',
        'backstab_mastery'
      );
      break;
    case 'Blades: Straight':
      ids.push(
        'booster_evasion',
        'phantom_strike',
        'sidearm_twin_link',
        'off_hand_deflection',
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
    ids.push('radiant_dash', 'protectors_aura', 'reactive_healing', 'radiant_overflow');
  } else if (hw.reactorFamily === 'Ether') {
    ids.push('shadow_step', 'anchored_focus', 'overcharge', 'phantom_strike');
  } else if (hw.reactorFamily === 'Ichor') {
    ids.push('booster_evasion', 'siege_stability', 'overclock_guard', 'core_overclock');
  }
  if (hw.slot === 'legs') {
    ids.push('booster_evasion', 'shadow_step', 'anchored_action');
  }
  if (hw.slot === 'optics' || hw.slot === 'sensoryA' || hw.slot === 'sensoryB') {
    ids.push('surgical_precision', 'anchored_focus', 'multi_lock_array');
  }
  if (ids.length === 0) {
    ids.push('booster_evasion', 'momentum_guard', 'shield_charge');
  }
  return Array.from(new Set(ids));
}

/**
 * Evaluates hybrid equipment prerequisites and handling proficiency for any Weapon, Auxiliary, or Chassis Hardware item.
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
  const equippedFeats = (state.equippedFeats || []).map(normalizeCanonicalFeatId);
  const isCheat = state.room === '-4,0' || Boolean(state.bypassProgressionGates);

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
    .map((id) => CANONICAL_FRAME_FEAT_REGISTRY[id])
    .filter((f): f is FrameFeatDefinition => Boolean(f));

  const activeMatchingFeats = relevantFeats.filter((f) => equippedFeats.includes(f.id));
  const recommendedFeat =
    relevantFeats.find((f) => !equippedFeats.includes(f.id)) ||
    relevantFeats[0] ||
    fallbackFeat;

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
