# Project Orion — Combat Flash Frames, Positional Accuracy Crits, Smooth Lighting & Contextual Animations

This plan transitions Project Orion's combat readability, lighting atmosphere, and enemy/player telegraphing away from floating text labels and geometric overlays toward visceral fighting-game/Souls-inspired visual flash frames, spatial weapon sweet-spots, smooth radial illumination, and multi-frame physical posture animations.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All four core design choices from Phase 1 have been locked into this plan:

- **Confirmed Decision 1 — Zero Floating Combat Text & Flash-Frame Feedback**: Remove all floating combat text labels (`SHIELD ABSORB`, `ARMOR DEFLECT`, `-14 FRAME`, `BRACED`, `STAGGER`, `MAGAZINE RELOADED`, `BLADE STANCE READY`, etc.) and repetitive combat HUD toast chatter. Replace them with unmistakable color-coded sprite flash frames, hitstop freeze frames, and directional spark bursts.
- **Confirmed Decision 2 — Positional Accuracy ("Sweet-Spot") Critical Hits**: Replace RNG critical rolls with spatial accuracy mechanics based on where the weapon strikes the target (e.g., the tip of a spear/lance, the head of a mace/hammer/axe, the upper cutting sweet-spot of a sword, or the center-line sweet range of a bolt/arrow). Sweet-spot hits grant bonus damage (`1.35x`), heightened armor penetration (ignoring an extra `40%` of Armor Threshold and Rating), a signature white-gold flash frame, and extended hitstop.
- **Confirmed Decision 3 — Simple Smooth Dark-to-Light Gradient**: Replace the blocky 4x4 sub-tile raycast fog grid and dashed perimeter polygons with a cohesive, smooth radial dark-to-light gradient falloff centered on the player and active world light sources (campfires, Poe lanterns, glowing projectiles, and spirits).
- **Confirmed Decision 4 — Remove Ground Cones & Use Multi-Frame Contextual Animations**: Remove the geometric ground telegraph cones/rings under enemies and replace them with multi-frame physical posture animations (`windup_coiling -> windup_apex -> strike_lunge -> recovery_settle`) for both enemies and the player, paired with lore-driven AI behaviors.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Decluttered HUD & Flash-Frame Combat Language**: Frees the 160x144 viewport from floating text strings and redundant status banners so every hit, block, armor deflection, shield break, and sweet-spot critical is read directly from the sprites, hitstop cadence, and flash frames.
  2. **Spatial Weapon Mastery (Tipper / Sweet-Spot Crits)**: Rewards spacing and footwork—pilots who maintain optimal distance for their equipped weapon's geometry land devastating sweet-spot strikes that punch through heavy armor, while crowded sour-spot hits glance off plating.
  3. **Atmospheric Radial Lighting**: Renders darkness as a clean, organic vignette that smoothly transitions from full clarity around light sources into deep marsh shadow.
  4. **Contextual Enemy & Player Physicality**: Conveys enemy intent and lore through body language—Bog Crawlers skittering low before pouncing, Bog Wurms churning mud ripples before erupting, Orc Scouts kiting to draw bows, Orc Warriors beating shields before cleaving, and Grail Knights (Percival, Tristan, Bors) assuming distinct martial stances.

---

## 2. User Experience & Visual Design

### A. Fighting-Game / Souls Flash-Frame Palette
Instead of text strings, entities flash with distinct 2–4 frame full-silhouette color overlays and directional spark geometry:

| Combat Event | Sprite Flash Color | Duration & Hitstop | Visual Particle / Posture Cue |
| :--- | :--- | :--- | :--- |
| **Sweet-Spot Accuracy Crit** | Pure White → Solar Gold (`#ffffff` → `#fde047`) | `140ms` flash + `+45ms` hitstop | Cross-shaped gold/white impact flare + heavy knockback |
| **Standard Frame Hit** | Crisp White → Crimson (`#ffffff` → `#f87171`) | `95ms` flash + standard hitstop | Directional ember sparks along strike vector |
| **Armor Deflect / Sour-Spot Glance** | Brass Amber (`#fbbf24`) | `80ms` flash + `0ms` hitstop | Dull metallic ricochet sparks bouncing back toward attacker |
| **Armor Shred / Pierce** | Bright Gold (`#fef08a`) | `100ms` flash | Sundered plating shards falling to ground (`vz > 0`) |
| **Shield Absorb** | Electric Cyan (`#38bdf8`) | `85ms` hexagonal rim flash | Expanding cyan ripple ring around shield perimeter |
| **Shield Overload / Break** | Strobe Cyan → Violet (`#7dd3fc` → `#c084fc`) | `180ms` strobe + `55ms` hitstop | Shattered energy lattice burst |
| **Perfect Guard / Parry** | Radiant Gold (`#fde047`) | `120ms` player flash + `60ms` hitstop | Twin shockwave ring + attacker staggered backward |
| **Stagger / Guard Break** | Rapid White/Amber Strobe | During stagger window | Hunched/tilted posture + overhead kinetic spark |

