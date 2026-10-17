/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraitLine, TraitLineWikiDefinition } from '../../types';

export const warriorTrait: TraitLineWikiDefinition = {
  id: 'Warrior',
  name: 'Warrior',
  reactor: 'Ichor',
  defaultDamageStyle: 'Impact',
  identity: 'Balanced combatant clad in reactive armor with reliable energy shields.',
  lore: 'Frontline mechs deployed to hold ground and absorb sustained kinetic fire.',
  baseShield: { type: 'energy', capacity: 60 },
  baseArmor: { type: 'Reactive', threshold: 6, rating: 4, durability: 80 },
  startingWeapons: ['gladius_boltcaster'],
};

export const marauderTrait: TraitLineWikiDefinition = {
  id: 'Marauder',
  name: 'Marauder',
  reactor: 'Ichor',
  defaultDamageStyle: 'Impact',
  identity: 'Aggressive heavy-armor striker with no shields and high durability.',
  lore: 'Heavy frame stripped of shielding to mount thick, hardened composite plates.',
  baseShield: { type: 'energy', capacity: 0 },
  baseArmor: { type: 'Hardened', threshold: 8, rating: 6, durability: 120 },
  startingWeapons: ['gladius_boltcaster'],
};

export const guardianTrait: TraitLineWikiDefinition = {
  id: 'Guardian',
  name: 'Guardian',
  reactor: 'Mana',
  defaultDamageStyle: 'Pierce',
  identity: 'Defensive bastion fielding physical shields and layered composite armor.',
  lore: 'Equipped with heavy physical barriers that do not suffer energy overload.',
  baseShield: { type: 'physical', capacity: 100 },
  baseArmor: { type: 'Layered', threshold: 7, rating: 5, durability: 100 },
  startingWeapons: ['gladius_boltcaster'],
};

export const rogueTrait: TraitLineWikiDefinition = {
  id: 'Rogue',
  name: 'Rogue',
  reactor: 'Ether',
  defaultDamageStyle: 'Blast',
  identity: 'High-mobility skirmisher with ablative plating and rapid burst discharges.',
  lore: 'Ablative shielding deflects high-energy single hits during swift flanking runs.',
  baseShield: { type: 'energy', capacity: 40 },
  baseArmor: { type: 'Ablative', threshold: 12, rating: 8, durability: 40 },
  startingWeapons: ['gladius_boltcaster'],
};

export const wizardTrait: TraitLineWikiDefinition = {
  id: 'Wizard',
  name: 'Wizard',
  reactor: 'Ether',
  defaultDamageStyle: 'Blast',
  identity: 'Energy artillery specialist wielding high-capacity energy shields.',
  lore: 'Channels reactor Ether into sustained beams and devastating wave energy.',
  baseShield: { type: 'energy', capacity: 80 },
  baseArmor: { type: 'Layered', threshold: 5, rating: 4, durability: 60 },
  startingWeapons: ['gladius_boltcaster'],
};

export const clericTrait: TraitLineWikiDefinition = {
  id: 'Cleric',
  name: 'Cleric',
  reactor: 'Mana',
  defaultDamageStyle: 'Pierce',
  identity: 'Support and emergency repair specialist utilizing Mana field harmonizers.',
  lore: 'Capable of repairing frame integrity and field armor during engagements.',
  baseShield: { type: 'energy', capacity: 60 },
  baseArmor: { type: 'Reactive', threshold: 6, rating: 4, durability: 80 },
  startingWeapons: ['gladius_boltcaster'],
};

export const TRAIT_REGISTRY: Record<TraitLine, TraitLineWikiDefinition> = {
  Warrior: warriorTrait,
  Marauder: marauderTrait,
  Guardian: guardianTrait,
  Rogue: rogueTrait,
  Wizard: wizardTrait,
  Cleric: clericTrait,
};
