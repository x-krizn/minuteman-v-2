/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  KnightState,
  ProgressionNodeEntry,
  WeaponDefinition,
} from '../../types';
import { getWeaponDefinition } from '../weapons';

// Dynamic recursive auto-discovery of all progression nodes
const progressionModules = import.meta.glob('./**/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const collectedNodes: ProgressionNodeEntry[] = [];

for (const [path, mod] of Object.entries(progressionModules)) {
  if (path.endsWith('index.ts') || path.endsWith('resolver.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'id' in exp &&
      'name' in exp &&
      'unlocks' in exp
    ) {
      collectedNodes.push(exp as ProgressionNodeEntry);
    }
  }
}

export const ALL_PROGRESSION_NODES: ProgressionNodeEntry[] = collectedNodes;

export const PROGRESSION_REGISTRY: Record<string, ProgressionNodeEntry> =
  ALL_PROGRESSION_NODES.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<string, ProgressionNodeEntry>);

export function getProgressionNode(id: string): ProgressionNodeEntry | undefined {
  return PROGRESSION_REGISTRY[id];
}

/**
 * Helper to fetch all currently equipped gear definitions for a player
 */
export function getActiveGear(player: KnightState): {
  mainHand?: WeaponDefinition;
  offHand?: WeaponDefinition;
  all: WeaponDefinition[];
} {
  const mainId = player.loadout?.mainHand || player.equippedWeapon || 'short_sword';
  const offId = player.loadout?.offHand;

  const mainHand = getWeaponDefinition(mainId);
  const offHand = offId ? getWeaponDefinition(offId) : undefined;

  const all: WeaponDefinition[] = [];
  if (mainHand) all.push(mainHand);
  if (offHand) all.push(offHand);

  return { mainHand, offHand, all };
}

/**
 * 3-Layer Gate Action Availability Check:
 * 1. Player Mastery Gate: Is it Core, learned Feat, acquired Loot, or granted innately by gear?
 * 2. Equipment Compatibility Gate: Does the current weapon/shield support it, or is it blacklisted?
 * 3. Tree Hierarchy: Are all parent nodes available?
 */
export function canPerformAction(
  actionId: string,
  player: KnightState,
  visited = new Set<string>()
): boolean {
  if (visited.has(actionId)) return false; // Prevent circular prerequisite loops
  visited.add(actionId);

  const node = PROGRESSION_REGISTRY[actionId];
  if (!node) return false;

  const gear = getActiveGear(player);

  // Layer 1: Hardware Grant (Gear Trait Bypass)
  // If equipped weapon or shield has `innateFeats` matching this action, mastery gate is automatically passed!
  const isGrantedByGear = gear.all.some((item) =>
    item.innateFeats?.includes(actionId)
  );

  // Layer 2: Player Mastery
  let hasMastery = isGrantedByGear;

  if (!hasMastery) {
    for (const req of node.unlocks) {
      if (req.type === 'core') {
        hasMastery = true;
        break;
      }
      if (req.type === 'loot') {
        // Checked against inventory / item collection flags / player state
        if (req.lootItemId) {
          const hasInGot = Boolean(player.got?.[req.lootItemId]);
          const hasInSlots = Boolean(
            player.inventorySlots?.some(
              (slot) => slot.itemId === req.lootItemId && slot.quantity > 0
            )
          );
          // Special built-in checks
          const hasAbilityFlag =
            (req.lootItemId === 'ability_double_jump' && player.hasDouble) ||
            (req.lootItemId === 'key' && player.keys > 0);

          if (hasInGot || hasInSlots || hasAbilityFlag) {
            hasMastery = true;
            break;
          }
        }
      }
      if (req.type === 'feat') {
        if (player.unlockedFeats?.includes(actionId)) {
          hasMastery = true;
          break;
        }
      }
    }
  }

  if (!hasMastery) return false;

  // Layer 3: Equipment Compatibility
  // Even if mastered, does the equipped weapon/shield disallow this action?
  if (gear.all.some((item) => item.incompatibleActions?.includes(actionId))) {
    return false;
  }

  // Does the node require specific equipment filters?
  if (node.equipmentFilter) {
    const filter = node.equipmentFilter;
    if (filter.requiresWeapon && gear.all.length === 0) {
      return false;
    }
    if (filter.allowedWeaponTypes && filter.allowedWeaponTypes.length > 0) {
      const matchesType = gear.all.some(
        (item) => item.weaponType && filter.allowedWeaponTypes?.includes(item.weaponType)
      );
      if (!matchesType && !isGrantedByGear) {
        return false;
      }
    }
    if (filter.disallowedWeaponTypes && filter.disallowedWeaponTypes.length > 0) {
      const hasDisallowed = gear.all.some(
        (item) => item.weaponType && filter.disallowedWeaponTypes?.includes(item.weaponType)
      );
      if (hasDisallowed) {
        return false;
      }
    }
    if (filter.specificWeaponIds && filter.specificWeaponIds.length > 0) {
      const matchesSpecific = gear.all.some((item) =>
        filter.specificWeaponIds?.includes(item.id)
      );
      if (!matchesSpecific && !isGrantedByGear) {
        return false;
      }
    }
  }

  // Layer 4: Tree Hierarchy (Parent Prerequisite Satisfaction)
  if (node.parents && node.parents.length > 0) {
    const allParentsSatisfied = node.parents.every((parentId) =>
      canPerformAction(parentId, player, visited)
    );
    if (!allParentsSatisfied) return false;
  }

  return true;
}
