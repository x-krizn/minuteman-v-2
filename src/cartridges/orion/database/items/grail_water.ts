/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition, OrionExecutionContext, OrionState } from '../../types';

/** Row 3, Col 0: Moonstone Grail Flask 16x16 Base64 PNG */
export const FLASK_MOONSTONE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAdklEQVR42sWS0Q3AIAhEmYUV2Imd2ImdbM6UhkSbgP3oJZeo8Z6gEm00XkQd3YERPOrq0+mpgmVclruP3bgFyD4CmNn0PwBcXACO/kCE2xCUq6rTEYx5qRVsEpEnFMZaGZBDGVYGMPNSAdbKr4G+Echuv0T1J14KIvCpSk2yhwAAAABJRU5ErkJggg==';

export const grailWaterItem: ItemWikiDefinition = {
  id: 'grail_water',
  name: 'Moonstone Grail Flask',
  category: 'consumable',
  description: 'Restores +45 Shield Capacity, clears Shield Overload, and mends +60 Frame Integrity.',
  lore: 'Luminescent Moonstone-distilled Grail water from Camelot desynchronization rifts.',
  buyPrice: 35,
  sellPrice: 15,
  iconColor: '#f8fafc',
  iconSprite: {
    base64: FLASK_MOONSTONE_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
  onUse(state: OrionState, ctx: OrionExecutionContext) {
    state.shields.overloaded = false;
    state.shields.overloadTimer = 0;
    state.shields.capacity = Math.min(state.shields.maxCapacity, state.shields.capacity + 45);
    state.frame.integrity = Math.min(state.frame.maxIntegrity, state.frame.integrity + 60);
    if (state.frame.integrity > 40) state.frame.state = 'Operational';
    ctx.sound.playHeal();
    ctx.say('MOONSTONE FLASK: +45 SHIELD & +60 FRAME HP');
    return true;
  },
};
