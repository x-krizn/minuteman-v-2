/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { COLS, ROWS, SCREEN_H, SCREEN_W, TILE_SIZE, Z_SCALE } from '../constants';
import { BiomeDefinition, BiomeWeatherType, OrionState } from '../types';

/**
 * Multi-Pass 2.5D Post-Processing & Visual Effect Layers for Project Orion
 *
 * Shifts visual complexity from hundreds of hardcoded pixel frames into lightweight engine passes:
 * - Pass 1 (`drawPlanarWaterReflections`): Vertically-flipped, ripple-sheared planar reflections on `~` liquid tiles
 * - Pass 2 (`drawWithProceduralOutline`): 1px pixel-art silhouette outliner for procedural 2.5D entities/props
 * - Pass 3 (`drawEnhancedProjectilesAndBladeTrails`): Sweeping crescent melee blade trails, velocity-tailed glow bolts & hit rings
 * - Pass 4 (`drawBiomeWeatherLayer`): Atmospheric rain streaks + splash ripples, siege ash/embers, or rising æther mist
 * - Pass 5 (`drawDynamicLightingAndBloomPass`): Ambient shadow veil, dynamic radial light cutouts, additive bloom halos & desync glitch
 */

export interface SceneLightEmitter {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

/**
 * Resolve default post-processing settings for a biome if `biome.postProcess` is not explicitly set.
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
    ambientDarkness: custom.ambientDarkness ?? 0.24,
    bloomIntensity: custom.bloomIntensity ?? 0.55,
    weather: custom.weather ?? defaultWeather,
    weatherIntensity: custom.weatherIntensity ?? 0.65,
    liquidReflection: custom.liquidReflection ?? true,
    scanlines: custom.scanlines ?? false,
  };
}

/**
 * PASS 1: Planar Liquid / Corrosive Aether (`~`) Reflections
 * Renders vertically flipped, ripple-sheared reflections of north-bordering pillars (`P`),
 * lanterns (`L`), walls (`#`), and nearby entities (Player & Enemies) onto `~` liquid tiles.
 */
export function drawPlanarWaterReflections(
  g: CanvasRenderingContext2D,
  room: string[] | undefined,
  activeBiome: BiomeDefinition,
  state: OrionState
): void {
  if (!room) return;
  const pp = resolveBiomePostProcess(activeBiome);
  if (!pp.liquidReflection) return;

  g.save();

  // 1. Clip all reflections strictly to Corrosive Aether / Bog Water ('~') cells
  g.beginPath();
  let hasWater = false;
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (room[ty]?.[tx] === '~') {
        g.rect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        hasWater = true;
      }
    }
  }

  if (!hasWater) {
    g.restore();
    return;
  }

  g.clip();

  // Draw north-adjacent prop/pillar/lantern reflections into the water
  for (let ty = 1; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (room[ty]?.[tx] !== '~') continue;
      const northChar = room[ty - 1]?.[tx];
      const sx = tx * TILE_SIZE;
      const sy = ty * TILE_SIZE;
      const rippleShift = Math.sin(state.t * 4.5 + tx * 1.3 + ty * 0.9) * 1.5;

      if (northChar === 'P' || northChar === '#') {
        g.fillStyle = 'rgba(200, 185, 128, 0.22)';
        g.fillRect(sx + 3 + rippleShift, sy, 10, 8);
        g.fillStyle = 'rgba(255, 255, 255, 0.12)';
        g.fillRect(sx + 4 - rippleShift, sy + 3, 8, 1);
      } else if (northChar === 'L') {
        const lanternColor =
          state.flags?.poe_state === 'helped'
            ? 'rgba(56, 189, 248, 0.38)'
            : 'rgba(251, 191, 36, 0.35)';
        g.fillStyle = lanternColor;
        g.beginPath();
        g.ellipse(sx + 8 + rippleShift, sy + 5, 4, 6, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  // 2. Reflected Enemies standing in or immediately above water
  for (const e of state.enemies) {
    if (e.isSubmerged) continue;
    const ripple = Math.sin(state.t * 5 + e.x * 0.2) * 1.5;
    const ry = e.y + 2 + e.z * Z_SCALE * 0.5;
    g.fillStyle = e.emissiveColor || '#94a3b8';
    g.globalAlpha = 0.24;
    g.fillRect(e.x - 4 + ripple, ry, 8, 9);
    g.fillRect(e.x - 5 - ripple * 0.6, ry + 3, 10, 2);
  }

  // 3. Reflected Player Mech standing in or immediately above water
  if (!state.isFallingIntoPit) {
    const ripple = Math.sin(state.t * 5.5 + state.x * 0.25) * 1.5;
    const ry = state.y + 2 + state.z * Z_SCALE * 0.5;
    const reactorColor =
      state.reactor === 'Ichor' ? '#ea580c' : state.reactor === 'Mana' ? '#38bdf8' : '#a855f7';

    g.globalAlpha = 0.26;
    g.fillStyle = '#3b82f6';
    g.fillRect(state.x - 4 + ripple, ry, 8, 9);
    g.fillStyle = reactorColor;
    g.fillRect(state.x - 2 - ripple * 0.5, ry + 3, 4, 3);
  }

  // 4. Specular liquid surface shimmer lines
  g.globalAlpha = 0.28;
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (room[ty]?.[tx] !== '~') continue;
      const sx = tx * TILE_SIZE;
      const sy = ty * TILE_SIZE;
      const wave = Math.sin(state.t * 3 + tx * 1.7 + ty * 2.1) * 2.5;
      g.fillStyle = activeBiome.tileAssets.waterRippleColor || '#a855f7';
      g.fillRect(Math.round(sx + 3 + wave), Math.round(sy + 4), 5, 1);
      g.fillRect(Math.round(sx + 8 - wave), Math.round(sy + 11), 4, 1);
    }
  }

  g.restore();
}

