/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  COLS,
  COLOR_ARMOR,
  COLOR_CRITICAL,
  COLOR_FRAME,
  COLOR_HEAT,
  COLOR_SHIELD,
  DIR_VECTORS,
  ROWS,
  SCREEN_H,
  SCREEN_W,
  TILE_SIZE,
  Z_SCALE,
} from './constants';
import { getEnemyDefinition } from './database/enemies';
import { getWeaponDefinition } from './database/weapons';
import { getTileDefinition } from './database/world';
import { OrionState } from './types';

/**
 * 2.5D Renderer for Project Orion
 * Delegates tile, prop, enemy, and weapon hardpoint rendering directly to
 * each self-contained entity module in ./database.
 */
export function drawOrionGame(
  g: CanvasRenderingContext2D,
  rooms: Record<string, string[]>,
  state: OrionState
): void {
  // Clear canvas (Dark atmospheric bog void)
  g.fillStyle = '#090d14';
  g.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const room = rooms[state.room];
  const defaultFloorTile = getTileDefinition('.', state.biomeId);

  // 1. LAYER 0: Ground, Mud & Sinkholes (Data-Driven per Tile & Biome Module)
  if (room) {
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const char = room[ty]?.[tx] || '.';
        const tile = getTileDefinition(char, state.biomeId);
        const sx = tx * TILE_SIZE;
        const sy = ty * TILE_SIZE;

        if (tile.renderLayer0) {
          tile.renderLayer0(g, tx, ty, sx, sy, state);
        } else {
          defaultFloorTile.renderLayer0?.(g, tx, ty, sx, sy, state);
        }
      }
    }
  }

  // 2. LAYER 1: Baked 2.5D Walls, Desync Barriers & Gates (Data-Driven per Tile & Biome Module)
  if (room) {
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const char = room[ty]?.[tx] || '.';
        const tile = getTileDefinition(char, state.biomeId);
        const sx = tx * TILE_SIZE;
        const sy = ty * TILE_SIZE;
        tile.renderLayer1?.(g, tx, ty, sx, sy, state);
      }
    }
  }

  // 3. LAYER 2: Collect & Depth-Sort Entities & Props
  interface RenderItem {
    y: number;
    draw: () => void;
  }
  const renderQueue: RenderItem[] = [];

  // A. World Props & Setpieces (Data-Driven via tile.renderProp25D)
  if (room) {
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const char = room[ty]?.[tx] || '.';
        const tile = getTileDefinition(char, state.biomeId);
        if (tile.renderProp25D) {
          const sx = tx * TILE_SIZE + 8;
          const sy = ty * TILE_SIZE + 12;
          renderQueue.push({
            y: sy,
            draw: () => {
              tile.renderProp25D?.(g, tx, ty, sx, sy, state);
            },
          });
        }
      }
    }
  }

  // B. Pickups (Salvage Scrap & Field Kits)
  for (const p of state.pickups) {
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

        if (p.kind === 'scrap') {
          g.fillStyle = '#ffd27d';
          g.fillRect(p.x - 2, py - 4 + bob, 4, 5);
          g.fillStyle = '#fffbeb';
          g.fillRect(p.x - 1, py - 3 + bob, 2, 2);
        } else {
          g.fillStyle = p.color || '#77c7ff';
          g.fillRect(p.x - 3, py - 5 + bob, 6, 6);
        }
      },
    });
  }

  // C. Enemies & Interactive World Entities (Data-Driven via enemyDef.render25D)
  for (const e of state.enemies) {
    renderQueue.push({
      y: e.y,
      draw: () => {
        const ey = e.y - e.z * Z_SCALE;
        const isHurt = e.hurt > 0;
        const isWindup = e.state === 'windup';
        const def = getEnemyDefinition(e.type);

        // If entity is submerged (e.g. Bog Wurm), allow its render25D to handle early stealth draw
        if (e.isSubmerged && def?.render25D) {
          const handledFullDraw = def.render25D(g, e, state, ey, isHurt, isWindup);
          if (handledFullDraw === true) return;
        }

        const shadowR = Math.max(3, 8 * (1 - e.z / 60));
        g.fillStyle = 'rgba(0, 0, 0, 0.45)';
        g.beginPath();
        g.ellipse(e.x, e.y + 1, shadowR, shadowR * 0.5, 0, 0, Math.PI * 2);
        g.fill();

        // Tell Windup Ring (Combat Law 1: Every ability has a tell)
        if (isWindup) {
          g.strokeStyle = '#ffd27d';
          g.lineWidth = 1.5;
          g.beginPath();
          g.arc(e.x, e.y, e.tellRadius || 24, 0, Math.PI * 2);
          g.stroke();
        }

        if (def?.render25D) {
          def.render25D(g, e, state, ey, isHurt, isWindup);
        } else {
          g.fillStyle = isHurt ? '#ffffff' : e.emissiveColor || '#64748b';
          g.fillRect(e.x - 5, ey - 14, 10, 14);
        }

        // Enemy Defense Layer Bar (Shield + Frame integrity)
        const barW = 16;
        g.fillStyle = '#000000';
        g.fillRect(e.x - barW / 2, ey - 22, barW, 3);
        const framePct = Math.max(0, e.frame.integrity / e.frame.maxIntegrity);
        g.fillStyle = e.npcDisposition === 'calm' ? '#7dd3fc' : '#8dd7ad';
        g.fillRect(e.x - barW / 2, ey - 22, barW * framePct, 3);

        // Target Lock-On Reticle (Tap [Y])
        if (state.lockedTargetId === e.id) {
          const pulse = 9 + Math.sin(state.t * 8) * 1.5;
          g.strokeStyle = '#38bdf8';
          g.lineWidth = 1.2;
          g.beginPath();
          g.arc(e.x, ey - 9, pulse, 0, Math.PI * 2);
          g.stroke();

          // Corner Lock Brackets
          g.fillStyle = '#fbbf24';
          g.fillRect(e.x - pulse - 1, ey - 9 - pulse, 3, 1);
          g.fillRect(e.x + pulse - 2, ey - 9 - pulse, 3, 1);
          g.fillRect(e.x - pulse - 1, ey - 9 + pulse, 3, 1);
          g.fillRect(e.x + pulse - 2, ey - 9 + pulse, 3, 1);
        }
      },
    });
  }

  // D. Player Mech Frame
  renderQueue.push({
    y: state.y,
    draw: () => {
      const isFalling = Boolean(state.isFallingIntoPit || state.z < 0);
      const scale = isFalling ? Math.max(0.15, 1 + state.z / 45) : 1.0;
      const alpha = isFalling ? Math.max(0, 1 + state.z / 40) : 1.0;

      // Ground Drop Shadow (hidden when falling into chasm)
      if (!isFalling && state.z >= 0) {
        const shadowR = Math.max(3, 7 * (1 - state.z / 60));
        g.fillStyle = 'rgba(0, 0, 0, 0.45)';
        g.beginPath();
        g.ellipse(state.x, state.y + 1, shadowR, shadowR * 0.45, 0, 0, Math.PI * 2);
        g.fill();
      }

      const py = state.y - state.z * Z_SCALE;

      // Subtle Lock-On Aim Line from Pilot to Locked Target
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

      // Booster Kit Evade / Continuous Boost Thrusters
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

      // Mech Torso
      const isCritical = state.frame.state === 'Critical';
      g.fillStyle = isCritical ? '#ff9b9b' : '#3b82f6';
      g.fillRect(state.x - 4, py - 13, 8, 11);

      // Core Reactor Glow (Ichor / Mana / Ether)
      const reactorColor =
        state.reactor === 'Ichor' ? '#ea580c' : state.reactor === 'Mana' ? '#38bdf8' : '#a855f7';
      g.fillStyle = reactorColor;
      g.fillRect(state.x - 2, py - 9, 4, 4);

      // Head / Optics
      g.fillStyle = '#0f172a';
      g.fillRect(state.x - 3, py - 16, 6, 3);
      g.fillStyle = '#77c7ff';
      g.fillRect(state.x - 1, py - 15, 2, 1);

      // Weapon Hardpoint (Data-Driven via weaponDef.renderHardpoint25D)
      const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
      const activeWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
      const weaponDef = getWeaponDefinition(activeWeaponId);
      const wx = state.x + dirInfo.dx * 7;
      const wy = py - 9 + dirInfo.dy * 5;

      if (weaponDef?.renderHardpoint25D) {
        weaponDef.renderHardpoint25D(g, wx, wy, dirInfo.dx, dirInfo.dy, state);
      } else {
        g.fillStyle = '#94a3b8';
        g.fillRect(wx - 1, wy, 3, 6);
      }

      g.restore();
    },
  });

  // Sort and render depth queue
  renderQueue.sort((a, b) => a.y - b.y);
  for (const item of renderQueue) {
    item.draw();
  }

  // 4. LAYER 3: Projectiles & Particles
  for (const p of state.projectiles) {
    const py = p.y - p.z * Z_SCALE;
    g.fillStyle = p.color;
    g.beginPath();
    g.arc(p.x, py, p.radius, 0, Math.PI * 2);
    g.fill();
  }

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

  // 5. LAYER 4: Desynchronization Visual Glitch
  if (state.flickerTimer > 0) {
    state.flickerTimer -= 0.016;
    g.fillStyle = 'rgba(184, 164, 255, 0.08)';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }

  // 6. LAYER 5: CANONICAL THREE DEFENSE LAYERS HUD
  if (!state.useStandardResolutionHud) {
    drawCanonicalHud(g, state);
  }
}

