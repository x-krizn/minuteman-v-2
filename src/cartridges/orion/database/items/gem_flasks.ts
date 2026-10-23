/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition, OrionExecutionContext, OrionState } from '../../types';

/**
 * Row 3 (row = 2) Gem-Infused Belt Flasks (Cols 1, 2, 3, 5, 6, 7, 8: Spinel, Carnelian, Titanite, Kyanite, Charoite, Rubellite, Hematite)
 * Self-contained 16x16 Base64 PNG icons embedded directly in this entry file.
 */
export const FLASK_SPINEL_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAf0lEQVR42mNgwAL+4wAMpACohv8w8xhIBRTZjuQCDDbR4MyZM/+xsUky4Je3NxiTbcAJGxswHhgDQAEHM4CsNADTTLIhIOdO09UFY5hGGJ8or4AUpcjJwTXBMEiMaAOQNSEbRrQBwQwMGC4AiREdGyB/gzQgY5JjAmQbMsalDgD/keSSIf9syAAAAABJRU5ErkJggg==';
export const FLASK_CARNELIAN_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAfklEQVR42mNgwAL+4wAMpACohv8w8xhIBRTZjuQCDDbR4MyZM/+xsUky4NcvbzAm24D/ZxjAeGAMAAc91ACy0gBcM6mGgJ0+kwGCoRphfKK8AlI0O5YBYQgUg8SINgBZE7JhRBuQ5mOM4QKQGNGxAfI2SAMyJjkmQLYhY1zqAMid+zVznFphAAAAAElFTkSuQmCC';
export const FLASK_TITANITE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAgElEQVR42mNgwAL+4wAMpACohv8w8xhIBRTZjuQCDDbR4MyZM/+xsUky4NcvbzAm24A7d8zBeGAMAAUczACy0gBMM8mGgJx74oQNGMM0wvhEeQWkaNo0XbgmGAaJEW0AsiZkw4g2ICVFDsMFIDGiYwPkb5AGZExyTIBsQ8a41AEAjRkBmhkz/aMAAAAASUVORK5CYII=';
export const FLASK_KYANITE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAf0lEQVR42mNgwAL+4wAMpACohv8w8xhIBRTZjuQCDDbR4MyZM/+xsUkyICpqCxiTbUB9yzIwHhgDQAEHM4CsNADTTLIhIOfGJTeBMUwjjE+UV0CKPP0y4JpgGCRGtAHImpANI9oAG4dIDBeAxIiODZC/QRqQMckxAbINGeNSBwDldvJ9xG71+gAAAABJRU5ErkJggg==';
export const FLASK_CHAROITE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAf0lEQVR42mNgwAL+4wAMpACohv8w8xhIBRTZjuQCDDbR4MyZM/+xsUkyoLj4KxiTbUBr0EwwHhgDQAEHM4CsNADTTLIhIOcGaKaBMUwjjE+UV0CKjIzy4ZpgGCRGtAHImpANI9oACzl3DBeAxIiODZC/QRqQMckxAbINGeNSBwDzzeiwiAFcVAAAAABJRU5ErkJggg==';
export const FLASK_RUBELLITE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAdUlEQVR42mNgwAL+4wAMpACohv8w8xhIBRTZjuQCDDbR4MyZM/+xsUky4Je3NxiTbcDuwClgPDAGgAIOZgBZaQCmmWRDQM5ttcwEY5hGGJ8or4AUpcjJwTXBMEiMaAOQNSEbRh8XwAIRZjsMkxwTINuQMS51ACwN7fButxNvAAAAAElFTkSuQmCC';
export const FLASK_HEMATITE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAbklEQVR42sWTAQrAIAhFPYtX6E6e1js5lByyFajB9uFDRf9pUQALyUZQ0QyI86Cqo+qhg9c4LWaW1bgEICJzGzDGMP8D0ItzQOsNeLgM0XYR0exBn6eOMjfdIbeupQExFGHfdPD8SO0PpdWid/suDXzPl9p+cssAAAAASUVORK5CYII=';

export const spinelFlaskItem: ItemWikiDefinition = {
  id: 'spinel_flask',
  name: 'Spinel Fury Flask',
  category: 'consumable',
  description: 'Grants +30% Weapon Damage Overdrive for 6s and vents -30 Reactor Heat.',
  lore: 'Warrior-line Ichor distillate infused with Spinel crystals.',
  buyPrice: 28,
  sellPrice: 12,
  iconColor: '#ef4444',
  iconSprite: { base64: FLASK_SPINEL_BASE64, cellWidth: 16, cellHeight: 16, anchor: 'bottom-center' },
  onUse(state: OrionState, ctx: OrionExecutionContext) {
    state.overdriveTimer = Math.max(state.overdriveTimer || 0, 6.0);
    state.heat = Math.max(0, state.heat - 30);
    ctx.sound.playPowerup();
    ctx.say('SPINEL FLASK: OVERDRIVE +30% DMG (6S) & -30 HEAT');
    return true;
  },
};

export const carnelianFlaskItem: ItemWikiDefinition = {
  id: 'carnelian_flask',
  name: 'Carnelian Siege Draught',
  category: 'consumable',
  description: 'Restores +45 Armor Durability and boosts Presence priority.',
  lore: 'Marauder-grade heavy armor sealant tempered with Carnelian.',
  buyPrice: 28,
  sellPrice: 12,
  iconColor: '#f97316',
  iconSprite: { base64: FLASK_CARNELIAN_BASE64, cellWidth: 16, cellHeight: 16, anchor: 'bottom-center' },
  onUse(state: OrionState, ctx: OrionExecutionContext) {
    state.armor.durability = Math.min(state.armor.maxDurability, state.armor.durability + 45);
    state.presence = Math.min(200, (state.presence || 100) + 25);
    ctx.sound.playHeal();
    ctx.say('CARNELIAN FLASK: +45 ARMOR DURABILITY & PRESENCE SURGE');
    return true;
  },
};

