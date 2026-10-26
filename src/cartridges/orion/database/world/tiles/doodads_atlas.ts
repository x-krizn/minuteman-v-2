/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerBase64Atlas } from '../../../systems/renderSystem';
import { OrionState } from '../../../types';

/**
 * 3x3 Doodad Sprite Sheet (`48x48px`, `16x16px` cells):
 * - Row 0 (row1): (0,0) Chest Closed   | (1,0) Waygate Base   | (2,0) Lever Position 2 (Neutral Center)
 * - Row 1 (row2): (0,1) Chest Opened   | (1,1) Campfire Unlit | (2,1) Lever Position 1 (Left)
 * - Row 2 (row3): (0,2) Poe Lantern    | (1,2) Waygate Top    | (2,2) Lever Position 3 (Right)
 */
export const DOODADS_01_ATLAS_ID = 'doodads01';

export const DOODADS_01_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAFaklEQVRoBe2ZzYpcRRTH70ggC8UQkKhBCcygkIAi9pCd4EJwk4DbvED31kfwEdx2v4APYDaCoOAuTKsoKCQ4EBQ/sgkBsxCEtn5n6l+eqlu37p1OBkeYgtt16nzV/5w6VbfuTNedtZPLwHK53PC0ZjjXEv7XsvV6PQrhmVGNU65wqldgNpuNpu9/vwInHQAbsLkJR1M8opBKaDm/cayJFqvbOxXf8oFsE1q3t7fXHR4ewjdetKnZVtyNsyyA+Y2ZTbz+9bdxi6Axu/xyh83q9toDKQEbeOewlHtbp/YvOeUUSiuAGcC2bJYAsu3aTsw8LMt+IdeqOJMjsjz7NV4sFr2gLYCvvv+552SM4Wx8ZmWmidTDTwFVSkt2HWBXq1UaewJZGYQF8OLF5zoHyNsM0tj8eP+ByYvMDtpIMKQv8Byf8/m8UyCiGZdBpBJ6541X5X9Sf/eXh9JrZdZKKyhaCbnMJ1sR6nX2Czx80ZJJlz47RgE15fEOIm2lUmTWSmt3dxeV6h7xfmJmjUXG2cD+gUcLJWSrYIPwk2r03bd2lS3Jmv2X3x4mW6coH5bxCJ5jFBXjRd2arcrDueuTIVCCSPaJ6Ks+FY4PaJLDkGnZVPVDOZ005uq8Z8yzDJzWDGQbYuqFbuAiV41RPo9jU3U0wEwvMib6+LM7A2o5G90xQAKOZeuSyPnPeb/t6WIvMiZrTZLDPwLkAZbyMdBeXzfOsePT23jaAgA8b2DuN3q8ErT49Oi2AlZwn9z5wdy0brnKPNcEVqOcd2ycrhJ/PPzTdOlFe2PPr8m9rujXX7nYKQgFJZnvFQS8465E2gMYA4wMizYi/gzxvQ50CVRB3Lp+rVTNxlwPAN9aCX+FkLGdQkxKSbDUbGSBlZJ6Avzw/etWPuiWG1ngyTrA+WLT157KqLSRb/WUUVgRDbM+BJjdgxBaALrIMakmKmvc89kDNF3o7NoZxqvFTSsZ/ND0yUkQ2GgV5stPTb4TmhHxR+B1bQawD4YNXwZhJeRrWuC8Y2jP9/oHBweb/f19u/oGupsvj/6WAzgFtri5333xzU/mEhBOH9ssCMALuAcvXokrbeJSMHUMoJA5mxQbwJFYBQY9/2iZ+OhIX0do5PG5CGlZR+YfBYMOK2WK4SdFf/XKpcSUsNWHz8lk6x2SQSajH6Llt9yU+FEQ0il7gvd2CUSpuO1YwTDJEN3yHUqlmciQnAxzNvCOVb/iUdOiT31fggdwjTcSCJn0z4j6duLqJmbzANg3v+FGpjLQ+h52ugrGsZ6cHCwLThHvvjzuvMzRZgP4N8+/13331+f6oHcqRg7OWyo+0ZggykAaDpX5zQdX57Z49CEYZb7sG66miwYzIeCUDsfhhBWw7DP10ArAj39iQW1wboRjjdMKXNU9QPpwIPDaEw2nCTw6gCzLB/CX/n7Ngot+MpuG755IRy24egEAHoEHrxeSAut5DAwA+uYybbLnX7jWvfTslTIIbzKJ5t0CHhrvhOw6DZPz3gOVMneR1rvAA8aPmsrGwjt/WeytemUeY73QegEQYRkEBvCQ+dc4fLW3L1zovn70yLLtg/H074/vdw/O3fP7QOZZrzd4xowDKkPgYfUCiHoEEcnUtWp2J4A3OYCVdQWFBwskLIMLqDcBeoAPACF7jSrw4FHo7YGe1TEY2gcCyYr4Jr7neVrgKVs9gZdoAitX52kGwP8JDI8CUe9BRrqafWQAJ9NqWg142o+SDfZxs2zoPT1okAsopU0oH+uhiyfXjqOY2TRnAMtpkx6Pxa9ClgkvqM4SmUMbubCxPeF42VyOn0jmD77TuEYEnfr3QAm+XC52v28Tg/Amk+i44oO65Sb+B843Y4EAAzYYAAAAAElFTkSuQmCC';

