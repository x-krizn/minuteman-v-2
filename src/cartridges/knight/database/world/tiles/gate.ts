/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KnightState, TileDefinition } from '../../../types';

export const gateTile: TileDefinition = {
  id: 'gate',
  symbol: 'L',
  name: 'Locked Iron Gate',
  category: 'interactive',
  description: 'Heavy dungeon portcullis locked until unlocked with a key.',
  solid: true,
  assets: {
    imageUri: '', // Paste custom base64 sprite data URL to override gate tile
    sheetIndex: 2,
    frameWidth: 16,
    frameHeight: 16,
  },
  hooks: {
    canPass: (state: KnightState, roomKey: string) => {
      return Boolean(state.got[`${roomKey}:L`]);
    },
  },
};
