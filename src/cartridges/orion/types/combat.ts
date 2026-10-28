/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundSystem } from '../../../engine/core/soundSystem';
import {
  Base64SpriteConfig,
  DamageFamily,
  DamageType,
  TraitLine,
} from './common';
import type { OrionState } from './state';

export type ActionEffectStyle =
  | 'slash'
  | 'chop'
  | 'thrust'
  | 'slam'
  | 'bash'
  | 'whirlwind'
  | 'shockwave'
  | 'claw_bite'
  | 'volley';

export interface BladeTrailEffect {
  x: number;
  y: number;
  z: number;
  angle: number;
  arcSpan: number;
  radius: number;
  color: string;
  coreColor?: string;
  life: number;
  maxLife: number;
  flipDir?: boolean;
  style?: ActionEffectStyle;
  /** Linear reach for thrust/lunge corridors or forward offset for slams */
  length?: number;
  /** Corridor width for thrusts, shield wall width for bashes, or impact radius for slams */
  width?: number;
  /** Optional inner radius for shockwaves or thick cleaves */
  innerRadius?: number;
  /** True when emitted by an enemy attack */
  isEnemy?: boolean;
}

/**
 * Inertia System (`inertia-v0.md`) Outcome Bands & Modifier Hooks
 * - Displacement is governed by Weight (`m`, `m_eff = m * (1 + μ)`)
 * - Reaction & Recovery are governed by Stability (`S`, deadband `k1 * S`, recovery `k2 * S`)
 * - Inertia never alters damage dealt or taken (BCU invariant)
 */
export type InertiaOutcomeBand = 'none' | 'flinch' | 'stagger' | 'knockback';
export type AttackCommitmentClass = 'poke' | 'slash' | 'heavy';

export interface InertiaModifiers {
  weightFlat?: number;
  weightMult?: number;
  stabilityFlat?: number;
  stabilityMult?: number;
}

// Moveset Action (One atomic unit of a 5-action moveset)
export interface ActionDefinition {
  slot: 0 | 1 | 2 | 3 | 4; // Skill 0 = Auto-attack, Skills 1-4 = Active abilities
  name: string;
  damageType: DamageType;
  damageFamily: DamageFamily;
  damage: number;
  tellDurationSec: number; // Every ability has a tell (windup)
  actionDurationSec: number;
  cooldownSec: number;
  heatCost: number;
  range: number;
  description: string;
  /** True if this skill fires/strikes as a multi-shot chain and activates a reload state */
  isChain?: boolean;
  /** Active duration in seconds for sustained/guard skills (activates reload state when finished) */
  activeDurationSec?: number;
  /** Reload state duration in seconds for chain or active-duration skills */
  reloadDurationSec?: number;
  /** True if this skill is a Block action (always Skill 4 on blocking weapons) */
  isBlock?: boolean;
  /** Optional Inertia attack mass override (`m_attack` in `inertia-v0.md`) */
  attackWeight?: number;
  /** Optional Inertia attack speed override (`v_attack` in `inertia-v0.md`) */
  attackSpeed?: number;
  /** Optional attacker body momentum commitment factor (`0.35` poke, `0.65` slash, `1.0` heavy/ram) */
  commitment?: number;
  /** Optional ranged projectile weight override (`m_projectile` in `inertia-v0.md`) */
  projectileWeight?: number;
  execute?: (state: OrionState, ctx: OrionCombatContext) => void;
}

// Projectiles
export interface OrionProjectile {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  damageType: DamageType;
  isPlayer: boolean;
  life: number;
  radius: number;
  color: string;
  trailColor: string;
  lightRadius: number;
  /** Projectile mass (`m_projectile`) for ranged impulse `J = m_projectile * v_projectile` (no shooter weight term) */
  projectileWeight?: number;
  /** Projectile speed (`v_projectile`) at launch for ranged impulse calculation */
  projectileSpeed?: number;
  onImpact?: (x: number, y: number, z: number, state: OrionState) => void;
}

// Particles
export interface OrionParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  label?: string;
  fade?: boolean;
}

// Contexts
export interface OrionCombatContext {
  state: OrionState;
  sound: SoundSystem;
  spawnParticles: (
    x: number,
    y: number,
    z: number,
    count: number,
    color: string,
    label?: string
  ) => void;
  say: (text: string) => void;
}

export interface OrionExecutionContext {
  say: (text: string) => void;
  sound: SoundSystem;
}

export type OrionActionSourceCategory =
  | 'weapon'
  | 'hardware'
  | 'reactor'
  | 'utility'
  | 'belt';

export interface OrionActionTemplate {
  id: string;
  name: string;
  shortLabel: string;
  sourceCategory: OrionActionSourceCategory;
  sourceLabel: string;
  hardwareSlot?: 'Head' | 'Torso' | 'Arms' | 'Legs' | 'Reactor' | 'Utility' | 'Belt';
  weaponSkillSlot?: 1 | 2 | 3 | 4;
  weaponId?: string;
  itemId?: string;
  beltSlotIndex?: 0 | 1 | 2 | 3;
  traitLineId?: TraitLine;
  sortOrder?: number;
  description: string;
  tellDurationSec?: number;
  actionDurationSec?: number;
  cooldownSec?: number;
  isChain?: boolean;
  activeDurationSec?: number;
  reloadDurationSec?: number;
  isBlock?: boolean;
  heatCost?: number; // Negative values vent heat
  damage?: number;
  damageType?: DamageType;
  damageFamily?: DamageFamily;
  range?: number;
  /** Optional embedded Base64 PNG icon for hardware/skill displays */
  iconSprite?: Base64SpriteConfig;
}

export interface OrionActionDescriptor extends OrionActionTemplate {
  tellDurationSec: number;
  actionDurationSec: number;
  cooldownSec: number;
  heatCost: number; // Negative values vent heat
  damage: number;
  damageType: DamageType;
  damageFamily: DamageFamily;
  range: number;
}

export interface OrionAssignedActions {
  L: string; // Default: 'weapon_skill_1'
  R: string; // Default: 'weapon_skill_2'
}
