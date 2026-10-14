/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterDefinition } from '../../types';

export const PROTO_KNIGHT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAQCAYAAACm53kpAAACk0lEQVR42mVWTWsUQRCtScSDJHraYDaIREVQEYyrexLxKgbNVUEvwqw/QvzCH+EueFFIrhoSxJuIoGwYk5OBRc0hshPISUcUAmbt10t1anqmZybkstMw21/16r2qrp5ZjzLaVnehJ7f3V6c9Oc8blwHvDOjT20cm+PNnL5AKnlRA6J0YmZCy4PdJ0fb488clvYQEqIDs7dx5qfE90XCaKGe7pLMyIOC9QcYPpwXRbDZ1+YdhSHiWVyPqbXXo6JRfqPzLhE+9AkEQxPKC+cu5KLaWNSkTvnACxiYuZsUc20tLwKDinSVdq9XMVwDi6/XL9Pj+Lad9LANqMkh4pQV6jMRGo2HiGDKr1uDMuRt6BcCZa1NUrRS/AgAyIfxUKlVaW/tqMWRP98ov8WBCVfIjmVOvAAwmJ0/Q5ibKflsDJajo2Pd9bfpqcbkoxNjtlZ/x6xtE0a+f2u+Hd3Pm5JnIWQFc7usbQ9Re6dKXzu4qAPaccRbw8OmsuVYswNW/np/VwuEDGvDsprXb74357z997XfuPknwO71evX5PG+PujxwYwpWPHTxmHeYNLV25qLBLXarU8zrwUleeDOfnlCR1FG2tH4t/MP/NW2gv65L9/W024cCYAlnDAlZAGTnhTCxw8EsbE7CvNPmuNOaWOLHvscfBIGCce61wFGMuWmYDRg4e0rQssHfH4b9TRZC+eP4jdt9MjHZo5/IOa/nSiDBkre8nJOuS+a3xkeyl2cGw3/C8kaLD5nQmAIxbsArNzu6+PhQmiIFRv4m6oH9s+bc6c0MA60uzsNfDcPhkl+GGHvRZ+RHN+Bfp2O8aYB+pvcV5TLy1PfQPVKcdtsR7/f5nnqS8YnLXxfFu20DzjO/9h5DqPZf8fdGz7mm7lpvkAAAAASUVORK5CYII=';

export const KNIGHT_PNG = PROTO_KNIGHT_PNG;

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
