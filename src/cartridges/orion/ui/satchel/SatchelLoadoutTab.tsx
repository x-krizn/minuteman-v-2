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
  getWeaponDefinition,
  isAuxiliaryEquipment,
  isTrueWeaponEquipment,
  isTwoHandOnlyWeapon,
  WEAPON_REGISTRY,
} from '../../database/equipment/weapons';
import { getItemDefinition } from '../../database/items';
import {
  ACTION_MODIFICATION_CATALOG,
  CHASSIS_HARDWARE_CATALOG,
  computePlayerLoadMetrics,
  createInitialEquipmentSlots,
  GEMSTONE_REGISTRY,
  getEffectiveMainGrip,
  getEquipmentDisplayName,
  getEquipmentMaxModSlots,
  getOwnedEquipmentInstances,
  getOwnedWeaponCount,
  getWeaponComponentSlots,
  getWeaponGemCombatModifiers,
  getWeaponGemVisuals,
  getWeaponInstanceEquipWeight,
  getWeaponSubtypeInfo,
  isEquipmentUnlocked,
  setMainWeaponGrip,
  WEAPON_FUNCTIONAL_TYPES_BY_CATEGORY,
  WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS,
  WEAPON_GEM_WEIGHT_DELTA,
} from '../../database/progression';
import {
  addOrionInventoryItem,
  ASSIGNABLE_ACTION_CATALOG,
  assignTriggerAction,
  consolidateInventorySlots,
  getActiveWeaponStance,
  isActionUnlocked,
  notifyOrionStateChange,
  performAuxiliarySwap,
  syncStateGates,
} from '../../systems';
import {
  GemId,
  OrionState,
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
  const effectiveDmg = Math.round(w.damagePerShot * gemMods.damageMult);
  const effectiveChain = Math.max(1, w.shotsPerChain + gemMods.bonusMaxAmmo);
  const primaryAction = w.moveset?.[0];
  const primaryFamily = primaryAction?.damageFamily || 'Kinetic';
  const primaryRange = primaryAction?.range ?? 64;
  const handingLabel =
    w.handing === '2-hand'
      ? '2H ONLY'
      : w.handing === 'off-hand-only' || w.handing === 'buff-accessory'
        ? 'OFF-HAND AUX'
        : '1H / 2H';

  const incBadges: string[] = [];
  const decBadges: string[] = [];

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
    <div className="mt-1 space-y-0.5 text-[7px]">
      <div className="flex flex-wrap items-center gap-1 tabular-nums">
        {w.category && (
          <span className="px-1 py-0.2 rounded-[2px] bg-[#0f172a] text-[#fde047] border border-[#fde047]/40 font-bold">
            {w.category.toUpperCase()} ▸ {(w.weaponClass || w.name).toUpperCase()}
          </span>
        )}
        <span
          className={`px-1 py-0.2 rounded-[2px] font-bold ${
            w.weaponTier === 'unique'
              ? 'bg-[#311042] text-[#e879f9] border border-[#a21caf]/50'
              : 'bg-[#052e16] text-[#86efac] border border-[#22c55e]/40'
          }`}
        >
          {w.weaponTier === 'unique' ? 'SUBTYPE: MAGITECH · 1 GEM' : 'SUBTYPE: CUSTOM · 3 SLOTS'}
        </span>
        <span className="px-1 py-0.2 rounded-[2px] bg-[#0f172a] text-[#94a3b8] border border-[#334155]">
          MODS: {getWeaponComponentSlots(instanceId).join(' / ').toUpperCase()}
        </span>
        <span className="px-1 py-0.2 rounded-[2px] bg-[#1e293b] text-[#ffd27d] font-bold">
          {totalWt} WT ({(w.weightClass || 'medium').toUpperCase()})
        </span>
        <span className="px-1 py-0.2 rounded-[2px] bg-[#0f172a] text-[#cbd5e1] border border-[#334155]">
          {handingLabel}
        </span>
        <span className="px-1 py-0.2 rounded-[2px] bg-[#172554] text-[#7dd3fc] font-bold">
          {effectiveDmg > 0
            ? primaryAction?.isChargeable
              ? `${effectiveDmg}–${Math.round(effectiveDmg * 1.85)} DMG · SINGLE-SHOT CHARGE BOW`
              : primaryAction?.noReload || w.equipmentRole === 'melee' || w.equipmentRole === 'shield'
                ? `${effectiveDmg} DMG · ${primaryAction?.comboSequence?.length || w.shotsPerChain}-STEP COMBO (NO RELOAD)`
                : `${effectiveDmg} DMG × ${effectiveChain} AMMO`
            : 'SUPPORT / GUARD'}
        </span>
        <span className="px-1 py-0.2 rounded-[2px] bg-[#0f172a] text-[#38bdf8] border border-[#1e3a8a]">
          {w.primaryDamageType.toUpperCase()} · {primaryFamily.toUpperCase()}
        </span>
        {w.adaptiveDamageTypes && w.adaptiveDamageTypes.length > 1 && (
          <span className="px-1 py-0.2 rounded-[2px] bg-[#311042] text-[#e879f9] border border-[#a21caf]/50">
            ADAPTIVE [{w.adaptiveDamageTypes.join('/')}]
          </span>
        )}
        <span className="px-1 py-0.2 rounded-[2px] bg-[#0f172a] text-[#94a3b8]">
          {primaryAction?.noReload || w.equipmentRole === 'melee' || w.equipmentRole === 'shield'
            ? `NO RELOAD (${primaryAction?.comboResetWindowSec ?? 1.1}s RESET) · ${primaryRange}px RNG`
            : primaryAction?.isChargeable
              ? `${primaryAction.maxChargeSec ?? 0.78}s DRAW · ${w.reloadDurationSec}s NOCK · ${primaryRange}px RNG`
              : `${w.reloadDurationSec}s BASIC RLD · ${primaryRange}px RNG`}
        </span>
      </div>

      {(incBadges.length > 0 || decBadges.length > 0) && (
        <div className="flex flex-wrap items-center gap-1">
          {incBadges.map((b, i) => (
            <span
              key={`inc-${i}`}
              className="px-1 py-0.1 rounded-[2px] bg-[#052e16]/80 text-[#86efac] border border-[#22c55e]/40 font-semibold"
            >
              {b}
            </span>
          ))}
          {decBadges.map((b, i) => (
            <span
              key={`dec-${i}`}
              className="px-1 py-0.1 rounded-[2px] bg-[#450a0a]/80 text-[#fca5a5] border border-[#ef4444]/40 font-semibold"
            >
              {b}
            </span>
          ))}
        </div>
      )}

      {!compact && w.moveset && w.moveset.length > 0 && (
        <div className="text-[6.5px] text-[#94a3b8] leading-tight pt-0.5 border-t border-[#1e293b]/70 space-y-0.5">
          <div>
            <span className="text-[#cbd5e1] font-bold">MOVESET: </span>
            {w.moveset
              .map((s) => {
                const ammoTag =
                  s.slot === 1
                    ? s.isChargeable
                      ? ' · 1-SHOT CHARGE'
                      : s.noReload
                        ? ` · ${s.comboSequence?.length || 3}-STEP NO-RLD`
                        : ` · ${effectiveChain} AMMO`
                    : s.internalCharges && s.internalCharges > 1
                      ? ` · ${s.internalCharges} CHG (${s.ammoCount || 1}/SHOT)`
                      : s.ammoCount && s.ammoCount > 1
                        ? ` · ×${s.ammoCount} SALVO`
                        : '';
                return `[S${s.slot} ${s.name}: ${
                  s.damage > 0 ? `${s.damage} ${s.damageType}` : s.damageType
                }${ammoTag} · ${s.cooldownSec}s CD · ${s.heatCost}H]`;
              })
              .join(' · ')}
          </div>
          {primaryAction?.comboSequence && primaryAction.comboSequence.length > 0 && (
            <div className="text-[#f472b6]">
              <span className="font-bold">FLUID COMBO CHAIN: </span>
              {primaryAction.comboSequence
                .map((c, idx) => `${idx + 1}. ${c.label} (${Math.round(c.damageMult * 100)}% DMG)`)
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

  if (basePlatingCap > 0) {
    incBadges.push(`${basePlatingCap} BASE CAP`);
  }
  if (hwCap > 0) {
    incBadges.push(`+${hwCap} CAP`);
  } else if (hwCap < 0) {
    decBadges.push(`${hwCap} CAP`);
  }

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
  if (hw.attackMassBonus) {
    if (hw.attackMassBonus > 0) incBadges.push(`+${hw.attackMassBonus} ATK MASS`);
    else decBadges.push(`${hw.attackMassBonus} ATK MASS`);
  }
  if (hw.tellDurationMult && hw.tellDurationMult !== 1) {
    const pct = Math.round((hw.tellDurationMult - 1) * 100);
    if (pct < 0) incBadges.push(`${pct}% WINDUP`);
    else decBadges.push(`+${pct}% WINDUP`);
  }
  if (hw.moveSpeedMult && hw.moveSpeedMult !== 1) {
    const pct = Math.round((hw.moveSpeedMult - 1) * 100);
    if (pct > 0) incBadges.push(`+${pct}% MOVE SPD`);
    else decBadges.push(`${pct}% MOVE SPD`);
  }
  if (hw.heatVentMult && hw.heatVentMult !== 1) {
    const pct = Math.round((hw.heatVentMult - 1) * 100);
    if (pct > 0) incBadges.push(`+${pct}% HEAT VENT`);
    else decBadges.push(`${pct}% HEAT VENT`);
  }
  if (hw.accuracyMult && hw.accuracyMult !== 1) {
    const pct = Math.round((hw.accuracyMult - 1) * 100);
    if (pct > 0) incBadges.push(`+${pct}% ACCURACY`);
    else decBadges.push(`${pct}% ACCURACY`);
  }
  if (hw.staggerDamageMult && hw.staggerDamageMult !== 1) {
    const pct = Math.round((hw.staggerDamageMult - 1) * 100);
    if (pct > 0) incBadges.push(`+${pct}% STG DMG`);
    else decBadges.push(`${pct}% STG DMG`);
  }
  if (hw.cooldownMult && hw.cooldownMult !== 1) {
    const pct = Math.round((hw.cooldownMult - 1) * 100);
    if (pct < 0) incBadges.push(`${pct}% SKILL CD`);
    else decBadges.push(`+${pct}% SKILL CD`);
  }

  return (
    <div className="mt-1 space-y-0.5 text-[7px]">
      <div className="flex flex-wrap items-center gap-1">
        <span className="px-1 py-0.2 rounded-[2px] bg-[#1e293b] text-[#ffd27d] font-bold">
          {hwWeight} WT
        </span>
        {isExteriorArmor ? (
          <>
            <span className="px-1 py-0.2 rounded-[2px] bg-[#172554] text-[#7dd3fc] font-bold">
              {(hw.armorType || 'Medium').toUpperCase()} ARMOR
            </span>
            <span className="px-1 py-0.2 rounded-[2px] bg-[#0f172a] text-[#38bdf8] border border-[#1e3a8a] font-semibold">
              +{hw.armorDurability ?? 0} DUR · +{hw.armorRating ?? 0} RTG · +{hw.armorThreshold ?? 0} THR
            </span>
          </>
        ) : (
          <span className="px-1 py-0.2 rounded-[2px] bg-[#0f172a] text-[#94a3b8] border border-[#334155]">
            INTERNAL MODULE (0 ARMOR)
          </span>
        )}
        {hw.reactorFamily && (
          <span className="px-1 py-0.2 rounded-[2px] bg-[#311042] text-[#e879f9] border border-[#a21caf]/50 font-bold">
            {hw.reactorFamily.toUpperCase()} CORE
          </span>
        )}
        {maxGemSlots !== undefined && (
          <span className="px-1 py-0.2 rounded-[2px] bg-[#0f172a] text-[#cbd5e1]">
            {hw.origin === 'crafted' ? `CRAFTED (${maxGemSlots}G MAX)` : `LOOTED (${maxGemSlots}G)`}
          </span>
        )}
      </div>

      {(incBadges.length > 0 || decBadges.length > 0) && (
        <div className="flex flex-wrap items-center gap-1">
          {incBadges.map((b, i) => (
            <span
              key={`hw-inc-${i}`}
              className="px-1 py-0.1 rounded-[2px] bg-[#052e16]/80 text-[#86efac] border border-[#22c55e]/40 font-semibold"
            >
              {b}
            </span>
          ))}
          {decBadges.map((b, i) => (
            <span
              key={`hw-dec-${i}`}
              className="px-1 py-0.1 rounded-[2px] bg-[#450a0a]/80 text-[#fca5a5] border border-[#ef4444]/40 font-semibold"
            >
              {b}
            </span>
          ))}
        </div>
      )}

      <div className="text-[7px] text-[#86efac]">+ {hw.description}</div>
      {hw.drawbackDescription && (
        <div className="text-[6.8px] text-[#f87171]">− {hw.drawbackDescription}</div>
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
}

/**
 * Renders the Mech Doll `LOADOUT` screen:
 * - Central high-resolution Mech Doll (`HighResMechDollCanvas`) surrounded by 8 selectable anatomical hardpoint nodes.
 * - Clicking any node opens a tactical Context Menu (`Equip / Swap`, `Unequip`, `Stance / Grip Toggle`, `Modify in Armory`).
 * - Choosing `Equip / Swap` opens a high-resolution slot equipment selector with side-by-side schematic comparison.
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
  onOpenInventoryTab,
  onOpenArmory,
}) => {
  const [contextMenuSlot, setContextMenuSlot] = useState<EditableLoadoutSlot | null>('slot1');
  const [hoveredSlot, setHoveredSlot] = useState<EditableLoadoutSlot | null>(null);
  const [previewCandidateId, setPreviewCandidateId] = useState<string | null>(null);
  const [loadoutSelectedClass, setLoadoutSelectedClass] = useState<WeaponCategory | null>(null);
  const [loadoutVariantFilter, setLoadoutVariantFilter] = useState<'ALL' | 'Custom' | 'Magitech'>('ALL');

  if (!state.equipmentSlots) {
    state.equipmentSlots = createInitialEquipmentSlots(state.traitLine);
  }
  const eq = state.equipmentSlots;
  const loadMetrics = computePlayerLoadMetrics(state);
  const mainGrip = getEffectiveMainGrip(state);
  const activeStance = getActiveWeaponStance(state);

  const sayCtx = {
    say: (txt: string) => {
      state.toastText = txt;
      state.toastTimer = 2.6;
    },
  };

  // Resolve equipped items for each anatomical node on the Mech Doll
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

  const leftAction = getResolvedActionDescriptor(
    state,
    state.assignedActions?.L || 'weapon_skill_1'
  );
  const rightAction = getResolvedActionDescriptor(
    state,
    state.assignedActions?.R || 'weapon_skill_2'
  );

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
        return state.assignedActions?.L || 'weapon_skill_1';
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
   * Renders one selectable anatomical hardpoint node on the Mech Doll screen.
   */
  const renderDollSlotNode = (config: {
    slot: EditableLoadoutSlot;
    title: string;
    itemId: string | null;
    itemName: string;
    subtitle: string;
    wtLabel: string;
    accentColor: string;
    subModulesSummary?: string;
    badgeText?: string;
  }) => {
    const isSelected = contextMenuSlot === config.slot;
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
        onFocus={() => setHoveredSlot(config.slot)}
        onBlur={() => setHoveredSlot(null)}
        onMouseEnter={() => setHoveredSlot(config.slot)}
        onMouseLeave={() => setHoveredSlot(null)}
        className={`p-1.5 rounded-xs border transition-all cursor-pointer flex items-center gap-2 ${
          isSelected
            ? 'bg-[#172554]/85 border-[#fde047] shadow-md'
            : 'bg-[#090d14] border-[#1e293b] hover:border-[#38bdf8]'
        }`}
      >
        <HighResEquipmentArtCanvas
          state={state}
          itemIdOrName={config.itemId}
          slotHint={config.slot}
          sizeClass="w-12 h-12"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-[7.5px] font-bold tracking-tight"
              style={{ color: config.accentColor }}
            >
              {config.title}
            </span>
            <div className="flex items-center gap-1">
              {config.badgeText && (
                <span className="px-1 py-0.1 rounded-[2px] bg-[#1e293b] text-[#fde047] text-[6.5px] font-bold">
                  {config.badgeText}
                </span>
              )}
              <span className="text-[7px] font-bold text-[#ffd27d]">{config.wtLabel}</span>
              {renderModGemPips(config.itemId)}
            </div>
          </div>
          <div className="font-bold text-[9px] text-[#e2e8f0] truncate">{config.itemName}</div>
          <div className="text-[7px] text-[#94a3b8] truncate">{config.subtitle}</div>
          {config.subModulesSummary && (
            <div className="text-[6.5px] text-[#7dd3fc] truncate mt-0.5">
              ⚙ {config.subModulesSummary}
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Renders the High-Resolution Slot Equipment Selector Drawer when `isEditingLoadout` is true.
   */
  const renderSlotEquipmentSelector = () => {
    const currentId = getEquippedIdForSlot(editingSlot);
    const isWeaponSlot =
      editingSlot === 'slot1' || editingSlot === 'slot2' || editingSlot === 'slot3';
    const isTriggerSlot = editingSlot === 'bind_l' || editingSlot === 'bind_r';

    if (isTriggerSlot) {
      const side: 'L' | 'R' = editingSlot === 'bind_l' ? 'L' : 'R';
      return (
        <div
          data-menu-scope="true"
          className="p-2.5 bg-[#090d14] rounded-xs border border-[#fde047] space-y-2"
        >
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-1.5">
            <span className="text-[10px] font-bold text-[#fde047]">
              ASSIGN {side === 'L' ? 'LEFT TRIGGER [J / LMB]' : 'RIGHT TRIGGER [K / RMB]'} COMBAT ACTION
            </span>
            <button
              type="button"
              data-menu-back="true"
              onClick={() => setIsEditingLoadout(false)}
              className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] rounded-xs text-[8px] font-bold cursor-pointer"
            >
              ✕ BACK TO MECH DOLL
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto">
            {ASSIGNABLE_ACTION_CATALOG.filter(
              (act) => isCheatMode || isActionUnlocked(state, act.id)
            ).map((act) => {
              const desc = getResolvedActionDescriptor(state, act.id);
              const isAssigned = state.assignedActions?.[side] === act.id;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => {
                    assignTriggerAction(state, side, act.id);
                    sayCtx.say(`ASSIGNED ${desc.name.toUpperCase()} TO ${side === 'L' ? 'LEFT' : 'RIGHT'} TRIGGER`);
                    soundSystem.playPowerup();
                    setIsEditingLoadout(false);
                    notifyOrionStateChange();
                  }}
                  className={`p-2 rounded-xs border text-left cursor-pointer ${
                    isAssigned
                      ? 'bg-[#172554] border-[#fde047]'
                      : 'bg-[#05070a] border-[#1e293b] hover:border-[#38bdf8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[9px] text-[#fde047]">{desc.name}</span>
                    <span className="text-[7px] text-[#7dd3fc]">{desc.sourceLabel}</span>
                  </div>
                  <div className="text-[7.5px] text-[#cbd5e1] mt-0.5">{desc.description}</div>
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
        (editingSlot === 'slot3' ? 'Shields' : 'Blades: Straight');

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

      const groupedByFunctionalType = functionalTypesInClass
        .map((funcType) => ({
          funcType,
          items: candidates.filter((c) => c.stInfo.functionalType === funcType),
        }))
        .filter((g) => g.items.length > 0);

      const inspectedId =
        previewCandidateId || currentId || candidates[0]?.instanceId || 'long_sword';
      const inspectedWeapon = getWeaponDefinition(inspectedId);

      const handleEquipWeaponInSlot = (instanceId: string) => {
        const w = getWeaponDefinition(instanceId);
        if (!w) return;
        soundSystem.playPowerup();

        // Smart slot routing so all 8 Weapon Classes can be browsed & equipped from any weapon/auxiliary slot
        let targetSlot: 'slot1' | 'slot2' | 'slot3' =
          editingSlot === 'slot1' || editingSlot === 'slot2' || editingSlot === 'slot3'
            ? editingSlot
            : 'slot1';

        if (targetSlot === 'slot1' && !isTrueWeaponEquipment(w)) {
          targetSlot = isTwoHandOnlyWeapon(eq.slot1) ? 'slot3' : 'slot2';
        } else if (targetSlot === 'slot2' && isTwoHandOnlyWeapon(w)) {
          targetSlot = 'slot1';
        }

        if (targetSlot === 'slot1') {
          eq.slot1 = instanceId;
          state.equippedWeapons[0] = instanceId;
          eq.weaponSet1 = [instanceId, null];
          if (isTwoHandOnlyWeapon(w)) {
            if (eq.slot2 && eq.slot2 !== instanceId && !eq.slot3) {
              eq.slot3 = eq.slot2;
            }
            eq.slot2 = null;
            eq.mainGrip = '2h';
          }
        } else if (targetSlot === 'slot2') {
          if (isTwoHandOnlyWeapon(eq.slot1)) {
            eq.slot3 = instanceId;
            targetSlot = 'slot3';
          } else {
            eq.slot2 = instanceId;
            eq.mainGrip = '1h';
            if (state.equippedWeapons.length < 2) {
              state.equippedWeapons.push(instanceId);
            } else {
              state.equippedWeapons[1] = instanceId;
            }
            eq.weaponSet2 = [instanceId, null];
          }
        } else if (targetSlot === 'slot3') {
          eq.slot3 = instanceId;
        }
        sayCtx.say(
          `EQUIPPED ${w.name.toUpperCase()} IN ${
            targetSlot === 'slot1'
              ? 'MAIN HAND [R]'
              : targetSlot === 'slot2'
                ? 'SIDE HAND [L]'
                : 'AUXILIARY [BACK]'
          }`
        );
        setIsEditingLoadout(false);
        notifyOrionStateChange();
      };

      return (
        <div
          data-menu-scope="true"
          className="p-2.5 bg-[#090d14] rounded-xs border border-[#fde047] space-y-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e293b] pb-1.5">
            <div>
              <div className="text-[10px] font-bold text-[#fde047]">
                NESTED ARSENAL SELECTOR ·{' '}
                {editingSlot === 'slot1'
                  ? 'MAIN HAND [RIGHT]'
                  : editingSlot === 'slot2'
                    ? 'SIDE HAND [LEFT]'
                    : 'AUXILIARY [BACK]'}
              </div>
              <div className="text-[7.5px] text-[#94a3b8]">
                Select one of the <span className="text-[#fde047] font-semibold">8 Weapon Classes</span>{' '}
                ▸ choose a <span className="text-[#38bdf8] font-semibold">Functional Weapon Class</span>{' '}
                (e.g. Khopesh) to compare <span className="text-[#86efac] font-semibold">Custom</span>{' '}
                (3 Slots) &amp; <span className="text-[#e879f9] font-semibold">Magitech</span> (Unique · 1 Gem) variants.
              </div>
            </div>
            <div className="flex items-center gap-1">
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
                  className="px-2 py-0.5 bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#ef4444]/50 rounded-xs text-[8px] font-bold cursor-pointer"
                >
                  UNEQUIP SLOT
                </button>
              )}
              <button
                type="button"
                data-menu-back="true"
                onClick={() => setIsEditingLoadout(false)}
                className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] rounded-xs text-[8px] font-bold cursor-pointer"
              >
                ✕ BACK TO MECH DOLL
              </button>
            </div>
          </div>

          {/* High-Resolution Inspection Banner */}
          {inspectedWeapon && (
            <div className="p-2 bg-[#05070a] rounded-xs border border-[#334155] flex flex-col sm:flex-row items-center gap-3">
              <HighResEquipmentArtCanvas
                state={state}
                itemIdOrName={inspectedId}
                slotHint={editingSlot}
                sizeClass="w-24 h-24"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[10px] text-[#fde047]">
                      {inspectedWeapon.name}
                    </span>
                    <span className="text-[7.5px] text-[#7dd3fc] font-semibold">
                      [{getWeaponSubtypeInfo(inspectedWeapon.id).subtype}]
                    </span>
                  </div>
                  {onOpenArmory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingLoadout(false);
                        onOpenArmory(editingSlot, inspectedId);
                      }}
                      className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#fb923c] border border-[#fb923c]/50 rounded-xs text-[7.5px] font-bold cursor-pointer"
                    >
                      ⚙ MODIFY IN ARMORY
                    </button>
                  )}
                </div>
                <div className="text-[7.5px] text-[#cbd5e1] mt-0.5">
                  {inspectedWeapon.description}
                </div>
                <WeaponStatReadout
                  w={inspectedWeapon}
                  instanceId={inspectedId}
                  state={state}
                />
              </div>
            </div>
          )}

          {/* TIER 1: THE 8 WEAPON CLASSES (Nested Top-Level Folders) */}
          <div className="p-1.5 bg-[#05070a] rounded-xs border border-[#1e293b] space-y-1">
            <div className="flex items-center justify-between text-[7.5px]">
              <span className="font-bold text-[#fde047]">
                1. SELECT WEAPON CLASS (8 CLASSES):
              </span>
              <span className="text-[#94a3b8]">
                ACTIVE CLASS: <span className="text-[#fde047] font-bold">{activeWeaponClass.toUpperCase()}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {WEAPON_CATEGORIES.map((cat) => {
                const classItems = allUnlockedWeapons.filter(
                  (w) => getWeaponSubtypeInfo(w.id).category === cat
                );
                const customCount = classItems.filter(
                  (w) => w.weaponTier !== 'unique'
                ).length;
                const magitechCount = classItems.filter(
                  (w) => w.weaponTier === 'unique'
                ).length;
                const isSelected = activeWeaponClass === cat;
                const hasEquippedInClass = currentSubtypeInfo?.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      soundSystem.playSelect();
                      setLoadoutSelectedClass(cat);
                      setLoadoutSubtypeFilter('ALL');
                    }}
                    className={`p-1.5 rounded-xs border text-left cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#172554] border-[#fde047] text-[#fde047]'
                        : 'bg-[#090d14] border-[#1e293b] hover:border-[#38bdf8] text-[#e2e8f0]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[8px] truncate">
                        {isSelected ? '▾ ' : '▸ '}
                        {cat.toUpperCase()}
                      </span>
                      {hasEquippedInClass && (
                        <span className="px-1 py-0.1 rounded-[2px] bg-[#fde047]/20 text-[#fde047] text-[6px] font-bold">
                          EQP
                        </span>
                      )}
                    </div>
                    <div className="text-[6.5px] text-[#94a3b8] mt-0.5 flex items-center gap-1.5">
                      <span className="text-[#86efac]">{customCount} Custom</span>
                      <span>·</span>
                      <span className="text-[#e879f9]">{magitechCount} Magitech</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIER 2: NESTED FUNCTIONAL WEAPON TYPES & SUBTYPE FILTER (Custom vs Magitech) */}
          <div className="p-1.5 bg-[#05070a] rounded-xs border border-[#1e293b] space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-[7.5px] font-bold text-[#38bdf8]">
                2. {activeWeaponClass.toUpperCase()} ▸ FUNCTIONAL WEAPON TYPE:
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[7px] text-[#94a3b8] font-bold">SUBTYPE:</span>
                {(['ALL', 'Custom', 'Magitech'] as const).map((variantOpt) => (
                  <button
                    key={variantOpt}
                    type="button"
                    onClick={() => {
                      soundSystem.playSelect();
                      setLoadoutVariantFilter(variantOpt);
                    }}
                    className={`px-1.5 py-0.2 rounded-xs text-[6.8px] font-bold border cursor-pointer ${
                      loadoutVariantFilter === variantOpt
                        ? variantOpt === 'Magitech'
                          ? 'bg-[#a21caf] text-[#f8fafc] border-[#e879f9]'
                          : variantOpt === 'Custom'
                            ? 'bg-[#15803d] text-[#f8fafc] border-[#86efac]'
                            : 'bg-[#fde047] text-[#05070a] border-[#facc15]'
                        : 'bg-[#090d14] text-[#94a3b8] border-[#1e293b]'
                    }`}
                  >
                    {variantOpt === 'ALL'
                      ? 'ALL (CUSTOM + MAGITECH)'
                      : variantOpt === 'Custom'
                        ? 'CUSTOM (3 SLOTS)'
                        : 'MAGITECH (UNIQUE · 1G)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  setLoadoutSubtypeFilter('ALL');
                }}
                className={`px-1.5 py-0.5 rounded-xs text-[7px] font-bold border cursor-pointer ${
                  activeFunctionalFilter === 'ALL'
                    ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                    : 'bg-[#090d14] text-[#94a3b8] border-[#1e293b] hover:border-[#38bdf8]'
                }`}
              >
                ALL {activeWeaponClass.toUpperCase()} ({functionalTypesInClass.length} TYPES)
              </button>
              {functionalTypesInClass.map((funcType) => {
                const matchingInType = allUnlockedWeapons.filter((w) => {
                  const info = getWeaponSubtypeInfo(w.id);
                  return info.category === activeWeaponClass && info.functionalType === funcType;
                });
                if (matchingInType.length === 0) return null;
                const hasMagitech = matchingInType.some((w) => w.weaponTier === 'unique');
                const isSelected = activeFunctionalFilter === funcType;
                return (
                  <button
                    key={funcType}
                    type="button"
                    onClick={() => {
                      soundSystem.playSelect();
                      setLoadoutSubtypeFilter(funcType);
                    }}
                    className={`px-1.5 py-0.5 rounded-xs text-[7px] font-bold border cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                        : 'bg-[#090d14] text-[#cbd5e1] border-[#1e293b] hover:border-[#38bdf8]'
                    }`}
                  >
                    <span>{funcType.toUpperCase()}</span>
                    <span
                      className={`text-[6.2px] ${
                        isSelected
                          ? 'text-[#05070a]'
                          : hasMagitech
                            ? 'text-[#e879f9]'
                            : 'text-[#64748b]'
                      }`}
                    >
                      ({matchingInType.length})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIER 3: NESTED FUNCTIONAL CLASS GROUPS (Presenting Custom & Magitech Together) */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
            {groupedByFunctionalType.length === 0 ? (
              <div className="p-3 bg-[#05070a] rounded-xs border border-[#1e293b] text-center text-[8px] text-[#94a3b8]">
                No unlocked weapons match the selected filter in {activeWeaponClass}.
              </div>
            ) : (
              groupedByFunctionalType.map(({ funcType, items }) => (
                <div
                  key={funcType}
                  className="p-1.5 bg-[#05070a]/90 rounded-xs border border-[#1e293b] space-y-1"
                >
                  <div className="flex items-center justify-between border-b border-[#1e293b]/80 pb-0.5">
                    <span className="text-[7.5px] font-bold text-[#7dd3fc]">
                      {activeWeaponClass.toUpperCase()} ▸ {funcType.toUpperCase()}
                    </span>
                    <span className="text-[6.5px] text-[#94a3b8]">
                      {items.filter((i) => i.stInfo.variantSubtype === 'Custom').length} Custom ·{' '}
                      {items.filter((i) => i.stInfo.variantSubtype === 'Magitech').length} Magitech
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {items.map(({ instanceId, resolvedW, stInfo }) => {
                      const isEquippedHere = currentId === instanceId;
                      const copies = getOwnedWeaponCount(state, instanceId);
                      const isMagitech = stInfo.variantSubtype === 'Magitech';
                      const slotsLabel =
                        resolvedW.weaponTier === 'unique'
                          ? '1 GEM SOCKET (FIXED PARTS)'
                          : `3 SLOTS (${getWeaponComponentSlots(instanceId).join('/').toUpperCase()})`;
                      return (
                        <div
                          key={instanceId}
                          onMouseEnter={() => setPreviewCandidateId(instanceId)}
                          className={`p-1.5 rounded-xs border flex items-center justify-between gap-2 ${
                            isEquippedHere
                              ? 'bg-[#172554]/70 border-[#fde047]'
                              : 'bg-[#090d14] border-[#1e293b] hover:border-[#38bdf8]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <HighResEquipmentArtCanvas
                              state={state}
                              itemIdOrName={instanceId}
                              slotHint={editingSlot}
                              sizeClass="w-11 h-11"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                                  {resolvedW.name}
                                </span>
                                <span className="text-[7px] text-[#94a3b8]">×{copies}</span>
                                <span
                                  className={`px-1 py-0.1 rounded-[2px] text-[6px] font-bold ${
                                    isMagitech
                                      ? 'bg-[#311042] text-[#e879f9] border border-[#a21caf]/50'
                                      : 'bg-[#052e16] text-[#86efac] border border-[#22c55e]/40'
                                  }`}
                                >
                                  {stInfo.variantSubtype.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-[7px] text-[#7dd3fc] truncate">
                                {funcType} · {slotsLabel} ·{' '}
                                {getWeaponInstanceEquipWeight(instanceId, state)} WT
                              </div>
                              <div className="text-[6.5px] text-[#94a3b8] truncate">
                                S1: {resolvedW.moveset?.[1]?.name || '—'} · S2:{' '}
                                {resolvedW.moveset?.[2]?.name || '—'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onFocus={() => setPreviewCandidateId(instanceId)}
                            onClick={() => handleEquipWeaponInSlot(instanceId)}
                            className={`px-2 py-1 rounded-xs text-[7.5px] font-bold border cursor-pointer shrink-0 ${
                              isEquippedHere
                                ? 'bg-[#1e293b] text-[#fde047] border-[#fde047]/60'
                                : 'bg-[#052e16] hover:bg-[#14532d] text-[#86efac] border-[#22c55e]/60'
                            }`}
                          >
                            {isEquippedHere ? 'EQUIPPED' : 'EQUIP'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    // Hardware Slot Selector (Head, Torso Plating, Arms, Legs)
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
        className="p-2.5 bg-[#090d14] rounded-xs border border-[#fde047] space-y-2"
      >
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-1.5">
          <span className="text-[10px] font-bold text-[#fde047]">
            SELECT CHASSIS HARDWARE FOR [{hwSlotKey.toUpperCase()}]
          </span>
          <button
            type="button"
            data-menu-back="true"
            onClick={() => setIsEditingLoadout(false)}
            className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] rounded-xs text-[8px] font-bold cursor-pointer"
          >
            ✕ BACK TO MECH DOLL
          </button>
        </div>

        {inspectedHw && (
          <div className="p-2 bg-[#05070a] rounded-xs border border-[#334155] flex flex-col sm:flex-row items-center gap-3">
            <HighResEquipmentArtCanvas
              state={state}
              itemIdOrName={inspectedHw.id}
              slotHint={editingSlot}
              sizeClass="w-24 h-24"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-[10px] text-[#38bdf8]">
                  {inspectedHw.name}
                </span>
                {onOpenArmory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingLoadout(false);
                      onOpenArmory(editingSlot, inspectedHw.id);
                    }}
                    className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#fb923c] border border-[#fb923c]/50 rounded-xs text-[7.5px] font-bold cursor-pointer"
                  >
                    ⚙ MODIFY SUB-MODULES & SOCKETS IN ARMORY
                  </button>
                )}
              </div>
              <HardwareStatReadout
                hw={inspectedHw}
                maxGemSlots={getEquipmentMaxModSlots(inspectedHw.id)}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-0.5">
          {hwCandidates.map(({ instanceId, resolvedHw }) => {
            const isEquippedHere =
              currentId === instanceId || currentId === resolvedHw.name;
            return (
              <div
                key={instanceId}
                onMouseEnter={() => setPreviewCandidateId(instanceId)}
                className={`p-1.5 rounded-xs border flex items-center justify-between gap-2 ${
                  isEquippedHere
                    ? 'bg-[#172554]/70 border-[#fde047]'
                    : 'bg-[#05070a] border-[#1e293b] hover:border-[#38bdf8]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <HighResEquipmentArtCanvas
                    state={state}
                    itemIdOrName={resolvedHw.id}
                    slotHint={editingSlot}
                    sizeClass="w-11 h-11"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                      {resolvedHw.name}
                    </div>
                    <div className="text-[7px] text-[#94a3b8] truncate">
                      {resolvedHw.subtype} · {getHardwareBaseWeight(resolvedHw)} WT
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onFocus={() => setPreviewCandidateId(instanceId)}
                  onClick={() => handleEquipHardwareInSlot(instanceId)}
                  className={`px-2 py-1 rounded-xs text-[7.5px] font-bold border cursor-pointer shrink-0 ${
                    isEquippedHere
                      ? 'bg-[#1e293b] text-[#fde047] border-[#fde047]/60'
                      : 'bg-[#052e16] hover:bg-[#14532d] text-[#86efac] border-[#22c55e]/60'
                  }`}
                >
                  {isEquippedHere ? 'EQUIPPED' : 'EQUIP'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
      {/* Top Load Limit Bar & Kit Preset Bar */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#ffd27d]">
              MECH DOLL LOADOUT & ANATOMICAL HARDPOINTS
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-xs text-[8px] font-bold border ${
                loadMetrics.loadBracket === 'light'
                  ? 'bg-[#052e16] text-[#86efac] border-[#22c55e]/50'
                  : loadMetrics.loadBracket === 'medium'
                    ? 'bg-[#0c4a6e] text-[#7dd3fc] border-[#38bdf8]/50'
                    : loadMetrics.loadBracket === 'heavy'
                      ? 'bg-[#451a03] text-[#fde047] border-[#f59e0b]/50'
                      : 'bg-[#450a0a] text-[#fca5a5] border-[#ef4444]/60'
              }`}
            >
              {loadMetrics.loadBracket.toUpperCase()} LOAD · {loadMetrics.equippedWeight}/
              {loadMetrics.maxCapacity} WT ({loadMetrics.loadPct}%)
            </span>
            <span className="px-1.5 py-0.5 rounded-xs bg-[#1e293b] text-[#e2e8f0] text-[7.5px] font-bold">
              STANCE: {activeStance.shortTag.toUpperCase()} ({mainGrip.toUpperCase()})
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onOpenArmory && (
              <button
                type="button"
                onClick={() => {
                  soundSystem.playSelect();
                  onOpenArmory(
                    contextMenuSlot || 'slot1',
                    getEquippedIdForSlot(contextMenuSlot || 'slot1') || undefined
                  );
                }}
                className="px-2 py-0.5 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] border border-[#fb923c] rounded-xs text-[8px] font-bold cursor-pointer"
              >
                ⚙ OPEN ARMORY WORKBENCH
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundSystem.playSelect();
                onOpenInventoryTab();
              }}
              className="px-2 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] text-[#8dd7ad] border border-[#8dd7ad]/50 rounded-xs text-[8px] font-bold cursor-pointer"
            >
              VIEW INVENTORY
            </button>
          </div>
        </div>

        {/* Visual Load Progress Bar */}
        <div className="w-full h-2 bg-[#020617] rounded-xs overflow-hidden border border-[#1e293b] relative">
          <div
            className="h-full transition-all"
            style={{
              width: `${Math.min(100, loadMetrics.loadPct)}%`,
              backgroundColor:
                loadMetrics.loadBracket === 'light'
                  ? '#22c55e'
                  : loadMetrics.loadBracket === 'medium'
                    ? '#38bdf8'
                    : loadMetrics.loadBracket === 'heavy'
                      ? '#f59e0b'
                      : '#ef4444',
            }}
          />
          <div className="absolute inset-y-0 left-[30%] w-px bg-[#475569]" title="30% Light Cap" />
          <div className="absolute inset-y-0 left-[65%] w-px bg-[#475569]" title="65% Medium Cap" />
        </div>

        {/* Starting Kit Presets in Cheat/Sandbox Mode */}
        {isCheatMode && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            <span className="text-[7px] font-bold text-[#94a3b8]">LOAD KIT PRESET:</span>
            {ALL_TRAIT_LINES.map((kitId: TraitLine) => {
              const kit = TRAIT_REGISTRY[kitId];
              return (
                <button
                  key={kitId}
                  type="button"
                  onClick={() => {
                    soundSystem.playPowerup();
                    state.traitLine = kitId;
                    state.equipmentSlots = createInitialEquipmentSlots(kitId);
                    state.equippedWeapons = [...(kit.startingWeapons || ['long_sword'])];
                    syncStateGates(state);
                    sayCtx.say(`LOADED ${kit.name.toUpperCase()} PRESET`);
                    notifyOrionStateChange();
                  }}
                  className={`px-1.5 py-0.2 rounded-xs text-[7px] font-bold border cursor-pointer ${
                    state.traitLine === kitId
                      ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                      : 'bg-[#05070a] text-[#94a3b8] border-[#1e293b] hover:border-[#ffd27d]'
                  }`}
                >
                  {kit.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isEditingLoadout ? (
        renderSlotEquipmentSelector()
      ) : (
        /* ─── MECH DOLL 3-COLUMN ANATOMICAL DIAGRAM & SLOT CONTEXT MENU ─── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">
          {/* LEFT ANATOMICAL COLUMN: CHASSIS ARMOR HARDPOINTS */}
          <div className="lg:col-span-4 space-y-1.5">
            <div className="text-[8px] font-bold text-[#38bdf8] px-1">
              CHASSIS ARMOR HARDPOINTS (CLICK SLOT FOR CONTEXT MENU)
            </div>
            {renderDollSlotNode({
              slot: 'head',
              title: 'HEAD · DOME PLATE',
              itemId: headItem?.id || eq.head || null,
              itemName: headItem?.name || eq.head || 'None',
              subtitle: headItem
                ? `+${headItem.armorDurability ?? 0} ARM DUR · +${headItem.armorRating ?? 0} RTG · +${headItem.armorThreshold ?? 0} THR`
                : 'No Dome Plate',
              wtLabel: `${loadMetrics.breakdown.headWeight} WT`,
              accentColor: '#38bdf8',
              subModulesSummary: `Optics: ${opticsItem?.name.split(' ').slice(-2).join(' ') || 'Std'} · Sens: ${sensoryAItem?.name.split(' ').slice(-2).join(' ') || 'Std'}`,
            })}

            {renderDollSlotNode({
              slot: 'plating',
              title: 'TORSO · FRAME PLATING',
              itemId: platingItem?.id || eq.plating || null,
              itemName: platingItem?.name || eq.plating || 'None',
              subtitle: platingItem
                ? `${(platingItem.armorType || 'Reactive').toUpperCase()} · +${platingItem.armorDurability ?? 0} DUR · +${platingItem.armorRating ?? 0} RTG`
                : 'No Frame Plating',
              wtLabel: `${loadMetrics.breakdown.frameWeight} WT`,
              accentColor: '#a855f7',
              subModulesSummary: `Reactor: ${reactorItem?.name || eq.reactorCore || 'Std'} (${state.reactor})`,
            })}

            {renderDollSlotNode({
              slot: 'arms',
              title: 'ARMS · APERTURE PLATE',
              itemId: armsItem?.id || eq.arms || null,
              itemName: armsItem?.name || eq.arms || 'None',
              subtitle: armsItem
                ? `+${armsItem.armorDurability ?? 0} ARM DUR · +${armsItem.armorRating ?? 0} RTG · +${armsItem.shieldBonus ?? 0} SHD`
                : 'No Aperture Plate',
              wtLabel: `${loadMetrics.breakdown.armsWeight} WT`,
              accentColor: '#fb923c',
              subModulesSummary: `Actuators: ${actuatorsItem?.name.split(' ').slice(-2).join(' ') || 'Std'}`,
            })}

            {renderDollSlotNode({
              slot: 'legs',
              title: 'LEGS · STRIDERS',
              itemId: legsItem?.id || eq.legs || null,
              itemName: legsItem?.name || eq.legs || 'None',
              subtitle: legsItem
                ? `+${getHardwareCapacityBonus(legsItem)} LOAD CAP · ${legsItem.stabilityBonus ? `+${legsItem.stabilityBonus} STB` : 'Agile Stride'}`
                : 'No Leg Striders',
              wtLabel: `${legsItem ? getHardwareBaseWeight(legsItem) : 12} WT`,
              accentColor: '#4ade80',
              subModulesSummary: eq.installedMods?.mobility
                ? `Mobility Mod: ${ACTION_MODIFICATION_CATALOG.find((m) => m.id === eq.installedMods?.mobility)?.name || 'Active'}`
                : 'Mobility Kit: Standard Dash',
            })}
          </div>

          {/* CENTER COLUMN: HIGH-RES MECH DOLL & ACTIVE SLOT CONTEXT MENU */}
          <div className="lg:col-span-4 flex flex-col items-center bg-[#090d14] p-2 rounded-xs border border-[#1e293b] space-y-2">
            <HighResMechDollCanvas
              state={state}
              selectedSlot={contextMenuSlot}
              hoveredSlot={hoveredSlot}
              onSelectSlot={(s) => setContextMenuSlot(s)}
            />

            {/* Contextual Action Menu for Selected Mech Doll Slot */}
            {contextMenuSlot && (
              <div className="w-full p-2 bg-[#05070a] rounded-xs border border-[#fde047]/80 space-y-1.5">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-1">
                  <span className="text-[8.5px] font-bold text-[#fde047]">
                    SLOT CONTEXT MENU: [{contextMenuSlot.toUpperCase()}]
                  </span>
                  <span className="text-[7.5px] text-[#7dd3fc] truncate max-w-[140px]">
                    {getEquipmentDisplayName(getEquippedIdForSlot(contextMenuSlot))}
                  </span>
                </div>

                {/* High-Res Artwork + Quick Actions */}
                <div className="flex items-center gap-2">
                  <HighResEquipmentArtCanvas
                    state={state}
                    itemIdOrName={getEquippedIdForSlot(contextMenuSlot)}
                    slotHint={contextMenuSlot}
                    sizeClass="w-16 h-16"
                  />
                  <div className="flex-1 grid grid-cols-1 gap-1">
                    {/* Action 1: Equip or Swap */}
                    <button
                      type="button"
                      onClick={() => {
                        soundSystem.playSelect();
                        setPreviewCandidateId(getEquippedIdForSlot(contextMenuSlot));
                        openSlotEditor(contextMenuSlot);
                      }}
                      className="w-full px-2 py-1 bg-[#172554] hover:bg-[#1e3a8a] text-[#fde047] border border-[#38bdf8]/60 rounded-xs text-[8px] font-bold text-left cursor-pointer"
                    >
                      1. EQUIP / SWAP ITEM
                    </button>

                    {/* Action 2: Unequip (Side Hand / Auxiliary) */}
                    {(contextMenuSlot === 'slot2' || contextMenuSlot === 'slot3') &&
                      getEquippedIdForSlot(contextMenuSlot) && (
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
                            notifyOrionStateChange();
                          }}
                          className="w-full px-2 py-1 bg-[#450a0a] hover:bg-[#7f1d1d] text-[#fca5a5] border border-[#ef4444]/50 rounded-xs text-[8px] font-bold text-left cursor-pointer"
                        >
                          2. UNEQUIP SLOT
                        </button>
                      )}

                    {/* Action 3: Stance or Grip Toggle */}
                    {contextMenuSlot === 'slot1' && !isTwoHandOnlyWeapon(slot1Id) && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetGrip = mainGrip === '2h' ? '1h' : '2h';
                          const changed = setMainWeaponGrip(state, targetGrip, sayCtx);
                          if (changed) soundSystem.playPowerup();
                          else soundSystem.playMenuBeep();
                          notifyOrionStateChange();
                        }}
                        className="w-full px-2 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-[#7dd3fc] border border-[#38bdf8]/50 rounded-xs text-[8px] font-bold text-left cursor-pointer"
                      >
                        3. TOGGLE GRIP: {mainGrip === '2h' ? 'SWITCH TO 1H GRIP' : 'SWITCH TO 2H POWER STANCE'}
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
                        className="w-full px-2 py-1 bg-[#0f172a] hover:bg-[#1e293b] text-[#c084fc] border border-[#c084fc]/50 rounded-xs text-[8px] font-bold text-left cursor-pointer"
                      >
                        3. SWAP SIDE HAND ⇄ AUX [L]
                      </button>
                    )}

                    {/* Action 4: Modify in Armory */}
                    {onOpenArmory &&
                      contextMenuSlot !== 'bind_l' &&
                      contextMenuSlot !== 'bind_r' && (
                        <button
                          type="button"
                          onClick={() => {
                            soundSystem.playSelect();
                            onOpenArmory(
                              contextMenuSlot,
                              getEquippedIdForSlot(contextMenuSlot) || undefined
                            );
                          }}
                          className="w-full px-2 py-1 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] border border-[#fb923c]/70 rounded-xs text-[8px] font-bold text-left cursor-pointer"
                        >
                          4. MODIFY IN ARMORY ⚙
                        </button>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT ANATOMICAL COLUMN: WEAPON, AUXILIARY & TRIGGER HARDPOINTS */}
          <div className="lg:col-span-4 space-y-1.5">
            <div className="text-[8px] font-bold text-[#fde047] px-1">
              ORDNANCE & TRIGGER HARDPOINTS (CLICK SLOT FOR CONTEXT MENU)
            </div>
            {renderDollSlotNode({
              slot: 'slot1',
              title: 'MAIN HAND [RIGHT]',
              itemId: slot1Id,
              itemName: mainWeapon?.name || getEquipmentDisplayName(slot1Id),
              subtitle: mainWeapon
                ? `${getWeaponSubtypeInfo(mainWeapon.id).subtype} · ${mainWeapon.damagePerShot} DMG`
                : 'Primary Weapon',
              wtLabel: `${getWeaponInstanceEquipWeight(slot1Id, state)} WT`,
              accentColor: '#fde047',
              badgeText: mainGrip.toUpperCase(),
              subModulesSummary: `Slots: [${getWeaponComponentSlots(slot1Id).join('/').toUpperCase()}]`,
            })}

            {renderDollSlotNode({
              slot: 'slot2',
              title: 'SIDE HAND [LEFT]',
              itemId: slot2Id,
              itemName: sideWeapon
                ? sideWeapon.name
                : mainGrip === '2h'
                  ? `${mainWeapon?.name || 'Main Hand'} (2H Grip)`
                  : 'Empty Off-Hand',
              subtitle: sideWeapon
                ? `${getWeaponSubtypeInfo(sideWeapon.id).subtype}`
                : 'Two-Handing Main Weapon (+Stagger / +Impulse)',
              wtLabel:
                slot2Id && slot2Id !== slot1Id
                  ? `${getWeaponInstanceEquipWeight(slot2Id, state)} WT`
                  : '0 WT',
              accentColor: '#38bdf8',
              badgeText: sideWeapon ? 'ACTIVE' : '2H GRIP',
            })}

            {renderDollSlotNode({
              slot: 'slot3',
              title: 'AUXILIARY [BACK]',
              itemId: slot3Id,
              itemName: auxWeapon ? auxWeapon.name : 'Empty Back Mount',
              subtitle: auxWeapon
                ? `${getWeaponSubtypeInfo(auxWeapon.id).subtype} (50% Holstered WT)`
                : 'Holstered Secondary / Shield / Quiver / Catalyst',
              wtLabel:
                slot3Id && slot3Id !== slot1Id && slot3Id !== slot2Id
                  ? `${Math.round(getWeaponInstanceEquipWeight(slot3Id, state) * 0.5)} WT`
                  : '0 WT',
              accentColor: '#c084fc',
              badgeText: 'SWAP [L]',
            })}

            {/* Trigger Bindings Node Pair */}
            <div className="grid grid-cols-2 gap-1.5">
              <div
                role="button"
                tabIndex={0}
                data-menu-focusable="true"
                onClick={() => {
                  soundSystem.playSelect();
                  setContextMenuSlot('bind_l');
                }}
                className={`p-1.5 rounded-xs border cursor-pointer ${
                  contextMenuSlot === 'bind_l'
                    ? 'bg-[#172554] border-[#fde047]'
                    : 'bg-[#090d14] border-[#1e293b] hover:border-[#fde047]'
                }`}
              >
                <div className="text-[7px] font-bold text-[#fde047]">LEFT TRIGGER [J/LMB]</div>
                <div className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                  {leftAction.name}
                </div>
                <div className="text-[6.8px] text-[#94a3b8] truncate">
                  {leftAction.sourceLabel}
                </div>
              </div>
              <div
                role="button"
                tabIndex={0}
                data-menu-focusable="true"
                onClick={() => {
                  soundSystem.playSelect();
                  setContextMenuSlot('bind_r');
                }}
                className={`p-1.5 rounded-xs border cursor-pointer ${
                  contextMenuSlot === 'bind_r'
                    ? 'bg-[#172554] border-[#fde047]'
                    : 'bg-[#090d14] border-[#1e293b] hover:border-[#38bdf8]'
                }`}
              >
                <div className="text-[7px] font-bold text-[#38bdf8]">RIGHT TRIGGER [K/RMB]</div>
                <div className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                  {rightAction.name}
                </div>
                <div className="text-[6.8px] text-[#94a3b8] truncate">
                  {rightAction.sourceLabel}
                </div>
              </div>
            </div>
          </div>
        </div>
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
 * Renders the `INVENTORY` menu (renamed from `SATCHEL`).
 * Lists all owned Weapons, Auxiliaries, Chassis Hardware, Action Mods, Consumables, Gemstones, and Relics
 * with direct actions to equip in `LOADOUT` or modify in `ARMORY`.
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
  const [invWeaponFuncFilter, setInvWeaponFuncFilter] = useState<string>('ALL');
  const [invWeaponVariantFilter, setInvWeaponVariantFilter] = useState<
    'ALL' | 'Custom' | 'Magitech'
  >('ALL');

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
  const selectedInvWeaponClass = WEAPON_CATEGORIES.includes(invSubtype as WeaponCategory)
    ? (invSubtype as WeaponCategory)
    : null;
  const invFunctionalTypes = selectedInvWeaponClass
    ? WEAPON_FUNCTIONAL_TYPES_BY_CATEGORY[selectedInvWeaponClass]
    : [];

  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
      {/* Equipment Inventory Category & Subtype Filter Header */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-[10px] font-bold text-[#8dd7ad]">
            PILOT INVENTORY (WEAPONS · AUXILIARIES · HARDWARE · MODS · CONSUMABLES):
          </span>
          {isCheatMode && (
            <div className="flex items-center gap-1">
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
                  state.toastText = 'ADDED +1 OF ALL 9 GEMSTONE BELT FLASKS TO INVENTORY';
                  state.toastTimer = 2.5;
                  notifyOrionStateChange();
                }}
                className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#8dd7ad]/60 rounded-xs font-bold text-[7.5px] text-[#8dd7ad] cursor-pointer"
              >
                +1 ALL FLASKS
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSystem.playPowerup();
                  for (const relicId of [
                    'rusted_gate_key',
                    'sanctum_lock',
                    'bedivere_ring',
                    'bedivere_list',
                    'bedivere_relic',
                  ]) {
                    addOrionInventoryItem(state, relicId, 1);
                  }
                  state.toastText = 'ADDED RELICS & KEYS TO INVENTORY';
                  state.toastTimer = 2.5;
                  notifyOrionStateChange();
                }}
                className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#ffd27d]/60 rounded-xs font-bold text-[7.5px] text-[#ffd27d] cursor-pointer"
              >
                +1 RELICS & KEYS
              </button>
            </div>
          )}
        </div>

        {/* Primary Equipment Type Filter */}
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: 'all', label: 'All Inventory' },
              { id: 'weapon', label: 'Weapons' },
              { id: 'auxiliary', label: 'Auxiliaries' },
              { id: 'hardware', label: 'Chassis Hardware' },
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
                setInvWeaponFuncFilter('ALL');
              }}
              className={`px-2 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer ${
                invCategory === cat.id
                  ? 'bg-[#8dd7ad] text-[#05070a] border-[#6ee7b7]'
                  : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#8dd7ad]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Nested Class / Subtype Filter */}
        {activeSubtypes.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            <span className="text-[7.5px] text-[#94a3b8] font-bold">
              {invCategory === 'all' || invCategory === 'weapon' || invCategory === 'auxiliary'
                ? 'WEAPON CLASS:'
                : 'SUBTYPE:'}
            </span>
            {activeSubtypes.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setInvSubtype(st);
                  setInvWeaponFuncFilter('ALL');
                }}
                className={`px-1.5 py-0.2 rounded-xs text-[7px] font-bold border cursor-pointer ${
                  invSubtype === st
                    ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                    : 'bg-[#090d14] text-[#94a3b8] border-[#1e293b]'
                }`}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Nested Functional Type & Custom/Magitech Subtype Filter when viewing Weapons/Auxiliaries */}
        {(invCategory === 'all' || invCategory === 'weapon' || invCategory === 'auxiliary') && (
          <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5 border-t border-[#1e293b]/70">
            {selectedInvWeaponClass ? (
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[7px] text-[#38bdf8] font-bold">
                  {selectedInvWeaponClass.toUpperCase()} TYPE:
                </span>
                {(['ALL', ...invFunctionalTypes] as const).map((ft) => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => setInvWeaponFuncFilter(ft)}
                    className={`px-1.5 py-0.2 rounded-xs text-[6.8px] font-bold border cursor-pointer ${
                      invWeaponFuncFilter === ft
                        ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                        : 'bg-[#05070a] text-[#cbd5e1] border-[#1e293b]'
                    }`}
                  >
                    {ft.toUpperCase()}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[7px] text-[#94a3b8]">
                Select a Weapon Class above to drill into its 9 shared Functional Types.
              </span>
            )}
            <div className="flex items-center gap-1">
              <span className="text-[7px] text-[#94a3b8] font-bold">SUBTYPE:</span>
              {(['ALL', 'Custom', 'Magitech'] as const).map((vOpt) => (
                <button
                  key={vOpt}
                  type="button"
                  onClick={() => setInvWeaponVariantFilter(vOpt)}
                  className={`px-1.5 py-0.2 rounded-xs text-[6.8px] font-bold border cursor-pointer ${
                    invWeaponVariantFilter === vOpt
                      ? vOpt === 'Magitech'
                        ? 'bg-[#a21caf] text-[#f8fafc] border-[#e879f9]'
                        : vOpt === 'Custom'
                          ? 'bg-[#15803d] text-[#f8fafc] border-[#86efac]'
                          : 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                      : 'bg-[#05070a] text-[#94a3b8] border-[#1e293b]'
                  }`}
                >
                  {vOpt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 1. Owned Weapons & Auxiliaries Inventory */}
      {(invCategory === 'all' || invCategory === 'weapon' || invCategory === 'auxiliary') && (
        <div className="space-y-1">
          <div className="text-[8.5px] font-bold text-[#ffd27d]">
            OWNED WEAPONS & AUXILIARIES (SHARED FUNCTIONAL CLASSES · CUSTOM &amp; MAGITECH):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {Object.values(WEAPON_REGISTRY)
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
                  selectedInvWeaponClass &&
                  invWeaponFuncFilter !== 'ALL' &&
                  stInfo.functionalType !== invWeaponFuncFilter
                ) {
                  return false;
                }
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
                const inMain = state.equipmentSlots?.slot1 === instanceId;
                const inSide = state.equipmentSlots?.slot2 === instanceId;
                const inAux = state.equipmentSlots?.slot3 === instanceId;

                return (
                  <div
                    key={instanceId}
                    className="p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b] flex flex-col justify-between gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <SpriteCanvasIcon
                          base64={strip}
                          col={gemVis.colIndex}
                          sizeClass="w-4 h-4"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[9px] text-[#ffd27d] truncate">
                            {w.name} <span className="text-[#94a3b8]">×{copies}</span>
                          </div>
                          <div className="text-[7.5px] text-[#7dd3fc] truncate">
                            {stInfo.subtype} · [{getWeaponComponentSlots(instanceId).join(' / ').toUpperCase()}]
                            {inMain ? ' · [MAIN]' : ''}
                            {inSide ? ' · [SIDE]' : ''}
                            {inAux ? ' · [AUX]' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {onOpenArmory && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenArmory(isAuxiliaryEquipment(w) ? 'slot2' : 'slot1', instanceId)
                            }
                            className="px-1.5 py-0.5 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] border border-[#fb923c]/60 rounded-xs text-[7px] font-bold cursor-pointer"
                          >
                            ⚙ ARMORY
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openSlotEditor(isAuxiliaryEquipment(w) ? 'slot2' : 'slot1')}
                          className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[7px] font-bold cursor-pointer"
                        >
                          LOADOUT
                        </button>
                      </div>
                    </div>
                    <WeaponStatReadout w={w} instanceId={instanceId} state={state} compact />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 2. Chassis Hardware & Retained Action Mods Inventory */}
      {(invCategory === 'all' || invCategory === 'hardware' || invCategory === 'mod') && (
        <div className="space-y-1">
          <div className="text-[8.5px] font-bold text-[#38bdf8]">
            CHASSIS HARDWARE & ACTION MODS:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
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
                  const maxGemSlots = getEquipmentMaxModSlots(instanceId);
                  const editTargetSlot: EditableLoadoutSlot =
                    baseHw.slot === 'aux3' || baseHw.slot === 'aux4' ? 'slot3' : baseHw.slot;
                  return (
                    <div
                      key={instanceId}
                      className="p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b] flex flex-col justify-between gap-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                            {hw.name} <span className="text-[#94a3b8]">×{count}</span>
                          </div>
                          <div className="text-[7px] text-[#94a3b8] truncate">
                            Hardware · {hw.slot.toUpperCase()} · {hw.subtype}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {onOpenArmory && (
                            <button
                              type="button"
                              onClick={() => onOpenArmory(editTargetSlot, instanceId)}
                              className="px-1.5 py-0.5 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] border border-[#fb923c]/60 rounded-xs text-[7px] font-bold cursor-pointer"
                            >
                              ⚙ ARMORY
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openSlotEditor(editTargetSlot)}
                            className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[7px] font-bold cursor-pointer"
                          >
                            LOADOUT
                          </button>
                        </div>
                      </div>
                      <HardwareStatReadout hw={hw} maxGemSlots={maxGemSlots} />
                    </div>
                  );
                })}

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
                  className="p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b] flex flex-col justify-between gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-[8.5px] text-[#c084fc] truncate">{m.name}</div>
                      <div className="text-[7px] text-[#94a3b8] truncate">
                        Action Mod · {m.targetCategory.toUpperCase()} ·{' '}
                        {(m.weightDelta ?? 0) >= 0 ? `+${m.weightDelta ?? 0}` : m.weightDelta} WT
                      </div>
                    </div>
                    {onOpenArmory && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenArmory(
                            m.targetCategory === 'melee'
                              ? 'mod_melee'
                              : m.targetCategory === 'mobility'
                                ? 'mod_mobility'
                                : 'mod_ranged'
                          )
                        }
                        className="px-2 py-0.5 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] border border-[#fb923c]/60 rounded-xs text-[7px] font-bold cursor-pointer shrink-0"
                      >
                        ⚙ INSTALL IN ARMORY
                      </button>
                    )}
                  </div>
                  <div className="text-[7px] text-[#86efac]">+ {m.gainDescription}</div>
                  {m.drawbackDescription && (
                    <div className="text-[6.8px] text-[#f87171]">− {m.drawbackDescription}</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 3. Consumables, Gemstones & Relics Inventory */}
      {(invCategory === 'all' || invCategory === 'consumable') && (
        <div className="space-y-1">
          <div className="text-[8.5px] font-bold text-[#8dd7ad]">
            SALVAGED CONSUMABLES, GEMSTONES & RELICS:
          </div>
          {state.inventorySlots.length === 0 ? (
            <div className="text-center text-[#64748b] py-4 italic">
              No salvage in inventory. Explore drop-pod marshlands and loot caches.
            </div>
          ) : (
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
                    className="flex items-center justify-between p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b]"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="font-bold text-[#ffd27d] flex items-center gap-1.5 flex-wrap">
                        {def.iconSprite?.base64 ? (
                          <SpriteCanvasIcon
                            base64={def.iconSprite.base64}
                            col={def.iconSprite.col || 0}
                            sizeClass="w-4 h-4"
                          />
                        ) : (
                          <span className="text-[#38bdf8]">◆</span>
                        )}
                        <span>{def.name}</span>
                        <span className="text-[#94a3b8]">×{slot.count}</span>
                        <span className="text-[7.5px] px-1 py-0.2 rounded-[2px] bg-[#1e293b] text-[#7dd3fc]">
                          0 WT · {(isGem ? 'gemstone' : def.category).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[8px] text-[#cbd5e1]">{def.description}</div>
                      {isGem && GEMSTONE_REGISTRY[slot.itemId as GemId] && (
                        <div className="text-[7px] text-[#86efac]">
                          + ARMORY MOD ({formatModifiedEquipmentName('Weapon', [slot.itemId as GemId])}):{' '}
                          {WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[slot.itemId as GemId]} ·{' '}
                          {WEAPON_GEM_WEIGHT_DELTA[slot.itemId as GemId] >= 0
                            ? `+${WEAPON_GEM_WEIGHT_DELTA[slot.itemId as GemId]}`
                            : WEAPON_GEM_WEIGHT_DELTA[slot.itemId as GemId]}{' '}
                          WT
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {isGem && onOpenArmory && (
                        <button
                          type="button"
                          onClick={() => {
                            soundSystem.playSelect();
                            onOpenArmory('slot1');
                          }}
                          className="px-1.5 py-1 bg-[#451a03] hover:bg-[#78350f] text-[#fdba74] font-bold rounded-xs border border-[#fb923c]/60 text-[8px] cursor-pointer"
                        >
                          ⚙ ARMORY
                        </button>
                      )}
                      {isGem && (
                        <button
                          type="button"
                          onClick={() => {
                            soundSystem.playSelect();
                            onOpenProgressionTab();
                          }}
                          className="px-1.5 py-1 bg-[#172554] hover:bg-[#1e3a8a] text-[#7dd3fc] font-bold rounded-xs border border-[#38bdf8]/60 text-[8px] cursor-pointer"
                        >
                          SKILLS & FEATS
                        </button>
                      )}
                      {def.onUse && (
                        <button
                          type="button"
                          onClick={() => handleUseItem(slot.itemId)}
                          className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] font-bold rounded-xs border border-[#475569] text-[8.5px] cursor-pointer"
                        >
                          USE
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
};
