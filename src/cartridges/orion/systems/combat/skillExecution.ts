/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import { WEAPON_SWAP_COOLDOWN } from '../../constants';
import {
  findHardwareItemByNameOrId,
  getClassUtilityDefinition,
  getResolvedActionDescriptor,
} from '../../database/equipment';
import {
  clampTempoMultiplier,
  classifyWeaponCombatArchetype,
  getWeaponDefinition,
  isAuxiliaryEquipment,
  isBlockingWeapon,
  isTrueWeaponEquipment,
  isTwoHandOnlyWeapon,
  resolveRangedBasicShotProfile,
} from '../../database/equipment/weapons';
import { getItemDefinition } from '../../database/items';
import {
  ActiveSpecialistStanceEvaluation,
  buildActionDefinitionFromStanceOverride,
  computeInterfaceFeatModifiers,
  evaluateActiveSpecialistStance,
  getActiveLegendaryEngineHooks,
  getEffectiveMainGrip,
  getEquipmentDisplayName,
  getOwnedWeaponCount,
  getWeaponGemCombatModifiers,
  getWeaponGemVisuals,
  parseEquipmentInstanceId,
  resolveActiveAction4DefensiveMode,
  resolveEquippedHardwareStats,
} from '../../database/progression';
import {
  ActionDefinition,
  ArmorState,
  DamageType,
  FrameState,
  OrionActionDescriptor,
  OrionCombatContext,
  OrionState,
  ShieldState,
  WeaponStanceType,
} from '../../types';
import {
  computeMeleeImpulse,
  computeMomentumFraction,
  computeRangedImpulse,
  formatInertiaOutcomeLabel,
  INERTIA_CONSTANTS,
  resolveEnemyInertiaProfile,
  resolveHitInertia,
  resolvePlayerInertiaProfile,
  resolveRecoil,
  resolveWeaponAttackInertiaSpec,
} from '../inertiaSystem';
import { getActiveRoomBounds, notifyOrionStateChange } from '../playerSystem';
import {
  evaluatePositionalHitQuality,
  getCombatAimVector,
  getLockedTarget,
  isTargetInDirectionalArc,
  isTargetInImpactZone,
  isTargetInThrustCorridor,
  normalizeAngleDiff,
  triggerEntityFlash,
} from './combatHelpers';
import {
  DamageLayerOptions,
  PERFECT_BLOCK_WINDOW_SEC,
  triggerGorgonsGazeCone,
} from './damageSystem';
import {
  applySkillMovementAndSupportImpulse,
  executeSpecializedSkillPayload,
  ResolvedSkillBehaviorProfile,
  resolveSkillBehaviorProfile,
} from './skillBehaviors';

// ─── 1. ASSIGNABLE [L], [B] & [R] MULTI-SOURCE ACTIONS ───────────────────────

/**
 * Executes `isActionUnlocked` (is action unlocked) in `skillExecution.ts`.
 */
export function isActionUnlocked(
  state: OrionState,
  actionId: string
): { unlocked: boolean; reason: string } {
  if (state.bypassProgressionGates) {
    return { unlocked: true, reason: 'UNLOCKED (GATE BYPASS)' };
  }

  const desc = getResolvedActionDescriptor(state, actionId);
  const gates = state.gates;
  const lvl = state.level || 1;
  const isSet2 = state.activeWeaponIndex > 0;

  if (desc.sourceCategory === 'weapon' && desc.weaponSkillSlot) {
    const unlockedSlots = gates?.unlockedSkillSlots ?? [0];
    if (unlockedSlots.includes(desc.weaponSkillSlot)) {
      return { unlocked: true, reason: 'READY' };
    }
    const actionNum = desc.weaponSkillSlot + 1;
    const reqLvl = isSet2
      ? actionNum <= 2
        ? 3
        : 4
      : actionNum === 2
        ? 2
        : 3;
    return {
      unlocked: false,
      reason: `UNLOCKS AT LEVEL ${reqLvl} (SET ${isSet2 ? 2 : 1} ACTION ${actionNum})`,
    };
  }

  if (desc.sourceCategory === 'hardware') {
    if (desc.hardwareSlot === 'Legs') {
      if (gates?.legsSlotActive || lvl >= 2) {
        return { unlocked: true, reason: 'READY (LEGS SLOT · LVL 2)' };
      }
      return { unlocked: false, reason: 'UNLOCKS AT LEVEL 2 (LEGS SLOT / POE)' };
    }
    if (desc.hardwareSlot === 'Head') {
      if (gates?.headSlotActive || lvl >= 3) {
        return { unlocked: true, reason: 'READY (HEAD SLOT · LVL 3)' };
      }
      return { unlocked: false, reason: 'UNLOCKS AT LEVEL 3 (HEAD SLOT / BORDER TOWN)' };
    }
    if (desc.hardwareSlot === 'Torso') {
      if ((gates?.auxSlotsUnlocked ?? 0) >= 2 || lvl >= 4) {
        return { unlocked: true, reason: 'READY (AUX SLOTS 1–2 · LVL 4)' };
      }
      return { unlocked: false, reason: 'UNLOCKS AT LEVEL 4 (AUX SLOTS 1–2)' };
    }
    if (desc.hardwareSlot === 'Arms') {
      if (gates?.armsSlotActive || lvl >= 5) {
        return { unlocked: true, reason: 'READY (ARMS SLOT & AUX 3–4 · LVL 5)' };
      }
      return { unlocked: false, reason: 'UNLOCKS AT LEVEL 5 (ARMS SLOT & AUX 3–4)' };
    }
  }

  if (desc.sourceCategory === 'reactor') {
    if (gates?.generatorSlotActive || lvl >= 4) {
      return { unlocked: true, reason: 'READY (GENERATOR SLOT · LVL 4)' };
    }
    return { unlocked: false, reason: 'UNLOCKS AT LEVEL 4 (GENERATOR SLOT)' };
  }

  if (desc.sourceCategory === 'utility') {
    if (gates?.utilitySlotActive || lvl >= 6) {
      return { unlocked: true, reason: 'READY (UTILITY SLOT [ACTION 6] · LVL 6)' };
    }
    return {
      unlocked: false,
      reason: 'UNLOCKS AT LEVEL 6 (BORDER TOWN COMPLETE · UTILITY SLOT)',
    };
  }

  if (desc.sourceCategory === 'belt') {
    const idx = desc.beltSlotIndex ?? 0;
    const reqLvl = idx === 0 || idx === 1 ? 1 : 2;
    if (lvl >= reqLvl || (gates?.beltSlotsUnlocked ?? 2) > idx) {
      return { unlocked: true, reason: `READY (BELT SLOT ${idx + 1} · LVL ${reqLvl})` };
    }
    return {
      unlocked: false,
      reason: `UNLOCKS AT LEVEL ${reqLvl} (BELT SLOT ${idx + 1} · POE / SCOUT)`,
    };
  }

  return { unlocked: true, reason: 'READY' };
}

/**
 * Executes `assignTriggerAction` (assign trigger action) in `skillExecution.ts`. Mutates `state: OrionState`.
 */
export function assignTriggerAction(
  state: OrionState,
  trigger: 'L' | 'R' | 'B',
  actionId: string
): void {
  state.assignedActions = state.assignedActions || {
    L: 'weapon_swap',
    R: 'weapon_skill_2',
    B: 'booster_dash',
  };
  state.assignedActions[trigger] = actionId;
  notifyOrionStateChange();
}

/**
 * Resolves the active `L (Q)` Long-Press binding ID, defaulting to `'weapon_swap'`
 * (Weapon / Auxiliary Swap) when unset or when holding the legacy `'weapon_skill_1'` placeholder.
 * Does not mutate `state: OrionState`.
 */
export function getEffectiveLHoldActionId(state: OrionState): string {
  const raw = state.assignedActions?.L;
  if (!raw || raw === 'weapon_swap' || raw === 'weapon_skill_1') {
    return 'weapon_swap';
  }
  return raw;
}

/**
 * Resolves the active `B (K)` Boost binding ID, defaulting to `'booster_dash'`
 * (Booster Thrusters: Tap Dash / Hold Continuous Boost) when unset.
 * Does not mutate `state: OrionState`.
 */
export function getEffectiveBActionId(state: OrionState): string {
  const raw = state.assignedActions?.B;
  if (!raw || raw === 'booster_dash') {
    return 'booster_dash';
  }
  return raw;
}

/**
 * Candidate action entry derived strictly from the pilot's currently equipped items
 * for binding to `Weapon Swap (L [Q] Hold)` or `Boost (B [K])`, enforcing multi-source duplicate prevention.
 */
export interface EquippedAssignableActionCandidate {
  /** Action ID to store in `state.assignedActions[targetSlot]` */
  bindId: string;
  /** Resolved action descriptor for UI display */
  descriptor: OrionActionDescriptor;
  /** Number of distinct currently equipped item sources providing this action */
  availableSourceCount: number;
  /** Number of times this action is already equipped across active combat slots and the other editable slot */
  equippedCount: number;
  /** Human-readable list of equipped items providing this action */
  equippedSourceNames: string[];
  /** Human-readable list of slots where this action is currently equipped */
  equippedSlotLabels: string[];
  /** True if this action is currently bound to `targetSlot` */
  isAssignedHere: boolean;
  /** True if this action can be bound to `targetSlot` (`isAssignedHere || availableSourceCount > equippedCount`) */
  canBind: boolean;
  /** Explanation when `canBind` is false due to single-source duplication */
  duplicateReason?: string;
}

/**
 * Builds the list of assignable action candidates derived strictly from the pilot's **currently equipped items**
 * for `Weapon Swap (L [Q] Long-Press)` or `Boost (B [K])`.
 * Enforces the multi-source deduplication rule: an already equipped action cannot be equipped again
 * unless it is available from multiple currently equipped sources (`availableSourceCount > equippedCount`).
 * Does not mutate `state: OrionState`.
 */
export function getEquippedAssignableActionCandidates(
  state: OrionState,
  targetSlot: 'L' | 'B',
  isCheatMode: boolean = false
): EquippedAssignableActionCandidate[] {
  const eq = state.equipmentSlots;
  const currentL = getEffectiveLHoldActionId(state);
  const currentB = getEffectiveBActionId(state);
  const currentThisSlot = targetSlot === 'L' ? currentL : currentB;
  const currentOtherSlot = targetSlot === 'L' ? currentB : currentL;
  const otherSlotLabel = targetSlot === 'L' ? 'Boost B [K]' : 'Weapon Swap L [Q] Hold';

  const slot1Id = eq?.slot1 || state.equippedWeapons?.[0] || null;
  const slot2Id = eq?.slot2 || null;
  const slot3Id = eq?.slot3 || null;
  const w1 = slot1Id ? getWeaponDefinition(slot1Id) : undefined;
  const w2 = slot2Id ? getWeaponDefinition(slot2Id) : undefined;
  const w3 = slot3Id ? getWeaponDefinition(slot3Id) : undefined;
  const is2HGrip = getEffectiveMainGrip(state) === '2h';

  // Count distinct equipped weapon sources for each weapon action signature (move name)
  const weaponMoveSources = new Map<string, string[]>();
  const recordWeaponMoves = (w: ReturnType<typeof getWeaponDefinition>, slotTag: string) => {
    if (!w) return;
    for (let idx = 1; idx < w.moveset.length; idx++) {
      const mv = w.moveset[idx];
      if (!mv || mv.isBlock) continue;
      const key = mv.name.trim().toLowerCase();
      const list = weaponMoveSources.get(key) || [];
      list.push(`${w.name} (${slotTag})`);
      weaponMoveSources.set(key, list);
    }
  };
  recordWeaponMoves(w1, 'Main Hand');
  if (w2 && slot2Id) {
    recordWeaponMoves(w2, is2HGrip ? 'Side Hand [Holstered]' : 'Side Hand');
  }
  if (w3 && slot3Id) {
    recordWeaponMoves(w3, 'Aux Back');
  }

  // Active combat skills currently occupying X / Y / R
  const activeSkills = getResolvedCombatSkills(state);
  const activeDeckSkillSlots: Array<{ nameKey: string; label: string }> = [];
  if (activeSkills.skill2?.available && activeSkills.skill2.name) {
    activeDeckSkillSlots.push({
      nameKey: activeSkills.skill2.name.trim().toLowerCase(),
      label: 'Y [I] Tap (Skill 2)',
    });
  }
  if (activeSkills.skill3?.available && activeSkills.skill3.name) {
    activeDeckSkillSlots.push({
      nameKey: activeSkills.skill3.name.trim().toLowerCase(),
      label: 'R [E] Tap (Skill 3)',
    });
  }
  if (
    activeSkills.skill4?.available &&
    !activeSkills.skill4.isBlock &&
    activeSkills.skill4.name
  ) {
    activeDeckSkillSlots.push({
      nameKey: activeSkills.skill4.name.trim().toLowerCase(),
      label: 'Y [I] Hold (Skill 4)',
    });
  }
  if (activeSkills.skill5?.available && activeSkills.skill5.name) {
    activeDeckSkillSlots.push({
      nameKey: activeSkills.skill5.name.trim().toLowerCase(),
      label: 'R [E] Hold (Skill 5)',
    });
  }

  // Inspect equipped hardware pieces and count how many equipped hardware modules link to each hardware/reactor action
  const hardwareSources = new Map<string, string[]>();
  const addHardwareSource = (rawId: string | null | undefined, slotLabel: string) => {
    if (!rawId) return;
    const hw = findHardwareItemByNameOrId(rawId);
    if (!hw || !hw.linkedActionId) return;
    const list = hardwareSources.get(hw.linkedActionId) || [];
    list.push(`${hw.name} (${slotLabel})`);
    hardwareSources.set(hw.linkedActionId, list);
  };
  addHardwareSource(eq?.head, 'Head Dome');
  addHardwareSource(eq?.headOptics, 'Head Optics');
  addHardwareSource(eq?.sensoryA, 'Sensory A');
  addHardwareSource(eq?.sensoryB, 'Sensory B');
  addHardwareSource(eq?.plating, 'Torso Plating');
  addHardwareSource(eq?.reactorCore, 'Reactor Core');
  addHardwareSource(eq?.arms, 'Arms');
  addHardwareSource(eq?.armActuators, 'Arm Actuators');
  addHardwareSource(eq?.legs, 'Legs');

  const candidates: EquippedAssignableActionCandidate[] = [];

  const pushCandidate = (
    bindId: string,
    descriptor: OrionActionDescriptor,
    equippedSourceNames: string[],
    activeDeckUsedLabels: string[],
    alsoUsedOnOtherTrigger: boolean
  ) => {
    const availableSourceCount = equippedSourceNames.length;
    if (availableSourceCount <= 0) return;

    const equippedSlotLabels = [...activeDeckUsedLabels];
    if (alsoUsedOnOtherTrigger) {
      equippedSlotLabels.push(otherSlotLabel);
    }
    const equippedCount = equippedSlotLabels.length;
    const isAssignedHere = currentThisSlot === bindId;
    const canBind = isAssignedHere || availableSourceCount > equippedCount;
    const duplicateReason = !canBind
      ? `Already equipped on ${equippedSlotLabels.join(' & ')} (${availableSourceCount}/${availableSourceCount} equipped source in use — equip a second source to bind again)`
      : undefined;

    candidates.push({
      bindId,
      descriptor,
      availableSourceCount,
      equippedCount,
      equippedSourceNames,
      equippedSlotLabels,
      isAssignedHere,
      canBind,
      duplicateReason,
    });
  };

  // 1. Equipped Chassis Hardware & Reactor Core Actions (strictly from equipped hardware modules)
  const hwAndReactorActionIds = [
    'mod_head_optic_scan',
    'mod_torso_reactive_burst',
    'mod_arms_shock_grapple',
    'mod_legs_seismic_stomp',
    'reactor_thermal_vent',
    'reactor_overdrive',
    'reactor_aegis_pulse',
  ];
  for (const actId of hwAndReactorActionIds) {
    if (!isCheatMode && !isActionUnlocked(state, actId).unlocked) continue;
    const sources = hardwareSources.get(actId) || [];
    if (sources.length === 0) continue;
    const desc = getResolvedActionDescriptor(state, actId);
    const usedOnOther = currentOtherSlot === actId;
    pushCandidate(actId, desc, sources, [], usedOnOther);
  }

  // 2. Equipped Tactical Utility Module (`class_utility_slot`)
  const hasEquippedUtility = Boolean(eq?.utility || state.traitLine);
  if (hasEquippedUtility && (isCheatMode || isActionUnlocked(state, 'class_utility_slot').unlocked)) {
    const utilDef = getClassUtilityDefinition(eq?.utility, state.traitLine);
    const desc = getResolvedActionDescriptor(state, 'class_utility_slot');
    // Check if an auxiliary slot also provides the same utility module
    const utilSources = [`${utilDef.name} (Utility Slot)`];
    if (slot3Id && parseEquipmentInstanceId(slot3Id).baseId === utilDef.id) {
      utilSources.push(`${utilDef.name} (Aux Back)`);
    }
    const usedOnOther = currentOtherSlot === 'class_utility_slot';
    pushCandidate('class_utility_slot', desc, utilSources, [], usedOnOther);
  }

  // 3. Equipped Belt Consumable Slots (`belt_slot_1..4` — only when a non-empty item is equipped in that belt slot)
  const beltItems = eq?.belt || [null, null, null, null];
  const beltItemSourceCounts = new Map<string, string[]>();
  beltItems.forEach((itemId, idx) => {
    if (!itemId) return;
    const def = getItemDefinition(itemId);
    const list = beltItemSourceCounts.get(itemId) || [];
    list.push(`${def?.name || itemId} (Belt Slot ${idx + 1})`);
    beltItemSourceCounts.set(itemId, list);
  });
  if (slot2Id && getItemDefinition(slot2Id)) {
    const def = getItemDefinition(slot2Id);
    const list = beltItemSourceCounts.get(slot2Id) || [];
    list.push(`${def?.name || slot2Id} (Side Hand)`);
    beltItemSourceCounts.set(slot2Id, list);
  }

  const seenBeltItemIds = new Set<string>();
  for (let idx = 0; idx < 4; idx++) {
    const itemId = beltItems[idx];
    if (!itemId || seenBeltItemIds.has(itemId)) continue;
    const beltActId = `belt_slot_${idx + 1}`;
    if (!isCheatMode && !isActionUnlocked(state, beltActId).unlocked) continue;
    seenBeltItemIds.add(itemId);
    const desc = getResolvedActionDescriptor(state, beltActId);
    const sources = beltItemSourceCounts.get(itemId) || [`Belt Slot ${idx + 1}`];
    const otherDesc =
      currentOtherSlot.startsWith('belt_slot_')
        ? getResolvedActionDescriptor(state, currentOtherSlot)
        : null;
    const usedOnOther =
      currentOtherSlot === beltActId ||
      Boolean(
        otherDesc &&
          otherDesc.sourceCategory === 'belt' &&
          typeof otherDesc.beltSlotIndex === 'number' &&
          beltItems[otherDesc.beltSlotIndex] === itemId
      );
    const activeDeckLabels: string[] = [];
    if (activeSkills.skill5?.available && activeSkills.skill5.itemId === itemId) {
      activeDeckLabels.push('R [E] Hold (Side Consumable)');
    }
    pushCandidate(beltActId, desc, sources, activeDeckLabels, usedOnOther);
  }

  // 4. Equipped Weapon Skills (`weapon_skill_1..4`)
  const weaponSkillActionIds = [
    { rawId: 'weapon_skill_1', bindId: 'weapon_skill_1_explicit' },
    { rawId: 'weapon_skill_2', bindId: 'weapon_skill_2' },
    { rawId: 'weapon_skill_3', bindId: 'weapon_skill_3' },
    { rawId: 'weapon_skill_4', bindId: 'weapon_skill_4' },
  ];
  for (const { rawId, bindId } of weaponSkillActionIds) {
    if (!isCheatMode && !isActionUnlocked(state, rawId).unlocked) continue;
    const desc = getResolvedActionDescriptor(state, rawId);
    if (desc.isBlock) continue;
    const moveKey = desc.name.trim().toLowerCase();
    const sources = weaponMoveSources.get(moveKey) || (w1 ? [`${w1.name} (Main Hand)`] : []);
    if (sources.length === 0) continue;
    const activeLabels = activeDeckSkillSlots
      .filter((s) => s.nameKey === moveKey)
      .map((s) => s.label);
    const usedOnOther = currentOtherSlot === bindId || currentOtherSlot === rawId;
    pushCandidate(bindId, desc, sources, activeLabels, usedOnOther);
  }

  return candidates;
}

