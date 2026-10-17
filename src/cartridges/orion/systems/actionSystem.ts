/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import { DIR_VECTORS } from '../constants';
import {
  ASSIGNABLE_ACTION_CATALOG,
  getResolvedActionDescriptor,
  OrionActionDescriptor,
} from '../database/equipment';
import { getWeaponDefinition } from '../database/weapons';
import { notifyOrionStateChange } from '../stateStore';
import {
  ArmorState,
  DamageType,
  FrameState,
  OrionCombatContext,
  OrionState,
  ShieldState,
} from '../types';
import { getLockedTarget } from './targetingSystem';

/**
 * Check if a specific assignable action is unlocked under the pilot's active capability gates.
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

  if (desc.sourceCategory === 'weapon' && desc.weaponSkillSlot) {
    const unlockedSlots = gates?.unlockedSkillSlots ?? [0, 1, 2];
    if (unlockedSlots.includes(desc.weaponSkillSlot)) {
      return { unlocked: true, reason: 'READY' };
    }
    const reqLvl = desc.weaponSkillSlot <= 2 ? 4 : 6;
    return {
      unlocked: false,
      reason: `UNLOCKS AT LEVEL ${reqLvl} (SKILL SLOT ${desc.weaponSkillSlot})`,
    };
  }

  if (desc.sourceCategory === 'hardware') {
    if (desc.hardwareSlot === 'Legs') {
      if (state.hasBoosterKit || lvl >= 2) {
        return { unlocked: true, reason: 'READY (LEGS MODULE)' };
      }
      return { unlocked: false, reason: 'REQUIRES BOOSTER KIT [S] OR LEVEL 2' };
    }
    if (desc.hardwareSlot === 'Head') {
      if (gates?.opticsActive || lvl >= 7) {
        return { unlocked: true, reason: 'READY (HEAD OPTICS)' };
      }
      return { unlocked: false, reason: 'UNLOCKS AT LEVEL 7 (HEAD OPTICS)' };
    }
    if (desc.hardwareSlot === 'Arms') {
      if (gates?.armSidearmActive || lvl >= 8) {
        return { unlocked: true, reason: 'READY (ARMS SIDEARM)' };
      }
      return { unlocked: false, reason: 'UNLOCKS AT LEVEL 8 (ARMS SIDEARM)' };
    }
    if (desc.hardwareSlot === 'Torso') {
      if ((gates?.defensiveSlots ?? 0) >= 1 || lvl >= 10) {
        return { unlocked: true, reason: 'READY (TORSO PLATING)' };
      }
      return { unlocked: false, reason: 'UNLOCKS AT LEVEL 10 (DEFENSIVE SLOT)' };
    }
  }

  if (desc.sourceCategory === 'reactor') {
    if (gates?.heatSystemActive || lvl >= 5) {
      return { unlocked: true, reason: 'READY (REACTOR CORE)' };
    }
    return { unlocked: false, reason: 'UNLOCKS AT LEVEL 5 (REACTOR GENERATOR)' };
  }

  return { unlocked: true, reason: 'READY' };
}

/**
 * Resolve the currently assigned action on trigger 'L' or 'R'.
 */
export function resolveTriggerAction(
  state: OrionState,
  trigger: 'L' | 'R'
): OrionActionDescriptor {
  const assignedId =
    trigger === 'L'
      ? state.assignedActions?.L || 'weapon_skill_1'
      : state.assignedActions?.R || 'weapon_skill_2';
  return getResolvedActionDescriptor(state, assignedId);
}

/**
 * Assign an action ID to L or R trigger via menu.
 */
export function assignTriggerAction(
  state: OrionState,
  trigger: 'L' | 'R',
  actionId: string
): void {
  state.assignedActions = state.assignedActions || {
    L: 'weapon_skill_1',
    R: 'weapon_skill_2',
  };
  state.assignedActions[trigger] = actionId;
  notifyOrionStateChange();
}

