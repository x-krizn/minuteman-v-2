/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

export const aetherWaystationTile: TileDefinition = {
  id: 'aether_waystation',
  char: 'A',
  name: 'Æther Waystation (Area Fast Travel Anchor)',
  type: 'waystation',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#38bdf8',
  bakedFrontColor: '#0f172a',
  renderProp25D(g, _tx, _ty, sx, sy, state) {
    g.fillStyle = 'rgba(0, 0, 0, 0.45)';
    g.beginPath();
    g.ellipse(sx, sy, 9, 4, 0, 0, Math.PI * 2);
    g.fill();

    // Base plinth
    g.fillStyle = '#1e293b';
    g.fillRect(sx - 6, sy - 6, 12, 6);

    // Tuning crystal monolithspire
    g.fillStyle = '#0ea5e9';
    g.beginPath();
    g.moveTo(sx, sy - 20);
    g.lineTo(sx + 4, sy - 6);
    g.lineTo(sx - 4, sy - 6);
    g.closePath();
    g.fill();

    const pulse = 0.55 + Math.sin(state.t * 4.5) * 0.4;
    g.fillStyle = `rgba(125, 211, 252, ${pulse})`;
    g.beginPath();
    g.arc(sx, sy - 13, 3, 0, Math.PI * 2);
    g.fill();
  },
};
