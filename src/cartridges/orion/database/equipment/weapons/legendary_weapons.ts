/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  LegendaryEngineHook,
  LegendaryWeaponDefinition,
  LoreBoundAttachment,
  WeaponCategory,
  WeaponDefinition,
} from '../../../types';
import { buildMagitechWeapon } from './builder';

// ─── LORE-BOUND COMPANION RELIC CATALOG ─────────────────────────────────────

/**
 * The Scabbard of Avalon — Belldor (`belldor`) lore-bound companion to `Excalibur`.
 * Claimed by defeating The Lady of the Lake in Stage 1 (The Bog) after defeating King Arthur
 * and gathering all items on Bedivere's Numbered List.
 */
export const SCABBARD_OF_AVALON_ATTACHMENT: LoreBoundAttachment = {
  id: 'scabbard_of_avalon',
  name: 'The Scabbard of Avalon',
  originWorldId: 'belldor',
  requiredWorldFlags: ['arthur_defeated', 'lady_of_the_lake_defeated'],
  acquisitionSource:
    'Defeat The Lady of the Lake in The Bog after defeating King Arthur and gathering Bedivere’s Numbered List.',
  canBeEquippedStandalone: false,
  transformedWeaponTitle: 'Excalibur, Sheathed in Avalon',
  grantedEngineHooks: ['PREVENT_LETHAL_DOT'],
  mechanicSummary:
    "Avalon's Immortality: Prevents death from any Damage-over-Time (DoT) source. Any lethal periodic tick (bleed, burn, poison, corrosive/ætheric decay) clamps Layer 3 Frame Integrity at 1 HP instead of 0 HP.",
};

/**
 * Juuchi Yosamu ("10,000 Cold Nights" / "10,000 Winters") — Novarin (`novarin`) lore-bound companion
 * that can be wielded standalone as a Legendary Katana OR slotted into `Yawarakai-Te`'s lore-bound
 * mount at the Armory Workbench to fuse into the two-bladed Katana `Yawarakai-Te & Juuchi Yosamu`.
 */
export const JUUCHI_YOSAMU_ATTACHMENT: LoreBoundAttachment = {
  id: 'leg_juuchi_yosamu',
  name: 'Juuchi Yosamu',
  originWorldId: 'novarin',
  requiredWorldFlags: ['novarin_warlord_defeated'],
  acquisitionSource:
    'Claimed from the corrupted Elven–Orcish war-forges on Novarin (forged by master smith Muramasa). Can be wielded standalone or fused into Yawarakai-Te at the Armory Workbench.',
  canBeEquippedStandalone: true,
  transformedWeaponTitle: 'Yawarakai-Te & Juuchi Yosamu',
  combinedWeightOverride: 16,
  grantedEngineHooks: ['DR_DURING_ACTIVE_HIT_FRAMES', 'TWIN_BLADE_DUAL_EXECUTION'],
  mechanicSummary:
    'Twin-Blade Creek Fusion: Joins hilts end-to-end into a 16 WT two-bladed Katana with -20% windup, +20% active hit frames, simultaneous dual-blade strike execution, paired off-hand Daisho eligibility, and unbroken 100% all-phase 20% Damage Reduction.',
};

/**
 * Medusa's Head (`Gorgoneion`) — Tyrranus (`tyrranus`) lore-bound companion to `Aegis`.
 * Claimed by defeating Medusa deep within Tyrranus's sunken marble labyrinth.
 */
export const MEDUSAS_HEAD_ATTACHMENT: LoreBoundAttachment = {
  id: 'medusas_head',
  name: "Medusa's Head",
  originWorldId: 'tyrranus',
  requiredWorldFlags: ['medusa_defeated'],
  acquisitionSource:
    'Defeat the Gorgon Medusa deep within the sunken marble labyrinth of Tyrranus and mount the Gorgoneion onto the central boss of Aegis.',
  canBeEquippedStandalone: false,
  transformedWeaponTitle: 'Aegis of the Gorgon',
  internalCooldownSeconds: 14,
  grantedEngineHooks: ['BYPASS_BOSS_CC_IMMUNITY_PETRIFY'],
  mechanicSummary:
    "Gorgon's Gaze: Performing an Action 4 Perfect Block (0.34s window) or Action 1 Shield Bash Finisher unleashes a conical petrifying glare that turns struck enemies to stone (Hard-Lock Freeze) for 2.0s—bypassing Boss & Unstoppable CC immunity (14s internal cooldown; 8s Stone-Hardened immunity after thawing).",
};

/**
 * Canonical catalog of all lore-bound companion relics for Legendary weapons.
 */
