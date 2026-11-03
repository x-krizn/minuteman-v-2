/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CombatParticle } from './types';

/**
 * Spawns `count` visual combat or environmental particles at `(x, y)` in `px` with optional floating text. Mutates `state: OrionState`.
 */
export function spawnParticles(
  particles: CombatParticle[],
  x: number,
  y: number,
  count: number,
  color: string,
  text?: string
): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 60;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 0.25 + Math.random() * 0.25,
      maxLife: 0.5,
      size: 1.5 + Math.random() * 2,
    });
  }

  if (text) {
    particles.push({
      x,
      y: y - 4,
      vx: 0,
      vy: -20,
      color,
      life: 0.6,
      maxLife: 0.6,
      size: 3,
      text,
    });
  }
}

/**
 * Advances all active `OrionParticle` positions and lifetimes by `dt` seconds and removes expired particles. Mutates `state: OrionState`.
 */
export function updateParticles(particles: CombatParticle[], dt: number): CombatParticle[] {
  return particles.filter((p) => {
    p.life -= dt;
    if (p.life <= 0) return false;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    return true;
  });
}
