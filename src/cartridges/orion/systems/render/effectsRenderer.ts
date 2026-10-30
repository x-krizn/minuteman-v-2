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
  state: OrionState
): void {
  const pp = resolveBiomePostProcess(activeBiome);
  if (pp.weather === 'none' || pp.weatherIntensity <= 0) return;

  g.save();
  const count = Math.round(18 * pp.weatherIntensity);

  if (pp.weather === 'rain') {
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
  } else if (pp.weather === 'ash') {
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 71.19;
      const px = (seed * 31 + state.t * 14 + Math.sin(state.t * 2 + i) * 6) % SCREEN_W;
      const py = (seed * 53 + state.t * 9) % SCREEN_H;
      const isEmber = i % 3 === 0;
      g.fillStyle = isEmber ? 'rgba(251, 146, 60, 0.65)' : 'rgba(148, 163, 184, 0.35)';
      g.fillRect(Math.round(px), Math.round(py), isEmber ? 2 : 1, isEmber ? 2 : 1);
    }
  } else if (pp.weather === 'aether_mist') {
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

  const baseDarkness =
    expanseFog && expanseFog.distFromSetPath > 0
      ? Math.min(0.84, 0.38 + expanseFog.fogIntensity * 0.26)
      : authoredProfile?.ambientDarkness ??
        (safetyTier === 'sanctuary'
          ? 0.2
          : safetyTier === 'trail'
            ? 0.38
            : safetyTier === 'hazard'
              ? 0.56
              : 0.64);
  const ambientDarkness = isLoop
    ? Math.min(0.78, Math.max(baseDarkness, 0.54 + loopDepth * 0.06))
    : baseDarkness;

  const baseCornerShadow =
    expanseFog && expanseFog.distFromSetPath > 0
      ? Math.min(0.92, 0.66 + expanseFog.fogIntensity * 0.16)
      : authoredProfile?.cornerShadowIntensity ??
        (safetyTier === 'sanctuary'
          ? 0.38
          : safetyTier === 'trail'
            ? 0.56
            : safetyTier === 'hazard'
              ? 0.76
              : 0.84);
  const cornerShadowIntensity = isLoop
    ? Math.min(0.9, Math.max(baseCornerShadow, 0.72 + loopDepth * 0.05))
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
      // Target point is inside an opaque wall/tree tile that was reached unobstructed:
      // illuminate the front/lit face of the wall or tree so it is visible, and shade its back edge.
      const tileCx = targetTx * TILE_SIZE + 8;
      const tileCy = targetTy * TILE_SIZE + 8;
      const nx = dx / dist;
      const ny = dy / dist;
      // Projection of (target - tileCenter) along ray direction:
      // negative = front half facing the light source, positive = back half away from light source
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

/**
 * Casts a single ray from `(originX, originY)` along `angleRad` up to `maxRadiusPx`
 * and returns the distance at which it hits a wall (`#`), tree (`P`), or closed gate.
 */
function castVisionRayDistancePx(
  room: string[] | undefined,
  state: OrionState,
  originX: number,
  originY: number,
  angleRad: number,
  maxRadiusPx: number
): number {
  if (!room || room.length === 0) return maxRadiusPx;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const srcTx = Math.floor(originX / TILE_SIZE);
  const srcTy = Math.floor(originY / TILE_SIZE);
  const stepPx = 3;

  for (let d = stepPx; d <= maxRadiusPx; d += stepPx) {
    const sx = originX + cos * d;
    const sy = originY + sin * d;
    const tx = Math.floor(sx / TILE_SIZE);
    const ty = Math.floor(sy / TILE_SIZE);
    if (tx === srcTx && ty === srcTy) continue;
    if (isSampleInsideTileOccluder(room, tx, ty, sx, sy, state)) {
      return Math.min(maxRadiusPx, d + 2);
    }
  }
  return maxRadiusPx;
}

export function getPointVisibilityFactor(
  x: number,
  y: number,
  state: OrionState,
  room?: string[]
): number {
  const lighting = resolveRoomLightingProfile(state, room);
  if (state.room === '-4,0') {
    return 1.0;
  }

  // Player line-of-sight transmission: walls ('#') and trees ('P') block the player's view
  const playerLos = room
    ? computeRayLightTransmission(room, state, state.x, state.y, x, y)
    : 1.0;
  if (playerLos <= 0.01) {
    return 0;
  }

  const visionR = lighting.effectiveVisionRadiusPx;
  const distToPlayer = Math.hypot(x - state.x, y - state.y);

  const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
  const dx = x - state.x;
  const dy = y - state.y;
  const dot = distToPlayer > 1 ? (dx * dirInfo.dx + dy * dirInfo.dy) / distToPlayer : 1;
  const directionalBonus = dot > 0.25 ? 1 + (dot - 0.25) * 0.14 : 1.0;
  const effPlayerR = visionR * directionalBonus;

  let bestVis = 0;
  if (distToPlayer <= effPlayerR * 0.56) {
    bestVis = playerLos;
  } else if (distToPlayer < effPlayerR) {
    const t = (distToPlayer - effPlayerR * 0.56) / (effPlayerR * 0.44);
    bestVis = Math.max(0, (1 - t) * playerLos);
  }

  for (const anchor of lighting.staticLightAnchors) {
    const d = Math.hypot(x - anchor.x, y - anchor.y);
    if (d < anchor.radius) {
      const rawAnchorVis =
        d <= anchor.radius * 0.55
          ? 1.0
          : 1 - (d - anchor.radius * 0.55) / (anchor.radius * 0.45);
      // Light from the static anchor is blocked by walls/trees around the anchor AND requires player view
      const anchorLos = room
        ? computeRayLightTransmission(room, state, anchor.x, anchor.y, x, y)
        : 1.0;
      const aVis = rawAnchorVis * anchorLos * playerLos;
      if (aVis > bestVis) bestVis = aVis;
    }
  }

  for (const p of state.projectiles) {
    if (p.lightRadius && p.lightRadius > 0) {
      const d = Math.hypot(x - p.x, y - p.y);
      const pr = p.lightRadius * 1.4;
      if (d < pr) {
        const rawProjVis = Math.max(0, 1 - d / pr);
        const projLos = room
          ? computeRayLightTransmission(room, state, p.x, p.y, x, y)
          : 1.0;
        const pVis = rawProjVis * projLos * playerLos;
        if (pVis > bestVis) bestVis = pVis;
      }
    }
  }

  return Math.max(0, Math.min(1, bestVis));
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

  if (!state.isFallingIntoPit) {
    const py = state.y - state.z * Z_SCALE - 8;
    const reactorColor =
      state.reactor === 'Ichor' ? '#f97316' : state.reactor === 'Mana' ? '#38bdf8' : '#c084fc';
    const boostMult = state.isContinuousBoosting || (state.overdriveTimer || 0) > 0 ? 1.35 : 1.0;
    lights.push({
      x: state.x,
      y: py,
      radius: 28 * boostMult,
      color: reactorColor,
      intensity: 0.26 * boostMult,
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
    const pulse = Math.sin(state.t * 4) * 2;
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
            intensity: isHelped ? 0.42 : 0.24,
          });
        } else if (ch === 'D') {
          lights.push({
            x: cx,
            y: cy - 4,
            radius: 24 + pulse,
            color: '#38bdf8',
            intensity: 0.28,
          });
        } else if (ch === 'A') {
          const effRoom = getEffectiveRoomCoord(state);
          const isCampfireLit =
            effRoom === '0,0' ? Boolean(state.flags?.first_campfire_lit) : true;
          if (isCampfireLit) {
            lights.push({
              x: cx,
              y: cy - 3,
              radius: 52 + pulse * 1.2,
              color: '#f97316',
              intensity: 0.44,
            });
          }
        } else if (ch === 'Q') {
          lights.push({
            x: cx,
            y: cy - 8,
            radius: 28 + pulse * 1.2,
            color: '#22d3ee',
            intensity: 0.34,
          });
        } else if (ch === '~' && (tx + ty) % 2 === 0) {
          lights.push({
            x: cx,
            y: cy,
            radius: 16,
            color: '#a855f7',
            intensity: 0.12,
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
        radius: e.type === 'bog_poe' ? 28 : e.state === 'windup' ? 24 : 20,
        color: e.state === 'windup' ? '#fbbf24' : e.emissiveColor || '#38bdf8',
        intensity: e.type === 'bog_poe' ? 0.36 : 0.24,
      });
    }
  }

  if (pp.bloomIntensity > 0 && lights.length > 0) {
    g.save();
    g.translate(-camX, -camY);
    g.globalCompositeOperation = 'lighter';
    for (const light of lights) {
      const sourceLos = room
        ? computeRayLightTransmission(room, state, state.x, state.y, light.x, light.y)
        : 1.0;
      if (sourceLos <= 0.05) continue;
      const alpha = Math.min(0.48, light.intensity * pp.bloomIntensity * sourceLos);
      const grad = g.createRadialGradient(light.x, light.y, 1, light.x, light.y, light.radius);
      grad.addColorStop(0, light.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.globalAlpha = alpha;
      g.fillStyle = grad;
      g.beginPath();
      g.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  // Dual-State World Darkness, Dynamic Wall/Tree Shadow Occlusion & Fog of War Pass (4x4 sub-tile precision):
  // - Entire game world is darkened.
  // - Walls ('#'), trees ('P'), desync barriers ('%'), and closed gates ('G'/'M') dynamically block views and light.
  // - At the edge of the vision radius or inside cast shadows:
  //   * Unexplored areas fade to pitch black (#000000).
  //   * Explored areas fade to 50% darkened slate gray (rgba(35, 42, 52, up to 0.90)) where static terrain
  //     remains faintly readable while dynamic enemies are hidden.
  if (room && state.room !== '-4,0') {
    state.exploredTiles = state.exploredTiles || {};
    const roomExplored =
      state.exploredTiles[state.room] || (state.exploredTiles[state.room] = {});
    const { minTx, maxTx, minTy, maxTy } = getVisibleTileBounds(room, camX, camY, 2);

    // Base world darkening veil across the viewport
    g.save();
    g.fillStyle = 'rgba(4, 7, 15, 0.24)';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.restore();

    g.save();
    g.translate(-camX, -camY);

    // Render Room 0,0 Eastern Exit Mist Seal when First Campfire is unlit
    if (!state.flags?.first_campfire_lit && !state.bypassProgressionGates) {
      const isStandalone00 = state.room === '0,0';
      const isExpanse = isChunkedExpanseRoom(state.room);
      if (isStandalone00 || isExpanse) {
        const barrierTx = isStandalone00 ? 15 : 139;
        const barrierMinTy = isStandalone00 ? 4 : 85;
        const barrierMaxTy = isStandalone00 ? 7 : 92;
        if (barrierTx >= minTx && barrierTx <= maxTx) {
          const pulseAlpha = 0.45 + 0.25 * Math.sin(state.t * 4);
          for (let bty = barrierMinTy; bty <= barrierMaxTy; bty++) {
            const bx = barrierTx * TILE_SIZE;
            const by = bty * TILE_SIZE;
            g.fillStyle = `rgba(56, 189, 248, ${(pulseAlpha * 0.45).toFixed(2)})`;
            g.fillRect(bx + 2, by, TILE_SIZE - 4, TILE_SIZE);
            g.fillStyle = `rgba(192, 132, 252, ${pulseAlpha.toFixed(2)})`;
            g.fillRect(bx + 7, by, 2, TILE_SIZE);
          }
        }
      }
    }

    const subSize = 4; // 4x4 sub-cells per 16x16 tile for crisp dynamic wall/tree shadow cones
    const maxPlayerLightReach = roomLighting.effectiveVisionRadiusPx * 1.16 + 14;

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const tileX = tx * TILE_SIZE;
        const tileY = ty * TILE_SIZE;
        const tileCenterX = tileX + 8;
        const tileCenterY = tileY + 8;
        const tileKey = `${tx},${ty}`;

        // Fast check if this tile is well outside all possible light sources
        let nearAnyLight =
          Math.hypot(tileCenterX - state.x, tileCenterY - state.y) <= maxPlayerLightReach;
        if (!nearAnyLight) {
          for (const anchor of roomLighting.staticLightAnchors) {
            if (
              Math.hypot(tileCenterX - anchor.x, tileCenterY - anchor.y) <=
              anchor.radius + 14
            ) {
              nearAnyLight = true;
              break;
            }
          }
        }
        if (!nearAnyLight) {
          for (const p of state.projectiles) {
            if (
              p.lightRadius &&
              Math.hypot(tileCenterX - p.x, tileCenterY - p.y) <= p.lightRadius * 1.4 + 14
            ) {
              nearAnyLight = true;
              break;
            }
          }
        }

        if (!nearAnyLight) {
          const isExplored = Boolean(roomExplored[tileKey]);
          g.fillStyle = isExplored
            ? 'rgba(35, 42, 52, 0.90)'
            : 'rgba(0, 0, 0, 0.98)';
          g.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
          continue;
        }

        let maxSubVis = 0;
        const subVisGrid: number[] = [];

        for (let syOff = 0; syOff < TILE_SIZE; syOff += subSize) {
          for (let sxOff = 0; sxOff < TILE_SIZE; sxOff += subSize) {
            const subCx = tileX + sxOff + subSize * 0.5;
            const subCy = tileY + syOff + subSize * 0.5;
            const vis = getPointVisibilityFactor(subCx, subCy, state, room);
            subVisGrid.push(vis);
            if (vis > maxSubVis) maxSubVis = vis;
          }
        }

        if (maxSubVis >= 0.42) {
          roomExplored[tileKey] = true;
        }
        const isExplored = Boolean(roomExplored[tileKey]);

        let idx = 0;
        for (let syOff = 0; syOff < TILE_SIZE; syOff += subSize) {
          for (let sxOff = 0; sxOff < TILE_SIZE; sxOff += subSize) {
            const sx = tileX + sxOff;
            const sy = tileY + syOff;
            const vis = subVisGrid[idx++];

            if (!isExplored) {
              // Unexplored areas fade to pitch black (#000000) at the edge of vision / behind walls & trees
              const blackAlpha =
                vis <= 0.02 ? 0.98 : Math.min(0.98, Math.max(0, Math.pow(1 - vis, 0.85) * 0.98));
              if (blackAlpha > 0.02) {
                g.fillStyle = `rgba(0, 0, 0, ${blackAlpha.toFixed(2)})`;
                g.fillRect(sx, sy, subSize, subSize);
              }
            } else if (vis < 0.96) {
              // Explored areas outside active vision or occluded behind walls/trees fade to 50% darkened slate gray
              const fade = 1 - vis;
              const grayAlpha = Math.min(0.9, Math.max(0, Math.pow(fade, 0.8) * 0.9));
              if (grayAlpha > 0.02) {
                g.fillStyle = `rgba(35, 42, 52, ${grayAlpha.toFixed(2)})`;
                g.fillRect(sx, sy, subSize, subSize);
              }
            }
          }
        }
      }
    }

    // Dynamic Raycast Vision-Radius Perimeter Polygon for Player and visible Enemies
    // (hugs walls '#' and trees 'P' to show live line-of-sight blocking)
    g.save();
    g.strokeStyle = 'rgba(253, 224, 71, 0.18)';
    g.lineWidth = 1;
    g.setLineDash([3, 3]);
    const rayCount = 64;
    const playerOriginY = state.y - state.z * Z_SCALE - 4;
    g.beginPath();
    for (let i = 0; i <= rayCount; i++) {
      const ang = (i / rayCount) * Math.PI * 2;
      const reach = castVisionRayDistancePx(
        room,
        state,
        state.x,
        state.y,
        ang,
        roomLighting.effectiveVisionRadiusPx
      );
      const rx = state.x + Math.cos(ang) * reach;
      const ry = playerOriginY + Math.sin(ang) * reach;
      if (i === 0) g.moveTo(rx, ry);
      else g.lineTo(rx, ry);
    }
    g.closePath();
    g.stroke();

    for (const e of state.enemies) {
      if (e.isSubmerged || e.faction === 'poe' || e.faction === 'npc') continue;
      const eVis = getPointVisibilityFactor(e.x, e.y, state, room);
      if (eVis < 0.35) continue;
      const enemyVisionPx =
        Math.max(1, e.visionRadiusTiles ?? state.enemyBaseLight ?? 5) * 13.6;
      const enemyOriginY = e.y - e.z * Z_SCALE - 4;
      g.strokeStyle = 'rgba(248, 113, 113, 0.2)';
      g.beginPath();
      const enemyRays = 40;
      for (let i = 0; i <= enemyRays; i++) {
        const ang = (i / enemyRays) * Math.PI * 2;
        const reach = castVisionRayDistancePx(
          room,
          state,
          e.x,
          e.y,
          ang,
          enemyVisionPx
        );
        const rx = e.x + Math.cos(ang) * reach;
        const ry = enemyOriginY + Math.sin(ang) * reach;
        if (i === 0) g.moveTo(rx, ry);
        else g.lineTo(rx, ry);
      }
      g.closePath();
      g.stroke();
    }
    g.setLineDash([]);
    g.restore();

    g.restore();
  }

  const effectiveDarkness = Math.max(pp.ambientDarkness * 0.5, roomLighting.ambientDarkness);
  if (effectiveDarkness > 0.05 && state.room !== '-4,0') {
    g.save();
    const playerScreenX = Math.max(0, Math.min(SCREEN_W, state.x - camX));
    const playerScreenY = Math.max(
      0,
      Math.min(SCREEN_H, state.y - state.z * Z_SCALE - camY - 6)
    );

    let nearSanctuaryBoost = 0;
    for (const anchor of roomLighting.staticLightAnchors) {
      const d = Math.hypot(state.x - anchor.x, state.y - anchor.y);
      if (d < anchor.radius * 1.2) {
        nearSanctuaryBoost = Math.max(
          nearSanctuaryBoost,
          (1 - d / (anchor.radius * 1.2)) * 36
        );
      }
    }

    const innerClearR = Math.max(
      18,
      Math.min(
        SCREEN_W * 0.55,
        roomLighting.effectiveVisionRadiusPx * 0.65 + nearSanctuaryBoost * 0.5
      )
    );
    const outerShroudR = Math.max(
      innerClearR + 22,
      Math.min(
        SCREEN_W * 0.95,
        roomLighting.effectiveVisionRadiusPx * 1.2 + nearSanctuaryBoost
      )
    );

    const vig = g.createRadialGradient(
      playerScreenX,
      playerScreenY,
      innerClearR,
      playerScreenX,
      playerScreenY,
      outerShroudR
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(
      0.62,
      `rgba(15, 23, 42, ${(effectiveDarkness * 0.38).toFixed(2)})`
    );
    vig.addColorStop(1, `rgba(2, 6, 17, ${(effectiveDarkness * 0.62).toFixed(2)})`);
    g.fillStyle = vig;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
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
    if (p.label) {
      g.font = '6px "orion-font", monospace';
      g.fillStyle = '#000000';
      g.fillText(p.label, p.x + 0.5, py + 0.5);
      g.fillStyle = p.color;
      g.fillText(p.label, p.x, py);
    } else {
      g.fillStyle = p.color;
      g.fillRect(p.x, py, p.size, p.size);
    }
  }
}
