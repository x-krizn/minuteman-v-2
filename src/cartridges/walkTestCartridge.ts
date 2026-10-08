/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cartridge, CartridgeSurface } from '../types/cartridge';
import { GameInput } from '../types/input';

export const KNIGHT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAASCAYAAAAQeC39AAABhElEQVRIDa2WMZLCMAxFyQ7HgXq5AUPDHei4ABXNNltxATruQLOzN9hbZSOPpZEVybY8ygxj2ZGe9WUlZNrUr1ncnsTcM41idXFqic5/v19F4odjmtdiCn82iWJ1c6wkC0AWtAGhA+KiWCEcOG76LYKSjSM7iR6TOMBEBo49gOxDHIjFeBwlZysXcH67v9BcTumSTosWnEYAa9YYiygzE60VCwhGPr4vaGoxeE+OEawWA/Zc5WSemMwwz1cAw69nOYJlMj56MmA+0OdRVwTLZFiKVwGn8zUJ+nk/YbTiNNERLDfDbEUUomXqXYtgeRlW5VcVYmKsGOZSmBEsN6P7xAZakNTJag+woJizwaF9uGEK2+0/yY+96mnNY0SxOAf2zwVSU2m+FUGUrJRK6liMZLW2awpDQBZX63V05SP9uXJRA6zUhp7OaQqDT5nakXMVNTuCAwXh4vJnllps8xmTSQ488BKR5qxInrfrtMSRABCXRal7wGINTqCGnwnPN6I4fJ8m8x+NOLZlMyexbAAAAABJRU5ErkJggg==';

export function createWalkTestCartridge(): Cartridge {
  const SPEED = 40;
  const FACES_RIGHT = true;
  let x = 0;
  let y = 0;
  let t = 0;
  let flip = false;

  return {
    id: 'walk',
    name: 'WALK TEST',
    version: '0.1',
    description: 'Proves sprite strip loading and 3-frame animated walk cycle.',

    assets: {
      knight: {
        src: KNIGHT_PNG,
        cw: 18,
        ch: 18,
        frames: 3,
        fps: 6,
        ax: 9,
        ay: 18,
      },
    },

    init: (surface: CartridgeSurface) => {
      x = surface.width / 2;
      y = surface.height / 2 + 9;
      t = 0;
      flip = false;
    },

    update: (input: GameInput, dt: number) => {
      const sx = input.stick.x;
      const sy = input.stick.y;
      x += sx * SPEED * dt;
      y += sy * SPEED * dt;
      if (sx !== 0 || sy !== 0) {
        t += dt;
      } else {
        t = 0;
      }

      if (sx < -0.1) flip = FACES_RIGHT;
      else if (sx > 0.1) flip = !FACES_RIGHT;
    },

    draw: (surface: CartridgeSurface) => {
      const g = surface.g;
      const knight = surface.assets.knight;
      x = Math.max(9, Math.min(surface.width - 9, x));
      y = Math.max(18, Math.min(surface.height, y));

      g.fillStyle = '#0f300f';
      g.fillRect(0, 0, surface.width, surface.height);

      if (knight) {
        knight.draw(g, knight.frameAt(t), x, y, flip);
      }
    },
  };
}
