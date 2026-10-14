/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

export const wallTile: TileDefinition = {
  id: 'wall',
  symbol: '#',
  name: 'Stone Wall',
  category: 'terrain',
  description: 'Solid masonry dungeon wall blocking all physical traversal.',
  solid: true,
  color: '#475569',
  assets: {
    imageUri: '', // Paste custom base64 sprite data URL to override wall tile texture
    sheetIndex: 0,
    frameWidth: 16,
    frameHeight: 16,
  },
};
