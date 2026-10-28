/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getWeaponDefinition,
  isTrueWeaponEquipment,
  isTwoHandOnlyWeapon,
} from '../../database/equipment/weapons';
import { getOwnedWeaponCount, isEquipmentUnlocked } from '../../database/progression';
import { AREA_REGISTRY, REGION_REGISTRY } from '../../database/world';
import {
  getCanonicalRoomPersistenceKey,
  isRoomCacheLooted,
  markRoomCacheLooted,
} from '../../database/world/tiles/doodads_atlas';
import { OrionState } from '../../types';
import { ORION_ROOM_METADATA, ROOM_REGISTRY } from './roomLoader';

export { getCanonicalRoomPersistenceKey, isRoomCacheLooted, markRoomCacheLooted };

// [ORION-ANCHOR: CONTEXTUAL-LOOT-TABLES]
export const ENEMY_EQUIPMENT_DROP_POOLS: Record<
  string,
  { equipmentIds: string[]; baseChance: number }
> = {
  bog_crawler: {
    equipmentIds: ['s2_turbine_khopesh', 's4_whisper_blade', 'tig_edge', 'arc_conductor'],
    baseChance: 0.14,
  },
  bog_wurm: {
    equipmentIds: ['ls900_swordspear', 'wz450_sparkstrike', 'cl350_litany', 'grace_edge'],
    baseChance: 0.28,
  },
  orc_scout: {
    equipmentIds: ['sv12_viper', 'sv18_serpent', 's6_phantom_edge', 'm300_hasta'],
    baseChance: 0.2,
  },
  orc_warrior: {
    equipmentIds: ['b25_brushcutter', 'm350_mauler', 'siegebreaker', 'm450_pilum'],
    baseChance: 0.28,
  },
  percival_knight: {
    equipmentIds: ['aegis_charge_buckler', 'hl220_lightburst_lance', 'rs450_radiant_projector', 'tig_edge'],
    baseChance: 1.0,
  },
  tristan_knight: {
    equipmentIds: ['sr440_shadowfang', 'sv18_serpent', 's4_whisper_blade', 's6_phantom_edge'],
    baseChance: 1.0,
  },
  bors_knight: {
    equipmentIds: ['m450_pilum', 'm300_hasta', 'n55_gladius', 's2_turbine_khopesh'],
    baseChance: 1.0,
  },
  lady_of_the_lake: {
    equipmentIds: [
      'wz650_prism_lance',
      'wz200_manacore_staff',
      'hallowed_scepter',
      'grace_edge',
      'cl500_absolution',
    ],
    baseChance: 1.0,
  },
};

export interface ContextualLootQuery {
  enemyType?: string;
  roomCoord?: string;
  areaId?: string;
  regionId?: string;
  allowSecondCopy?: boolean;
}

/**
 * Resolves a contextual weapon or equipment drop across the hierarchy:
 * `Enemy Archetype -> Room Pool -> Area Pool -> Region Pool`.
 */