/**
 * Reset L and R triggers to the default active weapon skills (L = Skill 1, R = Skill 2).
 */
export function resetTriggerActionsToDefault(state: OrionState): void {
  state.assignedActions = {
    L: 'weapon_skill_1',
    R: 'weapon_skill_2',
  };
  notifyOrionStateChange();
}

/**
 * Return current cooldown remaining for a given action ID.
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

/**
 * Compute normalized aim vector (dx, dy) from the pilot toward the locked target if active,
 * or along the pilot's current facing vector.
 */
export function getCombatAimVector(state: OrionState): { dx: number; dy: number } {
  const locked = getLockedTarget(state);
  if (locked) {
    const dx = locked.x - state.x;
    const dy = locked.y - state.y;
    const norm = Math.hypot(dx, dy) || 1;
    return { dx: dx / norm, dy: dy / norm };
  }
  if (state.faceX !== 0 || state.faceY !== 0) {
    const norm = Math.hypot(state.faceX, state.faceY) || 1;
    return { dx: state.faceX / norm, dy: state.faceY / norm };
  }
  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  return { dx: dirInfo.dx, dy: dirInfo.dy };
}

/**
 * Initiate the action bound to trigger 'L' or 'R' (windup tell + cooldown + heat).
 */
export function initiateTriggerAction(
  state: OrionState,
  ctx: OrionCombatContext,
  trigger: 'L' | 'R'
): boolean {
  if (state.activeSkillSlot !== null || state.activeActionId) {
    return false;
  }

  const assignedId =
    trigger === 'L'
      ? state.assignedActions?.L || 'weapon_skill_1'
      : state.assignedActions?.R || 'weapon_skill_2';

  const status = isActionUnlocked(state, assignedId);
  if (!status.unlocked) {
    soundSystem.playMenuBeep();
    ctx.say(`[${trigger}] GATED — ${status.reason}`);
    notifyOrionStateChange();
    return false;
  }

  const desc = getResolvedActionDescriptor(state, assignedId);
  const cd = getActionCooldown(state, assignedId);
  if (cd > 0) {
    soundSystem.playMenuBeep();
    ctx.say(`${desc.shortLabel} COOLDOWN (${cd.toFixed(1)}S)`);
    return false;
  }

  state.actionCooldowns = state.actionCooldowns || {};
  state.actionCooldowns[assignedId] = desc.cooldownSec;
  if (desc.sourceCategory === 'weapon' && desc.weaponSkillSlot) {
    state.skillCooldowns[desc.weaponSkillSlot] = desc.cooldownSec;
    state.activeSkillSlot = desc.weaponSkillSlot;
  } else {
    state.activeSkillSlot = -1; // Non-weapon modular action windup
  }

  state.activeActionId = assignedId;
  state.skillTellTimer = Math.max(0.05, desc.tellDurationSec);
  state.skillActionTimer = Math.max(0.15, desc.actionDurationSec);

  if (desc.heatCost > 0) {
    state.heat = Math.min(state.maxHeat, state.heat + desc.heatCost);
  } else if (desc.heatCost < 0) {
    state.heat = Math.max(0, state.heat + desc.heatCost);
  }

  soundSystem.playCharge();
  ctx.say(`[${trigger}] ${desc.name.toUpperCase()}`);
  notifyOrionStateChange();
  return true;
}

