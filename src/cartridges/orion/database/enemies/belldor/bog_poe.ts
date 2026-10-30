/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  convertBogRoomPosToUnifiedPx,
  getUnifiedBogRoomAtPx,
  isChunkedExpanseRoom,
  TILE_SIZE,
} from '../../../constants';
import { notifyOrionStateChange } from '../../../systems/stateStore';
import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../../types';

function resolveFirstCampfireFirelightPos(state: OrionState): { x: number; y: number } {
  const localFirelightX = 8 * TILE_SIZE + 8;
  const localFirelightY = 4 * TILE_SIZE + 8;
  if (isChunkedExpanseRoom(state.room)) {
    const unified = convertBogRoomPosToUnifiedPx('0,0', localFirelightX, localFirelightY, 16, 12);
    return { x: unified.x, y: unified.y };
  }
  return { x: localFirelightX, y: localFirelightY };
}

function isPoeInFirstCampfireZone(state: OrionState, px: number, py: number): boolean {
  if (state.room === '0,0') return true;
  if (isChunkedExpanseRoom(state.room)) {
    return getUnifiedBogRoomAtPx(px, py)?.roomCoord === '0,0';
  }
  return false;
}

export const bogPoeEntity: EnemyWikiDefinition = {
  type: 'bog_poe',
  name: 'Poe (Lantern Spirit)',
  spawnChar: 'p',
  faction: 'poe',
  defaultZ: 8,
  isFlying: true,
  emissiveColor: '#7dd3fc',
  tellRadius: 24,
  visionRadiusTiles: 5,
  description: 'A small floating lantern-spirit that manifests where the æther is thick.',
  lore:
    'Speaking to the Poe tucked behind the trees near the First Campfire grants the ability to attune and light campfires. Once the First Campfire is lit, the Poe drifts out from the trees to bask in the warm firelight.',
  shields: { type: 'energy', capacity: 10 },
  armor: { type: 'Ablative', threshold: 1, rating: 0, durability: 10 },
  frameIntegrity: 25,
  speed: 26,
  damage: 0,
  damageType: 'Pulse',
  tellDurationSec: 0.5,
  attackCooldownSec: 2.0,
  lootTable: [{ itemId: 'corrupted_shard', chance: 1.0, count: 1 }],
  shouldSkipSpawn(state: OrionState) {
    return state.flags?.poe_state === 'killed';
  },
  customSpawnSetup(state: OrionState, px: number, py: number) {
    const isFirstCampfireLit = Boolean(
      state.flags?.first_campfire_lit ||
        state.discoveredWaystations?.includes('ws_bog_first_campfire')
    );
    if (isFirstCampfireLit && isPoeInFirstCampfireZone(state, px, py)) {
      const firelight = resolveFirstCampfireFirelightPos(state);
      return {
        x: firelight.x,
        y: firelight.y,
      };
    }
    return {};
  },
  onDeath(state, _e, ctx) {
    state.flags = state.flags || {};
    state.flags.poe_state = 'killed';
    state.flags.campfire_unlocked = true;
    state.flags.bog_exit_revealed = true;
    ctx.say('POE DESTROYED · CAMPFIRE SPARK & BOG EXIT UNSEALED');
    notifyOrionStateChange();
  },
  render25D(g, e, state, ey, isHurt) {
    const floatY = ey - 6 + Math.sin(state.t * 4) * 2;
    g.fillStyle = isHurt ? '#ffffff' : 'rgba(125, 211, 252, 0.85)';
    g.beginPath();
    g.arc(e.x, floatY, 5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fef08a';
    g.fillRect(e.x + 4, floatY - 2, 3, 4);
  },
  update(_rooms, state: OrionState, e: EnemyEntity, dt: number) {
    e.t += dt;
    e.z = 8 + Math.sin(e.t * 3.5) * 3;

    const isFirstCampfireLit = Boolean(
      state.flags?.first_campfire_lit ||
        state.discoveredWaystations?.includes('ws_bog_first_campfire')
    );

    if (isFirstCampfireLit && isPoeInFirstCampfireZone(state, e.x, e.y)) {
      const target = resolveFirstCampfireFirelightPos(state);
      const dx = target.x - e.x;
      const dy = target.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6) {
        const moveStep = Math.min(dist, 34 * dt);
        e.x += (dx / dist) * moveStep;
        e.y += (dy / dist) * moveStep;
      } else {
        e.x = target.x + Math.cos(e.t * 1.8) * 3;
        e.y = target.y + Math.sin(e.t * 1.8) * 2;
      }
      return;
    }

    if (state.flags?.poe_state === 'following') {
      const dx = state.x - e.x;
      const dy = state.y - 12 - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > 14) {
        e.x += (dx / dist) * 42 * dt;
        e.y += (dy / dist) * 42 * dt;
      }
    } else {
      e.x += Math.cos(e.t * 1.6) * 6 * dt;
      e.y += Math.sin(e.t * 1.6) * 6 * dt;
    }
  },
};
