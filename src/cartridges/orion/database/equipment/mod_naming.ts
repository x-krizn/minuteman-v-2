/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GemId } from '../../types';

/** Immutable 9-gemstone identifier set used for mod naming classification (no runtime growth). */
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
 * Type guard verifying whether a slot token represents a populated modification slot
 * (either a canonical `GemId` or `'mod'` for an installed component with 0 socketed gems).
 */
export function isPopulatedModSlotToken(
  val: string | null | undefined
): val is GemId | 'mod' {
  return Boolean(val && (val === 'mod' || VALID_GEM_IDS.has(val)));
}

/**
 * Parses any equipment identifier (`<baseId>`, `<baseId>::<gem1>+<gem2>`, `<baseId>::mod+spinel`, or sparse `<baseId>::none+<gem2>`)
 * into its base item ID, dense array of installed Gemstone mods, positional `slotGems` array (`GemId | null`),
 * positional `slotTokens` array (`GemId | 'mod' | null`), and total `populatedSlotCount` (`0..3`).
 */
export function parseEquipmentInstanceId(rawId: string | null | undefined): {
  baseId: string;
  installedGems: GemId[];
  slotGems: Array<GemId | null>;
  slotTokens: Array<GemId | 'mod' | null>;
  populatedSlotCount: number;
} {
  if (!rawId) {
    return {
      baseId: '',
      installedGems: [],
      slotGems: [],
      slotTokens: [],
      populatedSlotCount: 0,
    };
  }
  const sepIdx = rawId.indexOf('::');
  if (sepIdx < 0) {
    return {
      baseId: rawId.trim(),
      installedGems: [],
      slotGems: [],
      slotTokens: [],
      populatedSlotCount: 0,
    };
  }
  const baseId = rawId.slice(0, sepIdx).trim();
  const gemPart = rawId.slice(sepIdx + 2).trim();
  const rawTokens = gemPart.split('+').map((g) => g.trim().toLowerCase());
  const rawSlotTokens: Array<GemId | 'mod' | null> = rawTokens.map((token) =>
    isCanonicalGemId(token) ? token : token === 'mod' ? 'mod' : null
  );
  const rawSlotGems: Array<GemId | null> = rawSlotTokens.map((token) =>
    isCanonicalGemId(token) ? token : null
  );

  let lastValidIdx = -1;
  for (let i = rawSlotTokens.length - 1; i >= 0; i--) {
    if (rawSlotTokens[i] !== null) {
      lastValidIdx = i;
      break;
    }
  }
  const slotTokens = lastValidIdx >= 0 ? rawSlotTokens.slice(0, lastValidIdx + 1) : [];
  const slotGems = lastValidIdx >= 0 ? rawSlotGems.slice(0, lastValidIdx + 1) : [];
  const installedGems = slotGems.filter((g): g is GemId => isCanonicalGemId(g));
  const populatedSlotCount = slotTokens.filter((t) => t !== null).length;
  return { baseId, installedGems, slotGems, slotTokens, populatedSlotCount };
}

/**
 * Constructs a deterministic composite equipment instance ID from a base item ID and
 * either a dense array of `GemId`s or a positional slot array (`Array<GemId | 'mod' | null | undefined>`).
 * Preserves `'none'` slot placeholders when later slots are populated before earlier slots.
 */
export function buildEquipmentInstanceId(
  baseId: string,
  installedGemsOrSlots: ReadonlyArray<GemId | 'mod' | null | undefined>
): string {
  const cleanBase = parseEquipmentInstanceId(baseId).baseId;
  let lastValidIdx = -1;
  for (let i = installedGemsOrSlots.length - 1; i >= 0; i--) {
    if (isPopulatedModSlotToken(installedGemsOrSlots[i])) {
      lastValidIdx = i;
      break;
    }
  }
  if (lastValidIdx < 0) return cleanBase;
  const serializedSlots: string[] = [];
  for (let i = 0; i <= lastValidIdx; i++) {
    const g = installedGemsOrSlots[i];
    serializedSlots.push(isPopulatedModSlotToken(g) ? g : 'none');
  }
  return `${cleanBase}::${serializedSlots.join('+')}`;
}

/**
 * Formats an equipment item's display name from its base name and installed Gemstones/Mods:
 * - Uses semantic `"Custom"` placement:
 *   - Model designations & coded titles (`N-55 Gladius`, `BWI Bastion Frame Plating`) -> `<BaseName> Custom`
 *   - Standard weapon/armor nouns (`Camelot Longsword`, `Heater Shield`, `Short Spear`) -> `Custom <BaseName>`
 * - 2nd+ populated slots append a Roman numeral tier count (`+II`, `+III`, e.g. `Custom Short Spear +II` or `Custom Bolt Caster +III`).
 */
export function formatModifiedEquipmentName(
  baseName: string,
  installedGems: ReadonlyArray<GemId | 'mod' | null | undefined>,
  explicitPopulatedSlotCount?: number
): string {
  const validTokens = installedGems.filter((g): g is GemId | 'mod' =>
    isPopulatedModSlotToken(g)
  );
  const count =
    typeof explicitPopulatedSlotCount === 'number'
      ? explicitPopulatedSlotCount
      : validTokens.length;
  if (count <= 0) return baseName;
  const tierSuffix =
    count >= 2 ? ` ${ROMAN_NUMERAL_BY_COUNT[count] || `+${count}`}` : '';
  const cleanBase = baseName
    .replace(/^Custom\s+/i, '')
    .replace(/\s+Custom(?:\s+\+[IVX0-9]+)?$/i, '')
    .trim();
  if (usesCustomSuffixBySemantics(cleanBase)) {
    return `${cleanBase} Custom${tierSuffix}`;
  }
  return `Custom ${cleanBase}${tierSuffix}`;
}

