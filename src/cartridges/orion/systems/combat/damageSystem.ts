/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../../engine/core/soundSystem';
import {
  ArmorState,
  DamageType,
  FrameState,
  OrionCombatContext,
  OrionState,
  ShieldState,
} from '../../types';
import {
  computeMeleeImpulse,
  computeMomentumFraction,
  formatInertiaOutcomeLabel,
  resolveEnemyInertiaProfile,
  resolveHitInertia,
  resolvePlayerInertiaProfile,
} from '../inertiaSystem';
import {
  isTargetInDirectionalArc,
  isTargetInImpactZone,
  isTargetInThrustCorridor,
} from './combatHelpers';

export const PERFECT_BLOCK_WINDOW_SEC = 0.25;

// [ORION-ANCHOR: COMBAT-DEFENSE-MATH]
/**
 * Canonical 6 Damage Types (`Impact`, `Pierce`, `Blast`, `Beam`, `Pulse`, `Wave`)
 * × 3 Defense Layers (`Shields`, `Armor` [`Ablative`, `Reactive`, `Hardened`, `Layered`], `Frame Integrity`).
 */
export function applyDamageToLayers(
  shields: ShieldState,
  armor: ArmorState,
  frame: FrameState,
  rawDamage: number,
  damageType: DamageType,
  spawnParticles?: (count: number, color: string, label: string) => void
): { absorbedByShield: number; stoppedByArmor: boolean; frameDamage: number } {
  let remaining = Math.max(1, rawDamage);
  let absorbedByShield = 0;
  let stoppedByArmor = false;
  let frameDamage = 0;

  // 1. SHIELD LAYER (Pulse & Beam disrupt shields; Wave partially bleeds through shields; Pierce is resisted by full shields)
  if (shields.capacity > 0) {
    const shieldEfficiencyMult =
      damageType === 'Pulse'
        ? 1.3
        : damageType === 'Beam'
          ? 1.2
          : damageType === 'Wave'
            ? 1.15
            : damageType === 'Impact'
              ? 1.1
              : damageType === 'Pierce'
                ? 0.85
                : 1.0;

    // Wave (Mana) channels harmonic resonance that bleeds 20% directly past active shields
    let waveBleed = 0;
    if (damageType === 'Wave' && remaining >= 4) {
      waveBleed = Math.max(1, Math.round(remaining * 0.2));
      remaining = Math.max(1, remaining - waveBleed);
    }

    const effectiveShieldDrain = Math.max(1, Math.round(remaining * shieldEfficiencyMult));

    if (effectiveShieldDrain <= shields.capacity) {
      shields.capacity -= effectiveShieldDrain;
      absorbedByShield = remaining;
      remaining = waveBleed;
      shields.rechargeDelay = damageType === 'Pulse' ? 4.0 : 3.0;
      if (remaining === 0) {
        spawnParticles?.(
          4,
          damageType === 'Pulse' ? '#38bdf8' : '#77c7ff',
          damageType === 'Pulse' ? 'PULSE DISRUPT' : 'SHIELD ABSORB'
        );
        return { absorbedByShield, stoppedByArmor: false, frameDamage: 0 };
      }
    } else {
      absorbedByShield = shields.capacity;
      const unabsorbedRatio = Math.max(
        0,
        (effectiveShieldDrain - shields.capacity) / effectiveShieldDrain
      );
      remaining = Math.max(1, Math.round(remaining * unabsorbedRatio)) + waveBleed;
      shields.capacity = 0;
      shields.overloaded = true;
      shields.overloadTimer = damageType === 'Pulse' ? 5.0 : 4.0;
      spawnParticles?.(8, '#77c7ff', 'SHIELD BROKEN!');
    }
  }

  // 2. ARMOR LAYER (Ablative, Reactive, Hardened, Layered vs 6 Damage Types)
  if (armor.durability > 0 && remaining > 0) {
    const armorType = armor.type || 'Reactive';

    // Durability Shred Multiplier: Blast & Impact dent physical plating heavily; Ablative sheds outer layers faster
    let durShredMult =
      damageType === 'Blast'
        ? 0.48
        : damageType === 'Impact'
          ? 0.38
          : damageType === 'Beam'
            ? 0.34
            : 0.26;
    if (armorType === 'Ablative') {
      durShredMult *= 1.25;
    } else if (armorType === 'Hardened' && (damageType === 'Pierce' || damageType === 'Pulse')) {
      durShredMult *= 0.8;
    }

    const durabilityLoss = Math.min(
      armor.durability,
      Math.max(2, Math.round(remaining * durShredMult))
    );
    armor.durability -= durabilityLoss;

    const durRatio = Math.max(0.15, armor.durability / Math.max(1, armor.maxDurability));

    // Armor Threshold & Rating Modifiers by DamageType × ArmorType
    let thresholdMult = 1.0;
    let ratingMult = 1.0;

    if (damageType === 'Pierce') {
      // Pierce (AP bolts, blades, lances) bypasses 35% of Threshold and 30% of Rating
      thresholdMult *= 0.65;
      ratingMult *= 0.7;
    } else if (damageType === 'Blast') {
      // Blast concussive shockwaves ignore 25% of Rating
      ratingMult *= 0.75;
    } else if (damageType === 'Wave') {
      // Wave (Mana) bypasses Hardened physical armor but is refracted by Layered lattice
      if (armorType === 'Hardened') ratingMult *= 0.7;
      if (armorType === 'Layered') {
        thresholdMult *= 1.15;
        ratingMult *= 1.2;
      }
    } else if (damageType === 'Beam' || damageType === 'Pulse') {
      // Layered crystal lattice resists Beam & Pulse; Ablative sheds thermal beams
      if (armorType === 'Layered') {
        thresholdMult *= 1.15;
        ratingMult *= 1.2;
      }
    }

    if (armorType === 'Reactive' && (damageType === 'Impact' || damageType === 'Blast')) {
      // Reactive counter-plating dampens kinetic Impact & Blast
      ratingMult *= 1.2;
    } else if (armorType === 'Hardened' && (damageType === 'Impact' || damageType === 'Pierce')) {
      thresholdMult *= 1.15;
    } else if (armorType === 'Ablative' && durRatio > 0.5) {
      ratingMult *= 1.15;
    }

    const effThreshold = armor.threshold * durRatio * thresholdMult;
    const effRating = armor.rating * durRatio * ratingMult;

    if (remaining < effThreshold) {
      stoppedByArmor = true;
      spawnParticles?.(5, '#ffd27d', 'ARMOR DEFLECT');
      return { absorbedByShield, stoppedByArmor: true, frameDamage: 0 };
    }

    remaining = Math.max(1, remaining - effRating);
    spawnParticles?.(
      5,
      '#ffd27d',
      damageType === 'Blast' ? 'ARMOR SHREDDED' : 'ARMOR PIERCED'
    );
  }

  // 3. FRAME INTEGRITY LAYER
  if (remaining > 0) {
    frameDamage = Math.round(remaining);
    frame.integrity = Math.max(0, frame.integrity - frameDamage);

    if (frame.integrity <= 0) {
      frame.state = 'Defeated';
      spawnParticles?.(12, '#ff9b9b', 'FRAME DESTROYED');
    } else if (frame.integrity <= 40) {
      frame.state = 'Critical';
      spawnParticles?.(8, '#ff9b9b', `CRITICAL! -${frameDamage}`);
    } else {
      frame.state = 'Operational';
      spawnParticles?.(6, '#8dd7ad', `-${frameDamage} FRAME`);
    }
  }

  return { absorbedByShield, stoppedByArmor, frameDamage };
}