export function resolveContextualEquipmentDrop(
  state: OrionState,
  query: ContextualLootQuery
): string | undefined {
  const roomKey = query.roomCoord || state.room;
  const meta = ORION_ROOM_METADATA[roomKey];
  const areaId = query.areaId || meta?.areaId || state.areaId || 'm00_the_bog';
  const areaDef = AREA_REGISTRY[areaId];
  const regionId =
    query.regionId || meta?.regionId || state.regionId || areaDef?.regionId || 'region_belldor_outskirts';
  const regionDef = REGION_REGISTRY[regionId];

  const enemyPool = query.enemyType
    ? ENEMY_EQUIPMENT_DROP_POOLS[query.enemyType]?.equipmentIds || []
    : [];
  const roomPool = meta?.lootPool?.equipmentIds || ROOM_REGISTRY[roomKey]?.lootPool?.equipmentIds || [];
  const areaPool = areaDef?.lootPool?.equipmentIds || [];
  const regionPool = regionDef?.lootPool?.equipmentIds || [];

  const combinedOrderedPool = Array.from(
    new Set([
      ...enemyPool,
      ...roomPool,
      ...areaPool,
      ...regionPool,
    ])
  ).filter((id) => Boolean(getWeaponDefinition(id)));

  const firstCopyId = combinedOrderedPool.find((id) => !isEquipmentUnlocked(state, id));
  if (firstCopyId) {
    return firstCopyId;
  }

  if (query.allowSecondCopy !== false) {
    const secondCopyCandidates = Array.from(
      new Set([
        ...combinedOrderedPool,
        ...(state.equippedWeapons || []),
        ...(state.equipmentSlots?.unlockedEquipment || []),
      ])
    );
    const secondCopyId = secondCopyCandidates.find((id) => {
      const def = getWeaponDefinition(id);
      return (
        def &&
        isTrueWeaponEquipment(def) &&
        !isTwoHandOnlyWeapon(def) &&
        getOwnedWeaponCount(state, id) < 2
      );
    });
    if (secondCopyId) {
      return secondCopyId;
    }
  }

  return undefined;
}

export function resolveContextualGemPool(
  state: OrionState,
  enemyType?: string
): string[] {
  const gemPoolByEnemy: Record<string, string[]> = {
    bog_crawler: ['hematite', 'spinel', 'charoite'],
    bog_wurm: ['rubellite', 'kyanite', 'charoite'],
    orc_scout: ['carnelian', 'hematite', 'spinel'],
    orc_warrior: ['carnelian', 'hematite', 'spinel'],
    percival_knight: ['titanite', 'moonstone', 'demantoid'],
    tristan_knight: ['charoite', 'rubellite', 'moonstone'],
    bors_knight: ['titanite', 'moonstone', 'spinel'],
    lady_of_the_lake: ['moonstone', 'rubellite', 'demantoid', 'kyanite'],
  };
  if (enemyType && gemPoolByEnemy[enemyType]) {
    return gemPoolByEnemy[enemyType];
  }
  const meta = ORION_ROOM_METADATA[state.room];
  if (meta?.lootPool?.gemIds && meta.lootPool.gemIds.length > 0) {
    return meta.lootPool.gemIds;
  }
  const areaDef = AREA_REGISTRY[meta?.areaId || state.areaId || 'm00_the_bog'];
  if (areaDef?.lootPool?.gemIds && areaDef.lootPool.gemIds.length > 0) {
    return areaDef.lootPool.gemIds;
  }
  const regionDef = REGION_REGISTRY[meta?.regionId || state.regionId || 'region_belldor_outskirts'];
  if (regionDef?.lootPool?.gemIds && regionDef.lootPool.gemIds.length > 0) {
    return regionDef.lootPool.gemIds;
  }
  return ['moonstone', 'rubellite', 'hematite', 'spinel'];
}

export function evaluateCathedralDoorStatus(state: OrionState): {
  canOpen: boolean;
  reason: string;
} {
  const flags = state.flags || {};
  const fragments = Number(flags.grail_fragments || 0);
  const switches = Number(flags.dungeon_switches || 0);
  const trust = Number(flags.town_trust || 0);
  const requiredTrust = flags.bedivere_ring_choice === 'taken' ? 5 : 3;

  if (fragments >= 3) {
    return { canOpen: true, reason: 'BY FORCE (3/3 GRAIL FRAGMENTS)' };
  }
  if (switches >= 3) {
    return { canOpen: true, reason: 'BY EXPLORATION (3/3 HIDDEN SWITCHES)' };
  }
  if (trust >= requiredTrust) {
    return { canOpen: true, reason: `BY TOWN TRUST (${trust}/${requiredTrust})` };
  }

  return {
    canOpen: false,
    reason: `FORCE (${fragments}/3) · SWITCHES (${switches}/3) · TRUST (${trust}/${requiredTrust})`,
  };
}
