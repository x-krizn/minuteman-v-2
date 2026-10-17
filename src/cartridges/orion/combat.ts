/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import {
  BOOSTER_DASH_COOLDOWN,
  BOOSTER_DASH_DURATION,
  BOOSTER_HEAT_COST,
  DIR_VECTORS,
  GLADIUS_DAMAGE_PER_SHOT,
  GLADIUS_RELOAD_TIME,
  GLADIUS_SHOTS_PER_CHAIN,
  WEAPON_SWAP_COOLDOWN,
} from './constants';
import { getWeaponDefinition } from './database/weapons';
import { ArmorState, DamageType, EnemyEntity, FrameState, OrionCombatContext, OrionState, ShieldState } from './types';

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
 * Handle combat inputs: Attack (Skill 0), Active Skills 1-4, Weapon Swap, Reload, Booster Evade
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

  // 1. Weapon Swap (Select or Y when not attacking) - 5s Global Cooldown
  if (input.pressed.y && state.weaponSwapCooldown <= 0 && state.equippedWeapons.length > 1) {
    state.activeWeaponIndex = (state.activeWeaponIndex + 1) % state.equippedWeapons.length;
    state.weaponSwapCooldown = WEAPON_SWAP_COOLDOWN;
    soundSystem.playSelect();
    const newWeapon = getWeaponDefinition(state.equippedWeapons[state.activeWeaponIndex]);
    ctx.say(`SWAPPED TO: ${newWeapon?.name || 'WEAPON'}`);
    return;
  }

  // 2. Booster Kit Evade (B button)
  if (input.pressed.b && state.hasBoosterKit && state.boosterCooldown <= 0) {
    state.isBoosterDashing = true;
    state.boosterTimer = BOOSTER_DASH_DURATION;
    state.boosterCooldown = BOOSTER_DASH_COOLDOWN;
    state.heat = Math.min(state.maxHeat, state.heat + BOOSTER_HEAT_COST);

    const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
    state.boosterDirX = state.faceX !== 0 ? state.faceX : dirInfo.dx;
    state.boosterDirY = state.faceY !== 0 ? state.faceY : dirInfo.dy;
    soundSystem.playDash();
    return;
  }

  // 3. Reload Handling
  if (state.isReloading) {
    state.reloadTimer -= dt;
    if (state.reloadTimer <= 0) {
      state.isReloading = false;
      state.ammo = state.maxAmmo;
      soundSystem.playSelect();
      ctx.say('RELOADED');
    }
    return;
  }

  // 4. Skill 0 Auto-Attack Chain (X button)
  if (input.pressed.x && state.activeSkillSlot === null) {
    if (state.ammo <= 0) {
      // Trigger automatic reload
      state.isReloading = true;
      state.reloadTimer = weapon.reloadDurationSec;
      soundSystem.playMenuBeep();
      ctx.say('RELOADING...');
      return;
    }

    // Initiate tell (Combat Law 1: Every ability has a tell)
    const skill0 = weapon.moveset[0];
    state.activeSkillSlot = 0;
    state.skillTellTimer = skill0.tellDurationSec;
    state.skillActionTimer = skill0.actionDurationSec;
  }

  // 5. Active Skills: L Trigger = Skill 1 (AP Slug), R Trigger = Skill 2 (Concussion Grenade)
  if (input.pressed.l && state.activeSkillSlot === null) {
    const skill1 = weapon.moveset[1];
    if (skill1 && state.skillCooldowns[1] <= 0) {
      state.activeSkillSlot = 1;
      state.skillTellTimer = skill1.tellDurationSec;
      state.skillActionTimer = skill1.actionDurationSec;
      state.skillCooldowns[1] = skill1.cooldownSec;
      state.heat = Math.min(state.maxHeat, state.heat + skill1.heatCost);
      soundSystem.playCharge();
      ctx.say(skill1.name.toUpperCase());
    }
  }

  if (input.pressed.r && state.activeSkillSlot === null) {
    const skill2 = weapon.moveset[2];
    if (skill2 && state.skillCooldowns[2] <= 0) {
      state.activeSkillSlot = 2;
      state.skillTellTimer = skill2.tellDurationSec;
      state.skillActionTimer = skill2.actionDurationSec;
      state.skillCooldowns[2] = skill2.cooldownSec;
      state.heat = Math.min(state.maxHeat, state.heat + skill2.heatCost);
      soundSystem.playCharge();
      ctx.say(skill2.name.toUpperCase());
    }
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
    state.weaponSwapCooldown -= dt;
  }

  // Update booster cooldown & duration
  if (state.boosterCooldown > 0) state.boosterCooldown -= dt;
  if (state.isBoosterDashing) {
    state.boosterTimer -= dt;
    if (state.boosterTimer <= 0) state.isBoosterDashing = false;
  }

  // Update skill cooldowns
  for (let s = 0; s < state.skillCooldowns.length; s++) {
    if (state.skillCooldowns[s] > 0) {
      state.skillCooldowns[s] -= dt;
    }
  }

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

  // Dissipate heat slowly over time
  if (state.heat > 0) {
    state.heat = Math.max(0, state.heat - 12 * dt);
  }

  // Execute active player skill
  if (state.activeSkillSlot !== null) {
    const currentWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
    const weapon = getWeaponDefinition(currentWeaponId);
    const action = weapon?.moveset[state.activeSkillSlot];

    if (action) {
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
            color: '#77c7ff',
            size: 2,
            fade: true,
          });
        }
      } else {
        // Fire action payload
        state.skillActionTimer -= dt;

        if (state.activeSkillSlot === 0) {
          // Gladius 9-round salvo or Khopesh combo
          if (state.ammo > 0) {
            state.ammo -= 1;
            const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
            state.projectiles.push({
              x: state.x + dirInfo.dx * 8,
              y: state.y + dirInfo.dy * 8,
              z: state.z + 6,
              vx: dirInfo.dx * 180,
              vy: dirInfo.dy * 180,
              vz: 0,
              damage: action.damage,
              damageType: action.damageType,
              isPlayer: true,
              life: 0.8,
              radius: 3,
              color: '#ffd27d',
              trailColor: '#f59e0b',
              lightRadius: 18,
            });
            soundSystem.playSword();
          }
        } else if (state.activeSkillSlot === 1) {
          // AP Penetrator Slug
          const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
          state.projectiles.push({
            x: state.x + dirInfo.dx * 10,
            y: state.y + dirInfo.dy * 10,
            z: state.z + 6,
            vx: dirInfo.dx * 220,
            vy: dirInfo.dy * 220,
            vz: 0,
            damage: action.damage,
            damageType: action.damageType,
            isPlayer: true,
            life: 0.9,
            radius: 4,
            color: '#77c7ff',
            trailColor: '#38bdf8',
            lightRadius: 26,
          });
          soundSystem.playLaser();
        } else if (state.activeSkillSlot === 2) {
          // Concussion Grenade (Blast)
          const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
          state.projectiles.push({
            x: state.x + dirInfo.dx * 8,
            y: state.y + dirInfo.dy * 8,
            z: state.z + 8,
            vx: dirInfo.dx * 120,
            vy: dirInfo.dy * 120,
            vz: 20,
            damage: action.damage,
            damageType: 'Blast',
            isPlayer: true,
            life: 0.6,
            radius: 5,
            color: '#ea580c',
            trailColor: '#f97316',
            lightRadius: 30,
            onImpact(x, y, z, st) {
              soundSystem.playExplosion();
              for (const e of st.enemies) {
                if (Math.hypot(e.x - x, e.y - y) < 36) {
                  e.stun = 1.2; // CC opportunity window
                  applyDamageToLayers(e.shields, e.armor, e.frame, 24, 'Blast');
                }
              }
            },
          });
        }

        if (state.skillActionTimer <= 0) {
          state.activeSkillSlot = null;
        }
      }
    } else {
      state.activeSkillSlot = null;
    }
  }

  // Check incoming enemy attacks with readable tells against Player
  for (const e of state.enemies) {
    if (e.state === 'attack' && e.stateTimer > 0.1) {
      const dist = Math.hypot(state.x - e.x, state.y - e.y);
      if (dist < 22 && !state.isBoosterDashing) {
        // Player hit by enemy!
        soundSystem.playHit();
        applyDamageToLayers(
          state.shields,
          state.armor,
          state.frame,
          e.damage,
          e.damageType,
          (count, color, label) => ctx.spawnParticles(state.x, state.y, state.z + 8, count, color, label)
        );
      }
    }
  }
}
