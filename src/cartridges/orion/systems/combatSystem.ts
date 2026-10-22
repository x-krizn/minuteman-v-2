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
  getWeaponGemCombatModifiers,
  getWeaponGemVisuals,
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
import { getActiveRoomBounds, notifyOrionStateChange } from './playerSystem';
import { updateBladeTrails } from './renderSystem';

// ─── 1. TARGET LOCK-ON & AIMING ──────────────────────────────────────────────

const MAX_LOCK_ON_RANGE = 165;

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
  const gemCombatMods = getWeaponGemCombatModifiers(state);
  const heatPenaltyMult = state.gates?.loadPenalty?.heatMult ?? 1.0;
  const installedMeleeModId = state.equipmentSlots?.installedMods?.melee;
  const installedRangedModId = state.equipmentSlots?.installedMods?.ranged;
  const activeMod = ACTION_MODIFICATION_CATALOG.find(
    (m) => m.id === installedMeleeModId || m.id === installedRangedModId
  );
  const modCdMult = activeMod?.modifiers.cooldownMult ?? 1.0;
  const modTellMult = activeMod?.modifiers.tellDurationMult ?? 1.0;
  const modHeatDelta = activeMod?.modifiers.heatCostDelta ?? 0;

  const finalCooldown =
    desc.cooldownSec *
    featMods.cooldownMult *
    modCdMult *
    gemCombatMods.skillCooldownMult;

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

  const rawHeat = desc.heatCost + (desc.heatCost >= 0 ? modHeatDelta : 0);
  if (rawHeat > 0) {
    const scaledHeat =
      rawHeat *
      heatPenaltyMult *
      featMods.heatGenMult *
      gemCombatMods.skillHeatCostMult;
    state.heat = Math.min(state.maxHeat, state.heat + scaledHeat);
  } else if (rawHeat < 0) {
    state.heat = Math.max(0, state.heat + rawHeat);
  }

  awardPilotSkillXp(state, state.traitLine, 12, ctx);

  soundSystem.playCharge();
  ctx.say(`[${trigger}] ${desc.name.toUpperCase()}`);
  notifyOrionStateChange();
  return true;
}

