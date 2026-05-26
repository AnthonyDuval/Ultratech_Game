/**
 * Réactions terminal selon factions / suspicion / corruption
 */

import { getSuspicionLevel, getCorruptionLevel, hasNarrativeFlag } from './narrativeState.js';

export function getNarrativeTerminalLines(state, command) {
  const lines = [];
  const suspicion = getSuspicionLevel(state);
  const corruption = getCorruptionLevel(state);
  const trustNova = state.trustNova ?? 30;
  const trustUT = state.trustUltraTech ?? 50;

  if (suspicion >= 40 && Math.random() < 0.35) {
    lines.push('[SEC] Activité non conforme détectée.');
  }

  if (corruption >= 50 && command === 'help') {
    lines.push('[???] Protocoles... instables...');
  }

  if (trustNova >= 55 && hasNarrativeFlag(state, 'helpedNova')) {
    if (command === 'scan' || command === 'status') {
      lines.push('[NOVA] Tu regardes au mauvais endroit. Parfois.');
    }
  }

  if (trustUT >= 65 && command === 'connect') {
    lines.push('[UT] Connexion monitorée — conformité active.');
  }

  if (hasNarrativeFlag(state, 'deletedRelayData') && command === 'trace') {
    lines.push('[SYS] Traces atténuées. Quelqu\'un a effacé black-07.');
  }

  return lines;
}

export function getHiddenCommandHint(state) {
  if ((state.trustNova ?? 0) >= 60 && hasNarrativeFlag(state, 'helpedNova')) {
    return 'trace';
  }
  return null;
}
