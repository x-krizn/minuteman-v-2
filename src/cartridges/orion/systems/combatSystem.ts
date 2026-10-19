/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import {
  BOOSTER_DASH_COOLDOWN,
  BOOSTER_DASH_DURATION,
  BOOSTER_HEAT_COST,
  DIR_VECTORS,
  GLADIUS_DAMAGE_PER_SHOT,
  GLADIUS_RELOAD_TIME,
  GLADIUS_SHOTS_PER_CHAIN,
  WEAPON_SWAP_COOLDOWN,
} from '../constants';
import { getWeaponDefinition } from '../database/weapons';
import { notifyOrionStateChange } from '../stateStore';
import { ArmorState, DamageType, FrameState, OrionCombatContext, OrionState, ShieldState } from '../types';
import {
  executeActionPayload,
  getCombatAimVector,
  initiateTriggerAction,
  updateActionTimers,
} from './actionSystem';
import { updateBladeTrails } from './postProcessingSystem';

/**
 * Swap to the next equipped weapon (or a specific index) and sync magazine/combo parameters
 */
export function performWeaponSwap(
  state: OrionState,
  ctx?: { say: (text: string) => void },
  targetIndex?: number,
  bypassCooldown: boolean = false
): boolean {
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
  if (!bypassCooldown) {
    state.weaponSwapCooldown = WEAPON_SWAP_COOLDOWN;
  }

  const newWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const newWeapon = getWeaponDefinition(newWeaponId);
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

/**
 * Apply the Canonical Three Defense Layers:
 * Incoming damage -> SHIELDS -> ARMOR -> FRAME -> defeat
 */
export function applyDamageToLayers(
  shields: ShieldState,
  armor: ArmorState,
  frame: FrameState,
  rawDamage: number,
  damageType: DamageType,
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
      shields.rechargeDelay = 3.0; // Reset recharge timer
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

  // 2. ARMOR LAYER (Threshold, Flat Rating, Degrading Durability)
  if (armor.durability > 0 && remaining > 0) {
    // Every hit reaching armor degrades durability
    const durabilityLoss = Math.min(armor.durability, Math.max(3, Math.round(remaining * 0.3)));
    armor.durability -= durabilityLoss;

    // Threshold & rating scale with remaining durability percentage
    const durRatio = Math.max(0.1, armor.durability / armor.maxDurability);
    const effThreshold = armor.threshold * durRatio;
    const effRating = armor.rating * durRatio;

    // Check threshold: hits below threshold are stopped completely
    if (remaining < effThreshold) {
      stoppedByArmor = true;
      spawnParticles?.(5, '#ffd27d', 'ARMOR DEFLECT');
      return { absorbedByShield, stoppedByArmor: true, frameDamage: 0 };
    }

    // Hits at or above threshold penetrate, subtract rating
    remaining = Math.max(1, remaining - effRating);
    spawnParticles?.(5, '#ffd27d', 'ARMOR PIERCED');
  }

  // 3. FRAME INTEGRITY LAYER (200 HP Static Stats)
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

/**
 * Handle combat inputs:
 * - X Button = Basic Attack (Always Weapon Skill 0)
 * - L & R Triggers = Assignable Multi-Source Actions (Default: Weapon Skill 1 & Weapon Skill 2)
 * Note: B (Tap Burst / Hold Continuous Boost) and Y (Tap Lock-On / Hold Weapon Swap) are handled in orionCartridge.ts
 */
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

  // 1. Reload Handling (accelerated during Reactor Overdrive)
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

  // 2. X Button = Basic Attack Always (Skill 0 Auto-Attack Chain)
  if ((input.pressed.x || input.held.x) && state.activeSkillSlot === null && !state.activeActionId) {
    if (state.ammo <= 0) {
      // Trigger automatic reload / combo recovery
      state.isReloading = true;
      state.reloadTimer = weapon.reloadDurationSec;
      soundSystem.playMenuBeep();
      ctx.say(currentWeaponId === 'khopesh' ? 'RECOVERING STANCE...' : 'RELOADING...');
      notifyOrionStateChange();
      return;
    }

    // Initiate tell (Combat Law 1: Every ability has a tell)
    const skill0 = weapon.moveset[0];
    state.activeSkillSlot = 0;
    state.activeActionId = null;
    state.skillTellTimer = Math.max(0.04, skill0.tellDurationSec);
    // Per-shot interval so full chain matches weapon's chainDurationSec
    const perShotAction =
      currentWeaponId === 'khopesh'
        ? 0.22
        : Math.max(0.08, weapon.chainDurationSec / Math.max(1, weapon.shotsPerChain) - skill0.tellDurationSec);
    state.skillActionTimer = perShotAction;
  }

  // 3. L & R Triggers = Assignable Multi-Source Actions (Weapon Skills, Hardware Modules, Reactor Abilities)
  if (input.pressed.l && state.activeSkillSlot === null && !state.activeActionId) {
    initiateTriggerAction(state, ctx, 'L');
  }

  if (input.pressed.r && state.activeSkillSlot === null && !state.activeActionId) {
    initiateTriggerAction(state, ctx, 'R');
  }
}

/**
 * Step combat state, windups/tells, execute strikes, update enemy encounters
 */
export function updateCombat(
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  // Update weapon swap cooldown
  if (state.weaponSwapCooldown > 0) {
    state.weaponSwapCooldown = Math.max(0, state.weaponSwapCooldown - dt);
  }

  // Update booster cooldown & burst timer (when not holding continuous boost)
  if (state.boosterCooldown > 0) state.boosterCooldown = Math.max(0, state.boosterCooldown - dt);
  if (state.isBoosterDashing && !state.isContinuousBoosting) {
    state.boosterTimer -= dt;
    if (state.boosterTimer <= 0) state.isBoosterDashing = false;
  }

  // Update skill & modular action cooldowns
  for (let s = 0; s < state.skillCooldowns.length; s++) {
    if (state.skillCooldowns[s] > 0) {
      state.skillCooldowns[s] = Math.max(0, state.skillCooldowns[s] - dt);
    }
  }
  updateActionTimers(state, dt);
  updateBladeTrails(state, dt);

  // Passive energy shield recharge if not overloaded
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

  // Dissipate heat slowly over time when not actively continuous boosting
  if (state.heat > 0 && !state.isContinuousBoosting) {
    state.heat = Math.max(0, state.heat - 12 * dt);
  }

  // Execute active player Basic Attack (Slot 0) or Assigned L/R Action
  if (state.activeSkillSlot !== null || state.activeActionId) {
    const currentWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
    const weapon = getWeaponDefinition(currentWeaponId);

    if (state.skillTellTimer > 0) {
      state.skillTellTimer -= dt;
      // Visual tell sparks
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

      // Fire payload once when tell completes!
      if (state.skillTellTimer <= 0) {
        if (state.activeSkillSlot === 0 && !state.activeActionId) {
          // X Button: Basic Attack (Weapon Skill 0)
          const action = weapon?.moveset[0];
          const aim = getCombatAimVector(state);
          const isKhopesh = currentWeaponId === 'khopesh';
          const overdriveMult = (state.overdriveTimer || 0) > 0 ? 1.3 : 1.0;

          if (action && state.ammo > 0) {
            state.ammo -= 1;
            state.heat = Math.min(state.maxHeat, state.heat + action.heatCost);
            const shotDmg = Math.round(action.damage * overdriveMult);

            if (isKhopesh) {
              // Khopesh Sickle Combo: Close-quarters crescent slash arc + Post-Processed Blade Swing Trail
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
              // Gladius Auto-Salvo: High-velocity kinetic bolt aimed at locked target or facing
              state.projectiles.push({
                x: state.x + aim.dx * 8,
                y: state.y + aim.dy * 8,
                z: state.z + 6,
                vx: aim.dx * 185,
                vy: aim.dy * 185,
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
              soundSystem.playLaser();
            }

            // Auto-trigger reload if last round spent
            if (state.ammo <= 0 && weapon) {
              state.isReloading = true;
              state.reloadTimer = weapon.reloadDurationSec;
            }
          }
        } else if (state.activeActionId) {
          // L or R Trigger: Multi-Source Assigned Action
          executeActionPayload(state, ctx, state.activeActionId, applyDamageToLayers);
        }
      }
    } else {
      // Recovery / action follow-through timer
      state.skillActionTimer -= dt;
      if (state.skillActionTimer <= 0) {
        state.activeSkillSlot = null;
        state.activeActionId = null;
      }
    }
  }

  // Check incoming enemy attacks with readable tells against Player
  for (const e of state.enemies) {
    if (e.type === 'bog_poe') continue;
    if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;

    if (e.state === 'attack' && e.stateTimer > 0.1) {
      const dist = Math.hypot(state.x - e.x, state.y - e.y);
      if (dist < 22 && !state.isBoosterDashing) {
        // Player hit by enemy!
        e.stateTimer = 0.05; // Prevent multi-frame hit stacking from single swing
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
      }
    }
  }
}

