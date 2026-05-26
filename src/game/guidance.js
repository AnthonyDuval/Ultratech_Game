/**
 * Guidage contextuel — messages distincts selon l'état UI du joueur
 */

import { getMissionById, getSuggestedCommand } from '../data/missions.js';
import { isMailUnlocked } from '../data/mails.js';
import {
  isGhostSignalDone,
  isBlackRelayDone,
  hasAnonScanHelp,
  shouldRevealScanCommand,
} from './missionGuards.js';

const APP_LABELS = {
  mail: 'Mails',
  missions: 'Opérations',
  terminal: 'Terminal',
};

export function getCurrentGuidance(state, ui = {}) {
  if (state.guidanceDisabled || !state.tutorialCompleted) return null;

  const completed = state.completedMissions ?? [];
  if (isBlackRelayDone(completed)) return null;

  const openApps = ui.openApps ?? [];
  const selectedMailId = ui.selectedMailId ?? null;
  const has = (app) => openApps.includes(app);
  const read = state.readMails ?? [];
  const discovered = state.discoveredMissions ?? [];
  const flags = state.narrativeFlags ?? {};

  if (!read.includes('mail-welcome')) {
    if (!has('mail')) return g('welcome-open-mail', 'Ouvrez la messagerie.', 'mail');
    if (selectedMailId !== 'mail-welcome') return gPlain('welcome-select', 'Sélectionnez le message de bienvenue.');
    return gPlain('welcome-read', 'Lisez le briefing pour débloquer la suite.');
  }

  if (!read.includes('mail-ghost-brief')) {
    if (!has('mail')) return g('ghost-open-mail', 'Un brief « Signal fantôme » vous attend.', 'mail');
    if (isMailUnlocked('mail-ghost-brief', state.unlockedMails ?? []) && selectedMailId !== 'mail-ghost-brief') {
      return gPlain('ghost-select', 'Sélectionnez « Signal fantôme détecté ».');
    }
    return gPlain('ghost-read', 'Lisez le brief — cible 0x7f, protocole SCAN.');
  }

  // ── Mission 1 terminée → jamais de hints scan/connect 0x7f ──
  if (isGhostSignalDone(completed)) {
    return guidanceAfterGhostSignal(state, ui);
  }

  if (discovered.includes('ghost-signal')) {
    return guidanceMission1(state, flags, has, openApps);
  }

  return null;
}

function guidanceAfterGhostSignal(state, ui) {
  const read = state.readMails ?? [];
  const completed = state.completedMissions ?? [];
  const discovered = state.discoveredMissions ?? [];
  const has = (app) => (ui.openApps ?? []).includes(app);
  const selectedMailId = ui.selectedMailId ?? null;

  if (!read.includes('mail-relay-hint')) {
    if (!has('mail')) {
      return g('relay-open', 'Consultez vos nouveaux messages.', 'mail');
    }
    if (selectedMailId !== 'mail-relay-hint') {
      return gPlain('relay-select', 'Lisez le fragment Black-07 dans Mails.');
    }
    return gPlain('relay-read', 'Lisez le fragment — cible black-07.');
  }

  if (isBlackRelayDone(completed)) {
    return null;
  }

  if (discovered.includes('black-relay')) {
    return guidanceMission2(state.narrativeFlags ?? {}, has, completed);
  }

  return gPlain('post-ghost', 'Consultez vos nouveaux messages.');
}

function guidanceMission1(state, flags, has, openApps) {
  if (isGhostSignalDone(state.completedMissions)) return null;
  if (flags.scan_0x7f && flags.connect_0x7f) return null;

  const mission = getMissionById('ghost-signal');

  if (!flags.scan_0x7f) {
    if (hasAnonScanHelp(state)) {
      return {
        id: 'm1-anon-direct',
        label: 'Prochaine action',
        text: 'Un contact anonyme vous a donné une commande directe.',
        target: '0x7f',
        protocol: 'SCAN',
        revealCommand: true,
        command: 'scan 0x7f',
        action: 'terminal',
        actionLabel: APP_LABELS.terminal,
      };
    }

    if (!shouldRevealScanCommand(state, openApps)) {
      return {
        id: 'm1-learn-rp',
        label: 'Prochaine action',
        text: 'Le brief indique cible 0x7f et protocole SCAN. Composez la commande dans le Terminal.',
        target: '0x7f',
        protocol: 'SCAN',
        secondaryActions: [
          { app: 'missions', label: 'Opérations' },
          { app: 'terminal', label: 'Terminal' },
        ],
      };
    }

    if (!has('terminal')) {
      return {
        id: 'm1-open-term',
        label: 'Prochaine action',
        text: 'Ouvrez le Terminal. Le protocole SCAN accepte la forme : scan <cible>',
        target: '0x7f',
        protocol: 'SCAN',
        revealCommand: true,
        command: 'scan 0x7f',
        action: 'terminal',
        actionLabel: APP_LABELS.terminal,
      };
    }

    return {
      id: 'm1-scan',
      label: 'Prochaine action',
      text: 'Exécutez le scan sur la cible 0x7f.',
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
      label: 'Prochaine action',
      text: 'Analyse terminée. Nouvelle étape : connect 0x7f',
      target: '0x7f',
      protocol: 'CONNECT',
      revealCommand: true,
      command: cmd,
      action: has('terminal') ? undefined : 'terminal',
      actionLabel: has('terminal') ? undefined : APP_LABELS.terminal,
    };
  }

  return null;
}

function guidanceMission2(flags, has, completed) {
  if (isBlackRelayDone(completed)) return null;
  const mission = getMissionById('black-relay');

  if (!flags.scan_black07) {
    if (!has('missions') && !has('terminal')) {
      return {
        id: 'm2-post-mail',
        label: 'Prochaine action',
        text: 'Cible black-07 repérée. Consultez Opérations ou le Terminal.',
        target: 'black-07',
        protocol: 'SCAN',
        secondaryActions: [
          { app: 'missions', label: 'Opérations' },
          { app: 'terminal', label: 'Terminal' },
        ],
      };
    }
    return {
      id: 'm2-scan',
      label: 'Prochaine action',
      text: 'Scannez le relais black-07.',
      target: 'black-07',
      protocol: 'SCAN',
      revealCommand: true,
      command: 'scan black-07',
      action: has('terminal') ? undefined : 'terminal',
      actionLabel: has('terminal') ? undefined : APP_LABELS.terminal,
    };
  }

  if (!flags.connect_black07) {
    const cmd = getSuggestedCommand(mission, flags) ?? 'connect black-07';
    return {
      id: 'm2-connect',
      label: 'Prochaine action',
      text: 'Relais localisé. Établissez la connexion.',
      target: 'black-07',
      protocol: 'CONNECT',
      revealCommand: true,
      command: cmd,
      action: has('terminal') ? undefined : 'terminal',
      actionLabel: has('terminal') ? undefined : APP_LABELS.terminal,
    };
  }

  return null;
}

function g(id, text, app) {
  return { id, label: 'Prochaine action', text, action: app, actionLabel: APP_LABELS[app] };
}

function gPlain(id, text) {
  return { id, label: 'Prochaine action', text };
}
