/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Available graphics quality preset identifiers in Project Orion.
 */
export type OrionGraphicsPreset = 'low' | 'medium' | 'high' | 'retro' | 'custom';

/**
 * Persistent graphics & post-processing settings for the Project Orion 2.5D render pipeline.
 */
export interface OrionGraphicsSettings {
  preset: OrionGraphicsPreset;
  bloomEnabled: boolean;
  bloomIntensity: number;
  dynamicLighting: boolean;
  ambientDarknessScale: number;
  weatherEnabled: boolean;
  weatherIntensityScale: number;
  liquidReflections: boolean;
  bladeTrails: boolean;
  outlinePass: boolean;
  screenShakeScale: number;
  scanlinesEnabled: boolean;
  hudResolution: 'hires' | 'pixel';
  devModeEnabled: boolean;
}

const STORAGE_KEY = 'orion_graphics_settings_v1';

/**
 * Predefined visual configurations for the four quick presets (`low`, `medium`, `high`, `retro`).
 */
export const ORION_GRAPHICS_PRESETS: Record<
  Exclude<OrionGraphicsPreset, 'custom'>,
  Omit<OrionGraphicsSettings, 'preset' | 'devModeEnabled'>
> = {
  low: {
    bloomEnabled: false,
    bloomIntensity: 0,
    dynamicLighting: true,
    ambientDarknessScale: 0.85,
    weatherEnabled: false,
    weatherIntensityScale: 0,
    liquidReflections: false,
    bladeTrails: false,
    outlinePass: true,
    screenShakeScale: 0.5,
    scanlinesEnabled: false,
    hudResolution: 'hires',
  },
  medium: {
    bloomEnabled: true,
    bloomIntensity: 0.75,
    dynamicLighting: true,
    ambientDarknessScale: 0.95,
    weatherEnabled: true,
    weatherIntensityScale: 0.7,
    liquidReflections: true,
    bladeTrails: true,
    outlinePass: true,
    screenShakeScale: 0.85,
    scanlinesEnabled: false,
    hudResolution: 'hires',
  },
  high: {
    bloomEnabled: true,
    bloomIntensity: 1.0,
    dynamicLighting: true,
    ambientDarknessScale: 1.0,
    weatherEnabled: true,
    weatherIntensityScale: 1.0,
    liquidReflections: true,
    bladeTrails: true,
    outlinePass: true,
    screenShakeScale: 1.0,
    scanlinesEnabled: false,
    hudResolution: 'hires',
  },
  retro: {
    bloomEnabled: true,
    bloomIntensity: 1.15,
    dynamicLighting: true,
    ambientDarknessScale: 1.0,
    weatherEnabled: true,
    weatherIntensityScale: 1.0,
    liquidReflections: true,
    bladeTrails: true,
    outlinePass: true,
    screenShakeScale: 1.0,
    scanlinesEnabled: true,
    hudResolution: 'pixel',
  },
};

/**
 * Default graphics configuration (`high` preset with `devModeEnabled: false`).
 */
export const DEFAULT_ORION_GRAPHICS_SETTINGS: OrionGraphicsSettings = {
  preset: 'high',
  ...ORION_GRAPHICS_PRESETS.high,
  devModeEnabled: false,
};

function sanitizeSettings(raw: Partial<OrionGraphicsSettings>): OrionGraphicsSettings {
  const preset: OrionGraphicsPreset =
    raw.preset === 'low' ||
    raw.preset === 'medium' ||
    raw.preset === 'high' ||
    raw.preset === 'retro' ||
    raw.preset === 'custom'
      ? raw.preset
      : 'high';

  return {
    preset,
    bloomEnabled:
      typeof raw.bloomEnabled === 'boolean'
        ? raw.bloomEnabled
        : DEFAULT_ORION_GRAPHICS_SETTINGS.bloomEnabled,
    bloomIntensity:
      typeof raw.bloomIntensity === 'number'
        ? Math.max(0, Math.min(1.5, Number(raw.bloomIntensity.toFixed(2))))
        : DEFAULT_ORION_GRAPHICS_SETTINGS.bloomIntensity,
    dynamicLighting:
      typeof raw.dynamicLighting === 'boolean'
        ? raw.dynamicLighting
        : DEFAULT_ORION_GRAPHICS_SETTINGS.dynamicLighting,
    ambientDarknessScale:
      typeof raw.ambientDarknessScale === 'number'
        ? Math.max(0.3, Math.min(1.2, Number(raw.ambientDarknessScale.toFixed(2))))
        : DEFAULT_ORION_GRAPHICS_SETTINGS.ambientDarknessScale,
    weatherEnabled:
      typeof raw.weatherEnabled === 'boolean'
        ? raw.weatherEnabled
        : DEFAULT_ORION_GRAPHICS_SETTINGS.weatherEnabled,
    weatherIntensityScale:
      typeof raw.weatherIntensityScale === 'number'
        ? Math.max(0, Math.min(1.5, Number(raw.weatherIntensityScale.toFixed(2))))
        : DEFAULT_ORION_GRAPHICS_SETTINGS.weatherIntensityScale,
    liquidReflections:
      typeof raw.liquidReflections === 'boolean'
        ? raw.liquidReflections
        : DEFAULT_ORION_GRAPHICS_SETTINGS.liquidReflections,
    bladeTrails:
      typeof raw.bladeTrails === 'boolean'
        ? raw.bladeTrails
        : DEFAULT_ORION_GRAPHICS_SETTINGS.bladeTrails,
    outlinePass:
      typeof raw.outlinePass === 'boolean'
        ? raw.outlinePass
        : DEFAULT_ORION_GRAPHICS_SETTINGS.outlinePass,
    screenShakeScale:
      typeof raw.screenShakeScale === 'number'
        ? Math.max(0, Math.min(1.5, Number(raw.screenShakeScale.toFixed(2))))
        : DEFAULT_ORION_GRAPHICS_SETTINGS.screenShakeScale,
    scanlinesEnabled:
      typeof raw.scanlinesEnabled === 'boolean'
        ? raw.scanlinesEnabled
        : DEFAULT_ORION_GRAPHICS_SETTINGS.scanlinesEnabled,
    hudResolution: raw.hudResolution === 'pixel' ? 'pixel' : 'hires',
    devModeEnabled:
      typeof raw.devModeEnabled === 'boolean'
        ? raw.devModeEnabled
        : DEFAULT_ORION_GRAPHICS_SETTINGS.devModeEnabled,
  };
}