### B.HUD & Viewport Decluttering
- **Particle Labels**: Suppress combat text labels on particles; reserve world-space text strictly for interactive object prompts (`[A] LIGHT CAMPFIRE`, `[A] SPEAK`) and major milestone banners (e.g., boss defeat / area discovery).
- **Routine Combat Toasts Removed**: Actions like reloading, stance recovery, target lock cycling, and minor blocks no longer spawn HUD toast banners (`state.toastText`). Instead:
  - Reloading & Stance Recovery are shown via the existing top-right ammo pips and a subtle 1-frame cyan/gold glint on the Mech's weapon hardpoint when ready.
  - Target Lock is shown purely by the crisp reticle on the locked enemy.

### C. Smooth Dark-to-Light Illumination
- **Offscreen Darkness Mask**: Uses a clean composited darkness layer (`destination-out` radial gradients) over the viewport:
  - **Player Light Radius**: Derived directly from the player's effective Light stat (`computeEffectivePlayerLightTiles(state) * 16px`), creating a warm, feathered radial gradient from `0%` darkness at the center to `100%` ambient darkness at the outer edge.
  - **World Light Sources**: Campfires, lit Poe Lanterns, spirit wisps, and glowing projectiles carve smooth secondary radial light pools into the same darkness mask and add soft additive bloom.
  - **No Artificial Grid Lines**: Eliminates the 4x4 sub-tile slate-gray patchwork and removes the dashed yellow/red raycast debug rings around the player and enemies.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Spatial Sweet-Spot Math Over RNG Crits**
  - *Chosen Approach*: Evaluate each hit's normalized radial distance `rNorm = dist / maxReach` and angular alignment `angleDelta` against the weapon's archetype sweet-spot band:
    - **Spears & Lances (`short_spear`, `avalon_siege_lance`)**: Tipper sweet-spot at `0.72 <= rNorm <= 1.00`; shaft sour-spot at `rNorm < 0.45` (`0.75x` damage, `+35%` enemy armor effectiveness).
    - **Hammers, Maces & Axes (`mace`, `black_iron_warhammer`, `bearded_axe`, `halberd`)**: Heavy head sweet-spot at `0.65 <= rNorm <= 0.95`; handle sour-spot at `rNorm < 0.42` (`0.70x` damage).
    - **Swords & Blades (`camelot_long_sword`, `shotel`, `khopesh`, `greatsword`)**: Upper-blade sweet-spot at `0.55 <= rNorm <= 0.88` within `±18°` of center aim.
    - **Ranged Weapons (`gladius_boltcaster`, `great_bow`, `repeater_crossbow`)**: Center-line alignment sweet-spot when projectile impacts within `3.5px` of target center at optimal medium range (`38%–85%` of max range).
  - *Why*: Makes spacing, movement inertia, and weapon choice deeply physical and skill-based without random luck.

- **Decision 2 — Multi-Frame Procedural & Sprite Posture Keyframes**
  - *Chosen Approach*: Expand both player skill execution and enemy `windup -> attack -> recovery` states into multi-stage keyframe progressions (`tellProgress ∈ [0..1]`, `attackProgress ∈ [0..1]`, `recoveryProgress ∈ [0..1]`) that drive weapon hardpoint windup angles, body lean/bob, shield raise, and lunge extension.
  - *Why*: Lets players read an enemy's exact attack timing and type (sweep, thrust, overhead slam, shield bash, or bow draw) purely from the enemy's silhouette and weapon motion—just like Souls or fighting games—without needing painted ground cones.

---

## 4. Technical Architecture & Data Strategy

