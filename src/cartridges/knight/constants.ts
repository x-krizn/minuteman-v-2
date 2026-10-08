/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttackVariant, ItemDef, SkillDef, SkillId, StatType } from '../../types/knight';
import { KNIGHT_PNG } from '../walkTestCartridge';

export { KNIGHT_PNG };

export const TILE_SIZE = 16;
export const COLS = 10;
export const ROWS = 9;
export const SCREEN_W = 160;
export const SCREEN_H = 144;

export const HALF_WIDTH = 5;
export const BODY_HEIGHT = 16;

export const GRAVITY = 700;
export const JUMP_VELOCITY = 270;
export const RUN_SPEED = 60;
export const SPRINT_SPEED = 95;
export const DASH_SPEED = 180;
export const DASH_DURATION = 0.16;
export const DASH_COOLDOWN = 0.35;
export const MAX_FALL_SPEED = 320;

export const CHARGE_TIME_REQUIRED = 0.45;
export const PARRY_WINDOW_DURATION = 0.15;
export const STAMINA_REGEN_RATE = 2.5; // SP per second

export const INITIAL_START = { room: '0,0', x: 32, y: 128 };
export const BG_COLOR = '#000000';

export const ITEMS_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFFUlEQVR4Ae1ZPXcTOxBdc/gT0CYtNPY5UJA2KXALhd2SpIMi/hlJAV0MrV1Aa4qkTQo4x26gTZoUuElNu+iuPZvZ2dGX1w7xh94JkkZzR3OvpF15X5JsykaBhShwetBMKTBvk+0+6uFwmOLPNddj22B6mqRJ/W601khqd72w1v8ijuxAvNFoZDnztsxcFUCSBygdJmmMCIfdQe2gWc/U7w5GXvEQnycXMxfHxbZLiRXIj1i46W4ITUyuPgRh0QrNjDyfC6NmvtC5CsFMJzVF2tCvmSLt6g7InJAQOwKJ7MtInj4E0UQg8rXD4hHDQsTuOqQA8qORVHOSHMakCHYBPIRcw7T6BweDzK3bbbrcnWPyaEhn1y4xz4DM3TwDJCzvP8pbc2pI8ghLQtBY1FRYTFpQUbvIh84xdwFCJw71o6PByWY2I4Zvd7hWnua3C4DzT+qj5s8DQos6ZIVLPrbYNL+ZIxfBPCdICNioLdKI6pYEIHWzKEiC/kwzZkJ+7nlbZkfzYTX5H8Qn4hIzz776EMTEhddhJHlK0EWcfFDn8zHjvMj7joEqACXF8glujv6Mk/rTJwnVAFKbai3YvAhrsV220sXA5RwyhjMOolqBMNpdQPOtYqvXJzdQGcPcD+bOV86x6W8U2CiwQgqYn1T4/aD+sgqh2frRqoQ/OvpVCX919d6LL12EiBjI5+0ZRAD5KniQr4IH+RC8KoBB5uCQIORDNSdPNiwFtX01J0++MXhO3odXBSBQoS5/SygM+zrtn22fi3O80/ntHPcNXl9/UF3CBFhR8lDEehXGYPZDrQL525vbpG3+m7WMxzdJpzMrOknG478GrK88RbXuAJCvUkC+SgH5KmVC3h9BFWBdyEMeVQDzJa30o8EYSjabvudvz0u+/Zf9ks2G7/ebJd+Tk+clmw2/s/Ol5Lu9/alks+Fzu/mUiHdX8OsrB04bu193U+2VKP1s/VZrkGqvRJu/tF9cvEu1V6L02/Q3CqyxAuqDwXbtlP9XxabbsuMzXlMSeACiGf0gXBa88yY4A+/Cplhq/HQF+W4okPN1lgWvXoR85FZp3H0EKlyCIFKVSxDwVS5BwIdcgtZ+B2wEwFZZ52K/CMkPIeYqEHMRkp/Aei96UXj5Cez4+FkUXn4C29r6qOJLRwCvr5Ehn38TMMTRho2/2my7Bj573/YS+iAC4mjDFopvt7+brzk32RQgjjZsofjLy/3p16AkAXF8HIFNwzvfApkIcifYmCv2jPjNnjISZpoQnwgRhih6gfh4vF80il5pB4jxle+uvQDWhyDOPC/1yIcgzjwvZ2/O1IcQ96E2zirOPC+93usoPM48L69efVbxRZYMIR8YoW8ACrEseKsARCS2BnGIJQVAnFgRY+eexX/uAsgkHroQCxcAgjxkERb2FuCkta3Px+Wuuc9+0A5AshqJ2EQlaRnTNx47X2V/nhBvuwJLP60PG4ovzsSr+K8L4xqzzRe0AygwBZErR+MhNcWAb0gc7s/jh2DhDzx8eRyODRKAg2dJgmN4LJ4I99HaHEfjMXjCUBzC5j+GaIAcQ2pgKFCIf4zPImMjD4qfC7AoIjbSvvlonBK1xQm1a3FgW9hrUEsME8JO5DQfsvl8Y2K45gx6BlBSVWuQCkmc5iERqE91TAzCoNbi3asAPBlXW03UsHZh+BjwUiQtJjDBQfkEi2prSUois8ytxUUcxH5QAsxCzoexkV9ZAVyEuVi0+P8AZkYXIxg5q60AAAAASUVORK5CYII=';