function drawCanonicalHud(g: CanvasRenderingContext2D, state: OrionState): void {
  const barW = 44;
  const barH = 3;

  // Layer 1: SHIELD (Cyan)
  const shieldPct =
    state.shields.maxCapacity > 0
      ? Math.max(0, state.shields.capacity / state.shields.maxCapacity)
      : 0;
  g.fillStyle = '#000000';
  g.fillRect(4, 4, barW + 2, barH + 2);
  g.fillStyle = state.shields.overloaded ? '#ef4444' : COLOR_SHIELD;
  g.fillRect(5, 5, barW * (state.shields.overloaded ? 1 : shieldPct), barH);

  // Layer 2: ARMOR (Amber)
  const armorPct = Math.max(0, state.armor.durability / state.armor.maxDurability);
  g.fillStyle = '#000000';
  g.fillRect(4, 9, barW + 2, barH + 2);
  g.fillStyle = COLOR_ARMOR;
  g.fillRect(5, 10, barW * armorPct, barH);

  // Layer 3: FRAME INTEGRITY (200 HP Static Stats)
  const framePct = Math.max(0, state.frame.integrity / state.frame.maxIntegrity);
  const isCritical = state.frame.state === 'Critical';
  g.fillStyle = '#000000';
  g.fillRect(4, 14, barW + 2, barH + 2);
  g.fillStyle = isCritical ? COLOR_CRITICAL : COLOR_FRAME;
  g.fillRect(5, 15, barW * framePct, barH);

  // Heat Gauge
  const heatPct = Math.max(0, state.heat / state.maxHeat);
  g.fillStyle = '#000000';
  g.fillRect(4, 19, barW + 2, 2);
  g.fillStyle = COLOR_HEAT;
  g.fillRect(5, 20, barW * heatPct, 1);

  // Layer Labels
  g.font = '6px "orion-font", monospace';
  g.fillStyle = '#ffffff';
  g.textAlign = 'left';
  g.fillText(
    `SHLD:${Math.round(state.shields.capacity)} ARM:${Math.round(state.armor.durability)} FRM:${state.frame.integrity}`,
    4,
    27
  );

  // Top-Right: Currencies & Weapon Info
  const activeWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
  const weaponDef = getWeaponDefinition(activeWeaponId);
  const isKhopesh = activeWeaponId === 'khopesh';

  g.textAlign = 'right';
  g.fillStyle = '#ffd27d';
  g.fillText(`SCRAP:${state.salvageScrap}`, SCREEN_W - 4, 9);

  if (state.isReloading) {
    g.fillStyle = '#f59e0b';
    g.fillText(isKhopesh ? 'STANCE...' : 'RELOADING...', SCREEN_W - 4, 17);
  } else {
    g.fillStyle = isKhopesh ? '#e879f9' : '#77c7ff';
    g.fillText(
      `${(weaponDef?.name || activeWeaponId).toUpperCase().slice(0, 8)} ${state.ammo}/${state.maxAmmo}`,
      SCREEN_W - 4,
      17
    );
  }

  // Bottom action bar controls
  g.textAlign = 'left';
  g.fillStyle = 'rgba(0, 0, 0, 0.7)';
  g.fillRect(4, SCREEN_H - 12, SCREEN_W - 8, 9);
  g.fillStyle = '#e2e8f0';
  g.fillText(
    isKhopesh
      ? '[X] SICKLE · [L] LUNGE · [R] DEFLECT · [Y] SWAP'
      : '[X] AUTO · [L] AP SLUG · [R] GRENADE · [Y] SWAP',
    6,
    SCREEN_H - 5
  );

  // Contextual Interactive Prompts & Toasts
  if (state.toastText && state.toastTimer > 0) {
    g.textAlign = 'center';
    g.fillStyle = 'rgba(0, 0, 0, 0.9)';
    g.fillRect(SCREEN_W / 2 - 62, SCREEN_H - 25, 124, 11);
    g.strokeStyle = '#38bdf8';
    g.lineWidth = 1;
    g.strokeRect(SCREEN_W / 2 - 61.5, SCREEN_H - 24.5, 123, 10);
    g.fillStyle = '#77c7ff';
    g.fillText(`${state.toastText} [A]`, SCREEN_W / 2, SCREEN_H - 17);
  } else if (state.promptText) {
    g.textAlign = 'center';
    g.fillStyle = 'rgba(0, 0, 0, 0.85)';
    g.fillRect(SCREEN_W / 2 - 58, SCREEN_H - 25, 116, 11);
    g.fillStyle = '#ffd27d';
    g.fillText(state.promptText, SCREEN_W / 2, SCREEN_H - 17);
  }
}
