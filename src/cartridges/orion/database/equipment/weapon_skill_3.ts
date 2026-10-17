/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

export const weaponSkill3Action: OrionActionDescriptor = {
  id: 'weapon_skill_3',
  name: 'Weapon Skill 3',
  shortLabel: 'WPN SKILL 3',
  sourceCategory: 'weapon',
  sourceLabel: 'Active Weapon [Slot 3]',
  weaponSkillSlot: 3,
  sortOrder: 3,
  description: 'Executes the active weapon’s suppression/control skill (Suppression Arc / Hamstring Arc).',
  tellDurationSec: 0.18,
  actionDurationSec: 0.38,
  cooldownSec: 5.0,
  heatCost: 16,
  damage: 12,
  damageType: 'Pierce',
  damageFamily: 'Kinetic',
  range: 65,
};