export const TILES_G_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAC30lEQVR42u2ZvW7bMBDH/6YNtFOyZHVgoICHTAW9GR7aLav9AgbqN+gT5Am6eO8b9GMp0C0ZDG0yOnVIUaDIGqBFi3bwYKQTBZYhqTtSBqLquEgi+bs7/fkhkuoBuEOHk0LHkwjQdQEGADCbzdjgZrOp7tvMqxTYdtp2XuYAEUAEEAFEgC6n3vOXz9h7gflogXff3ibnc/nUeCj1ggJQjKYGTOVzyyn+g0MgZHg+WpCN5/C5MZg6dXUVpbKdb4KajxYoyzLIhYKn8m6eG4PNx+KMiViWJXpyHiCfQRFAzgP0uWaD24/b6r7NvArBx2dHUQOGizmP2aDwuf4pfHAI/Pz8K7t7GRt1YrZyDuC8lE/MVFFyxXR5dQgnh0yxnkmJ2+VVqhNOq/ryQz58dakNktLTVJMtECrjzCe+ujnzUR3b2nVAU3NBT5/rOy5oz+6uwr48ii0uHxuK1NgBQFGV9DnUY32vJTgBHYLnDAc91mknQv/VUvikfxIsPH1yipuvN95ntyzEhMqoPNcP164yD25lAMEXcctsPpRP5Zv2E3oX8yxDQI81ttfbpG/t8dkRmuAv318lf8p8POdL0n88fnQBALvbXZVp7uvS7naHH+o7bL7OoV3P8FR/dbwp58SvLl9dZa26XJ67KmuST+mFqomtbxNb5we5Hc5ZbuZsargbq5x41aH28ZxNDWe3GIspZauscvfTbT9HUE2O5VQ+98QoJ2710FusiV4Vs1H9Guvq0bj8G0THkwjQdQEGy+USk8kE0+mUBBRF8U/d9Xp9j3fruM92no/nxBHifT7tfHPtr1ari5DzoigwHA6rK4DqatJ+v68Mhuq4z3ae4W1/oTg4vM+OnW+u0SFgDFNaJyYiNYVsUHtHSgzK13WoXZASXJ19u/UocVB5qoA9AHf69dPkSWT74hPazA8A4PeHP1kzaZt5WQeIACKACCACXL/5kgQbrs28nAfIEBABup3+AmL6JCRKtnLoAAAAAElFTkSuQmCC';

