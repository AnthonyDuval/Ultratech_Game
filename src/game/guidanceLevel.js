/**
 * Niveau de guidage global (0–3) — tutoriel → autonomie → enquête
 */

import { getPrimaryActiveMission } from '../data/missions.js';
import { isGhostSignalDone } from './missionGuards.js';

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

export function isMission1Phase(state) {
  return !isGhostSignalDone(state.completedMissions ?? []);
}

export function getGuidanceTitle(level, source = 'system') {
  if (source === 'nova') return 'NOVA';
  if (source === 'anon') return 'FRAGMENT';
  if (level === 0) return 'PROCHAINE ACTION';
  return 'SIGNAL';
}

/** Commande exacte — mission 1 uniquement */
export function shouldRevealCommandInHelp(state) {
  return isMission1Phase(state);
}

/** « Commande probable » dans Opérations — mission 1 uniquement */
export function shouldShowMissionCommand(state, mission) {
  if (!mission || !isMission1Phase(state)) return false;
  if (mission.guidanceLevel !== 'tutorial' || mission.id !== 'ghost-signal') return false;
  const step = mission.steps?.find((s) => !state.narrativeFlags?.[s.flag]);
  return Boolean(step?.suggestedCommand);
}

/** GuidanceHint visible — rare après mission 1 */
export function shouldShowGuidanceHint(state) {
  if (state.narrativeFlags?.stuck_hint_active) return true;
  if (isMission1Phase(state)) return true;
  return hasUnreadNarrativeMail(state);
}

function hasUnreadNarrativeMail(state) {
  const read = state.readMails ?? [];
  const unlocked = state.unlockedMails ?? [];
  const pending = [
    'mail-relay-hint',
    'mail-relay-dilemma',
    'mail-archive-leak',
    'mail-ultratech-alert',
    'mail-nova-whisper',
  ];
  return pending.some((id) => unlocked.includes(id) && !read.includes(id));
}

export function getProtocolLabel(mission, guidanceLevel) {
  if (mission?.guidanceLevel === 'tutorial') return 'Protocole suggéré';
  if (mission?.guidanceLevel === 'semi') return 'Protocole observé';
  return 'Protocole';
}

export function getHintLabel(mission) {
  if (mission?.guidanceLevel === 'free') return 'Fragment';
  if (mission?.guidanceLevel === 'semi') return 'Indice RP';
  return 'Indice';
}

export function getMissionRiskLabel(state) {
  const suspicion = state.suspicionUltraTech ?? 0;
  if (suspicion >= 60) return 'Élevé';
  if (suspicion >= 30) return 'Modéré';
  return 'Contenu';
}

export function getActiveMissionGuidanceLevel(state) {
  const mission = getPrimaryActiveMission(
    state.discoveredMissions ?? [],
    state.completedMissions ?? []
  );
  return mission?.guidanceLevel ?? 'free';
}
