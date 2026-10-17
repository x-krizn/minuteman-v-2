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
    if (state.frame.integrity >= state.frame.maxIntegrity && state.armor.durability >= state.armor.maxDurability) {
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

export const orcWarPaintItem: ItemWikiDefinition = {
  id: 'orc_war_paint',
  name: 'Orc War Paint',
  category: 'consumable',
  description: 'Applies ceremonial ochre pigment granting +15% damage temporarily.',
  lore: 'Recovered from orc raiders pushing into the Camelot borderlands.',
  buyPrice: 25,
  sellPrice: 10,
  iconColor: '#ea580c',
  onUse(state: OrionState, ctx: OrionExecutionContext) {
    ctx.sound.playCharge();
    ctx.say('+15% DAMAGE APPLIED');
    return true;
  },
};

export const boosterKitItem: ItemWikiDefinition = {
  id: 'booster_kit',
  name: 'Basic Booster Kit',
  category: 'equipment',
  description: 'Lateral thruster assembly enabling rapid evasive dash and chasm traversal.',
  lore: 'Found on the fallen scout in M00 — The Bog. Essential mobility equipment for Belldor terrain.',
  buyPrice: 100,
  sellPrice: 45,
  iconColor: '#77c7ff',
};

export const rustedGateKeyItem: ItemWikiDefinition = {
  id: 'rusted_gate_key',
  name: 'Rusted Gate Key',
  category: 'key',
  description: 'Heavy iron key stamped with the Camelot border insignia.',
  lore: 'Unlocks the fortified perimeter gate connecting M00 The Bog to the Border Town Slums.',
  buyPrice: 0,
  sellPrice: 0,
  iconColor: '#ffd27d',
};

export const bedivereRingItem: ItemWikiDefinition = {
  id: 'bedivere_ring',
  name: "Bedivere's Signet Ring",
  category: 'key',
  description: 'Silver signet ring bearing a scarred falcon emblem.',
  lore: 'Carried by the fallen Camelot scout in the bog. Proof of duty and key narrative artifact.',
  buyPrice: 0,
  sellPrice: 0,
  iconColor: '#e2e8f0',
};

export const salvageScrapItem: ItemWikiDefinition = {
  id: 'salvage_scrap',
  name: 'Salvage Scrap',
  category: 'valuable',
  description: 'Refined titan-chassis alloys used as trade currency among scavengers.',
  lore: 'The standard trade currency across the Border Town markets.',
  buyPrice: 1,
  sellPrice: 1,
  iconColor: '#ffd27d',
};

export const corruptedShardItem: ItemWikiDefinition = {
  id: 'corrupted_shard',
  name: 'Corrupted Shard',
  category: 'valuable',
  description: 'A crystalline fragment pulsing with desynchronized temporal distortion.',
  lore: 'Harvested from corrupted Camelot knights. Sought after by researchers studying the tuning catastrophe.',
  buyPrice: 50,
  sellPrice: 25,
  iconColor: '#b8a4ff',
};

export const ITEM_REGISTRY: Record<string, ItemWikiDefinition> = {
  repair_kit: repairKitItem,
  grail_water: grailWaterItem,
  orc_war_paint: orcWarPaintItem,
  booster_kit: boosterKitItem,
  rusted_gate_key: rustedGateKeyItem,
  bedivere_ring: bedivereRingItem,
  salvage_scrap: salvageScrapItem,
  corrupted_shard: corruptedShardItem,
};

export function getItemDefinition(id: string): ItemWikiDefinition | undefined {
  return ITEM_REGISTRY[id];
}
