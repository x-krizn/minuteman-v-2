/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor, TraitLine } from '../../types';

/**
 * Tactical Utility Catalog (§4.2 Utility Slot — Action 6, unlocked at Level 6: Border Town Complete).
 * Any pilot can equip any Tactical Utility system regardless of starting kit.
 */
export interface ClassUtilityItemDefinition {
  id: string;
  canonicalId?: string;
  name: string;
  shortLabel: string;
  utilityType: string;
  traitLine: TraitLine;
  frameModel: string;
  description: string;
  tellDurationSec: number;
  actionDurationSec: number;
  cooldownSec: number;
  heatCost: number;
  shieldRestore: number;
  armorRestore: number;
  energyRestore: number;
  grantsOverdriveSec?: number;
  grantsOpticMarkSec?: number;
}

export const CLASS_UTILITY_CATALOG: ClassUtilityItemDefinition[] = [
  {
    id: 'utility_ichor_surge',
    canonicalId: 'utility_d0g_repair_drone',
    name: 'PNSY D-0g Repair Drone',
    shortLabel: 'D-0G DRONE',
    utilityType: 'Utility · Repair Drone',
    traitLine: 'Warrior',
    frameModel: 'PNSY W416',
    description:
      'Bay-launched autonomous repair drone (Action 6): Restores +35 Layer 2 Armor Durability, +15 Shield Capacity, and engages Overdrive servos for 3.5s.',
    tellDurationSec: 0.14,
    actionDurationSec: 0.25,
    cooldownSec: 9.0,
    heatCost: 12,
    shieldRestore: 15,
    armorRestore: 35,
    energyRestore: 15,
    grantsOverdriveSec: 3.5,
  },
  {
    id: 'utility_siege_brace',
    canonicalId: 'utility_r463_fathomless',
    name: 'RAD R463 Fathomless System',
    shortLabel: 'FATHOMLESS SYS',
    utilityType: 'Self-Repair · Subsystem',
    traitLine: 'Marauder',
    frameModel: 'RAD HAU',
    description:
      'Excess energy repairs subsystems and armor (Action 6): Restores +55 Armor Durability and +10 Shield Capacity while venting -20 Reactor Heat.',
    tellDurationSec: 0.18,
    actionDurationSec: 0.3,
    cooldownSec: 10.0,
    heatCost: -20,
    shieldRestore: 10,
    armorRestore: 55,
    energyRestore: 10,
  },
  {
    id: 'utility_aegis_pulse',
    canonicalId: 'utility_lightwell_recovery',
    name: 'TI Lightwell Recovery System',
    shortLabel: 'LIGHTWELL SYS',
    utilityType: 'Self-Repair · Shield & Core',
    traitLine: 'Guardian',
    frameModel: 'Trinity DE-14',
    description:
      'Converts excess reactor energy to subsystem and shield repair (Action 6): Restores +50 Layer 1 Shield Capacity, clears Shield Overload, and mends +30 Armor Durability.',
    tellDurationSec: 0.15,
    actionDurationSec: 0.26,
    cooldownSec: 8.5,
    heatCost: 10,
    shieldRestore: 50,
    armorRestore: 30,
    energyRestore: 20,
  },
  {
    id: 'utility_phantom_shroud',
    canonicalId: 'utility_smoke_dispersal',
    name: 'VX Smoke Dispersal System',
    shortLabel: 'SMOKE DISPERSAL',
    utilityType: 'Utility · Thermal Masking',
    traitLine: 'Rogue',
    frameModel: 'VX Phantom',
    description:
      'Obscurement canisters and thermal masking (Action 6): Purges -25 Heat, restores +30 Shield Capacity & +30 Energy, and marks hostiles with Optic Telemetry for 5.0s.',
    tellDurationSec: 0.12,
    actionDurationSec: 0.22,
    cooldownSec: 8.0,
    heatCost: -25,
    shieldRestore: 30,
    armorRestore: 20,
    energyRestore: 30,
    grantsOpticMarkSec: 5.0,
  },
  {
    id: 'utility_arclight_capacitor',
    canonicalId: 'utility_rift_anchor',
    name: 'ARC Rift Anchor',
    shortLabel: 'RIFT ANCHOR',
    utilityType: 'Mobility · Phase Escape',
    traitLine: 'Wizard',
    frameModel: 'ARC Arclight',
    description:
      'Short-range phase anchor & capacitor siphon (Action 6): Vents -35 Reactor Heat into +45 Shield Capacity, +35 Energy, and 4.0s of Overdrive output.',
    tellDurationSec: 0.14,
    actionDurationSec: 0.25,
    cooldownSec: 9.0,
    heatCost: -35,
    shieldRestore: 45,
    armorRestore: 15,
    energyRestore: 35,
    grantsOverdriveSec: 4.0,
  },
  {
    id: 'utility_sanctum_font',
    canonicalId: 'utility_radiant_ward',
    name: 'SANC Radiant Ward Projector',
    shortLabel: 'RADIANT WARD',
    utilityType: 'Barrier · Status Ward',
    traitLine: 'Cleric',
    frameModel: 'SANC Sanctum',
    description:
      'Deployable barrier absorbs status effects and damage (Action 6): Restores +40 Shield Capacity, +40 Armor Durability, and +25 Energy.',
    tellDurationSec: 0.16,
    actionDurationSec: 0.28,
    cooldownSec: 9.5,
    heatCost: 8,
    shieldRestore: 40,
    armorRestore: 40,
    energyRestore: 25,
  },
];

