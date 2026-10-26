/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrionDir, OrionState } from '../types';

export interface ResolvedPlayerSpriteParts {
  coreplateStyle: 'bastion' | 'fortress' | 'guardian' | 'recon' | 'projector' | 'sanctum';
  headStyle: 'murmillio' | 'ironveil' | 'aegis' | 'veilsight' | 'omniscient' | 'providence';
  armsStyle: 'twinstrike' | 'lineholder' | 'solbright' | 'silencer' | 'arcanum' | 'sanctum';
}

export function resolvePlayerSpriteParts(state: OrionState): ResolvedPlayerSpriteParts {
  const plating = (state.equipmentSlots?.plating || '').toLowerCase();
  const head = (state.equipmentSlots?.head || '').toLowerCase();
  const arms = (state.equipmentSlots?.arms || '').toLowerCase();

  // 1. Resolve Coreplate Style
  let coreplateStyle: ResolvedPlayerSpriteParts['coreplateStyle'] = 'bastion';
  if (plating.includes('fortress') || plating.includes('fire') || plating.includes('hardened')) {
    coreplateStyle = 'fortress';
  } else if (plating.includes('dawnforge') || plating.includes('guardian')) {
    coreplateStyle = 'guardian';
  } else if (plating.includes('shadowcraft') || plating.includes('recon') || plating.includes('ablative')) {
    coreplateStyle = 'recon';
  } else if (plating.includes('arcanum') || plating.includes('projector') || plating.includes('layered')) {
    coreplateStyle = 'projector';
  } else if (plating.includes('sanctum') || plating.includes('support')) {
    coreplateStyle = 'sanctum';
  } else if (plating.includes('bastion') || plating.includes('reactive')) {
    coreplateStyle = 'bastion';
  } else {
    // Fallback to traitLine only if custom/unrecognized string
    switch (state.traitLine) {
      case 'Marauder':
        coreplateStyle = 'fortress';
        break;
      case 'Guardian':
        coreplateStyle = 'guardian';
        break;
      case 'Rogue':
        coreplateStyle = 'recon';
        break;
      case 'Wizard':
        coreplateStyle = 'projector';
        break;
      case 'Cleric':
        coreplateStyle = 'sanctum';
        break;
      default:
        coreplateStyle = 'bastion';
    }
  }

  // 2. Resolve Head Style
  let headStyle: ResolvedPlayerSpriteParts['headStyle'] = 'murmillio';
  if (head.includes('ironveil') || head.includes('foresight')) {
    headStyle = 'ironveil';
  } else if (head.includes('aegis') || head.includes('halo') || head.includes('radiant')) {
    headStyle = 'aegis';
  } else if (head.includes('veilsight') || head.includes('vx')) {
    headStyle = 'veilsight';
  } else if (head.includes('omniscient') || head.includes('arc')) {
    headStyle = 'omniscient';
  } else if (head.includes('providence') || head.includes('sanc')) {
    headStyle = 'providence';
  } else if (head.includes('murmillio') || head.includes('embersight')) {
    headStyle = 'murmillio';
  } else {
    switch (state.traitLine) {
      case 'Marauder':
        headStyle = 'ironveil';
        break;
      case 'Guardian':
        headStyle = 'aegis';
        break;
      case 'Rogue':
        headStyle = 'veilsight';
        break;
      case 'Wizard':
        headStyle = 'omniscient';
        break;
      case 'Cleric':
        headStyle = 'providence';
        break;
      default:
        headStyle = 'murmillio';
    }
  }

  // 3. Resolve Arms Style
  let armsStyle: ResolvedPlayerSpriteParts['armsStyle'] = 'twinstrike';
  if (arms.includes('line holder') || arms.includes('fire_ice') || arms.includes('fire & ice')) {
    armsStyle = 'lineholder';
  } else if (arms.includes('solbright') || arms.includes('cleaver')) {
    armsStyle = 'solbright';
  } else if (arms.includes('shadowcraft') || arms.includes('silencer')) {
    armsStyle = 'silencer';
  } else if (arms.includes('arcanum') || arms.includes('beam') || arms.includes('channeler')) {
    armsStyle = 'arcanum';
  } else if (arms.includes('sanctum') || arms.includes('blessing') || arms.includes('benediction')) {
    armsStyle = 'sanctum';
  } else if (arms.includes('twinstrike') || arms.includes('bwi')) {
    armsStyle = 'twinstrike';
  } else {
    switch (state.traitLine) {
      case 'Marauder':
        armsStyle = 'lineholder';
        break;
      case 'Guardian':
        armsStyle = 'solbright';
        break;
      case 'Rogue':
        armsStyle = 'silencer';
        break;
      case 'Wizard':
        armsStyle = 'arcanum';
        break;
      case 'Cleric':
        armsStyle = 'sanctum';
        break;
      default:
        armsStyle = 'twinstrike';
    }
  }

  return { coreplateStyle, headStyle, armsStyle };
}

