/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponDefinition } from '../../types';

/**
 * Row 13 (row = 12): Great Bow 144x16 (9 cols x 16px) Self-Contained Base64 PNG Strip
 * Col 0 = Base / White (Moonstone), Cols 1..8 = Red, Orange, Yellow, Green, Blue, Purple, Magenta, Black
 */
export const GREAT_BOW_STRIP_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAQCAYAAAD59vZgAAAClElEQVR42u2ZsWobQRCG70lcqEuhxipM4GpDkAlJSkHSWBxJlcIPEAjxGwTB4T6Fa3d5ARV6BL9GmmvWTMgfNpuZnf92kY6EO9hmdd+cvXz6dbPbNPM1X6e6+u4q1PAhhJn/X3l8mLupu1oFS6LD4fBzfliv6/hhWn47bKv4zeahir+5+THp+nddV8T/lsizNFdke3YWcv+Ax9+9bUJOAI/f7ZZVfLtrQ04gj3/x8n3ICeTx5+cfQ06gY6+/KJATKMuH6PKiTCsifzhGET+sA8YUvIiDUcKLOBglvIiDMcX6izgYJTz1W4d5r4B8E9SEWC4pXpJIfX7fULwkkTa/37cUL0mkzV/eX1K8JJE2/+76M8VLEmnzr551Vet/+/wDxctSa5OLxYLl/RcuKSCFrM/3bVvFh0NTxT8+XlTxm/2miv/05VsVf/umr+K/v/5axa9WqyrefbFmCkAiTSaGh0SaTAwPiTSZGB4SaTIxPCTSZGJ4SKTJxPCQSJOJ4SGRJhMlUC6J2AJWErG8lUQsbyURy1tJxPJWErG8lUQsbyURy1tJNCfQnECnSSAtiUbDiUQlfCxRCR9LVMLHEpXwsUQlfCxRCR9LVMLHEv3Fp8W8LiwtkN6PbsvqDvq+z/LotqzuzOPRbVndmcej27K6M49Ht2V1Zx6Pbsvqzjwe3Vbp+qPbsrqzlOd6e8dempeHK3sNM/9v838U0QphXu6x3o1c/tfD8U1IN71YHkmUbhqyPJKolEcSpZuOLI8kSjcdWR5JlG46nmr9kUSqSFIkLhSLk8ae9lM3htd2TUfxw7S8tms9htd2rcfw2q71Kdc/u2sNIAXZY48cz2y7Z3ni2OKYPHPskeOZY48czxx7HHP942OPJ4buxkZhWz1nAAAAAElFTkSuQmCC';

export const greatBowWeapon: WeaponDefinition = {
  id: 'great_bow',
  name: 'Arclight Great Bow',
  class: 'Heavy Great Bow',
  equipmentRole: 'ranged',
  handing: '2-hand',
  weightClass: 'heavy',
  bladeTrailColor: '#f8fafc',
  description: 'High-draw torsion great bow firing heavy armor-piercing sabot arrows across long sightlines.',
  lore:
    'Crafted in the New Novarin and Belldor frontier traditions. Pairs naturally with a Fletcher Quiver in the offhand for extended salvos.',
  shotsPerChain: 5,
  damagePerShot: 11,
  chainDurationSec: 1.5,
  reloadDurationSec: 2.4,
  primaryDamageType: 'Pierce',
  variantStripBase64: GREAT_BOW_STRIP_BASE64,
  hardpointSprite: {
    base64: GREAT_BOW_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    renderWidth: 15,
    renderHeight: 15,
    anchor: 'center',
    orientFromEast: true,
  },
  iconSprite: {
    base64: GREAT_BOW_STRIP_BASE64,
    cellWidth: 16,
    cellHeight: 16,
    col: 0,
    row: 0,
    anchor: 'center',
  },
  moveset: [
    {
      slot: 0,
      name: 'Heavy Draw Arrow',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 11,
      tellDurationSec: 0.12,
      actionDurationSec: 0.35,
      cooldownSec: 0,
      heatCost: 4,
      range: 120,
      description: 'Five-arrow heavy draw chain dealing 11 Pierce damage per arrow (55 BCU total).',
    },
    {
      slot: 1,
      name: 'Bodkin Rail-Shot',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 28,
      tellDurationSec: 0.3,
      actionDurationSec: 0.4,
      cooldownSec: 4.5,
      heatCost: 14,
      range: 140,
      description: 'Full-draw bodkin shaft that punches straight through high-threshold armor.',
    },
    {
      slot: 2,
      name: 'Broadhead Fan Volley',
      damageType: 'Pierce',
      damageFamily: 'Kinetic',
      damage: 16,
      tellDurationSec: 0.2,
      actionDurationSec: 0.38,
      cooldownSec: 5.0,
      heatCost: 15,
      range: 95,
      description: 'Looses a spread of razor broadhead arrows across a wide frontal cone.',
    },
    {
      slot: 3,
      name: 'Pinning Tether Arrow',
      damageType: 'Impact',
      damageFamily: 'Kinetic',
      damage: 18,
      tellDurationSec: 0.22,
      actionDurationSec: 0.35,
      cooldownSec: 5.5,
      heatCost: 12,
      range: 110,
      description: 'Snare-weighted shaft that staggers and slows advancing targets.',
    },
    {
      slot: 4,
      name: 'Starfall Arc Barrage',
      damageType: 'Blast',
      damageFamily: 'Energy',
      damage: 36,
      tellDurationSec: 0.42,
      actionDurationSec: 0.55,
      cooldownSec: 9.0,
      heatCost: 28,
      range: 130,
      description: 'Overcharges the bowstring with reactor energy to loose an explosive arrow salvo.',
    },
  ],
};
