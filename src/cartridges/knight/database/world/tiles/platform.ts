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
  assets: {
    imageUri: '', // Paste custom base64 sprite data URL to override platform tile
    sheetIndex: 1,
    frameWidth: 16,
    frameHeight: 16,
  },
};
