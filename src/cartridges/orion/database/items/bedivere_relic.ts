/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { addOrionInventoryItem } from '../../systems/playerSystem';
import { ItemWikiDefinition } from '../../types';

export const bedivereRelicItem: ItemWikiDefinition = {
  id: 'bedivere_relic',
  name: 'Curiosity from Bedivere List',
  category: 'key',
  description:
    'An odd half-mechanical relic matching one of the numbered entries on Bedivere’s list.',
  lore: 'Makes no sense on its own, yet hums faintly when brought near the waters of the Bog.',
  buyPrice: 0,
  sellPrice: 0,
  iconColor: '#38bdf8',
  onCollect(state, ctx) {
    addOrionInventoryItem(state, 'bedivere_relic', 1);
    state.flags = state.flags || {};
    const count = Math.min(3, Number(state.flags.bedivere_list_items || 0) + 1);
    state.flags.bedivere_list_items = count;
    ctx.say(
      count >= 3
        ? "BEDIVERE'S LIST COMPLETE (3/3) · THE BOG WATER WAITS"
        : `BEDIVERE LIST RELIC (${count}/3)`
    );
  },
};