export interface DrawCompositePlayerOptions {
  dir?: OrionDir;
  isMoving?: boolean;
  isAttacking?: boolean;
}

/**
 * Renders the modular player Mech sprite composed of:
 * 1. Coreplate (Torso chassis, shoulders, reactor core)
 * 2. Arms (Left & Right mechanical armatures/gauntlets)
 * 3. Head (Command helm, crest, directional optic visor)
 *
 * Changing head, arms, or coreplate in Loadout immediately updates the corresponding sprite layer.
 */
export function drawCompositePlayerMech(
  g: CanvasRenderingContext2D,
  state: OrionState,
  x: number,
  py: number,
  timeSec: number,
  options?: DrawCompositePlayerOptions
): void {
  const { coreplateStyle, headStyle, armsStyle } = resolvePlayerSpriteParts(state);
  const dir = options?.dir || state.dir || 'S';
  const isMoving =
    options?.isMoving ?? (Math.abs(state.vx || 0) > 1 || Math.abs(state.vy || 0) > 1);
  const isCritical = state.frame?.state === 'Critical';

  const walkCycle = isMoving ? Math.sin(timeSec * 14) : 0;
  const bobY = isMoving ? Math.abs(Math.sin(timeSec * 14)) * 1.0 : 0;
  const cx = Math.round(x);
  const cy = Math.round(py - bobY);

  const facingDx =
    dir === 'E' || dir === 'NE' || dir === 'SE'
      ? 1
      : dir === 'W' || dir === 'NW' || dir === 'SW'
        ? -1
        : 0;
  const isNorth = dir === 'N' || dir === 'NE' || dir === 'NW';

  g.save();

  // ─── LEGS / LOWER CHASSIS STANCE ─────────────────────────────────────────
  const leftLegY = Math.round(walkCycle * 1.5);
  const rightLegY = Math.round(-walkCycle * 1.5);
  g.fillStyle = '#0f172a';
  g.fillRect(cx - 4, cy - 3 + leftLegY, 3, 3);
  g.fillRect(cx + 1, cy - 3 + rightLegY, 3, 3);

  // ─── LAYER 1: COREPLATE (TORSO & SHOULDERS) ──────────────────────────────
  let torsoW = 8;
  let torsoH = 10;
  let baseColor = '#334155';
  let trimColor = '#38bdf8';
  let coreColor = '#f97316';

  switch (coreplateStyle) {
    case 'fortress':
      torsoW = 12;
      torsoH = 11;
      baseColor = '#1f2937';
      trimColor = '#f59e0b';
      coreColor = '#ef4444';
      break;
    case 'guardian':
      torsoW = 10;
      torsoH = 10;
      baseColor = '#cbd5e1';
      trimColor = '#eab308';
      coreColor = '#38bdf8';
      break;
    case 'recon':
      torsoW = 7;
      torsoH = 9;
      baseColor = '#0f172a';
      trimColor = '#a855f7';
      coreColor = '#c084fc';
      break;
    case 'projector':
      torsoW = 8;
      torsoH = 10;
      baseColor = '#1e1b4b';
      trimColor = '#38bdf8';
      coreColor = '#00f0ff';
      break;
    case 'sanctum':
      torsoW = 9;
      torsoH = 10;
      baseColor = '#f1f5f9';
      trimColor = '#f59e0b';
      coreColor = '#10b981';
      break;
    case 'bastion':
    default:
      torsoW = 9;
      torsoH = 10;
      baseColor = '#334155';
      trimColor = '#38bdf8';
      coreColor = '#f97316';
      break;
  }

  if (isCritical && Math.floor(timeSec * 8) % 2 === 0) {
    baseColor = '#7f1d1d';
    coreColor = '#fca5a5';
  }

  const torsoLeft = cx - Math.floor(torsoW / 2);
  const torsoTop = cy - 3 - torsoH;

  // 1px dark silhouette outline around torso
  g.fillStyle = '#020617';
  g.fillRect(torsoLeft - 1, torsoTop - 1, torsoW + 2, torsoH + 2);

  // Main coreplate body
  g.fillStyle = baseColor;
  g.fillRect(torsoLeft, torsoTop, torsoW, torsoH);

  // Coreplate-specific silhouette & shoulder details
  if (coreplateStyle === 'fortress') {
    // Outrigger shoulder bulwarks & hazard stripes
    g.fillStyle = trimColor;
    g.fillRect(torsoLeft - 1, torsoTop, 3, 4);
    g.fillRect(torsoLeft + torsoW - 2, torsoTop, 3, 4);
    // Outrigger hip stabilizers
    g.fillStyle = '#374151';
    g.fillRect(torsoLeft - 2, torsoTop + torsoH - 3, 2, 3);
    g.fillRect(torsoLeft + torsoW, torsoTop + torsoH - 3, 2, 3);
  } else if (coreplateStyle === 'guardian') {
    // Layered golden pauldrons & emitter pips
    g.fillStyle = trimColor;
    g.fillRect(torsoLeft - 1, torsoTop, torsoW + 2, 2);
    g.fillStyle = '#60a5fa';
    g.fillRect(torsoLeft, torsoTop + 1, 2, 2);
    g.fillRect(torsoLeft + torsoW - 2, torsoTop + 1, 2, 2);
  } else if (coreplateStyle === 'recon') {
    // Sleek stealth scarf/vent & violet trim
    g.fillStyle = trimColor;
    g.fillRect(torsoLeft, torsoTop + 1, torsoW, 1);
    g.fillRect(cx - 1, torsoTop + 3, 2, 5);
  } else if (coreplateStyle === 'projector') {
    // Floating crystal shoulder prisms
    const prismFloat = Math.round(Math.sin(timeSec * 5) * 1);
    g.fillStyle = '#00f0ff';
    g.fillRect(torsoLeft - 2, torsoTop - 1 + prismFloat, 2, 3);
    g.fillRect(torsoLeft + torsoW, torsoTop - 1 - prismFloat, 2, 3);
    g.fillStyle = trimColor;
    g.fillRect(torsoLeft + 1, torsoTop + 1, torsoW - 2, 1);
  } else if (coreplateStyle === 'sanctum') {
    // Winged alabaster shoulder cowls & gold cross-trim
    g.fillStyle = trimColor;
    g.fillRect(torsoLeft - 1, torsoTop - 1, 2, 3);
    g.fillRect(torsoLeft + torsoW - 1, torsoTop - 1, 2, 3);
    g.fillRect(cx - 1, torsoTop + 1, 2, torsoH - 2);
  } else {
    // Bastion angular turbine pauldrons
    g.fillStyle = trimColor;
    g.fillRect(torsoLeft, torsoTop, 2, 3);
    g.fillRect(torsoLeft + torsoW - 2, torsoTop, 2, 3);
  }

  // Reactor Heart Glow (on chest when facing S/E/W, or exhaust vent when facing N)
  if (!isNorth) {
    g.fillStyle = '#090d16';
    g.fillRect(cx - 2, torsoTop + 3, 4, 4);
    g.fillStyle = coreColor;
    g.fillRect(cx - 1 + facingDx, torsoTop + 4, 2, 2);
  } else {
    // Rear reactor exhaust pack
    g.fillStyle = '#1e293b';
    g.fillRect(cx - 3, torsoTop + 2, 6, 5);
    g.fillStyle = coreColor;
    g.fillRect(cx - 2, torsoTop + 5, 1, 2);
    g.fillRect(cx + 1, torsoTop + 5, 1, 2);
  }

  // ─── LAYER 2: ARMS (LEFT & RIGHT ARMATURES) ──────────────────────────────
  let armColor = '#475569';
  let cuffColor = '#38bdf8';
  let armW = 3;
  let armH = 7;

  switch (armsStyle) {
    case 'lineholder':
      armColor = '#374151';
      cuffColor = '#f97316';
      armW = 4;
      armH = 8;
      break;
    case 'solbright':
      armColor = '#e2e8f0';
      cuffColor = '#eab308';
      armW = 3;
      armH = 7;
      break;
    case 'silencer':
      armColor = '#18181b';
      cuffColor = '#a855f7';
      armW = 2;
      armH = 7;
      break;
    case 'arcanum':
      armColor = '#312e81';
      cuffColor = '#00f0ff';
      armW = 3;
      armH = 7;
      break;
    case 'sanctum':
      armColor = '#f8fafc';
      cuffColor = '#10b981';
      armW = 3;
      armH = 7;
      break;
    case 'twinstrike':
    default:
      armColor = '#475569';
      cuffColor = '#38bdf8';
      armW = 3;
      armH = 7;
      break;
  }

  const leftArmSwingY = Math.round(-walkCycle * 1.5);
  const rightArmSwingY = Math.round(walkCycle * 1.5);
  const leftArmX = torsoLeft - armW;
  const rightArmX = torsoLeft + torsoW;
  const armBaseY = torsoTop + 1;

  // Left Arm
  g.fillStyle = '#020617';
  g.fillRect(leftArmX - 1, armBaseY + leftArmSwingY - 1, armW + 1, armH + 2);
  g.fillStyle = armColor;
  g.fillRect(leftArmX, armBaseY + leftArmSwingY, armW, armH);
  g.fillStyle = cuffColor;
  g.fillRect(leftArmX, armBaseY + leftArmSwingY + armH - 2, armW, 2);

  // Right Arm
  g.fillStyle = '#020617';
  g.fillRect(rightArmX, armBaseY + rightArmSwingY - 1, armW + 1, armH + 2);
  g.fillStyle = armColor;
  g.fillRect(rightArmX, armBaseY + rightArmSwingY, armW, armH);
  g.fillStyle = cuffColor;
  g.fillRect(rightArmX, armBaseY + rightArmSwingY + armH - 2, armW, 2);

  // ─── LAYER 3: HEAD (COMMAND HELM & OPTICS) ───────────────────────────────
  let headW = 6;
  let headH = 5;
  let helmColor = '#1e293b';
  let visorColor = '#38bdf8';
  let crestColor = '#f97316';

  switch (headStyle) {
    case 'ironveil':
      headW = 8;
      headH = 5;
      helmColor = '#374151';
      visorColor = '#ef4444';
      crestColor = '#f59e0b';
      break;
    case 'aegis':
      headW = 6;
      headH = 6;
      helmColor = '#e2e8f0';
      visorColor = '#38bdf8';
      crestColor = '#eab308';
      break;
    case 'veilsight':
      headW = 6;
      headH = 5;
      helmColor = '#090d16';
      visorColor = '#a855f7';
      crestColor = '#c084fc';
      break;
    case 'omniscient':
      headW = 6;
      headH = 6;
      helmColor = '#1e1b4b';
      visorColor = '#00f0ff';
      crestColor = '#38bdf8';
      break;
    case 'providence':
      headW = 6;
      headH = 5;
      helmColor = '#f8fafc';
      visorColor = '#10b981';
      crestColor = '#f59e0b';
      break;
    case 'murmillio':
    default:
      headW = 6;
      headH = 5;
      helmColor = '#334155';
      visorColor = '#f97316';
      crestColor = '#38bdf8';
      break;
  }

  const headLeft = cx - Math.floor(headW / 2);
  const headTop = torsoTop - headH + 1;

  // Head silhouette outline
  g.fillStyle = '#020617';
  g.fillRect(headLeft - 1, headTop - 1, headW + 2, headH + 2);

  // Main helmet shell
  g.fillStyle = helmColor;
  g.fillRect(headLeft, headTop, headW, headH);

  // Headgear-specific crest / horns / halo / cowl details
  if (headStyle === 'murmillio') {
    // Raised central gladiator crest
    g.fillStyle = crestColor;
    g.fillRect(cx - 1, headTop - 2, 2, 3);
  } else if (headStyle === 'ironveil') {
    // Wide armored brow & side antennae
    g.fillStyle = crestColor;
    g.fillRect(headLeft, headTop, headW, 1);
    g.fillRect(headLeft - 1, headTop - 2, 1, 3);
  } else if (headStyle === 'aegis') {
    // Golden knightly crown crest
    g.fillStyle = crestColor;
    g.fillRect(headLeft + 1, headTop - 2, headW - 2, 2);
    g.fillRect(cx - 1, headTop - 3, 2, 1);
  } else if (headStyle === 'veilsight') {
    // Sleek stealth ear-fins
    g.fillStyle = crestColor;
    g.fillRect(headLeft - 1, headTop - 1, 1, 2);
    g.fillRect(headLeft + headW, headTop - 1, 1, 2);
  } else if (headStyle === 'omniscient') {
    // Floating crystal crown prism
    g.fillStyle = '#00f0ff';
    g.fillRect(cx - 1, headTop - 3, 2, 2);
  } else if (headStyle === 'providence') {
    // Seraphic side-wings & golden halo bar
    g.fillStyle = crestColor;
    g.fillRect(headLeft - 2, headTop + 1, 2, 2);
    g.fillRect(headLeft + headW, headTop + 1, 2, 2);
    g.fillRect(cx - 2, headTop - 2, 4, 1);
  }

  // Directional Optic Visor (hidden when facing North)
  if (!isNorth) {
    const visorX = headLeft + 1 + facingDx;
    const visorW = Math.max(2, headW - 2);
    g.fillStyle = '#020617';
    g.fillRect(visorX, headTop + 2, visorW, 2);
    g.fillStyle = visorColor;
    if (headStyle === 'veilsight') {
      // Tri-dot splinter optics
      g.fillRect(visorX, headTop + 2, 1, 1);
      g.fillRect(visorX + 2, headTop + 2, 1, 1);
    } else if (headStyle === 'ironveil') {
      // Dual heavy oculars
      g.fillRect(visorX, headTop + 2, 2, 1);
      g.fillRect(visorX + visorW - 2, headTop + 2, 2, 1);
    } else {
      // Glowing visor bar
      g.fillRect(visorX, headTop + 2, visorW, 1);
    }
  }

  g.restore();
}
