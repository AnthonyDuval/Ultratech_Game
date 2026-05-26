/**
 * Aide active unique — source de vérité pour GuidanceHint et notifications
 * Mission 1 : aide explicite. Mission 2+ : indices RP et navigation mails uniquement.
 */

import { getMissionById, getSuggestedCommand, getPrimaryActiveMission } from '../data/missions.js';
import { isMailUnlocked } from '../data/mails.js';
import {
  isGhostSignalDone,
  isBlackRelayDone,
  hasAnonScanHelp,
  shouldRevealScanCommand,
} from './missionGuards.js';
import {
  computeGuidanceLevel,
  getGuidanceTitle,
  shouldShowGuidanceHint,
  isMission1Phase,
} from './guidanceLevel.js';
import { buildNovaStuckHelp } from './novaHints.js';

export const HELP_PRIORITY = {
  TUTORIAL: 1,
  GUIDANCE: 2,
  OBJECTIVE: 3,
  NOTIFICATION: 4,
};

const APP_LABELS = {
  mail: 'Mails',
  missions: 'Opérations',
  terminal: 'Terminal',
};

const M1_COMMAND_IDS = new Set([
  'anon-scan-direct',
  'm1-scan',
  'm1-connect',
  'm1-anon-direct',
]);

/** Retourne l'aide principale active (guidance ou objectif compact si aide masquée) */
export function getActiveHelp(state, ui = {}) {
  if (!state.tutorialCompleted) return null;

  const level = computeGuidanceLevel(state);

  if (state.narrativeFlags?.stuck_hint_active) {
    return finalizeHelp(buildNovaStuckHelp(state), level, state);
  }

  if (!shouldShowGuidanceHint(state)) return null;

  if (state.guidanceDisabled) {
    return buildObjectiveFallback(state, ui, level);
  }

  const guidance = buildGuidanceHelp(state, ui, level);
  if (guidance) {
    return finalizeHelp(guidance, level, state);
  }

  return null;
}

function finalizeHelp(help, level, state) {
  if (!help) return null;

  const m1 = isMission1Phase(state);
  let sanitized = { ...help };

  if (!m1 && !M1_COMMAND_IDS.has(sanitized.id)) {
    sanitized.revealCommand = false;
    sanitized.command = undefined;
  }

  if (state.narrativeFlags?.stuck_hint_active && !m1) {
    sanitized.revealCommand = false;
    sanitized.command = undefined;
  }

  const source = sanitized.source ?? 'system';
  return {
    ...sanitized,
    type: 'guidance',
    priority: HELP_PRIORITY.GUIDANCE,
    title: getGuidanceTitle(level, source),
    guidanceLevel: level,
    tone: source === 'nova' ? 'nova' : m1 ? 'direct' : 'cryptic',
    autoDismiss: !m1 && !state.narrativeFlags?.stuck_hint_active,
  };
}

/** Compatibilité — alias utilisé par GuidanceHint */
export function getCurrentGuidance(state, ui = {}) {
  const help = getActiveHelp(state, ui);
  if (!help || help.type !== 'guidance') return null;
  return help;
}

/** Masquer les notifications bureau qui doublonnent l'aide principale */
export function shouldSuppressDesktopNotifs(help) {
  if (!help) return { unread: false, ops: false };
  return {
    unread: Boolean(help.suppressUnreadNotif),
    ops: Boolean(help.suppressOpsNotif),
  };
}

function buildObjectiveFallback(state, ui, level) {
  const guidance = buildGuidanceHelp(state, ui, level);
  if (!guidance) return null;

  const finalized = finalizeHelp(guidance, level, state);
  if (!finalized) return null;

  return {
    id: `compact-${finalized.id}`,
    message: finalized.message,
    targetApp: finalized.targetApp,
    actionLabel: finalized.actionLabel,
    command: finalized.command,
    revealCommand: finalized.revealCommand,
    target: finalized.target,
    protocol: finalized.protocol,
    type: 'objective',
    priority: HELP_PRIORITY.OBJECTIVE,
    title: finalized.title,
    tone: finalized.tone,
  };
}

