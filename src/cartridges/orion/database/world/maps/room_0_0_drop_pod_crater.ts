/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export const room00DropPodCrater: RoomDefinition = {
  coord: '0,0',
  areaId: 'm00_the_bog',
  title: 'Drop-Pod Crater',
  bannerTitle: 'M00: DROP-POD CRATER (SPAWN ANCHOR)',
  grid: [
    '##########',
    '#........#',
    '#..P..P..#',
    '#...D....#', // Drop-Pod Crater (White Spawn Anchor)
    '#........#',
    '#..~~~~...', // Corrosive Bog Water (~)
    '#..~~~~...',
    '#........#',
    '##########',
  ],
};
