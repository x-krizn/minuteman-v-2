/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RegionDefinition } from '../../../../types';

export const regionBelldorOutskirts: RegionDefinition = {
  id: 'region_belldor_outskirts',
  name: 'Belldor — M00 The Bog & M01 Outskirts',
  title: 'M00 The Bog (LOCKED) & M01 Orc Encampment (UNDEFINED)',
  scope: 'local',
  world: 'Belldor (Camelot)',
  culture: 'Arthurian (Canon Original Story)',
  defaultBiomeId: 'belldor_bog',
  desyncStatus: 'Drifting',
  description:
    'The outer marshlands of Belldor housing the locked starting zone M00 The Bog (bog-v2.md) and the undefined M01 Orc Encampment (mapping-v0.md).',
  lore:
    'A drowned maze of fallen trees, temple/monastery ruins, and corrosive bog water bordering Camelot Border Town.',
  localAreaIds: ['m00_the_bog', 'm01_orc_encampment'],
  globalAreaIds: ['global_shattered_wilds_area'],
  connectedRegionIds: ['region_belldor_camelot_heartland', 'global_aether_sea_expanse'],
  lootPool: {
    equipmentIds: [
      's2_turbine_khopesh',
      'aegis_charge_buckler',
      'n55_gladius',
      'm300_hasta',
      'm450_pilum',
      'b25_brushcutter',
      'm350_mauler',
      'siegebreaker',
      'ls900_swordspear',
      'sv12_viper',
      's4_whisper_blade',
      'wz450_sparkstrike',
      'cl350_litany',
    ],
    gemIds: ['spinel', 'hematite', 'carnelian', 'moonstone', 'charoite', 'rubellite'],
    consumableIds: ['repair_kit', 'grail_water'],
    equipmentDropChance: 0.4,
  },
};
