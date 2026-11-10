/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import { classifyWeaponCombatArchetype } from '../../database/equipment/weapons';
import {
  ActionDefinition,
  ActionEffectStyle,
  OrionCombatContext,
  OrionState,
  WeaponDefinition,
} from '../../types';
import {
  getCombatAimVector,
  isTargetInDirectionalArc,
  isTargetInImpactZone,
  isTargetInThrustCorridor,
  triggerEntityFlash,
} from './combatHelpers';
import { applyDamageToLayers } from './damageSystem';

/**
 * Semantic movement behavior enacted when a skill triggers.
 */
export type SkillMovementKind =
  | 'none'
  | 'lunge_dash'
  | 'aerial_vault_leap'
  | 'evasive_backstep';

/**
 * Semantic target displacement or guard-interaction behavior enacted on hit.
 */
export type SkillDisplacementKind =
  | 'standard'
  | 'hook_pull'
  | 'shield_bypass'
  | 'heavy_shove';

/**
 * Semantic payload geometry enacted by the skill.
 */
export type SkillPayloadKind =
  | 'standard'
  | 'thrown_spear_or_axe'
  | 'returning_chakram_disc'
  | 'piercing_beam_lance'
  | 'mortar_meteor_lob'
  | 'omnidirectional_nova_whirlwind'
  | 'multi_flurry';

/**
 * Complete resolved behavioral profile for a weapon skill (`Slots 1–4` / Actions 2–5),
 * derived from its authored name, description, weapon category, and functional type.
 */
export interface ResolvedSkillBehaviorProfile {
  movementKind: SkillMovementKind;
  displacementKind: SkillDisplacementKind;
  payloadKind: SkillPayloadKind;
  /** Visual trail / hardpoint animation style */
  visualStyle: ActionEffectStyle;
  /** Shield damage multiplier for guard-tearing hooks (`1.0` default, `2.25` on hook/wrench skills) */
  guardBreakShieldMult: number;
  /** Fraction of damage that bypasses Layer 1 Shields directly to Armor/Frame (`0` default, `0.5` on bypass skills) */
  shieldBypassRatio: number;
  /** Extra Armor durability dent applied on hit */
  extraArmorDent: number;
  /** Knockback/pull scale multiplier */
  knockbackScale: number;
  /** Number of thrown/fired projectiles for thrown spears/axes, chakrams, or mortar clusters */
  projectileCount: number;
  /** True if the skill also grants a self-shield/heat/brace support pulse */
  grantsSupportPulse: boolean;
  /** Short tactical callout label shown on activation or impact */
  calloutLabel?: string;
}

/**
 * Parses a weapon skill's authored `name`, `description`, and `WeaponDefinition` archetype
 * to produce a deterministic `ResolvedSkillBehaviorProfile` that enacts every described
 * movement, hook/pull, shield-bypass, thrown/returning projectile, beam, mortar, and zone mechanic.
 * Does not mutate `state: OrionState`.
 */
