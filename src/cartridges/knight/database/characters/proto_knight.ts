/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterDefinition } from '../../types';
import { PROTO_KNIGHT_PNG } from '../../assets/sprites';

export const protoKnightCharacter: CharacterDefinition = {
  id: 'proto_knight',
  name: 'Proto Knight',
  category: 'player',
  description: 'The standard-issue royal combat automaton awakened deep within the forgotten crypt.',
  lore: 'Built by kingdom artisans with balanced blade work, defensive shield parries, and evasive dash maneuvers.',

  stats: {
    hp: 4,
    maxHp: 4,
    ap: 2,
    maxAp: 2,
    ep: 3,
    maxEp: 3,
    sp: 4,
    maxSp: 4,
    flasks: 3,
    maxFlasks: 5,
    poise: 2,
  },

  movement: {
    runSpeed: 80,
    sprintSpeed: 120,
    dashSpeed: 160,
    jumpVelocity: 230,
    gravity: 600,
  },

  sprite: {
    sheetUri: PROTO_KNIGHT_PNG,
    frameWidth: 16,
    frameHeight: 16,
    frames: 4,
    fps: 8,
    anchorX: 8,
    anchorY: 16,
  },

  startingLoadout: {
    weapon: 'short_sword',
    skills: {
      assignedL: 'heal',
      assignedR: 'fireball',
    },
  },
};
