/**
 * Événements de choix narratifs — conséquences RP, pas de stats affichées
 */

export const CHOICE_EVENTS = {
  'relay-data-fate': {
    id: 'relay-data-fate',
    mailId: 'mail-relay-dilemma',
    title: 'Données interdites',
    prompt: 'Le relais black-07 contient des données interdites. Que faites-vous ?',
    options: [
      {
        id: 'report-ultratech',
        label: 'Transmettre les données à UltraTech',
        description: 'Conformité. La sécurité du réseau avant tout.',
        choiceKey: 'relayDataFate',
        choiceValue: 'ultratech',
        flags: { reportedBlackRelay: true, helpedNova: false },
        effects: {
          trustUltraTech: 15,
          trustNova: -20,
          reputation: 5,
          suspicionUltraTech: -10,
        },
        unlockMails: ['mail-ultratech-commend', 'mail-archive-leak'],
        blockMails: ['mail-nova-trust'],
        terminalLog: '[SYS] Transmission sécurisée — segment black-07 catalogué.',
      },
      {
        id: 'leak-nova',
        label: 'Envoyer une copie à NOVA',
        description: 'La vérité vaut plus qu\'un protocole corporate.',
        choiceKey: 'relayDataFate',
        choiceValue: 'nova',
        flags: { helpedNova: true, trustedNova: true, reportedBlackRelay: false },
        effects: {
          trustNova: 20,
          trustUltraTech: -15,
          corruption: 8,
          suspicionUltraTech: 12,
        },
        unlockMails: ['mail-nova-trust', 'mail-archive-leak'],
        blockMails: ['mail-ultratech-commend'],
        terminalLog: '[!!!] Fragment sortant — corrélation NOVA détectée.',
      },
      {
        id: 'purge-data',
        label: 'Supprimer les données',
        description: 'Effacer la preuve. Disparaître du registre.',
        choiceKey: 'relayDataFate',
        choiceValue: 'purge',
        flags: { deletedRelayData: true, reportedBlackRelay: false, helpedNova: false },
        effects: {
          reputation: -5,
          suspicionUltraTech: -15,
          trustUltraTech: -5,
          trustNova: -5,
        },
        unlockMails: ['mail-anon-purge-echo', 'mail-archive-leak'],
        blockMails: ['mail-ultratech-commend', 'mail-nova-trust'],
        terminalLog: '[SYS] Purge locale — empreinte black-07 atténuée.',
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
