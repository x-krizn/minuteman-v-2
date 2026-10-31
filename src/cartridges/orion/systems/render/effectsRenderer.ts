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

export interface SceneLightEmitter {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

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
    ambientDarkness: custom.ambientDarkness ?? 0.24,
    bloomIntensity: custom.bloomIntensity ?? 0.55,
    weather: custom.weather ?? defaultWeather,
    weatherIntensity: custom.weatherIntensity ?? 0.65,
    liquidReflection: custom.liquidReflection ?? true,
    scanlines: custom.scanlines ?? false,
  };
}

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

export function updateBladeTrails(state: OrionState, dt: number): void {
  if (!state.bladeTrails || state.bladeTrails.length === 0) return;
  for (let i = state.bladeTrails.length - 1; i >= 0; i--) {
    state.bladeTrails[i].life -= dt;
    if (state.bladeTrails[i].life <= 0) {
      state.bladeTrails.splice(i, 1);
    }
  }
}

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
    g.strokeStyle = 'rgba(125, 211, 252, 0.32)';
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
        g.strokeStyle = 'rgba(186, 230, 253, 0.25)';
        g.beginPath();
        g.ellipse(splashX, splashY, splashR, splashR * 0.45, 0, 0, Math.PI * 2);
        g.stroke();
        g.strokeStyle = 'rgba(125, 211, 252, 0.32)';
      }
    }
  } else if (count > 0 && pp.weather === 'ash') {
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 71.19;
      const px = (seed * 31 + state.t * 14 + Math.sin(state.t * 2 + i) * 6) % SCREEN_W;
      const py = (seed * 53 + state.t * 9) % SCREEN_H;
      const isEmber = i % 3 === 0;
      g.fillStyle = isEmber ? 'rgba(251, 146, 60, 0.65)' : 'rgba(148, 163, 184, 0.35)';
      g.fillRect(Math.round(px), Math.round(py), isEmber ? 2 : 1, isEmber ? 2 : 1);
    }
  } else if (count > 0 && pp.weather === 'aether_mist') {
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 59.47;
      const px = (seed * 37 + Math.sin(state.t * 1.4 + i) * 8 + SCREEN_W) % SCREEN_W;
      const py = (SCREEN_H - ((state.t * 10 + seed * 41) % SCREEN_H)) % SCREEN_H;
      const pulse = 0.25 + 0.35 * Math.sin(state.t * 3 + i * 1.7);
      g.fillStyle =
        i % 2 === 0
          ? `rgba(56, 189, 248, ${pulse.toFixed(2)})`
          : `rgba(192, 132, 252, ${pulse.toFixed(2)})`;
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
            ? `rgba(244, 63, 94, ${alpha.toFixed(2)})`
            : `rgba(192, 132, 252, ${alpha.toFixed(2)})`
          : i % 2 === 0
            ? `rgba(34, 211, 238, ${alpha.toFixed(2)})`
            : `rgba(168, 85, 247, ${alpha.toFixed(2)})`;
        const sz = fogMetrics.isSoftCapAbyss ? 2 : 1.5;
        g.fillRect(Math.round(px), Math.round(py), sz, sz);
      }
    }
  }

  // Cursed-Bog Atmospheric Depth Pass:
  // 1) Low-lying drifting bog miasma ribbons across the ground plane
  // 2) Suspended spore motes that glint only when caught inside light pools or penumbra
  if (state.room !== '-4,0') {
    const camX = state.camX || 0;
    const camY = state.camY || 0;
    const activeRoom = room;

    // 1. Low-lying creeping bog miasma wisps (world-space anchored, modulated by light visibility)
    const wispCount = 14;
    for (let i = 0; i < wispCount; i++) {
      const seed = (i + 1) * 83.41;
      const baseWx = camX + ((seed * 53.7 + state.t * (3.2 + (i % 3) * 0.9)) % (SCREEN_W + 64)) - 32;
      const baseWy =
        camY +
        ((seed * 79.3 + Math.sin(state.t * 0.45 + i * 1.7) * 14 + SCREEN_H + 48) %
          (SCREEN_H + 48)) -
        24;
      const vis = getPointVisibilityFactor(baseWx, baseWy, state, activeRoom);
      if (vis <= 0.04) continue;

      const sx = baseWx - camX;
      const sy = baseWy - camY;
      const wispW = 24 + (i % 4) * 9;
      const wispH = 4 + (i % 3) * 2;
      const breathe = 0.65 + 0.35 * Math.sin(state.t * 1.3 + i * 2.1);
      // Miasma is thickest in the cold mid-ring penumbra and softer in the hot core
      const penumbraBoost = vis < 0.7 ? vis * 1.35 : 0.95 - (vis - 0.7) * 0.6;
      const wispAlpha = Math.min(0.28, 0.16 * penumbraBoost * breathe);

      const mGrad = g.createRadialGradient(sx, sy, 1, sx, sy, wispW);
      if (i % 2 === 0) {
        mGrad.addColorStop(0, `rgba(45, 85, 96, ${wispAlpha.toFixed(3)})`);
        mGrad.addColorStop(0.6, `rgba(22, 46, 58, ${(wispAlpha * 0.55).toFixed(3)})`);
      } else {
        mGrad.addColorStop(0, `rgba(51, 65, 85, ${wispAlpha.toFixed(3)})`);
        mGrad.addColorStop(0.6, `rgba(15, 23, 42, ${(wispAlpha * 0.55).toFixed(3)})`);
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
    const sporeCount = 28;
    for (let i = 0; i < sporeCount; i++) {
      const seed = (i + 1) * 113.17;
      const driftX = Math.sin(state.t * 0.85 + seed) * 9 + state.t * 2.1;
      const driftY = Math.cos(state.t * 0.65 + seed * 0.7) * 7 - state.t * 1.6;
      const wx = camX + (((seed * 67.3 + driftX) % SCREEN_W) + SCREEN_W) % SCREEN_W;
      const wy = camY + (((seed * 91.9 + driftY) % SCREEN_H) + SCREEN_H) % SCREEN_H;

      const vis = getPointVisibilityFactor(wx, wy, state, activeRoom);
      if (vis <= 0.08) continue;

      const sx = Math.round(wx - camX);
      const sy = Math.round(wy - camY);
      const twinkle = 0.55 + 0.45 * Math.sin(state.t * 2.6 + seed * 1.9);
      const moteAlpha = Math.min(0.75, vis * 0.72 * twinkle);
      const isWarmCoreMote = vis > 0.62;

      // Soft spore halo inside strong light
      if (i % 3 === 0 && vis > 0.3) {
        g.fillStyle = isWarmCoreMote
          ? `rgba(251, 191, 36, ${(moteAlpha * 0.24).toFixed(3)})`
          : `rgba(94, 234, 212, ${(moteAlpha * 0.2).toFixed(3)})`;
        g.fillRect(sx - 1, sy - 1, 3, 3);
      }

      g.fillStyle = isWarmCoreMote
        ? `rgba(254, 240, 138, ${moteAlpha.toFixed(3)})`
        : i % 2 === 0
          ? `rgba(148, 184, 196, ${moteAlpha.toFixed(3)})`
          : `rgba(94, 234, 212, ${(moteAlpha * 0.85).toFixed(3)})`;
      g.fillRect(sx, sy, 1, 1);
    }
  }

  g.restore();
}

// [ORION-ANCHOR: RENDER-VISION-LIGHTING]
export interface ResolvedRoomLightingState {
  safetyTier: 'sanctuary' | 'trail' | 'hazard' | 'abyss';
  ambientDarkness: number;
  cornerShadowIntensity: number;
  effectiveVisionRadiusPx: number;
  ambientTintColor?: string;
  staticLightAnchors: Array<{ x: number; y: number; radius: number; color: string }>;
}

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

  // Gloomy dying-world baseline: outside light sources, the cursed bog sinks into near-pitch-black void
  const baseDarkness =
    expanseFog && expanseFog.distFromSetPath > 0
      ? Math.min(0.99, 0.94 + expanseFog.fogIntensity * 0.04)
      : Math.max(
          authoredProfile?.ambientDarkness ?? 0,
          safetyTier === 'sanctuary'
            ? 0.88
            : safetyTier === 'trail'
              ? 0.95
              : safetyTier === 'hazard'
                ? 0.97
                : 0.99
        );
  const ambientDarkness = isLoop
    ? Math.min(0.99, Math.max(baseDarkness, 0.96 + loopDepth * 0.01))
    : baseDarkness;

  const baseCornerShadow =
    expanseFog && expanseFog.distFromSetPath > 0
      ? Math.min(0.96, 0.84 + expanseFog.fogIntensity * 0.1)
      : Math.max(
          authoredProfile?.cornerShadowIntensity ?? 0,
          safetyTier === 'sanctuary'
            ? 0.76
            : safetyTier === 'trail'
              ? 0.86
              : safetyTier === 'hazard'
                ? 0.92
                : 0.96
        );
  const cornerShadowIntensity = isLoop
    ? Math.min(0.97, Math.max(baseCornerShadow, 0.88 + loopDepth * 0.03))
    : baseCornerShadow;

  const playerLightTiles = computeEffectivePlayerLightTiles(state);
  const baseLightStatPx = playerLightTiles * 13.6; // 5 Light = 68px radius (136px diameter ≈ half of 256px screen)

  const fogPenaltyPx =
    expanseFog && expanseFog.distFromSetPath > 0
      ? Math.round(expanseFog.fogIntensity * 14) - (expanseFog.isLanternLit ? 14 : 0)
      : isLoop
        ? loopDepth * 5
        : 0;

  const effectiveVisionRadiusPx = Math.max(16, baseLightStatPx - fogPenaltyPx);
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
            staticLightAnchors.push({ x: cx, y: cy, radius: 54, color: '#f59e0b' });
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
            radius: isChunkLanternLit ? 58 : isLit ? 52 : 16,
            color: isChunkLanternLit ? '#22d3ee' : isLit ? '#22d3ee' : '#fbbf24',
          });
        } else if (ch === 'D') {
          staticLightAnchors.push({ x: cx, y: cy, radius: 22, color: '#f43f5e' });
        } else if (ch === 'Q') {
          staticLightAnchors.push({ x: cx, y: cy, radius: 26, color: '#22d3ee' });
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
        radius: 26,
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

  const visionR = lighting.effectiveVisionRadiusPx * 1.15;
  const distToPlayer = Math.hypot(x - state.x, y - state.y);

  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  const dx = x - state.x;
  const dy = y - state.y;
  const dot = distToPlayer > 1 ? (dx * dirInfo.dx + dy * dirInfo.dy) / distToPlayer : 1;
  const directionalBonus = dot > 0.2 ? 1 + (dot - 0.2) * 0.16 : 1.0;
  const effPlayerR = visionR * directionalBonus;

  let bestVis = 0;
  // Multi-stop visibility matching the warm core (0..32%) and dim mid-ring penumbra (32..100%)
  if (distToPlayer <= effPlayerR * 0.32) {
    bestVis = playerLos;
  } else if (distToPlayer <= effPlayerR * 0.68) {
    const t = (distToPlayer - effPlayerR * 0.32) / (effPlayerR * 0.36);
    bestVis = Math.max(0, (1 - t * 0.52) * playerLos);
  } else if (distToPlayer < effPlayerR) {
    const t = (distToPlayer - effPlayerR * 0.68) / (effPlayerR * 0.32);
    bestVis = Math.max(0, 0.48 * (1 - t) * playerLos);
  }

  for (const anchor of lighting.staticLightAnchors) {
    const d = Math.hypot(x - anchor.x, y - anchor.y);
    const ar = anchor.radius * 1.15;
    if (d < ar) {
      const rawAnchorVis =
        d <= ar * 0.35
          ? 1.0
          : d <= ar * 0.72
            ? 1 - ((d - ar * 0.35) / (ar * 0.37)) * 0.5
            : 0.5 * (1 - (d - ar * 0.72) / (ar * 0.28));
      const anchorLos = activeRoom
        ? computeRayLightTransmission(activeRoom, state, anchor.x, anchor.y, x, y)
        : 1.0;
      const aVis = rawAnchorVis * anchorLos * Math.max(0.35, playerLos);
      if (aVis > bestVis) bestVis = aVis;
    }
  }

  for (const p of state.projectiles) {
    if (p.lightRadius && p.lightRadius > 0) {
      const d = Math.hypot(x - p.x, y - p.y);
      const pr = p.lightRadius * 1.35;
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
 * Front faces of trees and walls remain illuminated while casting moody shadow wedges behind them.
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

      if (dist < 6 || dist > lightRadiusPx * 0.96) continue;

      // Trees ('P') have a narrower cylindrical trunk core so light grazes past their mossy edges;
      // solid ruin walls ('#', 'G', 'M', '%') cast a broader shadow wedge.
      const occRadius = ch === 'P' ? 5.2 : 7.4;
      const centerAngle = Math.atan2(dy, dx);
      const baseHalfAngle = Math.min(Math.PI * 0.34, Math.atan2(occRadius, Math.max(6, dist)));

      // Begin the shadow slightly behind the front face of the tree/wall so the player sees the lit obstacle
      const shadowStartDist = dist + (ch === 'P' ? 2.2 : 3.6);
      const shadowEndDist = Math.max(shadowStartDist + 14, lightRadiusPx + 12);
      const distRatio = Math.max(0, Math.min(1, 1 - dist / lightRadiusPx));
      const coneAlpha = maxShadowAlpha * (0.55 + 0.45 * distRatio);

      const startX = lSx + Math.cos(centerAngle) * shadowStartDist;
      const startY = lSy + Math.sin(centerAngle) * shadowStartDist;
      const endX = lSx + Math.cos(centerAngle) * shadowEndDist;
      const endY = lSy + Math.sin(centerAngle) * shadowEndDist;

      const grad = dg.createLinearGradient(startX, startY, endX, endY);
      grad.addColorStop(0, `rgba(2, 5, 11, ${(coneAlpha * 0.25).toFixed(3)})`);
      grad.addColorStop(0.22, `rgba(2, 5, 11, ${(coneAlpha * 0.78).toFixed(3)})`);
      grad.addColorStop(1, `rgba(2, 5, 11, ${coneAlpha.toFixed(3)})`);

      dg.fillStyle = grad;

      // 3-lobe feathered shadow cone (wide soft penumbra -> mid penumbra -> core umbra)
      const lobes: Array<{ spread: number; weight: number }> = [
        { spread: 1.42, weight: 0.28 },
        { spread: 1.14, weight: 0.38 },
        { spread: 0.84, weight: 0.58 },
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
      state.reactor === 'Ichor' ? '#f97316' : state.reactor === 'Mana' ? '#38bdf8' : '#c084fc';
    const boostMult = state.isContinuousBoosting || (state.overdriveTimer || 0) > 0 ? 1.35 : 1.0;
    // Warm tallow/ember inner core light + subtle reactor aura
    lights.push({
      x: state.x,
      y: py,
      radius: 26 * boostMult * radiusBreathMult,
      color: '#fdba74',
      intensity: (0.22 + flickerWave * 0.8) * boostMult,
    });
    lights.push({
      x: state.x,
      y: py,
      radius: 18 * boostMult,
      color: reactorColor,
      intensity: 0.16 * boostMult,
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
          radius: isLoopDensityWarning ? 18 + transInfo.nextDepth * 4 : 24,
          color: isLoopDensityWarning
            ? transInfo.nextDepth >= 3
              ? '#f43f5e'
              : '#c084fc'
            : '#22d3ee',
          intensity: isLoopDensityWarning ? 0.18 + transInfo.nextDepth * 0.05 : 0.26,
        });
      }
    }
  }

  if (room) {
    const { minTx, maxTx, minTy, maxTy } = getVisibleTileBounds(room, camX, camY, 5);
    const pulse = Math.sin(state.t * 3.8) * 1.8 + Math.cos(state.t * 9.3) * 0.7;
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const ch = room[ty]?.[tx];
        if (!ch || ch === '.' || ch === ',' || ch === ':' || ch === '#') continue;
        const cx = tx * TILE_SIZE + 8;
        const cy = ty * TILE_SIZE + 8;

        if (ch === 'L') {
          const isHelped = state.flags?.poe_state === 'helped';
          lights.push({
            x: cx,
            y: cy - 6,
            radius: (isHelped ? 46 : 20) + pulse,
            color: isHelped ? '#38bdf8' : '#fbbf24',
            intensity: isHelped ? 0.38 : 0.24,
          });
        } else if (ch === 'D') {
          lights.push({
            x: cx,
            y: cy - 4,
            radius: 24 + pulse,
            color: '#38bdf8',
            intensity: 0.26,
          });
        } else if (ch === 'A') {
          const effRoom = getEffectiveRoomCoord(state);
          const isCampfireLit =
            effRoom === '0,0' ? Boolean(state.flags?.first_campfire_lit) : true;
          if (isCampfireLit) {
            lights.push({
              x: cx,
              y: cy - 3,
              radius: 52 + pulse * 1.4,
              color: '#f97316',
              intensity: 0.42 + flickerWave * 0.9,
            });
          }
        } else if (ch === 'Q') {
          lights.push({
            x: cx,
            y: cy - 8,
            radius: 28 + pulse * 1.2,
            color: '#22d3ee',
            intensity: 0.32,
          });
        } else if (ch === '~' && (tx + ty) % 2 === 0) {
          lights.push({
            x: cx,
            y: cy,
            radius: 16,
            color: '#5eead4',
            intensity: 0.09,
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
        radius: p.lightRadius,
        color: p.color,
        intensity: 0.25,
      });
    }
  }

  for (const e of state.enemies) {
    if (e.isSubmerged) continue;
    if (e.type === 'bog_poe' || e.type === 'lady_of_the_lake' || e.state === 'windup') {
      lights.push({
        x: e.x,
        y: e.y - e.z * Z_SCALE - 6,
        radius: e.type === 'bog_poe' ? 28 : e.state === 'windup' ? 22 : 20,
        color: e.state === 'windup' ? '#fbbf24' : e.emissiveColor || '#38bdf8',
        intensity: e.type === 'bog_poe' ? 0.34 : 0.22,
      });
    }
  }

  // Cursed-Bog Multi-Depth Lighting, Cold Penumbra Grading, Soft Shadow Cones & Abyssal Void:
  if (room && state.room !== '-4,0') {
    state.exploredTiles = state.exploredTiles || {};
    const roomExplored =
      state.exploredTiles[state.room] || (state.exploredTiles[state.room] = {});
    const { minTx, maxTx, minTy, maxTy } = getVisibleTileBounds(room, camX, camY, 2);

    // Update persistent tile exploration for world map / minimap tracking
    const exploreR = roomLighting.effectiveVisionRadiusPx * 0.92;
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
    const playerOuterR = Math.max(38, roomLighting.effectiveVisionRadiusPx * 1.24 * radiusBreathMult);
    const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;

    // PASS 1: Cold, Desaturated Bog-Mire Color Grading over the Mid-Ring Penumbra & Perimeter
    // Drains saturation and shifts colors outside the immediate warm core toward drowned slate-teal (#334954)
    const tintOverlay = getPenumbraTintContext();
    if (tintOverlay) {
      const { canvas: tintCvs, ctx: tg } = tintOverlay;
      tg.save();
      tg.globalCompositeOperation = 'source-over';
      tg.clearRect(0, 0, SCREEN_W, SCREEN_H);
      tg.fillStyle = 'rgba(42, 62, 74, 0.82)';
      tg.fillRect(0, 0, SCREEN_W, SCREEN_H);

      // Punch out only the innermost warm core (0..38% of light radius) so the mid-ring penumbra
      // retains the cold, desaturated bog tint before fading into the black abyss.
      tg.globalCompositeOperation = 'destination-out';
      const punchWarmCore = (wx: number, wy: number, coreR: number, strength: number) => {
        const sx = wx - camX;
        const sy = wy - camY;
        if (sx + coreR < 0 || sx - coreR > SCREEN_W || sy + coreR < 0 || sy - coreR > SCREEN_H) {
          return;
        }
        const cGrad = tg.createRadialGradient(sx, sy, coreR * 0.08, sx, sy, coreR);
        cGrad.addColorStop(0, `rgba(0, 0, 0, ${strength.toFixed(2)})`);
        cGrad.addColorStop(0.55, `rgba(0, 0, 0, ${(strength * 0.55).toFixed(2)})`);
        cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        tg.fillStyle = cGrad;
        tg.beginPath();
        tg.arc(sx, sy, coreR, 0, Math.PI * 2);
        tg.fill();
      };

      punchWarmCore(state.x, playerLightY, playerOuterR * 0.44, 0.92);
      for (const anchor of roomLighting.staticLightAnchors) {
        punchWarmCore(anchor.x, anchor.y, anchor.radius * 0.52, 0.88);
      }
      tg.restore();

      g.save();
      g.globalCompositeOperation = 'multiply';
      g.drawImage(tintCvs, 0, 0);
      g.restore();
    }

    // PASS 2: Pitch-Black Abyssal Void with Dim Multi-Stop Mid-Ring Penumbra & Soft Tree/Wall Shadow Cones
    const overlay = getDarknessOverlayContext();
    const effectiveDarkness = Math.min(
      0.985,
      Math.max(0.88, roomLighting.ambientDarkness)
    );

    if (overlay) {
      const { canvas: darkCvs, ctx: dg } = overlay;
      dg.save();
      dg.globalCompositeOperation = 'source-over';
      dg.clearRect(0, 0, SCREEN_W, SCREEN_H);
      dg.fillStyle = `rgba(2, 5, 11, ${effectiveDarkness.toFixed(3)})`;
      dg.fillRect(0, 0, SCREEN_W, SCREEN_H);

      // Carve multi-stop light pools: tight clear inner core -> steep drop into dim mid-ring penumbra -> pitch-black abyss
      dg.globalCompositeOperation = 'destination-out';

      const punchMultiStopLightPool = (
        worldX: number,
        worldY: number,
        radiusPx: number,
        strength: number = 1.0
      ) => {
        const sx = worldX - camX;
        const sy = worldY - camY;
        const outerR = Math.max(16, radiusPx);
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
        // 0..22%: warm clear center around pilot
        grad.addColorStop(0, `rgba(0, 0, 0, ${(s * 0.97).toFixed(3)})`);
        grad.addColorStop(0.22, `rgba(0, 0, 0, ${(s * 0.86).toFixed(3)})`);
        // 22..50%: steep transition into oppressive mid-ring penumbra
        grad.addColorStop(0.48, `rgba(0, 0, 0, ${(s * 0.5).toFixed(3)})`);
        // 50..78%: dim ghostly penumbra ring where bog shapes barely emerge
        grad.addColorStop(0.76, `rgba(0, 0, 0, ${(s * 0.22).toFixed(3)})`);
        // 78..100%: seamless fade into pitch-black abyss
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        dg.fillStyle = grad;
        dg.beginPath();
        dg.arc(sx, sy, outerR, 0, Math.PI * 2);
        dg.fill();
      };

      // Primary player Light stat radial pool + subtle forward-facing penumbra lobe
      punchMultiStopLightPool(state.x, playerLightY, playerOuterR, 1.0);
      punchMultiStopLightPool(
        state.x + dirInfo.dx * (playerOuterR * 0.16),
        playerLightY + dirInfo.dy * (playerOuterR * 0.16),
        playerOuterR * 0.72,
        0.52
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
        const anchorStrength = 0.68 + 0.28 * anchorLos;
        punchMultiStopLightPool(
          anchor.x,
          anchor.y,
          anchor.radius * 1.18 * radiusBreathMult,
          anchorStrength
        );
      }

      // Dynamic scene lights (projectiles, active spirits, windup glints)
      for (const light of lights) {
        punchMultiStopLightPool(
          light.x,
          light.y,
          light.radius * 1.15,
          Math.min(0.84, 0.36 + light.intensity)
        );
      }

      // PASS 3: Project Soft Radial Shadow Cones Behind Bog Trees ('P') and Ruin Walls ('#', 'G', 'M', '%')
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
        effectiveDarkness * 0.94
      );

      // PASS 4: Breathing Claustrophobic Perimeter Vignette on the Darkness Buffer
      const vigR = Math.hypot(SCREEN_W, SCREEN_H) * (0.54 + flickerWave * 0.35);
      const vigGrad = dg.createRadialGradient(
        SCREEN_W * 0.5,
        SCREEN_H * 0.5,
        SCREEN_W * 0.22,
        SCREEN_W * 0.5,
        SCREEN_H * 0.5,
        vigR
      );
      const cornerAlpha = Math.min(0.85, roomLighting.cornerShadowIntensity * 0.55);
      vigGrad.addColorStop(0, 'rgba(2, 4, 9, 0)');
      vigGrad.addColorStop(0.65, `rgba(2, 4, 9, ${(cornerAlpha * 0.38).toFixed(3)})`);
      vigGrad.addColorStop(1, `rgba(1, 2, 6, ${cornerAlpha.toFixed(3)})`);
      dg.fillStyle = vigGrad;
      dg.fillRect(0, 0, SCREEN_W, SCREEN_H);

      dg.restore();
      g.drawImage(darkCvs, 0, 0);
    }
  }

  // PASS 5: Subtle Flickering Warmth & Localized Lantern Bloom (drawn after darkness so light sources glow softly without washing out the bog)
  if (pp.bloomIntensity > 0 && lights.length > 0) {
    g.save();
    g.translate(-camX, -camY);
    g.globalCompositeOperation = 'lighter';
    for (const light of lights) {
      const sourceLos = room
        ? computeRayLightTransmission(room, state, state.x, state.y, light.x, light.y)
        : 1.0;
      if (sourceLos <= 0.05) continue;
      const alpha = Math.min(0.32, light.intensity * pp.bloomIntensity * 0.72 * sourceLos);
      const grad = g.createRadialGradient(light.x, light.y, 1, light.x, light.y, light.radius);
      grad.addColorStop(0, light.color);
      grad.addColorStop(0.55, light.color);
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

export function drawParticlesPass(g: CanvasRenderingContext2D, state: OrionState): void {
  for (const p of state.particles) {
    const py = p.y - p.z * Z_SCALE;
    g.fillStyle = p.color;
    g.fillRect(p.x, py, p.size, p.size);
  }
}
