/** Help terminal — format RP, évolutif selon progression */

export const COMMAND_HELP = {
  help: 'Affiche les protocoles autorisés.',
  clear: 'Efface l\'affichage local du terminal.',
  status: 'État opérateur : BitTek, réputation, corruption, surveillance.',
  scan: 'Analyse une cible réseau. Usage : scan <cible>',
  connect: 'Établit une connexion distante. Usage : connect <cible>',
  decrypt: 'Déchiffre une archive. Usage : decrypt <identifiant>',
  trace: 'Analyse la surveillance UltraTech et efface les traces si possible.',
  logs: 'Affiche les logs système persistants.',
  objectif: 'Rappelle l\'objectif et l\'étape actuelle.',
  hint: 'Indice sur la prochaine action.',
  apps: 'Rôle des applications UltraTech OS.',
};

const FULL_HELP = [
  'PROTOCOLES AUTORISÉS PAR ULTRATECH OS',
  '────────────────────────────────────',
  '',
  '  scan <cible>      — analyse réseau',
  '  connect <cible>   — connexion distante',
  '  decrypt <id>      — déchiffrement archive',
  '  trace             — contre-mesures surveillance',
  '',
  '  objectif          — rappel mission en cours',
  '  hint              — indice opérationnel',
  '  status            — stats opérateur',
  '  clear             — effacer l\'écran',
  '',
  'Usage : [protocole] [cible]   ex. scan 0x7f',
];

const MINIMAL_HELP = [
  'Protocoles disponibles :',
  'SCAN / CONNECT / DECRYPT / TRACE',
  '',
  'Syntaxe : [protocole] [cible]',
  'Le réseau ne répond qu\'à l\'expérimentation.',
];

export function getHelpText(state, command) {
  if (command) {
    const key = command.toLowerCase();
    const detail = COMMAND_HELP[key];
    if (!detail) {
      return `Protocole inconnu : ${command}. Tapez help pour la liste.`;
    }
    return detail;
  }

  const completed = state?.completedMissions ?? [];
  if (!completed.includes('ghost-signal')) {
    return FULL_HELP.join('\n');
  }

  return MINIMAL_HELP.join('\n');
}

/** @deprecated */
export function getHelpTextLegacy(command) {
  return getHelpText({}, command);
}