/**
 * Shared internal helper to execute any bound non-default action ID from `ASSIGNABLE_ACTION_CATALOG`
 * on either `L (Q) Long-Press` or `B (K)`.
 * Mutates `state: OrionState`.
 */
function executeBoundCatalogAction(
  state: OrionState,
  ctx: OrionCombatContext,
  actionId: string
): boolean {
  // Delegate weapon skill slots directly to activateResolvedCombatSkill for unified block/ammo/stance handling
  if (actionId === 'weapon_skill_2') {
    return activateResolvedCombatSkill(state, ctx, 3);
  }
  if (actionId === 'weapon_skill_3' || actionId === 'weapon_slot2_skill4') {
    return activateResolvedCombatSkill(state, ctx, 4);
  }
  if (actionId === 'weapon_skill_4' || actionId === 'weapon_slot2_skill5') {
    return activateResolvedCombatSkill(state, ctx, 5);
  }
  if (actionId === 'weapon_skill_1_explicit' || actionId === 'weapon_skill_1') {
    return activateResolvedCombatSkill(state, ctx, 2);
  }

  if (state.activeActionId) {
    return false;
  }

  const unlockCheck = isActionUnlocked(state, actionId);
  if (!unlockCheck.unlocked) {
    soundSystem.playMenuBeep();
    ctx.say(unlockCheck.reason);
    notifyOrionStateChange();
    return false;
  }

  const currentCd = getActionCooldown(state, actionId);
  if (currentCd > 0) {
    soundSystem.playMenuBeep();
    ctx.say(`ACTION COOLDOWN (${currentCd.toFixed(1)}S)`);
    notifyOrionStateChange();
    return false;
  }

  const desc = getResolvedActionDescriptor(state, actionId);

  // Instant Belt Consumable Flask activation
  if (desc.sourceCategory === 'belt') {
    const beltIdx = desc.beltSlotIndex ?? 0;
    const itemId = desc.itemId || state.equipmentSlots?.belt?.[beltIdx] || null;
    if (!itemId) {
      soundSystem.playMenuBeep();
      ctx.say(`BELT SLOT ${beltIdx + 1} EMPTY`);
      notifyOrionStateChange();
      return false;
    }
    const invIdx = state.inventorySlots.findIndex((s) => s.itemId === itemId);
    const itemDef = getItemDefinition(itemId);
    if (invIdx < 0 || !itemDef) {
      soundSystem.playMenuBeep();
      ctx.say(`${itemDef?.name?.toUpperCase() || 'BELT ITEM'} DEPLETED`);
      notifyOrionStateChange();
      return false;
    }
    const used = itemDef.onUse
      ? itemDef.onUse(state, { say: ctx.say, sound: ctx.sound })
      : false;
    if (used) {
      state.inventorySlots[invIdx].count -= 1;
      if (state.inventorySlots[invIdx].count <= 0) {
        state.inventorySlots.splice(invIdx, 1);
      }
      state.actionCooldowns = state.actionCooldowns || {};
      state.actionCooldowns[actionId] = desc.cooldownSec || 2.5;
      triggerEntityFlash(state, itemDef.iconColor || '#fbbf24', 0.14, 'ready');
      ctx.spawnParticles(
        state.x,
        state.y,
        state.z + 8,
        10,
        itemDef.iconColor || '#fbbf24',
        ''
      );
      notifyOrionStateChange();
      return true;
    }
    return false;
  }

  // Standard Hardware / Utility / Reactor action tell & payload cycle
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const heatPenaltyMult = state.gates?.loadPenalty?.heatMult ?? 1.0;
  const rawHeat = desc.heatCost ?? 0;
  if (rawHeat > 0) {
    const scaledHeat = rawHeat * heatPenaltyMult * featMods.heatGenMult;
    state.heat = Math.min(state.maxHeat, state.heat + scaledHeat);
    state.heatDecayDelayTimer = Math.max(state.heatDecayDelayTimer || 0, 0.45);
  } else if (rawHeat < 0) {
    state.heat = Math.max(0, state.heat + rawHeat);
  }

  const hwStats = resolveEquippedHardwareStats(state);
  const cdScale = clampTempoMultiplier(featMods.cooldownMult * hwStats.cooldownMult);
  const tellScale = clampTempoMultiplier(hwStats.tellDurationMult);
  const finalCd = Math.max(1.5, (desc.cooldownSec || 4.5) * cdScale);

  state.actionCooldowns = state.actionCooldowns || {};
  state.actionCooldowns[actionId] = finalCd;
  state.activeSkillSlot = 4;
  state.activeActionId = actionId;
  state.activeSkillCooldownKey = actionId;
  state.skillTellTimer = Math.max(0.08, (desc.tellDurationSec || 0.14) * tellScale);
  state.skillTellMaxTimer = state.skillTellTimer;
  state.skillActionTimer = Math.max(0.22, (desc.actionDurationSec || 0.28) * tellScale);
  state.skillActionMaxTimer = state.skillActionTimer;
  state.revealedTimer = 0.75;

  soundSystem.playCharge();
  notifyOrionStateChange();
  return true;
}

/**
 * Executes the pilot's bound `L (Q)` Long-Press action: defaults to `performAuxiliarySwap`
 * (`'weapon_swap'`), or activates any bound equipped action.
 * Mutates `state: OrionState`.
 */
export function activateAssignedLHoldAction(
  state: OrionState,
  ctx: OrionCombatContext
): boolean {
  const actionId = getEffectiveLHoldActionId(state);
  if (actionId === 'weapon_swap') {
    performAuxiliarySwap(state, ctx);
    return true;
  }
  return executeBoundCatalogAction(state, ctx, actionId);
}

/**
 * Executes the pilot's custom bound `B (K)` action when `B` is overridden from `'booster_dash'`
 * to an equipped item action (or `'weapon_swap'`).
 * Mutates `state: OrionState`.
 */
export function activateAssignedBAction(
  state: OrionState,
  ctx: OrionCombatContext
): boolean {
  const actionId = getEffectiveBActionId(state);
  if (actionId === 'booster_dash') {
    return false;
  }
  if (actionId === 'weapon_swap') {
    performAuxiliarySwap(state, ctx);
    return true;
  }
  return executeBoundCatalogAction(state, ctx, actionId);
}

/**
 * Executes `getActionCooldown` (get action cooldown) in `skillExecution.ts`.
 */
export function getActionCooldown(state: OrionState, actionId: string): number {
  const desc = getResolvedActionDescriptor(state, actionId);
  if (desc.sourceCategory === 'weapon' && desc.weaponSkillSlot) {
    return Math.max(
      0,
      state.skillCooldowns[desc.weaponSkillSlot] || 0,
      state.actionCooldowns?.[actionId] || 0
    );
  }
  return Math.max(0, state.actionCooldowns?.[actionId] || 0);
}

// [ORION-ANCHOR: COMBAT-ACTION-PAYLOAD]
/**
 * Executes `executeActionPayload` (execute action payload) in `skillExecution.ts`. Mutates `state: OrionState`.
 */
