# Project Orion — Feat System & Constellation Overhaul

*Complete specification for the 113-Node Constellation, 1:1 Level-to-Feat progression, customization depth chains, weapon-agnostic event triggers, 22 historical martial stances, and emergent historical meta-classes.*

---

## 1. Core Architectural Philosophy & Progression Rules

In **Project Orion**, your mech does not level up by inflating stats—every mech shares a static `200` Frame Integrity and the Base Combat Unit (`BCU = 54`) damage scale. The **Constellation Feat System** expands *how* you fight, customize mechanics, and synthesize historical combat archetypes.

### 1.1 The Five Golden Rules of Progression

| Rule | Principle | Mechanical Definition |
| :--- | :--- | :--- |
| **`P-01`** | **1:1 Level-to-Feat Cap** | Active socketed feats scale strictly `1:1` with Pilot Character Level (`Lv 1 = 1` feat, `Lv 5 = 5` feats, `Lv 13 = 13` feats, `Lv 20 = 20` feats maximum). |
| **`P-02`** | **Tiers = Customization Depth** | Tiers `I–V` measure **mechanical customization depth**, not level gates. Jumping tiers inside a chain (`Tier I → III` or `Tier I → IV`) is completely valid, and Tiers `I–IV` have **no per-tier caps**. |
| **`P-03`** | **Tier V Apex Ceiling (`Max = 2`)** | The only tier restriction: a build may socket **at most `2` Tier V capstones** (`0`, `1`, or `2`) out of its `20` total slots, reached via their prerequisite chains. |
| **`P-04`** | **Selective Chain Links (No Spaghetti Web)** | Only feats that mechanically escalate a prior feat require that link (`Chain Link`). Self-contained utilities, standalone modifiers, and all **22 Specialist Martial Stances** require **zero** prerequisite feats (`Standalone`). |
| **`P-05`** | **Weapon-Agnostic Event & Geometry Triggers** | Core Feats never lock players out via weapon name whitelists. Instead, they trigger off physical events (melee cleaves, perfect blocks, stationary focus, high-impulse slams, stealth strikes)—allowing any weapon to use them while naturally favoring weapons whose geometry fits best. |

---

## 2. Constellation Topology: Three Umbrellas & Six Compass Sectors

The **113-Node Star Chart** is organized spatially into **Three Macro-Hemispheres (Archetype Umbrellas)**, each encompassing two **Constellation Compass Sectors** (`6` sectors total) to guide players visually without imposing class locks:

```
                    ┌───────────────────────────────────┐
                    │         FIGHTER UMBRELLA          │
                    │     (Warrior + Guardian Sectors)  │
                    │ • Arms Mastery, Stances & Parry   │
                    │ • Directional Guard & Barriers    │
                    └─────────────────┬─────────────────┘
                                      │
          ┌───────────────────────────┴───────────────────────────┐
          ▼                                                       ▼
┌───────────────────────────────────┐   ┌───────────────────────────────────┐
│          ROGUE UMBRELLA           │   │         SCHOLAR UMBRELLA          │
│     (Rogue + Marauder Sectors)    │   │     (Wizard + Cleric Sectors)     │
│ • Stealth, Ambush & Greedy Heal   │   │ • Sustained Beams & Overcharge    │
│ • Heavy Mass, Overclock & Siege   │   │ • Triage Pulses & Martyrdom       │
└───────────────────────────────────┘   └───────────────────────────────────┘
```

### 2.1 Node Inventory Breakdown (`113` Total Nodes)

| Node Category | Tier I | Tier II | Tier III | Tier IV | Tier V | Reward | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Core Feats (Groomed & Active)** | 15 | 18 | 20 | 20 | 17 | 0 | **90** |
| **Specialist Martial Stances** | 3 | 13 | 6 | 0 | 0 | 0 | **22** |
| **Campaign Reward Feats (`Knight's Oath`)** | 0 | 0 | 0 | 0 | 0 | 1 | **1** |
| **Total Constellation Nodes** | **18** | **31** | **26** | **20** | **17** | **1** | **113** |

* **Gemstone Socketing (`100% Refundable`)**: Gemstones placed into Feat Nodes activate them and are **100% refunded** back to your inventory whenever you unsocket or respec a feat.

---

## 3. The 18 Mechanical Customization Chains (`Tier I → Tier V`)

When a pilot sockets multiple steps along a mechanical chain, glowing star-lines connect those nodes on the Constellation Chart. Jumping intermediate tiers (`Tier I → III` or `Tier I → IV`) is permitted whenever a build wants deeper customization without spending points on intermediate steps.

### 3.1 Fighter Umbrella Chains (`Warrior` + `Guardian` Sectors)

| Chain ID | Chain Name | Tier I (Entry) | Tier II (Refinement) | Tier III (Specialization) | Tier IV (Mastery) | Tier V (Apex Capstone) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`C-06`** | **Directional Guard & Barrier** | `Shield Charge` | `Guarded Fire` | `Radiant Cleave` | `Unyielding Bulwark` | `Hardening Light` |
| **`C-07`** | **Anchored Formation** | `Anchored Action` | `Stabilizer Pulse` | *(Direct Jump)* | `Siege Ward` / `Unfaltering` | *(Terminates at Tier IV)* |
| **`C-08`** | **Interference & Lock-Scramble** | `Radiant Dash` | `Guardian's Interference` / `Aura of Suppression` | `Cleave Suppression` | `Disruption Riposte` / `Disruption Field` | *(Terminates at Tier IV)* |
| **`C-11`** | **Booster Kinetics** | `Booster Evasion` | *(Direct Jump)* | *(Direct Jump)* | `Guardian's Dash` | *(Terminates at Tier IV)* |
| **`C-12`** | **Dual-Wield & Parry Riposte** | *(Direct Entry)* | `Sidearm Twin-Link` | `Off-Hand Deflection` / `Attrition Riposte` / `Cleave Counter` | `Main Weapon Twin-Link` | *(Terminates at Tier IV)* |

