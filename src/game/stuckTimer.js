/**
 * Détection de blocage — débloque une aide NOVA discrète
 */

import { computeGuidanceLevel } from './guidanceLevel.js';
import { getPrimaryActiveMission, getCurrentStep } from '../data/missions.js';

export const STUCK_THRESHOLD_MS = 3 * 60 * 1000;
export const STUCK_CHECK_MS = 30 * 1000;

export function getProgressFingerprint(state) {
  const mission = getPrimaryActiveMission(
    state.discoveredMissions ?? [],
    state.completedMissions ?? []
  );
  const step = mission ? getCurrentStep(mission, state.narrativeFlags ?? {}) : null;
  return [
    (state.completedMissions ?? []).join(','),
    (state.readMails ?? []).join(','),
    step?.flag ?? 'none',
    JSON.stringify(state.narrativeFlags ?? {}),
  ].join('|');
}

export function shouldMonitorStuck(state) {
  if (!state.tutorialCompleted) return false;
  if (computeGuidanceLevel(state) === 0) return false;
  if (state.narrativeFlags?.stuck_hint_active) return false;
  return Boolean(getPrimaryActiveMission(
    state.discoveredMissions ?? [],
    state.completedMissions ?? []
  ));
}

export function markProgress(state, dispatch) {
  dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'last_progress_at', value: new Date().toISOString() });
  dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'stuck_hint_active', value: false });
  dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'progress_fingerprint', value: getProgressFingerprint(state) });
}

export function recordTerminalCommand(state, dispatch, cmd) {
  const normalized = cmd.trim().toLowerCase();
  if (!normalized) return;

  const lastCmd = state.narrativeFlags?.last_terminal_cmd;
  const repeatCount = state.narrativeFlags?.terminal_cmd_repeat ?? 0;
  const isRepeat = lastCmd === normalized;

  dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'last_terminal_cmd', value: normalized });
  dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'terminal_cmd_repeat', value: isRepeat ? repeatCount + 1 : 0 });

  if (isRepeat && repeatCount >= 4) {
    dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'stuck_hint_active', value: true });
  }
}
