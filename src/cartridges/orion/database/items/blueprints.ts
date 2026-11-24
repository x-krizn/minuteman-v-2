/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ItemWikiDefinition } from '../../types';
import { unlockArmorBlueprint } from '../equipment/exterior_armor_harmonics';
import {
  GEM_CARNELIAN_BASE64,
  GEM_CHAROITE_BASE64,
  GEM_HEMATITE_BASE64,
  GEM_TITANITE_BASE64,
} from './gemstones';

/**
 * Schematic Blueprint Item: Camelot Knight Errant Armor Set (`Set 12` · Heavy · `3G` on ALL 3 pieces).
 */
export const BP_ARMOR_CAMELOT_KNIGHT: ItemWikiDefinition = {
  id: 'bp_armor_camelot_knight',
  name: 'Blueprint: Camelot Knight Errant Set',
  category: 'blueprint',
  description:
    'Cyclopean Dwarf Forge metallurgical schematic unlocking the 3-piece Camelot Knight Errant Exterior Armor Set (Cuirass 3G, Greathelm 3G, Vambraces 3G).',
  lore: 'Recovered from the High Vaults of Camelot. Its triple-socket resonance channels allow a Knight Errant chassis to sustain 3-Gem Triads across all three exterior armor slots simultaneously.',
  buyPrice: 450,
  sellPrice: 225,
  iconColor: '#fbbf24',
  iconSprite: {
    base64: GEM_TITANITE_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
  onCollect: (state, ctx) => {
    unlockArmorBlueprint(state, 'bp_armor_camelot_knight');
    ctx.say('BLUEPRINT UNLOCKED: CAMELOT KNIGHT ERRANT SET');
  },
  onUse: (state, ctx) => {
    unlockArmorBlueprint(state, 'bp_armor_camelot_knight');
    ctx.say('SCHEMATIC REGISTERED AT CYCLOPEAN DWARF FORGE');
    return false;
  },
};

/**
 * Schematic Blueprint Item: Novarin Steppe Outrider Armor Set (`Set 13` · Light · `3G/2G/2G`).
 */
export const BP_ARMOR_NOVARIN_OUTRIDER: ItemWikiDefinition = {
  id: 'bp_armor_novarin_outrider',
  name: 'Blueprint: Novarin Steppe Outrider Set',
  category: 'blueprint',
  description:
    'Cyclopean Dwarf Forge schematic unlocking the 3-piece Novarin Steppe Outrider Exterior Armor Set (Brigandine 3G, Eagle Cap 2G, Bow-Bracers 2G).',
  lore: 'Light steppe cavalry pattern engineered for Novarin bow-riders and high-velocity outriders. Pairs articulated brigandine lames with wide-field eagle optics and rapid-draw bracers.',
  buyPrice: 320,
  sellPrice: 160,
  iconColor: '#a855f7',
  iconSprite: {
    base64: GEM_CHAROITE_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
  onCollect: (state, ctx) => {
    unlockArmorBlueprint(state, 'bp_armor_novarin_outrider');
    ctx.say('BLUEPRINT UNLOCKED: NOVARIN STEPPE OUTRIDER SET');
  },
  onUse: (state, ctx) => {
    unlockArmorBlueprint(state, 'bp_armor_novarin_outrider');
    ctx.say('SCHEMATIC REGISTERED AT CYCLOPEAN DWARF FORGE');
    return false;
  },
};

/**
 * Schematic Blueprint Item: Novarin Royal Keshig Armor Set (`Set 14` · Medium · `3G/2G/2G`).
 */
export const BP_ARMOR_NOVARIN_KESHIG: ItemWikiDefinition = {
  id: 'bp_armor_novarin_keshig',
  name: 'Blueprint: Novarin Royal Keshig Set',
  category: 'blueprint',
  description:
    'Cyclopean Dwarf Forge schematic unlocking the 3-piece Novarin Royal Keshig Exterior Armor Set (Lamellar 3G, Plumed Spangenhelm 2G, Splinted Bazubands 2G).',
  lore: 'Royal household guard lamellar worn by the Khan’s personal Keshig vanguard. Balances 94 WT load capacity with high thermal dissipation and rapid sabre/lance cadence.',
  buyPrice: 380,
  sellPrice: 190,
  iconColor: '#f97316',
  iconSprite: {
    base64: GEM_CARNELIAN_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
  onCollect: (state, ctx) => {
    unlockArmorBlueprint(state, 'bp_armor_novarin_keshig');
    ctx.say('BLUEPRINT UNLOCKED: NOVARIN ROYAL KESHIG SET');
  },
  onUse: (state, ctx) => {
    unlockArmorBlueprint(state, 'bp_armor_novarin_keshig');
    ctx.say('SCHEMATIC REGISTERED AT CYCLOPEAN DWARF FORGE');
    return false;
  },
};

/**
 * Schematic Blueprint Item: Novarin Iron Tarkhan Armor Set (`Set 15` · Heavy · `3G/2G/2G`).
 */
export const BP_ARMOR_NOVARIN_TARKHAN: ItemWikiDefinition = {
  id: 'bp_armor_novarin_tarkhan',
  name: 'Blueprint: Novarin Iron Tarkhan Set',
  category: 'blueprint',
  description:
    'Cyclopean Dwarf Forge schematic unlocking the 3-piece Novarin Iron Tarkhan Exterior Armor Set (Cataphract Barding 3G, Masked War-Helm 2G, Crusher Gauntlets 2G).',
  lore: 'Ultra-heavy cataphract barding forged for the Iron Tarkhans of the Novarin Steppe. Grants 116 WT base load capacity, 190/13/8 core plating, and +10% directional charge mass during inertia impacts.',
  buyPrice: 460,
  sellPrice: 230,
  iconColor: '#94a3b8',
  iconSprite: {
    base64: GEM_HEMATITE_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    anchor: 'bottom-center',
  },
  onCollect: (state, ctx) => {
    unlockArmorBlueprint(state, 'bp_armor_novarin_tarkhan');
    ctx.say('BLUEPRINT UNLOCKED: NOVARIN IRON TARKHAN SET');
  },
  onUse: (state, ctx) => {
    unlockArmorBlueprint(state, 'bp_armor_novarin_tarkhan');
    ctx.say('SCHEMATIC REGISTERED AT CYCLOPEAN DWARF FORGE');
    return false;
  },
};

/**
 * Ordered list of all 4 Cyclopean Dwarf Forge Armor Blueprints.
 */
export const ARMOR_BLUEPRINTS: ItemWikiDefinition[] = [
  BP_ARMOR_CAMELOT_KNIGHT,
  BP_ARMOR_NOVARIN_OUTRIDER,
  BP_ARMOR_NOVARIN_KESHIG,
  BP_ARMOR_NOVARIN_TARKHAN,
];
