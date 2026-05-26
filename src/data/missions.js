/**
 * Missions — guidanceLevel : tutorial (M1) | semi (M2) | free (M3+)
 */

export const MISSIONS = [
  {
    id: 'ghost-signal',
    title: 'Signal Fantôme',
    objective: 'Intercepter le signal du secteur 0x7F.',
    summary: 'Une impulsion captée dans un segment mort du réseau.',
    discoverOnMailRead: 'mail-ghost-brief',
    guidanceLevel: 'tutorial',
    guided: true,
    steps: [
      {
        flag: 'scan_0x7f',
        label: 'Analyser la cible 0x7f',
        nextStep: 'Ouvrir le Terminal',
        currentObjective: 'Analyser la cible 0x7f',
        target: '0x7f',
        protocol: 'SCAN',
        hint: 'Le brief mentionne une cible dormante. Le scan doit précéder toute connexion.',
        suggestedCommand: 'scan 0x7f',
        why: 'UltraTech nie l\'existence de ce secteur — seul un scan confirmera le signal.',
      },
      {
        flag: 'connect_0x7f',
        label: 'Connexion contrôlée',
        nextStep: 'Établir une connexion contrôlée vers 0x7f.',
        currentObjective: 'Établir une connexion contrôlée',
        target: '0x7f',
        protocol: 'CONNECT',
        hint: 'Le scan a validé la cible. Une connexion directe est maintenant possible.',
        suggestedCommand: 'connect 0x7f',
        why: 'La capture du paquet fantôme nécessite un tunnel actif vers la cible.',
      },
    ],
    rewards: { bittek: 100, reputation: 5, corruption: 3, suspicion: 5 },
    unlockMailsOnComplete: ['mail-relay-hint'],
  },
  {
    id: 'black-relay',
    title: 'Black Relay',
    objective: 'Identifier et reconnecter le relais black-07.',
    summary: 'Un relais clandestin pulse dans le réseau corporate.',
    discoverOnMailRead: 'mail-relay-hint',
    guidanceLevel: 'semi',
    guided: true,
    steps: [
      {
        flag: 'scan_black07',
        label: 'Scanner le relais',
        currentObjective: 'Localiser le relais black-07',
        target: 'black-07',
        protocol: 'SCAN',
        hint: 'Le message parle d\'un relais effacé des registres.',
        rpHint: 'black-07 répond aux requêtes de surface.',
        suggestedCommand: 'scan black-07',
        why: 'Le relais n\'apparaît pas dans les annuaires corporate.',
      },
      {
        flag: 'connect_black07',
        label: 'Connecter le relais',
        currentObjective: 'Établir la connexion au relais',
        target: 'black-07',
        protocol: 'CONNECT',
        hint: 'Le relais a été analysé.',
        rpHint: 'Le relais refuse toute connexion non analysée.',
        suggestedCommand: 'connect black-07',
        why: 'Le tunnel instable laisse une fenêtre d\'accès limitée.',
      },
    ],
    rewards: { bittek: 200, reputation: 8, corruption: 5, suspicion: 12 },
    unlockMailsOnComplete: ['mail-relay-dilemma'],
  },
  {
    id: 'dead-archive',
    title: 'Archive Morte',
    objective: 'Extraire et déchiffrer l\'archive classifiée 2077.',
    summary: 'Un fichier corrompu contient des données UltraTech.',
    discoverOnMailRead: 'mail-archive-leak',
    guidanceLevel: 'free',
    steps: [
      {
        flag: 'decrypt_archive2077',
        label: 'Déchiffrer l\'archive',
        currentObjective: 'Extraire archive_2077',
        target: 'archive_2077',
        protocol: 'DECRYPT',
        hint: 'Un protocole de déchiffrement est mentionné dans le mail.',
        rpHint: 'archive_2077 n\'est pas lisible en clair. Le protocole DECRYPT apparaît dans les métadonnées.',
        suggestedCommand: 'decrypt archive_2077',
      },
    ],
    rewards: { bittek: 250, reputation: 12, corruption: 10, suspicion: 20 },
    unlockMailsOnComplete: ['mail-ultratech-alert'],
  },
  {
    id: 'surveillance',
    title: 'Contre-mesures',
    objective: 'Effacer votre empreinte avant RUNNER-TERMINATE.',
    summary: 'UltraTech a détecté votre activité.',
    discoverOnMailRead: 'mail-ultratech-alert',
    guidanceLevel: 'free',
    steps: [
      {
        flag: 'trace_cleared',
        label: 'Effacer les traces',
        currentObjective: 'Disparaître du radar UltraTech',
        protocol: 'TRACE',
        hint: 'La surveillance monte. Analysez et atténuez votre empreinte.',
        rpHint: 'TRACE : activité résiduelle détectée sur votre session.',
        suggestedCommand: 'trace',
      },
    ],
    rewards: { bittek: 100, reputation: 15, corruption: -5, suspicion: -25 },
    unlockMailsOnComplete: ['mail-nova-whisper'],
  },
];

export function getMissionById(id) {
  return MISSIONS.find((m) => m.id === id);
}

export function getActiveDiscoveredMissions(discoveredIds, completedIds) {
  return MISSIONS.filter(
    (m) => discoveredIds.includes(m.id) && !completedIds.includes(m.id)
  );
}

export function getMissionProgress(mission, flags) {
  if (!mission?.steps?.length) return 0;
  const done = mission.steps.filter((s) => flags[s.flag]).length;
  return done / mission.steps.length;
}

export function getCurrentStep(mission, flags) {
  if (!mission) return null;
  return mission.steps.find((s) => !flags[s.flag]) ?? null;
}

export function getCurrentObjective(mission, flags) {
  const step = getCurrentStep(mission, flags);
  if (step?.currentObjective) return step.currentObjective;
  if (step) return step.label;
  return mission?.objective ?? null;
}

export function getNextStepText(mission, flags) {
  const step = getCurrentStep(mission, flags);
  return step?.nextStep ?? step?.currentObjective ?? step?.label ?? null;
}

export function getSuggestedCommand(mission, flags) {
  if (!mission?.guided) return null;
  const step = getCurrentStep(mission, flags);
  return step?.suggestedCommand ?? null;
}

export function getStepTarget(mission, flags) {
  const step = getCurrentStep(mission, flags);
  return step?.target ?? null;
}

export function getStepProtocol(mission, flags) {
  const step = getCurrentStep(mission, flags);
  return step?.protocol ?? null;
}

export function getStepWhy(mission, flags) {
  const step = getCurrentStep(mission, flags);
  return step?.why ?? null;
}

export function isGuidedMission(mission) {
  return mission?.guidanceLevel === 'tutorial' || mission?.guidanceLevel === 'semi';
}

export function getPrimaryActiveMission(discoveredIds, completedIds) {
  const active = getActiveDiscoveredMissions(discoveredIds, completedIds);
  return active[0] ?? null;
}

export function getMissionActivityStatus(mission, flags, completedIds) {
  if (completedIds.includes(mission.id)) return 'done';
  const progress = getMissionProgress(mission, flags);
  if (progress === 0) return 'pending';
  return 'active';
}

export function getMissionActivityLabel(status) {
  switch (status) {
    case 'pending': return 'En attente';
    case 'active': return 'En cours';
    case 'done': return 'Terminé';
    default: return '';
  }
}

export function getMissionForFlag(flagName) {
  return MISSIONS.find((m) => m.steps.some((s) => s.flag === flagName));
}
