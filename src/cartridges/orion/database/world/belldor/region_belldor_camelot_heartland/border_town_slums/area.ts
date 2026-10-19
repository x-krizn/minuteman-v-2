/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition } from '../../../../../types';

export const borderTownSlumsArea: AreaWikiDefinition = {
  id: 'border_town_slums',
  name: 'Camelot Border Town',
  title: 'Market, Barracks & Cathedral Districts',
  scope: 'local',
  regionId: 'region_belldor_camelot_heartland',
  biomeId: 'camelot_border_town',
  world: 'Belldor (Camelot)',
  recommendedLevels: 'Levels 3–6',
  description:
    'Contested settlement of desynchronizing market stalls, the Barracks Quarter of Percival & Tristan, and the Cathedral Dungeon Door guarded by Bors.',
  lore:
    'Everyone here suffers from Grail Sickness. Factions fight over the road to the Camelot Waygate while Novarin orc raids strike without warning.',
  localMapIds: [
    'map_border_town_market',
    'map_border_town_barracks',
    'map_border_town_cathedral',
  ],
  globalMapIds: ['global_desync_outskirts_map'],
  connectedAreaIds: [
    'm00_the_bog',
    'camelot_waygate_depths',
    'global_shattered_wilds_area',
  ],
  spawnAnchor: { room: '4,0', x: 32, y: 96 },
  exitAnchor: { room: '5,0', x: 140, y: 96 },
  waystation: {
    id: 'ws_border_town_market',
    name: 'Border Town Market Waystation',
    regionId: 'region_belldor_camelot_heartland',
    areaId: 'border_town_slums',
    mapId: 'map_border_town_market',
    room: '4,0',
    x: 112,
    y: 72,
    lore: 'Flickering market spire that holds local alignment despite the town’s temporal drift.',
  },
};
