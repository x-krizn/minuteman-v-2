/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { addOrionInventoryItem } from '../../../../systems/playerSystem';
import { ItemWikiDefinition } from '../../../../types';
import { KEY_ICON_BASE64 } from './rusted_gate_key';

export const dungeonKeyItem: ItemWikiDefinition = {
  id: 'dungeon_key',
  name: 'Camelot Waygate Key',
  category: 'key',
  description: 'Ancient Grail-stamped sanctum key recovered at the Cathedral Dungeon Entrance.',
  lore: 'Unlocks the Deep Dungeon and attunes to the colossal Camelot Waygate leading into the Camelot Interior (border-town-v1.md · OD-BT-01).',
  buyPrice: 0,
  sellPrice: 0,
  iconColor: '#38bdf8',
  iconSprite: {
    base64: KEY_ICON_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
  onCollect(state, ctx) {
    addOrionInventoryItem(state, 'dungeon_key', 1);
    ctx.say('ACQUIRED CAMELOT WAYGATE KEY');
  },
};
