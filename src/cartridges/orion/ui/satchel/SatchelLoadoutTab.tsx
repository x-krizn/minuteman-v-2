/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { TRAIT_REGISTRY } from '../../database/characters';
import {
  formatModifiedEquipmentName,
  GEM_MOD_PREFIX_BY_ID,
  getResolvedActionDescriptor,
  parseEquipmentInstanceId,
} from '../../database/equipment';
import {
  CanonicalHardwareItemDefinition,
  findHardwareItemByNameOrId,
  getHardwareBaseWeight,
  getHardwareCapacityBonus,
  getHardwareGemBonusDescription,
} from '../../database/equipment/chassis_hardware';
import { getItemDefinition } from '../../database/items';
import {
  ACTION_MODIFICATION_CATALOG,
  CHASSIS_HARDWARE_CATALOG,
  computePlayerLoadMetrics,
  consumeInventoryGem,
  GEMSTONE_CATALOG,
  GEMSTONE_REGISTRY,
  generateEquipmentModWithGems,
  getEffectiveMainGrip,
  getEquipmentDisplayName,
  getEquipmentMaxModSlots,
  getInventoryGemCount,
  getOwnedEquipmentInstances,
  getOwnedWeaponCount,
  getWeaponComponentSlots,
  getWeaponGemCombatModifiers,
  getWeaponGemVisuals,
  getWeaponInstanceEquipWeight,
  getWeaponSubtypeInfo,
  installGemModOnEquipment,
  isEquipmentUnlocked,
  refundInventoryGem,
  setMainWeaponGrip,
  WEAPON_COMPONENT_PART_CATALOG,
  WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS,
  WEAPON_GEM_WEIGHT_DELTA,
} from '../../database/progression';
import {
  getWeaponDefinition,
  isAuxiliaryEquipment,
  isTrueWeaponEquipment,
  isTwoHandOnlyWeapon,
  WEAPON_REGISTRY,
} from '../../database/equipment/weapons';
import { GemId, OrionState, WeaponDefinition } from '../../types';
import {
  addOrionInventoryItem,
  ASSIGNABLE_ACTION_CATALOG,
  assignTriggerAction,
  computePlayerWeightRecoveryProfile,
  consolidateInventorySlots,
  getActiveWeaponStance,
  getResolvedCombatSkills,
  isActionUnlocked,
  notifyOrionStateChange,
  performAuxiliarySwap,
  resolvePlayerSpriteParts,
  syncStateGates,
} from '../../systems';
import {
  CompositeMechPreviewCanvas,
  EditableLoadoutSlot,
  EquipmentInventoryCategory,
  SpriteCanvasIcon,
} from './SatchelCanvases';

/**
 * Renders structured numeric stats, damage/armor values, types, increases, and decreases for any Weapon or Auxiliary.
 */
const WeaponStatReadout: React.FC<{
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

  // Mod / Gem increases & decreases
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
    // Lower cooldown is an improvement
    if (pct < 0) incBadges.push(`${pct}% CD`);
    else decBadges.push(`+${pct}% CD`);
  }
  if (gemMods.skillHeatCostMult !== 1) {
    const pct = Math.round((gemMods.skillHeatCostMult - 1) * 100);
    // Lower heat cost is an improvement
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
      <div className="flex flex-wrap items-center gap-1">
        <span className="px-1 py-0.2 rounded-[2px] bg-[#1e293b] text-[#ffd27d] font-bold">
          {totalWt} WT ({(w.weightClass || 'medium').toUpperCase()})
        </span>
        <span className="px-1 py-0.2 rounded-[2px] bg-[#0f172a] text-[#cbd5e1] border border-[#334155]">
          {handingLabel}
        </span>
        <span className="px-1 py-0.2 rounded-[2px] bg-[#172554] text-[#7dd3fc] font-bold">
          {effectiveDmg > 0 ? `${effectiveDmg} DMG × ${effectiveChain} CHAIN` : 'SUPPORT / GUARD'}
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
          {w.reloadDurationSec}s RLD · {primaryRange}px RNG
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
        <div className="text-[6.5px] text-[#94a3b8] leading-tight pt-0.5 border-t border-[#1e293b]/70">
          <span className="text-[#cbd5e1] font-bold">MOVESET: </span>
          {w.moveset
            .map(
              (s) =>
                `[S${s.slot} ${s.name}: ${s.damage > 0 ? `${s.damage} ${s.damageType}` : s.damageType} · ${s.cooldownSec}s CD · ${s.heatCost}H]`
            )
            .join(' · ')}
        </div>
      )}
    </div>
  );
};

/**
 * Renders structured numeric stats, armor values, capacity, increases, and decreases for any Chassis Hardware piece.
 */
