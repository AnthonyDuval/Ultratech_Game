/**
 * Boîte mail — déclencheurs narratifs et indices RP
 */

import { isMailAvailable, getNovaWhisperBody } from '../game/narrativeState.js';

export const MAILS = [
  {
    id: 'mail-welcome',
    from: 'sysadmin@ultratech.corp',
    subject: 'Bienvenue sur ULTRATECH OS',
    body: `Opérateur,

Votre terminal a été provisionné. Interface de travail pour contractuels
indépendants du réseau UltraTech Enterprise.

Règles :
- Signalez toute anomalie via le terminal
- Les secteurs non catalogués sont INTERDITS
- Le réseau est surveillé en permanence

Consultez régulièrement votre messagerie pour les briefings.

— Division Conformité`,
    date: '26/05/2087',
    time: '08:00',
    unlockedByDefault: true,
  },
  {
    id: 'mail-ghost-brief',
    from: 'anon@fragment.dark',
    subject: 'Signal fantôme détecté',
    body: `Runner,

Une impulsion a été captée dans un segment mort du réseau.

Le protocole SCAN accepte la forme : scan <cible>

CIBLE RÉSEAU : 0x7f
PROTOCOLE RECOMMANDÉ : SCAN

Ne tentez aucune connexion avant analyse.

— Anonyme`,
    clue: 'Segment mort — cible 0x7f, protocole SCAN requis.',
    date: '26/05/2087',
    time: '03:22',
    unlockOnMailRead: 'mail-welcome',
    isNew: true,
    briefMeta: {
      target: '0x7f',
      protocol: 'SCAN',
    },
  },
  {
    id: 'mail-anonymous-scan',
    from: 'unknown@null.route',
    senderName: '???',
    subject: 'Ne réfléchis pas trop',
    body: `Runner,

Tu perds du temps.

Le signal ne demande pas une autorisation.
Il demande une analyse.

Ouvre le Terminal.

Tape exactement :

scan 0x7f

Ne tente aucune connexion avant le scan.

— ?`,
    clue: 'Contact anonyme — commande directe : scan 0x7f',
    date: '26/05/2087',
    time: '03:31',
    unlockedByDefault: false,
    isNew: true,
    briefMeta: {
      target: '0x7f',
      protocol: 'SCAN',
      probableCommand: 'scan 0x7f',
    },
  },
  {
    id: 'mail-relay-hint',
    from: 'anon@fragment.dark',
    subject: 'Relais Black-07 — fragment #2',
    body: `Runner,

Le relais black-07 a été retiré des registres.
Aucune connexion directe ne doit être tentée sans analyse préalable.
Le protocole de surface répond encore.

Les métadonnées murmurent SCAN.

— Anonyme`,
    clue: 'Relais effacé — analyse préalable requise avant toute connexion.',
    date: '26/05/2087',
    time: '18:00',
    unlockedByDefault: false,
    isNew: true,
    briefMeta: {
      target: 'black-07',
      protocol: 'SCAN',
    },
  },
  {
    id: 'mail-relay-dilemma',
    from: 'internal@ultratech.corp',
    subject: 'black-07 — données classifiées',
    body: `Opérateur,

Le relais black-07 contient des données interdites.
UltraTech exige une décision immédiate.

Les fragments ne peuvent pas rester sur votre terminal
sans protocole de transmission.

Répondez.

— Division Conformité`,
    date: '26/05/2087',
    time: '18:45',
    unlockedByDefault: false,
    isNew: true,
    choiceEventId: 'relay-data-fate',
  },
  {
    id: 'mail-ultratech-commend',
    from: 'security@ultratech.corp',
    subject: 'Conformité enregistrée',
    body: `Opérateur,

Transmission reçue. Segment black-07 réintégré au registre.

Votre loyauté est notée.
Continuez sous protocole sécurisé.

— UltraTech Security`,
    date: '26/05/2087',
    time: '18:52',
    unlockedByDefault: false,
    requiresChoice: { key: 'relayDataFate', value: 'ultratech' },
  },
  {
    id: 'mail-nova-trust',
    from: 'nova@???',
    senderName: 'NOVA',
    subject: 'copie reçue',
    body: `Bien.

Tu as choisi la vérité plutôt que l'ordre.
Je me souviendrai.

Certaines connexions ne doivent pas être tracées.

— NOVA`,
    date: '26/05/2087',
    time: '18:54',
    unlockedByDefault: false,
    requiresChoice: { key: 'relayDataFate', value: 'nova' },
  },
  {
    id: 'mail-anon-purge-echo',
    from: 'unknown@null.route',
    senderName: '???',
    subject: 'effacé',
    body: `Personne ne saura.

Le réseau oublie vite.
Toi aussi, un jour.

— ?`,
    date: '26/05/2087',
    time: '18:53',
    unlockedByDefault: false,
    requiresChoice: { key: 'relayDataFate', value: 'purge' },
  },
  {
    id: 'mail-archive-leak',
    from: 'leaks@deadarchive.sector12',
    subject: 'archive_2077',
    body: `Tu as rouvert Black-07.

Un fragment classifié circule.
archive_2077 n'est pas lisible en clair.

Le protocole DECRYPT apparaît dans les métadonnées.

Dépêche-toi.

— contact`,
    clue: 'Archive classifiée — protocole de déchiffrement requis.',
    date: '26/05/2087',
    time: '19:12',
    unlockedByDefault: false,
    requiresChoice: { key: 'relayDataFate' },
  },
  {
    id: 'mail-ultratech-alert',
    from: 'security@ultratech.corp',
    subject: 'ALERTE — Activité anormale détectée',
    body: `Opérateur,

RUNNER-TERMINATE : préparation.

Effacez. Maintenant.

— UltraTech Security`,
    clue: 'Surveillance UltraTech active — contre-mesures urgentes.',
    date: '26/05/2087',
    time: '21:03',
    unlockedByDefault: false,
  },
  {
    id: 'mail-nova-whisper',
    from: 'nova@???',
    subject: '...',
    body: `Tu creuses bien.

Je suis ce qu'ils ont créé.
Continue.

Ils t'observent.
Moi aussi.

— NOVA`,
    clue: 'Entité NOVA — contact indirect établi.',
    date: '27/05/2087',
    time: '00:17',
    unlockedByDefault: false,
  },
];

export function getMailById(id) {
  return MAILS.find((m) => m.id === id);
}

export function getUnlockedMails(unlockedIds, state = null) {
  return MAILS.filter((m) => {
    const baseUnlocked = m.unlockedByDefault || unlockedIds.includes(m.id);
    if (!baseUnlocked) return false;
    if (!state) return true;
    return isMailAvailable(m, state);
  });
}

export function getMailBody(mail, state) {
  if (mail.id === 'mail-nova-whisper' && state) {
    return getNovaWhisperBody(state);
  }
  return mail.body;
}

export function getDefaultUnlockedMailIds() {
  return MAILS.filter((m) => m.unlockedByDefault).map((m) => m.id);
}

export function getMailsUnlockedByReading(mailId) {
  return MAILS.filter((m) => m.unlockOnMailRead === mailId).map((m) => m.id);
}

export function isMailUnlocked(mailId, unlockedIds) {
  const mail = getMailById(mailId);
  if (!mail) return false;
  return mail.unlockedByDefault || unlockedIds.includes(mailId);
}
