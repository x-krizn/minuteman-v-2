/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionState } from './types';

export function spawnParticles(
  state: OrionState,
  x: number,
  y: number,
  z: number,
  count: number,
  color: string,
  label?: string
): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 35;
    state.particles.push({
      x,
      y,
      z,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 15 + Math.random() * 25,
      life: 0.35 + Math.random() * 0.2,
      maxLife: 0.5,
      color,
      size: 2 + Math.random() * 2,
      label: i === 0 ? label : undefined,
      fade: true,
    });
  }
}

export function updateParticles(state: OrionState, dt: number): void {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.vz -= 120 * dt;

    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}
