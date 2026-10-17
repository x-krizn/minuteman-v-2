/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

export const weaponSkill1Action: OrionActionDescriptor = {
  id: 'weapon_skill_1',
  name: 'Weapon Skill 1 (Default L)',
  shortLabel: 'WPN SKILL 1',
  sourceCategory: 'weapon',
  sourceLabel: 'Active Weapon [Slot 1]',
  weaponSkillSlot: 1,
  sortOrder: 1,
  description: 'Executes the active weapon’s primary special skill (AP Slug / Execution Lunge).',
  tellDurationSec: 0.25,
  actionDurationSec: 0.35,
  cooldownSec: 4.0,
  heatCost: 15,
  damage: 18,
  damageType: 'Pierce',
  damageFamily: 'Kinetic',
  range: 95,
};
