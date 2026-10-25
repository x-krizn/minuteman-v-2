/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DamageFamily, DamageType, WeaponDefinition, WeaponWeightClass } from '../../types';
import { BUCKLER_SHIELD_STRIP_BASE64 } from './buckler_shield';
import { BOLT_CASTER_STRIP_BASE64 } from './gladius_boltcaster';
import { SHOTEL_STRIP_BASE64 } from './khopesh';

function getDamageFamily(dt: DamageType): DamageFamily {
  return dt === 'Beam' || dt === 'Pulse' || dt === 'Wave' ? 'Energy' : 'Kinetic';
}

interface MagitechWeaponSeed {
  id: string;
  name: string;
  weaponClass: string;
  primaryDamageType: DamageType;
  adaptiveDamageTypes?: [DamageType, DamageType];
  supportPulseOnHit?: {
    shieldRestore?: number;
    armorRestore?: number;
    heatVent?: number;
  };
  weightClass: WeaponWeightClass;
  skillCount?: number;
  loadoutSlots: string[];
  equipmentRole: 'ranged' | 'melee' | 'shield';
  handing?: '1-hand' | '2-hand' | 'off-hand-only';
  canBlock?: boolean;
  passiveShieldBonus?: number;
  bladeTrailColor: string;
  identity: string;
  lore: string;
  shotsPerChain: number;
  damagePerShot: number;
  chainDurationSec: number;
  reloadDurationSec: number;
  range: number;
  skills: [
    { name: string; desc: string },
    { name: string; dmg: number; cd: number; heat: number; dt?: DamageType; desc: string },
    { name: string; dmg: number; cd: number; heat: number; dt?: DamageType; desc: string },
    { name: string; dmg: number; cd: number; heat: number; dt?: DamageType; isBlock?: boolean; desc: string },
    { name: string; dmg: number; cd: number; heat: number; dt?: DamageType; desc: string }
  ];
}

function buildMagitechWeapon(seed: MagitechWeaponSeed): WeaponDefinition {
  const strip =
    seed.equipmentRole === 'shield'
      ? BUCKLER_SHIELD_STRIP_BASE64
      : seed.equipmentRole === 'melee'
        ? SHOTEL_STRIP_BASE64
        : BOLT_CASTER_STRIP_BASE64;

  const dt0 = seed.primaryDamageType;
  const dt1 = seed.skills[1].dt || dt0;
  const dt2 = seed.skills[2].dt || dt0;
  const dt3 = seed.skills[3].dt || (seed.canBlock ? 'Impact' : dt0);
  const dt4 = seed.skills[4].dt || dt0;

  return {
    id: seed.id,
    name: seed.name,
    class: `${seed.weaponClass} (${seed.loadoutSlots.join(' / ')})`,
    weaponClass: seed.weaponClass,
    skillCount: seed.skillCount,
    loadoutSlots: seed.loadoutSlots,
    adaptiveDamageTypes: seed.adaptiveDamageTypes,
    supportPulseOnHit: seed.supportPulseOnHit,
    equipmentRole: seed.equipmentRole,
    handing: seed.handing || (seed.weightClass === 'heavy' ? '2-hand' : '1-hand'),
    weightClass: seed.weightClass,
    canBlock: Boolean(seed.canBlock || seed.equipmentRole === 'melee' || seed.equipmentRole === 'shield'),
    passiveShieldBonus: seed.passiveShieldBonus,
    bladeTrailColor: seed.bladeTrailColor,
    description: `${seed.identity}. Canonical ${seed.weaponClass} (${seed.weightClass.toUpperCase()} load, ${seed.loadoutSlots.join(', ')}).`,
    lore: seed.lore,
    shotsPerChain: seed.shotsPerChain,
    damagePerShot: seed.damagePerShot,
    chainDurationSec: seed.chainDurationSec,
    reloadDurationSec: seed.reloadDurationSec,
    primaryDamageType: seed.primaryDamageType,
    variantStripBase64: strip,
    hardpointSprite: {
      base64: strip,
      cellWidth: 16,
      cellHeight: 16,
      col: 0,
      row: 0,
      renderWidth: 14,
      renderHeight: 14,
      anchor: 'center',
      orientFromEast: true,
    },
    iconSprite: {
      base64: strip,
      cellWidth: 16,
      cellHeight: 16,
      col: 0,
      row: 0,
      anchor: 'center',
    },
    moveset: [
      {
        slot: 0,
        name: seed.skills[0].name,
        damageType: dt0,
        damageFamily: getDamageFamily(dt0),
        damage: seed.damagePerShot,
        tellDurationSec: seed.equipmentRole === 'melee' ? 0.08 : 0.09,
        actionDurationSec: seed.chainDurationSec,
        cooldownSec: 0,
        isChain: true,
        reloadDurationSec: seed.reloadDurationSec,
        heatCost: seed.weightClass === 'heavy' ? 5 : seed.weightClass === 'medium' ? 3 : 2,
        range: seed.range,
        description: seed.skills[0].desc,
      },
      {
        slot: 1,
        name: seed.skills[1].name,
        damageType: dt1,
        damageFamily: getDamageFamily(dt1),
        damage: seed.skills[1].dmg,
        tellDurationSec: 0.22,
        actionDurationSec: 0.35,
        cooldownSec: seed.skills[1].cd,
        heatCost: seed.skills[1].heat,
        range: Math.round(seed.range * 1.15),
        description: seed.skills[1].desc,
      },
      {
        slot: 2,
        name: seed.skills[2].name,
        damageType: dt2,
        damageFamily: getDamageFamily(dt2),
        damage: seed.skills[2].dmg,
        tellDurationSec: 0.28,
        actionDurationSec: 0.4,
        cooldownSec: seed.skills[2].cd,
        heatCost: seed.skills[2].heat,
        range: seed.range,
        description: seed.skills[2].desc,
      },
      {
        slot: 3,
        name: seed.skills[3].name,
        damageType: dt3,
        damageFamily: getDamageFamily(dt3),
        damage: seed.skills[3].dmg,
        tellDurationSec: seed.skills[3].isBlock ? 0.04 : 0.2,
        actionDurationSec: seed.skills[3].isBlock ? 0.2 : 0.38,
        cooldownSec: seed.skills[3].isBlock ? 0 : seed.skills[3].cd,
        isBlock: Boolean(seed.skills[3].isBlock),
        heatCost: seed.skills[3].heat,
        range: seed.skills[3].isBlock ? 24 : Math.round(seed.range * 0.9),
        description: seed.skills[3].desc,
      },
      {
        slot: 4,
        name: seed.skills[4].name,
        damageType: dt4,
        damageFamily: getDamageFamily(dt4),
        damage: seed.skills[4].dmg,
        tellDurationSec: 0.38,
        actionDurationSec: 0.65,
        cooldownSec: seed.skills[4].cd,
        heatCost: seed.skills[4].heat,
        range: Math.round(seed.range * 1.1),
        description: seed.skills[4].desc,
      },
    ],
  };
}