export function executeActionPayload(
  state: OrionState,
  ctx: OrionCombatContext,
  actionId: string,
  applyDamageFn: (
    shields: ShieldState,
    armor: ArmorState,
    frame: FrameState,
    rawDamage: number,
    damageType: DamageType,
    spawnParticles?: (count: number, color: string, label: string) => void,
    options?: DamageLayerOptions
  ) => void
): void {
  const desc = getResolvedActionDescriptor(state, actionId);
  const aim = getCombatAimVector(state);
  const aimAngle = Math.atan2(aim.dy, aim.dx);
  const rawWeaponId =
    desc.weaponId ||
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const weapon = getWeaponDefinition(rawWeaponId);
  const currentWeaponId = parseEquipmentInstanceId(rawWeaponId).baseId || rawWeaponId;
  const arch = classifyWeaponCombatArchetype(weapon, currentWeaponId);
  const isMeleeOrShield = arch.isMeleeOrShield;
  const gemVis = getWeaponGemVisuals(state, rawWeaponId);
  const trailColor = gemVis.gemId
    ? gemVis.color
    : weapon?.bladeTrailColor || (isMeleeOrShield ? '#e879f9' : '#77c7ff');
  const coreColor = gemVis.gemId ? gemVis.coreColor : '#ffffff';

  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const gemCombatMods = getWeaponGemCombatModifiers(state, rawWeaponId);
  const activeLegendaryHooks = gemCombatMods.modificationProfile?.activeLegendaryHooks || [];
  const hasBypassLayer1Shields = activeLegendaryHooks.includes('BYPASS_LAYER1_SHIELDS');
  const hasZeroHitStop = activeLegendaryHooks.includes('ZERO_HIT_STOP');
  const hasPermanentKill = activeLegendaryHooks.includes('PERMANENT_KILL_PREVENT_RESURRECT');
  const hasTwinBladeExecution = activeLegendaryHooks.includes('TWIN_BLADE_DUAL_EXECUTION');
  const hasGorgonsGaze =
    activeLegendaryHooks.includes('BYPASS_BOSS_CC_IMMUNITY_PETRIFY') ||
    getActiveLegendaryEngineHooks(state, state.equipmentSlots?.slot2).has(
      'BYPASS_BOSS_CC_IMMUNITY_PETRIFY'
    );
  const specEval = evaluateActiveSpecialistStance(state);
  const specMods = specEval.passiveModifiers;
  const overdriveMult =
    ((state.overdriveTimer || 0) > 0 ? 1.3 : 1.0) *
    featMods.damageMult *
    gemCombatMods.damageMult *
    specMods.damageMult;
  const opticMult = (state.opticMarkTimer || 0) > 0 ? 1.25 : 1.0;
  const hasKnightsOath = state.equippedFeats.includes('knights_oath');
  const equippedFeats = state.equippedFeats || [];

  const hwStats = resolveEquippedHardwareStats(state);

  const computeEnemyDamage = (
    baseDmg: number,
    faction?: string,
    target?: (typeof state.enemies)[number],
    dmgType?: DamageType
  ) => {
    const oathMult = hasKnightsOath && faction === 'camelot' ? 1.1 : 1.0;
    const isLockedOrStaggered =
      target &&
      (target.id === state.lockedTargetId ||
        target.stun > 0 ||
        (target.knockdownTimer || 0) > 0);
    const charoiteMult = isLockedOrStaggered
      ? gemCombatMods.lockedOrStaggeredDamageMult * hwStats.staggerDamageMult
      : 1.0;
    const isStationaryFocus = Math.hypot(state.vx || 0, state.vy || 0) < 6;
    const hasAnchoredFocus =
      (dmgType === 'Beam' || dmgType === 'Wave' || isStationaryFocus) &&
      equippedFeats.some((f) =>
        [
          'anchored_focus',
          'beam_focus',
          'guarded_fire',
          'sustained_channeling',
          'solar_convergence',
        ].includes(f)
      );
    const beamMult = hasAnchoredFocus ? 1.15 : 1.0;
    const hasAssassinate =
      target &&
      equippedFeats.some((f) => ['assassinate', 'executioners_gambit'].includes(f)) &&
      target.frame.integrity <= target.frame.maxIntegrity * 0.4;
    const execMult = hasAssassinate ? 1.2 : 1.0;
    let backstabMult = 1.0;
    if (
      target &&
      equippedFeats.some((f) =>
        ['backstab_mastery', 'ambush_predator', 'surgical_precision'].includes(f)
      )
    ) {
      const enemyFaceAng = target.attackAngle ?? 0;
      const toEnemyAng = Math.atan2(target.y - state.y, target.x - state.x);
      if (Math.abs(normalizeAngleDiff(toEnemyAng, enemyFaceAng)) < Math.PI * 0.45 || target.stun > 0) {
        backstabMult = 1.22;
      }
    }
    const finalDmg = Math.round(
      baseDmg * overdriveMult * opticMult * oathMult * charoiteMult * beamMult * execMult * backstabMult
    );
    if (
      target &&
      finalDmg > 0 &&
      equippedFeats.some((f) => ['shadow_siphon', 'mercy_in_shadow'].includes(f)) &&
      ((state.stealthDrTimer || 0) > 0 || backstabMult > 1.0)
    ) {
      const siphonAmt = Math.max(1, Math.round(finalDmg * 0.15));
      const shieldRoom = Math.max(0, state.shields.maxCapacity - state.shields.capacity);
      const toShield = Math.min(shieldRoom, siphonAmt);
      state.shields.capacity += toShield;
      const toFrame = siphonAmt - toShield;
      if (toFrame > 0) {
        state.frame.integrity = Math.min(
          state.frame.maxIntegrity,
          state.frame.integrity + toFrame
        );
      }
    }
    return finalDmg;
  };

  const playerInertiaProf = resolvePlayerInertiaProfile(state);
  const activeSlotNum = desc.weaponSkillSlot || 1;
  const weaponInertiaSpec = resolveWeaponAttackInertiaSpec(
    currentWeaponId,
    activeSlotNum,
    state
  );

  // Apply Weapon / Attack Recoil (§7 of `inertia-v0.md`: J_recoil / m_shooter_frame, no μ bonus)
  if (desc.sourceCategory === 'weapon') {
    const recoilJ = weaponInertiaSpec.isMelee
      ? weaponInertiaSpec.attackWeight * weaponInertiaSpec.attackSpeed * 0.55
      : computeRangedImpulse(
          weaponInertiaSpec.projectileWeight,
          weaponInertiaSpec.projectileSpeed
        );
    const recoilRes = resolveRecoil({
      recoilImpulseJ: recoilJ,
      shooterFrameWeight: playerInertiaProf.totalBaseWeight,
      shooterStability: playerInertiaProf.stability,
    });
    if (recoilRes.restrictionSec > 0) {
      state.recoilRestrictionTimer = Math.max(
        state.recoilRestrictionTimer || 0,
        recoilRes.restrictionSec
      );
      state.recoilSpeedMult = recoilRes.speedMultiplier;
      if (!weaponInertiaSpec.isMelee && recoilRes.kickbackSpeedPx > 0) {
        state.knockbackVx = (state.knockbackVx || 0) - aim.dx * recoilRes.kickbackSpeedPx * 0.4;
        state.knockbackVy = (state.knockbackVy || 0) - aim.dy * recoilRes.kickbackSpeedPx * 0.4;
      }
    }
  }

  const resolvedActionDef: ActionDefinition | undefined =
    desc.sourceCategory === 'weapon' && desc.weaponSkillSlot
      ? {
          ...(weapon?.moveset[desc.weaponSkillSlot] || {}),
          ...desc,
          slot: desc.weaponSkillSlot,
        }
      : undefined;

  const activeSkillProfile: ResolvedSkillBehaviorProfile | null =
    resolvedActionDef && desc.weaponSkillSlot
      ? resolveSkillBehaviorProfile(weapon, resolvedActionDef, desc.weaponSkillSlot)
      : null;

  let skillHitGrantedBonus = false;
  const applyHitToEnemy = (
    e: (typeof state.enemies)[number],
    baseDmg: number,
    dmgType: DamageType,
    stunSec: number = 0.35,
    knockbackDist: number = 0,
    extraArmorDent: number = 0,
    maxReach: number = 34
  ) => {
    e.hurt = 0.22;
    if (hasPermanentKill) {
      e.preventResurrection = true;
    }
    const hitEval = evaluatePositionalHitQuality(
      currentWeaponId,
      state.x,
      state.y,
      aimAngle,
      maxReach,
      e.x,
      e.y,
      false
    );
    const profileDent = activeSkillProfile?.extraArmorDent || 0;
    const compStats = gemCombatMods.modificationProfile?.statModifiers;
    const durShredMult = compStats?.durShredMultiplier ?? 1.0;
    const thrPierceDelta = compStats?.thrPierceDelta ?? 0;
    const shieldDmgMult = compStats?.shieldDamageMultiplier ?? 1.0;
    const totalArmorDent = Math.round(
      (Math.max(extraArmorDent, profileDent) +
        gemCombatMods.extraArmorDentOnHit +
        specMods.extraArmorDentOnHit) *
        durShredMult
    );
    if (totalArmorDent > 0 && e.armor.durability > 0) {
      e.armor.durability = Math.max(0, e.armor.durability - totalArmorDent);
    }
    if ((compStats?.targetMuStripOnHit ?? 0) > 0) {
      const stripRatio = Math.max(0, Math.min(0.85, compStats?.targetMuStripOnHit ?? 0));
      e.vx = (e.vx || 0) * (1 - stripRatio);
      e.vy = (e.vy || 0) * (1 - stripRatio);
    }

    // Apply guard-breaking shield strip on Hook/Wrench/Snag skills
    if (
      activeSkillProfile &&
      activeSkillProfile.guardBreakShieldMult > 1.0 &&
      e.shields.capacity > 0
    ) {
      const bonusStrip = Math.round(
        baseDmg * (activeSkillProfile.guardBreakShieldMult - 1.0) * 0.55
      );
      e.shields.capacity = Math.max(0, e.shields.capacity - bonusStrip);
    }

    // Resolve Melee Inertia (`J_melee = (attack_weight + m_attacker * μ_attacker * commitment) * attack_speed`, §4)
    const kdx = e.x - state.x;
    const kdy = e.y - state.y;
    const kNorm = Math.hypot(kdx, kdy) || 1;
    const impDx = kdx / kNorm;
    const impDy = kdy / kNorm;

    const attackerMu =
      computeMomentumFraction(
        state.vx + (state.isBoosterDashing ? state.boosterDirX * 95 : 0),
        state.vy + (state.isBoosterDashing ? state.boosterDirY * 95 : 0),
        impDx,
        impDy
      ) * specMods.chargeMuMultiplier;
    const effectiveKbDist =
      activeSkillProfile?.displacementKind === 'hook_pull'
        ? -Math.max(12, Math.abs(knockbackDist))
        : activeSkillProfile?.displacementKind === 'heavy_shove'
          ? Math.max(14, Math.round(Math.abs(knockbackDist) * 1.5))
          : knockbackDist;
    const scaleMult = Math.max(
      0.75,
      Math.min(1.6, stunSec / 0.45 + Math.abs(effectiveKbDist) * 0.03)
    );
    const impulseJ =
      computeMeleeImpulse(
        weaponInertiaSpec.attackWeight * scaleMult * (hitEval.quality === 'sweet' ? 1.2 : 1.0),
        weaponInertiaSpec.attackSpeed,
        playerInertiaProf.totalBaseWeight,
        attackerMu,
        weaponInertiaSpec.commitment
      ) * (compStats?.meleeImpulseMultiplier ?? 1.0);
    const eProf = resolveEnemyInertiaProfile(e);
    const defenderMu = computeMomentumFraction(e.vx || 0, e.vy || 0, -impDx, -impDy);
    const existingSpeed = Math.hypot(e.knockbackVx || 0, e.knockbackVy || 0);
    const inertiaRes = resolveHitInertia({
      impulseJ,
      defenderWeight: eProf.baseWeight,
      defenderMu,
      defenderStability: eProf.stability,
      isRanged: false,
      defenderShieldsActive: e.shields.capacity > 0,
      existingKnockbackSpeedPx: existingSpeed,
    });

    const pullSign = effectiveKbDist < 0 ? -1 : 1;
    let nextKvx =
      (e.knockbackVx || 0) + impDx * pullSign * inertiaRes.displacementSpeedPx;
    let nextKvy =
      (e.knockbackVy || 0) + impDy * pullSign * inertiaRes.displacementSpeedPx;
    const nextMag = Math.hypot(nextKvx, nextKvy);
    if (nextMag > INERTIA_CONSTANTS.MAX_KNOCKBACK_SPEED_PX) {
      const capScale = INERTIA_CONSTANTS.MAX_KNOCKBACK_SPEED_PX / nextMag;
      nextKvx *= capScale;
      nextKvy *= capScale;
    }
    e.knockbackVx = nextKvx;
    e.knockbackVy = nextKvy;
    e.lastInertiaOutcome = inertiaRes.outcome;
    e.lastInertiaOutcomeTimer = 0.6;
    if (hasZeroHitStop) {
      state.hitstopTimer = 0;
    } else {
      state.hitstopTimer = Math.max(
        state.hitstopTimer || 0,
        inertiaRes.hitstopSec + hitEval.extraHitstopSec
      );
    }

    if (inertiaRes.outcome === 'none') {
      triggerEntityFlash(e, '#94a3b8', 0.08, 'armor_deflect');
      ctx.spawnParticles(e.x, e.y, e.z + 10, 3, '#94a3b8', '');
    } else if (inertiaRes.outcome === 'knockdown') {
      e.knockdownTimer = Math.max(e.knockdownTimer || 0, inertiaRes.knockdownSec);
      e.stun = Math.max(e.stun, inertiaRes.recoverySec);
      e.state = 'stagger';
      e.stateTimer = inertiaRes.recoverySec;
      e.stateMaxTimer = inertiaRes.recoverySec;
      e.knockbackVx *= 0.3;
      e.knockbackVy *= 0.3;
      const outFmt = formatInertiaOutcomeLabel('knockdown');
      triggerEntityFlash(e, outFmt.color, 0.22, 'stagger');
      ctx.spawnParticles(e.x, e.y, e.z + 12, 8, outFmt.color, outFmt.label);
    } else {
      e.stun = Math.max(e.stun, inertiaRes.recoverySec);
      if (inertiaRes.outcome === 'stagger' || inertiaRes.outcome === 'knockback') {
        if (e.state === 'windup') {
          e.state = 'stagger';
          e.stateTimer = inertiaRes.recoverySec;
          e.stateMaxTimer = inertiaRes.recoverySec;
        }
        const outFmt = formatInertiaOutcomeLabel(inertiaRes.outcome);
        triggerEntityFlash(e, '#ffffff', 0.16, 'stagger');
        ctx.spawnParticles(e.x, e.y, e.z + 12, 5, outFmt.color, '');
      }
    }
    if (!skillHitGrantedBonus) {
      skillHitGrantedBonus = true;
      if (gemCombatMods.shieldRestoreOnSkillHit > 0) {
        state.shields.overloaded = false;
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + gemCombatMods.shieldRestoreOnSkillHit
        );
      }
      if (gemCombatMods.presenceGainOnHit > 0) {
        state.presence = Math.min(100, (state.presence || 0) + gemCombatMods.presenceGainOnHit);
      }
      if (weapon?.supportPulseOnHit) {
        const sp = weapon.supportPulseOnHit;
        if (sp.shieldRestore) {
          state.shields.overloaded = false;
          state.shields.capacity = Math.min(
            state.shields.maxCapacity,
            state.shields.capacity + sp.shieldRestore
          );
        }
        if (sp.armorRestore) {
          state.armor.durability = Math.min(
            state.armor.maxDurability,
            state.armor.durability + sp.armorRestore
          );
        }
        if (sp.heatVent) {
          state.heat = Math.max(0, state.heat - sp.heatVent);
        }
      }
    }
    const resolvedDmgType = weapon?.adaptiveDamageTypes
      ? e.shields.capacity > 0
        ? weapon.adaptiveDamageTypes[0]
        : weapon.adaptiveDamageTypes[1]
      : dmgType;
    const adaptiveBonusMult = weapon?.adaptiveDamageTypes ? 1.12 : 1.0;
    const totalSkillHitDmg = Math.round(
      computeEnemyDamage(baseDmg, e.faction, e, resolvedDmgType) *
        adaptiveBonusMult *
        hitEval.damageMult
    );
    const effectiveArmorBypass = Math.min(
      0.85,
      Math.max(hitEval.armorBypassRatio, specMods.armorThresholdBypassRatio)
    );
    const shieldBypassRatio = Math.max(
      activeSkillProfile?.shieldBypassRatio || 0,
      specMods.shieldBypassRatio
    );
    const layerOpts: DamageLayerOptions = {
      armorBypassRatio: effectiveArmorBypass,
      bypassShields: hasBypassLayer1Shields,
      thrPierceDelta,
      durShredMultiplier: durShredMult,
      shieldDamageMultiplier: shieldDmgMult,
      hitQuality: hitEval.quality,
      onFlash: (color, dur, kind) => triggerEntityFlash(e, color, dur, kind),
    };
    if (!hasBypassLayer1Shields && shieldBypassRatio > 0 && e.shields.capacity > 0) {
      const bypassedPortion = Math.max(1, Math.round(totalSkillHitDmg * shieldBypassRatio));
      const normalPortion = Math.max(0, totalSkillHitDmg - bypassedPortion);
      if (normalPortion > 0) {
        applyDamageFn(
          e.shields,
          e.armor,
          e.frame,
          normalPortion,
          resolvedDmgType,
          undefined,
          layerOpts
        );
      }
      const savedShield = e.shields.capacity;
      e.shields.capacity = 0;
      applyDamageFn(
        e.shields,
        e.armor,
        e.frame,
        bypassedPortion,
        resolvedDmgType,
        (count, color) => ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, ''),
        layerOpts
      );
      e.shields.capacity = savedShield;
    } else {
      applyDamageFn(
        e.shields,
        e.armor,
        e.frame,
        totalSkillHitDmg,
        resolvedDmgType,
        (count, color) => ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, ''),
        layerOpts
      );
    }
    if (hasTwinBladeExecution) {
      applyDamageFn(
        e.shields,
        e.armor,
        e.frame,
        totalSkillHitDmg,
        resolvedDmgType,
        (count) => ctx.spawnParticles(e.x, e.y, e.z + 10, count, '#e11d48', ''),
        layerOpts
      );
    }
    if (hitEval.quality === 'sweet') {
      soundSystem.playPowerup();
    }
    soundSystem.playHit();
  };

  const isSpearWeapon = arch.isSpearOrPolearm && !arch.isLanceOrPike;
  const isLanceWeapon = arch.isLanceOrPike;
  const isStaffOrMaceWeapon = arch.isBluntOrStaff;
  const isAxeWeapon = arch.isAxe;
  const isDaggerWeapon = arch.isDaggerOrShortBlade;
  const isBladeWeapon = arch.isBlade;
  const isExplosiveOrdnanceWeapon = arch.isExplosiveOrdnance;
  const isRapidRotaryWeapon = arch.isRapidCaster;
  const isHeavyAxe = isAxeWeapon && weapon?.weightClass === 'heavy';
  const isLightShield = arch.isBucklerOrDiscShield;
  const isMediumShield = arch.isShield && !arch.isBucklerOrDiscShield && !arch.isTowerOrHeavyShield;
  const isHeavyShield = arch.isTowerOrHeavyShield;

  const weaponShotProfile = resolveRangedBasicShotProfile(
    currentWeaponId,
    arch.category,
    arch.functionalType,
    arch.weightClass
  );

  // 1. WEAPON SKILLS (Slots 1..4)
  if (desc.sourceCategory === 'weapon' && desc.weaponSkillSlot && resolvedActionDef) {
    const slot = desc.weaponSkillSlot;
    const action = resolvedActionDef;
    state.bladeTrails = state.bladeTrails || [];

    if (slot === 4 && specMods.heatVentOnAction5 > 0) {
      state.heat = Math.max(0, state.heat - specMods.heatVentOnAction5);
    }

    if (activeSkillProfile && !action.isBlock) {
      applySkillMovementAndSupportImpulse(
        state,
        ctx,
        activeSkillProfile,
        aim.dx,
        aim.dy,
        trailColor
      );
    }

    if (isAuxiliaryEquipment(weapon) && !action.isBlock && weapon?.supportPulseOnHit) {
      skillHitGrantedBonus = true;
      const sp = weapon.supportPulseOnHit;
      if (sp.shieldRestore) {
        state.shields.overloaded = false;
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + sp.shieldRestore * (slot === 4 ? 1.5 : 1)
        );
      }
      if (sp.armorRestore) {
        state.armor.durability = Math.min(
          state.armor.maxDurability,
          state.armor.durability + Math.round(sp.armorRestore * (slot === 4 ? 1.5 : 1))
        );
      }
      if (sp.heatVent) {
        state.heat = Math.max(0, state.heat - Math.round(sp.heatVent * (slot === 4 ? 1.5 : 1)));
      }
    }

    // Specialized description-driven payloads (Thrown Spear/Axe, Returning Chakram/Disc, Piercing Beam, Mortar/Meteoric Lob)
    if (
      activeSkillProfile &&
      !action.isBlock &&
      executeSpecializedSkillPayload(
        state,
        ctx,
        weapon,
        action,
        activeSkillProfile,
        Math.round((action.damage || 30) * overdriveMult),
        trailColor,
        coreColor
      )
    ) {
      return;
    }

    // Omnidirectional 360° Whirlwind / Core Shockwave skills
    if (
      activeSkillProfile &&
      !action.isBlock &&
      activeSkillProfile.payloadKind === 'omnidirectional_nova_whirlwind'
    ) {
      const novaRadius = Math.max(30, Math.min(44, action.range || 36));
      state.bladeTrails.push({
        x: state.x,
        y: state.y,
        z: state.z,
        angle: aimAngle,
        arcSpan: Math.PI * 2,
        radius: novaRadius,
        innerRadius: arch.isMelee ? undefined : 8,
        width: 18,
        style: activeSkillProfile.visualStyle,
        color: trailColor,
        coreColor,
        life: 0.34,
        maxLife: 0.34,
      });
      for (const e of state.enemies) {
        if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
        if (Math.hypot(e.x - state.x, e.y - state.y) <= novaRadius + 4) {
          applyHitToEnemy(
            e,
            action.damage || 36,
            (action.damageType || weapon?.primaryDamageType || 'Wave') as DamageType,
            0.85,
            14,
            activeSkillProfile.extraArmorDent,
            novaRadius
          );
        }
      }
      ctx.spawnParticles(state.x, state.y, state.z + 8, 12, trailColor, action.name);
      if (arch.isMelee) {
        soundSystem.playSword();
      } else {
        soundSystem.playExplosion();
      }
      return;
    }

    // ─── SLOT 1: PRIMARY SPECIAL SKILL ───────────────────────────────────────
    if (slot === 1) {
      if (isSpearWeapon) {
        state.isBoosterDashing = true;
        state.boosterTimer = 0.14;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.28,
          radius: 46,
          length: 48,
          width: 12,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 48, 12, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Pierce', 0.55, 6);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 22,
          state.y + aim.dy * 22,
          state.z + 6,
          8,
          trailColor,
          action.name || 'IMPALING SKEWER!'
        );
        soundSystem.playSword();
      } else if (isLanceWeapon) {
        state.isBoosterDashing = true;
        state.boosterTimer = 0.12;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.3,
          radius: 46,
          length: 48,
          width: 14,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.28,
          maxLife: 0.28,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 46, 14, e.x, e.y)) {
            applyHitToEnemy(e, Math.round(action.damage * 0.65), action.damageType || 'Beam', 0.6, 8);
          }
        }
        state.projectiles.push({
          x: state.x + aim.dx * 12,
          y: state.y + aim.dy * 12,
          z: state.z + 6,
          vx: aim.dx * 168,
          vy: aim.dy * 168,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: action.damageType || 'Pierce',
          isPlayer: true,
          life: 0.92,
          radius: 5,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 28,
        });
        ctx.spawnParticles(
          state.x + aim.dx * 18,
          state.y + aim.dy * 18,
          state.z + 6,
          8,
          trailColor,
          action.name
        );
        soundSystem.playLaser();
      } else if (isStaffOrMaceWeapon) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.65,
          radius: 26,
          length: 18,
          width: 24,
          style: 'slam',
          color: trailColor,
          coreColor,
          life: 0.3,
          maxLife: 0.3,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInImpactZone(state.x, state.y, aimAngle, 18, 24, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Impact', 1.1, 8, 8);
          }
        }
        if (weapon?.supportPulseOnHit) {
          state.shields.overloaded = false;
          state.shields.capacity = Math.min(state.shields.maxCapacity, state.shields.capacity + 10);
          state.armor.durability = Math.min(state.armor.maxDurability, state.armor.durability + 6);
        }
        ctx.spawnParticles(
          state.x + aim.dx * 18,
          state.y + aim.dy * 18,
          state.z + 4,
          12,
          trailColor,
          action.name || 'OVERHEAD SLAM!'
        );
        soundSystem.playExplosion();
      } else if (isBladeWeapon || isDaggerWeapon) {
        state.isBoosterDashing = true;
        state.boosterTimer = isDaggerWeapon ? 0.16 : 0.14;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        const thrustLen = arch.isGreatsword || weapon?.weightClass === 'heavy' ? 44 : isDaggerWeapon ? 36 : 40;
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.3,
          radius: thrustLen,
          length: thrustLen,
          width: 11,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.25,
          maxLife: 0.25,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInThrustCorridor(state.x, state.y, aimAngle, thrustLen, 12, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Pierce', 0.55, 6);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 18,
          state.y + aim.dy * 18,
          state.z + 6,
          8,
          trailColor,
          action.name
        );
        soundSystem.playSword();
      } else if (isAxeWeapon) {
        state.isBoosterDashing = true;
        state.boosterTimer = 0.13;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        if (isHeavyAxe) {
          state.heat = Math.max(0, state.heat - 14);
        }
        state.bladeTrails.push({
          x: state.x + aim.dx * 6,
          y: state.y + aim.dy * 6,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.7,
          radius: isHeavyAxe ? 32 : 26,
          width: 18,
          style: 'chop',
          color: trailColor,
          coreColor,
          life: 0.28,
          maxLife: 0.28,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (
            isTargetInDirectionalArc(
              state.x,
              state.y,
              aimAngle,
              isHeavyAxe ? 34 : 30,
              Math.PI * 0.8,
              e.x,
              e.y
            )
          ) {
            applyHitToEnemy(
              e,
              action.damage,
              action.damageType || 'Impact',
              0.7,
              8,
              isHeavyAxe ? 8 : 5
            );
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 14,
          state.y + aim.dy * 14,
          state.z + 6,
          10,
          trailColor,
          action.name
        );
        soundSystem.playSword();
      } else if (arch.isShield) {
        const hasShieldChargeFeat = equippedFeats.some((f) =>
          ['shield_charge', 'shield_wall_advance', 'unstoppable_momentum'].includes(f)
        );
        const shieldRestore = isHeavyShield ? 35 : isLightShield ? 18 : 12;
        state.shields.overloaded = false;
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + shieldRestore
        );
        if (isMediumShield || isLightShield || hasShieldChargeFeat) {
          state.isBoosterDashing = true;
          state.boosterTimer = hasShieldChargeFeat ? 0.2 : 0.16;
          state.boosterDirX = aim.dx;
          state.boosterDirY = aim.dy;
        }
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: isHeavyShield ? Math.PI * 2 : Math.PI * 0.8,
          radius: isHeavyShield ? 30 : 28,
          width: 18,
          style: isHeavyShield ? 'shockwave' : 'bash',
          color: trailColor,
          coreColor,
          life: 0.28,
          maxLife: 0.28,
        });
        const chargeBonusMult = hasShieldChargeFeat ? 1.25 : 1.0;
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          const hit = isHeavyShield
            ? Math.hypot(e.x - state.x, e.y - state.y) <= 32
            : isTargetInDirectionalArc(state.x, state.y, aimAngle, 36, Math.PI * 0.9, e.x, e.y);
          if (hit) {
            applyHitToEnemy(
              e,
              Math.round(action.damage * chargeBonusMult),
              action.damageType || 'Impact',
              1.15,
              15
            );
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 8, 10, trailColor, action.name);
        soundSystem.playSword();
        if (hasGorgonsGaze) {
          triggerGorgonsGazeCone(state, ctx, aimAngle);
        }
      } else {
        const salvoCount = Math.max(1, action.ammoCount || (isRapidRotaryWeapon ? 4 : 1));
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * (salvoCount > 1 ? 0.55 : 0.45),
          radius: 16,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.18,
          maxLife: 0.18,
        });
        if (arch.isQuiverOrBandolier || isRapidRotaryWeapon) {
          if (arch.isQuiverOrBandolier) {
            state.ammo = Math.min(state.maxAmmo, state.ammo + 4);
            state.isReloading = false;
          }
          const count = Math.max(3, salvoCount);
          for (let idx = 0; idx < count; idx++) {
            const off = count > 1 ? (idx - (count - 1) / 2) * 0.08 : 0;
            const ang = aimAngle + off;
            state.projectiles.push({
              x: state.x + Math.cos(ang) * 8,
              y: state.y + Math.sin(ang) * 8,
              z: state.z + 6,
              vx: Math.cos(ang) * (152 - idx * 4),
              vy: Math.sin(ang) * (152 - idx * 4),
              vz: weaponShotProfile.lobVz || 0,
              damage: Math.round(action.damage * 0.52 * overdriveMult),
              damageType: action.damageType || 'Pierce',
              isPlayer: true,
              life: 1.02,
              initialLife: 1.02,
              radius: weaponShotProfile.projectileRadius,
              visualShape: weaponShotProfile.visualShape,
              waveSpanPx: weaponShotProfile.waveSpanPx,
              beamLengthPx: weaponShotProfile.beamLengthPx,
              chainCount: weaponShotProfile.chainCount,
              chainRangePx: weaponShotProfile.chainRangePx,
              pierceRemaining: weaponShotProfile.pierceRemaining,
              homingStrength: weaponShotProfile.homingStrength,
              color: trailColor,
              trailColor: coreColor,
              lightRadius: 20,
              projectileWeight: weaponInertiaSpec.projectileWeight,
            });
          }
        } else if (isExplosiveOrdnanceWeapon) {
          const locked = getLockedTarget(state);
          const aimVec = locked
            ? {
                dx: (locked.x - state.x) / (Math.hypot(locked.x - state.x, locked.y - state.y) || 1),
                dy: (locked.y - state.y) / (Math.hypot(locked.x - state.x, locked.y - state.y) || 1),
              }
            : aim;
          const baseOrdAng = Math.atan2(aimVec.dy, aimVec.dx);
          const ordCount = Math.min(3, salvoCount);
          const isMortarLob = weapon?.weightClass === 'medium' && arch.category === 'Casters';
          for (let idx = 0; idx < ordCount; idx++) {
            const off = ordCount > 1 ? (idx - (ordCount - 1) / 2) * 0.09 : 0;
            const ang = baseOrdAng + off;
            const ordSpeed = (isMortarLob ? 115 : 145) * (1 - idx * 0.05);
            state.projectiles.push({
              x: state.x + Math.cos(ang) * 10,
              y: state.y + Math.sin(ang) * 10,
              z: state.z + 7,
              vx: Math.cos(ang) * ordSpeed,
              vy: Math.sin(ang) * ordSpeed,
              vz: isMortarLob ? 18 : weaponShotProfile.lobVz || 6,
              damage: Math.round((action.damage * overdriveMult) / Math.pow(ordCount, 0.45)),
              damageType: 'Blast',
              isPlayer: true,
              life: 1.15,
              initialLife: 1.15,
              radius: Math.max(4.6, weaponShotProfile.projectileRadius),
              visualShape:
                weaponShotProfile.visualShape === 'rocket' ||
                weaponShotProfile.visualShape === 'bolide' ||
                weaponShotProfile.visualShape === 'nova_orb'
                  ? weaponShotProfile.visualShape
                  : 'blast_shell',
              homingStrength: weaponShotProfile.homingStrength,
              color: trailColor,
              trailColor: coreColor,
              lightRadius: 30,
              projectileWeight: weaponInertiaSpec.projectileWeight,
              onImpact(x, y, _z, st) {
                soundSystem.playExplosion();
                st.bladeTrails = st.bladeTrails || [];
                st.bladeTrails.push({
                  x,
                  y,
                  z: 0,
                  angle: 0,
                  arcSpan: Math.PI * 2,
                  radius: 30,
                  style: 'shockwave',
                  color: trailColor,
                  coreColor,
                  life: 0.26,
                  maxLife: 0.26,
                });
                for (const e of st.enemies) {
                  if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
                  if (Math.hypot(e.x - x, e.y - y) < 32) {
                    e.stun = Math.max(e.stun, 0.85);
                    applyDamageFn(
                      e.shields,
                      e.armor,
                      e.frame,
                      computeEnemyDamage(Math.round(action.damage * 0.65), e.faction, e, 'Blast'),
                      'Blast'
                    );
                  }
                }
              },
            });
          }
        } else {
          const isHeavyBeamOrRail =
            arch.isBow ||
            weapon?.weightClass === 'heavy' ||
            action.damageType === 'Beam';
          for (let idx = 0; idx < salvoCount; idx++) {
            const off = salvoCount > 1 ? (idx - (salvoCount - 1) / 2) * 0.065 : 0;
            const ang = aimAngle + off;
            const speed = (isHeavyBeamOrRail ? 174 : 154) * (1 - idx * 0.035);
            const perRoundDmg =
              salvoCount > 1
                ? Math.max(4, Math.round((action.damage * overdriveMult) / Math.pow(salvoCount, 0.55)))
                : Math.round(action.damage * overdriveMult);
            state.projectiles.push({
              x: state.x + Math.cos(ang) * 10,
              y: state.y + Math.sin(ang) * 10,
              z: state.z + 6,
              vx: Math.cos(ang) * speed,
              vy: Math.sin(ang) * speed,
              vz: weaponShotProfile.lobVz || 0,
              damage: perRoundDmg,
              damageType: action.damageType,
              isPlayer: true,
              life: 1.18,
              initialLife: 1.18,
              radius: weaponShotProfile.projectileRadius * 1.12,
              visualShape: weaponShotProfile.visualShape,
              waveSpanPx: weaponShotProfile.waveSpanPx,
              beamLengthPx: weaponShotProfile.beamLengthPx,
              chainCount: weaponShotProfile.chainCount,
              chainRangePx: weaponShotProfile.chainRangePx,
              pierceRemaining: weaponShotProfile.pierceRemaining,
              homingStrength: weaponShotProfile.homingStrength,
              color: trailColor,
              trailColor: coreColor,
              lightRadius: 28,
              projectileWeight: weaponInertiaSpec.projectileWeight,
            });
          }
        }
        soundSystem.playLaser();
      }
      return;
    }

    // ─── SLOT 2: TACTICAL SECONDARY / CONTROL SKILL ──────────────────────────
    if (slot === 2) {
      if (isStaffOrMaceWeapon) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 2,
          radius: 38,
          style: 'shockwave',
          color: trailColor,
          coreColor,
          life: 0.32,
          maxLife: 0.32,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (Math.hypot(e.x - state.x, e.y - state.y) <= 38) {
            applyHitToEnemy(
              e,
              action.damage,
              action.damageType || (weapon?.primaryDamageType === 'Impact' ? 'Blast' : 'Wave'),
              1.25,
              10,
              6
            );
          }
        }
        if (weapon?.supportPulseOnHit) {
          state.shields.overloaded = false;
          state.shields.capacity = Math.min(state.shields.maxCapacity, state.shields.capacity + 14);
          state.armor.durability = Math.min(state.armor.maxDurability, state.armor.durability + 8);
        }
        ctx.spawnParticles(state.x, state.y, state.z + 6, 12, trailColor, action.name);
        soundSystem.playExplosion();
      } else if (isLightShield) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.65,
          radius: 20,
          style: 'bash',
          color: trailColor,
          coreColor,
          life: 0.22,
          maxLife: 0.22,
        });
        state.projectiles.push({
          x: state.x + aim.dx * 10,
          y: state.y + aim.dy * 10,
          z: state.z + 6,
          vx: aim.dx * 128,
          vy: aim.dy * 128,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Impact',
          isPlayer: true,
          life: 0.92,
          initialLife: 0.92,
          radius: 5.0,
          visualShape: 'chakram',
          pierceRemaining: 1,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 24,
        });
        soundSystem.playSword();
      } else if (isHeavyShield) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.85,
          radius: 28,
          length: 16,
          width: 24,
          style: 'slam',
          color: trailColor,
          coreColor,
          life: 0.32,
          maxLife: 0.32,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInImpactZone(state.x, state.y, aimAngle, 16, 26, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Blast', 1.35, 12, 8);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 14,
          state.y + aim.dy * 14,
          state.z + 4,
          12,
          trailColor,
          action.name
        );
        soundSystem.playExplosion();
        if (hasGorgonsGaze) {
          triggerGorgonsGazeCone(state, ctx, aimAngle);
        }
      } else if (currentWeaponId === 'leg_lake_of_fire_knife') {
        // Glance of the Gatekeeper: searing frontal flash of infernal radiance (1.2s Stun + 2.5s Blind; widens when dual-wielding two Knives of the Lake of Fire)
        const s1Base = parseEquipmentInstanceId(state.equipmentSlots?.slot1).baseId;
        const s2Base = parseEquipmentInstanceId(state.equipmentSlots?.slot2).baseId;
        const isDualLakeOfFire =
          s1Base === 'leg_lake_of_fire_knife' &&
          s2Base === 'leg_lake_of_fire_knife' &&
          state.equipmentSlots?.mainGrip !== '2h';
        const coneReach = isDualLakeOfFire ? 46 : 38;
        const coneSpan = isDualLakeOfFire ? Math.PI * 1.35 : Math.PI * 0.9;
        soundSystem.playPowerup();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: coneSpan,
          radius: coneReach,
          width: isDualLakeOfFire ? 20 : 16,
          style: 'shockwave',
          color: '#fb923c',
          coreColor: '#fef08a',
          life: 0.32,
          maxLife: 0.32,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, coneReach, coneSpan + 0.15, e.x, e.y)) {
            e.preventResurrection = true;
            e.stun = Math.max(e.stun, 1.2);
            e.blindedTimer = Math.max(e.blindedTimer || 0, 2.5);
            triggerEntityFlash(e, '#fef08a', 0.28, 'sweet');
            applyHitToEnemy(
              e,
              action.damage || 30,
              action.damageType || 'Wave',
              1.2,
              10,
              4,
              coneReach
            );
            ctx.spawnParticles(e.x, e.y, e.z + 12, 8, '#fef08a', 'BLINDED! (2.5s)');
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 16,
          state.y + aim.dy * 16,
          state.z + 8,
          12,
          '#fb923c',
          isDualLakeOfFire ? 'TWIN GATEKEEPER GLANCE!' : 'GLANCE OF THE GATEKEEPER!'
        );
      } else if (isAxeWeapon) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: isHeavyAxe ? Math.PI * 0.95 : Math.PI * 0.58,
          radius: isHeavyAxe ? 32 : 28,
          width: 16,
          style: 'chop',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (
            isTargetInDirectionalArc(
              state.x,
              state.y,
              aimAngle,
              isHeavyAxe ? 36 : 32,
              Math.PI * 0.9,
              e.x,
              e.y
            )
          ) {
            applyHitToEnemy(
              e,
              action.damage,
              action.damageType || 'Impact',
              0.95,
              isHeavyAxe ? 10 : -12,
              6
            );
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 16,
          state.y + aim.dy * 16,
          state.z + 6,
          9,
          trailColor,
          action.name
        );
        soundSystem.playSword();
      } else if (isSpearWeapon) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 1.15,
          radius: 30,
          style: 'slash',
          color: trailColor,
          coreColor,
          life: 0.25,
          maxLife: 0.25,
        });
        const bounds = getActiveRoomBounds(state);
        state.x = Math.max(12, Math.min(bounds.widthPx - 12, state.x - aim.dx * 6));
        state.y = Math.max(12, Math.min(bounds.heightPx - 12, state.y - aim.dy * 6));
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 34, Math.PI * 1.2, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Wave', 1.1, 8);
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 6, 8, trailColor, action.name);
        soundSystem.playSword();
      } else if (
        isBladeWeapon ||
        isDaggerWeapon ||
        isMediumShield ||
        isLanceWeapon
      ) {
        soundSystem.playSword();
        const isHeaterSlam = isMediumShield;
        const reach = isLanceWeapon ? 40 : isHeaterSlam ? 28 : isDaggerWeapon ? 26 : 32;
        const span =
          isBladeWeapon && (arch.isGreatsword || weapon?.weightClass === 'heavy')
            ? Math.PI * 1.35
            : isHeaterSlam
              ? Math.PI * 0.95
              : Math.PI * 1.15;
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: span,
          radius: reach - 2,
          width: isHeaterSlam ? 18 : 14,
          style: isHeaterSlam ? 'bash' : 'slash',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        ctx.spawnParticles(state.x, state.y, state.z + 8, 10, trailColor, action.name);
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, reach, span + 0.15, e.x, e.y)) {
            if (arch.hasShieldBypassEdge || isDaggerWeapon) {
              e.speed = Math.max(12, e.speed * 0.65);
            }
            applyHitToEnemy(
              e,
              action.damage,
              action.damageType || 'Pierce',
              isHeaterSlam ? 1.25 : 0.85,
              isLanceWeapon ? 16 : 8
            );
          }
        }
      } else if (
        arch.isBow ||
        arch.isQuiverOrBandolier ||
        isRapidRotaryWeapon
      ) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.75,
          radius: 18,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.2,
          maxLife: 0.2,
        });
        const offsets =
          arch.isBow || isRapidRotaryWeapon
            ? [-0.26, -0.13, 0, 0.13, 0.26]
            : [-0.36, -0.18, 0, 0.18, 0.36];
        const speed = arch.isQuiverOrBandolier ? 105 : 138;
        const life = arch.isQuiverOrBandolier ? 0.56 : 0.88;
        for (const off of offsets) {
          const ang = aimAngle + off;
          state.projectiles.push({
            x: state.x + Math.cos(ang) * 8,
            y: state.y + Math.sin(ang) * 8,
            z: state.z + 6,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            vz: weaponShotProfile.lobVz || 0,
            damage: Math.round(action.damage * 0.6 * overdriveMult),
            damageType: action.damageType || 'Pierce',
            isPlayer: true,
            life,
            initialLife: life,
            radius: weaponShotProfile.projectileRadius,
            visualShape: weaponShotProfile.visualShape,
            waveSpanPx: weaponShotProfile.waveSpanPx,
            beamLengthPx: weaponShotProfile.beamLengthPx,
            chainCount: weaponShotProfile.chainCount,
            chainRangePx: weaponShotProfile.chainRangePx,
            pierceRemaining: weaponShotProfile.pierceRemaining,
            homingStrength: weaponShotProfile.homingStrength,
            color: trailColor,
            trailColor: coreColor,
            lightRadius: 16,
          });
        }
        soundSystem.playLaser();
      } else {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.45,
          radius: 15,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.18,
          maxLife: 0.18,
        });
        const slot2DmgType = action.damageType || 'Blast';
        state.projectiles.push({
          x: state.x + aim.dx * 8,
          y: state.y + aim.dy * 8,
          z: state.z + 8,
          vx: aim.dx * (slot2DmgType === 'Beam' || slot2DmgType === 'Pulse' ? 138 : 96),
          vy: aim.dy * (slot2DmgType === 'Beam' || slot2DmgType === 'Pulse' ? 138 : 96),
          vz: slot2DmgType === 'Blast' ? 20 : weaponShotProfile.lobVz || 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: slot2DmgType,
          isPlayer: true,
          life: 0.88,
          initialLife: 0.88,
          radius: slot2DmgType === 'Blast' ? 5.0 : weaponShotProfile.projectileRadius * 1.15,
          visualShape:
            slot2DmgType === 'Blast' && weaponShotProfile.visualShape === 'bolt'
              ? 'blast_shell'
              : weaponShotProfile.visualShape,
          waveSpanPx: weaponShotProfile.waveSpanPx,
          beamLengthPx: weaponShotProfile.beamLengthPx,
          chainCount: weaponShotProfile.chainCount,
          chainRangePx: weaponShotProfile.chainRangePx,
          pierceRemaining: weaponShotProfile.pierceRemaining,
          homingStrength: weaponShotProfile.homingStrength,
          color: gemVis.gemId ? trailColor : slot2DmgType === 'Blast' ? '#ea580c' : trailColor,
          trailColor: gemVis.gemId ? coreColor : slot2DmgType === 'Blast' ? '#f97316' : coreColor,
          lightRadius: 30,
          onImpact(x, y, _z, st) {
            soundSystem.playExplosion();
            st.bladeTrails = st.bladeTrails || [];
            st.bladeTrails.push({
              x,
              y,
              z: 0,
              angle: 0,
              arcSpan: Math.PI * 2,
              radius: 32,
              style: 'shockwave',
              color: gemVis.gemId ? trailColor : '#fb923c',
              coreColor,
              life: 0.28,
              maxLife: 0.28,
            });
            for (const e of st.enemies) {
              if (e.isSubmerged) continue;
              if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
              if (Math.hypot(e.x - x, e.y - y) < 36) {
                e.stun = 1.2;
                applyDamageFn(
                  e.shields,
                  e.armor,
                  e.frame,
                  computeEnemyDamage(action.damage, e.faction, e, slot2DmgType),
                  slot2DmgType
                );
              }
            }
          },
        });
        soundSystem.playLaser();
      }
      return;
    }

    // ─── SLOT 3 (SKILL 4): RULE P-10 ACTION 4 BLOCK VS. PARRY & KAAD OVERRIDES ───
    if (slot === 3) {
      const action4Profile = resolveActiveAction4DefensiveMode(state);

      if (action4Profile.overrideKind === 'kaad_iron_bind') {
        soundSystem.playSword();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.65,
          radius: 36,
          width: 16,
          style: 'bash',
          color: '#fb923c',
          coreColor: '#fde047',
          life: 0.28,
          maxLife: 0.28,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 42, Math.PI * 0.75, e.x, e.y)) {
            const pullDx = state.x + aim.dx * 14 - e.x;
            const pullDy = state.y + aim.dy * 14 - e.y;
            e.x += pullDx * 0.55;
            e.y += pullDy * 0.55;
            e.stun = Math.max(e.stun, 1.2);
            e.state = 'stagger';
            e.stateTimer = 1.2;
            e.stateMaxTimer = 1.2;
            applyHitToEnemy(e, Math.max(18, action.damage), 'Impact', 1.2, 6);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 12,
          state.y + aim.dy * 12,
          state.z + 8,
          10,
          '#fb923c',
          'IRON-BIND GRAPPLE (1.2S ROOT)'
        );
        return;
      }

      if (action4Profile.overrideKind === 'kaad_sanctified_palm') {
        soundSystem.playPowerup();
        state.shields.overloaded = false;
        state.shields.overloadTimer = 0;
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + 18
        );
        state.heat = Math.max(0, state.heat - 14);
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.9,
          radius: 34,
          width: 18,
          style: 'shockwave',
          color: '#fde047',
          coreColor: '#ffffff',
          life: 0.28,
          maxLife: 0.28,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 36, Math.PI * 0.9, e.x, e.y)) {
            applyHitToEnemy(e, Math.max(20, action.damage), 'Pulse', 1.0, 14);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 10,
          state.y + aim.dy * 10,
          state.z + 8,
          10,
          '#fde047',
          'SANCTIFIED PALM (+18 SHD)'
        );
        return;
      }

      if (action.isBlock || isBlockingWeapon(currentWeaponId)) {
        const isShieldEquip = arch.isShield;
        const isParryMode = action4Profile.mode === 'parry';
        // Mode B (Timed Parry) triggers a discrete 0.34s deflection window and cannot hold sustained block
        state.isHoldingBlock = !isParryMode;
        state.blockHoldTimer = 0;
        state.blockTimer = 0.34;
        state.blockingWeaponId = currentWeaponId;

        soundSystem.playSword();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: isShieldEquip ? Math.PI * 0.95 : Math.PI * 0.75,
          radius: isShieldEquip ? 24 : 20,
          width: isShieldEquip ? 16 : 13,
          style: isParryMode ? 'slash' : 'bash',
          color: isParryMode ? '#fde047' : '#38bdf8',
          coreColor: '#ffffff',
          life: 0.34,
          maxLife: 0.34,
        });

        ctx.spawnParticles(
          state.x + aim.dx * 10,
          state.y + aim.dy * 10,
          state.z + 8,
          8,
          isParryMode ? '#fde047' : '#38bdf8',
          isParryMode ? 'PARRY (0.34s DEFLECT)' : 'BLOCK (HELD GUARD)'
        );
      } else if (
        arch.isBow ||
        arch.isQuiverOrBandolier ||
        arch.isCatalystOrBattery
      ) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.4,
          radius: 16,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.18,
          maxLife: 0.18,
        });
        if (arch.isQuiverOrBandolier || arch.isCatalystOrBattery) {
          state.opticMarkTimer = 5.0;
        }
        state.projectiles.push({
          x: state.x + aim.dx * 9,
          y: state.y + aim.dy * 9,
          z: state.z + 6,
          vx: aim.dx * 145,
          vy: aim.dy * 145,
          vz: weaponShotProfile.lobVz || 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: action.damageType || 'Pierce',
          isPlayer: true,
          life: 1.05,
          initialLife: 1.05,
          radius: weaponShotProfile.projectileRadius,
          visualShape: weaponShotProfile.visualShape,
          waveSpanPx: weaponShotProfile.waveSpanPx,
          beamLengthPx: weaponShotProfile.beamLengthPx,
          chainCount: weaponShotProfile.chainCount,
          chainRangePx: weaponShotProfile.chainRangePx,
          pierceRemaining: weaponShotProfile.pierceRemaining,
          homingStrength: weaponShotProfile.homingStrength,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 24,
          onImpact(x, y, _z, st) {
            for (const e of st.enemies) {
              if (Math.hypot(e.x - x, e.y - y) < 22) {
                e.stun = 0.9;
                e.speed = Math.max(12, e.speed * 0.6);
              }
            }
          },
        });
        soundSystem.playLaser();
      } else {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.65,
          radius: 16,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.18,
          maxLife: 0.18,
        });
        for (const offset of [-0.24, -0.08, 0.08, 0.24]) {
          const ang = aimAngle + offset;
          state.projectiles.push({
            x: state.x + Math.cos(ang) * 8,
            y: state.y + Math.sin(ang) * 8,
            z: state.z + 6,
            vx: Math.cos(ang) * 124,
            vy: Math.sin(ang) * 124,
            vz: weaponShotProfile.lobVz || 0,
            damage: Math.round(action.damage * overdriveMult),
            damageType: action.damageType || 'Pierce',
            isPlayer: true,
            life: 0.92,
            initialLife: 0.92,
            radius: weaponShotProfile.projectileRadius,
            visualShape: weaponShotProfile.visualShape,
            waveSpanPx: weaponShotProfile.waveSpanPx,
            beamLengthPx: weaponShotProfile.beamLengthPx,
            chainCount: weaponShotProfile.chainCount,
            chainRangePx: weaponShotProfile.chainRangePx,
            pierceRemaining: weaponShotProfile.pierceRemaining,
            homingStrength: weaponShotProfile.homingStrength,
            color: trailColor,
            trailColor: coreColor,
            lightRadius: 16,
          });
        }
        soundSystem.playLaser();
      }
      return;
    }

    // ─── SLOT 4: HEAVY FINISHER SKILL ────────────────────────────────────────
    if (slot === 4) {
      if (isSpearWeapon) {
        soundSystem.playSword();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.3,
          radius: 38,
          length: 42,
          width: 11,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        state.projectiles.push({
          x: state.x + aim.dx * 12,
          y: state.y + aim.dy * 12,
          z: state.z + 6,
          vx: aim.dx * 165,
          vy: aim.dy * 165,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Pierce',
          isPlayer: true,
          life: 1.12,
          initialLife: 1.12,
          radius: 4.6,
          visualShape: 'javelin',
          pierceRemaining: 2,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 28,
        });
        ctx.spawnParticles(
          state.x + aim.dx * 16,
          state.y + aim.dy * 16,
          state.z + 6,
          10,
          trailColor,
          action.name
        );
      } else if (isStaffOrMaceWeapon) {
        soundSystem.playExplosion();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.8,
          radius: 26,
          length: 16,
          width: 24,
          style: 'slam',
          color: trailColor,
          coreColor,
          life: 0.32,
          maxLife: 0.32,
        });
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 2,
          radius: 42,
          style: 'shockwave',
          color: trailColor,
          coreColor,
          life: 0.36,
          maxLife: 0.36,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (Math.hypot(e.x - state.x, e.y - state.y) <= 44) {
            applyHitToEnemy(e, action.damage, 'Wave', 1.25, 12, 10);
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 8, 16, trailColor, action.name);
      } else if (isBladeWeapon && weapon?.weightClass !== 'light') {
        soundSystem.playSword();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 1.15,
          radius: 32,
          style: 'slash',
          color: trailColor,
          coreColor,
          life: 0.3,
          maxLife: 0.3,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 34, Math.PI * 1.25, e.x, e.y)) {
            applyHitToEnemy(e, Math.round(action.damage * 0.65), 'Wave', 0.8, 8);
          }
        }
        state.projectiles.push({
          x: state.x + aim.dx * 12,
          y: state.y + aim.dy * 12,
          z: state.z + 6,
          vx: aim.dx * 138,
          vy: aim.dy * 138,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Wave',
          isPlayer: true,
          life: 0.92,
          initialLife: 0.92,
          radius: 7.0,
          visualShape: 'wave',
          waveSpanPx: 22,
          pierceRemaining: 2,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 30,
        });
        ctx.spawnParticles(
          state.x + aim.dx * 14,
          state.y + aim.dy * 14,
          state.z + 8,
          12,
          trailColor,
          action.name
        );
      } else if (isLanceWeapon) {
        soundSystem.playLaser();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.35,
          radius: 54,
          length: 58,
          width: 16,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.34,
          maxLife: 0.34,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 58, 16, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Wave', 1.1, 14);
          }
        }
        state.projectiles.push({
          x: state.x + aim.dx * 14,
          y: state.y + aim.dy * 14,
          z: state.z + 6,
          vx: aim.dx * 168,
          vy: aim.dy * 168,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: weapon?.primaryDamageType === 'Beam' ? 'Beam' : 'Wave',
          isPlayer: true,
          life: 1.12,
          initialLife: 1.12,
          radius: weapon?.primaryDamageType === 'Beam' ? 4.6 : 6.8,
          visualShape: weapon?.primaryDamageType === 'Beam' ? 'beam' : 'wave',
          beamLengthPx: weapon?.primaryDamageType === 'Beam' ? 42 : undefined,
          waveSpanPx: weapon?.primaryDamageType === 'Beam' ? undefined : 22,
          pierceRemaining: 2,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 34,
        });
        ctx.spawnParticles(state.x, state.y, state.z + 8, 14, trailColor, action.name);
      } else if (arch.isShield) {
        soundSystem.playExplosion();
        state.shields.overloaded = false;
        state.shields.overloadTimer = 0;
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + 25
        );
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.9,
          radius: 30,
          width: 22,
          style: 'bash',
          color: trailColor,
          coreColor,
          life: 0.3,
          maxLife: 0.3,
        });
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 2,
          radius: 36,
          style: 'shockwave',
          color: trailColor,
          coreColor,
          life: 0.32,
          maxLife: 0.32,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (Math.hypot(e.x - state.x, e.y - state.y) <= 38) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Wave', 1.3, 14);
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 8, 14, trailColor, action.name);
        if (hasGorgonsGaze) {
          triggerGorgonsGazeCone(state, ctx, aimAngle);
        }
      } else if (isMeleeOrShield) {
        soundSystem.playSword();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 2,
          radius: 30,
          style: 'whirlwind',
          color: trailColor,
          coreColor,
          life: 0.34,
          maxLife: 0.34,
        });
        ctx.spawnParticles(state.x, state.y, state.z + 8, 14, trailColor, action.name);
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (Math.hypot(e.x - state.x, e.y - state.y) <= 34) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Pierce', 1.0, 8);
          }
        }
      } else if (arch.isQuiverOrBandolier) {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.85,
          radius: 20,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.24,
          maxLife: 0.24,
        });
        for (const off of [-0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36]) {
          const ang = aimAngle + off;
          state.projectiles.push({
            x: state.x + Math.cos(ang) * 8,
            y: state.y + Math.sin(ang) * 8,
            z: state.z + 6,
            vx: Math.cos(ang) * 148,
            vy: Math.sin(ang) * 148,
            vz: weaponShotProfile.lobVz || 0,
            damage: Math.round(action.damage * 0.6 * overdriveMult),
            damageType: 'Pierce',
            isPlayer: true,
            life: 1.0,
            initialLife: 1.0,
            radius: weaponShotProfile.projectileRadius,
            visualShape: weaponShotProfile.visualShape,
            waveSpanPx: weaponShotProfile.waveSpanPx,
            color: trailColor,
            trailColor: coreColor,
            lightRadius: 18,
          });
        }
        soundSystem.playLaser();
      } else {
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.5,
          radius: 18,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.22,
          maxLife: 0.22,
        });
        state.projectiles.push({
          x: state.x + aim.dx * 10,
          y: state.y + aim.dy * 10,
          z: state.z + 6,
          vx: aim.dx * 168,
          vy: aim.dy * 168,
          vz: weaponShotProfile.lobVz || 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: action.damageType || 'Beam',
          isPlayer: true,
          life: 1.12,
          initialLife: 1.12,
          radius: weaponShotProfile.projectileRadius * 1.2,
          visualShape: weaponShotProfile.visualShape,
          waveSpanPx: weaponShotProfile.waveSpanPx,
          beamLengthPx: weaponShotProfile.beamLengthPx,
          chainCount: weaponShotProfile.chainCount,
          chainRangePx: weaponShotProfile.chainRangePx,
          pierceRemaining: Math.max(1, weaponShotProfile.pierceRemaining || 0),
          homingStrength: weaponShotProfile.homingStrength,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 32,
          onImpact:
            arch.isBow || isExplosiveOrdnanceWeapon
              ? (x, y, _z, st) => {
                  soundSystem.playExplosion();
                  st.bladeTrails = st.bladeTrails || [];
                  st.bladeTrails.push({
                    x,
                    y,
                    z: 0,
                    angle: 0,
                    arcSpan: Math.PI * 2,
                    radius: 30,
                    style: 'shockwave',
                    color: trailColor,
                    coreColor,
                    life: 0.28,
                    maxLife: 0.28,
                  });
                }
              : undefined,
        });
        soundSystem.playLaser();
      }
      return;
    }
  }

  // 2. DEFENSIVE & HARDWARE MODULE ACTIONS
  if (actionId === 'mod_head_optic_scan') {
    state.opticMarkTimer = 6.0;
    for (const e of state.enemies) {
      if (e.type === 'bog_wurm') e.isSubmerged = false;
    }
    soundSystem.playPowerup();
    ctx.spawnParticles(state.x, state.y, state.z + 10, 10, '#38bdf8', 'OPTIC MARK +25%');
    return;
  }

  if (actionId === 'mod_torso_reactive_burst') {
    state.armor.durability = Math.min(
      state.armor.maxDurability,
      state.armor.durability + 22
    );
    soundSystem.playHeal();
    state.bladeTrails = state.bladeTrails || [];
    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: 0,
      arcSpan: Math.PI * 2,
      radius: 34,
      style: 'shockwave',
      color: '#ffd27d',
      coreColor: '#fef08a',
      life: 0.28,
      maxLife: 0.28,
    });
    ctx.spawnParticles(state.x, state.y, state.z + 8, 12, '#ffd27d', '+22 ARMOR');
    for (const e of state.enemies) {
      if (e.isSubmerged) continue;
      if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
      if (Math.hypot(e.x - state.x, e.y - state.y) < 36) {
        e.stun = 1.1;
        applyDamageFn(
          e.shields,
          e.armor,
          e.frame,
          computeEnemyDamage(desc.damage, e.faction),
          'Impact'
        );
      }
    }
    return;
  }

  if (actionId === 'mod_arms_shock_grapple') {
    state.projectiles.push({
      x: state.x + aim.dx * 10,
      y: state.y + aim.dy * 10,
      z: state.z + 6,
      vx: aim.dx * 148,
      vy: aim.dy * 148,
      vz: 0,
      damage: Math.round(desc.damage * overdriveMult),
      damageType: 'Pulse',
      isPlayer: true,
      life: 1.0,
      radius: 4.5,
      color: '#38bdf8',
      trailColor: '#7dd3fc',
      lightRadius: 26,
      onImpact(x, y, _z, st) {
        for (const e of st.enemies) {
          if (Math.hypot(e.x - x, e.y - y) < 22) {
            e.stun = 1.2;
          }
        }
      },
    });
    soundSystem.playLaser();
    return;
  }

  if (actionId === 'mod_legs_seismic_stomp') {
    soundSystem.playExplosion();
    state.bladeTrails = state.bladeTrails || [];
    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: aimAngle,
      arcSpan: Math.PI * 2,
      radius: 36,
      length: 0,
      width: 34,
      style: 'slam',
      color: '#fb923c',
      coreColor: '#ffedd5',
      life: 0.3,
      maxLife: 0.3,
    });
    ctx.spawnParticles(state.x, state.y, state.z + 4, 14, '#fb923c', 'SEISMIC SLAM!');
    for (const e of state.enemies) {
      if (e.isSubmerged) continue;
      if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
      const dist = Math.hypot(e.x - state.x, e.y - state.y);
      if (dist < 38) {
        e.stun = 1.3;
        applyDamageFn(
          e.shields,
          e.armor,
          e.frame,
          computeEnemyDamage(desc.damage, e.faction),
          'Impact'
        );
      }
    }
    return;
  }

  // 3. REACTOR & CORE ABILITIES
  if (actionId === 'reactor_thermal_vent') {
    soundSystem.playPowerup();
    state.bladeTrails = state.bladeTrails || [];
    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: 0,
      arcSpan: Math.PI * 2,
      radius: 32,
      style: 'shockwave',
      color: '#f97316',
      coreColor: '#fed7aa',
      life: 0.28,
      maxLife: 0.28,
    });
    ctx.spawnParticles(state.x, state.y, state.z + 8, 12, '#f97316', '-45 HEAT VENT');
    for (const e of state.enemies) {
      if (e.isSubmerged) continue;
      if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
      if (Math.hypot(e.x - state.x, e.y - state.y) < 34) {
        applyDamageFn(
          e.shields,
          e.armor,
          e.frame,
          computeEnemyDamage(desc.damage, e.faction),
          'Wave'
        );
      }
    }
    return;
  }

  if (actionId === 'reactor_overdrive') {
    state.overdriveTimer = 6.0;
    state.isReloading = false;
    state.ammo = state.maxAmmo;
    soundSystem.playPowerup();
    ctx.spawnParticles(state.x, state.y, state.z + 10, 12, '#c084fc', 'OVERDRIVE +30%');
    return;
  }

  if (actionId === 'reactor_aegis_pulse') {
    state.shields.overloaded = false;
    state.shields.overloadTimer = 0;
    state.shields.capacity = Math.min(
      state.shields.maxCapacity,
      state.shields.capacity + 35
    );
    state.bladeTrails = state.bladeTrails || [];
    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: 0,
      arcSpan: Math.PI * 2,
      radius: 28,
      style: 'shockwave',
      color: '#77c7ff',
      coreColor: '#e0f2fe',
      life: 0.26,
      maxLife: 0.26,
    });
    soundSystem.playHeal();
    ctx.spawnParticles(state.x, state.y, state.z + 8, 12, '#77c7ff', '+35 SHIELD');
    return;
  }

  // 4. CLASS UTILITY SLOT (ACTION 6 · UNLOCKED AT LEVEL 6)
  if (desc.sourceCategory === 'utility' || actionId === 'class_utility_slot') {
    const utilDef = getClassUtilityDefinition(
      state.equipmentSlots?.utility,
      state.traitLine
    );
    if (utilDef.shieldRestore > 0) {
      state.shields.overloaded = false;
      state.shields.overloadTimer = 0;
      state.shields.capacity = Math.min(
        state.shields.maxCapacity,
        state.shields.capacity + utilDef.shieldRestore
      );
    }
    if (utilDef.armorRestore > 0) {
      state.armor.durability = Math.min(
        state.armor.maxDurability,
        state.armor.durability + utilDef.armorRestore
      );
    }
    if (utilDef.energyRestore > 0) {
      state.energy = Math.min(state.maxEnergy, state.energy + utilDef.energyRestore);
    }
    if (utilDef.grantsOverdriveSec) {
      state.overdriveTimer = Math.max(
        state.overdriveTimer || 0,
        utilDef.grantsOverdriveSec
      );
    }
    if (utilDef.grantsOpticMarkSec) {
      state.opticMarkTimer = Math.max(
        state.opticMarkTimer || 0,
        utilDef.grantsOpticMarkSec
      );
    }
    if (
      (state.equippedFeats || []).includes('veil_of_mercy') &&
      (state.revealedTimer || 0) <= 0
    ) {
      state.stealthDrTimer = 2.5;
    }
    soundSystem.playHeal();
    ctx.spawnParticles(
      state.x,
      state.y,
      state.z + 10,
      14,
      '#4ade80',
      `${utilDef.shortLabel} ONLINE`
    );
    return;
  }

  // 5. BELT SLOTS 1–4 (ACTIONS 7–10 · CONSUMABLE TACTICAL ITEMS)
  if (desc.sourceCategory === 'belt' && typeof desc.beltSlotIndex === 'number') {
    const idx = desc.beltSlotIndex;
    const itemId = state.equipmentSlots?.belt?.[idx];
    if (!itemId) return;
    const invIdx = state.inventorySlots.findIndex((s) => s.itemId === itemId);
    const itemDef = getItemDefinition(itemId);
    if (invIdx < 0 || !itemDef) {
      ctx.say(`BELT SLOT ${idx + 1} DEPLETED`);
      return;
    }

    const used = itemDef.onUse
      ? itemDef.onUse(state, { say: ctx.say, sound: ctx.sound })
      : false;
    if (used) {
      state.inventorySlots[invIdx].count -= 1;
      if (state.inventorySlots[invIdx].count <= 0) {
        state.inventorySlots.splice(invIdx, 1);
      }
      ctx.spawnParticles(
        state.x,
        state.y,
        state.z + 8,
        10,
        itemDef.iconColor || '#fbbf24',
        itemDef.name.toUpperCase()
      );
      notifyOrionStateChange();
    }
  }
}

