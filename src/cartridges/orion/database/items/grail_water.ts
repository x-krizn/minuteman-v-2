/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition, OrionExecutionContext, OrionState } from '../../types';

export const grailWaterItem: ItemWikiDefinition = {
  id: 'grail_water',
  name: 'Grail Water',
  category: 'consumable',
  description: 'Restores 50% Frame Integrity (100 HP) but spikes Heat by +40.',
  lore: 'Luminescent fluid condensed from Camelot desynchronization rifts. Highly potent yet thermally unstable.',
  buyPrice: 40,
  sellPrice: 15,
  iconColor: '#77c7ff',
  onUse(state: OrionState, ctx: OrionExecutionContext) {
    state.frame.integrity = Math.min(state.frame.maxIntegrity, state.frame.integrity + 100);
    state.heat = Math.min(state.maxHeat, state.heat + 40);
    ctx.sound.playHeal();
    ctx.say('+100 HP · HEAT SPIKE (+40)');
    return true;
  },
};
