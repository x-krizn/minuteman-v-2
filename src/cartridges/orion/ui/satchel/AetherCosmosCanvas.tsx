/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { U00_UNIVERSE_CATALOG } from '../../database/world';
import { UniverseWorldDefinition, UniverseWorldTier } from '../../types';

/**
 * Props for `AetherCosmosCanvas`, the living 2D Canvas representation of the `u00` Æther Cosmos
 * where worlds orbit the central underworld vortex of `Sin` amidst swirling Æther currents.
 */
export interface AetherCosmosCanvasProps {
  selectedWorldId: string;
  currentWorldId: string;
  tierFilter: 'all' | UniverseWorldTier;
  showAlignmentGrid: boolean;
  onSelectWorld: (worldId: string) => void;
}

interface WorldVisualTheme {
  coreColor: string;
  secondaryColor: string;
  atmosphereColor: string;
  eddyColor: string;
  ringColor?: string;
  ringTilt?: number;
}

const SIN_CENTER_X = 51.5;
const SIN_CENTER_Y = 54.5;

const WORLD_THEMES: Record<string, WorldVisualTheme> = {
  world_sin: {
    coreColor: '#05020a',
    secondaryColor: '#be123c',
    atmosphereColor: '#a855f7',
    eddyColor: '#f43f5e',
    ringColor: '#e11d48',
    ringTilt: 0.35,
  },
  world_belldor: {
    coreColor: '#0f392b',
    secondaryColor: '#2dd4bf',
    atmosphereColor: '#38bdf8',
    eddyColor: '#5eead4',
    ringColor: '#fbbf24',
    ringTilt: -0.4,
  },
  world_tyrranus: {
    coreColor: '#991b1b',
    secondaryColor: '#fde68a',
    atmosphereColor: '#f59e0b',
    eddyColor: '#fbbf24',
    ringColor: '#fef08a',
    ringTilt: 0.5,
  },
  world_orion: {
    coreColor: '#451a03',
    secondaryColor: '#f97316',
    atmosphereColor: '#fb923c',
    eddyColor: '#fdba74',
    ringColor: '#94a3b8',
    ringTilt: 0.25,
  },
  world_novarin: {
    coreColor: '#3f1d1d',
    secondaryColor: '#dc2626',
    atmosphereColor: '#f87171',
    eddyColor: '#ef4444',
  },
  world_chyme: {
    coreColor: '#7c2d12',
    secondaryColor: '#fbbf24',
    atmosphereColor: '#c084fc',
    eddyColor: '#f97316',
    ringColor: '#f43f5e',
    ringTilt: -0.6,
  },
  world_golem: {
    coreColor: '#78350f',
    secondaryColor: '#fcd34d',
    atmosphereColor: '#d97706',
    eddyColor: '#fde68a',
    ringColor: '#d6d3d1',
    ringTilt: 0.18,
  },
  world_new_novarin: {
    coreColor: '#064e3b',
    secondaryColor: '#6ee7b7',
    atmosphereColor: '#67e8f9',
    eddyColor: '#34d399',
    ringColor: '#a7f3d0',
    ringTilt: -0.3,
  },
  // Minor worlds
  world_sylvis: {
    coreColor: '#14532d',
    secondaryColor: '#4ade80',
    atmosphereColor: '#22c55e',
    eddyColor: '#86efac',
  },
  world_vox: {
    coreColor: '#164e63',
    secondaryColor: '#38bdf8',
    atmosphereColor: '#a855f7',
    eddyColor: '#67e8f9',
  },
  world_victor: {
    coreColor: '#1e293b',
    secondaryColor: '#94a3b8',
    atmosphereColor: '#60a5fa',
    eddyColor: '#cbd5e1',
  },
  world_jager: {
    coreColor: '#312e81',
    secondaryColor: '#818cf8',
    atmosphereColor: '#c084fc',
    eddyColor: '#a5b4fc',
  },
  world_ferrous: {
    coreColor: '#431407',
    secondaryColor: '#ea580c',
    atmosphereColor: '#94a3b8',
    eddyColor: '#fb923c',
  },
  world_ebony: {
    coreColor: '#090d16',
    secondaryColor: '#64748b',
    atmosphereColor: '#9333ea',
    eddyColor: '#c084fc',
  },
  world_ivory: {
    coreColor: '#cbd5e1',
    secondaryColor: '#f8fafc',
    atmosphereColor: '#38bdf8',
    eddyColor: '#e2e8f0',
  },
};