/**
 * Executes `updateActionTimers` (update action timers) in `skillExecution.ts`. Mutates `state: OrionState`.
 */
export function updateActionTimers(state: OrionState, dt: number): void {
  const reloadMult = (state.overdriveTimer || 0) > 0 ? 1.6 : 1.0;

  if (state.actionCooldowns) {
    for (const key of Object.keys(state.actionCooldowns)) {
      if (state.actionCooldowns[key] > 0 && (state.skillActiveTimers?.[key] || 0) <= 0) {
        const isReloadingKey = (state.skillReloadTimers?.[key] || 0) > 0;
        const rate = isReloadingKey ? reloadMult : 1.0;
        state.actionCooldowns[key] = Math.max(0, state.actionCooldowns[key] - dt * rate);
      }
    }
  }

  if (state.skillReloadTimers) {
    for (const key of Object.keys(state.skillReloadTimers)) {
      if (state.skillReloadTimers[key] > 0) {
        state.skillReloadTimers[key] = Math.max(
          0,
          state.skillReloadTimers[key] - dt * reloadMult
        );
      }
    }
  }

  if (state.skillActiveTimers) {
    for (const key of Object.keys(state.skillActiveTimers)) {
      const prev = state.skillActiveTimers[key];
      if (prev > 0) {
        state.skillActiveTimers[key] = Math.max(0, prev - dt);
      }
    }
  }

  if (state.isHoldingBlock) {
    state.blockHoldTimer = (state.blockHoldTimer || 0) + dt;
    state.blockTimer = Math.max(state.blockTimer || 0, 0.08);
  } else if (state.blockTimer && state.blockTimer > 0) {
    state.blockTimer = Math.max(0, state.blockTimer - dt);
    if (state.blockTimer <= 0) {
      state.blockingWeaponId = null;
      state.blockHoldTimer = 0;
    }
  }

  if (state.overdriveTimer && state.overdriveTimer > 0) {
    state.overdriveTimer = Math.max(0, state.overdriveTimer - dt);
  }
  if (state.opticMarkTimer && state.opticMarkTimer > 0) {
    state.opticMarkTimer = Math.max(0, state.opticMarkTimer - dt);
  }
  // Phantom Sniper balance rule: charging any weapon prevents stealth; attack press/release sets 0.75s Revealed debuff
  if (state.isChargingBow) {
    state.revealedTimer = Math.max(state.revealedTimer || 0, 0.75);
  } else if (state.revealedTimer && state.revealedTimer > 0) {
    state.revealedTimer = Math.max(0, state.revealedTimer - dt);
  }
  if (state.stealthDrTimer && state.stealthDrTimer > 0) {
    state.stealthDrTimer = Math.max(0, state.stealthDrTimer - dt);
  }
}