### 3.2 Rogue Umbrella Chains (`Rogue` + `Marauder` Sectors)

| Chain ID | Chain Name | Tier I (Entry) | Tier II (Refinement) | Tier III (Specialization) | Tier IV (Mastery) | Tier V (Apex Capstone) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`C-01`** | **Cloak & Infiltration** | `Shadow Step` | `Phantom Strike` | `Phantom Barrage` | `Spectral Volley` | `Shadow Master` |
| **`C-02`** | **Greedy Siphon (Self-Only Heal)** | `Veil of Mercy` | `Healing Shadow` | `Shadow Siphon` | `Shadow Sanctuary` | `Phantom Shroud` |
| **`C-03`** | **Precision Sniper & Ambush** | *(Direct Entry)* | `Arcane Ambush` | `Assassinate` | `Perfect Ambush` | `Phantom Sniper` |
| **`C-04`** | **Phase-Shift & Dimensional** | *(Direct Entry)* | `Phase Beam` | `Void Strike` | `Dimensional Strike` | `Quantum Assassin` |
| **`C-05`** | **Critical Siphon & Execution** | `Surgical Precision` | `Mercy Strike` | `Vital Strike` | `Merciful Execution` | `Angel of Death` |
| **`C-09`** | **Reactor Overclock & Heat** | `Momentum Guard` | `Radiant Ward-Flare` | `Overclock Guard` / `Reactive Overload` | `Overclock Barrage` / `Overclocked Ward` | `Core Overclock` |
| **`C-10`** | **Siege Mass & Attrition** | `Siege Stability` | *(Direct Jump)* | `Attrition Guard` | *(Direct Jump)* | `Salvo Link` |
| **`C-13`** | **Suppression & Ordnance** | *(Direct Entry)* | `Suppression Link` / `Suppression Chainfire` | `Radiant Barrage` | `Suppression Ward` | `Multi-Lock Array` / `Avalanche Surge` / `Lightstorm Barrage` |

### 3.3 Scholar Umbrella Chains (`Wizard` + `Cleric` Sectors)

| Chain ID | Chain Name | Tier I (Entry) | Tier II (Refinement) | Tier III (Specialization) | Tier IV (Mastery) | Tier V (Apex Capstone) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`C-14`** | **Sustained Channeling & Beam** | `Anchored Focus` | `Sustained Channeling` | `Overcharge` | `Arcane Mastery` | `Arcane Annihilation` |
| **`C-15`** | **Reactor Overflow & Energy** | `Radiant Overflow` | `Energy Redistribution` | `Convergence Field` | `Font of Power` | `Infinite Wellspring` |
| **`C-16`** | **Blessing & Barrier Harmonics** | `Empowered Blessing` | `Shared Resonance` | `Empowered Ward` | `Barrier Network` | `Empowered Singularity` |
| **`C-17`** | **Triage & Martyrdom** | `Reactive Healing` | `Martyr's Resolve` | `Mass Restoration` | `Selfless Sacrifice` | `Martyrdom Transcendent` |
| **`C-18`** | **Purification & Consecration** | *(Direct Entry)* | `Purification Sweep` | `Benediction Pulse` | `Consecrated Ground` | `Radiant Apocalypse` |

---

## 4. Complete Core Feats Catalog (`90` Groomed Feats + `1` Reward Feat)

### 4.1 Tier I Core Feats (`15` Feats)

| Feat Name | Umbrella / Sector | Chain & Step | Hardware / Event Condition | Combat Effect |
| :--- | :--- | :--- | :--- | :--- |
| **Booster Evasion** | Fighter (`Warrior`) | `C-11` (Step 1) | Booster kit equipped | Grants brief invulnerability frames (`i-frames`) during booster dash. |
| **Momentum Guard** | Rogue (`Warrior / Marauder`) | `C-09` (Step 1) | Booster kit equipped | Grants stagger resistance while boosting. |
| **Radiant Dash** | Fighter (`Warrior / Guardian`) | `C-08` (Step 1) | Booster kit + Mana core | Boost leaves a radiant wake granting stagger resistance and briefly blinding nearby enemies. |
| **Siege Stability** | Rogue (`Marauder`) | `C-10` (Step 1) | Heavy / Super-heavy chassis | Outriggers grant stagger immunity while firing heavy weapons. |
| **Anchored Action** | Fighter (`Marauder / Guardian`) | `C-07` (Step 1) | Stabilizer frame + Shield / Booster | While anchored (`μ = 0`), evasion or shield charge gains stagger immunity. |
| **Stabilizer Pulse** | Fighter (`Marauder / Guardian`) | `C-07` (Step 2) | Stabilizer frame + Energy shield | Anchored shield emits a pulse reducing incoming ranged damage. |
| **Shield Charge** | Fighter (`Guardian`) | `C-06` (Step 1) | Physical shield equipped | Charge forward with shield raised; impact stuns target for `1.5s`. |
| **Shadow Step** | Rogue (`Rogue`) | `C-01` (Step 1) | Mobility system equipped | Dash grants brief invisibility (capped at max stealth window). |
| **Phantom Strike** | Rogue (`Rogue / Wizard`) | `C-01` (Step 2) | Cloak + Energy output | Attacks from stealth deal bonus energy damage. |
| **Surgical Precision** | Rogue (`Rogue / Cleric`) | `C-05` (Step 1) | Critical hit event | Critical hits restore a portion of shield energy within `10m`. |
| **Veil of Mercy** | Rogue (`Rogue`) | `C-02` (Step 1) | Cloak / Stealth entry | Entering stealth grants **self-only** damage reduction (`-15%` incoming damage for `2.5s`; never affects allies). |
| **Anchored Focus** | Scholar (`Wizard`) | `C-14` (Step 1) | Stationary (`μ = 0`) for `0.75s` | Remaining stationary (`μ = 0`) for `0.75s` increases sustained/ranged damage and stability by `+15%`. |
| **Radiant Overflow** | Scholar (`Wizard / Cleric`) | `C-15` (Step 1) | Energy reactor + Support system | Excess reactor energy creates a localized heal-over-time zone. |
| **Empowered Blessing** | Scholar (`Wizard / Cleric`) | `C-16` (Step 1) | Multi-hit cleave / sustained hit | Multi-hit cleaves and sustained energy hits extend active buff durations by `+0.5s` (`1.5s` ICD). |
| **Reactive Healing** | Scholar (`Cleric`) | `C-17` (Step 1) | Support reactor equipped | Dropping below `30%` HP triggers an automatic `15%` HP pulse (`20s` CD). |