function buildGuidanceHelp(state, ui, level) {
  const openApps = ui.openApps ?? [];
  const selectedMailId = ui.selectedMailId ?? null;
  const has = (app) => openApps.includes(app);
  const read = state.readMails ?? [];
  const discovered = state.discoveredMissions ?? [];
  const completed = state.completedMissions ?? [];
  const flags = state.narrativeFlags ?? {};

  if (
    read.includes('mail-welcome')
    && !flags.scan_0x7f
    && !isGhostSignalDone(completed)
    && hasAnonScanHelp(state)
  ) {
    return {
      id: 'anon-scan-direct',
      message: 'Un message anonyme vous donne une commande directe.',
      target: '0x7f',
      protocol: 'SCAN',
      revealCommand: true,
      command: 'scan 0x7f',
      targetApp: has('terminal') ? undefined : 'terminal',
      actionLabel: has('terminal') ? undefined : APP_LABELS.terminal,
    };
  }

  if (!read.includes('mail-welcome')) {
    return helpWelcome(has, selectedMailId);
  }

  if (!read.includes('mail-ghost-brief')) {
    return helpGhostBrief(state, has, selectedMailId);
  }

  if (isGhostSignalDone(completed)) {
    const afterGhost = helpAfterGhostSignal(state, has, selectedMailId, discovered, completed);
    if (afterGhost) return afterGhost;
    return null;
  }

  if (discovered.includes('ghost-signal')) {
    return helpMission1(state, flags, has, openApps, level);
  }

  return helpPostBrief(state, has, openApps, flags, level);
}

function helpWelcome(has, selectedMailId) {
  if (!has('mail')) {
    return h('welcome-open-mail', 'Lisez le briefing de bienvenue.', 'mail', { suppressUnreadNotif: true });
  }
  if (selectedMailId !== 'mail-welcome') {
    return hPlain('welcome-select', 'Sélectionnez le message de bienvenue.', { suppressUnreadNotif: true });
  }
  return hPlain('welcome-read', 'Lisez le briefing pour débloquer la suite.', { suppressUnreadNotif: true });
}

function helpGhostBrief(state, has, selectedMailId) {
  if (!has('mail')) {
    return h('ghost-open-mail', 'Un brief « Signal fantôme » vous attend.', 'mail', { suppressUnreadNotif: true });
  }
  if (isMailUnlocked('mail-ghost-brief', state.unlockedMails ?? []) && selectedMailId !== 'mail-ghost-brief') {
    return hPlain('ghost-select', 'Sélectionnez « Signal fantôme détecté ».', { suppressUnreadNotif: true });
  }
  return hPlain('ghost-read', 'Lisez le brief — notez cible et protocole.', { suppressUnreadNotif: true });
}

/** Après lecture du ghost brief, avant découverte explicite de la mission */
function helpPostBrief(state, has, openApps, flags, level) {
  if (flags.scan_0x7f || flags.connect_0x7f) return null;

  if (!has('missions')) {
    return h('post-brief-ops', level >= 2
      ? 'Un fragment mentionne une cible. Le journal Opérations murmure encore.'
      : 'Le briefing mentionne une cible réseau. Consultez Opérations.', 'missions', {
      suppressOpsNotif: true,
    });
  }

  if (!has('terminal')) {
    return h('post-brief-term', level >= 1
      ? 'Le protocole SCAN n\'est pas mort. Le terminal attend.'
      : 'Le protocole suggéré est SCAN. Ouvrez Terminal.', 'terminal');
  }

  return helpMission1(state, flags, has, openApps, level);
}

/** Après mission 1 — navigation mails uniquement, pas d'aide opérationnelle */
function helpAfterGhostSignal(state, has, selectedMailId, discovered, completed) {
  const read = state.readMails ?? [];
  const unlocked = state.unlockedMails ?? [];

  const mailPointers = [
    { id: 'mail-relay-hint', select: 'Lisez le fragment sur le relais Black-07.', read: 'Le fragment parle d\'un relais retiré des registres.' },
    { id: 'mail-relay-dilemma', select: 'Une décision UltraTech attend dans Mails.', read: 'Répondez avant de poursuivre.' },
    { id: 'mail-archive-leak', select: 'Un nouveau fragment est disponible.', read: 'Un fichier classifié circule dans vos messages.' },
    { id: 'mail-ultratech-alert', select: 'Consultez vos nouveaux messages.', read: 'UltraTech a laissé une trace dans la messagerie.' },
    { id: 'mail-nova-whisper', select: 'Un message NOVA pulse dans Mails.', read: 'NOVA tente de vous joindre.' },
  ];

  for (const ptr of mailPointers) {
    if (!unlocked.includes(ptr.id) || read.includes(ptr.id)) continue;
    if (!has('mail')) {
      return h(`nav-${ptr.id}`, 'Consultez vos nouveaux messages.', 'mail', { suppressUnreadNotif: true });
    }
    if (selectedMailId !== ptr.id) {
      return hPlain(`nav-select-${ptr.id}`, ptr.select, { suppressUnreadNotif: true });
    }
    return hPlain(`nav-read-${ptr.id}`, ptr.read, { suppressUnreadNotif: true });
  }

  if (isBlackRelayDone(completed)) {
    return helpFreeMailOnly(state, has, unlocked, read);
  }

  if (discovered.includes('black-relay')) {
    return null;
  }

  return null;
}