// ─── 2. WEAPON STANCE, AUXILIARY SWAPS & RESOLVED SKILL SLOTS ────────────────

/**
 * Type contract for `ActiveWeaponStanceSummary` (active weapon stance summary) in `skillExecution.ts`.
 */
export interface ActiveWeaponStanceSummary {
  stance: WeaponStanceType;
  grip: '1h' | '2h';
  label: string;
  shortTag: string;
  description: string;
  specialistStance?: ActiveSpecialistStanceEvaluation;
  actionGridRow: {
    ac1: boolean;
    ac2: boolean;
    ac3: boolean;
    ac4: boolean;
    ac5: boolean;
  };
}

/**
 * Executes `getActiveWeaponStance` (get active weapon stance) in `skillExecution.ts`.
 */
export function getActiveWeaponStance(state: OrionState): ActiveWeaponStanceSummary {
  const slot1Id =
    state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster';
  const slot2Id = state.equipmentSlots?.slot2 || null;
  const slot3Id = state.equipmentSlots?.slot3 || null;

  const w1 = getWeaponDefinition(slot1Id);
  const w2 = slot2Id ? getWeaponDefinition(slot2Id) : undefined;
  const item2 = slot2Id && !w2 ? getItemDefinition(slot2Id) : undefined;
  const w3 = slot3Id ? getWeaponDefinition(slot3Id) : undefined;

  const grip = getEffectiveMainGrip(state);
  const is2HWeapon = isTwoHandOnlyWeapon(w1, state);
  const isAuxActive = Boolean(state.equipmentSlots?.auxActive && w3 && slot3Id);
  const specEval = evaluateActiveSpecialistStance(state);

  if (isAuxActive && w3) {
    const sideHolsteredNote =
      w2 && (grip === '2h' || is2HWeapon) ? ` · Side [${w2.name}] Holstered` : '';
    return {
      stance: 'main_aux',
      grip,
      label: 'BACK LAUNCHER OWNERSHIP',
      shortTag: 'BACK AUX [AC4–5]',
      description: `${w1?.name || slot1Id} (ac1–ac3) + Back Launcher ${w3.name} (ac4–ac5)${sideHolsteredNote}`,
      specialistStance: specEval,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: true,
        ac5: true,
      },
    };
  }

  if (specEval.active && specEval.stance) {
    return {
      stance: w2 && isAuxiliaryEquipment(w2) ? 'main_aux' : 'unpaired',
      grip: grip === '2h' ? '2h' : '1h',
      label: specEval.stance.stanceName.toUpperCase(),
      shortTag: specEval.stance.shortTag,
      description: `${specEval.stance.featName}: ${specEval.stance.doctrineSummary}`,
      specialistStance: specEval,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: true,
        ac5: true,
      },
    };
  }

  if (grip === '2h' || is2HWeapon) {
    const holsteredSuffix =
      w2 && slot2Id !== slot1Id ? ` · Side [${w2.name}] Holstered` : '';
    return {
      stance: 'power_2h',
      grip: '2h',
      label: 'TWO-HANDING, POWER STANCE',
      shortTag: w2 && slot2Id !== slot1Id ? '2H (SIDE HOLSTERED)' : '2H POWER',
      description: `${w1?.name || slot1Id} (2H) → ac1–ac5 = ${
        w1?.name || slot1Id
      } Skill 1–5${holsteredSuffix}`,
      specialistStance: specEval,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: true,
        ac5: true,
      },
    };
  }

  if (item2 && slot2Id) {
    const auxProvidesAc4 = Boolean(w3 && isAuxiliaryEquipment(w3));
    return {
      stance: 'main_consumable',
      grip,
      label: 'SWAPPED CONSUMABLE STANCE',
      shortTag: 'CONSUMABLE [AC5]',
      description: `${w1?.name || slot1Id} (ac1–ac3)${
        w3 && isAuxiliaryEquipment(w3) ? ` + ${w3.name} (ac4)` : ''
      } + ${item2.name} (ac5)`,
      specialistStance: specEval,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: auxProvidesAc4,
        ac5: true,
      },
    };
  }

  if (w2 && isAuxiliaryEquipment(w2)) {
    return {
      stance: 'main_aux',
      grip: '1h',
      label: '1H + SHIELD STANCE',
      shortTag: '1H + SHIELD',
      description: `${w1?.name || slot1Id} (ac1–ac3) + ${w2.name} (ac4–ac5)`,
      specialistStance: specEval,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: true,
        ac5: true,
      },
    };
  }

  if (
    w1 &&
    getActiveLegendaryEngineHooks(state, slot1Id).has('TWIN_BLADE_DUAL_EXECUTION')
  ) {
    const fusedTitle = getEquipmentDisplayName(slot1Id, state);
    return {
      stance: 'paired',
      grip: '1h',
      label: 'TWIN-BLADE FUSED KATANA STANCE',
      shortTag: 'TWIN KATANA',
      description: `${fusedTitle} (Masamune + Muramasa Fused Pair · 16 WT) → ac1–ac5 active with simultaneous dual strikes`,
      specialistStance: specEval,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: true,
        ac5: true,
      },
    };
  }

  if (
    w1 &&
    w2 &&
    isTrueWeaponEquipment(w1) &&
    isTrueWeaponEquipment(w2) &&
    w1.name === w2.name &&
    getOwnedWeaponCount(state, slot1Id) >= 2
  ) {
    return {
      stance: 'paired',
      grip: '1h',
      label: 'DUAL-WIELD, PAIRED STANCE',
      shortTag: 'DW PAIRED',
      description: `Main & Side match (${w1.name}, 2 separate items) → ac1–ac5 = ${w1.name} Skill 1–5`,
      specialistStance: specEval,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: true,
        ac5: true,
      },
    };
  }

  if (w1 && w2 && isTrueWeaponEquipment(w2) && slot2Id !== slot1Id) {
    return {
      stance: 'unpaired',
      grip: '1h',
      label: 'DUAL-WIELD, UNPAIRED STANCE',
      shortTag: 'DW UNPAIRED',
      description: `ac1–ac3 = ${w1.name} Skill 1–3 · ac4 = ${w2.name} Skill 2 · ac5 = ${w2.name} Skill 3`,
      specialistStance: specEval,
      actionGridRow: {
        ac1: true,
        ac2: true,
        ac3: true,
        ac4: true,
        ac5: true,
      },
    };
  }

  return {
    stance: 'single_1h',
    grip: '1h',
    label: 'ONE-HANDED GRIP (SINGLE)',
    shortTag: '1H SINGLE',
    description: `${w1?.name || slot1Id} (1H) → ac1–ac3 active, ac4–ac5 inactive`,
    specialistStance: specEval,
    actionGridRow: {
      ac1: true,
      ac2: true,
      ac3: true,
      ac4: false,
      ac5: false,
    },
  };
}

