/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { addOrionInventoryItem } from '../../../../systems/playerSystem';
import { ItemWikiDefinition } from '../../../../types';

/** Row 1, Col 7: Amulet 16x16 Base64 PNG */
export const AMULET_ICON_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAV0lEQVR42mNgoAf4f4bhPwyTp3kmEibVEJgBuPi0MwDubzTFRHkD2d8YcqQYgFUOnwHI0QVTiK4Yp+HYNCJHHa4wwfQ3Gg139kwCoY/LBWQnWZI1D10AABP+t+JoVpTmAAAAAElFTkSuQmCC';

export const bedivereRelicItem: ItemWikiDefinition = {
  id: 'bedivere_relic',
  name: 'Grail Amulet (Bedivere List Relic)',
  category: 'key',
  description:
    'An ancient golden amulet matching one of the numbered entries on Bedivere’s scroll.',
  lore: 'Makes no sense on its own, yet hums faintly when brought near the waters of the Bog.',
  buyPrice: 0,
  sellPrice: 0,
  iconColor: '#facc15',
  iconSprite: {
    base64: AMULET_ICON_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
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
