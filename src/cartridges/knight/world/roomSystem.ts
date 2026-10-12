/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoomTheme = 'stone' | 'green' | 'ash' | 'ice' | 'ruins';

export interface RoomExits {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

export interface RoomTemplate {
  key: string;
  theme: RoomTheme;
  tiles: string[];
  exits: RoomExits;
  hazards?: Array<{ x: number; y: number; type: 'spikes' | 'lava' | 'water' }>;
  pickups?: Array<{ x: number; y: number; kind: string }>;
  enemies?: Array<{ x: number; y: number; type: string }>;
}

export function toRoomTemplate(
  key: string,
  tiles: string[],
  theme: RoomTheme = 'stone',
  exits: Partial<RoomExits> = {}
): RoomTemplate {
  return {
    key,
    theme,
    tiles,
    exits: {
      north: exits.north ?? false,
      south: exits.south ?? false,
      east: exits.east ?? false,
      west: exits.west ?? false,
    },
  };
}

export function isSolidTile(char: string): boolean {
  return char === '#' || char === 'L';
}

export function getTileRule(char: string): {
  solid: boolean;
  hazard?: 'spikes' | 'lava' | 'water';
  passable: boolean;
} {
  switch (char) {
    case '#':
      return { solid: true, passable: false };
    case 'L':
      return { solid: true, passable: false };
    case 'W':
      return { solid: false, hazard: 'water', passable: true };
    case 'S':
      return { solid: false, hazard: 'spikes', passable: true };
    case 'M':
      return { solid: true, passable: false };
    default:
      return { solid: false, passable: true };
  }
}

export function roomFromLegacy(
  key: string,
  tiles: string[],
  theme: RoomTheme = 'stone'
): RoomTemplate {
  return {
    key,
    theme,
    tiles,
    exits: { north: false, south: false, east: false, west: false },
  };
}

export function mergeRoomTemplate(
  room: RoomTemplate,
  partial: Partial<RoomTemplate>
): RoomTemplate {
  return {
    ...room,
    ...partial,
    exits: {
      ...room.exits,
      ...(partial.exits ?? {}),
    },
  };
}