---

### 4.2 Tier II Core Feats (`18` Feats)

| Feat Name | Umbrella / Sector | Chain & Step | Hardware / Event Condition | Combat Effect |
| :--- | :--- | :--- | :--- | :--- |
| **Sidearm Twin-Link** | Fighter (`Warrior`) | `C-12` (Step 1) | Dual-wielding two 1H weapons | Dual-wielding any two one-handed weapons executes synchronized off-hand follow-up strikes. |
| **Suppression Link** | Rogue (`Warrior / Marauder`) | `C-13` (Step 1) | Consecutive rapid hits (`3+` in `1.0s`) | Consecutive rapid hits (`3+` within `1.0s`) trigger a bonus suppressing shockwave. |
| **Guarded Fire** | Fighter (`Warrior / Guardian`) | `C-06` (Step 2) | Guard + 1H weapon | Allows firing one-handed weapons while maintaining active directional guard (`Action 4`). |
| **Radiant Ward-Flare** | Fighter (`Guardian / Warrior`) | `C-09` (Step 2) | Active directional guard (`Action 4`) | While blocking (`Action 4`), incoming hits emit a frontal radiant flare that briefly blinds close attackers (`4s` CD). |
| **Suppression Chainfire** | Rogue (`Marauder`) | `C-13` (Step 1) | Sustained hits within `1.2s` | Sustained hits on a target within `1.2s` build cumulative suppression stacks (reducing target accuracy/speed). |
| **Aura of Suppression** | Fighter (`Marauder / Guardian`) | `C-08` (Step 2) | Mana core + active guard / sustained fire | Mana core + active guard or sustained fire projects an aura reducing nearby enemy accuracy and movement speed. |
| **Guardian's Interference** | Fighter (`Guardian / Marauder`) | `C-08` (Step 2) | Mana core + Interference launcher | Aura scrambles enemy targeting locks. |
| **Protector's Aura** | Fighter (`Guardian`) | Standalone | Mana core equipped | Reserves energy as interference shielding that blocks ranged energy fire and deflects small arms. |
| **Backstab Mastery** | Rogue (`Rogue`) | Standalone | Rear-arc attack event | Attacks from behind the target deal `+50%` damage. |
| **Arcane Ambush** | Rogue (`Rogue / Wizard`) | `C-03` (Step 1) | Cloak + Ranged/Energy attack | First attack from stealth overcharges the strike for `+100%` damage. |
| **Phase Beam** | Rogue (`Rogue / Wizard`) | `C-04` (Step 1) | Phase-shift module | Brief intangibility allows firing beams and projectiles through cover obstacles. |
| **Healing Shadow** | Rogue (`Rogue`) | `C-02` (Step 2) | Active stealth/cloak | While cloaked, **your own** Layer 1 Shields regenerate at `+50%` rate (self-only). |
| **Mercy Strike** | Rogue (`Rogue / Cleric`) | `C-05` (Step 2) | Critical hit event | Critical hits grant a brief damage buff within `10m`. |
| **Sustained Channeling** | Scholar (`Wizard`) | `C-14` (Step 2) | Consecutive hits within `1.2s` | Consecutive hits on the same target within `1.2s` ramp damage by `+5%` per stack (up to `+25%`). |
| **Energy Redistribution** | Scholar (`Wizard / Cleric`) | `C-15` (Step 2) | Support reactor + Damage taken | Taking damage transfers reactor energy into barrier/ally reserves. |
| **Shared Resonance** | Scholar (`Wizard / Cleric`) | `C-16` (Step 2) | Active buff + Energy pool | Active buffs reduce your own energy costs by `-10%`. |
| **Purification Sweep** | Scholar (`Cleric / Wizard`) | `C-18` (Step 1) | Wide melee cleave / energy discharge | Wide melee cleaves and energy discharges cleanse negative status effects on allies in their path. |
| **Martyr's Resolve** | Scholar (`Cleric`) | `C-17` (Step 2) | Support reactor / Martyrdom system | Gain `+20%` damage reduction while redirecting or absorbing damage via Martyrdom systems. |

---

### 4.3 Tier III Core Feats (`20` Feats)

