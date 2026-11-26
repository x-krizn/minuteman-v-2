/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { TRAIT_REGISTRY } from '../../database/characters';
import {
  formatModifiedEquipmentName,
  getResolvedActionDescriptor,
  parseEquipmentInstanceId,
} from '../../database/equipment';
import {
  CanonicalHardwareItemDefinition,
  findHardwareItemByNameOrId,
  getHardwareBaseWeight,
  getHardwareCapacityBonus,
} from '../../database/equipment/chassis_hardware';
import {
  canBypassTwoHandRestriction,
  getWeaponDefinition,
  isAuxiliaryEquipment,
  isLauncherEquipment,
  isTwoHandOnlyWeapon,
  isTwoHandWeapon,
  WEAPON_REGISTRY,
} from '../../database/equipment/weapons';
import { getItemDefinition } from '../../database/items';
import {
  ACTION_MODIFICATION_CATALOG,
  CANONICAL_FRAME_FEAT_REGISTRY,
  CHASSIS_HARDWARE_CATALOG,
  computePlayerLoadMetrics,
  createInitialEquipmentSlots,
  doesLoadoutMatchSpecialistStance,
  evaluateActiveSpecialistStance,
  evaluateEquipmentFeatHandling,
  GEMSTONE_REGISTRY,
  getEffectiveMainGrip,
  getEligibleSpecialistStances,
  getEquipmentDisplayName,
  getEquipmentMaxModSlots,
  getOwnedEquipmentInstances,
  getOwnedWeaponCount,
  getWeaponGemCombatModifiers,
  getWeaponGemVisuals,
  getWeaponInstanceEquipWeight,
  getWeaponSubtypeInfo,
  isEquipmentUnlocked,
  normalizeCanonicalFeatId,
  resolveActiveAction4DefensiveMode,
  setActiveSpecialistStance,
  setMainWeaponGrip,
  SPECIALIST_STANCE_BY_FEAT_ID,
  SPECIALIST_STANCE_LIST,
  toggleLoadoutAction4Mode,
  toggleReverseGripKatanaMode,
  WEAPON_FUNCTIONAL_TYPES_BY_CATEGORY,
  WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS,
  WEAPON_GEM_WEIGHT_DELTA,
} from '../../database/progression';
import {
  addOrionInventoryItem,
  assignTriggerAction,
  consolidateInventorySlots,
  getActiveWeaponStance,
  getEffectiveBActionId,
  getEffectiveLHoldActionId,
  getEquippedAssignableActionCandidates,
  getOrionGraphicsSettings,
  notifyOrionStateChange,
  performAuxiliarySwap,
  syncStateGates,
} from '../../systems';
import {
  GemId,
  OrionState,
  PilotSkillId,
  TraitLine,
  WEAPON_CATEGORIES,
  WeaponCategory,
  WeaponDefinition,
} from '../../types';
import {
  ALL_TRAIT_LINES,
  EditableLoadoutSlot,
  EquipmentInventoryCategory,
  HighResEquipmentArtCanvas,
  HighResMechDollCanvas,
  SpriteCanvasIcon,
} from './SatchelCanvases';

/**
 * Renders structured numeric stats, damage/armor values, types, increases, and decreases for any Weapon or Auxiliary.
 */
