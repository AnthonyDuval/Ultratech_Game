import { GAME_VERSION } from '../config/version.js';

export function buildBugReport(state) {
  const completed = state.completedMissions ?? [];
  const discovered = state.discoveredMissions ?? [];
  const unlocked = state.unlockedMails ?? [];
  const read = state.readMails ?? [];
  const logs = (state.terminalLogs ?? []).slice(-15);

  const lines = [
    '=== ULTRATECH OS — RAPPORT BUG ===',
    `Version: ${GAME_VERSION}`,
    `Date/heure: ${new Date().toLocaleString('fr-FR')}`,
    `Navigateur: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'inconnu'}`,
    '',
    '--- Progression ---',
    `Utilisateur: ${state.username || '(non défini)'}`,
    `Phase: ${state.phase ?? 'desktop'}`,
    `Tutoriel terminé: ${Boolean(state.tutorialCompleted)}`,
    `BitTek: ${state.bittek ?? 0}`,
    `Réputation: ${state.reputation ?? 0}`,
    `Corruption: ${state.corruption ?? 0}%`,
    `Surveillance UltraTech: ${state.suspicionUltraTech ?? 0}%`,
    `Alignement: ${state.factionAlignment ?? 'neutral'}`,
    `Confiance UltraTech: ${state.trustUltraTech ?? 50}`,
    `Confiance NOVA: ${state.trustNova ?? 30}`,
    '',
    '--- Choix narratifs ---',
    JSON.stringify(state.choices ?? {}, null, 2),
    '',
    `Missions terminées (${completed.length}): ${completed.join(', ') || 'aucune'}`,
    `Missions découvertes (${discovered.length}): ${discovered.join(', ') || 'aucune'}`,
    '',
    `Mails débloqués (${unlocked.length}): ${unlocked.join(', ') || 'aucun'}`,
    `Mails lus (${read.length}): ${read.join(', ') || 'aucun'}`,
    '',
    '--- Flags narratifs ---',
    JSON.stringify(state.narrativeFlags ?? {}, null, 2),
    '',
    '--- Derniers logs terminal ---',
    ...(logs.length ? logs.map((line) => `  ${line}`) : ['  (aucun)']),
    '',
    '=== FIN RAPPORT ===',
  ];

  return lines.join('\n');
}