| Feat Name | Umbrella / Sector | Chain & Step | Hardware / Event Condition | Combat Effect |
| :--- | :--- | :--- | :--- | :--- |
| **Off-Hand Deflection** | Fighter (`Warrior`) | `C-12` (Step 2) | Off-hand weapon or buckler | Any off-hand weapon or buckler gains an active defensive parry window (`0.34s`) on `Action 4`. |
| **Attrition Riposte** | Fighter (`Warrior / Marauder`) | `C-12` (Step 2) | Perfect Block or Parry (`0.34s`) | Any successful Perfect Block or Parry (`0.34s` window) restores reactor energy (once per attack cycle). |
| **Reactive Overload** | Rogue (`Warrior / Marauder`) | `C-09` (Step 3) | Damage taken while advancing (`μ > 0`) | Taking damage while attacking or advancing (`μ > 0`) reduces active skill cooldowns (stacks decay after `5s`). |
| **Overclock Guard** | Rogue (`Warrior / Marauder`) | `C-09` (Step 3) | Overclock core + Defensive plating | Overclock hardens plating and reduces damage at increased reactor heat. |
| **Overload Cleave** | Fighter (`Warrior / Guardian`) | Standalone | Mana reactor + Melee cleave | Cleave strikes build overload stacks (up to `3`); next boost restores shield energy. |
| **Cleave Counter** | Fighter (`Warrior / Guardian`) | `C-12` (Step 2) | Mana reactor + Perfect Block/Parry | Mana reactor + successful Perfect Block or Parry automatically triggers a `180°` radiant cleave wave. |
| **Attrition Guard** | Rogue (`Marauder`) | `C-10` (Step 2) | Defensive plating equipped | Converts incoming damage into reactor energy. |
| **Radiant Barrage** | Rogue (`Marauder / Guardian`) | `C-13` (Step 2) | Mana reactor + High-impulse strike | Cleave strikes trigger a rapid follow-up burst barrage. |
| **Cleave Suppression** | Fighter (`Guardian / Marauder`) | `C-08` (Step 3) | Mana reactor + Multi-target cleave/blast | Mana reactor + multi-target melee cleaves or area blasts apply suppression stacks to hit enemies. |
| **Radiant Cleave** | Fighter (`Guardian`) | `C-06` (Step 3) | Mana reactor + Basic melee finisher | Basic melee combo finishers unleash a `180°` mana-energy wave. |
| **Assassinate** | Rogue (`Rogue`) | `C-03` (Step 2) | Critical hit on target `>90%` HP | Critical hits against targets above `90%` HP deal `+200%` damage. |
| **Phantom Barrage** | Rogue (`Rogue / Wizard`) | `C-01` (Step 3) | First attack from stealth | First attack from stealth triggers a rapid double-strike / follow-up burst with zero reactor heat cost. |
| **Void Strike** | Rogue (`Rogue / Wizard`) | `C-04` (Step 2) | Attack during phase-shift | Attacks executed during phase intangibility bypass enemy Layer 1 Shields and Layer 2 Armor. |
| **Shadow Siphon** | Rogue (`Rogue`) | `C-02` (Step 3) | Strike from stealth | Strikes from stealth siphon `15%` of damage dealt into **your own** Shield/Frame reserves (self-only). |
| **Vital Strike** | Rogue (`Rogue / Cleric`) | `C-05` (Step 3) | Critical hit event | Critical hits restore `10%` of damage dealt as Frame Integrity. |
| **Overcharge** | Scholar (`Wizard`) | `C-14` (Step 3) | Energy reactor equipped | Spend `30%` of your energy pool to boost your next attack by `+150%`. |
| **Convergence Field** | Scholar (`Wizard / Cleric`) | `C-15` (Step 3) | Energy overflow + Support system | Boosts nearby energy regeneration by `+25%`. |
| **Empowered Ward** | Scholar (`Wizard / Cleric`) | `C-16` (Step 3) | Energy shield + Buff system | Active shields reflect `25%` of incoming damage back to the attacker. |
| **Benediction Pulse** | Scholar (`Cleric / Wizard`) | `C-18` (Step 2) | Combo finisher or killing blow | Combo finishers and killing blows release a `15m` restorative pulse (`+5m` radius if multiple enemies were hit). |
| **Mass Restoration** | Scholar (`Cleric`) | `C-17` (Step 3) | Support reactor + Area healing | Doubles healing field radius (`2×`) and increases restoration by `+25%`. |

---

### 4.4 Tier IV Core Feats (`20` Feats)

