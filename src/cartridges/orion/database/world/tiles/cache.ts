/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

export const cacheTile: TileDefinition = {
  id: 'cache',
  char: 'C',
  name: 'Scavenger Cache',
  type: 'cache',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#fbbf24',
  bakedFrontColor: '#92400e',
  renderProp25D(g, tx, ty, sx, sy, state) {
    const isOpened = Boolean(state.lootedCaches[`${state.room}:${tx},${ty}`]);
    g.fillStyle = 'rgba(0, 0, 0, 0.35)';
    g.beginPath();
    g.ellipse(sx, sy, 7, 3, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = isOpened ? '#78350f' : '#b45309';
    g.fillRect(sx - 5, sy - 8, 10, 8);
    g.fillStyle = '#ffd27d';
    g.fillRect(sx - 5, sy - 8, 10, 2);
  },
};
