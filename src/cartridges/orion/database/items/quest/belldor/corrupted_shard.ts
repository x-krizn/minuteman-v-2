/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../../types';

/**
 * Canonical database definition for `corruptedShardItem` (`Corrupted Shard`, id `'corrupted_shard'`, slot `'valuable'`) — 0 WT Desynchronized Chrono-Crystal · Trade Value 25g Sell / 50g Buy · Emits −1 Light Distortion Field..
 */
export const corruptedShardItem: ItemWikiDefinition = {
  id: 'corrupted_shard',
  name: 'Corrupted Shard',
  category: 'valuable',
  description:
    '0 WT Desynchronized Chrono-Crystal · Trade Value 25g Sell / 50g Buy · Emits −1 Light Distortion Field.',
  lore: 'Harvested from corrupted Camelot knights. Sought after by researchers studying the tuning catastrophe.',
  buyPrice: 50,
  sellPrice: 25,
  lightBonus: -1,
  iconColor: '#b8a4ff',
};