export const TILES_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAD90lEQVR4Ae1au24TURBdry2lQVR0yCgSUgoqFHfGRcqIkh+whP+AL8gX0LjnD0A0oNC5MO4cUVGAkCI6hESBoCCSBZ41ZzUez9zH2nHs3V2JzL0z55x57PqSbNJIkuTv/F9lr7Synf9vvB5A1Z+AFg2g1+tFz2E8HuecfeanRYrnQ9t3fn0G5M9xRRf1E1DRG5+3XT8B+SgqumicnjyL/lng8ZPD5O2ry5WRhfpDcSsJDIelJ+EazhyABg4RlBjX3pdj3bgrN8VI3zwDtDsMkk/YhaOkodc6NSAPrJUzGwBAsBLM/SiKfNPpNIPyOLjAYQ8Lv48vNfmeNDgf2hJDfuQDBhb8xtwRfQZApAzW/AiUobmQHuoBhEypzJjF+4Dj0+gexxfnOae3x/zUKv7W7Qd5g9oCPFgN49IAD1bju3zgwbqwWgw88wz49fOjxovyQcM1iCjBawCbA/DlimkKg+CaMfxN8KAh86oDkCCQd8Fqw0RdIXVLvjoACUICskiiYRDjeM7hfo1vYS1drkdrTdPHVQcghfleS4K4FbP84HGrYTUf57jWPm70AFzJthnz3VlfLeA35v8dRP0sQERMla+RUPMhJq2G1XySR3vC0YVaso3nC9cGP8XCw1UTPjo+yv3gxxR0HXzUoVlZG+U3X4hoAmX0te7eaZp9Hd67n1x+/ZLH+Z6vc8B8YfkJw2N87eKH4qARigcuOwRpwy/sefM8TmseA97lD+WH4qz8ko/aOJ7XWX8E6CB4f/Ep6jTFlOkA3QT/3eg1JKMs8ks++eWBpwkTrnlwcHRGwas/3zMMObHOHI4vhPv2Y/GtRAhHaoMfwqUyfHzEQ/UIl56Pni+1GDI5TpB8HpNrTXuTfE1f1iD32e0rQuRC6/K51rbXi+fXyEqPVNFL42o+S9/CWn7SccWsPM4BaHc2NInG1XxW4RZW86MmLYbGgcEedmkAFghgskWScP5Nra26lwZggUKLLsrXeCE3A3VpfMR8dmkAPvA242gqZhBWfS6N/FdjeEtqiWj+MrwazwegNVgF385+BLY1/HoA25r0ruZp9fv9pNPpJN1uN6jGyWSyhB0Ohyt8iZF7SgSfxg8pxMdHXGrBD9scDAZnVvMEarfbWbFk6YKF8Gw2ywYCrIaRHI4Bn3xcg/a4ND80LT7i0ICFH9Z5BmAwsBDRrIWh4kMvS8PyS10L56ohlSQXmCcETvI5htYyDh5wiEu/3AMv/RYfeLLAcB/W2fcBJw9fYB9tRx+eJvvMz/5A4ur3m+jGOWGf+c4zgDdZ1nU9gLLe2dC+6icgdFJlxWVPwOTzy0L9gQcbKwIe7E3w6/cBsVMvG74+BMt2R2P7+Qf18iPQuYS+7QAAAABJRU5ErkJggg==';

export const ITEMS: Record<string, ItemDef> = {
  o: { i: 0, k: 'coin' },
  K: { i: 2, k: 'key' },
  D: { i: -1, k: 'ability' },
  H: { i: 4, k: 'gem', s: 'hp' },
  G: { i: 5, k: 'gem', s: 'ap' },
  B: { i: 6, k: 'gem', s: 'ep' },
  Y: { i: 7, k: 'gem', s: 'sp' },
  '1': { i: 8, k: 'potion', s: 'hp' },
  '2': { i: 9, k: 'potion', s: 'ap' },
  '3': { i: 10, k: 'potion', s: 'ep' },
  '4': { i: 11, k: 'potion', s: 'sp' },
};

export const STAT_COLORS: Record<StatType, string> = {
  hp: '#ff5555',
  ap: '#44cc44',
  ep: '#6666ff',
  sp: '#cccc44',
};

// Sword Moves: Directional Ground & Jump Attacks
export const SWORD_ATTACKS: AttackVariant[] = [
  { x0: 2, x1: 15, y0: 4, y1: 8 }, // 0: neutral ground stab
  { x0: -6, x1: 6, y0: -14, y1: -2 }, // 1: upward ground anti-air slash
  { x0: 3, x1: 15, y0: 3, y1: 13 }, // 2: forward ground slash
  { x0: 2, x1: 14, y0: 6, y1: 16 }, // 3: low ground poke
  { x0: 0, x1: 18, y0: -6, y1: 16 }, // 4: heavy charged forward strike
  { x0: 3, x1: 16, y0: 2, y1: 14 }, // 5: aerial forward jump slash
  { x0: -8, x1: 8, y0: -16, y1: -4 }, // 6: aerial upward jump slash
  { x0: -6, x1: 6, y0: 4, y1: 18 }, // 7: aerial downward jump thrust (pogo)
];

// Assignable Skills definitions for L & R
export const SKILLS: Record<SkillId, SkillDef> = {
  heal: {
    id: 'heal',
    name: 'FLASK',
    costType: 'flask',
    cost: 1,
    iconIndex: 8,
    description: 'Consume 1 Flask charge to restore 2 HP.',
    cooldown: 0.8,
  },
  fireball: {
    id: 'fireball',
    name: 'FIREBOLT',
    costType: 'ep',
    cost: 1,
    iconIndex: 7,
    description: 'Launch piercing magical fire bolt.',
    cooldown: 0.4,
  },
  whirlwind: {
    id: 'whirlwind',
    name: 'WHIRLWIND',
    costType: 'sp',
    cost: 1,
    iconIndex: 14,
    description: 'Spinning blade strikes all around.',
    cooldown: 0.6,
  },
  shockwave: {
    id: 'shockwave',
    name: 'SLAMSURGE',
    costType: 'sp',
    cost: 2,
    iconIndex: 15,
    description: 'Ground slam sends armor-breaking surge.',
    cooldown: 0.8,
  },
};
