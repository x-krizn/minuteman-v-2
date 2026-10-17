/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DamageFamily,
  DamageType,
  OrionActionSourceCategory,
  OrionState,
} from '../../types';
import { getWeaponDefinition } from '../weapons';

export interface OrionActionDescriptor {
  id: string;
  name: string;
  shortLabel: string;
  sourceCategory: OrionActionSourceCategory;
  sourceLabel: string;
  hardwareSlot?: 'Head' | 'Torso' | 'Arms' | 'Legs' | 'Reactor';
  weaponSkillSlot?: 1 | 2 | 3 | 4;
  description: string;
  tellDurationSec: number;
  actionDurationSec: number;
  cooldownSec: number;
  heatCost: number; // Negative values vent heat
  damage: number;
  damageType: DamageType;
  damageFamily: DamageFamily;
  range: number;
}

/**
 * Static registry of all assignable L & R actions across Weapon Skills,
 * Defensive/Hardware Modules (Head, Torso, Arms, Legs), and Reactor/Core Abilities.
 */
export const ASSIGNABLE_ACTION_CATALOG: OrionActionDescriptor[] = [
  // 1. WEAPON SKILLS (Dynamic per equipped weapon)
  {
    id: 'weapon_skill_1',
    name: 'Weapon Skill 1 (Default L)',
    shortLabel: 'WPN SKILL 1',
    sourceCategory: 'weapon',
    sourceLabel: 'Active Weapon [Slot 1]',
    weaponSkillSlot: 1,
    description: 'Executes the active weapon’s primary special skill (AP Slug / Execution Lunge).',
    tellDurationSec: 0.25,
    actionDurationSec: 0.35,
    cooldownSec: 4.0,
    heatCost: 15,
    damage: 18,
    damageType: 'Pierce',
    damageFamily: 'Kinetic',
    range: 95,
  },
  {
    id: 'weapon_skill_2',
    name: 'Weapon Skill 2 (Default R)',
    shortLabel: 'WPN SKILL 2',
    sourceCategory: 'weapon',
    sourceLabel: 'Active Weapon [Slot 2]',
    weaponSkillSlot: 2,
    description: 'Executes the active weapon’s tactical secondary skill (Concussion Grenade / Sweep Deflection).',
    tellDurationSec: 0.3,
    actionDurationSec: 0.4,
    cooldownSec: 5.5,
    heatCost: 18,
    damage: 24,
    damageType: 'Blast',
    damageFamily: 'Kinetic',
    range: 75,
  },
  {
    id: 'weapon_skill_3',
    name: 'Weapon Skill 3',
    shortLabel: 'WPN SKILL 3',
    sourceCategory: 'weapon',
    sourceLabel: 'Active Weapon [Slot 3]',
    weaponSkillSlot: 3,
    description: 'Executes the active weapon’s suppression/control skill (Suppression Arc / Hamstring Arc).',
    tellDurationSec: 0.18,
    actionDurationSec: 0.38,
    cooldownSec: 5.0,
    heatCost: 16,
    damage: 12,
    damageType: 'Pierce',
    damageFamily: 'Kinetic',
    range: 65,
  },
  {
    id: 'weapon_skill_4',
    name: 'Weapon Skill 4',
    shortLabel: 'WPN SKILL 4',
    sourceCategory: 'weapon',
    sourceLabel: 'Active Weapon [Slot 4]',
    weaponSkillSlot: 4,
    description: 'Executes the active weapon’s heavy finisher (Overcharge Discharge / Whirlwind Sever).',
    tellDurationSec: 0.4,
    actionDurationSec: 0.7,
    cooldownSec: 8.5,
    heatCost: 30,
    damage: 30,
    damageType: 'Beam',
    damageFamily: 'Energy',
    range: 85,
  },

  // 2. DEFENSIVE & SHIELD / HARDWARE MODULES (Head, Torso, Arms, Legs)
  {
    id: 'mod_head_optic_scan',
    name: 'Optic Target Painter',
    shortLabel: 'OPTIC PAINTER',
    sourceCategory: 'hardware',
    sourceLabel: 'Head Module [Optics]',
    hardwareSlot: 'Head',
    description: 'Sweeps the sector with targeting telemetry, revealing submerged threats and increasing damage taken by enemies by +25% for 6s.',
    tellDurationSec: 0.15,
    actionDurationSec: 0.25,
    cooldownSec: 7.0,
    heatCost: 10,
    damage: 0,
    damageType: 'Shock',
    damageFamily: 'Energy',
    range: 120,
  },
  {
    id: 'mod_torso_reactive_burst',
    name: 'Ablative Reactive Burst',
    shortLabel: 'REACTIVE ARMOR',
    sourceCategory: 'hardware',
    sourceLabel: 'Torso Module [Plating]',
    hardwareSlot: 'Torso',
    description: 'Detonates reactive counter-plates to restore +22 Armor Durability and stagger nearby attackers with an Impact wave.',
    tellDurationSec: 0.18,
    actionDurationSec: 0.3,
    cooldownSec: 8.0,
    heatCost: 14,
    damage: 14,
    damageType: 'Impact',
    damageFamily: 'Kinetic',
    range: 36,
  },
  {
    id: 'mod_arms_shock_grapple',
    name: 'Arc Tether Shot',
    shortLabel: 'ARC TETHER',
    sourceCategory: 'hardware',
    sourceLabel: 'Arms Module [Sidearm]',
    hardwareSlot: 'Arms',
    description: 'Fires a high-velocity electromagnetic tether bolt that deals 20 Shock damage, overloads Energy Shields, and stuns for 1.2s.',
    tellDurationSec: 0.2,
    actionDurationSec: 0.3,
    cooldownSec: 5.5,
    heatCost: 14,
    damage: 20,
    damageType: 'Shock',
    damageFamily: 'Energy',
    range: 95,
  },
  {
    id: 'mod_legs_seismic_stomp',
    name: 'Seismic Thruster Slam',
    shortLabel: 'SEISMIC SLAM',
    sourceCategory: 'hardware',
    sourceLabel: 'Legs Module [Booster]',
    hardwareSlot: 'Legs',
    description: 'Vector-pulses leg thrusters into the ground, dealing 22 Impact damage and stunning enemies within 38px.',
    tellDurationSec: 0.22,
    actionDurationSec: 0.35,
    cooldownSec: 6.0,
    heatCost: 16,
    damage: 22,
    damageType: 'Impact',
    damageFamily: 'Kinetic',
    range: 38,
  },

  // 3. REACTOR & CORE ABILITIES
  {
    id: 'reactor_thermal_vent',
    name: 'Thermal Vent Purge',
    shortLabel: 'VENT HEAT',
    sourceCategory: 'reactor',
    sourceLabel: 'Reactor Core [Thermal]',
    hardwareSlot: 'Reactor',
    description: 'Opens emergency radiator baffles to immediately purge -45 Reactor Heat while scorching adjacent hostiles for 14 Burn damage.',
    tellDurationSec: 0.15,
    actionDurationSec: 0.3,
    cooldownSec: 6.5,
    heatCost: -45,
    damage: 14,
    damageType: 'Burn',
    damageFamily: 'Energy',
    range: 34,
  },
  {
    id: 'reactor_overdrive',
    name: 'Reactor Overdrive',
    shortLabel: 'OVERDRIVE',
    sourceCategory: 'reactor',
    sourceLabel: 'Reactor Core [Output]',
    hardwareSlot: 'Reactor',
    description: 'Surges reactor output (+20 Heat) to grant +30% weapon and skill damage and rapid reload recovery for 6.0s.',
    tellDurationSec: 0.18,
    actionDurationSec: 0.28,
    cooldownSec: 10.0,
    heatCost: 20,
    damage: 0,
    damageType: 'Beam',
    damageFamily: 'Energy',
    range: 0,
  },
  {
    id: 'reactor_aegis_pulse',
    name: 'Aegis Barrier Pulse',
    shortLabel: 'AEGIS PULSE',
    sourceCategory: 'reactor',
    sourceLabel: 'Reactor Core [Shields]',
    hardwareSlot: 'Reactor',
    description: 'Channels reactor energy (+18 Heat) into Layer 1 Shields, restoring +35 Shield Capacity and clearing Shield Overload.',
    tellDurationSec: 0.16,
    actionDurationSec: 0.28,
    cooldownSec: 7.5,
    heatCost: 18,
    damage: 0,
    damageType: 'Shock',
    damageFamily: 'Energy',
    range: 0,
  },
];

