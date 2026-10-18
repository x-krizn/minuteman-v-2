/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition } from '../../../../../types';

export const orcSiegeEncampmentArea: AreaWikiDefinition = {
  id: 'orc_siege_encampment',
  name: 'Novarin Orc Encampment',
  title: 'War Horn Staging Grounds',
  scope: 'local',
  regionId: 'region_belldor_outskirts',
  biomeId: 'orc_siege_encampment',
  world: 'Belldor (Camelot)',
  recommendedLevels: 'Levels 3–5',
  description:
    'Fortified siege palisade south of the Bog Perimeter where Novarin orc raiders muster war horns against Border Town.',
  lore:
    'Cut off from Novarin byway drift, the orc warbands fortify the southern marsh ridge to raid Camelot’s border settlement for scrap and tuning shards.',
  localMapIds: ['map_orc_siege_camp'],
  globalMapIds: ['global_wetland_expanse_map'],
  connectedAreaIds: ['m00_the_bog', 'global_shattered_wilds_area'],
  spawnAnchor: { room: '3,1', x: 48, y: 40 },
  exitAnchor: { room: '3,1', x: 80, y: 16 },
  waystation: {
    id: 'ws_orc_encampment',
    name: 'Siege Palisade Waystation',
    regionId: 'region_belldor_outskirts',
    areaId: 'orc_siege_encampment',
    mapId: 'map_orc_siege_camp',
    room: '3,1',
    x: 48,
    y: 40,
    lore: 'Captured Camelot field waystation standing amidst Novarin siege engines.',
  },
};