export const LORE_BOUND_ATTACHMENT_CATALOG: readonly LoreBoundAttachment[] = [
  SCABBARD_OF_AVALON_ATTACHMENT,
  JUUCHI_YOSAMU_ATTACHMENT,
  MEDUSAS_HEAD_ATTACHMENT,
];

/**
 * O(1) lookup dictionary of lore-bound companion relics keyed by attachment ID.
 */
export const LORE_BOUND_ATTACHMENT_BY_ID: Record<string, LoreBoundAttachment> = Object.fromEntries(
  LORE_BOUND_ATTACHMENT_CATALOG.map((att) => [att.id, att])
);

// ─── LEGENDARY WEAPON SPECIFICATIONS (5 CANONICAL WORLD ENTRIES / 6 WEAPONS) ─

/**
 * Canonical Entry #1: Belldor — `Excalibur` (`leg_excalibur`).
 */
export const EXCALIBUR_LEGENDARY_SPEC: LegendaryWeaponDefinition = {
  id: 'leg_excalibur',
  tier: 'LEGENDARY',
  name: 'Excalibur',
  originWorldId: 'belldor',
  folkloreTradition: 'Arthurian Knights & Grail Myth (Camelot)',
  areaLoreConnection:
    'The Bog on Belldor is defined by corrosive mire and periodic Damage-over-Time (DoT) decay, while Camelot knights hide behind fortified energy barriers—answered by Excalibur bypassing Layer 1 Shields and its Scabbard preventing death from DoT.',
  weaponClass: 'Blades: Straight',
  functionalClass: 'Bastard Sword',
  damageType: 'Pierce',
  weight: 12,
  maxObtainableCopies: 1,
  gripMode: 'VERSATILE',
  legendaryGripOverride: true,
  allowStandardMods: false,
  maxGemSlots: 0,
  boundRelicSlots: [SCABBARD_OF_AVALON_ATTACHMENT],
  innateEngineHooks: ['BYPASS_LAYER1_SHIELDS'],
  innateMechanicSummary:
    "Sovereign's Decree: Melee strikes bypass Layer 1 Energy Shields completely on every hit, applying damage directly to Layer 2 Armor and Layer 3 Frame Integrity.",
  loreDescription:
    'The sovereign solar bastard blade of King Arthur, claimed within Camelot’s inner sanctum on Belldor. When reunited with The Scabbard of Avalon recovered from The Lady of the Lake, it becomes Excalibur, Sheathed in Avalon.',
};

/**
 * Canonical Entry #2A: New Novarin — `Yawarakai-Te` ("Tender Hands", forged by Masamune).
 */
export const YAWARAKAI_TE_LEGENDARY_SPEC: LegendaryWeaponDefinition = {
  id: 'leg_yawarakai_te',
  tier: 'LEGENDARY',
  name: 'Yawarakai-Te',
  originWorldId: 'new_novarin',
  folkloreTradition: 'Masamune & Muramasa Creek Contest · Elven–Orcish Schism',
  areaLoreConnection:
    'Safeguarded by the Elves of New Novarin. Forged by master smith Masamune and tested in a mountain creek where it refused to cut swimming fish or drifting leaves—embodying serene restraint until fused with its corrupted twin Juuchi Yosamu.',
  weaponClass: 'Blades: Curved',
  functionalClass: 'Katana',
  damageType: 'Pierce',
  weight: 9,
  maxObtainableCopies: 1,
  gripMode: '1H',
  countsAsPairedOffhandBlade: false,
  allowStandardMods: false,
  maxGemSlots: 0,
  boundRelicSlots: [JUUCHI_YOSAMU_ATTACHMENT],
  innateEngineHooks: ['DR_OUTSIDE_ACTIVE_HIT_FRAMES'],
  innateMechanicSummary:
    'Tender Hands (~0.80× solo Katana BCU, +20% windup, -20% active hit frames): Reduces incoming damage by 20% during every frame EXCEPT active attack hit frames (neutral, glide, windup, and recovery). Slot Juuchi Yosamu to fuse into Yawarakai-Te & Juuchi Yosamu.',
  loreDescription:
    'Master smith Masamune’s compassionate creek-tested katana ("Tender Hands"), preserved in the astral arbors of New Novarin. Its pommel coupler is keyed exclusively to Muramasa’s bloodthirsty twin blade, Juuchi Yosamu.',
};

/**
 * Canonical Entry #2B: Novarin — `Juuchi Yosamu` ("10,000 Cold Nights", forged by Muramasa).
 */
