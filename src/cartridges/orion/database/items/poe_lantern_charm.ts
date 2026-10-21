/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

/** Row 1, Col 8: Charm 16x16 Base64 PNG */
export const CHARM_ICON_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAbklEQVR42mNgGNTg17Mt/0/sbEDBFGkG4WkN3v9J0hzMwEC6ASCFSkpK/434+cEYxCbLdnSb03yMibcd5HSQ7SQ5HWYAut+Jth3kfJDtMD/D2CQ5H4bJdj6y/0kKfXQXkGw7VQwAAZAGZEzzDAcAIgrdjL5oWjwAAAAASUVORK5CYII=';

export const poeLanternCharmItem: ItemWikiDefinition = {
  id: 'poe_lantern_charm',
  name: "Poe's Lantern Charm",
  category: 'equipment',
  description: 'Ætheric wisp charm gifted by a Poe. Reveals the Bog Wurm beneath corrosive water and guides true exits in the Fog.',
  lore: 'Earned by helping a small floating lantern-spirit back to its lantern in the drowned maze.',
  buyPrice: 0,
  sellPrice: 0,
  iconColor: '#7dd3fc',
  iconSprite: {
    base64: CHARM_ICON_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
};