function normalizeAngleDiff(a: number, b: number): number {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

/**
 * Linear piercing corridor test (for Short Spear, Avalon Lance, Stinger Thrust, Enraged Bors Lunge).
 * Checks forward projection along `angle` within `[-4, length]` and perpendicular distance `<= halfWidth`.
 */
export function isTargetInThrustCorridor(
  ox: number,
  oy: number,
  angle: number,
  length: number,
  halfWidth: number,
  tx: number,
  ty: number
): boolean {
  const rx = tx - ox;
  const ry = ty - oy;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const forward = rx * cos + ry * sin;
  const perp = Math.abs(-rx * sin + ry * cos);
  return forward >= -4 && forward <= length && perp <= halfWidth;
}

/**
 * Directional sector/arc test (for Long Sword slashes, Shotel cleaves, Hand Axe chops, Shield bashes).
 */
export function isTargetInDirectionalArc(
  ox: number,
  oy: number,
  angle: number,
  reach: number,
  arcSpan: number,
  tx: number,
  ty: number
): boolean {
  const dist = Math.hypot(tx - ox, ty - oy);
  if (dist > reach) return false;
  if (dist < 6 || arcSpan >= Math.PI * 1.85) return true;
  const targetAng = Math.atan2(ty - oy, tx - ox);
  return Math.abs(normalizeAngleDiff(targetAng, angle)) <= arcSpan * 0.5 + 0.16;
}

/**
 * Concentrated circular impact zone test centered at `forwardOffset` ahead of the attacker (for Mace slams & Ground tremors).
 */
export function isTargetInImpactZone(
  ox: number,
  oy: number,
  angle: number,
  forwardOffset: number,
  radius: number,
  tx: number,
  ty: number
): boolean {
  const ix = ox + Math.cos(angle) * forwardOffset;
  const iy = oy + Math.sin(angle) * forwardOffset;
  return Math.hypot(tx - ix, ty - iy) <= radius;
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
  const aimAngle = Math.atan2(aim.dy, aim.dx);
  const currentWeaponId =
    desc.weaponId ||
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

  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const gemCombatMods = getWeaponGemCombatModifiers(state, currentWeaponId);
  const overdriveMult =
    ((state.overdriveTimer || 0) > 0 ? 1.3 : 1.0) *
    featMods.damageMult *
    gemCombatMods.damageMult;
  const opticMult = (state.opticMarkTimer || 0) > 0 ? 1.25 : 1.0;
  const hasKnightsOath = state.equippedFeats.includes('knights_oath');

  const computeEnemyDamage = (
    baseDmg: number,
    faction?: string,
    target?: (typeof state.enemies)[number]
  ) => {
    const oathMult = hasKnightsOath && faction === 'camelot' ? 1.25 : 1.0;
    const isLockedOrStaggered =
      target && (target.id === state.lockedTargetId || target.stun > 0);
    const charoiteMult = isLockedOrStaggered
      ? gemCombatMods.lockedOrStaggeredDamageMult
      : 1.0;
    return Math.round(baseDmg * overdriveMult * opticMult * oathMult * charoiteMult);
  };

  let skillHitGrantedBonus = false;
  const applyHitToEnemy = (
    e: (typeof state.enemies)[number],
    baseDmg: number,
    dmgType: DamageType,
    stunSec: number = 0.35,
    knockbackDist: number = 0,
    extraArmorDent: number = 0
  ) => {
    e.stun = Math.max(e.stun, stunSec);
    e.hurt = 0.22;
    const totalArmorDent = extraArmorDent + gemCombatMods.extraArmorDentOnHit;
    if (totalArmorDent > 0 && e.armor.durability > 0) {
      e.armor.durability = Math.max(0, e.armor.durability - totalArmorDent);
    }
    if (knockbackDist !== 0) {
      const bounds = getActiveRoomBounds(state);
      const kdx = e.x - state.x;
      const kdy = e.y - state.y;
      const kNorm = Math.hypot(kdx, kdy) || 1;
      e.x = Math.max(12, Math.min(bounds.widthPx - 12, e.x + (kdx / kNorm) * knockbackDist));
      e.y = Math.max(12, Math.min(bounds.heightPx - 12, e.y + (kdy / kNorm) * knockbackDist));
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
      if (gemCombatMods.frameRepairOnSkillHit > 0) {
        state.frame.integrity = Math.min(
          state.frame.maxIntegrity,
          state.frame.integrity + gemCombatMods.frameRepairOnSkillHit
        );
        if (state.frame.integrity > 40) {
          state.frame.state = 'Operational';
        }
      }
      if (gemCombatMods.presenceGainOnHit > 0) {
        state.presence = Math.min(100, (state.presence || 0) + gemCombatMods.presenceGainOnHit);
      }
    }
    applyDamageFn(
      e.shields,
      e.armor,
      e.frame,
      computeEnemyDamage(baseDmg, e.faction, e),
      dmgType,
      (count, color, label) => ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, label)
    );
    soundSystem.playHit();
  };

  // 1. WEAPON SKILLS (Slots 1..4)
  if (desc.sourceCategory === 'weapon' && desc.weaponSkillSlot) {
    const slot = desc.weaponSkillSlot;
    const action = weapon?.moveset[slot] || desc;
    state.bladeTrails = state.bladeTrails || [];

    // ─── SLOT 1: PRIMARY SPECIAL SKILL ───────────────────────────────────────
    if (slot === 1) {
      if (currentWeaponId === 'short_spear') {
        // Impaling Skewer: Deep forward lunge + long narrow piercing corridor (48px reach, ±11px width)
        state.isBoosterDashing = true;
        state.boosterTimer = 0.14;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.25,
          radius: 46,
          length: 48,
          width: 11,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 48, 12, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Pierce', 0.55, 6);
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
      } else if (currentWeaponId === 'avalon_siege_lance') {
        // Breaching Bore: Heavy artillery lance thrust + high-velocity piercing sabot
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.3,
          radius: 44,
          length: 46,
          width: 14,
          style: 'thrust',
          color: trailColor,
          coreColor,
          life: 0.28,
          maxLife: 0.28,
        });
        state.projectiles.push({
          x: state.x + aim.dx * 12,
          y: state.y + aim.dy * 12,
          z: state.z + 6,
          vx: aim.dx * 245,
          vy: aim.dy * 245,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Pierce',
          isPlayer: true,
          life: 0.65,
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
      } else if (currentWeaponId === 'mace') {
        // Skullcracker Overhead: Concentrated frontal overhead slam + crater shockwave + heavy stun
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.6,
          radius: 24,
          length: 18,
          width: 22,
          style: 'slam',
          color: trailColor,
          coreColor,
          life: 0.3,
          maxLife: 0.3,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInImpactZone(state.x, state.y, aimAngle, 18, 22, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Impact', 1.1, 8, 8);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 18,
          state.y + aim.dy * 18,
          state.z + 4,
          12,
          trailColor,
          action.name || 'SKULLCRACKER!'
        );
        soundSystem.playExplosion();
      } else if (currentWeaponId === 'long_sword' || currentWeaponId === 'khopesh') {
        // Vanguard Stinger Thrust / Execution Lunge: Forward dash + linear point thrust
        state.isBoosterDashing = true;
        state.boosterTimer = 0.14;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        const thrustLen = currentWeaponId === 'long_sword' ? 44 : 38;
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
            applyHitToEnemy(e, action.damage, 'Pierce', 0.5, 6);
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
      } else if (currentWeaponId === 'hand_axe') {
        // Guillotine Split: Leaping downward chop + impact split
        state.isBoosterDashing = true;
        state.boosterTimer = 0.12;
        state.boosterDirX = aim.dx;
        state.boosterDirY = aim.dy;
        state.bladeTrails.push({
          x: state.x + aim.dx * 6,
          y: state.y + aim.dy * 6,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.65,
          radius: 26,
          width: 16,
          style: 'chop',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 30, Math.PI * 0.75, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Pierce', 0.6, 6, 5);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 14,
          state.y + aim.dy * 14,
          state.z + 6,
          9,
          trailColor,
          action.name
        );
        soundSystem.playSword();
      } else if (weapon?.equipmentRole === 'shield') {
        // Shield Slot 1: Buckler Parry / Heater Shield Charge / Pavise Fortress Plant
        const shieldRestore =
          currentWeaponId === 'pavise_shield'
            ? 35
            : currentWeaponId === 'buckler_shield'
              ? 15
              : 10;
        state.shields.overloaded = false;
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + shieldRestore
        );
        if (currentWeaponId === 'heater_shield') {
          state.isBoosterDashing = true;
          state.boosterTimer = 0.16;
          state.boosterDirX = aim.dx;
          state.boosterDirY = aim.dy;
        }
        const isPavisePlant = currentWeaponId === 'pavise_shield';
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: isPavisePlant ? Math.PI * 2 : Math.PI * 0.75,
          radius: isPavisePlant ? 30 : 26,
          width: 18,
          style: isPavisePlant ? 'shockwave' : 'bash',
          color: trailColor,
          coreColor,
          life: 0.28,
          maxLife: 0.28,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          const hit = isPavisePlant
            ? Math.hypot(e.x - state.x, e.y - state.y) <= 32
            : isTargetInDirectionalArc(state.x, state.y, aimAngle, 34, Math.PI * 0.85, e.x, e.y);
          if (hit) {
            applyHitToEnemy(e, action.damage, action.damageType, 1.1, 14);
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 8, 10, trailColor, action.name);
        soundSystem.playSword();
      } else {
        // Ranged Slot 1 (Boltcaster AP Slug / Great Bow Bodkin Rail-Shot / Quiver Snap-Load Salvo)
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.45,
          radius: 16,
          style: 'volley',
          color: trailColor,
          coreColor,
          life: 0.18,
          maxLife: 0.18,
        });
        if (currentWeaponId === 'quiver') {
          state.ammo = Math.min(state.maxAmmo, state.ammo + 4);
          state.isReloading = false;
          for (const off of [-0.1, 0, 0.1]) {
            const ang = aimAngle + off;
            state.projectiles.push({
              x: state.x + Math.cos(ang) * 8,
              y: state.y + Math.sin(ang) * 8,
              z: state.z + 6,
              vx: Math.cos(ang) * 215,
              vy: Math.sin(ang) * 215,
              vz: 0,
              damage: Math.round(action.damage * 0.55 * overdriveMult),
              damageType: 'Pierce',
              isPlayer: true,
              life: 0.75,
              radius: 3,
              color: trailColor,
              trailColor: coreColor,
              lightRadius: 20,
            });
          }
        } else {
          state.projectiles.push({
            x: state.x + aim.dx * 10,
            y: state.y + aim.dy * 10,
            z: state.z + 6,
            vx: aim.dx * (currentWeaponId === 'great_bow' ? 255 : 230),
            vy: aim.dy * (currentWeaponId === 'great_bow' ? 255 : 230),
            vz: 0,
            damage: Math.round(action.damage * overdriveMult),
            damageType: action.damageType,
            isPlayer: true,
            life: 0.9,
            radius: currentWeaponId === 'great_bow' ? 5 : 4.5,
            color: trailColor,
            trailColor: coreColor,
            lightRadius: 26,
          });
        }
        soundSystem.playLaser();
      }
      return;
    }

    // ─── SLOT 2: TACTICAL SECONDARY / CONTROL SKILL ──────────────────────────
    if (slot === 2) {
      if (currentWeaponId === 'mace') {
        // Bell-Toll Shockwave: Radial ground shockwave ring centered on player
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
          if (Math.hypot(e.x - state.x, e.y - state.y) <= 36) {
            applyHitToEnemy(e, action.damage, 'Blast', 1.25, 10, 6);
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 6, 12, trailColor, action.name);
        soundSystem.playExplosion();
      } else if (currentWeaponId === 'buckler_shield') {
        // Ricochet Disc Toss: Throws magnetized buckler projectile + bash arc
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.6,
          radius: 18,
          style: 'bash',
          color: trailColor,
          coreColor,
          life: 0.2,
          maxLife: 0.2,
        });
        state.projectiles.push({
          x: state.x + aim.dx * 10,
          y: state.y + aim.dy * 10,
          z: state.z + 6,
          vx: aim.dx * 175,
          vy: aim.dy * 175,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Impact',
          isPlayer: true,
          life: 0.65,
          radius: 5,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 24,
        });
        soundSystem.playSword();
      } else if (currentWeaponId === 'pavise_shield') {
        // Siegebreaker Tremor: Drives pavise spike into floor for frontal slam + tremor
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
      } else if (currentWeaponId === 'hand_axe') {
        // Bearded Hook Pull: Chop hook that pulls enemies toward the player and staggers them!
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.58,
          radius: 28,
          width: 14,
          style: 'chop',
          color: trailColor,
          coreColor,
          life: 0.25,
          maxLife: 0.25,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 32, Math.PI * 0.7, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Impact', 0.95, -12);
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
      } else if (currentWeaponId === 'short_spear') {
        // Shaft Sweep Vault: Wide low polearm sweep + vaults player slightly back to keep spear distance
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 1.05,
          radius: 28,
          style: 'slash',
          color: trailColor,
          coreColor,
          life: 0.24,
          maxLife: 0.24,
        });
        const bounds = getActiveRoomBounds(state);
        state.x = Math.max(12, Math.min(bounds.widthPx - 12, state.x - aim.dx * 7));
        state.y = Math.max(12, Math.min(bounds.heightPx - 12, state.y - aim.dy * 7));
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 32, Math.PI * 1.15, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Impact', 1.1, 8);
          }
        }
        ctx.spawnParticles(state.x, state.y, state.z + 6, 8, trailColor, action.name);
        soundSystem.playSword();
      } else if (
        currentWeaponId === 'long_sword' ||
        currentWeaponId === 'khopesh' ||
        currentWeaponId === 'heater_shield'
      ) {
        // Crossguard Pommel Strike / Sweep Deflection / Vanguard Guard Pulse
        soundSystem.playSword();
        const isHeaterPulse = currentWeaponId === 'heater_shield';
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: isHeaterPulse ? Math.PI * 2 : Math.PI * 0.72,
          radius: isHeaterPulse ? 28 : 22,
          width: 16,
          style: isHeaterPulse ? 'shockwave' : 'bash',
          color: trailColor,
          coreColor,
          life: 0.25,
          maxLife: 0.25,
        });
        const shieldGain = isHeaterPulse ? 20 : 12;
        state.shields.overloaded = false;
        state.shields.capacity = Math.min(
          state.shields.maxCapacity,
          state.shields.capacity + shieldGain
        );
        ctx.spawnParticles(state.x, state.y, state.z + 8, 10, trailColor, action.name);
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          const hit = isHeaterPulse
            ? Math.hypot(e.x - state.x, e.y - state.y) <= 30
            : isTargetInDirectionalArc(state.x, state.y, aimAngle, 26, Math.PI * 0.85, e.x, e.y);
          if (hit) {
            applyHitToEnemy(e, action.damage, action.damageType || 'Impact', 1.35, 10);
          }
        }
      } else if (currentWeaponId === 'great_bow' || currentWeaponId === 'quiver') {
        // Broadhead Fan Volley / Caltrop Scatter
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
          currentWeaponId === 'great_bow'
            ? [-0.26, -0.13, 0, 0.13, 0.26]
            : [-0.36, -0.18, 0, 0.18, 0.36];
        const speed = currentWeaponId === 'great_bow' ? 195 : 135;
        const life = currentWeaponId === 'great_bow' ? 0.65 : 0.42;
        for (const off of offsets) {
          const ang = aimAngle + off;
          state.projectiles.push({
            x: state.x + Math.cos(ang) * 8,
            y: state.y + Math.sin(ang) * 8,
            z: state.z + 6,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            vz: 0,
            damage: Math.round(action.damage * overdriveMult),
            damageType: 'Pierce',
            isPlayer: true,
            life,
            radius: 3,
            color: trailColor,
            trailColor: coreColor,
            lightRadius: 16,
          });
        }
        soundSystem.playLaser();
      } else {
        // Concussion Grenade / Concussion Mortar (Gladius Boltcaster & Avalon Siege Lance)
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
          color: gemVis.gemId ? trailColor : '#ea580c',
          trailColor: gemVis.gemId ? coreColor : '#f97316',
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
                  computeEnemyDamage(action.damage, e.faction),
                  'Blast'
                );
              }
            }
          },
        });
        soundSystem.playLaser();
      }
      return;
    }

    // ─── SLOT 3: SUPPRESSION / SUNDER / FLURRY SKILL ─────────────────────────
    if (slot === 3) {
      if (currentWeaponId === 'short_spear') {
        // Viper Flurry: Triple rapid-fire spear thrust streaks in a narrow frontal fan
        soundSystem.playSword();
        for (const off of [-0.15, 0, 0.15]) {
          state.bladeTrails.push({
            x: state.x,
            y: state.y,
            z: state.z,
            angle: aimAngle + off,
            arcSpan: Math.PI * 0.2,
            radius: 38,
            length: 40,
            width: 8,
            style: 'thrust',
            color: trailColor,
            coreColor,
            life: 0.24,
            maxLife: 0.24,
          });
        }
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (
            isTargetInThrustCorridor(state.x, state.y, aimAngle, 40, 15, e.x, e.y)
          ) {
            e.speed = Math.max(12, e.speed * 0.7);
            applyHitToEnemy(e, action.damage, 'Pierce', 0.65, 4);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 18,
          state.y + aim.dy * 18,
          state.z + 6,
          9,
          trailColor,
          action.name
        );
      } else if (currentWeaponId === 'hand_axe') {
        // Tomahawk Hurl: Chop release + hurls a heavy spinning axe projectile
        soundSystem.playSword();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.55,
          radius: 18,
          style: 'chop',
          color: trailColor,
          coreColor,
          life: 0.2,
          maxLife: 0.2,
        });
        state.projectiles.push({
          x: state.x + aim.dx * 10,
          y: state.y + aim.dy * 10,
          z: state.z + 6,
          vx: aim.dx * 180,
          vy: aim.dy * 180,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Pierce',
          isPlayer: true,
          life: 0.65,
          radius: 4.5,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 22,
        });
      } else if (currentWeaponId === 'mace') {
        // Armor-Sunder Swing: Heavy blunt chop/slam that strips Layer 2 Armor Durability
        soundSystem.playSword();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.72,
          radius: 25,
          length: 14,
          width: 18,
          style: 'slam',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 28, Math.PI * 0.85, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Impact', 0.8, 8, 14);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 14,
          state.y + aim.dy * 14,
          state.z + 6,
          10,
          trailColor,
          'ARMOR SUNDER!'
        );
      } else if (weapon?.equipmentRole === 'shield') {
        // Shield Slot 3: Feint & Sidestep Bash / Bell-Ringer Slam / Iron Curtain Sweep
        soundSystem.playSword();
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: Math.PI * 0.85,
          radius: 26,
          width: 18,
          style: 'bash',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 30, Math.PI * 0.95, e.x, e.y)) {
            applyHitToEnemy(e, action.damage, 'Impact', 1.15, 14);
          }
        }
        ctx.spawnParticles(
          state.x + aim.dx * 12,
          state.y + aim.dy * 12,
          state.z + 6,
          9,
          trailColor,
          action.name
        );
      } else if (isMeleeOrShield) {
        // Long Sword Crescent Cleave / Khopesh Hamstring Arc / Avalon Bastion Sweep
        soundSystem.playSword();
        const reach = currentWeaponId === 'avalon_siege_lance' ? 40 : 32;
        const span = currentWeaponId === 'long_sword' ? Math.PI * 1.35 : Math.PI * 1.15;
        state.bladeTrails.push({
          x: state.x,
          y: state.y,
          z: state.z,
          angle: aimAngle,
          arcSpan: span,
          radius: reach - 2,
          style: 'slash',
          color: trailColor,
          coreColor,
          life: 0.26,
          maxLife: 0.26,
        });
        ctx.spawnParticles(
          state.x + aim.dx * 14,
          state.y + aim.dy * 14,
          state.z + 6,
          8,
          trailColor,
          action.name
        );
        for (const e of state.enemies) {
          if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
          if (isTargetInDirectionalArc(state.x, state.y, aimAngle, reach, span + 0.15, e.x, e.y)) {
            e.speed = Math.max(12, e.speed * 0.65);
            const kb = currentWeaponId === 'avalon_siege_lance' ? 16 : 6;
            applyHitToEnemy(e, action.damage, action.damageType || 'Pierce', 0.75, kb);
          }
        }
      } else if (currentWeaponId === 'great_bow' || currentWeaponId === 'quiver') {
        // Pinning Tether Arrow / Tracer Tag Dart
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
        if (currentWeaponId === 'quiver') {
          state.opticMarkTimer = 5.0;
        }
        state.projectiles.push({
          x: state.x + aim.dx * 9,
          y: state.y + aim.dy * 9,
          z: state.z + 6,
          vx: aim.dx * 210,
          vy: aim.dy * 210,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: action.damageType || 'Pierce',
          isPlayer: true,
          life: 0.8,
          radius: 4,
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
        // Gladius Boltcaster Suppression Arc (4-bolt horizontal fan)
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
            vx: Math.cos(ang) * 175,
            vy: Math.sin(ang) * 175,
            vz: 0,
            damage: Math.round(action.damage * overdriveMult),
            damageType: action.damageType || 'Pierce',
            isPlayer: true,
            life: 0.65,
            radius: 3,
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
      if (currentWeaponId === 'short_spear') {
        // Javelin ReactorHurl: Linear spear thrust release + high-velocity piercing javelin bolt
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
          vx: aim.dx * 240,
          vy: aim.dy * 240,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Pierce',
          isPlayer: true,
          life: 0.85,
          radius: 5,
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
      } else if (currentWeaponId === 'mace') {
        // Sanctum Consecration Slam: Overhead slam + wide sanctum shockwave ring
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
      } else if (currentWeaponId === 'long_sword') {
        // Excalibur Judgment Arc: Wide crescent slash + resonant forward wave projectile
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
          vx: aim.dx * 195,
          vy: aim.dy * 195,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Wave',
          isPlayer: true,
          life: 0.65,
          radius: 6,
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
      } else if (currentWeaponId === 'avalon_siege_lance') {
        // Grail Overcharge Barrage: Long reactor lance bore corridor + heavy wave projectile
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
          vx: aim.dx * 240,
          vy: aim.dy * 240,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: 'Wave',
          isPlayer: true,
          life: 0.85,
          radius: 6,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 34,
        });
        ctx.spawnParticles(state.x, state.y, state.z + 8, 14, trailColor, action.name);
      } else if (weapon?.equipmentRole === 'shield') {
        // Shield Slot 4: Capacitor Flash Counter / Sanctum Phalanx Wall / Citadel Aegis Overcharge
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
      } else if (isMeleeOrShield) {
        // Khopesh Whirlwind Sever / Hand Axe Berserker Cyclone: 360-degree whirlwind vortex
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
      } else if (currentWeaponId === 'quiver') {
        // Hurricane Quiver Dump: High-velocity 7-shaft fan
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
            vx: Math.cos(ang) * 210,
            vy: Math.sin(ang) * 210,
            vz: 0,
            damage: Math.round(action.damage * 0.6 * overdriveMult),
            damageType: 'Pierce',
            isPlayer: true,
            life: 0.75,
            radius: 3,
            color: trailColor,
            trailColor: coreColor,
            lightRadius: 18,
          });
        }
        soundSystem.playLaser();
      } else {
        // Gladius Overcharge Discharge / Great Bow Starfall Arc Barrage
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
          vx: aim.dx * 240,
          vy: aim.dy * 240,
          vz: 0,
          damage: Math.round(action.damage * overdriveMult),
          damageType: action.damageType || 'Beam',
          isPlayer: true,
          life: 0.85,
          radius: 5.5,
          color: trailColor,
          trailColor: coreColor,
          lightRadius: 32,
          onImpact:
            currentWeaponId === 'great_bow'
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
    awardPilotSkillXp(state, state.traitLine, 16, ctx);
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
      awardPilotSkillXp(state, state.traitLine, 10, ctx);
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
  const slot1 = slots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster';
  const slot2 = slots?.slot2 || state.equippedWeapons[1] || null;
  const slot3 = slots?.slot3 || null;

  if (!slot3) {
    soundSystem.playMenuBeep();
    ctx?.say('AUXILIARY SLOT 3 EMPTY — NO SWAP TARGET');
    notifyOrionStateChange();
    return false;
  }

  const w3 = getWeaponDefinition(slot3);
  const item3 = !w3 ? getItemDefinition(slot3) : undefined;

  let swapDone = false;
  let swapMessage = '';

  // Swapping rules:
  // If w3 is an off-hand only weapon (e.g. buckler, heater, pavise shield): swap with Slot 2
  // If w3 is a main-hand weapon (1-hand or 2-hand): swap with Slot 1
  // If slot3 is a consumable belt item: swap with Slot 2
  if (w3 && w3.handing === 'off-hand-only') {
    if (slots) {
      slots.slot2 = slot3;
      slots.slot3 = slot2;
    }
    swapMessage = `SWAPPED OFF-HAND: ${w3.name.toUpperCase()}`;
    swapDone = true;
  } else if (w3) {
    if (slots) {
      slots.slot1 = slot3;
      slots.slot3 = slot1;
    }
    swapMessage = `SWAPPED MAIN-HAND: ${w3.name.toUpperCase()}`;
    swapDone = true;
  } else if (item3) {
    if (slots) {
      slots.slot2 = slot3;
      slots.slot3 = slot2;
    }
    swapMessage = `BELT SWAPPED: ${item3.name.toUpperCase()} TO SLOT 2`;
    swapDone = true;
  }

  if (!swapDone) {
    soundSystem.playMenuBeep();
    ctx?.say('SWAP INCOMPATIBLE');
    return false;
  }

  state.equippedWeapons = [
    state.equipmentSlots?.slot1,
    state.equipmentSlots?.slot2,
    state.equipmentSlots?.slot3,
  ].filter(Boolean) as string[];
  state.activeWeaponIndex = 0;

  const activeWeaponId = state.equipmentSlots?.slot1 || 'gladius_boltcaster';
  const activeWeapon = getWeaponDefinition(activeWeaponId);
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const swapPenaltyMult = state.gates?.loadPenalty?.swapTimeMult ?? 1.0;

  if (!bypassCooldown) {
    state.weaponSwapCooldown =
      WEAPON_SWAP_COOLDOWN * swapPenaltyMult * featMods.swapTimeMult;
  }

  if (activeWeapon) {
    state.maxAmmo = activeWeapon.shotsPerChain;
    state.ammo = activeWeapon.shotsPerChain;
    state.reloadDuration = activeWeapon.reloadDurationSec;
  }

  state.isReloading = false;
  state.reloadTimer = 0;
  state.activeSkillSlot = null;
  state.activeActionId = null;
  state.skillTellTimer = 0;
  state.skillActionTimer = 0;

  soundSystem.playPowerup();
  ctx?.say(swapMessage);
  notifyOrionStateChange();
  return true;
}

