/**
 * Événements de choix narratifs — conséquences RP
 */

export const CHOICE_EVENTS = {
  'relay-data-fate': {
    id: 'relay-data-fate',
    mailId: 'mail-relay-dilemma',
    title: 'Données du relais black-07',
    prompt: 'Des fragments interdits reposent sur votre terminal. UltraTech attend une réponse.',
    options: [
      {
        id: 'report-ultratech',
        label: 'Transmettre à UltraTech',
        description: 'Conformité. Remettre les données au registre corporate.',
        choiceKey: 'relayDataFate',
        choiceValue: 'ultratech',
        flags: {
          reportedBlackRelay: true,
          helpedNova: false,
          profileNote: 'Loyauté UltraTech — black-07 réintégré au registre.',
        },
        effects: {
          trustUltraTech: 18,
          trustNova: -18,
          corruption: -6,
          suspicionUltraTech: -12,
        },
        unlockMails: ['mail-ultratech-commend', 'mail-archive-leak'],
        blockMails: ['mail-nova-trust'],
        terminalLogs: [
          '[UT] Transmission sécurisée — segment black-07 catalogué.',
          '[SEC] Corrélation NOVA signalée. Surveillance accrue sur les canaux sortants.',
        ],
        notifyMessage: 'UltraTech a enregistré votre transmission.',
      },
      {
        id: 'leak-nova',
        label: 'Copier vers NOVA',
        description: 'La vérité vaut plus qu\'un protocole corporate.',
        choiceKey: 'relayDataFate',
        choiceValue: 'nova',
        flags: {
          helpedNova: true,
          trustedNova: true,
          reportedBlackRelay: false,
          profileNote: 'Fuite NOVA — UltraTech a détecté une anomalie interne.',
        },
        effects: {
          trustNova: 22,
          trustUltraTech: -12,
          corruption: 10,
          suspicionUltraTech: 18,
        },
        unlockMails: ['mail-nova-trust', 'mail-archive-leak'],
        blockMails: ['mail-ultratech-commend'],
        terminalLogs: [
          '[!!!] Fragment sortant — canal NOVA ouvert.',
          '[SEC] UltraTech Security : activité anormale sur le terminal opérateur.',
        ],
        notifyMessage: 'Une copie a quitté le terminal. Le réseau l\'a remarqué.',
      },
      {
        id: 'purge-data',
        label: 'Supprimer localement',
        description: 'Effacer la preuve. Disparaître du registre.',
        choiceKey: 'relayDataFate',
        choiceValue: 'purge',
        flags: {
          deletedRelayData: true,
          dataPurged: true,
          archiveFragmentLost: true,
          reportedBlackRelay: false,
          helpedNova: false,
          profileNote: 'Purge locale — fragments black-07 effacés, traces atténuées.',
        },
        effects: {
          reputation: -10,
          suspicionUltraTech: -18,
          trustUltraTech: -8,
          trustNova: -8,
        },
        unlockMails: ['mail-anon-purge-echo', 'mail-archive-leak'],
        blockMails: ['mail-ultratech-commend', 'mail-nova-trust'],
        terminalLogs: [
          '[SYS] Purge locale terminée — empreinte black-07 atténuée.',
          '[???] Les fragments ne répondent plus. Quelque chose manque dans les archives.',
        ],
        notifyMessage: 'Les données ont été effacées. Le réseau oublie… partiellement.',
      },
    ],
  },
};

export function getChoiceEvent(id) {
  return CHOICE_EVENTS[id] ?? null;
}

export function getChoiceEventForMail(mailId) {
  return Object.values(CHOICE_EVENTS).find((e) => e.mailId === mailId) ?? null;
}

export function isChoiceResolved(state, eventId) {
  const event = getChoiceEvent(eventId);
  if (!event) return true;
  const key = event.options[0]?.choiceKey;
  return Boolean(key && state.choices?.[key]);
}

export function getRelayChoiceLabel(choices = {}) {
  switch (choices.relayDataFate) {
    case 'ultratech': return 'Transmission UltraTech';
    case 'nova': return 'Copie vers NOVA';
    case 'purge': return 'Suppression locale';
    default: return null;
  }
}