function helpFreeMailOnly(state, has, unlocked, read) {
  if (unlocked.includes('mail-archive-leak') && !read.includes('mail-archive-leak') && !has('mail')) {
    return h('free-mail', 'Un nouveau fragment est disponible.', 'mail', { suppressUnreadNotif: true });
  }
  if (unlocked.includes('mail-ultratech-alert') && !read.includes('mail-ultratech-alert') && !has('mail')) {
    return h('free-alert', 'Consultez vos nouveaux messages.', 'mail', { suppressUnreadNotif: true });
  }
  return null;
}

function helpMission1(state, flags, has, openApps, level) {
  if (isGhostSignalDone(state.completedMissions ?? [])) return null;
  if (flags.scan_0x7f && flags.connect_0x7f) return null;

  const mission = getMissionById('ghost-signal');

  if (!flags.scan_0x7f) {
    if (hasAnonScanHelp(state)) {
      return {
        ...h('m1-anon-direct', 'Un message anonyme vous donne une commande directe.', 'terminal'),
        target: '0x7f',
        protocol: 'SCAN',
        revealCommand: true,
        command: 'scan 0x7f',
      };
    }

    if (!has('missions')) {
      return h('m1-ops', 'Le briefing mentionne une cible réseau. Consultez Opérations.', 'missions', {
        suppressOpsNotif: true,
      });
    }

    if (!has('terminal')) {
      return {
        ...h('m1-open-term', 'Le protocole suggéré est SCAN. Ouvrez Terminal.', 'terminal'),
        target: '0x7f',
        protocol: 'SCAN',
      };
    }

    if (!shouldRevealScanCommand(state, openApps)) {
      return {
        id: 'm1-learn-rp',
        message: 'Le brief indique cible 0x7f et protocole SCAN. Composez la commande dans le Terminal.',
        target: '0x7f',
        protocol: 'SCAN',
        secondaryActions: [
          { app: 'missions', label: 'Opérations' },
        ],
      };
    }

    return {
      id: 'm1-scan',
      message: 'Exécutez le scan sur la cible 0x7f.',
      target: '0x7f',
      protocol: 'SCAN',
      revealCommand: true,
      command: 'scan 0x7f',
    };
  }

  if (!flags.connect_0x7f) {
    const cmd = getSuggestedCommand(mission, flags) ?? 'connect 0x7f';
    return {
      id: 'm1-connect',
      message: 'Analyse terminée. Établissez la connexion vers 0x7f.',
      target: '0x7f',
      protocol: 'CONNECT',
      revealCommand: true,
      command: cmd,
      targetApp: has('terminal') ? undefined : 'terminal',
      actionLabel: has('terminal') ? undefined : APP_LABELS.terminal,
    };
  }

  return null;
}

function h(id, message, targetApp, extra = {}) {
  return {
    id,
    message,
    targetApp,
    actionLabel: APP_LABELS[targetApp],
    ...extra,
  };
}

function hPlain(id, message, extra = {}) {
  return { id, message, ...extra };
}

/** Données compactes pour le widget objectif (fallback si guidance masquée) */
export function getObjectiveWidgetData(state, ui = {}) {
  const level = computeGuidanceLevel(state);
  const help = buildObjectiveFallback(state, ui, level);
  if (!help) return null;

  return {
    label: help.title,
    id: help.id,
    action: help.message,
    app: help.targetApp,
    appLabel: help.actionLabel,
    command: help.command,
    showCommand: help.revealCommand && Boolean(help.command),
    target: help.target,
    protocol: help.protocol,
  };
}
