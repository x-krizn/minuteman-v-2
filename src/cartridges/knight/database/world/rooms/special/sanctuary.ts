/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../types';

/**
 * Canonical database definition for `sanctuaryRoom` (`Sanctuary of the Hearth`, id `'special_sanctuary'`) — A peaceful haven safe from roaming fiends, where flickering candles ward off gloom..
 */
export const sanctuaryRoom: RoomDefinition = {
  id: 'special_sanctuary',
  name: 'Sanctuary of the Hearth',
  description: 'A peaceful haven safe from roaming fiends, where flickering candles ward off gloom.',
  layout: [
    '##########',
    '#........#',
    '#........#',
    '#........#',
    '#..ooo...#',
    '#..###...#',
    '#.........',
    '#.........',
    '##########',
  ],
};
