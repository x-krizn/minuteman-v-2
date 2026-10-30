/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { soundSystem } from '../../../../engine/core/soundSystem';
import { TRAIT_REGISTRY } from '../../database/characters';
import {
  CLASS_UTILITY_CATALOG,
  getClassUtilityDefinition,
  getResolvedActionDescriptor,
} from '../../database/equipment';
import { getItemDefinition } from '../../database/items';
import {
  ACTION_MODIFICATION_CATALOG,
  CHASSIS_HARDWARE_CATALOG,
  GEMSTONE_REGISTRY,
  generateEquipmentModWithGems,
  getEffectiveMainGrip,
  getInventoryGemCount,
  getOwnedWeaponCount,
  getWeaponGemVisuals,
  getWeaponSubtypeInfo,
  isEquipmentUnlocked,
  setMainWeaponGrip,
} from '../../database/progression';
import {
  getWeaponDefinition,
  isAuxiliaryEquipment,
  isTrueWeaponEquipment,
  isTwoHandOnlyWeapon,
  WEAPON_REGISTRY,
} from '../../database/equipment/weapons';
import {
  addOrionInventoryItem,
  ASSIGNABLE_ACTION_CATALOG,
  assignTriggerAction,
  computePlayerWeightRecoveryProfile,
  consolidateInventorySlots,
  getActiveWeaponStance,
  getResolvedCombatSkills,
  isActionUnlocked,
  notifyOrionStateChange,
  performAuxiliarySwap,
  resolvePlayerSpriteParts,
  syncStateGates,
} from '../../systems';
import { OrionState } from '../../types';
import {
  CompositeMechPreviewCanvas,
  EditableLoadoutSlot,
  EquipmentInventoryCategory,
  SpriteCanvasIcon,
} from './SatchelCanvases';

/**
 * Props for the Pilot Satchel Loadout Tab component.
 */
export interface SatchelLoadoutTabProps {
  state: OrionState;
  isCheatMode: boolean;
  isEditingLoadout: boolean;
  setIsEditingLoadout: React.Dispatch<React.SetStateAction<boolean>>;
  editingSlot: EditableLoadoutSlot;
  setEditingSlot: React.Dispatch<React.SetStateAction<EditableLoadoutSlot>>;
  loadoutSubtypeFilter: string;
  setLoadoutSubtypeFilter: React.Dispatch<React.SetStateAction<string>>;
  openSlotEditor: (slot: EditableLoadoutSlot) => void;
  onOpenInventoryTab: () => void;
}

/**
 * Pilot Satchel Loadout Tab displaying Main Hand (Right), Side Hand (Left), and Auxiliary (Back)
 * weapon/equipment slots, composite mech preview, and action slot bindings.
 * Supports both HUD modes inside the Pilot Satchel overlay. Mutates `state: OrionState` when equipping/swapping items.
 */
