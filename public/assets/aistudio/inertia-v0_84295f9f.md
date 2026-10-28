# PROJECT ORION — INERTIA SYSTEM
### Weight, Momentum, Stability, and Hit Reaction — Simplified Physics Model
*Version: 0.1 | Updated: 2026-10-28 | Status: Active*

---

## HOW TO USE THIS DOCUMENT

This document is self-contained. It does not require any other Project Orion file. Section 1 gives the minimum game context needed. Everything else is the inertia system itself.

Scope is **inertia only**: how hits, recoil, and movement state combine to push, stagger, or ignore a mech. Glide handling, the stationary "Anchored" state, stealth, buffs/feats/mods, and hyper armor are explicitly out of scope (see §10).

Every claim carries a source tag. Do not treat PROPOSED material as decided.

---

## STATUS KEY

| Label | Meaning |
|---|---|
| LOCKED | Finalized. Do not revise without explicit design session. |
| PROPOSED | Under discussion. Pending confirmation. |
| DERIVED | Not explicitly decided — inferred from other locked documentation. |
| UNDEFINED | Known gap. Not yet resolved. Blocks dependent systems. |

## SOURCE TAGS

| Tag | Meaning |
|---|---|
| [A] | Stated by the design author in this working session |
| [P1] | Stated in Project Orion documentation (Tier 1 for this project) |
| [PHYS] | Standard classical mechanics, unsourced here (Tier 4 under the author's rubric; every equation is unit-checkable) |
| [INF] | Inferred by the drafting assistant; needs author confirmation |

---

## TABLE OF CONTENTS

1. [Context](#1-context)
2. [Author Design Intent](#2-author-design-intent)
3. [Physics Basis](#3-physics-basis)
4. [Model](#4-model)
5. [Stability](#5-stability)
6. [Charge Modifier and Rock-Paper-Scissors](#6-charge-modifier-and-rock-paper-scissors)
7. [Recoil](#7-recoil)
8. [Player Legibility Requirements](#8-player-legibility-requirements)
9. [Validation Properties](#9-validation-properties)
10. [Parked Items and Known Interactions](#10-parked-items-and-known-interactions)
11. [Open Decisions](#11-open-decisions)
12. [Glossary Candidates](#12-glossary-candidates)

---

## 1. CONTEXT

*DERIVED*

- Project Orion is a mobile isometric magitech mech action game with persistent, MOBA-inspired action combat. [P1]
- PvP and PvE share identical rules. No separate PvP modifiers. (The Unification Law.) [P1]
- Movement is a glide system using latent magic currents. The player does not walk. [A]
- Frames have weight classes: light, medium, heavy, superheavy. Weapons have weight classes: light, medium, heavy. No numeric weights exist yet. [P1]
- A Stability stat already exists, defined as "recoil absorption, stagger resistance, recovery from impacts," and described as derived from armor + weight. [P1]
- Damage is a separate system: Base Combat Unit (BCU) = 54 damage per reference weapon chain; frame integrity is 200; armor uses a threshold / rating / durability model. [P1]
- **Inertia must not change damage numbers.** It governs displacement, interruption, and recovery only. This keeps all BCU validation intact. [INF]
- Relevant design laws: every ability has a visible tell (Law 1); CC durations are fixed and identical in PvE and PvP (Law 2); stats are marginal and action is primary (Law 6, PROPOSED). [P1]
- Meta stats are not displayed to the player; only visible state is. [P1]

---

## 2. AUTHOR DESIGN INTENT

*PROPOSED — author-stated*

1. Movement weight and recovery frames are the first systems that give the game a "mech" feel. [A]
2. Heavier frames reach close to the same top speed as lighter ones, but handle worse. [A]
3. Heavier frames suffer less movement restriction while attacking, most noticeably with heavier weapons. This also accounts for recoil. [A]
4. Poise is not wanted as a stat. Pseudo-poise is "weight vs weight." [A]
5. Each attack has a speed and a weight, giving it an inertia. The character also has inertia. [A]
6. Ranged attacks do **not** include shooter weight in outgoing force. If recoil exists, shooter weight is not applicable to the shot. [A]
7. Recoil restriction depends on frame weight: a heavier frame absorbs more. [A]
8. A frame stability value is required. Heavier frames are likely more stable, but this is not guaranteed. A superheavy simply takes a hit better. Spells, skills, and hyper armor may modify this later. [A]
9. A charging heavy gains a resistance modifier. [A]
10. The system should work as "dynamic rock paper scissors." [A]
11. It must be simple enough for a player to understand without learning physics. [A]
12. All values must be modifiable by buffs, feats, mods, and similar sources, because the Marauder lore allows a stationary "doom machine" build. (Hooks only; see §10.) [A]
13. Historic feat tiers do not need to be considered. [A]

---

## 3. PHYSICS BASIS

*DERIVED*

[PHYS] Simplified classical mechanics:

```
momentum        p = m · v
impulse         J = Δp
velocity change Δv = J / m
recoil          Δv_shooter = −(m_projectile · v_projectile) / m_shooter
                (conservation of momentum)
```

Key observation [INF]: one rule, `Δv = J / m`, covers hits, recoil, and knockback.

**Intentional departure from physics [A]:** in real mechanics a defender's own velocity affects only relative velocity and gives no resistance bonus. This system deliberately gives a defender who is charging into a hit a resistance bonus (§6).

Terminology: "weight" in this document means mass.

---

## 4. MODEL

*PROPOSED*

### Variables

| Symbol | Meaning |
|---|---|
| `m` | Weight of a body or object (frame, attack, projectile) |
| `v` | Speed along the relevant axis |
| `μ` | Forward momentum fraction, 0 to 1. `μ = clamp(speed_toward_incoming_hit / reference_speed, 0, 1)`. Zero when moving away or sideways. |
| `S` | Frame stability (§5) |
| `k1`, `k2` | Tuning constants. UNDEFINED. |

`reference_speed` is UNDEFINED (OD-INR-01).

### Equations

```
Defender effective weight
  m_eff = m_defender × (1 + μ_defender)

Melee impulse
  attack_mass_eff = attack_weight + attacker_frame_weight × μ_attacker
  J_melee         = attack_mass_eff × attack_speed

Ranged impulse
  J_ranged = projectile_weight × projectile_speed
  (no shooter term)

Hit reaction
  Δv       = J / m_eff
  Δv_eff   = max(0, Δv − k1·S)
  recovery = Δv_eff / (k2·S)
  outcome  = band(Δv_eff)   →  none | flinch | stagger | knockback
```

### Notes

- Both sides of a melee hit use the same shape: a base weight plus a momentum-scaled bonus. [INF]
- A restitution (bounce) factor was considered and folded into tuning for simplicity. Whether it should vary per attack is OD-INR-08. [INF]
- Band thresholds are UNDEFINED (OD-INR-03).
- Whether `recovery` is continuous (as above) or snapped to fixed values is UNDEFINED (OD-INR-09). See §10 for the conflict with fixed CC durations.

---

## 5. STABILITY

*PROPOSED*

`S` is a separate, modifiable value. It is **not** simply frame weight, so that a light frame can be built stable and a heavy frame is only *likely* to be.

| Axis | Controlled by | Effect |
|---|---|---|
| Displacement | Weight (`m`) | How hard the body is pushed |
| Reaction | Stability (`S`) | Whether the body reacts at all, and how fast it recovers |

Consequences [INF]:

- A superheavy gets both benefits by default.
- A light frame with high `S` is pushed far but recovers fast.
- A single `S` drives both jobs (deadband and recovery) via two constants. Splitting into two values is deferred unless playtesting requires it. [A, decision accepted]

Default derivation: from frame weight plus components (armor, stabilizers). Exact function UNDEFINED (OD-INR-06). [P1 says "derived from armor + weight"]

---

## 6. CHARGE MODIFIER AND ROCK-PAPER-SCISSORS

*PROPOSED — triangle confirmed by author*

The charge bonus is **directional**: it applies only while moving into the incoming hit. A frame fleeing or sidestepping has `μ = 0`. [A, INF]

| Beats | Because | Loses to |
|---|---|---|
| Charging heavy | Small hits fall under the stability deadband and the charge bonus raises `m_eff` | A big slow hit |
| Big slow hit | Enough `J` to overcome the charge bonus | Evasion or sidestep (the hit has a readable tell) |
| Evasion or sidestep | Charge direction is fixed; off-axis, `μ` drops to 0 | Charging heavy |

Triangle: [A]. Mapping onto the equations: [INF].

Caveat [INF]: if `J` were based on relative velocity, a charging defender would take a larger hit and also resist more. To avoid this, `J` uses the attacker's own speed only, and the defender's `μ` carries the entire charge effect.

---

## 7. RECOIL

*PROPOSED*

```
J_recoil          = projectile_weight × projectile_speed
Δv_recoil         = J_recoil / m_shooter_frame
Δv_recoil_eff     = max(0, Δv_recoil − k1·S)
movement_restriction ∝ Δv_recoil_eff / (k2·S)
```

- Uses base frame weight; the charge bonus `μ` is not applied, because there is no incoming hit. [INF]
- Heavier, more stable frames ignore light recoil and recover faster from heavy recoil, producing the author's "less movement restriction while attacking" with no special-case rule. [A, INF]

---

## 8. PLAYER LEGIBILITY REQUIREMENTS

*PROPOSED*

The player should be able to learn three rules from play, with no numbers shown:

1. Charging makes you hard to push.
2. Big slow hits break a charge.
3. Sidestepping beats a charge.

This requires [INF]:

- Distinct visible outcomes for shrugged-off, flinch, stagger, and knockback.
- A visible charge state, so a mid-charge heavy can be recognized.
- Few outcome bands (three outcomes plus "none").

---

## 9. VALIDATION PROPERTIES

*PROPOSED*

Any implementation or tuning pass must satisfy:

1. Heavier defender → smaller `Δv`, all else equal.
2. Higher `S` → smaller `Δv_eff` and shorter recovery.
3. Defender moving toward the hit → larger `m_eff`.
4. Defender moving away or sideways → no charge bonus.
5. Larger `attack_weight × attack_speed` → larger `J`; values must exist where a big slow hit overcomes a charging heavy.
6. Ranged `J` is independent of shooter weight.
7. Recoil effect decreases as frame weight and `S` increase.
8. Inertia never alters damage dealt or taken.
9. Identical behavior in PvP and PvE.

---

## 10. PARKED ITEMS AND KNOWN INTERACTIONS

*DERIVED — for later sessions; not part of this system*

Parked by author: glide top speed and handling, the stationary "Anchored" state (to be unlocked by a feat, open to any frame), stealth, buff/feat/mod stacking rules, hyper armor.

Known interactions with existing documentation [P1]:

- **Stealth:** the stealth rule is written in terms of "walk speed," which has no meaning under glide movement.
- **Load penalties:** the current load penalty table uses flat mobility percentages; it needs review against the weight model.
- **Stagger and CC immunity feats:** currently binary immunity; they would become modifiers on this model.
- **"Anchored":** used in existing feat text but not defined in the glossary.
- **Enemy attacks:** attacks such as Heavy Strike, Charging Ram, and Shield Bash have no weight or speed fields. Charging Ram and Shield Bash use fixed CC values (0.75 sec knockback recovery, 1.5 sec stun).
- **CC table:** CC durations are fixed and identical in PvE and PvP. A continuous `recovery` formula may conflict with this; see OD-INR-09.
- **Data schemas:** the actor and weapon schemas have no weight or speed fields.

---

## 11. OPEN DECISIONS

| # | Decision | Blocks |
|---|---|---|
| OD-INR-01 | `reference_speed`: each body's own cap, or one global value | `μ` definition; everything downstream |
| OD-INR-03 | Outcome band thresholds on `Δv_eff` | Hit reaction outcomes |
| OD-INR-04 | Numeric weight scale for frames, weapons, attacks, projectiles; and whether frame weight includes loadout | All calculations |
| OD-INR-06 | Derivation of `S` from frame weight and components | Stability values |
| OD-INR-07 | Whether the attacker body term is full or scaled by a commitment factor (poke vs ram) | Melee impulse |
| OD-INR-08 | Restitution: fixed (default) or varying per attack | Melee impulse |
| OD-INR-09 | Recovery: continuous or snapped to fixed values; interaction with fixed CC durations | Hit reaction, Law 2 |
| OD-INR-10 | Constants `k1`, `k2` | Deadband and recovery tuning |

Resolved in working session: OD-INR-02 (momentum is directional, charge bonus retained); OD-INR-05 (single stability value `S`).

---

## 12. GLOSSARY CANDIDATES

*PROPOSED*

| Term | Definition |
|---|---|
| Weight | Mass of a frame, attack, or projectile |
| Impulse (J) | Momentum an attack transfers to a target |
| Momentum fraction (μ) | Forward speed toward an incoming hit as a 0–1 fraction of reference speed |
| Effective weight | Defender weight × (1 + μ) |
| Stability (S) | Frame value that sets the ignore-small-hits threshold and recovery speed |
| Charge | State of moving toward an incoming hit with high μ |

---

*inertia-v0.md | Project Orion internal documentation*
*Version 0.1 — Initial capture of the inertia system. Single stability value, directional charge bonus, rock-paper-scissors triangle, recoil via the same impulse rule. Eight open decisions.*
