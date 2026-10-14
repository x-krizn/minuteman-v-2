/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../types';

export const VERDANT_TILES_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAC30lEQVR42u2ZvW7bMBDH/6YNtFOyZHVgoICHTAW9GR7aLav9AgbqN+gT5Am6eO8b9GMp0C0ZDG0yOnVIUaDIGqBFi3bwYKQTBZYhqTtSBqLquEgi+bs7/fkhkuoBuEOHk0LHkwjQdQEGADCbzdjgZrOp7tvMqxTYdtp2XuYAEUAEEAFEgC6n3vOXz9h7gflogXff3ibnc/nUeCj1ggJQjKYGTOVzyyn+g0MgZHg+WpCN5/C5MZg6dXUVpbKdb4KajxYoyzLIhYKn8m6eG4PNx+KMiViWJXpyHiCfQRFAzgP0uWaD24/b6r7NvArBx2dHUQOGizmP2aDwuf4pfHAI/Pz8K7t7GRt1YrZyDuC8lE/MVFFyxXR5dQgnh0yxnkmJ2+VVqhNOq/ryQz58dakNktLTVJMtECrjzCe+ujnzUR3b2nVAU3NBT5/rOy5oz+6uwr48ii0uHxuK1NgBQFGV9DnUY32vJTgBHYLnDAc91mknQv/VUvikfxIsPH1yipuvN95ntyzEhMqoPNcP164yD25lAMEXcctsPpRP5Zv2E3oX8yxDQI81ttfbpG/t8dkRmuAv318lf8p8POdL0n88fnQBALvbXZVp7uvS7naHH+o7bL7OoV3P8FR/dbwp58SvLl9dZa26XJ67KmuST+mFqomtbxNb5we5Hc5ZbuZsargbq5x41aH28ZxNDWe3GIspZauscvfTbT9HUE2O5VQ+98QoJ2710FusiV4Vs1H9Guvq0bj8G0THkwjQdQEGy+USk8kE0+mUBBRF8U/d9Xp9j3fruM92no/nxBHifT7tfHPtr1ari5DzoigwHA6rK4DqatJ+v68Mhuq4z3ae4W1/oTg4vM+OnW+u0SFgDFNaJyYiNYVsUHtHSgzK13WoXZASXJ19u/UocVB5qoA9AHf69dPkSWT74hPazA8A4PeHP1kzaZt5WQeIACKACCACXL/5kgQbrs28nAfIEBABup3+AmL6JCRKtnLoAAAAAElFTkSuQmCC';

export const TILES_G_PNG = VERDANT_TILES_PNG;

export const verdantRuinsBiome: BiomeDefinition = {
  id: 'verdant_ruins',
  name: 'Verdant Ruins',
  description: 'Ancient stone halls reclaimed by bioluminescent moss and deep roots.',
  bgColor: '#05130b',
  ambientColor: '#14532d',
  dustColor: '#4ade80',
  tileset: {
    type: 'sheet',
    sheetUri: VERDANT_TILES_PNG,
    tileSize: 16,
  },
};

