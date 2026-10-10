/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BoundingBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export type StatType = 'hp' | 'ap' | 'ep' | 'sp';

export interface ItemDef {
  i: number; // sprite cell index, -1 for special
  k: 'coin' | 'key' | 'ability' | 'gem' | 'potion';
  s?: StatType;
}

export type EnemyType = 'crawler' | 'sentry' | 'wisp';

export interface EnemyEntity {
  id?: number;
  type: EnemyType;
  x: number;
  y: number;
  dir: number; // -1 or 1
  hp: number;
  maxHp: number;
  stun: number;
  poise: number;
  attackTimer?: number;
  isAttacking?: boolean;
  vx?: number;
  vy?: number;
}

export interface PickupEntity {
  x: number;
  y: number;
  c: string; // char symbol e.g. 'o', 'K', 'H'
  id: string; // room:tx,ty
}

export interface AttackVariant {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export type SkillId = 'heal' | 'fireball' | 'whirlwind' | 'shockwave';

export interface SkillDef {
  id: SkillId;
  name: string;
  costType: 'ep' | 'sp' | 'flask';
  cost: number;
  iconIndex: number;
  description: string;
  cooldown: number;
}

export interface ProjectileEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isPlayer: boolean;
  life: number;
  radius: number;
}

export interface CombatParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  text?: string;
}

export interface DashGhost {
  x: number;
  y: number;
  face: number;
  alpha: number;
}

export interface KnightState {
  room: string;
  rx: number;
  ry: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ground: boolean;
  jumping: boolean;
  face: number; // 1 = right, -1 = left
  t: number; // walk animation timer

  // Stats
  hp: number;
  maxHp: number;
  ap: number; // Poise / Armor Points
  maxAp: number;
  ep: number; // Energy / Magic Points
  maxEp: number;
  sp: number; // Stamina Points (Souls-like meter for dash/sprint/block)
  maxSp: number;
  spRegenTimer: number;

  coins: number;
  keys: number;
  flasks: number;
  maxFlasks: number;
  inventoryOpen: boolean;
  menuMode?: 'play' | 'pause' | 'inventory';

  // Platforming
  hasDouble: boolean;
  airJumps: number;
  coyote: number;
  buffer: number;

  // Fighting game movement: Dash & Sprint (B)
  isDashing: boolean;
  dashTimer: number;
  dashCooldown: number;
  isSprinting: boolean;
  dashGhosts: DashGhost[];

  // Fighting game combat: Attack & Charge (X)
  atk: number; // attack active timer
  atkCd: number; // attack cooldown
  atkV: number; // attack variation 0: stab, 1: slash up, 2: slash forward, 3: slash down, 4: heavy charged
  swung: number[]; // enemy indices hit in current swing
  chargeTimer: number; // how long X has been held
  isCharging: boolean;
  isCharged: boolean;
  isHeavyAttack: boolean;

  // Fighting game defense: Block & Parry (Y)
  isBlocking: boolean;
  parryWindow: number; // active frames right after pressing Y
  parrySparkTimer: number;
  blockStun: number;

  // Fighting game feel: Hitstop (frame freeze on big impact)
  hitstop: number;

  // Assigned Skills (L & R)
  assignedL: SkillId;
  assignedR: SkillId;
  skillCdL: number;
  skillCdR: number;
  unlockedSkills: SkillId[];

  // Combat Entities
  projectiles: ProjectileEntity[];
  particles: CombatParticle[];

  // Status
  inv: number; // invulnerability timer
  kb: number; // knockback timer
  got: Record<string, boolean>; // collected item keys
  enemies: EnemyEntity[];
  picks: PickupEntity[];
  checkpoint: { room: string; x: number; y: number } | null;
  cleared: number;
  nextStart: { x: number; y: number };
  floor: unknown;

  msg: string;
  msgT: number;
}
