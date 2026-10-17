/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { TILE_SIZE } from './constants';
import { applyDamageToLayers } from './combat';
import { isSolidAt } from './physics';
import { OrionCombatContext, OrionState } from './types';

export function updateProjectiles(
  rooms: Record<string, string[]>,
  state: OrionState,
  ctx: OrionCombatContext,
  dt: number
): void {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;

    // Procedural energy trail particles
    if (Math.random() < 0.6) {
      state.particles.push({
        x: p.x + (Math.random() - 0.5) * 4,
        y: p.y + (Math.random() - 0.5) * 4,
        z: p.z + (Math.random() - 0.5) * 2,
        vx: -p.vx * 0.1,
        vy: -p.vy * 0.1,
        vz: 4,
        life: 0.18,
        maxLife: 0.18,
        color: p.trailColor,
        size: 2,
        fade: true,
      });
    }

    // Check collision with walls
    const tx = Math.floor(p.x / TILE_SIZE);
    const ty = Math.floor(p.y / TILE_SIZE);
    if (isSolidAt(rooms, state, tx, ty, p.z)) {
      if (p.onImpact) {
        p.onImpact(p.x, p.y, p.z, state);
      }
      state.projectiles.splice(i, 1);
      continue;
    }

    // Check collision with enemies (if player projectile)
    if (p.isPlayer) {
      let hit = false;
      for (const e of state.enemies) {
        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist < 14 && Math.abs(e.z - p.z) < 14) {
          hit = true;
          e.stun = 0.2;
          e.hurt = 0.2;

          // Apply damage through Defense Layers (Shield -> Armor -> Frame)
          applyDamageToLayers(
            e.shields,
            e.armor,
            e.frame,
            p.damage,
            p.damageType,
            (count, color, label) => ctx.spawnParticles(e.x, e.y, e.z + 8, count, color, label)
          );

          soundSystem.playHit();

          if (p.onImpact) {
            p.onImpact(p.x, p.y, p.z, state);
          }
          break;
        }
      }

      if (hit) {
        state.projectiles.splice(i, 1);
        continue;
      }
    } else {
      // Enemy projectile hitting player
      const dist = Math.hypot(state.x - p.x, state.y - p.y);
      if (dist < 12 && Math.abs(state.z - p.z) < 12 && !state.isBoosterDashing) {
        soundSystem.playHit();
        applyDamageToLayers(
          state.shields,
          state.armor,
          state.frame,
          p.damage,
          p.damageType,
          (count, color, label) => ctx.spawnParticles(state.x, state.y, state.z + 8, count, color, label)
        );

        if (p.onImpact) {
          p.onImpact(p.x, p.y, p.z, state);
        }
        state.projectiles.splice(i, 1);
        continue;
      }
    }

    if (p.life <= 0) {
      state.projectiles.splice(i, 1);
    }
  }
}
