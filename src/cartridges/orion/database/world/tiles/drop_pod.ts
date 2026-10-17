/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

export const dropPodTile: TileDefinition = {
  id: 'drop_pod',
  char: 'D',
  name: 'Drop-Pod Crater (Spawn Anchor)',
  type: 'crater',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#f1f5f9',
  bakedFrontColor: '#64748b',
  renderProp25D(g, _tx, _ty, sx, sy, state) {
    g.fillStyle = 'rgba(0, 0, 0, 0.5)';
    g.beginPath();
    g.ellipse(sx, sy, 11, 5, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#f1f5f9';
    g.beginPath();
    g.arc(sx, sy - 8, 7, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#0ea5e9';
    g.fillRect(sx - 2, sy - 10, 4, 4);
    const pulse = 0.5 + Math.sin(state.t * 5) * 0.5;
    g.fillStyle = `rgba(56, 189, 248, ${pulse})`;
    g.beginPath();
    g.arc(sx, sy - 14, 2, 0, Math.PI * 2);
    g.fill();
  },
};
