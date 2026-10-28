/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getRoomDimensions, SCREEN_H, SCREEN_W } from '../constants';
import { getBiomeDefinition } from '../database/world';
import { OrionState } from '../types';
import {
  drawBiomeWeatherLayer,
  drawDynamicLightingAndBloomPass,
  drawEnhancedProjectilesAndBladeTrails,
  drawParticlesPass,
} from './render/effectsRenderer';
import { renderDepthSortedEntitiesAndProps } from './render/entityRenderer';
import { renderWorldLayer0And1 } from './render/worldRenderer';
import {
  drawAetherFogWayfindingTells,
  drawCanonicalHud,
  drawOutlinedCanvasText,
} from './renderHudAndFogTells';

export * from './render/spriteAtlasCache';
export * from './render/worldRenderer';
export * from './render/effectsRenderer';
export * from './render/entityRenderer';
export { drawAetherFogWayfindingTells, drawCanonicalHud, drawOutlinedCanvasText };

// ─── 2.5D DEPTH-SORTED SCENE RENDERER (`drawOrionGame`) ──────────────────────

export function drawOrionGame(
  g: CanvasRenderingContext2D,
  rooms: Record<string, string[]>,
  state: OrionState
): void {
  g.fillStyle = '#090d14';
  g.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const room = rooms[state.room];
  const { widthPx, heightPx } = getRoomDimensions(room);
  const activeBiome = getBiomeDefinition(state.biomeId);

  // Compute smooth clamped camera (centered if room dimension is smaller than SCREEN_W / SCREEN_H)
  const targetCamX =
    widthPx <= SCREEN_W
      ? -Math.floor((SCREEN_W - widthPx) / 2)
      : Math.max(0, Math.min(widthPx - SCREEN_W, state.x - SCREEN_W / 2));
  const targetCamY =
    heightPx <= SCREEN_H
      ? -Math.floor((SCREEN_H - heightPx) / 2)
      : Math.max(0, Math.min(heightPx - SCREEN_H, state.y - SCREEN_H / 2));

  if (
    state.camRoomId !== state.room ||
    state.camX === undefined ||
    state.camY === undefined
  ) {
    state.camX = targetCamX;
    state.camY = targetCamY;
    state.camRoomId = state.room;
  } else {
    state.camX += (targetCamX - state.camX) * 0.22;
    state.camY += (targetCamY - state.camY) * 0.22;
  }

  const camX = Math.round(state.camX);
  const camY = Math.round(state.camY);

  g.save();
  g.translate(-camX, -camY);

  // 1 & 2. LAYER 0 & 1: Ground, Water Reflections, Shadows, Landmarks & Walls
  renderWorldLayer0And1(g, room, activeBiome, state);

  // 3. LAYER 2: Collect & Depth-Sort Entities, Pickups, Props & Player Mech
  renderDepthSortedEntitiesAndProps(g, room, activeBiome, state);

  // 4. LAYER 3: Post-Processed Projectiles, Sweeping Blade Trails & Particles
  drawEnhancedProjectilesAndBladeTrails(g, state);
  drawParticlesPass(g, state);

  // End world-space camera translation before screen-space weather, vignette & HUD
  g.restore();

  // 4B. LAYER 3.5: Aether Fog Threshold Environmental Tells & Poe Lantern Resonance
  drawAetherFogWayfindingTells(g, state, room, camX, camY);

  // 5. LAYER 4: Biome Atmospheric Weather Pass
  drawBiomeWeatherLayer(g, activeBiome, state);

  // 6. LAYER 5: Dynamic Light Sources, Radial Bloom, Ambient Vignette & Desync Glitch Pass
  drawDynamicLightingAndBloomPass(g, room, activeBiome, state, camX, camY);

  // 7. LAYER 6: CANONICAL THREE DEFENSE LAYERS HUD
  if (!state.useStandardResolutionHud) {
    drawCanonicalHud(g, state);
  }
}
