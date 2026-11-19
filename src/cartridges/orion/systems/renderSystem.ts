/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getChunkCoordsFromPx,
  getRoomDimensions,
  isChunkedExpanseRoom,
  makeChunkPersistenceKey,
  SCREEN_H,
  SCREEN_W,
} from '../constants';
import { getBiomeDefinition } from '../database/world';
import { OrionState } from '../types';
import { getOrionGraphicsSettings } from './graphicsSettingsStore';
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
import { updateChunkedRoomStreaming } from './worldSystem';

export * from './render/spriteAtlasCache';
export * from './render/worldRenderer';
export * from './render/effectsRenderer';
export * from './render/entityRenderer';
export { drawAetherFogWayfindingTells, drawCanonicalHud, drawOutlinedCanvasText };

// ─── 2.5D DEPTH-SORTED SCENE RENDERER (`drawOrionGame`) ──────────────────────

/**
 * Top-level per-frame canvas render orchestrator for Project Orion (`160x144` `px` viewport), drawing terrain, 2.5D entities, lighting/occlusion, weather, and optional pixel canvas HUD.
 */
export function drawOrionGame(
  g: CanvasRenderingContext2D,
  rooms: Record<string, string[]>,
  state: OrionState
): void {
  g.fillStyle = '#030309';
  g.fillRect(0, 0, SCREEN_W, SCREEN_H);

  if (isChunkedExpanseRoom(state.room)) {
    const { cx, cy } = getChunkCoordsFromPx(state.x, state.y);
    const chunkKey = makeChunkPersistenceKey(state.room, cx, cy);
    if (!state.generatedChunks?.[chunkKey] || !rooms[state.room]) {
      updateChunkedRoomStreaming(rooms, state, true);
    }
  }

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

  const gfx = getOrionGraphicsSettings();
  let shakeOffsetX = 0;
  let shakeOffsetY = 0;
  if (
    gfx.screenShakeScale > 0 &&
    ((state.hitstopTimer || 0) > 0 || (state.flickerTimer || 0) > 0.15)
  ) {
    const amp = ((state.hitstopTimer || 0) > 0 ? 1.8 : 1.1) * gfx.screenShakeScale;
    shakeOffsetX = Math.round(Math.sin((state.t || 0) * 140) * amp);
    shakeOffsetY = Math.round(Math.cos((state.t || 0) * 115) * amp);
  }

  const camX = Math.round(state.camX) + shakeOffsetX;
  const camY = Math.round(state.camY) + shakeOffsetY;

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

  // 5. LAYER 4: Biome Atmospheric Weather & Cursed-Bog Miasma/Spore Pass
  drawBiomeWeatherLayer(g, activeBiome, state, room);

  // 6. LAYER 5: Dynamic Light Sources, Radial Bloom, Ambient Vignette & Desync Glitch Pass
  drawDynamicLightingAndBloomPass(g, room, activeBiome, state, camX, camY);

  // 7. LAYER 6: Campfire Rest Fade-Out / Full-Black Midpoint / Fade-In Immersion Curtain
  drawCampfireRestFadeOverlay(g, state, camX, camY);
}

/**
 * Draws the Campfire Rest fade-to-black and fade-in immersion curtain over the `160×144` viewport.
 */
export function drawCampfireRestFadeOverlay(
  g: CanvasRenderingContext2D,
  state: OrionState,
  camX: number,
  camY: number
): void {
  const seq = state.restSequence;
  if (!seq) return;

  const progress = Math.max(0, Math.min(1, seq.elapsed / Math.max(0.1, seq.duration)));
  let curtainAlpha = 0;
  if (progress < 0.42) {
    curtainAlpha = progress / 0.42;
  } else if (progress <= 0.62) {
    curtainAlpha = 1.0;
  } else {
    curtainAlpha = Math.max(0, 1 - (progress - 0.62) / 0.38);
  }

  if (curtainAlpha <= 0.01) return;

  g.save();
  g.fillStyle = `rgba(3, 3, 9, ${curtainAlpha.toFixed(3)})`;
  g.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // Soft dying/rekindling ember glow around the hearth during the fade transition
  const emberVisibility = Math.max(0, 1 - Math.abs(progress - 0.5) * 1.4) * (1 - curtainAlpha * 0.72);
  if (emberVisibility > 0.02) {
    const sx = Math.max(16, Math.min(SCREEN_W - 16, seq.campfireX - camX));
    const sy = Math.max(16, Math.min(SCREEN_H - 16, seq.campfireY - camY));
    const grad = g.createRadialGradient(sx, sy, 2, sx, sy, 36);
    grad.addColorStop(0, `rgba(245, 158, 11, ${(emberVisibility * 0.45).toFixed(3)})`);
    grad.addColorStop(0.5, `rgba(217, 119, 6, ${(emberVisibility * 0.2).toFixed(3)})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }

  // Subtle hearth divider rule & status cue during the full-black midpoint hold
  if (curtainAlpha > 0.72) {
    const textAlpha = Math.min(1, (curtainAlpha - 0.72) / 0.28);
    g.globalAlpha = textAlpha * 0.9;
    g.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(28, Math.floor(SCREEN_H * 0.5) + 6);
    g.lineTo(SCREEN_W - 28, Math.floor(SCREEN_H * 0.5) + 6);
    g.stroke();

    drawOutlinedCanvasText(
      g,
      seq.midpointTriggered ? 'HEARTH RESTORED' : 'RESTING BY THE FIRE',
      Math.floor(SCREEN_W * 0.5),
      Math.floor(SCREEN_H * 0.5) - 2,
      '#fde68a',
      'center'
    );
  }

  g.restore();
}
