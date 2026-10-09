/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CartridgeSurface } from '../../types/cartridge';
import { KnightState, StatType } from '../../types/knight';
import {
  BG_COLOR,
  COLS,
  ITEMS,
  ROWS,
  SCREEN_H,
  SCREEN_W,
  SKILLS,
  STAT_COLORS,
  TILE_SIZE,
} from './constants';
import { tileIndex } from './physics';

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function drawKnightGame(
  surface: CartridgeSurface,
  state: KnightState,
  rooms: Record<string, string[]>,
  greenRooms: Record<string, number>,
  fontFamily: string
): void {
  const g = surface.g;
  const knight = surface.assets.knight;
  const tiles = greenRooms[state.room]
    ? surface.assets.tilesG
    : surface.assets.tiles;
  const items = surface.assets.items;

  // Clear background
  g.fillStyle = BG_COLOR;
  g.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // 1. Draw room tiles
  const roomRows = rooms[state.room];
  if (roomRows && tiles) {
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const char = roomRows[ty][tx];
        if (char === 'L') {
          if (!state.got[`${state.room}:L`] && items) {
            items.draw(g, 3, tx * TILE_SIZE + 8, ty * TILE_SIZE + 8);
          }
          continue;
        }
        if (char !== '#') continue;
        tiles.draw(
          g,
          tileIndex(rooms, state, tx, ty),
          tx * TILE_SIZE,
          ty * TILE_SIZE
        );
      }
    }
  }

  // 2. Draw pickups
  state.picks.forEach((pk) => {
    const bob = Math.round(Math.sin(performance.now() / 250) * 1.5);
    const it = ITEMS[pk.c];
    if (it && items && it.i >= 0) {
      items.draw(
        g,
        it.i,
        pk.x,
        pk.y + (it.k === 'coin' || it.k === 'key' ? 0 : bob)
      );
      return;
    }

    // Ability orb (Double Jump)
    g.fillStyle = '#66ccff';
    g.fillRect(pk.x - 4, pk.y - 4 + bob, 8, 8);
    g.fillStyle = '#ffffff';
    g.fillRect(pk.x - 2, pk.y - 2 + bob, 2, 2);
  });

  // 3. Draw Dash Ghost Afterimages
  if (knight) {
    state.dashGhosts.forEach((ghost) => {
      g.save();
      g.globalAlpha = ghost.alpha * 0.45;
      knight.draw(g, 1, ghost.x, ghost.y, ghost.face < 0);
      g.restore();
    });
  }

  // 4. Draw Projectiles
  state.projectiles.forEach((p) => {
    if (p.damage >= 3) {
      // Ground shockwave
      g.fillStyle = '#ffaa00';
      g.fillRect(p.x - 5, p.y - 8, 10, 10);
      g.fillStyle = '#ffff66';
      g.fillRect(p.x - 3, p.y - 6, 6, 6);
    } else {
      // Fireball / Magic Bolt
      g.fillStyle = '#ff4400';
      g.beginPath();
      g.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ffee44';
      g.beginPath();
      g.arc(p.x, p.y, p.radius * 0.6, 0, Math.PI * 2);
      g.fill();
    }
  });

  // 5. Draw Enemies with distinct archetypes
  state.enemies.forEach((e) => {
    if (e.hp <= 0) return;

    if (e.type === 'sentry') {
      // Heavy Armored Knight
      g.fillStyle = e.stun > 0 ? '#ffffff' : '#4a5568';
      g.fillRect(Math.round(e.x - 7), Math.round(e.y - 14), 14, 14);
      // Gold Helm Crest
      g.fillStyle = '#ecc94b';
      g.fillRect(Math.round(e.x - 4), Math.round(e.y - 16), 8, 3);
      // Shield / Spear
      g.fillStyle = '#cbd5e0';
      g.fillRect(Math.round(e.x + e.dir * 6 - 2), Math.round(e.y - 12), 4, 11);
      // Eye visor
      g.fillStyle = '#e53e3e';
      g.fillRect(Math.round(e.x + e.dir * 3 - 1), Math.round(e.y - 10), 3, 2);
    } else if (e.type === 'wisp') {
      // Floating Flying Wisp
      const wispBob = Math.sin(performance.now() / 150) * 2;
      g.fillStyle = e.stun > 0 ? '#ffffff' : '#9f7aea';
      g.beginPath();
      g.arc(e.x, e.y - 6 + wispBob, 6, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e9d8fd';
      g.beginPath();
      g.arc(e.x, e.y - 6 + wispBob, 3, 0, Math.PI * 2);
      g.fill();
    } else {
      // Classic Crawler
      g.fillStyle = e.stun > 0 ? '#ffffff' : '#cc3333';
      g.fillRect(Math.round(e.x - 6), Math.round(e.y - 10), 12, 10);
      g.fillStyle = '#000000';
      g.fillRect(Math.round(e.x + e.dir * 2 - 1), Math.round(e.y - 7), 2, 2);
    }

    // Mini enemy health bar if damaged
    if (e.hp < e.maxHp) {
      const barW = 12;
      const pct = Math.max(0, e.hp / e.maxHp);
      g.fillStyle = '#331111';
      g.fillRect(Math.round(e.x - barW / 2), Math.round(e.y - 17), barW, 2);
      g.fillStyle = '#ff3333';
      g.fillRect(Math.round(e.x - barW / 2), Math.round(e.y - 17), barW * pct, 2);
    }
  });

  // 6. Draw Charging Aura if holding X
  if (state.isCharging) {
    const pulse = Math.sin(performance.now() / 80);
    g.strokeStyle = state.isCharged ? '#ffaa00' : '#ffff66';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(state.x, state.y - 8, 10 + pulse * 2, 0, Math.PI * 2);
    g.stroke();
  }

  // 7. Draw Knight Player
  if (knight && !(state.inv > 0 && Math.floor(state.inv * 14) % 2 === 0)) {
    let frame = 0;
    if (state.isDashing) {
      frame = 1; // dash tuck pose
    } else if (!state.ground) {
      // In air jump attack or leap
      frame = state.atk > 0 ? 2 : 1;
    } else if (state.ground) {
      frame = state.atk > 0 ? 0 : (state.t > 0 ? knight.frameAt(state.t) : 0);
    }
    knight.draw(g, frame, state.x, state.y, state.face < 0);
  }

  // 8. Draw Block Shield Bubble or Parry Spark
  if (state.isBlocking) {
    g.strokeStyle = state.parryWindow > 0 ? '#ffff44' : '#66aaff';
    g.lineWidth = 2;
    g.beginPath();
    const startAngle = state.face > 0 ? -Math.PI / 2 : Math.PI / 2;
    const endAngle = state.face > 0 ? Math.PI / 2 : (3 * Math.PI) / 2;
    g.arc(state.x + state.face * 5, state.y - 8, 11, startAngle, endAngle);
    g.stroke();
  }

  if (state.parrySparkTimer > 0) {
    // Flash radiating parry star
    g.fillStyle = '#ffffff';
    g.fillRect(state.x + state.face * 10 - 4, state.y - 12, 8, 8);
    g.fillStyle = '#ffee00';
    g.fillRect(state.x + state.face * 10 - 2, state.y - 10, 4, 4);
  }

  // 9. Draw Sword Slash strictly in its Respective Direction
  if (state.atk > 0 && items) {
    const f = state.face;

    if (state.isHeavyAttack || state.atkV === 4) {
      // Heavy Charged Strike: massive forward golden slash
      items.draw(g, 14, state.x + f * 16, state.y - 9, f < 0);
      g.fillStyle = 'rgba(255, 200, 0, 0.45)';
      g.fillRect(state.x + (f > 0 ? 4 : -24), state.y - 18, 20, 20);
    } else if (state.atkV === 1 || state.atkV === 6) {
      // UPWARD ATTACK (Overhead anti-air & Jump Upward Slash)
      // Drawn above player head
      items.draw(g, 13, state.x + f * 2, state.y - 20, f < 0);
      // Overhead energetic arc
      g.strokeStyle = state.atkV === 6 ? '#88ffff' : '#ffffff';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(state.x + f * 2, state.y - 14, 12, -Math.PI * 0.85, -Math.PI * 0.15);
      g.stroke();
    } else if (state.atkV === 7) {
      // AERIAL DOWNWARD JUMP THRUST (Pogo beneath feet)
      items.draw(g, 15, state.x, state.y + 3, f < 0);
      // Downward spark trail
      g.fillStyle = '#88ffff';
      g.fillRect(state.x - 2, state.y + 6, 4, 5);
      g.fillStyle = '#ffffff';
      g.fillRect(state.x - 1, state.y + 8, 2, 4);
    } else if (state.atkV === 3) {
      // GROUND LOW POKE (Sweeping low)
      items.draw(g, 15, state.x + f * 12, state.y - 3, f < 0);
    } else if (state.atkV === 5) {
      // AERIAL FORWARD JUMP SLASH
      items.draw(g, 14, state.x + f * 14, state.y - 9, f < 0);
      g.strokeStyle = '#88ffff';
      g.lineWidth = 1;
      g.beginPath();
      g.arc(state.x + f * 10, state.y - 8, 10, f > 0 ? -Math.PI * 0.4 : Math.PI * 0.6, f > 0 ? Math.PI * 0.4 : Math.PI * 1.4);
      g.stroke();
    } else if (state.atkV === 2) {
      // GROUND FORWARD SLASH
      items.draw(g, 14, state.x + f * 13, state.y - 8, f < 0);
    } else {
      // NEUTRAL STAB (0)
      items.draw(g, 12, state.x + f * 14, state.y - 8, f < 0);
    }
  }

  // 10. Draw Combat Particles & Damage Numbers
  state.particles.forEach((p) => {
    if (p.text) {
      g.font = `8px ${fontFamily}`;
      g.fillStyle = p.color;
      g.fillText(p.text, p.x - 4, p.y);
    } else {
      g.fillStyle = p.color;
      g.fillRect(p.x, p.y, p.size, p.size);
    }
  });

  // 11. HUD: Health Hearts
  for (let i = 0; i < state.maxHp; i++) {
    g.fillStyle = i < state.hp ? '#ff5555' : '#401010';
    g.fillRect(3 + i * 8, 3, 6, 6);
  }

  // 12. HUD: Souls-like Stamina Gauge (SP)
  const maxSpDisplay = Math.max(state.maxSp, 4);
  const staminaBarW = 38;
  const spPct = Math.min(1, state.sp / maxSpDisplay);
  g.fillStyle = '#222211';
  g.fillRect(3, 11, staminaBarW, 3);
  g.fillStyle = state.sp <= 0.8 ? '#ff9900' : '#ffff44';
  g.fillRect(3, 11, Math.floor(staminaBarW * spPct), 3);

  // 13. HUD: EP & AP dots
  (['ap', 'ep'] as StatType[]).forEach((st, row) => {
    const maxVal = state[`max${cap(st)}` as 'maxAp' | 'maxEp'];
    const curVal = state[st];
    for (let i = 0; i < maxVal; i++) {
      g.fillStyle = i < curVal ? STAT_COLORS[st] : '#202020';
      g.fillRect(3 + i * 6, 16 + row * 5, 4, 3);
    }
  });

  // 14. HUD: Assignable L & R Skill Slots with distinct Resource Counters
  const skillL = SKILLS[state.assignedL];
  const skillR = SKILLS[state.assignedR];

  const getSlotText = (s: typeof skillL) => {
    if (s.costType === 'flask') return `FLK:${state.flasks}`;
    if (s.costType === 'ep') return `${s.name.slice(0, 3)}:${state.ep}E`;
    return `${s.name.slice(0, 3)}:${Math.floor(state.sp)}S`;
  };

  // L Skill Badge
  g.fillStyle = state.skillCdL > 0 ? '#333333' : '#1e293b';
  g.fillRect(SCREEN_W - 54, 3, 25, 9);
  g.font = `6px ${fontFamily}`;
  g.fillStyle = state.skillCdL > 0 ? '#888888' : '#77ccff';
  g.fillText(`L ${getSlotText(skillL)}`, SCREEN_W - 52, 10);

  // R Skill Badge
  g.fillStyle = state.skillCdR > 0 ? '#333333' : '#331e29';
  g.fillRect(SCREEN_W - 27, 3, 25, 9);
  g.fillStyle = state.skillCdR > 0 ? '#888888' : '#ff77aa';
  g.fillText(`R ${getSlotText(skillR)}`, SCREEN_W - 25, 10);

  // Coins, Flasks, Keys on right side
  if (items) {
    items.draw(g, 1, SCREEN_W - 42, 17);
  }
  g.font = `7px ${fontFamily}`;
  g.fillStyle = '#ffffff';
  g.fillText(String(state.coins), SCREEN_W - 32, 21);

  // Flask icon with counter
  if (items) {
    items.draw(g, 8, SCREEN_W - 18, 17);
  }
  g.fillText(String(state.flasks), SCREEN_W - 8, 21);

  if (items) {
    for (let i = 0; i < state.keys; i++) {
      items.draw(g, 2, SCREEN_W - 8, 27 + i * 8);
    }
  }

  // Floating Alert Announcement
  if (state.msgT > 0 && !state.inventoryOpen) {
    g.font = `8px ${fontFamily}`;
    g.textAlign = 'center';
    g.fillStyle = '#ffffff';
    g.fillText(state.msg, SCREEN_W / 2, 34);
    g.textAlign = 'left';
  }
}