function getWorldTheme(world: UniverseWorldDefinition): WorldVisualTheme {
  if (WORLD_THEMES[world.id]) {
    return WORLD_THEMES[world.id];
  }
  if (world.tier === 'major') {
    return {
      coreColor: '#3b0764',
      secondaryColor: '#c084fc',
      atmosphereColor: '#38bdf8',
      eddyColor: '#a855f7',
    };
  }
  if (world.tier === 'minor') {
    return {
      coreColor: '#0c4a6e',
      secondaryColor: '#38bdf8',
      atmosphereColor: '#22d3ee',
      eddyColor: '#67e8f9',
    };
  }
  return {
    coreColor: '#4c1d95',
    secondaryColor: '#f472b6',
    atmosphereColor: '#22d3ee',
    eddyColor: '#e879f9',
  };
}

/**
 * Computes the live `[0..100]` cosmic coordinates of a world orbiting `Sin` (`[51.5, 54.5]`)
 * at elapsed time `tSec` (or returns its canonical alignment coordinates when `orbitActive` is false).
 */
export function computeWorldLiveCoord(
  baseCoord: { xPct: number; yPct: number },
  world: UniverseWorldDefinition,
  tSec: number,
  orbitActive: boolean
): { xPct: number; yPct: number; orbitRadius: number; angleRad: number } {
  const dx = baseCoord.xPct - SIN_CENTER_X;
  const dy = baseCoord.yPct - SIN_CENTER_Y;
  const r0 = Math.hypot(dx, dy);
  const theta0 = Math.atan2(dy, dx);

  if (world.id === 'world_sin' || r0 < 1.5 || !orbitActive) {
    return {
      xPct: baseCoord.xPct,
      yPct: baseCoord.yPct,
      orbitRadius: r0,
      angleRad: theta0,
    };
  }

  // Keplerian-inspired angular velocity around Sin: closer worlds orbit faster;
  // Unstable/Drift worlds also experience a gentle radial tide oscillation in the Æther currents.
  const baseSpeed =
    world.tier === 'major' ? 2.4 : world.tier === 'minor' ? 3.4 : 4.2;
  const angularVel = baseSpeed / Math.max(10, Math.pow(r0, 0.78));
  const theta = theta0 + tSec * angularVel;

  const radialDrift =
    world.tier === 'unstable'
      ? Math.sin(tSec * 1.4 + (world.index || 1) * 1.7) * 1.15
      : Math.sin(tSec * 0.6 + (world.index || 1)) * 0.35;

  const effR = Math.max(4, r0 + radialDrift);
  // Subtle perspective flattening (0.94 vertical aspect) so orbits feel deep and dimensional
  const xPct = Math.max(4, Math.min(96, SIN_CENTER_X + Math.cos(theta) * effR));
  const yPct = Math.max(4, Math.min(96, SIN_CENTER_Y + Math.sin(theta) * effR * 0.96));

  return { xPct, yPct, orbitRadius: effR, angleRad: theta };
}

/**
 * Renders the living `u00` Æther Cosmos World Map canvas where Æther currents swirl around worlds
 * and all realms orbit the central Underworld singularity of `Sin`.
 */
