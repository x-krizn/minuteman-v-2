/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

/**
 * Canonical database definition for `platformTile` (`Wooden Platform`, id `'platform'`, ASCII token `'_'`, slot `'terrain'`) — Elevated wooden scaffolding allowing jumping through from underneath..
 */
export const platformTile: TileDefinition = {
  id: 'platform',
  symbol: '_',
  name: 'Wooden Platform',
  category: 'terrain',
  description: 'Elevated wooden scaffolding allowing jumping through from underneath.',
  solid: false,
  oneWay: true,
};
