/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LevelUnlockInfo {
  level: number;
  unlock: string;
  learningFocus: string;
}

export const LEVEL_UNLOCK_SEQUENCE: LevelUnlockInfo[] = [
  { level: 1, unlock: 'Torso, Primary weapon slot 1, Skill 0 auto-salvo', learningFocus: 'Movement & basic attack' },
  { level: 2, unlock: 'Legs slot, Booster Kit mobility', learningFocus: 'Mobility & evasion' },
  { level: 3, unlock: 'Weapon slot 2 & weapon swap (5s CD)', learningFocus: 'Weapon switching' },
  { level: 4, unlock: 'Skill slots 1–2 on equipped weapons', learningFocus: 'First active skills' },
  { level: 5, unlock: 'Generator slot; Heat & Energy systems', learningFocus: 'Resource management' },
  { level: 6, unlock: 'Skill slots 3–4 on equipped weapons', learningFocus: 'Full initial moveset' },
  { level: 7, unlock: 'Head slot; optics & sensors', learningFocus: 'Targeting & tells' },
  { level: 8, unlock: 'Arm slot & sidearm slots', learningFocus: 'Equipment breadth' },
  { level: 9, unlock: 'First feat slot (Tier I)', learningFocus: 'Build identity' },
  { level: 10, unlock: 'Defensive system slot 1', learningFocus: 'Defense layers' },
  { level: 11, unlock: 'Defensive slots 2–3', learningFocus: 'Defensive options' },
  { level: 12, unlock: 'Second feat slot (Tiers I–II)', learningFocus: 'Build development' },
  { level: 13, unlock: 'Weapon slots 3–4; full weapon set', learningFocus: 'Loadout mastery' },
  { level: 14, unlock: 'Third feat slot (Tiers I–III)', learningFocus: 'Specialization' },
  { level: 15, unlock: 'Presence system', learningFocus: 'Team-facing role' },
  { level: 16, unlock: 'Fourth feat slot (Tiers I–IV)', learningFocus: 'Advanced build' },
  { level: 17, unlock: 'Core system slot; reactor identity', learningFocus: 'Core specialization' },
  { level: 18, unlock: 'Fifth feat slot (Tiers I–IV)', learningFocus: 'Build completion' },
  { level: 19, unlock: 'Tier V feat access', learningFocus: 'Capstone options' },
  { level: 20, unlock: 'All slots and feats available', learningFocus: 'Tutorial complete / Horizontal endgame' },
];

export const CORE_COMBAT_LAWS = [
  'Law 1: Every ability has a tell. No untelegraphed instant damage.',
  'Law 2: CC creates opportunity, not guaranteed damage.',
  'Law 3: Sustained healing cannot negate sustained DPS at parity.',
  'Law 4: High damage requires high commitment.',
  'Law 5: Presence governs priority, not invulnerability.',
  'Law 6: Stats are marginal; action is primary.',
];
