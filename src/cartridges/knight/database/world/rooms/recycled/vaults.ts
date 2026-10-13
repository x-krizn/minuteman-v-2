/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../types';

export const secretVault: RoomDefinition = {
  id: 'recycled_vault_secret',
  name: 'Hidden Alcove Vault',
  layout: [
    '##########',
    '#........#',
    '#........#',
    '#...##...#',
    '#........#',
    '#..####..#',
    '#........#',
    '#...oo...#',
    '####..####',
  ],
};

export const deadEndChamber: RoomDefinition = {
  id: 'recycled_vault_dead_end',
  name: 'Secluded Crypt Chamber',
  layout: [
    '##########',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#...oo....',
    '##########',
  ],
};
