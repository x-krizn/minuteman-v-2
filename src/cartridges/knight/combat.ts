/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { BoundingBox, KnightState } from './types';
import {
  CHARGE_TIME_REQUIRED,
  JUMP_VELOCITY,
  PARRY_WINDOW_DURATION,
  SWORD_ATTACKS,
} from './constants';
import { bodyBox, enemyBox, overlap } from './physics';
import { spawnParticles } from './skills';

/**
 * Handles attack initiation or release of charged attack (Button X)
 */
export function handleAttackInput(
  state: KnightState,
  isHeld: boolean,
  isPressed: boolean,
  sx: number,
  sy: number,
  dt: number,
  say: (t: string) => void
): void {
  // If holding X, build charge
  if (isHeld) {
    state.isCharging = true;
    state.chargeTimer += dt;
    if (state.chargeTimer >= CHARGE_TIME_REQUIRED && !state.isCharged) {
      state.isCharged = true;
      soundSystem.playCharge();
      say('CHARGED!');
      spawnParticles(state.particles, state.x, state.y - 8, 8, '#ffee44');
    }
  }

  // Release of held attack or initial tap attack
  if (!isHeld && state.isCharging) {
    if (state.isCharged) {
      // Release heavy charged strike!
      state.isHeavyAttack = true;
      state.atkV = 4; // heavy charged variant
      state.atk = 0.28;
      state.atkCd = 0.4;
      state.swung = [];
      state.hitstop = 0.04;
      soundSystem.playHeavyAttack();
      spawnParticles(state.particles, state.x + state.face * 10, state.y - 8, 12, '#ff8800');
    } else if (state.atkCd <= 0) {
      // Released before full charge, execute standard attack
      executeNormalAttack(state, sx, sy);
    }
    state.isCharging = false;
    state.isCharged = false;
    state.chargeTimer = 0;
  } else if (isPressed && state.atkCd <= 0 && !state.isCharging) {
    executeNormalAttack(state, sx, sy);
  }
}

function executeNormalAttack(state: KnightState, sx: number, sy: number): void {
  state.isHeavyAttack = false;

  if (!state.ground) {
    // Jump Attacks
    if (sy > 0.35) {
      state.atkV = 7; // Aerial downward jump thrust (pogo)
    } else if (sy < -0.35) {
      state.atkV = 6; // Aerial upward jump slash (anti-air)
    } else {
      state.atkV = 5; // Aerial forward jump slash
    }
  } else {
    // Ground Attacks
    if (sy < -0.35) {
      state.atkV = 1; // Ground upward slash
    } else if (sy > 0.35) {
      state.atkV = 3; // Ground low sweep / poke
    } else if (Math.abs(sx) > 0.25) {
      state.atkV = 2; // Ground forward step slash
    } else {
      state.atkV = 0; // Ground neutral stab
    }
  }

  state.atk = 0.18;
  state.atkCd = 0.28;
  state.swung = [];
  soundSystem.playSword();
}

/**
 * Handles Guard & Parry (Button Y)
 */
export function handleBlockInput(
  state: KnightState,
  isHeld: boolean,
  isPressed: boolean,
  dt: number
): void {
  if (isPressed) {
    state.parryWindow = PARRY_WINDOW_DURATION;
    state.isBlocking = true;
  }

  if (isHeld) {
    state.isBlocking = true;
    if (state.parryWindow > 0) {
      state.parryWindow -= dt;
    }
  } else {
    state.isBlocking = false;
    state.parryWindow = 0;
  }
}

/**
 * Main combat resolution loop
 */
