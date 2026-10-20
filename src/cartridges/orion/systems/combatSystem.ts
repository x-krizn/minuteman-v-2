/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import {
  DIR_VECTORS,
  getDirFromVector,
  WEAPON_SWAP_COOLDOWN,
} from '../constants';
import {
  ASSIGNABLE_ACTION_CATALOG,
  getClassUtilityDefinition,
  getResolvedActionDescriptor,
  OrionActionDescriptor,
} from '../database/equipment';
import { getItemDefinition } from '../database/items';
import {
  ACTION_MODIFICATION_CATALOG,
  awardPilotSkillXp,
  computeInterfaceFeatModifiers,
} from '../database/progression';
import { getWeaponDefinition } from '../database/weapons';
import {
  ArmorState,
  DamageType,
  EnemyEntity,
  FrameState,
  OrionCombatContext,
  OrionState,
  ShieldState,
} from '../types';
import { notifyOrionStateChange } from './playerSystem';
import { updateBladeTrails } from './renderSystem';

// ─── 1. TARGET LOCK-ON & AIMING ──────────────────────────────────────────────

const MAX_LOCK_ON_RANGE = 135;

export function isTargetableEnemy(e: EnemyEntity): boolean {
  if (e.frame.integrity <= 0) return false;
  if (e.isSubmerged) return false;
  if (e.type === 'bog_poe') return false;
  if (e.type === 'town_npc' && e.npcDisposition !== 'feral') return false;
  return true;
}

export function getLockedTarget(state: OrionState): EnemyEntity | null {
  if (state.lockedTargetId === null || state.lockedTargetId === undefined) {
    return null;
  }
  const target = state.enemies.find(
    (e) => e.id === state.lockedTargetId && isTargetableEnemy(e)
  );
  if (!target) return null;
  const dist = Math.hypot(target.x - state.x, target.y - state.y);
  if (dist > MAX_LOCK_ON_RANGE) return null;
  return target;
}

export function cycleTargetLock(
  state: OrionState,
  ctx?: OrionCombatContext
): EnemyEntity | null {
  const candidates = state.enemies
    .filter((e) => isTargetableEnemy(e))
    .map((e) => ({
      entity: e,
      dist: Math.hypot(e.x - state.x, e.y - state.y),
    }))
    .filter((item) => item.dist <= MAX_LOCK_ON_RANGE)
    .sort((a, b) => a.dist - b.dist)
    .map((item) => item.entity);

  if (candidates.length === 0) {
    state.lockedTargetId = null;
    soundSystem.playMenuBeep();
    if (ctx) {
      ctx.say('NO HOSTILE TARGETS IN RANGE');
    }
    notifyOrionStateChange();
    return null;
  }

  if (state.lockedTargetId === null || state.lockedTargetId === undefined) {
    const first = candidates[0];
    state.lockedTargetId = first.id;
    soundSystem.playSelect();
    if (ctx) {
      ctx.say(`TARGET LOCKED: ${first.name.toUpperCase()}`);
    }
    notifyOrionStateChange();
    return first;
  }

  const currentIdx = candidates.findIndex((e) => e.id === state.lockedTargetId);
  if (currentIdx === -1) {
    const first = candidates[0];
    state.lockedTargetId = first.id;
    soundSystem.playSelect();
    if (ctx) {
      ctx.say(`TARGET LOCKED: ${first.name.toUpperCase()}`);
    }
    notifyOrionStateChange();
    return first;
  }

  if (currentIdx + 1 < candidates.length) {
    const next = candidates[currentIdx + 1];
    state.lockedTargetId = next.id;
    soundSystem.playSelect();
    if (ctx) {
      ctx.say(`TARGET LOCKED: ${next.name.toUpperCase()}`);
    }
    notifyOrionStateChange();
    return next;
  } else {
    state.lockedTargetId = null;
    soundSystem.playMenuBeep();
    if (ctx) {
      ctx.say('TARGET LOCK DISENGAGED');
    }
    notifyOrionStateChange();
    return null;
  }
}

export function updateTargetLock(state: OrionState): EnemyEntity | null {
  const target = getLockedTarget(state);
  if (!target) {
    if (state.lockedTargetId !== null) {
      state.lockedTargetId = null;
      notifyOrionStateChange();
    }
    return null;
  }

  const dx = target.x - state.x;
  const dy = target.y - state.y;
  const dist = Math.hypot(dx, dy) || 1;
  state.faceX = dx / dist;
  state.faceY = dy / dist;
  state.dir = getDirFromVector(dx, dy);

  return target;
}

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