export function resolveSkillBehaviorProfile(
  weapon: WeaponDefinition | undefined,
  skill: ActionDefinition,
  slotIndex: 1 | 2 | 3 | 4
): ResolvedSkillBehaviorProfile {
  const arch = classifyWeaponCombatArchetype(weapon, weapon?.id);
  const text = `${skill.name} ${skill.description}`.toLowerCase();
  const ft = arch.functionalType.toLowerCase();

  // 1. Movement Kind: Evasive Backstep vs Aerial Vault/Leap vs Forward Lunge/Dash
  let movementKind: SkillMovementKind = 'none';
  if (
    text.includes('backstep') ||
    text.includes('hop backward') ||
    text.includes('vault clear') ||
    text.includes('peltast vault') ||
    text.includes('retreat') ||
    text.includes('backwash') ||
    text.includes('blast-jump') ||
    text.includes('recoil-hop') ||
    text.includes('ground-step') ||
    text.includes('vent step') ||
    text.includes('step out') ||
    text.includes('phase-shift') ||
    text.includes('cinder shroud') ||
    (slotIndex === 3 && !skill.isBlock && !arch.isMeleeOrShield)
  ) {
    movementKind = 'evasive_backstep';
  } else if (
    text.includes('vault') ||
    text.includes('leap') ||
    text.includes('sky-') ||
    text.includes('heaven-to-earth') ||
    text.includes('meteor') ||
    text.includes('downdraft') ||
    text.includes('drop') ||
    text.includes('dive')
  ) {
    movementKind = 'aerial_vault_leap';
  } else if (
    text.includes('step-in') ||
    text.includes('dash') ||
    text.includes('glide') ||
    text.includes('sprint') ||
    text.includes('charge') ||
    text.includes('battering ram') ||
    text.includes('lunge') ||
    text.includes('dart') ||
    text.includes('outrider') ||
    text.includes('cavalry wedge') ||
    text.includes('corsair') ||
    text.includes('rush') ||
    text.includes('bowl through')
  ) {
    movementKind = 'lunge_dash';
  }

  // 2. Displacement & Guard Interaction: Hook/Pull vs Shield Bypass vs Heavy Shove
  let displacementKind: SkillDisplacementKind = 'standard';
  let guardBreakShieldMult = 1.0;
  let shieldBypassRatio = arch.hasShieldBypassEdge ? 0.25 : 0;
  let extraArmorDent = slotIndex === 4 ? 4 : slotIndex === 2 ? 3 : 2;
  let knockbackScale = 1.0;

  if (
    text.includes('hook') ||
    text.includes('snag') ||
    text.includes('wrench') ||
    text.includes('drag') ||
    text.includes('pull') ||
    text.includes('shield-tear') ||
    text.includes('implosion') ||
    text.includes('undertow') ||
    text.includes('disarm') ||
    text.includes('trap an incoming') ||
    text.includes('expose their')
  ) {
    displacementKind = 'hook_pull';
    guardBreakShieldMult = 2.25;
    extraArmorDent += 2;
    knockbackScale = 0.85;
  } else if (
    text.includes('bypass') ||
    text.includes('around shield') ||
    text.includes('around frontal') ||
    text.includes('behind the target') ||
    text.includes('over the top edge') ||
    text.includes('over-the-shield') ||
    text.includes('ignore frontal') ||
    text.includes('kidney-hook') ||
    text.includes('throat slice') ||
    ft === 'shotel'
  ) {
    displacementKind = 'shield_bypass';
    shieldBypassRatio = 0.55;
    extraArmorDent += 2;
  } else if (
    text.includes('shove') ||
    text.includes('push back') ||
    text.includes('knock back') ||
    text.includes('knocks rushing') ||
    text.includes('battering ram') ||
    text.includes('wall press') ||
    text.includes('counter-slam') ||
    text.includes('shockwave') ||
    text.includes('thumper') ||
    text.includes('crushes enemy poise')
  ) {
    displacementKind = 'heavy_shove';
    guardBreakShieldMult = 1.5;
    extraArmorDent += 3;
    knockbackScale = 1.65;
  }

  // 3. Payload Kind: Thrown Spear/Axe vs Returning Disc vs Piercing Beam vs Mortar Lob vs 360 Whirlwind vs Multi-Flurry
  let payloadKind: SkillPayloadKind = 'standard';
  let projectileCount = skill.ammoCount || 1;

  if (
    arch.isMeleeOrShield &&
    (text.includes('hurl') ||
      text.includes('amentum') ||
      text.includes('sky-spear') ||
      text.includes('throwing') ||
      text.includes('bend pin') ||
      (ft === 'javelin' && (slotIndex === 1 || slotIndex === 2 || slotIndex === 4)) ||
      (ft === 'tomahawk' && text.includes('throw')))
  ) {
    payloadKind = 'thrown_spear_or_axe';
    projectileCount = text.includes('three') || text.includes('volley') ? 3 : 1;
  } else if (
    text.includes('boomerang') ||
    text.includes('chakram') ||
    text.includes('returning') ||
    text.includes('gyro') ||
    ((ft === 'disc' || ft === 'corona' || ft === 'rhom') &&
      (text.includes('throw') || text.includes('hurl') || text.includes('sling') || slotIndex === 4))
  ) {
    payloadKind = 'returning_chakram_disc';
    projectileCount = slotIndex === 4 ? 2 : 1;
  } else if (
    text.includes('beam') ||
    text.includes('ray') ||
    text.includes('focal lens') ||
    text.includes('thermal bore') ||
    text.includes('overburn') ||
    text.includes('star-fire') ||
    text.includes('syzygy') ||
    text.includes('quasar') ||
    text.includes('moonlight crescent') ||
    text.includes('vacuum wave') ||
    text.includes('pierce multiple targets in a line')
  ) {
    payloadKind = 'piercing_beam_lance';
    projectileCount = slotIndex === 4 ? 2 : 1;
  } else if (
    text.includes('bolide') ||
    text.includes('chondrite') ||
    text.includes('cluster') ||
    text.includes('downdraft') ||
    text.includes('extinction fall') ||
    text.includes('mortar') ||
    text.includes('howitzer') ||
    text.includes('thermobaric') ||
    text.includes('lob ') ||
    text.includes('craters') ||
    text.includes('orbital')
  ) {
    payloadKind = 'mortar_meteor_lob';
    projectileCount =
      text.includes('three') || text.includes('cluster') || slotIndex === 4 ? 3 : 1;
  } else if (
    text.includes('full-rotation') ||
    text.includes('horizon-severing') ||
    text.includes('omnidirectional') ||
    text.includes('cataclysmic nova') ||
    text.includes('ring expansion') ||
    text.includes('fortress shockwave') ||
    text.includes('wide radius') ||
    text.includes('all nearby') ||
    text.includes('surrounding')
  ) {
    payloadKind = 'omnidirectional_nova_whirlwind';
  } else if (
    text.includes('five-petal') ||
    text.includes('four-stroke') ||
    text.includes('crescent gale') ||
    text.includes('double-tap') ||
    text.includes('twin diagonal') ||
    text.includes('strikes twice') ||
    text.includes('flurry')
  ) {
    payloadKind = 'multi_flurry';
  }

  // 4. Support / Defensive Self-Buff Pulse
  const grantsSupportPulse = Boolean(
    text.includes('riposte stance') ||
      text.includes('pressure shunt') ||
      text.includes('buffer') ||
      text.includes('clear heat') ||
      text.includes('clearing heat') ||
      text.includes('sanctuary') ||
      text.includes('aegis') ||
      text.includes('coronal mass') ||
      movementKind === 'evasive_backstep'
  );

  // 5. Visual Trail & Hardpoint Style
  let visualStyle: ActionEffectStyle = 'slash';
  if (payloadKind === 'omnidirectional_nova_whirlwind') {
    visualStyle = arch.isMelee ? 'whirlwind' : 'shockwave';
  } else if (payloadKind === 'mortar_meteor_lob' || displacementKind === 'heavy_shove') {
    visualStyle = arch.isShield ? 'bash' : 'slam';
  } else if (payloadKind === 'piercing_beam_lance') {
    visualStyle = 'thrust';
  } else if (displacementKind === 'hook_pull') {
    visualStyle = 'chop';
  } else if (arch.isSpearOrPolearm || text.includes('thrust') || text.includes('impale') || text.includes('stab') || text.includes('peck')) {
    visualStyle = 'thrust';
  } else if (arch.isShield) {
    visualStyle = 'bash';
  } else if (arch.isImpactOrAxe || text.includes('chop') || text.includes('hew') || text.includes('split')) {
    visualStyle = slotIndex === 4 ? 'slam' : 'chop';
  } else if (!arch.isMeleeOrShield) {
    visualStyle = 'volley';
  }

  const calloutLabel =
    displacementKind === 'hook_pull'
      ? 'HOOK & WRENCH!'
      : displacementKind === 'shield_bypass'
        ? 'GUARD BYPASS!'
        : displacementKind === 'heavy_shove'
          ? 'BULWARK SHOVE!'
          : movementKind === 'evasive_backstep'
            ? 'EVASIVE STEP!'
            : movementKind === 'aerial_vault_leap'
              ? 'VAULT STRIKE!'
              : movementKind === 'lunge_dash'
                ? 'LUNGE!'
                : payloadKind === 'piercing_beam_lance'
                  ? 'PIERCING LANCE!'
                  : payloadKind === 'returning_chakram_disc'
                    ? 'GYRO RETURN!'
                    : payloadKind === 'thrown_spear_or_axe'
                      ? 'BALLISTIC HURL!'
                      : undefined;

  return {
    movementKind,
    displacementKind,
    payloadKind,
    visualStyle,
    guardBreakShieldMult,
    shieldBypassRatio,
    extraArmorDent,
    knockbackScale,
    projectileCount,
    grantsSupportPulse,
    calloutLabel,
  };
}

