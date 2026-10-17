/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

export const fallenScoutTile: TileDefinition = {
  id: 'fallen_scout',
  char: 'S',
  name: 'Bedivere / Fallen Knight (Setpiece)',
  type: 'scout',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#d946ef',
  bakedFrontColor: '#86198f',
  renderProp25D(g, _tx, _ty, sx, sy, state) {
    const isLooted = Boolean(state.lootedCaches[`scout:${state.room}`]);
    g.fillStyle = 'rgba(0, 0, 0, 0.4)';
    g.beginPath();
    g.ellipse(sx, sy, 8, 4, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#d946ef';
    g.fillRect(sx - 6, sy - 8, 12, 7);

    g.fillStyle = '#fdf4ff';
    g.fillRect(sx - 3, sy - 10, 6, 2);

    if (!isLooted) {
      const glimmer = Math.sin(state.t * 6) * 2;
      g.fillStyle = '#77c7ff';
      g.fillRect(sx + 5, sy - 11 + glimmer, 3, 5);
    } else if (state.flags?.bedivere_ring_choice === 'pending') {
      g.fillStyle = '#fbbf24';
      g.fillRect(sx + 4, sy - 5, 3, 3);
    }
  },
};