// ─── 2. ASSIGNABLE [L] & [R] MULTI-SOURCE ACTIONS ────────────────────────────

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
    const reqLvl = idx === 0 || idx === 1 ? 1 : idx === 2 ? 5 : 12;
    if (lvl >= reqLvl || (gates?.beltSlotsUnlocked ?? 2) > idx) {
      return { unlocked: true, reason: `READY (BELT SLOT ${idx + 1} · LVL ${reqLvl})` };
    }
    return {
      unlocked: false,
      reason: `UNLOCKS AT LEVEL ${reqLvl} (BELT SLOT ${idx + 1})`,
    };
  }

  return { unlocked: true, reason: 'READY' };
}

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

export function resetTriggerActionsToDefault(state: OrionState): void {
  state.assignedActions = {
    L: 'weapon_skill_1',
    R: 'weapon_skill_2',
  };
  notifyOrionStateChange();
}

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
  if (desc.sourceCategory === 'belt' && typeof desc.beltSlotIndex === 'number') {
    const itemId = state.equipmentSlots?.belt?.[desc.beltSlotIndex];
    const invSlot = itemId
      ? state.inventorySlots.find((s) => s.itemId === itemId)
      : undefined;
    if (!itemId || !invSlot || invSlot.count <= 0) {
      soundSystem.playMenuBeep();
      ctx.say(`[${trigger}] BELT SLOT ${desc.beltSlotIndex + 1} EMPTY`);
      return false;
    }
  }

  const cd = getActionCooldown(state, assignedId);
  if (cd > 0) {
    soundSystem.playMenuBeep();
    ctx.say(`${desc.shortLabel} COOLDOWN (${cd.toFixed(1)}S)`);
    return false;
  }

  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const heatPenaltyMult = state.gates?.loadPenalty?.heatMult ?? 1.0;
  const installedMeleeModId = state.equipmentSlots?.installedMods?.melee;
  const installedRangedModId = state.equipmentSlots?.installedMods?.ranged;
  const activeMod = ACTION_MODIFICATION_CATALOG.find(
    (m) => m.id === installedMeleeModId || m.id === installedRangedModId
  );
  const modCdMult = activeMod?.modifiers.cooldownMult ?? 1.0;
  const modTellMult = activeMod?.modifiers.tellDurationMult ?? 1.0;

  const finalCooldown = desc.cooldownSec * featMods.cooldownMult * modCdMult;

  state.actionCooldowns = state.actionCooldowns || {};
  state.actionCooldowns[assignedId] = finalCooldown;
  if (desc.sourceCategory === 'weapon' && desc.weaponSkillSlot) {
    state.skillCooldowns[desc.weaponSkillSlot] = finalCooldown;
    state.activeSkillSlot = desc.weaponSkillSlot;
  } else {
    state.activeSkillSlot = -1;
  }

  state.activeActionId = assignedId;
  state.skillTellTimer = Math.max(0.05, desc.tellDurationSec * modTellMult);
  state.skillActionTimer = Math.max(0.15, desc.actionDurationSec);

  if (desc.heatCost > 0) {
    const scaledHeat = desc.heatCost * heatPenaltyMult * featMods.heatGenMult;
    state.heat = Math.min(state.maxHeat, state.heat + scaledHeat);
  } else if (desc.heatCost < 0) {
    state.heat = Math.max(0, state.heat + desc.heatCost);
  }

  // Use-Based Pilot Skill Progression:
  if (desc.sourceCategory === 'weapon') {
    const currentWeaponId =
      state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
    awardPilotSkillXp(
      state,
      currentWeaponId === 'khopesh' ? 'melee_cqc' : 'ballistics_kinetics',
      12,
      ctx
    );
  } else {
    awardPilotSkillXp(state, 'reactor_flux', 14, ctx);
  }

  soundSystem.playCharge();
  ctx.say(`[${trigger}] ${desc.name.toUpperCase()}`);
  notifyOrionStateChange();
  return true;
}

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

  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const overdriveMult = ((state.overdriveTimer || 0) > 0 ? 1.3 : 1.0) * featMods.damageMult;
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
        soundSystem.playSword();
        state.bladeTrails = state.bladeTrails || [];
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: Math.atan2(aim.dy, aim.dx),
          arcSpan: Math.PI * 1.25,
          radius: 22,
          color: '#c084fc',
          coreColor: '#ffffff',
          life: 0.26,
          maxLife: 0.26,
        });
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
        soundSystem.playSword();
        state.bladeTrails = state.bladeTrails || [];
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: Math.atan2(aim.dy, aim.dx),
          arcSpan: Math.PI * 1.1,
          radius: 24,
          color: '#e879f9',
          coreColor: '#fdf4ff',
          life: 0.25,
          maxLife: 0.25,
        });
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
        soundSystem.playSword();
        state.bladeTrails = state.bladeTrails || [];
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: 0,
          arcSpan: Math.PI * 1.95,
          radius: 28,
          color: '#f43f5e',
          coreColor: '#ffe4e6',
          life: 0.3,
          maxLife: 0.3,
        });
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
      damageType: 'Pulse',
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
    if (utilDef.frameRestore > 0) {
      state.frame.integrity = Math.min(
        state.frame.maxIntegrity,
        state.frame.integrity + utilDef.frameRestore
      );
      if (state.frame.integrity > 40) {
        state.frame.state = 'Operational';
      }
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
    soundSystem.playHeal();
    ctx.spawnParticles(
      state.x,
      state.y,
      state.z + 10,
      14,
      '#4ade80',
      `${utilDef.shortLabel} ONLINE`
    );
    awardPilotSkillXp(state, 'reactor_flux', 16, ctx);
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
      awardPilotSkillXp(state, 'heavy_chassis', 10, ctx);
      notifyOrionStateChange();
    }
  }
}

