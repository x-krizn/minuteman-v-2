/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TILE_SIZE } from '../../../constants';
import { drawBase64Sprite } from '../../../systems/render/spriteAtlasCache';
import { OrionState, TileDefinition } from '../../../types';
import { DOODADS_01_BASE64, resolveLeverDoodadCell } from './doodads_atlas';

function renderSwitchProp(
  char: string,
  g: CanvasRenderingContext2D,
  _tx: number,
  ty: number,
  sx: number,
  sy: number,
  state: OrionState
): void {
  const switchKey = `switch:${state.room}:${char}`;
  const lever = resolveLeverDoodadCell(state, switchKey);

  g.fillStyle = 'rgba(0, 0, 0, 0.35)';
  g.beginPath();
  g.ellipse(sx, sy + 1, 6, 2.5, 0, 0, Math.PI * 2);
  g.fill();

  drawBase64Sprite(
    g,
    {
      base64: DOODADS_01_BASE64,
      cellWidth: 16,
      cellHeight: 16,
      col: lever.col,
      row: lever.row,
      renderWidth: 16,
      renderHeight: 16,
      anchor: 'bottom-center',
    },
    sx,
    ty * TILE_SIZE + 15,
    state.t
  );
}

const baseSwitchProps = {
  type: 'switch' as const,
  solid: true,
  blocksHeight: 1,
  bakedTopColor: '#4ade80',
  bakedFrontColor: '#166534',
};

export const hiddenSwitch1Tile: TileDefinition = {
  ...baseSwitchProps,
  id: 'hidden_switch_1',
  char: '1',
  name: 'Hidden Grail Switch',
  renderProp25D(g, tx, ty, sx, sy, state) {
    renderSwitchProp('1', g, tx, ty, sx, sy, state);
  },
};

export const hiddenSwitch2Tile: TileDefinition = {
  ...baseSwitchProps,
  id: 'hidden_switch_2',
  char: '2',
  name: 'Cathedral Altar Switch',
  renderProp25D(g, tx, ty, sx, sy, state) {
    renderSwitchProp('2', g, tx, ty, sx, sy, state);
  },
};

export const hiddenSwitch3Tile: TileDefinition = {
  ...baseSwitchProps,
  id: 'hidden_switch_3',
  char: '3',
  name: 'Barracks Armory Switch',
  renderProp25D(g, tx, ty, sx, sy, state) {
    renderSwitchProp('3', g, tx, ty, sx, sy, state);
  },
};

export const toggleLeverTile: TileDefinition = {
  ...baseSwitchProps,
  id: 'toggle_switch',
  char: '!',
  name: 'Æther Phase Toggle Lever',
  renderProp25D(g, tx, ty, sx, sy, state) {
    renderSwitchProp(`toggle:${tx},${ty}`, g, tx, ty, sx, sy, state);
  },
};
