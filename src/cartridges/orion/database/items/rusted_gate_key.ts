/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { addOrionInventoryItem } from '../../stateStore';
import { ItemWikiDefinition } from '../../types';

export const rustedGateKeyItem: ItemWikiDefinition = {
  id: 'rusted_gate_key',
  name: 'Rusted Gate Key',
  category: 'key',
  description: 'Heavy iron key stamped with the Camelot border insignia.',
  lore: 'Unlocks the fortified perimeter gate connecting M00 The Bog to the Border Town Slums.',
  buyPrice: 0,
  sellPrice: 0,
  iconColor: '#ffd27d',
  onCollect(state, ctx) {
    addOrionInventoryItem(state, 'rusted_gate_key', 1);
    ctx.say('ACQUIRED RUSTED GATE KEY');
  },
};
