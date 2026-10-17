/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { soundSystem } from '../../engine/core/soundSystem';
import { GRAVITY } from './constants';
import { getItemDefinition } from './database/items';
import { addOrionInventoryItem } from './stateStore';
import { OrionExecutionContext, OrionState } from './types';

export function updatePickups(
  state: OrionState,
  ctx: OrionExecutionContext,
  dt: number
): void {
  for (let i = state.pickups.length - 1; i >= 0; i--) {
    const p = state.pickups[i];
    p.t += dt;

    // 2.5D vertical bounce
    if (p.z > 0 || p.vz !== 0) {
      p.z += p.vz * dt;
      p.vz -= GRAVITY * dt;
      if (p.z <= 0) {
        p.z = 0;
        p.vz = 0;
      }
    }

    const dist = Math.hypot(state.x - p.x, state.y - p.y);

    // Magnetic pull
    if (dist < 32) {
      const pullSpeed = 90 * dt;
      p.x += ((state.x - p.x) / dist) * pullSpeed;
      p.y += ((state.y - p.y) / dist) * pullSpeed;
    }

    // Collect item
    if (dist < 10) {
      soundSystem.playCoin();

      if (p.kind === 'scrap' || p.itemId === 'salvage_scrap') {
        state.salvageScrap += p.value || 1;
        ctx.say(`+${p.value || 1} SALVAGE SCRAP`);
      } else if (p.itemId === 'rusted_gate_key') {
        addOrionInventoryItem(state, 'rusted_gate_key', 1);
        ctx.say('ACQUIRED RUSTED GATE KEY');
      } else if (p.itemId === 'bedivere_relic') {
        addOrionInventoryItem(state, 'bedivere_relic', 1);
        state.flags = state.flags || {};
        const count = Math.min(3, Number(state.flags.bedivere_list_items || 0) + 1);
        state.flags.bedivere_list_items = count;
        ctx.say(
          count >= 3
            ? "BEDIVERE'S LIST COMPLETE (3/3) · THE BOG WATER WAITS"
            : `BEDIVERE LIST RELIC (${count}/3)`
        );
      } else if (p.itemId) {
        const itemDef = getItemDefinition(p.itemId);
        addOrionInventoryItem(state, p.itemId, 1);
        ctx.say(`SALVAGED: ${itemDef?.name || p.itemId}`);
      }

      state.pickups.splice(i, 1);
    }
  }
}
