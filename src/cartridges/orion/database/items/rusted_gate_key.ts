/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { addOrionInventoryItem } from '../../systems/playerSystem';
import { ItemWikiDefinition } from '../../types';

/** Row 1, Col 3: Key 16x16 Base64 PNG */
export const KEY_ICON_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAASElEQVR42mNgGAVw8P8Mw39kTLrmmWiYWENgmjHEiTWEkAGEMGEDkLyEThPtBZg8uhjEBTj8istg7OGAzb8zSY1KtGgcQVkAALBtofhivRQWAAAAAElFTkSuQmCC';

export const rustedGateKeyItem: ItemWikiDefinition = {
  id: 'rusted_gate_key',
  name: 'Rusted Gate Key',
  category: 'key',
  description: 'Heavy iron key stamped with the Camelot border insignia.',
  lore: 'Unlocks the fortified perimeter gate connecting M00 The Bog to the Border Town Slums.',
  buyPrice: 0,
  sellPrice: 0,
  iconColor: '#ffd27d',
  iconSprite: {
    base64: KEY_ICON_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
  onCollect(state, ctx) {
    addOrionInventoryItem(state, 'rusted_gate_key', 1);
    ctx.say('ACQUIRED RUSTED GATE KEY');
  },
};