/**
 * Applies the skill's movement impulse (`lunge_dash`, `aerial_vault_leap`, or `evasive_backstep`)
 * and optional support pulse (`grantsSupportPulse`) when the skill payload executes.
 * Mutates `state: OrionState`.
 */
export function applySkillMovementAndSupportImpulse(
  state: OrionState,
  ctx: OrionCombatContext,
  profile: ResolvedSkillBehaviorProfile,
  aimDx: number,
  aimDy: number,
  trailColor: string
): void {
  if (profile.movementKind === 'lunge_dash') {
    const lungeSpeed = 118;
    state.vx = aimDx * lungeSpeed;
    state.vy = aimDy * lungeSpeed;
    state.knockbackVx = (state.knockbackVx || 0) + aimDx * 42;
    state.knockbackVy = (state.knockbackVy || 0) + aimDy * 42;
    ctx.spawnParticles(state.x, state.y, state.z + 6, 6, trailColor, profile.calloutLabel || '');
  } else if (profile.movementKind === 'aerial_vault_leap') {
    const leapSpeed = 96;
    state.vx = aimDx * leapSpeed;
    state.vy = aimDy * leapSpeed;
    state.z = Math.max(state.z, 6);
    state.vz = Math.max(state.vz || 0, 38);
    ctx.spawnParticles(state.x, state.y, state.z + 8, 8, trailColor, profile.calloutLabel || '');
  } else if (profile.movementKind === 'evasive_backstep') {
    const backstepSpeed = 112;
    state.vx = -aimDx * backstepSpeed;
    state.vy = -aimDy * backstepSpeed;
    state.knockbackVx = (state.knockbackVx || 0) - aimDx * 38;
    state.knockbackVy = (state.knockbackVy || 0) - aimDy * 38;
    state.z = Math.max(state.z, 4);
    state.vz = Math.max(state.vz || 0, 22);
    state.blockTimer = Math.max(state.blockTimer || 0, 0.28);
    ctx.spawnParticles(state.x, state.y, state.z + 6, 6, '#38bdf8', profile.calloutLabel || '');
  }

  if (profile.grantsSupportPulse) {
    state.heat = Math.max(0, state.heat - 9);
    state.shields.overloaded = false;
    state.shields.capacity = Math.min(
      state.shields.maxCapacity,
      state.shields.capacity + 14
    );
    state.blockTimer = Math.max(state.blockTimer || 0, 0.45);
  }
}

