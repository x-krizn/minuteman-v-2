/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  computeChunkFogMetrics,
  DIR_VECTORS,
  getChunkCoordsFromPx,
  getDoorwayAetherTransitionInfo,
  getEffectiveRoomCoord,
  getRoomDoorwayCenterPx,
  getVisibleTileBounds,
  hasPoeLanternGuidance,
  isChunkedExpanseRoom,
  makeChunkPersistenceKey,
  resolveCompanionPoeColor,
  SCREEN_H,
  SCREEN_W,
  TILE_SIZE,
  Z_SCALE,
} from '../../constants';
import { computeEffectivePlayerLightTiles } from '../../database/progression';
import { GLOBAL_ROOM_REGISTRY, LOCAL_ROOM_REGISTRY } from '../../database/world';
import {
  AetherCardinalDir,
  BiomeDefinition,
  BiomeWeatherType,
  OrionState,
  RoomLightingProfile,
} from '../../types';

// ─── MULTI-PASS 2.5D POST-PROCESSING, TRAILS, WEATHER & LIGHTING ─────────────

/**
 * Type contract for `SceneLightEmitter` (scene light emitter) in `effectsRenderer.ts`.
 */
export interface SceneLightEmitter {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

/**
 * Executes `resolveBiomePostProcess` (resolve biome post process) in `effectsRenderer.ts`.
 */
export function resolveBiomePostProcess(biome: BiomeDefinition): {
  ambientDarkness: number;
  bloomIntensity: number;
  weather: BiomeWeatherType;
  weatherIntensity: number;
  liquidReflection: boolean;
  scanlines: boolean;
} {
  const custom = biome.postProcess || {};
  let defaultWeather: BiomeWeatherType = 'none';
  if (biome.id.includes('bog') || biome.id.includes('wetland')) {
    defaultWeather = 'rain';
  } else if (biome.id.includes('orc') || biome.id.includes('tyrranus')) {
    defaultWeather = 'ash';
  } else if (
    biome.id.includes('waygate') ||
    biome.id.includes('aether') ||
    biome.id.includes('ruins') ||
    biome.id.includes('border_town')
  ) {
    defaultWeather = 'aether_mist';
  }

  return {
    ambientDarkness: custom.ambientDarkness ?? 0.94,
    bloomIntensity: custom.bloomIntensity ?? 0.38,
    weather: custom.weather ?? defaultWeather,
    weatherIntensity: custom.weatherIntensity ?? 0.65,
    liquidReflection: custom.liquidReflection ?? true,
    scanlines: custom.scanlines ?? false,
  };
}

/**
 * Executes `drawEnhancedProjectilesAndBladeTrails` (draw enhanced projectiles and blade trails) in `effectsRenderer.ts`. Mutates `state: OrionState`.
 */
export function drawEnhancedProjectilesAndBladeTrails(
  g: CanvasRenderingContext2D,
  state: OrionState
): void {
  if (state.bladeTrails && state.bladeTrails.length > 0) {
    g.save();
    for (const trail of state.bladeTrails) {
      const progress = 1 - Math.max(0, trail.life / Math.max(0.01, trail.maxLife));
      const alpha = Math.max(0, 1 - progress * progress);
      const cy = trail.y - trail.z * Z_SCALE - 6;
      const style = trail.style || 'slash';
      const coreColor = trail.coreColor || '#ffffff';
      const cos = Math.cos(trail.angle);
      const sin = Math.sin(trail.angle);
      const px = -sin;
      const py = cos;

      g.save();
      g.globalCompositeOperation = 'lighter';

      if (style === 'thrust') {
        const reach = (trail.length || trail.radius || 36) * (0.65 + 0.35 * Math.min(1, progress * 2.2));
        const halfW = (trail.width || 9) * 0.5 * (1 - progress * 0.35);
        const startDist = 5 + progress * 4;
        const sx = trail.x + cos * startDist;
        const sy = cy + sin * startDist;
        const tipX = trail.x + cos * reach;
        const tipY = cy + sin * reach;
        const neckX = trail.x + cos * Math.max(startDist, reach - 7);
        const neckY = cy + sin * Math.max(startDist, reach - 7);

        g.globalAlpha = alpha * 0.52;
        g.fillStyle = trail.color;
        g.beginPath();
        g.moveTo(sx, sy);
        g.lineTo(neckX + px * halfW, neckY + py * halfW);
        g.lineTo(tipX + cos * 3, tipY + sin * 3);
        g.lineTo(neckX - px * halfW, neckY - py * halfW);
        g.closePath();
        g.fill();

        const ringDist = startDist + (reach - startDist) * (0.45 + progress * 0.35);
        g.globalAlpha = alpha * 0.6;
        g.strokeStyle = trail.color;
        g.lineWidth = 1.4;
        g.beginPath();
        g.ellipse(
          trail.x + cos * ringDist,
          cy + sin * ringDist,
          2.5,
          halfW * 1.15,
          trail.angle,
          0,
          Math.PI * 2
        );
        g.stroke();

        g.globalAlpha = alpha * 0.95;
        g.strokeStyle = coreColor;
        g.lineWidth = 2;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(sx, sy);
        g.lineTo(tipX + cos * 2, tipY + sin * 2);
        g.stroke();

        g.fillStyle = coreColor;
        g.beginPath();
        g.arc(tipX, tipY, 2.2 * (1 - progress * 0.4), 0, Math.PI * 2);
        g.fill();
      } else if (style === 'slam') {
        const offset = trail.length ?? 15;
        const impactR = (trail.width || trail.radius || 18) * (0.55 + progress * 0.55);
        const ix = trail.x + cos * offset;
        const iy = trail.y + sin * offset - trail.z * Z_SCALE;

        if (offset > 0) {
          g.globalAlpha = alpha * 0.7;
          g.strokeStyle = trail.color;
          g.lineWidth = 5 * (1 - progress * 0.4);
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(trail.x + cos * 4, cy - 5 * (1 - progress));
          g.lineTo(ix, iy - 2);
          g.stroke();

          g.globalAlpha = alpha * 0.95;
          g.strokeStyle = coreColor;
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(trail.x + cos * 5, cy - 4 * (1 - progress));
          g.lineTo(ix, iy - 2);
          g.stroke();
        }

        g.globalAlpha = alpha * 0.65;
        g.strokeStyle = trail.color;
        g.lineWidth = 3 * (1 - progress * 0.45);
        g.beginPath();
        g.ellipse(ix, iy + 2, impactR, impactR * 0.62, 0, 0, Math.PI * 2);
        g.stroke();

        g.globalAlpha = alpha * 0.9;
        g.strokeStyle = coreColor;
        g.lineWidth = 1.3;
        g.beginPath();
        g.ellipse(ix, iy + 2, impactR * 0.68, impactR * 0.42, 0, 0, Math.PI * 2);
        g.stroke();

        g.strokeStyle = coreColor;
        g.lineWidth = 1.4;
        for (let k = 0; k < 6; k++) {
          const spkAng = trail.angle + (k * Math.PI) / 3 + 0.25;
          const r0 = impactR * 0.35;
          const r1 = impactR * 1.08;
          g.beginPath();
          g.moveTo(ix + Math.cos(spkAng) * r0, iy + 2 + Math.sin(spkAng) * r0 * 0.62);
          g.lineTo(ix + Math.cos(spkAng) * r1, iy + 2 + Math.sin(spkAng) * r1 * 0.62);
          g.stroke();
        }
      } else if (style === 'bash') {
        const pushDist = (trail.radius || 22) * (0.45 + progress * 0.55);
        const span = trail.arcSpan || Math.PI * 0.65;
        const startAng = trail.angle - span * 0.5;
        const endAng = trail.angle + span * 0.5;

        g.globalAlpha = alpha * 0.45;
        g.strokeStyle = trail.color;
        g.lineWidth = 2;
        for (const frac of [-0.32, 0, 0.32]) {
          const a = trail.angle + span * frac;
          g.beginPath();
          g.moveTo(trail.x + Math.cos(a) * 6, cy + Math.sin(a) * 6);
          g.lineTo(trail.x + Math.cos(a) * (pushDist - 2), cy + Math.sin(a) * (pushDist - 2));
          g.stroke();
        }

        g.globalAlpha = alpha * 0.65;
        g.strokeStyle = trail.color;
        g.lineWidth = 6.5 * (1 - progress * 0.3);
        g.lineCap = 'butt';
        g.beginPath();
        g.arc(trail.x, cy, pushDist, startAng, endAng);
        g.stroke();

        g.globalAlpha = alpha * 0.95;
        g.strokeStyle = coreColor;
        g.lineWidth = 2.2;
        g.beginPath();
        g.arc(trail.x, cy, pushDist + 1.5, startAng + 0.06, endAng - 0.06);
        g.stroke();
      } else if (style === 'chop') {
        const dirSign = trail.flipDir ? -1 : 1;
        const span = trail.arcSpan || Math.PI * 0.62;
        const headAng = trail.angle + dirSign * span * (-0.45 + progress * 0.9);
        const tailAng = trail.angle - dirSign * span * 0.48;
        const rOuter = (trail.radius || 22) + progress * 2;
        const rInner = Math.max(6, rOuter - (trail.width || 12));

        g.globalAlpha = alpha * 0.62;
        g.fillStyle = trail.color;
        g.beginPath();
        g.arc(trail.x, cy, rOuter, Math.min(tailAng, headAng), Math.max(tailAng, headAng));
        g.lineTo(
          trail.x + Math.cos(headAng) * rInner,
          cy + Math.sin(headAng) * rInner
        );
        g.arc(
          trail.x,
          cy,
          rInner + 4,
          Math.max(tailAng, headAng),
          Math.min(tailAng, headAng),
          true
        );
        g.closePath();
        g.fill();

        g.globalAlpha = alpha * 0.95;
        g.strokeStyle = coreColor;
        g.lineWidth = 2.4;
        g.lineCap = 'round';
        g.beginPath();
        g.arc(trail.x, cy, rOuter, Math.min(tailAng, headAng), Math.max(tailAng, headAng));
        g.stroke();

        const biteX = trail.x + Math.cos(headAng) * rOuter;
        const biteY = cy + Math.sin(headAng) * rOuter;
        g.fillStyle = coreColor;
        g.beginPath();
        g.arc(biteX, biteY, 2.5 * (1 - progress * 0.3), 0, Math.PI * 2);
        g.fill();
      } else if (style === 'whirlwind') {
        const r = (trail.radius || 28) * (0.8 + progress * 0.25);
        const rot = trail.angle + progress * Math.PI * 2.2;

        g.globalAlpha = alpha * 0.55;
        g.strokeStyle = trail.color;
        g.lineWidth = 6 * (1 - progress * 0.35);
        g.beginPath();
        g.arc(trail.x, cy, r, 0, Math.PI * 2);
        g.stroke();

        g.globalAlpha = alpha * 0.95;
        g.strokeStyle = coreColor;
        g.lineWidth = 2.2;
        for (let b = 0; b < 2; b++) {
          const a0 = rot + b * Math.PI;
          g.beginPath();
          g.arc(trail.x, cy, r + (b === 0 ? 1.5 : -2), a0, a0 + Math.PI * 0.78);
          g.stroke();
        }
      } else if (style === 'shockwave') {
        const maxR = trail.radius || 32;
        const curR = maxR * (0.32 + progress * 0.68);
        const groundY = trail.y - trail.z * Z_SCALE + 1;

        g.globalAlpha = alpha * 0.6;
        g.strokeStyle = trail.color;
        g.lineWidth = 3.5 * (1 - progress * 0.45);
        g.beginPath();
        g.ellipse(trail.x, groundY, curR, curR * 0.65, 0, 0, Math.PI * 2);
        g.stroke();

        g.globalAlpha = alpha * 0.9;
        g.strokeStyle = coreColor;
        g.lineWidth = 1.4;
        g.beginPath();
        g.ellipse(trail.x, groundY, curR * 0.72, curR * 0.46, 0, 0, Math.PI * 2);
        g.stroke();
      } else if (style === 'claw_bite') {
        const reach = (trail.length || trail.radius || 22) * (0.55 + progress * 0.45);
        const spread = (trail.width || 12) * 0.5;
        for (const side of [-1, 1]) {
          const sx = trail.x + px * side * spread * 0.9;
          const sy = cy + py * side * spread * 0.9;
          const midX = trail.x + cos * (reach * 0.55) + px * side * spread * 0.55;
          const midY = cy + sin * (reach * 0.55) + py * side * spread * 0.55;
          const ex = trail.x + cos * reach + px * side * 1.5;
          const ey = cy + sin * reach + py * side * 1.5;

          g.globalAlpha = alpha * 0.65;
          g.strokeStyle = trail.color;
          g.lineWidth = 3.5 * (1 - progress * 0.35);
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(sx, sy);
          g.quadraticCurveTo(midX, midY, ex, ey);
          g.stroke();

          g.globalAlpha = alpha * 0.95;
          g.strokeStyle = coreColor;
          g.lineWidth = 1.5;
          g.beginPath();
          g.moveTo(sx, sy);
          g.quadraticCurveTo(midX, midY, ex, ey);
          g.stroke();
        }
      } else if (style === 'volley') {
        const r = (trail.radius || 15) * (0.6 + progress * 0.5);
        const span = trail.arcSpan || Math.PI * 0.45;
        g.globalAlpha = alpha * 0.55;
        g.strokeStyle = trail.color;
        g.lineWidth = 3 * (1 - progress * 0.4);
        g.lineCap = 'round';
        g.beginPath();
        g.arc(trail.x, cy, r, trail.angle - span * 0.5, trail.angle + span * 0.5);
        g.stroke();

        g.globalAlpha = alpha * 0.9;
        g.strokeStyle = coreColor;
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(trail.x + cos * 5, cy + sin * 5);
        g.lineTo(trail.x + cos * (r + 4), cy + sin * (r + 4));
        g.stroke();
      } else {
        const dirSign = trail.flipDir ? -1 : 1;
        const startAngle = trail.angle - trail.arcSpan * 0.5;
        const endAngle = trail.angle + trail.arcSpan * 0.5;
        const r = trail.radius + progress * 2.5;

        g.globalAlpha = alpha * 0.42;
        g.fillStyle = trail.color;
        g.beginPath();
        g.arc(trail.x, cy, r + 2, startAngle, endAngle);
        g.arc(
          trail.x - cos * 3,
          cy - sin * 3,
          Math.max(4, r - 4.5),
          endAngle,
          startAngle,
          true
        );
        g.closePath();
        g.fill();

        g.globalAlpha = alpha * 0.65;
        g.strokeStyle = trail.color;
        g.lineWidth = 4.5 * (1 - progress * 0.4);
        g.lineCap = 'round';
        g.beginPath();
        g.arc(trail.x, cy, r, startAngle, endAngle);
        g.stroke();

        const coreStart =
          dirSign > 0 ? startAngle + progress * trail.arcSpan * 0.25 : startAngle;
        const coreEnd =
          dirSign > 0 ? endAngle : endAngle - progress * trail.arcSpan * 0.25;
        g.globalAlpha = alpha * 0.95;
        g.strokeStyle = coreColor;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(trail.x, cy, r + 1, coreStart, coreEnd);
        g.stroke();
      }

      g.restore();
    }
    g.restore();
  }

  g.save();
  for (const p of state.projectiles) {
    const py = p.y - p.z * Z_SCALE;
    const speed = Math.hypot(p.vx, p.vy) || 1;
    const nx = p.vx / speed;
    const ny = p.vy / speed;
    const tailLen = Math.min(12, Math.max(4, speed * 0.055));

    g.strokeStyle = p.trailColor || p.color;
    g.globalAlpha = 0.65;
    g.lineWidth = Math.max(1.5, p.radius * 1.1);
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(p.x, py);
    g.lineTo(p.x - nx * tailLen, py - ny * tailLen);
    g.stroke();

    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.42;
    g.fillStyle = p.trailColor || p.color;
    g.beginPath();
    g.arc(p.x, py, p.radius * 2.1, 0, Math.PI * 2);
    g.fill();
    g.restore();

    g.globalAlpha = 1.0;
    g.fillStyle = p.color;
    g.beginPath();
    g.arc(p.x, py, p.radius, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(p.x, py, Math.max(1, p.radius * 0.45), 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/**
 * Executes `updateBladeTrails` (update blade trails) in `effectsRenderer.ts`. Mutates `state: OrionState`.
 */
export function updateBladeTrails(state: OrionState, dt: number): void {
  if (!state.bladeTrails || state.bladeTrails.length === 0) return;
  for (let i = state.bladeTrails.length - 1; i >= 0; i--) {
    state.bladeTrails[i].life -= dt;
    if (state.bladeTrails[i].life <= 0) {
      state.bladeTrails.splice(i, 1);
    }
  }
}

/**
 * Executes `drawBiomeWeatherLayer` (draw biome weather layer) in `effectsRenderer.ts`. Mutates `state: OrionState`.
 */
export function drawBiomeWeatherLayer(
  g: CanvasRenderingContext2D,
  activeBiome: BiomeDefinition,
  state: OrionState,
  room?: string[]
): void {
  const pp = resolveBiomePostProcess(activeBiome);
  g.save();
  const count = pp.weather !== 'none' && pp.weatherIntensity > 0 ? Math.round(18 * pp.weatherIntensity) : 0;

  if (count > 0 && pp.weather === 'rain') {
    g.strokeStyle = 'rgba(100, 130, 148, 0.28)';
    g.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 97.31;
      const cycle = (state.t * 1.8 + seed) % 1;
      const rx = ((seed * 43.7 + cycle * 28) % (SCREEN_W + 20)) - 10;
      const ry = cycle * (SCREEN_H + 16) - 8;

      g.beginPath();
      g.moveTo(rx, ry);
      g.lineTo(rx - 3, ry + 7);
      g.stroke();

      if (cycle > 0.85) {
        const splashR = (cycle - 0.85) * 20;
        const splashX = (seed * 61.3) % SCREEN_W;
        const splashY = (seed * 29.7) % SCREEN_H;
        g.strokeStyle = 'rgba(116, 144, 158, 0.22)';
        g.beginPath();
        g.ellipse(splashX, splashY, splashR, splashR * 0.45, 0, 0, Math.PI * 2);
        g.stroke();
        g.strokeStyle = 'rgba(100, 130, 148, 0.28)';
      }
    }
  } else if (count > 0 && pp.weather === 'ash') {
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 71.19;
      const px = (seed * 31 + state.t * 14 + Math.sin(state.t * 2 + i) * 6) % SCREEN_W;
      const py = (seed * 53 + state.t * 9) % SCREEN_H;
      const isEmber = i % 3 === 0;
      g.fillStyle = isEmber ? 'rgba(217, 119, 6, 0.55)' : 'rgba(100, 116, 139, 0.35)';
      g.fillRect(Math.round(px), Math.round(py), isEmber ? 2 : 1, isEmber ? 2 : 1);
    }
  } else if (count > 0 && pp.weather === 'aether_mist') {
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 59.47;
      const px = (seed * 37 + Math.sin(state.t * 1.4 + i) * 8 + SCREEN_W) % SCREEN_W;
      const py = (SCREEN_H - ((state.t * 10 + seed * 41) % SCREEN_H)) % SCREEN_H;
      const pulse = 0.22 + 0.30 * Math.sin(state.t * 3 + i * 1.7);
      g.fillStyle =
        i % 2 === 0
          ? `rgba(71, 118, 138, ${pulse.toFixed(2)})`
          : `rgba(88, 62, 124, ${pulse.toFixed(2)})`;
      g.fillRect(Math.round(px), Math.round(py), 1.5, 1.5);
    }
  }

  // Dynamic Off-Path Aether Mist overlay scaled by distance from Set-Path Spine & clvl
  if (isChunkedExpanseRoom(state.room)) {
    const fogMetrics = computeChunkFogMetrics(state);
    if (fogMetrics.distFromSetPath > 0 && fogMetrics.fogIntensity > 0) {
      const mistCount = Math.min(34, Math.round(8 + fogMetrics.fogIntensity * 14));
      for (let i = 0; i < mistCount; i++) {
        const seed = (i + 1) * 67.83;
        const driftX = Math.sin(state.t * (1.2 + fogMetrics.fogIntensity * 0.4) + i) * 11;
        const px = (seed * 41 + driftX + SCREEN_W) % SCREEN_W;
        const py =
          (SCREEN_H -
            ((state.t * (11 + fogMetrics.fogIntensity * 5) + seed * 47) % SCREEN_H)) %
          SCREEN_H;
        const alpha = Math.min(
          0.78,
          (0.22 + fogMetrics.fogIntensity * 0.18) *
            (0.65 + 0.35 * Math.sin(state.t * 3.2 + i * 1.3))
        );
        g.fillStyle = fogMetrics.isSoftCapAbyss
          ? i % 2 === 0
            ? `rgba(190, 24, 93, ${alpha.toFixed(2)})`
            : `rgba(88, 28, 135, ${alpha.toFixed(2)})`
          : i % 2 === 0
            ? `rgba(56, 118, 128, ${alpha.toFixed(2)})`
            : `rgba(76, 29, 149, ${alpha.toFixed(2)})`;
        const sz = fogMetrics.isSoftCapAbyss ? 2 : 1.5;
        g.fillRect(Math.round(px), Math.round(py), sz, sz);
      }
    }
  }

  // Cursed-Bog Atmospheric Depth Pass:
  // 1) Low-lying drifting corpse-slate & sickly-mire miasma ribbons across the ground plane
  // 2) Suspended spore motes that glint only when caught inside light pools or penumbra
  if (state.room !== '-4,0') {
    const camX = state.camX || 0;
    const camY = state.camY || 0;
    const activeRoom = room;

    // 1. Low-lying creeping bog miasma wisps (world-space anchored, modulated by light visibility)
    const wispCount = 16;
    for (let i = 0; i < wispCount; i++) {
      const seed = (i + 1) * 83.41;
      const baseWx = camX + ((seed * 53.7 + state.t * (2.6 + (i % 3) * 0.8)) % (SCREEN_W + 64)) - 32;
      const baseWy =
        camY +
        ((seed * 79.3 + Math.sin(state.t * 0.45 + i * 1.7) * 14 + SCREEN_H + 48) %
          (SCREEN_H + 48)) -
        24;
      const vis = getPointVisibilityFactor(baseWx, baseWy, state, activeRoom);
      if (vis <= 0.04) continue;

      const sx = baseWx - camX;
      const sy = baseWy - camY;
      const wispW = 26 + (i % 4) * 9;
      const wispH = 5 + (i % 3) * 2;
      const breathe = 0.65 + 0.35 * Math.sin(state.t * 1.3 + i * 2.1);
      // Miasma is thickest in the cold mid-ring penumbra and softer in the inner core
      const penumbraBoost = vis < 0.65 ? vis * 1.45 : 0.95 - (vis - 0.65) * 0.65;
      const wispAlpha = Math.min(0.34, 0.20 * penumbraBoost * breathe);

      const mGrad = g.createRadialGradient(sx, sy, 1, sx, sy, wispW);
      if (i % 3 === 0) {
        // Sickly mire miasma
        mGrad.addColorStop(0, `rgba(28, 48, 42, ${wispAlpha.toFixed(3)})`);
        mGrad.addColorStop(0.6, `rgba(14, 26, 23, ${(wispAlpha * 0.58).toFixed(3)})`);
      } else if (i % 3 === 1) {
        // Corpse-slate fog
        mGrad.addColorStop(0, `rgba(34, 44, 54, ${wispAlpha.toFixed(3)})`);
        mGrad.addColorStop(0.6, `rgba(16, 22, 30, ${(wispAlpha * 0.58).toFixed(3)})`);
      } else {
        // Abyssal indigo vapor
        mGrad.addColorStop(0, `rgba(24, 18, 42, ${wispAlpha.toFixed(3)})`);
        mGrad.addColorStop(0.6, `rgba(10, 8, 22, ${(wispAlpha * 0.58).toFixed(3)})`);
      }
      mGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      g.save();
      g.translate(sx, sy);
      g.scale(1, wispH / wispW);
      g.fillStyle = mGrad;
      g.beginPath();
      g.arc(0, 0, wispW, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    // 2. Suspended bog spore motes caught in the lantern/campfire beam
    const sporeCount = 24;
    for (let i = 0; i < sporeCount; i++) {
      const seed = (i + 1) * 113.17;
      const driftX = Math.sin(state.t * 0.85 + seed) * 9 + state.t * 1.8;
      const driftY = Math.cos(state.t * 0.65 + seed * 0.7) * 7 - state.t * 1.4;
      const wx = camX + (((seed * 67.3 + driftX) % SCREEN_W) + SCREEN_W) % SCREEN_W;
      const wy = camY + (((seed * 91.9 + driftY) % SCREEN_H) + SCREEN_H) % SCREEN_H;

      const vis = getPointVisibilityFactor(wx, wy, state, activeRoom);
      if (vis <= 0.1) continue;

      const sx = Math.round(wx - camX);
      const sy = Math.round(wy - camY);
      const twinkle = 0.5 + 0.5 * Math.sin(state.t * 2.4 + seed * 1.9);
      const moteAlpha = Math.min(0.62, vis * 0.60 * twinkle);
      const isInnerMote = vis > 0.66;

      if (i % 3 === 0 && vis > 0.35) {
        g.fillStyle = isInnerMote
          ? `rgba(217, 119, 6, ${(moteAlpha * 0.18).toFixed(3)})`
          : `rgba(74, 124, 112, ${(moteAlpha * 0.18).toFixed(3)})`;
        g.fillRect(sx - 1, sy - 1, 3, 3);
      }

      g.fillStyle = isInnerMote
        ? `rgba(214, 196, 148, ${moteAlpha.toFixed(3)})`
        : i % 2 === 0
          ? `rgba(112, 132, 144, ${moteAlpha.toFixed(3)})`
          : `rgba(82, 136, 122, ${(moteAlpha * 0.82).toFixed(3)})`;
      g.fillRect(sx, sy, 1, 1);
    }
  }

  g.restore();
}

// [ORION-ANCHOR: RENDER-VISION-LIGHTING]
/**
 * Type contract for `ResolvedRoomLightingState` (resolved room lighting state) in `effectsRenderer.ts`.
 */
export interface ResolvedRoomLightingState {
  safetyTier: 'sanctuary' | 'trail' | 'hazard' | 'abyss';
  ambientDarkness: number;
  cornerShadowIntensity: number;
  effectiveVisionRadiusPx: number;
  ambientTintColor?: string;
  staticLightAnchors: Array<{ x: number; y: number; radius: number; color: string }>;
}

/**
 * Executes `resolveRoomLightingProfile` (resolve room lighting profile) in `effectsRenderer.ts`.
 */
export function resolveRoomLightingProfile(
  state: OrionState,
  room?: string[]
): ResolvedRoomLightingState {
  const effectiveRoomKey = getEffectiveRoomCoord(state);
  const activeNode = state.fogGraph?.nodes?.[effectiveRoomKey] || state.fogGraph?.nodes?.[state.room];
  const localDef = LOCAL_ROOM_REGISTRY[effectiveRoomKey] || LOCAL_ROOM_REGISTRY[state.room];
  const globalDef = activeNode?.id ? GLOBAL_ROOM_REGISTRY[activeNode.id] : undefined;
  const authoredProfile: RoomLightingProfile | undefined =
    localDef?.lighting || globalDef?.lighting;

  const isExpanse = isChunkedExpanseRoom(state.room);
  const expanseFog = isExpanse ? computeChunkFogMetrics(state) : null;

  const isLoop = activeNode?.nodeType === 'loop';
  const loopDepth = Math.max(0, state.fogGraph?.loopDepth || activeNode?.loopDepth || 0);

  const safetyTier: 'sanctuary' | 'trail' | 'hazard' | 'abyss' =
    expanseFog && expanseFog.distFromSetPath > 0
      ? expanseFog.isSoftCapAbyss
        ? 'abyss'
        : 'hazard'
      : authoredProfile?.safetyTier ||
        (isLoop
          ? loopDepth >= 2
            ? 'abyss'
            : 'hazard'
          : effectiveRoomKey === '0,0' ||
              effectiveRoomKey === '0,-2' ||
              effectiveRoomKey === '-3,0' ||
              effectiveRoomKey === '-4,0'
            ? 'sanctuary'
            : 'trail');

  // Pitch-black abyss beyond active light pools (92%-97% dark across the cursed land)
  const baseDarkness =
    expanseFog && expanseFog.distFromSetPath > 0
      ? Math.min(0.97, 0.94 + expanseFog.fogIntensity * 0.03)
      : Math.max(
          authoredProfile?.ambientDarkness ?? 0,
          safetyTier === 'sanctuary'
            ? 0.92
            : safetyTier === 'trail'
              ? 0.94
              : safetyTier === 'hazard'
                ? 0.96
                : 0.97
        );
  const ambientDarkness = isLoop
    ? Math.min(0.97, Math.max(baseDarkness, 0.95 + loopDepth * 0.01))
    : baseDarkness;

  const baseCornerShadow =
    expanseFog && expanseFog.distFromSetPath > 0
      ? Math.min(0.96, 0.88 + expanseFog.fogIntensity * 0.06)
      : Math.max(
          authoredProfile?.cornerShadowIntensity ?? 0,
          safetyTier === 'sanctuary'
            ? 0.84
            : safetyTier === 'trail'
              ? 0.88
              : safetyTier === 'hazard'
                ? 0.92
                : 0.96
        );
  const cornerShadowIntensity = isLoop
    ? Math.min(0.97, Math.max(baseCornerShadow, 0.90 + loopDepth * 0.025))
    : baseCornerShadow;

  // Base vision = 5 tiles (5 * TILE_SIZE = 80px at base Light = 5)
  const playerLightTiles = computeEffectivePlayerLightTiles(state);
  const baseLightStatPx = Math.max(
    playerLightTiles * TILE_SIZE,
    safetyTier === 'sanctuary' ? 84 : 80
  );

  const fogPenaltyPx =
    expanseFog && expanseFog.distFromSetPath > 0
      ? Math.round(expanseFog.fogIntensity * 8) - (expanseFog.isLanternLit ? 10 : 0)
      : isLoop
        ? loopDepth * 4
        : 0;

  const effectiveVisionRadiusPx = Math.max(48, baseLightStatPx - fogPenaltyPx);
  const hasLantern = hasPoeLanternGuidance(state);

  const staticLightAnchors: Array<{ x: number; y: number; radius: number; color: string }> = [];
  if (room) {
    const { minTx, maxTx, minTy, maxTy } = getVisibleTileBounds(
      room,
      state.camX || 0,
      state.camY || 0,
      6
    );
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const ch = room[ty]?.[tx];
        if (!ch) continue;
        const cx = tx * TILE_SIZE + 8;
        const cy = ty * TILE_SIZE + 8;
        if (ch === 'A') {
          const isCampfireLit =
            effectiveRoomKey === '0,0'
              ? Boolean(state.flags?.first_campfire_lit)
              : true;
          if (isCampfireLit) {
            staticLightAnchors.push({ x: cx, y: cy, radius: 44, color: '#d97706' });
          }
        } else if (ch === 'L') {
          const tileChunk = getChunkCoordsFromPx(cx, cy);
          const chunkLanternKey = makeChunkPersistenceKey(
            state.room,
            tileChunk.cx,
            tileChunk.cy
          );
          const isChunkLanternLit = Boolean(state.litChunkLanterns?.[chunkLanternKey]);
          const isLit =
            isChunkLanternLit || state.flags?.poe_state === 'helped' || hasLantern;
          staticLightAnchors.push({
            x: cx,
            y: cy,
            radius: isChunkLanternLit ? 46 : isLit ? 40 : 14,
            color: isChunkLanternLit ? '#38bdf8' : isLit ? '#38bdf8' : '#d97706',
          });
        } else if (ch === 'D') {
          staticLightAnchors.push({ x: cx, y: cy, radius: 20, color: '#e11d48' });
        } else if (ch === 'Q') {
          staticLightAnchors.push({ x: cx, y: cy, radius: 24, color: '#22d3ee' });
        }
      }
    }
  }

  // Poe Spirit casts a localized spirit-lantern light aura (visible behind the trees at the edge of 0,0)
  for (const e of state.enemies) {
    if (e.type === 'bog_poe') {
      staticLightAnchors.push({
        x: e.x,
        y: e.y,
        radius: 22,
        color: '#7dd3fc',
      });
    }
  }

  return {
    safetyTier,
    ambientDarkness,
    cornerShadowIntensity,
    effectiveVisionRadiusPx,
    ambientTintColor: authoredProfile?.ambientTintColor,
    staticLightAnchors,
  };
}

/**
 * Returns true if the tile at `(tx, ty)` is an opaque vision/light blocker
 * (walls `#`, trees/pillars `P`, solid-phase desync walls `%`, or closed gates `G`/`M`).
 */
export function isTileOpaqueToLight(
  room: string[] | undefined,
  tx: number,
  ty: number,
  state: OrionState
): boolean {
  if (!room || ty < 0 || ty >= room.length) return true;
  const row = room[ty];
  if (!row || tx < 0 || tx >= row.length) return true;
  const ch = row[tx];
  if (!ch || ch === ' ' || ch === '#' || ch === 'P') return true;
  if (ch === '%') {
    return Math.floor((state.t || 0) / 3.5) % 2 === 0;
  }
  if (ch === 'G') {
    const gateUnlocked = Boolean(
      state.unlockedGates?.[state.room] ||
        state.unlockedGates?.['3,0'] ||
        state.flags?.bog_exit_revealed
    );
    return !gateUnlocked;
  }
  if (ch === 'M') {
    return !state.flags?.cathedral_door_open;
  }
  return false;
}

/**
 * Checks whether a specific world-space sample point `(sx, sy)` inside tile `(tx, ty)`
 * intersects the physical occluder volume of that tile:
 * - Trees (`'P'`) have a central trunk/canopy cylinder (`r ≈ 5.8px`), allowing narrow slivers
 *   of light to graze past the outer corners while casting a distinct shadow cone behind the tree.
 * - Solid walls (`'#'`, `'G'`, `'M'`, `'%'`) occlude the entire `16×16` tile cell.
 */
function isSampleInsideTileOccluder(
  room: string[],
  tx: number,
  ty: number,
  sx: number,
  sy: number,
  state: OrionState
): boolean {
  if (!isTileOpaqueToLight(room, tx, ty, state)) return false;
  const ch = room[ty]?.[tx];
  if (ch === 'P') {
    const cx = tx * TILE_SIZE + 8;
    const cy = ty * TILE_SIZE + 8;
    const dx = sx - cx;
    const dy = sy - cy;
    return dx * dx + dy * dy <= 34; // ~5.83px radius tree trunk/canopy core
  }
  return true;
}

/**
 * Traces a ray from `(lx, ly)` to `(targetX, targetY)` and returns a transmission factor `[0..1]`.
 * - Any wall (`#`), tree (`P`), or closed gate (`G`/`M`) strictly between the origin and the target
 *   tile blocks the ray (`0.0`).
 * - If `(targetX, targetY)` itself lies on a wall or tree tile, and the ray reaches that tile
 *   unobstructed, its front/near face is illuminated (`1.0` on the lit face, tapering on the back)
 *   so the player can see the wall or tree blocking their view while everything behind it is in shadow.
 */
function traceSingleRayTransmission(
  room: string[],
  state: OrionState,
  lx: number,
  ly: number,
  targetX: number,
  targetY: number
): number {
  const dx = targetX - lx;
  const dy = targetY - ly;
  const dist = Math.hypot(dx, dy);
  if (dist < 3) return 1.0;

  const srcTx = Math.floor(lx / TILE_SIZE);
  const srcTy = Math.floor(ly / TILE_SIZE);
  const targetTx = Math.floor(targetX / TILE_SIZE);
  const targetTy = Math.floor(targetY / TILE_SIZE);

  if (srcTx === targetTx && srcTy === targetTy) {
    return 1.0;
  }

  const targetIsOpaque = isTileOpaqueToLight(room, targetTx, targetTy, state);
  const steps = Math.max(3, Math.ceil(dist / 3.5));

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const sx = lx + dx * t;
    const sy = ly + dy * t;
    const tx = Math.floor(sx / TILE_SIZE);
    const ty = Math.floor(sy / TILE_SIZE);

    if (tx === srcTx && ty === srcTy) continue;

    if (tx === targetTx && ty === targetTy) {
      if (!targetIsOpaque) return 1.0;
      const tileCx = targetTx * TILE_SIZE + 8;
      const tileCy = targetTy * TILE_SIZE + 8;
      const nx = dx / dist;
      const ny = dy / dist;
      const depthIntoTile = (targetX - tileCx) * nx + (targetY - tileCy) * ny;
      if (depthIntoTile <= 2.5) return 1.0;
      return Math.max(0.28, 1 - (depthIntoTile - 2.5) / 8.0);
    }

    if (isSampleInsideTileOccluder(room, tx, ty, sx, sy, state)) {
      return 0.0;
    }
  }

  return 1.0;
}

/**
 * Computes soft-edged dynamic line-of-sight transmission `[0..1]` from `(lx, ly)` to `(targetX, targetY)`
 * by sampling a primary center ray and two slight perpendicular penumbra offsets.
 */
export function computeRayLightTransmission(
  room: string[] | undefined,
  state: OrionState,
  lx: number,
  ly: number,
  targetX: number,
  targetY: number
): number {
  if (!room || room.length === 0) return 1.0;
  const dx = targetX - lx;
  const dy = targetY - ly;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return 1.0;

  const centerHit = traceSingleRayTransmission(room, state, lx, ly, targetX, targetY);
  if (dist < 14) return centerHit;

  // Perpendicular 2.2px offset rays at the source for smooth dynamic shadow penumbra around trees/corners
  const px = (-dy / dist) * 2.2;
  const py = (dx / dist) * 2.2;
  const leftHit = traceSingleRayTransmission(room, state, lx + px, ly + py, targetX, targetY);
  const rightHit = traceSingleRayTransmission(room, state, lx - px, ly - py, targetX, targetY);

  return centerHit * 0.6 + (leftHit + rightHit) * 0.2;
}

let darknessOverlayCanvas: HTMLCanvasElement | null = null;
let darknessOverlayCtx: CanvasRenderingContext2D | null = null;
let penumbraTintCanvas: HTMLCanvasElement | null = null;
let penumbraTintCtx: CanvasRenderingContext2D | null = null;

function getDarknessOverlayContext(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} | null {
  if (typeof document === 'undefined') return null;
  if (!darknessOverlayCanvas) {
    darknessOverlayCanvas = document.createElement('canvas');
    darknessOverlayCanvas.width = SCREEN_W;
    darknessOverlayCanvas.height = SCREEN_H;
    darknessOverlayCtx = darknessOverlayCanvas.getContext('2d');
  }
  if (!darknessOverlayCtx) return null;
  return { canvas: darknessOverlayCanvas, ctx: darknessOverlayCtx };
}

function getPenumbraTintContext(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} | null {
  if (typeof document === 'undefined') return null;
  if (!penumbraTintCanvas) {
    penumbraTintCanvas = document.createElement('canvas');
    penumbraTintCanvas.width = SCREEN_W;
    penumbraTintCanvas.height = SCREEN_H;
    penumbraTintCtx = penumbraTintCanvas.getContext('2d');
  }
  if (!penumbraTintCtx) return null;
  return { canvas: penumbraTintCanvas, ctx: penumbraTintCtx };
}

/**
 * Executes `getPointVisibilityFactor` (get point visibility factor) in `effectsRenderer.ts`.
 */
export function getPointVisibilityFactor(
  x: number,
  y: number,
  state: OrionState,
  room?: string[]
): number {
  const activeRoom = room;
  const lighting = resolveRoomLightingProfile(state, activeRoom);
  if (state.room === '-4,0') {
    return 1.0;
  }

  // Player line-of-sight transmission: walls ('#') and trees ('P') cast shadows blocking direct sight
  const playerLos = activeRoom
    ? computeRayLightTransmission(activeRoom, state, state.x, state.y, x, y)
    : 1.0;
  if (playerLos <= 0.01) {
    return 0;
  }

  const visionR = lighting.effectiveVisionRadiusPx * 1.04;
  const distToPlayer = Math.hypot(x - state.x, y - state.y);

  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  const dx = x - state.x;
  const dy = y - state.y;
  const dot = distToPlayer > 1 ? (dx * dirInfo.dx + dy * dirInfo.dy) / distToPlayer : 1;
  const directionalBonus = dot > 0.2 ? 1 + (dot - 0.2) * 0.14 : 1.0;
  const effPlayerR = visionR * directionalBonus;

  let bestVis = 0;
  // Steep multi-stop visibility matching the 5-tile (80px) base vision halo and steep falloff
  if (distToPlayer <= effPlayerR * 0.24) {
    bestVis = playerLos;
  } else if (distToPlayer <= effPlayerR * 0.56) {
    const t = (distToPlayer - effPlayerR * 0.24) / (effPlayerR * 0.32);
    bestVis = Math.max(0, (1 - t * 0.62) * playerLos);
  } else if (distToPlayer < effPlayerR) {
    const t = (distToPlayer - effPlayerR * 0.56) / (effPlayerR * 0.44);
    bestVis = Math.max(0, 0.38 * (1 - t) * playerLos);
  }

  for (const anchor of lighting.staticLightAnchors) {
    const d = Math.hypot(x - anchor.x, y - anchor.y);
    const ar = anchor.radius * 1.05;
    if (d < ar) {
      const rawAnchorVis =
        d <= ar * 0.28
          ? 1.0
          : d <= ar * 0.62
            ? 1 - ((d - ar * 0.28) / (ar * 0.34)) * 0.58
            : 0.42 * (1 - (d - ar * 0.62) / (ar * 0.38));
      const anchorLos = activeRoom
        ? computeRayLightTransmission(activeRoom, state, anchor.x, anchor.y, x, y)
        : 1.0;
      const aVis = rawAnchorVis * anchorLos * Math.max(0.32, playerLos);
      if (aVis > bestVis) bestVis = aVis;
    }
  }

  for (const p of state.projectiles) {
    if (p.lightRadius && p.lightRadius > 0) {
      const d = Math.hypot(x - p.x, y - p.y);
      const pr = p.lightRadius * 1.15;
      if (d < pr) {
        const rawProjVis = Math.max(0, 1 - d / pr);
        const projLos = activeRoom
          ? computeRayLightTransmission(activeRoom, state, p.x, p.y, x, y)
          : 1.0;
        const pVis = rawProjVis * projLos * playerLos;
        if (pVis > bestVis) bestVis = pVis;
      }
    }
  }

  return Math.max(0, Math.min(1, bestVis));
}

/**
 * Projects soft, feathered radial shadow cones onto `dg` (`source-over`) behind opaque bog trees (`P`),
 * walls (`#`, `%`), and closed gates (`G`, `M`) relative to a light emitter at `(lightWorldX, lightWorldY)`.
 * Front faces of trees and walls remain illuminated while casting oppressive shadow wedges behind them.
 */
function projectSoftOccluderShadowCones(
  dg: CanvasRenderingContext2D,
  room: string[],
  state: OrionState,
  lightWorldX: number,
  lightWorldY: number,
  lightRadiusPx: number,
  camX: number,
  camY: number,
  maxShadowAlpha: number
): void {
  const tileRange = Math.ceil(lightRadiusPx / TILE_SIZE) + 1;
  const centerTx = Math.floor(lightWorldX / TILE_SIZE);
  const centerTy = Math.floor(lightWorldY / TILE_SIZE);
  const minTx = Math.max(0, centerTx - tileRange);
  const maxTx = Math.min((room[0]?.length || 1) - 1, centerTx + tileRange);
  const minTy = Math.max(0, centerTy - tileRange);
  const maxTy = Math.min(room.length - 1, centerTy + tileRange);

  const lSx = lightWorldX - camX;
  const lSy = lightWorldY - camY;

  for (let ty = minTy; ty <= maxTy; ty++) {
    const row = room[ty];
    if (!row) continue;
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (tx === centerTx && ty === centerTy) continue;
      if (!isTileOpaqueToLight(room, tx, ty, state)) continue;

      const ch = row[tx];
      const occWorldX = tx * TILE_SIZE + 8;
      const occWorldY = ty * TILE_SIZE + 8;
      const dx = occWorldX - lightWorldX;
      const dy = occWorldY - lightWorldY;
      const dist = Math.hypot(dx, dy);

      if (dist < 8 || dist > lightRadiusPx * 0.96) continue;

      const occRadius = ch === 'P' ? 4.8 : 6.4;
      const centerAngle = Math.atan2(dy, dx);
      const baseHalfAngle = Math.min(Math.PI * 0.25, Math.atan2(occRadius, Math.max(9, dist)));

      // Begin the shadow behind the obstacle so the front face stays readable while umbra swallows the rear
      const shadowStartDist = Math.max(14, dist + (ch === 'P' ? 3.5 : 5.0));
      const shadowEndDist = Math.max(shadowStartDist + 16, lightRadiusPx + 12);
      const distRatio = Math.max(0, Math.min(1, 1 - dist / lightRadiusPx));
      const coneAlpha = maxShadowAlpha * (0.56 + 0.38 * distRatio);

      const startX = lSx + Math.cos(centerAngle) * shadowStartDist;
      const startY = lSy + Math.sin(centerAngle) * shadowStartDist;
      const endX = lSx + Math.cos(centerAngle) * shadowEndDist;
      const endY = lSy + Math.sin(centerAngle) * shadowEndDist;

      const grad = dg.createLinearGradient(startX, startY, endX, endY);
      grad.addColorStop(0, `rgba(2, 3, 9, ${(coneAlpha * 0.28).toFixed(3)})`);
      grad.addColorStop(0.25, `rgba(2, 3, 9, ${(coneAlpha * 0.76).toFixed(3)})`);
      grad.addColorStop(1, `rgba(2, 3, 9, ${(coneAlpha * 0.96).toFixed(3)})`);

      dg.fillStyle = grad;

      // 2-lobe feathered shadow cone (soft penumbra -> deep abyssal umbra)
      const lobes: Array<{ spread: number; weight: number }> = [
        { spread: 1.18, weight: 0.32 },
        { spread: 0.82, weight: 0.56 },
      ];

      for (const lobe of lobes) {
        const ha = baseHalfAngle * lobe.spread;
        const a1 = centerAngle - ha;
        const a2 = centerAngle + ha;
        const nearR = shadowStartDist;
        const farR = shadowEndDist;

        dg.globalAlpha = lobe.weight;
        dg.beginPath();
        dg.moveTo(lSx + Math.cos(a1) * nearR, lSy + Math.sin(a1) * nearR);
        dg.lineTo(lSx + Math.cos(a1) * farR, lSy + Math.sin(a1) * farR);
        dg.arc(lSx, lSy, farR, a1, a2, false);
        dg.lineTo(lSx + Math.cos(a2) * nearR, lSy + Math.sin(a2) * nearR);
        dg.closePath();
        dg.fill();
      }
      dg.globalAlpha = 1.0;
    }
  }
}

