/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CANONICAL_HARDWARE_CATALOG,
  findHardwareItemByNameOrId,
} from '../../database/equipment/chassis_hardware';
import {
  getWeaponDefinition,
  isTwoHandOnlyWeapon,
  WEAPON_REGISTRY,
} from '../../database/equipment/weapons';
import { getOwnedWeaponCount, isEquipmentUnlocked } from '../../database/progression';
import { AREA_REGISTRY, REGION_REGISTRY } from '../../database/world';
import {
  getCanonicalRoomPersistenceKey,
  isRoomCacheLooted,
  markRoomCacheLooted,
} from '../../database/world/global/biomes/general/tiles/doodads_atlas';
import { OrionState } from '../../types';
import { ORION_ROOM_METADATA, ROOM_REGISTRY } from './roomLoader';

export { getCanonicalRoomPersistenceKey, isRoomCacheLooted, markRoomCacheLooted };

// [ORION-ANCHOR: CONTEXTUAL-LOOT-TABLES]
/**
 * Exported const `ENEMY_EQUIPMENT_DROP_POOLS` (enemy equipment drop pools) in `worldPersistence.ts`.
 */
export const ENEMY_EQUIPMENT_DROP_POOLS: Record<
  string,
  { equipmentIds: string[]; baseChance: number }
> = {
  bog_crawler: {
    equipmentIds: [
      's2_turbine_khopesh',
      's4_whisper_wakizashi',
      's3_viper_partisan',
      'arc_conductor',
      'n20_rotary_bandolier',
      'n12_plumbata_pod',
      'sensory_a_mat_copper_capacitor',
      'sensory_b_inertial_gyro_telemetry',
      'optics_mat_quartz_vent_lens',
      'actuators_mat_torsion_counterweight',
      'legs_mat_baffled_radiator_strut',
    ],
    baseChance: 0.18,
  },
  bog_wurm: {
    equipmentIds: [
      'ls900_swordspear',
      'wz450_sparkstrike',
      'wz310_aether_spatha',
      'cl210_sanctum_mace',
      'cl150_ward_mote',
      'arc_conductor',
      'optics_mat_quartz_vent_lens',
      'sensory_a_mat_copper_capacitor',
      'legs_mat_baffled_radiator_strut',
    ],
    baseChance: 0.35,
  },
  orc_scout: {
    equipmentIds: [
      'sv12_viper',
      'sv22_stiletto_spatha',
      's6_phantom_messer',
      's5_whisper_cinquedea',
      'm300_cantabrian_recurve',
      'vx15_ghost_yebira',
      'vx10_eclipse_disc',
      'optics_mat_quartz_vent_lens',
      'sensory_b_inertial_gyro_telemetry',
      'actuators_mat_torsion_counterweight',
    ],
    baseChance: 0.22,
  },
  orc_warrior: {
    equipmentIds: [
      'b25_brushcutter',
      'm350_mauler',
      'b55_skjaldborg_axe',
      'b40_ripper_falx',
      'b80_doppelsoldner_greatsword',
      'm450_arbalest_greatbow',
      'ln1200_avalanche',
      'lg950_tomahawk',
      'actuators_mat_torsion_counterweight',
      'legs_mat_baffled_radiator_strut',
      'sensory_a_mat_copper_capacitor',
    ],
    baseChance: 0.3,
  },
  camelot_knight: {
    equipmentIds: [
      'n55_gladius',
      'n60_limitanei_spatha',
      'n75_praetorian_spatha',
      'ti110_aegis_buckler',
      'ti400_aegis_scutum',
      'hl110_dawnblade',
      'hl220_lightburst_lance',
      'actuators_mat_torsion_counterweight',
      'sensory_b_inertial_gyro_telemetry',
      'legs_mat_baffled_radiator_strut',
    ],
    baseChance: 0.36,
  },
  percival_knight: {
    equipmentIds: [
      'ti110_aegis_buckler',
      'hl110_dawnblade',
      'ti350_radiant_corona',
      'hl310_sarissa_pike',
      'hl220_lightburst_lance',
      'rs450_radiant_projector',
      's3_viper_partisan',
      'optics_aegis_radiant',
      'arms_aegis_radiant_vambraces',
      'reactor_ti_radiant_condenser',
    ],
    baseChance: 1.0,
  },
  tristan_knight: {
    equipmentIds: [
      'sr440_shadowfang',
      's8_ghost_katana',
      's4_whisper_wakizashi',
      'sv22_stiletto_spatha',
      's5_whisper_cinquedea',
      's6_phantom_messer',
      'vx10_eclipse_disc',
      'optics_veilsight',
      'reactor_vx_ether_turbine',
      'sensory_a_vx_phantom_net',
    ],
    baseChance: 1.0,
  },
  bors_knight: {
    equipmentIds: [
      'm450_arbalest_greatbow',
      'm10_bodkin_quiver',
      'n60_limitanei_spatha',
      'n12_plumbata_pod',
      'n55_gladius',
      'n20_rotary_bandolier',
      's9_turbine_odachi',
      'optics_be_foresight',
      'arms_be_siegebreaker_pauldrons',
      'reactor_pnsy_combat_boiler',
    ],
    baseChance: 1.0,
  },
  lady_of_the_lake: {
    equipmentIds: [
      'wz800_arclight_cannon',
      'wz650_prism_lance',
      'wz200_manacore_staff',
      'cl210_sanctum_mace',
      'cl150_ward_mote',
      'cl500_absolution',
      'optics_sanc_providence',
      'arms_sanc_seraphic_pinions',
      'reactor_sanc_chalice_well',
    ],
    baseChance: 1.0,
  },
};

