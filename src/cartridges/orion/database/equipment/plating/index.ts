/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CANONICAL_FRAME_PLATING as BASELINE_FRAME_PLATING,
  CoreplateDefinition,
  FramePlatingDefinition,
} from './coreplates';

export type { CoreplateDefinition, FramePlatingDefinition };

// Auto-discover any standalone Frame Plating (.ts) modules dropped into database/equipment/plating/
const modules = import.meta.glob<Record<string, unknown>>('./**/*.ts', { eager: true });

const discoveredPlating: FramePlatingDefinition[] = [...BASELINE_FRAME_PLATING];
const seenIds = new Set<string>(discoveredPlating.map((p) => p.id));

function isFramePlatingDefinition(val: unknown): val is FramePlatingDefinition {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'slot' in val &&
    (val as { slot?: unknown }).slot === 'plating' &&
    'armorType' in val
  );
}

for (const [path, mod] of Object.entries(modules)) {
  if (path === './index.ts' || path === './coreplates.ts') continue;
  for (const exportedValue of Object.values(mod)) {
    if (isFramePlatingDefinition(exportedValue) && !seenIds.has(exportedValue.id)) {
      discoveredPlating.push(exportedValue);
      seenIds.add(exportedValue.id);
    }
  }
}

export const CANONICAL_FRAME_PLATING: FramePlatingDefinition[] = discoveredPlating;
export const CANONICAL_COREPLATES: FramePlatingDefinition[] = CANONICAL_FRAME_PLATING;

export function getFramePlatingDefinition(idOrName?: string | null): FramePlatingDefinition | undefined {
  if (!idOrName) return undefined;
  const norm = idOrName.trim().toLowerCase();
  return (
    CANONICAL_FRAME_PLATING.find((p) => p.id.toLowerCase() === norm) ||
    CANONICAL_FRAME_PLATING.find((p) => p.name.toLowerCase() === norm) ||
    CANONICAL_FRAME_PLATING.find((p) => p.legacyNames?.some((l) => l.toLowerCase() === norm)) ||
    CANONICAL_FRAME_PLATING.find((p) =>
      norm.includes(p.id.replace(/^(coreplate_|hw_plating_|plating_)/, ''))
    )
  );
}

export const getCoreplateDefinition = getFramePlatingDefinition;
