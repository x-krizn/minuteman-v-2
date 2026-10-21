/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

/** Row 1, Col 4: Lock 16x16 Base64 PNG */
export const LOCK_ICON_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQUlEQVR42mNgGNTgzJkz/0GYbM3Y2PQx4D8OQLRmmN/RMVGGIBsA4oLwwBkAM2SIG0BRLJBlAAgYGxv/x4ZpkuEAQPcHbsucEFUAAAAASUVORK5CYII=';

export const sanctumLockItem: ItemWikiDefinition = {
  id: 'sanctum_lock',
  name: 'Sanctum Padlock Seal',
  category: 'key',
  description: 'Heavy iron padlock warding sealed Camelot garrison vaults and dungeon gates.',
  lore: 'Forged by the Belldor wardens to seal off high-hazard desync chambers until proper clearance is earned.',
  buyPrice: 0,
  sellPrice: 10,
  iconColor: '#cbd5e1',
  iconSprite: {
    base64: LOCK_ICON_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
};
