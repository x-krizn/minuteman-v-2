/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

export const weaponSkill4Action: OrionActionDescriptor = {
  id: 'weapon_skill_4',
  name: 'Weapon Skill 4',
  shortLabel: 'WPN SKILL 4',
  sourceCategory: 'weapon',
  sourceLabel: 'Active Weapon [Slot 4]',
  weaponSkillSlot: 4,
  sortOrder: 4,
  description: 'Executes the active weapon’s heavy finisher (Overcharge Discharge / Whirlwind Sever).',
  tellDurationSec: 0.4,
  actionDurationSec: 0.7,
  cooldownSec: 8.5,
  heatCost: 30,
  damage: 30,
  damageType: 'Beam',
  damageFamily: 'Energy',
  range: 85,
};