export function performWeaponSwap(
  state: OrionState,
  ctx?: { say: (text: string) => void },
  _targetIndex?: number,
  bypassCooldown: boolean = false
): boolean {
  return performAuxiliarySwap(state, ctx, bypassCooldown);
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

export interface ResolvedCombatSkill {
  id: string;
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
  description?: string;
  available: boolean;
  unavailableReason?: string;
}

export interface ResolvedCombatSkills {
  skill1: ResolvedCombatSkill | null;
  skill2: ResolvedCombatSkill | null;
  skill3: ResolvedCombatSkill | null;
  skill4: ResolvedCombatSkill | null;
  skill5: ResolvedCombatSkill | null;
}

export function getResolvedCombatSkills(state: OrionState): ResolvedCombatSkills {
  const slot1Id =
    state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster';
  const slot2Id = state.equipmentSlots?.slot2 || state.equippedWeapons[1] || null;
  const slot3Id = state.equipmentSlots?.slot3 || null;

  const w1 = getWeaponDefinition(slot1Id);
  const w2 = slot2Id ? getWeaponDefinition(slot2Id) : undefined;
  const item2 = slot2Id && !w2 ? getItemDefinition(slot2Id) : undefined;
  const w3 = slot3Id ? getWeaponDefinition(slot3Id) : undefined;
  const item3 = slot3Id && !w3 ? getItemDefinition(slot3Id) : undefined;

  const is2Hand = w1?.handing === '2-hand';

  const getItemCount = (itemId: string) => {
    const inv = state.inventorySlots.find((s) => s.itemId === itemId);
    return inv ? inv.count : 0;
  };

  // Skill 1: Slot 1 Primary Attack (Always)
  const m0 = w1?.moveset[0];
  const skill1: ResolvedCombatSkill = {
    id: 'weapon_skill_0',
    slotIndex: 1,
    name: m0?.name || 'Primary Salvo',
    shortLabel: (m0?.name || 'ATTACK').slice(0, 12).toUpperCase(),
    sourceCategory: 'weapon',
    sourceSlotName: 'Slot 1: Main-Hand',
    weaponId: slot1Id,
    weaponMovesetSlot: 0,
    damage: m0?.damage,
    damageType: m0?.damageType,
    heatCost: m0?.heatCost,
    cooldownSec: 0,
    currentCooldown: 0,
    description: m0?.description,
    available: true,
  };

  // Skill 2: Slot 1 Special 1 (Y Tap)
  const m1 = w1?.moveset[1];
  const s2Cd = Math.max(
    0,
    state.skillCooldowns?.[1] || 0,
    state.actionCooldowns?.['weapon_skill_1'] || 0
  );
  const skill2: ResolvedCombatSkill = {
    id: 'weapon_skill_1',
    slotIndex: 2,
    name: m1?.name || 'Special Skill 1',
    shortLabel: (m1?.name || 'SKILL 2').slice(0, 12).toUpperCase(),
    sourceCategory: 'weapon',
    sourceSlotName: 'Slot 1: Main-Hand',
    weaponId: slot1Id,
    weaponMovesetSlot: 1,
    damage: m1?.damage,
    damageType: m1?.damageType,
    heatCost: m1?.heatCost,
    cooldownSec: m1?.cooldownSec ?? 4.0,
    currentCooldown: s2Cd,
    description: m1?.description,
    available: true,
  };

  // Skill 3: Slot 1 Tactical Secondary (R Tap)
  const m2 = w1?.moveset[2];
  const s3Cd = Math.max(
    0,
    state.skillCooldowns?.[2] || 0,
    state.actionCooldowns?.['weapon_skill_2'] || 0
  );
  const skill3: ResolvedCombatSkill = {
    id: 'weapon_skill_2',
    slotIndex: 3,
    name: m2?.name || 'Special Skill 2',
    shortLabel: (m2?.name || 'SKILL 3').slice(0, 12).toUpperCase(),
    sourceCategory: 'weapon',
    sourceSlotName: 'Slot 1: Main-Hand',
    weaponId: slot1Id,
    weaponMovesetSlot: 2,
    damage: m2?.damage,
    damageType: m2?.damageType,
    heatCost: m2?.heatCost,
    cooldownSec: m2?.cooldownSec ?? 5.5,
    currentCooldown: s3Cd,
    description: m2?.description,
    available: true,
  };

  // Skill 4: Y Hold (Belt Consumable, 2-Hand Moveset[3], or Off-Hand Weapon Moveset[3])
  let skill4: ResolvedCombatSkill | null = null;
  if (item2 && slot2Id) {
    const count = getItemCount(slot2Id);
    const cd = Math.max(0, state.actionCooldowns?.[slot2Id] || 0);
    skill4 = {
      id: `item_${slot2Id}`,
      slotIndex: 4,
      name: `${item2.name} (×${count})`,
      shortLabel: `${item2.name.slice(0, 10).toUpperCase()} ×${count}`,
      sourceCategory: 'belt',
      sourceSlotName: 'Slot 2: Belt Consumable',
      itemId: slot2Id,
      itemCount: count,
      cooldownSec: 2.5,
      currentCooldown: cd,
      description: item2.description,
      available: count > 0,
      unavailableReason: count <= 0 ? 'ITEM DEPLETED' : undefined,
    };
  } else if (is2Hand) {
    const m3 = w1?.moveset[3];
    const s4Cd = Math.max(
      0,
      state.skillCooldowns?.[3] || 0,
      state.actionCooldowns?.['weapon_skill_3'] || 0
    );
    skill4 = {
      id: 'weapon_skill_3',
      slotIndex: 4,
      name: m3?.name || 'Suppression Skill',
      shortLabel: (m3?.name || 'SKILL 4').slice(0, 12).toUpperCase(),
      sourceCategory: 'weapon',
      sourceSlotName: 'Slot 1: Two-Handed',
      weaponId: slot1Id,
      weaponMovesetSlot: 3,
      damage: m3?.damage,
      damageType: m3?.damageType,
      heatCost: m3?.heatCost,
      cooldownSec: m3?.cooldownSec ?? 5.0,
      currentCooldown: s4Cd,
      description: m3?.description,
      available: true,
    };
  } else if (w2) {
    const m3 = w2.moveset[3] || w2.moveset[1];
    const s4Cd = Math.max(0, state.actionCooldowns?.['weapon_slot2_skill4'] || 0);
    skill4 = {
      id: 'weapon_slot2_skill4',
      slotIndex: 4,
      name: m3?.name || 'Off-Hand Skill',
      shortLabel: (m3?.name || 'OFF-HAND').slice(0, 12).toUpperCase(),
      sourceCategory: 'weapon',
      sourceSlotName: 'Slot 2: Off-Hand',
      weaponId: slot2Id!,
      weaponMovesetSlot: 3,
      damage: m3?.damage,
      damageType: m3?.damageType,
      heatCost: m3?.heatCost,
      cooldownSec: m3?.cooldownSec ?? 4.0,
      currentCooldown: s4Cd,
      description: m3?.description,
      available: true,
    };
  } else {
    skill4 = {
      id: 'none',
      slotIndex: 4,
      name: 'Skill 4 (Empty)',
      shortLabel: 'EMPTY',
      sourceCategory: 'weapon',
      sourceSlotName: 'Requires Off-Hand or 2H Weapon',
      currentCooldown: 0,
      available: false,
      unavailableReason: 'EQUIP OFF-HAND WEAPON OR 2H MAIN',
    };
  }

  // Skill 5: R Hold (Belt Consumable, 2-Hand Finisher, Off-Hand Finisher, or Quiver Buff)
  let skill5: ResolvedCombatSkill | null = null;
  if (item3 && slot3Id) {
    const count = getItemCount(slot3Id);
    const cd = Math.max(0, state.actionCooldowns?.[slot3Id] || 0);
    skill5 = {
      id: `item_${slot3Id}`,
      slotIndex: 5,
      name: `${item3.name} (×${count})`,
      shortLabel: `${item3.name.slice(0, 10).toUpperCase()} ×${count}`,
      sourceCategory: 'belt',
      sourceSlotName: 'Slot 3: Belt Consumable',
      itemId: slot3Id,
      itemCount: count,
      cooldownSec: 2.5,
      currentCooldown: cd,
      description: item3.description,
      available: count > 0,
      unavailableReason: count <= 0 ? 'ITEM DEPLETED' : undefined,
    };
  } else if (is2Hand) {
    const m4 = w1?.moveset[4];
    const s5Cd = Math.max(
      0,
      state.skillCooldowns?.[4] || 0,
      state.actionCooldowns?.['weapon_skill_4'] || 0
    );
    skill5 = {
      id: 'weapon_skill_4',
      slotIndex: 5,
      name: m4?.name || 'Heavy Finisher',
      shortLabel: (m4?.name || 'SKILL 5').slice(0, 12).toUpperCase(),
      sourceCategory: 'weapon',
      sourceSlotName: 'Slot 1: Two-Handed',
      weaponId: slot1Id,
      weaponMovesetSlot: 4,
      damage: m4?.damage,
      damageType: m4?.damageType,
      heatCost: m4?.heatCost,
      cooldownSec: m4?.cooldownSec ?? 8.5,
      currentCooldown: s5Cd,
      description: m4?.description,
      available: true,
    };
  } else if (w2) {
    const m4 = w2.moveset[4] || w2.moveset[2];
    const s5Cd = Math.max(0, state.actionCooldowns?.['weapon_slot2_skill5'] || 0);
    skill5 = {
      id: 'weapon_slot2_skill5',
      slotIndex: 5,
      name: m4?.name || 'Off-Hand Finisher',
      shortLabel: (m4?.name || 'FINISHER').slice(0, 12).toUpperCase(),
      sourceCategory: 'weapon',
      sourceSlotName: 'Slot 2: Off-Hand Finisher',
      weaponId: slot2Id!,
      weaponMovesetSlot: 4,
      damage: m4?.damage,
      damageType: m4?.damageType,
      heatCost: m4?.heatCost,
      cooldownSec: m4?.cooldownSec ?? 7.0,
      currentCooldown: s5Cd,
      description: m4?.description,
      available: true,
    };
  } else if (w3 && w3.id === 'quiver') {
    const m4 = w3.moveset[4];
    skill5 = {
      id: 'weapon_skill_4',
      slotIndex: 5,
      name: m4?.name || 'Hurricane Quiver Dump',
      shortLabel: 'QUIVER DUMP',
      sourceCategory: 'weapon',
      sourceSlotName: 'Slot 3: Quiver Buff',
      weaponId: 'quiver',
      weaponMovesetSlot: 4,
      damage: m4?.damage,
      damageType: m4?.damageType,
      heatCost: m4?.heatCost,
      cooldownSec: 7.0,
      currentCooldown: Math.max(0, state.actionCooldowns?.['weapon_skill_4'] || 0),
      description: m4?.description,
      available: true,
    };
  } else {
    skill5 = {
      id: 'none',
      slotIndex: 5,
      name: 'Skill 5 (Empty)',
      shortLabel: 'EMPTY',
      sourceCategory: 'weapon',
      sourceSlotName: 'Requires Off-Hand or 2H Weapon',
      currentCooldown: 0,
      available: false,
      unavailableReason: 'EQUIP OFF-HAND WEAPON OR 2H MAIN',
    };
  }

  return { skill1, skill2, skill3, skill4, skill5 };
}

export function triggerTacticalReload(
  state: OrionState,
  ctx: OrionCombatContext
): boolean {
  const currentWeaponId =
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const weapon = getWeaponDefinition(currentWeaponId);
  if (!weapon) return false;

  const isMeleeOrShield =
    weapon.equipmentRole === 'melee' ||
    weapon.equipmentRole === 'shield' ||
    currentWeaponId === 'khopesh';

  if (state.ammo >= state.maxAmmo && !state.isReloading) {
    ctx.say(isMeleeOrShield ? 'STANCE READY (FULL)' : 'MAGAZINE FULL');
    return false;
  }

  state.activeSkillSlot = null;
  state.activeActionId = null;
  state.skillTellTimer = 0;
  state.skillActionTimer = 0;
  state.isReloading = true;
  state.reloadTimer = state.reloadDuration || weapon.reloadDurationSec;

  soundSystem.playPowerup();
  ctx.say(isMeleeOrShield ? 'RECOVERING STANCE (CANCEL)' : 'TACTICAL RELOAD (CANCEL)');
  notifyOrionStateChange();
  return true;
}

export function activateResolvedCombatSkill(
  state: OrionState,
  ctx: OrionCombatContext,
  skillIndex: 1 | 2 | 3 | 4 | 5
): boolean {
  if (state.activeSkillSlot !== null || state.activeActionId) {
    return false;
  }

  const skills = getResolvedCombatSkills(state);
  const skillKey = `skill${skillIndex}` as keyof ResolvedCombatSkills;
  const skill = skills[skillKey];

  if (!skill || !skill.available) {
    soundSystem.playMenuBeep();
    ctx.say(skill?.unavailableReason || `SKILL ${skillIndex} UNAVAILABLE`);
    notifyOrionStateChange();
    return false;
  }

  if (skill.currentCooldown > 0) {
    soundSystem.playMenuBeep();
    ctx.say(`${skill.shortLabel} ON COOLDOWN (${skill.currentCooldown.toFixed(1)}s)`);
    notifyOrionStateChange();
    return false;
  }

  // Belt item activation
  if (skill.sourceCategory === 'belt' && skill.itemId) {
    const itemId = skill.itemId;
    const invIdx = state.inventorySlots.findIndex((s) => s.itemId === itemId);
    const itemDef = getItemDefinition(itemId);
    if (invIdx < 0 || !itemDef) {
      soundSystem.playMenuBeep();
      ctx.say(`${skill.name} DEPLETED`);
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
      state.actionCooldowns[itemId] = skill.cooldownSec || 2.5;
      ctx.spawnParticles(
        state.x,
        state.y,
        state.z + 8,
        10,
        itemDef.iconColor || '#fbbf24',
        itemDef.name.toUpperCase()
      );
      awardPilotSkillXp(state, state.traitLine, 10, ctx);
      notifyOrionStateChange();
      return true;
    }
    return false;
  }

  // Weapon Skill Activation
  const desc = getResolvedActionDescriptor(state, skill.id);
  const featMods = computeInterfaceFeatModifiers(state.equippedFeats || []);
  const gemCombatMods = getWeaponGemCombatModifiers(state, skill.weaponId);
  const heatPenaltyMult = state.gates?.loadPenalty?.heatMult ?? 1.0;

  const rawHeat = skill.heatCost ?? desc.heatCost ?? 0;
  if (rawHeat > 0) {
    const scaledHeat =
      rawHeat * heatPenaltyMult * featMods.heatGenMult * gemCombatMods.skillHeatCostMult;
    state.heat = Math.min(state.maxHeat, state.heat + scaledHeat);
  } else if (rawHeat < 0) {
    state.heat = Math.max(0, state.heat + rawHeat);
  }

  const finalCd =
    (skill.cooldownSec ?? desc.cooldownSec ?? 4.0) *
    featMods.cooldownMult *
    gemCombatMods.skillCooldownMult;
  state.actionCooldowns = state.actionCooldowns || {};
  state.actionCooldowns[skill.id] = finalCd;
  if (skill.weaponMovesetSlot !== undefined) {
    state.skillCooldowns[skill.weaponMovesetSlot] = finalCd;
    state.activeSkillSlot = skill.weaponMovesetSlot;
  } else {
    state.activeSkillSlot = skillIndex;
  }

  state.activeActionId = skill.id;
  state.skillTellTimer = Math.max(0.05, desc.tellDurationSec);
  state.skillActionTimer = Math.max(0.15, desc.actionDurationSec);

  awardPilotSkillXp(state, state.traitLine, 12, ctx);
  soundSystem.playCharge();
  ctx.say(`[SKILL ${skillIndex}] ${skill.name.toUpperCase()}`);
  notifyOrionStateChange();
  return true;
}

export function firePrimarySalvoShot(
  state: OrionState,
  ctx: OrionCombatContext,
  _isAuto: boolean
): boolean {
  const currentWeaponId =
    state.equipmentSlots?.slot1 ||
    state.equippedWeapons[state.activeWeaponIndex] ||
    'gladius_boltcaster';
  const weapon = getWeaponDefinition(currentWeaponId);
  if (!weapon) return false;

  const isMeleeOrShield =
    weapon.equipmentRole === 'melee' ||
    weapon.equipmentRole === 'shield' ||
    currentWeaponId === 'khopesh';

  if (state.ammo <= 0) {
    state.isReloading = true;
    state.reloadTimer = state.reloadDuration || weapon.reloadDurationSec;
    soundSystem.playMenuBeep();
    ctx.say(isMeleeOrShield ? 'RECOVERING STANCE...' : 'RELOADING...');
    notifyOrionStateChange();
    return false;
  }

  const installedRangedModId = state.equipmentSlots?.installedMods?.ranged;
  const rangedMod = ACTION_MODIFICATION_CATALOG.find((m) => m.id === installedRangedModId);
  const tellMult = !isMeleeOrShield ? (rangedMod?.modifiers.tellDurationMult ?? 1.0) : 1.0;

  const skill0 = weapon.moveset[0];
  state.activeSkillSlot = 0;
  state.activeActionId = null;
  state.skillTellTimer = Math.max(0.04, skill0.tellDurationSec * tellMult);
  const perShotAction = isMeleeOrShield
    ? Math.max(
        0.18,
        weapon.chainDurationSec / Math.max(1, weapon.shotsPerChain) - skill0.tellDurationSec
      )
    : Math.max(
        0.08,
        weapon.chainDurationSec / Math.max(1, weapon.shotsPerChain) - skill0.tellDurationSec
      );
  state.skillActionTimer = perShotAction;
  return true;
}

const DOUBLE_TAP_WINDOW_SEC = 0.26;
const HOLD_TRIGGER_THRESHOLD_SEC = 0.28;

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

  const isMeleeOrShield =
    weapon.equipmentRole === 'melee' ||
    weapon.equipmentRole === 'shield' ||
    currentWeaponId === 'khopesh';

  // 1. Tick reloading
  if (state.isReloading) {
    const reloadMult = (state.overdriveTimer || 0) > 0 ? 1.6 : 1.0;
    state.reloadTimer -= dt * reloadMult;
    if (state.reloadTimer <= 0) {
      state.isReloading = false;
      state.ammo = state.maxAmmo;
      soundSystem.playSelect();
      ctx.say(isMeleeOrShield ? 'BLADE STANCE READY' : 'MAGAZINE RELOADED');
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

  // ─── [X] BUTTON: Single Tap = [chain manual] · Double Tap = [reload] · Hold = [chain auto] ───
  if (p.x) {
    if (state.combatInputTimers.x > 0) {
      state.combatInputTimers.x = 0;
      triggerTacticalReload(state, ctx);
    } else {
      state.combatInputTimers.x = DOUBLE_TAP_WINDOW_SEC;
      state.combatHoldTimers.x = 0;
      state.combatHoldTriggered.x = false;
      if (!state.isReloading && state.activeSkillSlot === null && !state.activeActionId) {
        firePrimarySalvoShot(state, ctx, false);
      }
    }
  }

  if (h.x) {
    state.combatHoldTimers.x += dt;
    if (state.combatHoldTimers.x >= HOLD_TRIGGER_THRESHOLD_SEC && !state.combatHoldTriggered.x) {
      state.combatHoldTriggered.x = true;
      state.combatActiveChain = true;
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

  // ─── [Y] BUTTON: Single Tap = [Skill 2] · Double Tap = [reload] · Hold = [Skill 4] ───
  if (p.y) {
    if (state.combatInputTimers.y > 0) {
      state.combatInputTimers.y = 0;
      triggerTacticalReload(state, ctx);
    } else {
      state.combatInputTimers.y = DOUBLE_TAP_WINDOW_SEC;
      state.combatHoldTimers.y = 0;
      state.combatHoldTriggered.y = false;
      activateResolvedCombatSkill(state, ctx, 2);
    }
  }

  if (h.y) {
    state.combatHoldTimers.y += dt;
    if (state.combatHoldTimers.y >= HOLD_TRIGGER_THRESHOLD_SEC && !state.combatHoldTriggered.y) {
      state.combatHoldTriggered.y = true;
      activateResolvedCombatSkill(state, ctx, 4);
    }
  } else {
    state.combatHoldTimers.y = 0;
    state.combatHoldTriggered.y = false;
  }

  // ─── [R] BUTTON: Single Tap = [Skill 3] · Double Tap = [reload] · Hold = [Skill 5] ───
  if (p.r) {
    if (state.combatInputTimers.r > 0) {
      state.combatInputTimers.r = 0;
      triggerTacticalReload(state, ctx);
    } else {
      state.combatInputTimers.r = DOUBLE_TAP_WINDOW_SEC;
      state.combatHoldTimers.r = 0;
      state.combatHoldTriggered.r = false;
      activateResolvedCombatSkill(state, ctx, 3);
    }
  }

  if (h.r) {
    state.combatHoldTimers.r += dt;
    if (state.combatHoldTimers.r >= HOLD_TRIGGER_THRESHOLD_SEC && !state.combatHoldTriggered.r) {
      state.combatHoldTriggered.r = true;
      activateResolvedCombatSkill(state, ctx, 5);
    }
  } else {
    state.combatHoldTimers.r = 0;
    state.combatHoldTriggered.r = false;
  }

  // ─── [L] BUTTON: Single Tap = [lock/cycle] · Double Tap = [unlock] · Hold = [swap] ───
  if (p.l) {
    if (state.combatInputTimers.l > 0) {
      state.combatInputTimers.l = 0;
      state.lockedTargetId = null;
      soundSystem.playMenuBeep();
      ctx.say('TARGET UNLOCKED');
      notifyOrionStateChange();
    } else {
      state.combatInputTimers.l = DOUBLE_TAP_WINDOW_SEC;
      state.combatHoldTimers.l = 0;
      state.combatHoldTriggered.l = false;
      cycleTargetLock(state, ctx);
    }
  }

  if (h.l) {
    state.combatHoldTimers.l += dt;
    if (state.combatHoldTimers.l >= HOLD_TRIGGER_THRESHOLD_SEC && !state.combatHoldTriggered.l) {
      state.combatHoldTriggered.l = true;
      performAuxiliarySwap(state, ctx);
    }
  } else {
    state.combatHoldTimers.l = 0;
    state.combatHoldTriggered.l = false;
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
          const action = weapon?.moveset[0];
          const aim = getCombatAimVector(state);
          const gemCombatMods = getWeaponGemCombatModifiers(state, currentWeaponId);
          const overdriveMult =
            ((state.overdriveTimer || 0) > 0 ? 1.3 : 1.0) *
            featMods.damageMult *
            gemCombatMods.damageMult;

          if (action && state.ammo > 0) {
            state.ammo -= 1;
            const shotHeat =
              action.heatCost * (loadPenalty?.heatMult ?? 1.0) * featMods.heatGenMult;
            state.heat = Math.min(state.maxHeat, state.heat + shotHeat);
            const shotDmg = Math.round(action.damage * overdriveMult);

            awardPilotSkillXp(state, state.traitLine, 6, ctx);

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
            } else if (isMeleeOrShield) {
              const aimAngle = Math.atan2(aim.dy, aim.dx);
              const opticMult = (state.opticMarkTimer || 0) > 0 ? 1.25 : 1.0;
              const hasKnightsOath = state.equippedFeats.includes('knights_oath');
              let basicHitGrantedBonus = false;
              const resolveMeleeHit = (
                e: (typeof state.enemies)[number],
                stunSec: number = 0.22,
                knockbackDist: number = 0,
                extraArmorDent: number = 0,
                shieldBypassRatio: number = 0
              ) => {
                e.stun = Math.max(e.stun, stunSec);
                e.hurt = 0.2;
                const totalDent = extraArmorDent + gemCombatMods.extraArmorDentOnHit;
                if (totalDent > 0 && e.armor.durability > 0) {
                  e.armor.durability = Math.max(0, e.armor.durability - totalDent);
                }
                if (knockbackDist > 0) {
                  const bounds = getActiveRoomBounds(state);
                  const kdx = e.x - state.x;
                  const kdy = e.y - state.y;
                  const kNorm = Math.hypot(kdx, kdy) || 1;
                  e.x = Math.max(12, Math.min(bounds.widthPx - 12, e.x + (kdx / kNorm) * knockbackDist));
                  e.y = Math.max(12, Math.min(bounds.heightPx - 12, e.y + (kdy / kNorm) * knockbackDist));
                }
                if (!basicHitGrantedBonus) {
                  basicHitGrantedBonus = true;
                  if (gemCombatMods.heatVentOnBasicHit > 0) {
                    state.heat = Math.max(0, state.heat - gemCombatMods.heatVentOnBasicHit);
                  }
                  if (gemCombatMods.presenceGainOnHit > 0) {
                    state.presence = Math.min(
                      100,
                      (state.presence || 0) + gemCombatMods.presenceGainOnHit
                    );
                  }
                }
                const oathMult = hasKnightsOath && e.faction === 'camelot' ? 1.25 : 1.0;
                const isLockedOrStaggered =
                  e.id === state.lockedTargetId || e.stun > 0;
                const charoiteMult = isLockedOrStaggered
                  ? gemCombatMods.lockedOrStaggeredDamageMult
                  : 1.0;
                const effDamage = Math.round(shotDmg * oathMult * opticMult * charoiteMult);
                if (shieldBypassRatio > 0 && e.shields.capacity > 0) {
                  const bypassed = Math.max(1, Math.round(effDamage * shieldBypassRatio));
                  const normalPortion = Math.max(0, effDamage - bypassed);
                  if (normalPortion > 0) {
                    applyDamageToLayers(e.shields, e.armor, e.frame, normalPortion, action.damageType);
                  }
                  const savedShield = e.shields.capacity;
                  e.shields.capacity = 0;
                  applyDamageToLayers(
                    e.shields,
                    e.armor,
                    e.frame,
                    bypassed,
                    action.damageType,
                    (count, color, label) =>
                      ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, label)
                  );
                  e.shields.capacity = savedShield;
                } else {
                  applyDamageToLayers(
                    e.shields,
                    e.armor,
                    e.frame,
                    effDamage,
                    action.damageType,
                    (count, color, label) =>
                      ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, label)
                  );
                }
                soundSystem.playHit();
              };

              state.bladeTrails = state.bladeTrails || [];

              if (currentWeaponId === 'short_spear') {
                // Short Spear: Long linear piercing thrust corridor (38px reach, narrow ±10px corridor)
                const jitter = ((state.ammo % 3) - 1) * 0.04;
                state.bladeTrails.push({
                  x: state.x,
                  y: state.y,
                  z: state.z,
                  angle: aimAngle + jitter,
                  arcSpan: Math.PI * 0.22,
                  radius: 36,
                  length: 38,
                  width: 9,
                  style: 'thrust',
                  color: trailColor,
                  coreColor,
                  life: 0.2,
                  maxLife: 0.2,
                  flipDir: state.ammo % 2 === 0,
                });
                for (const e of state.enemies) {
                  if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
                  if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 38, 11, e.x, e.y)) {
                    resolveMeleeHit(e, 0.22, 3);
                  }
                }
                ctx.spawnParticles(
                  state.x + aim.dx * 22,
                  state.y + aim.dy * 22,
                  state.z + 6,
                  5,
                  trailColor,
                  ''
                );
                soundSystem.playSword();
              } else if (currentWeaponId === 'avalon_siege_lance') {
                // Avalon Heavy Lance: Heavy lance bore thrust + kinetic siege slug
                state.bladeTrails.push({
                  x: state.x,
                  y: state.y,
                  z: state.z,
                  angle: aimAngle,
                  arcSpan: Math.PI * 0.28,
                  radius: 34,
                  length: 36,
                  width: 12,
                  style: 'thrust',
                  color: trailColor,
                  coreColor,
                  life: 0.24,
                  maxLife: 0.24,
                });
                for (const e of state.enemies) {
                  if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
                  if (isTargetInThrustCorridor(state.x, state.y, aimAngle, 36, 13, e.x, e.y)) {
                    resolveMeleeHit(e, 0.35, 8);
                  }
                }
                state.projectiles.push({
                  x: state.x + aim.dx * 12,
                  y: state.y + aim.dy * 12,
                  z: state.z + 6,
                  vx: aim.dx * 165,
                  vy: aim.dy * 165,
                  vz: 0,
                  damage: shotDmg,
                  damageType: action.damageType,
                  isPlayer: true,
                  life: 0.55,
                  radius: 4.5,
                  color: trailColor,
                  trailColor: coreColor,
                  lightRadius: 24,
                });
                soundSystem.playSword();
              } else if (currentWeaponId === 'mace') {
                // Mace: Concentrated frontal blunt slam + ground impact ring & armor-denting crush
                state.bladeTrails.push({
                  x: state.x,
                  y: state.y,
                  z: state.z,
                  angle: aimAngle,
                  arcSpan: Math.PI * 0.55,
                  radius: 20,
                  length: 15,
                  width: 17,
                  style: 'slam',
                  color: trailColor,
                  coreColor,
                  life: 0.24,
                  maxLife: 0.24,
                  flipDir: state.ammo % 2 === 0,
                });
                for (const e of state.enemies) {
                  if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
                  if (isTargetInImpactZone(state.x, state.y, aimAngle, 15, 18, e.x, e.y)) {
                    resolveMeleeHit(e, 0.34, 5, 4);
                  }
                }
                ctx.spawnParticles(
                  state.x + aim.dx * 15,
                  state.y + aim.dy * 15,
                  state.z + 4,
                  6,
                  trailColor,
                  ''
                );
                soundSystem.playSword();
              } else if (currentWeaponId === 'hand_axe') {
                // Hand Axe: Tight, heavy wedge chop with high close-quarters bite
                state.bladeTrails.push({
                  x: state.x,
                  y: state.y,
                  z: state.z,
                  angle: aimAngle,
                  arcSpan: Math.PI * 0.62,
                  radius: 21,
                  width: 13,
                  style: 'chop',
                  color: trailColor,
                  coreColor,
                  life: 0.2,
                  maxLife: 0.2,
                  flipDir: state.ammo % 2 === 0,
                });
                for (const e of state.enemies) {
                  if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
                  if (isTargetInDirectionalArc(state.x, state.y, aimAngle, 25, Math.PI * 0.7, e.x, e.y)) {
                    resolveMeleeHit(e, 0.25, 4, 2);
                  }
                }
                ctx.spawnParticles(
                  state.x + aim.dx * 13,
                  state.y + aim.dy * 13,
                  state.z + 6,
                  5,
                  trailColor,
                  ''
                );
                soundSystem.playSword();
              } else if (weapon?.equipmentRole === 'shield') {
                // Shield (Buckler / Heater / Pavise): Blunt kinetic barrier bash wave with knockback
                const bashRadius =
                  currentWeaponId === 'pavise_shield'
                    ? 24
                    : currentWeaponId === 'heater_shield'
                      ? 21
                      : 19;
                const bashArc =
                  currentWeaponId === 'pavise_shield'
                    ? Math.PI * 0.75
                    : currentWeaponId === 'heater_shield'
                      ? Math.PI * 0.65
                      : Math.PI * 0.55;
                state.bladeTrails.push({
                  x: state.x,
                  y: state.y,
                  z: state.z,
                  angle: aimAngle,
                  arcSpan: bashArc,
                  radius: bashRadius,
                  width: currentWeaponId === 'pavise_shield' ? 18 : 14,
                  style: 'bash',
                  color: trailColor,
                  coreColor,
                  life: 0.22,
                  maxLife: 0.22,
                  flipDir: state.ammo % 2 === 0,
                });
                for (const e of state.enemies) {
                  if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
                  if (
                    isTargetInDirectionalArc(
                      state.x,
                      state.y,
                      aimAngle,
                      bashRadius + 4,
                      bashArc + 0.15,
                      e.x,
                      e.y
                    )
                  ) {
                    resolveMeleeHit(
                      e,
                      0.38,
                      currentWeaponId === 'pavise_shield' ? 10 : 7,
                      2
                    );
                  }
                }
                ctx.spawnParticles(
                  state.x + aim.dx * 11,
                  state.y + aim.dy * 11,
                  state.z + 6,
                  5,
                  trailColor,
                  ''
                );
                soundSystem.playSword();
              } else {
                // Long Sword & Khopesh (Shotel): Sweeping crescent blade slash
                const isLongSword = currentWeaponId === 'long_sword';
                const slashRadius = isLongSword ? 26 : 22;
                const slashArc = isLongSword ? Math.PI * 1.02 : Math.PI * 0.82;
                state.bladeTrails.push({
                  x: state.x,
                  y: state.y,
                  z: state.z,
                  angle: aimAngle,
                  arcSpan: slashArc,
                  radius: slashRadius,
                  style: 'slash',
                  color: trailColor,
                  coreColor,
                  life: 0.22,
                  maxLife: 0.22,
                  flipDir: state.ammo % 2 === 0,
                });
                for (const e of state.enemies) {
                  if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
                  if (
                    isTargetInDirectionalArc(
                      state.x,
                      state.y,
                      aimAngle,
                      slashRadius + 4,
                      slashArc + 0.12,
                      e.x,
                      e.y
                    )
                  ) {
                    // Shotel curved blade reaches around shields (bypasses 25% shield absorption)
                    resolveMeleeHit(
                      e,
                      0.22,
                      isLongSword ? 4 : 2,
                      0,
                      currentWeaponId === 'khopesh' ? 0.25 : 0
                    );
                  }
                }
                ctx.spawnParticles(
                  state.x + aim.dx * 14,
                  state.y + aim.dy * 14,
                  state.z + 6,
                  5,
                  trailColor,
                  ''
                );
                soundSystem.playSword();
              }
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
              const projColor = gemVis.gemId
                ? trailColor
                : weapon?.bladeTrailColor || '#ffd27d';
              const projTrail = gemVis.gemId ? coreColor : '#f59e0b';

              state.bladeTrails = state.bladeTrails || [];
              state.bladeTrails.push({
                x: state.x,
                y: state.y,
                z: state.z,
                angle: baseAngle,
                arcSpan: currentWeaponId === 'great_bow' ? Math.PI * 0.45 : Math.PI * 0.35,
                radius: currentWeaponId === 'great_bow' ? 15 : 12,
                style: 'volley',
                color: projColor,
                coreColor: projTrail,
                life: 0.15,
                maxLife: 0.15,
              });

              if (gemCombatMods.heatVentOnBasicHit > 0) {
                state.heat = Math.max(0, state.heat - gemCombatMods.heatVentOnBasicHit);
              }
              const baseProjSpeed =
                (currentWeaponId === 'great_bow' ? 210 : 185) *
                gemCombatMods.projectileSpeedMult;
              for (const off of offsets) {
                const ang = baseAngle + off;
                state.projectiles.push({
                  x: state.x + Math.cos(ang) * 8,
                  y: state.y + Math.sin(ang) * 8,
                  z: state.z + 6,
                  vx: Math.cos(ang) * baseProjSpeed,
                  vy: Math.sin(ang) * baseProjSpeed,
                  vz: 0,
                  damage: shotDmg,
                  damageType: action.damageType,
                  isPlayer: true,
                  life: 0.75,
                  radius: currentWeaponId === 'great_bow' ? 4 : 3,
                  color: projColor,
                  trailColor: projTrail,
                  lightRadius: 18,
                });
              }
              soundSystem.playLaser();
            }

            if (state.ammo <= 0 && weapon) {
              state.isReloading = true;
              state.reloadTimer = state.reloadDuration || weapon.reloadDurationSec;
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
    if (e.type === 'orc_scout' || e.type === 'tristan_knight') continue;

    if (e.state === 'attack' && e.stateTimer > 0.08 && !e.hasStruckThisAttack && !state.isBoosterDashing) {
      const ang = e.attackAngle ?? Math.atan2(state.y - e.y, state.x - e.x);
      let isHit = false;

      if (e.type === 'bors_knight') {
        if (e.enraged) {
          // Enraged Sir Bors: Long linear piercing execution lunge corridor
          isHit = isTargetInThrustCorridor(e.x, e.y, ang, 34, 13, state.x, state.y);
        } else {
          // Normal Sir Bors: Heavy frontal mace/maul slam impact zone
          isHit = isTargetInImpactZone(e.x, e.y, ang, 12, 20, state.x, state.y);
        }
      } else if (e.type === 'percival_knight') {
        // Sir Percival: Wide directional shield-wall charge bash
        isHit = isTargetInDirectionalArc(e.x, e.y, ang, 26, Math.PI * 0.8, state.x, state.y);
      } else if (e.type === 'orc_warrior') {
        // Orc Warrior: Heavy frontal boarding-axe chop & shield brawl sector
        isHit = isTargetInDirectionalArc(e.x, e.y, ang, 24, Math.PI * 0.85, state.x, state.y);
      } else if (e.type === 'bog_crawler') {
        // Bog Crawler: Narrow mandible/claw ambush lunge cone
        isHit = isTargetInDirectionalArc(e.x, e.y, ang, 22, Math.PI * 0.65, state.x, state.y);
      } else if (e.type === 'bog_wurm' || e.type === 'lady_of_the_lake') {
        // Bog Wurm / Lady of the Lake: Bio-electric pulse ring + fang strike
        isHit = Math.hypot(state.x - e.x, state.y - e.y) <= 25;
      } else {
        // Feral Town NPC (Loyalist sword slash or Scavenger chop)
        isHit = isTargetInDirectionalArc(
          e.x,
          e.y,
          ang,
          e.isLoyalist ? 23 : 21,
          e.isLoyalist ? Math.PI * 0.85 : Math.PI * 0.65,
          state.x,
          state.y
        );
      }

      if (isHit) {
        e.hasStruckThisAttack = true;
        e.stateTimer = 0.05;
        let hitDamage = e.damage;
        if (e.type === 'bors_knight') {
          e.hitsLanded = (e.hitsLanded || 0) + 1;
          hitDamage = Math.round(e.damage * (1 + 0.1 * (e.hitsLanded - 1)));
        }
        if (e.type === 'percival_knight') {
          // Percival's shield rush knocks the player back slightly
          state.x = Math.max(12, Math.min(148, state.x + Math.cos(ang) * 8));
          state.y = Math.max(12, Math.min(132, state.y + Math.sin(ang) * 8));
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
        awardPilotSkillXp(state, state.traitLine, 10, ctx);
      }
    }
  }
}

export { ASSIGNABLE_ACTION_CATALOG, getResolvedActionDescriptor };
