/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import {
  ASSIGNABLE_ACTION_CATALOG,
  getResolvedActionDescriptor,
} from '../database/equipment';
import { getWeaponDefinition } from '../database/equipment/weapons';
import {
  computeInterfaceFeatModifiers,
  getWeaponGemVisuals,
} from '../database/progression';
import { OrionCombatContext, OrionState } from '../types';
import { notifyOrionStateChange } from './playerSystem';
import { updateBladeTrails } from './renderSystem';
import { cycleTargetLock, triggerEntityFlash } from './combat/combatHelpers';
import { applyDamageToLayers, resolveEnemyMeleeAttacks } from './combat/damageSystem';
import { executeBasicAttackShot, firePrimarySalvoShot } from './combat/projectileSystem';
import {
  activateResolvedCombatSkill,
  executeActionPayload,
  getResolvedCombatSkills,
  getSkillCooldownKey,
  performAuxiliarySwap,
  releaseHeldBlock,
  startHoldingBlock,
  triggerTacticalReload,
  updateActionTimers,
} from './combat/skillExecution';

export * from './combat/combatHelpers';
export * from './combat/damageSystem';
export * from './combat/projectileSystem';
export * from './combat/skillExecution';
export { ASSIGNABLE_ACTION_CATALOG, getResolvedActionDescriptor };

const DOUBLE_TAP_WINDOW_SEC = 0.26;
const HOLD_TRIGGER_THRESHOLD_SEC = 0.22;

