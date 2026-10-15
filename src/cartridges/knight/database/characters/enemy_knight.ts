/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterDefinition } from '../../types';
import { PROTO_KNIGHT_PNG } from '../../assets/sprites';

export const enemyKnightCharacter: CharacterDefinition = {
  id: 'enemy_knight',
  name: 'Corrupted Knight',
  category: 'enemy',
  description: 'A rogue sentry knight bound by ancient tomb curses, wielding a balanced blade and buckler.',
  lore: 'Trained under the same royal doctrine as the Proto Knight, it patrols vigilant corridors, raises its guard against direct slashes, and delivers disciplined thrusts.',

  stats: {
    hp: 6,
    maxHp: 6,
    ap: 2,
    maxAp: 2,
    ep: 2,
    maxEp: 2,
    sp: 3,
    maxSp: 3,
    poise: 3,
  },

  movement: {
    runSpeed: 45,
    sprintSpeed: 80,
    dashSpeed: 120,
    jumpVelocity: 190,
    gravity: 600,
  },

  sprite: {
    sheetUri: PROTO_KNIGHT_PNG,
    frameWidth: 16,
    frameHeight: 16,
    frames: 4,
    fps: 6,
    anchorX: 8,
    anchorY: 16,
  },

  startingLoadout: {
    weapon: 'short_sword',
    shield: 'iron_round_shield',
  },

  ai: {
    detectionRange: 96,
    attackRange: 24,
    blockChance: 0.45,
    parryWindow: 0.25,
    patrolSpeed: 30,
  },
};