export const JUUCHI_YOSAMU_LEGENDARY_SPEC: LegendaryWeaponDefinition = {
  id: 'leg_juuchi_yosamu',
  tier: 'LEGENDARY',
  name: 'Juuchi Yosamu',
  originWorldId: 'novarin',
  folkloreTradition: 'Masamune & Muramasa Creek Contest · Elven–Orcish Schism',
  areaLoreConnection:
    'Wielded by the ancestral Orc warbands (corrupted Elves) on Novarin. Forged by master smith Muramasa and tested in the mountain creek where it severed leaves, fish, and the very air—embodying relentless aggression.',
  weaponClass: 'Blades: Curved',
  functionalClass: 'Katana',
  damageType: 'Pierce',
  weight: 9,
  maxObtainableCopies: 1,
  gripMode: '1H',
  allowStandardMods: false,
  maxGemSlots: 0,
  boundRelicSlots: [],
  innateEngineHooks: ['DR_DURING_ACTIVE_HIT_FRAMES'],
  innateMechanicSummary:
    '10,000 Cold Nights (~0.80× solo Katana BCU, -20% windup, +20% active hit frames): Reduces incoming damage by 20% EXCLUSIVELY during active attack hit frames. Can be wielded standalone or slotted into Yawarakai-Te at the Armory Workbench.',
  loreDescription:
    'Master smith Muramasa’s ruthless creek-tested katana ("10,000 Cold Nights"), carried into exile by the corrupted Elven warbands of Novarin. Can be fought with as a standalone katana or joined hilt-to-hilt with Yawarakai-Te.',
};

/**
 * Canonical Entry #3: Tyrranus — `Aegis` (`leg_aegis`).
 */
export const AEGIS_LEGENDARY_SPEC: LegendaryWeaponDefinition = {
  id: 'leg_aegis',
  tier: 'LEGENDARY',
  name: 'Aegis',
  originWorldId: 'tyrranus',
  folkloreTradition: 'Greek & Roman Olympian / Gorgon Myth',
  areaLoreConnection:
    'Tyrranus is defined by overwhelming phalanx volleys, crushing colossus strikes, and unstoppable arena champions—answered by Aegis’s unbreakable directional guard and Medusa’s Head petrifying CC-immune bosses.',
  weaponClass: 'Shields',
  functionalClass: 'Scutum',
  damageType: 'Impact',
  weight: 14,
  maxObtainableCopies: 1,
  armorProfile: {
    durability: 165,
    rating: 14,
    threshold: 10,
  },
  gripMode: '1H',
  allowStandardMods: false,
  maxGemSlots: 0,
  boundRelicSlots: [MEDUSAS_HEAD_ATTACHMENT],
  innateEngineHooks: ['UNBREAKABLE_DIRECTIONAL_GUARD'],
  innateMechanicSummary:
    'Thunder-Forged Skyward (165 DUR · 14 RTG · 10 THR Layer 2 Armor): While actively holding directional guard (Action 4), your guard can never be staggered, crushed, or guard-broken by heavy hits or suppression stacks—even at 0 Shield and 0 Armor.',
  loreDescription:
    'Looted from the sealed marble sanctum behind Zeus’s throne room in the imperial acropolis of Tyrranus. Its central bronze boss features a Gorgoneion socket forged to mount Medusa’s Head.',
};

/**
 * Canonical Entry #4: Golem — `Knives of the Lake of Fire` (`leg_lake_of_fire_knife`).
 */
export const KNIVES_OF_THE_LAKE_OF_FIRE_LEGENDARY_SPEC: LegendaryWeaponDefinition = {
  id: 'leg_lake_of_fire_knife',
  tier: 'LEGENDARY',
  name: 'Knives of the Lake of Fire',
  originWorldId: 'golem',
  folkloreTradition: 'Egyptian Underworld / Book of the Dead & Amduat Gatekeepers',
  areaLoreConnection:
    'Golem is saturated with reanimated undead and self-rebuilding animated constructs that rise again after being felled. These curved Duat executioner blades sever the Ba, Ka, and Shut so resurrecting entities stay permanently dead.',
  weaponClass: 'Blades: Curved',
  functionalClass: 'Khopesh',
  damageType: 'Pierce',
  weight: 8,
  maxObtainableCopies: 4,
  gripMode: '1H',
  allowStandardMods: false,
  maxGemSlots: 0,
  boundRelicSlots: [],
  innateEngineHooks: ['PERMANENT_KILL_PREVENT_RESURRECT'],
  action3Override: {
    name: 'Glance of the Gatekeeper',
    effectType: 'STUN_BLIND_CONE',
    stunSeconds: 1.2,
    blindSeconds: 2.5,
    widensWhenDualWielded: true,
  },
  innateMechanicSummary:
    'Sever the Ba, Ka & Shut (Collectible up to 4 copies · 1H True Dual-Wield): Permanently kills enemies that normally resurrect. Action 3 (Glance of the Gatekeeper) projects a frontal radiance cone that stuns (1.2s) and blinds (2.5s), widening when dual-wielded.',
  loreDescription:
    'Oversized ritual des knives and khopesh-sized celestial cleavers wielded by the four Gatekeepers of the Lake of Fire on Golem. Up to four blades can be claimed in a single pass from the secret four-boss underworld gatekeeper encounter.',
};