/**
 * Resolves enemy melee/lunge/slam strikes against the player, including Perfect Block, Held Guard,
 * and Inertia v0 impulse/displacement/stagger resolution.
 */
export function resolveEnemyMeleeAttacks(
  state: OrionState,
  ctx: OrionCombatContext
): void {
  for (const e of state.enemies) {
    if (e.type === 'bog_poe') continue;
    if (e.type === 'town_npc' && e.npcDisposition !== 'feral') continue;
    if (e.type === 'orc_scout' || e.type === 'tristan_knight') continue;

    if (
      e.state === 'attack' &&
      e.stateTimer > 0.08 &&
      !e.hasStruckThisAttack &&
      !state.isBoosterDashing
    ) {
      const ang = e.attackAngle ?? Math.atan2(state.y - e.y, state.x - e.x);
      let isHit = false;

      if (e.type === 'bors_knight') {
        if (e.enraged) {
          // Enraged Sir Bors: Long linear piercing execution lunge corridor
          isHit = isTargetInThrustCorridor(e.x, e.y, ang, 34, 13, state.x, state.y);
        } else {
          // Normal Sir Bors: Heavy frontal mace/maul slam impact zone
          isHit = isTargetInImpactZone(e.x, e.y, ang, 12, 20, state.x, state.y);
        }
      } else if (e.type === 'percival_knight') {
        // Sir Percival: Wide directional shield-wall charge bash
        isHit = isTargetInDirectionalArc(e.x, e.y, ang, 26, Math.PI * 0.8, state.x, state.y);
      } else if (e.type === 'orc_warrior') {
        // Orc Warrior: Heavy frontal boarding-axe chop & shield brawl sector
        isHit = isTargetInDirectionalArc(e.x, e.y, ang, 24, Math.PI * 0.85, state.x, state.y);
      } else if (e.type === 'bog_crawler') {
        // Bog Crawler: Narrow mandible/claw ambush lunge cone
        isHit = isTargetInDirectionalArc(e.x, e.y, ang, 22, Math.PI * 0.65, state.x, state.y);
      } else if (e.type === 'bog_wurm' || e.type === 'lady_of_the_lake') {
        // Bog Wurm / Lady of the Lake: Bio-electric pulse ring + fang strike
        isHit = Math.hypot(state.x - e.x, state.y - e.y) <= 25;
      } else {
        // Feral Town NPC (Loyalist sword slash or Scavenger chop)
        isHit = isTargetInDirectionalArc(
          e.x,
          e.y,
          ang,
          e.isLoyalist ? 23 : 21,
          e.isLoyalist ? Math.PI * 0.85 : Math.PI * 0.65,
          state.x,
          state.y
        );
      }

      if (isHit) {
        e.hasStruckThisAttack = true;
        e.stateTimer = 0.05;
        let hitDamage = e.damage;
        if (e.type === 'bors_knight') {
          e.hitsLanded = (e.hitsLanded || 0) + 1;
          hitDamage = Math.round(e.damage * (1 + 0.1 * (e.hitsLanded - 1)));
        }

        // Active Skill 4 Held Block mitigation (0.25s Perfect Block window vs Standard Held Block)
        if (state.isHoldingBlock || (state.blockTimer || 0) > 0) {
          const isShieldBlock = Boolean(
            state.blockingWeaponId && state.blockingWeaponId.includes('shield')
          );
          const isPerfectBlock = (state.blockHoldTimer ?? 0) <= PERFECT_BLOCK_WINDOW_SEC;

          if (isPerfectBlock) {
            // 0.25s Perfect Block: 0 damage taken, heavy parry stagger, shield restore & heat vent!
            e.stun = Math.max(e.stun, isShieldBlock ? 1.85 : 1.55);
            state.shields.overloaded = false;
            state.shields.capacity = Math.min(
              state.shields.maxCapacity,
              state.shields.capacity + (isShieldBlock ? 22 : 14)
            );
            state.heat = Math.max(0, state.heat - 14);
            soundSystem.playPowerup();
            soundSystem.playSword();
            ctx.spawnParticles(
              state.x,
              state.y,
              state.z + 10,
              12,
              '#facc15',
              'PERFECT BLOCK!'
            );
            continue;
          }

          const blockedDamage = Math.max(
            0,
            Math.round(hitDamage * (isShieldBlock ? 0.15 : 0.28))
          );
          e.stun = Math.max(e.stun, isShieldBlock ? 0.95 : 0.7);
          soundSystem.playSword();
          ctx.spawnParticles(
            state.x,
            state.y,
            state.z + 8,
            7,
            '#38bdf8',
            'BLOCKED'
          );
          if (blockedDamage > 0) {
            applyDamageToLayers(
              state.shields,
              state.armor,
              state.frame,
              blockedDamage,
              e.damageType
            );
          }
          continue;
        }

        // Resolve Enemy Melee / Charge / Slam Inertia on Player (§4, §6, §10 of `inertia-v0.md`)
        const eProf = resolveEnemyInertiaProfile(e);
        const impDx = Math.cos(ang);
        const impDy = Math.sin(ang);
        // Enemies lunging/charging into their attack (Percival shield rush, Bors lunge) carry forward momentum μ
        const enemyAttackMu =
          e.type === 'percival_knight' || (e.type === 'bors_knight' && e.enraged)
            ? 0.9
            : Math.max(0.25, e.currentMu || 0);
        const impulseJ = computeMeleeImpulse(
          eProf.attackWeight,
          eProf.attackSpeed,
          eProf.baseWeight,
          enemyAttackMu,
          eProf.commitment
        );

        const playerProf = resolvePlayerInertiaProfile(state);
        // Directional Charge Bonus (§6): only applies while player is moving TOWARD the incoming hit!
        const playerDefenderMu = computeMomentumFraction(
          state.vx,
          state.vy,
          e.x - state.x,
          e.y - state.y
        );
        const inertiaRes = resolveHitInertia({
          impulseJ,
          defenderWeight: playerProf.totalBaseWeight,
          defenderMu: playerDefenderMu,
          defenderStability: playerProf.stability,
        });

        state.knockbackVx =
          (state.knockbackVx || 0) + impDx * inertiaRes.displacementSpeedPx;
        state.knockbackVy =
          (state.knockbackVy || 0) + impDy * inertiaRes.displacementSpeedPx;
        state.lastInertiaOutcome = inertiaRes.outcome;
        state.lastInertiaOutcomeTimer = 0.75;
        state.lastImpactDv = inertiaRes.dv;
        state.lastImpactDvEff = inertiaRes.dvEff;
        state.hitstopTimer = Math.max(state.hitstopTimer || 0, inertiaRes.hitstopSec);

        if (inertiaRes.outcome === 'none') {
          // Charging heavy / high-stability frame shrugged off the hit inside k1·S deadband!
          ctx.spawnParticles(state.x, state.y, state.z + 12, 4, '#94a3b8', 'BRACED (CHARGE)');
        } else if (inertiaRes.outcome === 'flinch') {
          state.staggerRecoveryTimer = Math.max(
            state.staggerRecoveryTimer || 0,
            inertiaRes.recoverySec
          );
          state.isContinuousBoosting = false;
          state.isBoosterDashing = false;
          const outFmt = formatInertiaOutcomeLabel('flinch');
          ctx.spawnParticles(state.x, state.y, state.z + 12, 4, outFmt.color, outFmt.label);
        } else {
          // Stagger or Knockback (e.g. Sir Bors big slow hit breaking a charge!)
          state.staggerRecoveryTimer = Math.max(
            state.staggerRecoveryTimer || 0,
            inertiaRes.recoverySec
          );
          state.isContinuousBoosting = false;
          state.isBoosterDashing = false;
          state.glidePhase = 'winddown';
          if (state.skillTellTimer > 0) {
            state.skillTellTimer = 0;
            state.skillActionTimer = 0;
            state.activeSkillSlot = null;
            state.activeActionId = null;
          }
          const outFmt = formatInertiaOutcomeLabel(inertiaRes.outcome);
          ctx.spawnParticles(state.x, state.y, state.z + 12, 6, outFmt.color, outFmt.label);
        }

        soundSystem.playHit();
        applyDamageToLayers(
          state.shields,
          state.armor,
          state.frame,
          hitDamage,
          e.damageType,
          (count, color, label) => ctx.spawnParticles(state.x, state.y, state.z + 8, count, color, label)
        );
      }
    }
  }
}