export function activateUtilityOrBeltSlot(
  state: OrionState,
  actionId: string
): boolean {
  const status = isActionUnlocked(state, actionId);
  const ctx: OrionCombatContext = {
    state,
    sound: soundSystem,
    spawnParticles: (x, y, z, count, color, label) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 14 + Math.random() * 28;
        state.particles.push({
          x,
          y,
          z,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          vz: 15 + Math.random() * 25,
          life: 0.35 + Math.random() * 0.25,
          maxLife: 0.6,
          color,
          size: 2,
          label: i === 0 ? label : undefined,
          fade: true,
        });
      }
    },
    say: (text: string) => {
      state.toastText = text;
      state.toastTimer = 2.6;
    },
  };

  if (!status.unlocked) {
    soundSystem.playMenuBeep();
    ctx.say(status.reason);
    notifyOrionStateChange();
    return false;
  }

  const desc = getResolvedActionDescriptor(state, actionId);
  const cd = getActionCooldown(state, actionId);
  if (cd > 0) {
    soundSystem.playMenuBeep();
    ctx.say(`${desc.shortLabel} COOLDOWN (${cd.toFixed(1)}S)`);
    notifyOrionStateChange();
    return false;
  }

  if (desc.sourceCategory === 'belt' && typeof desc.beltSlotIndex === 'number') {
    const itemId = state.equipmentSlots?.belt?.[desc.beltSlotIndex];
    const invSlot = itemId
      ? state.inventorySlots.find((s) => s.itemId === itemId)
      : undefined;
    if (!itemId || !invSlot || invSlot.count <= 0) {
      soundSystem.playMenuBeep();
      ctx.say(`BELT SLOT ${desc.beltSlotIndex + 1} EMPTY`);
      notifyOrionStateChange();
      return false;
    }
  }

  state.actionCooldowns = state.actionCooldowns || {};
  state.actionCooldowns[actionId] = desc.cooldownSec;
  if (desc.heatCost > 0) {
    state.heat = Math.min(state.maxHeat, state.heat + desc.heatCost);
  } else if (desc.heatCost < 0) {
    state.heat = Math.max(0, state.heat + desc.heatCost);
  }

  executeActionPayload(state, ctx, actionId, () => undefined);
  notifyOrionStateChange();
  return true;
}

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

// ─── 3. THREE DEFENSE LAYERS, WEAPON SWAPS & COMBAT LOOP ─────────────────────

