/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

export const colossalWaygateTile: TileDefinition = {
  id: 'colossal_waygate',
  char: 'Q',
  name: 'Colossal Waygate (Inter-World Signature Archway)',
  type: 'waygate',
  solid: true,
  blocksHeight: 2,
  bakedTopColor: '#67e8f9',
  bakedFrontColor: '#164e63',
  renderProp25D(g, _tx, _ty, sx, sy, state) {
    // Colossal archway of stone, root, and mineral
    g.fillStyle = 'rgba(0, 0, 0, 0.55)';
    g.beginPath();
    g.ellipse(sx, sy + 1, 13, 5, 0, 0, Math.PI * 2);
    g.fill();

    // Stone & root pillars
    g.fillStyle = '#334155';
    g.fillRect(sx - 10, sy - 22, 4, 22);
    g.fillRect(sx + 6, sy - 22, 4, 22);
    // Archway crown
    g.fillStyle = '#475569';
    g.fillRect(sx - 11, sy - 25, 22, 4);

    // Shimmering Ætheric horizon inside the arch
    const pulse = 0.6 + Math.sin(state.t * 3.5) * 0.35;
    g.fillStyle = `rgba(34, 211, 238, ${pulse * 0.7})`;
    g.fillRect(sx - 6, sy - 21, 12, 20);

    g.fillStyle = `rgba(224, 242, 254, ${pulse})`;
    g.fillRect(sx - 2, sy - 18, 4, 14);
  },
};
