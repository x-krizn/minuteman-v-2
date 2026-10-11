/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { KnightState } from './types';
import { getItemDefinition } from './database/items';
import { spawnParticles } from './particles';

/**
 * Generic pickup collision runner delegating effects to individual item hooks
 */
export function updatePickups(
  state: KnightState,
  say: (text: string) => void
): void {
  state.picks = state.picks.filter((pk) => {
    if (Math.abs(pk.x - state.x) > 10 || Math.abs(pk.y - (state.y - 8)) > 12) {
      return true;
    }

    const item = getItemDefinition(pk.c);
    state.got[pk.id] = true;

    if (!item) {
      state.coins++;
      soundSystem.playCoin();
      return false;
    }

    // Execute self-contained onCollect hook
    if (item.hooks?.onCollect) {
      item.hooks.onCollect(state, {
        sound: soundSystem,
        say,
        spawnParticles: (x, y, count, color, text) =>
          spawnParticles(state.particles, x, y, count, color, text),
      });
      return false;
    }

    // Default safety fallback if an item lacks an onCollect hook
    state.coins++;
    soundSystem.playCoin();
    return false;
  });
}