const HardwareStatReadout: React.FC<{
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
    // Lower windup tell duration is faster attack startup (increase in speed)
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
    // Negative cooldownMult delta reduces cooldowns (positive gain)
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
 * Inline Gem Mod synthesis panel for any Weapon, Auxiliary, Armor, Reactor, or Sensor instance.
 * Consumes 1 copy of the source item and 1 Gemstone to synthesize a distinct renamed item copy
 * (`<Prefix> <Base Name>`, `<Prefix> <Base Name> +II`, `<Prefix> <Base Name> +III`).
 */
const EquipmentGemModInstaller: React.FC<{
  state: OrionState;
  instanceId: string;
  baseName: string;
  isCheatMode: boolean;
}> = ({ state, instanceId, baseName, isCheatMode }) => {
  const [open, setOpen] = useState(false);
  const { baseId, installedGems } = parseEquipmentInstanceId(instanceId);
  const maxSlots = getEquipmentMaxModSlots(instanceId);
  const remainingSlots = Math.max(0, maxSlots - installedGems.length);

  const isWeaponOrAux = Boolean(getWeaponDefinition(baseId));
  const hwDef = !isWeaponOrAux ? findHardwareItemByNameOrId(baseId) : undefined;
  const anatomicalSlots = isWeaponOrAux ? getWeaponComponentSlots(baseId) : [];
  const nextComponentSlot = isWeaponOrAux
    ? anatomicalSlots[installedGems.length] || anatomicalSlots[0] || 'grip'
    : undefined;
  const installedCompMap = state.equipmentSlots?.installedWeaponComponents?.[instanceId] || {};

  if (maxSlots <= 0) return null;

  const matchingComponentParts = nextComponentSlot
    ? WEAPON_COMPONENT_PART_CATALOG.filter((part) => part.componentSlot === nextComponentSlot)
    : [];

  return (
    <div className="mt-1 pt-1 border-t border-[#1e293b]/80 space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-1 text-[7px]">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[#94a3b8] font-bold">
            {isWeaponOrAux
              ? `COMPONENT SLOTS [${installedGems.length}/${maxSlots}]:`
              : `${hwDef?.origin === 'crafted' ? 'CRAFTED (MAX 1 GEM)' : 'GEM SLOTS'} [${installedGems.length}/${maxSlots}]:`}
          </span>
          {Array.from({ length: maxSlots }).map((_, idx) => {
            const gId = installedGems[idx];
            const gDef = gId ? GEMSTONE_REGISTRY[gId] : undefined;
            const slotLabel = isWeaponOrAux
              ? (anatomicalSlots[idx] || `slot_${idx + 1}`).toUpperCase()
              : `GEM ${idx + 1}`;
            const compPartId =
              isWeaponOrAux && anatomicalSlots[idx]
                ? installedCompMap[anatomicalSlots[idx]]
                : undefined;
            const compPart = compPartId
              ? WEAPON_COMPONENT_PART_CATALOG.find((p) => p.id === compPartId)
              : undefined;

            return (
              <span
                key={idx}
                className={`px-1 py-0.2 rounded-[2px] border font-bold ${
                  gDef
                    ? 'bg-[#172554]/80 border-[#38bdf8]/60 text-[#7dd3fc]'
                    : 'bg-[#090d14] border-[#334155] text-[#64748b]'
                }`}
              >
                {slotLabel}:{' '}
                {compPart
                  ? `${compPart.name} (${gDef?.name || 'Gem'})`
                  : gDef
                    ? `${idx === 0 ? `${GEM_MOD_PREFIX_BY_ID[gId]} · ` : ''}${gDef.name}`
                    : 'EMPTY'}
              </span>
            );
          })}
        </div>
        {remainingSlots > 0 ? (
          <button
            type="button"
            onClick={() => {
              soundSystem.playSelect();
              setOpen((prev) => !prev);
            }}
            className={`px-1.5 py-0.2 rounded-xs font-bold border cursor-pointer ${
              open
                ? 'bg-[#facc15] text-[#05070a] border-[#fde047]'
                : 'bg-[#3b0764]/80 hover:bg-[#581c87] text-[#e9d5ff] border-[#c084fc]/60'
            }`}
          >
            {open
              ? '✕ CANCEL MOD'
              : isWeaponOrAux && nextComponentSlot
                ? `+ MOD [${nextComponentSlot.toUpperCase()}] (${remainingSlots} LEFT)`
                : `+ INSTALL GEM (${remainingSlots} LEFT)`}
          </button>
        ) : (
          <span className="text-[#4ade80] font-bold">MAX SLOTS FILLED</span>
        )}
      </div>

      {open && remainingSlots > 0 && (
        <div className="p-1.5 bg-[#05070a] rounded-xs border border-[#c084fc]/50 space-y-1.5">
          {/* Option A: Named Weapon Component Parts (Crafted vs Looted Standalone) */}
          {isWeaponOrAux && nextComponentSlot && matchingComponentParts.length > 0 && (
            <div className="space-y-1">
              <div className="text-[7px] font-bold text-[#38bdf8]">
                1. INSTALL [{nextComponentSlot.toUpperCase()}] COMPONENT MOD PART (CRAFTED = MAX 1 GEM SLOT · LOOTED = 2 GEM SLOTS):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {matchingComponentParts.map((part) => {
                  const primaryGem = part.gemCost[0]?.gemId || 'carnelian';
                  const canAfford =
                    isCheatMode ||
                    part.gemCost.every((c) => getInventoryGemCount(state, c.gemId) >= c.count);
                  const costLabel =
                    part.gemCost.length > 0
                      ? part.gemCost
                          .map(
                            (c) =>
                              `${c.count} ${GEMSTONE_REGISTRY[c.gemId]?.name || c.gemId} (${getInventoryGemCount(state, c.gemId)})`
                          )
                          .join(' + ')
                      : `Looted Part (1 Gem Synth)`;
                  const previewName = formatModifiedEquipmentName(baseName, [
                    ...installedGems,
                    primaryGem,
                  ]);

                  return (
                    <button
                      key={part.id}
                      type="button"
                      disabled={!canAfford}
                      onClick={() => {
                        if (part.gemCost.length > 0) {
                          // Consume extra gems beyond the 1 consumed by installGemModOnEquipment
                          for (let i = 0; i < part.gemCost.length; i++) {
                            const req = part.gemCost[i];
                            const extraCount = i === 0 ? Math.max(0, req.count - 1) : req.count;
                            if (extraCount > 0 && !isCheatMode) {
                              consumeInventoryGem(state, req.gemId, extraCount);
                            }
                          }
                          if (
                            getInventoryGemCount(state, primaryGem) <= 0 &&
                            isCheatMode
                          ) {
                            refundInventoryGem(state, primaryGem, 1);
                          }
                        } else if (
                          getInventoryGemCount(state, primaryGem) <= 0 &&
                          isCheatMode
                        ) {
                          refundInventoryGem(state, primaryGem, 1);
                        }
                        const newId = installGemModOnEquipment(
                          state,
                          instanceId,
                          primaryGem,
                          {
                            say: (txt) => {
                              state.toastText = txt;
                              state.toastTimer = 2.8;
                            },
                          },
                          {
                            slotName: nextComponentSlot,
                            partDef: part,
                          }
                        );
                        if (newId) {
                          soundSystem.playPowerup();
                          setOpen(false);
                          syncStateGates(state);
                          notifyOrionStateChange();
                        } else {
                          soundSystem.playMenuBeep();
                        }
                      }}
                      className={`p-1 rounded-xs border text-left transition-colors ${
                        canAfford
                          ? 'bg-[#0f172a] hover:bg-[#1e293b] border-[#c084fc]/50 cursor-pointer'
                          : 'bg-[#090d14] border-[#1e293b] opacity-45 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[7.5px] text-[#e9d5ff] truncate">
                          {part.name} [{part.origin.toUpperCase()} · {part.maxGemSlots}G]
                        </span>
                        <span className="text-[6.5px] text-[#fbbf24] font-bold shrink-0">
                          {part.weightDelta >= 0 ? `+${part.weightDelta}` : part.weightDelta} WT
                        </span>
                      </div>
                      <div className="text-[6.5px] text-[#86efac] truncate">
                        + {part.gainDescription}
                      </div>
                      <div className="text-[6.5px] text-[#f87171] truncate">
                        − {part.drawbackDescription}
                      </div>
                      <div className="flex items-center justify-between text-[6.5px] text-[#ffd27d] mt-0.5">
                        <span className="truncate">→ {previewName}</span>
                        <span className="text-[#94a3b8] shrink-0">{costLabel}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Option B: Direct Gemstone Socket Installation (Zero-Sum Gain/Drawback + WT Delta) */}
          <div className="space-y-1">
            <div className="text-[7px] text-[#cbd5e1] font-bold">
              {isWeaponOrAux && nextComponentSlot
                ? `2. OR SOCKET DIRECT GEMSTONE INTO [${nextComponentSlot.toUpperCase()}] (ZERO-SUM STAT + WEIGHT TRADE-OFF):`
                : `SOCKET GEMSTONE ON ${getEquipmentDisplayName(instanceId).toUpperCase()} (ZERO-SUM STAT + WEIGHT TRADE-OFF):`}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              {GEMSTONE_CATALOG.map((gem) => {
                const have = getInventoryGemCount(state, gem.id);
                const canInstall = have > 0 || isCheatMode;
                const previewName = formatModifiedEquipmentName(baseName, [
                  ...installedGems,
                  gem.id,
                ]);
                const wtDelta = WEAPON_GEM_WEIGHT_DELTA[gem.id] ?? 1;
                return (
                  <button
                    key={gem.id}
                    type="button"
                    disabled={!canInstall}
                    onClick={() => {
                      if (have <= 0 && isCheatMode) {
                        refundInventoryGem(state, gem.id as GemId, 1);
                      }
                      const newId = installGemModOnEquipment(
                        state,
                        instanceId,
                        gem.id as GemId,
                        {
                          say: (txt) => {
                            state.toastText = txt;
                            state.toastTimer = 2.8;
                          },
                        },
                        nextComponentSlot
                          ? { slotName: nextComponentSlot }
                          : undefined
                      );
                      if (newId) {
                        soundSystem.playPowerup();
                        setOpen(false);
                        syncStateGates(state);
                        notifyOrionStateChange();
                      } else {
                        soundSystem.playMenuBeep();
                      }
                    }}
                    className={`p-1 rounded-xs border text-left transition-colors ${
                      canInstall
                        ? 'bg-[#0f172a] hover:bg-[#1e293b] border-[#38bdf8]/50 cursor-pointer'
                        : 'bg-[#090d14] border-[#1e293b] opacity-45 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1 font-bold text-[7.5px] text-[#f8fafc]">
                        <SpriteCanvasIcon base64={gem.iconBase64} sizeClass="w-3 h-3" />
                        {gem.name} ({GEM_MOD_PREFIX_BY_ID[gem.id]})
                      </span>
                      <span className="text-[6.5px] font-bold text-[#fbbf24]">
                        {wtDelta >= 0 ? `+${wtDelta}` : wtDelta} WT · ×{have}
                      </span>
                    </div>
                    <div className="text-[6.5px] text-[#94a3b8] truncate">
                      {!isWeaponOrAux && hwDef
                        ? getHardwareGemBonusDescription(hwDef.slot, gem.id)
                        : WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[gem.id]}
                    </div>
                    <div className="text-[7px] text-[#ffd27d] font-bold truncate mt-0.5">
                      → {previewName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Props for the Pilot Satchel Loadout Tab component.
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
}

/**
 * Pilot Satchel Loadout Tab displaying Main Hand (Right), Side Hand (Left), and Auxiliary (Back)
 * weapon/equipment slots, composite mech preview, and action slot bindings.
 * Supports both HUD modes inside the Pilot Satchel overlay. Mutates `state: OrionState` when equipping/swapping items.
 */
export const SatchelLoadoutTab: React.FC<SatchelLoadoutTabProps> = ({
  state,
  isCheatMode,
  isEditingLoadout,
  setIsEditingLoadout,
  editingSlot,
  setEditingSlot,
  loadoutSubtypeFilter,
  setLoadoutSubtypeFilter,
  openSlotEditor,
  onOpenInventoryTab,
}) => {
  const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;
  const activeStance = getActiveWeaponStance(state);
  const resolvedSkills = getResolvedCombatSkills(state);
  const mainGrip = getEffectiveMainGrip(state);
  const slot1Id = state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'long_sword';
  const slot2Id = state.equipmentSlots?.slot2 || null;
  const slot3Id = state.equipmentSlots?.slot3 || null;
  const mainWpnDef = getWeaponDefinition(slot1Id);
  const isBowMain = isTwoHandOnlyWeapon(mainWpnDef);

  const currentHeadName =
    state.equipmentSlots?.head || `${trait.frameModel || 'Mark-IV'} Sensor Visor`;
  const currentOpticsName =
    state.equipmentSlots?.headOptics || 'BWI Scout Monocular';
  const currentSensoryAName = state.equipmentSlots?.sensoryA || 'Federated T7 Sensor Array';
  const currentSensoryBName = state.equipmentSlots?.sensoryB || 'Federated EchoPulse Scanner';
  const currentArmsName =
    state.equipmentSlots?.arms || `${trait.frameModel || 'Mark-IV'} Actuator Vambraces`;
  const currentActuatorsName =
    state.equipmentSlots?.armActuators || 'BWI Stabilized Gauntlets';
  const currentLegsName = state.equipmentSlots?.legs || 'BWI Strider Leg Assembly';
  const currentPlatingName =
    state.equipmentSlots?.plating ||
    `${trait.frameModel || 'Mark-IV'} ${trait.baseArmor.type} Plating`;
  const currentReactorName =
    state.equipmentSlots?.reactorCore || 'PNSY Alchemic Turbine Core Mk.IV';
  const installedRangedMod = ACTION_MODIFICATION_CATALOG.find(
    (m) => m.id === state.equipmentSlots?.installedMods?.ranged
  );
  const installedMeleeMod = ACTION_MODIFICATION_CATALOG.find(
    (m) => m.id === state.equipmentSlots?.installedMods?.melee
  );
  const installedMobilityMod = ACTION_MODIFICATION_CATALOG.find(
    (m) => m.id === state.equipmentSlots?.installedMods?.mobility
  );
  const boundLDesc = getResolvedActionDescriptor(
    state,
    state.assignedActions?.L || 'weapon_skill_1'
  );
  const boundRDesc = getResolvedActionDescriptor(
    state,
    state.assignedActions?.R || 'weapon_skill_2'
  );
  const loadMetrics = computePlayerLoadMetrics(state);

  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
      {/* 1. Weapon Action Grid & Active Stance Resolution (ac1..ac5) + Loadout Edit Toggle */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <CompositeMechPreviewCanvas
              state={state}
              head={currentHeadName}
              arms={currentArmsName}
              plating={currentPlatingName}
              weaponId={slot1Id}
              sideWeaponId={slot2Id}
              auxWeaponId={slot3Id}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#38bdf8] font-bold text-[10px]">
                  ACTIVE LOADOUT & STANCE:
                </span>
                <span className="text-[#ffd27d] font-black text-[9px]">{activeStance.label}</span>
              </div>
              <div className="text-[7.5px] text-[#94a3b8]">
                16×16 4-FRAME GLIDE COMPOSITE ({computePlayerWeightRecoveryProfile(state).weightLabel}{' '}
                · {computePlayerWeightRecoveryProfile(state).recoveryFrames.length}F RECOVERY): HEAD
                ({resolvePlayerSpriteParts(state).headStyle.toUpperCase()}) · ARMS (
                {resolvePlayerSpriteParts(state).armsStyle.toUpperCase()}) · FRAME PLATING (
                {resolvePlayerSpriteParts(state).framePlatingStyle.toUpperCase()})
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                soundSystem.playSelect();
                setIsEditingLoadout((prev) => !prev);
                setLoadoutSubtypeFilter('ALL');
              }}
              className={`px-2 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer ${
                isEditingLoadout
                  ? 'bg-[#facc15] text-[#05070a] border-[#fde047]'
                  : 'bg-[#172554] hover:bg-[#1e3a8a] text-[#7dd3fc] border-[#38bdf8]'
              }`}
            >
              {isEditingLoadout ? '✓ DONE EDITING LOADOUT' : '✎ EDIT LOADOUT'}
            </button>
            <button
              onClick={() => {
                soundSystem.playSelect();
                onOpenInventoryTab();
              }}
              className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] border border-[#8dd7ad]/60 rounded-xs text-[8px] font-bold text-[#8dd7ad] cursor-pointer"
            >
              EQUIPMENT INVENTORY
            </button>
            <button
              onClick={() => {
                performAuxiliarySwap(
                  state,
                  {
                    say: (txt) => {
                      state.toastText = txt;
                      state.toastTimer = 2.5;
                    },
                  },
                  true
                );
              }}
              className="px-1.5 py-0.5 bg-[#422006]/90 hover:bg-[#713f12] border border-[#f59e0b]/60 rounded-xs text-[8px] font-bold text-[#fbbf24] cursor-pointer"
            >
              SWAP SIDE ⇄ AUX [L]
            </button>
          </div>
        </div>

        {/* Load Limit Bar (0-30% Light | 31-65% Medium | 66-100% Heavy | >100% Overloaded) */}
        <div className="p-1.5 bg-[#06090e] rounded-xs border border-[#1e293b] space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-1 text-[8px]">
            <span className="font-bold text-[#ffd27d]">
              LOAD LIMIT: {loadMetrics.equippedWeight} / {loadMetrics.maxCapacity} WT (
              {loadMetrics.loadPct}%)
            </span>
            <span
              className={`px-1.5 py-0.2 rounded-xs font-black text-[7.5px] ${
                loadMetrics.loadBracket === 'light'
                  ? 'bg-[#064e3b] text-[#6ee7b7]'
                  : loadMetrics.loadBracket === 'medium'
                    ? 'bg-[#172554] text-[#7dd3fc]'
                    : loadMetrics.loadBracket === 'heavy'
                      ? 'bg-[#451a03] text-[#fcd34d]'
                      : 'bg-[#7f1d1d] text-[#fca5a5] animate-pulse'
              }`}
            >
              {loadMetrics.loadBracket.toUpperCase()} (0–30% LIGHT · 31–65% MED · 66–100% HVY ·
              100%&lt; OVERLOAD)
            </span>
          </div>
          <svg
            viewBox="0 0 100 3"
            preserveAspectRatio="none"
            className="w-full h-1.5 rounded-xs bg-[#1e293b] overflow-hidden"
          >
            <rect
              x="0"
              y="0"
              width={Math.max(0, Math.min(100, loadMetrics.loadPct))}
              height="3"
              fill={
                loadMetrics.loadBracket === 'light'
                  ? '#34d399'
                  : loadMetrics.loadBracket === 'medium'
                    ? '#38bdf8'
                    : loadMetrics.loadBracket === 'heavy'
                      ? '#fbbf24'
                      : '#f87171'
              }
            />
            <line x1="30" y1="0" x2="30" y2="3" stroke="#090d14" strokeWidth="0.7" />
            <line x1="65" y1="0" x2="65" y2="3" stroke="#090d14" strokeWidth="0.7" />
          </svg>
        </div>

        <div className="text-[8px] text-[#cbd5e1]">
          {activeStance.description} ·{' '}
          <span className="text-[#94a3b8]">
            {!slot2Id
              ? 'No Side Hand equipped → Main Hand is automatically 2H.'
              : 'Click any slot or EDIT LOADOUT to change equipped items or install Component/Gem Mods.'}
          </span>
        </div>

        {/* Canonical grip . ac1 . ac2 . ac3 . ac4 . ac5 . Reference Matrix + Resolved Skills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[7.5px]">
          <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] font-mono">
            <div className="text-[#94a3b8] font-bold mb-0.5">GRIP MATRIX (1H / 2H / OFF):</div>
            <div className="grid grid-cols-6 gap-0.5 text-center font-bold border-b border-[#1e293b] pb-0.5 text-[#38bdf8]">
              <span>GRIP</span>
              <span>AC1</span>
              <span>AC2</span>
              <span>AC3</span>
              <span>AC4</span>
              <span>AC5</span>
            </div>
            {[
              { g: '1h', vals: ['yes', 'yes', 'yes', 'no', 'no'], active: mainGrip === '1h' },
              { g: '2h', vals: ['yes', 'yes', 'yes', 'yes', 'yes'], active: mainGrip === '2h' },
              {
                g: 'off',
                vals: ['no', 'no', 'no', 'yes', 'yes'],
                active: Boolean(slot2Id && mainGrip === '1h'),
              },
            ].map((row) => (
              <div
                key={row.g}
                className={`grid grid-cols-6 gap-0.5 text-center py-0.2 ${
                  row.active ? 'text-[#ffd27d] font-bold' : 'text-[#64748b]'
                }`}
              >
                <span className="uppercase">{row.g}</span>
                {row.vals.map((v, i) => (
                  <span
                    key={i}
                    className={
                      v === 'yes'
                        ? row.active
                          ? 'text-[#4ade80]'
                          : 'text-[#94a3b8]'
                        : 'text-[#475569]'
                    }
                  >
                    {v}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Resolved ac1..ac5 Live Readout */}
          <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] space-y-0.5">
            <div className="text-[#94a3b8] font-bold">RESOLVED 5-ACTION LOADOUT (AC1–AC5):</div>
            {(
              [
                { key: 'AC1 [X]', sk: resolvedSkills.skill1 },
                { key: 'AC2 [Y TAP]', sk: resolvedSkills.skill2 },
                { key: 'AC3 [R TAP]', sk: resolvedSkills.skill3 },
                { key: 'AC4 [Y HOLD]', sk: resolvedSkills.skill4 },
                { key: 'AC5 [R HOLD]', sk: resolvedSkills.skill5 },
              ] as const
            ).map((entry) => (
              <div
                key={entry.key}
                className="flex items-center justify-between gap-1 text-[7.5px]"
              >
                <span className="text-[#38bdf8] font-bold shrink-0">{entry.key}:</span>
                <span
                  className={`truncate font-bold ${
                    entry.sk?.available ? 'text-[#ffd27d]' : 'text-[#64748b]'
                  }`}
                >
                  {entry.sk?.available
                    ? `${entry.sk.name} (${entry.sk.sourceSlotName})`
                    : 'no (inactive)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Weapon, Auxiliary & Consumable Slots (Compact Summary Cards) */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] font-bold text-[#94a3b8]">
          <span>WEAPON, SIDE & AUXILIARY SLOTS</span>
          <div className="flex items-center gap-1">
            <span className="text-[8px] text-[#cbd5e1]">MAIN GRIP:</span>
            <button
              disabled={isBowMain || !slot2Id}
              onClick={() => {
                soundSystem.playSelect();
                setMainWeaponGrip(state, '1h', {
                  say: (txt) => {
                    state.toastText = txt;
                    state.toastTimer = 2.5;
                  },
                });
                syncStateGates(state);
                notifyOrionStateChange();
              }}
              title={
                !slot2Id
                  ? 'No Side Hand equipped — Main Hand is automatically 2H'
                  : 'Switch Main Hand to 1H Grip'
              }
              className={`px-1.5 py-0.2 rounded-xs text-[7.5px] font-bold border ${
                mainGrip === '1h'
                  ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                  : isBowMain || !slot2Id
                    ? 'bg-[#0f172a] text-[#475569] border-[#1e293b] cursor-not-allowed'
                    : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#38bdf8] cursor-pointer'
              }`}
            >
              1H GRIP
            </button>
            <button
              onClick={() => {
                soundSystem.playSelect();
                setMainWeaponGrip(state, '2h', {
                  say: (txt) => {
                    state.toastText = txt;
                    state.toastTimer = 2.5;
                  },
                });
                syncStateGates(state);
                notifyOrionStateChange();
              }}
              className={`px-1.5 py-0.2 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                mainGrip === '2h'
                  ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                  : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#ffd27d]'
              }`}
            >
              2H POWER STANCE {!slot2Id ? '(AUTO: NO SIDE)' : isBowMain ? '(BOW 2H)' : ''}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {(
            [
              {
                slotIdx: 0,
                slotKey: 'slot1' as const,
                label: 'MAIN HAND (RIGHT)',
                sub: mainGrip === '2h' ? '2H Power Stance → ac1–ac5' : 'Right Hand 1H → ac1–ac3',
                wId: slot1Id,
              },
              {
                slotIdx: 1,
                slotKey: 'slot2' as const,
                label: 'SIDE HAND (LEFT)',
                sub: !slot2Id
                  ? 'None Equipped → Main Hand Auto-2H'
                  : 'Left Hand Off-Hand / Aux / Consumable',
                wId: slot2Id || '',
              },
              {
                slotIdx: 2,
                slotKey: 'slot3' as const,
                label: 'AUXILIARY (BACK)',
                sub: 'Back Mount · Swaps with Side Hand via [L]',
                wId: slot3Id || '',
              },
            ] as const
          ).map((sInfo) => {
            const wId = sInfo.wId;
            const wDef = wId ? getWeaponDefinition(wId) : undefined;
            const baseWDef = wDef
              ? getWeaponDefinition(parseEquipmentInstanceId(wId).baseId) || wDef
              : undefined;
            const itemDef = wId && !wDef ? getItemDefinition(wId) : undefined;
            const isEditingThis = isEditingLoadout && editingSlot === sInfo.slotKey;
            const gemVis = wDef ? getWeaponGemVisuals(state, wId) : null;
            const stripBase64 = wDef?.variantStripBase64 || wDef?.hardpointSprite?.base64;
            const subtypeInfo = wDef ? getWeaponSubtypeInfo(wId) : null;
            const ownedCopies = wDef ? getOwnedWeaponCount(state, wId) : 0;

            return (
              <div
                key={sInfo.slotKey}
                className={`p-1.5 rounded-xs border transition-colors space-y-1 ${
                  isEditingThis
                    ? 'bg-[#172554]/80 border-[#facc15]'
                    : 'bg-[#0f172a] border-[#1e293b]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[8px] font-bold text-[#ffd27d]">{sInfo.label}</span>
                  <div className="flex items-center gap-1">
                    {sInfo.slotIdx >= 1 && wId && (
                      <button
                        onClick={() => {
                          soundSystem.playMenuBeep();
                          if (state.equipmentSlots) {
                            state.equipmentSlots[sInfo.slotKey] = null;
                            if (!state.equipmentSlots.slot2) {
                              state.equipmentSlots.mainGrip = '2h';
                            }
                          }
                          state.equippedWeapons = [
                            state.equipmentSlots?.slot1,
                            state.equipmentSlots?.slot2,
                            state.equipmentSlots?.slot3,
                          ].filter(Boolean) as string[];
                          syncStateGates(state);
                          notifyOrionStateChange();
                        }}
                        className="px-1 py-0.2 rounded-xs text-[7px] font-bold bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] border border-[#475569] cursor-pointer"
                      >
                        UNEQUIP
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (isEditingThis) {
                          setIsEditingLoadout(false);
                        } else {
                          openSlotEditor(sInfo.slotKey);
                        }
                      }}
                      className={`px-1.5 py-0.2 rounded-xs text-[7px] font-bold border cursor-pointer ${
                        isEditingThis
                          ? 'bg-[#facc15] text-[#05070a] border-[#fde047]'
                          : 'bg-[#1e293b] hover:bg-[#334155] text-[#7dd3fc] border-[#38bdf8]/60'
                      }`}
                    >
                      {isEditingThis ? 'EDITING' : 'EDIT'}
                    </button>
                  </div>
                </div>

                <div className="bg-[#090d14] px-1.5 py-1 rounded-xs border border-[#1e293b]">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {stripBase64 && gemVis && (
                        <SpriteCanvasIcon
                          base64={stripBase64}
                          col={gemVis.colIndex}
                          sizeClass="w-5 h-5"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-[9px] font-bold text-[#ffd27d] truncate">
                          {wDef
                            ? `${wDef.name}${sInfo.slotIdx === 0 && mainGrip === '2h' ? ' (2h)' : ''}`
                            : itemDef?.name || 'None (Empty)'}
                        </div>
                        <div className="text-[7px] text-[#94a3b8] truncate">
                          {wDef && subtypeInfo
                            ? `${subtypeInfo.subtype} · ×${ownedCopies} · [${getWeaponComponentSlots(wId).join(' / ').toUpperCase()}]`
                            : itemDef
                              ? `Consumable · 0 WT · Skill 5 when in Side · ${itemDef.description}`
                              : sInfo.sub}
                        </div>
                      </div>
                    </div>
                  </div>
                  {wDef && <WeaponStatReadout w={wDef} instanceId={wId} state={state} compact />}
                  {wDef && baseWDef && (
                    <EquipmentGemModInstaller
                      state={state}
                      instanceId={wId}
                      baseName={baseWDef.name}
                      isCheatMode={isCheatMode}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Static Equipment Slots & Sub-Mods (Head, Arms, Frame Assemblies) + Triggers */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-[9px] font-bold text-[#ffd27d]">
            STATIC EQUIPMENT ASSEMBLIES (HEAD · ARMS · FRAME — ARMOR + 3 SUB-MODS EACH)
          </span>
          <button
            onClick={() => openSlotEditor('bind_l')}
            className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] border border-[#38bdf8]/60 rounded-xs text-[7.5px] font-bold text-[#7dd3fc] cursor-pointer"
          >
            TRIGGERS [L: {boundLDesc.shortLabel} · R: {boundRDesc.shortLabel}]
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[8px]">
          {(() => {
            const formatHwDomainSummary = (
              hw: CanonicalHardwareItemDefinition | undefined,
              fallbackRole: string
            ): string => {
              if (!hw) return fallbackRole;
              const wt = getHardwareBaseWeight(hw);
              const parts: string[] = [`${wt} WT`];
              const isExteriorPlating =
                hw.slot === 'plating' || hw.slot === 'head' || hw.slot === 'arms';
              if (isExteriorPlating && hw.armorDurability) {
                parts.push(`+${hw.armorDurability} DUR`);
              }
              if (isExteriorPlating && hw.armorRating) {
                parts.push(`${hw.armorRating} RTG`);
              }
              if (isExteriorPlating && hw.armorThreshold) {
                parts.push(`${hw.armorThreshold} THR`);
              }
              const cap = getHardwareCapacityBonus(hw);
              if (cap !== 0) {
                parts.push(`${cap > 0 ? `+${cap}` : cap} CAP`);
              }
              if (hw.shieldBonus) {
                parts.push(`${hw.shieldBonus > 0 ? `+${hw.shieldBonus}` : hw.shieldBonus} SHD`);
              }
              if (hw.lightBonus) {
                parts.push(`${hw.lightBonus > 0 ? `+${hw.lightBonus}` : hw.lightBonus} LGT`);
              }
              if (hw.attackMassBonus) {
                parts.push(`+${hw.attackMassBonus} MASS`);
              }
              if (hw.tellDurationMult && hw.tellDurationMult !== 1) {
                const pct = Math.round((hw.tellDurationMult - 1) * 100);
                parts.push(`${pct > 0 ? `+${pct}` : pct}% WINDUP`);
              }
              if (hw.stabilityBonus) {
                parts.push(`${hw.stabilityBonus > 0 ? `+${hw.stabilityBonus}` : hw.stabilityBonus} STB`);
              }
              if (hw.moveSpeedMult && hw.moveSpeedMult !== 1) {
                const pct = Math.round((hw.moveSpeedMult - 1) * 100);
                parts.push(`${pct > 0 ? `+${pct}` : pct}% SPD`);
              }
              if (hw.heatVentMult && hw.heatVentMult !== 1) {
                const pct = Math.round((hw.heatVentMult - 1) * 100);
                parts.push(`${pct > 0 ? `+${pct}` : pct}% VENT`);
              }
              if (hw.accuracyMult && hw.accuracyMult !== 1) {
                const pct = Math.round((hw.accuracyMult - 1) * 100);
                parts.push(`${pct > 0 ? `+${pct}` : pct}% ACC`);
              }
              if (hw.staggerDamageMult && hw.staggerDamageMult !== 1) {
                const pct = Math.round((hw.staggerDamageMult - 1) * 100);
                parts.push(`${pct > 0 ? `+${pct}` : pct}% STG`);
              }
              if (hw.cooldownMult && hw.cooldownMult !== 1) {
                const pct = Math.round((hw.cooldownMult - 1) * 100);
                parts.push(`${pct > 0 ? `+${pct}` : pct}% CD`);
              }
              return parts.length > 1 ? parts.join(' · ') : `${wt} WT · ${fallbackRole}`;
            };

            return (
              [
                {
                  assemblyTitle: '> HEAD ASSEMBLY',
                  accent: 'text-[#38bdf8]',
                  rows: [
                    {
                      slot: 'head' as EditableLoadoutSlot,
                      roleLabel: 'ARMOR = DOME PLATE',
                      val: getEquipmentDisplayName(currentHeadName),
                      sub: formatHwDomainSummary(
                        findHardwareItemByNameOrId(currentHeadName),
                        'Exterior Dome Armor'
                      ),
                    },
                    {
                      slot: 'optics' as EditableLoadoutSlot,
                      roleLabel: 'MOD 1 = OPTICS',
                      val: getEquipmentDisplayName(currentOpticsName),
                      sub: formatHwDomainSummary(
                        findHardwareItemByNameOrId(currentOpticsName),
                        'Target & Light Optics'
                      ),
                    },
                    {
                      slot: 'sensoryA' as EditableLoadoutSlot,
                      roleLabel: 'MOD 2 = SENSORY A',
                      val: getEquipmentDisplayName(currentSensoryAName),
                      sub: formatHwDomainSummary(
                        findHardwareItemByNameOrId(currentSensoryAName),
                        'Field Transceiver'
                      ),
                    },
                    {
                      slot: 'sensoryB' as EditableLoadoutSlot,
                      roleLabel: 'MOD 3 = SENSORY B',
                      val: getEquipmentDisplayName(currentSensoryBName),
                      sub: formatHwDomainSummary(
                        findHardwareItemByNameOrId(currentSensoryBName),
                        'Threat & Gyro Telemetry'
                      ),
                    },
                  ],
                },
                {
                  assemblyTitle: '> ARMS ASSEMBLY',
                  accent: 'text-[#ffd27d]',
                  rows: [
                    {
                      slot: 'arms' as EditableLoadoutSlot,
                      roleLabel: 'ARMOR = APERTURE PLATE',
                      val: getEquipmentDisplayName(currentArmsName),
                      sub: formatHwDomainSummary(
                        findHardwareItemByNameOrId(currentArmsName),
                        'Exterior Arm Plating'
                      ),
                    },
                    {
                      slot: 'actuators' as EditableLoadoutSlot,
                      roleLabel: 'MOD 1 = ACTUATORS',
                      val: getEquipmentDisplayName(currentActuatorsName),
                      sub: formatHwDomainSummary(
                        findHardwareItemByNameOrId(currentActuatorsName),
                        'Internal Servo Actuators'
                      ),
                    },
                    {
                      slot: 'mod_melee' as EditableLoadoutSlot,
                      roleLabel: 'MOD 2 = STRUCTURE (MELEE)',
                      val: installedMeleeMod?.name || 'None Installed',
                      sub: installedMeleeMod
                        ? `${installedMeleeMod.weightDelta ?? 0} WT · ${installedMeleeMod.origin?.toUpperCase() || 'CRAFTED'}`
                        : 'Replaces Melee Mod · 0 WT',
                    },
                    {
                      slot: 'mod_ranged' as EditableLoadoutSlot,
                      roleLabel: 'MOD 3 = INTEGRATION (RANGED)',
                      val: installedRangedMod?.name || 'None Installed',
                      sub: installedRangedMod
                        ? `${installedRangedMod.weightDelta ?? 0} WT · ${installedRangedMod.origin?.toUpperCase() || 'CRAFTED'}`
                        : 'Replaces Ranged Mod · 0 WT',
                    },
                  ],
                },
                {
                  assemblyTitle: '> FRAME ASSEMBLY',
                  accent: 'text-[#8dd7ad]',
                  rows: [
                    {
                      slot: 'plating' as EditableLoadoutSlot,
                      roleLabel: 'ARMOR = FRAME PLATING',
                      val: getEquipmentDisplayName(currentPlatingName),
                      sub: formatHwDomainSummary(
                        findHardwareItemByNameOrId(currentPlatingName),
                        'Exterior Frame Plating'
                      ),
                    },
                    {
                      slot: 'reactor' as EditableLoadoutSlot,
                      roleLabel: 'MOD 1 = REACTOR CORE',
                      val: getEquipmentDisplayName(currentReactorName),
                      sub: formatHwDomainSummary(
                        findHardwareItemByNameOrId(currentReactorName),
                        'Reactor Output & Venting'
                      ),
                    },
                    {
                      slot: 'legs' as EditableLoadoutSlot,
                      roleLabel: 'MOD 2 = LEG ACTUATORS',
                      val: getEquipmentDisplayName(currentLegsName),
                      sub: formatHwDomainSummary(
                        findHardwareItemByNameOrId(currentLegsName),
                        'Locomotion & Load Servos'
                      ),
                    },
                    {
                      slot: 'mod_mobility' as EditableLoadoutSlot,
                      roleLabel: 'MOD 3 = MOBILITY KIT',
                      val: installedMobilityMod?.name || 'None Installed',
                      sub: installedMobilityMod
                        ? `${installedMobilityMod.weightDelta ?? 0} WT · ${
                            (installedMobilityMod.capacityDelta ?? 0) >= 0
                              ? `+${installedMobilityMod.capacityDelta ?? 0}`
                              : installedMobilityMod.capacityDelta
                          } CAP`
                        : 'Replaces Mobility Mod · +0 CAP',
                    },
                  ],
                },
              ] as const
            );
          })().map((group) => (
            <div
              key={group.assemblyTitle}
              className="p-1.5 bg-[#0b111e] rounded-xs border border-[#1e293b] space-y-1"
            >
              <div className={`font-black text-[8.5px] ${group.accent} border-b border-[#1e293b] pb-0.5`}>
                {group.assemblyTitle}
              </div>
              {group.rows.map((card) => {
                const activeEdit = isEditingLoadout && editingSlot === card.slot;
                return (
                  <div
                    key={card.slot}
                    className={`p-1 rounded-xs border flex flex-col justify-between gap-0.5 ${
                      activeEdit
                        ? 'bg-[#172554]/80 border-[#facc15]'
                        : 'bg-[#090d14] border-[#1e293b]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[7px] text-[#94a3b8] truncate">
                        {card.roleLabel}
                      </span>
                      <button
                        onClick={() => {
                          if (activeEdit) setIsEditingLoadout(false);
                          else openSlotEditor(card.slot);
                        }}
                        className={`px-1 py-0.2 rounded-xs text-[6.5px] font-bold border cursor-pointer shrink-0 ${
                          activeEdit
                            ? 'bg-[#facc15] text-[#05070a] border-[#fde047]'
                            : 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] border-[#475569]'
                        }`}
                      >
                        {activeEdit ? 'EDITING' : 'EDIT'}
                      </button>
                    </div>
                    <div className="font-bold text-[#ffd27d] truncate text-[8px]">{card.val}</div>
                    <div className="text-[6.5px] text-[#64748b] truncate">{card.sub}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 4. ON-DEMAND LOADOUT EDITOR PANEL */}
      {isEditingLoadout && (
        <div className="p-2 bg-[#0b111e] rounded-xs border border-[#facc15] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#1e293b] pb-1">
            <div className="text-[9.5px] font-bold text-[#facc15]">
              LOADOUT EDITOR — SELECT SLOT, EQUIP ITEM OR INSTALL GEM MOD:
            </div>
            <button
              onClick={() => {
                soundSystem.playMenuBeep();
                setIsEditingLoadout(false);
              }}
              className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#facc15] border border-[#facc15]/60 rounded-xs text-[8px] font-bold cursor-pointer"
            >
              ✕ CLOSE EDITOR
            </button>
          </div>

          {/* Slot Selector Strip */}
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                { id: 'slot1', label: 'Main Hand' },
                { id: 'slot2', label: 'Side Hand' },
                { id: 'slot3', label: 'Auxiliary' },
                { id: 'head', label: 'Head: Dome Plate' },
                { id: 'optics', label: 'Head Mod 1: Optics' },
                { id: 'sensoryA', label: 'Head Mod 2: Sensory A' },
                { id: 'sensoryB', label: 'Head Mod 3: Sensory B' },
                { id: 'arms', label: 'Arms: Aperture Plate' },
                { id: 'actuators', label: 'Arms Mod 1: Actuators' },
                { id: 'mod_melee', label: 'Arms Mod 2: Structure' },
                { id: 'mod_ranged', label: 'Arms Mod 3: Integration' },
                { id: 'plating', label: 'Frame: Frame Plating' },
                { id: 'reactor', label: 'Frame Mod 1: Reactor Core' },
                { id: 'legs', label: 'Frame Mod 2: Leg Actuators' },
                { id: 'mod_mobility', label: 'Frame Mod 3: Mobility Kit' },
                { id: 'bind_l', label: 'Bindings [L/R]' },
              ] as Array<{ id: EditableLoadoutSlot; label: string }>
            ).map((sTab) => (
              <button
                key={sTab.id}
                onClick={() => {
                  soundSystem.playSelect();
                  setEditingSlot(sTab.id);
                  setLoadoutSubtypeFilter('ALL');
                }}
                className={`px-1.5 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                  editingSlot === sTab.id
                    ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                    : 'bg-[#090d14] text-[#94a3b8] border-[#334155] hover:border-[#38bdf8]'
                }`}
              >
                {sTab.label}
              </button>
            ))}
          </div>

          {/* A. Editing Main Hand / Side Hand / Auxiliary */}
          {(editingSlot === 'slot1' || editingSlot === 'slot2' || editingSlot === 'slot3') &&
            (() => {
              const subtypeTabs =
                editingSlot === 'slot1'
                  ? [
                      'ALL',
                      'Ranged · Bolter / Ballista',
                      'Ranged · Gatling / Ordnance',
                      'Ranged · Beam / Pulse',
                      'Ranged · SMG / Marksman',
                      'Ranged · Boltcaster',
                      'Ranged · 2H Bow',
                      'Melee · Blade',
                      'Melee · Blunt / Cleave',
                      'Melee · Polearm / Lance',
                    ]
                  : [
                      'ALL',
                      'Ranged · Bolter / Ballista',
                      'Ranged · Gatling / Ordnance',
                      'Ranged · Beam / Pulse',
                      'Ranged · SMG / Marksman',
                      'Ranged · Boltcaster',
                      'Melee · Blade',
                      'Melee · Blunt / Cleave',
                      'Melee · Polearm / Lance',
                      'Auxiliary · Shield',
                      'Auxiliary · Quiver',
                      'Auxiliary · Catalyst',
                      'Consumable',
                    ];

              const activeSlotId =
                editingSlot === 'slot1' ? slot1Id : editingSlot === 'slot2' ? slot2Id : slot3Id;

              return (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[7.5px] text-[#94a3b8] font-bold">SUBTYPE FILTER:</span>
                    {subtypeTabs.map((st) => (
                      <button
                        key={st}
                        onClick={() => setLoadoutSubtypeFilter(st)}
                        className={`px-1.5 py-0.2 rounded-xs text-[7px] font-bold border cursor-pointer ${
                          loadoutSubtypeFilter === st
                            ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                            : 'bg-[#090d14] text-[#94a3b8] border-[#1e293b]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {Object.values(WEAPON_REGISTRY)
                      .filter((candidate) => {
                        const unlocked =
                          isCheatMode ||
                          isEquipmentUnlocked(state, candidate.id) ||
                          parseEquipmentInstanceId(activeSlotId).baseId === candidate.id;
                        if (!unlocked) return false;
                        if (editingSlot === 'slot1' && !isTrueWeaponEquipment(candidate)) {
                          return false;
                        }
                        if (editingSlot === 'slot2' && isTwoHandOnlyWeapon(candidate)) {
                          return false;
                        }
                        const stInfo = getWeaponSubtypeInfo(candidate.id);
                        if (
                          loadoutSubtypeFilter !== 'ALL' &&
                          stInfo.subtype !== loadoutSubtypeFilter
                        ) {
                          return false;
                        }
                        return true;
                      })
                      .flatMap((baseCandidate) => {
                        const instances = getOwnedEquipmentInstances(state, baseCandidate.id);
                        const instanceIds =
                          instances.length > 0 ? instances : [baseCandidate.id];
                        return instanceIds.map((instanceId) => ({
                          baseCandidate,
                          instanceId,
                        }));
                      })
                      .map(({ baseCandidate, instanceId }) => {
                        const candidate =
                          getWeaponDefinition(instanceId) || baseCandidate;
                        const candGemVis = getWeaponGemVisuals(state, instanceId);
                        const candStrip =
                          candidate.variantStripBase64 || candidate.hardpointSprite?.base64;
                        const stInfo = getWeaponSubtypeInfo(baseCandidate.id);
                        const copies = getOwnedWeaponCount(state, instanceId);
                        const isEquippedHere = activeSlotId === instanceId;

                        return (
                          <div
                            key={instanceId}
                            className={`p-1.5 rounded-xs border flex flex-col justify-between gap-1 ${
                              isEquippedHere
                                ? 'bg-[#172554]/80 border-[#ffd27d]'
                                : 'bg-[#090d14] border-[#1e293b]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <SpriteCanvasIcon
                                  base64={candStrip}
                                  col={candGemVis.colIndex}
                                  sizeClass="w-4 h-4"
                                />
                                <div className="min-w-0">
                                  <div className="text-[8.5px] font-bold text-[#e2e8f0] truncate flex items-center gap-1">
                                    <span>
                                      {candidate.name} (×{copies})
                                    </span>
                                    {candidate.isPlaceholderAsset && (
                                      <span
                                        className="text-[6px] px-1 py-0.2 bg-[#334155]/60 text-[#fbbf24] border border-[#fbbf24]/40 rounded-[2px] shrink-0"
                                        title={
                                          candidate.futureAssetPlanned ||
                                          'Placeholder visual asset: dedicated sprite planned'
                                        }
                                      >
                                        PLCH
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[7px] text-[#94a3b8] truncate">
                                    {stInfo.subtype} · [{getWeaponComponentSlots(instanceId).join(' / ').toUpperCase()}]
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    if (!state.equipmentSlots) return;
                                    soundSystem.playSelect();
                                    if (editingSlot === 'slot1') {
                                      state.equipmentSlots.slot1 = instanceId;
                                      if (isTwoHandOnlyWeapon(candidate)) {
                                        if (
                                          state.equipmentSlots.slot2 &&
                                          !state.equipmentSlots.slot3
                                        ) {
                                          state.equipmentSlots.slot3 = state.equipmentSlots.slot2;
                                        }
                                        state.equipmentSlots.slot2 = null;
                                        state.equipmentSlots.mainGrip = '2h';
                                      } else if (!state.equipmentSlots.slot2) {
                                        state.equipmentSlots.mainGrip = '2h';
                                      }
                                      state.maxAmmo = candidate.shotsPerChain;
                                      state.ammo = candidate.shotsPerChain;
                                      state.reloadDuration = candidate.reloadDurationSec;
                                    } else if (editingSlot === 'slot2') {
                                      if (
                                        instanceId === slot1Id &&
                                        isTrueWeaponEquipment(candidate) &&
                                        copies < 2
                                      ) {
                                        setMainWeaponGrip(state, '2h', {
                                          say: (txt) => {
                                            state.toastText = `${txt} (ACQUIRE 2ND COPY FOR 1H PAIRED STANCE)`;
                                            state.toastTimer = 2.8;
                                          },
                                        });
                                      } else {
                                        state.equipmentSlots.slot2 = instanceId;
                                        if (!isTwoHandOnlyWeapon(slot1Id)) {
                                          state.equipmentSlots.mainGrip = '1h';
                                        }
                                      }
                                    } else {
                                      state.equipmentSlots.slot3 = instanceId;
                                    }
                                    state.equippedWeapons = [
                                      state.equipmentSlots.slot1,
                                      state.equipmentSlots.slot2,
                                      state.equipmentSlots.slot3,
                                    ].filter(Boolean) as string[];
                                    syncStateGates(state);
                                    notifyOrionStateChange();
                                  }}
                                  className={`px-2 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                                    isEquippedHere
                                      ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                                      : 'bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] border-[#475569]'
                                  }`}
                                >
                                  {isEquippedHere ? 'EQUIPPED' : 'EQUIP'}
                                </button>
                              </div>
                            </div>
                            <WeaponStatReadout w={candidate} instanceId={instanceId} state={state} />
                            <EquipmentGemModInstaller
                              state={state}
                              instanceId={instanceId}
                              baseName={baseCandidate.name}
                              isCheatMode={isCheatMode}
                            />
                          </div>
                        );
                      })}

                    {/* Consumable options when editing Side Hand or Auxiliary */}
                    {editingSlot !== 'slot1' &&
                      (loadoutSubtypeFilter === 'ALL' || loadoutSubtypeFilter === 'Consumable') &&
                      consolidateInventorySlots(state.inventorySlots)
                        .filter((s) => Boolean(getItemDefinition(s.itemId)?.onUse))
                        .map((invSlot) => {
                          const itmDef = getItemDefinition(invSlot.itemId);
                          if (!itmDef) return null;
                          const isEquippedHere = activeSlotId === invSlot.itemId;
                          return (
                            <div
                              key={invSlot.itemId}
                              className={`p-1.5 rounded-xs border flex items-center justify-between gap-1.5 ${
                                isEquippedHere
                                  ? 'bg-[#052e16]/80 border-[#4ade80]'
                                  : 'bg-[#090d14] border-[#1e293b]'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-[8.5px] font-bold text-[#86efac] truncate">
                                  {itmDef.name} (×{invSlot.count}) · 0 WT
                                </div>
                                <div className="text-[7px] text-[#cbd5e1]">
                                  {itmDef.description}
                                </div>
                                <div className="text-[6.5px] text-[#94a3b8]">
                                  Consumable · Occupies Skill 5 when in Side Hand · Buy {itmDef.buyPrice || 0}g / Sell {itmDef.sellPrice || 0}g
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (!state.equipmentSlots) return;
                                  soundSystem.playSelect();
                                  state.equipmentSlots[editingSlot] = invSlot.itemId;
                                  if (editingSlot === 'slot2' && !isTwoHandOnlyWeapon(slot1Id)) {
                                    state.equipmentSlots.mainGrip = '1h';
                                  }
                                  state.equippedWeapons = [
                                    state.equipmentSlots.slot1,
                                    state.equipmentSlots.slot2,
                                    state.equipmentSlots.slot3,
                                  ].filter(Boolean) as string[];
                                  syncStateGates(state);
                                  notifyOrionStateChange();
                                }}
                                className={`px-2 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer shrink-0 ${
                                  isEquippedHere
                                    ? 'bg-[#4ade80] text-[#05070a] border-[#86efac]'
                                    : 'bg-[#1e293b] hover:bg-[#334155] text-[#86efac] border-[#4ade80]/60'
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
            })()}

          {/* B. Editing Static Equipment Armor & Sub-Module Hardware (Dome Plate, Optics, Sensory A/B, Aperture Plate, Actuators, Frame Plating, Reactor Core, Leg Actuators) */}
          {(editingSlot === 'head' ||
            editingSlot === 'optics' ||
            editingSlot === 'sensoryA' ||
            editingSlot === 'sensoryB' ||
            editingSlot === 'arms' ||
            editingSlot === 'actuators' ||
            editingSlot === 'legs' ||
            editingSlot === 'plating' ||
            editingSlot === 'reactor') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {CHASSIS_HARDWARE_CATALOG.filter((h) => {
                if (h.slot !== editingSlot) return false;
                const curVal =
                  editingSlot === 'head'
                    ? currentHeadName
                    : editingSlot === 'optics'
                      ? currentOpticsName
                      : editingSlot === 'sensoryA'
                        ? currentSensoryAName
                        : editingSlot === 'sensoryB'
                          ? currentSensoryBName
                          : editingSlot === 'arms'
                            ? currentArmsName
                            : editingSlot === 'actuators'
                              ? currentActuatorsName
                              : editingSlot === 'legs'
                                ? currentLegsName
                                : editingSlot === 'plating'
                                  ? currentPlatingName
                                  : currentReactorName;
                const curHw = findHardwareItemByNameOrId(curVal);
                const isEquippedBase =
                  curHw && parseEquipmentInstanceId(curHw.id).baseId === h.id;
                return (
                  isCheatMode ||
                  h.origin === 'crafted' ||
                  isEquipmentUnlocked(state, h.id) ||
                  Boolean(isEquippedBase)
                );
              })
                .flatMap((baseHw) => {
                  const instances = getOwnedEquipmentInstances(state, baseHw.id);
                  const instanceIds = instances.length > 0 ? instances : [baseHw.id];
                  return instanceIds.map((instanceId) => ({ baseHw, instanceId }));
                })
                .map(({ baseHw, instanceId }) => {
                  const hw = findHardwareItemByNameOrId(instanceId) || baseHw;
                  const { installedGems } = parseEquipmentInstanceId(instanceId);
                  const count = getOwnedWeaponCount(state, instanceId);
                  const isUnlocked =
                    isCheatMode ||
                    isEquipmentUnlocked(state, baseHw.id) ||
                    count > 0;
                  const curVal =
                    editingSlot === 'head'
                      ? currentHeadName
                      : editingSlot === 'optics'
                        ? currentOpticsName
                        : editingSlot === 'sensoryA'
                          ? currentSensoryAName
                          : editingSlot === 'sensoryB'
                            ? currentSensoryBName
                            : editingSlot === 'arms'
                              ? currentArmsName
                              : editingSlot === 'actuators'
                                ? currentActuatorsName
                                : editingSlot === 'legs'
                                  ? currentLegsName
                                  : editingSlot === 'plating'
                                    ? currentPlatingName
                                    : currentReactorName;
                  const curResolved = findHardwareItemByNameOrId(curVal);
                  const isEquipped =
                    curVal === instanceId ||
                    curVal === hw.name ||
                    curResolved?.id === hw.id ||
                    (installedGems.length === 0 &&
                      Boolean(baseHw.legacyNames?.includes(curVal)));

                  const maxGemSlots = getEquipmentMaxModSlots(instanceId);
                  const craftCost = baseHw.gemCost || [];
                  const craftCostLabel = craftCost
                    .map(
                      (c) =>
                        `${c.count} ${GEMSTONE_REGISTRY[c.gemId]?.name || c.gemId} (${getInventoryGemCount(state, c.gemId)})`
                    )
                    .join(' + ');
                  const canCraft =
                    isCheatMode ||
                    craftCost.every((c) => getInventoryGemCount(state, c.gemId) >= c.count);

                  return (
                    <div
                      key={instanceId}
                      className={`p-1.5 rounded-xs border flex flex-col justify-between gap-1 ${
                        isEquipped
                          ? 'bg-[#172554]/80 border-[#38bdf8]'
                          : 'bg-[#090d14] border-[#1e293b]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-[8.5px] text-[#ffd27d] flex items-center justify-between gap-1">
                          <span>
                            {hw.name} {isUnlocked ? `(×${Math.max(1, count)})` : '[CRAFTABLE]'}
                          </span>
                          <span className="text-[6.5px] px-1 py-0.2 rounded-[2px] bg-[#1e293b] text-[#7dd3fc]">
                            {hw.slot.toUpperCase()} · {hw.subtype}
                          </span>
                        </div>
                        <HardwareStatReadout hw={hw} maxGemSlots={maxGemSlots} />
                      </div>
                      {isUnlocked ? (
                        <button
                          onClick={() => {
                            if (!state.equipmentSlots) return;
                            soundSystem.playSelect();
                            const storeValue =
                              installedGems.length > 0 ? instanceId : baseHw.name;
                            if (editingSlot === 'reactor') {
                              state.equipmentSlots.reactorCore = storeValue;
                            } else if (editingSlot === 'optics') {
                              state.equipmentSlots.headOptics = storeValue;
                            } else if (editingSlot === 'actuators') {
                              state.equipmentSlots.armActuators = storeValue;
                            } else {
                              state.equipmentSlots[editingSlot] = storeValue;
                            }
                            if (editingSlot === 'plating' && hw.armorType) {
                              state.armor.type = hw.armorType;
                            }
                            syncStateGates(state);
                            notifyOrionStateChange();
                          }}
                          className={`w-full py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                            isEquipped
                              ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                              : 'bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] border-[#475569]'
                          }`}
                        >
                          {isEquipped ? 'EQUIPPED' : 'EQUIP HARDWARE'}
                        </button>
                      ) : (
                        <button
                          disabled={!canCraft}
                          onClick={() => {
                            if (!state.equipmentSlots) return;
                            if (!isCheatMode) {
                              for (const req of craftCost) {
                                consumeInventoryGem(state, req.gemId, req.count);
                              }
                            }
                            state.equipmentSlots.unlockedEquipment =
                              state.equipmentSlots.unlockedEquipment || [];
                            state.equipmentSlots.unlockedEquipment.push(baseHw.id);
                            if (editingSlot === 'reactor') {
                              state.equipmentSlots.reactorCore = baseHw.name;
                            } else if (editingSlot === 'optics') {
                              state.equipmentSlots.headOptics = baseHw.name;
                            } else if (editingSlot === 'actuators') {
                              state.equipmentSlots.armActuators = baseHw.name;
                            } else {
                              state.equipmentSlots[editingSlot] = baseHw.name;
                            }
                            soundSystem.playPowerup();
                            syncStateGates(state);
                            notifyOrionStateChange();
                          }}
                          className={`w-full py-0.5 rounded-xs text-[7.5px] font-bold border ${
                            canCraft
                              ? 'bg-[#4c1d95] hover:bg-[#5b21b6] text-white border-[#a855f7] cursor-pointer'
                              : 'bg-[#090d14] text-[#64748b] border-[#1e293b] cursor-not-allowed'
                          }`}
                        >
                          ◆ CRAFT &amp; EQUIP ({craftCostLabel || '1 Gem'})
                        </button>
                      )}
                      {isUnlocked && (
                        <EquipmentGemModInstaller
                          state={state}
                          instanceId={instanceId}
                          baseName={baseHw.name}
                          isCheatMode={isCheatMode}
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* C. Editing Sub-Mods: Structure (Arms Mod 2), Integration (Arms Mod 3), Mobility Kit (Frame Mod 3) */}
          {(editingSlot === 'mod_ranged' ||
            editingSlot === 'mod_melee' ||
            editingSlot === 'mod_mobility') &&
            (() => {
              const targetCat =
                editingSlot === 'mod_ranged'
                  ? 'ranged'
                  : editingSlot === 'mod_melee'
                    ? 'melee'
                    : 'mobility';
              const slotRoleLabel =
                targetCat === 'melee'
                  ? 'ARMS MOD 2 · STRUCTURE'
                  : targetCat === 'ranged'
                    ? 'ARMS MOD 3 · INTEGRATION'
                    : 'FRAME MOD 3 · MOBILITY KIT';
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {ACTION_MODIFICATION_CATALOG.filter(
                    (m) =>
                      m.targetCategory === targetCat ||
                      (targetCat === 'ranged' && m.targetCategory === 'all')
                  ).map((mod) => {
                    const unlockedMods = state.equipmentSlots?.unlockedMods || [];
                    const isGenerated =
                      unlockedMods.includes(mod.id) ||
                      Boolean(state.bypassProgressionGates) ||
                      isCheatMode;
                    const isInstalled =
                      state.equipmentSlots?.installedMods?.[targetCat] === mod.id;
                    const costText =
                      mod.gemCost.length > 0
                        ? mod.gemCost
                            .map((c) => {
                              const g = GEMSTONE_REGISTRY[c.gemId];
                              const have = getInventoryGemCount(state, c.gemId);
                              return `${c.count} ${g?.name || c.gemId} (${have})`;
                            })
                            .join(' + ')
                        : 'Looted Standalone Module';

                    return (
                      <div
                        key={mod.id}
                        className={`p-1.5 rounded-xs border flex flex-col justify-between gap-1 ${
                          isInstalled
                            ? 'bg-[#2e1065]/70 border-[#c084fc]'
                            : 'bg-[#090d14] border-[#1e293b]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-[8.5px] text-[#e2e8f0] flex items-center justify-between gap-1">
                            <span>{mod.name}</span>
                            <span className="text-[6.5px] px-1 py-0.2 rounded-[2px] bg-[#1e293b] text-[#c084fc]">
                              {(mod.origin || 'crafted').toUpperCase()} · {mod.maxGemSlots ?? 1}G ·{' '}
                              {(mod.weightDelta ?? 0) >= 0
                                ? `+${mod.weightDelta ?? 0}`
                                : mod.weightDelta}{' '}
                              WT
                              {mod.capacityDelta
                                ? ` · ${mod.capacityDelta > 0 ? `+${mod.capacityDelta}` : mod.capacityDelta} CAP`
                                : ''}
                            </span>
                          </div>
                          <div className="text-[6.5px] text-[#38bdf8]">{slotRoleLabel}</div>
                          <div className="text-[7.5px] text-[#86efac]">+ {mod.gainDescription}</div>
                          <div className="text-[7.5px] text-[#f87171]">
                            − {mod.drawbackDescription}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#1e293b]">
                          <span className="text-[7px] text-[#94a3b8]">
                            {isGenerated ? 'Retained in Inventory' : `Cost: ${costText}`}
                          </span>
                          {isGenerated ? (
                            <button
                              onClick={() => {
                                soundSystem.playSelect();
                                if (!state.equipmentSlots) return;
                                state.equipmentSlots.installedMods =
                                  state.equipmentSlots.installedMods || {};
                                if (isInstalled) {
                                  delete state.equipmentSlots.installedMods[targetCat];
                                } else {
                                  state.equipmentSlots.installedMods[targetCat] = mod.id;
                                }
                                syncStateGates(state);
                                notifyOrionStateChange();
                              }}
                              className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#c084fc] rounded-xs text-[7.5px] font-bold text-[#e9d5ff] cursor-pointer"
                            >
                              {isInstalled ? 'UNINSTALL' : 'INSTALL MOD'}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const ok = generateEquipmentModWithGems(state, mod.id, {
                                  say: (txt) => {
                                    state.toastText = txt;
                                    state.toastTimer = 2.6;
                                  },
                                });
                                if (ok) {
                                  soundSystem.playPowerup();
                                  if (state.equipmentSlots) {
                                    state.equipmentSlots.installedMods =
                                      state.equipmentSlots.installedMods || {};
                                    state.equipmentSlots.installedMods[targetCat] = mod.id;
                                  }
                                  syncStateGates(state);
                                } else {
                                  soundSystem.playMenuBeep();
                                }
                                notifyOrionStateChange();
                              }}
                              className="px-2 py-0.5 bg-[#4c1d95] hover:bg-[#5b21b6] border border-[#a855f7] rounded-xs text-[7.5px] font-bold text-white cursor-pointer"
                            >
                              ◆ CRAFT &amp; INSTALL
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          {/* D. Editing Multi-Source Trigger Action Bindings ([L] / [R]) */}
          {(editingSlot === 'bind_l' || editingSlot === 'bind_r') && (
            <div className="space-y-1 max-h-[210px] overflow-y-auto pr-1">
              {ASSIGNABLE_ACTION_CATALOG.map((catalogItem) => {
                const resolved = getResolvedActionDescriptor(state, catalogItem.id);
                const unlockInfo = isActionUnlocked(state, catalogItem.id);
                const isAssignedL =
                  (state.assignedActions?.L || 'weapon_skill_1') === catalogItem.id;
                const isAssignedR =
                  (state.assignedActions?.R || 'weapon_skill_2') === catalogItem.id;

                return (
                  <div
                    key={catalogItem.id}
                    className={`p-1.5 bg-[#090d14] rounded-xs border flex items-center justify-between gap-2 ${
                      unlockInfo.unlocked ? 'border-[#1e293b]' : 'border-[#334155]/40 opacity-60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                        {resolved.name}{' '}
                        <span className="text-[7px] text-[#38bdf8]">
                          [{resolved.sourceCategory.toUpperCase()}]
                        </span>
                      </div>
                      <div className="text-[7.5px] text-[#94a3b8] truncate">
                        {resolved.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          soundSystem.playSelect();
                          assignTriggerAction(state, 'L', catalogItem.id);
                        }}
                        className={`px-1.5 py-0.5 rounded-xs font-bold text-[7.5px] border cursor-pointer ${
                          isAssignedL
                            ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                            : 'bg-[#0f172a] text-[#94a3b8] border-[#334155]'
                        }`}
                      >
                        {isAssignedL ? 'BOUND [L]' : 'BIND L'}
                      </button>
                      <button
                        onClick={() => {
                          soundSystem.playSelect();
                          assignTriggerAction(state, 'R', catalogItem.id);
                        }}
                        className={`px-1.5 py-0.5 rounded-xs font-bold text-[7.5px] border cursor-pointer ${
                          isAssignedR
                            ? 'bg-[#c084fc] text-[#05070a] border-[#e879f9]'
                            : 'bg-[#0f172a] text-[#94a3b8] border-[#334155]'
                        }`}
                      >
                        {isAssignedR ? 'BOUND [R]' : 'BIND R'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface SatchelInventoryTabProps {
  state: OrionState;
  isCheatMode: boolean;
  invCategory: EquipmentInventoryCategory;
  setInvCategory: React.Dispatch<React.SetStateAction<EquipmentInventoryCategory>>;
  invSubtype: string;
  setInvSubtype: React.Dispatch<React.SetStateAction<string>>;
  openSlotEditor: (slot: EditableLoadoutSlot) => void;
  onOpenProgressionTab: () => void;
  handleUseItem: (itemId: string) => void;
}

export const SatchelInventoryTab: React.FC<SatchelInventoryTabProps> = ({
  state,
  isCheatMode,
  invCategory,
  setInvCategory,
  invSubtype,
  setInvSubtype,
  openSlotEditor,
  onOpenProgressionTab,
  handleUseItem,
}) => {
  const subtypeOptionsByCat: Record<EquipmentInventoryCategory, string[]> = {
    all: ['ALL'],
    weapon: [
      'ALL',
      'Ranged · Bolter / Ballista',
      'Ranged · Gatling / Ordnance',
      'Ranged · Beam / Pulse',
      'Ranged · SMG / Marksman',
      'Ranged · Boltcaster',
      'Ranged · 2H Bow',
      'Melee · Blade',
      'Melee · Blunt / Cleave',
      'Melee · Polearm / Lance',
    ],
    auxiliary: ['ALL', 'Auxiliary · Shield', 'Auxiliary · Quiver', 'Auxiliary · Catalyst'],
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
    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
      {/* Equipment Inventory Category & Subtype Filter Header */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-[10px] font-bold text-[#8dd7ad]">
            EQUIPMENT INVENTORY (WEAPONS · AUXILIARIES · HARDWARE · MODS · SATCHEL):
          </span>
          {isCheatMode && (
            <div className="flex items-center gap-1">
              <button
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
                  state.toastText = 'ADDED +1 OF ALL 9 GEMSTONE BELT FLASKS TO SATCHEL';
                  state.toastTimer = 2.5;
                  notifyOrionStateChange();
                }}
                className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#8dd7ad]/60 rounded-xs font-bold text-[7.5px] text-[#8dd7ad] cursor-pointer"
              >
                +1 ALL FLASKS
              </button>
              <button
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
                  state.toastText = 'ADDED RELICS & KEYS TO SATCHEL';
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
              { id: 'all', label: 'All Equipment' },
              { id: 'weapon', label: 'Weapons' },
              { id: 'auxiliary', label: 'Auxiliaries' },
              { id: 'hardware', label: 'Chassis Hardware' },
              { id: 'mod', label: 'Action Mods' },
              { id: 'consumable', label: 'Consumables & Satchel' },
            ] as Array<{ id: EquipmentInventoryCategory; label: string }>
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundSystem.playSelect();
                setInvCategory(cat.id);
                setInvSubtype('ALL');
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

        {/* Subtype Filter */}
        {activeSubtypes.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            <span className="text-[7.5px] text-[#94a3b8] font-bold">SUBTYPE:</span>
            {activeSubtypes.map((st) => (
              <button
                key={st}
                onClick={() => setInvSubtype(st)}
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
      </div>

      {/* 1. Owned Weapons & Auxiliaries Inventory */}
      {(invCategory === 'all' || invCategory === 'weapon' || invCategory === 'auxiliary') && (
        <div className="space-y-1">
          <div className="text-[8.5px] font-bold text-[#ffd27d]">
            OWNED WEAPONS & AUXILIARIES INVENTORY (INSTALL GEM MODS TO SYNTHESIZE RENAMED GEAR):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {Object.values(WEAPON_REGISTRY)
              .filter((w) => {
                const unlocked = isCheatMode || isEquipmentUnlocked(state, w.id);
                if (!unlocked) return false;
                const isAux = isAuxiliaryEquipment(w);
                if (invCategory === 'weapon' && isAux) return false;
                if (invCategory === 'auxiliary' && !isAux) return false;
                const stInfo = getWeaponSubtypeInfo(w.id);
                if (invSubtype !== 'ALL' && stInfo.subtype !== invSubtype) return false;
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
                      <button
                        onClick={() => openSlotEditor(isAuxiliaryEquipment(w) ? 'slot2' : 'slot1')}
                        className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[7.5px] font-bold cursor-pointer shrink-0"
                      >
                        EDIT IN LOADOUT
                      </button>
                    </div>
                    <WeaponStatReadout w={w} instanceId={instanceId} state={state} />
                    <EquipmentGemModInstaller
                      state={state}
                      instanceId={instanceId}
                      baseName={baseW.name}
                      isCheatMode={isCheatMode}
                    />
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
            CHASSIS HARDWARE & ACTION MODS INVENTORY:
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
                          <div className="font-bold text-[8.5px] text-[#e2e8f0] truncate flex items-center gap-1">
                            <span>
                              {hw.name} <span className="text-[#94a3b8]">×{count}</span>
                            </span>
                            {hw.isPlaceholderAsset && (
                              <span
                                className="text-[6px] px-1 py-0.2 bg-[#334155]/60 text-[#fbbf24] border border-[#fbbf24]/40 rounded-[2px] shrink-0"
                                title={
                                  hw.futureAssetPlanned ||
                                  'Placeholder visual asset: dedicated sprite planned'
                                }
                              >
                                PLCH
                              </span>
                            )}
                          </div>
                          <div className="text-[7px] text-[#94a3b8] truncate">
                            Hardware · {hw.slot.toUpperCase()} · {hw.subtype}
                          </div>
                        </div>
                        <button
                          onClick={() => openSlotEditor(editTargetSlot)}
                          className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[7.5px] font-bold cursor-pointer shrink-0"
                        >
                          EDIT IN LOADOUT
                        </button>
                      </div>
                      <HardwareStatReadout hw={hw} maxGemSlots={maxGemSlots} />
                      <EquipmentGemModInstaller
                        state={state}
                        instanceId={instanceId}
                        baseName={baseHw.name}
                        isCheatMode={isCheatMode}
                      />
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
                        {m.capacityDelta
                          ? ` · ${m.capacityDelta > 0 ? `+${m.capacityDelta}` : m.capacityDelta} CAP`
                          : ''}{' '}
                        · {(m.origin || 'crafted').toUpperCase()} ({m.maxGemSlots ?? 1}G MAX)
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        openSlotEditor(
                          m.targetCategory === 'melee'
                            ? 'mod_melee'
                            : m.targetCategory === 'mobility'
                              ? 'mod_mobility'
                              : 'mod_ranged'
                        )
                      }
                      className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#c084fc] border border-[#c084fc]/50 rounded-xs text-[7.5px] font-bold cursor-pointer shrink-0"
                    >
                      EDIT IN LOADOUT
                    </button>
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

      {/* 3. Consumables, Gemstones & Relics Satchel */}
      {(invCategory === 'all' || invCategory === 'consumable') && (
        <div className="space-y-1">
          <div className="text-[8.5px] font-bold text-[#8dd7ad]">
            SALVAGED CONSUMABLES, GEMSTONES & RELICS:
          </div>
          {state.inventorySlots.length === 0 ? (
            <div className="text-center text-[#64748b] py-4 italic">
              No salvage in satchel. Explore drop-pod marshlands and loot caches.
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
                        {def.lightBonus !== undefined && def.lightBonus !== 0 && (
                          <span
                            className={`text-[7.5px] px-1 py-0.2 rounded-[2px] font-semibold ${
                              def.lightBonus > 0
                                ? 'bg-[#052e16]/80 text-[#86efac] border border-[#22c55e]/40'
                                : 'bg-[#450a0a]/80 text-[#fca5a5] border border-[#ef4444]/40'
                            }`}
                          >
                            {def.lightBonus > 0 ? `+${def.lightBonus}` : def.lightBonus} LGT
                          </span>
                        )}
                        {(def.buyPrice || def.sellPrice) ? (
                          <span className="text-[7.5px] text-[#94a3b8]">
                            · Buy {def.buyPrice || 0}g / Sell {def.sellPrice || 0}g
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[8px] text-[#cbd5e1]">{def.description}</div>
                      {isGem && GEMSTONE_REGISTRY[slot.itemId as GemId] && (
                        <div className="text-[7px] text-[#86efac]">
                          + WPN MOD ({GEM_MOD_PREFIX_BY_ID[slot.itemId as GemId]}):{' '}
                          {WEAPON_GEM_COMBAT_BONUS_DESCRIPTIONS[slot.itemId as GemId]} ·{' '}
                          {WEAPON_GEM_WEIGHT_DELTA[slot.itemId as GemId] >= 0
                            ? `+${WEAPON_GEM_WEIGHT_DELTA[slot.itemId as GemId]}`
                            : WEAPON_GEM_WEIGHT_DELTA[slot.itemId as GemId]}{' '}
                          WT
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {isGem && (
                        <button
                          onClick={() => {
                            soundSystem.playSelect();
                            onOpenProgressionTab();
                          }}
                          className="px-1.5 py-1 bg-[#172554] hover:bg-[#1e3a8a] text-[#7dd3fc] font-bold rounded-xs border border-[#38bdf8]/60 text-[8px] cursor-pointer"
                        >
                          SKILLS / FEATS
                        </button>
                      )}
                      {def.category === 'consumable' && (
                        <button
                          onClick={() => openSlotEditor('slot2')}
                          className="px-1.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#86efac] font-bold rounded-xs border border-[#4ade80]/50 text-[8px] cursor-pointer"
                        >
                          EQUIP IN LOADOUT
                        </button>
                      )}
                      {def.onUse && (
                        <button
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

