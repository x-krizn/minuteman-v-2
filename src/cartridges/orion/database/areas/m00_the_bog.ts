/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AreaWikiDefinition {
  id: string;
  name: string;
  title: string;
  world: string;
  recommendedLevels: string;
  description: string;
  lore: string;
  spawnAnchor: { room: string; x: number; y: number };
  exitAnchor: { room: string; x: number; y: number };
}

export const m00TheBogArea: AreaWikiDefinition = {
  id: 'm00_the_bog',
  name: 'M00 — The Bog',
  title: 'Drop-Pod Crater & Toxic Marshes',
  world: 'Belldor (Camelot)',
  recommendedLevels: 'Levels 1–2',
  description:
    'Murky marshlands of deep mud, shifting reeds, and ruined pylons. Teaches movement, weapon attacks, Booster Kit evasion, and the Three Defense Layers.',
  lore:
    'Following orbital drop-pod impact, the pilot mechs reinitialize in the toxic boglands outside Camelot. In the distance, cathedral towers flicker through the mist.',
  spawnAnchor: { room: '0,0', x: 48, y: 72 },
  exitAnchor: { room: '3,0', x: 120, y: 96 },
};

export const borderTownSlumsArea: AreaWikiDefinition = {
  id: 'border_town_slums',
  name: 'Border Town Slums',
  title: 'Outskirts of Camelot',
  world: 'Belldor (Camelot)',
  recommendedLevels: 'Levels 3–4',
  description:
    'Fortified shantytown of scavenger barricades, sniper towers, and desynchronized stone arcades.',
  lore:
    'Refugees and mercenaries trade scrap beneath the shadow of Camelot, constantly harassed by orc raiders.',
  spawnAnchor: { room: '4,0', x: 32, y: 96 },
  exitAnchor: { room: '5,0', x: 140, y: 96 },
};

export const AREA_REGISTRY: Record<string, AreaWikiDefinition> = {
  m00_the_bog: m00TheBogArea,
  border_town_slums: borderTownSlumsArea,
};