/**
 * Execute the payload of a non-basic action (Weapon Skills 1..4, Hardware Modules, or Reactor Abilities)
 * once its readable tell timer completes.
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
    spawnParticles?: (count: number, color: string, label: string) => void
  ) => void
): void {
  const desc = getResolvedActionDescriptor(state, actionId);
  const aim = getCombatAimVector(state);
  const currentWeaponId =
    state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const isKhopesh = currentWeaponId === 'khopesh';
  const weapon = getWeaponDefinition(currentWeaponId);

  // Compute damage multipliers (Overdrive +30%, Knight's Oath +25% vs Camelot, Optic Painter +25%)
  const overdriveMult = (state.overdriveTimer || 0) > 0 ? 1.3 : 1.0;
  const opticMult = (state.opticMarkTimer || 0) > 0 ? 1.25 : 1.0;
  const hasKnightsOath = state.equippedFeats.includes('knights_oath');

  const computeEnemyDamage = (baseDmg: number, faction?: string) => {
    const oathMult = hasKnightsOath && faction === 'camelot' ? 1.25 : 1.0;
    return Math.round(baseDmg * overdriveMult * opticMult * oathMult);
  };

  // 1. WEAPON SKILLS (Slots 1..4)
  if (desc.sourceCategory === 'weapon' && desc.weaponSkillSlot) {
    const slot = desc.weaponSkillSlot;
    const action = weapon?.moveset[slot] || desc;

    if (slot === 1) {
      if (isKhopesh) {
        // Execution Lunge
        state.isBoosterDashing = true;
        state.boosterTimer = 0.14;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        state.projectiles.push({
          x: state.x + aim.dx * 12,
          y: state.y + aim.dy * 12,
          z: state.z + 6,
          vx: aim.dx * 150,
          vy: aim.dy * 150,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: action.damageType,
          isPlayer: true,
          life: 0.3,
          radius: 8,
          color: '#f43f5e',
          trailColor: '#e879f9',
          lightRadius: 28,
        });
        ctx.spawnParticles(state.x + aim.dx * 14, state.y + aim.dy * 14, state.z + 6, 8, '#f43f5e', 'LUNGE!');
        soundSystem.playSword();
      } else {
        // AP Penetrator Slug
        state.projectiles.push({
          x: state.x + aim.dx * 10,
          y: state.y + aim.dy * 10,
          z: state.z + 6,
          vx: aim.dx * 230,
          vy: aim.dy * 230,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: action.damageType,
          isPlayer: true,
          life: 0.9,
          radius: 4,
          color: '#77c7ff',
          trailColor: '#38bdf8',
          lightRadius: 26,
        });
        soundSystem.playLaser();
      }
      return;
    }

    if (slot === 2) {
      if (isKhopesh) {
        // Sweep Deflection
        soundSystem.playSword();
        state.shields.capacity = Math.min(state.shields.maxCapacity, state.shields.capacity + 12);
        ctx.spawnParticles(state.x, state.y, state.z + 8, 10, '#c084fc', 'DEFLECT!');
        for (const e of state.enemies) {
          if (e.isSubmerged) continue;
          if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
          if (Math.hypot(e.x - state.x, e.y - state.y) < 32) {
            e.stun = 1.4;
            applyDamageFn(
              e.shields,
              e.armor,
              e.frame,
              computeEnemyDamage(action.damage, e.faction),
              'Impact'
            );
          }
        }
      } else {
        // Concussion Grenade
        state.projectiles.push({
          x: state.x + aim.dx * 8,
          y: state.y + aim.dy * 8,
          z: state.z + 8,
          vx: aim.dx * 120,
          vy: aim.dy * 120,
          vz: 20,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Blast',
          isPlayer: true,
          life: 0.6,
          radius: 5,
          color: '#ea580c',
          trailColor: '#f97316',
          lightRadius: 30,
          onImpact(x, y, _z, st) {
            soundSystem.playExplosion();
            for (const e of st.enemies) {
              if (e.isSubmerged) continue;
              if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
              if (Math.hypot(e.x - x, e.y - y) < 36) {
                e.stun = 1.2;
                applyDamageFn(
                  e.shields,
                  e.armor,
                  e.frame,
                  computeEnemyDamage(24, e.faction),
                  'Blast'
                );
              }
            }
          },
        });
      }
      return;
    }

    if (slot === 3) {
      if (isKhopesh) {
        // Hamstring Arc: Wide slash that slows enemy speed
        soundSystem.playSword();
        ctx.spawnParticles(state.x + aim.dx * 14, state.y + aim.dy * 14, state.z + 6, 8, '#e879f9', 'HAMSTRING!');
        for (const e of state.enemies) {
          if (e.isSubmerged) continue;
          if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
          if (Math.hypot(e.x - state.x, e.y - state.y) < 34) {
            e.speed = Math.max(12, e.speed * 0.65);
            e.stun = 0.6;
            applyDamageFn(
              e.shields,
              e.armor,
              e.frame,
              computeEnemyDamage(action.damage, e.faction),
              'Pierce'
            );
          }
        }
      } else {
        // Suppression Arc: 4-bolt horizontal fan
        const baseAngle = Math.atan2(aim.dy, aim.dx);
        for (const offset of [-0.24, -0.08, 0.08, 0.24]) {
          const ang = baseAngle + offset;
          state.projectiles.push({
            x: state.x + Math.cos(ang) * 8,
            y: state.y + Math.sin(ang) * 8,
            z: state.z + 6,
            vx: Math.cos(ang) * 175,
            vy: Math.sin(ang) * 175,
            vz: 0,
            damage: Math.round(action.damage * overdriveMult),
            damageType: 'Pierce',
            isPlayer: true,
            life: 0.65,
            radius: 3,
            color: '#38bdf8',
            trailColor: '#0284c7',
            lightRadius: 16,
          });
        }
        soundSystem.playLaser();
      }
      return;
    }

    if (slot === 4) {
      if (isKhopesh) {
        // Whirlwind Sever: 360-degree heavy cleave
        soundSystem.playSword();
        ctx.spawnParticles(state.x, state.y, state.z + 8, 14, '#f43f5e', 'WHIRLWIND!');
        for (const e of state.enemies) {
          if (e.isSubmerged) continue;
          if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
          if (Math.hypot(e.x - state.x, e.y - state.y) < 38) {
            e.stun = 1.0;
            applyDamageFn(
              e.shields,
              e.armor,
              e.frame,
              computeEnemyDamage(action.damage, e.faction),
              'Pierce'
            );
          }
        }
      } else {
        // Overcharge Discharge: High-damage Beam
        state.projectiles.push({
          x: state.x + aim.dx * 10,
          y: state.y + aim.dy * 10,
          z: state.z + 6,
          vx: aim.dx * 240,
          vy: aim.dy * 240,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Beam',
          isPlayer: true,
          life: 0.85,
          radius: 5.5,
          color: '#c084fc',
          trailColor: '#a855f7',
          lightRadius: 32,
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
      vx: aim.dx * 210,
      vy: aim.dy * 210,
      vz: 0,
      damage: Math.round(desc.damage * overdriveMult),
      damageType: 'Shock',
      isPlayer: true,
      life: 0.75,
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
          'Burn'
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
    soundSystem.playHeal();
    ctx.spawnParticles(state.x, state.y, state.z + 8, 12, '#77c7ff', '+35 SHIELD');
  }
}

/**
 * Step all modular action cooldowns and buff timers each frame.
 */
export function updateActionTimers(state: OrionState, dt: number): void {
  if (state.actionCooldowns) {
    for (const key of Object.keys(state.actionCooldowns)) {
      if (state.actionCooldowns[key] > 0) {
        state.actionCooldowns[key] = Math.max(0, state.actionCooldowns[key] - dt);
      }
    }
  }
  if (state.overdriveTimer && state.overdriveTimer > 0) {
    state.overdriveTimer = Math.max(0, state.overdriveTimer - dt);
  }
  if (state.opticMarkTimer && state.opticMarkTimer > 0) {
    state.opticMarkTimer = Math.max(0, state.opticMarkTimer - dt);
  }
}

export { ASSIGNABLE_ACTION_CATALOG };