/**
 * Executes specialized description-driven payloads (`thrown_spear_or_axe`, `returning_chakram_disc`,
 * `piercing_beam_lance`, `mortar_meteor_lob`) so skills that promise ballistic throws, returning discs,
 * piercing line beams, or high-angle mortar craters enact those exact mechanics on the battlefield.
 * Returns `true` if a specialized ranged/hybrid payload was fully handled, or `false` to continue with
 * standard melee/ranged execution enhanced by `profile`.
 */
export function executeSpecializedSkillPayload(
  state: OrionState,
  ctx: OrionCombatContext,
  weapon: WeaponDefinition | undefined,
  skill: ActionDefinition,
  profile: ResolvedSkillBehaviorProfile,
  skillDamage: number,
  trailColor: string,
  coreColor: string
): boolean {
  const aim = getCombatAimVector(state);
  const aimAngle = Math.atan2(aim.dy, aim.dx);
  state.bladeTrails = state.bladeTrails || [];

  // 1. THROWN SPEAR OR AXE (e.g. Javelin Amentum Hurl, Sky-Spear Volley, Soft-Iron Bend Pin, Tomahawk Hurl)
  if (profile.payloadKind === 'thrown_spear_or_axe') {
    const count = Math.max(1, profile.projectileCount);
    const perProjDmg =
      count === 1 ? skillDamage : Math.max(12, Math.round((skillDamage * 1.25) / count));
    const speed = 158;

    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: aimAngle,
      arcSpan: Math.PI * 0.35,
      radius: 22,
      length: 28,
      width: 12,
      style: 'thrust',
      color: trailColor,
      coreColor,
      life: 0.24,
      maxLife: 0.24,
    });

    for (let i = 0; i < count; i++) {
      const spread = count === 1 ? 0 : (i - (count - 1) / 2) * 0.12;
      const ang = aimAngle + spread;
      state.projectiles.push({
        x: state.x + Math.cos(ang) * 10,
        y: state.y + Math.sin(ang) * 10,
        z: state.z + 7,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        vz: count > 1 ? 8 : 4,
        damage: perProjDmg,
        damageType: skill.damageType,
        isPlayer: true,
        life: 0.95,
        radius: 4.5,
        color: trailColor,
        trailColor: coreColor,
        lightRadius: 22,
        projectileWeight: 18,
        projectileSpeed: speed,
        onImpact: (ix, iy, iz, st) => {
          // Pin/snare effect on thrown javelin/axe impact
          for (const e of st.enemies) {
            if (Math.hypot(e.x - ix, e.y - iy) < 20) {
              e.stun = Math.max(e.stun, 0.42);
              e.armor.durability = Math.max(0, e.armor.durability - profile.extraArmorDent);
            }
          }
          ctx.spawnParticles(ix, iy, iz + 6, 7, trailColor, profile.calloutLabel || 'PINNED!');
        },
      });
    }
    soundSystem.playSword();
    soundSystem.playLaser();
    return true;
  }

  // 2. RETURNING CHAKRAM / BOOMERANG DISC (e.g. Disc / Corona / Chakram Returning Throw)
  if (profile.payloadKind === 'returning_chakram_disc') {
    const count = Math.max(1, profile.projectileCount);
    const perDiscDmg = Math.max(16, Math.round((skillDamage * 0.85) / count));
    const speed = 136;

    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: aimAngle,
      arcSpan: Math.PI * 0.85,
      radius: 24,
      style: 'slash',
      color: trailColor,
      coreColor,
      life: 0.26,
      maxLife: 0.26,
    });

    for (let i = 0; i < count; i++) {
      const spread = count === 1 ? 0 : (i - (count - 1) / 2) * 0.22;
      const ang = aimAngle + spread;
      const vx0 = Math.cos(ang) * speed;
      const vy0 = Math.sin(ang) * speed;
      state.projectiles.push({
        x: state.x + Math.cos(ang) * 10,
        y: state.y + Math.sin(ang) * 10,
        z: state.z + 6,
        vx: vx0,
        vy: vy0,
        vz: 0,
        damage: perDiscDmg,
        damageType: skill.damageType,
        isPlayer: true,
        life: 0.78,
        radius: 5.0,
        color: trailColor,
        trailColor: coreColor,
        lightRadius: 24,
        projectileWeight: 16,
        projectileSpeed: speed,
        onImpact: (ix, iy, iz, st) => {
          // Spawn the returning boomerang pass back toward the pilot!
          const rdx = st.x - ix;
          const rdy = st.y - iy;
          const rNorm = Math.hypot(rdx, rdy) || 1;
          st.projectiles.push({
            x: ix + (rdx / rNorm) * 8,
            y: iy + (rdy / rNorm) * 8,
            z: iz,
            vx: (rdx / rNorm) * speed,
            vy: (rdy / rNorm) * speed,
            vz: 0,
            damage: Math.round(perDiscDmg * 0.75),
            damageType: skill.damageType,
            isPlayer: true,
            life: 0.65,
            radius: 4.5,
            color: coreColor,
            trailColor: trailColor,
            lightRadius: 20,
            projectileWeight: 14,
            projectileSpeed: speed,
          });
          ctx.spawnParticles(ix, iy, iz + 6, 6, trailColor, 'RETURN ARC!');
        },
      });
    }
    soundSystem.playSword();
    return true;
  }

  // 3. PIERCING BEAM LANCE / VACUUM WAVE (e.g. Beam Caster, Stellar Caster, Katana Moonlight Crescent)
  if (payloadKindIsPiercingBeam(profile, weapon)) {
    const beamLength = Math.max(54, Math.min(148, skill.range || 96));
    const beamWidth = skill.slot === 4 ? 20 : 15;

    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: aimAngle,
      arcSpan: Math.PI * 0.24,
      radius: beamLength,
      length: beamLength,
      width: beamWidth,
      style: 'thrust',
      color: trailColor,
      coreColor: '#ffffff',
      life: 0.34,
      maxLife: 0.34,
    });

    for (const e of state.enemies) {
      if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
      if (
        isTargetInThrustCorridor(
          state.x,
          state.y,
          aimAngle,
          beamLength,
          beamWidth,
          e.x,
          e.y
        )
      ) {
        e.hurt = 0.24;
        e.stun = Math.max(e.stun, 0.32);
        applyDamageToLayers(
          e.shields,
          e.armor,
          e.frame,
          skillDamage,
          skill.damageType,
          (cnt, col) => ctx.spawnParticles(e.x, e.y, e.z + 8, cnt, col, ''),
          {
            onFlash: (col, dur, kind) => triggerEntityFlash(e, col, dur, kind),
          }
        );
        soundSystem.playHit();
      }
    }

    // Also emit a high-speed piercing energy wave projectile along the beam axis
    state.projectiles.push({
      x: state.x + aim.dx * 12,
      y: state.y + aim.dy * 12,
      z: state.z + 6,
      vx: aim.dx * 168,
      vy: aim.dy * 168,
      vz: 0,
      damage: Math.round(skillDamage * 0.45),
      damageType: skill.damageType,
      isPlayer: true,
      life: 0.75,
      radius: 5.0,
      color: '#ffffff',
      trailColor,
      lightRadius: 28,
      projectileWeight: 16,
      projectileSpeed: 168,
    });

    ctx.spawnParticles(
      state.x + aim.dx * 22,
      state.y + aim.dy * 22,
      state.z + 8,
      8,
      trailColor,
      profile.calloutLabel || ''
    );
    soundSystem.playLaser();
    return true;
  }

  // 4. MORTAR / METEORIC / THERMOBARIC LOB (e.g. Meteoric Caster, Blast Caster, Ordnance Rack)
  if (profile.payloadKind === 'mortar_meteor_lob') {
    const count = Math.max(1, profile.projectileCount);
    const blastRadius = skill.slot === 4 ? 38 : 28;
    const impactDamage =
      count === 1 ? skillDamage : Math.max(16, Math.round((skillDamage * 1.25) / count));
    const lobSpeed = 104;

    state.bladeTrails.push({
      x: state.x,
      y: state.y,
      z: state.z,
      angle: aimAngle,
      arcSpan: Math.PI * 0.55,
      radius: 18,
      style: 'shockwave',
      color: trailColor,
      coreColor,
      life: 0.25,
      maxLife: 0.25,
    });

    for (let i = 0; i < count; i++) {
      const spread = count === 1 ? 0 : (i - (count - 1) / 2) * 0.18;
      const ang = aimAngle + spread;
      state.projectiles.push({
        x: state.x + Math.cos(ang) * 10,
        y: state.y + Math.sin(ang) * 10,
        z: state.z + 10,
        vx: Math.cos(ang) * lobSpeed,
        vy: Math.sin(ang) * lobSpeed,
        vz: 24 + i * 4,
        damage: impactDamage,
        damageType: skill.damageType,
        isPlayer: true,
        life: 0.88,
        radius: 5.2,
        color: trailColor,
        trailColor: coreColor,
        lightRadius: 28,
        projectileWeight: 24,
        projectileSpeed: lobSpeed,
        onImpact: (ix, iy, iz, st) => {
          st.bladeTrails = st.bladeTrails || [];
          st.bladeTrails.push({
            x: ix,
            y: iy,
            z: Math.max(0, iz),
            angle: 0,
            arcSpan: Math.PI * 2,
            radius: blastRadius,
            innerRadius: 6,
            style: 'shockwave',
            color: trailColor,
            coreColor: '#fde047',
            life: 0.34,
            maxLife: 0.34,
          });
          for (const e of st.enemies) {
            if (e.isSubmerged || (e.type === 'town_npc' && e.npcDisposition !== 'feral')) continue;
            const d = Math.hypot(e.x - ix, e.y - iy);
            if (d <= blastRadius) {
              e.hurt = 0.25;
              e.stun = Math.max(e.stun, 0.38);
              e.armor.durability = Math.max(0, e.armor.durability - 4);
              applyDamageToLayers(
                e.shields,
                e.armor,
                e.frame,
                Math.round(impactDamage * 0.65),
                'Blast',
                (cnt, col) => ctx.spawnParticles(e.x, e.y, e.z + 8, cnt, col, ''),
                {
                  onFlash: (col, dur, kind) => triggerEntityFlash(e, col, dur, kind),
                }
              );
            }
          }
          ctx.spawnParticles(ix, iy, iz + 8, 12, '#fb923c', 'IMPACT CRATER!');
          soundSystem.playExplosion();
        },
      });
    }
    soundSystem.playLaser();
    return true;
  }

  void isTargetInDirectionalArc;
  void isTargetInImpactZone;
  return false;
}

function payloadKindIsPiercingBeam(
  profile: ResolvedSkillBehaviorProfile,
  weapon: WeaponDefinition | undefined
): boolean {
  if (profile.payloadKind !== 'piercing_beam_lance') return false;
  // Trigger piercing line beam for Casters and for Melee vacuum-wave skills (like Katana Moonlight Crescent)
  return Boolean(weapon);
}
