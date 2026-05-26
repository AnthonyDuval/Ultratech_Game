/**
 * Contexte objectif terminal — objectif / hint (RP, évolutif)
 */

import {
  getPrimaryActiveMission,
  getCurrentStep,
  getCurrentObjective,
  getSuggestedCommand,
  getNextStepText,
} from '../data/missions.js';
import { computeGuidanceLevel, shouldRevealCommandInHelp } from './guidanceLevel.js';
import { getNovaTerminalHint } from './novaHints.js';

export function getObjectiveContext(state) {
  const mission = getPrimaryActiveMission(
    state.discoveredMissions ?? [],
    state.completedMissions ?? []
  );
  const level = computeGuidanceLevel(state);

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
  if (step?.rpHint && level >= 2) {
    lines.push(step.rpHint);
  } else if (step?.hint) {
    lines.push(`Indice : ${step.hint}`);
  }

  const cmd = getSuggestedCommand(mission, flags);
  if (cmd && shouldRevealCommandInHelp(state, mission.guidanceLevel)) {
    lines.push(`Commande probable : ${cmd}`);
  }

  return { title: level >= 2 ? 'Fragment' : 'Objectif actuel', lines };
}

export function getHintContext(state) {
  const mission = getPrimaryActiveMission(
    state.discoveredMissions ?? [],
    state.completedMissions ?? []
  );
  const level = computeGuidanceLevel(state);

  if (!mission) {
    return { title: 'Indice', lines: ['Lisez vos mails et consultez Opérations.'] };
  }

  const flags = state.narrativeFlags ?? {};
  const step = getCurrentStep(mission, flags);

  if (level >= 2) {
    return {
      title: 'NOVA',
      lines: [getNovaTerminalHint(state)],
    };
  }

  if (step?.protocol && step?.target && mission.guided) {
    const lines = [`Protocole ${step.protocol} — cible ${step.target}.`];
    if (level === 0 && step.suggestedCommand) {
      lines.push(`Forme attendue : ${step.suggestedCommand.split(' ')[0]} <cible>`);
    } else {
      lines.push('Composez la commande dans le terminal.');
    }
    return { title: 'Indice', lines };
  }

  const next = getNextStepText(mission, flags);
  if (next) {
    return { title: 'Indice', lines: [next] };
  }

  return { title: 'Indice', lines: [step?.hint ?? 'Consultez Opérations.'] };
}

export const APPS_HELP = [
  '── Applications UltraTech OS ──',
  '',
  '  Mails       — briefings et fragments',
  '  Opérations  — journal de quête',
  '  Terminal    — protocoles réseau',
  '  Profil      — stats opérateur',
  '',
  'Les règles se découvrent en creusant.',
];
