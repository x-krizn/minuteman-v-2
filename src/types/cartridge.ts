/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameInput } from './input';

/**
 * Declarative sprite strip specification (`src`, `frameWidth`, `frameHeight`, `frames`) for `assetLoader`.
 */
export interface StripSpec {
  src: string;
  cw: number;
  ch: number;
  frames: number;
  rows?: number;
  fps?: number;
  ax?: number;
  ay?: number;
}

/**
 * Pre-sliced sprite strip containing normal and horizontally mirrored `HTMLCanvasElement` frames (`px`).
 */
export interface Strip {
  id: string;
  cw: number;
  ch: number;
  frames: number;
  rows: number;
  fps: number;
  ax: number;
  ay: number;
  frameAt: (tInSeconds: number) => number;
  draw: (
    g: CanvasRenderingContext2D,
    frameIndex: number,
    x: number,
    y: number,
    flipX?: boolean
  ) => void;
}

/**
 * Dictionary mapping sprite asset IDs to their pre-sliced `Strip` instances.
 */
export type AssetLibrary = Record<string, Strip>;

/**
 * Rendering surface passed to `Cartridge.render`, exposing the `160x144` `px` `CanvasRenderingContext2D` and `AssetLibrary`.
 */
export interface CartridgeSurface {
  g: CanvasRenderingContext2D;
  width: number;
  height: number;
  assets: AssetLibrary;
}

/**
 * Active modal overlay state (`'none'`, `'game-menu'`, or `'inventory'`) for a running cartridge.
 */
export type CartridgeMenuMode = 'none' | 'game-menu' | 'inventory';

/**
 * Props passed to a cartridge React overlay component, including `scale`, `menuMode`, and `onSetMenuMode`.
 */
export interface CartridgeOverlayProps {
  menuMode: CartridgeMenuMode;
  soundEnabled: boolean;
  scanlinesEnabled: boolean;
  isFullscreen: boolean;
  onToggleSound: () => void;
  onToggleScanlines: () => void;
  onToggleFullscreen: () => void;
  onResume: () => void;
  onExitCartridge: () => void;
  connectedGamepads: string[];
}

/**
 * Contract implemented by every game cartridge (`id`, `title`, `init`, `update`, `render`, and optional React `Overlay`).
 */
export interface Cartridge {
  id: string;
  name: string;
  version?: string;
  description?: string;
  assets?: Record<string, StripSpec>;
  init?: (surface: CartridgeSurface) => void | Promise<void>;
  update: (input: GameInput, dtSeconds: number) => void;
  draw: (surface: CartridgeSurface) => void;
  destroy?: () => void;
  renderOverlay?: (props: CartridgeOverlayProps) => React.ReactNode;
  onMenuToggle?: (menuMode: CartridgeMenuMode) => void;
}
