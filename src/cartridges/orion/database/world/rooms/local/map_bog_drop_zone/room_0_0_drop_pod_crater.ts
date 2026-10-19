/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomDefinition } from '../../../../../types';

export const room00DropPodCrater: RoomDefinition = {
  id: 'room_0_0_drop_pod_crater',
  scope: 'local',
  coord: '0,0',
  mapId: 'map_bog_drop_zone',
  areaId: 'm00_the_bog',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  title: 'Drop-Pod Crater',
  bannerTitle: 'M00: DROP-POD CRATER (SPAWN ANCHOR & WAYSTATION)',
  grid: [
    '##########',
    '#::,,,,..#',
    '#:P,.,P..#',
    '#::.D....#', // Drop-Pod Crater (White Spawn Anchor & Bog Waystation)
    '#,,......#',
    '#,,~~~~...', // Corrosive Aether (~), Grass (,), Ruins (:), Dirt (.) & East passage to 1,0
    '#..~~~~...',
    '#..,,,:::#',
    '####..####', // South passage to procedural global room (0,1)
  ],
};
