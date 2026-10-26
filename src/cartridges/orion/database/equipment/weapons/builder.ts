/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DamageFamily,
  DamageType,
  WeaponDefinition,
  WeaponWeightClass,
} from '../../../types';
import {
  BOLT_CASTER_STRIP_BASE64,
  BUCKLER_SHIELD_STRIP_BASE64,
  SHOTEL_STRIP_BASE64,
} from './base_sprites';

export function getDamageFamily(dt: DamageType): DamageFamily {
  return dt === 'Beam' || dt === 'Pulse' || dt === 'Wave' ? 'Energy' : 'Kinetic';
}

export interface MagitechWeaponSkillSeed {
  name: string;
  desc: string;
  dmg?: number;
  cd?: number;
  heat?: number;
  dt?: DamageType;
  isBlock?: boolean;
}

export interface MagitechWeaponSeed {
  id: string;
  name: string;
  weaponClass: string;
  primaryDamageType: DamageType;
  adaptiveDamageTypes?: [DamageType, DamageType];
  supportPulseOnHit?: {
    shieldRestore?: number;
    armorRestore?: number;
    heatVent?: number;
  };
  weightClass: WeaponWeightClass;
  skillCount?: number;
  loadoutSlots: string[];
  equipmentRole: 'ranged' | 'melee' | 'shield';
  handing?: '1-hand' | '2-hand' | 'off-hand-only';
  canBlock?: boolean;
  passiveShieldBonus?: number;
  bladeTrailColor: string;
  identity: string;
  lore: string;
  shotsPerChain: number;
  damagePerShot: number;
  chainDurationSec: number;
  reloadDurationSec: number;
  range: number;
  customStripBase64?: string;
  isPlaceholderAsset?: boolean;
  futureAssetPlanned?: string;
  skills: [
    { name: string; desc: string },
    { name: string; dmg: number; cd: number; heat: number; dt?: DamageType; desc: string },
    { name: string; dmg: number; cd: number; heat: number; dt?: DamageType; desc: string },
    { name: string; dmg: number; cd: number; heat: number; dt?: DamageType; isBlock?: boolean; desc: string },
    { name: string; dmg: number; cd: number; heat: number; dt?: DamageType; desc: string }
  ];
}

