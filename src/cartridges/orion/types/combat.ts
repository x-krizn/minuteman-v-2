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

/**
 * Type contract for `ActionEffectStyle` (action effect style) in `combat.ts`.
 */
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

/**
 * Type contract for `BladeTrailEffect` (blade trail effect) in `combat.ts`.
 */
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
 * - Excess ranged/heavy impulse converts into grounded `'knockdown'` instead of launching targets off-screen
 * - Inertia never alters damage dealt or taken (BCU invariant)
 */
export type InertiaOutcomeBand =
  | 'none'
  | 'flinch'
  | 'stagger'
  | 'knockback'
  | 'knockdown';
/**
 * Type contract for `AttackCommitmentClass` (attack commitment class) in `combat.ts`.
 */
export type AttackCommitmentClass = 'poke' | 'slash' | 'heavy';

/**
 * Type contract for `InertiaModifiers` (inertia modifiers) in `combat.ts`.
 */
export interface InertiaModifiers {
  weightFlat?: number;
  weightMult?: number;
  stabilityFlat?: number;
  stabilityMult?: number;
}

/**
 * Single step descriptor in a weapon-unique fluid melee combo sequence (`noReload: true`).
 */
export interface MeleeComboStepSpec {
  stepIndex: number;
  label: string;
  style: ActionEffectStyle;
  arcSpan: number;
  radius: number;
  length?: number;
  width?: number;
  damageMult: number;
  tellDurationSec: number;
  actionDurationSec: number;
  flipDir?: boolean;
  extraArmorDent?: number;
  knockbackScale?: number;
}

/**
 * Moveset Action (One atomic unit of a 5-action moveset).
 */
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
  /** True if this skill fires/strikes as a multi-shot chain and activates a reload state (strictly Slot 0 ranged basic attacks) */
  isChain?: boolean;
  /** True if this action never triggers a reload state (all Melee/Shield actions and all Skills 1–4) */
  noReload?: boolean;
  /** Number of rounds/projectiles fired in a salvo or held as internal skill ammo for ranged skills */
  ammoCount?: number;
  /** Number of per-shot internal charges before the skill enters its full depletion cooldown */
  internalCharges?: number;
  /** Brief per-shot internal cycle time (seconds) between internal charges */
  internalCycleSec?: number;
  /** True when this action is a single-shot hold-to-charge Bow draw */
  isChargeable?: boolean;
  /** Full draw time in seconds for 100% Bow charge scaling */
  maxChargeSec?: number;
  /** Weapon-unique fluid melee combo step sequence for reload-free melee Basic Attacks */
  comboSequence?: MeleeComboStepSpec[];
  /** Internal idle window in seconds before the fluid melee combo resets to Step 1 */
  comboResetWindowSec?: number;
  /** Active duration in seconds for sustained/guard skills */
  activeDurationSec?: number;
  /** Reload state duration in seconds for Slot 0 ranged basic attacks */
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

/**
 * Projectiles.
 */
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

/**
 * Type contract for `OrionParticle` (orion particle) in `combat.ts`.
 */
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

/**
 * Type contract for `OrionCombatContext` (orion combat context) in `combat.ts`.
 */
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

/**
 * Type contract for `OrionExecutionContext` (orion execution context) in `combat.ts`.
 */
export interface OrionExecutionContext {
  say: (text: string) => void;
  sound: SoundSystem;
}

/**
 * Type contract for `OrionActionSourceCategory` (orion action source category) in `combat.ts`.
 */
export type OrionActionSourceCategory =
  | 'weapon'
  | 'hardware'
  | 'reactor'
  | 'utility'
  | 'belt';

/**
 * Type contract for `OrionActionTemplate` (orion action template) in `combat.ts`.
 */
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
  noReload?: boolean;
  ammoCount?: number;
  internalCharges?: number;
  internalCycleSec?: number;
  isChargeable?: boolean;
  maxChargeSec?: number;
  comboSequence?: MeleeComboStepSpec[];
  comboResetWindowSec?: number;
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

/**
 * Type contract for `OrionActionDescriptor` (orion action descriptor) in `combat.ts`.
 */
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

/**
 * Type contract for `OrionAssignedActions` (orion assigned actions) in `combat.ts`.
 */
export interface OrionAssignedActions {
  L: string; // Default: 'weapon_skill_1'
  R: string; // Default: 'weapon_skill_2'
}
