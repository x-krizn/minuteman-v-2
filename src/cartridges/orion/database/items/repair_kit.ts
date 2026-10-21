/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition, OrionExecutionContext, OrionState } from '../../types';

/** Row 3, Col 4: Demantoid Repair Flask 16x16 Base64 PNG */
export const FLASK_DEMANTOID_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAf0lEQVR42mNgwAL+4wAMpACohv8w8xhIBRTZjuQCDDbR4MyZM/+xsUkyIOVXChiTbUDUiSgwHhgDQAEHM4CsNADTTLIhIOe6rXIDY5hGGJ8or4AU2UyzgWuCYZAY0QYga0I2jGgDNFI0MFwAEiM6NkD+BmlAxiTHBMg2ZIxLHQAoRe/oww9GhgAAAABJRU5ErkJggg==';

export const repairKitItem: ItemWikiDefinition = {
  id: 'repair_kit',
  name: 'Demantoid Repair Flask',
  category: 'consumable',
  description: 'Restores +60 Frame Integrity and +35 Armor Durability (clears Critical Frame State).',
  lore: 'Cleric-grade nanite suspension infused with Demantoid dust for rapid field repairs.',
  buyPrice: 20,
  sellPrice: 8,
  iconColor: '#22c55e',
  iconSprite: {
    base64: FLASK_DEMANTOID_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
  onUse(state: OrionState, ctx: OrionExecutionContext) {
    if (
      state.frame.integrity >= state.frame.maxIntegrity &&
      state.armor.durability >= state.armor.maxDurability
    ) {
      ctx.say('FRAME & ARMOR OPTIMAL');
      return false;
    }
    state.frame.integrity = Math.min(state.frame.maxIntegrity, state.frame.integrity + 60);
    if (state.frame.integrity > 40) state.frame.state = 'Operational';
    state.armor.durability = Math.min(state.armor.maxDurability, state.armor.durability + 35);
    ctx.sound.playHeal();
    ctx.say('DEMANTOID FLASK: +60 FRAME HP & +35 ARMOR');
    return true;
  },
};
