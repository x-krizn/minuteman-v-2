/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TRAIT_REGISTRY } from '../database/characters/trait_lines';
import { getWeaponDefinition } from '../database/weapons';
import { notifyOrionStateChange } from '../stateStore';
import { OrionCapabilityGates, OrionState, TraitLine } from '../types';

/**
 * Compute active hardware and skill capability gates based on the pilot's current
 * progression level (1..20), equipped chassis modules, and sandbox bypass state.
 */
export function computeCapabilityGates(state: OrionState): OrionCapabilityGates {
  const bypass = Boolean(state.bypassProgressionGates);
  const lvl = bypass ? 20 : Math.max(1, state.level);

  const maxWeaponSlots = lvl >= 13 ? 4 : lvl >= 3 ? 2 : 1;

  const unlockedSkillSlots: number[] = [0];
  if (lvl >= 4 || !state.tutorialActive) {
    unlockedSkillSlots.push(1, 2);
  }
  if (lvl >= 6) {
    unlockedSkillSlots.push(3, 4);
  }

  const canBoosterDash = bypass ? true : state.hasBoosterKit && (lvl >= 2 || !state.tutorialActive);
  const canWeaponSwap = state.equippedWeapons.length > 1;
  const heatSystemActive = lvl >= 5 || bypass;
  const energySystemActive = lvl >= 5 || bypass;
  const opticsActive = lvl >= 7 || bypass;
  const armSidearmActive = lvl >= 8 || bypass;
  const defensiveSlots = lvl >= 11 ? 3 : lvl >= 10 ? 1 : 0;

  let featSlots = 0;
  if (lvl >= 18) featSlots = 5;
  else if (lvl >= 16) featSlots = 4;
  else if (lvl >= 14) featSlots = 3;
  else if (lvl >= 12) featSlots = 2;
  else if (lvl >= 9) featSlots = 1;

  const presenceActive = lvl >= 15 || bypass;
  const coreSystemActive = lvl >= 17 || bypass;

  return {
    maxWeaponSlots,
    unlockedSkillSlots,
    canBoosterDash,
    canWeaponSwap,
    heatSystemActive,
    energySystemActive,
    opticsActive,
    armSidearmActive,
    defensiveSlots,
    featSlots,
    presenceActive,
    coreSystemActive,
  };
}

/**
 * Synchronize state.gates and ensure active weapon index and ammo conform to equipped weapons.
 */
export function syncStateGates(state: OrionState): OrionCapabilityGates {
  const gates = computeCapabilityGates(state);
  state.gates = gates;

  if (state.activeWeaponIndex >= state.equippedWeapons.length) {
    state.activeWeaponIndex = 0;
    const wDef = getWeaponDefinition(state.equippedWeapons[0] || 'gladius_boltcaster');
    if (wDef) {
      state.maxAmmo = wDef.shotsPerChain;
      state.ammo = Math.min(state.ammo, state.maxAmmo);
      state.reloadDuration = wDef.reloadDurationSec;
    }
  }

  return gates;
}

/**
 * Read a typed world or narrative flag from state.flags.
 */
export function getOrionFlag<T extends boolean | number | string>(
  state: OrionState,
  key: string,
  fallback: T
): T {
  const val = state.flags?.[key];
  return (val !== undefined ? val : fallback) as T;
}

/**
 * Mutate a world or narrative flag on state.flags and recompute gates.
 */
export function setOrionFlag(
  state: OrionState,
  key: string,
  value: boolean | number | string
): void {
  if (!state.flags) {
    state.flags = {};
  }
  state.flags[key] = value;
  syncStateGates(state);
  notifyOrionStateChange();
}

/**
 * Toggle whether the Tutorial State is active.
 * Remember: World areas (like M00 — The Bog) are only tutorial areas while tutorialActive is true.
 */
export function setTutorialStateActive(state: OrionState, active: boolean): void {
  state.tutorialActive = active;
  if (!active) {
    // Standard world mode ensures secondary hardpoint and booster are available for testing/play
    if (!state.equippedWeapons.includes('khopesh')) {
      state.equippedWeapons.push('khopesh');
    }
    state.hasBoosterKit = true;
  }
  syncStateGates(state);
  notifyOrionStateChange();
}

/**
 * Toggle whether progression gates are strictly enforced by level or bypassed for map testing.
 */
export function setBypassProgressionGates(state: OrionState, bypass: boolean): void {
  state.bypassProgressionGates = bypass;
  if (bypass) {
    if (!state.equippedWeapons.includes('khopesh')) {
      state.equippedWeapons.push('khopesh');
    }
    state.hasBoosterKit = true;
  }
  syncStateGates(state);
  notifyOrionStateChange();
}

/**
 * Apply one of the 6 canonical Trait Line chassis profiles (Warrior, Marauder, Guardian,
 * Rogue, Wizard, Cleric) and its paired Reactor (Ichor, Mana, Ether) to the pilot state.
 */
export function applyTraitLineProfile(state: OrionState, traitLine: TraitLine): void {
  const profile = TRAIT_REGISTRY[traitLine];
  if (!profile) return;

  state.traitLine = profile.id;
  state.reactor = profile.reactor;

  state.shields = {
    type: profile.baseShield.type,
    capacity: profile.baseShield.capacity,
    maxCapacity: profile.baseShield.capacity,
    overloaded: false,
    overloadTimer: 0,
    rechargeDelay: 0,
  };

  state.armor = {
    type: profile.baseArmor.type,
    threshold: profile.baseArmor.threshold,
    rating: profile.baseArmor.rating,
    durability: profile.baseArmor.durability,
    maxDurability: profile.baseArmor.durability,
  };

  syncStateGates(state);
  notifyOrionStateChange();
}
