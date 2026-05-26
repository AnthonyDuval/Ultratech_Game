/**
 * Niveau de guidage global (0–3) — tutoriel → autonomie → enquête
 */

import { getPrimaryActiveMission } from '../data/missions.js';

/** @returns {0|1|2|3} */
export function computeGuidanceLevel(state) {
  const completed = state.completedMissions ?? [];
  const flags = state.narrativeFlags ?? {};
  let level = 0;

  if (completed.includes('ghost-signal')) level = Math.max(level, 1);
  if (completed.includes('black-relay')) level = Math.max(level, 2);
  if (completed.includes('dead-archive')) level = Math.max(level, 2);
  if (completed.includes('surveillance')) level = 3;

  const mastered = ['scan_0x7f', 'connect_0x7f', 'scan_black07', 'connect_black07']
    .filter((f) => flags[f]).length;
  if (mastered >= 2 && level < 1) level = 1;
  if (mastered >= 4 && level < 2) level = 2;

  const terminalOpens = flags.terminal_open_count ?? 0;
  if (terminalOpens >= 10 && level < 1) level = 1;
  if (terminalOpens >= 20 && level < 2) level = 2;

  const playMinutes = getPlayMinutes(state);
  if (playMinutes >= 12 && level < 1) level = 1;
  if (playMinutes >= 25 && level < 2) level = 2;

  return Math.min(3, level);
}

function getPlayMinutes(state) {
  const start = state.narrativeFlags?.session_started_at;
  if (!start) return 0;
  const ms = Date.now() - new Date(start).getTime();
  return Math.max(0, ms / 60000);
}

export function getGuidanceTitle(level, source = 'system') {
  if (source === 'nova') return 'NOVA';
  if (source === 'anon') return 'FRAGMENT';
  switch (level) {
    case 0: return 'PROCHAINE ACTION';
    case 1: return 'INDICE';
    case 2: return 'SURVEILLANCE';
    default: return '…';
  }
}

/** Afficher la commande exacte dans l'aide UI */
export function shouldRevealCommandInHelp(state, missionGuidanceLevel) {
  const level = computeGuidanceLevel(state);
  const stuck = state.narrativeFlags?.stuck_hint_active;

  if (missionGuidanceLevel === 'tutorial') return true;
  if (missionGuidanceLevel === 'semi') return level < 1 || stuck;
  if (stuck) return true;
  return false;
}

/** Afficher « commande probable » dans Opérations */
export function shouldShowMissionCommand(state, mission) {
  if (!mission) return false;
  const step = mission.steps?.find((s) => !state.narrativeFlags?.[s.flag]);
  if (!step?.suggestedCommand) return false;

  if (mission.guidanceLevel === 'tutorial') {
    return mission.id === 'ghost-signal';
  }
  if (mission.guidanceLevel === 'semi') {
    return computeGuidanceLevel(state) === 0;
  }
  return false;
}

export function shouldShowGuidanceHint(state) {
  const level = computeGuidanceLevel(state);
  if (level >= 3 && !state.narrativeFlags?.stuck_hint_active) return false;
  return true;
}

export function getActiveMissionGuidanceLevel(state) {
  const mission = getPrimaryActiveMission(
    state.discoveredMissions ?? [],
    state.completedMissions ?? []
  );
  return mission?.guidanceLevel ?? 'free';
}
