/**
 * Contexte objectif terminal — objectif / hint (RP, évolutif)
 */

import {
  getPrimaryActiveMission,
  getCurrentStep,
  getCurrentObjective,
} from '../data/missions.js';
import { computeGuidanceLevel, shouldRevealCommandInHelp, isMission1Phase } from './guidanceLevel.js';
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
  if (step?.protocol) lines.push(`Protocole observé : ${step.protocol}`);

  if (step?.rpHint && !isMission1Phase(state)) {
    lines.push(step.rpHint);
  } else if (step?.hint && isMission1Phase(state)) {
    lines.push(`Indice : ${step.hint}`);
  }

  if (shouldRevealCommandInHelp(state) && step?.suggestedCommand && mission.guidanceLevel === 'tutorial') {
    lines.push(`Commande probable : ${step.suggestedCommand}`);
  }

  return { title: level >= 1 ? 'Fragment' : 'Objectif actuel', lines };
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

  if (!isMission1Phase(state)) {
    return {
      title: 'NOVA',
      lines: [getNovaTerminalHint(state)],
    };
  }

  if (step?.protocol && step?.target) {
    return {
      title: 'Indice',
      lines: [
        `Protocole ${step.protocol} — cible ${step.target}.`,
        'Composez [protocole] [cible] dans le terminal.',
      ],
    };
  }

  return {
    title: 'Indice',
    lines: [step?.hint ?? 'Consultez Opérations et vos mails.'],
  };
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
