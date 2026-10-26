/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FrameLoadCapacity, OrionState } from '../../types';
import { TRAIT_REGISTRY } from '../characters';

export interface CanonicalHardwareItemDefinition {
  id: string;
  name: string;
  slot:
    | 'head'
    | 'arms'
    | 'plating'
    | 'legs'
    | 'reactor'
    | 'sensoryA'
    | 'sensoryB'
    | 'aux3'
    | 'aux4';
  canonicalSlotLabel: string;
  subtype: string;
  armorType?: 'Ablative' | 'Reactive' | 'Hardened' | 'Layered';
  baseLoadCapacity?: FrameLoadCapacity;
  armorThreshold?: number;
  armorRating?: number;
  armorDurability?: number;
  shieldBonus?: number;
  reactorFamily?: 'Ichor' | 'Mana' | 'Ether';
  linkedActionId: string;
  description: string;
  /** Whether the hardware currently uses a generic or placeholder icon/visual asset */
  isPlaceholderAsset?: boolean;
  /** Detailed note on planned future dedicated sprite or 3D asset */
  futureAssetPlanned?: string;
}

export const CANONICAL_HARDWARE_CATALOG: CanonicalHardwareItemDefinition[] = [
  // ─── 1. ARMOR / CORE FRAMES (§2 — 6 Canonical Coreplates + 4 Heritage Cuirasses) ─
  {
    id: 'coreplate_bwi_bastion',
    name: 'BWI Bastion Coreplate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Physical / Reactive',
    armorType: 'Reactive',
    baseLoadCapacity: 'medium',
    armorThreshold: 7,
    armorRating: 11,
    armorDurability: 140,
    shieldBonus: 45,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Heavy frontal, turbine shielding (Physical / Reactive).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated BWI Bastion heavy frontal turbine coreplate sprite planned',
  },
  {
    id: 'coreplate_fire_ice_fortress',
    name: 'Fire & Ice Fortress Coreplate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Physical / Hardened',
    armorType: 'Hardened',
    baseLoadCapacity: 'superheavy',
    armorThreshold: 10,
    armorRating: 15,
    armorDurability: 180,
    shieldBonus: 35,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Super-heavy frontal, outrigging stabilizers (Physical / Hardened).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Fire & Ice Fortress super-heavy outrigger armor sprite planned',
  },
  {
    id: 'coreplate_dawnforge_guardian',
    name: 'Dawnforge Guardian Coreplate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Physical / Layered',
    armorType: 'Layered',
    baseLoadCapacity: 'heavy',
    armorThreshold: 8,
    armorRating: 13,
    armorDurability: 155,
    shieldBonus: 75,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Heavy, stabilizer anchors, shield emitters (Physical / Layered).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Dawnforge Guardian emitter coreplate sprite planned',
  },
  {
    id: 'coreplate_shadowcraft_recon',
    name: 'Shadowcraft Recon Coreplate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Physical / Ablative',
    armorType: 'Ablative',
    baseLoadCapacity: 'light',
    armorThreshold: 4,
    armorRating: 7,
    armorDurability: 105,
    shieldBonus: 40,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Lightweight, emission dampeners (Physical / Ablative).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Shadowcraft Recon sleek ablative chassis sprite planned',
  },
  {
    id: 'coreplate_arcanum_projector',
    name: 'Arcanum Heavy Projector Coreplate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Physical / Layered',
    armorType: 'Layered',
    baseLoadCapacity: 'light',
    armorThreshold: 5,
    armorRating: 8,
    armorDurability: 110,
    shieldBonus: 65,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Reinforced, crystal lattice, beam stabilizers (Physical / Layered).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Arcanum Projector crystalline lattice coreplate sprite planned',
  },
  {
    id: 'coreplate_sanctum_support',
    name: 'Sanctum Support Coreplate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Physical / Reactive',
    armorType: 'Reactive',
    baseLoadCapacity: 'medium',
    armorThreshold: 6,
    armorRating: 10,
    armorDurability: 130,
    shieldBonus: 60,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Balanced, distributed buffer systems (Physical / Reactive).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Sanctum Support distributed buffer cuirass sprite planned',
  },
  {
    id: 'hw_plating_ablative',
    name: 'Ablative Cuirass Plating',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Ablative Armor',
    armorType: 'Ablative',
    baseLoadCapacity: 'light',
    armorThreshold: 5,
    armorRating: 8,
    armorDurability: 115,
    shieldBonus: 40,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'High-durability sacrificial ceramic plates with balanced threshold and rating.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated ceramic ablative plating sprite planned',
  },
  {
    id: 'hw_plating_reactive',
    name: 'Reactive Blast-Plate Cuirass',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Reactive Armor',
    armorType: 'Reactive',
    baseLoadCapacity: 'medium',
    armorThreshold: 7,
    armorRating: 11,
    armorDurability: 140,
    shieldBonus: 45,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Explosive counter-charge torso armor that repels close-quarters attackers on burst.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated reactive blast-plate cuirass sprite planned',
  },
  {
    id: 'hw_plating_hardened',
    name: 'Hardened Sanctum Carapace',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Hardened Armor',
    armorType: 'Hardened',
    baseLoadCapacity: 'heavy',
    armorThreshold: 9,
    armorRating: 14,
    armorDurability: 165,
    shieldBonus: 40,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Dense cathedral-forged alloy cuirass with high damage threshold against light fire.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated cathedral hardened carapace sprite planned',
  },
  {
    id: 'hw_plating_layered',
    name: 'Layered Weave Laminate',
    slot: 'plating',
    canonicalSlotLabel: 'Core Frame',
    subtype: 'Layered Armor',
    armorType: 'Layered',
    baseLoadCapacity: 'medium',
    armorThreshold: 6,
    armorRating: 10,
    armorDurability: 130,
    shieldBonus: 55,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Flexible composite weave plating favored by agile frames for rapid heat dissipation.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated composite layered laminate sprite planned',
  },

  // ─── 2. CORE SYSTEMS (§3 Generators / Reactors + §6 Energy Storage) ─────────
  {
    id: 'reactor_pnsy_turbine_mk4',
    name: 'PNSY Alchemic Turbine Core Mk.IV',
    slot: 'reactor',
    canonicalSlotLabel: 'Core System',
    subtype: 'Ichor · Overclock Core',
    reactorFamily: 'Ichor',
    linkedActionId: 'reactor_thermal_vent',
    description: 'Magitech engine, volatile heat output, supports overclock.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated PNSY Alchemic Turbine reactor sprite and animation planned',
  },
  {
    id: 'reactor_rad_battleheart_mk5',
    name: 'RAD Battleheart Ether Reactor Mk.V',
    slot: 'reactor',
    canonicalSlotLabel: 'Core System',
    subtype: 'Ichor / Ether · Recycling Loop',
    reactorFamily: 'Ichor',
    linkedActionId: 'reactor_thermal_vent',
    description: 'Ether reactor with recycling feedback loops.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated RAD Battleheart Ether reactor sprite planned',
  },
  {
    id: 'reactor_ti_manaheart_mk4',
    name: 'TI Manaheart Reactor Mk.IV',
    slot: 'reactor',
    canonicalSlotLabel: 'Core System',
    subtype: 'Mana · Shield & Cleave Core',
    reactorFamily: 'Mana',
    linkedActionId: 'reactor_aegis_pulse',
    description: 'Powers shields, aura projection, cleave systems.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated TI Manaheart reactor sprite planned',
  },
  {
    id: 'reactor_vx_phantom_mk3',
    name: 'VX Phantom Core Mk.III',
    slot: 'reactor',
    canonicalSlotLabel: 'Core System',
    subtype: 'Ether · Low-Emission Core',
    reactorFamily: 'Ether',
    linkedActionId: 'reactor_overdrive',
    description: 'Low-emission reactor, stealth and burst.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated VX Phantom Core stealth reactor sprite planned',
  },
  {
    id: 'reactor_arc_infinite_well_mk6',
    name: 'ARC Infinite Well Reactor Mk.VI',
    slot: 'reactor',
    canonicalSlotLabel: 'Core System',
    subtype: 'Ether · Energy Pool & Overflow',
    reactorFamily: 'Ether',
    linkedActionId: 'reactor_overdrive',
    description: 'Massive energy pool, sustained discharge, overflow venting.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated ARC Infinite Well crystal reactor sprite planned',
  },
  {
    id: 'reactor_sanc_heartwell_mk4',
    name: 'SANC Heartwell Reactor Mk.IV',
    slot: 'reactor',
    canonicalSlotLabel: 'Core System',
    subtype: 'Mana · Support Reactor',
    reactorFamily: 'Mana',
    linkedActionId: 'reactor_aegis_pulse',
    description: 'Balanced, overflow distribution to ally systems.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated SANC Heartwell support reactor sprite planned',
  },
  {
    id: 'storage_cd_erd_lodestone',
    name: 'Crystal Dynamics ERD Lodestone',
    slot: 'reactor',
    canonicalSlotLabel: 'Energy Storage',
    subtype: 'Ichor · Energy Storage Reservoir',
    reactorFamily: 'Ichor',
    linkedActionId: 'reactor_overdrive',
    description: 'Field-controlled energy reservoir for rapid discharge (§6 Energy Storage).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated ERD Lodestone energy storage sprite planned',
  },
  {
    id: 'storage_vx_shadow_capacitor',
    name: 'VX Shadow Capacitor',
    slot: 'reactor',
    canonicalSlotLabel: 'Energy Storage',
    subtype: 'Ether · Rapid-Discharge Capacitor',
    reactorFamily: 'Ether',
    linkedActionId: 'reactor_overdrive',
    description: 'Rapid-discharge energy reservoir for mobility and critical strikes (§6 Energy Storage).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated VX Shadow Capacitor sprite planned',
  },

  // ─── 3. HEAD COMMAND HELMS & OPTICS (§5 Optics & §6 Head Components) ────────
  {
    id: 'head_cd_g341_murmillio',
    name: 'Crystal Dynamics G341 Murmillio',
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Head Helm · Alchemic Optic Core',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Reinforced helm, alchemic optic core, heat-dispersing vents.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated G341 Murmillio helm sprite planned',
  },
  {
    id: 'head_be_ironveil_dome',
    name: 'BE Ironveil Command Dome',
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Command Dome · Interference Dampener',
    shieldBonus: 8,
    linkedActionId: 'mod_head_optic_scan',
    description: 'Layered shielding, interference dampeners.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated BE Ironveil Command Dome sprite planned',
  },
  {
    id: 'head_aegis_halo_dome',
    name: 'Aegis Halo Command Dome',
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Command Dome · Shield Uplink',
    shieldBonus: 12,
    linkedActionId: 'mod_head_optic_scan',
    description: 'Mana-channeling conduits, tactical shield uplink.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Aegis Halo Command Dome sprite planned',
  },
  {
    id: 'head_vx_veilsight_helm',
    name: 'VX Veilsight Command Helm',
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Command Helm · Low-Light & Thermal',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Low-light optics, thermal dampening.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated VX Veilsight Command Helm sprite planned',
  },
  {
    id: 'head_arc_omniscient_dome',
    name: 'ARC Omniscient Command Dome',
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Command Dome · Artillery & Signature Optics',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Crystal lattice, long-range energy signature tracking.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated ARC Omniscient Command Dome sprite planned',
  },
  {
    id: 'head_sanc_providence_helm',
    name: 'SANC Providence Command Helm',
    slot: 'head',
    canonicalSlotLabel: 'Head / Optics',
    subtype: 'Command Helm · Triage & Threat HUD',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Ally status HUD, priority threat assessment.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated SANC Providence Command Helm sprite planned',
  },
  {
    id: 'optics_embersight',
    name: 'Crystal Dynamics EmberSight Suite',
    slot: 'head',
    canonicalSlotLabel: 'Optics',
    subtype: 'Optics · Fast Acquisition',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Mid-short range targeting, fast acquisition.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated EmberSight optics suite sprite planned',
  },
  {
    id: 'optics_be_foresight',
    name: 'BE Foresight Targeting Array',
    slot: 'head',
    canonicalSlotLabel: 'Optics',
    subtype: 'Optics · Artillery & Missile Tracking',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Long-range, missile tracking (Artillery optics).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated BE Foresight targeting array sprite planned',
  },
  {
    id: 'optics_aegis_radiant',
    name: 'Aegis Radiant Targeting Array',
    slot: 'head',
    canonicalSlotLabel: 'Optics',
    subtype: 'Optics · Shield & Cleave Precision',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Shield projection and cleave precision.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Aegis Radiant targeting array sprite planned',
  },
  {
    id: 'optics_veilsight',
    name: 'Veilsight Targeting Suite',
    slot: 'head',
    canonicalSlotLabel: 'Optics',
    subtype: 'Optics · Critical Point Identification',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Low-light optics, thermal masking, critical point identification.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Veilsight targeting suite sprite planned',
  },
  {
    id: 'optics_arc_omniscient',
    name: 'ARC Omniscient Array',
    slot: 'head',
    canonicalSlotLabel: 'Optics',
    subtype: 'Optics · Artillery & Beam Focusing',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Long-range, energy signature tracking, beam focusing (Artillery optics).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated ARC Omniscient Array sprite planned',
  },
  {
    id: 'optics_sanc_providence',
    name: 'SANC Providence Scanner',
    slot: 'head',
    canonicalSlotLabel: 'Optics',
    subtype: 'Optics · Priority Threat Identification',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Ally status monitoring, priority threat identification.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated SANC Providence Scanner sprite planned',
  },

  // ─── 4. SENSORY A & SENSORY B (§5 Sensors) ──────────────────────────────────
  {
    id: 'sensory_a_federated_t7',
    name: 'Federated T7 Sensor Array',
    slot: 'sensoryA',
    canonicalSlotLabel: 'Sensory A',
    subtype: 'Sensory A · Heat & Motion',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Heat and motion battlefield monitor.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Federated T7 Sensor Array sprite planned',
  },
  {
    id: 'sensory_a_nds_arcpulse',
    name: 'NDS ArcPulse Sensor Grid',
    slot: 'sensoryA',
    canonicalSlotLabel: 'Sensory A',
    subtype: 'Sensory A · Blast Disruption',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Blast disruption scanner.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated NDS ArcPulse Sensor Grid sprite planned',
  },
  {
    id: 'sensory_a_solbright_flux',
    name: 'Solbright Flux Sensor Grid',
    slot: 'sensoryA',
    canonicalSlotLabel: 'Sensory A',
    subtype: 'Sensory A · Shield Harmonics',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Shield harmonics and battlefield awareness.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Solbright Flux Sensor Grid sprite planned',
  },
  {
    id: 'sensory_a_vx_phantom_net',
    name: 'VX Phantom Network Sensor',
    slot: 'sensoryA',
    canonicalSlotLabel: 'Sensory A',
    subtype: 'Sensory A · Counter-Stealth',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Motion tracker, stealth detection countermeasures.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated VX Phantom Network Sensor sprite planned',
  },
  {
    id: 'sensory_a_arc_manaflow',
    name: 'ARC Manaflow Analyzer',
    slot: 'sensoryA',
    canonicalSlotLabel: 'Sensory A',
    subtype: 'Sensory A · Discharge Timing',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Energy field monitor, discharge timing optimization.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated ARC Manaflow Analyzer sprite planned',
  },
  {
    id: 'sensory_a_sanc_lifeline',
    name: 'SANC Lifeline Monitor',
    slot: 'sensoryA',
    canonicalSlotLabel: 'Sensory A',
    subtype: 'Sensory A · Ally Health & Status',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Real-time ally health and status tracking.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated SANC Lifeline Monitor sprite planned',
  },
  {
    id: 'sensory_b_federated_echopulse',
    name: 'Federated EchoPulse Scanner',
    slot: 'sensoryB',
    canonicalSlotLabel: 'Sensory B',
    subtype: 'Sensory B · Acoustic Breach',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Acoustic scanner, breach detection.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Federated EchoPulse Scanner sprite planned',
  },
  {
    id: 'sensory_b_nds_echostorm',
    name: 'NDS EchoStorm Threat Analyzer',
    slot: 'sensoryB',
    canonicalSlotLabel: 'Sensory B',
    subtype: 'Sensory B · Missile Lock Detection',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Missile lock detection (Artillery optics).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated NDS EchoStorm Threat Analyzer sprite planned',
  },
  {
    id: 'sensory_b_aegis_lightveil',
    name: 'Aegis Lightveil Analyzer',
    slot: 'sensoryB',
    canonicalSlotLabel: 'Sensory B',
    subtype: 'Sensory B · Artillery Saturation & Shield Stress',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Artillery saturation and shield stress (Artillery optics).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Aegis Lightveil Analyzer sprite planned',
  },
  {
    id: 'sensory_b_vx_echonull',
    name: 'VX Echo-Null Scanner',
    slot: 'sensoryB',
    canonicalSlotLabel: 'Sensory B',
    subtype: 'Sensory B · Acoustic Dampening',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Acoustic dampening, breach prediction.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated VX Echo-Null Scanner sprite planned',
  },
  {
    id: 'sensory_b_arc_convergence',
    name: 'ARC Convergence Predictor',
    slot: 'sensoryB',
    canonicalSlotLabel: 'Sensory B',
    subtype: 'Sensory B · Beam Trajectory & Weak-Point',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Beam trajectory calculator, weak-point targeting (Artillery optics).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated ARC Convergence Predictor sprite planned',
  },
  {
    id: 'sensory_b_sanc_blessing_grid',
    name: 'SANC Blessing Resonance Grid',
    slot: 'sensoryB',
    canonicalSlotLabel: 'Sensory B',
    subtype: 'Sensory B · Buff Duration Optimizer',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Buff duration optimizer, ally position tracker.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated SANC Blessing Resonance Grid sprite planned',
  },

  // ─── 5. ARMS & LEGS COMPONENTS (§6 Frame Components by Loadout) ─────────────
  {
    id: 'arms_bwi_twinstrike',
    name: 'BWI Twinstrike Gauntlets',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Recoil Dampeners & Sustained Fire',
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Recoil dampeners, reinforced joints for sustained fire.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated BWI Twinstrike Gauntlets sprite planned',
  },
  {
    id: 'arms_fire_ice_line_holder',
    name: 'Fire & Ice Line Holder',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Shock-Channeling & Recoil Bracing',
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Shock-channeling conduits, reinforced recoil bracing.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Fire & Ice Line Holder arms sprite planned',
  },
  {
    id: 'arms_solbright_cleaver',
    name: 'Solbright Cleaver Assemblies',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Reactor-Linked Sword-Spear Channels',
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Reactor-linked sword-spear channels.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Solbright Cleaver assemblies sprite planned',
  },
  {
    id: 'arms_shadowcraft_silencer',
    name: 'Shadowcraft Silencer Gauntlets',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Recoil Suppression & Vibration Dampening',
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Recoil suppression, vibration dampening.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Shadowcraft Silencer gauntlets sprite planned',
  },
  {
    id: 'arms_arcanum_channeler',
    name: 'Arcanum Channeler Assemblies',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Energy Conduits & Beam Focusing',
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Energy conduits, beam focusing arrays.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Arcanum Channeler assemblies sprite planned',
  },
  {
    id: 'arms_sanctum_benediction',
    name: 'Sanctum Benediction Assemblies',
    slot: 'arms',
    canonicalSlotLabel: 'Arms',
    subtype: 'Hybrid Integration & Buff Emitters',
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Hybrid weapon integration, ally buff emitters.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Sanctum Benediction assemblies sprite planned',
  },
  {
    id: 'legs_bwi_gatecrasher',
    name: 'BWI Gatecrasher Striders',
    slot: 'legs',
    canonicalSlotLabel: 'Legs',
    subtype: 'Shock-Absorbing Booster Actuators',
    linkedActionId: 'mod_legs_seismic_stomp',
    description: 'Shock-absorbing, booster-linked actuators.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated BWI Gatecrasher Striders legs sprite planned',
  },
  {
    id: 'legs_fire_ice_outrigger',
    name: 'Fire & Ice Outrigger Striders',
    slot: 'legs',
    canonicalSlotLabel: 'Legs',
    subtype: 'Heavy Siege Outriggers',
    linkedActionId: 'mod_legs_seismic_stomp',
    description: 'Heavy plates, enhanced stability under siege.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Fire & Ice Outrigger Striders legs sprite planned',
  },
  {
    id: 'legs_dawnforge_stabilizer',
    name: 'Dawnforge Stabilizer Striders',
    slot: 'legs',
    canonicalSlotLabel: 'Legs',
    subtype: 'Heavy-Duty Stabilizer Anchors',
    linkedActionId: 'mod_legs_seismic_stomp',
    description: 'Heavy-duty, stabilizer anchors (supports Unfaltering feat).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Dawnforge Stabilizer Striders legs sprite planned',
  },
  {
    id: 'legs_shadowcraft_ghost',
    name: 'Shadowcraft Ghost Striders',
    slot: 'legs',
    canonicalSlotLabel: 'Legs',
    subtype: 'Silent Actuators & Burst Acceleration',
    linkedActionId: 'mod_legs_seismic_stomp',
    description: 'Silent actuators, burst acceleration.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Shadowcraft Ghost Striders legs sprite planned',
  },
  {
    id: 'legs_arcanum_anchor',
    name: 'Arcanum Anchor Striders',
    slot: 'legs',
    canonicalSlotLabel: 'Legs',
    subtype: 'Energy Grounding & Recoil Absorption',
    linkedActionId: 'mod_legs_seismic_stomp',
    description: 'Energy grounding, recoil absorption.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Arcanum Anchor Striders legs sprite planned',
  },
  {
    id: 'legs_sanctum_steadfast',
    name: 'Sanctum Steadfast Striders',
    slot: 'legs',
    canonicalSlotLabel: 'Legs',
    subtype: 'Support Positioning Stabilizers',
    linkedActionId: 'mod_legs_seismic_stomp',
    description: 'Stabilizer anchors for support positioning.',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated Sanctum Steadfast Striders legs sprite planned',
  },

  // ─── 6. AUX 3 & AUX 4 TACTICAL SYSTEMS (§4 — 12 Canonical Aux Systems) ─────
  {
    id: 'aux3_pnsy_rockweiler_buckler',
    name: 'PNSY R-11 Rockweiler Buckler',
    slot: 'aux3',
    canonicalSlotLabel: 'Aux 3 (Defensive)',
    subtype: 'Physical Shield',
    shieldBonus: 18,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Parrying shield, reactive plating (Aux 3 Physical Shield).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated PNSY R-11 Rockweiler Buckler sprite planned',
  },
  {
    id: 'aux3_rad_kinetic_recycling',
    name: 'RAD R-22 Bastion Kinetic Recycling',
    slot: 'aux3',
    canonicalSlotLabel: 'Aux 3 (Defensive)',
    subtype: 'Armor Augment',
    armorDurability: 25,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Reactive plating absorbs energy, recycles power (Aux 3 Armor Augment).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated RAD R-22 Bastion Kinetic Recycling sprite planned',
  },
  {
    id: 'aux3_ti_aegis_hardlight',
    name: 'TI Aegis Hard-Light Shield',
    slot: 'aux3',
    canonicalSlotLabel: 'Aux 3 (Defensive)',
    subtype: 'Energy Shield',
    shieldBonus: 25,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Deployable frontal barrier (Hardening Light) (Aux 3 Energy Shield).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated TI Aegis Hard-Light Shield sprite planned',
  },
  {
    id: 'aux3_vx_eclipse_cloak',
    name: 'VX Eclipse Cloak Generator',
    slot: 'aux3',
    canonicalSlotLabel: 'Aux 3 (Defensive)',
    subtype: 'Stealth',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Active camouflage, heat masking (Aux 3 Stealth).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated VX Eclipse Cloak Generator sprite planned',
  },
  {
    id: 'aux3_arc_prismatic_barrier',
    name: 'ARC Prismatic Barrier',
    slot: 'aux3',
    canonicalSlotLabel: 'Aux 3 (Defensive)',
    subtype: 'Energy Shield',
    shieldBonus: 22,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Refracts incoming beams (Aux 3 Energy Shield).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated ARC Prismatic Barrier sprite planned',
  },
  {
    id: 'aux3_sanc_restoration_field',
    name: 'SANC Aegis Restoration Field',
    slot: 'aux3',
    canonicalSlotLabel: 'Aux 3 (Defensive)',
    subtype: 'Repair',
    shieldBonus: 12,
    armorDurability: 15,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Area-effect shield and armor repair for allies (Aux 3 Repair).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated SANC Aegis Restoration Field sprite planned',
  },
  {
    id: 'aux4_pnsy_rough_rider_booster',
    name: 'PNSY UF-9 Rough Rider Booster',
    slot: 'aux4',
    canonicalSlotLabel: 'Aux 4 (Tactical)',
    subtype: 'Mobility',
    linkedActionId: 'mod_legs_seismic_stomp',
    description: 'Engagement/evasion kit with thrusters (Aux 4 Mobility).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated PNSY UF-9 Rough Rider Booster sprite planned',
  },
  {
    id: 'aux4_rad_ether_vapor',
    name: 'RAD UF-12 Ether Vapor Launcher',
    slot: 'aux4',
    canonicalSlotLabel: 'Aux 4 (Tactical)',
    subtype: 'Utility · Interference Launcher',
    linkedActionId: 'mod_head_optic_scan',
    description: 'Vision obscurement, targeting scramble (Aux 4 Utility / Interference Launcher).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated RAD UF-12 Ether Vapor Launcher sprite planned',
  },
  {
    id: 'aux4_ti_radiant_sphere',
    name: 'TI Radiant Sphere Generator',
    slot: 'aux4',
    canonicalSlotLabel: 'Aux 4 (Tactical)',
    subtype: 'Energy Shield · Dome',
    shieldBonus: 20,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Protective dome around allies (Aux 4 Energy Shield).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated TI Radiant Sphere Generator sprite planned',
  },
  {
    id: 'aux4_vx_phase_shift',
    name: 'VX Phase-Shift Module',
    slot: 'aux4',
    canonicalSlotLabel: 'Aux 4 (Tactical)',
    subtype: 'Evasion · Phase-Shift',
    linkedActionId: 'mod_legs_seismic_stomp',
    description: 'Brief intangibility burst (Aux 4 Evasion).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated VX Phase-Shift Module sprite planned',
  },
  {
    id: 'aux4_arc_feedback_capacitor',
    name: 'ARC Feedback Loop Capacitor',
    slot: 'aux4',
    canonicalSlotLabel: 'Aux 4 (Tactical)',
    subtype: 'Energy Shield · Counter',
    shieldBonus: 18,
    linkedActionId: 'mod_arms_shock_grapple',
    description: 'Absorbs energy attacks, stores for counter-discharge (Aux 4 Energy Shield).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated ARC Feedback Loop Capacitor sprite planned',
  },
  {
    id: 'aux4_sanc_martyrdom_plating',
    name: 'SANC Martyrdom Plating',
    slot: 'aux4',
    canonicalSlotLabel: 'Aux 4 (Tactical)',
    subtype: 'Armor Augment · Martyrdom System',
    armorDurability: 22,
    linkedActionId: 'mod_torso_reactive_burst',
    description: 'Reactive armor redirects ally damage to self (Aux 4 Armor Augment).',
    isPlaceholderAsset: true,
    futureAssetPlanned: 'Dedicated SANC Martyrdom Plating sprite planned',
  },
];

