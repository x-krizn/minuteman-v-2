/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

function renderSwitchProp(
  char: string,
  g: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  state: import('../../../types').OrionState
): void {
  const isActive = Boolean(state.lootedCaches[`switch:${state.room}:${char}`]);
  g.fillStyle = '#1e293b';
  g.fillRect(sx - 4, sy - 7, 8, 7);
  g.fillStyle = isActive ? '#4ade80' : '#f59e0b';
  g.fillRect(sx - 2, sy - 9, 4, 3);
}

export const hiddenSwitch1Tile: TileDefinition = {
  id: 'hidden_switch_1',
  char: '1',
  name: 'Hidden Grail Switch',
  type: 'switch',
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#4ade80',
  bakedFrontColor: '#166534',
  renderProp25D(g, _tx, _ty, sx, sy, state) {
    renderSwitchProp('1', g, sx, sy, state);
  },
};

export const hiddenSwitch2Tile: TileDefinition = {
  ...hiddenSwitch1Tile,
  id: 'hidden_switch_2',
  char: '2',
  name: 'Cathedral Altar Switch',
  renderProp25D(g, _tx, _ty, sx, sy, state) {
    renderSwitchProp('2', g, sx, sy, state);
  },
};

export const hiddenSwitch3Tile: TileDefinition = {
  ...hiddenSwitch1Tile,
  id: 'hidden_switch_3',
  char: '3',
  name: 'Barracks Armory Switch',
  renderProp25D(g, _tx, _ty, sx, sy, state) {
    renderSwitchProp('3', g, sx, sy, state);
  },
};
