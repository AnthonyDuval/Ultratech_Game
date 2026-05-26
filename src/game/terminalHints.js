/**
 * Contexte objectif terminal — objectif / hint (RP)
 */

import {
  getPrimaryActiveMission,
  getCurrentStep,
  getCurrentObjective,
  getSuggestedCommand,
  getNextStepText,
} from '../data/missions.js';

export function getObjectiveContext(state) {
  const mission = getPrimaryActiveMission(
    state.discoveredMissions ?? [],
    state.completedMissions ?? []
  );

  if (!mission) {
    const read = state.readMails ?? [];
    if (!read.includes('mail-welcome')) {
      return {
        title: 'Aucune mission active',
        lines: ['Ouvrez Mails et lisez le message de bienvenue.'],
      };
    }
    if (!read.includes('mail-ghost-brief')) {
      return {
        title: 'Aucune mission active',
        lines: ['Lisez le brief « Signal fantôme » dans Mails.'],
      };
    }
    return {
      title: 'Aucune mission active',
      lines: ['Consultez Opérations pour le journal de quête.'],
    };
  }

  const flags = state.narrativeFlags ?? {};
  const step = getCurrentStep(mission, flags);
  const lines = [
    `Mission : ${mission.title}`,
    `Objectif : ${getCurrentObjective(mission, flags)}`,
  ];

  if (step?.target) lines.push(`Cible : ${step.target}`);
  if (step?.protocol) lines.push(`Protocole : ${step.protocol}`);
  if (step?.hint) lines.push(`Indice : ${step.hint}`);

  const cmd = getSuggestedCommand(mission, flags);
  if (cmd && mission.guided) {
    lines.push(`Commande probable : ${cmd}`);
  }

  return { title: 'Objectif actuel', lines };
}

export function getHintContext(state) {
  const mission = getPrimaryActiveMission(
    state.discoveredMissions ?? [],
    state.completedMissions ?? []
  );

  if (!mission) {
    return { title: 'Indice', lines: ['Lisez vos mails et consultez Opérations.'] };
  }

  const flags = state.narrativeFlags ?? {};
  const step = getCurrentStep(mission, flags);

  if (step?.protocol && step?.target && mission.guided) {
    return {
      title: 'Indice',
      lines: [
        `Protocole ${step.protocol} — cible ${step.target}.`,
        'Croisez avec le journal Opérations pour la commande exacte.',
      ],
    };
  }

  const cmd = getSuggestedCommand(mission, flags);
  if (cmd && !mission.guided) {
    return {
      title: 'Indice',
      lines: [step?.hint ?? 'Relisez les mails et les indices découverts.'],
    };
  }

  const next = getNextStepText(mission, flags);
  if (next) {
    return { title: 'Indice', lines: [next] };
  }

  return { title: 'Indice', lines: ['Consultez Opérations.'] };
}

export const APPS_HELP = [
  '── Applications UltraTech OS ──',
  '',
  '  Mails       — briefings et cibles réseau',
  '  Opérations  — journal de quête (cible, protocole)',
  '  Terminal    — exécution des protocoles SCAN, CONNECT…',
  '  Profil      — stats et missions clôturées',
  '',
  'Flux : lire Mails → consulter Opérations → agir dans Terminal',
];
