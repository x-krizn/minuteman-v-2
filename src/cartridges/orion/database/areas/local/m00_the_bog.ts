/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaWikiDefinition } from '../../../types';

export const m00TheBogArea: AreaWikiDefinition = {
  id: 'm00_the_bog',
  name: 'M00 — The Bog',
  title: 'Drop-Pod Crater & Toxic Marshes',
  scope: 'local',
  regionId: 'region_belldor_outskirts',
  biomeId: 'belldor_bog',
  world: 'Belldor (Camelot)',
  recommendedLevels: 'Levels 1–2',
  description:
    'Murky marshlands of deep mud, shifting reeds, and ruined pylons. Teaches movement, weapon attacks, Booster Kit evasion, and the Three Defense Layers.',
  lore:
    'Following orbital drop-pod impact, the pilot mechs reinitialize in the toxic boglands outside Camelot. In the distance, cathedral towers flicker through the mist.',
  localMapIds: ['map_bog_drop_zone', 'map_deep_bog_maze'],
  globalMapIds: ['global_wetland_expanse_map'],
  connectedAreaIds: ['border_town_slums', 'orc_siege_encampment', 'global_shattered_wilds_area'],
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
};