export const WeaponStatReadout: React.FC<{
  w: WeaponDefinition;
  instanceId: string;
  state: OrionState;
  compact?: boolean;
}> = ({ w, instanceId, state, compact = false }) => {
  const totalWt = getWeaponInstanceEquipWeight(instanceId, state);
  const gemMods = getWeaponGemCombatModifiers(state, instanceId);
  const handling = evaluateEquipmentFeatHandling(state, instanceId);
  const effectiveDmg = Math.round(w.damagePerShot * gemMods.damageMult);
  const effectiveChain = Math.max(1, w.shotsPerChain + gemMods.bonusMaxAmmo);
  const primaryAction = w.moveset?.[0];
  const primaryFamily = primaryAction?.damageFamily || 'Kinetic';
  const primaryRange = primaryAction?.range ?? 64;
  const handingLabel = isLauncherEquipment(w)
    ? 'SIDE / AUX [DORSAL]'
    : isTwoHandWeapon(w)
      ? canBypassTwoHandRestriction(w, state)
        ? '2H (1H OVERRIDE ACTIVE)'
        : '2H [MAIN ONLY]'
      : '1H [MAIN / SIDE]';

  const incBadges: string[] = [];
  const decBadges: string[] = [];

  if (handling.proficiencyTier === 'mastered') {
    incBadges.push('FEAT MASTERED: −12% WINDUP · −18% RECOIL · +12% STG');
  } else if (handling.proficiencyTier === 'proficient') {
    incBadges.push('FEAT PROFICIENT: −6% WINDUP · −10% RECOIL · +6% STG');
  } else if (handling.proficiencyTier === 'locked') {
    decBadges.push('PREREQ FEAT REQUIRED TO WIELD');
  }

  if (w.passiveShieldBonus) {
    if (w.passiveShieldBonus > 0) incBadges.push(`+${w.passiveShieldBonus} SHD`);
    else decBadges.push(`${w.passiveShieldBonus} SHD`);
  }
  if (
    w.passiveArmorBonus &&
    (w.equipmentRole === 'shield' || w.id.includes('martyrdom_plating'))
  ) {
    if (w.passiveArmorBonus > 0) incBadges.push(`+${w.passiveArmorBonus} ARM DUR`);
    else decBadges.push(`${w.passiveArmorBonus} ARM DUR`);
  }
  if (w.passiveLightBonus) {
    if (w.passiveLightBonus > 0) incBadges.push(`+${w.passiveLightBonus} LGT`);
    else decBadges.push(`${w.passiveLightBonus} LGT`);
  }
  if (w.canBlock) {
    incBadges.push('BLOCK GUARD');
  }
  if (w.supportPulseOnHit) {
    const p = w.supportPulseOnHit;
    const pulseParts: string[] = [];
    if (p.shieldRestore) pulseParts.push(`+${p.shieldRestore} SHD`);
    if (p.armorRestore) pulseParts.push(`+${p.armorRestore} ARM`);
    if (p.heatVent) pulseParts.push(`-${p.heatVent} HEAT`);
    if (pulseParts.length > 0) incBadges.push(`ON HIT: ${pulseParts.join('/')}`);
  }

  if (gemMods.damageMult !== 1) {
    const pct = Math.round((gemMods.damageMult - 1) * 100);
    if (pct > 0) incBadges.push(`+${pct}% DMG`);
    else decBadges.push(`${pct}% DMG`);
  }
  if (gemMods.lockedOrStaggeredDamageMult !== 1) {
    const pct = Math.round((gemMods.lockedOrStaggeredDamageMult - 1) * 100);
    if (pct > 0) incBadges.push(`+${pct}% STG DMG`);
    else decBadges.push(`${pct}% STG DMG`);
  }
  if (gemMods.maxShieldBonus !== 0) {
    if (gemMods.maxShieldBonus > 0) incBadges.push(`+${gemMods.maxShieldBonus} MAX SHD`);
    else decBadges.push(`${gemMods.maxShieldBonus} MAX SHD`);
  }
  if (gemMods.skillCooldownMult !== 1) {
    const pct = Math.round((gemMods.skillCooldownMult - 1) * 100);
    if (pct < 0) incBadges.push(`${pct}% CD`);
    else decBadges.push(`+${pct}% CD`);
  }
  if (gemMods.skillHeatCostMult !== 1) {
    const pct = Math.round((gemMods.skillHeatCostMult - 1) * 100);
    if (pct < 0) incBadges.push(`${pct}% HEAT COST`);
    else decBadges.push(`+${pct}% HEAT COST`);
  }
  if (gemMods.projectileSpeedMult !== 1) {
    const pct = Math.round((gemMods.projectileSpeedMult - 1) * 100);
    if (pct > 0) incBadges.push(`+${pct}% PROJ VEL`);
    else decBadges.push(`${pct}% PROJ VEL`);
  }
  if (gemMods.moveSpeedMult !== 1) {
    const pct = Math.round((gemMods.moveSpeedMult - 1) * 100);
    if (pct > 0) incBadges.push(`+${pct}% MOVE SPD`);
    else decBadges.push(`${pct}% MOVE SPD`);
  }
  if (gemMods.bonusMaxAmmo !== 0) {
    if (gemMods.bonusMaxAmmo > 0) incBadges.push(`+${gemMods.bonusMaxAmmo} CHAIN`);
    else decBadges.push(`${gemMods.bonusMaxAmmo} CHAIN`);
  }
  if (gemMods.extraArmorDentOnHit > 0) {
    incBadges.push(`+${gemMods.extraArmorDentOnHit} ARM SHRED`);
  }
  if (gemMods.shieldRestoreOnSkillHit > 0) {
    incBadges.push(`+${gemMods.shieldRestoreOnSkillHit} SHD ON SKILL`);
  }
  if (gemMods.heatVentOnBasicHit > 0) {
    incBadges.push(`-${gemMods.heatVentOnBasicHit} HEAT ON HIT`);
  }
  if (gemMods.armorRestoreOnKill > 0) {
    incBadges.push(`+${gemMods.armorRestoreOnKill} ARM ON KILL`);
  }
  if (gemMods.attackWeightDelta !== 0) {
    if (gemMods.attackWeightDelta > 0) incBadges.push(`+${gemMods.attackWeightDelta} ATK MASS`);
    else decBadges.push(`${gemMods.attackWeightDelta} ATK MASS`);
  }
  if (gemMods.presenceGainOnHit !== 0) {
    incBadges.push(`+${gemMods.presenceGainOnHit} PRESENCE ON HIT`);
  }
  if (gemMods.weightDelta !== 0) {
    if (gemMods.weightDelta < 0) incBadges.push(`${gemMods.weightDelta} WT MOD`);
    else decBadges.push(`+${gemMods.weightDelta} WT MOD`);
  }

  return (
    <div className="mt-1 space-y-1 text-[9px]">
      <div className="flex flex-wrap items-center gap-1.5 text-[#cbd5e1] tabular-nums">
        <span
          className={`font-bold ${
            handling.proficiencyTier === 'mastered'
              ? 'text-[#86efac]'
              : handling.proficiencyTier === 'proficient'
                ? 'text-[#7dd3fc]'
                : handling.proficiencyTier === 'locked'
                  ? 'text-[#fca5a5]'
                  : 'text-[#cbd5e1]'
          }`}
        >
          {handling.badgeLabel}
        </span>
        <span className="text-[#64748b]">·</span>
        <span className="text-[#fde047] font-bold">
          {w.category ? `${w.category} ▸ ${w.weaponClass || w.name}` : w.name}
        </span>
        <span className="text-[#64748b]">·</span>
        <span className="text-[#ffd27d] font-bold">
          {totalWt} WT ({(w.weightClass || 'medium').toUpperCase()})
        </span>
        <span className="text-[#64748b]">·</span>
        <span>{handingLabel}</span>
        <span className="text-[#64748b]">·</span>
        <span className="text-[#7dd3fc] font-bold">
          {effectiveDmg > 0
            ? primaryAction?.isChargeable
              ? `${effectiveDmg}–${Math.round(effectiveDmg * 1.85)} DMG (Charge Bow)`
              : primaryAction?.noReload || w.equipmentRole === 'melee' || w.equipmentRole === 'shield'
                ? `${effectiveDmg} DMG (${primaryAction?.comboSequence?.length || w.shotsPerChain}-Step Combo)`
                : `${effectiveDmg} DMG × ${effectiveChain} Ammo`
            : 'Support / Guard'}
        </span>
        <span className="text-[#64748b]">·</span>
        <span className="text-[#38bdf8]">
          {w.primaryDamageType} ({primaryFamily}) · {primaryRange}px RNG
        </span>
      </div>

      {(incBadges.length > 0 || decBadges.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {incBadges.map((b, i) => (
            <span key={`inc-${i}`} className="text-[#86efac] font-semibold">
              +{b.replace(/^\+/, '')}
            </span>
          ))}
          {decBadges.map((b, i) => (
            <span key={`dec-${i}`} className="text-[#fca5a5] font-semibold">
              {b}
            </span>
          ))}
        </div>
      )}

      {!compact && w.moveset && w.moveset.length > 0 && (
        <div className="text-[9px] text-[#94a3b8] leading-tight pt-1 border-t border-[#1e293b]/70 space-y-0.5">
          <div>
            <span className="text-[#cbd5e1] font-bold">MOVESET: </span>
            {w.moveset
              .map((s) => {
                return `[S${s.slot} ${s.name}: ${
                  s.damage > 0 ? `${s.damage} ${s.damageType}` : s.damageType
                } · ${s.cooldownSec}s CD · ${s.heatCost}H]`;
              })
              .join(' · ')}
          </div>
          {primaryAction?.comboSequence && primaryAction.comboSequence.length > 0 && (
            <div className="text-[#f472b6]">
              <span className="font-bold">COMBO: </span>
              {primaryAction.comboSequence
                .map((c, idx) => `${idx + 1}. ${c.label} (${Math.round(c.damageMult * 100)}%)`)
                .join(' ▸ ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Renders structured numeric stats, armor values, capacity, increases, and decreases for any Chassis Hardware piece.
 */
export const HardwareStatReadout: React.FC<{
  hw: CanonicalHardwareItemDefinition;
  maxGemSlots?: number;
}> = ({ hw, maxGemSlots }) => {
  const hwWeight = getHardwareBaseWeight(hw);
  const hwCap = getHardwareCapacityBonus(hw);
  const isExteriorArmor =
    hw.slot === 'plating' || hw.slot === 'head' || hw.slot === 'arms';

  const basePlatingCap =
    hw.slot === 'plating'
      ? hw.baseLoadCapacity === 'superheavy'
        ? 140
        : hw.baseLoadCapacity === 'heavy'
          ? 112
          : hw.baseLoadCapacity === 'light'
            ? 84
            : 90
      : 0;

  const incBadges: string[] = [];
  const decBadges: string[] = [];

  if (basePlatingCap > 0) incBadges.push(`${basePlatingCap} BASE CAP`);
  if (hwCap > 0) incBadges.push(`+${hwCap} CAP`);
  else if (hwCap < 0) decBadges.push(`${hwCap} CAP`);

  if (hw.shieldBonus) {
    if (hw.shieldBonus > 0) incBadges.push(`+${hw.shieldBonus} SHD`);
    else decBadges.push(`${hw.shieldBonus} SHD`);
  }
  if (hw.lightBonus) {
    if (hw.lightBonus > 0) incBadges.push(`+${hw.lightBonus} LGT`);
    else decBadges.push(`${hw.lightBonus} LGT`);
  }
  if (hw.stabilityBonus) {
    if (hw.stabilityBonus > 0) incBadges.push(`+${hw.stabilityBonus} STB`);
    else decBadges.push(`${hw.stabilityBonus} STB`);
  }

  return (
    <div className="mt-1 space-y-0.5 text-[9px]">
      <div className="flex flex-wrap items-center gap-1.5 text-[#cbd5e1] tabular-nums">
        <span className="text-[#ffd27d] font-bold">{hwWeight} WT</span>
        <span className="text-[#64748b]">·</span>
        {isExteriorArmor ? (
          <span className="text-[#7dd3fc] font-bold">
            {(hw.armorType || 'Medium').toUpperCase()} ARMOR · +{hw.armorDurability ?? 0} DUR · +{hw.armorRating ?? 0} RTG · +{hw.armorThreshold ?? 0} THR
          </span>
        ) : (
          <span className="text-[#94a3b8]">INTERNAL MODULE</span>
        )}
        {maxGemSlots !== undefined && (
          <>
            <span className="text-[#64748b]">·</span>
            <span>{hw.origin === 'crafted' ? `Crafted (${maxGemSlots}G)` : `Looted (${maxGemSlots}G)`}</span>
          </>
        )}
      </div>

      {(incBadges.length > 0 || decBadges.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {incBadges.map((b, i) => (
            <span key={`hw-inc-${i}`} className="text-[#86efac] font-semibold">
              {b}
            </span>
          ))}
          {decBadges.map((b, i) => (
            <span key={`hw-dec-${i}`} className="text-[#fca5a5] font-semibold">
              {b}
            </span>
          ))}
        </div>
      )}

      <div className="text-[9px] text-[#86efac]">+ {hw.description}</div>
      {hw.drawbackDescription && (
        <div className="text-[9px] text-[#f87171]">− {hw.drawbackDescription}</div>
      )}
    </div>
  );
};

/**
 * Props for `SatchelLoadoutTab` (the overhauled Mech Doll Loadout screen).
 */
export interface SatchelLoadoutTabProps {
  state: OrionState;
  isCheatMode: boolean;
  isEditingLoadout: boolean;
  setIsEditingLoadout: React.Dispatch<React.SetStateAction<boolean>>;
  editingSlot: EditableLoadoutSlot;
  setEditingSlot: React.Dispatch<React.SetStateAction<EditableLoadoutSlot>>;
  loadoutSubtypeFilter: string;
  setLoadoutSubtypeFilter: React.Dispatch<React.SetStateAction<string>>;
  openSlotEditor: (slot: EditableLoadoutSlot) => void;
  onOpenInventoryTab: () => void;
  onOpenArmory?: (slot?: EditableLoadoutSlot, itemId?: string) => void;
  onLocateFeat?: (featId: string) => void;
}

/**
 * Renders the `LOADOUT · Equipped Slots` screen using a Single-Focus Full-Width Slot List
 * with an optional Mech Doll Schematic Pop-Up and a Slide-Over Slot Inspector & Equipment Picker.
 */
export const SatchelLoadoutTab: React.FC<SatchelLoadoutTabProps> = ({
  state,
  isCheatMode,
  isEditingLoadout,
  setIsEditingLoadout,
  editingSlot,
  loadoutSubtypeFilter,
  setLoadoutSubtypeFilter,
  openSlotEditor,
  onOpenInventoryTab: _onOpenInventoryTab,
  onOpenArmory,
  onLocateFeat,
}) => {
  const [contextMenuSlot, setContextMenuSlot] = useState<EditableLoadoutSlot | null>(null);
  const [showDollOverlay, setShowDollOverlay] = useState<boolean>(false);
  const [previewCandidateId, setPreviewCandidateId] = useState<string | null>(null);
  const [loadoutSelectedClass, setLoadoutSelectedClass] = useState<WeaponCategory | null>(null);
  const [loadoutVariantFilter, setLoadoutVariantFilter] = useState<
    'ALL' | 'Custom' | 'Magitech' | 'Legendary'
  >('ALL');
  const [stanceDisciplineFilter, setStanceDisciplineFilter] = useState<'ALL' | PilotSkillId>(
    'ALL'
  );

  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  const eq = state.equipmentSlots;
  const loadMetrics = computePlayerLoadMetrics(state);
  const mainGrip = getEffectiveMainGrip(state);
  const activeStance = getActiveWeaponStance(state);
  const devMode = getOrionGraphicsSettings().devModeEnabled;

  const sayCtx = {
    say: (txt: string) => {
      state.toastText = txt;
      state.toastTimer = 2.6;
    },
  };

  // Resolve equipped items for each anatomical node
  const headItem = findHardwareItemByNameOrId(eq.head);
  const opticsItem = findHardwareItemByNameOrId(eq.headOptics);
  const sensoryAItem = findHardwareItemByNameOrId(eq.sensoryA);
  const sensoryBItem = findHardwareItemByNameOrId(eq.sensoryB);
  const platingItem = findHardwareItemByNameOrId(eq.plating);
  const reactorItem = findHardwareItemByNameOrId(eq.reactorCore);
  const armsItem = findHardwareItemByNameOrId(eq.arms);
  const actuatorsItem = findHardwareItemByNameOrId(eq.armActuators);
  const legsItem = findHardwareItemByNameOrId(eq.legs);

  const slot1Id = eq.slot1 || state.equippedWeapons?.[0] || 'long_sword';
  const slot2Id = eq.slot2 || null;
  const slot3Id = eq.slot3 || null;
  const mainWeapon = getWeaponDefinition(slot1Id);
  const sideWeapon = slot2Id ? getWeaponDefinition(slot2Id) : undefined;
  const auxWeapon = slot3Id ? getWeaponDefinition(slot3Id) : undefined;

  const lHoldActionId = getEffectiveLHoldActionId(state);
  const isDefaultLHoldSwap = lHoldActionId === 'weapon_swap';
  const leftAction = isDefaultLHoldSwap
    ? {
        id: 'weapon_swap',
        name: 'Weapon / Auxiliary Swap',
        shortLabel: 'WEAPON / AUX SWAP',
        sourceCategory: 'weapon' as const,
        sourceLabel: 'Default L [Q] Long-Press',
        description:
          'Toggles active Skill 4 & 5 ownership with your Auxiliary Back Launcher or swaps active off-hand/grip state.',
      }
    : getResolvedActionDescriptor(state, lHoldActionId);

  const bActionId = getEffectiveBActionId(state);
  const isDefaultBBooster = bActionId === 'booster_dash';
  const boostAction = isDefaultBBooster
    ? {
        id: 'booster_dash',
        name: `Booster Thrusters (${legsItem?.name || 'Standard Striders'})`,
        shortLabel: 'BOOSTER THRUSTERS',
        sourceCategory: 'hardware' as const,
        sourceLabel: `Default B [K] · ${legsItem?.name || 'Leg Striders'}`,
        description:
          'Tap B [K] for directional thruster dash burst · Hold B [K] for continuous boost glide.',
      }
    : bActionId === 'weapon_swap'
      ? {
          id: 'weapon_swap',
          name: 'Weapon / Auxiliary Swap',
          shortLabel: 'WEAPON / AUX SWAP',
          sourceCategory: 'weapon' as const,
          sourceLabel: 'Swapped from L [Q] Hold',
          description:
            'Toggles active Skill 4 & 5 ownership with your Auxiliary Back Launcher or swaps active off-hand/grip state.',
        }
      : getResolvedActionDescriptor(state, bActionId);

  const getEquippedIdForSlot = (slot: EditableLoadoutSlot): string | null => {
    switch (slot) {
      case 'slot1':
        return slot1Id;
      case 'slot2':
        return slot2Id;
      case 'slot3':
        return slot3Id;
      case 'head':
        return headItem?.id || eq.head || null;
      case 'optics':
        return opticsItem?.id || eq.headOptics || null;
      case 'sensoryA':
        return sensoryAItem?.id || eq.sensoryA || null;
      case 'sensoryB':
        return sensoryBItem?.id || eq.sensoryB || null;
      case 'plating':
        return platingItem?.id || eq.plating || null;
      case 'reactor':
        return reactorItem?.id || eq.reactorCore || null;
      case 'arms':
        return armsItem?.id || eq.arms || null;
      case 'actuators':
        return actuatorsItem?.id || eq.armActuators || null;
      case 'legs':
        return legsItem?.id || eq.legs || null;
      case 'bind_l':
        return lHoldActionId;
      case 'bind_b':
        return bActionId;
      case 'bind_r':
        return state.assignedActions?.R || 'weapon_skill_2';
      default:
        return null;
    }
  };

  const renderModGemPips = (itemId: string | null | undefined) => {
    if (!itemId) return null;
    const { slotGems } = parseEquipmentInstanceId(itemId);
    const max = getEquipmentMaxModSlots(itemId);
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => {
          const g = slotGems[i];
          const gemDef = g ? GEMSTONE_REGISTRY[g] : null;
          return (
            <span
              key={i}
              title={
                gemDef
                  ? `Slot ${i + 1}: ${gemDef.name}`
                  : `Slot ${i + 1}: Empty`
              }
              className="w-2 h-2 rounded-full border inline-block"
              style={{
                backgroundColor: gemDef ? gemDef.hexColor : '#090d14',
                borderColor: gemDef ? '#ffffff88' : '#334155',
              }}
            />
          );
        })}
      </div>
    );
  };

  /**
   * Renders one compact full-width scannable row for an anatomical hardpoint slot.
   */
  const renderCompactSlotRow = (config: {
    slot: EditableLoadoutSlot;
    title: string;
    itemId: string | null;
    itemName: string;
    subtitle: string;
    wtLabel: string;
    accentColor: string;
    badgeText?: string;
  }) => {
    return (
      <div
        key={config.slot}
        role="button"
        tabIndex={0}
        data-menu-focusable="true"
        onClick={() => {
          soundSystem.playSelect();
          setContextMenuSlot(config.slot);
        }}
        className="px-2.5 py-2 hover:bg-[#1e293b]/70 transition-colors cursor-pointer flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <HighResEquipmentArtCanvas
            state={state}
            itemIdOrName={config.itemId}
            slotHint={config.slot}
            sizeClass="w-8 h-8 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[9px] font-bold tracking-wide w-28 shrink-0"
                style={{ color: config.accentColor }}
              >
                {config.title}
              </span>
              <span className="font-bold text-[11px] text-[#f8fafc] truncate">
                {config.itemName}
              </span>
              {config.badgeText && (
                <span className="text-[9px] text-[#fde047] font-mono">
                  · {config.badgeText}
                </span>
              )}
              <span className="text-[9px] text-[#94a3b8] truncate hidden sm:inline">
                · {config.subtitle}
              </span>
            </div>
            <div className="text-[9px] text-[#94a3b8] truncate sm:hidden">
              {config.subtitle}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {renderModGemPips(config.itemId)}
          <span className="text-[9px] font-mono tabular-nums font-bold text-[#ffd27d] w-12 text-right">
            {config.wtLabel}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundSystem.playSelect();
              setPreviewCandidateId(config.itemId);
              openSlotEditor(config.slot);
            }}
            className="px-2 py-0.5 bg-[#172554] hover:bg-[#1e3a8a] text-[#fde047] border border-[#38bdf8]/50 rounded-xs text-[9px] font-bold cursor-pointer"
          >
            Swap
          </button>
        </div>
      </div>
    );
  };

  /**
   * Renders the Full-Width Equipment Picker Overlay when `isEditingLoadout` is true.
   */
  const renderSlotEquipmentSelector = () => {
    const currentId = getEquippedIdForSlot(editingSlot);
    const isWeaponSlot =
      editingSlot === 'slot1' || editingSlot === 'slot2' || editingSlot === 'slot3';
    const isTriggerSlot =
      editingSlot === 'bind_l' || editingSlot === 'bind_b' || editingSlot === 'bind_r';

    if (isTriggerSlot) {
      const targetTrigger: 'L' | 'B' = editingSlot === 'bind_b' ? 'B' : 'L';
      const isEditingBoost = targetTrigger === 'B';
      const isDefaultAssigned = isEditingBoost ? isDefaultBBooster : isDefaultLHoldSwap;
      const equippedCandidates = getEquippedAssignableActionCandidates(
        state,
        targetTrigger,
        isCheatMode
      );

      return (
        <div
          data-menu-scope="true"
          className="flex-1 min-h-0 flex flex-col p-2.5 bg-[#090d14] rounded-xs border border-[#fde047] space-y-2 overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-1.5 shrink-0">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#fde047]">
                {isEditingBoost
                  ? 'ASSIGN BOOST (B [K]) EQUIPPED ACTION'
                  : 'ASSIGN WEAPON SWAP (L [Q] LONG-PRESS) EQUIPPED ACTION'}
              </div>
              <div className="text-[9px] text-[#94a3b8]">
                Only actions from currently equipped items are listed · An already equipped action
                cannot be bound again unless available from multiple equipped sources
              </div>
            </div>
            <button
              type="button"
              data-menu-back="true"
              onClick={() => setIsEditingLoadout(false)}
              className="px-2.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] rounded-xs text-[10px] font-bold cursor-pointer shrink-0"
            >
              ← Back to Slots
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#1e293b] pr-0.5">
            {/* Default Option for the selected slot */}
            <button
              type="button"
              onClick={() => {
                if (isEditingBoost) {
                  assignTriggerAction(state, 'B', 'booster_dash');
                  sayCtx.say('BOUND B [K] TO BOOSTER THRUSTERS (DEFAULT)');
                } else {
                  assignTriggerAction(state, 'L', 'weapon_swap');
                  sayCtx.say('BOUND L [Q] LONG-PRESS TO WEAPON / AUXILIARY SWAP (DEFAULT)');
                }
                soundSystem.playPowerup();
                setIsEditingLoadout(false);
                notifyOrionStateChange();
              }}
              className={`w-full p-2 text-left flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                isDefaultAssigned ? 'bg-[#172554]/80' : 'hover:bg-[#1e293b]/60'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[11px] text-[#fde047]">
                    {isEditingBoost
                      ? `Booster Thrusters · ${legsItem?.name || 'Standard Striders'} (Default)`
                      : 'Weapon / Auxiliary Swap (Default)'}
                  </span>
                  <span className="text-[9px] text-[#86efac]">
                    · {isEditingBoost ? 'Standard B [K] Mobility' : 'Standard L [Q] Hold'}
                  </span>
                </div>
                <div className="text-[9px] text-[#cbd5e1] mt-0.5">
                  {isEditingBoost
                    ? 'Tap B [K] for directional thruster dash burst · Hold B [K] for continuous boost glide.'
                    : 'Toggles active Skill 4 & 5 ownership with your Auxiliary Back Launcher or swaps active weapon stance.'}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-xs text-[9px] font-bold bg-[#1e293b] text-[#fde047] shrink-0">
                {isDefaultAssigned ? 'Assigned' : 'Bind'}
              </span>
            </button>

            {/* Equipped-Item-Derived Candidate Actions with Multi-Source Duplicate Enforcement */}
            {equippedCandidates.map((cand) => {
              const desc = cand.descriptor;
              return (
                <button
                  key={cand.bindId}
                  type="button"
                  disabled={!cand.canBind}
                  onClick={() => {
                    if (!cand.canBind) {
                      soundSystem.playMenuBeep();
                      sayCtx.say(
                        (cand.duplicateReason || 'ACTION ALREADY EQUIPPED FROM SINGLE SOURCE').toUpperCase()
                      );
                      notifyOrionStateChange();
                      return;
                    }
                    assignTriggerAction(state, targetTrigger, cand.bindId);
                    sayCtx.say(
                      `BOUND ${desc.name.toUpperCase()} TO ${
                        isEditingBoost ? 'BOOST B [K]' : 'L [Q] LONG-PRESS'
                      }`
                    );
                    soundSystem.playPowerup();
                    setIsEditingLoadout(false);
                    notifyOrionStateChange();
                  }}
                  className={`w-full p-2 text-left flex items-center justify-between gap-2 transition-colors ${
                    cand.isAssignedHere
                      ? 'bg-[#172554]/80 cursor-pointer'
                      : cand.canBind
                        ? 'hover:bg-[#1e293b]/60 cursor-pointer'
                        : 'bg-[#05070a]/70 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-bold text-[11px] ${
                          cand.canBind ? 'text-[#fde047]' : 'text-[#94a3b8]'
                        }`}
                      >
                        {desc.name}
                      </span>
                      <span className="text-[9px] text-[#7dd3fc]">
                        · Equipped Source ({cand.availableSourceCount}):{' '}
                        {cand.equippedSourceNames.join(' + ')}
                      </span>
                      {cand.availableSourceCount > 1 && (
                        <span className="px-1.5 py-0.2 rounded-xs bg-[#052e16] text-[#86efac] border border-[#22c55e]/50 text-[8px] font-bold">
                          MULTI-SOURCE ×{cand.availableSourceCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-[#cbd5e1] mt-0.5">{desc.description}</div>
                    {!cand.canBind && cand.duplicateReason && (
                      <div className="text-[9px] text-[#fca5a5] font-semibold mt-0.5">
                        Locked: {cand.duplicateReason}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-xs text-[9px] font-bold shrink-0 ${
                      cand.isAssignedHere
                        ? 'bg-[#1e293b] text-[#fde047] border border-[#fde047]/60'
                        : cand.canBind
                          ? 'bg-[#052e16] text-[#86efac] border border-[#22c55e]/50'
                          : 'bg-[#450a0a] text-[#fca5a5] border border-[#ef4444]/40'
                    }`}
                  >
                    {cand.isAssignedHere
                      ? 'Assigned'
                      : cand.canBind
                        ? 'Bind'
                        : `In Use (${cand.equippedCount}/${cand.availableSourceCount})`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (isWeaponSlot) {
      const allUnlockedWeapons = Object.values(WEAPON_REGISTRY).filter((baseW) => {
        if (
          baseW.id.startsWith('utility_') ||
          baseW.id.startsWith('aux3_') ||
          baseW.id.startsWith('aux4_')
        ) {
          return false;
        }
        if (!isCheatMode && !isEquipmentUnlocked(state, baseW.id)) return false;
        return true;
      });

      const currentSubtypeInfo = currentId ? getWeaponSubtypeInfo(currentId) : null;
      const activeWeaponClass: WeaponCategory =
        loadoutSelectedClass ||
        currentSubtypeInfo?.category ||
        (editingSlot === 'slot3' ? 'Carriers & Munitions' : 'Blades: Straight');

      const functionalTypesInClass = WEAPON_FUNCTIONAL_TYPES_BY_CATEGORY[activeWeaponClass] || [];
      const activeFunctionalFilter =
        loadoutSubtypeFilter !== 'ALL' && functionalTypesInClass.includes(loadoutSubtypeFilter)
          ? loadoutSubtypeFilter
          : 'ALL';

      const candidates = allUnlockedWeapons
        .filter((baseW) => {
          const stInfo = getWeaponSubtypeInfo(baseW.id);
          if (stInfo.category !== activeWeaponClass) return false;
          if (
            activeFunctionalFilter !== 'ALL' &&
            stInfo.functionalType !== activeFunctionalFilter
          ) {
            return false;
          }
          if (loadoutVariantFilter !== 'ALL' && stInfo.variantSubtype !== loadoutVariantFilter) {
            return false;
          }
          return true;
        })
        .flatMap((baseW) => {
          const instances = getOwnedEquipmentInstances(state, baseW.id);
          const ids = instances.length > 0 ? instances : [baseW.id];
          return ids.map((instanceId) => ({
            baseW,
            instanceId,
            resolvedW: getWeaponDefinition(instanceId) || baseW,
            stInfo: getWeaponSubtypeInfo(baseW.id),
          }));
        });

      const inspectedId =
        previewCandidateId || currentId || candidates[0]?.instanceId || 'long_sword';
      const inspectedWeapon = getWeaponDefinition(inspectedId);

      const handleEquipWeaponInSlot = (instanceId: string) => {
        const w = getWeaponDefinition(instanceId);
        if (!w) return;
        const handlingEval = evaluateEquipmentFeatHandling(state, instanceId);
        if (!handlingEval.canEquip) {
          soundSystem.playMenuBeep();
          sayCtx.say(`FEAT PREREQ REQUIRED: ${handlingEval.statusSummary.toUpperCase()}`);
          notifyOrionStateChange();
          return;
        }
        soundSystem.playPowerup();

        let targetSlot: 'slot1' | 'slot2' | 'slot3' =
          editingSlot === 'slot1' || editingSlot === 'slot2' || editingSlot === 'slot3'
            ? editingSlot
            : 'slot1';

        if (isLauncherEquipment(w)) {
          targetSlot = editingSlot === 'slot2' ? 'slot2' : 'slot3';
        } else if (targetSlot === 'slot3') {
          targetSlot = isTwoHandOnlyWeapon(w, state) ? 'slot1' : 'slot2';
        } else if (targetSlot === 'slot2' && isTwoHandOnlyWeapon(w, state)) {
          targetSlot = 'slot1';
        }

        if (targetSlot === 'slot1') {
          eq.slot1 = instanceId;
          state.equippedWeapons[0] = instanceId;
          eq.weaponSet1 = [instanceId, null];
          eq.auxActive = false;
          if (isTwoHandOnlyWeapon(w, state)) {
            eq.mainGrip = '2h';
          }
        } else if (targetSlot === 'slot2') {
          eq.slot2 = instanceId;
          if (state.equippedWeapons.length < 2) {
            state.equippedWeapons.push(instanceId);
          } else {
            state.equippedWeapons[1] = instanceId;
          }
          eq.weaponSet2 = [instanceId, null];
          eq.auxActive = false;
          if (isTwoHandOnlyWeapon(eq.slot1, state)) {
            eq.mainGrip = '2h';
          } else if (!eq.mainGrip) {
            eq.mainGrip = '1h';
          }
        } else if (targetSlot === 'slot3') {
          eq.slot3 = instanceId;
        }
        const isHolsteredSideNotice =
          targetSlot === 'slot2' && getEffectiveMainGrip(state) === '2h';
        sayCtx.say(
          `EQUIPPED ${w.name.toUpperCase()} IN ${
            targetSlot === 'slot1'
              ? eq.mainGrip === '2h' && eq.slot2
                ? 'MAIN HAND [R] (2H — SIDE HOLSTERED)'
                : 'MAIN HAND [R]'
              : targetSlot === 'slot2'
                ? isHolsteredSideNotice
                  ? 'SIDE HAND [L] (HOLSTERED WHILE 2H)'
                  : 'SIDE HAND [L]'
                : 'AUXILIARY [BACK]'
          }`
        );
        setIsEditingLoadout(false);
        notifyOrionStateChange();
      };

      return (
        <div
          data-menu-scope="true"
          className="flex-1 min-h-0 flex flex-col p-2.5 bg-[#090d14] rounded-xs border border-[#fde047] space-y-2 overflow-hidden"
        >
          {/* Two-Row Selector Header: Back + Slot Title on Row 1, Class/Type/Subtype Dropdowns on Row 2 */}
          <div className="flex flex-col gap-1.5 border-b border-[#1e293b] pb-1.5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  data-menu-back="true"
                  onClick={() => setIsEditingLoadout(false)}
                  className="px-2.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] rounded-xs text-[10px] font-bold cursor-pointer shrink-0"
                >
                  ← Back to Slots
                </button>
                <span className="text-[11px] font-bold text-[#fde047] truncate">
                  {editingSlot === 'slot1'
                    ? 'MAIN HAND [RIGHT]'
                    : editingSlot === 'slot2'
                      ? 'SIDE HAND [LEFT]'
                      : 'AUXILIARY [BACK]'}
                </span>
              </div>

              {(editingSlot === 'slot2' || editingSlot === 'slot3') && currentId && (
                <button
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    if (editingSlot === 'slot2') {
                      eq.slot2 = null;
                      eq.mainGrip = '2h';
                    } else {
                      eq.slot3 = null;
                    }
                    sayCtx.say(
                      `UNEQUIPPED ${editingSlot === 'slot2' ? 'SIDE HAND [L]' : 'AUXILIARY [BACK]'}`
                    );
                    setIsEditingLoadout(false);
                    notifyOrionStateChange();
                  }}
                  className="px-2 py-0.5 bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#ef4444]/50 rounded-xs text-[9px] font-bold cursor-pointer shrink-0"
                >
                  Unequip Slot
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={activeWeaponClass}
                onChange={(e) => {
                  soundSystem.playSelect();
                  setLoadoutSelectedClass(e.target.value as WeaponCategory);
                  setLoadoutSubtypeFilter('ALL');
                }}
                className="flex-1 min-w-0 truncate px-2 py-0.5 bg-[#05070a] border border-[#334155] rounded-xs text-[11px] font-bold text-[#fde047] focus:outline-none cursor-pointer"
              >
                {WEAPON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    Class: {cat}
                  </option>
                ))}
              </select>

              <select
                value={activeFunctionalFilter}
                onChange={(e) => {
                  soundSystem.playSelect();
                  setLoadoutSubtypeFilter(e.target.value);
                }}
                className="flex-1 min-w-0 truncate px-2 py-0.5 bg-[#05070a] border border-[#334155] rounded-xs text-[11px] font-bold text-[#7dd3fc] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All {activeWeaponClass} Types</option>
                {functionalTypesInClass.map((ft) => (
                  <option key={ft} value={ft}>
                    {ft}
                  </option>
                ))}
              </select>

              <select
                value={loadoutVariantFilter}
                onChange={(e) => {
                  soundSystem.playSelect();
                  setLoadoutVariantFilter(
                    e.target.value as 'ALL' | 'Custom' | 'Magitech' | 'Legendary'
                  );
                }}
                className="flex-1 min-w-0 truncate px-2 py-0.5 bg-[#05070a] border border-[#334155] rounded-xs text-[11px] font-bold text-[#e2e8f0] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Subtypes</option>
                <option value="Custom">Custom (3 Slots)</option>
                <option value="Magitech">Magitech (1 Gem)</option>
                <option value="Legendary">Legendary</option>
              </select>
            </div>
          </div>

          {/* Focused Preview Banner for Highlighted Weapon */}
          {inspectedWeapon && (
            <div className="p-2 bg-[#05070a] rounded-xs border border-[#334155] flex items-center gap-3 shrink-0">
              <HighResEquipmentArtCanvas
                state={state}
                itemIdOrName={inspectedId}
                slotHint={editingSlot}
                sizeClass="w-14 h-14 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[11px] text-[#fde047]">
                      {getEquipmentDisplayName(inspectedId, state)}
                    </span>
                    <span className="text-[9px] text-[#7dd3fc]">
                      · {getWeaponSubtypeInfo(inspectedWeapon.id).subtype}
                    </span>
                  </div>
                  {onOpenArmory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingLoadout(false);
                        onOpenArmory(editingSlot, inspectedId);
                      }}
                      className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#fb923c] border border-[#fb923c]/50 rounded-xs text-[9px] font-bold cursor-pointer shrink-0"
                    >
                      ⚙ Armory
                    </button>
                  )}
                </div>
                <WeaponStatReadout
                  w={inspectedWeapon}
                  instanceId={inspectedId}
                  state={state}
                  compact
                />
              </div>
            </div>
          )}

          {/* Full-Width Compact Scannable Weapon Candidates List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#1e293b] bg-[#05070a] border border-[#1e293b] rounded-xs">
            {candidates.length === 0 ? (
              <div className="p-4 text-center text-[#94a3b8] text-[10px]">
                No unlocked weapons match the selected filter in {activeWeaponClass}.
              </div>
            ) : (
              candidates.map(({ instanceId, resolvedW, stInfo }) => {
                const isEquippedHere = currentId === instanceId;
                const copies = getOwnedWeaponCount(state, instanceId);
                const itemHandling = evaluateEquipmentFeatHandling(state, instanceId);
                const wt = getWeaponInstanceEquipWeight(instanceId, state);
                return (
                  <div
                    key={instanceId}
                    onMouseEnter={() => setPreviewCandidateId(instanceId)}
                    onClick={() => setPreviewCandidateId(instanceId)}
                    className={`px-2.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      previewCandidateId === instanceId
                        ? 'bg-[#172554]/60'
                        : 'hover:bg-[#1e293b]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <HighResEquipmentArtCanvas
                        state={state}
                        itemIdOrName={instanceId}
                        slotHint={editingSlot}
                        sizeClass="w-8 h-8 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[11px] text-[#f8fafc] truncate">
                            {getEquipmentDisplayName(instanceId, state)}
                          </span>
                          <span className="text-[9px] text-[#94a3b8]">×{copies}</span>
                          <span className="text-[9px] text-[#7dd3fc]">
                            · {stInfo.functionalType} ({stInfo.variantSubtype})
                          </span>
                          <span className="text-[9px] text-[#ffd27d] font-mono">
                            · {wt} WT
                          </span>
                          <span
                            className={`text-[9px] font-bold ${
                              itemHandling.proficiencyTier === 'mastered'
                                ? 'text-[#86efac]'
                                : itemHandling.proficiencyTier === 'proficient'
                                  ? 'text-[#7dd3fc]'
                                  : itemHandling.proficiencyTier === 'locked'
                                    ? 'text-[#fca5a5]'
                                    : 'text-[#94a3b8]'
                            }`}
                          >
                            · {itemHandling.badgeLabel}
                          </span>
                        </div>
                        <div className="text-[9px] text-[#94a3b8] truncate">
                          {!itemHandling.canEquip
                            ? itemHandling.statusSummary
                            : `${resolvedW.damagePerShot} ${resolvedW.primaryDamageType} · S1: ${resolvedW.moveset?.[1]?.name || '—'} · S2: ${resolvedW.moveset?.[2]?.name || '—'}`}
                        </div>
                      </div>
                    </div>

                    {!itemHandling.canEquip && itemHandling.recommendedFeatId && onLocateFeat ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundSystem.playSelect();
                          setIsEditingLoadout(false);
                          if (itemHandling.recommendedFeatId) {
                            onLocateFeat(itemHandling.recommendedFeatId);
                          }
                        }}
                        className="px-2 py-1 rounded-xs text-[9px] font-bold border bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border-[#ef4444]/60 cursor-pointer shrink-0"
                      >
                        Feat →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEquipWeaponInSlot(instanceId);
                        }}
                        className={`px-2.5 py-1 rounded-xs text-[9px] font-bold border cursor-pointer shrink-0 ${
                          isEquippedHere
                            ? 'bg-[#1e293b] text-[#fde047] border-[#fde047]/60'
                            : 'bg-[#052e16] hover:bg-[#14532d] text-[#86efac] border-[#22c55e]/60'
                        }`}
                      >
                        {isEquippedHere ? 'Equipped' : 'Equip'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }

    // Hardware Slot Selector
    const hwSlotKey =
      editingSlot === 'head' ||
      editingSlot === 'plating' ||
      editingSlot === 'arms' ||
      editingSlot === 'legs' ||
      editingSlot === 'optics' ||
      editingSlot === 'sensoryA' ||
      editingSlot === 'sensoryB' ||
      editingSlot === 'actuators' ||
      editingSlot === 'reactor'
        ? editingSlot
        : 'plating';

    const hwCandidates = CHASSIS_HARDWARE_CATALOG.filter(
      (hw) => hw.slot === hwSlotKey && (isCheatMode || isEquipmentUnlocked(state, hw.id))
    ).flatMap((baseHw) => {
      const instances = getOwnedEquipmentInstances(state, baseHw.id);
      const ids = instances.length > 0 ? instances : [baseHw.id];
      return ids.map((instanceId) => ({
        baseHw,
        instanceId,
        resolvedHw: findHardwareItemByNameOrId(instanceId) || baseHw,
      }));
    });

    const inspectedHwId = previewCandidateId || currentId || hwCandidates[0]?.instanceId || '';
    const inspectedHw = findHardwareItemByNameOrId(inspectedHwId);

    const handleEquipHardwareInSlot = (instanceId: string) => {
      const hw = findHardwareItemByNameOrId(instanceId);
      if (!hw) return;
      const hwHandling = evaluateEquipmentFeatHandling(state, hw.id);
      if (!hwHandling.canEquip) {
        soundSystem.playMenuBeep();
        sayCtx.say(`FEAT PREREQ REQUIRED: ${hwHandling.statusSummary.toUpperCase()}`);
        notifyOrionStateChange();
        return;
      }
      soundSystem.playPowerup();
      switch (hwSlotKey) {
        case 'head':
          eq.head = hw.id;
          if (eq.armor) eq.armor.head = hw.id;
          break;
        case 'plating':
          eq.plating = hw.id;
          if (eq.armor) eq.armor.torso = hw.id;
          break;
        case 'arms':
          eq.arms = hw.id;
          if (eq.armor) eq.armor.arms = hw.id;
          break;
        case 'legs':
          eq.legs = hw.id;
          if (eq.armor) eq.armor.legs = hw.id;
          break;
        case 'optics':
          eq.headOptics = hw.id;
          break;
        case 'sensoryA':
          eq.sensoryA = hw.id;
          break;
        case 'sensoryB':
          eq.sensoryB = hw.id;
          break;
        case 'actuators':
          eq.armActuators = hw.id;
          break;
        case 'reactor':
          eq.reactorCore = hw.id;
          if (eq.armor) eq.armor.generator = hw.id;
          if (hw.reactorFamily) state.reactor = hw.reactorFamily;
          break;
      }
      sayCtx.say(`EQUIPPED ${hw.name.toUpperCase()} IN ${hw.canonicalSlotLabel.toUpperCase()}`);
      setIsEditingLoadout(false);
      notifyOrionStateChange();
    };

    return (
      <div
        data-menu-scope="true"
        className="flex-1 min-h-0 flex flex-col p-2.5 bg-[#090d14] rounded-xs border border-[#fde047] space-y-2 overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-menu-back="true"
              onClick={() => setIsEditingLoadout(false)}
              className="px-2.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] rounded-xs text-[10px] font-bold cursor-pointer"
            >
              ← Back to Slots
            </button>
            <span className="text-[11px] font-bold text-[#fde047]">
              SELECT HARDWARE · [{hwSlotKey.toUpperCase()}]
            </span>
          </div>
          {inspectedHw && onOpenArmory && (
            <button
              type="button"
              onClick={() => {
                setIsEditingLoadout(false);
                onOpenArmory(editingSlot, inspectedHw.id);
              }}
              className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#fb923c] border border-[#fb923c]/50 rounded-xs text-[9px] font-bold cursor-pointer"
            >
              ⚙ Modify in Armory
            </button>
          )}
        </div>

        {inspectedHw && (
          <div className="p-2 bg-[#05070a] rounded-xs border border-[#334155] flex items-center gap-3 shrink-0">
            <HighResEquipmentArtCanvas
              state={state}
              itemIdOrName={inspectedHw.id}
              slotHint={editingSlot}
              sizeClass="w-14 h-14 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[11px] text-[#38bdf8]">{inspectedHw.name}</div>
              <HardwareStatReadout
                hw={inspectedHw}
                maxGemSlots={getEquipmentMaxModSlots(inspectedHw.id)}
              />
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#1e293b] bg-[#05070a] border border-[#1e293b] rounded-xs">
          {hwCandidates.map(({ instanceId, resolvedHw }) => {
            const isEquippedHere =
              currentId === instanceId || currentId === resolvedHw.name;
            const hwEval = evaluateEquipmentFeatHandling(state, resolvedHw.id);
            return (
              <div
                key={instanceId}
                onMouseEnter={() => setPreviewCandidateId(instanceId)}
                onClick={() => setPreviewCandidateId(instanceId)}
                className={`px-2.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  previewCandidateId === instanceId
                    ? 'bg-[#172554]/60'
                    : 'hover:bg-[#1e293b]/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <HighResEquipmentArtCanvas
                    state={state}
                    itemIdOrName={resolvedHw.id}
                    slotHint={editingSlot}
                    sizeClass="w-8 h-8 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-[11px] text-[#e2e8f0] truncate">
                        {resolvedHw.name}
                      </span>
                      <span className="text-[9px] text-[#ffd27d] font-mono">
                        · {getHardwareBaseWeight(resolvedHw)} WT
                      </span>
                      <span
                        className={`text-[9px] font-bold ${
                          hwEval.proficiencyTier === 'mastered'
                            ? 'text-[#86efac]'
                            : hwEval.proficiencyTier === 'proficient'
                              ? 'text-[#7dd3fc]'
                              : hwEval.proficiencyTier === 'locked'
                                ? 'text-[#fca5a5]'
                                : 'text-[#94a3b8]'
                        }`}
                      >
                        · {hwEval.badgeLabel}
                      </span>
                    </div>
                    <div className="text-[9px] text-[#94a3b8] truncate">
                      {!hwEval.canEquip ? hwEval.statusSummary : resolvedHw.description}
                    </div>
                  </div>
                </div>
                {!hwEval.canEquip && hwEval.recommendedFeatId && onLocateFeat ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundSystem.playSelect();
                      setIsEditingLoadout(false);
                      if (hwEval.recommendedFeatId) {
                        onLocateFeat(hwEval.recommendedFeatId);
                      }
                    }}
                    className="px-2 py-1 rounded-xs text-[9px] font-bold border bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border-[#ef4444]/60 cursor-pointer shrink-0"
                  >
                    Feat →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEquipHardwareInSlot(instanceId);
                    }}
                    className={`px-2.5 py-1 rounded-xs text-[9px] font-bold border cursor-pointer shrink-0 ${
                      isEquippedHere
                        ? 'bg-[#1e293b] text-[#fde047] border-[#fde047]/60'
                        : 'bg-[#052e16] hover:bg-[#14532d] text-[#86efac] border-[#22c55e]/60'
                    }`}
                  >
                    {isEquippedHere ? 'Equipped' : 'Equip'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const eligibleStances = getEligibleSpecialistStances(state);
  const eligibleFeatIdSet = new Set(eligibleStances.map((s) => s.featId));
  const equippedFeatIdSet = new Set(
    (state.equippedFeats || []).map((id) => normalizeCanonicalFeatId(id))
  );
  const socketedUnmetStances = SPECIALIST_STANCE_LIST.filter(
    (st) => equippedFeatIdSet.has(st.featId) && !eligibleFeatIdSet.has(st.featId)
  );
  const sandboxUnsocketedStances = isCheatMode
    ? SPECIALIST_STANCE_LIST.filter((st) => !equippedFeatIdSet.has(st.featId))
    : [];

  const filteredReadyStances = eligibleStances.filter(
    (st) => stanceDisciplineFilter === 'ALL' || st.skillId === stanceDisciplineFilter
  );
  const filteredSocketedUnmetStances = socketedUnmetStances.filter(
    (st) => stanceDisciplineFilter === 'ALL' || st.skillId === stanceDisciplineFilter
  );
  const filteredSandboxStances = sandboxUnsocketedStances.filter(
    (st) => stanceDisciplineFilter === 'ALL' || st.skillId === stanceDisciplineFilter
  );

  const specEval = evaluateActiveSpecialistStance(state);
  const action4Profile = resolveActiveAction4DefensiveMode(state);
  const activeStanceValue =
    specEval.available && specEval.mode === 'auto' && specEval.stance
      ? specEval.stance.featId
      : 'base';

  const handleSelectLoadoutStance = (val: string) => {
    if (val === 'base') {
      setActiveSpecialistStance(state, 'base', sayCtx);
      soundSystem.playPowerup();
      notifyOrionStateChange();
      return;
    }

    const stanceDef = SPECIALIST_STANCE_BY_FEAT_ID[val];
    if (!stanceDef) return;

    if (isCheatMode && !equippedFeatIdSet.has(stanceDef.featId)) {
      state.equippedFeats = [...(state.equippedFeats || []), stanceDef.featId];
      syncStateGates(state);
    }

    const gearCheck = doesLoadoutMatchSpecialistStance(state, stanceDef);
    if (!gearCheck.matched) {
      soundSystem.playMenuBeep();
      sayCtx.say(
        `${stanceDef.stanceName.toUpperCase()} REQUIRES: ${stanceDef.requiredEquipmentLabel.toUpperCase()}`
      );
      notifyOrionStateChange();
      return;
    }

    setActiveSpecialistStance(state, stanceDef.featId, sayCtx);
    soundSystem.playPowerup();
    notifyOrionStateChange();
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col space-y-1.5 overflow-hidden text-[10px]">
      {isEditingLoadout ? (
        renderSlotEquipmentSelector()
      ) : (
        <>
          {/* Clean Two-Row Loadout Header: Row 1 (Grip, Schematic, Kit Preset, Weight) & Row 2 (Broken-Up Stance Selector) */}
          <div className="flex flex-col gap-1.5 px-2 py-1.5 bg-[#090d14] border border-[#1e293b] rounded-xs shrink-0">
            {/* Row 1: Grip Toggle + Mech Schematic + Sandbox Kit Preset + Total Load Weight */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {!isTwoHandOnlyWeapon(slot1Id, state) && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetGrip = mainGrip === '2h' ? '1h' : '2h';
                      const changed = setMainWeaponGrip(state, targetGrip, sayCtx);
                      if (changed) soundSystem.playPowerup();
                      else soundSystem.playMenuBeep();
                      notifyOrionStateChange();
                    }}
                    className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#7dd3fc] border border-[#38bdf8]/50 rounded-xs text-[9px] font-bold cursor-pointer shrink-0"
                  >
                    Grip: {mainGrip.toUpperCase()}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    soundSystem.playSelect();
                    setShowDollOverlay(true);
                  }}
                  className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#cbd5e1] border border-[#334155] rounded-xs text-[9px] font-bold cursor-pointer shrink-0"
                >
                  Mech Schematic
                </button>

                {action4Profile.canToggleReverseGripKatana && (
                  <button
                    type="button"
                    title="Dual Katana Doctrine: Toggle Reverse-Grip (+18% Tempo, +0.10s Parry, -20% Reach, locks Guard/Parry to Parry)"
                    onClick={() => {
                      toggleReverseGripKatanaMode(state, sayCtx);
                      soundSystem.playPowerup();
                      notifyOrionStateChange();
                    }}
                    className={`px-2 py-0.5 rounded-xs text-[9px] font-bold border cursor-pointer shrink-0 ${
                      action4Profile.reverseGripKatanaActive
                        ? 'bg-purple-950/70 text-[#e9d5ff] border-[#c084fc]/70'
                        : 'bg-[#0f172a] hover:bg-[#1e293b] text-[#cbd5e1] border-[#334155]'
                    }`}
                  >
                    Katana Grip:{' '}
                    {action4Profile.reverseGripKatanaActive ? 'REVERSE-GRIP' : 'STANDARD'}
                  </button>
                )}

                <span className="text-[9px] text-[#94a3b8] truncate">
                  Active Moveset:{' '}
                  <b className="text-[#fde047]">{activeStance.shortTag.toUpperCase()}</b>
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isCheatMode && (
                  <select
                    aria-label="Load Starting Kit Preset"
                    value={state.traitLine}
                    onChange={(e) => {
                      const kitId = e.target.value as TraitLine;
                      const kit = TRAIT_REGISTRY[kitId];
                      soundSystem.playPowerup();
                      state.traitLine = kitId;
                      state.equipmentSlots = createInitialEquipmentSlots(kitId);
                      state.equippedWeapons = [...(kit.startingWeapons || ['long_sword'])];
                      syncStateGates(state);
                      sayCtx.say(`LOADED ${kit.name.toUpperCase()} PRESET`);
                      notifyOrionStateChange();
                    }}
                    className="max-w-[145px] truncate px-1.5 py-0.5 bg-[#05070a] text-[#ffd27d] border border-[#334155] rounded-xs text-[11px] font-bold cursor-pointer focus:outline-none"
                  >
                    {ALL_TRAIT_LINES.map((kitId: TraitLine) => (
                      <option key={kitId} value={kitId}>
                        Kit: {TRAIT_REGISTRY[kitId].name}
                      </option>
                    ))}
                  </select>
                )}

                <span
                  className={`text-[9px] font-mono tabular-nums font-bold ${
                    loadMetrics.loadBracket === 'light'
                      ? 'text-[#6ee7b7]'
                      : loadMetrics.loadBracket === 'medium'
                        ? 'text-[#7dd3fc]'
                        : loadMetrics.loadBracket === 'heavy'
                          ? 'text-[#fcd34d]'
                          : 'text-[#fca5a5]'
                  }`}
                >
                  {loadMetrics.equippedWeight}/{loadMetrics.maxCapacity} WT ({loadMetrics.loadPct}
                  %)
                </span>
              </div>
            </div>

            {/* Two-Line Stance Selector: Line 1 (Discipline Filter + Base/Inspect) & Line 2 (Full-Width Active Stance Select) */}
            <div className="flex flex-col gap-1 pt-1 border-t border-[#1e293b]/80">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[9px] font-bold text-[#fde047] shrink-0">
                    Stance Discipline:
                  </span>
                  <select
                    aria-label="Filter Stances by Discipline"
                    value={stanceDisciplineFilter}
                    onChange={(e) => {
                      soundSystem.playSelect();
                      setStanceDisciplineFilter(e.target.value as 'ALL' | PilotSkillId);
                    }}
                    className="px-2 py-0.5 bg-[#05070a] text-[#cbd5e1] border border-[#334155] rounded-xs text-[11px] font-bold cursor-pointer focus:outline-none"
                  >
                    <option value="ALL">All 6 Disciplines</option>
                    <option value="Warrior">Warrior (Fighter)</option>
                    <option value="Guardian">Guardian (Fighter)</option>
                    <option value="Wizard">Wizard (Scholar)</option>
                    <option value="Cleric">Cleric (Scholar)</option>
                    <option value="Marauder">Marauder (Rogue)</option>
                    <option value="Rogue">Rogue (Rogue)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectLoadoutStance('base')}
                    className={`px-2 py-0.5 rounded-xs text-[9px] font-bold border cursor-pointer ${
                      activeStanceValue === 'base'
                        ? 'bg-[#fde047] text-[#05070a] border-[#fde047]'
                        : 'bg-[#05070a] text-[#94a3b8] border-[#334155] hover:text-[#e2e8f0]'
                    }`}
                  >
                    Base Moveset
                  </button>
                  {activeStanceValue !== 'base' && onLocateFeat && (
                    <button
                      type="button"
                      onClick={() => {
                        soundSystem.playSelect();
                        onLocateFeat(activeStanceValue);
                      }}
                      className="px-2 py-0.5 rounded-xs bg-[#172554] hover:bg-[#1e3a8a] text-[#7dd3fc] border border-[#38bdf8]/50 text-[9px] font-bold cursor-pointer"
                    >
                      Inspect Stance
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 w-full">
                <span className="text-[9px] font-bold text-[#94a3b8] shrink-0">
                  Active Stance:
                </span>
                <select
                  aria-label="Active Specialist Stance"
                  value={activeStanceValue}
                  onChange={(e) => handleSelectLoadoutStance(e.target.value)}
                  className="w-full min-w-0 truncate px-2 py-0.5 bg-[#05070a] text-[#fde047] border border-[#eab308]/60 rounded-xs text-[11px] font-bold cursor-pointer focus:outline-none"
                >
                  <option value="base">
                    Base Weapon Moveset ({activeStance.shortTag.toUpperCase()} ·{' '}
                    {mainGrip.toUpperCase()})
                  </option>
                  {filteredReadyStances.length > 0 && (
                    <optgroup label="Ready (Socketed & Gear Met)">
                      {filteredReadyStances.map((st) => (
                        <option key={st.featId} value={st.featId}>
                          {st.stanceName} [{st.shortTag}] · {st.skillId} (
                          {st.requiredEquipmentLabel})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {filteredSocketedUnmetStances.length > 0 && (
                    <optgroup label="Socketed (Gear Requirement Unmet)">
                      {filteredSocketedUnmetStances.map((st) => (
                        <option key={st.featId} value={st.featId}>
                          {st.stanceName} · {st.skillId} (Need: {st.requiredEquipmentLabel})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {filteredSandboxStances.length > 0 && (
                    <optgroup label="Sandbox Stances (Select to Socket)">
                      {filteredSandboxStances.map((st) => {
                        const gearOk = doesLoadoutMatchSpecialistStance(state, st).matched;
                        return (
                          <option key={st.featId} value={st.featId}>
                            {st.stanceName} · {st.skillId}{' '}
                            {gearOk ? '[Gear Met]' : `[Need ${st.requiredEquipmentLabel}]`}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* 100% Full-Width Scannable Anatomical Hardpoint List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#1e293b]/80 bg-[#090d14]/90 border border-[#1e293b] rounded-xs">
            {/* Group A: Ordnance & Trigger Hardpoints */}
            <div className="px-2.5 py-1 bg-[#05070a] text-[9px] font-bold text-[#fde047] flex items-center justify-between">
              <span>ORDNANCE &amp; TRIGGER HARDPOINTS</span>
              <span className="text-[#94a3b8] font-normal">Click row to inspect · Click Swap to change</span>
            </div>

            {renderCompactSlotRow({
              slot: 'slot1',
              title: 'MAIN HAND [R]',
              itemId: slot1Id,
              itemName: getEquipmentDisplayName(slot1Id, state),
              subtitle: mainWeapon
                ? `${getWeaponSubtypeInfo(mainWeapon.id).subtype} · ${mainWeapon.damagePerShot} DMG`
                : 'Primary Weapon',
              wtLabel: `${getWeaponInstanceEquipWeight(slot1Id, state)} WT`,
              accentColor: '#fde047',
              badgeText: mainGrip.toUpperCase(),
            })}

            {renderCompactSlotRow({
              slot: 'slot2',
              title: 'SIDE HAND [L]',
              itemId: slot2Id,
              itemName: sideWeapon
                ? getEquipmentDisplayName(slot2Id, state)
                : mainGrip === '2h'
                  ? `${getEquipmentDisplayName(slot1Id, state)} (2H Grip)`
                  : 'Empty Off-Hand',
              subtitle: sideWeapon
                ? mainGrip === '2h'
                  ? `${getWeaponSubtypeInfo(sideWeapon.id).subtype} · Holstered while 2H`
                  : `${getWeaponSubtypeInfo(sideWeapon.id).subtype}`
                : 'Two-Handing Main Weapon',
              wtLabel:
                slot2Id && slot2Id !== slot1Id
                  ? `${getWeaponInstanceEquipWeight(slot2Id, state)} WT`
                  : '0 WT',
              accentColor: '#38bdf8',
              badgeText: sideWeapon ? (mainGrip === '2h' ? 'HOLSTERED' : 'ACTIVE') : '2H',
            })}

            {renderCompactSlotRow({
              slot: 'slot3',
              title: 'AUXILIARY [BACK]',
              itemId: slot3Id,
              itemName: auxWeapon ? auxWeapon.name : 'Empty Back Mount',
              subtitle: auxWeapon
                ? `${getWeaponSubtypeInfo(auxWeapon.id).subtype} · Dorsal Mount (50% WT)`
                : 'Carrier / Launcher / Catalyst',
              wtLabel:
                slot3Id && slot3Id !== slot1Id && slot3Id !== slot2Id
                  ? `${Math.round(getWeaponInstanceEquipWeight(slot3Id, state) * 0.5)} WT`
                  : '0 WT',
              accentColor: '#c084fc',
              badgeText: eq.auxActive ? 'ACTIVE' : 'BACK [L]',
            })}

            {/* Combat Actions Section: Strictly Weapon Swap, Boost, and Guard / Parry */}
            <div className="px-2.5 py-1 bg-[#05070a] text-[9px] font-bold text-[#fde047] flex items-center justify-between">
              <span>COMBAT ACTIONS (WEAPON SWAP, BOOST &amp; GUARD / PARRY)</span>
              <span className="text-[#94a3b8] font-normal">
                Swap &amp; Boost editable from equipped items · Guard/Parry auto-swaps by gear/feats
              </span>
            </div>

            {/* 1. WEAPON SWAP (L [Q] LONG-PRESS) — Editable based on equipped items */}
            <div
              role="button"
              tabIndex={0}
              data-menu-focusable="true"
              onClick={() => {
                soundSystem.playSelect();
                openSlotEditor('bind_l');
              }}
              className="px-2.5 py-1.5 hover:bg-[#1e293b]/70 transition-colors cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] font-bold text-[#fde047] w-28 shrink-0">
                    WEAPON SWAP [L]
                  </span>
                  <span className="font-bold text-[11px] text-[#e2e8f0] truncate">
                    {leftAction.name}
                  </span>
                  <span className="text-[9px] text-[#7dd3fc] truncate">
                    · {leftAction.sourceLabel}
                  </span>
                </div>
                <div className="text-[9px] text-[#94a3b8] pl-30 truncate">
                  L [Q] Long-Press: <b className="text-[#fde047]">{leftAction.name}</b> · Tap: Target Lock / Cycle · Double-Tap: Unlock
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isDefaultLHoldSwap && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      assignTriggerAction(state, 'L', 'weapon_swap');
                      sayCtx.say('RESET WEAPON SWAP (L [Q] HOLD) TO DEFAULT');
                      soundSystem.playSelect();
                      notifyOrionStateChange();
                    }}
                    className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0] border border-[#334155] rounded-xs text-[9px] font-bold cursor-pointer"
                  >
                    Reset Swap
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundSystem.playSelect();
                    openSlotEditor('bind_l');
                  }}
                  className="px-2 py-0.5 bg-[#172554] hover:bg-[#1e3a8a] text-[#fde047] border border-[#38bdf8]/50 rounded-xs text-[9px] font-bold cursor-pointer"
                >
                  Edit Action
                </button>
              </div>
            </div>

            {/* 2. BOOST (B [K]) — Editable based on equipped items */}
            <div
              role="button"
              tabIndex={0}
              data-menu-focusable="true"
              onClick={() => {
                soundSystem.playSelect();
                openSlotEditor('bind_b');
              }}
              className="px-2.5 py-1.5 hover:bg-[#1e293b]/70 transition-colors cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] font-bold text-[#4ade80] w-28 shrink-0">
                    BOOST [B / K]
                  </span>
                  <span className="font-bold text-[11px] text-[#e2e8f0] truncate">
                    {boostAction.name}
                  </span>
                  <span className="text-[9px] text-[#86efac] truncate">
                    · {boostAction.sourceLabel}
                  </span>
                </div>
                <div className="text-[9px] text-[#94a3b8] pl-30 truncate">
                  {isDefaultBBooster ? (
                    <>
                      Tap B [K]: Directional Thruster Dash · Hold B [K]: Continuous Boost Glide
                    </>
                  ) : (
                    <>
                      B [K] Custom Equipped Action: <b className="text-[#86efac]">{boostAction.name}</b>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isDefaultBBooster && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      assignTriggerAction(state, 'B', 'booster_dash');
                      sayCtx.say('RESET BOOST (B [K]) TO BOOSTER THRUSTERS');
                      soundSystem.playSelect();
                      notifyOrionStateChange();
                    }}
                    className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0] border border-[#334155] rounded-xs text-[9px] font-bold cursor-pointer"
                  >
                    Reset Boost
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundSystem.playSelect();
                    openSlotEditor('bind_b');
                  }}
                  className="px-2 py-0.5 bg-[#172554] hover:bg-[#1e3a8a] text-[#fde047] border border-[#38bdf8]/50 rounded-xs text-[9px] font-bold cursor-pointer"
                >
                  Edit Action
                </button>
              </div>
            </div>

            {/* 3. GUARD / PARRY (Y [I] HOLD) — Restrictively available & auto-swaps by feats/loadout unless feats allow manual selection */}
            <div
              role="button"
              tabIndex={0}
              data-menu-focusable="true"
              title={action4Profile.summary}
              onClick={() => {
                if (!action4Profile.canManualSelect || action4Profile.isModeLocked) {
                  soundSystem.playMenuBeep();
                  sayCtx.say(
                    `${action4Profile.badgeLabel}: ${action4Profile.statusReason.toUpperCase()}`
                  );
                  notifyOrionStateChange();
                  return;
                }
                toggleLoadoutAction4Mode(state, undefined, sayCtx);
                soundSystem.playPowerup();
                notifyOrionStateChange();
              }}
              className="px-2.5 py-1.5 hover:bg-[#1e293b]/70 transition-colors cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] font-bold text-[#fbbf24] w-28 shrink-0">
                    GUARD / PARRY
                  </span>
                  <span
                    className={`font-bold text-[11px] truncate ${
                      !action4Profile.available
                        ? 'text-[#fca5a5]'
                        : action4Profile.priorityTier < 3
                          ? 'text-[#fde047]'
                          : action4Profile.mode === 'parry'
                            ? 'text-[#fde047]'
                            : 'text-[#7dd3fc]'
                    }`}
                  >
                    {action4Profile.badgeLabel}
                  </span>
                  <span className="text-[9px] text-[#94a3b8] truncate">
                    · Y [I] Hold
                  </span>
                </div>
                <div className="text-[9px] text-[#94a3b8] pl-30 truncate">
                  {action4Profile.statusReason}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {action4Profile.canManualSelect && !action4Profile.isModeLocked ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLoadoutAction4Mode(state, undefined, sayCtx);
                      soundSystem.playPowerup();
                      notifyOrionStateChange();
                    }}
                    className="px-2 py-0.5 bg-[#172554] hover:bg-[#1e3a8a] text-[#fde047] border border-[#38bdf8]/60 rounded-xs text-[9px] font-bold cursor-pointer"
                  >
                    Switch to {action4Profile.mode === 'block' ? 'Parry' : 'Guard'}
                  </button>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded-xs text-[9px] font-bold border ${
                      !action4Profile.available
                        ? 'bg-[#450a0a]/60 text-[#fca5a5] border-[#ef4444]/40'
                        : 'bg-[#0f172a] text-[#94a3b8] border-[#334155]'
                    }`}
                  >
                    {!action4Profile.available ? 'Unavailable' : 'Auto (Feat / Gear)'}
                  </span>
                )}
              </div>
            </div>

            {/* Group B: Chassis Armor & Sub-Module Hardpoints */}
            <div className="px-2.5 py-1 bg-[#05070a] text-[9px] font-bold text-[#38bdf8]">
              CHASSIS ARMOR &amp; INTERNAL SUB-MODULES
            </div>

            {renderCompactSlotRow({
              slot: 'head',
              title: 'HEAD · DOME',
              itemId: headItem?.id || eq.head || null,
              itemName: headItem?.name || eq.head || 'None',
              subtitle: headItem
                ? `+${headItem.armorDurability ?? 0} DUR · +${headItem.armorRating ?? 0} RTG · Optics: ${opticsItem?.name.split(' ').slice(-2).join(' ') || 'Std'}`
                : 'No Dome Plate',
              wtLabel: `${loadMetrics.breakdown.headWeight} WT`,
              accentColor: '#38bdf8',
            })}

            {renderCompactSlotRow({
              slot: 'plating',
              title: 'TORSO · PLATING',
              itemId: platingItem?.id || eq.plating || null,
              itemName: platingItem?.name || eq.plating || 'None',
              subtitle: platingItem
                ? `${(platingItem.armorType || 'Reactive').toUpperCase()} · +${platingItem.armorDurability ?? 0} DUR · Reactor: ${state.reactor}`
                : 'No Frame Plating',
              wtLabel: `${loadMetrics.breakdown.frameWeight} WT`,
              accentColor: '#a855f7',
            })}

            {renderCompactSlotRow({
              slot: 'arms',
              title: 'ARMS · APERTURE',
              itemId: armsItem?.id || eq.arms || null,
              itemName: armsItem?.name || eq.arms || 'None',
              subtitle: armsItem
                ? `+${armsItem.armorDurability ?? 0} DUR · +${armsItem.shieldBonus ?? 0} SHD · Actuators: ${actuatorsItem?.name.split(' ').slice(-2).join(' ') || 'Std'}`
                : 'No Aperture Plate',
              wtLabel: `${loadMetrics.breakdown.armsWeight} WT`,
              accentColor: '#fb923c',
            })}

            {renderCompactSlotRow({
              slot: 'legs',
              title: 'LEGS · STRIDERS',
              itemId: legsItem?.id || eq.legs || null,
              itemName: legsItem?.name || eq.legs || 'None',
              subtitle: legsItem
                ? `+${getHardwareCapacityBonus(legsItem)} LOAD CAP · ${legsItem.stabilityBonus ? `+${legsItem.stabilityBonus} STB` : 'Agile Stride'}`
                : 'No Leg Striders',
              wtLabel: `${legsItem ? getHardwareBaseWeight(legsItem) : 12} WT`,
              accentColor: '#4ade80',
            })}
          </div>

          {/* Pop-Up / Slide-Over Slot Detail Inspector */}
          {contextMenuSlot && (
            <div className="absolute inset-0 z-30 bg-[#05070a]/95 backdrop-blur-xs border border-[#fde047]/60 rounded-xs flex flex-col p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b] shrink-0">
                <button
                  type="button"
                  data-menu-back="true"
                  onClick={() => {
                    soundSystem.playMenuBeep();
                    setContextMenuSlot(null);
                  }}
                  className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] font-bold text-[10px] rounded-xs border border-[#475569] cursor-pointer"
                >
                  ← Back to Slots
                </button>
                <span className="text-[10px] font-bold text-[#fde047] uppercase">
                  Slot Inspector · [{contextMenuSlot.toUpperCase()}]
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                {(() => {
                  const slotItemId = getEquippedIdForSlot(contextMenuSlot);
                  const slotWpn = slotItemId ? getWeaponDefinition(slotItemId) : undefined;
                  const slotHw = slotItemId ? findHardwareItemByNameOrId(slotItemId) : undefined;
                  const handlingEval =
                    contextMenuSlot !== 'bind_l' &&
                    contextMenuSlot !== 'bind_b' &&
                    contextMenuSlot !== 'bind_r' &&
                    slotItemId
                      ? evaluateEquipmentFeatHandling(state, slotItemId)
                      : null;
                  const recFeat = handlingEval?.recommendedFeatId
                    ? CANONICAL_FRAME_FEAT_REGISTRY[handlingEval.recommendedFeatId]
                    : undefined;

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row items-center gap-3 p-2.5 bg-[#090d14] border border-[#1e293b] rounded-xs">
                        <HighResEquipmentArtCanvas
                          state={state}
                          itemIdOrName={slotItemId}
                          slotHint={contextMenuSlot}
                          sizeClass="w-20 h-20 shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1.5 w-full">
                          <div className="text-[13px] font-bold text-[#fde047]">
                            {getEquipmentDisplayName(slotItemId, state)}
                            {devMode && slotItemId ? (
                              <span className="ml-2 text-[9px] text-[#64748b] font-mono">
                                [{slotItemId}]
                              </span>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                soundSystem.playSelect();
                                setPreviewCandidateId(slotItemId);
                                openSlotEditor(contextMenuSlot);
                                setContextMenuSlot(null);
                              }}
                              className="px-3 py-1 bg-[#172554] hover:bg-[#1e3a8a] text-[#fde047] border border-[#38bdf8]/60 rounded-xs text-[10px] font-bold cursor-pointer"
                            >
                              Equip / Swap Item
                            </button>

                            {(contextMenuSlot === 'slot2' || contextMenuSlot === 'slot3') &&
                              slotItemId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundSystem.playSelect();
                                    if (contextMenuSlot === 'slot2') {
                                      eq.slot2 = null;
                                      eq.mainGrip = '2h';
                                      sayCtx.say('UNEQUIPPED SIDE HAND [L] → MAIN HAND NOW 2H');
                                    } else {
                                      eq.slot3 = null;
                                      sayCtx.say('UNEQUIPPED AUXILIARY [BACK]');
                                    }
                                    setContextMenuSlot(null);
                                    notifyOrionStateChange();
                                  }}
                                  className="px-3 py-1 bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#ef4444]/50 rounded-xs text-[10px] font-bold cursor-pointer"
                                >
                                  Unequip Slot
                                </button>
                              )}

                            {contextMenuSlot === 'slot1' && !isTwoHandOnlyWeapon(slot1Id, state) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const targetGrip = mainGrip === '2h' ? '1h' : '2h';
                                  const changed = setMainWeaponGrip(state, targetGrip, sayCtx);
                                  if (changed) soundSystem.playPowerup();
                                  else soundSystem.playMenuBeep();
                                  notifyOrionStateChange();
                                }}
                                className="px-3 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-[#7dd3fc] border border-[#38bdf8]/50 rounded-xs text-[10px] font-bold cursor-pointer"
                              >
                                Toggle Grip ({mainGrip === '2h' ? 'Switch to 1H' : 'Switch to 2H'})
                              </button>
                            )}

                            {(contextMenuSlot === 'slot2' || contextMenuSlot === 'slot3') && (
                              <button
                                type="button"
                                onClick={() => {
                                  performAuxiliarySwap(state, sayCtx);
                                  soundSystem.playSelect();
                                  notifyOrionStateChange();
                                }}
                                className="px-3 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-[#c084fc] border border-[#c084fc]/50 rounded-xs text-[10px] font-bold cursor-pointer"
                              >
                                Toggle Back Launcher [L]
                              </button>
                            )}

                            {onOpenArmory &&
                              contextMenuSlot !== 'bind_l' &&
                              contextMenuSlot !== 'bind_b' &&
                              contextMenuSlot !== 'bind_r' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundSystem.playSelect();
                                    const targetSlot = contextMenuSlot;
                                    setContextMenuSlot(null);
                                    onOpenArmory(targetSlot, slotItemId || undefined);
                                  }}
                                  className="px-3 py-1 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] border border-[#fb923c]/70 rounded-xs text-[10px] font-bold cursor-pointer"
                                >
                                  ⚙ Modify in Armory
                                </button>
                              )}
                          </div>
                        </div>
                      </div>

                      {slotWpn && slotItemId && (
                        <div className="p-2.5 bg-[#090d14] border border-[#1e293b] rounded-xs space-y-1.5">
                          <div className="text-[10px] text-[#cbd5e1]">{slotWpn.description}</div>
                          <WeaponStatReadout w={slotWpn} instanceId={slotItemId} state={state} />
                        </div>
                      )}

                      {slotHw && (
                        <div className="p-2.5 bg-[#090d14] border border-[#1e293b] rounded-xs space-y-1.5">
                          <HardwareStatReadout
                            hw={slotHw}
                            maxGemSlots={getEquipmentMaxModSlots(slotHw.id)}
                          />
                        </div>
                      )}

                      {handlingEval && (
                        <div className="p-2.5 bg-[#090d14] rounded-xs border border-[#1e293b] flex flex-wrap items-center justify-between gap-2 text-[9px]">
                          <div className="space-y-0.5">
                            <div className="font-bold text-[#94a3b8]">
                              FEAT HANDLING ·{' '}
                              <span
                                className={
                                  handlingEval.proficiencyTier === 'mastered'
                                    ? 'text-[#86efac]'
                                    : handlingEval.proficiencyTier === 'proficient'
                                      ? 'text-[#7dd3fc]'
                                      : handlingEval.proficiencyTier === 'locked'
                                        ? 'text-[#fca5a5]'
                                        : 'text-[#cbd5e1]'
                                }
                              >
                                {handlingEval.badgeLabel}
                              </span>
                            </div>
                            <div className="text-[#cbd5e1]">{handlingEval.statusSummary}</div>
                          </div>
                          {recFeat && onLocateFeat && (
                            <button
                              type="button"
                              onClick={() => {
                                soundSystem.playSelect();
                                setContextMenuSlot(null);
                                onLocateFeat(recFeat.id);
                              }}
                              className="px-2.5 py-1 rounded-xs bg-[#1e1b4b] hover:bg-[#312e81] text-[#e9d5ff] border border-[#818cf8]/50 font-bold cursor-pointer"
                            >
                              Locate [{recFeat.name}] in Feats →
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Optional Pop-Up Mech Doll Schematic Overlay */}
          {showDollOverlay && (
            <div className="absolute inset-0 z-30 bg-[#05070a]/95 backdrop-blur-xs border border-[#38bdf8]/50 rounded-xs flex flex-col p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b] shrink-0">
                <button
                  type="button"
                  data-menu-back="true"
                  onClick={() => {
                    soundSystem.playMenuBeep();
                    setShowDollOverlay(false);
                  }}
                  className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] font-bold text-[10px] rounded-xs border border-[#475569] cursor-pointer"
                >
                  ← Back to Slots
                </button>
                <span className="text-[10px] font-bold text-[#38bdf8] uppercase">
                  Anatomical Mech Doll Schematic (Click Hardpoint to Inspect)
                </span>
              </div>
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center overflow-y-auto">
                <HighResMechDollCanvas
                  state={state}
                  selectedSlot={contextMenuSlot || 'slot1'}
                  hoveredSlot={null}
                  onSelectSlot={(s) => {
                    soundSystem.playSelect();
                    setShowDollOverlay(false);
                    setContextMenuSlot(s);
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Props for `SatchelInventoryTab` (`INVENTORY` menu).
 */
export interface SatchelInventoryTabProps {
  state: OrionState;
  isCheatMode: boolean;
  invCategory: EquipmentInventoryCategory;
  setInvCategory: React.Dispatch<React.SetStateAction<EquipmentInventoryCategory>>;
  invSubtype: string;
  setInvSubtype: React.Dispatch<React.SetStateAction<string>>;
  openSlotEditor: (slot: EditableLoadoutSlot) => void;
  onOpenProgressionTab: () => void;
  onOpenArmory?: (slot?: EditableLoadoutSlot, itemId?: string) => void;
  handleUseItem: (itemId: string) => void;
}

/**
 * Renders the `CARGO INVENTORY` menu using a Single Compact Filter Bar, a 100% Full-Width Scannable
 * 1-Line Row List, and a Pop-Up Inventory Item Detail Inspector.
 */
export const SatchelInventoryTab: React.FC<SatchelInventoryTabProps> = ({
  state,
  isCheatMode,
  invCategory,
  setInvCategory,
  invSubtype,
  setInvSubtype,
  openSlotEditor,
  onOpenProgressionTab,
  onOpenArmory,
  handleUseItem,
}) => {
  const [invWeaponVariantFilter, setInvWeaponVariantFilter] = useState<
    'ALL' | 'Custom' | 'Magitech' | 'Legendary'
  >('ALL');
  const [inspectedEntry, setInspectedEntry] = useState<{
    kind: 'weapon' | 'hardware' | 'mod' | 'consumable';
    id: string;
  } | null>(null);
  const devMode = getOrionGraphicsSettings().devModeEnabled;

  const subtypeOptionsByCat: Record<EquipmentInventoryCategory, string[]> = {
    all: ['ALL', ...WEAPON_CATEGORIES],
    weapon: [
      'ALL',
      'Bows',
      'Casters',
      'Spears',
      'Impact & Axes',
      'Blades: Curved',
      'Blades: Straight',
    ],
    auxiliary: ['ALL', 'Shields', 'Carriers & Munitions'],
    hardware: [
      'ALL',
      'head',
      'optics',
      'sensoryA',
      'sensoryB',
      'arms',
      'actuators',
      'legs',
      'plating',
      'reactor',
    ],
    mod: ['ALL', 'ranged', 'melee', 'mobility'],
    consumable: ['ALL', 'consumable', 'gemstone', 'relic'],
  };
  const activeSubtypes = subtypeOptionsByCat[invCategory] || ['ALL'];

  return (
    <div className="relative flex-1 min-h-0 flex flex-col space-y-1.5 overflow-hidden text-[10px]">
      {/* Clean Two-Row Filter & Subtype Toolbar */}
      <div className="flex flex-col gap-1 px-2 py-1.5 bg-[#090d14] border border-[#1e293b] rounded-xs shrink-0">
        {/* Row 1: Primary Inventory Category Buttons + Sandbox Utility */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'weapon', label: 'Weapons' },
                { id: 'auxiliary', label: 'Auxiliaries' },
                { id: 'hardware', label: 'Hardware' },
                { id: 'mod', label: 'Action Mods' },
                { id: 'consumable', label: 'Consumables & Gems' },
              ] as Array<{ id: EquipmentInventoryCategory; label: string }>
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setInvCategory(cat.id);
                  setInvSubtype('ALL');
                }}
                className={`px-2 py-0.5 rounded-xs text-[9px] font-bold border cursor-pointer ${
                  invCategory === cat.id
                    ? 'bg-[#8dd7ad] text-[#05070a] border-[#6ee7b7]'
                    : 'bg-[#0f172a] text-[#94a3b8] border-[#1e293b] hover:text-[#e2e8f0]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {isCheatMode && (
            <button
              type="button"
              onClick={() => {
                soundSystem.playPowerup();
                for (const flaskId of [
                  'grail_water',
                  'demantoid_flask',
                  'spinel_flask',
                  'carnelian_flask',
                  'titanite_flask',
                  'kyanite_flask',
                  'charoite_flask',
                  'rubellite_flask',
                  'hematite_flask',
                ]) {
                  addOrionInventoryItem(state, flaskId, 1);
                }
                state.toastText = 'ADDED +1 OF ALL 9 GEMSTONE BELT FLASKS';
                state.toastTimer = 2.5;
                notifyOrionStateChange();
              }}
              className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#8dd7ad]/60 rounded-xs font-bold text-[9px] text-[#8dd7ad] cursor-pointer shrink-0"
            >
              +1 Flasks
            </button>
          )}
        </div>

        {/* Row 2: Class / Slot & Subtype Dropdowns */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#1e293b]/70">
          {activeSubtypes.length > 1 && (
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[9px] font-bold text-[#94a3b8] shrink-0">Class/Slot:</span>
              <select
                value={invSubtype}
                onChange={(e) => {
                  soundSystem.playSelect();
                  setInvSubtype(e.target.value);
                }}
                className="max-w-[180px] truncate px-2 py-0.5 bg-[#05070a] border border-[#334155] rounded-xs text-[11px] font-bold text-[#ffd27d] focus:outline-none cursor-pointer"
              >
                {activeSubtypes.map((st) => (
                  <option key={st} value={st}>
                    {st === 'ALL' ? 'All Classes / Slots' : st.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(invCategory === 'all' || invCategory === 'weapon' || invCategory === 'auxiliary') && (
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[9px] font-bold text-[#94a3b8] shrink-0">Subtype:</span>
              <select
                value={invWeaponVariantFilter}
                onChange={(e) => {
                  soundSystem.playSelect();
                  setInvWeaponVariantFilter(
                    e.target.value as 'ALL' | 'Custom' | 'Magitech' | 'Legendary'
                  );
                }}
                className="max-w-[160px] truncate px-2 py-0.5 bg-[#05070a] border border-[#334155] rounded-xs text-[11px] font-bold text-[#e2e8f0] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Subtypes</option>
                <option value="Custom">Custom</option>
                <option value="Magitech">Magitech</option>
                <option value="Legendary">Legendary</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 100% Full-Width Compact Scannable Inventory List */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#1e293b]/80 bg-[#090d14]/90 border border-[#1e293b] rounded-xs">
        {/* 1. Owned Weapons & Auxiliaries */}
        {(invCategory === 'all' || invCategory === 'weapon' || invCategory === 'auxiliary') &&
          Object.values(WEAPON_REGISTRY)
            .filter((w) => {
              if (
                w.id.startsWith('utility_') ||
                w.id.startsWith('aux3_') ||
                w.id.startsWith('aux4_')
              ) {
                return false;
              }
              const unlocked = isCheatMode || isEquipmentUnlocked(state, w.id);
              if (!unlocked) return false;
              const isAux = isAuxiliaryEquipment(w);
              if (invCategory === 'weapon' && isAux) return false;
              if (invCategory === 'auxiliary' && !isAux) return false;
              const stInfo = getWeaponSubtypeInfo(w.id);
              if (invSubtype !== 'ALL' && stInfo.category !== invSubtype) return false;
              if (
                invWeaponVariantFilter !== 'ALL' &&
                stInfo.variantSubtype !== invWeaponVariantFilter
              ) {
                return false;
              }
              return true;
            })
            .flatMap((baseW) => {
              const instances = getOwnedEquipmentInstances(state, baseW.id);
              const instanceIds = instances.length > 0 ? instances : [baseW.id];
              return instanceIds.map((instanceId) => ({ baseW, instanceId }));
            })
            .map(({ baseW, instanceId }) => {
              const w = getWeaponDefinition(instanceId) || baseW;
              const stInfo = getWeaponSubtypeInfo(baseW.id);
              const copies = getOwnedWeaponCount(state, instanceId);
              const gemVis = getWeaponGemVisuals(state, instanceId);
              const strip = w.variantStripBase64 || w.hardpointSprite?.base64;
              const wt = getWeaponInstanceEquipWeight(instanceId, state);
              const inMain = state.equipmentSlots?.slot1 === instanceId;
              const inSide = state.equipmentSlots?.slot2 === instanceId;
              const inAux = state.equipmentSlots?.slot3 === instanceId;

              return (
                <div
                  key={instanceId}
                  role="button"
                  tabIndex={0}
                  data-menu-focusable="true"
                  onClick={() => {
                    soundSystem.playSelect();
                    setInspectedEntry({ kind: 'weapon', id: instanceId });
                  }}
                  className="px-2.5 py-1.5 hover:bg-[#1e293b]/70 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <SpriteCanvasIcon
                      base64={strip}
                      col={gemVis.colIndex}
                      row={!gemVis.gemId ? (w.hardpointSprite?.row ?? 0) : 0}
                      sizeClass="w-5 h-5 shrink-0"
                    />
                    <div className="min-w-0 truncate">
                      <span className="font-bold text-[11px] text-[#ffd27d]">
                        {getEquipmentDisplayName(instanceId, state)}
                      </span>
                      <span className="text-[9px] text-[#94a3b8] ml-1">×{copies}</span>
                      <span className="text-[#64748b] mx-1.5">·</span>
                      <span className="text-[9px] text-[#7dd3fc]">{stInfo.subtype}</span>
                      <span className="text-[#64748b] mx-1.5">·</span>
                      <span className="text-[9px] text-[#94a3b8] font-mono">
                        {wt} WT · {w.damagePerShot} {w.primaryDamageType}
                      </span>
                      {(inMain || inSide || inAux) && (
                        <span className="ml-1.5 text-[9px] text-[#4ade80] font-bold">
                          · {inMain ? 'MAIN' : inSide ? 'SIDE' : 'AUX'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onOpenArmory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenArmory(isAuxiliaryEquipment(w) ? 'slot2' : 'slot1', instanceId);
                        }}
                        className="px-2 py-0.5 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] border border-[#fb923c]/60 rounded-xs text-[9px] font-bold cursor-pointer"
                      >
                        Armory
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSlotEditor(isAuxiliaryEquipment(w) ? 'slot2' : 'slot1');
                      }}
                      className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[9px] font-bold cursor-pointer"
                    >
                      Equip
                    </button>
                  </div>
                </div>
              );
            })}

        {/* 2. Chassis Hardware */}
        {(invCategory === 'all' || invCategory === 'hardware') &&
          CHASSIS_HARDWARE_CATALOG.filter((hw) => {
            if (invSubtype !== 'ALL' && hw.slot !== invSubtype) return false;
            return isCheatMode || isEquipmentUnlocked(state, hw.id);
          })
            .flatMap((baseHw) => {
              const instances = getOwnedEquipmentInstances(state, baseHw.id);
              const instanceIds = instances.length > 0 ? instances : [baseHw.id];
              return instanceIds.map((instanceId) => ({ baseHw, instanceId }));
            })
            .map(({ baseHw, instanceId }) => {
              const hw = findHardwareItemByNameOrId(instanceId) || baseHw;
              const count = getOwnedWeaponCount(state, instanceId);
              const editTargetSlot: EditableLoadoutSlot =
                baseHw.slot === 'aux3' || baseHw.slot === 'aux4' ? 'slot3' : baseHw.slot;
              return (
                <div
                  key={instanceId}
                  role="button"
                  tabIndex={0}
                  data-menu-focusable="true"
                  onClick={() => {
                    soundSystem.playSelect();
                    setInspectedEntry({ kind: 'hardware', id: instanceId });
                  }}
                  className="px-2.5 py-1.5 hover:bg-[#1e293b]/70 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 truncate flex-1">
                    <span className="font-bold text-[11px] text-[#e2e8f0]">{hw.name}</span>
                    <span className="text-[9px] text-[#94a3b8] ml-1">×{count}</span>
                    <span className="text-[#64748b] mx-1.5">·</span>
                    <span className="text-[9px] text-[#38bdf8]">
                      {hw.slot.toUpperCase()} ({hw.subtype})
                    </span>
                    <span className="text-[#64748b] mx-1.5">·</span>
                    <span className="text-[9px] text-[#ffd27d] font-mono">
                      {getHardwareBaseWeight(hw)} WT
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onOpenArmory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenArmory(editTargetSlot, instanceId);
                        }}
                        className="px-2 py-0.5 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] border border-[#fb923c]/60 rounded-xs text-[9px] font-bold cursor-pointer"
                      >
                        Armory
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSlotEditor(editTargetSlot);
                      }}
                      className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[9px] font-bold cursor-pointer"
                    >
                      Equip
                    </button>
                  </div>
                </div>
              );
            })}

        {/* 3. Retained Action Mods */}
        {(invCategory === 'all' || invCategory === 'mod') &&
          ACTION_MODIFICATION_CATALOG.filter((m) => {
            const retained =
              (state.equipmentSlots?.unlockedMods || []).includes(m.id) ||
              Boolean(state.bypassProgressionGates);
            if (!retained && invCategory === 'all') return false;
            if (invSubtype !== 'ALL' && m.targetCategory !== invSubtype) return false;
            return true;
          }).map((m) => (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              data-menu-focusable="true"
              onClick={() => {
                soundSystem.playSelect();
                setInspectedEntry({ kind: 'mod', id: m.id });
              }}
              className="px-2.5 py-1.5 hover:bg-[#1e293b]/70 flex items-center justify-between gap-2 cursor-pointer transition-colors"
            >
              <div className="min-w-0 truncate flex-1">
                <span className="font-bold text-[11px] text-[#c084fc]">{m.name}</span>
                <span className="text-[#64748b] mx-1.5">·</span>
                <span className="text-[9px] text-[#94a3b8]">
                  Action Mod ({m.targetCategory.toUpperCase()}) ·{' '}
                  {(m.weightDelta ?? 0) >= 0 ? `+${m.weightDelta ?? 0}` : m.weightDelta} WT
                </span>
                <span className="text-[#64748b] mx-1.5">·</span>
                <span className="text-[9px] text-[#86efac]">{m.gainDescription}</span>
              </div>
              {onOpenArmory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenArmory(
                      m.targetCategory === 'melee'
                        ? 'mod_melee'
                        : m.targetCategory === 'mobility'
                          ? 'mod_mobility'
                          : 'mod_ranged'
                    );
                  }}
                  className="px-2 py-0.5 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] border border-[#fb923c]/60 rounded-xs text-[9px] font-bold cursor-pointer shrink-0"
                >
                  Install
                </button>
              )}
            </div>
          ))}

        {/* 4. Consumables, Gemstones & Relics */}
        {(invCategory === 'all' || invCategory === 'consumable') &&
          consolidateInventorySlots(state.inventorySlots)
            .filter((slot) => {
              const def = getItemDefinition(slot.itemId);
              if (!def) return false;
              const isGem = slot.itemId in GEMSTONE_REGISTRY;
              const cat = isGem ? 'gemstone' : def.category;
              if (invCategory === 'consumable' && invSubtype !== 'ALL' && cat !== invSubtype) {
                return false;
              }
              return true;
            })
            .map((slot, idx) => {
              const def = getItemDefinition(slot.itemId);
              if (!def) return null;
              const isGem = slot.itemId in GEMSTONE_REGISTRY;
              return (
                <div
                  key={`${slot.itemId}-${idx}`}
                  role="button"
                  tabIndex={0}
                  data-menu-focusable="true"
                  onClick={() => {
                    soundSystem.playSelect();
                    setInspectedEntry({ kind: 'consumable', id: slot.itemId });
                  }}
                  className="px-2.5 py-1.5 hover:bg-[#1e293b]/70 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {def.iconSprite?.base64 ? (
                      <SpriteCanvasIcon
                        base64={def.iconSprite.base64}
                        col={def.iconSprite.col || 0}
                        row={def.iconSprite.row || 0}
                        sizeClass="w-5 h-5 shrink-0"
                      />
                    ) : (
                      <span className="text-[#38bdf8]">◆</span>
                    )}
                    <div className="min-w-0 truncate">
                      <span className="font-bold text-[11px] text-[#50fa7b]">{def.name}</span>
                      <span className="text-[9px] text-[#94a3b8] ml-1">×{slot.count}</span>
                      <span className="text-[#64748b] mx-1.5">·</span>
                      <span className="text-[9px] text-[#7dd3fc]">
                        {(isGem ? 'gemstone' : def.category).toUpperCase()}
                      </span>
                      <span className="text-[#64748b] mx-1.5">·</span>
                      <span className="text-[9px] text-[#cbd5e1]">{def.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isGem && onOpenArmory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundSystem.playSelect();
                          onOpenArmory('slot1');
                        }}
                        className="px-2 py-0.5 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] font-bold rounded-xs border border-[#fb923c]/60 text-[9px] cursor-pointer"
                      >
                        Armory
                      </button>
                    )}
                    {isGem && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundSystem.playSelect();
                          onOpenProgressionTab();
                        }}
                        className="px-2 py-0.5 bg-[#172554] hover:bg-[#1e3a8a] text-[#7dd3fc] font-bold rounded-xs border border-[#38bdf8]/60 text-[9px] cursor-pointer"
                      >
                        Feats
                      </button>
                    )}
                    {def.onUse && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseItem(slot.itemId);
                        }}
                        className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] font-bold rounded-xs border border-[#475569] text-[9px] cursor-pointer"
                      >
                        Use
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Pop-Up / Slide-Over Inventory Item Inspector */}
      {inspectedEntry && (
        <div className="absolute inset-0 z-30 bg-[#05070a]/95 backdrop-blur-xs border border-[#8dd7ad]/60 rounded-xs flex flex-col p-3 overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b] shrink-0">
            <button
              type="button"
              data-menu-back="true"
              onClick={() => {
                soundSystem.playMenuBeep();
                setInspectedEntry(null);
              }}
              className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] font-bold text-[10px] rounded-xs border border-[#475569] cursor-pointer"
            >
              ← Back to Cargo List
            </button>
            <span className="text-[10px] font-bold text-[#8dd7ad] uppercase">
              Cargo Item Inspector · {inspectedEntry.kind.toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
            {inspectedEntry.kind === 'weapon' &&
              (() => {
                const w = getWeaponDefinition(inspectedEntry.id);
                if (!w) return null;
                return (
                  <div className="p-2.5 bg-[#090d14] border border-[#1e293b] rounded-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13px] font-bold text-[#ffd27d]">
                        {getEquipmentDisplayName(inspectedEntry.id, state)}
                        {devMode && (
                          <span className="ml-2 text-[9px] text-[#64748b] font-mono">
                            [{inspectedEntry.id}]
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {onOpenArmory && (
                          <button
                            type="button"
                            onClick={() => {
                              setInspectedEntry(null);
                              onOpenArmory(
                                isAuxiliaryEquipment(w) ? 'slot2' : 'slot1',
                                inspectedEntry.id
                              );
                            }}
                            className="px-2.5 py-1 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] border border-[#fb923c]/60 rounded-xs text-[10px] font-bold cursor-pointer"
                          >
                            ⚙ Modify in Armory
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedEntry(null);
                            openSlotEditor(isAuxiliaryEquipment(w) ? 'slot2' : 'slot1');
                          }}
                          className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[10px] font-bold cursor-pointer"
                        >
                          Open Loadout Slot
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#cbd5e1]">{w.description}</div>
                    <WeaponStatReadout w={w} instanceId={inspectedEntry.id} state={state} />
                  </div>
                );
              })()}

            {inspectedEntry.kind === 'hardware' &&
              (() => {
                const hw = findHardwareItemByNameOrId(inspectedEntry.id);
                if (!hw) return null;
                const editTargetSlot: EditableLoadoutSlot =
                  hw.slot === 'aux3' || hw.slot === 'aux4' ? 'slot3' : hw.slot;
                return (
                  <div className="p-2.5 bg-[#090d14] border border-[#1e293b] rounded-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13px] font-bold text-[#38bdf8]">{hw.name}</div>
                      <div className="flex items-center gap-1.5">
                        {onOpenArmory && (
                          <button
                            type="button"
                            onClick={() => {
                              setInspectedEntry(null);
                              onOpenArmory(editTargetSlot, inspectedEntry.id);
                            }}
                            className="px-2.5 py-1 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] border border-[#fb923c]/60 rounded-xs text-[10px] font-bold cursor-pointer"
                          >
                            ⚙ Modify in Armory
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedEntry(null);
                            openSlotEditor(editTargetSlot);
                          }}
                          className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[10px] font-bold cursor-pointer"
                        >
                          Open Loadout Slot
                        </button>
                      </div>
                    </div>
                    <HardwareStatReadout
                      hw={hw}
                      maxGemSlots={getEquipmentMaxModSlots(inspectedEntry.id)}
                    />
                  </div>
                );
              })()}

            {inspectedEntry.kind === 'mod' &&
              (() => {
                const m = ACTION_MODIFICATION_CATALOG.find((x) => x.id === inspectedEntry.id);
                if (!m) return null;
                return (
                  <div className="p-2.5 bg-[#090d14] border border-[#1e293b] rounded-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13px] font-bold text-[#c084fc]">{m.name}</div>
                      {onOpenArmory && (
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedEntry(null);
                            onOpenArmory(
                              m.targetCategory === 'melee'
                                ? 'mod_melee'
                                : m.targetCategory === 'mobility'
                                  ? 'mod_mobility'
                                  : 'mod_ranged'
                            );
                          }}
                          className="px-2.5 py-1 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] border border-[#fb923c]/60 rounded-xs text-[10px] font-bold cursor-pointer"
                        >
                          ⚙ Install in Armory
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-[#86efac]">+ {m.gainDescription}</div>
                    {m.drawbackDescription && (
                      <div className="text-[10px] text-[#f87171]">− {m.drawbackDescription}</div>
                    )}
                  </div>
                );
              })()}

            {inspectedEntry.kind === 'consumable' &&
              (() => {
                const def = getItemDefinition(inspectedEntry.id);
                if (!def) return null;
                const isGem = inspectedEntry.id in GEMSTONE_REGISTRY;
                return (
                  <div className="p-2.5 bg-[#090d14] border border-[#1e293b] rounded-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13px] font-bold text-[#50fa7b]">{def.name}</div>
                      <div className="flex items-center gap-1.5">
                        {isGem && onOpenArmory && (
                          <button
                            type="button"
                            onClick={() => {
                              setInspectedEntry(null);
                              onOpenArmory('slot1');
                            }}
                            className="px-2.5 py-1 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] font-bold rounded-xs border border-[#fb923c]/60 text-[10px] cursor-pointer"
                          >
                            ⚙ Socket in Armory
                          </button>
                        )}
                        {isGem && (
                          <button
                            type="button"
                            onClick={() => {
                              setInspectedEntry(null);
                              onOpenProgressionTab();
                            }}
                            className="px-2.5 py-1 bg-[#172554] hover:bg-[#1e3a8a] text-[#7dd3fc] font-bold rounded-xs border border-[#38bdf8]/60 text-[10px] cursor-pointer"
                          >
                            Socket in Feats
                          </button>
                        )}
                        {def.onUse && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUseItem(inspectedEntry.id);
                              setInspectedEntry(null);
                            }}
                            className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] font-bold rounded-xs border border-[#475569] text-[10px] cursor-pointer"
                          >
                            Use Item
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#cbd5e1]">{def.description}</div>
                    {isGem && GEMSTONE_REGISTRY[inspectedEntry.id as GemId] && (
                      <div className="text-[9px] text-[#86efac]">
                        + Weapon Socket (
                        {formatModifiedEquipmentName('Weapon', [inspectedEntry.id as GemId])}):{' '}
                        {WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[inspectedEntry.id as GemId]} (
                        {WEAPON_GEM_WEIGHT_DELTA[inspectedEntry.id as GemId] >= 0
                          ? `+${WEAPON_GEM_WEIGHT_DELTA[inspectedEntry.id as GemId]}`
                          : WEAPON_GEM_WEIGHT_DELTA[inspectedEntry.id as GemId]}{' '}
                        WT)
                      </div>
                    )}
                    {def.lore && (
                      <div className="pt-1.5 border-t border-[#1e293b] text-[10px] text-[#fde68a] italic">
                        “{def.lore}”
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>
        </div>
      )}
    </div>
  );
};
