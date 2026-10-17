/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BiomeDefinition {
  id: string;
  name: string;
  world: string;
  description: string;
  palette: {
    ground: string;
    mud: string;
    water: string;
    pylonTop: string;
    pylonFront: string;
    shadow: string;
  };
  lightColor: string;
}

export const belldorBogBiome: BiomeDefinition = {
  id: 'belldor_bog',
  name: 'M00 Belldor Toxic Marshes',
  world: 'Belldor (Camelot)',
  description: 'Deep toxic marshlands littered with orbital impact debris, ruined pylons, and abyssal sinkholes.',
  palette: {
    ground: '#253243',
    mud: '#17202a',
    water: '#0c4a6e',
    pylonTop: '#475569',
    pylonFront: '#1e293b',
    shadow: 'rgba(0,0,0,0.4)',
  },
  lightColor: '#77c7ff',
};
