/** Help terminal — format RP UltraTech */

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

export function getHelpText(command) {
  if (!command) {
    return [
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
    ].join('\n');
  }

  const key = command.toLowerCase();
  const detail = COMMAND_HELP[key];
  if (!detail) {
    return `Protocole inconnu : ${command}. Tapez help pour la liste.`;
  }
  return detail;
}
