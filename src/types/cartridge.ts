/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameInput } from './input';

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

export type AssetLibrary = Record<string, Strip>;

export interface CartridgeSurface {
  g: CanvasRenderingContext2D;
  width: number;
  height: number;
  assets: AssetLibrary;
}

export type CartridgeMenuMode = 'none' | 'game-menu' | 'cart-menu' | 'inventory';

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
