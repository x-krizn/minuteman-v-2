/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

export const airTile: TileDefinition = {
  id: 'air',
  symbol: '.',
  name: 'Air / Open Passage',
  category: 'terrain',
  description: 'Unobstructed empty space allowing free player and entity traversal.',
  solid: false,
};
