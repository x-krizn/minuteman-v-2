/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition } from '../../../../../types';

export const m00TheBogArea: AreaWikiDefinition = {
  id: 'm00_the_bog',
  name: 'M00 THE BOG',
  title: 'Starting Zone (bog-v2.md · LOCKED)',
  scope: 'local',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  world: 'Belldor (Camelot)',
  recommendedLevels: 'Levels 1–2',
  specStatus: 'LOCKED',
  docRef: 'bog-v2.md',
  description:
    'Starting zone of Belldor featuring a maze of downed trees, temple/monastery ruins, corrosive bog water zones, Sir Bedivere’s corpse, The Poe, and the secret Lady of the Lake arena.',
  lore:
    'Following orbital drop-pod impact, the pilot mechs reinitialize in the toxic boglands outside Camelot. Rescuing The Poe triggers Level 2 and unlocks the eastern exit toward Camelot Border Town.',
  localMapIds: ['map_bog_drop_zone', 'map_deep_bog_maze'],
  globalMapIds: ['global_wetland_expanse_map'],
  connectedAreaIds: ['camelot_border_town', 'm01_orc_encampment', 'global_shattered_wilds_area'],
  spawnAnchor: { room: '-3,0', x: 72, y: 72 },
  exitAnchor: { room: '3,0', x: 184, y: 96 },
  waystation: {
    id: 'ws_bog_first_campfire',
    name: 'Bog Outskirts Campfire',
    regionId: 'region_belldor_outskirts',
    areaId: 'm00_the_bog',
    mapId: 'map_bog_drop_zone',
    room: '0,0',
    x: 80,
    y: 72,
    lore: 'First sheltered campfire clearing three rooms east of the drop-pod crash site.',
  },
  zoneFeatures: [
    { name: 'Drop-Pod Cheat Room Door', status: 'LOCKED', coord: '-3,0' },
    { name: 'Downed trees trail', status: 'LOCKED', coord: '-2,0' },
    { name: 'First Campfire (Respawn & Transit)', status: 'LOCKED', coord: '0,0' },
    {
      name: 'The Poe & Poe Lantern (2-room branch)',
      detail: '5 rooms from Drop Pod; missable side branch',
      status: 'LOCKED',
      coord: '0,-2',
    },
    {
      name: "Bedivere's corpse",
      detail: 'En route to Main Bog; ring + list',
      status: 'LOCKED',
      coord: '1,0',
    },
    { name: 'Main Bog Entrance & Corrosive Water', status: 'LOCKED', coord: '3,0' },
    {
      name: 'Lady of the Lake arena',
      detail: 'Secret boss, return trigger',
      status: 'LOCKED',
      coord: '2,1',
    },
  ],
};
