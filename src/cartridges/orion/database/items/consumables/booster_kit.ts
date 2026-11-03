/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../../types';

/**
 * Canonical database definition for `boosterKitItem` (`Basic Booster Kit`, id `'booster_kit'`, slot `'equipment'`) — 0 WT Passive Thruster Rig · Enables [B] Evasive Dash (0.18s Vector Burst, 1.4s CD, +8 Heat Draw)..
 */
export const boosterKitItem: ItemWikiDefinition = {
  id: 'booster_kit',
  name: 'Basic Booster Kit',
  category: 'equipment',
  description:
    '0 WT Passive Thruster Rig · Enables [B] Evasive Dash (0.18s Vector Burst, 1.4s CD, +8 Heat Draw).',
  lore: 'Found on the fallen scout in M00 — The Bog. Essential mobility equipment for Belldor terrain.',
  buyPrice: 100,
  sellPrice: 45,
  iconColor: '#77c7ff',
};