| Feat Name | Umbrella / Sector | Chain & Step | Hardware / Event Condition | Combat Effect |
| :--- | :--- | :--- | :--- | :--- |
| **Main Weapon Twin-Link** | Fighter (`Warrior`) | `C-12` (Step 3) | Matching weapon classes in `slot1` & `slot2` | Wielding matching functional weapon classes in Main (`slot1`) and Side (`slot2`) fires synchronized twin strikes. |
| **Overclock Barrage** | Rogue (`Warrior / Marauder`) | `C-09` (Step 4) | Overclock core equipped | Overclock core resets weapon cooldowns and accelerates attack/fire tempo up to the `+30%` cap at escalating reactor heat cost. |
| **Disruption Riposte** | Fighter (`Warrior / Marauder`) | `C-08` (Step 4) | Interference launcher equipped | Activating interference launcher grants a brief parry window (`0.34s`). |
| **Guardian's Dash** | Fighter (`Warrior / Guardian`) | `C-11` (Step 2) | Booster kit + Energy shield | Boosting through enemies triggers a shield pulse that stuns for `1.5s` and restores shields (`10s` CD). |
| **Overclocked Ward** | Rogue (`Warrior / Guardian`) | `C-09` (Step 4) | Overclock core + Energy shield | Boosts shield recharge rate and grants crowd-control immunity. |
| **Suppression Ward** | Rogue (`Warrior / Guardian`) | `C-13` (Step 3) | Guard or Energy shield raised | Raising any guard or energy barrier projects suppression stacks onto nearby enemies. |
| **Disruption Field** | Fighter (`Marauder`) | `C-08` (Step 4) | Interference launcher equipped | Doubles interference aura duration. |
| **Unyielding Bulwark** | Fighter (`Marauder / Guardian`) | `C-06` (Step 4) | Heavy frame + Energy shield | Grants crowd-control immunity while shielding. |
| **Siege Ward** | Fighter (`Guardian / Marauder`) | `C-07` (Step 3) | Heavy frame + Radiant sphere | Protective dome grants stagger and stun immunity inside its radius. |
| **Unfaltering** | Fighter (`Guardian`) | `C-07` (Step 3) | Heavy / Super-heavy frame | Grants crowd-control immunity for the duration of active support buffs. |
| **Perfect Ambush** | Rogue (`Rogue`) | `C-03` (Step 3) | First attack from stealth | First attack from stealth is a guaranteed critical hit with `+100%` critical damage. |
| **Dimensional Strike** | Rogue (`Rogue / Wizard`) | `C-04` (Step 3) | Phase-shift module equipped | Teleports behind target for a guaranteed critical strike before returning to origin. |
| **Spectral Volley** | Rogue (`Rogue / Wizard`) | `C-01` (Step 4) | Cloak active | Fire/attack while cloaked without breaking stealth (`3s` window). |
| **Merciful Execution** | Rogue (`Rogue / Cleric`) | `C-05` (Step 4) | Killing blow event | Killing blows restore `25%` of the target's max HP to your shield/field reserves. |
| **Shadow Sanctuary** | Rogue (`Rogue`) | `C-02` (Step 4) | Personal stealth shroud | Deploys a personal smoke/shadow shroud (`4m`) that cloaks **only you** and restores `20` Frame Integrity over `4s`. |
| **Arcane Mastery** | Scholar (`Wizard`) | `C-14` (Step 4) | Sustained / Energy-typed damage | Sustained and energy-typed attacks ignore `50%` of target Layer 1 Shield / energy resistance. |
| **Font of Power** | Scholar (`Wizard / Cleric`) | `C-15` (Step 4) | Support reactor + Energy pool | Grants `+30%` energy regeneration within `20m`. |
| **Barrier Network** | Scholar (`Wizard / Cleric`) | `C-16` (Step 4) | Energy shield active | Links active shields to distribute and share damage absorption. |
| **Consecrated Ground** | Scholar (`Cleric / Wizard`) | `C-18` (Step 3) | Sanctified zone deployment | Deploys a `10s` sanctified zone that heals allies and damages enemies inside it. |
| **Selfless Sacrifice** | Scholar (`Cleric`) | `C-17` (Step 4) | Martyrdom system equipped | Intercepts lethal damage and grants `3s` of damage immunity on survival (`60s` CD). |

---

### 4.5 Tier V Apex Capstone Feats (`17` Feats — Max `2` per Build)

| Feat Name | Umbrella / Sector | Chain & Step | Hardware / Event Condition | Combat Effect |
| :--- | :--- | :--- | :--- | :--- |
| **Core Overclock** | Rogue (`Warrior`) | `C-09` (Step 5) | Overclock core equipped | Resets all skill cooldowns at a volatile reactor heat trade-off. |
| **Salvo Link** | Rogue (`Warrior / Marauder`) | `C-10` (Step 3) | High-impulse strike (`Δv_eff >= 72`) | High-impulse attacks (`Heavy` load or `Δv_eff >= 72`) trigger a secondary follow-up shock detonation. |
| **Avalanche Surge** | Rogue (`Warrior / Marauder`) | `C-13` (Step 4) | Artillery optics equipped | Overclocks salvos into rapid multi-target chains at escalating heat and energy cost. |
| **Lightstorm Barrage** | Rogue (`Warrior / Guardian`) | `C-13` (Step 4) | Mana reactor + Artillery optics | Radiant salvo projectiles deal wide cleave damage and inflict heavy area suppression on impact. |
| **Multi-Lock Array** | Rogue (`Marauder`) | `C-13` (Step 4) | Artillery optics equipped | Salvo missile/rocket systems lock onto multiple targets simultaneously. |
| **Radiant Convergence** | Fighter (`Marauder / Guardian`) | Standalone | Mana reactor + Radiant sphere | Executing cleave or salvo inside your radiant sphere amplifies damage. |
| **Hardening Light** | Fighter (`Guardian`) | `C-06` (Step 5) | Energy shield equipped | Hits against your energy shield reflect damage and restore reactor energy. |
| **Shadow Master** | Rogue (`Rogue`) | `C-01` (Step 5) | Cloak active | Doubles cloak duration and allows up to `3` attacks without breaking stealth (`8s` cap). |
| **Quantum Assassin** | Rogue (`Rogue / Wizard`) | `C-04` (Step 4) | Phase-shift / Shadow leap | `3`-target chain teleport strike across up to `20m` per jump. |
| **Phantom Sniper** | Rogue (`Rogue`) | `C-03` (Step 4) | Stationary (`μ = 0`) + Stealth | Stationary (`μ = 0`) stealth attacks deal `+125%` precision damage with any ranged weapon; triggers a `0.75s` `Revealed` debuff on attack input press/release (cannot re-stealth), and charging a weapon prevents stealth entirely. |
| **Phantom Shroud** | Rogue (`Rogue`) | `C-02` (Step 5) | Self-only cloak purge | Grants `6s` of personal stealth and cleanses/blocks status effects on **yourself only**. |
| **Angel of Death** | Rogue (`Rogue / Cleric`) | `C-05` (Step 5) | Stealth killing blow | Stealth kills trigger a BCU-scaled heal and grant `+50%` damage for `6s`. |
| **Arcane Annihilation** | Scholar (`Wizard`) | `C-14` (Step 5) | `3s` immobile channel | `3s` immobile channeled charge unleashes an `800%` damage piercing beam (`120s` CD). |
| **Infinite Wellspring** | Scholar (`Wizard / Cleric`) | `C-15` (Step 5) | Reactor energy sustain | Sustained proximity healing aura fueled by reactor energy per tick. |
| **Empowered Singularity** | Scholar (`Wizard / Cleric`) | `C-16` (Step 5) | Energy reactor + Buff system | Deploys a `12s` singularity zone amplifying damage by `+60%`. |
| **Radiant Apocalypse** | Scholar (`Cleric / Wizard`) | `C-18` (Step 4) | Support reactor + Overcharged discharge | Fires a massive wave/beam that simultaneously heals allies and damages enemies in its path. |
| **Martyrdom Transcendent** | Scholar (`Cleric`) | `C-17` (Step 5) | Damage absorption burst | Absorbs `60%` of nearby damage into your shields first for `8s`, then releases a restorative burst (`180s` CD). |

