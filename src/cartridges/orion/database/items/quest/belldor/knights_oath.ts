/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../../types';

/**
 * Canonical database definition for `knightsOathItem` (`Feat: Knight's Oath`, id `'knights_oath'`, slot `'equipment'`) — Earned by defeating Percival, Tristan, and Bors simultaneously. Grants permanent +25% bonus damage against Cam....
 */
export const knightsOathItem: ItemWikiDefinition = {
  id: 'knights_oath',
  name: "Feat: Knight's Oath",
  category: 'equipment',
  description: 'Earned by defeating Percival, Tristan, and Bors simultaneously. Grants permanent +25% bonus damage against Camelot enemies.',
  lore: 'A mark of martial mastery recognized even by the feral remnants of the Round Table.',
  buyPrice: 0,
  sellPrice: 0,
  iconColor: '#c084fc',
};
