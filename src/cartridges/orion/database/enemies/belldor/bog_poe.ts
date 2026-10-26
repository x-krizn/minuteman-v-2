/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { notifyOrionStateChange } from '../../../systems/playerSystem';
import { EnemyEntity, EnemyWikiDefinition, OrionState } from '../../../types';

export const bogPoeEntity: EnemyWikiDefinition = {
  type: 'bog_poe',
  name: 'Poe (Lantern Spirit)',
  spawnChar: 'p',
  faction: 'poe',
  defaultZ: 8,
  isFlying: true,
  emissiveColor: '#7dd3fc',
  tellRadius: 24,
  description: 'A small floating lantern-spirit that manifests where the æther is thick.',
  lore:
    'Helping it back to its lantern earns a gift that reveals the Bog Wurm. Ignoring or killing it also reveals the way out of the bog.',
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
    return state.flags?.poe_state === 'helped' || state.flags?.poe_state === 'killed';
  },
  onDeath(state, _e, ctx) {
    state.flags = state.flags || {};
    state.flags.poe_state = 'killed';
    state.flags.bog_exit_revealed = true;
    ctx.say('POE DESTROYED · BOG EXIT UNSEALED');
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

    if (state.flags?.poe_state === 'following') {
      const dx = state.x - e.x;
      const dy = state.y - 12 - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > 14) {
        e.x += (dx / dist) * 42 * dt;
        e.y += (dy / dist) * 42 * dt;
      }
    } else {
      e.x += Math.cos(e.t * 1.6) * 10 * dt;
      e.y += Math.sin(e.t * 1.6) * 10 * dt;
    }
  },
};