---

### 4.6 Campaign Reward Feats (`1` Feat)

| Feat Name | How It Is Earned | Permanent Effect |
| :--- | :--- | :--- |
| **Knight's Oath** | Defeat **Sir Percival**, **Sir Tristan**, and **Sir Bors** in a combined encounter in Camelot Border Town | **`+10%` permanent bonus damage** against all Camelot enemies. |

---

## 5. Specialist Martial Stances (`22` Standalone Doctrines)

All **22 Specialist Martial Stances** are **Standalone Nodes** (requiring zero prerequisite feats) grouped spatially by weapon geometry across Tiers I–III. Both **`Custom` (`72`)** and **`Magitech` (`29`)** weapons qualify by their shared **Functional Weapon Type**. When socketed and your equipped loadout and **Load Bracket** satisfy its doctrine, the stance overrides **Actions 2, 4, and 5** with historical martial techniques (toggleable with Base Weapon Moveset in `LOADOUT`):

| Tier | Specialist Feat | Historical Martial Stance | Constellation Cluster | Qualifying Functional Weapon Pairing (`Custom` or `Magitech`) | Required Load Bracket |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **I** | **Spear & Buckler Specialist** | *Darting Viper Stance* | Fighter (`Warrior`) | `Short` / `Winged Spear` / `Partisan` / `Spetum` + `Buckler` / `Disc` / `Mote` | `Light` / `Medium` |
| **I** | **Sword & Buckler Specialist** | *I.33 Ward & Bind Stance* | Fighter (`Warrior / Rogue`) | `Arming` / `Spatha` / `Messer` / `Falchion` + `Buckler` / `Disc` / `Mote` | `Light` / `Medium` |
| **I** | **Boarder Specialist** | *Brace & Cutlass Stance* | Rogue (`Warrior / Rogue`) | `Falchion` / `Messer` / `Kilij` / `Dao` / `Khopesh` / `Wakizashi` ↔ `Bolt` / `Pulse` / `Blast` / `Arc Caster` | `Light` / `Medium` |
| **II** | **Limitanei Specialist** | *Plumbata & Spatha Stance* | Fighter (`Warrior`) | `Spatha` / `Arming Sword` / `Falchion` + `Plumbata` / `Bandolier` | `Light` / `Medium` |
| **II** | **Yeoman Longbow Specialist** | *Agincourt Stake-Line Stance* | Fighter (`Warrior`) | `Long` / `Great` / `Flat` / `Self` / `Compound Bow` + `Quiver` / `Sheaf` / `Bandolier` | `Medium` / `Heavy` |
| **II** | **Repeating Arbalest Specialist** | *Chu-Ko-Nu Volley Stance* | Fighter (`Warrior`) | `Bolt` / `Pulse` / `Blast Caster` + `Bandolier` / `Quiver` / `Rack` / `Battery` | `Light` / `Medium` / `Heavy` |
| **II** | **Daisho Specialist** | *Niten Ichi-Ryu Stance* | Rogue (`Warrior / Rogue`) | `Katana` / `Odachi` / `Dao` / `Kilij` + `Wakizashi` / `Cinquedea` | `Light` / `Medium` |
| **II** | **Rapier & Dagger Specialist** | *Destreza & Main-Gauche Stance* | Rogue (`Warrior / Rogue`) | `Spatha` / `Arming Sword` / `Messer` + `Cinquedea` / `Wakizashi` | `Light` / `Medium` |
| **II** | **Mounted Archer Specialist** | *Parthian Cantabrian Stance* | Rogue (`Warrior / Rogue`) | `Recurve` / `Reflex` / `Composite` / `Short` / `Compound Bow` + `Quiver` / `Yebira` | `Light` / `Medium` |
| **II** | **Legionary Specialist** | *Pilum & Scutum Stance* | Fighter (`Warrior / Guardian`) | `Spatha` / `Cinquedea` / `Arming Sword` + `Scutum` / `Tower` / `Norman` | `Medium` / `Heavy` |
| **II** | **Spear & Shield Specialist** | *Hoplite Othismos Stance* | Fighter (`Warrior / Guardian`) | `Short` / `Winged` / `Broad` / `Boar Spear` / `Partisan` + `Heater` / `Norman` / `Scutum` / `Tower` / `Corona` / `Rhom` | `Medium` / `Heavy` |
| **II** | **Knightly Bastard Specialist** | *Fiore Posta di Donna Stance* | Fighter (`Warrior / Guardian`) | `Bastard` / `Arming Sword` / `Spatha` + `Heater` / `Norman` / `Corona` / `Rhom` | `Medium` / `Heavy` |
| **II** | **Shield-Breaker Specialist** | *Thracian Rhomphaia Stance* | Rogue (`Warrior / Marauder`) | `Shotel` / `Falx` / `Khopesh` (+ optional Shield, Blade, or Carrier) | `Light` / `Medium` / `Heavy` |
| **II** | **Viking Raider Specialist** | *Huscarl Skjaldborg Stance* | Rogue (`Warrior / Marauder`) | `Battle Axe` / `Tomahawk` / `Parashu` / `Labrys` + `Norman` / `Heater` / `Buckler` / `Sheaf` / `Kaad` | `Medium` / `Heavy` |
| **II** | **Spellblade Specialist** | *Aether-Conduit Edge Stance* | Scholar (`Warrior / Wizard`) | `Arming` / `Bastard Sword` / `Spatha` / `Katana` / `Khopesh` ↔ `Beam` / `Arc` / `Wave` / `Pulse` / `Nova Caster` | `Light` / `Medium` |
| **II** | **Scepter & Ward Specialist** | *Sanctum Hierophant Stance* | Scholar (`Warrior / Cleric`) | `Mace` / `Cudgel` / `Hammer` / `Spike` + `Corona` / `Mote` / `Rhom` / `Disc` / `Buckler` | `Medium` / `Heavy` |
| **III** | **Odachi Specialist** | *Nodachi Battojutsu Stance* | Fighter (`Warrior`) | `Odachi` / `Dadao` / `Katana` (`2H Grip`) | `Light` / `Medium` |
| **III** | **Phalanx Specialist** | *Syntagma Sarissa Stance* | Fighter (`Warrior / Guardian`) | `Pike` / `Lance` / `Broad Spear` + `Scutum` / `Tower` / `Norman` *(unlocks 1H sarissa + heavy shield)* | `Medium` / `Heavy` |
| **III** | **Cataphract Specialist** | *Contus Clibanarii Stance* | Fighter (`Warrior / Guardian`) | `Lance` / `Pike` / `Boar Spear` / `Mace` / `Hammer` (+ optional Shield or Mace) | `Heavy` |
| **III** | **Zweihander Specialist** | *Landsknecht Doppelsöldner Stance* | Rogue (`Warrior / Marauder`) | `Zweihander` / `Flamberge` / `Executioner Sword` (`2H Grip`) | `Medium` / `Heavy` |
| **III** | **Siege Battery Specialist** | *Bombardier Fire-Mission Stance* | Rogue (`Warrior / Marauder`) | `Blast` / `Meteoric` / `Nova` / `Stellar` / `Beam Caster` + `Rack` / `Battery` / `Pangao` / `Plumbata` | `Heavy` |
| **III** | **Archmage Staff Specialist** | *Astral Fulcrum Stance* | Scholar (`Warrior / Wizard`) | `Spetum` / `Partisan` / `Short Spear` / `Stellar` / `Beam` / `Wave Caster` (+ optional `Mote` / `Corona` / `Battery`) | `Light` / `Medium` |

