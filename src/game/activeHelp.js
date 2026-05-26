/**
 * Aide active unique — source de vérité pour GuidanceHint et notifications
 */

import { getMissionById, getSuggestedCommand, getCurrentStep, getNextStepText } from '../data/missions.js';
import { isMailUnlocked } from '../data/mails.js';
import {
  isGhostSignalDone,
  isBlackRelayDone,
  hasAnonScanHelp,
  shouldRevealScanCommand,
} from './missionGuards.js';

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

/** Retourne l'aide principale active (guidance ou objectif compact si aide masquée) */
export function getActiveHelp(state, ui = {}) {
  if (!state.tutorialCompleted) return null;

  const completed = state.completedMissions ?? [];
  if (isBlackRelayDone(completed)) return null;

  if (state.guidanceDisabled) {
    return buildObjectiveFallback(state, ui);
  }

  const guidance = buildGuidanceHelp(state, ui);
  if (guidance) {
    return {
      ...guidance,
      type: 'guidance',
      priority: HELP_PRIORITY.GUIDANCE,
      title: 'PROCHAINE ACTION',
    };
  }

  return null;
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

function buildObjectiveFallback(state, ui) {
  const guidance = buildGuidanceHelp(state, ui);
  if (!guidance) return null;

  return {
    id: `compact-${guidance.id}`,
    message: guidance.message,
    targetApp: guidance.targetApp,
    actionLabel: guidance.actionLabel,
    command: guidance.command,
    revealCommand: guidance.revealCommand,
    target: guidance.target,
    protocol: guidance.protocol,
    type: 'objective',
    priority: HELP_PRIORITY.OBJECTIVE,
    title: 'Objectif actuel',
  };
}

function buildGuidanceHelp(state, ui) {
  const openApps = ui.openApps ?? [];
  const selectedMailId = ui.selectedMailId ?? null;
  const has = (app) => openApps.includes(app);
  const read = state.readMails ?? [];
  const discovered = state.discoveredMissions ?? [];
  const completed = state.completedMissions ?? [];
  const flags = state.narrativeFlags ?? {};

  if (!read.includes('mail-welcome')) {
    return helpWelcome(has, selectedMailId);
  }

  if (!read.includes('mail-ghost-brief')) {
    return helpGhostBrief(state, has, selectedMailId);
  }

  if (isGhostSignalDone(completed)) {
    return helpAfterGhostSignal(state, has, selectedMailId, discovered, completed, flags);
  }

  if (discovered.includes('ghost-signal')) {
    return helpMission1(state, flags, has, openApps);
  }

  return helpPostBrief(state, has, openApps, flags);
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
function helpPostBrief(state, has, openApps, flags) {
  if (flags.scan_0x7f || flags.connect_0x7f) return null;

  if (!has('missions')) {
    return h('post-brief-ops', 'Le briefing mentionne une cible réseau. Consultez Opérations.', 'missions', {
      suppressOpsNotif: true,
    });
  }

  if (!has('terminal')) {
    return h('post-brief-term', 'Le protocole suggéré est SCAN. Ouvrez Terminal.', 'terminal');
  }

  return helpMission1(state, flags, has, openApps);
}

function helpAfterGhostSignal(state, has, selectedMailId, discovered, completed, flags) {
  const read = state.readMails ?? [];

  if (!read.includes('mail-relay-hint')) {
    if (!has('mail')) {
      return h('relay-open', 'Consultez vos nouveaux messages.', 'mail', { suppressUnreadNotif: true });
    }
    if (selectedMailId !== 'mail-relay-hint') {
      return hPlain('relay-select', 'Lisez le fragment Black-07 dans Mails.', { suppressUnreadNotif: true });
    }
    return hPlain('relay-read', 'Lisez le fragment — cible black-07.', { suppressUnreadNotif: true });
  }

  if (isBlackRelayDone(completed)) return null;

  if (discovered.includes('black-relay')) {
    return helpMission2(flags, has, completed);
  }

  return hPlain('post-ghost', 'Consultez vos nouveaux messages.');
}

function helpMission1(state, flags, has, openApps) {
  if (isGhostSignalDone(state.completedMissions ?? [])) return null;
  if (flags.scan_0x7f && flags.connect_0x7f) return null;

  const mission = getMissionById('ghost-signal');

  if (!flags.scan_0x7f) {
    if (hasAnonScanHelp(state)) {
      return {
        ...h('m1-anon-direct', 'Un contact anonyme vous donne une commande directe.', 'terminal'),
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

function helpMission2(flags, has, completed) {
  if (isBlackRelayDone(completed)) return null;
  const mission = getMissionById('black-relay');

  if (!flags.scan_black07) {
    if (!has('missions') && !has('terminal')) {
      return {
        id: 'm2-post-mail',
        message: 'Cible black-07 repérée. Consultez Opérations.',
        target: 'black-07',
        protocol: 'SCAN',
        targetApp: 'missions',
        actionLabel: APP_LABELS.missions,
        suppressOpsNotif: true,
      };
    }
    return {
      id: 'm2-scan',
      message: 'Scannez le relais black-07.',
      target: 'black-07',
      protocol: 'SCAN',
      revealCommand: true,
      command: 'scan black-07',
      targetApp: has('terminal') ? undefined : 'terminal',
      actionLabel: has('terminal') ? undefined : APP_LABELS.terminal,
    };
  }

  if (!flags.connect_black07) {
    const cmd = getSuggestedCommand(mission, flags) ?? 'connect black-07';
    return {
      id: 'm2-connect',
      message: 'Relais localisé. Établissez la connexion.',
      target: 'black-07',
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
  const help = buildObjectiveFallback(state, ui);
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

export { getCurrentStep, getNextStepText };
