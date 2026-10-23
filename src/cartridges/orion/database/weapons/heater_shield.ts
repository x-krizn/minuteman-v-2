/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

/**
 * Row 9 (row = 8): Heater Shield 144x16 (9 cols x 16px) Self-Contained Base64 PNG Strip
 * Col 0 = Base / White (Moonstone), Cols 1..8 = Red, Orange, Yellow, Green, Blue, Purple, Magenta, Black
 */
export const HEATER_SHIELD_STRIP_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAQCAYAAAD59vZgAAACH0lEQVR42u3YsUoDQRAG4HuSFOks0iSFCFcHJCBqeaCN4dDKIg8giHmDcHDYW1jb+QJX3CPkNWzSrPzhJhy3s+zMKkFkfhjY23XgXD93NVlmsVgsFsv/iQtE2r9bLByKQs/i/t3CoQ793fOx+pe7pUNR6FnaXxQfDkWhZ2n/avXlUBR6Ptb+l2XpUBR6FuOp65otCSK8aJPnbEm+if0Pvs3YkiDA12y3p2xJ+gGlaAq2JIgA5enljS0JIkBZX9dsSRBhjz+vNmxJ9h9QZrMZWyJEBKht2wMcGmsAIQSHxipACOHpxhpACMGhsQbQ/uTo4NBYAwghODTWAEIIDo01gBCCQ2MNIITg0FgFyE4gO4GSTqD+yTMsrMX6q8kkCAhrUcB1FgSEtVh/0+RBQFiL9c/f50FAWIv13949BwFhLdZ/eVIGAWEt1r8+ewgCwlqsfzweBwFhTQyIu8I0gLgrTAWIucI0gLgrTAOIu8I0gLgrTAOIu8I0gLgrTAOIu8JUgOwEshMo6QSie3CIR/xvHP6OGI08PJiT9r/e+HgwJ+2vqomHB3PS/rzKPTyYk/afX9x7eDAn7Z9OHz08mNPs/xCPZv/xezzEgznVZ0F9RBo8HCLly3uINHg4RBo8HCINHg6RBg+HSIOHQ5Sy/31EajzDD5RSP5DEiye+/AFRCp4+ohQ8fUQpePqIUvD0EaXg+a397+D8pN9isVgslr+ab8i9Dom5O+lNAAAAAElFTkSuQmCC';

export const heaterShieldWeapon: WeaponDefinition = {
  id: 'heater_shield',
  name: 'Camelot Heater Shield',
  class: 'Heater Shield (Main / Offhand)',
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  weightClass: 'medium',
  canBlock: true,
  passiveShieldBonus: 25,
  bladeTrailColor: '#f8fafc',
  description: 'Balanced heraldic heater shield granting +25 Max Shield Capacity and concussive shield-bash skills.',
  lore:
    'Standard-issue knightly shield of the Belldor vanguard. Can be wielded in the offhand or mainhand to bash, guard, and draw Presence.',
  shotsPerChain: 3,
  damagePerShot: 11,
  chainDurationSec: 1.0,
  reloadDurationSec: 0.55,
  primaryDamageType: 'Impact',
  variantStripBase64: HEATER_SHIELD_STRIP_BASE64,
  hardpointSprite: {
    base64: HEATER_SHIELD_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    renderWidth: 13,
    renderHeight: 13,
    anchor: 'center',
    orientFromEast: true,
  },
  iconSprite: {
    base64: HEATER_SHIELD_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    anchor: 'center',
  },
  moveset: [
    {
      slot: 0,
      name: 'Heater Rim Bash',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 11,
      tellDurationSec: 0.09,
      actionDurationSec: 0.3,
      cooldownSec: 0,
      isChain: true,
      reloadDurationSec: 0.55,
      heatCost: 2,
      range: 22,
      description: 'Three-hit steel rim bash combo dealing 11 Impact damage and staggering foes.',
    },
    {
      slot: 1,
      name: 'Aegis Shield Charge',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 24,
      tellDurationSec: 0.25,
      actionDurationSec: 0.35,
      cooldownSec: 4.5,
      heatCost: 12,
      range: 36,
      description: 'Driving shield rush that knocks back and stuns enemies in your path.',
    },
    {
      slot: 2,
      name: 'Bell-Ringer Slam',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 18,
      tellDurationSec: 0.2,
      actionDurationSec: 0.32,
      cooldownSec: 4.8,
      heatCost: 11,
      range: 25,
      description: 'Heavy face-slam with the shield boss that interrupts enemy windups.',
    },
    {
      slot: 3,
      name: 'Block',
      damageType: 'Wave',
      damageFamily: 'Energy',
      damage: 14,
      tellDurationSec: 0.08,
      actionDurationSec: 0.28,
      cooldownSec: 3.5,
      activeDurationSec: 2.4,
      reloadDurationSec: 3.5,
      isBlock: true,
      heatCost: 10,
      range: 28,
      description: 'Raises heater shield guard for 2.4s to block incoming attacks (+20 Shield), then enters reload recovery.',
    },
    {
      slot: 4,
      name: 'Sanctum Phalanx Wall',
      damageType: 'Blast',
      damageFamily: 'Energy',
      damage: 28,
      tellDurationSec: 0.35,
      actionDurationSec: 0.5,
      cooldownSec: 8.5,
      heatCost: 22,
      range: 36,
      description: 'Discharge shield capacitors in a wide frontal shockwave while clearing Overload.',
    },
  ],
};
