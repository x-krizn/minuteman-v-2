/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';
import { isRoomCacheLooted } from './doodads_atlas';

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
    const isOpened = isRoomCacheLooted(state, tx, ty);

    // Subtle buried disturbance in the soil (blends into the terrain)
    g.fillStyle = isOpened ? 'rgba(0, 0, 0, 0.18)' : 'rgba(0, 0, 0, 0.28)';
    g.beginPath();
    g.ellipse(sx, sy + 1, 5.5, 2.2, 0, 0, Math.PI * 2);
    g.fill();

    // Unopened Scavenger Caches are only identifiable by their periodic blinking glint light
    if (!isOpened) {
      const glint = Math.sin(state.t * 3.8 + tx * 1.7 + ty) * 0.5 + 0.5;
      if (glint > 0.68) {
        const alpha = Math.min(1, (glint - 0.68) * 3.1);
        g.fillStyle = `rgba(251, 191, 36, ${(alpha * 0.45).toFixed(2)})`;
        g.beginPath();
        g.arc(sx, sy - 4, 3.2, 0, Math.PI * 2);
        g.fill();

        g.fillStyle = `rgba(254, 240, 138, ${alpha.toFixed(2)})`;
        g.fillRect(Math.round(sx - 1), Math.round(sy - 5), 2, 2);
      }
    }
  },
};