/**
 * PASS 3: Sweeping Melee Blade Swing Trails & Post-Processed Glow Projectiles
 */
export function drawEnhancedProjectilesAndBladeTrails(
  g: CanvasRenderingContext2D,
  state: OrionState
): void {
  // 1. Sweeping Crescent Blade Swing Trails (e.g. Khopesh Sickle Combo & Lunge)
  if (state.bladeTrails && state.bladeTrails.length > 0) {
    g.save();
    for (const trail of state.bladeTrails) {
      const progress = 1 - Math.max(0, trail.life / Math.max(0.01, trail.maxLife));
      const alpha = Math.max(0, 1 - progress * progress);
      const cy = trail.y - trail.z * Z_SCALE - 6;
      const startAngle = trail.angle - trail.arcSpan * 0.5;
      const endAngle = trail.angle + trail.arcSpan * 0.5;

      // Outer additive bloom slash arc
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = alpha * 0.55;
      g.strokeStyle = trail.color;
      g.lineWidth = 6 * (1 - progress * 0.4);
      g.lineCap = 'round';
      g.beginPath();
      g.arc(trail.x, cy, trail.radius + progress * 2, startAngle, endAngle);
      g.stroke();

      // Inner white-hot leading razor edge
      g.globalAlpha = alpha * 0.9;
      g.strokeStyle = trail.coreColor || '#ffffff';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(trail.x, cy, trail.radius + 1 + progress * 2, startAngle + progress * 0.25, endAngle);
      g.stroke();
      g.restore();
    }
    g.restore();
  }

  // 2. Post-Processed Projectiles (Velocity Tail + Radial Bloom Halo + Core)
  g.save();
  for (const p of state.projectiles) {
    const py = p.y - p.z * Z_SCALE;
    const speed = Math.hypot(p.vx, p.vy) || 1;
    const nx = p.vx / speed;
    const ny = p.vy / speed;
    const tailLen = Math.min(12, Math.max(4, speed * 0.055));

    // Directional velocity tail
    g.strokeStyle = p.trailColor || p.color;
    g.globalAlpha = 0.65;
    g.lineWidth = Math.max(1.5, p.radius * 1.1);
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(p.x, py);
    g.lineTo(p.x - nx * tailLen, py - ny * tailLen);
    g.stroke();

    // Additive outer bloom halo
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.42;
    g.fillStyle = p.trailColor || p.color;
    g.beginPath();
    g.arc(p.x, py, p.radius * 2.1, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // Bright projectile core
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
 * Step active blade trail lifetimes each frame.
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
 * PASS 4: Biome Atmospheric Weather Layer (`rain` | `ash` | `aether_mist`)
 */
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
    // Slanted toxic bog rain streaks + ground splash ripples
    g.strokeStyle = 'rgba(125, 211, 252, 0.32)';
    g.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 97.31;
      const cycle = (state.t * 1.8 + seed) % 1;
      const rx = ((seed * 43.7 + cycle * 28) % (SCREEN_W + 20)) - 10;
      const ry = (cycle * (SCREEN_H + 16)) - 8;

      g.beginPath();
      g.moveTo(rx, ry);
      g.lineTo(rx - 3, ry + 7);
      g.stroke();

      // Ground splash ring when raindrop nears end of cycle
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
    // Drifting glowing siege cinders & ash motes
    for (let i = 0; i < count; i++) {
      const seed = (i + 1) * 71.19;
      const px = (seed * 31 + state.t * 14 + Math.sin(state.t * 2 + i) * 6) % SCREEN_W;
      const py = (seed * 53 + state.t * 9) % SCREEN_H;
      const isEmber = i % 3 === 0;
      g.fillStyle = isEmber ? 'rgba(251, 146, 60, 0.65)' : 'rgba(148, 163, 184, 0.35)';
      g.fillRect(Math.round(px), Math.round(py), isEmber ? 2 : 1, isEmber ? 2 : 1);
    }
  } else if (pp.weather === 'aether_mist') {
    // Rising bioluminescent æther spores & soft mist bands
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

  g.restore();
}

/**
 * PASS 5: Dynamic Light Sources, Radial Bloom, Ambient Vignette & Desync Glitch Pass
 */
export function drawDynamicLightingAndBloomPass(
  g: CanvasRenderingContext2D,
  room: string[] | undefined,
  activeBiome: BiomeDefinition,
  state: OrionState
): void {
  const pp = resolveBiomePostProcess(activeBiome);
  const lights: SceneLightEmitter[] = [];

  // 1. Player Mech Reactor Core & Optics Light Source
  if (!state.isFallingIntoPit) {
    const py = state.y - state.z * Z_SCALE - 8;
    const reactorColor =
      state.reactor === 'Ichor' ? '#f97316' : state.reactor === 'Mana' ? '#38bdf8' : '#c084fc';
    const boostMult = state.isContinuousBoosting || (state.overdriveTimer || 0) > 0 ? 1.35 : 1.0;
    lights.push({
      x: state.x,
      y: py,
      radius: 26 * boostMult,
      color: reactorColor,
      intensity: 0.26 * boostMult,
    });
  }

  // 2. World Tile Light Sources (Poe Lantern 'L', Drop-Pod 'D', Waystation 'A', Waygate 'Q', Corrosive Aether '~')
  if (room) {
    const pulse = Math.sin(state.t * 4) * 2;
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const ch = room[ty]?.[tx];
        if (!ch || ch === '.' || ch === ',' || ch === ':' || ch === '#') continue;
        const cx = tx * TILE_SIZE + 8;
        const cy = ty * TILE_SIZE + 8;

        if (ch === 'L') {
          const isHelped = state.flags?.poe_state === 'helped';
          lights.push({
            x: cx,
            y: cy - 6,
            radius: (isHelped ? 34 : 22) + pulse,
            color: isHelped ? '#38bdf8' : '#fbbf24',
            intensity: isHelped ? 0.36 : 0.26,
          });
        } else if (ch === 'D' || ch === 'A') {
          lights.push({
            x: cx,
            y: cy - 4,
            radius: 28 + pulse,
            color: '#38bdf8',
            intensity: 0.28,
          });
        } else if (ch === 'Q') {
          lights.push({
            x: cx,
            y: cy - 8,
            radius: 38 + pulse * 1.5,
            color: '#22d3ee',
            intensity: 0.38,
          });
        } else if (ch === '~' && (tx + ty) % 2 === 0) {
          // Bioluminescent corrosive aether pool glow
          lights.push({
            x: cx,
            y: cy,
            radius: 18,
            color: '#a855f7',
            intensity: 0.14,
          });
        }
      }
    }
  }

  // 3. Active Projectiles & Glowing Entities (Poe Spirit, Bosses)
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
        radius: e.state === 'windup' ? 24 : 20,
        color: e.state === 'windup' ? '#fbbf24' : e.emissiveColor || '#38bdf8',
        intensity: 0.24,
      });
    }
  }

  // 4. Render Additive Radial Bloom Halos ('lighter')
  if (pp.bloomIntensity > 0 && lights.length > 0) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const light of lights) {
      const alpha = Math.min(0.45, light.intensity * pp.bloomIntensity);
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

  // 5. Subtle Atmospheric Edge Vignette (preserves crystal-clear center tile visibility)
  if (pp.ambientDarkness > 0) {
    g.save();
    const vig = g.createRadialGradient(
      SCREEN_W * 0.5,
      SCREEN_H * 0.5,
      SCREEN_W * 0.36,
      SCREEN_W * 0.5,
      SCREEN_H * 0.5,
      SCREEN_W * 0.72
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, `rgba(6, 10, 18, ${pp.ambientDarkness.toFixed(2)})`);
    g.fillStyle = vig;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.restore();
  }

  // 6. Desynchronization Chromatic Glitch Pass
  if (state.flickerTimer > 0) {
    state.flickerTimer = Math.max(0, state.flickerTimer - 0.016);
    g.save();
    g.fillStyle = 'rgba(184, 164, 255, 0.09)';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    // Horizontal desync tear bars
    const tearY = Math.floor((state.t * 190) % SCREEN_H);
    g.fillStyle = 'rgba(56, 189, 248, 0.22)';
    g.fillRect(0, tearY, SCREEN_W, 2);
    g.fillStyle = 'rgba(232, 121, 249, 0.22)';
    g.fillRect(0, (tearY + 37) % SCREEN_H, SCREEN_W, 2);
    g.restore();
  }

  // 7. Optional Per-Biome CRT Scanlines
  if (pp.scanlines) {
    g.save();
    g.fillStyle = 'rgba(0, 0, 0, 0.14)';
    for (let y = 0; y < SCREEN_H; y += 2) {
      g.fillRect(0, y, SCREEN_W, 1);
    }
    g.restore();
  }
}
