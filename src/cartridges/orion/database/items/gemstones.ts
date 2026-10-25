/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GemDefinition, GemId, ItemWikiDefinition, TraitLine } from '../../types';

/**
 * Row 2 (row = 1) Sliced 16x16 Base64 Gemstone Icons (Cols 0..8: White, Red, Orange, Yellow, Green, Blue, Purple, Magenta, Black)
 * Self-contained inside this entry file with zero dependency on external PNG sheets.
 */
export const GEM_MOONSTONE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARElEQVR42t3MoREAMAxC0UybnZg2vQjuEDXgWhTmv6q/B2B2cUzARhgrYCE3YH8M8NtAd49iFrBxDDCOAUWiWJE4fmcH0UqLQt77KKQAAAAASUVORK5CYII=';
export const GEM_SPINEL_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQ0lEQVR42mNgGN7gPwPDfxAgXzPUAJINgWtGMoAkQ7AaABYm1wAom2QDViEbRKoBqygxYBWlBiAbQpZmZEPI1jx0AACS2W6S+Xqc/wAAAABJRU5ErkJggg==';
export const GEM_CARNELIAN_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQ0lEQVR42mNgGN7g/xmG/yBAvmaoASQbAteMZABJhmA14AwDBQZA2aQbMBPJIJINmEmJATMpNADFEHI0oxhCruahAwALZY7YDVNp6gAAAABJRU5ErkJggg==';
export const GEM_TITANITE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAR0lEQVR42t3MoREAMAxC0czUNTp2topJL4I7RA24FoX5L+LvVe2e2TEAGUHMgITcgPk2gC8DmasZk4CJbQCxDTBixYzY8Ts7OuadkC+jP88AAAAASUVORK5CYII=';
export const GEM_DEMANTOID_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAR0lEQVR42t3MoREAMAxC0UyXSTJdR6xJL4I7RA24FoX5L+Lv1a6e2TEAGUHMgITcgPk2gC8DubIZk4CJbQCxDTBixYzY8Ts73yWKWP+gy+YAAAAASUVORK5CYII=';
export const GEM_KYANITE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAR0lEQVR42t3MoREAMAxC0cyZNbJaV6tOL4I7RA24FoX5L+LvVe2e2TEAGUHMgITcgPk2gC8DmasZk4CJbQCxDTBixYzY8Ts7PuWPCDxfBNMAAAAASUVORK5CYII=';
export const GEM_CHAROITE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAASElEQVR42mNgGN6gNWjmfxAgWzPMAJINgWlGNoAkQ7AZAGKTbQCMTbIBAZpp/5ENI8kAkGayDYBpJtsAZEPI0oxsCNmahw4AAP0Nfa0c7YVgAAAAAElFTkSuQmCC';
export const GEM_RUBELLITE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAASElEQVR42mNgGN5gd+CU/yBAtmaYASQbAtOMbABJhmAzAMQm2wAYm2QDWi0z/yMbRpIBIM1kGwDTTLYByIaQpRnZELI1Dx0AAAtZhdUJ0y4wAAAAAElFTkSuQmCC';
export const GEM_HEMATITE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARUlEQVR42t3MoREAMAxC0cySFdh/tvQiuEPUgGtRmP+q/h6A2cUxARthrICF3ID9McBvA909ilnAxjHAOAYUiWJF4vidHb3PYDqLk2r0AAAAAElFTkSuQmCC';

/**
 * Canonical Nine-Gemstone Matrix (Row 2 defines Columns 0..8 for all Equipment & Flask rows)
 * Gems are a single currency with three uses:
 * 1. Experience for Pilot Skills (permanently consumed)
 * 2. Sockets for Feat Nodes (removed from inventory, retained in build, refunded on unsocket)
 * 3. Components for Equipment Mods (spent to generate; mod retained, gems are not; also tints modified equipment & VFX)
 */