/**
 * Canonical Entry #5: Orion — `Balmung` (`leg_balmung`).
 */
export const BALMUNG_LEGENDARY_SPEC: LegendaryWeaponDefinition = {
  id: 'leg_balmung',
  tier: 'LEGENDARY',
  name: 'Balmung',
  originWorldId: 'orion',
  folkloreTradition: 'Germanic / Nibelungenlied & Dwarven Deep-Crust Forge Lore',
  areaLoreConnection:
    'Orion is a subterranean dwarven forge-world of crushing seismic hammers and towering armored constructs designed to stagger lighter frames—answered by Balmung’s permanent Hyper Armor, zero hit-stop cleave, and automatic melee riposte.',
  weaponClass: 'Blades: Straight',
  functionalClass: 'Zweihander',
  damageType: 'Impact',
  weight: 20,
  maxObtainableCopies: 1,
  gripMode: '2H',
  strictTwoHandedNoOffhand: true,
  allowDorsalLauncherOnly: true,
  allowStandardMods: false,
  maxGemSlots: 0,
  boundRelicSlots: [],
  innateEngineHooks: [
    'ALWAYS_HYPER_ARMOR',
    'ZERO_HIT_STOP',
    'PERFECT_BLOCK_MELEE_AUTO_COUNTER',
  ],
  innateMechanicSummary:
    "Nibelung Unyielding + Dragon-Cleaver Momentum + Siegfried's Riposte: Permanent Hyper Armor while equipped, zero hit-stop freeze frames (0ms) on impact, and automatic counter-cleave on Action 4 Perfect Block against melee strikes. Strictly 2H (dorsal launchers only in slot 2).",
  loreDescription:
    'Monumental dwarf-forged dragon-slayer greatsword claimed by defeating Siegfried in the deep-crust foundries of Orion. Its massive 20 WT fuller demands both hands unconditionally, permitting only dorsal back-mounted launchers in the side slot.',
};

/**
 * Canonical list of all 6 playable Legendary weapon definitions across the 5 folklore worlds.
 */
export const LEGENDARY_WEAPON_DEFINITIONS: readonly LegendaryWeaponDefinition[] = [
  EXCALIBUR_LEGENDARY_SPEC,
  YAWARAKAI_TE_LEGENDARY_SPEC,
  JUUCHI_YOSAMU_LEGENDARY_SPEC,
  AEGIS_LEGENDARY_SPEC,
  KNIVES_OF_THE_LAKE_OF_FIRE_LEGENDARY_SPEC,
  BALMUNG_LEGENDARY_SPEC,
];

/**
 * O(1) lookup dictionary of Legendary weapon specifications keyed by canonical weapon ID.
 */
export const LEGENDARY_WEAPONS_BY_ID: Record<string, LegendaryWeaponDefinition> =
  Object.fromEntries(LEGENDARY_WEAPON_DEFINITIONS.map((spec) => [spec.id, spec]));

// ─── ENGINE HOOK VALIDATION & DAMAGE RESOLVER HELPERS ───────────────────────

/**
 * Validates off-hand / side-slot compatibility when a Legendary weapon enforces
 * strict two-handed isolation (e.g., Balmung permitting only dorsal launchers).
 */
export function canEquipOffhandWithLegendary(
  mainHandWeapon: LegendaryWeaponDefinition,
  offhandWeaponClass: WeaponCategory
): { ok: boolean; reason?: string } {
  if (!mainHandWeapon.strictTwoHandedNoOffhand) {
    return { ok: true };
  }
  if (
    mainHandWeapon.allowDorsalLauncherOnly &&
    offhandWeaponClass === 'Carriers & Munitions'
  ) {
    return { ok: true };
  }
  return {
    ok: false,
    reason: `${mainHandWeapon.name} cannot be paired with off-hand weapons or shields (dorsal launchers only).`,
  };
}

/**
 * Combat damage resolver hook for Avalon's Immortality (`PREVENT_LETHAL_DOT`) and
 * Yawarakai-Te / Juuchi Yosamu frame-phase damage reduction (`DR_OUTSIDE_ACTIVE_HIT_FRAMES` / `DR_DURING_ACTIVE_HIT_FRAMES`).
 */
