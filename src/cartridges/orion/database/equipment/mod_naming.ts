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
 * Determines whether an equipment base name should receive `"Custom"` as a suffix
 * (`<BaseName> Custom`) rather than a prefix (`Custom <BaseName>`) based on semantics:
 * - Alphanumeric model designations (`N-55 Gladius`, `M-300 Hasta`, `WZ-800 Arclight Cannon`, `S-2 Turbine Khopesh`, `G341 Murmillio`)
 * - Manufacturer/faction-coded hardware titles (`BWI ...`, `PNSY ...`, `VX ...`, `ARC ...`, `SANC ...`, `TI ...`, `RAD ...`, `NDS ...`, `BE ...`)
 * - Equipment with explicit mark designations (`Mk.III`, `Mk.IV`, `Mk.V`, `Mk.VI`)
 */
export function usesCustomSuffixBySemantics(baseName: string): boolean {
  const trimmed = baseName.trim();
  if (!trimmed) return false;
  if (/^[A-Z]{1,4}-?\d+/i.test(trimmed)) return true;
  if (
    /^(BWI|PNSY|BE|NDS|RAD|TI|VX|ARC|SANC|Crystal Dynamics|Fire & Ice|Federated)\b/i.test(
      trimmed
    )
  ) {
    return true;
  }
  if (/\bMk\.[IVX0-9]+/i.test(trimmed)) return true;
  return false;
}

/**
 * Parses any equipment identifier (`<baseId>`, `<baseId>::<gem1>+<gem2>`, or sparse `<baseId>::none+<gem2>`)
 * into its base item ID, dense array of installed Gemstone mods, and positional `slotGems` array (`GemId | null`).
 */
export function parseEquipmentInstanceId(rawId: string | null | undefined): {
  baseId: string;
  installedGems: GemId[];
  slotGems: Array<GemId | null>;
} {
  if (!rawId) {
    return { baseId: '', installedGems: [], slotGems: [] };
  }
  const sepIdx = rawId.indexOf('::');
  if (sepIdx < 0) {
    return { baseId: rawId.trim(), installedGems: [], slotGems: [] };
  }
  const baseId = rawId.slice(0, sepIdx).trim();
  const gemPart = rawId.slice(sepIdx + 2).trim();
  const rawSlotGems: Array<GemId | null> = gemPart
    .split('+')
    .map((g) => g.trim().toLowerCase())
    .map((token) => (isCanonicalGemId(token) ? token : null));

  let lastValidIdx = -1;
  for (let i = rawSlotGems.length - 1; i >= 0; i--) {
    if (rawSlotGems[i] !== null) {
      lastValidIdx = i;
      break;
    }
  }
  const slotGems = lastValidIdx >= 0 ? rawSlotGems.slice(0, lastValidIdx + 1) : [];
  const installedGems = slotGems.filter((g): g is GemId => isCanonicalGemId(g));
  return { baseId, installedGems, slotGems };
}

/**
 * Constructs a deterministic composite equipment instance ID from a base item ID and
 * either a dense array of `GemId`s or a positional slot array (`Array<GemId | null | undefined>`).
 * Preserves `'none'` slot placeholders when later slots are populated before earlier slots.
 */
export function buildEquipmentInstanceId(
  baseId: string,
  installedGemsOrSlots: ReadonlyArray<GemId | null | undefined>
): string {
  const cleanBase = parseEquipmentInstanceId(baseId).baseId;
  let lastValidIdx = -1;
  for (let i = installedGemsOrSlots.length - 1; i >= 0; i--) {
    if (isCanonicalGemId(installedGemsOrSlots[i])) {
      lastValidIdx = i;
      break;
    }
  }
  if (lastValidIdx < 0) return cleanBase;
  const serializedSlots: string[] = [];
  for (let i = 0; i <= lastValidIdx; i++) {
    const g = installedGemsOrSlots[i];
    serializedSlots.push(isCanonicalGemId(g) ? g : 'none');
  }
  return `${cleanBase}::${serializedSlots.join('+')}`;
}

/**
 * Formats an equipment item's display name from its base name and installed Gemstones/Mods:
 * - Uses semantic `"Custom"` placement:
 *   - Model designations & coded titles (`N-55 Gladius`, `BWI Bastion Frame Plating`) -> `<BaseName> Custom`
 *   - Standard weapon/armor nouns (`Camelot Longsword`, `Heater Shield`) -> `Custom <BaseName>`
 * - 2nd+ mods append a Roman numeral tier count (`+II`, `+III`, e.g. `Custom Camelot Longsword +II` or `N-55 Gladius Custom +II`).
 */
export function formatModifiedEquipmentName(
  baseName: string,
  installedGems: ReadonlyArray<GemId | null | undefined>
): string {
  const validGems = installedGems.filter((g): g is GemId => isCanonicalGemId(g));
  if (validGems.length === 0) return baseName;
  const tierSuffix =
    validGems.length >= 2
      ? ` ${ROMAN_NUMERAL_BY_COUNT[validGems.length] || `+${validGems.length}`}`
      : '';
  const cleanBase = baseName
    .replace(/^Custom\s+/i, '')
    .replace(/\s+Custom(?:\s+\+[IVX0-9]+)?$/i, '')
    .trim();
  if (usesCustomSuffixBySemantics(cleanBase)) {
    return `${cleanBase} Custom${tierSuffix}`;
  }
  return `Custom ${cleanBase}${tierSuffix}`;
}