export function getDefaultClassUtilityId(traitLine: TraitLine): string {
  const found = CLASS_UTILITY_CATALOG.find((u) => u.traitLine === traitLine);
  return found ? found.id : 'utility_ichor_surge';
}

export function getClassUtilityDefinition(
  utilityId: string | null | undefined,
  fallbackTrait?: TraitLine
): ClassUtilityItemDefinition {
  const found = CLASS_UTILITY_CATALOG.find(
    (u) => u.id === utilityId || u.canonicalId === utilityId || u.name === utilityId
  );
  if (found) return found;
  if (fallbackTrait) {
    const byTrait = CLASS_UTILITY_CATALOG.find((u) => u.traitLine === fallbackTrait);
    if (byTrait) return byTrait;
  }
  return CLASS_UTILITY_CATALOG[0];
}

/**
 * Assignable [L]/[R] Action Descriptor for Action 6: Tactical Utility Slot (Unlocked at Level 6)
 */
export const classUtilitySlotAction: OrionActionDescriptor = {
  id: 'class_utility_slot',
  name: 'Tactical Utility [Action 6]',
  shortLabel: 'TACTICAL UTILITY',
  sourceCategory: 'utility',
  sourceLabel: 'Utility Slot [Action 6 · Lv 6]',
  hardwareSlot: 'Utility',
  sortOrder: 30,
  description:
    'Activates the equipped Tactical Utility module in Slot 6 (unlocked at Level 6: Border Town Complete).',
  tellDurationSec: 0.15,
  actionDurationSec: 0.26,
  cooldownSec: 9.0,
  heatCost: 10,
  damage: 0,
  damageType: 'Pulse',
  damageFamily: 'Energy',
  range: 0,
};

/**
 * Assignable [L]/[R] Action Descriptors for Belt Slots 1–4 (Actions 7–10, unlocked at Lv 1, 1, 5, 12)
 */
export const beltSlot1Action: OrionActionDescriptor = {
  id: 'belt_slot_1',
  name: 'Belt Slot 1 [Action 7]',
  shortLabel: 'BELT SLOT 1',
  sourceCategory: 'belt',
  sourceLabel: 'Belt Slot 1 [Lv 1]',
  hardwareSlot: 'Belt',
  beltSlotIndex: 0,
  sortOrder: 40,
  description:
    'Triggers the tactical consumable slotted in Belt Slot 1 (unlocked at Level 1).',
  tellDurationSec: 0.1,
  actionDurationSec: 0.2,
  cooldownSec: 4.0,
  heatCost: 0,
  damage: 0,
  damageType: 'Impact',
  damageFamily: 'Kinetic',
  range: 0,
};

export const beltSlot2Action: OrionActionDescriptor = {
  id: 'belt_slot_2',
  name: 'Belt Slot 2 [Action 8]',
  shortLabel: 'BELT SLOT 2',
  sourceCategory: 'belt',
  sourceLabel: 'Belt Slot 2 [Lv 1]',
  hardwareSlot: 'Belt',
  beltSlotIndex: 1,
  sortOrder: 41,
  description:
    'Triggers the tactical consumable slotted in Belt Slot 2 (unlocked at Level 1).',
  tellDurationSec: 0.1,
  actionDurationSec: 0.2,
  cooldownSec: 4.0,
  heatCost: 0,
  damage: 0,
  damageType: 'Pulse',
  damageFamily: 'Energy',
  range: 0,
};

export const beltSlot3Action: OrionActionDescriptor = {
  id: 'belt_slot_3',
  name: 'Belt Slot 3 [Action 9]',
  shortLabel: 'BELT SLOT 3',
  sourceCategory: 'belt',
  sourceLabel: 'Belt Slot 3 [Lv 5]',
  hardwareSlot: 'Belt',
  beltSlotIndex: 2,
  sortOrder: 42,
  description:
    'Triggers the tactical consumable slotted in Belt Slot 3 (unlocked at Level 5: Border Town Benchmark).',
  tellDurationSec: 0.1,
  actionDurationSec: 0.2,
  cooldownSec: 4.0,
  heatCost: 0,
  damage: 0,
  damageType: 'Impact',
  damageFamily: 'Kinetic',
  range: 0,
};

export const beltSlot4Action: OrionActionDescriptor = {
  id: 'belt_slot_4',
  name: 'Belt Slot 4 [Action 10]',
  shortLabel: 'BELT SLOT 4',
  sourceCategory: 'belt',
  sourceLabel: 'Belt Slot 4 [Lv 12]',
  hardwareSlot: 'Belt',
  beltSlotIndex: 3,
  sortOrder: 43,
  description:
    'Triggers the tactical consumable slotted in Belt Slot 4 (unlocked at Level 12).',
  tellDurationSec: 0.1,
  actionDurationSec: 0.2,
  cooldownSec: 4.0,
  heatCost: 0,
  damage: 0,
  damageType: 'Pulse',
  damageFamily: 'Energy',
  range: 0,
};