export function updateCombat(
  state: KnightState,
  onPlayerDeath: () => void,
  say: (t: string) => void
): void {
  // Sword attack hitboxes in their respective directions
  if (state.atk > 0) {
    const f = state.face;
    let box: BoundingBox;

    if (state.atkV === 1 || state.atkV === 6) {
      // UPWARD ATTACKS (Overhead anti-air)
      box = {
        x0: state.x - 9,
        x1: state.x + 9,
        y0: state.y - 32,
        y1: state.y - 12,
      };
    } else if (state.atkV === 7) {
      // DOWNWARD AERIAL JUMP THRUST (Pogo beneath feet)
      box = {
        x0: state.x - 8,
        x1: state.x + 8,
        y0: state.y - 2,
        y1: state.y + 14,
      };
    } else if (state.atkV === 3) {
      // GROUND LOW POKE (Low crouch swipe)
      box = {
        x0: f > 0 ? state.x + 3 : state.x - 16,
        x1: f > 0 ? state.x + 16 : state.x - 3,
        y0: state.y - 6,
        y1: state.y + 2,
      };
    } else if (state.atkV === 4) {
      // HEAVY CHARGED STRIKE (Broad forward cleave)
      box = {
        x0: f > 0 ? state.x + 3 : state.x - 26,
        x1: f > 0 ? state.x + 26 : state.x - 3,
        y0: state.y - 22,
        y1: state.y + 1,
      };
    } else if (state.atkV === 5) {
      // AERIAL FORWARD JUMP SLASH
      box = {
        x0: f > 0 ? state.x + 3 : state.x - 22,
        x1: f > 0 ? state.x + 22 : state.x - 3,
        y0: state.y - 18,
        y1: state.y - 1,
      };
    } else if (state.atkV === 2) {
      // GROUND FORWARD SLASH
      box = {
        x0: f > 0 ? state.x + 4 : state.x - 20,
        x1: f > 0 ? state.x + 20 : state.x - 4,
        y0: state.y - 16,
        y1: state.y - 2,
      };
    } else {
      // NEUTRAL FORWARD STAB (0)
      box = {
        x0: f > 0 ? state.x + 4 : state.x - 18,
        x1: f > 0 ? state.x + 18 : state.x - 4,
        y0: state.y - 13,
        y1: state.y - 3,
      };
    }

    const damage = state.isHeavyAttack ? 3 : 1;

    state.enemies.forEach((e, i) => {
      if (e.hp > 0 && state.swung.indexOf(i) < 0 && overlap(box, enemyBox(e))) {
        state.swung.push(i);
        e.hp -= damage;
        e.stun = state.isHeavyAttack ? 0.6 : 0.25;
        e.x += f * (state.isHeavyAttack ? 14 : 7);

        // Aerial Downward Thrust Pogo Bounce!
        if ((state.atkV === 7 || (state.atkV === 3 && !state.ground))) {
          state.vy = -JUMP_VELOCITY * 0.95;
          state.airJumps = state.hasDouble ? 1 : 0;
          soundSystem.playPogo();
          spawnParticles(state.particles, state.x, state.y + 4, 8, '#88ffff');
        }

        // Fighting game hitstop & sparks
        state.hitstop = state.isHeavyAttack ? 0.08 : 0.04;
        soundSystem.playHit();
        spawnParticles(
          state.particles,
          e.x,
          e.y - 6,
          state.isHeavyAttack ? 10 : 5,
          state.isHeavyAttack ? '#ff8800' : '#ffff44',
          `-${damage}`
        );
      }
    });
  }

  // Enemy contact & defense (Parry / Block / Hurt)
  if (state.inv <= 0 && !state.isDashing) {
    const me = bodyBox(state);
    const foe = state.enemies.find((e) => e.hp > 0 && overlap(me, enemyBox(e)));

    if (foe) {
      // 1. PERFECT PARRY
      if (state.isBlocking && state.parryWindow > 0) {
        soundSystem.playParry();
        state.parrySparkTimer = 0.25;
        state.hitstop = 0.08;
        foe.stun = 1.0; // Deep enemy stagger
        foe.x += (state.x < foe.x ? 1 : -1) * 16;
        say('PARRY!');
        spawnParticles(state.particles, (state.x + foe.x) / 2, state.y - 8, 12, '#ffea00', 'PARRY!');
        return;
      }

      // 2. GUARD (HOLD BLOCK)
      if (state.isBlocking && state.sp > 0) {
        state.sp = Math.max(0, state.sp - 1);
        soundSystem.playBlock();
        state.blockStun = 0.15;
        state.vx = (state.x < foe.x ? -1 : 1) * 50;
        say('BLOCKED');
        spawnParticles(state.particles, state.x + state.face * 6, state.y - 8, 6, '#66aaff');
        return;
      }

      // 3. DAMAGE TAKEN
      state.hp--;
      state.inv = 1.0;
      state.kb = 0.2;
      state.vx = (state.x < foe.x ? -1 : 1) * 120;
      state.vy = -140;
      soundSystem.playHit();
      spawnParticles(state.particles, state.x, state.y - 8, 8, '#ff3333', '-1');

      if (state.hp <= 0) {
        onPlayerDeath();
      }
    }
  }
}
