/**
 * Aide active unique — source de vérité pour GuidanceHint et notifications
 */

import { getMissionById, getSuggestedCommand, getCurrentStep, getNextStepText, getPrimaryActiveMission } from '../data/missions.js';
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
  shouldRevealCommandInHelp,
  shouldShowGuidanceHint,
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
  const source = help.source ?? 'system';
  return {
    ...help,
    type: 'guidance',
    priority: HELP_PRIORITY.GUIDANCE,
    title: getGuidanceTitle(level, source),
    guidanceLevel: level,
    tone: source === 'nova' ? 'nova' : level >= 2 ? 'cryptic' : 'direct',
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
    title: getGuidanceTitle(level, guidance.source),
    tone: guidance.source === 'nova' ? 'nova' : 'compact',
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
    const afterGhost = helpAfterGhostSignal(state, has, selectedMailId, discovered, completed, flags, level);
    if (afterGhost) return afterGhost;
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

function helpAfterGhostSignal(state, has, selectedMailId, discovered, completed, flags, level) {
  const read = state.readMails ?? [];

  if (!read.includes('mail-relay-hint')) {
    if (!has('mail')) {
      return h('relay-open', level >= 2 ? 'Quelque chose pulse dans la messagerie.' : 'Consultez vos nouveaux messages.', 'mail', { suppressUnreadNotif: true });
    }
    if (selectedMailId !== 'mail-relay-hint') {
      return hPlain('relay-select', 'Lisez le fragment Black-07 dans Mails.', { suppressUnreadNotif: true });
    }
    return hPlain('relay-read', level >= 2 ? 'Le relais écoute encore.' : 'Lisez le fragment — cible black-07.', { suppressUnreadNotif: true });
  }

  if (isBlackRelayDone(completed)) {
    return helpFreeMissions(state, has, selectedMailId, discovered, completed, flags, level);
  }

  if (discovered.includes('black-relay')) {
    return helpMission2(flags, has, completed, level, state);
  }

  return hPlain('post-ghost', 'Consultez vos nouveaux messages.');
}

function helpFreeMissions(state, has, selectedMailId, discovered, completed, flags, level) {
  const active = getPrimaryActiveMission(discovered, completed);
  if (!active) return null;

  if (active.id === 'dead-archive') {
    if (!state.readMails?.includes('mail-archive-leak')) {
      if (!has('mail')) return h('m3-mail', 'Un fichier corrompu circule encore.', 'mail', { suppressUnreadNotif: true });
      return hPlain('m3-read', 'Lisez le fragment sur archive_2077.');
    }
    const step = getCurrentStep(active, flags);
    if (step && !flags.decrypt_archive2077) {
      return {
        id: 'm3-decrypt',
        message: step.rpHint ?? 'Le protocole interne murmure dans les logs morts.',
        target: step.target ?? 'archive_2077',
        protocol: step.protocol ?? 'DECRYPT',
        targetApp: has('terminal') ? undefined : 'terminal',
        actionLabel: has('terminal') ? undefined : APP_LABELS.terminal,
        revealCommand: shouldRevealCommandInHelp(state, 'free'),
        command: shouldRevealCommandInHelp(state, 'free') ? 'decrypt archive_2077' : undefined,
      };
    }
  }

  if (active.id === 'surveillance') {
    if (!state.readMails?.includes('mail-ultratech-alert')) {
      if (!has('mail')) return h('m4-mail', 'UltraTech vous cherche.', 'mail', { suppressUnreadNotif: true });
      return hPlain('m4-read', 'Lisez l\'alerte sécurité.');
    }
    if (!flags.trace_cleared) {
      return {
        id: 'm4-trace',
        message: level >= 2 ? 'Efface avant qu\'ils ne te voient.' : 'La surveillance monte. Atténuez votre empreinte.',
        protocol: 'TRACE',
        targetApp: has('terminal') ? undefined : 'terminal',
        actionLabel: APP_LABELS.terminal,
      };
    }
  }

  if (level >= 3) return null;
  return hPlain('free-idle', 'Croisez mails, indices et terminal.');
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
      message: 'Analyse terminée. Essayez maintenant connect 0x7f.',
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

function helpMission2(flags, has, completed, level, state) {
  if (isBlackRelayDone(completed)) return null;
  const mission = getMissionById('black-relay');
  const reveal = shouldRevealCommandInHelp(state, 'semi');

  if (!flags.scan_black07) {
    if (!has('missions') && !has('terminal')) {
      return {
        id: 'm2-post-mail',
        message: level >= 1 ? 'Le relais semble répondre au protocole SCAN.' : 'Cible black-07 repérée. Consultez Opérations.',
        target: 'black-07',
        protocol: 'SCAN',
        targetApp: 'missions',
        actionLabel: APP_LABELS.missions,
        suppressOpsNotif: true,
      };
    }
    return {
      id: 'm2-scan',
      message: level >= 1 ? 'Le relais semble répondre au protocole SCAN.' : 'Scannez le relais black-07.',
      target: 'black-07',
      protocol: 'SCAN',
      revealCommand: reveal,
      command: reveal ? 'scan black-07' : undefined,
      targetApp: has('terminal') ? undefined : 'terminal',
      actionLabel: has('terminal') ? undefined : APP_LABELS.terminal,
    };
  }

  if (!flags.connect_black07) {
    const cmd = getSuggestedCommand(mission, flags) ?? 'connect black-07';
    return {
      id: 'm2-connect',
      message: level >= 1 ? 'Certaines connexions ne doivent pas être tracées.' : 'Relais localisé. Établissez la connexion.',
      target: 'black-07',
      protocol: 'CONNECT',
      revealCommand: reveal,
      command: reveal ? cmd : undefined,
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

export { getCurrentStep, getNextStepText };