// [ORION-ANCHOR: RENDER-POST-PROCESS]
/**
 * Executes `drawDynamicLightingAndBloomPass` (draw dynamic lighting and bloom pass) in `effectsRenderer.ts`. Mutates `state: OrionState`.
 */
export function drawDynamicLightingAndBloomPass(
  g: CanvasRenderingContext2D,
  room: string[] | undefined,
  activeBiome: BiomeDefinition,
  state: OrionState,
  camX: number = 0,
  camY: number = 0
): void {
  const pp = resolveBiomePostProcess(activeBiome);
  const roomLighting = resolveRoomLightingProfile(state, room);
  const lights: SceneLightEmitter[] = [];

  // Organic multi-harmonic lantern/reactor flicker & breathing wave
  const flickerWave =
    Math.sin(state.t * 2.3) * 0.032 +
    Math.sin(state.t * 6.1) * 0.016 +
    Math.cos(state.t * 12.7) * 0.008;
  const radiusBreathMult = 1 + flickerWave;

  if (!state.isFallingIntoPit) {
    const py = state.y - state.z * Z_SCALE - 8;
    const reactorColor =
      state.reactor === 'Ichor' ? '#ea580c' : state.reactor === 'Mana' ? '#38bdf8' : '#a855f7';
    const boostMult = state.isContinuousBoosting || (state.overdriveTimer || 0) > 0 ? 1.28 : 1.0;
    // Muted dying-ember inner core light + subtle reactor glint
    lights.push({
      x: state.x,
      y: py,
      radius: 18 * boostMult * radiusBreathMult,
      color: '#d97706',
      intensity: (0.16 + flickerWave * 0.6) * boostMult,
    });
    lights.push({
      x: state.x,
      y: py,
      radius: 13 * boostMult,
      color: reactorColor,
      intensity: 0.12 * boostMult,
    });
  }

  const activeFogNode = state.fogGraph?.nodes?.[state.room];
  const hasLanternGuidance = hasPoeLanternGuidance(state);
  const cardinalDirs: AetherCardinalDir[] = ['N', 'S', 'E', 'W'];

  if (activeFogNode && room) {
    for (const dir of cardinalDirs) {
      const transInfo = getDoorwayAetherTransitionInfo(state, dir);
      const isLoopDensityWarning =
        activeFogNode.nodeType === 'loop' && transInfo.increasesDensity;
      const isPoeLoopEntranceReveal =
        activeFogNode.nodeType !== 'loop' &&
        transInfo.isLoopEntrance &&
        hasLanternGuidance;

      if (isLoopDensityWarning || isPoeLoopEntranceReveal) {
        const doorPos = getRoomDoorwayCenterPx(room, dir);
        lights.push({
          x: doorPos.x,
          y: doorPos.y,
          radius: isLoopDensityWarning ? 16 + transInfo.nextDepth * 3 : 20,
          color: isLoopDensityWarning
            ? transInfo.nextDepth >= 3
              ? '#e11d48'
              : '#9333ea'
            : '#22d3ee',
          intensity: isLoopDensityWarning ? 0.16 + transInfo.nextDepth * 0.04 : 0.22,
        });
      }
    }
  }

  if (room) {
    const { minTx, maxTx, minTy, maxTy } = getVisibleTileBounds(room, camX, camY, 5);
    const pulse = Math.sin(state.t * 3.8) * 1.4 + Math.cos(state.t * 9.3) * 0.6;
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const ch = room[ty]?.[tx];
        if (!ch || ch === '.' || ch === ',' || ch === ':' || ch === '#') continue;
        const cx = tx * TILE_SIZE + 8;
        const cy = ty * TILE_SIZE + 8;

        if (ch === 'L') {
          const isHelped = hasPoeLanternGuidance(state);
          lights.push({
            x: cx,
            y: cy - 6,
            radius: (isHelped ? 36 : 15) + pulse,
            color: isHelped ? '#38bdf8' : '#d97706',
            intensity: isHelped ? 0.30 : 0.18,
          });
        } else if (ch === 'D') {
          lights.push({
            x: cx,
            y: cy - 4,
            radius: 18 + pulse,
            color: '#38bdf8',
            intensity: 0.20,
          });
        } else if (ch === 'A') {
          const effRoom = getEffectiveRoomCoord(state);
          const isCampfireLit =
            effRoom === '0,0' ? Boolean(state.flags?.first_campfire_lit) : true;
          if (isCampfireLit) {
            lights.push({
              x: cx,
              y: cy - 3,
              radius: 40 + pulse * 1.2,
              color: '#ea580c',
              intensity: 0.32 + flickerWave * 0.7,
            });
          }
        } else if (ch === 'Q') {
          lights.push({
            x: cx,
            y: cy - 8,
            radius: 22 + pulse,
            color: '#22d3ee',
            intensity: 0.26,
          });
        } else if (ch === '~' && (tx + ty) % 2 === 0) {
          lights.push({
            x: cx,
            y: cy,
            radius: 13,
            color: '#2dd4bf',
            intensity: 0.06,
          });
        }
      }
    }
  }

  for (const p of state.projectiles) {
    if (p.lightRadius && p.lightRadius > 0) {
      lights.push({
        x: p.x,
        y: p.y - p.z * Z_SCALE,
        radius: p.lightRadius * 0.85,
        color: p.color,
        intensity: 0.20,
      });
    }
  }

  for (const e of state.enemies) {
    if (e.isSubmerged) continue;
    if (e.type === 'bog_poe' || e.type === 'lady_of_the_lake' || e.state === 'windup') {
      lights.push({
        x: e.x,
        y: e.y - e.z * Z_SCALE - 6,
        radius: e.type === 'bog_poe' ? 22 : e.state === 'windup' ? 18 : 16,
        color: e.state === 'windup' ? '#d97706' : e.emissiveColor || '#38bdf8',
        intensity: e.type === 'bog_poe' ? 0.28 : 0.18,
      });
    }
  }

  if (state.flags?.poe_state === 'companion' && state.poeCompanion) {
    const poeStyle = resolveCompanionPoeColor(state);
    lights.push({
      x: state.poeCompanion.x,
      y: state.poeCompanion.y - (state.poeCompanion.z || 8) * Z_SCALE,
      radius: state.poeCompanion.hoveringObjective ? 28 : 20,
      color: poeStyle.hexColor,
      intensity: state.poeCompanion.hoveringObjective ? 0.34 : 0.26,
    });
  }

  // Cursed-Land Multi-Depth Lighting: Desaturated Corpse-Slate, Abyssal Indigo, Sickly Mire & 92-97% Void
  if (room && state.room !== '-4,0') {
    state.exploredTiles = state.exploredTiles || {};
    const roomExplored =
      state.exploredTiles[state.room] || (state.exploredTiles[state.room] = {});
    const { minTx, maxTx, minTy, maxTy } = getVisibleTileBounds(room, camX, camY, 2);

    // Update persistent tile exploration for world map / minimap tracking
    const exploreR = roomLighting.effectiveVisionRadiusPx * 0.95;
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const tileCx = tx * TILE_SIZE + 8;
        const tileCy = ty * TILE_SIZE + 8;
        if (Math.hypot(tileCx - state.x, tileCy - state.y) <= exploreR) {
          roomExplored[`${tx},${ty}`] = true;
        }
      }
    }

    // Render Room 0,0 Eastern Exit Mist Seal when First Campfire is unlit
    if (!state.flags?.first_campfire_lit && !state.bypassProgressionGates) {
      const isStandalone00 = state.room === '0,0';
      const isExpanse = isChunkedExpanseRoom(state.room);
      if (isStandalone00 || isExpanse) {
        const barrierTx = isStandalone00 ? 15 : 139;
        const barrierMinTy = isStandalone00 ? 4 : 85;
        const barrierMaxTy = isStandalone00 ? 7 : 92;
        if (barrierTx >= minTx && barrierTx <= maxTx) {
          g.save();
          g.translate(-camX, -camY);
          const pulseAlpha = 0.45 + 0.25 * Math.sin(state.t * 4);
          for (let bty = barrierMinTy; bty <= barrierMaxTy; bty++) {
            const bx = barrierTx * TILE_SIZE;
            const by = bty * TILE_SIZE;
            g.fillStyle = `rgba(56, 189, 248, ${(pulseAlpha * 0.45).toFixed(2)})`;
            g.fillRect(bx + 2, by, TILE_SIZE - 4, TILE_SIZE);
            g.fillStyle = `rgba(192, 132, 252, ${pulseAlpha.toFixed(2)})`;
            g.fillRect(bx + 7, by, 2, TILE_SIZE);
          }
          g.restore();
        }
      }
    }

    const playerLightY = state.y - state.z * Z_SCALE - 6;
    // Base 5-tile personal halo (80px at base Light = 5)
    const playerOuterR = Math.max(
      48,
      roomLighting.effectiveVisionRadiusPx * 1.04 * radiusBreathMult
    );
    const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;

    // PASS 1: Cursed Land Color Grading (Desaturated Corpse-Slate, Abyssal Indigo & Sickly Mire)
    // Even inside the inner lantern core, we retain ~48% of the cursed grade so grass and trees
    // look withered, cold, and blighted rather than a pleasant sunny forest.
    const tintOverlay = getPenumbraTintContext();
    if (tintOverlay) {
      const { canvas: tintCvs, ctx: tg } = tintOverlay;
      tg.save();
      tg.globalCompositeOperation = 'source-over';
      tg.globalAlpha = 1.0;
      tg.clearRect(0, 0, SCREEN_W, SCREEN_H);

      // Base corpse-slate & sickly-mire wash across the viewport
      tg.fillStyle = 'rgba(14, 21, 24, 0.56)';
      tg.fillRect(0, 0, SCREEN_W, SCREEN_H);

      // Deep abyssal indigo radial wash toward the penumbra and outer perimeter
      const pSx = state.x - camX;
      const pSy = playerLightY - camY;
      const indigoGrad = tg.createRadialGradient(
        pSx,
        pSy,
        playerOuterR * 0.22,
        pSx,
        pSy,
        playerOuterR * 1.45
      );
      indigoGrad.addColorStop(0, 'rgba(18, 28, 25, 0.14)'); // sickly mire undertone in near-penumbra
      indigoGrad.addColorStop(0.55, 'rgba(16, 22, 32, 0.34)'); // cold corpse-slate mid-ring
      indigoGrad.addColorStop(1, 'rgba(8, 6, 18, 0.52)'); // abyssal indigo outer shroud
      tg.fillStyle = indigoGrad;
      tg.fillRect(0, 0, SCREEN_W, SCREEN_H);

      // Partially soften the grade only in the immediate personal core (strength <= 0.54)
      // so the world never reverts to raw ungraded forest greens
      tg.globalCompositeOperation = 'destination-out';
      const punchCursedCore = (wx: number, wy: number, coreR: number, strength: number) => {
        const sx = wx - camX;
        const sy = wy - camY;
        if (sx + coreR < 0 || sx - coreR > SCREEN_W || sy + coreR < 0 || sy - coreR > SCREEN_H) {
          return;
        }
        const cGrad = tg.createRadialGradient(sx, sy, coreR * 0.06, sx, sy, coreR);
        cGrad.addColorStop(0, `rgba(0, 0, 0, ${strength.toFixed(2)})`);
        cGrad.addColorStop(0.5, `rgba(0, 0, 0, ${(strength * 0.48).toFixed(2)})`);
        cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        tg.fillStyle = cGrad;
        tg.beginPath();
        tg.arc(sx, sy, coreR, 0, Math.PI * 2);
        tg.fill();
      };

      punchCursedCore(state.x, playerLightY, playerOuterR * 0.42, 0.52);
      for (const anchor of roomLighting.staticLightAnchors) {
        punchCursedCore(anchor.x, anchor.y, anchor.radius * 0.48, 0.56);
      }
      tg.restore();

      g.save();
      g.globalCompositeOperation = 'source-over';
      g.drawImage(tintCvs, 0, 0);
      g.restore();
    }

    // PASS 2: Pitch-Black Abyss (92%-97% Dark) with 5-Tile Base Halo (80px) & Steep Falloff
    const overlay = getDarknessOverlayContext();
    const effectiveDarkness = Math.min(
      0.97,
      Math.max(0.92, roomLighting.ambientDarkness)
    );

    if (overlay) {
      const { canvas: darkCvs, ctx: dg } = overlay;
      dg.save();
      dg.globalCompositeOperation = 'source-over';
      dg.globalAlpha = 1.0;
      dg.clearRect(0, 0, SCREEN_W, SCREEN_H);
      // Abyssal indigo-black void outside light pools
      dg.fillStyle = `rgba(3, 3, 9, ${effectiveDarkness.toFixed(3)})`;
      dg.fillRect(0, 0, SCREEN_W, SCREEN_H);

      // Carve steep-falloff light pools: tight personal core -> steep mid-ring drop -> pitch-black abyss
      dg.globalCompositeOperation = 'destination-out';

      const punchMultiStopLightPool = (
        worldX: number,
        worldY: number,
        radiusPx: number,
        strength: number = 1.0
      ) => {
        const sx = worldX - camX;
        const sy = worldY - camY;
        const outerR = Math.max(18, radiusPx);
        const innerR = outerR * 0.08;
        if (
          sx + outerR < 0 ||
          sx - outerR > SCREEN_W ||
          sy + outerR < 0 ||
          sy - outerR > SCREEN_H
        ) {
          return;
        }
        const grad = dg.createRadialGradient(sx, sy, innerR, sx, sy, outerR);
        const s = Math.min(1, strength);
        // 0..24%: tight personal halo core (keeps a subtle 6% shadow veil even at center)
        grad.addColorStop(0, `rgba(0, 0, 0, ${(s * 0.94).toFixed(3)})`);
        grad.addColorStop(0.24, `rgba(0, 0, 0, ${(s * 0.80).toFixed(3)})`);
        // 24..50%: steep falloff across the mid-ring penumbra
        grad.addColorStop(0.50, `rgba(0, 0, 0, ${(s * 0.38).toFixed(3)})`);
        // 50..74%: faint ghostly rim where silhouettes barely emerge from the mire
        grad.addColorStop(0.74, `rgba(0, 0, 0, ${(s * 0.12).toFixed(3)})`);
        // 74..100%: rapid sink into the 92-97% pitch-black abyss
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        dg.fillStyle = grad;
        dg.beginPath();
        dg.arc(sx, sy, outerR, 0, Math.PI * 2);
        dg.fill();
      };

      // Primary player Light stat radial pool + tight forward-facing beam lobe
      punchMultiStopLightPool(state.x, playerLightY, playerOuterR, 1.0);
      punchMultiStopLightPool(
        state.x + dirInfo.dx * (playerOuterR * 0.15),
        playerLightY + dirInfo.dy * (playerOuterR * 0.15),
        playerOuterR * 0.62,
        0.45
      );

      // Static world light anchors (campfires, Poe lanterns, shrines, beacons)
      for (const anchor of roomLighting.staticLightAnchors) {
        const anchorLos = computeRayLightTransmission(
          room,
          state,
          state.x,
          state.y,
          anchor.x,
          anchor.y
        );
        const anchorStrength = 0.64 + 0.24 * anchorLos;
        punchMultiStopLightPool(
          anchor.x,
          anchor.y,
          anchor.radius * 1.05 * radiusBreathMult,
          anchorStrength
        );
      }

      // Dynamic scene lights (projectiles, active spirits, windup glints)
      for (const light of lights) {
        punchMultiStopLightPool(
          light.x,
          light.y,
          light.radius * 0.95,
          Math.min(0.76, 0.30 + light.intensity)
        );
      }

      // PASS 3: Project Oppressive Radial Shadow Cones Behind Bog Trees ('P') and Ruin Walls ('#', 'G', 'M', '%')
      dg.globalCompositeOperation = 'source-over';
      projectSoftOccluderShadowCones(
        dg,
        room,
        state,
        state.x,
        playerLightY,
        playerOuterR,
        camX,
        camY,
        effectiveDarkness * 0.92
      );

      // Re-punch only a tight personal footing core around the pilot after shadow projection
      // so surrounding wall/tree shadow cones creep close while keeping the pilot sprite readable
      dg.globalCompositeOperation = 'destination-out';
      punchMultiStopLightPool(state.x, playerLightY, Math.max(18, playerOuterR * 0.32), 0.84);

      // PASS 4: Heavy Claustrophobic Abyssal Vignette on the Darkness Buffer
      dg.globalCompositeOperation = 'source-over';
      const vigR = Math.hypot(SCREEN_W, SCREEN_H) * (0.50 + flickerWave * 0.25);
      const vigGrad = dg.createRadialGradient(
        SCREEN_W * 0.5,
        SCREEN_H * 0.5,
        SCREEN_W * 0.18,
        SCREEN_W * 0.5,
        SCREEN_H * 0.5,
        vigR
      );
      const cornerAlpha = Math.min(0.92, roomLighting.cornerShadowIntensity * 0.76);
      vigGrad.addColorStop(0, 'rgba(2, 2, 7, 0)');
      vigGrad.addColorStop(0.55, `rgba(3, 3, 10, ${(cornerAlpha * 0.46).toFixed(3)})`);
      vigGrad.addColorStop(1, `rgba(1, 1, 5, ${cornerAlpha.toFixed(3)})`);
      dg.fillStyle = vigGrad;
      dg.fillRect(0, 0, SCREEN_W, SCREEN_H);

      dg.restore();
      g.save();
      g.globalCompositeOperation = 'source-over';
      g.drawImage(darkCvs, 0, 0);
      g.restore();
    }
  }

  // PASS 5: Restrained Flickering Ember & Spirit Bloom (localized so it never washes out the cursed mire)
  if (pp.bloomIntensity > 0 && lights.length > 0) {
    g.save();
    g.translate(-camX, -camY);
    g.globalCompositeOperation = 'lighter';
    for (const light of lights) {
      const sourceLos = room
        ? computeRayLightTransmission(room, state, state.x, state.y, light.x, light.y)
        : 1.0;
      if (sourceLos <= 0.05) continue;
      const alpha = Math.min(0.22, light.intensity * pp.bloomIntensity * 0.58 * sourceLos);
      const grad = g.createRadialGradient(light.x, light.y, 1, light.x, light.y, light.radius);
      grad.addColorStop(0, light.color);
      grad.addColorStop(0.45, light.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.globalAlpha = alpha;
      g.fillStyle = grad;
      g.beginPath();
      g.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  if (state.flickerTimer > 0) {
    state.flickerTimer = Math.max(0, state.flickerTimer - 0.016);
    g.save();
    g.fillStyle = 'rgba(184, 164, 255, 0.09)';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const tearY = Math.floor((state.t * 190) % SCREEN_H);
    g.fillStyle = 'rgba(56, 189, 248, 0.22)';
    g.fillRect(0, tearY, SCREEN_W, 2);
    g.fillStyle = 'rgba(232, 121, 249, 0.22)';
    g.fillRect(0, (tearY + 37) % SCREEN_H, SCREEN_W, 2);
    g.restore();
  }

  if (pp.scanlines) {
    g.save();
    g.fillStyle = 'rgba(0, 0, 0, 0.14)';
    for (let y = 0; y < SCREEN_H; y += 2) {
      g.fillRect(0, y, SCREEN_W, 1);
    }
    g.restore();
  }
}

/**
 * Executes `drawParticlesPass` (draw particles pass) in `effectsRenderer.ts`. Mutates `state: OrionState`.
 */
export function drawParticlesPass(g: CanvasRenderingContext2D, state: OrionState): void {
  for (const p of state.particles) {
    const py = p.y - p.z * Z_SCALE;
    g.fillStyle = p.color;
    g.fillRect(p.x, py, p.size, p.size);
  }
}
