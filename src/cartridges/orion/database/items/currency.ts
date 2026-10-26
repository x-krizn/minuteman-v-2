/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Row 1 (row = 0, Cols 0..2) Self-Contained 16x16 Base64 Coin & Coin Bag Sprites:
 * - Col 0: Small Coin (value 1..4)
 * - Col 1: Large Coin (value 5..14)
 * - Col 2: Coin Bag (value 15+)
 */
export const SMALL_COIN_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKUlEQVR42mNgGAWDHPyfyfD//xmG/xRphmHyDZhJqQFnqOCN0dRAYwAAvqIrb52E+KIAAAAASUVORK5CYII=';
export const LARGE_COIN_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAM0lEQVR42mNgGL7g/0yG///PIDBFmkkyBEXzTCRMrCFwxeiumDkCDSA3ECmORqokpKEFAKg1uOHcEzEXAAAAAElFTkSuQmCC';
export const COIN_BAG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVR42mNgGLRgZprPf2xskgxAxmS5Is3H+D8Ik+0FilyAbgBJhsA0/J/J8P//GQbSDEDXDMNEG4JhACmuQPYvLhfgNQQ90NBtJ9kAXBivAaCEg0xjEyMYDrAUiI7JTtL4AACp3MktiGGiFgAAAABJRU5ErkJggg==';

export function getCoinPickupSpriteBase64(value: number): string {
  if (value >= 15) return COIN_BAG_BASE64;
  if (value >= 5) return LARGE_COIN_BASE64;
  return SMALL_COIN_BASE64;
}