export const titaniteFlaskItem: ItemWikiDefinition = {
  id: 'titanite_flask',
  name: 'Titanite Bastion Phial',
  category: 'consumable',
  description: 'Restores +40 Shield Capacity and +30 Armor Durability.',
  lore: 'Guardian-line Titanite suspension that fortifies outer shield and armor layers.',
  buyPrice: 28,
  sellPrice: 12,
  iconColor: '#facc15',
  iconSprite: { base64: FLASK_TITANITE_BASE64, cellWidth: 16, cellHeight: 16, anchor: 'bottom-center' },
  onUse(state: OrionState, ctx: OrionExecutionContext) {
    state.shields.overloaded = false;
    state.shields.capacity = Math.min(state.shields.maxCapacity, state.shields.capacity + 40);
    state.armor.durability = Math.min(state.armor.maxDurability, state.armor.durability + 30);
    ctx.sound.playHeal();
    ctx.say('TITANITE FLASK: +40 SHIELD & +30 ARMOR');
    return true;
  },
};

export const kyaniteFlaskItem: ItemWikiDefinition = {
  id: 'kyanite_flask',
  name: 'Kyanite Arc Condensate',
  category: 'consumable',
  description: 'Restores +60 Reactor Energy and resets all active Weapon & Trigger cooldowns.',
  lore: 'Wizard-line Kyanite coolant that supercharges Ether conduits and clears skill timers.',
  buyPrice: 30,
  sellPrice: 14,
  iconColor: '#38bdf8',
  iconSprite: { base64: FLASK_KYANITE_BASE64, cellWidth: 16, cellHeight: 16, anchor: 'bottom-center' },
  onUse(state: OrionState, ctx: OrionExecutionContext) {
    state.energy = Math.min(state.maxEnergy, state.energy + 60);
    state.skillCooldowns = [0, 0, 0, 0, 0];
    state.actionCooldowns = {};
    ctx.sound.playPowerup();
    ctx.say('KYANITE FLASK: +60 ENERGY & COOLDOWNS RESET');
    return true;
  },
};

export const charoiteFlaskItem: ItemWikiDefinition = {
  id: 'charoite_flask',
  name: 'Charoite Phantom Vial',
  category: 'consumable',
  description: 'Marks all targets (+25% Vulnerability for 6s) and resets Booster & Swap cooldowns.',
  lore: 'Rogue-line Charoite vapor that sharpens targeting optics and thruster response.',
  buyPrice: 30,
  sellPrice: 14,
  iconColor: '#a855f7',
  iconSprite: { base64: FLASK_CHAROITE_BASE64, cellWidth: 16, cellHeight: 16, anchor: 'bottom-center' },
  onUse(state: OrionState, ctx: OrionExecutionContext) {
    state.opticMarkTimer = Math.max(state.opticMarkTimer || 0, 6.0);
    state.boosterCooldown = 0;
    state.weaponSwapCooldown = 0;
    ctx.sound.playPowerup();
    ctx.say('CHAROITE FLASK: OPTIC MARK (6S) & DASH/SWAP READY');
    return true;
  },
};

export const rubelliteFlaskItem: ItemWikiDefinition = {
  id: 'rubellite_flask',
  name: 'Rubellite Ether Tonic',
  category: 'consumable',
  description: 'Instantly reloads active weapon chain to full and grants 5s Overdrive (+30% DMG).',
  lore: 'Volatile Rubellite tincture from the Orion/Novarin crystal mines.',
  buyPrice: 32,
  sellPrice: 15,
  iconColor: '#ec4899',
  iconSprite: { base64: FLASK_RUBELLITE_BASE64, cellWidth: 16, cellHeight: 16, anchor: 'bottom-center' },
  onUse(state: OrionState, ctx: OrionExecutionContext) {
    state.isReloading = false;
    state.ammo = state.maxAmmo;
    state.overdriveTimer = Math.max(state.overdriveTimer || 0, 5.0);
    ctx.sound.playPowerup();
    ctx.say('RUBELLITE FLASK: INSTANT RELOAD & OVERDRIVE (5S)');
    return true;
  },
};

export const hematiteFlaskItem: ItemWikiDefinition = {
  id: 'hematite_flask',
  name: 'Hematite Thermal Quench',
  category: 'consumable',
  description: 'Purges -80 Reactor Heat immediately and reinforces +25 Armor Durability.',
  lore: 'Dense Hematite coolant oil from the Sin and Chyme foundries.',
  buyPrice: 26,
  sellPrice: 12,
  iconColor: '#64748b',
  iconSprite: { base64: FLASK_HEMATITE_BASE64, cellWidth: 16, cellHeight: 16, anchor: 'bottom-center' },
  onUse(state: OrionState, ctx: OrionExecutionContext) {
    state.heat = Math.max(0, state.heat - 80);
    state.armor.durability = Math.min(state.armor.maxDurability, state.armor.durability + 25);
    ctx.sound.playHeal();
    ctx.say('HEMATITE FLASK: -80 REACTOR HEAT & +25 ARMOR');
    return true;
  },
};
