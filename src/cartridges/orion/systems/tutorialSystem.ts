/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../../engine/core/soundSystem';
import { addOrionInventoryItem, notifyOrionStateChange } from '../stateStore';
import { OrionCombatContext, OrionState } from '../types';
import { getOrionFlag, setOrionFlag, syncStateGates } from './stateSystem';

export type TutorialStepId =
  | 'drop_pod_boot'
  | 'locate_fallen_scout'
  | 'traverse_sinkhole'
  | 'marsh_combat_trial'
  | 'unlock_perimeter_gate'
  | 'tutorial_complete';

export interface TutorialStepDescriptor {
  id: TutorialStepId;
  title: string;
  objective: string;
  targetLevel: number;
}

export const TUTORIAL_STEP_DESCRIPTORS: Record<TutorialStepId, TutorialStepDescriptor> = {
  drop_pod_boot: {
    id: 'drop_pod_boot',
    title: 'STEP 1: DROP-POD INITIALIZATION (LVL 1)',
    objective: 'Test primary movement and Gladius Skill 0 [X], or sync at Drop-Pod Crater [D].',
    targetLevel: 1,
  },
  locate_fallen_scout: {
    id: 'locate_fallen_scout',
    title: 'STEP 2: FALLEN SCOUT SALVAGE (LVL 2–3)',
    objective: 'Locate the Fallen Camelot Scout [S] to recover the Booster Kit [B] and Scout Khopesh [Y].',
    targetLevel: 2,
  },
  traverse_sinkhole: {
    id: 'traverse_sinkhole',
    title: 'STEP 3: MOBILITY & WEAPON SWAP (LVL 3)',
    objective: 'Use Jump [A] or Booster Dash [B] to cross chasms, and test Weapon Swap [Y].',
    targetLevel: 3,
  },
  marsh_combat_trial: {
    id: 'marsh_combat_trial',
    title: 'STEP 4: THREE DEFENSE LAYERS & ACTIVE SKILLS (LVL 4)',
    objective: 'Engage marsh hostiles to unlock Active Skill Slots 1–2 ([L] & [R]).',
    targetLevel: 4,
  },
  unlock_perimeter_gate: {
    id: 'unlock_perimeter_gate',
    title: 'STEP 5: PERIMETER BREAKTHROUGH',
    objective: 'Defeat the Perimeter Vanguard or use a Rusted Gate Key at Gate [G].',
    targetLevel: 4,
  },
  tutorial_complete: {
    id: 'tutorial_complete',
    title: 'M00 ONBOARDING COMPLETE',
    objective: 'Proceed into the Border Town Slums or continue exploring Belldor.',
    targetLevel: 5,
  },
};

/**
 * Evaluate tutorial-specific prompt overrides for interactive anchors ONLY when tutorialActive is true.
 * Returns null if standard world prompt behavior should be used.
 */
export function getTutorialPromptOverride(
  state: OrionState,
  tileChar: string
): string | null {
  if (!state.tutorialActive) return null;

  if (tileChar === 'S') {
    const scoutKey = `scout:${state.room}`;
    if (!state.lootedCaches[scoutKey]) {
      return '[A] SALVAGE FALLEN SCOUT (BOOSTER KIT & KHOPESH · LVL 3)';
    }
  }

  return null;
}

/**
 * Handle tutorial-specific anchor interactions ONLY when state.tutorialActive is true.
 * Returns true if the tutorial system handled the interaction.
 */
export function handleTutorialAnchorInteraction(
  state: OrionState,
  ctx: OrionCombatContext,
  tileChar: string
): boolean {
  if (!state.tutorialActive) return false;

  // Fallen Scout Setpiece during Tutorial State: unlocks Level 2 (Booster Kit) & Level 3 (Weapon Slot 2)
  if (tileChar === 'S') {
    const scoutKey = `scout:${state.room}`;
    if (!state.lootedCaches[scoutKey]) {
      state.lootedCaches[scoutKey] = true;
      state.hasBoosterKit = true;
      if (state.level < 3) {
        state.level = 3; // Unlocks Legs/Booster (Lvl 2) + Weapon Slot 2 & Swap (Lvl 3)
      }
      if (!state.equippedWeapons.includes('khopesh')) {
        state.equippedWeapons.push('khopesh');
      }
      addOrionInventoryItem(state, 'bedivere_ring', 1);
      addOrionInventoryItem(state, 'repair_kit', 1);

      setOrionFlag(state, 'scout_salvaged', true);
      state.tutorialStep = 'traverse_sinkhole';
      syncStateGates(state);

      soundSystem.playPowerup();
      ctx.say('TUTORIAL LVL 3: BOOSTER [B] & KHOPESH SWAP [Y] UNLOCKED');
      notifyOrionStateChange();
      return true;
    }
  }

  return false;
}

/**
 * Observe world state transitions each frame when tutorialActive is true to advance
 * tutorial steps and unlock progression gates cleanly.
 */
export function updateTutorialSystem(
  state: OrionState,
  ctx: OrionCombatContext,
  _dt: number
): void {
  if (!state.tutorialActive) return;

  // Ensure capability gates stay synced with level
  syncStateGates(state);

  // Advance from drop_pod_boot once player moves out of starting room or syncs drop-pod
  if (state.tutorialStep === 'drop_pod_boot' && state.room !== state.spawnAnchor.room) {
    state.tutorialStep = 'locate_fallen_scout';
    notifyOrionStateChange();
  }

  // Unlock Level 4 (Active Skills [L] & [R]) upon clearing first combat room or looting secret cache
  const anyRoomCleared = Object.keys(state.clearedRooms).length > 0;
  const anyCacheLooted = Object.keys(state.lootedCaches).some((k) => !k.startsWith('scout:'));

  if ((anyRoomCleared || anyCacheLooted) && !getOrionFlag(state, 'tutorial_lvl4_unlocked', false)) {
    setOrionFlag(state, 'tutorial_lvl4_unlocked', true);
    if (state.level < 4) {
      state.level = 4;
      syncStateGates(state);
      soundSystem.playPowerup();
      ctx.say('LEVEL 4 UNLOCKED: ACTIVE SKILLS [L] & [R] ONLINE');
      state.tutorialStep = 'unlock_perimeter_gate';
      notifyOrionStateChange();
    }
  }

  // Mark tutorial complete when any perimeter gate is unlocked
  if (
    Object.keys(state.unlockedGates).length > 0 &&
    state.tutorialStep !== 'tutorial_complete'
  ) {
    state.tutorialStep = 'tutorial_complete';
    if (state.level < 5) {
      state.level = 5; // Generator slot; Heat & Energy systems online
      syncStateGates(state);
    }
    notifyOrionStateChange();
  }
}
