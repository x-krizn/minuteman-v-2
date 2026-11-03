/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

/**
 * Canonical database definition for `pylonWallTile` (`Ruined Pylon Wall`, id `'pylon_wall'`, ASCII token `'#'`).
 */
export const pylonWallTile: TileDefinition = {
  id: 'pylon_wall',
  char: '#',
  name: 'Ruined Pylon Wall',
  type: 'wall',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#475569',
  bakedFrontColor: '#1e293b',
};
