/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TileDefinition } from '../../../types';

export const platformTile: TileDefinition = {
  id: 'platform',
  symbol: '_',
  name: 'Wooden Platform',
  category: 'terrain',
  description: 'Elevated wooden scaffolding allowing jumping through from underneath.',
  solid: false,
  oneWay: true,
};
