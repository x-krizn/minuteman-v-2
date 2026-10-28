/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 8-way directional navigation
export type OrionDir = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

// Six Canonical Trait Lines
export type TraitLine = 'Warrior' | 'Marauder' | 'Guardian' | 'Rogue' | 'Wizard' | 'Cleric';

// Reactor Families
export type ReactorFamily = 'Ichor' | 'Mana' | 'Ether';

// Damage Taxonomy (LOCKED: Kinetic & Energy families)
export type DamageFamily = 'Kinetic' | 'Energy';
export type DamageType = 'Pierce' | 'Impact' | 'Blast' | 'Beam' | 'Pulse' | 'Wave';

// Armor Taxonomy
export type ArmorType = 'Ablative' | 'Reactive' | 'Hardened' | 'Layered';

// Defense Layer 1: Shields
export interface ShieldState {
  type: 'energy' | 'physical';
  capacity: number;
  maxCapacity: number;
  overloaded: boolean;
  overloadTimer: number;
  rechargeDelay: number;
}

// Defense Layer 2: Armor (Threshold, Rating, Degrading Durability)
export interface ArmorState {
  type: ArmorType;
  threshold: number; // Hits below threshold stopped completely
  rating: number; // Flat reduction on penetrating hits
  durability: number; // Current durability
  maxDurability: number; // Base durability
}

// Defense Layer 3: Frame Integrity (Static 200 HP)
export interface FrameState {
  integrity: number; // 200 base
  maxIntegrity: number; // 200 base (Static stats law)
  state: 'Operational' | 'Critical' | 'Defeated'; // <= 20% (40 HP) is Critical
}

// Loot drop entry
export interface LootEntry {
  itemId: string;
  chance: number;
  count?: number;
}

export type WorldScope = 'global' | 'local';

/**
 * Declarative Base64 PNG Sprite or Grid Spritesheet / Tilemap Configuration.
 * Supports both standalone Base64 PNGs and grid-sliced atlases/animation strips.
 */
export interface Base64SpriteConfig {
  /** Full `data:image/png;base64,...` URI, raw Base64 PNG payload, or registered atlas key */
  base64: string;
  /** Cell width in pixels when slicing a grid spritesheet or tilemap (defaults to full image width) */
  cellWidth?: number;
  /** Cell height in pixels when slicing a grid spritesheet or tilemap (defaults to full image height) */
  cellHeight?: number;
  /** Column index (0-based) in a grid tilemap or spritesheet */
  col?: number;
  /** Row index (0-based) in a grid tilemap or spritesheet */
  row?: number;
  /** Optional animation frame count (advances horizontally from `col` to `col + frameCount - 1`) */
  frameCount?: number;
  /** Optional animation speed in frames per second (default: 6) */
  fps?: number;
  /** Optional directional row mapping for 4-dir or 8-dir spritesheets */
  dirRowMap?: Partial<Record<OrionDir, number>>;
  /** Optional state row mapping for enemies (e.g. idle, patrol, windup, attack, recovery, stagger) */
  stateRowMap?: Record<string, number>;
  /** Destination render width in canvas pixels (defaults to cellWidth or image width) */
  renderWidth?: number;
  /** Destination render height in canvas pixels (defaults to cellHeight or image height) */
  renderHeight?: number;
  /** Pixel X offset from anchor point */
  offsetX?: number;
  /** Pixel Y offset from anchor point */
  offsetY?: number;
  /** Optional uniform scale multiplier (default: 1) */
  scale?: number;
  /** Anchor mode: 'top-left' (default for tiles) or 'bottom-center' (default for 2.5D props/entities) */
  anchor?: 'top-left' | 'center' | 'bottom-center';
  /** Optional 1px pixel-art silhouette outline color baked automatically offscreen */
  outlineColor?: string;
  /** If true, sprite is authored facing East ('E') and uses 2D canvas transforms for other directions */
  orientFromEast?: boolean;
}

export interface LightSourceConfig {
  color: string;
  radius: number;
  intensity?: number;
  pulseSpeed?: number;
  offsetY?: number;
}

export type FrameLoadCapacity = 'light' | 'medium' | 'heavy' | 'superheavy';
export type WeaponWeightClass = 'light' | 'medium' | 'heavy';
export type LevelBand = 'Lesson' | 'Challenge' | 'Expression';
