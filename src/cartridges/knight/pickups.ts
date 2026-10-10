/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { KnightState } from './types';
import { getItemDefinition } from './database/items';
import { spawnParticles } from './particles';

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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

    // 1. If item has its own self-contained onCollect hook, execute it directly
    if (item.hooks?.onCollect) {
      item.hooks.onCollect(state, {
        sound: soundSystem,
        say,
        spawnParticles: (x, y, count, color, text) =>
          spawnParticles(state.particles, x, y, count, color, text),
      });
      return false;
    }

    const { effect, stat } = item;
    if (!effect) return false;

    switch (effect.type) {
      case 'currency':
        state.coins += effect.amount ?? 1;
        soundSystem.playCoin();
        break;

      case 'key':
        state.keys += effect.amount ?? 1;
        say('KEY');
        soundSystem.playKey();
        break;

      case 'double_jump':
        state.hasDouble = true;
        say('DOUBLE JUMP');
        soundSystem.playDoubleJump();
        break;

      case 'max_stat': {
        const s = effect.stat || stat;
        if (s) {
          const keyName = `max${cap(s)}` as 'maxHp' | 'maxAp' | 'maxEp' | 'maxSp';
          state[keyName] += effect.amount ?? 1;
          state[s] = state[keyName];
          say(`+${effect.amount ?? 1} MAX ${s.toUpperCase()}`);
          soundSystem.playKey();
        }
        break;
      }

      case 'restore_stat': {
        const s = effect.stat || stat;
        if (s === 'hp') {
          state.flasks = Math.min(state.maxFlasks, state.flasks + (effect.amount ?? 1));
          say(`+${effect.amount ?? 1} FLASK (${state.flasks}/${state.maxFlasks})`);
          soundSystem.playCoin();
        } else if (s) {
          const keyName = `max${cap(s)}` as 'maxHp' | 'maxAp' | 'maxEp' | 'maxSp';
          state[s] = Math.min(state[keyName], state[s] + (effect.amount ?? 2));
          say(`+${effect.amount ?? 2} ${s.toUpperCase()}`);
          soundSystem.playCoin();
        }
        break;
      }

      case 'flask_max':
        state.maxFlasks += effect.amount ?? 1;
        state.flasks += effect.amount ?? 1;
        say(`+${effect.amount ?? 1} MAX FLASK`);
        soundSystem.playKey();
        break;

      case 'flask_refill':
        state.flasks = state.maxFlasks;
        say('FLASKS REFILLED');
        soundSystem.playCoin();
        break;

      default:
        state.coins++;
        soundSystem.playCoin();
        break;
    }

    return false;
  });
}
