/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { KnightState } from '../../types/knight';
import { ITEMS } from './constants';

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

    const it = ITEMS[pk.c];
    state.got[pk.id] = true;

    if (it.k === 'coin') {
      state.coins++;
      soundSystem.playCoin();
    } else if (it.k === 'key') {
      state.keys++;
      say('KEY');
      soundSystem.playKey();
    } else if (it.k === 'gem' && it.s) {
      const keyName = `max${cap(it.s)}` as 'maxHp' | 'maxAp' | 'maxEp' | 'maxSp';
      state[keyName]++;
      state[it.s] = state[keyName];
      say(`+1 MAX ${it.s.toUpperCase()}`);
      soundSystem.playKey();
    } else if (it.k === 'potion' && it.s) {
      if (it.s === 'hp') {
        state.flasks = Math.min(state.maxFlasks, state.flasks + 1);
        say(`+1 FLASK (${state.flasks}/${state.maxFlasks})`);
        soundSystem.playCoin();
      } else {
        const keyName = `max${cap(it.s)}` as 'maxHp' | 'maxAp' | 'maxEp' | 'maxSp';
        state[it.s] = Math.min(state[keyName], state[it.s] + 2);
        say(`+2 ${it.s.toUpperCase()}`);
        soundSystem.playCoin();
      }
    } else if (it.k === 'ability') {
      state.hasDouble = true;
      say('DOUBLE JUMP');
      soundSystem.playDoubleJump();
    } else {
      state.coins++;
      soundSystem.playCoin();
    }

    return false;
  });
}
