/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapDefinition } from '../../../../../types';

export const mapBogDropZone: MapDefinition = {
  id: 'map_bog_drop_zone',
  name: 'Bog Drop-Pod Sector',
  title: 'Impact Crater & Fallen Scout Ridge',
  scope: 'local',
  areaId: 'm00_the_bog',
  biomeId: 'belldor_bog',
  description:
    'Local map unique to M00 — The Bog, assembled from the Drop-Pod Crater, Sir Bedivere’s Ridge, the Sunken Sinkhole, and procedural wetland flanks.',
  localRoomCoords: ['0,0', '1,0', '1,-1'],
  globalRoomSlots: [
    {
      coord: '0,1',
      globalRoomId: 'global_marsh_crossing',
      biomeId: 'belldor_bog',
      title: 'Southern Bog Shallows',
      bannerTitle: 'M00: SOUTHERN BOG SHALLOWS',
    },
    {
      coord: '1,1',
      globalRoomId: 'global_sinkhole_bridge',
      biomeId: 'belldor_bog',
      title: 'Mire Sinkhole Span',
      bannerTitle: 'M00: MIRE SINKHOLE SPAN',
    },
  ],
  connectedMapIds: ['map_deep_bog_maze', 'global_wetland_expanse_map'],
};