/**
 * Resolve any assignable action ID into its concrete action descriptor for the pilot's current state
 * (dynamically binding weapon_skill_1..4 to the currently active weapon's moveset).
 */
export function getResolvedActionDescriptor(
  state: OrionState,
  actionId: string
): OrionActionDescriptor {
  const base =
    ASSIGNABLE_ACTION_CATALOG.find((a) => a.id === actionId) ||
    ASSIGNABLE_ACTION_CATALOG[0];

  if (base.sourceCategory === 'weapon' && base.weaponSkillSlot) {
    const currentWeaponId =
      state.equippedWeapons[state.activeWeaponIndex] || 'gladius_boltcaster';
    const weapon = getWeaponDefinition(currentWeaponId);
    const move = weapon?.moveset[base.weaponSkillSlot];
    if (move && weapon) {
      return {
        ...base,
        name: move.name,
        shortLabel: move.name.toUpperCase(),
        sourceLabel: `${weapon.name} [Skill ${base.weaponSkillSlot}]`,
        description: move.description,
        tellDurationSec: move.tellDurationSec,
        actionDurationSec: move.actionDurationSec,
        cooldownSec: move.cooldownSec,
        heatCost: move.heatCost,
        damage: move.damage,
        damageType: move.damageType,
        damageFamily: move.damageFamily,
        range: move.range,
      };
    }
  }

  return base;
}
