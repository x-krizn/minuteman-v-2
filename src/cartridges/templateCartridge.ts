/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cartridge, CartridgeSurface } from '../types/cartridge';
import { GameInput } from '../types/input';

export function createTemplateCartridge(): Cartridge {
  let x = 0;
  let y = 0;
  let big = false;
  const SPEED = 60; // pixels per second

  return {
    id: 'template',
    name: 'TEMPLATE',
    version: '0.1',
    description: 'Minimal cartridge: analog movement and size toggle with A.',

    init: (surface: CartridgeSurface) => {
      x = surface.width / 2;
      y = surface.height / 2;
      big = false;
    },

    update: (input: GameInput, dt: number) => {
      x += input.stick.x * SPEED * dt;
      y += input.stick.y * SPEED * dt;
      if (input.pressed.a) {
        big = !big;
      }
    },

    draw: (surface: CartridgeSurface) => {
      const g = surface.g;
      const size = big ? 24 : 12;
      const half = size / 2;
      x = Math.max(half, Math.min(surface.width - half, x));
      y = Math.max(half, Math.min(surface.height - half, y));

      g.fillStyle = '#0f300f';
      g.fillRect(0, 0, surface.width, surface.height);
      g.fillStyle = '#0f3';
      g.fillRect(Math.round(x - half), Math.round(y - half), size, size);
    },
  };
}