export function buildMagitechWeapon(seed: MagitechWeaponSeed): WeaponDefinition {
  const strip =
    seed.customStripBase64 ||
    (seed.equipmentRole === 'shield'
      ? BUCKLER_SHIELD_STRIP_BASE64
      : seed.equipmentRole === 'melee'
        ? SHOTEL_STRIP_BASE64
        : BOLT_CASTER_STRIP_BASE64);

  const dt0 = seed.primaryDamageType;
  const dt1 = seed.skills[1].dt || dt0;
  const dt2 = seed.skills[2].dt || dt0;
  const dt3 = seed.skills[3].dt || (seed.canBlock ? 'Impact' : dt0);
  const dt4 = seed.skills[4].dt || dt0;

  const isPlch = seed.isPlaceholderAsset !== undefined ? seed.isPlaceholderAsset : true;
  const futurePlanned =
    seed.futureAssetPlanned ||
    `Dedicated custom ${seed.weaponClass} (${seed.name}) sprite strip & hardpoint render planned. Currently using recycled ${
      seed.equipmentRole === 'shield'
        ? 'buckler shield'
        : seed.equipmentRole === 'melee'
          ? 'blade'
          : 'bolter'
    } asset.`;

  return {
    id: seed.id,
    name: seed.name,
    class: `${seed.weaponClass} (${seed.loadoutSlots.join(' / ')})`,
    weaponClass: seed.weaponClass,
    skillCount: seed.skillCount,
    loadoutSlots: seed.loadoutSlots,
    adaptiveDamageTypes: seed.adaptiveDamageTypes,
    supportPulseOnHit: seed.supportPulseOnHit,
    equipmentRole: seed.equipmentRole,
    handing: seed.handing || (seed.weightClass === 'heavy' ? '2-hand' : '1-hand'),
    weightClass: seed.weightClass,
    canBlock: Boolean(seed.canBlock || seed.equipmentRole === 'melee' || seed.equipmentRole === 'shield'),
    passiveShieldBonus: seed.passiveShieldBonus,
    bladeTrailColor: seed.bladeTrailColor,
    description: `${seed.identity}. Canonical ${seed.weaponClass} (${seed.weightClass.toUpperCase()} load, ${seed.loadoutSlots.join(', ')}).`,
    lore: seed.lore,
    shotsPerChain: seed.shotsPerChain,
    damagePerShot: seed.damagePerShot,
    chainDurationSec: seed.chainDurationSec,
    reloadDurationSec: seed.reloadDurationSec,
    primaryDamageType: seed.primaryDamageType,
    variantStripBase64: strip,
    hardpointSprite: {
      base64: strip,
      cellWidth: 16,
      cellHeight: 16,
      col: 0,
      row: 0,
      renderWidth: 14,
      renderHeight: 14,
      anchor: 'center',
      orientFromEast: true,
    },
    iconSprite: {
      base64: strip,
      cellWidth: 16,
      cellHeight: 16,
      col: 0,
      row: 0,
      anchor: 'center',
    },
    isPlaceholderAsset: isPlch,
    futureAssetPlanned: futurePlanned,
    moveset: [
      {
        slot: 0,
        name: seed.skills[0].name,
        damageType: dt0,
        damageFamily: getDamageFamily(dt0),
        damage: seed.damagePerShot,
        tellDurationSec: seed.equipmentRole === 'melee' ? 0.08 : 0.09,
        actionDurationSec: seed.chainDurationSec,
        cooldownSec: 0,
        isChain: true,
        reloadDurationSec: seed.reloadDurationSec,
        heatCost: seed.weightClass === 'heavy' ? 5 : seed.weightClass === 'medium' ? 3 : 2,
        range: seed.range,
        description: seed.skills[0].desc,
      },
      {
        slot: 1,
        name: seed.skills[1].name,
        damageType: dt1,
        damageFamily: getDamageFamily(dt1),
        damage: seed.skills[1].dmg,
        tellDurationSec: 0.22,
        actionDurationSec: 0.35,
        cooldownSec: seed.skills[1].cd,
        heatCost: seed.skills[1].heat,
        range: Math.round(seed.range * 1.15),
        description: seed.skills[1].desc,
      },
      {
        slot: 2,
        name: seed.skills[2].name,
        damageType: dt2,
        damageFamily: getDamageFamily(dt2),
        damage: seed.skills[2].dmg,
        tellDurationSec: 0.28,
        actionDurationSec: 0.4,
        cooldownSec: seed.skills[2].cd,
        heatCost: seed.skills[2].heat,
        range: seed.range,
        description: seed.skills[2].desc,
      },
      {
        slot: 3,
        name: seed.skills[3].name,
        damageType: dt3,
        damageFamily: getDamageFamily(dt3),
        damage: seed.skills[3].dmg,
        tellDurationSec: seed.skills[3].isBlock ? 0.04 : 0.2,
        actionDurationSec: seed.skills[3].isBlock ? 0.2 : 0.38,
        cooldownSec: seed.skills[3].isBlock ? 0 : seed.skills[3].cd,
        isBlock: Boolean(seed.skills[3].isBlock),
        heatCost: seed.skills[3].heat,
        range: seed.skills[3].isBlock ? 24 : Math.round(seed.range * 0.9),
        description: seed.skills[3].desc,
      },
      {
        slot: 4,
        name: seed.skills[4].name,
        damageType: dt4,
        damageFamily: getDamageFamily(dt4),
        damage: seed.skills[4].dmg,
        tellDurationSec: 0.38,
        actionDurationSec: 0.65,
        cooldownSec: seed.skills[4].cd,
        heatCost: seed.skills[4].heat,
        range: Math.round(seed.range * 1.1),
        description: seed.skills[4].desc,
      },
    ],
  };
}