/**
 * Executes `performAuxiliarySwap` (perform auxiliary swap) in `skillExecution.ts`. Mutates `state: OrionState`.
 * Launchers in `slot3` (Aux Back) never move to `slot2` (Side Hand) when swapped to — they stay mounted on the back
 * and toggle active ownership (`slots.auxActive`) of Skills 4 and 5.
 */
export function performAuxiliarySwap(
  state: OrionState,
  ctx?: { say: (text: string) => void },
  bypassCooldown: boolean = false
): boolean {
  if (!bypassCooldown && state.gates && !state.gates.canWeaponSwap) {
    soundSystem.playMenuBeep();
    ctx?.say('WEAPON SWAP LOCKED — INTERACT WITH THE POE [3,0] OR BEDIVERE [S] (LVL 2)');
    notifyOrionStateChange();
    return false;
  }

  if (!bypassCooldown && state.weaponSwapCooldown > 0) {
    soundSystem.playMenuBeep();
    ctx?.say(`SWAP COOLDOWN: ${state.weaponSwapCooldown.toFixed(1)}s`);
    notifyOrionStateChange();
    return false;
  }

  const slots = state.equipmentSlots;
  if (!slots) return false;

  const slot1 = slots.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster';
  const slot2 = slots.slot2 || null;
  const slot3 = slots.slot3 || null;

  if (!slot2 && !slot3) {
    soundSystem.playMenuBeep();
    ctx?.say('SIDE & AUXILIARY SLOTS EMPTY — NOTHING TO SWAP');
    notifyOrionStateChange();
    return false;
  }

  let swapMessage = '';
  if (slot3) {
    // Back Launcher (`slot3`) stays on the back and toggles active ownership of Skills 4 & 5 (`auxActive`)
    slots.auxActive = !slots.auxActive;
    const auxName =
      getWeaponDefinition(slot3)?.name || getItemDefinition(slot3)?.name || slot3;
    if (slots.auxActive) {
      swapMessage = `BACK LAUNCHER ACTIVE: [${auxName.toUpperCase()}] OWNS SKILLS 4 & 5 (STAYING ON BACK)`;
    } else {
      const is2H = getEffectiveMainGrip(state) === '2h';
      if (is2H) {
        const mainName = getWeaponDefinition(slot1)?.name || slot1;
        const sideNote = slot2
          ? ` · SIDE [${(getWeaponDefinition(slot2)?.name || slot2).toUpperCase()}] HOLSTERED`
          : '';
        swapMessage = `RETURNED TO 2H MAIN: [${mainName.toUpperCase()}] OWNS SKILLS 1–5${sideNote}`;
      } else if (slot2) {
        const sideName =
          getWeaponDefinition(slot2)?.name || getItemDefinition(slot2)?.name || slot2;
        swapMessage = `RETURNED TO SIDE HAND: [${sideName.toUpperCase()}] OWNS SKILLS 4 & 5 (LAUNCHER ON BACK)`;
      } else {
        const mainName = getWeaponDefinition(slot1)?.name || slot1;
        swapMessage = `RETURNED TO MAIN HAND: [${mainName.toUpperCase()}]`;
      }
    }
  } else if (slot2) {
    // No Back Launcher equipped: if Main weapon supports 1H/2H toggle, toggle grip (holstering/unholstering Side weapon)
    if (isTwoHandOnlyWeapon(slot1, state)) {
      soundSystem.playMenuBeep();
      ctx?.say('BACK AUXILIARY SLOT EMPTY & MAIN WEAPON REQUIRES 2H GRIP');
      notifyOrionStateChange();
      return false;
    }
    slots.mainGrip = slots.mainGrip === '2h' ? '1h' : '2h';
    slots.auxActive = false;
    const sideName =
      getWeaponDefinition(slot2)?.name || getItemDefinition(slot2)?.name || slot2;
    swapMessage =
      slots.mainGrip === '2h'
        ? `2H POWER STANCE: SIDE [${sideName.toUpperCase()}] HOLSTERED`
        : `1H STANCE: SIDE [${sideName.toUpperCase()}] UNHOLSTERED`;
  }

  state.equippedWeapons = [
    slots.slot1,
    slots.slot2,
    slots.slot3,
  ].filter(Boolean) as string[];
  state.activeWeaponIndex = 0;

  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const swapPenaltyMult = state.gates?.loadPenalty?.swapTimeMult ?? 1.0;
  const swapModMult =
    (getWeaponGemCombatModifiers(state, slot1).modificationProfile?.statModifiers
      .swapTimeMultiplier ?? 1.0) *
    (slot2
      ? (getWeaponGemCombatModifiers(state, slot2).modificationProfile?.statModifiers
          .swapTimeMultiplier ?? 1.0)
      : 1.0);

  if (!bypassCooldown) {
    state.weaponSwapCooldown =
      WEAPON_SWAP_COOLDOWN *
      swapPenaltyMult *
      featMods.swapTimeMult *
      clampTempoMultiplier(swapModMult);
  }

  state.activeSkillSlot = null;
  state.activeActionId = null;
  state.skillTellTimer = 0;
  state.skillActionTimer = 0;

  soundSystem.playPowerup();
  ctx?.say(swapMessage);
  notifyOrionStateChange();
  return true;
}