export function resolveFrameDamageWithLegendaryHooks(
  currentFrameHp: number,
  incomingFrameDamage: number,
  isDamageOverTime: boolean,
  isInActiveHitFrames: boolean,
  framePhaseDrMultiplier: number,
  activeHooks: ReadonlySet<LegendaryEngineHook>
): number {
  let effectiveDamage = incomingFrameDamage;

  const hasOutsideHitDr = activeHooks.has('DR_OUTSIDE_ACTIVE_HIT_FRAMES');
  const hasDuringHitDr = activeHooks.has('DR_DURING_ACTIVE_HIT_FRAMES');

  if (
    (!isInActiveHitFrames && hasOutsideHitDr) ||
    (isInActiveHitFrames && hasDuringHitDr)
  ) {
    effectiveDamage *= framePhaseDrMultiplier;
  }

  const nextHp = currentFrameHp - effectiveDamage;
  if (nextHp <= 0 && isDamageOverTime && activeHooks.has('PREVENT_LETHAL_DOT')) {
    return 1;
  }
  return Math.max(0, Math.round(nextHp));
}

// ─── PLAYABLE LEGENDARY WEAPON DEFINITIONS ──────────────────────────────────

/**
 * Canonical playable weapon definition for `Excalibur` (`leg_excalibur`, Belldor).
 */
