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
  spawnAnchor: { room: '0,0', x: 48, y: 72 },
  exitAnchor: { room: '3,0', x: 120, y: 96 },
  waystation: {
    id: 'ws_bog_drop_pod',
    name: 'M00 Drop-Pod Beacon',
    regionId: 'region_belldor_outskirts',
    areaId: 'm00_the_bog',
    mapId: 'map_bog_drop_zone',
    room: '0,0',
    x: 56,
    y: 72,
    lore: 'Orbital drop-pod telemetry anchor calibrated to your pilot ætheric signature.',
  },
  zoneFeatures: [
    { name: 'Maze of downed trees', status: 'LOCKED', coord: '0,0' },
    { name: 'Temple/monastery ruins', status: 'LOCKED', coord: '1,0' },
    { name: 'Corrosive bog water zones', status: 'LOCKED', coord: '2,0' },
    {
      name: 'Trap systems',
      detail: 'UNDEFINED (OD-BOG-01)',
      status: 'UNDEFINED',
      openDesignId: 'OD-BOG-01',
    },
    {
      name: 'The Poe',
      detail: 'Rescuable NPC; triggers L2, unlocks exit',
      status: 'LOCKED',
      coord: '3,0',
    },
    {
      name: "Bedivere's corpse",
      detail: 'En route to exit; ring + list',
      status: 'LOCKED',
      coord: '1,0',
    },
    {
      name: 'Lady of the Lake arena',
      detail: 'Secret boss, return trigger',
      status: 'LOCKED',
      coord: '2,1',
    },
  ],
};
