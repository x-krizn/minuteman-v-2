/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../types';

const roomModules = import.meta.glob('./*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const recycledRooms: RoomDefinition[] = [];

for (const [path, mod] of Object.entries(roomModules)) {
  if (path.endsWith('index.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'id' in exp &&
      'layout' in exp
    ) {
      recycledRooms.push(exp as RoomDefinition);
    }
  }
}

export const RECYCLED_ROOMS = recycledRooms;

export function getRandomRecycledRoom(): RoomDefinition | undefined {
  if (!recycledRooms.length) return undefined;
  return recycledRooms[Math.floor(Math.random() * recycledRooms.length)];
}
