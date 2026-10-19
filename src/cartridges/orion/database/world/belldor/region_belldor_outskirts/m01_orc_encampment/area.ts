/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition } from '../../../../../types';

export const m01OrcEncampmentArea: AreaWikiDefinition = {
  id: 'm01_orc_encampment',
  name: 'M01 ORC ENCAMPMENT',
  title: 'War Horn Staging Grounds (mapping-v0.md · UNDEFINED)',
  scope: 'local',
  regionId: 'region_belldor_outskirts',
  biomeId: 'orc_siege_encampment',
  world: 'Belldor (Camelot)',
  recommendedLevels: 'Levels 3–5',
  specStatus: 'UNDEFINED',
  docRef: 'mapping-v0.md',
  description:
    'Fortified siege palisade south of the Bog Perimeter where Novarin orc raiders muster war horns against Border Town. Currently UNDEFINED in mapping-v0.md and veiled behind Aether Fog.',
  lore:
    'Cut off from Novarin byway drift, the orc warbands fortify the southern marsh ridge to raid Camelot’s border settlement for scrap and tuning shards.',
  localMapIds: ['map_orc_siege_camp'],
  globalMapIds: ['global_wetland_expanse_map'],
  connectedAreaIds: ['m00_the_bog', 'global_shattered_wilds_area'],
  spawnAnchor: { room: '3,1', x: 48, y: 40 },
  exitAnchor: { room: '3,1', x: 80, y: 16 },
  waystation: {
    id: 'ws_orc_encampment',
    name: 'M01 Siege Palisade Waystation (Sealed)',
    regionId: 'region_belldor_outskirts',
    areaId: 'm01_orc_encampment',
    mapId: 'map_orc_siege_camp',
    room: '3,1',
    x: 48,
    y: 40,
    lore: 'Captured Camelot field waystation veiled in impenetrable Aether Fog until mapping-v0.md is finalized.',
  },
  zoneFeatures: [
    {
      name: 'M01 ORC ENCAMPMENT',
      detail: 'UNDEFINED (mapping-v0.md)',
      status: 'UNDEFINED',
      coord: '3,1',
    },
  ],
};