---

## 6. Emergent Historical Meta-Classes (Bottom-Up Build Synthesis)

In Project Orion, **classes are emergent meta-titles**, never upfront locks. When a pilot sockets feats across the Constellation and equips matching hardware, the `STATUS` screen recognizes the **fictional constellation pattern** they have illuminated and displays their corresponding **Historically Derived Class Title**:

| Emergent Historical Class | Umbrella Synthesis | Typical Load & Gear | Signature Illuminated Nodes (`Lv 20 = 20 Feats`) |
| :--- | :--- | :--- | :--- |
| **Knight** | `Fighter` *(Warrior + Guardian)* | `Medium` / `Heavy` · `Bastard`/`Arming Sword` + `Heater`/`Norman` | `Knightly Bastard Specialist`, `Shield Charge`, `Guarded Fire`, `Off-Hand Deflection`, `Attrition Riposte`, `Unyielding Bulwark`, `Hardening Light` |
| **Paladin / Hospitaller** | `Fighter + Scholar` *(Guardian + Cleric)* | `Heavy` · `Mace`/`Sword` + `Shield` + Support Reactor | `Scepter & Ward Specialist`, `Radiant Cleave`, `Purification Sweep`, `Benediction Pulse`, `Consecrated Ground`, `Selfless Sacrifice`, `Martyrdom Transcendent` |
| **Hoplite / Phalangite** | `Fighter` *(Guardian + Warrior)* | `Medium` / `Heavy` · `Pike`/`Spear` + `Scutum`/`Tower` | `Phalanx Specialist`, `Spear & Shield Specialist`, `Legionary Specialist`, `Anchored Action`, `Siege Ward`, `Unfaltering`, `Hardening Light` |
| **Cataphract** | `Fighter + Rogue` *(Guardian + Marauder)* | `Heavy` · `Lance`/`Mace` + `Shield` + Booster | `Cataphract Specialist`, `Legionary Specialist`, `Guardian's Dash`, `Overclock Guard`, `Salvo Link`, `Core Overclock` |
| **Landsknecht / Berserker** | `Rogue + Fighter` *(Marauder + Warrior)* | `Heavy` · `Zweihander`/`Battle Axe` (`2H`) | `Zweihander Specialist`, `Shield-Breaker Specialist`, `Siege Stability`, `Reactive Overload`, `Overclock Barrage`, `Core Overclock`, `Salvo Link` |
| **Varangian / Huscarl** | `Rogue + Fighter` *(Marauder + Guardian)* | `Medium` / `Heavy` · `Battle Axe` + `Norman`/`Heater` | `Viking Raider Specialist`, `Shield-Breaker Specialist`, `Guarded Fire`, `Overload Cleave`, `Unyielding Bulwark`, `Salvo Link` |
| **Samurai / Bushi** | `Fighter + Rogue` *(Warrior + Rogue)* | `Light` / `Medium` · `Katana`+`Wakizashi` / `Odachi` + `Recurve Bow` | `Daisho Specialist`, `Odachi Specialist`, `Mounted Archer Specialist`, `Attrition Riposte`, `Cleave Counter`, `Main Weapon Twin-Link` *(Zero Tier V build)* |
| **Ninja / Shinobi** | `Rogue + Scholar` *(Rogue + Wizard)* | `Light` · `Wakizashi`/`Cinquedea` + Cloak/Phase | `Daisho Specialist`, `Shadow Step`, `Phase Beam`, `Void Strike`, `Dimensional Strike`, `Spectral Volley`, `Shadow Master`, `Quantum Assassin` |
| **Parthian / Stradiot** | `Rogue + Fighter` *(Rogue + Warrior)* | `Light` / `Medium` · `Recurve`/`Long Bow` + `Quiver` | `Mounted Archer Specialist`, `Yeoman Longbow Specialist`, `Repeating Arbalest Specialist`, `Arcane Ambush`, `Perfect Ambush`, `Phantom Sniper` |
| **Witch-Hunter / Inquisitor** | `Rogue + Scholar` *(Rogue + Cleric)* | `Light` / `Medium` · `Spatha`+`Cinquedea` / `Bolt Caster` | `Boarder Specialist`, `Rapier & Dagger Specialist`, `Veil of Mercy`, `Healing Shadow`, `Shadow Siphon`, `Shadow Sanctuary`, `Phantom Shroud` |
| **Warmage / Spellblade** | `Fighter + Scholar` *(Warrior + Wizard)* | `Light` / `Medium` · `Arming Sword`/`Katana` + `Arc`/`Beam Caster` | `Spellblade Specialist`, `Anchored Focus`, `Sustained Channeling`, `Overcharge`, `Arcane Mastery`, `Arcane Annihilation`, `Empowered Singularity` |
| **Thaumaturge / Hermeticist** | `Scholar` *(Wizard + Cleric)* | `Light` / `Medium` · `Partisan`/`Stellar Caster` + `Mote` | `Archmage Staff Specialist`, `Sustained Channeling`, `Convergence Field`, `Font of Power`, `Mass Restoration`, `Arcane Annihilation`, `Infinite Wellspring` |
| **Bombardier / Janissary** | `Rogue + Fighter` *(Marauder + Warrior)* | `Heavy` · `Blast`/`Meteoric Caster` + `Rack`/`Battery` | `Siege Battery Specialist`, `Repeating Arbalest Specialist`, `Suppression Chainfire`, `Guardian's Interference`, `Multi-Lock Array`, `Avalanche Surge` |

