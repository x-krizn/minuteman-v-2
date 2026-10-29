/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  COLOR_ARMOR,
  COLOR_CRITICAL,
  COLOR_FRAME,
  COLOR_HEAT,
  COLOR_SHIELD,
  computeChunkFogMetrics,
  getDoorwayAetherTransitionInfo,
  getRoomDoorwayCenterPx,
  hasPoeLanternGuidance,
  isChunkedExpanseRoom,
  SCREEN_H,
  SCREEN_W,
  Z_SCALE,
} from '../constants';
import { AetherCardinalDir, OrionState } from '../types';

export function drawAetherFogWayfindingTells(
  g: CanvasRenderingContext2D,
  state: OrionState,
  room: string[] | undefined,
  camX: number = 0,
  camY: number = 0
): void {
  // Off-Path Expanse Fog peripheral veil (scales with distance from Set-Path Spine + clvl)
  if (isChunkedExpanseRoom(state.room)) {
    const fogMetrics = computeChunkFogMetrics(state);
    if (fogMetrics.distFromSetPath > 0 && fogMetrics.fogIntensity > 0) {
      g.save();
      const intensityClamped = Math.min(1.6, fogMetrics.fogIntensity);
      const baseMist = Math.min(0.46, 0.1 + intensityClamped * 0.2);
      const mistPulse =
        baseMist + 0.05 * Math.sin(state.t * (1.8 + intensityClamped * 1.6));
      const innerR = SCREEN_W * Math.max(0.11, 0.3 - intensityClamped * 0.11);
      const mistGrad = g.createRadialGradient(
        SCREEN_W * 0.5,
        SCREEN_H * 0.5,
        innerR,
        SCREEN_W * 0.5,
        SCREEN_H * 0.5,
        SCREEN_W * 0.68
      );
      mistGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      const veilRgb = fogMetrics.isSoftCapAbyss
        ? '244, 63, 94'
        : fogMetrics.distFromSetPath >= 2
          ? '192, 132, 252'
          : '34, 211, 238';
      mistGrad.addColorStop(1, `rgba(${veilRgb}, ${mistPulse.toFixed(2)})`);
      g.fillStyle = mistGrad;
      g.fillRect(0, 0, SCREEN_W, SCREEN_H);
      g.restore();
    }
    return;
  }

  const activeNode = state.fogGraph?.nodes?.[state.room];
  if (!activeNode) return;

  const hasLantern = hasPoeLanternGuidance(state);

  g.save();

  // If inside an Æther Loop node, render a peripheral Æther mist veil scaled by depth (1 .. clvl+1)
  if (activeNode.nodeType === 'loop') {
    const maxDepth = Math.max(
      2,
      activeNode.loopMaxDepth || state.fogGraph?.loopMaxDepth || (state.level || 1) + 1
    );
    const loopDepth = Math.max(
      1,
      Math.min(maxDepth, state.fogGraph?.loopDepth || activeNode.loopDepth || 1)
    );
    const depthRatio = loopDepth / maxDepth;
    const baseMist = 0.12 + depthRatio * 0.24;
    const mistPulse = baseMist + 0.05 * Math.sin(state.t * (2.0 + depthRatio * 1.8));
    const innerR = SCREEN_W * Math.max(0.12, 0.28 - depthRatio * 0.14);
    const mistGrad = g.createRadialGradient(
      SCREEN_W * 0.5,
      SCREEN_H * 0.5,
      innerR,
      SCREEN_W * 0.5,
      SCREEN_H * 0.5,
      SCREEN_W * 0.68
    );
    mistGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    const veilRgb =
      loopDepth >= maxDepth
        ? '244, 63, 94'
        : loopDepth >= 2
          ? '192, 132, 252'
          : '34, 211, 238';
    mistGrad.addColorStop(1, `rgba(${veilRgb}, ${mistPulse.toFixed(2)})`);
    g.fillStyle = mistGrad;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }

  // Doorway Path Effect Rules:
  // 1. Inside an Æther Loop: path effect is applied ONLY to doorways where `increasesDensity` is true
  //    as a warning of increased Æther density in the next room/depth.
  // 2. Outside an Æther Loop (Safe room): the Poe Lamp reveals Æther Loop entrances (`isLoopEntrance`),
  //    but NEVER directs the player to any goals (`trueExitDir` is never highlighted).
  if (room) {
    const cardinalDirs: AetherCardinalDir[] = ['N', 'S', 'E', 'W'];
    const maxDepth = Math.max(
      2,
      activeNode.loopMaxDepth || state.fogGraph?.loopMaxDepth || (state.level || 1) + 1
    );
    g.save();
    g.translate(-camX, -camY);

    for (const dir of cardinalDirs) {
      const transInfo = getDoorwayAetherTransitionInfo(state, dir);
      const isLoopDensityWarning =
        activeNode.nodeType === 'loop' && transInfo.increasesDensity;
      const isPoeLoopEntranceReveal =
        activeNode.nodeType !== 'loop' && transInfo.isLoopEntrance && hasLantern;

      if (!isLoopDensityWarning && !isPoeLoopEntranceReveal) {
        continue;
      }

      const doorPos = getRoomDoorwayCenterPx(room, dir);
      const doorX = doorPos.x;
      const doorY = doorPos.y;
      const flowDx = dir === 'E' ? 1 : dir === 'W' ? -1 : 0;
      const flowDy = dir === 'S' ? 1 : dir === 'N' ? -1 : 0;
      const perpDx = -flowDy;
      const perpDy = flowDx;

      if (isLoopDensityWarning) {
        const nextDepth = transInfo.nextDepth;
        const moteCount = Math.min(11, 3 + nextDepth * 2);
        const rgb = nextDepth >= maxDepth ? '244, 63, 94' : '192, 132, 252';
        for (let i = 0; i < moteCount; i++) {
          const phase = (state.t * (0.75 + nextDepth * 0.16) + i * 0.19) % 1;
          const spread =
            ((i % 5) - 2) * 4.2 + Math.sin(state.t * (2.6 + nextDepth * 0.4) + i) * 2.2;
          const distFromDoor = (1 - phase) * Math.min(28, 12 + nextDepth * 3);
          const mx = doorX - flowDx * distFromDoor + perpDx * spread;
          const my = doorY - flowDy * distFromDoor + perpDy * spread;
          const alpha = Math.sin(phase * Math.PI) * Math.min(0.85, 0.38 + nextDepth * 0.1);

          g.fillStyle = `rgba(${rgb}, ${alpha.toFixed(2)})`;
          g.fillRect(
            Math.round(mx),
            Math.round(my),
            nextDepth >= maxDepth ? 2 : 1.5,
            nextDepth >= maxDepth ? 2 : 1.5
          );
        }
      } else if (isPoeLoopEntranceReveal) {
        // Poe Lamp reveals Æther Loop entrance in a Safe room (cyan-violet lantern resonance)
        const moteCount = 5;
        for (let i = 0; i < moteCount; i++) {
          const phase = (state.t * 0.85 + i * 0.21) % 1;
          const spread = ((i % 5) - 2) * 4.0 + Math.sin(state.t * 3 + i) * 1.8;
          const distFromDoor = (1 - phase) * 15;
          const mx = doorX - flowDx * distFromDoor + perpDx * spread;
          const my = doorY - flowDy * distFromDoor + perpDy * spread;
          const alpha = Math.sin(phase * Math.PI) * 0.52;

          g.fillStyle =
            i % 2 === 0
              ? `rgba(34, 211, 238, ${alpha.toFixed(2)})`
              : `rgba(192, 132, 252, ${alpha.toFixed(2)})`;
          g.fillRect(Math.round(mx), Math.round(my), 1.5, 1.5);
        }
      }
    }

    g.restore();
  }

  g.restore();
}