export function performWeaponSwap(
  state: OrionState,
  ctx?: { say: (text: string) => void },
  targetIndex?: number,
  bypassCooldown: boolean = false
): boolean {
  if (!bypassCooldown && state.gates && !state.gates.canWeaponSwap) {
    soundSystem.playMenuBeep();
    ctx?.say('WEAPON SWAP LOCKED — INTERACT WITH THE POE [3,0] OR BEDIVERE [S] (LVL 2)');
    notifyOrionStateChange();
    return false;
  }

  if (state.equippedWeapons.length <= 1) {
    soundSystem.playMenuBeep();
    ctx?.say('NO SECONDARY WEAPON EQUIPPED');
    notifyOrionStateChange();
    return false;
  }

  if (!bypassCooldown && state.weaponSwapCooldown > 0) {
    soundSystem.playMenuBeep();
    ctx?.say(`SWAP COOLDOWN: ${state.weaponSwapCooldown.toFixed(1)}s`);
    notifyOrionStateChange();
    return false;
  }

  const nextIdx =
    targetIndex !== undefined
      ? targetIndex % state.equippedWeapons.length
      : (state.activeWeaponIndex + 1) % state.equippedWeapons.length;

  state.activeWeaponIndex = nextIdx;

  const newWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const newWeapon = getWeaponDefinition(newWeaponId);
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const swapPenaltyMult = state.gates?.loadPenalty?.swapTimeMult ?? 1.0;

  if (!bypassCooldown) {
    state.weaponSwapCooldown =
      WEAPON_SWAP_COOLDOWN * swapPenaltyMult * featMods.swapTimeMult;
  }

  if (newWeapon) {
    state.maxAmmo = newWeapon.shotsPerChain;
    state.ammo = newWeapon.shotsPerChain;
    state.reloadDuration = newWeapon.reloadDurationSec;
  }

  state.isReloading = false;
  state.reloadTimer = 0;
  state.activeSkillSlot = null;
  state.skillTellTimer = 0;
  state.skillActionTimer = 0;

  soundSystem.playPowerup();
  ctx?.say(`SWAPPED TO: ${newWeapon?.name.toUpperCase() || 'WEAPON'}`);
  notifyOrionStateChange();
  return true;
}

export function applyDamageToLayers(
  shields: ShieldState,
  armor: ArmorState,
  frame: FrameState,
  rawDamage: number,
  _damageType: DamageType,
  spawnParticles?: (count: number, color: string, label: string) => void
): { absorbedByShield: number; stoppedByArmor: boolean; frameDamage: number } {
  let remaining = rawDamage;
  let absorbedByShield = 0;
  let stoppedByArmor = false;
  let frameDamage = 0;

  // 1. SHIELD LAYER
  if (shields.capacity > 0) {
    if (remaining <= shields.capacity) {
      shields.capacity -= remaining;
      absorbedByShield = remaining;
      remaining = 0;
      shields.rechargeDelay = 3.0;
      spawnParticles?.(4, '#77c7ff', 'SHIELD ABSORB');
      return { absorbedByShield, stoppedByArmor: false, frameDamage: 0 };
    } else {
      absorbedByShield = shields.capacity;
      remaining -= shields.capacity;
      shields.capacity = 0;
      shields.overloaded = true;
      shields.overloadTimer = 4.0;
      spawnParticles?.(8, '#77c7ff', 'SHIELD BROKEN!');
    }
  }

  // 2. ARMOR LAYER
  if (armor.durability > 0 && remaining > 0) {
    const durabilityLoss = Math.min(armor.durability, Math.max(3, Math.round(remaining * 0.3)));
    armor.durability -= durabilityLoss;

    const durRatio = Math.max(0.1, armor.durability / armor.maxDurability);
    const effThreshold = armor.threshold * durRatio;
    const effRating = armor.rating * durRatio;

    if (remaining < effThreshold) {
      stoppedByArmor = true;
      spawnParticles?.(5, '#ffd27d', 'ARMOR DEFLECT');
      return { absorbedByShield, stoppedByArmor: true, frameDamage: 0 };
    }

    remaining = Math.max(1, remaining - effRating);
    spawnParticles?.(5, '#ffd27d', 'ARMOR PIERCED');
  }

  // 3. FRAME INTEGRITY LAYER
  if (remaining > 0) {
    frameDamage = Math.round(remaining);
    frame.integrity = Math.max(0, frame.integrity - frameDamage);

    if (frame.integrity <= 0) {
      frame.state = 'Defeated';
      spawnParticles?.(12, '#ff9b9b', 'FRAME DESTROYED');
    } else if (frame.integrity <= 40) {
      frame.state = 'Critical';
      spawnParticles?.(8, '#ff9b9b', `CRITICAL! -${frameDamage}`);
    } else {
      frame.state = 'Operational';
      spawnParticles?.(6, '#8dd7ad', `-${frameDamage} FRAME`);
    }
  }

  return { absorbedByShield, stoppedByArmor, frameDamage };
}