/**
 * Type contract for `ResolvedCombatSkill` (resolved combat skill) in `skillExecution.ts`.
 */
export interface ResolvedCombatSkill {
  id: string;
  cooldownKey: string;
  slotIndex: 1 | 2 | 3 | 4 | 5;
  name: string;
  shortLabel: string;
  sourceCategory: 'weapon' | 'belt' | 'utility';
  sourceSlotName: string;
  weaponId?: string;
  weaponMovesetSlot?: number;
  itemId?: string;
  itemCount?: number;
  damage?: number;
  damageType?: DamageType;
  heatCost?: number;
  cooldownSec?: number;
  currentCooldown: number;
  activatesReloadState?: boolean;
  isChain?: boolean;
  noReload?: boolean;
  isChargeable?: boolean;
  maxChargeSec?: number;
  ammoCount?: number;
  internalCharges?: number;
  remainingCharges?: number;
  comboStep?: number;
  comboLength?: number;
  comboSequence?: import('../../types').MeleeComboStepSpec[];
  activeDurationSec?: number;
  reloadDurationSec?: number;
  activeRemaining?: number;
  isReloading?: boolean;
  isBlock?: boolean;
  description?: string;
  available: boolean;
  unavailableReason?: string;
}

/**
 * Type contract for `ResolvedCombatSkills` (resolved combat skills) in `skillExecution.ts`.
 */
export interface ResolvedCombatSkills {
  skill1: ResolvedCombatSkill | null;
  skill2: ResolvedCombatSkill | null;
  skill3: ResolvedCombatSkill | null;
  skill4: ResolvedCombatSkill | null;
  skill5: ResolvedCombatSkill | null;
}

/**
 * Executes `getSkillCooldownKey` (get skill cooldown key) in `skillExecution.ts`.
 */
export function getSkillCooldownKey(
  weaponOrItemId: string,
  movesetSlot?: number,
  instancePrefix: string = 'wpn'
): string {
  if (movesetSlot === undefined) {
    return `item:${weaponOrItemId}`;
  }
  return `${instancePrefix}:${weaponOrItemId}:s${movesetSlot}`;
}

/**
 * Executes `getResolvedCombatSkills` (get resolved combat skills) in `skillExecution.ts`.
 */
export function getResolvedCombatSkills(state: OrionState): ResolvedCombatSkills {
  const slot1Id =
    state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster';
  const slot2Id = state.equipmentSlots?.slot2 || null;
  const slot3Id = state.equipmentSlots?.slot3 || null;

  const w1 = getWeaponDefinition(slot1Id);
  const w2 = slot2Id ? getWeaponDefinition(slot2Id) : undefined;
  const item2 = slot2Id && !w2 ? getItemDefinition(slot2Id) : undefined;
  const w3 = slot3Id ? getWeaponDefinition(slot3Id) : undefined;

  const mainGrip = getEffectiveMainGrip(state);
  const is2HWeapon = isTwoHandOnlyWeapon(w1, state);
  const isAuxActive = Boolean(state.equipmentSlots?.auxActive && w3 && slot3Id);
  const specEval = evaluateActiveSpecialistStance(state);
  const isPowerStance2H =
    !isAuxActive && !specEval.active && (mainGrip === '2h' || is2HWeapon);
  const isFusedTwinBladeKatana = Boolean(
    w1 && getActiveLegendaryEngineHooks(state, slot1Id).has('TWIN_BLADE_DUAL_EXECUTION')
  );
  const isPairedStance =
    !isAuxActive &&
    !isPowerStance2H &&
    (isFusedTwinBladeKatana ||
      Boolean(
        w1 &&
          w2 &&
          isTrueWeaponEquipment(w1) &&
          isTrueWeaponEquipment(w2) &&
          w1.name === w2.name &&
          getOwnedWeaponCount(state, slot1Id) >= 2
      ));
  const isUnpairedStance =
    !isAuxActive &&
    !isPowerStance2H &&
    !isPairedStance &&
    Boolean(w1 && w2 && isTrueWeaponEquipment(w2) && slot2Id !== slot1Id);
  const isSideAuxiliary =
    !isAuxActive && !isPowerStance2H && Boolean(w2 && isAuxiliaryEquipment(w2));
  const isAuxlAuxiliary = Boolean(w3 && isAuxiliaryEquipment(w3));

  const getItemCount = (itemId: string) => {
    const inv = state.inventorySlots.find((s) => s.itemId === itemId);
    return inv ? inv.count : 0;
  };

  const buildWeaponSkill = (
    actionId: string,
    slotIndex: 1 | 2 | 3 | 4 | 5,
    weaponId: string,
    weaponDef: ReturnType<typeof getWeaponDefinition>,
    movesetSlot: number,
    sourceSlotName: string,
    instancePrefix: string = 'wpn',
    moveOverride?: ActionDefinition
  ): ResolvedCombatSkill => {
    const m = moveOverride || weaponDef?.moveset[movesetSlot];
    const cooldownKey = getSkillCooldownKey(weaponId, movesetSlot, instancePrefix);
    const isBlock = Boolean(
      m?.isBlock ||
        (!moveOverride && movesetSlot === 3 && isBlockingWeapon(weaponDef || weaponId))
    );
    const isMeleeOrShieldWpn =
      Boolean(m?.noReload) ||
      weaponDef?.equipmentRole === 'melee' ||
      weaponDef?.equipmentRole === 'shield';
    const isBasicRanged = movesetSlot === 0 && !isBlock && !isMeleeOrShieldWpn;
    const isChain = Boolean(!isBlock && (m?.isChain || movesetSlot === 0));
    const activeDurationSec = isBlock ? 0 : m?.activeDurationSec ?? 0;

    // Strictly enforce: ONLY Basic Attack (movesetSlot === 0) on Ranged weapons has a reload state!
    const activatesReloadState = isBasicRanged;
    const reloadDurationSec = isBasicRanged
      ? m?.reloadDurationSec ?? weaponDef?.reloadDurationSec ?? 1.2
      : undefined;

    const wpnModProfile = getWeaponGemCombatModifiers(state, weaponId).modificationProfile;
    const compParryBonusSec = wpnModProfile?.statModifiers.parryWindowBonusSec ?? 0;
    const activeRemaining = isBlock
      ? state.isHoldingBlock
        ? Math.max(
            0.06,
            PERFECT_BLOCK_WINDOW_SEC +
              specEval.passiveModifiers.perfectBlockWindowBonusSec +
              compParryBonusSec -
              (state.blockHoldTimer || 0)
          )
        : Math.max(0, state.blockTimer || 0)
      : Math.max(0, state.skillActiveTimers?.[cooldownKey] || 0);
    const reloadRemaining =
      isBasicRanged && state.isReloading ? Math.max(0, state.reloadTimer || 0) : 0;
    const separateCd = isBlock
      ? 0
      : movesetSlot === 0
        ? isMeleeOrShieldWpn
          ? Math.max(0, state.meleeSequenceCooldownTimer || 0)
          : reloadRemaining
        : activeRemaining > 0
          ? 0
          : Math.max(0, state.actionCooldowns?.[cooldownKey] || 0);

    const internalCharges = !isBlock && movesetSlot > 0 ? m?.internalCharges : undefined;
    const remainingCharges =
      internalCharges && internalCharges > 1
        ? state.skillInternalAmmo?.[cooldownKey] ?? internalCharges
        : undefined;
    const rawComboLen = movesetSlot === 0 ? m?.comboSequence?.length : undefined;
    const comboLen =
      rawComboLen && wpnModProfile?.comboStepCountOverride
        ? Math.min(rawComboLen, Math.max(2, wpnModProfile.comboStepCountOverride))
        : rawComboLen;
    const comboStep =
      comboLen && comboLen > 0 ? ((state.meleeComboStep || 0) % comboLen) + 1 : undefined;

    return {
      id: actionId,
      cooldownKey,
      slotIndex,
      name: isBlock
        ? moveOverride
          ? `${m?.name} (Hold Guard)`
          : 'Block (Hold · 0.34s Perfect)'
        : m?.name || `Skill ${slotIndex}`,
      shortLabel: (isBlock && !moveOverride ? 'BLOCK' : m?.name || `SKILL ${slotIndex}`)
        .slice(0, 12)
        .toUpperCase(),
      sourceCategory: 'weapon',
      sourceSlotName,
      weaponId,
      weaponMovesetSlot: movesetSlot,
      damage: m?.damage,
      damageType:
        movesetSlot === 0 && wpnModProfile?.effectiveDamageType
          ? wpnModProfile.effectiveDamageType
          : m?.damageType,
      heatCost: m?.heatCost,
      cooldownSec: isBlock || movesetSlot === 0 ? 0 : m?.cooldownSec ?? 4.0,
      currentCooldown: separateCd,
      activatesReloadState,
      isChain,
      noReload: isMeleeOrShieldWpn || movesetSlot > 0,
      isChargeable: Boolean(
        m?.isChargeable && wpnModProfile?.effectiveAction1Mode !== 'BURST_VOLLEY'
      ),
      maxChargeSec: m?.maxChargeSec,
      ammoCount: m?.ammoCount,
      internalCharges,
      remainingCharges,
      comboStep,
      comboLength: comboLen,
      comboSequence: m?.comboSequence,
      activeDurationSec: activeDurationSec > 0 ? activeDurationSec : undefined,
      reloadDurationSec,
      activeRemaining,
      isReloading: reloadRemaining > 0,
      isBlock,
      description: m?.description,
      available: true,
    };
  };

  const skill1 = buildWeaponSkill(
    'weapon_skill_0',
    1,
    slot1Id,
    w1,
    0,
    `Main: ${w1?.name || slot1Id} [Skill 1]`
  );

  const specAction2 =
    !isAuxActive && specEval.active && specEval.stance
      ? buildActionDefinitionFromStanceOverride(2, specEval.stance.action2)
      : undefined;
  const skill2 = buildWeaponSkill(
    'weapon_skill_1',
    2,
    slot1Id,
    w1,
    1,
    specAction2 && specEval.stance
      ? `${specEval.stance.stanceName} [Skill 2]`
      : `Main: ${w1?.name || slot1Id} [Skill 2]`,
    'wpn',
    specAction2
  );
  if (specAction2 && specEval.stance) {
    skill2.shortLabel = specEval.stance.action2.shortLabel.slice(0, 12).toUpperCase();
  }

  const skill3 = buildWeaponSkill(
    'weapon_skill_2',
    3,
    slot1Id,
    w1,
    2,
    `Main: ${w1?.name || slot1Id} [Skill 3]`
  );

  let skill4: ResolvedCombatSkill | null = null;
  let skill5: ResolvedCombatSkill | null = null;

  if (isAuxActive && w3 && slot3Id) {
    // Back Launcher owns Skills 4 & 5 while staying mounted on the back (`slot3`)
    skill4 = buildWeaponSkill(
      'weapon_slot2_skill4',
      4,
      slot3Id,
      w3,
      3,
      `Back Launcher: ${w3.name} [Skill 4]`,
      'wpn_aux'
    );
    skill5 = buildWeaponSkill(
      'weapon_slot2_skill5',
      5,
      slot3Id,
      w3,
      4,
      `Back Launcher: ${w3.name} [Skill 5]`,
      'wpn_aux'
    );
  } else if (!isAuxActive && specEval.active && specEval.stance) {
    const offId = slot2Id || slot3Id || slot1Id;
    const offDef = getWeaponDefinition(offId) || w1;
    const specAction4 = buildActionDefinitionFromStanceOverride(4, specEval.stance.action4);
    const specAction5 = buildActionDefinitionFromStanceOverride(5, specEval.stance.action5);
    skill4 = buildWeaponSkill(
      'weapon_slot2_skill4',
      4,
      offId,
      offDef,
      3,
      `${specEval.stance.stanceName} [Skill 4]`,
      'wpn_spec',
      specAction4
    );
    skill4.shortLabel = specEval.stance.action4.shortLabel.slice(0, 12).toUpperCase();
    skill5 = buildWeaponSkill(
      'weapon_slot2_skill5',
      5,
      offId,
      offDef,
      4,
      `${specEval.stance.stanceName} [Skill 5]`,
      'wpn_spec',
      specAction5
    );
    skill5.shortLabel = specEval.stance.action5.shortLabel.slice(0, 12).toUpperCase();
  } else if (isPowerStance2H && w1) {
    // 2H Power Stance — an equipped Side weapon (`slot2`) is holstered; Main weapon (`slot1`) owns Skills 4 & 5
    const holsteredSuffix = w2 && slot2Id !== slot1Id ? ` (Side Holstered)` : '';
    skill4 = buildWeaponSkill(
      'weapon_skill_3',
      4,
      slot1Id,
      w1,
      3,
      `Power Stance (2H): ${w1.name} [Skill 4]${holsteredSuffix}`
    );
    skill5 = buildWeaponSkill(
      'weapon_skill_4',
      5,
      slot1Id,
      w1,
      4,
      `Power Stance (2H): ${w1.name} [Skill 5]${holsteredSuffix}`
    );
  } else if (isSideAuxiliary && w2 && slot2Id) {
    skill4 = buildWeaponSkill(
      'weapon_slot2_skill4',
      4,
      slot2Id,
      w2,
      3,
      `Side Shield: ${w2.name} [Skill 4]`
    );
    skill5 = buildWeaponSkill(
      'weapon_slot2_skill5',
      5,
      slot2Id,
      w2,
      4,
      `Side Shield: ${w2.name} [Skill 5]`
    );
  } else if (item2 && slot2Id) {
    const count = getItemCount(slot2Id);
    const itemCooldownKey = getSkillCooldownKey(slot2Id);
    const cd = Math.max(
      0,
      state.actionCooldowns?.[itemCooldownKey] || 0,
      state.actionCooldowns?.[slot2Id] || 0
    );
    skill5 = {
      id: `item_${slot2Id}`,
      cooldownKey: itemCooldownKey,
      slotIndex: 5,
      name: `${item2.name} (×${count})`,
      shortLabel: `${item2.name.slice(0, 10).toUpperCase()} ×${count}`,
      sourceCategory: 'belt',
      sourceSlotName: `Side Consumable: ${item2.name} [Skill 5]`,
      itemId: slot2Id,
      itemCount: count,
      cooldownSec: 2.5,
      currentCooldown: cd,
      activatesReloadState: false,
      isChain: false,
      isReloading: false,
      description: item2.description,
      available: count > 0,
      unavailableReason: count <= 0 ? 'CONSUMABLE DEPLETED' : undefined,
    };

    if (isAuxlAuxiliary && w3 && slot3Id) {
      skill4 = buildWeaponSkill(
        'weapon_slot2_skill4',
        4,
        slot3Id,
        w3,
        3,
        `Back Launcher: ${w3.name} [Skill 4]`
      );
    } else {
      skill4 = {
        id: 'none',
        cooldownKey: 'none_ac4',
        slotIndex: 4,
        name: 'Skill 4 (Inactive)',
        shortLabel: 'NO [1H]',
        sourceCategory: 'weapon',
        sourceSlotName: '1H Grip: ac4 = no',
        currentCooldown: 0,
        available: false,
        unavailableReason: '1H GRIP HAS NO SKILL 4 (EQUIP AUXILIARY OR 2H)',
      };
    }
  } else if (isUnpairedStance && w2 && slot2Id) {
    skill4 = buildWeaponSkill(
      'weapon_slot2_skill4',
      4,
      slot2Id,
      w2,
      1,
      `Side (Unpaired): ${w2.name} [Skill 2]`,
      'wpn_side'
    );
    skill5 = buildWeaponSkill(
      'weapon_slot2_skill5',
      5,
      slot2Id,
      w2,
      2,
      `Side (Unpaired): ${w2.name} [Skill 3]`,
      'wpn_side'
    );
  } else if (isPairedStance && w1) {
    skill4 = buildWeaponSkill(
      'weapon_skill_3',
      4,
      slot1Id,
      w1,
      3,
      `Paired: ${w1.name} [Skill 4]`
    );
    skill5 = buildWeaponSkill(
      'weapon_skill_4',
      5,
      slot1Id,
      w1,
      4,
      `Paired: ${w1.name} [Skill 5]`
    );
  } else {
    skill4 = {
      id: 'none',
      cooldownKey: 'none_ac4',
      slotIndex: 4,
      name: 'Skill 4 (Unavailable in 1H)',
      shortLabel: 'NO [1H]',
      sourceCategory: 'weapon',
      sourceSlotName: '1H Grip: ac4 = no',
      currentCooldown: 0,
      available: false,
      unavailableReason: '1H GRIP: SWITCH TO 2H OR EQUIP SIDE WEAPON / LAUNCHER [L]',
    };
    skill5 = {
      id: 'none',
      cooldownKey: 'none_ac5',
      slotIndex: 5,
      name: 'Skill 5 (Unavailable in 1H)',
      shortLabel: 'NO [1H]',
      sourceCategory: 'weapon',
      sourceSlotName: '1H Grip: ac5 = no',
      currentCooldown: 0,
      available: false,
      unavailableReason: '1H GRIP: SWITCH TO 2H OR SWAP TO BACK LAUNCHER WITH [L]',
    };
  }

  return { skill1, skill2, skill3, skill4, skill5 };
}