export const GEMSTONE_CATALOG: GemDefinition[] = [
  {
    id: 'moonstone',
    name: 'Moonstone',
    colorName: 'White',
    hexColor: '#f8fafc',
    coreHexColor: '#ffffff',
    colIndex: 0,
    iconBase64: GEM_MOONSTONE_BASE64,
    assignment: 'Mana Reactor Core',
    identity:
      'Precision and control. Tradition of Belldor (Camelot) and Tyrranus. Powers shields, auras, and barrier harmonics.',
    primaryResource: 'n/a',
    reactor: 'n/a',
    fundsSkills: ['Guardian', 'Cleric'],
  },
  {
    id: 'spinel',
    name: 'Spinel',
    colorName: 'Red',
    hexColor: '#ef4444',
    coreHexColor: '#fecaca',
    colIndex: 1,
    iconBase64: GEM_SPINEL_BASE64,
    assignment: 'Assault Ballistics & Turbine',
    identity: 'Frontline kinetic discipline. Stabilization servos and heat-driven weapon output.',
    primaryResource: 'Heat',
    reactor: 'Ichor',
    fundsSkills: ['Warrior'],
  },
  {
    id: 'carnelian',
    name: 'Carnelian',
    colorName: 'Orange',
    hexColor: '#f97316',
    coreHexColor: '#fed7aa',
    colIndex: 2,
    iconBase64: GEM_CARNELIAN_BASE64,
    assignment: 'Heavy Ordnance & Siege',
    identity:
      'Heavy siege discipline. Super-heavy load clearance, blast ordnance, and natural Presence through aggression.',
    primaryResource: 'Heat',
    reactor: 'Ichor',
    fundsSkills: ['Marauder'],
  },
  {
    id: 'titanite',
    name: 'Titanite',
    colorName: 'Yellow',
    hexColor: '#facc15',
    coreHexColor: '#fef08a',
    colIndex: 3,
    iconBase64: GEM_TITANITE_BASE64,
    assignment: 'Aegis Barrier & Vanguard',
    identity: 'Defensive barrier discipline. Physical/hard-light shields, cleave emitters, and Presence anchoring.',
    primaryResource: 'Presence',
    reactor: 'Mana',
    fundsSkills: ['Guardian'],
  },
  {
    id: 'demantoid',
    name: 'Demantoid',
    colorName: 'Green',
    hexColor: '#22c55e',
    coreHexColor: '#bbf7d0',
    colIndex: 4,
    iconBase64: GEM_DEMANTOID_BASE64,
    assignment: 'Harmonic Support & Restoration',
    identity: 'Support & buffer discipline. Harmonizes Mana fields to reinforce shields and plating, vent reactor heat, and manage Presence priority.',
    primaryResource: 'Energy',
    reactor: 'Mana',
    fundsSkills: ['Cleric'],
  },
  {
    id: 'kyanite',
    name: 'Kyanite',
    colorName: 'Blue',
    hexColor: '#38bdf8',
    coreHexColor: '#bae6fd',
    colIndex: 5,
    iconBase64: GEM_KYANITE_BASE64,
    assignment: 'Beam & Wave Artillery',
    identity: 'Energy artillery discipline. Sustained beam projectors, prism focusing, and long-range suppression.',
    primaryResource: 'Energy',
    reactor: 'Ether',
    fundsSkills: ['Wizard'],
  },
  {
    id: 'charoite',
    name: 'Charoite',
    colorName: 'Purple',
    hexColor: '#a855f7',
    coreHexColor: '#e9d5ff',
    colIndex: 6,
    iconBase64: GEM_CHAROITE_BASE64,
    assignment: 'Recon, Stealth & CQC',
    identity: 'Stealth & precision discipline. Low-emission cloaking, marksman optics, and rapid CQC burst.',
    primaryResource: 'Energy',
    reactor: 'Ether',
    fundsSkills: ['Rogue'],
  },
  {
    id: 'rubellite',
    name: 'Rubellite',
    colorName: 'Magenta',
    hexColor: '#ec4899',
    coreHexColor: '#fbcfe8',
    colIndex: 7,
    iconBase64: GEM_RUBELLITE_BASE64,
    assignment: 'Ether Reactor Core',
    identity:
      'Volatile and wild. Tradition of Orion (Dwarf) and New Novarin (Elves). Drives high-capacity energy projectors and low-emission stealth cores.',
    primaryResource: 'n/a',
    reactor: 'n/a',
    fundsSkills: ['Rogue', 'Wizard'],
  },
  {
    id: 'hematite',
    name: 'Hematite',
    colorName: 'Black',
    hexColor: '#64748b',
    coreHexColor: '#cbd5e1',
    colIndex: 8,
    iconBase64: GEM_HEMATITE_BASE64,
    assignment: 'Ichor Reactor Core',
    identity:
      'Neutral to extreme, with tunable intensity; heat is its intensity dial. Tradition of Sin (Underworld) and Chyme (Draconic). Drives turbine and kinetic-recycling cores.',
    primaryResource: 'n/a',
    reactor: 'n/a',
    fundsSkills: ['Warrior', 'Marauder'],
  },
];

export const GEMSTONE_REGISTRY: Record<GemId, GemDefinition> = GEMSTONE_CATALOG.reduce(
  (acc, gem) => {
    acc[gem.id] = gem;
    return acc;
  },
  {} as Record<GemId, GemDefinition>
);

export const TRAIT_FUNDING_GEMS: Record<TraitLine, [GemId, GemId]> = {
  Warrior: ['spinel', 'hematite'],
  Marauder: ['carnelian', 'hematite'],
  Guardian: ['titanite', 'moonstone'],
  Cleric: ['demantoid', 'moonstone'],
  Wizard: ['kyanite', 'rubellite'],
  Rogue: ['charoite', 'rubellite'],
};

function makeGemItemDefinition(gem: GemDefinition): ItemWikiDefinition {
  return {
    id: gem.id,
    name: gem.name,
    category: 'valuable',
    description: `[${gem.assignment}] Funds Pilot Skill: ${gem.fundsSkills.join(', ')}. Sockets Feat Nodes, generates Equipment Mods & tints modified weapons.`,
    lore: gem.identity,
    buyPrice: 25,
    sellPrice: 12,
    iconColor: gem.hexColor,
    iconSprite: {
      base64: gem.iconBase64,
      cellWidth: 16,
      cellHeight: 16,
      anchor: 'bottom-center',
    },
  };
}

export const moonstoneItem = makeGemItemDefinition(GEMSTONE_REGISTRY.moonstone);
export const spinelItem = makeGemItemDefinition(GEMSTONE_REGISTRY.spinel);
export const carnelianItem = makeGemItemDefinition(GEMSTONE_REGISTRY.carnelian);
export const titaniteItem = makeGemItemDefinition(GEMSTONE_REGISTRY.titanite);
export const demantoidItem = makeGemItemDefinition(GEMSTONE_REGISTRY.demantoid);
export const kyaniteItem = makeGemItemDefinition(GEMSTONE_REGISTRY.kyanite);
export const charoiteItem = makeGemItemDefinition(GEMSTONE_REGISTRY.charoite);
export const rubelliteItem = makeGemItemDefinition(GEMSTONE_REGISTRY.rubellite);
export const hematiteItem = makeGemItemDefinition(GEMSTONE_REGISTRY.hematite);
