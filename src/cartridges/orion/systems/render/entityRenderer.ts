/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DIR_VECTORS,
  getVisibleTileBounds,
  PERFECT_BLOCK_WINDOW_SEC,
  SCREEN_H,
  SCREEN_W,
  TILE_SIZE,
  Z_SCALE,
} from '../../constants';
import { getEnemyDefinition } from '../../database/enemies';
import { getCoinPickupSpriteBase64, getItemDefinition } from '../../database/items';
import { getTileDefinition } from '../../database/world';
import { BiomeDefinition, OrionState } from '../../types';
import { INERTIA_CONSTANTS } from '../inertiaSystem';
import { drawCompositePlayerMech } from '../playerSpriteSystem';
import { getPointVisibilityFactor } from './effectsRenderer';
import { drawBase64Sprite } from './spriteAtlasCache';
import { drawClusterBiomeWall, isClusterSingleWallChar } from './worldRenderer';

// ─── DEPTH-SORTED ENTITY, PROP, PICKUP & PLAYER MECH RENDERER (LAYER 2) ──────

/**
 * Renders depth-sorted room props, pickups, enemies, and the composite player Mech
 * (including Main Hand [Right], Side Hand [Left], and Aux [Back] hardpoints).
 * Does not mutate `state: OrionState`.
 */