export function handleCombatInput(
  input: {
    pressed: { a: boolean; b: boolean; x: boolean; y: boolean; l: boolean; r: boolean; select: boolean };
    held: { x: boolean; y: boolean; b: boolean; r?: boolean; l?: boolean };
  },
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  const currentWeaponId =
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const weapon = getWeaponDefinition(currentWeaponId);
  if (!weapon) return;

  // 1. Tick primary chain reloading
  if (state.isReloading) {
    const reloadMult = (state.overdriveTimer || 0) > 0 ? 1.6 : 1.0;
    state.reloadTimer -= dt * reloadMult;
    const s1Key = getSkillCooldownKey(currentWeaponId, 0);
    if (state.skillReloadTimers) {
      state.skillReloadTimers[s1Key] = Math.max(0, state.reloadTimer);
    }
    if (state.reloadTimer <= 0) {
      state.isReloading = false;
      state.ammo = state.maxAmmo;
      if (state.skillReloadTimers) {
        state.skillReloadTimers[s1Key] = 0;
      }
      soundSystem.playSelect();
      triggerEntityFlash(state, '#38bdf8', 0.14, 'ready');
      notifyOrionStateChange();
    }
  }

  // 2. Initialize timer objects on state
  state.combatInputTimers = state.combatInputTimers || { x: 0, y: 0, r: 0, l: 0 };
  state.combatHoldTimers = state.combatHoldTimers || { x: 0, y: 0, r: 0, l: 0 };
  state.combatHoldTriggered = state.combatHoldTriggered || {
    x: false,
    y: false,
    r: false,
    l: false,
  };
  state.combatTapPending = state.combatTapPending || {
    x: false,
    y: false,
    r: false,
    l: false,
  };
  state.combatDoubleTapPending = state.combatDoubleTapPending || {
    x: false,
    y: false,
    r: false,
    l: false,
  };

  // Tick down double-tap windows
  for (const k of ['x', 'y', 'r', 'l'] as const) {
    if (state.combatInputTimers[k] > 0) {
      state.combatInputTimers[k] = Math.max(0, state.combatInputTimers[k] - dt);
    }
  }

  const p = input.pressed;
  const h = {
    x: !!input.held.x,
    y: !!input.held.y,
    r: !!input.held.r,
    l: !!input.held.l,
  };

  // ─── [X] BUTTON: Single Tap = [chain manual] · Double Tap = [reload chain] · Hold = [chain auto] ───
  if (p.x) {
    state.combatHoldTimers.x = 0;
    state.combatHoldTriggered.x = false;

    const isMidBasicSwing = state.activeSkillSlot === 0 && !state.activeActionId;
    if (
      state.combatInputTimers.x > 0 &&
      !isMidBasicSwing &&
      state.ammo < state.maxAmmo &&
      !state.isReloading
    ) {
      state.combatInputTimers.x = 0;
      state.combatQueuedChainShot = false;
      triggerTacticalReload(state, ctx, [1]);
    } else {
      state.combatInputTimers.x = DOUBLE_TAP_WINDOW_SEC;
      if (!state.isReloading && !state.activeActionId) {
        if (state.activeSkillSlot === null) {
          firePrimarySalvoShot(state, ctx, false);
        } else if (state.activeSkillSlot === 0) {
          state.combatQueuedChainShot = true;
        }
      }
    }
  }

  if (h.x) {
    state.combatHoldTimers.x += dt;
    if (state.combatHoldTimers.x >= HOLD_TRIGGER_THRESHOLD_SEC && !state.combatHoldTriggered.x) {
      state.combatHoldTriggered.x = true;
      state.combatActiveChain = true;
      state.combatInputTimers.x = 0;
    }
    if (
      state.combatActiveChain &&
      !state.isReloading &&
      state.activeSkillSlot === null &&
      !state.activeActionId
    ) {
      firePrimarySalvoShot(state, ctx, true);
    }
  } else {
    state.combatHoldTimers.x = 0;
    state.combatHoldTriggered.x = false;
    state.combatActiveChain = false;
  }

  // ─── [Y] BUTTON: Tap Release = [Skill 2] · Double Tap Release = [reload 2/4 or Skill 2] · Hold = [Skill 4 / Held Block] ───
  if (p.y) {
    const isDoubleTap = state.combatInputTimers.y > 0;
    state.combatInputTimers.y = isDoubleTap ? 0 : DOUBLE_TAP_WINDOW_SEC;
    state.combatHoldTimers.y = 0;
    state.combatHoldTriggered.y = false;
    state.combatTapPending.y = true;
    state.combatDoubleTapPending.y = isDoubleTap;
  }

  if (h.y) {
    state.combatHoldTimers.y += dt;
    const skills = getResolvedCombatSkills(state);
    const isSkill4Block = Boolean(skills.skill4?.available && skills.skill4?.isBlock);
    const yHoldThreshold = isSkill4Block ? 0.14 : HOLD_TRIGGER_THRESHOLD_SEC;

    if (state.combatHoldTimers.y >= yHoldThreshold) {
      state.combatTapPending.y = false;
      state.combatDoubleTapPending.y = false;
      state.combatInputTimers.y = 0;
      if (!state.combatHoldTriggered.y && !state.activeActionId) {
        state.combatHoldTriggered.y = true;
        if (isSkill4Block) {
          startHoldingBlock(state, ctx, skills.skill4?.weaponId);
        } else {
          activateResolvedCombatSkill(state, ctx, 4);
        }
      }
    }
  } else {
    if (state.isHoldingBlock) {
      releaseHeldBlock(state);
    }
    if (state.combatTapPending.y && !state.combatHoldTriggered.y) {
      const wasDoubleTap = state.combatDoubleTapPending.y;
      state.combatTapPending.y = false;
      state.combatDoubleTapPending.y = false;
      if (wasDoubleTap) {
        if (!triggerTacticalReload(state, ctx, [2, 4])) {
          activateResolvedCombatSkill(state, ctx, 2);
        }
      } else {
        activateResolvedCombatSkill(state, ctx, 2);
      }
    }
    state.combatHoldTimers.y = 0;
    state.combatHoldTriggered.y = false;
    state.combatTapPending.y = false;
    state.combatDoubleTapPending.y = false;
  }

  // ─── [R] BUTTON: Tap Release = [Skill 3] · Double Tap Release = [reload 3/5 or Skill 3] · Hold = [Skill 5] ───
  if (p.r) {
    const isDoubleTap = state.combatInputTimers.r > 0;
    state.combatInputTimers.r = isDoubleTap ? 0 : DOUBLE_TAP_WINDOW_SEC;
    state.combatHoldTimers.r = 0;
    state.combatHoldTriggered.r = false;
    state.combatTapPending.r = true;
    state.combatDoubleTapPending.r = isDoubleTap;
  }

  if (h.r) {
    state.combatHoldTimers.r += dt;
    if (state.combatHoldTimers.r >= HOLD_TRIGGER_THRESHOLD_SEC) {
      state.combatTapPending.r = false;
      state.combatDoubleTapPending.r = false;
      state.combatInputTimers.r = 0;
      if (!state.combatHoldTriggered.r && !state.activeActionId) {
        state.combatHoldTriggered.r = true;
        activateResolvedCombatSkill(state, ctx, 5);
      }
    }
  } else {
    if (state.combatTapPending.r && !state.combatHoldTriggered.r) {
      const wasDoubleTap = state.combatDoubleTapPending.r;
      state.combatTapPending.r = false;
      state.combatDoubleTapPending.r = false;
      if (wasDoubleTap) {
        if (!triggerTacticalReload(state, ctx, [3, 5])) {
          activateResolvedCombatSkill(state, ctx, 3);
        }
      } else {
        activateResolvedCombatSkill(state, ctx, 3);
      }
    }
    state.combatHoldTimers.r = 0;
    state.combatHoldTriggered.r = false;
    state.combatTapPending.r = false;
    state.combatDoubleTapPending.r = false;
  }

  // ─── [L] BUTTON: Single Tap Release = [lock/cycle] · Double Tap Release = [unlock] · Hold = [swap] ───
  if (p.l) {
    const isDoubleTap = state.combatInputTimers.l > 0 && state.lockedTargetId !== null;
    state.combatInputTimers.l = isDoubleTap ? 0 : DOUBLE_TAP_WINDOW_SEC;
    state.combatHoldTimers.l = 0;
    state.combatHoldTriggered.l = false;
    state.combatTapPending.l = true;
    state.combatDoubleTapPending.l = isDoubleTap;
  }

  if (h.l) {
    state.combatHoldTimers.l += dt;
    if (state.combatHoldTimers.l >= HOLD_TRIGGER_THRESHOLD_SEC) {
      state.combatTapPending.l = false;
      state.combatDoubleTapPending.l = false;
      state.combatInputTimers.l = 0;
      if (!state.combatHoldTriggered.l) {
        state.combatHoldTriggered.l = true;
        performAuxiliarySwap(state, ctx);
      }
    }
  } else {
    if (state.combatTapPending.l && !state.combatHoldTriggered.l) {
      const wasDoubleTap = state.combatDoubleTapPending.l;
      state.combatTapPending.l = false;
      state.combatDoubleTapPending.l = false;
      if (wasDoubleTap && state.lockedTargetId !== null) {
        state.lockedTargetId = null;
        soundSystem.playMenuBeep();
        notifyOrionStateChange();
      } else {
        cycleTargetLock(state, ctx);
      }
    }
    state.combatHoldTimers.l = 0;
    state.combatHoldTriggered.l = false;
    state.combatTapPending.l = false;
    state.combatDoubleTapPending.l = false;
  }
}

