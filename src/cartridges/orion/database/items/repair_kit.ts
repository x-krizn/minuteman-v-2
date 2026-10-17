/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition, OrionExecutionContext, OrionState } from '../../types';

export const repairKitItem: ItemWikiDefinition = {
  id: 'repair_kit',
  name: 'Field Repair Kit',
  category: 'consumable',
  description: 'Emergency nanite patch restoring 60 Frame Integrity or repairing Armor Durability.',
  lore: 'Standard military field kit used by mech operators in hostile atmospheric incursions.',
  buyPrice: 20,
  sellPrice: 8,
  iconColor: '#8dd7ad',
  onUse(state: OrionState, ctx: OrionExecutionContext) {
    if (
      state.frame.integrity >= state.frame.maxIntegrity &&
      state.armor.durability >= state.armor.maxDurability
    ) {
      ctx.say('FRAME & ARMOR OPTIMAL');
      return false;
    }
    state.frame.integrity = Math.min(state.frame.maxIntegrity, state.frame.integrity + 60);
    state.armor.durability = Math.min(state.armor.maxDurability, state.armor.durability + 30);
    ctx.sound.playHeal();
    ctx.say('+60 FRAME INTEGRITY');
    return true;
  },
};
