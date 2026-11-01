/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition, OrionExecutionContext, OrionState } from '../../../../types';

export const orcWarPaintItem: ItemWikiDefinition = {
  id: 'orc_war_paint',
  name: 'Orc War Paint',
  category: 'consumable',
  description:
    'Applies ceremonial ochre pigment: +15% Weapon Damage Overdrive & +10% Stagger Impact for 8.0s (+10 Presence Threat Draw).',
  lore: 'Recovered from orc raiders pushing into the Camelot borderlands.',
  buyPrice: 25,
  sellPrice: 10,
  iconColor: '#ea580c',
  onUse(_state: OrionState, ctx: OrionExecutionContext) {
    ctx.sound.playCharge();
    ctx.say('+15% DAMAGE OVERDRIVE APPLIED');
    return true;
  },
};