export function handleCombatInput(
  input: {
    pressed: { a: boolean; b: boolean; x: boolean; y: boolean; l: boolean; r: boolean; select: boolean };
    held: { x: boolean; y: boolean; b: boolean };
  },
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  const currentWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const weapon = getWeaponDefinition(currentWeaponId);
  if (!weapon) return;

  if (state.isReloading) {
    const reloadMult = (state.overdriveTimer || 0) > 0 ? 1.6 : 1.0;
    state.reloadTimer -= dt * reloadMult;
    if (state.reloadTimer <= 0) {
      state.isReloading = false;
      state.ammo = state.maxAmmo;
      soundSystem.playSelect();
      ctx.say(currentWeaponId === 'khopesh' ? 'BLADE STANCE READY' : 'MAGAZINE RELOADED');
      notifyOrionStateChange();
    }
    return;
  }

  if ((input.pressed.x || input.held.x) && state.activeSkillSlot === null && !state.activeActionId) {
    if (state.ammo <= 0) {
      state.isReloading = true;
      state.reloadTimer = weapon.reloadDurationSec;
      soundSystem.playMenuBeep();
      ctx.say(currentWeaponId === 'khopesh' ? 'RECOVERING STANCE...' : 'RELOADING...');
      notifyOrionStateChange();
      return;
    }

    const installedRangedModId = state.equipmentSlots?.installedMods?.ranged;
    const rangedMod = ACTION_MODIFICATION_CATALOG.find((m) => m.id === installedRangedModId);
    const tellMult = currentWeaponId !== 'khopesh' ? (rangedMod?.modifiers.tellDurationMult ?? 1.0) : 1.0;

    const skill0 = weapon.moveset[0];
    state.activeSkillSlot = 0;
    state.activeActionId = null;
    state.skillTellTimer = Math.max(0.04, skill0.tellDurationSec * tellMult);
    const perShotAction =
      currentWeaponId === 'khopesh'
        ? 0.22
        : Math.max(0.08, weapon.chainDurationSec / Math.max(1, weapon.shotsPerChain) - skill0.tellDurationSec);
    state.skillActionTimer = perShotAction;
  }

  if (input.pressed.l && state.activeSkillSlot === null && !state.activeActionId) {
    initiateTriggerAction(state, ctx, 'L');
  }

  if (input.pressed.r && state.activeSkillSlot === null && !state.activeActionId) {
    initiateTriggerAction(state, ctx, 'R');
  }
}

