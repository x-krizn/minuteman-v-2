/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SkillDef } from '../../types';

export const healSkill: SkillDef = {
  id: 'heal',
  name: 'FLASK',
  costType: 'flask',
  cost: 1,
  iconIndex: 8,
  description: 'Consume 1 Flask charge to restore 2 HP.',
  cooldown: 0.8,
};
