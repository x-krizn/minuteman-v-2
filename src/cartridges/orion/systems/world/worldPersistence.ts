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
} from '../../database/world/tiles/doodads_atlas';
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
      's4_whisper_blade',
      'tig_edge',
      'arc_conductor',
      'utility_ichor_surge',
      'aux3_pnsy_rockweiler_buckler',
      'sensory_a_sonar_pulse_transceiver',
      'sensory_b_inertial_gyro_telemetry',
      'legs_pnsy_all_terrain_treads',
      'head_pnsy_field_visor',
      'head_s07_visor',
      'arms_s07_gauntlets',
    ],
    baseChance: 0.18,
  },
  bog_wurm: {
    equipmentIds: [
      'ls900_swordspear',
      'wz450_sparkstrike',
      'cl350_litany',
      'grace_edge',
      'utility_arclight_capacitor',
      'aux3_arc_prismatic_barrier',
      'aux4_arc_feedback_capacitor',
      'reactor_arc_mana_core',
      'plating_arc_conduit_weave',
      'sensory_a_aether_anomaly_scanner',
    ],
    baseChance: 0.35,
  },
  orc_scout: {
    equipmentIds: [
      'sv12_viper',
      'sv18_serpent',
      's6_phantom_edge',
      'm300_hasta',
      'utility_phantom_shroud',
      'aux3_vx_eclipse_cloak',
      'aux4_vx_phase_shift',
      'head_vx_stealth_optics',
      'arms_vx_whisper_servos',
      'legs_vx_shadow_striders',
      'sensory_b_threat_vector_predictor',
    ],
    baseChance: 0.22,
  },
  orc_warrior: {
    equipmentIds: [
      'b25_brushcutter',
      'm350_mauler',
      'siegebreaker',
      'm450_pilum',
      'utility_siege_brace',
      'aux3_rad_kinetic_recycling',
      'aux4_rad_ether_vapor',
      'plating_rad_juggernaut_carapace',
      'arms_rad_hydraulic_crushers',
      'legs_rad_piledriver_anchors',
      'reactor_rad_ichor_furnace',
    ],
    baseChance: 0.3,
  },
  percival_knight: {
    equipmentIds: [
      'aegis_charge_buckler',
      'hl220_lightburst_lance',
      'rs450_radiant_projector',
      'tig_edge',
      'utility_aegis_pulse',
      'aux3_ti_aegis_hardlight',
      'aux4_ti_radiant_sphere',
      'plating_ti_paladin_wardplate',
      'head_ti_halo_crest',
      'arms_ti_bastion_pauldrons',
      'reactor_ti_radiant_condenser',
    ],
    baseChance: 1.0,
  },
  tristan_knight: {
    equipmentIds: [
      'sr440_shadowfang',
      'sv18_serpent',
      's4_whisper_blade',
      's6_phantom_edge',
      'aux3_vx_eclipse_cloak',
      'aux4_vx_phase_shift',
      'plating_vx_nightveil_shroud',
      'reactor_vx_ether_turbine',
      'sensory_a_echolocation_array',
    ],
    baseChance: 1.0,
  },
  bors_knight: {
    equipmentIds: [
      'm450_pilum',
      'm300_hasta',
      'n55_gladius',
      's2_turbine_khopesh',
      'aux4_pnsy_rough_rider_booster',
      'aux3_rad_kinetic_recycling',
      'plating_pnsy_ironclad_rig',
      'arms_pnsy_heavy_actuators',
      'reactor_pnsy_combat_boiler',
    ],
    baseChance: 1.0,
  },
  lady_of_the_lake: {
    equipmentIds: [
      'wz650_prism_lance',
      'wz200_manacore_staff',
      'hallowed_scepter',
      'grace_edge',
      'cl500_absolution',
      'utility_sanctum_font',
      'aux3_sanc_restoration_field',
      'aux4_sanc_martyrdom_plating',
      'plating_sanc_reliquary_vestments',
      'head_sanc_seraph_crown',
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
  ).filter((id) => Boolean(getWeaponDefinition(id) || findHardwareItemByNameOrId(id)));

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