export type ChassisHardwareItemDefinition = CanonicalHardwareItemDefinition;
export const CHASSIS_HARDWARE_CATALOG: ChassisHardwareItemDefinition[] = CANONICAL_HARDWARE_CATALOG;

export function findHardwareItemByNameOrId(
  nameOrId: string | undefined | null
): CanonicalHardwareItemDefinition | undefined {
  if (!nameOrId) return undefined;
  const norm = nameOrId.trim().toLowerCase();
  return CANONICAL_HARDWARE_CATALOG.find(
    (item) => item.id.toLowerCase() === norm || item.name.toLowerCase() === norm
  );
}

/**
 * Resolves the pilot's active Coreplate, Reactor, and Aux 3/4 stats dynamically from equipped hardware.
 * In classless Project Orion, swapping a Coreplate or Reactor immediately updates Armor Type,
 * Base Load Capacity, Shield/Armor baseline, and Reactor Family.
 */
export function resolveEquippedHardwareStats(state: OrionState): {
  baseLoadCapacity: FrameLoadCapacity;
  armorType: 'Ablative' | 'Reactive' | 'Hardened' | 'Layered';
  armorThreshold: number;
  armorRating: number;
  baseArmorDurability: number;
  baseShieldCapacity: number;
  hardwareShieldBonus: number;
  hardwareArmorBonus: number;
  reactorFamily: 'Ichor' | 'Mana' | 'Ether';
} {
  const fallbackProfile = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;

  const equippedTorsoItem = findHardwareItemByNameOrId(state.equipmentSlots?.plating);
  const equippedReactorItem = findHardwareItemByNameOrId(state.equipmentSlots?.reactorCore);
  const equippedAux3Item = findHardwareItemByNameOrId(state.equipmentSlots?.aux3);
  const equippedAux4Item = findHardwareItemByNameOrId(state.equipmentSlots?.aux4);
  const equippedHeadItem = findHardwareItemByNameOrId(state.equipmentSlots?.head);

  const baseLoadCapacity: FrameLoadCapacity =
    equippedTorsoItem?.baseLoadCapacity ||
    (fallbackProfile.weightClass as FrameLoadCapacity) ||
    'medium';

  const armorType: 'Ablative' | 'Reactive' | 'Hardened' | 'Layered' =
    equippedTorsoItem?.armorType || fallbackProfile.baseArmor?.type || 'Reactive';

  const armorThreshold =
    equippedTorsoItem?.armorThreshold ?? fallbackProfile.baseArmor?.threshold ?? 6;

  const armorRating =
    equippedTorsoItem?.armorRating ?? fallbackProfile.baseArmor?.rating ?? 10;

  const baseArmorDurability =
    equippedTorsoItem?.armorDurability ?? fallbackProfile.baseArmor?.durability ?? 130;

  const baseShieldCapacity =
    equippedTorsoItem?.shieldBonus ?? fallbackProfile.baseShield?.capacity ?? 50;

  let hardwareShieldBonus = 0;
  let hardwareArmorBonus = 0;

  for (const aux of [equippedAux3Item, equippedAux4Item, equippedHeadItem]) {
    if (aux?.shieldBonus) hardwareShieldBonus += aux.shieldBonus;
    if (aux?.armorDurability) hardwareArmorBonus += aux.armorDurability;
  }

  const reactorFamily: 'Ichor' | 'Mana' | 'Ether' =
    equippedReactorItem?.reactorFamily || state.reactor || fallbackProfile.reactor || 'Ichor';

  return {
    baseLoadCapacity,
    armorType,
    armorThreshold,
    armorRating,
    baseArmorDurability,
    baseShieldCapacity,
    hardwareShieldBonus,
    hardwareArmorBonus,
    reactorFamily,
  };
}
