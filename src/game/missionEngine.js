/**
 * Moteur de missions — découverte via mails, validation via flags terminal
 */

import { MISSIONS, getMissionById, getMissionProgress, getMissionForFlag } from '../data/missions.js';
import { getMailById } from '../data/mails.js';
import { markProgress } from './stuckTimer.js';

function clampStat(v, min = 0, max = 100) {
  return Math.min(max, Math.max(min, v));
}

export function discoverMission(missionId, state, dispatch) {
  if (state.discoveredMissions?.includes(missionId)) return;
  const mission = getMissionById(missionId);
  if (!mission) return;

  dispatch({ type: 'DISCOVER_MISSION', missionId });
  dispatch({ type: 'ADD_TERMINAL_LOG', log: `[MISSION] Nouvelle opération — ${mission.title}` });
}

/** Mail lu → indices + mails chaînés + découverte mission */
export function onMailRead(mailId, state, dispatch) {
  const mail = getMailById(mailId);
  if (mail?.clue) {
    dispatch({ type: 'ADD_DISCOVERED_CLUE', clue: mail.clue });
  }

  const mission = MISSIONS.find((m) => m.discoverOnMailRead === mailId);
  if (mission) {
    discoverMission(mission.id, state, dispatch);
  }

  markProgress(state, dispatch);
}

export function completeMission(missionId, state, dispatch) {
  if (state.completedMissions?.includes(missionId)) return;

  const mission = getMissionById(missionId);
  if (!mission) return;

  const r = mission.rewards ?? {};
  dispatch({ type: 'COMPLETE_MISSION', missionId });
  dispatch({
    type: 'UPDATE_STATS',
    bittek: state.bittek + (r.bittek ?? 0),
    reputation: state.reputation + (r.reputation ?? 0),
    corruption: clampStat(state.corruption + (r.corruption ?? 0)),
    suspicionUltraTech: clampStat(state.suspicionUltraTech + (r.suspicion ?? 0)),
  });
  dispatch({ type: 'ADD_TERMINAL_LOG', log: `[OK] Opération clôturée — ${mission.title}` });

  if (mission.unlockMailsOnComplete?.length) {
    dispatch({ type: 'UNLOCK_MAILS', mailIds: mission.unlockMailsOnComplete });
  }

  markProgress({ ...state, completedMissions: [...state.completedMissions, missionId] }, dispatch);
}

/** Enregistre une étape terminal dans missionSteps + narrativeFlags */
export function recordTerminalProgress(flagName, nodeId, state, dispatch) {
  dispatch({ type: 'SET_NARRATIVE_FLAG', flag: flagName, value: true });

  if (nodeId) {
    dispatch({ type: 'ADD_DISCOVERED_NODE', nodeId });
  }

  const mission = getMissionForFlag(flagName);
  if (mission) {
    dispatch({ type: 'RECORD_MISSION_STEP', missionId: mission.id, stepFlag: flagName });
  }

  dispatch({ type: 'ADD_TERMINAL_LOG', log: `[SYS] Progression enregistrée — ${flagName}` });

  const flags = { ...state.narrativeFlags, [flagName]: true };
  checkMissionCompletion({ ...state, narrativeFlags: flags }, dispatch);
  triggerSurveillanceEvent({ ...state, narrativeFlags: flags, suspicionUltraTech: state.suspicionUltraTech }, dispatch);
}

export function checkMissionCompletion(state, dispatch) {
  for (const missionId of state.discoveredMissions ?? []) {
    if (state.completedMissions?.includes(missionId)) continue;
    const mission = getMissionById(missionId);
    if (!mission) continue;

    if (getMissionProgress(mission, state.narrativeFlags) >= 1) {
      completeMission(missionId, state, dispatch);
    }
  }
}

export function triggerSurveillanceEvent(state, dispatch) {
  if (state.narrativeFlags?.surveillance_event_fired) return;
  if ((state.suspicionUltraTech ?? 0) < 25) return;

  dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'surveillance_event_fired', value: true });
  dispatch({ type: 'ADD_TERMINAL_LOG', log: '[!!!] Scan passif UltraTech — corrélation en cours' });
}
