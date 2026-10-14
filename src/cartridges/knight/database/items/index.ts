/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemWikiDefinition } from '../../types';

export const ITEMS_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFFUlEQVR4Ae1ZPXcTOxBdc/gT0CYtNPY5UJA2KXALhd2SpIMi/hlJAV0MrV1Aa4qkTQo4x26gTZoUuElNu+iuPZvZ2dGX1w7xh94JkkZzR3OvpF15X5JsykaBhShwetBMKTBvk+0+6uFwmOLPNddj22B6mqRJ/W601khqd72w1v8ijuxAvNFoZDnztsxcFUCSBygdJmmMCIfdQe2gWc/U7w5GXvEQnycXMxfHxbZLiRXIj1i46W4ITUyuPgRh0QrNjDyfC6NmvtC5CsFMJzVF2tCvmSLt6g7InJAQOwKJ7MtInj4E0UQg8rXD4hHDQsTuOqQA8qORVHOSHMakCHYBPIRcw7T6BweDzK3bbbrcnWPyaEhn1y4xz4DM3TwDJCzvP8pbc2pI8ghLQtBY1FRYTFpQUbvIh84xdwFCJw71o6PByWY2I4Zvd7hWnua3C4DzT+qj5s8DQos6ZIVLPrbYNL+ZIxfBPCdICNioLdKI6pYEIHWzKEiC/kwzZkJ+7nlbZkfzYTX5H8Qn4hIzz776EMTEhddhJHlK0EWcfFDn8zHjvMj7joEqACXF8glujv6Mk/rTJwnVAFKbai3YvAhrsV220sXA5RwyhjMOolqBMNpdQPOtYqvXJzdQGcPcD+bOV86x6W8U2CiwQgqYn1T4/aD+sgqh2frRqoQ/OvpVCX919d6LL12EiBjI5+0ZRAD5KniQr4IH+RC8KoBB5uCQIORDNSdPNiwFtX01J0++MXhO3odXBSBQoS5/SygM+zrtn22fi3O80/ntHPcNXl9/UF3CBFhR8lDEehXGYPZDrQL525vbpG3+m7WMxzdJpzMrOknG478GrK88RbXuAJCvUkC+SgH5KmVC3h9BFWBdyEMeVQDzJa30o8EYSjabvudvz0u+/Zf9ks2G7/ebJd+Tk+clmw2/s/Ol5Lu9/alks+Fzu/mUiHdX8OsrB04bu193U+2VKP1s/VZrkGqvRJu/tF9cvEu1V6L02/Q3CqyxAuqDwXbtlP9XxabbsuMzXlMSeACiGf0gXBa88yY4A+/Cplhq/HQF+W4okPN1lgWvXoR85FZp3H0EKlyCIFKVSxDwVS5BwIdcgtZ+B2wEwFZZ52K/CMkPIeYqEHMRkp/Aei96UXj5Cez4+FkUXn4C29r6qOJLRwCvr5Ehn38TMMTRho2/2my7Bj573/YS+iAC4mjDFopvt7+brzk32RQgjjZsofjLy/3p16AkAXF8HIFNwzvfApkIcifYmCv2jPjNnjISZpoQnwgRhih6gfh4vF80il5pB4jxle+uvQDWhyDOPC/1yIcgzjwvZ2/O1IcQ96E2zirOPC+93usoPM48L69efVbxRZYMIR8YoW8ACrEseKsARCS2BnGIJQVAnFgRY+eexX/uAsgkHroQCxcAgjxkERb2FuCkta3Px+Wuuc9+0A5AshqJ2EQlaRnTNx47X2V/nhBvuwJLP60PG4ovzsSr+K8L4xqzzRe0AygwBZErR+MhNcWAb0gc7s/jh2DhDzx8eRyODRKAg2dJgmN4LJ4I99HaHEfjMXjCUBzC5j+GaIAcQ2pgKFCIf4zPImMjD4qfC7AoIjbSvvlonBK1xQm1a3FgW9hrUEsME8JO5DQfsvl8Y2K45gx6BlBSVWuQCkmc5iERqE91TAzCoNbi3asAPBlXW03UsHZh+BjwUiQtJjDBQfkEi2prSUois8ytxUUcxH5QAsxCzoexkV9ZAVyEuVi0+P8AZkYXIxg5q60AAAAASUVORK5CYII=';

// Dynamic recursive auto-discovery: any item file committed to this directory or any subdirectory is automatically loaded!
const itemModules = import.meta.glob('./**/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

const itemMap = new Map<string, ItemWikiDefinition>();

for (const [path, mod] of Object.entries(itemModules)) {
  if (path.endsWith('index.ts')) continue;
  for (const exp of Object.values(mod)) {
    if (
      exp &&
      typeof exp === 'object' &&
      'id' in exp &&
      'name' in exp
    ) {
      const item = exp as ItemWikiDefinition;
      itemMap.set(item.id, item);
    }
  }
}

export const ALL_ITEMS: ItemWikiDefinition[] = Array.from(itemMap.values());

export const ITEM_REGISTRY: Record<string, ItemWikiDefinition> = ALL_ITEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, ItemWikiDefinition>
);

export const ITEM_BY_SYMBOL: Record<string, ItemWikiDefinition> = ALL_ITEMS.reduce(
  (acc, item) => {
    if (item.symbol) {
      acc[item.symbol] = item;
    }
    if (item.spawning?.proceduralPlacementSymbol) {
      acc[item.spawning.proceduralPlacementSymbol] = item;
    }
    if (item.spawning?.legacyAliases) {
      item.spawning.legacyAliases.forEach((alias) => {
        acc[alias] = item;
      });
    }
    return acc;
  },
  {} as Record<string, ItemWikiDefinition>
);

export function getItemDefinition(idOrSymbol: string): ItemWikiDefinition | undefined {
  return ITEM_REGISTRY[idOrSymbol] || ITEM_BY_SYMBOL[idOrSymbol];
}
