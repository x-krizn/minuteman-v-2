/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

export const weaponSkill2Action: OrionActionDescriptor = {
  id: 'weapon_skill_2',
  name: 'Weapon Skill 2 (Default R)',
  shortLabel: 'WPN SKILL 2',
  sourceCategory: 'weapon',
  sourceLabel: 'Active Weapon [Slot 2]',
  weaponSkillSlot: 2,
  sortOrder: 2,
  description: 'Executes the active weapon’s tactical secondary skill (Concussion Grenade / Sweep Deflection).',
  tellDurationSec: 0.3,
  actionDurationSec: 0.4,
  cooldownSec: 5.5,
  heatCost: 18,
  damage: 24,
  damageType: 'Blast',
  damageFamily: 'Kinetic',
  range: 75,
};