export function updateCombat(
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const loadPenalty = state.gates?.loadPenalty;

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
        state.shields.capacity = Math.min(state.shields.maxCapacity, state.shields.capacity + 15 * dt);
      }
    }
  }

  if (state.heat > 0 && !state.isContinuousBoosting) {
    state.heat = Math.max(0, state.heat - 12 * featMods.heatVentMult * dt);
  }

  if (state.activeSkillSlot !== null || state.activeActionId) {
    const currentWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
    const weapon = getWeaponDefinition(currentWeaponId);

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
          color: currentWeaponId === 'khopesh' ? '#e879f9' : '#77c7ff',
          size: 2,
          fade: true,
        });
      }

      if (state.skillTellTimer <= 0) {
        if (state.activeSkillSlot === 0 && !state.activeActionId) {
          const action = weapon?.moveset[0];
          const aim = getCombatAimVector(state);
          const isKhopesh = currentWeaponId === 'khopesh';
          const overdriveMult = ((state.overdriveTimer || 0) > 0 ? 1.3 : 1.0) * featMods.damageMult;

          if (action && state.ammo > 0) {
            state.ammo -= 1;
            const shotHeat =
              action.heatCost * (loadPenalty?.heatMult ?? 1.0) * featMods.heatGenMult;
            state.heat = Math.min(state.maxHeat, state.heat + shotHeat);
            const shotDmg = Math.round(action.damage * overdriveMult);

            // Use-Based Pilot Skill Progression: using weapon progresses its skill
            awardPilotSkillXp(
              state,
              isKhopesh ? 'melee_cqc' : 'ballistics_kinetics',
              6,
              ctx
            );

            // §3.5 Critical Frame State (LOCKED): 15% misfire chance per shot when Frame Integrity <= 40 HP
            const isCriticalMisfire =
              state.frame.integrity <= 40 && Math.random() < 0.15;

            if (isCriticalMisfire) {
              soundSystem.playMenuBeep();
              ctx.spawnParticles(
                state.x + aim.dx * 8,
                state.y + aim.dy * 8,
                state.z + 8,
                6,
                '#f87171',
                'MISFIRE! (CRITICAL)'
              );
            } else if (isKhopesh) {
              state.bladeTrails = state.bladeTrails || [];
              state.bladeTrails.push({
                x: state.x,
                y: state.y,
                z: state.z,
                angle: Math.atan2(aim.dy, aim.dx),
                arcSpan: Math.PI * 0.9,
                radius: 17,
                color: '#e879f9',
                coreColor: '#fdf4ff',
                life: 0.22,
                maxLife: 0.22,
                flipDir: state.ammo % 2 === 0,
              });
              state.projectiles.push({
                x: state.x + aim.dx * 10,
                y: state.y + aim.dy * 10,
                z: state.z + 6,
                vx: aim.dx * 105,
                vy: aim.dy * 105,
                vz: 0,
                damage: shotDmg,
                damageType: action.damageType,
                isPlayer: true,
                life: 0.22,
                radius: 7,
                color: '#e879f9',
                trailColor: '#c084fc',
                lightRadius: 22,
              });
              ctx.spawnParticles(state.x + aim.dx * 12, state.y + aim.dy * 12, state.z + 6, 5, '#e879f9', '');
              soundSystem.playSword();
            } else {
              // Apply accuracy spread if Load Penalty or Interface Feat modifies accuracy
              const accMult = (loadPenalty?.accuracyMult ?? 1.0) * featMods.accuracyMult;
              const spreadRad = accMult < 1.0 ? (Math.random() - 0.5) * 0.22 : 0;
              const baseAngle = Math.atan2(aim.dy, aim.dx) + spreadRad;

              const installedRangedModId = state.equipmentSlots?.installedMods?.ranged;
              const rangedMod = ACTION_MODIFICATION_CATALOG.find(
                (m) => m.id === installedRangedModId
              );
              const extraCount = rangedMod?.modifiers.extraProjectiles || 0;
              const offsets = extraCount > 0 ? [-0.07, 0.07] : [0];

              for (const off of offsets) {
                const ang = baseAngle + off;
                state.projectiles.push({
                  x: state.x + Math.cos(ang) * 8,
                  y: state.y + Math.sin(ang) * 8,
                  z: state.z + 6,
                  vx: Math.cos(ang) * 185,
                  vy: Math.sin(ang) * 185,
                  vz: 0,
                  damage: shotDmg,
                  damageType: action.damageType,
                  isPlayer: true,
                  life: 0.75,
                  radius: 3,
                  color: '#ffd27d',
                  trailColor: '#f59e0b',
                  lightRadius: 18,
                });
              }
              soundSystem.playLaser();
            }

            if (state.ammo <= 0 && weapon) {
              state.isReloading = true;
              state.reloadTimer = weapon.reloadDurationSec;
            }
          }
        } else if (state.activeActionId) {
          executeActionPayload(state, ctx, state.activeActionId, applyDamageToLayers);
        }
      }
    } else {
      state.skillActionTimer -= dt;
      if (state.skillActionTimer <= 0) {
        state.activeSkillSlot = null;
        state.activeActionId = null;
      }
    }
  }

  for (const e of state.enemies) {
    if (e.type === 'bog_poe') continue;
    if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;

    if (e.state === 'attack' && e.stateTimer > 0.1) {
      const dist = Math.hypot(state.x - e.x, state.y - e.y);
      if (dist < 22 && !state.isBoosterDashing) {
        e.stateTimer = 0.05;
        let hitDamage = e.damage;
        if (e.type === 'bors_knight') {
          e.hitsLanded = (e.hitsLanded || 0) + 1;
          hitDamage = Math.round(e.damage * (1 + 0.1 * (e.hitsLanded - 1)));
        }

        soundSystem.playHit();
        applyDamageToLayers(
          state.shields,
          state.armor,
          state.frame,
          hitDamage,
          e.damageType,
          (count, color, label) => ctx.spawnParticles(state.x, state.y, state.z + 8, count, color, label)
        );
        // Use-Based Pilot Skill Progression: absorbing hits progresses heavy_chassis
        awardPilotSkillXp(state, 'heavy_chassis', 10, ctx);
      }
    }
  }
}

export { ASSIGNABLE_ACTION_CATALOG, getResolvedActionDescriptor };
