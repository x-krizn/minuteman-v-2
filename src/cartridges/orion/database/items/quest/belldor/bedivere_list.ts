/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../../types';

/** Row 1, Col 6: Scroll 16x16 Base64 PNG */
export const SCROLL_ICON_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAeklEQVR42sWSXQrAIAyDeyfv5J16p97JEbeMsL1EYSxQ1EK+/mDE76qqgXNc4ttWZk6TApCzAa210Xt/QZa6+AZScUbG+jgw6m6WupmAjHuZWxACnhCCLBj3oRCMqGFDIJqQY9g7YXXctQMbou0rxAbwy29Vf0IQaj4ACtj8atVzIzMAAAAASUVORK5CYII=';

export const bedivereListItem: ItemWikiDefinition = {
  id: 'bedivere_list',
  name: "Bedivere's Numbered List",
  category: 'key',
  description: 'A numbered scroll of seemingly nonsensical items scattered across more than one zone.',
  lore: 'Found on Bedivere in the bog. Whoever collects all listed curiosities and returns to the bog water will find the Lady of the Lake waiting.',
  buyPrice: 0,
  sellPrice: 0,
  iconColor: '#f8fafc',
  iconSprite: {
    base64: SCROLL_ICON_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
};