// ─── 1. ASSAULT / BASTION LINEAGE WEAPONS (4) ────────────────────────────────

export const n55GladiusWeapon = buildMagitechWeapon({
  id: 'n55_gladius',
  name: 'N-55 Gladius',
  weaponClass: 'Bolter',
  primaryDamageType: 'Impact',
  weightClass: 'medium',
  skillCount: 3,
  loadoutSlots: ['Weapon 1', 'Weapon 2'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#f8fafc',
  identity: 'BCU reference weapon, burst-fire stabilization',
  lore: 'Standard-issue BCU reference Bolter engineered for disciplined 9-round kinetic salvos and recoil-stabilized frontline fire.',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.5,
  reloadDurationSec: 3.15,
  range: 88,
  skills: [
    { name: 'Stabilized 9-Round Burst', desc: 'Reference 9-shot kinetic burst dealing 6 Impact damage per bolt (54 BCU).' },
    { name: 'Hammerhead Impact Slug', dmg: 20, cd: 4.0, heat: 14, desc: 'High-mass kinetic slug that dents heavy armor plating.' },
    { name: 'Compensated Double-Tap', dmg: 16, cd: 5.0, heat: 12, desc: 'Gyro-stabilized two-round burst with tight grouping.' },
    { name: 'Suppressive Sweep', dmg: 12, cd: 5.5, heat: 16, desc: 'Horizontal suppression fan that slows advancing targets.' },
    { name: 'Overpressure Salvo', dmg: 30, cd: 8.5, heat: 28, desc: 'Full-chamber kinetic dump delivering high stagger pressure.' },
  ],
});

export const m300HastaWeapon = buildMagitechWeapon({
  id: 'm300_hasta',
  name: 'M-300 Hasta',
  weaponClass: 'Polybolos',
  primaryDamageType: 'Impact',
  weightClass: 'medium',
  skillCount: 3,
  loadoutSlots: ['Weapon 3'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#fbbf24',
  identity: 'Mid-range sustained fire',
  lore: 'Repeating magitech polybolos auto-crossbow built to hold mid-range firing lanes under sustained thermal load.',
  shotsPerChain: 12,
  damagePerShot: 5,
  chainDurationSec: 1.8,
  reloadDurationSec: 3.2,
  range: 102,
  skills: [
    { name: 'Polybolos Repeating Feed', desc: 'Sustained 12-bolt mid-range stream dealing 5 Impact damage per bolt.' },
    { name: 'Pinning Stake Volley', dmg: 19, cd: 4.5, heat: 15, desc: 'High-tension bolt cluster that checks enemy movement.' },
    { name: 'Ratchet Cadence Surge', dmg: 22, cd: 6.0, heat: 18, desc: 'Accelerates feed mechanism for a rapid mid-range barrage.' },
    { name: 'Covering Arc', dmg: 14, cd: 5.0, heat: 15, desc: 'Blankets a forward corridor with staggered impact bolts.' },
    { name: 'Siege Drum Unload', dmg: 32, cd: 9.0, heat: 30, desc: 'Empties the auxiliary torsion drum in a single punishing burst.' },
  ],
});

export const m450PilumWeapon = buildMagitechWeapon({
  id: 'm450_pilum',
  name: 'M-450 Pilum',
  weaponClass: 'Ballista',
  primaryDamageType: 'Impact',
  weightClass: 'heavy',
  skillCount: 4,
  loadoutSlots: ['Weapon 4'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#f97316',
  identity: 'Shock-channeling, heavy hitter',
  lore: 'Heavy torsion ballista firing shock-core javelins that punch through reinforced barriers and detonate kinetic shockwaves.',
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDurationSec: 1.6,
  reloadDurationSec: 3.6,
  range: 125,
  skills: [
    { name: 'Heavy Pilum Javelin', desc: '4-shot heavy ballista chain dealing 14 Impact damage per javelin.' },
    { name: 'Shock-Core Impale', dmg: 28, cd: 5.0, heat: 20, dt: 'Wave', desc: 'Channels a shockwave pulse through the target on impact.' },
    { name: 'Armor-Cracking Bolt', dmg: 25, cd: 6.0, heat: 18, desc: 'Shatters hardened plating thresholds on direct hit.' },
    { name: 'Torsion Anchor Shot', dmg: 20, cd: 5.5, heat: 16, desc: 'High-impulse stake that staggers charging enemies.' },
    { name: 'Cataclysmic Skewer', dmg: 38, cd: 10.0, heat: 34, desc: 'Overcharged ballista spear that pierces entire enemy formations.' },
  ],
});

export const s2TurbineKhopeshWeapon = buildMagitechWeapon({
  id: 's2_turbine_khopesh',
  name: 'S-2 Turbine Khopesh',
  weaponClass: 'Blade',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  loadoutSlots: ['Aux 1', 'Aux 2'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#ef4444',
  identity: 'Compact fallback, dual-wield capable',
  lore: 'Alchemic turbine-assisted curved blade designed for dual-wielding or rapid CQC fallback when primary magazines run dry.',
  shotsPerChain: 4,
  damagePerShot: 11,
  chainDurationSec: 0.85,
  reloadDurationSec: 0.45,
  range: 25,
  skills: [
    { name: 'Turbine Hook Slash', desc: '4-hit high-RPM curved blade combo dealing 11 Pierce damage per strike.' },
    { name: 'Spooling Lunge', dmg: 24, cd: 4.0, heat: 11, desc: 'Turbine-boosted gap closer that bypasses frontal guard.' },
    { name: 'Cross-Rotor Riposte', dmg: 18, cd: 4.8, heat: 10, desc: 'Scissoring slash optimized for dual-wield and off-hand stances.' },
    { name: 'Block', dmg: 10, cd: 0, heat: 3, isBlock: true, desc: 'Hold to raise turbine blade guard (0.25s Perfect Block window).' },
    { name: 'Redline Cyclone', dmg: 29, cd: 7.5, heat: 22, desc: 'Vents turbine exhaust into a 360-degree razor cleave.' },
  ],
});

// ─── 2. HEAVY ORDNANCE / FORTRESS LINEAGE WEAPONS (5) ────────────────────────

export const b25BrushcutterWeapon = buildMagitechWeapon({
  id: 'b25_brushcutter',
  name: 'B-25 Brushcutter',
  weaponClass: 'Gatling Gun',
  primaryDamageType: 'Pierce',
  weightClass: 'heavy',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#fb923c',
  identity: 'Twin-rotor, intercept + suppression',
  lore: 'Twin-rotor rotary cannon that saturates firing arcs with high-velocity flechettes, intercepting incoming Rushers and stripping shields.',
  shotsPerChain: 16,
  damagePerShot: 4,
  chainDurationSec: 1.9,
  reloadDurationSec: 3.5,
  range: 92,
  skills: [
    { name: 'Twin-Rotor Barrage', desc: '16-round rotary burst dealing 4 Pierce damage per round.' },
    { name: 'Intercept Curtain', dmg: 20, cd: 4.5, heat: 18, desc: 'Dense flechette wall that halts lunging enemies.' },
    { name: 'Rotor Spin-Up Shred', dmg: 24, cd: 5.5, heat: 20, desc: 'Spools both barrels to peak RPM to shred armor durability.' },
    { name: 'Lead Saturation', dmg: 16, cd: 5.0, heat: 16, desc: 'Wide-cone suppression sweep generating high Presence.' },
    { name: 'Melting Point Unload', dmg: 35, cd: 9.0, heat: 34, desc: 'Sustained rotary hailstorm until thermal limit.' },
  ],
});

export const m350MaulerWeapon = buildMagitechWeapon({
  id: 'm350_mauler',
  name: 'M-350 Mauler',
  weaponClass: 'Grenade Cannon',
  primaryDamageType: 'Blast',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 2'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#f97316',
  identity: 'Three-shot burst suppression',
  lore: 'Drum-fed grenade cannon lobbing three-round proximity bursts that detonate across clustered hostiles.',
  shotsPerChain: 3,
  damagePerShot: 16,
  chainDurationSec: 1.2,
  reloadDurationSec: 2.9,
  range: 84,
  skills: [
    { name: 'Three-Shot Thumper Burst', desc: '3-grenade burst dealing 16 Blast damage per shell.' },
    { name: 'Airburst Shrapnel Shell', dmg: 24, cd: 4.5, heat: 16, desc: 'Detonates above cover to stagger grouped enemies.' },
    { name: 'Bouncing Concussion Round', dmg: 22, cd: 5.5, heat: 18, desc: 'High-impulse shell that knocks back frontline targets.' },
    { name: 'Thermobaric Canister', dmg: 20, cd: 6.0, heat: 20, desc: 'Ignites a blast pocket that saps enemy armor rating.' },
    { name: 'Carpet Saturation', dmg: 34, cd: 8.5, heat: 30, desc: 'Rapid-fires a full drum of high-explosive shells.' },
  ],
});

export const ln1200AvalancheWeapon = buildMagitechWeapon({
  id: 'ln1200_avalanche',
  name: 'LN-1200 Avalanche',
  weaponClass: 'Rocket System',
  primaryDamageType: 'Blast',
  weightClass: 'heavy',
  loadoutSlots: ['Weapon 3'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#ef4444',
  identity: 'Long-range, interference shielding',
  lore: 'Shoulder-and-arm mounted heavy rocket pod equipped with electromagnetic interference baffles that resist counter-fire during salvo lock.',
  shotsPerChain: 4,
  damagePerShot: 15,
  chainDurationSec: 1.6,
  reloadDurationSec: 3.6,
  range: 130,
  skills: [
    { name: 'Avalanche Rocket Pod', desc: '4-rocket long-range salvo dealing 15 Blast damage per warhead.' },
    { name: 'Chaff-Screen Volley', dmg: 25, cd: 5.5, heat: 20, desc: 'Launches rockets alongside interference chaff that bolsters shields.' },
    { name: 'Bunker-Buster Tandem', dmg: 30, cd: 6.5, heat: 24, desc: 'Tandem-charge warhead built to crack Hardened plating.' },
    { name: 'Shockwave Salvo', dmg: 22, cd: 5.5, heat: 18, desc: 'Staggering rocket ripple across a wide impact zone.' },
    { name: 'Full-Pod Avalanche', dmg: 40, cd: 10.0, heat: 36, desc: 'Fires every tube in a devastating long-range artillery strike.' },
  ],
});

export const lg950TomahawkWeapon = buildMagitechWeapon({
  id: 'lg950_tomahawk',
  name: 'LG-950 Tomahawk',
  weaponClass: 'Missile System',
  primaryDamageType: 'Blast',
  weightClass: 'heavy',
  loadoutSlots: ['Weapon 4'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#fb7185',
  identity: 'Long-range, soft lock',
  lore: 'Multi-cell guided missile rack utilizing soft-lock telemetry to track evasive targets across long sightlines.',
  shotsPerChain: 6,
  damagePerShot: 10,
  chainDurationSec: 1.7,
  reloadDurationSec: 3.5,
  range: 135,
  skills: [
    { name: 'Soft-Lock Micromissiles', desc: '6-missile guided swarm dealing 10 Blast damage per warhead.' },
    { name: 'Top-Attack Javelin', dmg: 27, cd: 5.0, heat: 19, desc: 'Arcing missile that strikes from above, bypassing frontal shields.' },
    { name: 'Seeker Swarm', dmg: 24, cd: 6.0, heat: 21, desc: 'Homing cluster that tracks locked targets around cover.' },
    { name: 'Scramble Warhead', dmg: 19, cd: 5.5, heat: 17, desc: 'Disrupts enemy sensor lock and slows attack windups.' },
    { name: 'Tomahawk Saturation Strike', dmg: 38, cd: 9.5, heat: 35, desc: 'Locks all cells onto the primary target for maximum burst.' },
  ],
});

export const siegebreakerWeapon = buildMagitechWeapon({
  id: 'siegebreaker',
  name: 'Siegebreaker',
  weaponClass: 'Battle Axe',
  primaryDamageType: 'Impact',
  weightClass: 'heavy',
  loadoutSlots: ['Aux 1'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#f97316',
  identity: 'Two-handed, integrated energy vent',
  lore: 'Colossal two-handed siege greataxe with exhaust vents along the spine that discharge reactor heat directly into crushing cleaves.',
  shotsPerChain: 3,
  damagePerShot: 19,
  chainDurationSec: 1.15,
  reloadDurationSec: 0.75,
  range: 32,
  supportPulseOnHit: { heatVent: 5 },
  skills: [
    { name: 'Heavy Vent Cleave', desc: '3-hit two-handed greataxe combo dealing 19 Impact damage and venting 5 Heat per hit.' },
    { name: 'Thermal Exhaust Slam', dmg: 32, cd: 5.0, heat: -15, dt: 'Blast', desc: 'Slams the ground and vents 15 Reactor Heat in a fiery shockwave.' },
    { name: 'Hull-Splitter Overhead', dmg: 28, cd: 5.5, heat: 14, desc: 'Crushing vertical chop that sunders armor threshold.' },
    { name: 'Block', dmg: 14, cd: 0, heat: 4, isBlock: true, desc: 'Hold to brace behind the broadaxe head (0.25s Perfect Block window).' },
    { name: 'Cataclysmic Guillotine', dmg: 42, cd: 9.0, heat: 26, desc: 'High-commitment execution cleave with massive stagger force.' },
  ],
});

// ─── 3. VANGUARD / DAWNFORGE LINEAGE WEAPONS (5) ─────────────────────────────

export const ls900SwordspearWeapon = buildMagitechWeapon({
  id: 'ls900_swordspear',
  name: 'LS-900 Swordspear',
  weaponClass: 'Polearm',
  primaryDamageType: 'Wave',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#facc15',
  identity: 'Mana-channeling, cleave strikes',
  lore: 'Sanctified glaive-spear that channels reactor Mana along its extended haft to project sweeping wave cleaves.',
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDurationSec: 1.0,
  reloadDurationSec: 0.55,
  range: 36,
  skills: [
    { name: 'Mana-Wave Cleave', desc: '4-hit sweeping polearm combo dealing 13 Wave (Mana) damage across a wide arc.' },
    { name: 'Crescent Resonator Sweep', dmg: 24, cd: 4.5, heat: 12, desc: 'Projects a Mana wave arc that hits multiple frontline enemies.' },
    { name: 'Impaling Vanguard Thrust', dmg: 22, cd: 5.0, heat: 14, dt: 'Pierce', desc: 'Long-reach piercing thrust that draws enemy Presence.' },
    { name: 'Block', dmg: 12, cd: 0, heat: 3, isBlock: true, desc: 'Hold to parry with the reinforced polearm shaft (0.25s Perfect Block window).' },
    { name: 'Swordspear Tempest', dmg: 34, cd: 8.5, heat: 24, desc: 'Whirling Mana-charged halberd storm that restores 8 Shield on hit.' },
  ],
});

export const rs450RadiantProjectorWeapon = buildMagitechWeapon({
  id: 'rs450_radiant_projector',
  name: 'RS-450 Radiant Projector',
  weaponClass: 'Beam Emitter',
  primaryDamageType: 'Beam',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 2'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#fde047',
  identity: 'Mid-range, shield reinforcement',
  lore: 'Harmonic beam emitter that couples offensive coherent light with a feedback loop that reinforces the pilot’s shield layer.',
  shotsPerChain: 8,
  damagePerShot: 7,
  chainDurationSec: 1.4,
  reloadDurationSec: 2.8,
  range: 90,
  supportPulseOnHit: { shieldRestore: 3 },
  skills: [
    { name: 'Radiant Coherence Beam', desc: '8-tick mid-range beam dealing 7 Beam damage and reinforcing shields (+3 Shield per hit).' },
    { name: 'Aegis Refraction Pulse', dmg: 20, cd: 4.5, heat: 14, desc: 'Searing light burst that restores 12 Shield capacity on impact.' },
    { name: 'Harmonic Lock Ray', dmg: 22, cd: 5.5, heat: 16, desc: 'Sustained focus beam that weakens enemy damage output.' },
    { name: 'Blinding Flare', dmg: 15, cd: 5.0, heat: 14, dt: 'Wave', desc: 'Wide-angle photonic flash that interrupts enemy windups.' },
    { name: 'Solbright Convergence', dmg: 32, cd: 8.5, heat: 26, desc: 'High-intensity beam discharge that overcharges barrier harmonics.' },
  ],
});

export const hl220LightburstLanceWeapon = buildMagitechWeapon({
  id: 'hl220_lightburst_lance',
  name: 'HL-220 Lightburst Lance',
  weaponClass: 'Lance',
  primaryDamageType: 'Beam',
  weightClass: 'heavy',
  loadoutSlots: ['Weapon 3'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#fef08a',
  identity: 'Reactor-linked, Judgment Strike',
  lore: 'Heavy cavalry-grade magitech lance cabled directly to the reactor core to unleash the devastating Judgment Strike.',
  shotsPerChain: 3,
  damagePerShot: 18,
  chainDurationSec: 1.1,
  reloadDurationSec: 0.7,
  range: 42,
  skills: [
    { name: 'Lightburst Thrust Chain', desc: '3-stage reactor-linked lance thrust dealing 18 Beam damage along a linear corridor.' },
    { name: 'Judgment Strike', dmg: 36, cd: 6.0, heat: 22, desc: 'Canonical reactor-linked lance charge that blasts targets with coherent light.' },
    { name: 'Radiant Pennant Sweep', dmg: 24, cd: 5.0, heat: 16, dt: 'Wave', desc: 'Cleaves a photonic arc that bolsters pilot Presence.' },
    { name: 'Block', dmg: 14, cd: 0, heat: 3, isBlock: true, desc: 'Hold to plant the lance guard (0.25s Perfect Block window).' },
    { name: 'Dawnbreaker Cataclysm', dmg: 40, cd: 9.5, heat: 30, desc: 'Fires a long-range heavy beam straight from the lance tip.' },
  ],
});

export const tigEdgeWeapon = buildMagitechWeapon({
  id: 'tig_edge',
  name: "TIG Edge / Guardian's Edge",
  weaponClass: 'Energy Blade',
  primaryDamageType: 'Pulse',
  weightClass: 'light',
  loadoutSlots: ['Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#38bdf8',
  identity: 'Compact, precision melee defense',
  lore: 'Compact hard-light sidearm blade engineered for precision defensive parries and rapid pulse counter-slashes.',
  shotsPerChain: 4,
  damagePerShot: 11,
  chainDurationSec: 0.8,
  reloadDurationSec: 0.4,
  range: 24,
  skills: [
    { name: 'Pulse-Edge Slash', desc: '4-hit precision energy blade combo dealing 11 Pulse damage per strike.' },
    { name: 'Guard Counter-Slash', dmg: 21, cd: 4.0, heat: 10, desc: 'Swift defensive riposte that destabilizes enemy shields.' },
    { name: 'Harmonic Disarm', dmg: 18, cd: 4.5, heat: 11, desc: 'Precision strike that lengthens the target’s next attack tell.' },
    { name: 'Block', dmg: 12, cd: 0, heat: 2, isBlock: true, desc: 'Hold to project an energy-blade parry field (0.25s Perfect Block window).' },
    { name: 'Aegis Flash Sever', dmg: 28, cd: 7.5, heat: 20, desc: 'High-frequency pulse cleave that restores 10 Shield on hit.' },
  ],
});

export const aegisChargeBucklerWeapon = buildMagitechWeapon({
  id: 'aegis_charge_buckler',
  name: 'Aegis Charge Buckler',
  weaponClass: 'Physical Shield',
  primaryDamageType: 'Impact',
  weightClass: 'medium',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'shield',
  handing: 'off-hand-only',
  canBlock: true,
  passiveShieldBonus: 25,
  bladeTrailColor: '#facc15',
  identity: 'Physical shield, enables Shield Charge feat',
  lore: 'Thruster-augmented physical buckler (+25 Max Shield) built to ram frontline threats and enable the Shield Charge feat.',
  shotsPerChain: 3,
  damagePerShot: 12,
  chainDurationSec: 0.85,
  reloadDurationSec: 0.45,
  range: 22,
  skills: [
    { name: 'Buckler Rim Bash', desc: '3-hit physical shield bash dealing 12 Impact damage.' },
    { name: 'Aegis Shield Charge', dmg: 26, cd: 4.5, heat: 12, desc: 'Forward thruster ram that slams and staggers targets in path.' },
    { name: 'Concussive Guard Slam', dmg: 20, cd: 5.0, heat: 11, desc: 'Shockwave bash that interrupts enemy windups.' },
    { name: 'Block', dmg: 14, cd: 0, heat: 2, isBlock: true, desc: 'Hold to raise physical buckler barrier (0.25s Perfect Block window).' },
    { name: 'Bastion Counter-Shock', dmg: 30, cd: 8.0, heat: 20, dt: 'Wave', desc: 'Discharges stored kinetic impact in a radial wave.' },
  ],
});

// ─── 4. RECON / SHADOWCRAFT LINEAGE WEAPONS (5) ──────────────────────────────

export const sv12ViperWeapon = buildMagitechWeapon({
  id: 'sv12_viper',
  name: 'SV-12 Viper',
  weaponClass: 'SMG',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#a855f7',
  identity: 'High fire rate, close-range burst',
  lore: 'Ultra-compact submachine gun spitting high-velocity caseless needles at blistering close-quarters fire rates.',
  shotsPerChain: 14,
  damagePerShot: 4,
  chainDurationSec: 1.1,
  reloadDurationSec: 2.1,
  range: 68,
  skills: [
    { name: 'Viper Needle Burst', desc: '14-round high-RPM close-range burst dealing 4 Pierce damage per shot.' },
    { name: 'Point-Blank Mag Dump', dmg: 24, cd: 4.0, heat: 12, desc: 'Concentrated close-range salvo that shreds exposed frame joints.' },
    { name: 'Evasive Strafe Volley', dmg: 18, cd: 4.5, heat: 10, desc: 'Rapid mobile burst fired on the move without accuracy loss.' },
    { name: 'Flechette Fan', dmg: 15, cd: 4.5, heat: 11, desc: 'Close-quarters cone burst that tags flanking enemies.' },
    { name: 'Venom Overdrive', dmg: 30, cd: 7.5, heat: 22, desc: 'Hyper-velocity magazine unload with bonus critical damage.' },
  ],
});

export const sv18SerpentWeapon = buildMagitechWeapon({
  id: 'sv18_serpent',
  name: 'SV-18 Serpent',
  weaponClass: 'Carbine',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  loadoutSlots: ['Weapon 2'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#c084fc',
  identity: 'Suppressed, mid-range stealth operations',
  lore: 'Integrally suppressed recon carbine with baffled muzzle dampeners that preserve low Presence during mid-range ambushes.',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.3,
  reloadDurationSec: 2.4,
  range: 95,
  skills: [
    { name: 'Suppressed 3x3 Burst', desc: '9-round baffled carbine chain dealing 6 Pierce damage with minimal acoustic signature.' },
    { name: 'Subsonic Vital Shot', dmg: 23, cd: 4.2, heat: 11, desc: 'Silent precision round that strikes weak points without raising Presence.' },
    { name: 'Ghost Flank Salvo', dmg: 20, cd: 5.0, heat: 13, desc: 'Double-tap ambush burst dealing bonus damage to distracted targets.' },
    { name: 'Sensor-Chaff Dart', dmg: 14, cd: 5.0, heat: 12, desc: 'Dampens enemy optic tracking and slows turn rate.' },
    { name: 'Silent Execution', dmg: 33, cd: 8.0, heat: 24, desc: 'High-penetration suppressed finisher calibrated for critical kills.' },
  ],
});

export const sr440ShadowfangWeapon = buildMagitechWeapon({
  id: 'sr440_shadowfang',
  name: 'SR-440 Shadowfang',
  weaponClass: 'Marksman Rifle',
  primaryDamageType: 'Pierce',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 3'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#e879f9',
  identity: 'Critical amplification, long-range precision',
  lore: 'Long-barrel coil marksman rifle with critical-point optics that amplify damage against locked or staggered targets.',
  shotsPerChain: 5,
  damagePerShot: 12,
  chainDurationSec: 1.5,
  reloadDurationSec: 2.9,
  range: 140,
  skills: [
    { name: 'Shadowfang Precision Sabot', desc: '5-shot marksman chain dealing 12 Pierce damage at extreme range.' },
    { name: 'Critical Seam Piercer', dmg: 30, cd: 5.0, heat: 16, desc: 'Pinpoint sabot round that bypasses armor threshold on locked targets.' },
    { name: 'Ricochet Killshot', dmg: 24, cd: 5.5, heat: 15, desc: 'High-velocity dart that skips between adjacent enemies.' },
    { name: 'Optic Mark Lock', dmg: 16, cd: 5.0, heat: 12, desc: 'Paints the target’s weak points, boosting follow-up precision damage.' },
    { name: 'Deadeye Rail Slug', dmg: 40, cd: 9.0, heat: 28, desc: 'Overcharged hyper-velocity marksman shot with maximum critical multiplier.' },
  ],
});

export const s4WhisperBladeWeapon = buildMagitechWeapon({
  id: 's4_whisper_blade',
  name: 'S-4 Whisper Blade',
  weaponClass: 'Dagger',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  loadoutSlots: ['Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#d8b4fe',
  identity: 'Monomolecular edge, dual-wield capable',
  lore: 'Zero-backlash monomolecular combat dagger engineered for dual-wielding and silent backstab executions.',
  shotsPerChain: 5,
  damagePerShot: 10,
  chainDurationSec: 0.75,
  reloadDurationSec: 0.35,
  range: 22,
  skills: [
    { name: 'Monomolecular Flurry', desc: '5-hit ultra-fast dagger chain dealing 10 Pierce damage per slash.' },
    { name: 'Ambush Backstab', dmg: 26, cd: 3.8, heat: 9, desc: 'High-critical precision thrust into exposed rear or flanked plating.' },
    { name: 'Arterial Tendon Cut', dmg: 18, cd: 4.2, heat: 8, desc: 'Cripples enemy actuator servos, reducing movement speed.' },
    { name: 'Block', dmg: 9, cd: 0, heat: 2, isBlock: true, desc: 'Hold to parry with reverse-grip dagger (0.25s Perfect Block window).' },
    { name: 'Phantom Throat-Slit', dmg: 31, cd: 7.0, heat: 18, desc: 'Instant gap-closing execution strike.' },
  ],
});

export const s6PhantomEdgeWeapon = buildMagitechWeapon({
  id: 's6_phantom_edge',
  name: 'S-6 Phantom Edge',
  weaponClass: 'Knife',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  loadoutSlots: ['Aux 2'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#f0abfc',
  identity: 'Thermal-coated, heat-dampened strikes',
  lore: 'Thermal-absorbent stealth knife whose heat-dampened edge vents reactor heat on every close-quarters strike.',
  shotsPerChain: 5,
  damagePerShot: 10,
  chainDurationSec: 0.75,
  reloadDurationSec: 0.35,
  range: 22,
  supportPulseOnHit: { heatVent: 4 },
  skills: [
    { name: 'Heat-Sink Knife Combo', desc: '5-hit stealth knife combo dealing 10 Pierce damage and venting 4 Heat per hit.' },
    { name: 'Zero-Signature Thrust', dmg: 23, cd: 4.0, heat: -8, desc: 'Dampened puncture strike that vents 8 Reactor Heat on impact.' },
    { name: 'Phase-Step Slice', dmg: 20, cd: 4.5, heat: 8, desc: 'Quick sidestep slash that evades incoming counter-attacks.' },
    { name: 'Block', dmg: 9, cd: 0, heat: 2, isBlock: true, desc: 'Hold to deflect with thermal-coated blade (0.25s Perfect Block window).' },
    { name: 'Eclipse Sever', dmg: 29, cd: 7.2, heat: 14, desc: 'Paired off-hand cross-slash that strips enemy shield harmonics.' },
  ],
});

// ─── 5. ARTILLERY / ARCANUM LINEAGE WEAPONS (5) ──────────────────────────────

export const wz800ArclightCannonWeapon = buildMagitechWeapon({
  id: 'wz800_arclight_cannon',
  name: 'WZ-800 Arclight Cannon',
  weaponClass: 'Beam Projector',
  primaryDamageType: 'Beam',
  weightClass: 'heavy',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#38bdf8',
  identity: 'Long-range, sustained fire',
  lore: 'Heavy crystal-lattice beam cannon that projects continuous long-range arclight lances across the battlefield.',
  shotsPerChain: 10,
  damagePerShot: 6,
  chainDurationSec: 1.7,
  reloadDurationSec: 3.3,
  range: 135,
  skills: [
    { name: 'Sustained Arclight Beam', desc: '10-tick long-range coherent beam dealing 6 Beam damage per tick.' },
    { name: 'Ionizing Lance', dmg: 28, cd: 5.0, heat: 20, desc: 'High-output beam spike that overloads enemy energy shields.' },
    { name: 'Refraction Sweep', dmg: 24, cd: 5.5, heat: 22, desc: 'Sweeps a continuous laser arc across multiple targets.' },
    { name: 'Capacitor Vent Pulse', dmg: 18, cd: 5.0, heat: -10, dt: 'Pulse', desc: 'Discharges waste heat as a protective electromagnetic pulse.' },
    { name: 'Omega Convergence', dmg: 40, cd: 9.5, heat: 36, desc: 'Full-reactor arclight beam that bores through all targets in line.' },
  ],
});

export const wz650PrismLanceWeapon = buildMagitechWeapon({
  id: 'wz650_prism_lance',
  name: 'WZ-650 Prism Lance',
  weaponClass: 'Beam Rifle',
  primaryDamageType: 'Beam',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 2'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#7dd3fc',
  identity: 'Focusing crystal, variable intensity',
  lore: 'Precision crystal-focus beam rifle with variable aperture lenses that shift between rapid pinpoint rays and refracted prism bursts.',
  shotsPerChain: 7,
  damagePerShot: 8,
  chainDurationSec: 1.4,
  reloadDurationSec: 2.8,
  range: 118,
  skills: [
    { name: 'Variable Prism Ray', desc: '7-shot focused crystal beam chain dealing 8 Beam damage per pulse.' },
    { name: 'High-Aperture Focus', dmg: 26, cd: 4.5, heat: 16, desc: 'Tightens the crystal lens for a high-penetration pinpoint beam.' },
    { name: 'Prismatic Split', dmg: 22, cd: 5.0, heat: 18, desc: 'Refracts the beam into a multi-angle prism fan.' },
    { name: 'Harmonic Lens Lock', dmg: 18, cd: 5.0, heat: 14, desc: 'Attunes crystal frequency to amplify subsequent Beam damage.' },
    { name: 'Spectrum Cascade', dmg: 35, cd: 8.5, heat: 28, desc: 'Fires a full-spectrum polychromatic beam burst.' },
  ],
});

export const wz450SparkstrikeWeapon = buildMagitechWeapon({
  id: 'wz450_sparkstrike',
  name: 'WZ-450 Sparkstrike',
  weaponClass: 'Energy Carbine',
  primaryDamageType: 'Pulse',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 3'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#22d3ee',
  identity: 'Rapid burst, close-range defense',
  lore: 'High-capacitance pulse carbine engineered for rapid arc-bursts and close-range defensive counter-fire.',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.25,
  reloadDurationSec: 2.5,
  range: 82,
  skills: [
    { name: 'Sparkstrike Pulse Burst', desc: '9-shot rapid energy carbine burst dealing 6 Pulse damage per bolt.' },
    { name: 'Arc-Jolt Volley', dmg: 22, cd: 4.0, heat: 14, desc: 'Electromagnetic pulse burst that disrupts enemy shield regeneration.' },
    { name: 'Static Repulsor Blast', dmg: 20, cd: 5.0, heat: 15, dt: 'Wave', desc: 'Close-range shock discharge that pushes back melee rushers.' },
    { name: 'Chain-Spark Tag', dmg: 17, cd: 4.8, heat: 14, desc: 'Arcs secondary lightning between nearby enemies.' },
    { name: 'Capacitor Storm', dmg: 32, cd: 8.0, heat: 26, desc: 'Unleashes a rapid-fire storm of overcharged pulse bolts.' },
  ],
});

export const wz200ManacoreStaffWeapon = buildMagitechWeapon({
  id: 'wz200_manacore_staff',
  name: 'WZ-200 Manacore Staff',
  weaponClass: 'Polearm',
  primaryDamageType: 'Wave',
  weightClass: 'heavy',
  loadoutSlots: ['Weapon 4'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#60a5fa',
  identity: 'AoE discharge, area denial',
  lore: 'Heavy conduit polearm crowned with a resonant Manacore sphere that detonates radial wave discharges for area denial.',
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDurationSec: 1.2,
  reloadDurationSec: 0.7,
  range: 38,
  skills: [
    { name: 'Manacore Wave Pulse', desc: '4-stage conduit staff combo projecting 14 Wave (Mana) damage pulses.' },
    { name: 'Resonance Detonation', dmg: 28, cd: 5.0, heat: 18, desc: 'Radial AoE Mana discharge that clears surrounding space.' },
    { name: 'Area-Denial Flux Field', dmg: 24, cd: 6.0, heat: 20, desc: 'Plants a lingering Mana shock-ring that damages and slows intruders.' },
    { name: 'Block', dmg: 12, cd: 0, heat: 3, isBlock: true, desc: 'Hold to project a Manacore repulsion ward (0.25s Perfect Block window).' },
    { name: 'Singularity Collapse', dmg: 38, cd: 9.5, heat: 32, desc: 'Implodes the staff’s Manacore field in a massive Wave blast.' },
  ],
});

export const arcConductorWeapon = buildMagitechWeapon({
  id: 'arc_conductor',
  name: 'ARC Conductor',
  weaponClass: 'Energy Pistol',
  primaryDamageType: 'Pulse',
  weightClass: 'light',
  loadoutSlots: ['Aux 1'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#38bdf8',
  identity: 'Emergency sidearm',
  lore: 'Compact holstered pulse pistol with instant draw speed and self-charging capacitor cells for emergency CQC defense.',
  shotsPerChain: 6,
  damagePerShot: 8,
  chainDurationSec: 0.95,
  reloadDurationSec: 1.6,
  range: 70,
  skills: [
    { name: 'Quick-Draw Pulse Snap', desc: '6-shot fast energy sidearm chain dealing 8 Pulse damage per shot.' },
    { name: 'Overload Stun-Bolt', dmg: 19, cd: 3.8, heat: 10, desc: 'High-voltage sidearm shot that briefly staggers an approaching threat.' },
    { name: 'Capacitor Skim Shot', dmg: 17, cd: 4.2, heat: -6, desc: 'Siphons residual charge to vent 6 Reactor Heat on hit.' },
    { name: 'Point-Defense Double', dmg: 16, cd: 4.0, heat: 9, desc: 'Instant two-shot defensive snap fire.' },
    { name: 'Arc-Flash Discharge', dmg: 27, cd: 7.0, heat: 18, desc: 'Dumps the entire pistol cell in a blinding pulse cone.' },
  ],
});

// ─── 6. SUPPORT / SANCTUM LINEAGE WEAPONS (5) ────────────────────────────────

export const cl700SanctifierWeapon = buildMagitechWeapon({
  id: 'cl700_sanctifier',
  name: 'CL-700 Sanctifier',
  weaponClass: 'Hybrid Rifle',
  primaryDamageType: 'Beam',
  adaptiveDamageTypes: ['Beam', 'Pierce'],
  weightClass: 'medium',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#4ade80',
  identity: 'Adaptive damage type per target',
  lore: 'Dual-chamber sanctum hybrid rifle that automatically adapts between coherent Beam (vs. Shields/Armor) and kinetic Pierce per target.',
  shotsPerChain: 8,
  damagePerShot: 7,
  chainDurationSec: 1.4,
  reloadDurationSec: 2.7,
  range: 100,
  skills: [
    { name: 'Adaptive Sanctifier Salvo', desc: '8-shot hybrid burst adapting between Beam and Pierce damage based on target defense.' },
    { name: 'Dual-Phase Piercer', dmg: 23, cd: 4.5, heat: 14, dt: 'Pierce', desc: 'Fires a kinetic-core bolt wrapped in a shield-stripping beam sheath.' },
    { name: 'Harmonic Target Mark', dmg: 19, cd: 5.0, heat: 13, desc: 'Attunes target resonance so all damage types strike at peak efficiency.' },
    { name: 'Sanctum Warden Burst', dmg: 18, cd: 5.0, heat: 12, desc: 'Defensive burst that restores 6 Shield capacity on hit.' },
    { name: 'Equilibrium Convergence', dmg: 33, cd: 8.5, heat: 25, desc: 'Simultaneous Beam + Pierce discharge that pierces all defense layers.' },
  ],
});

export const cl500AbsolutionWeapon = buildMagitechWeapon({
  id: 'cl500_absolution',
  name: 'CL-500 Absolution',
  weaponClass: 'Beam Projector',
  primaryDamageType: 'Beam',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 2'],
  equipmentRole: 'ranged',
  handing: '2-hand',
  bladeTrailColor: '#86efac',
  identity: 'Area purification, ally buff on sustained fire',
  lore: 'Sanctum beam projector whose sustained purification ray cleanses hazard build-up and reinforces allied/pilot shield buffers.',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.5,
  reloadDurationSec: 2.8,
  range: 96,
  supportPulseOnHit: { shieldRestore: 4, heatVent: 2 },
  skills: [
    { name: 'Purification Beam Stream', desc: '9-tick sustained beam dealing 6 Beam damage and restoring +4 Shield / -2 Heat per hit.' },
    { name: 'Absolution Cleansing Wave', dmg: 21, cd: 4.8, heat: 14, dt: 'Wave', desc: 'Area purification pulse that restores 14 Shield and vents 8 Heat.' },
    { name: 'Refractive Grace Ray', dmg: 22, cd: 5.2, heat: 15, desc: 'Sustained beam that buffs armor rating while channeling.' },
    { name: 'Sanctified Curtain', dmg: 16, cd: 5.0, heat: 13, desc: 'Sweeps a protective light barrier across the firing lane.' },
    { name: 'Solar Benediction', dmg: 32, cd: 8.5, heat: 24, desc: 'High-output purification beam that fully stabilizes shield harmonics.' },
  ],
});

export const cl350LitanyWeapon = buildMagitechWeapon({
  id: 'cl350_litany',
  name: 'CL-350 Litany',
  weaponClass: 'Support Carbine',
  primaryDamageType: 'Pulse',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 3'],
  equipmentRole: 'ranged',
  handing: '1-hand',
  bladeTrailColor: '#34d399',
  identity: 'Ally buff application on hit',
  lore: 'Harmonic support carbine whose telemetry-linked pulse rounds trigger restorative shield and plating micro-buffs on every hit.',
  shotsPerChain: 9,
  damagePerShot: 6,
  chainDurationSec: 1.3,
  reloadDurationSec: 2.5,
  range: 88,
  supportPulseOnHit: { shieldRestore: 3, armorRestore: 2 },
  skills: [
    { name: 'Litany Harmonic Burst', desc: '9-shot support carbine burst dealing 6 Pulse damage and restoring +3 Shield / +2 Armor on hit.' },
    { name: 'Resonant Beacon Shot', dmg: 20, cd: 4.2, heat: 12, desc: 'Tags target with a harmonic beacon that restores 10 Shield on follow-up hits.' },
    { name: 'Plating Knit Volley', dmg: 19, cd: 5.0, heat: 14, desc: 'Nanite-carrier pulse burst that repairs +10 Armor durability.' },
    { name: ' Pacifying Cadence', dmg: 16, cd: 4.8, heat: 12, desc: 'Dampens target aggression and reduces incoming hit damage.' },
    { name: 'Chorus of Renewal', dmg: 30, cd: 8.0, heat: 22, desc: 'Full-cadence pulse salvo that restores 20 Shield and 12 Armor.' },
  ],
});

export const hallowedScepterWeapon = buildMagitechWeapon({
  id: 'hallowed_scepter',
  name: 'Hallowed Scepter',
  weaponClass: 'Hybrid Staff',
  primaryDamageType: 'Wave',
  adaptiveDamageTypes: ['Wave', 'Impact'],
  weightClass: 'medium',
  loadoutSlots: ['Weapon 4'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#a7f3d0',
  identity: 'Melee + ranged healing pulses',
  lore: 'Reliquary hybrid mace-staff that combines heavy Impact strikes with ranged Mana-wave restoration pulses.',
  shotsPerChain: 4,
  damagePerShot: 13,
  chainDurationSec: 1.05,
  reloadDurationSec: 0.55,
  range: 34,
  supportPulseOnHit: { shieldRestore: 4, armorRestore: 3 },
  skills: [
    { name: 'Scepter Wave-Strike', desc: '4-hit hybrid melee/wave combo dealing 13 Wave/Impact damage and pulsing +4 Shield / +3 Armor.' },
    { name: 'Consecrated Shock-Mace', dmg: 24, cd: 4.5, heat: 13, dt: 'Impact', desc: 'Crushing scepter blow that releases a shield-mending wave.' },
    { name: 'Ranged Sanctuary Orb', dmg: 21, cd: 5.0, heat: 14, dt: 'Wave', desc: 'Projects a ranged Mana orb (85 range) that damages foes and repairs 12 Shield.' },
    { name: 'Block', dmg: 12, cd: 0, heat: 3, isBlock: true, desc: 'Hold to raise the Hallowed Scepter ward (0.25s Perfect Block window).' },
    { name: 'Reliquary Benediction', dmg: 32, cd: 8.5, heat: 22, desc: 'Slams the scepter to unleash a radial Wave blast (+22 Shield & +15 Armor).' },
  ],
});

export const graceEdgeWeapon = buildMagitechWeapon({
  id: 'grace_edge',
  name: 'Grace Edge',
  weaponClass: 'Consecrated Blade',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  loadoutSlots: ['Aux 1'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#6ee7b7',
  identity: 'Healing pulse on critical hit',
  lore: 'Slender consecrated sidearm blade wired with a heartwell capacitor that emits a restorative shield/plating pulse on critical strikes.',
  shotsPerChain: 4,
  damagePerShot: 11,
  chainDurationSec: 0.8,
  reloadDurationSec: 0.4,
  range: 24,
  supportPulseOnHit: { shieldRestore: 5, armorRestore: 2 },
  skills: [
    { name: 'Consecrated Rapier Slash', desc: '4-hit precision blade combo dealing 11 Pierce damage and pulsing +5 Shield on hit.' },
    { name: 'Mercy Critical Lunge', dmg: 23, cd: 4.0, heat: 10, desc: 'High-precision thrust that triggers a double healing pulse (+14 Shield).' },
    { name: 'Heartwell Riposte', dmg: 18, cd: 4.5, heat: 9, desc: 'Graceful counter-slash that vents 6 Heat and mends 8 Armor.' },
    { name: 'Block', dmg: 11, cd: 0, heat: 2, isBlock: true, desc: 'Hold to parry with the consecrated blade (0.25s Perfect Block window).' },
    { name: 'Halo Sever', dmg: 28, cd: 7.5, heat: 18, dt: 'Wave', desc: 'Sweeping luminous arc that damages hostiles and restores 16 Shield.' },
  ],
});

export const MAGITECH_WEAPON_CATALOG: WeaponDefinition[] = [
  n55GladiusWeapon,
  m300HastaWeapon,
  m450PilumWeapon,
  s2TurbineKhopeshWeapon,
  b25BrushcutterWeapon,
  m350MaulerWeapon,
  ln1200AvalancheWeapon,
  lg950TomahawkWeapon,
  siegebreakerWeapon,
  ls900SwordspearWeapon,
  rs450RadiantProjectorWeapon,
  hl220LightburstLanceWeapon,
  tigEdgeWeapon,
  aegisChargeBucklerWeapon,
  sv12ViperWeapon,
  sv18SerpentWeapon,
  sr440ShadowfangWeapon,
  s4WhisperBladeWeapon,
  s6PhantomEdgeWeapon,
  wz800ArclightCannonWeapon,
  wz650PrismLanceWeapon,
  wz450SparkstrikeWeapon,
  wz200ManacoreStaffWeapon,
  arcConductorWeapon,
  cl700SanctifierWeapon,
  cl500AbsolutionWeapon,
  cl350LitanyWeapon,
  hallowedScepterWeapon,
  graceEdgeWeapon,
];
