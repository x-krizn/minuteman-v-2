/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

export const poeLanternTile: TileDefinition = {
  id: 'poe_lantern',
  char: 'L',
  name: 'Poe Lantern Anchor',
  type: 'lantern',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#38bdf8',
  bakedFrontColor: '#0284c7',
  renderProp25D(g, _tx, _ty, sx, sy, state) {
    const isLit = state.flags?.poe_state === 'helped';
    g.fillStyle = '#334155';
    g.fillRect(sx - 2, sy - 14, 4, 14);
    g.fillStyle = isLit ? '#38bdf8' : '#f59e0b';
    g.beginPath();
    g.arc(sx, sy - 15, isLit ? 4.5 : 3, 0, Math.PI * 2);
    g.fill();
  },
};
