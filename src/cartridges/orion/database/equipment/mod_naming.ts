/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GemId } from '../../types';

const VALID_GEM_IDS: ReadonlySet<string> = new Set<GemId>([
  'moonstone',
  'spinel',
  'carnelian',
  'titanite',
  'demantoid',
  'kyanite',
  'charoite',
  'rubellite',
  'hematite',
]);

/**
 * Canonical naming prefixes applied when a Gemstone is installed as the first mod on any equipment item.
 * - Spinel -> Assault
 * - Carnelian -> Heavy
 * - Titanite -> Aegis
 * - Demantoid -> Harmonic
 * - Kyanite -> Arclight
 * - Charoite -> Phantom
 * - Moonstone -> Radiant
 * - Rubellite -> Volatile
 * - Hematite -> Ichor
 */
export const GEM_MOD_PREFIX_BY_ID: Record<GemId, string> = {
  spinel: 'Assault',
  carnelian: 'Heavy',
  titanite: 'Aegis',
  demantoid: 'Harmonic',
  kyanite: 'Arclight',
  charoite: 'Phantom',
  moonstone: 'Radiant',
  rubellite: 'Volatile',
  hematite: 'Ichor',
};

const ROMAN_NUMERAL_BY_COUNT: Record<number, string> = {
  2: '+II',
  3: '+III',
  4: '+IV',
  5: '+V',
};

/**
 * Type guard verifying whether a string is a canonical `GemId`.
 */
export function isCanonicalGemId(val: string | null | undefined): val is GemId {
  return Boolean(val && VALID_GEM_IDS.has(val));
}

/**
 * Parses any equipment identifier (`<baseId>` or `<baseId>::<gem1>+<gem2>`) into its base item ID
 * and ordered array of installed Gemstone mods.
 */
export function parseEquipmentInstanceId(rawId: string | null | undefined): {
  baseId: string;
  installedGems: GemId[];
} {
  if (!rawId) {
    return { baseId: '', installedGems: [] };
  }
  const sepIdx = rawId.indexOf('::');
  if (sepIdx < 0) {
    return { baseId: rawId.trim(), installedGems: [] };
  }
  const baseId = rawId.slice(0, sepIdx).trim();
  const gemPart = rawId.slice(sepIdx + 2).trim();
  const installedGems = gemPart
    .split('+')
    .map((g) => g.trim().toLowerCase())
    .filter(isCanonicalGemId);
  return { baseId, installedGems };
}

/**
 * Constructs a deterministic composite equipment instance ID from a base item ID and installed Gemstones.
 */
export function buildEquipmentInstanceId(
  baseId: string,
  installedGems: GemId[]
): string {
  const cleanBase = parseEquipmentInstanceId(baseId).baseId;
  const validGems = installedGems.filter(isCanonicalGemId);
  if (validGems.length === 0) return cleanBase;
  return `${cleanBase}::${validGems.join('+')}`;
}

/**
 * Formats an equipment item's display name from its base name and ordered array of installed Gemstones.
 * - 1st mod sets the prefix (`<Prefix> <BaseName>`, e.g. `Assault Camelot Longsword`).
 * - 2nd+ mods preserve the 1st prefix and append a Roman numeral count (`+II`, `+III`, e.g. `Aegis Camelot Longsword +II`).
 */
export function formatModifiedEquipmentName(
  baseName: string,
  installedGems: GemId[]
): string {
  const validGems = installedGems.filter(isCanonicalGemId);
  if (validGems.length === 0) return baseName;
  const prefix = GEM_MOD_PREFIX_BY_ID[validGems[0]] || 'Modified';
  const suffix =
    validGems.length >= 2
      ? ` ${ROMAN_NUMERAL_BY_COUNT[validGems.length] || `+${validGems.length}`}`
      : '';
  return `${prefix} ${baseName}${suffix}`;
}
