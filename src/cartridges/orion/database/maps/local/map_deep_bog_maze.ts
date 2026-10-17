/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../../../types';

export const mapDeepBogMaze: MapDefinition = {
  id: 'map_deep_bog_maze',
  name: 'Deep Bog Maze',
  title: 'Poe’s Lantern & Perimeter Gate',
  scope: 'local',
  areaId: 'm00_the_bog',
  biomeId: 'belldor_bog',
  description:
    'Local map unique to M00 — The Bog, housing the Poe Spirit, the submerged Bog Wurm, and the Perimeter Gateway.',
  localRoomCoords: ['2,0', '3,0'],
  globalRoomSlots: [
    {
      coord: '2,-1',
      globalRoomId: 'global_marsh_crossing',
      biomeId: 'belldor_bog',
      title: 'Northern Wurm Backwater',
      bannerTitle: 'M00: NORTHERN WURM BACKWATER',
    },
    {
      coord: '2,1',
      globalRoomId: 'global_orc_outpost_corridor',
      biomeId: 'orc_siege_encampment',
      title: 'Raider Mud Trail',
      bannerTitle: 'RAIDER MUD TRAIL · ENCAMPMENT APPROACH',
    },
  ],
  connectedMapIds: ['map_bog_drop_zone', 'map_orc_siege_camp', 'map_border_town_market'],
};