function loadStoredGraphicsSettings(): OrionGraphicsSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_ORION_GRAPHICS_SETTINGS };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ORION_GRAPHICS_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<OrionGraphicsSettings>;
    return sanitizeSettings(parsed);
  } catch {
    return { ...DEFAULT_ORION_GRAPHICS_SETTINGS };
  }
}

let activeGraphicsSettings: OrionGraphicsSettings = loadStoredGraphicsSettings();
/** Active graphics-setting subscribers; entries are evicted when their `subscribeOrionGraphicsSettings` cleanup callback runs on unmount. */
const listeners: Set<(settings: OrionGraphicsSettings) => void> = new Set();

function persistAndNotify(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activeGraphicsSettings));
    } catch {
      // Ignore storage quota errors
    }
  }
  listeners.forEach((fn) => {
    try {
      fn(activeGraphicsSettings);
    } catch {
      // Ignore subscriber errors
    }
  });
}

/**
 * Returns the current active `OrionGraphicsSettings` snapshot for the 60fps render pipeline.
 */
export function getOrionGraphicsSettings(): OrionGraphicsSettings {
  return activeGraphicsSettings;
}

/**
 * Subscribes to updates on `OrionGraphicsSettings`.
 */
export function subscribeOrionGraphicsSettings(
  listener: (settings: OrionGraphicsSettings) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Applies one of the four named quality presets (`low`, `medium`, `high`, `retro`), preserving `devModeEnabled`.
 */
export function applyOrionGraphicsPreset(
  preset: Exclude<OrionGraphicsPreset, 'custom'>
): OrionGraphicsSettings {
  const template = ORION_GRAPHICS_PRESETS[preset];
  activeGraphicsSettings = sanitizeSettings({
    preset,
    ...template,
    devModeEnabled: activeGraphicsSettings.devModeEnabled,
  });
  persistAndNotify();
  return activeGraphicsSettings;
}

/**
 * Updates one or more individual graphics properties and marks the active profile as `'custom'`
 * unless `patch.preset` is explicitly provided or only `devModeEnabled` is updated.
 */
export function updateOrionGraphicsSettings(
  patch: Partial<OrionGraphicsSettings>
): OrionGraphicsSettings {
  const isOnlyDevModeChange =
    Object.keys(patch).length === 1 && typeof patch.devModeEnabled === 'boolean';
  const nextPreset: OrionGraphicsPreset =
    patch.preset ?? (isOnlyDevModeChange ? activeGraphicsSettings.preset : 'custom');
  activeGraphicsSettings = sanitizeSettings({
    ...activeGraphicsSettings,
    ...patch,
    preset: nextPreset,
  });
  persistAndNotify();
  return activeGraphicsSettings;
}

/**
 * Toggles the Developer Mode telemetry flag (`devModeEnabled`) and persists it to `localStorage`.
 */
export function toggleOrionDevMode(): boolean {
  const nextVal = !activeGraphicsSettings.devModeEnabled;
  updateOrionGraphicsSettings({ devModeEnabled: nextVal });
  return nextVal;
}

/**
 * Formats a world, area, room, or landmark title for player-facing UI vs. Developer Mode.
 * When `devMode` is `false`, strips internal module codes (`M00`, `M01`, `u00`), engine prefixes
 * (`Set-Path`), and coordinate brackets (`[x,y]`).
 */
export function formatOrionLoreLabel(
  rawLabel: string | undefined,
  devMode: boolean = activeGraphicsSettings.devModeEnabled
): string {
  if (!rawLabel) return '';
  if (devMode) return rawLabel;
  return rawLabel
    .replace(/\bu00\s+/gi, '')
    .replace(/\bM00\s+The\s+Bog\b/gi, 'The Sunken Bog')
    .replace(/\bM00\s+Unified\s+Bog\s+Spine\b/gi, 'Sunken Bog Causeway')
    .replace(/\bM00\s+/gi, '')
    .replace(/\bM01\s+/gi, '')
    .replace(/\bSet-Path\s+Causeway\b/gi, 'Ancient Causeway')
    .replace(/\bAbyssal\s+Fog\s+Loop\s+Dungeon\b/gi, 'Sunken Ruin Sanctum')
    .replace(/\s*\[[-0-9,\s]+\]/g, '')
    .replace(/\s*\([-0-9]+,\s*[-0-9]+\)/g, '')
    .trim();
}

/**
 * Resets all graphics settings back to the factory `high` preset.
 */
export function resetOrionGraphicsSettings(): OrionGraphicsSettings {
  return applyOrionGraphicsPreset('high');
}