---

## 7. Constellation Star-Chart Coordinate Layout (`113` Nodes)

To render the **113-Node Constellation** cleanly without crossing prerequisite lines, nodes are plotted on a polar hex grid centered on the Core Hub (`r = 0`):

* **Angular Sectors (`0° – 360°`)**:
  * **`0° – 120°` (Fighter Hemisphere)**: `Warrior` (`0°–60°`) and `Guardian` (`60°–120°`), with shield/polearm stances along `60°` and blade/dueling stances along `0°/360°`.
  * **`120° – 240°` (Scholar Hemisphere)**: `Wizard` (`120°–180°`) and `Cleric` (`180°–240°`), with `Spellblade`/`Archmage Staff` near `120°` and `Scepter & Ward` near `240°`.
  * **`240° – 360°` (Rogue Hemisphere)**: `Marauder` (`240°–300°`) and `Rogue` (`300°–360°`), with heavy cleavers/siege near `240°` and stealth/ambush chains near `300°–360°`.
* **Radial Depth Rings (`r = 1` to `r = 5`)**:
  * **Ring 1 (`r = 1`, `18` Stars)**: Tier I entry roots (`Booster Evasion`, `Shield Charge`, `Shadow Step`, `Anchored Focus`, `Reactive Healing`, `Momentum Guard`) + Tier I stances.
  * **Ring 2 (`r = 2`, `31` Stars)**: Tier II chain refinements + `13` Tier II Specialist Martial Stances clustered by weapon geometry.
  * **Ring 3 (`r = 3`, `26` Stars)**: Tier III doctrinal specializations + `6` Tier III Heavy/Master Specialist Stances (`Odachi`, `Phalanx`, `Cataphract`, `Zweihander`, `Siege Battery`, `Archmage Staff`).
  * **Ring 4 (`r = 4`, `20` Stars)**: Tier IV high-commitment masteries + `Knight's Oath` reward star (`r = 4.5` at the `Fighter` apex).
  * **Ring 5 (`r = 5`, `17` Stars)**: Outer rim Tier V Apex Capstones (`Max 2` active per build).