export function updateCombat(
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);

  if (state.weaponSwapCooldown > 0) {
    state.weaponSwapCooldown = Math.max(0, state.weaponSwapCooldown - dt);
  }

  if (state.boosterCooldown > 0) state.boosterCooldown = Math.max(0, state.boosterCooldown - dt);
  if (state.isBoosterDashing && !state.isContinuousBoosting) {
    state.boosterTimer -= dt;
    if (state.boosterTimer <= 0) state.isBoosterDashing = false;
  }

  for (let s = 0; s < state.skillCooldowns.length; s++) {
    if (state.skillCooldowns[s] > 0) {
      state.skillCooldowns[s] = Math.max(0, state.skillCooldowns[s] - dt);
    }
  }
  if (state.flashTimer && state.flashTimer > 0) {
    state.flashTimer = Math.max(0, state.flashTimer - dt);
  }
  for (const e of state.enemies) {
    if (e.flashTimer && e.flashTimer > 0) {
      e.flashTimer = Math.max(0, e.flashTimer - dt);
    }
  }
  updateActionTimers(state, dt);
  updateBladeTrails(state, dt);

  if (state.shields.type === 'energy') {
    if (state.shields.overloaded) {
      state.shields.overloadTimer -= dt;
      if (state.shields.overloadTimer <= 0) {
        state.shields.overloaded = false;
      }
    } else if (state.shields.capacity < state.shields.maxCapacity) {
      if (state.shields.rechargeDelay > 0) {
        state.shields.rechargeDelay -= dt;
      } else {
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + 15 * dt
        );
      }
    }
  }

  if (state.heat > 0 && !state.isContinuousBoosting) {
    state.heat = Math.max(0, state.heat - 12 * featMods.heatVentMult * dt);
  }

  if (state.activeSkillSlot !== null || state.activeActionId) {
    const currentWeaponId =
      state.equipmentSlots?.slot1 ||
      state.equippedWeapons[state.activeWeaponIndex] ||
      'gladius_boltcaster';
    const weapon = getWeaponDefinition(currentWeaponId);
    const isMeleeOrShield =
      weapon?.equipmentRole === 'melee' ||
      weapon?.equipmentRole === 'shield' ||
      currentWeaponId === 'khopesh';
    const gemVis = getWeaponGemVisuals(state, currentWeaponId);
    const trailColor = gemVis.gemId
      ? gemVis.color
      : weapon?.bladeTrailColor || (isMeleeOrShield ? '#e879f9' : '#77c7ff');
    const coreColor = gemVis.gemId ? gemVis.coreColor : '#ffffff';

    if (state.skillTellTimer > 0) {
      state.skillTellTimer -= dt;
      if (Math.random() < 0.4) {
        state.particles.push({
          x: state.x + (Math.random() - 0.5) * 8,
          y: state.y + (Math.random() - 0.5) * 8,
          z: state.z + 8,
          vx: 0,
          vy: -10,
          vz: 10,
          life: 0.2,
          maxLife: 0.2,
          color: trailColor,
          size: 2,
          fade: true,
        });
      }

      if (state.skillTellTimer <= 0) {
        if (state.activeSkillSlot === 0 && !state.activeActionId) {
          executeBasicAttackShot(state, ctx, currentWeaponId, trailColor, coreColor);
        } else if (state.activeActionId) {
          executeActionPayload(state, ctx, state.activeActionId, applyDamageToLayers);
        }
      }
    } else {
      state.skillActionTimer -= dt;
      if (state.skillActionTimer <= 0) {
        const finishedBasicShot = state.activeSkillSlot === 0 && !state.activeActionId;
        state.activeSkillSlot = null;
        state.activeActionId = null;
        state.activeSkillCooldownKey = null;
        if (finishedBasicShot && state.combatQueuedChainShot && !state.isReloading) {
          state.combatQueuedChainShot = false;
          firePrimarySalvoShot(state, ctx, false);
        }
      }
    }
  }

  resolveEnemyMeleeAttacks(state, ctx);
}