export const legExcaliburWeapon: WeaponDefinition = buildMagitechWeapon({
  id: 'leg_excalibur',
  name: 'Excalibur',
  code: 'LEG-BLD-01',
  legacyEpithet: 'Sword of Sovereignty',
  flavorText:
    'Forged in the solar crucible of Avalon and wielded by King Arthur. Its edge cuts through energy barriers as though they were mist.',
  explicitEquipWeight: 12,
  gripMode: 'VERSATILE',
  allowOneHandGrip: true,
  allowSideSlot: true,
  isLegendary: true,
  legendarySpec: EXCALIBUR_LEGENDARY_SPEC,
  category: 'Blades: Straight',
  weaponTier: 'legendary',
  weaponClass: 'Bastard Sword',
  primaryDamageType: 'Pierce',
  adaptiveDamageTypes: ['Pierce', 'Beam'],
  weightClass: 'medium',
  loadoutSlots: ['Weapon 1', 'Weapon 2'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  passiveLightBonus: 2,
  bladeTrailColor: '#fde047',
  identity:
    "Belldor Arthurian Legendary Bastard Sword (12 WT · Versatile 1H/2H · Sovereign's Decree: Melee strikes bypass Layer 1 Energy Shields directly; accepts The Scabbard of Avalon)",
  lore: EXCALIBUR_LEGENDARY_SPEC.loreDescription,
  shotsPerChain: 4,
  damagePerShot: 15,
  chainDurationSec: 1.4,
  reloadDurationSec: 0,
  range: 34,
  skills: [
    {
      name: "Sovereign's Decree Cadence",
      desc: '4-step solar bastard-sword combo that unconditionally bypasses Layer 1 Energy Shields on every strike.',
    },
    {
      name: 'Caliburn Solar Thrust',
      dmg: 26,
      cd: 4.5,
      heat: 12,
      dt: 'Pierce',
      desc: 'Lunging royal thrust that pierces directly through barrier fields into Layer 2 Armor.',
    },
    {
      name: 'Crest of Pendragon',
      dmg: 28,
      cd: 5.5,
      heat: 15,
      dt: 'Beam',
      desc: 'Two-handed golden beam-edge arc that sears all enemies in a wide forward crescent.',
    },
    {
      name: 'Block',
      dmg: 14,
      cd: 0,
      heat: 3,
      dt: 'Impact',
      isBlock: true,
      desc: 'Hold to raise Excalibur in a radiant cross-guard ward (0.34s Perfect Block window).',
    },
    {
      name: 'Judgment of Camelot',
      dmg: 38,
      cd: 8.5,
      heat: 24,
      dt: 'Beam',
      desc: 'Overhead sovereign execution cleave that projects a blinding solar wave through all shields.',
    },
  ],
});

/**
 * Canonical playable weapon definition for `Yawarakai-Te` (`leg_yawarakai_te`, New Novarin).
 */
export const legYawarakaiTeWeapon: WeaponDefinition = buildMagitechWeapon({
  id: 'leg_yawarakai_te',
  name: 'Yawarakai-Te',
  code: 'LEG-NNV-01',
  legacyEpithet: 'Tender Hands (Masamune)',
  flavorText:
    'Planted in a mountain stream, it parted the current without harming a single swimming fish or drifting leaf.',
  explicitEquipWeight: 9,
  gripMode: '1H',
  allowOneHandGrip: true,
  allowSideSlot: true,
  isLegendary: true,
  legendarySpec: YAWARAKAI_TE_LEGENDARY_SPEC,
  category: 'Blades: Curved',
  weaponTier: 'legendary',
  weaponClass: 'Katana',
  primaryDamageType: 'Pierce',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 1', 'Weapon 2'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#7dd3fc',
  identity:
    'New Novarin Elven Legendary Katana forged by Masamune (9 WT · ~0.80× solo Katana BCU · +20% windup / -20% active hit frames · Tender Hands: 20% DR outside active hit frames; fuses with Juuchi Yosamu)',
  lore: YAWARAKAI_TE_LEGENDARY_SPEC.loreDescription,
  shotsPerChain: 4,
  damagePerShot: 12,
  chainDurationSec: 1.4,
  reloadDurationSec: 0,
  range: 32,
  skills: [
    {
      name: 'Creek-Parting Iai Cadence',
      desc: 'Serene Masamune katana flow granting 20% damage reduction across all non-hit frames (or all frames + twin-blade dual strikes when fused with Juuchi Yosamu).',
    },
    {
      name: 'Leaf-Drifting Draw',
      dmg: 22,
      cd: 4.2,
      heat: 10,
      dt: 'Pierce',
      desc: 'Measured draw-cut that slips around enemy guard lines with tranquil balance.',
    },
    {
      name: 'Still-Water Spiral',
      dmg: 24,
      cd: 5.2,
      heat: 13,
      dt: 'Pierce',
      desc: 'Fluid rotational slash that deflects incoming momentum while repositioning.',
    },
    {
      name: 'Block',
      dmg: 12,
      cd: 0,
      heat: 2,
      dt: 'Impact',
      isBlock: true,
      desc: 'Hold to poise Yawarakai-Te in a calm water-mirror parry stance (0.34s Perfect Block window).',
    },
    {
      name: 'Verdict of the Mountain Stream',
      dmg: 34,
      cd: 8.0,
      heat: 20,
      dt: 'Pierce',
      desc: 'High-commitment crossing slash that executes a twin-blade double cleave when fused with Juuchi Yosamu.',
    },
  ],
});

/**
 * Canonical playable weapon definition for `Juuchi Yosamu` (`leg_juuchi_yosamu`, Novarin).
 */
export const legJuuchiYosamuWeapon: WeaponDefinition = buildMagitechWeapon({
  id: 'leg_juuchi_yosamu',
  name: 'Juuchi Yosamu',
  code: 'LEG-NOV-01',
  legacyEpithet: '10,000 Cold Nights (Muramasa)',
  flavorText:
    'Planted in the mountain stream, its hungry edge severed drifting leaves, darting fish, and the very wind.',
  explicitEquipWeight: 9,
  gripMode: '1H',
  allowOneHandGrip: true,
  allowSideSlot: true,
  isLegendary: true,
  legendarySpec: JUUCHI_YOSAMU_LEGENDARY_SPEC,
  category: 'Blades: Curved',
  weaponTier: 'legendary',
  weaponClass: 'Katana',
  primaryDamageType: 'Pierce',
  weightClass: 'medium',
  loadoutSlots: ['Weapon 1', 'Weapon 2'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#f43f5e',
  identity:
    'Novarin Orcish/Elven Legendary Katana forged by Muramasa (9 WT · ~0.80× solo Katana BCU · -20% windup / +20% active hit frames · 10,000 Cold Nights: 20% DR during active hit frames; slots into Yawarakai-Te)',
  lore: JUUCHI_YOSAMU_LEGENDARY_SPEC.loreDescription,
  shotsPerChain: 4,
  damagePerShot: 12,
  chainDurationSec: 1.4,
  reloadDurationSec: 0,
  range: 32,
  skills: [
    {
      name: 'Creek-Severing Iai Cadence',
      desc: 'Predatory Muramasa katana flow with -20% faster windup, +20% longer active hit frames, and 20% damage reduction during active trade swings.',
    },
    {
      name: 'Frost-Bitten Draw',
      dmg: 22,
      cd: 4.2,
      heat: 10,
      dt: 'Pierce',
      desc: 'Snap-windup draw slash that bites deep into targets during extended active frames.',
    },
    {
      name: 'Red-Current Vortex',
      dmg: 24,
      cd: 5.2,
      heat: 13,
      dt: 'Pierce',
      desc: 'Whirling crimson arc that rewards aggressive mid-swing trades.',
    },
    {
      name: 'Block',
      dmg: 12,
      cd: 0,
      heat: 2,
      dt: 'Impact',
      isBlock: true,
      desc: 'Hold to brace Juuchi Yosamu in a razor-angled counter ward (0.34s Perfect Block window).',
    },
    {
      name: 'Ten Thousand Winters',
      dmg: 34,
      cd: 8.0,
      heat: 20,
      dt: 'Pierce',
      desc: 'Relentless finishing lunge that carves through anything caught in its path.',
    },
  ],
});

/**
 * Canonical playable weapon definition for `Aegis` (`leg_aegis`, Tyrranus).
 */
export const legAegisWeapon: WeaponDefinition = buildMagitechWeapon({
  id: 'leg_aegis',
  name: 'Aegis',
  code: 'LEG-TYR-01',
  legacyEpithet: 'Thunder-Forged Skyward Shield',
  flavorText:
    'Held aloft in the acropolis of Tyrranus, no phalanx volley or colossus hammer could ever bow its rim.',
  explicitEquipWeight: 14,
  gripMode: '1H',
  allowOneHandGrip: true,
  allowSideSlot: true,
  isLegendary: true,
  legendarySpec: AEGIS_LEGENDARY_SPEC,
  category: 'Shields',
  weaponTier: 'legendary',
  weaponClass: 'Scutum',
  primaryDamageType: 'Impact',
  adaptiveDamageTypes: ['Impact', 'Beam'],
  weightClass: 'heavy',
  loadoutSlots: ['Weapon 1', 'Weapon 2'],
  equipmentRole: 'shield',
  handing: '1-hand',
  canBlock: true,
  passiveShieldBonus: 36,
  passiveArmorBonus: 165,
  bladeTrailColor: '#facc15',
  identity:
    "Tyrranus Olympian Legendary Scutum (14 WT · 165 DUR / 14 RTG / 10 THR Layer 2 Armor · Thunder-Forged Skyward: Unbreakable Action 4 directional guard; accepts Medusa's Head)",
  lore: AEGIS_LEGENDARY_SPEC.loreDescription,
  shotsPerChain: 3,
  damagePerShot: 17,
  chainDurationSec: 1.3,
  reloadDurationSec: 0,
  range: 25,
  skills: [
    {
      name: 'Olympian Phalanx Bash',
      desc: "3-step thunder-forged scutum bash combo. When Medusa's Head is mounted, the combo finisher unleashes Gorgon's Gaze (2.0s Boss-piercing Petrify).",
    },
    {
      name: 'Thunderhead Ram',
      dmg: 26,
      cd: 4.8,
      heat: 13,
      dt: 'Impact',
      desc: 'Driving scutum rush that slams frontal targets with storm-forged mass.',
    },
    {
      name: 'Acropolis Lightning Discharge',
      dmg: 28,
      cd: 5.8,
      heat: 16,
      dt: 'Beam',
      desc: 'Releases a searing arc of Olympian beam energy from the shield boss.',
    },
    {
      name: 'Block',
      dmg: 15,
      cd: 0,
      heat: 2,
      dt: 'Impact',
      isBlock: true,
      desc: "Unbreakable Directional Guard: Hold to lock Aegis against frontal attacks—never staggered or guard-broken even at 0 Shield/0 Armor. Perfect Block triggers Gorgon's Gaze when Medusa's Head is slotted.",
    },
    {
      name: 'Wrath of the Skyfather',
      dmg: 36,
      cd: 8.8,
      heat: 24,
      dt: 'Beam',
      desc: 'Vaulting shield-slam that erupts in a radial thunderclap around the pilot.',
    },
  ],
});

/**
 * Canonical playable weapon definition for `Knives of the Lake of Fire` (`leg_lake_of_fire_knife`, Golem).
 */
export const legLakeOfFireKnifeWeapon: WeaponDefinition = buildMagitechWeapon({
  id: 'leg_lake_of_fire_knife',
  name: 'Knives of the Lake of Fire',
  code: 'LEG-GLM-01',
  legacyEpithet: 'Cleaver of the Duat Gatekeepers',
  flavorText:
    'Wielded beside the subterranean lake of flame to sever the Ba, Ka, and Shut so the risen dead never stir again.',
  explicitEquipWeight: 8,
  gripMode: '1H',
  allowOneHandGrip: true,
  allowSideSlot: true,
  isLegendary: true,
  legendarySpec: KNIVES_OF_THE_LAKE_OF_FIRE_LEGENDARY_SPEC,
  category: 'Blades: Curved',
  weaponTier: 'legendary',
  weaponClass: 'Khopesh',
  primaryDamageType: 'Pierce',
  weightClass: 'light',
  loadoutSlots: ['Weapon 1', 'Weapon 2'],
  equipmentRole: 'melee',
  handing: '1-hand',
  canBlock: true,
  bladeTrailColor: '#fb923c',
  identity:
    'Golem Underworld Legendary Khopesh (8 WT · Collectible up to 4 copies · 1H True Dual-Wield · Sever the Ba, Ka & Shut: Permanently kills resurrecting foes · Action 3 Glance of the Gatekeeper stun/blind cone)',
  lore: KNIVES_OF_THE_LAKE_OF_FIRE_LEGENDARY_SPEC.loreDescription,
  shotsPerChain: 4,
  damagePerShot: 14,
  chainDurationSec: 1.25,
  reloadDurationSec: 0,
  range: 28,
  skills: [
    {
      name: 'Soul-Severing Khopesh Cadence',
      desc: '4-step hooked funerary cleaver combo that permanently disables resurrection and self-repair on any slain undead or construct.',
    },
    {
      name: 'Shesmu Hook-Rip',
      dmg: 23,
      cd: 4.0,
      heat: 10,
      dt: 'Pierce',
      desc: 'Wrenches enemy shield rims aside while carving deep into exposed joints.',
    },
    {
      name: 'Glance of the Gatekeeper',
      dmg: 22,
      cd: 5.5,
      heat: 14,
      dt: 'Beam',
      desc: 'Projects a searing funerary radiance cone in front of the wielder that stuns (1.2s) and blinds (2.5s) caught enemies. Cone widens when dual-wielding two Knives of the Lake of Fire.',
    },
    {
      name: 'Block',
      dmg: 11,
      cd: 0,
      heat: 2,
      dt: 'Impact',
      isBlock: true,
      desc: 'Hold to catch incoming strikes in the khopesh crook (0.34s Perfect Block window).',
    },
    {
      name: 'Verdict of the Lake of Fire',
      dmg: 34,
      cd: 8.0,
      heat: 20,
      dt: 'Pierce',
      desc: 'Scissoring underworld execution slash that annihilates soul-tethers and construct cores.',
    },
  ],
});

/**
 * Canonical playable weapon definition for `Balmung` (`leg_balmung`, Orion).
 */
export const legBalmungWeapon: WeaponDefinition = buildMagitechWeapon({
  id: 'leg_balmung',
  name: 'Balmung',
  code: 'LEG-ORN-01',
  legacyEpithet: 'Nibelung Dragon-Slayer Greatsword',
  flavorText:
    'Quenched in the deep-crust forges of Orion. Nothing in the subterranean dark can halt its swing.',
  explicitEquipWeight: 20,
  gripMode: '2H',
  allowOneHandGrip: false,
  allowSideSlot: false,
  isLegendary: true,
  legendarySpec: BALMUNG_LEGENDARY_SPEC,
  category: 'Blades: Straight',
  weaponTier: 'legendary',
  weaponClass: 'Zweihander',
  primaryDamageType: 'Impact',
  adaptiveDamageTypes: ['Impact', 'Pierce'],
  weightClass: 'heavy',
  loadoutSlots: ['Weapon 1'],
  equipmentRole: 'melee',
  handing: '2-hand',
  canBlock: true,
  bladeTrailColor: '#38bdf8',
  identity:
    "Orion Dwarven Legendary Zweihander (20 WT · Strict 2H / Dorsal Launchers only in slot 2 · Permanent Hyper Armor, Zero Hit-Stop (0ms), and Siegfried's Riposte auto-counter on Perfect Block)",
  lore: BALMUNG_LEGENDARY_SPEC.loreDescription,
  shotsPerChain: 3,
  damagePerShot: 22,
  chainDurationSec: 1.6,
  reloadDurationSec: 0,
  range: 36,
  skills: [
    {
      name: 'Dragon-Cleaver Momentum Cadence',
      desc: '3-step monumental greatsword combo with permanent Hyper Armor and zero hit-stop freeze frames (0ms), cleaving straight through armor and shields.',
    },
    {
      name: 'Fafnir Spine-Breaker',
      dmg: 30,
      cd: 5.0,
      heat: 15,
      dt: 'Impact',
      desc: 'Crushing overhead forge-cleave that cannot be interrupted by any enemy impact.',
    },
    {
      name: 'Nibelung Great-Sweep',
      dmg: 28,
      cd: 5.8,
      heat: 16,
      dt: 'Pierce',
      desc: 'Full-circle two-handed greatsword sweep that shears through surrounding phalanxes with zero hit-stop.',
    },
    {
      name: 'Block',
      dmg: 18,
      cd: 0,
      heat: 3,
      dt: 'Impact',
      isBlock: true,
      desc: "Hold to brace Balmung's broad fuller. Siegfried's Riposte: Perfect Block (0.34s window) against any melee strike automatically triggers an immediate counter-cleave.",
    },
    {
      name: 'Ragnarok Deep-Forge Sundering',
      dmg: 42,
      cd: 9.2,
      heat: 26,
      dt: 'Impact',
      desc: 'Unstoppable two-handed dragon-slayer plunge that splits heavy construct plating.',
    },
  ],
});

/**
 * Backward-compatible alias for `avalon_siege_lance` resolving directly to Belldor's sole Legendary, `Excalibur`.
 */
export const avalonSiegeLanceWeapon: WeaponDefinition = {
  ...legExcaliburWeapon,
  id: 'avalon_siege_lance',
};