/**
 * Type contract for `ContextualLootQuery` (contextual loot query) in `worldPersistence.ts`.
 */
export interface ContextualLootQuery {
  enemyType?: string;
  roomCoord?: string;
  areaId?: string;
  regionId?: string;
  allowSecondCopy?: boolean;
}

/**
 * Resolves a contextual weapon, auxiliary, armor, reactor, or sensor drop across the hierarchy:
 * `Enemy Archetype -> Room Pool -> Area Pool -> Region Pool -> Universal Catalog`.
 * Enforces Exterior Armor & Internal Sub-System Acquisition Rules:
 * - `forge_blueprint` exterior armor pieces (`Sets 12–15`) and `material_crafted` internal sub-modules NEVER drop directly as ready-to-wear gear.
 * - `starter_post_boss` exterior armor pieces (`Sets 0–5`) and `mech_unique_tech` internal sub-modules are discovered in Camelot post-boss chambers/caches (`!query.enemyType`), rather than direct enemy drop tables.
 * - `material_looted` internal sub-modules (`5` modules) drop from enemies and field salvage caches.
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

  const isDirectEnemyDrop = Boolean(query.enemyType);
  const isEligibleDropId = (id: string): boolean => {
    const wDef = getWeaponDefinition(id);
    if (wDef) {
      // Legendary folklore relics never drop from random loot pools
      return wDef.weaponTier !== 'legendary';
    }
    const hwDef = findHardwareItemByNameOrId(id);
    if (!hwDef) return false;
    // forge_blueprint exterior armor and material_crafted sub-modules never drop as ready-to-wear loot
    if (
      hwDef.acquisition === 'forge_blueprint' ||
      hwDef.subSystemOrigin === 'material_crafted' ||
      hwDef.origin === 'crafted'
    ) {
      return false;
    }
    // starter_post_boss exterior armor sets and mech_unique_tech sub-modules are placed in post-boss chambers/caches, not random enemy drops
    const isExteriorArmor =
      hwDef.slot === 'plating' || hwDef.slot === 'head' || hwDef.slot === 'arms';
    if (
      (isExteriorArmor || hwDef.subSystemOrigin === 'mech_unique_tech') &&
      isDirectEnemyDrop
    ) {
      return false;
    }
    return true;
  };

  const enemyPool = query.enemyType
    ? ENEMY_EQUIPMENT_DROP_POOLS[query.enemyType]?.equipmentIds || []
    : [];
  const roomPool = meta?.lootPool?.equipmentIds || ROOM_REGISTRY[roomKey]?.lootPool?.equipmentIds || [];
  const areaPool = areaDef?.lootPool?.equipmentIds || [];
  const regionPool = regionDef?.lootPool?.equipmentIds || [];
  const universalWeaponIds = Object.keys(WEAPON_REGISTRY);
  const universalHardwareIds = CANONICAL_HARDWARE_CATALOG.map((hw) => hw.id);

  const combinedOrderedPool = Array.from(
    new Set([
      ...enemyPool,
      ...roomPool,
      ...areaPool,
      ...regionPool,
      ...universalWeaponIds,
      ...universalHardwareIds,
    ])
  ).filter(isEligibleDropId);

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
    ).filter(isEligibleDropId);
    const secondCopyId = secondCopyCandidates.find((id) => {
      const wDef = getWeaponDefinition(id);
      const hwDef = findHardwareItemByNameOrId(id);
      if (wDef) {
        return !isTwoHandOnlyWeapon(wDef) && getOwnedWeaponCount(state, id) < 2;
      }
      if (hwDef) {
        return getOwnedWeaponCount(state, hwDef.id) < 2;
      }
      return false;
    });
    if (secondCopyId) {
      return secondCopyId;
    }
  }

  return undefined;
}

/**
 * Executes `resolveContextualGemPool` (resolve contextual gem pool) in `worldPersistence.ts`.
 */
export function resolveContextualGemPool(
  state: OrionState,
  enemyType?: string
): string[] {
  const gemPoolByEnemy: Record<string, string[]> = {
    bog_crawler: ['hematite', 'spinel', 'charoite'],
    bog_wurm: ['rubellite', 'kyanite', 'charoite'],
    orc_scout: ['carnelian', 'hematite', 'spinel'],
    orc_warrior: ['carnelian', 'hematite', 'spinel'],
    camelot_knight: ['titanite', 'moonstone', 'hematite'],
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

/**
 * Executes `evaluateCathedralDoorStatus` (evaluate cathedral door status) in `worldPersistence.ts`.
 */
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
