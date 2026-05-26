/**
 * Boîte mail — déclencheurs narratifs et indices RP
 */

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

Porte ouverte.

black-07 pulse.
SCAN d'abord.

— ?`,
    clue: 'Relais non catalogué — black-07, scan préalable requis.',
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
    id: 'mail-archive-leak',
    from: 'leaks@deadarchive.sector12',
    subject: 'archive_2077',
    body: `Tu as rouvert Black-07.

Un fragment classifié circule.
Le protocole n'est pas mort.

archive_2077

Dépêche-toi.

— contact`,
    clue: 'Archive classifiée — protocole de déchiffrement requis.',
    date: '26/05/2087',
    time: '19:12',
    unlockedByDefault: false,
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

export function getUnlockedMails(unlockedIds) {
  return MAILS.filter((m) => m.unlockedByDefault || unlockedIds.includes(m.id));
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