export const AetherCosmosCanvas: React.FC<AetherCosmosCanvasProps> = ({
  selectedWorldId,
  currentWorldId,
  tierFilter,
  showAlignmentGrid,
  onSelectWorld,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [orbitActive, setOrbitActive] = useState<boolean>(true);
  const [hoveredWorldId, setHoveredWorldId] = useState<string | null>(null);
  const animTimeRef = useRef<number>(0);

  // Store latest live rendered positions for accurate pointer click/hover hit-testing
  const liveNodesRef = useRef<
    Array<{
      worldId: string;
      name: string;
      xPct: number;
      yPct: number;
      hitRadiusPct: number;
    }>
  >([]);

  useEffect(() => {
    let rafId: number | null = null;
    let lastTs = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;
      if (orbitActive) {
        animTimeRef.current += dt;
      }
      const t = animTimeRef.current;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const W = canvas.width;
          const H = canvas.height;
          const sinX = (SIN_CENTER_X / 100) * W;
          const sinY = (SIN_CENTER_Y / 100) * H;

          // 1. Deep Abyssal Æther Void Backdrop
          const bgGrad = ctx.createRadialGradient(sinX, sinY, 4, sinX, sinY, W * 0.72);
          bgGrad.addColorStop(0, '#180726');
          bgGrad.addColorStop(0.38, '#0b061a');
          bgGrad.addColorStop(0.75, '#05040d');
          bgGrad.addColorStop(1, '#020206');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, W, H);

          // 2. Volumetric Swirling Æther Nebula Clouds
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const nebulaClusters = [
            { r: 0.34, speed: 0.12, phase: 0.4, color: 'rgba(56, 189, 248, 0.07)' },
            { r: 0.26, speed: -0.16, phase: 1.9, color: 'rgba(168, 85, 247, 0.08)' },
            { r: 0.42, speed: 0.09, phase: 3.1, color: 'rgba(45, 212, 191, 0.06)' },
            { r: 0.18, speed: -0.24, phase: 4.5, color: 'rgba(244, 63, 94, 0.08)' },
            { r: 0.38, speed: 0.11, phase: 5.2, color: 'rgba(129, 140, 248, 0.06)' },
          ];
          for (const neb of nebulaClusters) {
            const ang = neb.phase + t * neb.speed;
            const nx = sinX + Math.cos(ang) * (W * neb.r);
            const ny = sinY + Math.sin(ang) * (H * neb.r * 0.92);
            const rad = W * 0.28;
            const nGrad = ctx.createRadialGradient(nx, ny, 2, nx, ny, rad);
            nGrad.addColorStop(0, neb.color);
            nGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = nGrad;
            ctx.beginPath();
            ctx.arc(nx, ny, rad, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // 3. Distant Twinkling Astral Dust
          for (let i = 0; i < 48; i++) {
            const seed = (i + 1) * 73.19;
            const sx = ((seed * 41.3) % 94 + 3) * (W / 100);
            const sy = ((seed * 89.7) % 94 + 3) * (H / 100);
            const twinkle = 0.25 + 0.55 * Math.max(0, Math.sin(t * 1.8 + seed));
            ctx.fillStyle =
              i % 3 === 0
                ? `rgba(103, 232, 249, ${twinkle.toFixed(2)})`
                : i % 3 === 1
                  ? `rgba(216, 180, 254, ${twinkle.toFixed(2)})`
                  : `rgba(248, 250, 252, ${(twinkle * 0.7).toFixed(2)})`;
            ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
          }

          // 4. Macro Swirling Æther Currents Spiraling Around Sin
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const streamArms = 6;
          for (let arm = 0; arm < streamArms; arm++) {
            const armOffset = (arm * Math.PI * 2) / streamArms;
            const isCyanArm = arm % 2 === 0;
            ctx.strokeStyle = isCyanArm
              ? 'rgba(34, 211, 238, 0.16)'
              : 'rgba(192, 132, 252, 0.16)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            for (let step = 0; step <= 42; step++) {
              const frac = step / 42;
              const rPx = (0.04 + frac * 0.45) * W;
              const swirlAng =
                armOffset + frac * 3.6 - t * (0.28 - frac * 0.12) + Math.sin(frac * 8 + t) * 0.08;
              const px = sinX + Math.cos(swirlAng) * rPx;
              const py = sinY + Math.sin(swirlAng) * rPx * 0.95;
              if (step === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();

            // Luminous Æther motes flowing along each spiral current arm
            for (let m = 0; m < 5; m++) {
              const moteFrac = ((t * 0.09 + m * 0.2 + arm * 0.13) % 1);
              const rPx = (0.05 + (1 - moteFrac) * 0.43) * W;
              const swirlAng =
                armOffset +
                (1 - moteFrac) * 3.6 -
                t * (0.28 - (1 - moteFrac) * 0.12);
              const mx = sinX + Math.cos(swirlAng) * rPx;
              const my = sinY + Math.sin(swirlAng) * rPx * 0.95;
              ctx.fillStyle = isCyanArm
                ? 'rgba(103, 232, 249, 0.65)'
                : 'rgba(232, 121, 249, 0.65)';
              ctx.beginPath();
              ctx.arc(mx, my, 1.3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();

          // 5. Compute Live World Positions & Render Orbital Wake Rings
          const visibleWorlds = U00_UNIVERSE_CATALOG.filter(
            (w) => tierFilter === 'all' || w.tier === tierFilter
          );
          const nextHitNodes: typeof liveNodesRef.current = [];

          for (const world of visibleWorlds) {
            const livePrimary = computeWorldLiveCoord(
              world.mapCoord,
              world,
              t,
              orbitActive
            );
            const isSelected = world.id === selectedWorldId;
            const isCurrent = world.id === currentWorldId;
            const isHovered = world.id === hoveredWorldId;
            const theme = getWorldTheme(world);

            // Orbital wake / alignment track around Sin
            if (world.id !== 'world_sin' && livePrimary.orbitRadius > 2) {
              const orbitRx = (livePrimary.orbitRadius / 100) * W;
              const orbitRy = (livePrimary.orbitRadius / 100) * H * 0.96;

              if (showAlignmentGrid || isSelected || isCurrent || isHovered) {
                ctx.save();
                ctx.strokeStyle = isSelected
                  ? 'rgba(250, 204, 21, 0.35)'
                  : isCurrent
                    ? 'rgba(34, 211, 238, 0.28)'
                    : 'rgba(148, 163, 184, 0.12)';
                ctx.lineWidth = isSelected || isCurrent ? 1.0 : 0.6;
                ctx.setLineDash(showAlignmentGrid ? [2, 2] : [4, 3]);
                ctx.beginPath();
                ctx.ellipse(sinX, sinY, orbitRx, orbitRy, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
              }

              // Trailing Æther wake arc behind the orbiting world
              ctx.save();
              ctx.strokeStyle = theme.eddyColor;
              ctx.globalAlpha = isSelected || isCurrent ? 0.55 : 0.26;
              ctx.lineWidth = world.tier === 'major' ? 1.6 : 1.1;
              ctx.beginPath();
              ctx.ellipse(
                sinX,
                sinY,
                orbitRx,
                orbitRy,
                0,
                livePrimary.angleRad - 0.42,
                livePrimary.angleRad
              );
              ctx.stroke();
              ctx.restore();
            }
          }

          // 6. Render Sin Central Underworld Vortex First (Gravitational Core at [51.5, 54.5])
          {
            const sinPulse = 1 + Math.sin(t * 2.4) * 0.08;
            const vortexR = 16 * sinPulse;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const sinHalo = ctx.createRadialGradient(sinX, sinY, 2, sinX, sinY, vortexR * 1.6);
            sinHalo.addColorStop(0, 'rgba(225, 29, 72, 0.45)');
            sinHalo.addColorStop(0.5, 'rgba(147, 51, 234, 0.24)');
            sinHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = sinHalo;
            ctx.beginPath();
            ctx.arc(sinX, sinY, vortexR * 1.6, 0, Math.PI * 2);
            ctx.fill();

            // Accretion vortex blades spiraling into Sin
            for (let b = 0; b < 4; b++) {
              const bAng = -t * 1.4 + (b * Math.PI) / 2;
              ctx.strokeStyle = b % 2 === 0 ? 'rgba(244, 63, 94, 0.55)' : 'rgba(192, 132, 252, 0.45)';
              ctx.lineWidth = 1.4;
              ctx.beginPath();
              ctx.arc(sinX, sinY, 9.5, bAng, bAng + 1.15);
              ctx.stroke();
            }
            ctx.restore();
          }

          // 7. Render Each World & Its Swirling Local Æther Eddies
          for (const world of visibleWorlds) {
            const livePrimary = computeWorldLiveCoord(
              world.mapCoord,
              world,
              t,
              orbitActive
            );
            const allNodes = [
              {
                xPct: livePrimary.xPct,
                yPct: livePrimary.yPct,
                mapCode: world.mapCoord.mapCode,
                nodeSize: world.mapCoord.nodeSize,
                isPrimary: true,
                label: world.name,
              },
              ...(world.driftCoords || []).map((dc) => {
                const liveDc = computeWorldLiveCoord(dc, world, t * 1.25, orbitActive);
                return {
                  xPct: liveDc.xPct,
                  yPct: liveDc.yPct,
                  mapCode: dc.mapCode,
                  nodeSize: dc.nodeSize,
                  isPrimary: false,
                  label: dc.label || `${world.name} Anchor`,
                };
              }),
            ];

            const isSelected = world.id === selectedWorldId;
            const isCurrent = world.id === currentWorldId;
            const isHovered = world.id === hoveredWorldId;
            const theme = getWorldTheme(world);

            // If a world has a phase-mirrored satellite (like Jager), draw a shimmering Æther tether between them
            if (allNodes.length > 1) {
              const p0 = allNodes[0];
              const p1 = allNodes[1];
              ctx.save();
              ctx.strokeStyle = 'rgba(165, 180, 252, 0.35)';
              ctx.setLineDash([2, 2]);
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo((p0.xPct / 100) * W, (p0.yPct / 100) * H);
              ctx.lineTo((p1.xPct / 100) * W, (p1.yPct / 100) * H);
              ctx.stroke();
              ctx.restore();
            }

            for (const n of allNodes) {
              const wx = (n.xPct / 100) * W;
              const wy = (n.yPct / 100) * H;
              const radiusPx =
                n.nodeSize === 'major'
                  ? world.id === 'world_sin'
                    ? 9.2
                    : 7.4
                  : n.nodeSize === 'minor'
                    ? 4.8
                    : 3.4;

              nextHitNodes.push({
                worldId: world.id,
                name: n.label,
                xPct: n.xPct,
                yPct: n.yPct,
                hitRadiusPct: n.nodeSize === 'major' ? 6.5 : 4.8,
              });

              // A. Swirling Local Æther Currents Around This World
              ctx.save();
              ctx.globalCompositeOperation = 'lighter';
              const haloR = radiusPx * (isSelected || isCurrent ? 2.6 : 2.1);
              const hGrad = ctx.createRadialGradient(wx, wy, radiusPx * 0.3, wx, wy, haloR);
              hGrad.addColorStop(0, theme.atmosphereColor);
              hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.globalAlpha = isSelected || isCurrent ? 0.45 : 0.28;
              ctx.fillStyle = hGrad;
              ctx.beginPath();
              ctx.arc(wx, wy, haloR, 0, Math.PI * 2);
              ctx.fill();

              // Swirling eddy arcs curling around the world
              const eddyCount = n.nodeSize === 'major' ? 3 : 2;
              const eddySpeed = world.id === 'world_sin' ? -1.8 : 1.3 + ((world.index || 1) % 3) * 0.3;
              ctx.strokeStyle = theme.eddyColor;
              ctx.lineWidth = n.nodeSize === 'major' ? 1.2 : 0.9;
              ctx.globalAlpha = isSelected || isCurrent ? 0.78 : 0.46;
              for (let eIdx = 0; eIdx < eddyCount; eIdx++) {
                const startA =
                  t * eddySpeed + (eIdx * Math.PI * 2) / eddyCount + (world.index || 0);
                const eddyR = radiusPx + 2.4 + Math.sin(t * 2 + eIdx) * 0.9;
                ctx.beginPath();
                ctx.arc(wx, wy, eddyR, startA, startA + 1.15);
                ctx.stroke();
              }
              ctx.restore();

              // B. Planetary Body / Unstable Rift Shard
              ctx.save();
              if (n.nodeSize === 'unstable') {
                // Unstable Drift Worlds: Rotating crystalline Æther shard
                const rot = t * 0.9 + (world.index || 1);
                ctx.translate(wx, wy);
                ctx.rotate(rot);
                ctx.fillStyle = theme.coreColor;
                ctx.strokeStyle = isSelected ? '#facc15' : theme.secondaryColor;
                ctx.lineWidth = isSelected ? 1.4 : 1.0;
                ctx.beginPath();
                ctx.moveTo(0, -radiusPx * 1.25);
                ctx.lineTo(radiusPx * 1.05, 0);
                ctx.lineTo(0, radiusPx * 1.25);
                ctx.lineTo(-radiusPx * 1.05, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(-1, -1, 2, 2);
              } else {
                // Major & Minor Spherical Worlds with shaded planetary body + surface band
                const pGrad = ctx.createRadialGradient(
                  wx - radiusPx * 0.32,
                  wy - radiusPx * 0.32,
                  radiusPx * 0.12,
                  wx,
                  wy,
                  radiusPx
                );
                if (world.id === 'world_sin') {
                  pGrad.addColorStop(0, '#3b0764');
                  pGrad.addColorStop(0.55, '#09020e');
                  pGrad.addColorStop(1, '#e11d48');
                } else {
                  pGrad.addColorStop(0, theme.secondaryColor);
                  pGrad.addColorStop(0.62, theme.coreColor);
                  pGrad.addColorStop(1, '#04060c');
                }

                ctx.fillStyle = pGrad;
                ctx.beginPath();
                ctx.arc(wx, wy, radiusPx, 0, Math.PI * 2);
                ctx.fill();

                // Subtle planetary rim border
                ctx.strokeStyle = isSelected
                  ? '#facc15'
                  : isCurrent
                    ? '#22d3ee'
                    : theme.atmosphereColor;
                ctx.lineWidth = isSelected || isCurrent ? 1.4 : 0.85;
                ctx.stroke();

                // Planetary ring (if defined for this world)
                if (theme.ringColor && n.isPrimary) {
                  ctx.save();
                  ctx.translate(wx, wy);
                  ctx.rotate(theme.ringTilt || 0.3);
                  ctx.strokeStyle = theme.ringColor;
                  ctx.globalAlpha = 0.72;
                  ctx.lineWidth = 1.1;
                  ctx.beginPath();
                  ctx.ellipse(0, 0, radiusPx * 1.65, radiusPx * 0.45, 0, 0, Math.PI * 2);
                  ctx.stroke();
                  ctx.restore();
                }
              }
              ctx.restore();

              // C. Current / Selected Pilot Beacon & Optional Alignment Code
              if (isCurrent && n.isPrimary) {
                ctx.save();
                ctx.strokeStyle = '#22d3ee';
                ctx.lineWidth = 1.1;
                ctx.setLineDash([2.5, 2]);
                ctx.beginPath();
                ctx.arc(wx, wy, radiusPx + 5.2, t * 0.8, t * 0.8 + Math.PI * 2);
                ctx.stroke();
                ctx.restore();
              }

              if (isSelected && n.isPrimary) {
                ctx.save();
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 1.2;
                const rSel = radiusPx + 4.2 + Math.sin(t * 5) * 0.8;
                ctx.beginPath();
                ctx.arc(wx, wy, rSel, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
              }

              // Show World Name on Selected, Current, Hovered, or Sin; show Alignment Numbers only when Alignment Grid is toggled
              if (showAlignmentGrid) {
                ctx.save();
                ctx.font = 'bold 8px ui-monospace, monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#020617';
                ctx.fillText(n.mapCode, wx + 1, wy + 1);
                ctx.fillStyle = isSelected ? '#fef08a' : '#f8fafc';
                ctx.fillText(n.mapCode, wx, wy);
                ctx.restore();
              } else if (
                n.isPrimary &&
                (isSelected || isCurrent || isHovered || world.id === 'world_sin')
              ) {
                ctx.save();
                ctx.font = 'bold 8px ui-monospace, monospace';
                ctx.textAlign = 'center';
                const labelY = wy - radiusPx - 5;
                ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
                const textW = ctx.measureText(world.name.toUpperCase()).width + 6;
                ctx.fillRect(wx - textW / 2, labelY - 6, textW, 10);
                ctx.fillStyle = isSelected
                  ? '#fde047'
                  : isCurrent
                    ? '#67e8f9'
                    : world.id === 'world_sin'
                      ? '#fda4af'
                      : '#e2e8f0';
                ctx.fillText(world.name.toUpperCase(), wx, labelY + 1);
                ctx.restore();
              }
            }
          }

          liveNodesRef.current = nextHitNodes;
        }
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [selectedWorldId, currentWorldId, tierFilter, showAlignmentGrid, orbitActive, hoveredWorldId]);

  const resolveWorldAtPointer = (e: React.MouseEvent<HTMLCanvasElement>): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    let closestId: string | null = null;
    let closestDist = Infinity;
    for (const node of liveNodesRef.current) {
      const d = Math.hypot(xPct - node.xPct, yPct - node.yPct);
      if (d <= node.hitRadiusPct && d < closestDist) {
        closestDist = d;
        closestId = node.worldId;
      }
    }
    return closestId;
  };

  return (
    <div className="w-full flex flex-col items-center space-y-1.5">
      <div className="relative w-full max-w-[240px] aspect-square bg-[#030208] rounded-xs border border-[#4c1d95]/80 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={240}
          height={240}
          onClick={(e) => {
            const hitId = resolveWorldAtPointer(e);
            if (hitId) {
              soundSystem.playSelect();
              onSelectWorld(hitId);
            }
          }}
          onMouseMove={(e) => {
            const hitId = resolveWorldAtPointer(e);
            if (hitId !== hoveredWorldId) {
              setHoveredWorldId(hitId);
            }
          }}
          onMouseLeave={() => setHoveredWorldId(null)}
          className="w-full h-full block cursor-pointer"
          aria-label="Living Æther Cosmos World Map — Worlds Orbiting Sin"
        />

        {/* Bottom-left live orbital status pill */}
        <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between pointer-events-none text-[7.5px] px-1">
          <span className="px-1.5 py-0.5 bg-[#05030c]/85 border border-[#4c1d95]/60 rounded-xs text-[#e9d5ff]">
            {orbitActive ? '🌀 ÆTHER ORBIT AROUND SIN' : '⚓ CANONICAL ALIGNMENT'}
          </span>
          <button
            type="button"
            onClick={() => {
              soundSystem.playMenuBeep();
              setOrbitActive((prev) => !prev);
            }}
            className="pointer-events-auto px-1.5 py-0.5 bg-[#1e1b4b]/90 hover:bg-[#312e81] border border-[#818cf8]/60 rounded-xs text-[#c7d2fe] font-bold cursor-pointer"
          >
            {orbitActive ? 'PAUSE ORBIT' : 'RESUME ORBIT'}
          </button>
        </div>
      </div>
    </div>
  );
};