export const SatchelLoadoutTab: React.FC<SatchelLoadoutTabProps> = ({
  state,
  isCheatMode,
  isEditingLoadout,
  setIsEditingLoadout,
  editingSlot,
  setEditingSlot,
  loadoutSubtypeFilter,
  setLoadoutSubtypeFilter,
  openSlotEditor,
  onOpenInventoryTab,
}) => {
  const trait = TRAIT_REGISTRY[state.traitLine] || TRAIT_REGISTRY.Warrior;
  const activeStance = getActiveWeaponStance(state);
  const resolvedSkills = getResolvedCombatSkills(state);
  const mainGrip = getEffectiveMainGrip(state);
  const slot1Id = state.equipmentSlots?.slot1 || state.equippedWeapons[0] || 'gladius_boltcaster';
  const slot2Id = state.equipmentSlots?.slot2 || null;
  const slot3Id = state.equipmentSlots?.slot3 || null;
  const mainWpnDef = getWeaponDefinition(slot1Id);
  const isBowMain = isTwoHandOnlyWeapon(mainWpnDef);

  const currentHeadName =
    state.equipmentSlots?.head || `${trait.frameModel || 'Mark-IV'} Sensor Visor`;
  const currentSensoryAName = state.equipmentSlots?.sensoryA || 'Federated T7 Sensor Array';
  const currentSensoryBName = state.equipmentSlots?.sensoryB || 'Federated EchoPulse Scanner';
  const currentArmsName =
    state.equipmentSlots?.arms || `${trait.frameModel || 'Mark-IV'} Actuator Vambraces`;
  const currentLegsName = state.equipmentSlots?.legs || 'BWI Strider Leg Assembly';
  const currentPlatingName =
    state.equipmentSlots?.plating ||
    `${trait.frameModel || 'Mark-IV'} ${trait.baseArmor.type} Plating`;
  const currentReactorName =
    state.equipmentSlots?.reactorCore || 'PNSY Alchemic Turbine Core Mk.IV';
  const currentAux3Name = state.equipmentSlots?.aux3 || 'PNSY R-11 Rockweiler Buckler';
  const currentAux4Name = state.equipmentSlots?.aux4 || 'PNSY UF-9 Rough Rider Booster';
  const currentUtilDef = getClassUtilityDefinition(state.equipmentSlots?.utility, state.traitLine);
  const installedRangedMod = ACTION_MODIFICATION_CATALOG.find(
    (m) => m.id === state.equipmentSlots?.installedMods?.ranged
  );
  const installedMeleeMod = ACTION_MODIFICATION_CATALOG.find(
    (m) => m.id === state.equipmentSlots?.installedMods?.melee
  );
  const installedMobilityMod = ACTION_MODIFICATION_CATALOG.find(
    (m) => m.id === state.equipmentSlots?.installedMods?.mobility
  );
  const boundLDesc = getResolvedActionDescriptor(
    state,
    state.assignedActions?.L || 'weapon_skill_1'
  );
  const boundRDesc = getResolvedActionDescriptor(
    state,
    state.assignedActions?.R || 'weapon_skill_2'
  );

  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
      {/* 1. Weapon Action Grid & Active Stance Resolution (ac1..ac5) + Loadout Edit Toggle */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#38bdf8]/40 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <CompositeMechPreviewCanvas
              state={state}
              head={currentHeadName}
              arms={currentArmsName}
              plating={currentPlatingName}
              weaponId={slot1Id}
              sideWeaponId={slot2Id}
              auxWeaponId={slot3Id}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#38bdf8] font-bold text-[10px]">
                  ACTIVE LOADOUT & STANCE:
                </span>
                <span className="text-[#ffd27d] font-black text-[9px]">{activeStance.label}</span>
              </div>
              <div className="text-[7.5px] text-[#94a3b8]">
                16×16 4-FRAME GLIDE COMPOSITE ({computePlayerWeightRecoveryProfile(state).weightLabel}{' '}
                · {computePlayerWeightRecoveryProfile(state).recoveryFrames.length}F RECOVERY): HEAD
                ({resolvePlayerSpriteParts(state).headStyle.toUpperCase()}) · ARMS (
                {resolvePlayerSpriteParts(state).armsStyle.toUpperCase()}) · FRAME PLATING (
                {resolvePlayerSpriteParts(state).framePlatingStyle.toUpperCase()})
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                soundSystem.playSelect();
                setIsEditingLoadout((prev) => !prev);
                setLoadoutSubtypeFilter('ALL');
              }}
              className={`px-2 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer ${
                isEditingLoadout
                  ? 'bg-[#facc15] text-[#05070a] border-[#fde047]'
                  : 'bg-[#172554] hover:bg-[#1e3a8a] text-[#7dd3fc] border-[#38bdf8]'
              }`}
            >
              {isEditingLoadout ? '✓ DONE EDITING LOADOUT' : '✎ EDIT LOADOUT'}
            </button>
            <button
              onClick={() => {
                soundSystem.playSelect();
                onOpenInventoryTab();
              }}
              className="px-1.5 py-0.5 bg-[#0f172a] hover:bg-[#1e293b] border border-[#8dd7ad]/60 rounded-xs text-[8px] font-bold text-[#8dd7ad] cursor-pointer"
            >
              EQUIPMENT INVENTORY
            </button>
            <button
              onClick={() => {
                performAuxiliarySwap(
                  state,
                  {
                    say: (txt) => {
                      state.toastText = txt;
                      state.toastTimer = 2.5;
                    },
                  },
                  true
                );
              }}
              className="px-1.5 py-0.5 bg-[#422006]/90 hover:bg-[#713f12] border border-[#f59e0b]/60 rounded-xs text-[8px] font-bold text-[#fbbf24] cursor-pointer"
            >
              SWAP SIDE ⇄ AUX [L]
            </button>
          </div>
        </div>

        <div className="text-[8px] text-[#cbd5e1]">
          {activeStance.description} ·{' '}
          <span className="text-[#94a3b8]">
            {!slot2Id
              ? 'No Side Hand equipped → Main Hand is automatically 2H.'
              : 'Click any slot or EDIT LOADOUT to change equipped items.'}
          </span>
        </div>

        {/* Canonical grip . ac1 . ac2 . ac3 . ac4 . ac5 . Reference Matrix + Resolved Skills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[7.5px]">
          <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] font-mono">
            <div className="text-[#94a3b8] font-bold mb-0.5">GRIP MATRIX (1H / 2H / OFF):</div>
            <div className="grid grid-cols-6 gap-0.5 text-center font-bold border-b border-[#1e293b] pb-0.5 text-[#38bdf8]">
              <span>GRIP</span>
              <span>AC1</span>
              <span>AC2</span>
              <span>AC3</span>
              <span>AC4</span>
              <span>AC5</span>
            </div>
            {[
              { g: '1h', vals: ['yes', 'yes', 'yes', 'no', 'no'], active: mainGrip === '1h' },
              { g: '2h', vals: ['yes', 'yes', 'yes', 'yes', 'yes'], active: mainGrip === '2h' },
              {
                g: 'off',
                vals: ['no', 'no', 'no', 'yes', 'yes'],
                active: Boolean(slot2Id && mainGrip === '1h'),
              },
            ].map((row) => (
              <div
                key={row.g}
                className={`grid grid-cols-6 gap-0.5 text-center py-0.2 ${
                  row.active ? 'text-[#ffd27d] font-bold' : 'text-[#64748b]'
                }`}
              >
                <span className="uppercase">{row.g}</span>
                {row.vals.map((v, i) => (
                  <span
                    key={i}
                    className={
                      v === 'yes'
                        ? row.active
                          ? 'text-[#4ade80]'
                          : 'text-[#94a3b8]'
                        : 'text-[#475569]'
                    }
                  >
                    {v}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Resolved ac1..ac5 Live Readout */}
          <div className="p-1.5 bg-[#0f172a] rounded-xs border border-[#1e293b] space-y-0.5">
            <div className="text-[#94a3b8] font-bold">RESOLVED 5-ACTION LOADOUT (AC1–AC5):</div>
            {(
              [
                { key: 'AC1 [X]', sk: resolvedSkills.skill1 },
                { key: 'AC2 [Y TAP]', sk: resolvedSkills.skill2 },
                { key: 'AC3 [R TAP]', sk: resolvedSkills.skill3 },
                { key: 'AC4 [Y HOLD]', sk: resolvedSkills.skill4 },
                { key: 'AC5 [R HOLD]', sk: resolvedSkills.skill5 },
              ] as const
            ).map((entry) => (
              <div
                key={entry.key}
                className="flex items-center justify-between gap-1 text-[7.5px]"
              >
                <span className="text-[#38bdf8] font-bold shrink-0">{entry.key}:</span>
                <span
                  className={`truncate font-bold ${
                    entry.sk?.available ? 'text-[#ffd27d]' : 'text-[#64748b]'
                  }`}
                >
                  {entry.sk?.available
                    ? `${entry.sk.name} (${entry.sk.sourceSlotName})`
                    : 'no (inactive)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Weapon, Auxiliary & Consumable Slots (Compact Summary Cards — No Inline Option Dump) */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] font-bold text-[#94a3b8]">
          <span>WEAPON, SIDE & AUXILIARY SLOTS</span>
          <div className="flex items-center gap-1">
            <span className="text-[8px] text-[#cbd5e1]">MAIN GRIP:</span>
            <button
              disabled={isBowMain || !slot2Id}
              onClick={() => {
                soundSystem.playSelect();
                setMainWeaponGrip(state, '1h', {
                  say: (txt) => {
                    state.toastText = txt;
                    state.toastTimer = 2.5;
                  },
                });
                syncStateGates(state);
                notifyOrionStateChange();
              }}
              title={
                !slot2Id
                  ? 'No Side Hand equipped — Main Hand is automatically 2H'
                  : 'Switch Main Hand to 1H Grip'
              }
              className={`px-1.5 py-0.2 rounded-xs text-[7.5px] font-bold border ${
                mainGrip === '1h'
                  ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                  : isBowMain || !slot2Id
                    ? 'bg-[#0f172a] text-[#475569] border-[#1e293b] cursor-not-allowed'
                    : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#38bdf8] cursor-pointer'
              }`}
            >
              1H GRIP
            </button>
            <button
              onClick={() => {
                soundSystem.playSelect();
                setMainWeaponGrip(state, '2h', {
                  say: (txt) => {
                    state.toastText = txt;
                    state.toastTimer = 2.5;
                  },
                });
                syncStateGates(state);
                notifyOrionStateChange();
              }}
              className={`px-1.5 py-0.2 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                mainGrip === '2h'
                  ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                  : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#ffd27d]'
              }`}
            >
              2H POWER STANCE {!slot2Id ? '(AUTO: NO SIDE)' : isBowMain ? '(BOW 2H)' : ''}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {(
            [
              {
                slotIdx: 0,
                slotKey: 'slot1' as const,
                label: 'MAIN HAND (RIGHT)',
                sub: mainGrip === '2h' ? '2H Power Stance → ac1–ac5' : 'Right Hand 1H → ac1–ac3',
                wId: slot1Id,
              },
              {
                slotIdx: 1,
                slotKey: 'slot2' as const,
                label: 'SIDE HAND (LEFT)',
                sub: !slot2Id
                  ? 'None Equipped → Main Hand Auto-2H'
                  : 'Left Hand Off-Hand / Aux / Consumable',
                wId: slot2Id || '',
              },
              {
                slotIdx: 2,
                slotKey: 'slot3' as const,
                label: 'AUXILIARY (BACK)',
                sub: 'Back Mount · Swaps with Side Hand via [L]',
                wId: slot3Id || '',
              },
            ] as const
          ).map((sInfo) => {
            const wId = sInfo.wId;
            const wDef = wId ? getWeaponDefinition(wId) : undefined;
            const itemDef = wId && !wDef ? getItemDefinition(wId) : undefined;
            const isEditingThis = isEditingLoadout && editingSlot === sInfo.slotKey;
            const gemVis = wDef ? getWeaponGemVisuals(state, wId) : null;
            const stripBase64 = wDef?.variantStripBase64 || wDef?.hardpointSprite?.base64;
            const subtypeInfo = wDef ? getWeaponSubtypeInfo(wId) : null;
            const ownedCopies = wDef ? getOwnedWeaponCount(state, wId) : 0;

            return (
              <div
                key={sInfo.slotKey}
                className={`p-1.5 rounded-xs border transition-colors space-y-1 ${
                  isEditingThis
                    ? 'bg-[#172554]/80 border-[#facc15]'
                    : 'bg-[#0f172a] border-[#1e293b]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[8px] font-bold text-[#ffd27d]">{sInfo.label}</span>
                  <div className="flex items-center gap-1">
                    {sInfo.slotIdx >= 1 && wId && (
                      <button
                        onClick={() => {
                          soundSystem.playMenuBeep();
                          if (state.equipmentSlots) {
                            state.equipmentSlots[sInfo.slotKey] = null;
                            if (!state.equipmentSlots.slot2) {
                              state.equipmentSlots.mainGrip = '2h';
                            }
                          }
                          state.equippedWeapons = [
                            state.equipmentSlots?.slot1,
                            state.equipmentSlots?.slot2,
                            state.equipmentSlots?.slot3,
                          ].filter(Boolean) as string[];
                          syncStateGates(state);
                          notifyOrionStateChange();
                        }}
                        className="px-1 py-0.2 rounded-xs text-[7px] font-bold bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] border border-[#475569] cursor-pointer"
                      >
                        UNEQUIP
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (isEditingThis) {
                          setIsEditingLoadout(false);
                        } else {
                          openSlotEditor(sInfo.slotKey);
                        }
                      }}
                      className={`px-1.5 py-0.2 rounded-xs text-[7px] font-bold border cursor-pointer ${
                        isEditingThis
                          ? 'bg-[#facc15] text-[#05070a] border-[#fde047]'
                          : 'bg-[#1e293b] hover:bg-[#334155] text-[#7dd3fc] border-[#38bdf8]/60'
                      }`}
                    >
                      {isEditingThis ? 'EDITING' : 'EDIT'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5 bg-[#090d14] px-1.5 py-1 rounded-xs border border-[#1e293b]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {stripBase64 && gemVis && (
                      <SpriteCanvasIcon
                        base64={stripBase64}
                        col={gemVis.colIndex}
                        sizeClass="w-5 h-5"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-[9px] font-bold text-[#ffd27d] truncate">
                        {wDef
                          ? `${wDef.name}${sInfo.slotIdx === 0 && mainGrip === '2h' ? ' (2h)' : ''}`
                          : itemDef?.name || 'None (Empty)'}
                      </div>
                      <div className="text-[7px] text-[#94a3b8] truncate">
                        {wDef && subtypeInfo
                          ? `${subtypeInfo.subtype} · Copies: ×${ownedCopies}`
                          : itemDef
                            ? `Consumable · Skill 5 when in Side`
                            : sInfo.sub}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Chassis Hardware, Tactical Utility, Action Mods & Trigger Bindings */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
        <div className="text-[9px] font-bold text-[#94a3b8]">
          CHASSIS HARDWARE · REACTOR · AUXILIARY SYSTEMS · TACTICAL UTILITY · ACTION MODS · TRIGGERS
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[8px]">
          {(
            [
              {
                slot: 'head' as EditableLoadoutSlot,
                label: 'HEAD OPTICS',
                val: currentHeadName,
                sub: 'Hardware · Optics',
              },
              {
                slot: 'sensoryA' as EditableLoadoutSlot,
                label: 'SENSORY A',
                val: currentSensoryAName,
                sub: 'Hardware · Field Monitor',
              },
              {
                slot: 'sensoryB' as EditableLoadoutSlot,
                label: 'SENSORY B',
                val: currentSensoryBName,
                sub: 'Hardware · Threat Scanner',
              },
              {
                slot: 'arms' as EditableLoadoutSlot,
                label: 'ARMS ACTUATORS',
                val: currentArmsName,
                sub: 'Hardware · Arm Assembly',
              },
              {
                slot: 'legs' as EditableLoadoutSlot,
                label: 'LEGS ACTUATORS',
                val: currentLegsName,
                sub: 'Hardware · Leg Assembly',
              },
              {
                slot: 'plating' as EditableLoadoutSlot,
                label: 'FRAME PLATING',
                val: currentPlatingName,
                sub: `Hardware · ${state.armor.type}`,
              },
              {
                slot: 'reactor' as EditableLoadoutSlot,
                label: 'REACTOR CORE',
                val: currentReactorName,
                sub: 'Core System · Generator',
              },
              {
                slot: 'aux3' as EditableLoadoutSlot,
                label: 'AUX 3 SYSTEM',
                val: currentAux3Name,
                sub: 'Defensive / Tactical Aux',
              },
              {
                slot: 'aux4' as EditableLoadoutSlot,
                label: 'AUX 4 SYSTEM',
                val: currentAux4Name,
                sub: 'Mobility / Evasion Aux',
              },
              {
                slot: 'utility' as EditableLoadoutSlot,
                label: 'UTILITY [ACT 6]',
                val: currentUtilDef.name,
                sub: `${currentUtilDef.frameModel} · ${currentUtilDef.shortLabel}`,
              },
              {
                slot: 'mod_ranged' as EditableLoadoutSlot,
                label: 'RANGED MOD',
                val: installedRangedMod?.name || 'None Installed',
                sub: 'Action Mod · Ranged',
              },
              {
                slot: 'mod_melee' as EditableLoadoutSlot,
                label: 'MELEE MOD',
                val: installedMeleeMod?.name || 'None Installed',
                sub: 'Action Mod · Melee',
              },
              {
                slot: 'mod_mobility' as EditableLoadoutSlot,
                label: 'MOBILITY MOD',
                val: installedMobilityMod?.name || 'None Installed',
                sub: 'Action Mod · Mobility',
              },
              {
                slot: 'bind_l' as EditableLoadoutSlot,
                label: 'TRIGGERS [L / R]',
                val: `L: ${boundLDesc.shortLabel} · R: ${boundRDesc.shortLabel}`,
                sub: 'Multi-Source Action Bindings',
              },
            ] as const
          ).map((card) => {
            const activeEdit =
              isEditingLoadout &&
              (editingSlot === card.slot || (card.slot === 'bind_l' && editingSlot === 'bind_r'));
            return (
              <div
                key={card.slot}
                className={`p-1.5 rounded-xs border flex flex-col justify-between gap-0.5 ${
                  activeEdit
                    ? 'bg-[#172554]/80 border-[#facc15]'
                    : 'bg-[#0f172a] border-[#1e293b]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-[7.5px] text-[#38bdf8] truncate">
                    {card.label}
                  </span>
                  <button
                    onClick={() => {
                      if (activeEdit) setIsEditingLoadout(false);
                      else openSlotEditor(card.slot);
                    }}
                    className={`px-1 py-0.2 rounded-xs text-[6.5px] font-bold border cursor-pointer shrink-0 ${
                      activeEdit
                        ? 'bg-[#facc15] text-[#05070a] border-[#fde047]'
                        : 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] border-[#475569]'
                    }`}
                  >
                    {activeEdit ? 'EDITING' : 'EDIT'}
                  </button>
                </div>
                <div className="font-bold text-[#ffd27d] truncate text-[8.5px]">{card.val}</div>
                <div className="text-[7px] text-[#94a3b8] truncate">{card.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ON-DEMAND LOADOUT EDITOR PANEL */}
      {isEditingLoadout && (
        <div className="p-2 bg-[#0b111e] rounded-xs border border-[#facc15] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#1e293b] pb-1">
            <div className="text-[9.5px] font-bold text-[#facc15]">
              LOADOUT EDITOR — SELECT SLOT & SUBTYPE TO EQUIP:
            </div>
            <button
              onClick={() => {
                soundSystem.playMenuBeep();
                setIsEditingLoadout(false);
              }}
              className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#facc15] border border-[#facc15]/60 rounded-xs text-[8px] font-bold cursor-pointer"
            >
              ✕ CLOSE EDITOR
            </button>
          </div>

          {/* Slot Selector Strip */}
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                { id: 'slot1', label: 'Main Hand' },
                { id: 'slot2', label: 'Side Hand' },
                { id: 'slot3', label: 'Auxiliary' },
                { id: 'head', label: 'Head Optics' },
                { id: 'sensoryA', label: 'Sensory A' },
                { id: 'sensoryB', label: 'Sensory B' },
                { id: 'arms', label: 'Arms Actuators' },
                { id: 'legs', label: 'Legs Actuators' },
                { id: 'plating', label: 'Frame Plating' },
                { id: 'reactor', label: 'Reactor Core' },
                { id: 'aux3', label: 'Aux 3 System' },
                { id: 'aux4', label: 'Aux 4 System' },
                { id: 'utility', label: 'Utility [Act 6]' },
                { id: 'mod_ranged', label: 'Ranged Mod' },
                { id: 'mod_melee', label: 'Melee Mod' },
                { id: 'mod_mobility', label: 'Mobility Mod' },
                { id: 'bind_l', label: 'Bindings [L/R]' },
              ] as Array<{ id: EditableLoadoutSlot; label: string }>
            ).map((sTab) => (
              <button
                key={sTab.id}
                onClick={() => {
                  soundSystem.playSelect();
                  setEditingSlot(sTab.id);
                  setLoadoutSubtypeFilter('ALL');
                }}
                className={`px-1.5 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                  editingSlot === sTab.id
                    ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                    : 'bg-[#090d14] text-[#94a3b8] border-[#334155] hover:border-[#38bdf8]'
                }`}
              >
                {sTab.label}
              </button>
            ))}
          </div>

          {/* A. Editing Main Hand / Side Hand / Auxiliary */}
          {(editingSlot === 'slot1' || editingSlot === 'slot2' || editingSlot === 'slot3') &&
            (() => {
              const subtypeTabs =
                editingSlot === 'slot1'
                  ? [
                      'ALL',
                      'Ranged · Bolter / Ballista',
                      'Ranged · Gatling / Ordnance',
                      'Ranged · Beam / Pulse',
                      'Ranged · SMG / Marksman',
                      'Ranged · Boltcaster',
                      'Ranged · 2H Bow',
                      'Melee · Blade',
                      'Melee · Blunt / Cleave',
                      'Melee · Polearm / Lance',
                    ]
                  : [
                      'ALL',
                      'Ranged · Bolter / Ballista',
                      'Ranged · Gatling / Ordnance',
                      'Ranged · Beam / Pulse',
                      'Ranged · SMG / Marksman',
                      'Ranged · Boltcaster',
                      'Melee · Blade',
                      'Melee · Blunt / Cleave',
                      'Melee · Polearm / Lance',
                      'Auxiliary · Shield',
                      'Auxiliary · Quiver',
                      'Auxiliary · Catalyst',
                      'Consumable',
                    ];

              const activeSlotId =
                editingSlot === 'slot1' ? slot1Id : editingSlot === 'slot2' ? slot2Id : slot3Id;

              return (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[7.5px] text-[#94a3b8] font-bold">SUBTYPE FILTER:</span>
                    {subtypeTabs.map((st) => (
                      <button
                        key={st}
                        onClick={() => setLoadoutSubtypeFilter(st)}
                        className={`px-1.5 py-0.2 rounded-xs text-[7px] font-bold border cursor-pointer ${
                          loadoutSubtypeFilter === st
                            ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                            : 'bg-[#090d14] text-[#94a3b8] border-[#1e293b]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {Object.values(WEAPON_REGISTRY)
                      .filter((candidate) => {
                        const unlocked =
                          isCheatMode ||
                          isEquipmentUnlocked(state, candidate.id) ||
                          activeSlotId === candidate.id;
                        if (!unlocked) return false;
                        if (editingSlot === 'slot1' && !isTrueWeaponEquipment(candidate)) {
                          return false;
                        }
                        if (editingSlot === 'slot2' && isTwoHandOnlyWeapon(candidate)) {
                          return false;
                        }
                        const stInfo = getWeaponSubtypeInfo(candidate.id);
                        if (
                          loadoutSubtypeFilter !== 'ALL' &&
                          stInfo.subtype !== loadoutSubtypeFilter
                        ) {
                          return false;
                        }
                        return true;
                      })
                      .map((candidate) => {
                        const candGemVis = getWeaponGemVisuals(state, candidate.id);
                        const candStrip =
                          candidate.variantStripBase64 || candidate.hardpointSprite?.base64;
                        const stInfo = getWeaponSubtypeInfo(candidate.id);
                        const copies = getOwnedWeaponCount(state, candidate.id);
                        const isEquippedHere = activeSlotId === candidate.id;

                        return (
                          <div
                            key={candidate.id}
                            className={`p-1.5 rounded-xs border flex items-center justify-between gap-1.5 ${
                              isEquippedHere
                                ? 'bg-[#172554]/80 border-[#ffd27d]'
                                : 'bg-[#090d14] border-[#1e293b]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <SpriteCanvasIcon
                                base64={candStrip}
                                col={candGemVis.colIndex}
                                sizeClass="w-4 h-4"
                              />
                              <div className="min-w-0">
                                <div className="text-[8.5px] font-bold text-[#e2e8f0] truncate flex items-center gap-1">
                                  <span>
                                    {candidate.name} (×{copies})
                                  </span>
                                  {candidate.isPlaceholderAsset && (
                                    <span
                                      className="text-[6px] px-1 py-0.2 bg-[#334155]/60 text-[#fbbf24] border border-[#fbbf24]/40 rounded-[2px] shrink-0"
                                      title={
                                        candidate.futureAssetPlanned ||
                                        'Placeholder visual asset: dedicated sprite planned'
                                      }
                                    >
                                      PLCH
                                    </span>
                                  )}
                                </div>
                                <div className="text-[7px] text-[#94a3b8] truncate">
                                  {stInfo.subtype} · {(candidate.weightClass || 'medium').toUpperCase()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  if (!state.equipmentSlots) return;
                                  soundSystem.playSelect();
                                  if (editingSlot === 'slot1') {
                                    state.equipmentSlots.slot1 = candidate.id;
                                    if (isTwoHandOnlyWeapon(candidate)) {
                                      if (
                                        state.equipmentSlots.slot2 &&
                                        !state.equipmentSlots.slot3
                                      ) {
                                        state.equipmentSlots.slot3 = state.equipmentSlots.slot2;
                                      }
                                      state.equipmentSlots.slot2 = null;
                                      state.equipmentSlots.mainGrip = '2h';
                                    } else if (!state.equipmentSlots.slot2) {
                                      state.equipmentSlots.mainGrip = '2h';
                                    }
                                    state.maxAmmo = candidate.shotsPerChain;
                                    state.ammo = candidate.shotsPerChain;
                                    state.reloadDuration = candidate.reloadDurationSec;
                                  } else if (editingSlot === 'slot2') {
                                    if (
                                      candidate.id === slot1Id &&
                                      isTrueWeaponEquipment(candidate) &&
                                      copies < 2
                                    ) {
                                      setMainWeaponGrip(state, '2h', {
                                        say: (txt) => {
                                          state.toastText = `${txt} (ACQUIRE 2ND COPY FOR 1H PAIRED STANCE)`;
                                          state.toastTimer = 2.8;
                                        },
                                      });
                                    } else {
                                      state.equipmentSlots.slot2 = candidate.id;
                                      if (!isTwoHandOnlyWeapon(slot1Id)) {
                                        state.equipmentSlots.mainGrip = '1h';
                                      }
                                    }
                                  } else {
                                    state.equipmentSlots.slot3 = candidate.id;
                                  }
                                  state.equippedWeapons = [
                                    state.equipmentSlots.slot1,
                                    state.equipmentSlots.slot2,
                                    state.equipmentSlots.slot3,
                                  ].filter(Boolean) as string[];
                                  syncStateGates(state);
                                  notifyOrionStateChange();
                                }}
                                className={`px-2 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                                  isEquippedHere
                                    ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                                    : 'bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] border-[#475569]'
                                }`}
                              >
                                {isEquippedHere ? 'EQUIPPED' : 'EQUIP'}
                              </button>
                            </div>
                          </div>
                        );
                      })}

                    {/* Consumable options when editing Side Hand or Auxiliary */}
                    {editingSlot !== 'slot1' &&
                      (loadoutSubtypeFilter === 'ALL' || loadoutSubtypeFilter === 'Consumable') &&
                      consolidateInventorySlots(state.inventorySlots)
                        .filter((s) => Boolean(getItemDefinition(s.itemId)?.onUse))
                        .map((invSlot) => {
                          const itmDef = getItemDefinition(invSlot.itemId);
                          if (!itmDef) return null;
                          const isEquippedHere = activeSlotId === invSlot.itemId;
                          return (
                            <div
                              key={invSlot.itemId}
                              className={`p-1.5 rounded-xs border flex items-center justify-between gap-1.5 ${
                                isEquippedHere
                                  ? 'bg-[#052e16]/80 border-[#4ade80]'
                                  : 'bg-[#090d14] border-[#1e293b]'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-[8.5px] font-bold text-[#86efac] truncate">
                                  {itmDef.name} (×{invSlot.count})
                                </div>
                                <div className="text-[7px] text-[#94a3b8] truncate">
                                  Consumable · Occupies Skill 5 when in Side Hand
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (!state.equipmentSlots) return;
                                  soundSystem.playSelect();
                                  state.equipmentSlots[editingSlot] = invSlot.itemId;
                                  if (editingSlot === 'slot2' && !isTwoHandOnlyWeapon(slot1Id)) {
                                    state.equipmentSlots.mainGrip = '1h';
                                  }
                                  state.equippedWeapons = [
                                    state.equipmentSlots.slot1,
                                    state.equipmentSlots.slot2,
                                    state.equipmentSlots.slot3,
                                  ].filter(Boolean) as string[];
                                  syncStateGates(state);
                                  notifyOrionStateChange();
                                }}
                                className={`px-2 py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer shrink-0 ${
                                  isEquippedHere
                                    ? 'bg-[#4ade80] text-[#05070a] border-[#86efac]'
                                    : 'bg-[#1e293b] hover:bg-[#334155] text-[#86efac] border-[#4ade80]/60'
                                }`}
                              >
                                {isEquippedHere ? 'EQUIPPED' : 'EQUIP'}
                              </button>
                            </div>
                          );
                        })}
                  </div>
                </div>
              );
            })()}

          {/* B. Editing Chassis Hardware */}
          {(editingSlot === 'head' ||
            editingSlot === 'sensoryA' ||
            editingSlot === 'sensoryB' ||
            editingSlot === 'arms' ||
            editingSlot === 'legs' ||
            editingSlot === 'plating' ||
            editingSlot === 'reactor' ||
            editingSlot === 'aux3' ||
            editingSlot === 'aux4') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {CHASSIS_HARDWARE_CATALOG.filter((h) => h.slot === editingSlot).map((hw) => {
                const curVal =
                  editingSlot === 'head'
                    ? currentHeadName
                    : editingSlot === 'sensoryA'
                      ? currentSensoryAName
                      : editingSlot === 'sensoryB'
                        ? currentSensoryBName
                        : editingSlot === 'arms'
                          ? currentArmsName
                          : editingSlot === 'legs'
                            ? currentLegsName
                            : editingSlot === 'plating'
                              ? currentPlatingName
                              : editingSlot === 'reactor'
                                ? currentReactorName
                                : editingSlot === 'aux3'
                                  ? currentAux3Name
                                  : currentAux4Name;
                const isEquipped =
                  curVal === hw.name || Boolean(hw.legacyNames?.includes(curVal));
                return (
                  <div
                    key={hw.id}
                    className={`p-1.5 rounded-xs border flex flex-col justify-between gap-1 ${
                      isEquipped
                        ? 'bg-[#172554]/80 border-[#38bdf8]'
                        : 'bg-[#090d14] border-[#1e293b]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[8.5px] text-[#ffd27d] flex items-center justify-between gap-1">
                        <span>{hw.name}</span>
                        {hw.isPlaceholderAsset && (
                          <span
                            className="text-[6px] px-1 py-0.2 bg-[#334155]/60 text-[#fbbf24] border border-[#fbbf24]/40 rounded-[2px]"
                            title={
                              hw.futureAssetPlanned ||
                              'Placeholder visual asset: dedicated sprite planned'
                            }
                          >
                            PLCH
                          </span>
                        )}
                      </div>
                      <div className="text-[7px] text-[#38bdf8]">{hw.subtype}</div>
                      <div className="text-[7.5px] text-[#94a3b8] mt-0.5">{hw.description}</div>
                    </div>
                    <button
                      onClick={() => {
                        if (!state.equipmentSlots) return;
                        soundSystem.playSelect();
                        if (editingSlot === 'reactor') {
                          state.equipmentSlots.reactorCore = hw.name;
                        } else {
                          state.equipmentSlots[editingSlot] = hw.name;
                        }
                        if (editingSlot === 'plating' && hw.armorType) {
                          state.armor.type = hw.armorType;
                        }
                        notifyOrionStateChange();
                      }}
                      className={`w-full py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                        isEquipped
                          ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                          : 'bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] border-[#475569]'
                      }`}
                    >
                      {isEquipped ? 'EQUIPPED' : 'EQUIP HARDWARE'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* C. Editing Tactical Utility Slot */}
          {editingSlot === 'utility' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {CLASS_UTILITY_CATALOG.map((u) => {
                const isSelected = currentUtilDef.id === u.id;
                return (
                  <div
                    key={u.id}
                    className={`p-1.5 rounded-xs border flex flex-col justify-between gap-1 ${
                      isSelected
                        ? 'bg-[#052e16]/80 border-[#4ade80]'
                        : 'bg-[#090d14] border-[#1e293b]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[8.5px] text-[#ffd27d]">{u.name}</span>
                        <span className="text-[7px] text-[#38bdf8]">{u.frameModel}</span>
                      </div>
                      <div className="text-[7.5px] text-[#94a3b8] mt-0.5">{u.description}</div>
                    </div>
                    <button
                      onClick={() => {
                        soundSystem.playSelect();
                        if (state.equipmentSlots) {
                          state.equipmentSlots.utility = u.id;
                          notifyOrionStateChange();
                        }
                      }}
                      className={`w-full py-0.5 rounded-xs text-[7.5px] font-bold border cursor-pointer ${
                        isSelected
                          ? 'bg-[#4ade80] text-[#05070a] border-[#86efac]'
                          : 'bg-[#1e293b] hover:bg-[#334155] text-[#e2e8f0] border-[#475569]'
                      }`}
                    >
                      {isSelected ? 'EQUIPPED' : 'EQUIP UTILITY'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* D. Editing Action Modifications */}
          {(editingSlot === 'mod_ranged' ||
            editingSlot === 'mod_melee' ||
            editingSlot === 'mod_mobility') &&
            (() => {
              const targetCat =
                editingSlot === 'mod_ranged'
                  ? 'ranged'
                  : editingSlot === 'mod_melee'
                    ? 'melee'
                    : 'mobility';
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {ACTION_MODIFICATION_CATALOG.filter(
                    (m) =>
                      m.targetCategory === targetCat ||
                      (targetCat === 'ranged' && m.targetCategory === 'all')
                  ).map((mod) => {
                    const unlockedMods = state.equipmentSlots?.unlockedMods || [];
                    const isGenerated =
                      unlockedMods.includes(mod.id) || Boolean(state.bypassProgressionGates);
                    const isInstalled =
                      state.equipmentSlots?.installedMods?.[targetCat] === mod.id;
                    const costText = mod.gemCost
                      .map((c) => {
                        const g = GEMSTONE_REGISTRY[c.gemId];
                        const have = getInventoryGemCount(state, c.gemId);
                        return `${c.count} ${g?.name || c.gemId} (${have})`;
                      })
                      .join(' + ');

                    return (
                      <div
                        key={mod.id}
                        className={`p-1.5 rounded-xs border flex flex-col justify-between gap-1 ${
                          isInstalled
                            ? 'bg-[#2e1065]/70 border-[#c084fc]'
                            : 'bg-[#090d14] border-[#1e293b]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-[8.5px] text-[#e2e8f0]">
                            {mod.name} [{mod.targetCategory.toUpperCase()}]
                          </div>
                          <div className="text-[7.5px] text-[#86efac]">+ {mod.gainDescription}</div>
                          <div className="text-[7.5px] text-[#f87171]">
                            − {mod.drawbackDescription}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#1e293b]">
                          <span className="text-[7px] text-[#94a3b8]">
                            {isGenerated ? 'Retained in Inventory' : `Cost: ${costText}`}
                          </span>
                          {isGenerated ? (
                            <button
                              onClick={() => {
                                soundSystem.playSelect();
                                if (!state.equipmentSlots) return;
                                state.equipmentSlots.installedMods =
                                  state.equipmentSlots.installedMods || {};
                                if (isInstalled) {
                                  delete state.equipmentSlots.installedMods[targetCat];
                                } else {
                                  state.equipmentSlots.installedMods[targetCat] = mod.id;
                                }
                                notifyOrionStateChange();
                              }}
                              className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#c084fc] rounded-xs text-[7.5px] font-bold text-[#e9d5ff] cursor-pointer"
                            >
                              {isInstalled ? 'UNINSTALL' : 'INSTALL MOD'}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const ok = generateEquipmentModWithGems(state, mod.id, {
                                  say: (txt) => {
                                    state.toastText = txt;
                                    state.toastTimer = 2.6;
                                  },
                                });
                                if (ok) {
                                  soundSystem.playPowerup();
                                  if (state.equipmentSlots) {
                                    state.equipmentSlots.installedMods =
                                      state.equipmentSlots.installedMods || {};
                                    state.equipmentSlots.installedMods[targetCat] = mod.id;
                                  }
                                } else {
                                  soundSystem.playMenuBeep();
                                }
                                notifyOrionStateChange();
                              }}
                              className="px-2 py-0.5 bg-[#4c1d95] hover:bg-[#5b21b6] border border-[#a855f7] rounded-xs text-[7.5px] font-bold text-white cursor-pointer"
                            >
                              ◆ GENERATE & INSTALL
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          {/* E. Editing Multi-Source Trigger Action Bindings ([L] / [R]) */}
          {(editingSlot === 'bind_l' || editingSlot === 'bind_r') && (
            <div className="space-y-1 max-h-[210px] overflow-y-auto pr-1">
              {ASSIGNABLE_ACTION_CATALOG.map((catalogItem) => {
                const resolved = getResolvedActionDescriptor(state, catalogItem.id);
                const unlockInfo = isActionUnlocked(state, catalogItem.id);
                const isAssignedL =
                  (state.assignedActions?.L || 'weapon_skill_1') === catalogItem.id;
                const isAssignedR =
                  (state.assignedActions?.R || 'weapon_skill_2') === catalogItem.id;

                return (
                  <div
                    key={catalogItem.id}
                    className={`p-1.5 bg-[#090d14] rounded-xs border flex items-center justify-between gap-2 ${
                      unlockInfo.unlocked ? 'border-[#1e293b]' : 'border-[#334155]/40 opacity-60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-[8.5px] text-[#e2e8f0] truncate">
                        {resolved.name}{' '}
                        <span className="text-[7px] text-[#38bdf8]">
                          [{resolved.sourceCategory.toUpperCase()}]
                        </span>
                      </div>
                      <div className="text-[7.5px] text-[#94a3b8] truncate">
                        {resolved.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          soundSystem.playSelect();
                          assignTriggerAction(state, 'L', catalogItem.id);
                        }}
                        className={`px-1.5 py-0.5 rounded-xs font-bold text-[7.5px] border cursor-pointer ${
                          isAssignedL
                            ? 'bg-[#38bdf8] text-[#05070a] border-[#7dd3fc]'
                            : 'bg-[#0f172a] text-[#94a3b8] border-[#334155]'
                        }`}
                      >
                        {isAssignedL ? 'BOUND [L]' : 'BIND L'}
                      </button>
                      <button
                        onClick={() => {
                          soundSystem.playSelect();
                          assignTriggerAction(state, 'R', catalogItem.id);
                        }}
                        className={`px-1.5 py-0.5 rounded-xs font-bold text-[7.5px] border cursor-pointer ${
                          isAssignedR
                            ? 'bg-[#c084fc] text-[#05070a] border-[#e879f9]'
                            : 'bg-[#0f172a] text-[#94a3b8] border-[#334155]'
                        }`}
                      >
                        {isAssignedR ? 'BOUND [R]' : 'BIND R'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface SatchelInventoryTabProps {
  state: OrionState;
  isCheatMode: boolean;
  invCategory: EquipmentInventoryCategory;
  setInvCategory: React.Dispatch<React.SetStateAction<EquipmentInventoryCategory>>;
  invSubtype: string;
  setInvSubtype: React.Dispatch<React.SetStateAction<string>>;
  openSlotEditor: (slot: EditableLoadoutSlot) => void;
  onOpenProgressionTab: () => void;
  handleUseItem: (itemId: string) => void;
}

export const SatchelInventoryTab: React.FC<SatchelInventoryTabProps> = ({
  state,
  isCheatMode,
  invCategory,
  setInvCategory,
  invSubtype,
  setInvSubtype,
  openSlotEditor,
  onOpenProgressionTab,
  handleUseItem,
}) => {
  const subtypeOptionsByCat: Record<EquipmentInventoryCategory, string[]> = {
    all: ['ALL'],
    weapon: [
      'ALL',
      'Ranged · Bolter / Ballista',
      'Ranged · Gatling / Ordnance',
      'Ranged · Beam / Pulse',
      'Ranged · SMG / Marksman',
      'Ranged · Boltcaster',
      'Ranged · 2H Bow',
      'Melee · Blade',
      'Melee · Blunt / Cleave',
      'Melee · Polearm / Lance',
    ],
    auxiliary: ['ALL', 'Auxiliary · Shield', 'Auxiliary · Quiver', 'Auxiliary · Catalyst'],
    hardware: [
      'ALL',
      'head',
      'sensoryA',
      'sensoryB',
      'arms',
      'legs',
      'plating',
      'reactor',
      'aux3',
      'aux4',
    ],
    utility: ['ALL'],
    mod: ['ALL', 'ranged', 'melee', 'mobility'],
    consumable: ['ALL', 'consumable', 'gemstone', 'relic'],
  };
  const activeSubtypes = subtypeOptionsByCat[invCategory] || ['ALL'];

  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 text-[10px]">
      {/* Equipment Inventory Category & Subtype Filter Header */}
      <div className="p-2 bg-[#090d14] rounded-xs border border-[#1e293b] space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-[10px] font-bold text-[#8dd7ad]">
            EQUIPMENT INVENTORY (WEAPONS · AUXILIARIES · HARDWARE · TACTICAL UTILITIES · MODS · SATCHEL):
          </span>
          {isCheatMode && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundSystem.playPowerup();
                  for (const flaskId of [
                    'grail_water',
                    'demantoid_flask',
                    'spinel_flask',
                    'carnelian_flask',
                    'titanite_flask',
                    'kyanite_flask',
                    'charoite_flask',
                    'rubellite_flask',
                    'hematite_flask',
                  ]) {
                    addOrionInventoryItem(state, flaskId, 1);
                  }
                  state.toastText = 'ADDED +1 OF ALL 9 GEMSTONE BELT FLASKS TO SATCHEL';
                  state.toastTimer = 2.5;
                  notifyOrionStateChange();
                }}
                className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#8dd7ad]/60 rounded-xs font-bold text-[7.5px] text-[#8dd7ad] cursor-pointer"
              >
                +1 ALL FLASKS
              </button>
              <button
                onClick={() => {
                  soundSystem.playPowerup();
                  for (const relicId of [
                    'rusted_gate_key',
                    'sanctum_lock',
                    'bedivere_ring',
                    'bedivere_list',
                    'bedivere_relic',
                  ]) {
                    addOrionInventoryItem(state, relicId, 1);
                  }
                  state.toastText = 'ADDED RELICS & KEYS TO SATCHEL';
                  state.toastTimer = 2.5;
                  notifyOrionStateChange();
                }}
                className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-[#ffd27d]/60 rounded-xs font-bold text-[7.5px] text-[#ffd27d] cursor-pointer"
              >
                +1 RELICS & KEYS
              </button>
            </div>
          )}
        </div>

        {/* Primary Equipment Type Filter */}
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: 'all', label: 'All Equipment' },
              { id: 'weapon', label: 'Weapons' },
              { id: 'auxiliary', label: 'Auxiliaries' },
              { id: 'hardware', label: 'Chassis Hardware' },
              { id: 'utility', label: 'Tactical Utilities' },
              { id: 'mod', label: 'Action Mods' },
              { id: 'consumable', label: 'Consumables & Satchel' },
            ] as Array<{ id: EquipmentInventoryCategory; label: string }>
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundSystem.playSelect();
                setInvCategory(cat.id);
                setInvSubtype('ALL');
              }}
              className={`px-2 py-0.5 rounded-xs text-[8px] font-bold border cursor-pointer ${
                invCategory === cat.id
                  ? 'bg-[#8dd7ad] text-[#05070a] border-[#6ee7b7]'
                  : 'bg-[#0f172a] text-[#94a3b8] border-[#334155] hover:border-[#8dd7ad]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Subtype Filter */}
        {activeSubtypes.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            <span className="text-[7.5px] text-[#94a3b8] font-bold">SUBTYPE:</span>
            {activeSubtypes.map((st) => (
              <button
                key={st}
                onClick={() => setInvSubtype(st)}
                className={`px-1.5 py-0.2 rounded-xs text-[7px] font-bold border cursor-pointer ${
                  invSubtype === st
                    ? 'bg-[#ffd27d] text-[#05070a] border-[#fbbf24]'
                    : 'bg-[#090d14] text-[#94a3b8] border-[#1e293b]'
                }`}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 1. Owned Weapons & Auxiliaries Inventory */}
      {(invCategory === 'all' || invCategory === 'weapon' || invCategory === 'auxiliary') && (
        <div className="space-y-1">
          <div className="text-[8.5px] font-bold text-[#ffd27d]">
            OWNED WEAPONS & AUXILIARIES INVENTORY:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {Object.values(WEAPON_REGISTRY)
              .filter((w) => {
                const unlocked = isCheatMode || isEquipmentUnlocked(state, w.id);
                if (!unlocked) return false;
                const isAux = isAuxiliaryEquipment(w);
                if (invCategory === 'weapon' && isAux) return false;
                if (invCategory === 'auxiliary' && !isAux) return false;
                const stInfo = getWeaponSubtypeInfo(w.id);
                if (invSubtype !== 'ALL' && stInfo.subtype !== invSubtype) return false;
                return true;
              })
              .map((w) => {
                const stInfo = getWeaponSubtypeInfo(w.id);
                const copies = getOwnedWeaponCount(state, w.id);
                const gemVis = getWeaponGemVisuals(state, w.id);
                const strip = w.variantStripBase64 || w.hardpointSprite?.base64;
                const inMain = state.equipmentSlots?.slot1 === w.id;
                const inSide = state.equipmentSlots?.slot2 === w.id;
                const inAux = state.equipmentSlots?.slot3 === w.id;

                return (
                  <div
                    key={w.id}
                    className="p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <SpriteCanvasIcon
                        base64={strip}
                        col={gemVis.colIndex}
                        sizeClass="w-4 h-4"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-[9px] text-[#ffd27d] truncate">
                          {w.name} <span className="text-[#94a3b8]">×{copies}</span>
                        </div>
                        <div className="text-[7.5px] text-[#7dd3fc] truncate">
                          {stInfo.subtype} · {(w.weightClass || 'medium').toUpperCase()}
                          {inMain ? ' · [MAIN]' : ''}
                          {inSide ? ' · [SIDE]' : ''}
                          {inAux ? ' · [AUX]' : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => openSlotEditor(isAuxiliaryEquipment(w) ? 'slot2' : 'slot1')}
                      className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[7.5px] font-bold cursor-pointer shrink-0"
                    >
                      EDIT IN LOADOUT
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 2. Chassis Hardware, Tactical Utilities & Retained Action Mods Inventory */}
      {(invCategory === 'all' ||
        invCategory === 'hardware' ||
        invCategory === 'utility' ||
        invCategory === 'mod') && (
        <div className="space-y-1">
          <div className="text-[8.5px] font-bold text-[#38bdf8]">
            CHASSIS HARDWARE, TACTICAL UTILITIES & ACTION MODS INVENTORY:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {(invCategory === 'all' || invCategory === 'hardware') &&
              CHASSIS_HARDWARE_CATALOG.filter(
                (hw) => invSubtype === 'ALL' || hw.slot === invSubtype
              ).map((hw) => (
                <div
                  key={hw.id}
                  className="p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-[8.5px] text-[#e2e8f0] truncate flex items-center gap-1">
                      <span>{hw.name}</span>
                      {hw.isPlaceholderAsset && (
                        <span
                          className="text-[6px] px-1 py-0.2 bg-[#334155]/60 text-[#fbbf24] border border-[#fbbf24]/40 rounded-[2px] shrink-0"
                          title={
                            hw.futureAssetPlanned ||
                            'Placeholder visual asset: dedicated sprite planned'
                          }
                        >
                          PLCH
                        </span>
                      )}
                    </div>
                    <div className="text-[7px] text-[#94a3b8] truncate">
                      Hardware · {hw.slot.toUpperCase()} · {hw.subtype}
                    </div>
                  </div>
                  <button
                    onClick={() => openSlotEditor(hw.slot)}
                    className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 rounded-xs text-[7.5px] font-bold cursor-pointer shrink-0"
                  >
                    EDIT IN LOADOUT
                  </button>
                </div>
              ))}

            {(invCategory === 'all' || invCategory === 'utility') &&
              CLASS_UTILITY_CATALOG.map((u) => (
                <div
                  key={u.id}
                  className="p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-[8.5px] text-[#4ade80] truncate">{u.name}</div>
                    <div className="text-[7px] text-[#94a3b8] truncate">
                      Tactical Utility · {u.frameModel}
                    </div>
                  </div>
                  <button
                    onClick={() => openSlotEditor('utility')}
                    className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#4ade80] border border-[#4ade80]/50 rounded-xs text-[7.5px] font-bold cursor-pointer shrink-0"
                  >
                    EDIT IN LOADOUT
                  </button>
                </div>
              ))}

            {(invCategory === 'all' || invCategory === 'mod') &&
              ACTION_MODIFICATION_CATALOG.filter((m) => {
                const retained =
                  (state.equipmentSlots?.unlockedMods || []).includes(m.id) ||
                  Boolean(state.bypassProgressionGates);
                if (!retained && invCategory === 'all') return false;
                if (invSubtype !== 'ALL' && m.targetCategory !== invSubtype) return false;
                return true;
              }).map((m) => (
                <div
                  key={m.id}
                  className="p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-[8.5px] text-[#c084fc] truncate">{m.name}</div>
                    <div className="text-[7px] text-[#94a3b8] truncate">
                      Action Mod · {m.targetCategory.toUpperCase()}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      openSlotEditor(
                        m.targetCategory === 'melee'
                          ? 'mod_melee'
                          : m.targetCategory === 'mobility'
                            ? 'mod_mobility'
                            : 'mod_ranged'
                      )
                    }
                    className="px-2 py-0.5 bg-[#1e293b] hover:bg-[#334155] text-[#c084fc] border border-[#c084fc]/50 rounded-xs text-[7.5px] font-bold cursor-pointer shrink-0"
                  >
                    EDIT IN LOADOUT
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 3. Consumables, Gemstones & Relics Satchel */}
      {(invCategory === 'all' || invCategory === 'consumable') && (
        <div className="space-y-1">
          <div className="text-[8.5px] font-bold text-[#8dd7ad]">
            SALVAGED CONSUMABLES, GEMSTONES & RELICS:
          </div>
          {state.inventorySlots.length === 0 ? (
            <div className="text-center text-[#64748b] py-4 italic">
              No salvage in satchel. Explore drop-pod marshlands and loot caches.
            </div>
          ) : (
            consolidateInventorySlots(state.inventorySlots)
              .filter((slot) => {
                const def = getItemDefinition(slot.itemId);
                if (!def) return false;
                const isGem = slot.itemId in GEMSTONE_REGISTRY;
                const cat = isGem ? 'gemstone' : def.category;
                if (invCategory === 'consumable' && invSubtype !== 'ALL' && cat !== invSubtype) {
                  return false;
                }
                return true;
              })
              .map((slot, idx) => {
                const def = getItemDefinition(slot.itemId);
                if (!def) return null;
                const isGem = slot.itemId in GEMSTONE_REGISTRY;
                return (
                  <div
                    key={`${slot.itemId}-${idx}`}
                    className="flex items-center justify-between p-1.5 bg-[#090d14] rounded-xs border border-[#1e293b]"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="font-bold text-[#ffd27d] flex items-center gap-1.5 flex-wrap">
                        {def.iconSprite?.base64 ? (
                          <SpriteCanvasIcon
                            base64={def.iconSprite.base64}
                            col={def.iconSprite.col || 0}
                            sizeClass="w-4 h-4"
                          />
                        ) : (
                          <span className="text-[#38bdf8]">◆</span>
                        )}
                        <span>{def.name}</span>
                        <span className="text-[#94a3b8]">×{slot.count}</span>
                        <span className="text-[8px] text-[#94a3b8]">
                          · {isGem ? 'gemstone' : def.category}
                        </span>
                      </div>
                      <div className="text-[8.5px] text-[#94a3b8]">{def.description}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {isGem && (
                        <button
                          onClick={() => {
                            soundSystem.playSelect();
                            onOpenProgressionTab();
                          }}
                          className="px-1.5 py-1 bg-[#172554] hover:bg-[#1e3a8a] text-[#7dd3fc] font-bold rounded-xs border border-[#38bdf8]/60 text-[8px] cursor-pointer"
                        >
                          SKILLS / FEATS
                        </button>
                      )}
                      {def.category === 'consumable' && (
                        <button
                          onClick={() => openSlotEditor('slot2')}
                          className="px-1.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#86efac] font-bold rounded-xs border border-[#4ade80]/50 text-[8px] cursor-pointer"
                        >
                          EQUIP IN LOADOUT
                        </button>
                      )}
                      {def.onUse && (
                        <button
                          onClick={() => handleUseItem(slot.itemId)}
                          className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] font-bold rounded-xs border border-[#475569] text-[8.5px] cursor-pointer"
                        >
                          USE
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
};
