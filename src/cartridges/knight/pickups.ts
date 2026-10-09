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
    } else if (it.k === 'coin_bag') {
      state.coins += 5;
      say('+5 COINS (SACK)');
      soundSystem.playCoin();
    } else if (it.k === 'key') {
      state.keys++;
      say('KEY');
      soundSystem.playKey();
    } else if (it.k === 'gem' && it.s) {
      if (it.s === 'purple') {
        state.maxAp++;
        state.ap = state.maxAp;
        say('+1 MAX AP (AMETHYST)');
      } else if (it.s === 'orange') {
        state.maxSp++;
        state.sp = state.maxSp;
        say('+1 MAX SP (AMBER)');
      } else {
        const keyName = `max${cap(it.s)}` as 'maxHp' | 'maxAp' | 'maxEp' | 'maxSp';
        state[keyName]++;
        state[it.s] = state[keyName];
        say(`+1 MAX ${it.s.toUpperCase()}`);
      }
      soundSystem.playKey();
    } else if (it.k === 'potion' && it.s) {
      if (it.s === 'hp') {
        state.flasks = Math.min(state.maxFlasks, state.flasks + 1);
        say(`+1 FLASK (${state.flasks}/${state.maxFlasks})`);
        soundSystem.playCoin();
      } else if (it.s === 'purple' || it.s === 'orange') {
        state.hp = state.maxHp;
        state.sp = state.maxSp;
        say('FULL RESTORE!');
        soundSystem.playCoin();
      } else {
        const keyName = `max${cap(it.s)}` as 'maxHp' | 'maxAp' | 'maxEp' | 'maxSp';
        state[it.s] = Math.min(state[keyName], state[it.s] + 2);
        say(`+2 ${it.s.toUpperCase()}`);
        soundSystem.playCoin();
      }
    } else if (it.k === 'weapon') {
      say(`FOUND ${it.name?.toUpperCase() || 'WEAPON'}!`);
      soundSystem.playKey();
    } else if (it.k === 'shield') {
      state.maxAp++;
      state.ap = state.maxAp;
      say(`FOUND ${it.name?.toUpperCase() || 'SHIELD'} (+1 AP)!`);
      soundSystem.playKey();
    } else if (it.k === 'caster') {
      state.maxEp++;
      state.ep = state.maxEp;
      say(`FOUND ${it.name?.toUpperCase() || 'CASTER'} (+1 EP)!`);
      soundSystem.playKey();
    } else if (it.k === 'quiver') {
      say('FOUND ARROW QUIVER!');
      soundSystem.playCoin();
    } else {
      state.hasDouble = true;
      say('DOUBLE JUMP');
      soundSystem.playDoubleJump();
    }

    return false;
  });
}