registerBase64Atlas(DOODADS_01_ATLAS_ID, DOODADS_01_BASE64, 16, 16);

export const DOODAD_CELLS = {
  CHEST_CLOSED: { col: 0, row: 0 },
  WAYGATE_BASE: { col: 1, row: 0 },
  LEVER_POS_2_NEUTRAL: { col: 2, row: 0 },
  CHEST_OPENED: { col: 0, row: 1 },
  CAMPFIRE_UNLIT: { col: 1, row: 1 },
  LEVER_POS_1_LEFT: { col: 2, row: 1 },
  POE_LANTERN_UNLIT: { col: 0, row: 2 },
  WAYGATE_TOP: { col: 1, row: 2 },
  LEVER_POS_3_RIGHT: { col: 2, row: 2 },
} as const;

export function getCanonicalRoomPersistenceKey(
  state: OrionState,
  roomKey: string = state.room
): string {
  if (!roomKey.startsWith('fog:')) {
    return roomKey;
  }
  const node = state.fogGraph?.nodes?.[roomKey];
  if (!node) return roomKey;

  const src = node.sourceKeyCoord || state.areaId || 'belldor';
  if (node.nodeType === 'end') {
    return `fog_slot:end:${src}:${node.id}:${node.endFeature || 'loot_cache'}`;
  }
  if (node.nodeType === 'general') {
    return `fog_slot:general:${src}->${node.targetKeyCoord || 'wilds'}:step_${node.routeStep || 1}`;
  }
  if (node.nodeType === 'loop') {
    const depth = node.loopDepth || 1;
    const stage = node.loopStage || 1;
    const maxDepth = node.loopMaxDepth || 2;
    // At max depth, each room is a dynamically generated chamber in the deep fog
    if (depth >= maxDepth) {
      return `fog_slot:loop_max:${src}:${node.id}`;
    }
    return `fog_slot:loop:${src}:d${depth}_s${stage}`;
  }
  if (node.nodeType === 'side') {
    return `fog_slot:side:${src}:${node.id}`;
  }
  return `fog_slot:${node.nodeType}:${src}:${node.id}`;
}

export function isRoomCacheLooted(
  state: OrionState,
  tx: number,
  ty: number,
  roomKey: string = state.room
): boolean {
  const canonicalKey = getCanonicalRoomPersistenceKey(state, roomKey);
  return Boolean(
    state.lootedCaches[`${roomKey}:${tx},${ty}`] ||
      state.lootedCaches[`${canonicalKey}:${tx},${ty}`] ||
      state.lootedCaches[`${canonicalKey}:reward`]
  );
}

export function markRoomCacheLooted(
  state: OrionState,
  tx: number,
  ty: number,
  roomKey: string = state.room
): void {
  const canonicalKey = getCanonicalRoomPersistenceKey(state, roomKey);
  state.lootedCaches[`${roomKey}:${tx},${ty}`] = true;
  state.lootedCaches[`${canonicalKey}:${tx},${ty}`] = true;
  state.lootedCaches[`${canonicalKey}:reward`] = true;
}

/**
 * Resolves the active lever sprite cell (`1 -> 2 -> 3` or `3 -> 2 -> 1`).
 * - Position 1 (Left): `{ col: 2, row: 1 }`
 * - Position 2 (Center Neutral): `{ col: 2, row: 0 }`
 * - Position 3 (Right): `{ col: 2, row: 2 }`
 * Permanent switches transition `1 -> 2 -> 3` and remain in Position 3.
 * Toggle switches transition `1 -> 2 -> 3` when turned on and `3 -> 2 -> 1` when turned off.
 */
export function resolveLeverDoodadCell(
  state: OrionState,
  switchKey: string
): { col: number; row: number; position: 1 | 2 | 3 } {
  const isActive = Boolean(state.lootedCaches[switchKey]);
  const animStart = Number(state.flags?.[`${switchKey}:anim_t`] ?? -999);
  const animDir = String(state.flags?.[`${switchKey}:anim_dir`] || (isActive ? '123' : '321'));
  const elapsed = state.t - animStart;

  if (elapsed >= 0 && elapsed < 0.24) {
    if (elapsed < 0.07) {
      return animDir === '321'
        ? { ...DOODAD_CELLS.LEVER_POS_3_RIGHT, position: 3 }
        : { ...DOODAD_CELLS.LEVER_POS_1_LEFT, position: 1 };
    }
    if (elapsed < 0.17) {
      return { ...DOODAD_CELLS.LEVER_POS_2_NEUTRAL, position: 2 };
    }
  }

  return isActive
    ? { ...DOODAD_CELLS.LEVER_POS_3_RIGHT, position: 3 }
    : { ...DOODAD_CELLS.LEVER_POS_1_LEFT, position: 1 };
}