/**
 * Executes `triggerTacticalReload` (trigger tactical reload) in `skillExecution.ts`. Mutates `state: OrionState`.
 * Strictly restricted to Basic Attack (`Slot 1`) on Ranged weapons; Melee weapons and Skills 2–5 never reload.
 */
export function triggerTacticalReload(
  state: OrionState,
  _ctx: OrionCombatContext
): boolean {
  const currentWeaponId =
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const weapon = getWeaponDefinition(currentWeaponId);
  if (!weapon) return false;

  const arch = classifyWeaponCombatArchetype(weapon, currentWeaponId);
  const isMeleeOrShield = Boolean(weapon.moveset[0]?.noReload) || arch.isMeleeOrShield;
  if (isMeleeOrShield) {
    return false;
  }

  if (state.ammo >= state.maxAmmo && !state.isReloading) {
    return false;
  }

  const reloadDur = state.reloadDuration || weapon.reloadDurationSec;
  const s1Key = getSkillCooldownKey(currentWeaponId, 0);
  state.activeSkillSlot = null;
  state.activeActionId = null;
  state.activeSkillCooldownKey = null;
  state.skillTellTimer = 0;
  state.skillActionTimer = 0;
  state.isChargingBow = false;
  state.bowChargeTimer = 0;
  state.isReloading = true;
  state.reloadTimer = reloadDur;
  state.skillReloadTimers = state.skillReloadTimers || {};
  state.skillReloadTimers[s1Key] = reloadDur;

  soundSystem.playPowerup();
  triggerEntityFlash(state, '#38bdf8', 0.12, 'ready');
  notifyOrionStateChange();
  return true;
}

/**
 * Executes `startHoldingBlock` (start holding block) in `skillExecution.ts`. Mutates `state: OrionState`.
 */
export function startHoldingBlock(
  state: OrionState,
  ctx?: OrionCombatContext,
  weaponIdOverride?: string
): boolean {
  const action4Profile = resolveActiveAction4DefensiveMode(state);
  if (!action4Profile.available || action4Profile.overrideKind !== 'none') {
    return false;
  }
  const skills = getResolvedCombatSkills(state);
  const blockSkill = skills.skill4;
  if (!blockSkill || !blockSkill.available) {
    return false;
  }
  if (state.activeActionId) {
    return false;
  }
  if (state.activeSkillSlot === 0) {
    state.activeSkillSlot = null;
    state.activeSkillCooldownKey = null;
    state.skillTellTimer = 0;
    state.skillActionTimer = 0;
    state.combatQueuedChainShot = false;
  }

  const blockWpnId =
    weaponIdOverride ||
    blockSkill.weaponId ||
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[0] ||
    'long_sword';
  const weapon = getWeaponDefinition(blockWpnId);
  const isShieldEquip = weapon?.equipmentRole === 'shield';
  const isParryMode = action4Profile.mode === 'parry';
  const aim = getCombatAimVector(state);
  const aimAngle = Math.atan2(aim.dy, aim.dx);
  const specEval = evaluateActiveSpecialistStance(state);
  const compParryBonusSec =
    getWeaponGemCombatModifiers(state, blockWpnId).modificationProfile?.statModifiers
      .parryWindowBonusSec ?? 0;
  const effectiveBlockWindow =
    PERFECT_BLOCK_WINDOW_SEC +
    specEval.passiveModifiers.perfectBlockWindowBonusSec +
    compParryBonusSec;

  if (isParryMode) {
    if ((state.blockTimer || 0) <= 0) {
      state.isHoldingBlock = false;
      state.blockHoldTimer = 0;
      state.blockTimer = effectiveBlockWindow;
      state.blockingWeaponId = blockWpnId;

      soundSystem.playSword();
      triggerEntityFlash(state, '#fde047', 0.12, 'shield');
      state.bladeTrails = state.bladeTrails || [];
      state.bladeTrails.push({
        x: state.x,
        y: state.y,
        z: state.z,
        angle: aimAngle,
        arcSpan: isShieldEquip ? Math.PI * 0.95 : Math.PI * 0.75,
        radius: isShieldEquip ? 24 : 20,
        width: isShieldEquip ? 16 : 13,
        style: 'slash',
        color: '#fde047',
        coreColor: '#ffffff',
        life: effectiveBlockWindow,
        maxLife: effectiveBlockWindow,
      });

      ctx?.spawnParticles(
        state.x + aim.dx * 8,
        state.y + aim.dy * 8,
        state.z + 8,
        6,
        '#fde047',
        'PARRY (0.34s DEFLECT)'
      );
      notifyOrionStateChange();
    }
    return true;
  }

  if (!state.isHoldingBlock) {
    state.isHoldingBlock = true;
    state.blockHoldTimer = 0;
    state.blockTimer = effectiveBlockWindow;
    state.blockingWeaponId = blockWpnId;

    soundSystem.playSword();
    triggerEntityFlash(state, '#38bdf8', 0.12, 'shield');
    state.bladeTrails = state.bladeTrails || [];
    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: aimAngle,
      arcSpan: isShieldEquip ? Math.PI * 0.95 : Math.PI * 0.75,
      radius: isShieldEquip ? 24 : 20,
      width: isShieldEquip ? 16 : 13,
      style: 'bash',
      color: '#38bdf8',
      coreColor: '#ffffff',
      life: effectiveBlockWindow,
      maxLife: effectiveBlockWindow,
    });

    ctx?.spawnParticles(
      state.x + aim.dx * 8,
      state.y + aim.dy * 8,
      state.z + 8,
      6,
      '#38bdf8',
      ''
    );
    notifyOrionStateChange();
  }
  return true;
}

/**
 * Executes `releaseHeldBlock` (release held block) in `skillExecution.ts`. Mutates `state: OrionState`.
 */
export function releaseHeldBlock(state: OrionState): void {
  if (state.isHoldingBlock || (state.blockTimer || 0) > 0) {
    state.isHoldingBlock = false;
    state.blockTimer = 0;
    state.blockHoldTimer = 0;
    state.blockingWeaponId = null;
    notifyOrionStateChange();
  }
}

/**
 * Executes `activateResolvedCombatSkill` (activate resolved combat skill) in `skillExecution.ts`. Mutates `state: OrionState`.
 */
export function activateResolvedCombatSkill(
  state: OrionState,
  ctx: OrionCombatContext,
  skillIndex: 1 | 2 | 3 | 4 | 5
): boolean {
  if (state.activeActionId) {
    return false;
  }
  if (state.activeSkillSlot !== null && state.activeSkillSlot !== 0) {
    return false;
  }
  if (state.activeSkillSlot === 0) {
    state.activeSkillSlot = null;
    state.activeSkillCooldownKey = null;
    state.skillTellTimer = 0;
    state.skillActionTimer = 0;
    state.combatQueuedChainShot = false;
  }
  if (state.isChargingBow) {
    state.isChargingBow = false;
    state.bowChargeTimer = 0;
  }

  const skills = getResolvedCombatSkills(state);
  const skillKey = `skill${skillIndex}` as keyof ResolvedCombatSkills;
  const skill = skills[skillKey];

  if (!skill || !skill.available) {
    soundSystem.playMenuBeep();
    notifyOrionStateChange();
    return false;
  }

  if ((skill.activeRemaining || 0) > 0) {
    soundSystem.playMenuBeep();
    notifyOrionStateChange();
    return false;
  }

  if (skill.currentCooldown > 0) {
    soundSystem.playMenuBeep();
    notifyOrionStateChange();
    return false;
  }

  if (skill.sourceCategory === 'belt' && skill.itemId) {
    const itemId = skill.itemId;
    const invIdx = state.inventorySlots.findIndex((s) => s.itemId === itemId);
    const itemDef = getItemDefinition(itemId);
    if (invIdx < 0 || !itemDef) {
      soundSystem.playMenuBeep();
      notifyOrionStateChange();
      return false;
    }

    const used = itemDef.onUse
      ? itemDef.onUse(state, { say: ctx.say, sound: ctx.sound })
      : false;
    if (used) {
      state.inventorySlots[invIdx].count -= 1;
      if (state.inventorySlots[invIdx].count <= 0) {
        state.inventorySlots.splice(invIdx, 1);
      }
      state.actionCooldowns = state.actionCooldowns || {};
      state.actionCooldowns[skill.cooldownKey] = skill.cooldownSec || 2.5;
      triggerEntityFlash(state, itemDef.iconColor || '#fbbf24', 0.14, 'ready');
      ctx.spawnParticles(
        state.x,
        state.y,
        state.z + 8,
        10,
        itemDef.iconColor || '#fbbf24',
        ''
      );
      notifyOrionStateChange();
      return true;
    }
    return false;
  }

  const desc = getResolvedActionDescriptor(state, skill.id);
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const gemCombatMods = getWeaponGemCombatModifiers(state, skill.weaponId);
  const heatPenaltyMult = state.gates?.loadPenalty?.heatMult ?? 1.0;

  const rawHeat = skill.heatCost ?? desc.heatCost ?? 0;
  if (rawHeat > 0) {
    const scaledHeat =
      rawHeat * heatPenaltyMult * featMods.heatGenMult * gemCombatMods.skillHeatCostMult;
    state.heat = Math.min(state.maxHeat, state.heat + scaledHeat);
    state.heatDecayDelayTimer = Math.max(state.heatDecayDelayTimer || 0, 0.45);
  } else if (rawHeat < 0) {
    state.heat = Math.max(0, state.heat + rawHeat);
  }

  const hwStats = resolveEquippedHardwareStats(state);
  const cdScale = clampTempoMultiplier(
    featMods.cooldownMult * gemCombatMods.skillCooldownMult * hwStats.cooldownMult
  );
  const tellScale = clampTempoMultiplier(hwStats.tellDurationMult);
  const finalCd = Math.max(
    1.5,
    (skill.cooldownSec ?? desc.cooldownSec ?? 4.5) * cdScale
  );

  state.actionCooldowns = state.actionCooldowns || {};
  state.skillActiveTimers = state.skillActiveTimers || {};
  state.skillReloadTimers = state.skillReloadTimers || {};
  state.skillInternalAmmo = state.skillInternalAmmo || {};

  if (skill.isBlock) {
    startHoldingBlock(state, ctx, skill.weaponId);
    return true;
  }

  if ((skill.internalCharges || 0) > 1) {
    // Safe: guarded by `(skill.internalCharges || 0) > 1` on the line above
    const maxCharges = skill.internalCharges!;
    const currentCharges = state.skillInternalAmmo[skill.cooldownKey] ?? maxCharges;
    const nextCharges = currentCharges - 1;
    if (nextCharges > 0) {
      state.skillInternalAmmo[skill.cooldownKey] = nextCharges;
      const cycleSec = Math.max(
        0.45,
        (desc.internalCycleSec ?? 0.65) * cdScale
      );
      state.actionCooldowns[skill.cooldownKey] = cycleSec;
    } else {
      state.skillInternalAmmo[skill.cooldownKey] = maxCharges;
      state.actionCooldowns[skill.cooldownKey] = finalCd;
    }
  } else if (skill.activeDurationSec && skill.activeDurationSec > 0) {
    state.skillActiveTimers[skill.cooldownKey] = skill.activeDurationSec;
    state.actionCooldowns[skill.cooldownKey] = finalCd;
  } else {
    state.actionCooldowns[skill.cooldownKey] = finalCd;
  }

  if (skill.weaponMovesetSlot !== undefined) {
    state.activeSkillSlot = skill.weaponMovesetSlot;
  } else {
    state.activeSkillSlot = skillIndex;
  }

  state.activeActionId = skill.id;
  state.activeSkillCooldownKey = skill.cooldownKey;
  state.skillTellTimer = Math.max(0.08, desc.tellDurationSec * tellScale);
  state.skillTellMaxTimer = state.skillTellTimer;
  state.skillActionTimer = Math.max(0.22, desc.actionDurationSec * tellScale);
  state.skillActionMaxTimer = state.skillActionTimer;
  state.revealedTimer = 0.75;

  soundSystem.playCharge();
  notifyOrionStateChange();
  return true;
}
