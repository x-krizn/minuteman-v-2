/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

/**
 * Canonical database definition for `wallTile` (`Stone Wall`, id `'wall'`, ASCII token `'#'`, slot `'terrain'`) — Solid masonry dungeon wall blocking all physical traversal..
 */
export const wallTile: TileDefinition = {
  id: 'wall',
  symbol: '#',
  name: 'Stone Wall',
  category: 'terrain',
  description: 'Solid masonry dungeon wall blocking all physical traversal.',
  solid: true,
  color: '#475569',
};
