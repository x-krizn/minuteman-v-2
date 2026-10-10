/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { CombatParticle, KnightState, ProjectileEntity, SkillId } from './types';
import { TILE_SIZE } from './constants';
import { SKILL_REGISTRY } from './database/skills';
import { enemyBox, overlap, solidAt } from './physics';
import { spawnParticles, updateParticles } from './particles';
import { defeatEnemy } from './enemies';

export function castSkill(
  state: KnightState,
  skillId: SkillId,
  isLeftSlot: boolean,
  say: (t: string) => void
): boolean {
  const skill = SKILL_REGISTRY[skillId];
  if (!skill) return false;

  // Check cooldown
  if (isLeftSlot && state.skillCdL > 0) return false;
  if (!isLeftSlot && state.skillCdR > 0) return false;

  // Check resource cost
  if (skill.costType === 'flask') {
    if (state.flasks < skill.cost) {
      say('NO FLASKS');
      return false;
    }
    state.flasks -= skill.cost;
  } else if (skill.costType === 'ep') {
    if (state.ep < skill.cost) {
      say('NO EP');
      return false;
    }
    state.ep -= skill.cost;
  } else if (skill.costType === 'sp') {
    if (state.sp < skill.cost) {
      say('NO SP');
      return false;
    }
    state.sp -= skill.cost;
  }

  // Set cooldown
  if (isLeftSlot) {
    state.skillCdL = skill.cooldown;
  } else {
    state.skillCdR = skill.cooldown;
  }

  soundSystem.playSpellCast();

  switch (skillId) {
    case 'heal': {
      state.hp = Math.min(state.maxHp, state.hp + 2);
      say(`+2 HP (FLASKS: ${state.flasks})`);
      spawnParticles(state.particles, state.x, state.y - 8, 8, '#44ff88', '+2');
      break;
    }

    case 'fireball': {
      const dir = state.face;
      state.projectiles.push({
        x: state.x + dir * 12,
        y: state.y - 8,
        vx: dir * 190,
        vy: 0,
        damage: 2,
        isPlayer: true,
        life: 1.2,
        radius: 4,
      });
      say('FIRE');
      break;
    }

    case 'whirlwind': {
      // 360 spin attack
      state.atk = 0.25;
      state.atkV = 2;
      state.swung = [];
      say('WHIRLWIND');
      soundSystem.playHeavyAttack();
      spawnParticles(state.particles, state.x, state.y - 8, 12, '#99ddff');

      // Hit enemies all around
      state.enemies.forEach((e, idx) => {
        if (e.hp > 0 && Math.hypot(e.x - state.x, e.y - state.y) < 28) {
          e.hp -= 2;
          e.stun = 0.4;
          e.x += Math.sign(e.x - state.x || 1) * 12;
          soundSystem.playHit();
        }
      });
      break;
    }

    case 'shockwave': {
      say('SLAM');
      soundSystem.playHeavyAttack();
      state.hitstop = 0.05;
      const dir = state.face;
      state.projectiles.push({
        x: state.x + dir * 8,
        y: state.y - 2,
        vx: dir * 130,
        vy: 0,
        damage: 3,
        isPlayer: true,
        life: 0.6,
        radius: 6,
      });
      spawnParticles(state.particles, state.x, state.y, 14, '#ffdd55');
      break;
    }
  }

  return true;
}

export function updateProjectiles(
  rooms: Record<string, string[]>,
  state: KnightState,
  dt: number
): void {
  state.projectiles = state.projectiles.filter((p) => {
    p.life -= dt;
    if (p.life <= 0) return false;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Wall collision
    const tx = Math.floor(p.x / TILE_SIZE);
    const ty = Math.floor(p.y / TILE_SIZE);
    if (solidAt(rooms, state, tx, ty)) {
      spawnParticles(state.particles, p.x, p.y, 4, '#ffaa44');
      return false;
    }

    // Enemy collision
    if (p.isPlayer) {
      const pBox = {
        x0: p.x - p.radius,
        x1: p.x + p.radius,
        y0: p.y - p.radius,
        y1: p.y + p.radius,
      };

      for (let i = 0; i < state.enemies.length; i++) {
        const e = state.enemies[i];
        if (e.hp > 0 && overlap(pBox, enemyBox(e))) {
          e.hp -= p.damage;
          e.stun = 0.3;
          e.x += Math.sign(p.vx) * 8;
          soundSystem.playHit();
          spawnParticles(state.particles, p.x, p.y, 6, '#ff4444', `-${p.damage}`);
          if (e.hp <= 0) {
            defeatEnemy(state, e);
          }
          return false;
        }
      }
    }

    return true;
  });
}
