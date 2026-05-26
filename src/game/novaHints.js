/**
 * Indices NOVA — discrets, jamais de commande complète hors mission 1
 */

import { getPrimaryActiveMission, getCurrentStep } from '../data/missions.js';
import { isMission1Phase } from './guidanceLevel.js';

const STUCK_HINTS = {
  'ghost-signal': {
    scan_0x7f: 'Tu regardes au mauvais endroit. Essaie le protocole SCAN.',
    connect_0x7f: 'Analyse faite. Le tunnel attend.',
  },
  'black-relay': {
    scan_black07: 'black-07 répond aux requêtes de surface.',
    connect_black07: 'Le relais refuse toute connexion non analysée.',
  },
  'dead-archive': {
    decrypt_archive2077: 'archive_2077 n\'est pas lisible en clair.',
  },
  surveillance: {
    trace_cleared: 'TRACE : activité résiduelle détectée.',
  },
};

const RP_FRAGMENTS = [
  'Le réseau parle en protocoles, pas en menus.',
  'Ils observent chaque hésitation.',
  'Un fragment manque encore dans le puzzle.',
  'Le terminal connaît les formes. Pas les réponses.',
];

export function getStuckHintForMission(missionId, stepFlag) {
  return STUCK_HINTS[missionId]?.[stepFlag] ?? null;
}

export function getRandomNovaFragment() {
  return RP_FRAGMENTS[Math.floor(Math.random() * RP_FRAGMENTS.length)];
}

export function buildNovaStuckHelp(state) {
  const mission = getPrimaryActiveMission(
    state.discoveredMissions ?? [],
    state.completedMissions ?? []
  );

  if (!mission) {
    return {
      id: 'nova-stuck-idle',
      message: getRandomNovaFragment(),
      source: 'nova',
    };
  }

  const step = getCurrentStep(mission, state.narrativeFlags ?? {});
  const specific = step ? getStuckHintForMission(mission.id, step.flag) : null;

  const help = {
    id: `nova-stuck-${mission.id}`,
    message: specific ?? step?.rpHint ?? getRandomNovaFragment(),
    source: 'nova',
  };

  if (step?.target) help.target = step.target;
  if (step?.protocol) help.protocol = step.protocol;

  if (isMission1Phase(state) && mission.id === 'ghost-signal' && step?.suggestedCommand) {
    help.revealCommand = true;
    help.command = step.suggestedCommand;
  }

  return help;
}

export function getNovaTerminalHint(state) {
  const mission = getPrimaryActiveMission(
    state.discoveredMissions ?? [],
    state.completedMissions ?? []
  );
  if (!mission) return getRandomNovaFragment();

  const step = getCurrentStep(mission, state.narrativeFlags ?? {});
  if (step?.rpHint) return step.rpHint;

  const specific = step ? getStuckHintForMission(mission.id, step.flag) : null;
  if (specific) return specific;

  if (step?.hint && mission.guidanceLevel === 'tutorial') return step.hint;

  return getRandomNovaFragment();
}
