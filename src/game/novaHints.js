/**
 * Indices NOVA — remplacent le ton tutoriel en milieu/fin de jeu
 */

import { getPrimaryActiveMission, getCurrentStep } from '../data/missions.js';

const STUCK_HINTS = {
  'ghost-signal': {
    scan_0x7f: 'Tu regardes au mauvais endroit. Essaie le protocole SCAN.',
    connect_0x7f: 'Le terminal connaît déjà la réponse. CONNECT.',
  },
  'black-relay': {
    scan_black07: 'Le relais écoute encore. SCAN avant toute trace.',
    connect_black07: 'Certaines connexions ne doivent pas être tracées. CONNECT.',
  },
  'dead-archive': {
    decrypt_archive2077: 'Le protocole n\'est pas mort. DECRYPT archive_2077.',
  },
  surveillance: {
    trace_cleared: 'Efface avant qu\'ils ne te voient. TRACE.',
  },
};

const RP_FRAGMENTS = [
  'Tu perds du temps à chercher un bouton.',
  'Le réseau parle en protocoles, pas en menus.',
  'Ils observent chaque hésitation.',
  'Le terminal connaît déjà la réponse.',
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
    message: specific ?? getRandomNovaFragment(),
    source: 'nova',
  };

  if (step?.target) help.target = step.target;
  if (step?.protocol) help.protocol = step.protocol;

  if (specific && step?.suggestedCommand && mission.guidanceLevel !== 'free') {
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
  if (step?.hint && mission.guidanceLevel === 'free') return step.hint;

  const specific = step ? getStuckHintForMission(mission.id, step.flag) : null;
  return specific ?? step?.hint ?? getRandomNovaFragment();
}
