/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../../types';

/** Row 1, Col 5: Ring 16x16 Base64 PNG */
export const RING_ICON_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAYUlEQVR42mNgGAW0Af+BoL5l2X9CYlgBSJGRUf5/AzOf/3HJTf9xieEEIAU2DpFg2zz9Mv7jEsPrZJAikAZkNdjEGEh2HjYLCTqPGAtxOo/IMCI5CkkKD9pHITogKQqBAACSbKW7LpoqtQAAAABJRU5ErkJggg==';

export const bedivereRingItem: ItemWikiDefinition = {
  id: 'bedivere_ring',
  name: "Bedivere's Signet Ring",
  category: 'key',
  description: 'Silver signet ring bearing a scarred falcon emblem.',
  lore: 'Carried by the fallen Camelot scout in the bog. Proof of duty and key narrative artifact.',
  buyPrice: 0,
  sellPrice: 0,
  iconColor: '#e2e8f0',
  iconSprite: {
    base64: RING_ICON_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
};