export function renderDepthSortedEntitiesAndProps(
  g: CanvasRenderingContext2D,
  room: string[] | undefined,
  activeBiome: BiomeDefinition,
  state: OrionState
): void {
  interface RenderItem {
    y: number;
    draw: () => void;
  }
  const renderQueue: RenderItem[] = [];
  const camX = state.camX || 0;
  const camY = state.camY || 0;

  if (room) {
    const { minTx, maxTx, minTy, maxTy } = getVisibleTileBounds(room, camX, camY, 3);
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const char = room[ty]?.[tx] || '.';
        const tile = getTileDefinition(char, state.biomeId);
        if (tile.propSprite || tile.renderProp25D || isClusterSingleWallChar(char)) {
          const sx = tx * TILE_SIZE + 8;
          const sy = ty * TILE_SIZE + 12;
          renderQueue.push({
            y: sy,
            draw: () => {
              const drewProp =
                drawBase64Sprite(g, tile.propSprite, sx, sy, state.t, {
                  defaultAnchor: 'bottom-center',
                }) ||
                (isClusterSingleWallChar(char) &&
                  drawClusterBiomeWall(
                    g,
                    room,
                    activeBiome,
                    tx,
                    ty,
                    tx * TILE_SIZE,
                    ty * TILE_SIZE,
                    state.t
                  ));
              if (!drewProp) {
                tile.renderProp25D?.(g, tx, ty, sx, sy, state);
              }
            },
          });
        }
      }
    }
  }

  for (const p of state.pickups) {
    if (
      p.x < camX - 48 ||
      p.x > camX + SCREEN_W + 48 ||
      p.y < camY - 48 ||
      p.y > camY + SCREEN_H + 48
    ) {
      continue;
    }
    renderQueue.push({
      y: p.y,
      draw: () => {
        const shadowR = Math.max(2, 5 * (1 - p.z / 60));
        g.fillStyle = 'rgba(0, 0, 0, 0.35)';
        g.beginPath();
        g.ellipse(p.x, p.y + 1, shadowR, shadowR * 0.5, 0, 0, Math.PI * 2);
        g.fill();

        const py = p.y - p.z * Z_SCALE;
        const bob = Math.sin(p.t * 5) * 2;
        const itemDef = p.itemId ? getItemDefinition(p.itemId) : undefined;

        const coinSpriteConfig =
          p.kind === 'scrap'
            ? {
                base64: getCoinPickupSpriteBase64(p.value || 1),
                cellWidth: 16,
                cellHeight: 16,
                col: 0,
                row: 0,
                renderWidth: 10,
                renderHeight: 10,
                anchor: 'bottom-center' as const,
                outlineColor: '#05070a',
              }
            : undefined;

        const drewIcon = drawBase64Sprite(
          g,
          itemDef?.iconSprite || coinSpriteConfig,
          p.x,
          py + bob,
          state.t,
          {
            defaultAnchor: 'bottom-center',
          }
        );

        if (!drewIcon) {
          if (p.kind === 'scrap') {
            g.fillStyle = '#ffd27d';
            g.fillRect(p.x - 2, py - 4 + bob, 4, 5);
            g.fillStyle = '#fffbeb';
            g.fillRect(p.x - 1, py - 3 + bob, 2, 2);
          } else {
            g.fillStyle = p.color || '#77c7ff';
            g.fillRect(p.x - 3, py - 5 + bob, 6, 6);
          }
        }
      },
    });
  }

  for (const e of state.enemies) {
    renderQueue.push({
      y: e.y,
      draw: () => {
        const ey = e.y - e.z * Z_SCALE;
        const isHurt = e.hurt > 0;
        const isWindup = e.state === 'windup';
        const def = getEnemyDefinition(e.type);

        const rawVis = getPointVisibilityFactor(e.x, e.y, state, room);
        const visFactor =
          isHurt || (state.opticMarkTimer || 0) > 0
            ? Math.max(rawVis, 0.85)
            : rawVis;

        // Entities outside active light or occluded behind walls/trees are hidden in the abyss
        if (visFactor < 0.14) {
          return;
        }

        if (e.isSubmerged && def?.render25D) {
          const handledFullDraw = def.render25D(g, e, state, ey, isHurt, isWindup);
          if (handledFullDraw === true) return;
        }

        g.save();
        if (visFactor < 0.95) {
          g.globalAlpha = Math.max(0.18, Math.min(1, 0.1 + visFactor * 0.9));
        }

        const shadowR = Math.max(3, 8 * (1 - e.z / 60));
        g.fillStyle = 'rgba(0, 0, 0, 0.45)';
        g.beginPath();
        g.ellipse(e.x, e.y + 1, shadowR, shadowR * 0.5, 0, 0, Math.PI * 2);
        g.fill();

        const drewEnemySprite = drawBase64Sprite(g, def?.sprite, e.x, ey, state.t, {
          dir: e.dir,
          stateName: e.state,
          isHurt,
          defaultAnchor: 'bottom-center',
        });

        if (!drewEnemySprite) {
          if (def?.render25D) {
            def.render25D(g, e, state, ey, isHurt, isWindup);
          } else {
            g.fillStyle = isHurt ? '#ffffff' : e.emissiveColor || '#64748b';
            g.fillRect(e.x - 5, ey - 14, 10, 14);
          }
        }

        // Fighting-Game / Souls Silhouette Flash-Frame Overlay on Enemy
        if ((e.flashTimer || 0) > 0) {
          const flashColor = e.flashColor || '#ffffff';
          const flashKind = e.flashKind || 'hit';
          const flashMax = Math.max(0.05, e.flashMaxTimer || 0.12);
          const flashRatio = Math.max(0, Math.min(1, (e.flashTimer || 0) / flashMax));
          const isStrobeWhite =
            (flashKind === 'sweet' || flashKind === 'stagger' || flashKind === 'shield_break') &&
            flashRatio > 0.55;

          g.save();
          g.globalAlpha = Math.min(0.88, 0.4 + flashRatio * 0.5);
          g.fillStyle = isStrobeWhite ? '#ffffff' : flashColor;
          g.fillRect(e.x - 5, ey - 15, 10, 13);

          // Sweet-spot critical cross-flare or shield-break burst
          if (flashKind === 'sweet') {
            g.fillStyle = '#ffffff';
            g.fillRect(e.x - 9, ey - 9, 18, 2);
            g.fillRect(e.x - 1, ey - 17, 2, 16);
            g.fillStyle = '#fde047';
            g.fillRect(e.x - 6, ey - 12, 12, 6);
          } else if (flashKind === 'shield' || flashKind === 'shield_break') {
            g.strokeStyle = flashColor;
            g.lineWidth = 1.4;
            g.beginPath();
            g.arc(e.x, ey - 8, 9, 0, Math.PI * 2);
            g.stroke();
          }
          g.restore();
        }

        if (visFactor >= 0.45 || isHurt || state.lockedTargetId === e.id) {
          const barW = 16;
          g.fillStyle = '#000000';
          g.fillRect(e.x - barW / 2, ey - 22, barW, 3);
          const framePct = Math.max(0, e.frame.integrity / e.frame.maxIntegrity);
          g.fillStyle = e.npcDisposition === 'calm' ? '#7dd3fc' : '#8dd7ad';
          g.fillRect(e.x - barW / 2, ey - 22, barW * framePct, 3);
        }

        if (state.lockedTargetId === e.id) {
          const pulse = 9 + Math.sin(state.t * 8) * 1.5;
          g.strokeStyle = '#38bdf8';
          g.lineWidth = 1.2;
          g.beginPath();
          g.arc(e.x, ey - 9, pulse, 0, Math.PI * 2);
          g.stroke();

          g.fillStyle = '#fbbf24';
          g.fillRect(e.x - pulse - 1, ey - 9 - pulse, 3, 1);
          g.fillRect(e.x + pulse - 2, ey - 9 - pulse, 3, 1);
          g.fillRect(e.x - pulse - 1, ey - 9 + pulse, 3, 1);
          g.fillRect(e.x + pulse - 2, ey - 9 + pulse, 3, 1);
        }

        // §8 Player Legibility: Visible Charge State (forward momentum μ >= 0.55) on Enemy
        if ((e.currentMu || 0) >= INERTIA_CONSTANTS.CHARGE_VISUAL_MU_THRESHOLD && e.stun <= 0) {
          const evx = e.vx || 0;
          const evy = e.vy || 0;
          const eAng =
            Math.hypot(evx, evy) > 1
              ? Math.atan2(evy, evx)
              : Math.atan2(state.y - e.y, state.x - e.x);
          g.save();
          g.strokeStyle = '#38bdf8';
          g.lineWidth = 1.2;
          g.globalAlpha = 0.78;
          const cx = e.x + Math.cos(eAng) * 9;
          const cy = ey - 8 + Math.sin(eAng) * 7;
          g.beginPath();
          g.arc(cx, cy, 6, eAng - 0.65, eAng + 0.65);
          g.stroke();
          g.restore();
        }

        // §8 Player Legibility: Distinct visible outcome ring for Shrugged-Off / Flinch / Stagger / Knockback
        if ((e.lastInertiaOutcomeTimer || 0) > 0 && e.lastInertiaOutcome) {
          g.save();
          const outColor =
            e.lastInertiaOutcome === 'none'
              ? '#94a3b8'
              : e.lastInertiaOutcome === 'flinch'
                ? '#fde047'
                : e.lastInertiaOutcome === 'stagger'
                  ? '#fb923c'
                  : '#f43f5e';
          g.strokeStyle = outColor;
          g.lineWidth = e.lastInertiaOutcome === 'none' ? 1.4 : 1.8;
          g.globalAlpha = Math.min(0.9, (e.lastInertiaOutcomeTimer || 0) * 1.6);
          g.beginPath();
          g.arc(e.x, ey - 8, e.lastInertiaOutcome === 'none' ? 9 : 11, 0, Math.PI * 2);
          g.stroke();
          g.restore();
        }

        g.restore();
      },
    });
  }

  renderQueue.push({
    y: state.y,
    draw: () => {
      const isFalling = Boolean(state.isFallingIntoPit || state.z < 0);
      const scale = isFalling ? Math.max(0.15, 1 + state.z / 45) : 1.0;
      const alpha = isFalling ? Math.max(0, 1 + state.z / 40) : 1.0;

      if (!isFalling && state.z >= 0) {
        const shadowR = Math.max(3, 7 * (1 - state.z / 60));
        g.fillStyle = 'rgba(0, 0, 0, 0.45)';
        g.beginPath();
        g.ellipse(state.x, state.y + 1, shadowR, shadowR * 0.45, 0, 0, Math.PI * 2);
        g.fill();
      }

      const py = state.y - state.z * Z_SCALE;

      if (state.lockedTargetId !== null && !isFalling) {
        const lockedEnemy = state.enemies.find((en) => en.id === state.lockedTargetId);
        if (lockedEnemy) {
          g.strokeStyle = 'rgba(56, 189, 248, 0.28)';
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(state.x, py - 8);
          g.lineTo(lockedEnemy.x, lockedEnemy.y - lockedEnemy.z * Z_SCALE - 8);
          g.stroke();
        }
      }

      g.save();
      g.globalAlpha = alpha;
      if (scale < 1.0) {
        g.translate(state.x, py);
        g.scale(scale, scale);
        g.translate(-state.x, -py);
      }

      if (state.isBoosterDashing || state.isContinuousBoosting) {
        g.fillStyle = state.isContinuousBoosting ? '#38bdf8' : '#77c7ff';
        g.beginPath();
        g.arc(
          state.x - state.boosterDirX * 6,
          py - 6 - state.boosterDirY * 6,
          state.isContinuousBoosting ? 6 : 5,
          0,
          Math.PI * 2
        );
        g.fill();
      }

      const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;

      drawCompositePlayerMech(g, state, state.x, py, state.t, {
        dir: state.dir,
        isAttacking: state.activeSkillSlot !== null && state.skillActionTimer > 0,
      });

      if (state.isHoldingBlock) {
        const isPerfectWindow =
          (state.blockHoldTimer || 0) <= PERFECT_BLOCK_WINDOW_SEC;
        const blockAng = Math.atan2(dirInfo.dy, dirInfo.dx);
        g.save();
        g.strokeStyle = isPerfectWindow ? '#38bdf8' : '#93c5fd';
        g.lineWidth = isPerfectWindow ? 2.2 : 1.4;
        g.globalAlpha = isPerfectWindow ? 0.95 : 0.65;
        g.beginPath();
        g.arc(
          state.x,
          py - 8,
          isPerfectWindow ? 12 : 10,
          blockAng - Math.PI * 0.42,
          blockAng + Math.PI * 0.42
        );
        g.stroke();
        g.restore();
      }

      // §8 Player Legibility: Visible Charge State slipstream chevron when player moves forward with μ >= 0.55
      if (
        (state.currentMu || 0) >= INERTIA_CONSTANTS.CHARGE_VISUAL_MU_THRESHOLD &&
        (state.staggerRecoveryTimer || 0) <= 0
      ) {
        const cAng =
          Math.hypot(state.vx, state.vy) > 1
            ? Math.atan2(state.vy, state.vx)
            : Math.atan2(dirInfo.dy, dirInfo.dx);
        g.save();
        g.strokeStyle = '#38bdf8';
        g.lineWidth = 1.3;
        g.globalAlpha = 0.82;
        g.beginPath();
        g.arc(
          state.x + Math.cos(cAng) * 4,
          py - 8 + Math.sin(cAng) * 3,
          10,
          cAng - 0.68,
          cAng + 0.68
        );
        g.stroke();
        g.restore();
      }

      // §8 Player Legibility: Distinct visible outcome ring for Shrugged-Off / Flinch / Stagger / Knockback on Player
      if ((state.lastInertiaOutcomeTimer || 0) > 0 && state.lastInertiaOutcome) {
        g.save();
        const pOutColor =
          state.lastInertiaOutcome === 'none'
            ? '#94a3b8'
            : state.lastInertiaOutcome === 'flinch'
              ? '#fde047'
              : state.lastInertiaOutcome === 'stagger'
                ? '#fb923c'
                : '#f43f5e';
        g.strokeStyle = pOutColor;
        g.lineWidth = state.lastInertiaOutcome === 'none' ? 1.5 : 1.9;
        g.globalAlpha = Math.min(0.92, (state.lastInertiaOutcomeTimer || 0) * 1.5);
        g.beginPath();
        g.arc(state.x, py - 8, state.lastInertiaOutcome === 'none' ? 10 : 12, 0, Math.PI * 2);
        g.stroke();
        g.restore();
      }

      g.restore();
    },
  });

  renderQueue.sort((a, b) => a.y - b.y);
  for (const item of renderQueue) {
    item.draw();
  }
}
