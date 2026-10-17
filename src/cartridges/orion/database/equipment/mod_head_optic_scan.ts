/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionActionDescriptor } from '../../types';

export const modHeadOpticScanAction: OrionActionDescriptor = {
  id: 'mod_head_optic_scan',
  name: 'Optic Target Painter',
  shortLabel: 'OPTIC PAINTER',
  sourceCategory: 'hardware',
  sourceLabel: 'Head Module [Optics]',
  hardwareSlot: 'Head',
  sortOrder: 10,
  description:
    'Sweeps the sector with targeting telemetry, revealing submerged threats and increasing damage taken by enemies by +25% for 6s.',
  tellDurationSec: 0.15,
  actionDurationSec: 0.25,
  cooldownSec: 7.0,
  heatCost: 10,
  damage: 0,
  damageType: 'Pulse',
  damageFamily: 'Energy',
  range: 120,
};
