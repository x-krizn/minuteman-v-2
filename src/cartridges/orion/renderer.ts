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
import { getTileDefinition } from './database/world';
import { OrionState } from './types';

/**
 * 2.5D Renderer for Project Orion
 * Implements fixed isometric perspective, M00 The Bog marshland,
 * APW Anchor setpieces, and the Three Defense Layers HUD.
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

  // 1. LAYER 0: Ground, Mud & Sinkholes
  if (room) {
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const char = room[ty]?.[tx] || '.';
        const tile = getTileDefinition(char);
        const sx = tx * TILE_SIZE;
        const sy = ty * TILE_SIZE;

        if (tile.isChasm) {
          // Abyssal Sinkhole (Pitch black with deep edge)
          g.fillStyle = '#05070a';
          g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          g.fillStyle = 'rgba(0, 0, 0, 0.7)';
          g.fillRect(sx, sy, TILE_SIZE, 3);
        } else if (tile.isMud) {
          // Deep Toxic Marsh Mud
          g.fillStyle = '#17202a';
          g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          // Oozing ripple highlights
          const ripple = Math.sin(state.t * 2 + tx * 2 + ty) * 1.5;
          g.fillStyle = '#22303f';
          g.fillRect(sx + 2, sy + 5 + ripple, 5, 1);
          g.fillRect(sx + 8, sy + 11 - ripple, 4, 1);
        } else {
          // Solid Island Soil
          const isAlt = (tx + ty) % 2 === 0;
          g.fillStyle = isAlt ? '#253243' : '#1f2a38';
          g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          g.strokeStyle = 'rgba(0, 0, 0, 0.15)';
          g.strokeRect(sx + 0.5, sy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        }
      }
    }
  }

  // 2. LAYER 1: Baked 2.5D Ruined Pylon Walls
  if (room) {
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const char = room[ty]?.[tx] || '.';
        const tile = getTileDefinition(char);
        const sx = tx * TILE_SIZE;
        const sy = ty * TILE_SIZE;

        if (tile.type === 'wall') {
          // Sunlit top edge
          g.fillStyle = tile.bakedTopColor || '#475569';
          g.fillRect(sx, sy, TILE_SIZE, 5);
          g.fillStyle = '#64748b';
          g.fillRect(sx, sy, TILE_SIZE, 1);

          // Front shaded vertical face
          g.fillStyle = tile.bakedFrontColor || '#1e293b';
          g.fillRect(sx, sy + 5, TILE_SIZE, 11);
          g.fillStyle = '#0f172a';
          g.fillRect(sx, sy + 9, TILE_SIZE, 1);

          // Drop shadow at base
          g.fillStyle = 'rgba(0, 0, 0, 0.35)';
          g.fillRect(sx, sy + 16, TILE_SIZE, 3);
        } else if (tile.type === 'gate') {
          // Rusted Gate (Blue Transition Anchor)
          const isOpen = Boolean(state.unlockedGates[state.room] || state.clearedRooms[state.room]);
          g.fillStyle = '#0369a1';
          g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

          if (!isOpen) {
            // Locked fortified gate
            g.fillStyle = '#38bdf8';
            for (let bx = 2; bx < TILE_SIZE; bx += 3) {
              g.fillRect(sx + bx, sy + 2, 2, TILE_SIZE - 2);
            }
          } else {
            // Opened blue threshold
            g.fillStyle = '#7dd3fc';
            g.fillRect(sx + 3, sy + 4, 10, 12);
          }
        }
      }
    }
  }

  // 3. LAYER 2: Collect & Depth-Sort Entities & Props
  interface RenderItem {
    y: number;
    draw: () => void;
  }
  const renderQueue: RenderItem[] = [];

  // A. Props: Drop-Pod Crater (White), Fallen Scout (Magenta), Pylons, Caches
  if (room) {
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const char = room[ty]?.[tx] || '.';
        const sx = tx * TILE_SIZE + 8;
        const sy = ty * TILE_SIZE + 12;

        if (char === 'D') {
          // Drop-Pod Crater (White Spawn Anchor)
          renderQueue.push({
            y: sy,
            draw: () => {
              // Impact burn scorch
              g.fillStyle = 'rgba(0, 0, 0, 0.5)';
              g.beginPath();
              g.ellipse(sx, sy, 11, 5, 0, 0, Math.PI * 2);
              g.fill();

              // Drop-Pod Hull
              g.fillStyle = '#f1f5f9'; // White Anchor
              g.beginPath();
              g.arc(sx, sy - 8, 7, 0, Math.PI * 2);
              g.fill();

              // Opened Hatch & Beacon
              g.fillStyle = '#0ea5e9';
              g.fillRect(sx - 2, sy - 10, 4, 4);
              const pulse = 0.5 + Math.sin(state.t * 5) * 0.5;
              g.fillStyle = `rgba(56, 189, 248, ${pulse})`;
              g.beginPath();
              g.arc(sx, sy - 14, 2, 0, Math.PI * 2);
              g.fill();
            },
          });
        } else if (char === 'S') {
          // Fallen Scout (Magenta Micro-Setpiece)
          const isLooted = Boolean(state.hasBoosterKit);
          renderQueue.push({
            y: sy,
            draw: () => {
              // Shadow
              g.fillStyle = 'rgba(0, 0, 0, 0.4)';
              g.beginPath();
              g.ellipse(sx, sy, 8, 4, 0, 0, Math.PI * 2);
              g.fill();

              // Scout Chassis
              g.fillStyle = '#d946ef'; // Magenta Anchor
              g.fillRect(sx - 6, sy - 8, 12, 7);

              // Damaged Visor
              g.fillStyle = '#fdf4ff';
              g.fillRect(sx - 3, sy - 10, 6, 2);

              if (!isLooted) {
                // Glowing Khopesh & Booster salvage beacon
                const glimmer = Math.sin(state.t * 6) * 2;
                g.fillStyle = '#77c7ff';
                g.fillRect(sx + 5, sy - 11 + glimmer, 3, 5);
              }
            },
          });
        } else if (char === 'P') {
          // Ruined Pylon
          renderQueue.push({
            y: sy,
            draw: () => {
              g.fillStyle = 'rgba(0, 0, 0, 0.4)';
              g.beginPath();
              g.ellipse(sx, sy, 6, 3, 0, 0, Math.PI * 2);
              g.fill();

              g.fillStyle = '#334155';
              g.fillRect(sx - 4, sy - 18, 8, 18);
              g.fillStyle = '#64748b';
              g.fillRect(sx - 2, sy - 18, 2, 18);
              g.fillStyle = '#94a3b8';
              g.fillRect(sx - 4, sy - 20, 8, 3);
            },
          });
        } else if (char === 'C') {
          // Scavenger Supply Cache
          const isOpened = Boolean(state.lootedCaches[`${state.room}:${tx},${ty}`]);
          renderQueue.push({
            y: sy,
            draw: () => {
              g.fillStyle = 'rgba(0, 0, 0, 0.35)';
              g.beginPath();
              g.ellipse(sx, sy, 7, 3, 0, 0, Math.PI * 2);
              g.fill();

              g.fillStyle = isOpened ? '#78350f' : '#b45309';
              g.fillRect(sx - 5, sy - 8, 10, 8);
              g.fillStyle = '#ffd27d';
              g.fillRect(sx - 5, sy - 8, 10, 2);
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

  // C. Enemies (Bog Crawler & Sir Bors)
  for (const e of state.enemies) {
    renderQueue.push({
      y: e.y,
      draw: () => {
        const shadowR = Math.max(3, 8 * (1 - e.z / 60));
        g.fillStyle = 'rgba(0, 0, 0, 0.45)';
        g.beginPath();
        g.ellipse(e.x, e.y + 1, shadowR, shadowR * 0.5, 0, 0, Math.PI * 2);
        g.fill();

        const ey = e.y - e.z * Z_SCALE;
        const isHurt = e.hurt > 0;
        const isWindup = e.state === 'windup';

        // Tell Windup Ring (Combat Law 1: Every ability has a tell)
        if (isWindup) {
          g.strokeStyle = '#ffd27d';
          g.lineWidth = 1.5;
          g.beginPath();
          g.arc(e.x, e.y, e.tellRadius || 24, 0, Math.PI * 2);
          g.stroke();
        }

        if (e.type === 'bog_crawler') {
          // Hardened Chitin Shell
          g.fillStyle = isHurt ? '#ffffff' : '#334155';
          g.beginPath();
          g.ellipse(e.x, ey - 5, 7, 5, 0, 0, Math.PI * 2);
          g.fill();

          // Pincers
          g.fillStyle = isWindup ? '#ff9b9b' : '#64748b';
          g.fillRect(e.x - 7, ey - 8, 3, 4);
          g.fillRect(e.x + 4, ey - 8, 3, 4);
        } else if (e.type === 'bors_knight') {
          // Sir Bors Corrupted Mech
          g.fillStyle = isHurt ? '#ffffff' : '#312e81';
          g.fillRect(e.x - 8, ey - 20, 16, 20);
          g.fillStyle = '#b8a4ff';
          g.fillRect(e.x - 6, ey - 18, 12, 12);
        }

        // Enemy Defense Layer Bar (Armor durability & Frame integrity)
        const barW = 16;
        g.fillStyle = '#000000';
        g.fillRect(e.x - barW / 2, ey - 16, barW, 3);
        const framePct = Math.max(0, e.frame.integrity / e.frame.maxIntegrity);
        g.fillStyle = '#8dd7ad';
        g.fillRect(e.x - barW / 2, ey - 16, barW * framePct, 3);
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

      g.save();
      g.globalAlpha = alpha;
      if (scale < 1.0) {
        g.translate(state.x, py);
        g.scale(scale, scale);
        g.translate(-state.x, -py);
      }

      // Booster Kit Evade Thrusters
      if (state.isBoosterDashing) {
        g.fillStyle = '#77c7ff';
        g.beginPath();
        g.arc(state.x - state.boosterDirX * 6, py - 6 - state.boosterDirY * 6, 5, 0, Math.PI * 2);
        g.fill();
      }

      // Mech Torso (Based on Trait Line)
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

      // Weapon Hardpoint (Visually distinct per equipped weapon)
      const dirInfo = DIR_VECTORS[state.dir] || DIR_VECTORS.S;
      const activeWeaponId = state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
      const wx = state.x + dirInfo.dx * 7;
      const wy = py - 9 + dirInfo.dy * 5;

      if (activeWeaponId === 'khopesh') {
        // Scout Khopesh: Gleaming curved magenta/violet sickle blade
        g.fillStyle = '#c084fc';
        g.fillRect(wx - 2, wy - 1, 4, 7);
        g.fillStyle = '#f0abfc';
        g.fillRect(wx + (dirInfo.dx >= 0 ? 1 : -2), wy - 2, 2, 4);
      } else {
        // Gladius Boltcaster: Steel rifle barrel with amber muzzle
        g.fillStyle = '#94a3b8';
        g.fillRect(wx - 1, wy, 3, 6);
        g.fillStyle = '#fbbf24';
        g.fillRect(wx - 1, wy + (dirInfo.dy >= 0 ? 5 : -1), 3, 2);
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
  // Skipped when standard resolution viewport HUD is active to keep game canvas unobstructed
  if (!state.useStandardResolutionHud) {
    drawCanonicalHud(g, state);
  }
}

function drawCanonicalHud(g: CanvasRenderingContext2D, state: OrionState): void {
  // Top-left: THE THREE DEFENSE LAYERS
  const barW = 44;
  const barH = 3;

  // Layer 1: SHIELD (Cyan)
  const shieldPct = state.shields.maxCapacity > 0 ? Math.max(0, state.shields.capacity / state.shields.maxCapacity) : 0;
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
  const isKhopesh = activeWeaponId === 'khopesh';

  g.textAlign = 'right';
  g.fillStyle = '#ffd27d';
  g.fillText(`SCRAP:${state.salvageScrap}`, SCREEN_W - 4, 9);

  // Active Weapon & Ammo / Combo status
  if (state.isReloading) {
    g.fillStyle = '#f59e0b';
    g.fillText(isKhopesh ? 'STANCE...' : 'RELOADING...', SCREEN_W - 4, 17);
  } else {
    g.fillStyle = isKhopesh ? '#e879f9' : '#77c7ff';
    g.fillText(
      `${isKhopesh ? 'KHOPESH' : 'GLADIUS'} ${state.ammo}/${state.maxAmmo}`,
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

  // Contextual Interactive Prompts & Toasts (Docked unobtrusively in lower section)
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
