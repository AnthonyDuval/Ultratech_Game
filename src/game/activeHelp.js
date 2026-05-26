/**
 * Aide active — mission 1 uniquement (+ NOVA cryptique si blocage prolongé)
 */

import { getMissionById, getSuggestedCommand } from '../data/missions.js';
import {
  isGhostSignalDone,
  hasAnonScanHelp,
  shouldRevealScanCommand,
} from './missionGuards.js';
import {
  computeGuidanceLevel,
  getGuidanceTitle,
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

/** Retourne l'aide principale active */
export function getActiveHelp(state, ui = {}) {
  if (!state.tutorialCompleted) return null;

  const level = computeGuidanceLevel(state);
  const completed = state.completedMissions ?? [];

  if (state.narrativeFlags?.stuck_hint_active) {
    return finalizeHelp(buildNovaStuckHelp(state), level, state);
  }

  // Après mission 1 : aucune guidance, aucun widget objectif
  if (isGhostSignalDone(completed)) {
    return null;
  }

  if (state.guidanceDisabled) {
    return buildObjectiveFallback(state, ui, level);
  }

  const guidance = buildMission1Guidance(state, ui, level);
  if (guidance) {
    return finalizeHelp(guidance, level, state);
  }

  return null;
}

function finalizeHelp(help, level, state) {
  if (!help) return null;

  const m1 = isMission1Phase(state);
  const isStuck = Boolean(state.narrativeFlags?.stuck_hint_active);
  let sanitized = { ...help };

  if (!m1 || !M1_COMMAND_IDS.has(sanitized.id)) {
    sanitized.revealCommand = false;
    sanitized.command = undefined;
  }

  if (isStuck && !m1) {
    sanitized.revealCommand = false;
    sanitized.command = undefined;
    sanitized.target = undefined;
    sanitized.protocol = undefined;
    sanitized.targetApp = undefined;
    sanitized.actionLabel = undefined;
    sanitized.secondaryActions = undefined;
    sanitized.minimal = true;
  }

  const source = sanitized.source ?? 'system';
  return {
    ...sanitized,
    type: isStuck && !m1 ? 'guidance' : 'guidance',
    priority: HELP_PRIORITY.GUIDANCE,
    title: getGuidanceTitle(level, source),
    guidanceLevel: level,
    tone: source === 'nova' ? 'nova' : m1 ? 'direct' : 'cryptic',
    autoDismiss: isStuck || !m1,
  };
}

export function getCurrentGuidance(state, ui = {}) {
  const help = getActiveHelp(state, ui);
  if (!help || help.type !== 'guidance') return null;
  return help;
}

export function shouldSuppressDesktopNotifs(help) {
  if (!help) return { unread: false, ops: false };
  return {
    unread: Boolean(help.suppressUnreadNotif),
    ops: Boolean(help.suppressOpsNotif),
  };
}

function buildObjectiveFallback(state, ui, level) {
  const guidance = buildMission1Guidance(state, ui, level);
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

/** Guidance exclusivement mission 1 (ghost-signal) */
function buildMission1Guidance(state, ui, level) {
  const openApps = ui.openApps ?? [];
  const selectedMailId = ui.selectedMailId ?? null;
  const has = (app) => openApps.includes(app);
  const read = state.readMails ?? [];
  const discovered = state.discoveredMissions ?? [];
  const completed = state.completedMissions ?? [];
  const flags = state.narrativeFlags ?? {};

  if (isGhostSignalDone(completed)) return null;

  if (
    read.includes('mail-welcome')
    && !flags.scan_0x7f
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

  if (discovered.includes('ghost-signal')) {
    return helpMission1(state, flags, has, openApps);
  }

  return helpPostBrief(state, flags, has, openApps);
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
  if (selectedMailId !== 'mail-ghost-brief') {
    return hPlain('ghost-select', 'Sélectionnez « Signal fantôme détecté ».', { suppressUnreadNotif: true });
  }
  return hPlain('ghost-read', 'Lisez le brief — notez cible et protocole.', { suppressUnreadNotif: true });
}

function helpPostBrief(state, flags, has, openApps) {
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

function helpMission1(state, flags, has, openApps) {
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

export function getObjectiveWidgetData(state, ui = {}) {
  if (isGhostSignalDone(state.completedMissions ?? [])) return null;

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
