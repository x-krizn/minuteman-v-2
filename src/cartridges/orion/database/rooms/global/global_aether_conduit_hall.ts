/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../types';

export const globalAetherConduitHallRoom: RoomDefinition = {
  id: 'global_aether_conduit_hall',
  scope: 'global',
  coord: 'global:aether_conduit_hall',
  areaId: 'global_aether_drift_corridor_area',
  biomeId: 'global_aether_caverns',
  title: 'Ætheric Tuning Conduit',
  bannerTitle: 'ÆTHERIC TUNING CONDUIT · DRIFT BRIDGE',
  doorDirs: ['N', 'S', 'E', 'W'],
  grid: [
    '####..####',
    '#..P..P..#',
    '#..~~~~..#',
    '#........#',
    '#..P..P..#',
    '..........',
    '..........',
    '#........#',
    '####..####',
  ],
};
