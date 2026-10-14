/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeDefinition } from '../../../types';

export const CRYPT_TILES_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAD90lEQVR4Ae1au24TURBdry2lQVR0yCgSUgoqFHfGRcqIkh+whP+AL8gX0LjnD0A0oNC5MO4cUVGAkCI6hESBoCCSBZ41ZzUez9zH2nHs3V2JzL0z55x57PqSbNJIkuTv/F9lr7Synf9vvB5A1Z+AFg2g1+tFz2E8HuecfeanRYrnQ9t3fn0G5M9xRRf1E1DRG5+3XT8B+SgqumicnjyL/lng8ZPD5O2ry5WRhfpDcSsJDIelJ+EazhyABg4RlBjX3pdj3bgrN8VI3zwDtDsMkk/YhaOkodc6NSAPrJUzGwBAsBLM/SiKfNPpNIPyOLjAYQ8Lv48vNfmeNDgf2hJDfuQDBhb8xtwRfQZApAzW/AiUobmQHuoBhEypzJjF+4Dj0+gexxfnOae3x/zUKv7W7Qd5g9oCPFgN49IAD1bju3zgwbqwWgw88wz49fOjxovyQcM1iCjBawCbA/DlimkKg+CaMfxN8KAh86oDkCCQd8Fqw0RdIXVLvjoACUICskiiYRDjeM7hfo1vYS1drkdrTdPHVQcghfleS4K4FbP84HGrYTUf57jWPm70AFzJthnz3VlfLeA35v8dRP0sQERMla+RUPMhJq2G1XySR3vC0YVaso3nC9cGP8XCw1UTPjo+yv3gxxR0HXzUoVlZG+U3X4hoAmX0te7eaZp9Hd67n1x+/ZLH+Z6vc8B8YfkJw2N87eKH4qARigcuOwRpwy/sefM8TmseA97lD+WH4qz8ko/aOJ7XWX8E6CB4f/Ep6jTFlOkA3QT/3eg1JKMs8ks++eWBpwkTrnlwcHRGwas/3zMMObHOHI4vhPv2Y/GtRAhHaoMfwqUyfHzEQ/UIl56Pni+1GDI5TpB8HpNrTXuTfE1f1iD32e0rQuRC6/K51rbXi+fXyEqPVNFL42o+S9/CWn7SccWsPM4BaHc2NInG1XxW4RZW86MmLYbGgcEedmkAFghgskWScP5Nra26lwZggUKLLsrXeCE3A3VpfMR8dmkAPvA242gqZhBWfS6N/FdjeEtqiWj+MrwazwegNVgF385+BLY1/HoA25r0ruZp9fv9pNPpJN1uN6jGyWSyhB0Ohyt8iZF7SgSfxg8pxMdHXGrBD9scDAZnVvMEarfbWbFk6YKF8Gw2ywYCrIaRHI4Bn3xcg/a4ND80LT7i0ICFH9Z5BmAwsBDRrIWh4kMvS8PyS10L56ohlSQXmCcETvI5htYyDh5wiEu/3AMv/RYfeLLAcB/W2fcBJw9fYB9tRx+eJvvMz/5A4ur3m+jGOWGf+c4zgDdZ1nU9gLLe2dC+6icgdFJlxWVPwOTzy0L9gQcbKwIe7E3w6/cBsVMvG74+BMt2R2P7+Qf18iPQuYS+7QAAAABJRU5ErkJggg==';

export const TILES_PNG = CRYPT_TILES_PNG;

export const cryptBiome: BiomeDefinition = {
  id: 'crypt',
  name: 'Forgotten Crypt',
  description: 'Cold, subterranean stone labyrinth lined with silent tombs and restless echoes.',
  bgColor: '#080810',
  ambientColor: '#1e293b',
  dustColor: '#94a3b8',
  tileset: {
    type: 'sheet',
    sheetUri: CRYPT_TILES_PNG,
    tileSize: 16,
  },
};