### A. System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        COMBAT & RENDERING PIPELINE                         │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────┐
│ POSITIONAL ACCURACY  │  │  CONTEXTUAL POSTURE  │  │  SMOOTH RADIAL LIGHT   │
│    SWEET-SPOT ENGINE │  │   & AI STATE ENGINE  │  │   & FLASH COMPOSITOR   │
├──────────────────────┤  ├──────────────────────┤  ├────────────────────────┤
│ • Evaluates rNorm &  │  │ • Player 3-Phase     │  │ • Offscreen Darkness   │
│   angleDelta per hit │  │   Skill Keyframes:   │  │   Canvas with Smooth   │
│ • Returns HitQuality:│  │   Windup -> Strike   │  │   destination-out      │
│   'sweet' | 'normal' │  │   -> Follow-Through  │  │   Radial Cutouts       │
│   | 'sour'           │  │ • Lore-Driven Enemy  │  │ • Entity Flash State:  │
│ • Applies 1.35x Dmg  │  │   Behaviors & Multi- │  │   flashColor,          │
│   & 40% Armor Bypass │  │   Frame Windup/Lunge │  │   flashTimer,          │
│   on 'sweet' hits    │  │   Postures (No Cones)│  │   flashKind            │
└──────────┬───────────┘  └──────────┬───────────┘  └───────────┬────────────┘
           │                         │                          │
           └─────────────────────────┼──────────────────────────┘
                                     ▼
           ┌────────────────────────────────────────────────────┐
           │      DECLUTTERED COCKPIT VIEWPORT & FLASH FX       │
           │  • Zero Floating Combat Text / Zero Ground Cones   │
           │  • Color-Coded Silhouette Flashes & Hitstop        │
           │  • Weapon Readiness Glint on Reload / Stance Ready │
           └────────────────────────────────────────────────────┘
```

### B. Lore-Accurate Contextual Enemy Behaviors & Multi-Frame Animations
1. **Bog Crawler (`bog_crawler`)**:
   - *Lore Behavior*: Stalks from mud tiles with a low skittering gait; when within range, compresses its carapace downward across 3 windup frames (mandibles spreading wide and legs tucking) before springing airborne (`z > 0`) in a rapid pounce and settling into a brief grounded recovery.
2. **Bog Wurm (`bog_wurm`)**:
   - *Lore Behavior*: Lurks submerged beneath mire tiles, emitting concentric mud ripples as it tracks vibrations; surfaces with a multi-frame coiling rise (`z` rising from `-12` to `0`, segments swaying back) before whipping forward or spitting corrosive bile.
3. **Orc Scout (`orc_scout`)**:
   - *Lore Behavior*: Skirmishes at range—backpedals or strafes laterally when the pilot closes in, plants one knee during a 3-frame bow-draw animation (bowstring pulling taut with a visible arrow nocked along `attackAngle`), and releases a high-velocity shaft.
4. **Orc Warrior (`orc_warrior`)**:
   - *Lore Behavior*: Advances aggressively behind a raised scrap-buckler; winds up by hauling its heavy cleaver high overhead across 3 distinct frames (body leaning back, cleaver glinting at the apex) before stepping into a heavy downward cleave that leaves the cleaver embedded briefly during recovery.
5. **Camelot Grail Knights (`percival_knight`, `tristan_knight`, `bors_knight`)**:
   - *Sir Percival (Guardian)*: Raises his tower shield into a locked phalanx guard when below 60% HP or when allies are nearby; winds up by bracing his shield low and crouching before driving forward in a multi-frame shield-ram charge.
   - *Sir Tristan (Duelist/Ranger)*: Dashes laterally to flank the pilot while Percival holds the front; executes a 3-frame fencing lunge or triple-bolt volley with a flourish recovery.
   - *Sir Bors (Marauder)*: Slowly stalks with heavy inertia; winds up a 4-frame two-handed overhead execution slam that visibly shakes the ground on impact.
6. **Player Multi-Frame Skill Animations**:
   - Player weapon hardpoint rendering (`drawPlayerWeaponMounts25D` & `drawCompositePlayerMech`) now interpolates through 3 distinct phases during any skill or basic attack:
     - **Windup (`skillTellTimer > 0`)**: Coils the active weapon backward (e.g., pulling a spear back, raising a mace/sword overhead, or bracing a shield/boltcaster) while leaning the chassis by `1px`.
     - **Active Strike (`skillActionTimer` first 60%)**: Snaps the weapon through its full swing arc or forward thrust extension with a bright weapon-edge flash.
     - **Follow-Through / Recovery (`skillActionTimer` final 40%)**: Settles the weapon smoothly back to its neutral cardinal hardpoint coordinate.
