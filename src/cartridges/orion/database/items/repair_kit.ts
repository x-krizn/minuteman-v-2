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
  description: 'Restores +50 Layer 2 Armor Durability (Layer 3 Frame HP cannot be field-repaired; requires a Campfire or Waygate).',
  lore: 'Cleric-grade Demantoid suspension that seals outer armor plating. Out-of-place mech frames cannot be structurally repaired without specialized equipment, rare materials, and unknown ætheric magics.',
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
    if (state.armor.durability >= state.armor.maxDurability) {
      ctx.say('ARMOR DURABILITY OPTIMAL');
      return false;
    }
    state.armor.durability = Math.min(state.armor.maxDurability, state.armor.durability + 50);
    ctx.sound.playHeal();
    ctx.say('DEMANTOID FLASK: +50 ARMOR DURABILITY');
    return true;
  },
};
