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
};