export function drawOutlinedCanvasText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillColor: string,
  outlineColor: string = '#020617'
): void {
  g.fillStyle = outlineColor;
  g.fillText(text, x - 1, y);
  g.fillText(text, x + 1, y);
  g.fillText(text, x, y - 1);
  g.fillText(text, x, y + 1);
  g.fillStyle = fillColor;
  g.fillText(text, x, y);
}

export function drawCanonicalHud(g: CanvasRenderingContext2D, state: OrionState): void {
  const barW = 40;
  const barH = 2;

  const shieldPct =
    state.shields.maxCapacity > 0
      ? Math.max(0, state.shields.capacity / state.shields.maxCapacity)
      : 0;
  g.strokeStyle = '#020617';
  g.lineWidth = 1;
  g.strokeRect(3.5, 3.5, barW + 1, barH + 1);
  g.fillStyle = state.shields.overloaded ? '#ef4444' : COLOR_SHIELD;
  g.fillRect(4, 4, barW * (state.shields.overloaded ? 1 : shieldPct), barH);

  const armorPct = Math.max(0, state.armor.durability / state.armor.maxDurability);
  g.strokeRect(3.5, 7.5, barW + 1, barH + 1);
  g.fillStyle = COLOR_ARMOR;
  g.fillRect(4, 8, barW * armorPct, barH);

  const framePct = Math.max(0, state.frame.integrity / state.frame.maxIntegrity);
  const isCritical = state.frame.state === 'Critical';
  g.strokeRect(3.5, 11.5, barW + 1, barH + 1);
  g.fillStyle = isCritical ? COLOR_CRITICAL : COLOR_FRAME;
  g.fillRect(4, 12, barW * framePct, barH);

  const heatPct = Math.max(0, state.heat / state.maxHeat);
  if (heatPct > 0) {
    g.fillStyle = COLOR_HEAT;
    g.fillRect(4, 16, barW * heatPct, 1);
  }

  g.font = '6px "orion-font", monospace';
  const activeWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const isKhopesh = activeWeaponId === 'khopesh';

  g.textAlign = 'right';
  drawOutlinedCanvasText(g, `${state.salvageScrap}`, SCREEN_W - 4, 9, '#ffd27d');
  if (state.isReloading) {
    drawOutlinedCanvasText(
      g,
      `${state.reloadTimer.toFixed(1)}s`,
      SCREEN_W - 4,
      16,
      '#f59e0b'
    );
  } else {
    drawOutlinedCanvasText(
      g,
      `${state.ammo}/${state.maxAmmo}`,
      SCREEN_W - 4,
      16,
      isKhopesh ? '#e879f9' : '#77c7ff'
    );
  }

  // 5 Skill Icon slots along bottom center (transparent with cooldown overlay)
  const slotSize = 9;
  const gap = 3;
  const totalW = 5 * slotSize + 4 * gap;
  const startX = Math.floor((SCREEN_W - totalW) / 2);
  const slotY = SCREEN_H - slotSize - 3;
  const cds = [
    state.isReloading ? state.reloadTimer : 0,
    Math.max(0, state.skillCooldowns?.[1] || 0, state.actionCooldowns?.['weapon_skill_1'] || 0),
    Math.max(0, state.skillCooldowns?.[2] || 0, state.actionCooldowns?.['weapon_skill_2'] || 0),
    Math.max(0, state.skillCooldowns?.[3] || 0, state.actionCooldowns?.['weapon_skill_3'] || 0),
    Math.max(0, state.skillCooldowns?.[4] || 0, state.actionCooldowns?.['weapon_skill_4'] || 0),
  ];
  const slotColors = ['#38bdf8', '#fbbf24', '#c084fc', '#4ade80', '#f472b6'];

  g.textAlign = 'center';
  for (let i = 0; i < 5; i++) {
    const sx = startX + i * (slotSize + gap);
    const cd = cds[i];
    g.strokeStyle = cd > 0 ? '#475569' : slotColors[i];
    g.strokeRect(sx + 0.5, slotY + 0.5, slotSize - 1, slotSize - 1);
    if (cd > 0) {
      drawOutlinedCanvasText(
        g,
        cd.toFixed(1),
        sx + slotSize / 2,
        slotY + slotSize - 2,
        '#f8fafc'
      );
    } else {
      g.fillStyle = slotColors[i];
      g.fillRect(sx + 3, slotY + 3, 3, 3);
    }
  }

  // Contextual Outlined Pop-ups (no background container)
  const camX = Math.round(state.camX || 0);
  const camY = Math.round(state.camY || 0);
  const px = Math.max(24, Math.min(SCREEN_W - 24, state.x - camX));
  const py = Math.max(18, Math.min(SCREEN_H - 22, state.y - state.z * Z_SCALE - camY - 16));

  if (state.promptText) {
    g.textAlign = 'center';
    drawOutlinedCanvasText(g, state.promptText, px, py, '#fef08a');
  }

  if (state.toastText && state.toastTimer > 0) {
    g.textAlign = 'center';
    drawOutlinedCanvasText(g, state.toastText, SCREEN_W / 2, 18, '#7dd3fc');
  }
}
